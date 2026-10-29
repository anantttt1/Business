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

  window.PB_TEMPLATE_PRICES = PRICES;

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

    function close() {
      overlay.remove();
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    var unlocked = false;

    function finishApproved(order, downloadToken) {
      if (unlocked) return;
      unlocked = true;
      status.className = 'ap-pay-status ok';
      status.textContent = 'Payment verified — generating your portfolio ZIP…';
      if (onApproved) {
        try {
          onApproved(order, downloadToken || '');
        } catch (e) {
          status.className = 'ap-pay-status err';
          status.textContent = e.message || 'ZIP export failed after approval';
          unlocked = false;
          return;
        }
        setTimeout(close, 800);
      } else if (downloadToken) {
        window.location.href = '/api/download?token=' + encodeURIComponent(downloadToken);
      }
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
        status.textContent = '';
        status.className = 'ap-pay-status';
        body.hidden = false;

        if (Number(order.amountInr) !== meta.priceInr) {
          status.className = 'ap-pay-status err';
          status.textContent = 'Price mismatch — please refresh.';
          return;
        }

        var currentToken = order.orderToken || '';

        var row = el('div', 'ap-pay-row');
        var left = el('div');
        var price = el('div', 'ap-pay-price', '₹' + order.amountInr);
        price.appendChild(el('span', 'ap-pay-badge', 'INR'));
        left.appendChild(price);
        left.appendChild(el('p', 'sub', 'Order ' + order.orderId));

        var qrWrap = el('div', 'ap-pay-qr');
        renderQr(qrWrap, order.upiUri);
        row.appendChild(left);
        row.appendChild(qrWrap);
        body.appendChild(row);

        body.appendChild(el('p', 'sub', 'UPI ID'));
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
          'Upload payment screenshot + enter UTR, then Submit for verification.',
          'Share your Order token with AP Creative Studio for approval.',
          'After approval, paste the approved token below (or wait if auto-detected) to unlock ZIP.'
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
            'Never share UPI PIN / OTP. Screenshot is only for review — not automatic bank proof.'
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
            status.className = 'ap-pay-status err';
            status.textContent = 'Image must be under 4 MB';
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

        var tokenBox = el('div', 'ap-pay-field');
        tokenBox.appendChild(el('label', null, 'Your order token (send this to admin)'));
        var tokenInput = document.createElement('textarea');
        tokenInput.rows = 3;
        tokenInput.readOnly = true;
        tokenInput.value = currentToken;
        tokenInput.style.cssText =
          'width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #2a3550;background:#121826;color:#9aa3bd;padding:8px;font-size:11px';
        tokenBox.appendChild(tokenInput);
        var copyTok = el('button', 'ap-pay-btn ghost', 'Copy order token');
        copyTok.type = 'button';
        copyTok.style.marginTop = '6px';
        copyTok.addEventListener('click', function () {
          navigator.clipboard.writeText(currentToken).then(
            function () {
              copyTok.textContent = 'Copied';
              setTimeout(function () {
                copyTok.textContent = 'Copy order token';
              }, 1500);
            },
            function () {
              prompt('Copy token', currentToken);
            }
          );
        });
        tokenBox.appendChild(copyTok);
        body.appendChild(tokenBox);

        // Unlock section (after admin approves)
        var unlockBox = el('div', 'ap-pay-field');
        unlockBox.appendChild(
          el('label', null, 'After admin approves — paste APPROVED order token here')
        );
        var approvedInput = document.createElement('textarea');
        approvedInput.rows = 3;
        approvedInput.placeholder = 'Paste approved token from AP Creative Studio';
        approvedInput.style.cssText =
          'width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #2a3550;background:#121826;color:#eef1ff;padding:8px;font-size:11px';
        unlockBox.appendChild(approvedInput);
        var unlockBtn = el('button', 'ap-pay-btn primary', 'Verify & unlock ZIP');
        unlockBtn.type = 'button';
        unlockBtn.style.marginTop = '8px';
        unlockBox.appendChild(unlockBtn);
        body.appendChild(unlockBox);

        function checkToken(token) {
          return fetch(
            '/api/orders/status?orderId=' +
              encodeURIComponent(order.orderId) +
              '&claim=' +
              encodeURIComponent(order.claimSecret || '') +
              '&orderToken=' +
              encodeURIComponent(token || '')
          ).then(function (r) {
            return r.json();
          });
        }

        function handleStatus(s) {
          if (s.orderToken) {
            currentToken = s.orderToken;
            tokenInput.value = currentToken;
          }
          if (s.status === 'APPROVED') {
            finishApproved(order, s.downloadToken || '');
            return true;
          }
          if (s.status === 'REJECTED') {
            status.className = 'ap-pay-status err';
            status.textContent =
              'Rejected' +
              (s.decision && s.decision.reason ? ': ' + s.decision.reason : '');
            return true;
          }
          status.textContent =
            'Status: ' + s.status + (s.riskLevel ? ' · risk ' + s.riskLevel : '');
          return false;
        }

        unlockBtn.addEventListener('click', function () {
          var tok = (approvedInput.value || currentToken || '').trim();
          if (!tok) {
            status.className = 'ap-pay-status err';
            status.textContent = 'Paste the approved order token first';
            return;
          }
          status.textContent = 'Verifying approval…';
          unlockBtn.disabled = true;
          checkToken(tok)
            .then(function (s) {
              if (s.error) throw new Error(s.error);
              if (s.status !== 'APPROVED') {
                throw new Error(
                  'Not approved yet (status: ' + (s.status || 'unknown') + '). Wait for admin or paste the approved token.'
                );
              }
              currentToken = s.orderToken || tok;
              handleStatus(s);
            })
            .catch(function (err) {
              status.className = 'ap-pay-status err';
              status.textContent = err.message || 'Verification failed';
            })
            .finally(function () {
              unlockBtn.disabled = false;
            });
        });

        var pollTimer = null;
        function pollStatus() {
          checkToken(currentToken)
            .then(function (s) {
              if (s.error) return;
              handleStatus(s);
            })
            .catch(function () {});
        }

        submit.addEventListener('click', function () {
          status.className = 'ap-pay-status';
          status.textContent = 'Submitting evidence for verification…';
          submit.disabled = true;
          fetch('/api/orders/submit-evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId,
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
              if (j.orderToken) {
                currentToken = j.orderToken;
                tokenInput.value = currentToken;
              }
              status.className = 'ap-pay-status ok';
              status.textContent =
                'Verification submitted (' +
                j.status +
                ', risk ' +
                j.riskLevel +
                '). Copy order token → send to admin. After approval paste approved token and click Unlock.';
              submit.disabled = true;
              if (!pollTimer) pollTimer = setInterval(pollStatus, 10000);
            })
            .catch(function (err) {
              status.className = 'ap-pay-status err';
              status.textContent = err.message || 'Submit failed';
              submit.disabled = false;
            });
        });
      })
      .catch(function (err) {
        status.className = 'ap-pay-status err';
        status.textContent = err.message || 'Could not create order';
      });
  }

  window.PB_openPayment = openPaymentModal;
})();
