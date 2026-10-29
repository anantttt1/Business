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

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
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
      status.textContent = 'Payment confirmed — unlocking your portfolio ZIP…';
      if (onApproved) {
        try {
          onApproved(order, downloadToken || '');
        } catch (e) {
          status.className = 'ap-pay-status err';
          status.textContent = e.message || 'ZIP export failed after confirmation';
          unlocked = false;
          return;
        }
        setTimeout(close, 900);
      } else if (downloadToken) {
        window.location.href = '/api/download?token=' + encodeURIComponent(downloadToken);
      }
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
        setStatus('ok', 'Payment confirmed — unlocking ZIP…');
        finishApproved(s, s.downloadToken || '');
        return;
      }
      if (st === 'REJECTED') {
        stopPolling();
        var reason = (s.decision && s.decision.reason) || 'Payment was not confirmed';
        setStatus('err', 'Rejected: ' + reason + '. Close and start a new order if needed.');
        return;
      }
      if (st === 'EXPIRED') {
        stopPolling();
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
          'Verifying payment… Keep this window open. ZIP unlocks only after the transaction is confirmed.'
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
          'Submit UTR + screenshot. Unlock happens only after the payment is confirmed.',
          'No codes to copy or paste. Screenshot alone is not bank proof.'
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
            'Never share UPI PIN or OTP. Screenshot is supporting evidence only — not automatic bank proof.'
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
        live.textContent = 'Status updates every few seconds after you submit.';
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
              setStatus(
                'ok',
                j.message ||
                  'Evidence received. Confirming payment against trusted records… Keep this window open.'
              );
              live.textContent = 'Waiting for trusted payment confirmation…';
              submit.disabled = true;
              utrInput.disabled = true;
              fileInput.disabled = true;
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

  window.PB_openPayment = openPaymentModal;
})();
