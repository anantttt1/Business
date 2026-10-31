(function () {
  'use strict';

  var PRICES = {
    'color-pop': { name: 'Color Pop', priceInr: 19 },
    'ideas-impact': { name: 'Ideas Impact', priceInr: 29 },
    'paper-atelier': { name: 'Paper Atelier', priceInr: 29 },
    'ember-editorial': { name: 'Ember Editorial', priceInr: 39 },
    'signature-orange': { name: 'Signature Orange', priceInr: 39 },
    'modern-dark-3d': { name: 'Modern Dark 3D', priceInr: 29 },
    'student-bold': { name: 'Student Bold', priceInr: 19 },
    'student-elegant': { name: 'Student Elegant', priceInr: 19 },
    'student-modern': { name: 'Student Modern', priceInr: 19 },
    'student-portfolio': { name: 'Student Portfolio', priceInr: 19 }
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
      var prev = readLock(templateId) || {};
      sessionStorage.setItem(
        lockKey(templateId),
        JSON.stringify({
          orderId: data.orderId || prev.orderId || '',
          downloadToken: data.downloadToken || prev.downloadToken || '',
          claimSecret: data.claimSecret || prev.claimSecret || '',
          orderToken: data.orderToken || prev.orderToken || '',
          downloaded: data.downloaded != null ? !!data.downloaded : !!prev.downloaded,
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
    var ok = false;
    try {
      var a = document.createElement('a');
      a.href = url;
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try {
          a.remove();
        } catch (e) {}
      }, 2000);
      ok = true;
    } catch (e1) {}
    try {
      var iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;border:0';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(function () {
        try {
          iframe.remove();
        } catch (e) {}
      }, 60000);
      ok = true;
    } catch (e2) {}
    if (!ok) {
      window.location.href = url;
      ok = true;
    }
    return ok;
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

  function fetchOrderStatus(lock) {
    var url =
      '/api/orders/status?orderId=' +
      encodeURIComponent(lock.orderId || '') +
      '&claim=' +
      encodeURIComponent(lock.claimSecret || '') +
      '&orderToken=' +
      encodeURIComponent(lock.orderToken || '') +
      '&_=' +
      Date.now();
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      return r.json();
    });
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
    if (existing && !existing.downloaded) {
      showResumeOrWaitModal(templateId, meta, existing, onApproved);
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
        orderToken: currentToken || (order && order.orderToken) || '',
        downloaded: false
      });

      if (downloadToken) {
        triggerZipDownload(downloadToken);
        markDownloaded(templateId);
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
      } else if (!downloadToken) {
        status.className = 'ap-pay-status err';
        status.textContent = 'Verified but download token missing — retrying…';
        unlocked = false;
        startPolling();
        return;
      }

      setTimeout(close, 1500);
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
      pollTimer = setInterval(pollOnce, 1500);
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
          'Submit. After verification the ZIP downloads automatically.',
          'Do not pay again for this template until the ZIP has downloaded.'
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
        live.textContent = 'After verify, ZIP downloads automatically.';
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
              writeLock(templateId, {
                orderId: orderId,
                claimSecret: claimSecret,
                orderToken: currentToken,
                downloadToken: j.downloadToken || '',
                downloaded: false
              });
              submit.disabled = true;
              utrInput.disabled = true;
              fileInput.disabled = true;

              var st = String(j.status || '').toUpperCase();
              if (
                j.downloadToken ||
                j.autoUnlockReady ||
                st === 'APPROVED' ||
                st === 'PAYMENT_CONFIRMED'
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

  function showResumeOrWaitModal(templateId, meta, lock, onApproved) {
    var overlay = el('div', 'ap-pay-overlay');
    var modal = el('div', 'ap-pay-modal');
    modal.appendChild(el('h2', null, 'Checking your payment'));
    modal.appendChild(
      el('p', 'sub', meta.name + ' — do not pay again. Fetching status…')
    );
    var status = el('div', 'ap-pay-status', 'Checking order ' + String(lock.orderId || '').slice(0, 12) + '…');
    modal.appendChild(status);
    var row = el('div', 'ap-pay-actions');
    var dl = el('button', 'ap-pay-btn primary', 'Download ZIP');
    dl.type = 'button';
    dl.hidden = true;
    var closeBtn = el('button', 'ap-pay-btn ghost', 'Close');
    closeBtn.type = 'button';
    var reset = el('button', 'ap-pay-btn ghost', 'Start over');
    reset.type = 'button';
    row.appendChild(dl);
    row.appendChild(closeBtn);
    row.appendChild(reset);
    modal.appendChild(row);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var stopped = false;
    var timer = null;

    function stop() {
      stopped = true;
      if (timer) clearInterval(timer);
    }

    closeBtn.addEventListener('click', function () {
      stop();
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        stop();
        overlay.remove();
      }
    });
    reset.addEventListener('click', function () {
      stop();
      clearLock(templateId);
      overlay.remove();
      openPaymentModal(templateId, { onApproved: onApproved });
    });

    function tryDownload(token) {
      if (!token) return;
      writeLock(templateId, {
        orderId: lock.orderId,
        claimSecret: lock.claimSecret,
        orderToken: lock.orderToken,
        downloadToken: token,
        downloaded: false
      });
      triggerZipDownload(token);
      markDownloaded(templateId);
      status.className = 'ap-pay-status ok';
      status.textContent = 'Payment verified — ZIP download started.';
      dl.hidden = false;
      if (onApproved) {
        try {
          onApproved({ orderId: lock.orderId }, token);
        } catch (e) {}
      }
      stop();
      setTimeout(function () {
        overlay.remove();
      }, 2000);
    }

    dl.addEventListener('click', function () {
      var t = (readLock(templateId) || lock).downloadToken || lock.downloadToken;
      if (t) tryDownload(t);
    });

    if (lock.downloadToken) {
      tryDownload(lock.downloadToken);
      return;
    }

    function poll() {
      if (stopped) return;
      fetchOrderStatus(lock)
        .then(function (s) {
          if (!s || s.error) {
            status.textContent = s && s.error ? s.error : 'Could not reach server — retrying…';
            return;
          }
          if (s.orderToken) {
            lock.orderToken = s.orderToken;
            writeLock(templateId, {
              orderId: lock.orderId,
              claimSecret: lock.claimSecret,
              orderToken: s.orderToken,
              downloadToken: s.downloadToken || lock.downloadToken || '',
              downloaded: false
            });
          }
          var st = String(s.status || '').toUpperCase();
          if ((st === 'APPROVED' || st === 'PAYMENT_CONFIRMED') && s.downloadToken) {
            tryDownload(s.downloadToken);
            return;
          }
          if (st === 'APPROVED' || st === 'PAYMENT_CONFIRMED') {
            status.className = 'ap-pay-status ok';
            status.textContent = 'Verified — waiting for download token…';
            return;
          }
          if (st === 'REJECTED' || st === 'EXPIRED') {
            stop();
            clearLock(templateId);
            status.className = 'ap-pay-status err';
            status.textContent = 'Order ' + st.toLowerCase() + '. You can Start over.';
            return;
          }
          status.textContent =
            'Status: ' + (st || 'pending') + ' — ZIP will download automatically when verified.';
        })
        .catch(function () {
          status.textContent = 'Network error — retrying…';
        });
    }

    poll();
    timer = setInterval(poll, 1500);
  }

  window.PB_openPayment = openPaymentModal;
})();
