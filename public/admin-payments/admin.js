(function () {
  'use strict';
  var secretInput = document.getElementById('secret');
  var rows = document.getElementById('rows');
  var panel = document.getElementById('panel');
  var loginStatus = document.getElementById('login-status');
  var tokenStatus = document.getElementById('token-status');

  function secret() {
    return (secretInput && secretInput.value) || sessionStorage.getItem('ap_admin_secret') || '';
  }

  function load() {
    var s = secret();
    if (!s) {
      loginStatus.textContent = 'Enter ADMIN_SECRET (set in Vercel env, min 12 chars)';
      loginStatus.className = 'ap-pay-status err';
      return;
    }
    sessionStorage.setItem('ap_admin_secret', s);
    loginStatus.textContent = 'Loading…';
    fetch('/api/admin/orders', { headers: { 'x-admin-secret': s } })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || 'Unauthorized');
          return j;
        });
      })
      .then(function (data) {
        loginStatus.textContent =
          (data.orders || []).length === 0
            ? 'No stored orders (normal without Upstash). Use token paste below.'
            : '';
        panel.hidden = false;
        rows.textContent = '';
        (data.orders || []).forEach(function (o) {
          var tr = document.createElement('tr');
          var risk = (o.risk && o.risk.riskLevel) || '—';
          tr.innerHTML =
            '<td>' +
            o.id +
            '<br><small>' +
            new Date(o.createdAt).toLocaleString() +
            '</small></td>' +
            '<td>' +
            (o.templateName || o.templateId) +
            '</td>' +
            '<td>' +
            o.amountInr +
            '</td>' +
            '<td>' +
            o.status +
            '</td>' +
            '<td>' +
            (o.utr || '—') +
            '</td>' +
            '<td class="risk-' +
            risk +
            '">' +
            risk +
            '</td>' +
            '<td></td>';
          var actions = tr.lastChild;
          if (o.status === 'PENDING_REVIEW' || o.status === 'CREATED' || o.status === 'EVIDENCE_SUBMITTED') {
            var ap = document.createElement('button');
            ap.className = 'ap-pay-btn primary';
            ap.type = 'button';
            ap.textContent = 'Approve';
            ap.style.marginRight = '6px';
            ap.addEventListener('click', function () {
              decide({ orderId: o.id }, 'approve');
            });
            var rj = document.createElement('button');
            rj.className = 'ap-pay-btn ghost';
            rj.type = 'button';
            rj.textContent = 'Reject';
            rj.addEventListener('click', function () {
              var reason = prompt('Rejection reason') || 'Rejected';
              decide({ orderId: o.id }, 'reject', reason);
            });
            actions.appendChild(ap);
            actions.appendChild(rj);
          } else {
            actions.textContent = o.decision && o.decision.reason ? o.decision.reason : '—';
          }
          rows.appendChild(tr);
        });
      })
      .catch(function (e) {
        loginStatus.className = 'ap-pay-status err';
        loginStatus.textContent = e.message || 'Failed';
      });
  }

  function decide(payload, action, reason) {
    var body = {
      orderId: payload.orderId || '',
      orderToken: payload.orderToken || '',
      action: action,
      reason: reason || ''
    };
    return fetch('/api/admin/decide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret()
      },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || 'Failed');
          return j;
        });
      });
  }

  function decideToken(action) {
    var token = (document.getElementById('token-paste').value || '').trim();
    if (!token) {
      tokenStatus.className = 'ap-pay-status err';
      tokenStatus.textContent = 'Paste orderToken first';
      return;
    }
    tokenStatus.textContent = 'Working…';
    var reason = action === 'reject' ? prompt('Rejection reason') || 'Rejected' : '';
    decide({ orderToken: token }, action, reason)
      .then(function (j) {
        tokenStatus.className = 'ap-pay-status ok';
        tokenStatus.textContent =
          j.status +
          (j.downloadToken ? ' · download token issued' : '') +
          (j.orderToken ? ' · give buyer updated token if needed' : '');
        if (j.orderToken) {
          document.getElementById('token-paste').value = j.orderToken;
        }
        load();
      })
      .catch(function (e) {
        tokenStatus.className = 'ap-pay-status err';
        tokenStatus.textContent = e.message || 'Failed';
      });
  }

  document.getElementById('btn-load').addEventListener('click', load);
  document.getElementById('btn-refresh').addEventListener('click', load);
  document.getElementById('btn-approve-token').addEventListener('click', function () {
    decideToken('approve');
  });
  document.getElementById('btn-reject-token').addEventListener('click', function () {
    decideToken('reject');
  });
})();
