(function () {
  'use strict';

  var PRICES = {
    'color-pop': { name: 'Color Pop', priceInr: 19 },
    'ideas-impact': { name: 'Ideas Impact', priceInr: 29 },
    'paper-atelier': { name: 'Paper Atelier', priceInr: 29 },
    'ember-editorial': { name: 'Ember Editorial', priceInr: 39 },
    'signature-orange': { name: 'Signature Orange', priceInr: 39 },
    'modern-dark-3d': { name: 'Modern Dark 3D', priceInr: 29 }
  };

  var LOCK_PREFIX = 'pb_pay_lock_';
  var LOCK_TTL_MS = 1000 * 60 * 60 * 48;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function lockKey(templateId) {
    return LOCK_PREFIX + templateId;
  }

  function readLock(templateId) {
    try {
      var raw = sessionStorage.getItem(lockKey(templateId));
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.at || Date.now() - o.at > LOCK_TTL_MS) {
        sessionStorage.removeItem(lockKey(templateId));
        return null;
      }
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeLock(templateId, data) {
    try {
      sessionStorage.setItem(
        lockKey(templateId),
        JSON.stringify({
          orderId: data.orderId || '',
          downloadToken: data.downloadToken || '',
          claimSecret: data.claimSecret || '',
          orderToken: data.orderToken || '',
          downloaded: !!data.downloaded,
          at: Date.now()
        })
      );
    } catch (e) {}
  }

  function clearLock(templateId) {
    try {
      sessionStorage.removeItem(lockKey(templateId));
    } catch (e) {}
  }

  function markDownloaded(templateId) {
    var lock = readLock(templateId);
    if (lock) {
      lock.downloaded = true;
      writeLock(templateId, lock);
    }
  }

  function triggerZipDownload(downloadToken) {
    if (!downloadToken) return false;
    var url = '/api/download?token=' + encodeURIComponent(downloadToken);
    try {
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(function () {
        try {
          iframe.remove();
        } catch (e) {}
      }, 60000);
    } catch (e) {
      window.location.href = url;
    }
    return true;
  }

  function renderQr(container, upiUri) {
    container.textContent = '';
    var img = document.createElement('img');
    img.alt = 'UPI payment QR code';
    img.width = 180;
    img.height = 180;
    img.style.display = 'block';
    img.src = '/api/qr?data=' + encodeURIComponent(upiUri);
    img.onerror = function () {
      container.textContent = '';
      var a = el('a', null, 'Open UPI payment link');
      a.href = upiUri;
      a.rel = 'noopener';
      container.appendChild(a);
    };
    container.appendChild(img);
  }

  function openPaymentModal(templateId, options) {
    options = options || {};
    var onApproved = typeof options.onApproved === 'function' ? options.onApproved : null;

    var meta = PRICES[templateId];
    if (!meta) {
      alert('Unknown template');
      return;
    }

    var existing = readLock(templateId);
    if (existing && !existing.downloaded && existing.downloadToken) {
      showResumeDownloadModal(templateId, meta, existing, onApproved);
      return;
    }
    if (existing && !existing.downloaded && existing.orderId) {
      showLockedModal(templateId, meta, existing);
      return;
    }

    var overlay = el('div', 'ap-pay-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var modal = el('div', 'ap-pay-modal');

    modal.appendChild(el('h2', null, 'Pay to download ZIP'));
    modal.appendChild(el('p', 'sub', meta.name + ' · Exact amount ₹' + meta.priceInr));

    var status = el('div', 'ap-pay-status', 'Creating order…');
    modal.appendChild(status);

    var body = el('div');
    body.hidden = true;
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var pollTimer = null;
    var pollInFlight = false;
    var stopped = false;
    var unlocked = false;
    var currentToken = '';
    var claimSecret = '';
    var orderId = '';

    function stopPolling() {
      stopped = true;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    function close() {
      stopPolling();
      overlay.remove();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    function finishApproved(order, downloadToken) {
      if (unlocked) return;
      unlocked = true;
      stopPolling();
      status.className = 'ap-pay-status ok';
      status.textContent = 'Payment verified — downloading ZIP now…';

      writeLock(templateId, {
        orderId: (order && (order.orderId || order.id)) || orderId,
        downloadToken: downloadToken || '',
        claimSecret: claimSecret,
        orderToken: currentToken,
        downloaded: false
      });

      var started = false;
      if (downloadToken) {
        started = triggerZipDownload(downloadToken);
        if (started) markDownloaded(templateId);
      }

      if (onApproved) {
        try {
          onApproved(order, downloadToken || '');
          markDownloaded(templateId);
        } catch (e) {
          status.className = 'ap-pay-status err';
          status.textContent = e.message || 'ZIP export failed after confirmation';
          unlocked = false;
          return;
        }
      } else if (!started && downloadToken) {
        window.location.href = '/api/download?token=' + encodeURIComponent(downloadToken);
        markDownloaded(templateId);
      } else if (!downloadToken && !onApproved) {
        status.className = 'ap-pay-status err';
        status.textContent = 'Verified but download token missing. Keep this tab open and retry in a moment.';
        unlocked = false;
        startPolling();
        return;
      }

      setTimeout(close, 1200);
    }

    function setStatus(kind, text) {
      status.className = 'ap-pay-status' + (kind ? ' ' + kind : '');
      status.textContent = text;
    }

    function handleStatus(s) {
      if (!s || s.error) return;
      if (s.orderToken) currentToken = s.orderToken;

      var st = String(s.status || '').toUpperCase();
      if (st === 'APPROVED' || st === 'PAYMENT_CONFIRMED') {
        setStatus('ok', 'Payment verified — downloading ZIP now…');
        finishApproved(s, s.downloadToken || '');
        return;
      }
      if (st === 'REJECTED') {
        stopPolling();
        clearLock(templateId);
        var reason = (s.decision && s.decision.reason) || 'Payment was not confirmed';
        setStatus('err', 'Rejected: ' + reason + '. Close and start a new order if needed.');
        return;
      }
      if (st === 'EXPIRED') {
        stopPolling();
        clearLock(templateId);
        setStatus('err', 'This order expired. Close and start a new payment.');
        return;
      }
      if (
        st === 'PENDING_REVIEW' ||
        st === 'EVIDENCE_SUBMITTED' ||
        st === 'VERIFYING' ||
        st === 'AWAITING_PAYMENT'
      ) {
        setStatus(
          '',
          'Verifying payment… Keep this window open. ZIP downloads automatically when verified.'
        );
        return;
      }
      if (st === 'CREATED') {
        setStatus('', 'Waiting for payment evidence — pay via UPI, then submit screenshot + UTR.');
      }
    }

    function pollOnce() {
      if (stopped || pollInFlight || unlocked || !orderId) return;
      pollInFlight = true;
      var url =
        '/api/orders/status?orderId=' +
        encodeURIComponent(orderId) +
        '&claim=' +
        encodeURIComponent(claimSecret || '') +
        '&orderToken=' +
        encodeURIComponent(currentToken || '') +
        '&_=' +
        Date.now();
      fetch(url, { cache: 'no-store' })
        .then(function (r) {
          return r.json();
        })
        .then(function (s) {
          if (s && !s.error) handleStatus(s);
        })
        .catch(function () {})
        .finally(function () {
          pollInFlight = false;
        });
    }

    function startPolling() {
      if (pollTimer || stopped) return;
      pollOnce();
      pollTimer = setInterval(pollOnce, 2000);
    }

    fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: templateId })
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || 'Order failed');
          return j;
        });
      })
      .then(function (order) {
        if (Number(order.amountInr) !== meta.priceInr) {
          throw new Error('Price mismatch — refresh and try again');
        }

        currentToken = order.orderToken || '';
        claimSecret = order.claimSecret || '';
        orderId = order.orderId || order.id || '';

        writeLock(templateId, {
          orderId: orderId,
          claimSecret: claimSecret,
          orderToken: currentToken,
          downloaded: false
        });

        body.hidden = false;
        setStatus('', 'Waiting for payment evidence.');

        var left = el('div', 'ap-pay-left');
        left.appendChild(el('div', 'ap-pay-price', '₹' + order.amountInr));
        left.appendChild(el('p', 'sub', meta.name));
        left.appendChild(el('p', 'sub', 'Order ref · ' + String(orderId).slice(0, 10)));
        body.appendChild(left);

        var qrWrap = el('div', 'ap-pay-qr');
        renderQr(qrWrap, order.upiUri);
        body.appendChild(qrWrap);

        body.appendChild(el('div', 'ap-pay-upi', order.upiId));

        var actions = el('div', 'ap-pay-actions');
        var copyBtn = el('button', 'ap-pay-btn ghost', 'Copy UPI ID');
        copyBtn.type = 'button';
        copyBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(order.upiId).then(
            function () {
              copyBtn.textContent = 'Copied';
              setTimeout(function () {
                copyBtn.textContent = 'Copy UPI ID';
              }, 1500);
            },
            function () {
              prompt('Copy UPI ID', order.upiId);
            }
          );
        });
        var payLink = el('a', 'ap-pay-btn primary', 'Open UPI app');
        payLink.href = order.upiUri;
        actions.appendChild(copyBtn);
        actions.appendChild(payLink);
        body.appendChild(actions);

        var steps = document.createElement('ol');
        steps.className = 'ap-pay-steps';
        [
          'Scan the QR (or Open UPI app) and pay exactly ₹' + order.amountInr + '.',
          'Upload the payment screenshot and enter the UTR / UPI reference.',
          'Submit. After verification the ZIP downloads automatically — do not pay again for this template until then.',
          'Screenshot screening is not bank proof.'
        ].forEach(function (t) {
          var li = document.createElement('li');
          li.textContent = t;
          steps.appendChild(li);
        });
        body.appendChild(steps);

        body.appendChild(
          el(
            'div',
            'ap-pay-warn',
            'Never share UPI PIN or OTP. Do not pay again for this template until the ZIP has downloaded.'
          )
        );

        var fUtr = el('div', 'ap-pay-field');
        fUtr.appendChild(el('label', null, 'UTR / transaction reference'));
        var utrInput = document.createElement('input');
        utrInput.type = 'text';
        utrInput.autocomplete = 'off';
        utrInput.placeholder = '8–22 letters or digits';
        fUtr.appendChild(utrInput);
        body.appendChild(fUtr);

        var fFile = el('div', 'ap-pay-field');
        fFile.appendChild(el('label', null, 'Payment screenshot (JPG/PNG/WebP, max 4MB)'));
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/png,image/webp';
        var preview = document.createElement('img');
        preview.className = 'ap-pay-preview';
        preview.hidden = true;
        fFile.appendChild(fileInput);
        fFile.appendChild(preview);
        body.appendChild(fFile);

        var fileDataUrl = '';
        fileInput.addEventListener('change', function () {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          if (file.size > 4 * 1024 * 1024) {
            setStatus('err', 'Image must be under 4 MB');
            fileInput.value = '';
            return;
          }
          var reader = new FileReader();
          reader.onload = function () {
            fileDataUrl = String(reader.result || '');
            preview.src = fileDataUrl;
            preview.hidden = false;
          };
          reader.readAsDataURL(file);
        });

        var submitRow = el('div', 'ap-pay-actions');
        var submit = el('button', 'ap-pay-btn primary', 'Submit for verification');
        submit.type = 'button';
        var cancel = el('button', 'ap-pay-btn ghost', 'Cancel');
        cancel.type = 'button';
        cancel.addEventListener('click', close);
        submitRow.appendChild(submit);
        submitRow.appendChild(cancel);
        body.appendChild(submitRow);

        var live = el('div', 'ap-pay-live');
        live.setAttribute('aria-live', 'polite');
        live.textContent = 'After verify, ZIP downloads automatically. Do not pay again for this template until then.';
        body.appendChild(live);

        submit.addEventListener('click', function () {
          setStatus('', 'Submitting evidence…');
          submit.disabled = true;
          fetch('/api/orders/submit-evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderId,
              orderToken: currentToken,
              utr: utrInput.value.trim(),
              screenshotDataUrl: fileDataUrl,
              filename: (fileInput.files[0] && fileInput.files[0].name) || 'screenshot.jpg'
            })
          })
            .then(function (r) {
              return r.json().then(function (j) {
                if (!r.ok) throw new Error(j.error || 'Submit failed');
                return j;
              });
            })
            .then(function (j) {
              if (j.orderToken) currentToken = j.orderToken;
              submit.disabled = true;
              utrInput.disabled = true;
              fileInput.disabled = true;
              if (
                j.autoUnlockReady &&
                (j.downloadToken || j.status === 'APPROVED' || j.status === 'PAYMENT_CONFIRMED')
              ) {
                setStatus('ok', j.message || 'Verified — downloading ZIP now…');
                finishApproved(j, j.downloadToken || '');
                return;
              }
              setStatus(
                'ok',
                j.message || 'Evidence received. Verifying… ZIP will download automatically when approved.'
              );
              live.textContent = 'Do not pay again. Waiting for verification…';
              startPolling();
            })
            .catch(function (err) {
              setStatus('err', err.message || 'Submit failed');
              submit.disabled = false;
            });
        });
      })
      .catch(function (err) {
        setStatus('err', err.message || 'Could not create order');
      });
  }

  function showResumeDownloadModal(templateId, meta, lock, onApproved) {
    var overlay = el('div', 'ap-pay-overlay');
    var modal = el('div', 'ap-pay-modal');
    modal.appendChild(el('h2', null, 'Download ready'));
    modal.appendChild(
      el('p', 'sub', meta.name + ' — payment already verified. Do not pay again.')
    );
    var status = el('div', 'ap-pay-status ok', 'Your ZIP is ready.');
    modal.appendChild(status);
    var row = el('div', 'ap-pay-actions');
    var dl = el('button', 'ap-pay-btn primary', 'Download ZIP now');
    dl.type = 'button';
    dl.addEventListener('click', function () {
      if (lock.downloadToken) {
        triggerZipDownload(lock.downloadToken);
        markDownloaded(templateId);
        status.textContent = 'Download started…';
      }
      if (onApproved) {
        try {
          onApproved({ orderId: lock.orderId }, lock.downloadToken || '');
          markDownloaded(templateId);
        } catch (e) {
          status.className = 'ap-pay-status err';
          status.textContent = e.message || 'Export failed';
        }
      }
    });
    var cancel = el('button', 'ap-pay-btn ghost', 'Close');
    cancel.type = 'button';
    cancel.addEventListener('click', function () {
      overlay.remove();
    });
    row.appendChild(dl);
    row.appendChild(cancel);
    modal.appendChild(row);
    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function showLockedModal(templateId, meta, lock) {
    var overlay = el('div', 'ap-pay-overlay');
    var modal = el('div', 'ap-pay-modal');
    modal.appendChild(el('h2', null, 'Payment in progress'));
    modal.appendChild(
      el(
        'p',
        'sub',
        meta.name +
          ' — an order is already open for this template. Do not pay again until the ZIP downloads.'
      )
    );
    var status = el(
      'div',
      'ap-pay-status',
      'Order ' + String(lock.orderId || '').slice(0, 12) + '… — wait for verification or finish the previous payment tab.'
    );
    modal.appendChild(status);
    var row = el('div', 'ap-pay-actions');
    var closeBtn = el('button', 'ap-pay-btn primary', 'OK');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', function () {
      overlay.remove();
    });
    var reset = el('button', 'ap-pay-btn ghost', 'Start over');
    reset.type = 'button';
    reset.addEventListener('click', function () {
      clearLock(templateId);
      overlay.remove();
      openPaymentModal(templateId, {});
    });
    row.appendChild(closeBtn);
    row.appendChild(reset);
    modal.appendChild(row);
    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  window.PB_openPayment = openPaymentModal;
})();
