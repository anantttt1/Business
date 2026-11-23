/* AP Creative Studio — enquiry popup.
 * Opens from any element marked [data-enquiry], validates, and sends the answers to /api/enquiry, which forwards
 * them to the existing Google Form and only answers { ok: true } once Google has confirmed the response.
 * No inline code/styles (the CSP blocks them): markup is built here, styling lives in /enquiry.css. */
(function () {
  'use strict';
  if (window.__apEnquiry) return;
  window.__apEnquiry = true;

  /* ---- Choices shown in the popup ----------------------------------------------------------------------------
   * These texts are written into the Google Form as-is, so they must match the form's own option texts EXACTLY
   * (Google rejects an answer that is not one of the options). Keep in sync with the live form. */
  var SERVICES = [
    'Personal / Professional Portfolio Website',
    'Professional Resume Creation',
    'Business Enquiry Website',
    'College & School Ad Posters',
    'Poster Design',
    'Other / Not sure yet'
  ];
  var TIMELINES = ['Urgent (1–3 days)', 'Within 1 week', '1–2 weeks', '2–4 weeks', 'Flexible'];
  var SHOWCASE = ['Yes, you may showcase it', 'No, keep it private'];

  var WA = 'https://wa.me/919286034026?text=' + encodeURIComponent(
    'Hi AP Creative Studio! 👋\nI want to enquire about your services. Please share the details, timeline and next steps.');
  var LIMITS = { fullName: 100, email: 254, linkedin: 300, whatsapp: 20, requirements: 1500 };
  var REQUIRED = { fullName: 1, email: 1, whatsapp: 1, service: 1, requirements: 1, timeline: 1, showcase: 1 };

  var ICON = {
    user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c.6-3.6 3.8-5.5 8-5.5s7.4 1.9 8 5.5"/>',
    mail: '<path d="M3.5 6h17v12h-17zM4 7l8 6 8-6"/>',
    link: '<path d="M9.5 14.5l5-5M8 11l-1.6 1.6a3.2 3.2 0 0 0 4.5 4.5L12.5 15.5M16 13l1.6-1.6a3.2 3.2 0 0 0-4.5-4.5L11.5 8.5"/>',
    phone: '<path d="M6.6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.4v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    wa: '<path d="M4 20l1.2-4A8 8 0 1 1 8.2 19zM9 9.5c.4 2.6 2.6 4.8 5.5 5.5l1-1.2-2-1-.8.7a4.6 4.6 0 0 1-2-2l.7-.8-1-2z"/>'
  };
  function svg(name, cls) {
    return '<svg class="' + (cls || 'eq-svg') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICON[name] + '</svg>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function textField(o) {
    var req = REQUIRED[o.id];
    return '<div class="eq-f" data-f="' + o.id + '">' +
      '<label class="eq-l" for="eq-' + o.id + '">' + o.label +
      (req ? '<span class="eq-req" aria-hidden="true"> *</span><span class="eq-sr"> (required)</span>' : '<span class="eq-opt">Optional</span>') + '</label>' +
      '<div class="eq-in"><span class="eq-ico">' + svg(o.icon) + '</span>' +
      '<input id="eq-' + o.id + '" name="' + o.id + '" type="' + o.type + '" autocomplete="' + o.auto + '"' +
      (o.mode ? ' inputmode="' + o.mode + '"' : '') + ' placeholder="' + esc(o.ph) + '" maxlength="' + LIMITS[o.id] + '"' +
      ' spellcheck="false" aria-describedby="eq-' + o.id + '-err"' + (req ? ' aria-required="true"' : '') + '></div>' +
      '<p class="eq-err" id="eq-' + o.id + '-err" hidden></p></div>';
  }

  function chips(id, label, options) {
    return '<fieldset class="eq-f eq-fs" data-f="' + id + '" role="radiogroup" aria-required="true" aria-describedby="eq-' + id + '-err">' +
      '<legend class="eq-l">' + label + '<span class="eq-req" aria-hidden="true"> *</span><span class="eq-sr"> (required)</span></legend>' +
      '<div class="eq-chips">' + options.map(function (t, i) {
        return '<label class="eq-chip"><input type="radio" name="' + id + '" value="' + esc(t) + '"><span>' + esc(t) + '</span></label>';
      }).join('') + '</div><p class="eq-err" id="eq-' + id + '-err" hidden></p></fieldset>';
  }

  var HTML =
    '<div class="eq-box" role="dialog" aria-modal="true" aria-labelledby="eqTitle" aria-describedby="eqSub" tabindex="-1">' +
      '<span class="eq-deco eq-deco-a" aria-hidden="true"></span><span class="eq-deco eq-deco-b" aria-hidden="true"></span>' +
      '<button type="button" class="eq-x" data-eq-close aria-label="Close enquiry form">' + svg('close') + '</button>' +
      '<div class="eq-scroll">' +
        '<div class="eq-view" data-view="form">' +
          '<div class="eq-top">' +
            '<span class="eq-brand"><i class="eq-dot" aria-hidden="true"></i><span>AP <b>Creative</b> Studio</span></span>' +
            '<h2 class="eq-title" id="eqTitle">Let’s Build Something <span>Great.</span></h2>' +
            '<p class="eq-sub" id="eqSub">Tell us about your project. We’ll get back to you soon.</p>' +
          '</div>' +
          '<form class="eq-form" id="eqForm" novalidate>' +
            '<div class="eq-alert" id="eqAlert" role="alert" hidden><p class="eq-alert-t" id="eqAlertText"></p>' +
              '<a class="eq-alert-wa" href="' + WA + '" target="_blank" rel="noopener noreferrer">' + svg('wa', 'eq-svg eq-svg-s') + 'Message us on WhatsApp instead</a></div>' +
            '<div class="eq-grid">' +
              textField({ id: 'fullName', label: 'Full name', type: 'text', icon: 'user', auto: 'name', ph: 'Your full name' }) +
              textField({ id: 'email', label: 'Email address', type: 'email', icon: 'mail', auto: 'email', mode: 'email', ph: 'you@example.com' }) +
              textField({ id: 'whatsapp', label: 'WhatsApp number', type: 'tel', icon: 'phone', auto: 'tel', mode: 'tel', ph: '98765 43210' }) +
              textField({ id: 'linkedin', label: 'LinkedIn profile URL', type: 'url', icon: 'link', auto: 'url', mode: 'url', ph: 'linkedin.com/in/your-name' }) +
            '</div>' +
            '<div class="eq-f" data-f="service"><label class="eq-l" for="eq-service">Select service<span class="eq-req" aria-hidden="true"> *</span><span class="eq-sr"> (required)</span></label>' +
              '<div class="eq-in eq-sel"><span class="eq-ico">' + svg('spark') + '</span>' +
              '<select id="eq-service" name="service" aria-required="true" aria-describedby="eq-service-err"><option value="">Choose a service…</option>' +
              SERVICES.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('') +
              '</select></div><p class="eq-err" id="eq-service-err" hidden></p></div>' +
            '<div class="eq-f" data-f="requirements"><label class="eq-l" for="eq-requirements">Project requirements / description<span class="eq-req" aria-hidden="true"> *</span><span class="eq-sr"> (required)</span></label>' +
              '<div class="eq-in"><textarea id="eq-requirements" name="requirements" rows="4" maxlength="' + LIMITS.requirements + '" placeholder="What do you need? Mention your course/role, links, style ideas, deadlines…" aria-required="true" aria-describedby="eq-requirements-err eq-count"></textarea></div>' +
              '<div class="eq-meta"><p class="eq-err" id="eq-requirements-err" hidden></p><span class="eq-count" id="eq-count" aria-hidden="true">0/' + LIMITS.requirements + '</span></div></div>' +
            chips('timeline', 'Expected delivery timeline', TIMELINES) +
            chips('showcase', 'Can we showcase your finished project on the AP Creative Studio website?', SHOWCASE) +
            '<div class="eq-hp" aria-hidden="true"><label>Leave this empty<input type="text" name="hp_note" tabindex="-1" autocomplete="off"></label></div>' +
            '<button type="submit" class="eq-submit" id="eqSubmit"><span class="eq-submit-t">Send enquiry</span><span class="eq-spin" aria-hidden="true"></span></button>' +
            '<p class="eq-fine"><span class="eq-req" aria-hidden="true">*</span> Required. We only use your details to reply to this enquiry — see our <a href="/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>' +
          '</form>' +
        '</div>' +
        '<div class="eq-view eq-done" data-view="done" hidden>' +
          '<div class="eq-tick" aria-hidden="true">' + svg('check', 'eq-svg eq-svg-xl') + '</div>' +
          '<h2 class="eq-title eq-title-s" id="eqDoneTitle" tabindex="-1">Thank you!</h2>' +
          '<p class="eq-sub" id="eqDoneText">Your enquiry has reached us. We’ll get back to you soon.</p>' +
          '<div class="eq-done-actions"><button type="button" class="eq-submit eq-btn-s" data-eq-close>Back to the website</button>' +
          '<button type="button" class="eq-ghost" id="eqAgain">Send another enquiry</button></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var root, box, form, alertBox, alertText, submitBtn, countEl;
  var lastFocus = null, closing = null, sending = false, inerted = [];

  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'eq';
    root.id = 'eq';
    root.hidden = true;
    root.innerHTML = HTML;
    document.body.appendChild(root);
    box = root.querySelector('.eq-box');
    form = root.querySelector('#eqForm');
    alertBox = root.querySelector('#eqAlert');
    alertText = root.querySelector('#eqAlertText');
    submitBtn = root.querySelector('#eqSubmit');
    countEl = root.querySelector('#eq-count');

    // close: button(s), Escape, click outside (pointer must start AND end on the dim backdrop, so selecting text and releasing outside does not close it)
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-eq-close]')) close();
    });
    var downOnBackdrop = false;
    root.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === root; });
    root.addEventListener('click', function (e) { if (downOnBackdrop && e.target === root) close(); downOnBackdrop = false; });
    document.addEventListener('keydown', onKey);

    form.addEventListener('submit', onSubmit);
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.eq-f');
      if (f) clearError(f.dataset.f);
      if (e.target.name === 'requirements') countEl.textContent = e.target.value.length + '/' + LIMITS.requirements;
    });
    form.addEventListener('change', function (e) { var f = e.target.closest('.eq-f'); if (f) clearError(f.dataset.f); });
    form.addEventListener('focusout', function (e) {
      var f = e.target.closest && e.target.closest('.eq-f');
      if (f && e.target.matches('input[type=text],input[type=email],input[type=tel],input[type=url],textarea,select') && e.target.value.trim()) {
        var err = checkOne(f.dataset.f, read());
        if (err) showError(f.dataset.f, err);
      }
    });
    root.querySelector('#eqAgain').addEventListener('click', function () { showView('form'); focusFirst(); });
  }

  function onKey(e) {
    if (!root || root.hidden || !root.classList.contains('eq-show')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    var items = [].filter.call(box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),textarea:not([disabled])'), function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function showView(name) {
    [].forEach.call(root.querySelectorAll('.eq-view'), function (v) { v.hidden = v.dataset.view !== name; });
    root.querySelector('.eq-scroll').scrollTop = 0;
  }

  function focusFirst() {
    // Touch devices: focusing a field would pop the keyboard over the form straight away, so focus the dialog itself.
    var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
    var target = fine ? root.querySelector('.eq-view:not([hidden]) input, .eq-view:not([hidden]) .eq-submit') : null;
    (target || box).focus({ preventScroll: true });
  }

  function lock(on) {
    var de = document.documentElement;
    if (on) {
      de.style.setProperty('--eq-sbw', Math.max(0, innerWidth - de.clientWidth) + 'px');
      de.classList.add('eq-lock');
      inerted = [].filter.call(document.body.children, function (el) { return el !== root && !el.inert; });
      inerted.forEach(function (el) { el.inert = true; });
    } else {
      de.classList.remove('eq-lock');
      de.style.removeProperty('--eq-sbw');
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
    }
  }

  function open(trigger, preset) {
    build();
    if (closing) { clearTimeout(closing); closing = null; }
    lastFocus = trigger || document.activeElement;
    if (preset && !root.querySelector('#eq-service').value) {
      var sel = root.querySelector('#eq-service');
      if (SERVICES.indexOf(preset) > -1) sel.value = preset;
    }
    root.hidden = false;
    lock(true);
    void root.offsetWidth; // let the browser paint the hidden state so the transition runs
    root.classList.add('eq-show');
    focusFirst();
  }

  function close() {
    if (!root || root.hidden || !root.classList.contains('eq-show')) return;
    root.classList.remove('eq-show');
    lock(false);
    var done = function () {
      closing = null;
      root.hidden = true;
      if (root.querySelector('.eq-done') && !root.querySelector('.eq-done').hidden) showView('form');
    };
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    closing = setTimeout(done, reduce ? 0 : 260);
    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---- validation (same rules as /api/enquiry; the server re-checks everything) --------------------------------- */
  var EMAIL_RE = /^[^\s@]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
  function phoneOk(raw) {
    var plus = /^\s*\+/.test(raw), d = raw.replace(/\D/g, '');
    if (!plus && d.indexOf('00') === 0) d = d.slice(2);
    if (d.length === 10 && /^[6-9]/.test(d)) return true;
    if (d.length === 12 && d.indexOf('91') === 0 && /^[6-9]/.test(d.charAt(2))) return true;
    if (d.length === 11 && d.charAt(0) === '0' && /^[6-9]/.test(d.charAt(1))) return true;
    return (plus && d.length >= 8 && d.length <= 15) || (!plus && d.length >= 11 && d.length <= 15);
  }
  function linkedinOk(raw) {
    var t = raw.trim();
    if (!/^https?:\/\//i.test(t)) t = 'https://' + t;
    try {
      var h = new URL(t).hostname.toLowerCase();
      return h === 'linkedin.com' || /\.linkedin\.com$/.test(h) || h === 'lnkd.in';
    } catch (e) { return false; }
  }
  function checkOne(k, v) {
    var s = (v[k] || '').trim();
    if (!s) return REQUIRED[k] ? (k === 'service' || k === 'timeline' || k === 'showcase' ? 'Please choose an option.' : 'This field is required.') : '';
    if (k === 'fullName' && s.length < 2) return 'Enter your full name.';
    if (k === 'email' && !EMAIL_RE.test(s)) return 'Enter a valid email address, e.g. name@example.com.';
    if (k === 'whatsapp' && !phoneOk(s)) return 'Enter a valid WhatsApp number (add the country code if it is not an Indian number).';
    if (k === 'linkedin' && !linkedinOk(s)) return 'Enter a valid LinkedIn profile link (linkedin.com/in/…).';
    if (k === 'requirements' && s.length < 10) return 'Please add a few more details (at least 10 characters).';
    return '';
  }
  var ORDER = ['fullName', 'email', 'whatsapp', 'linkedin', 'service', 'requirements', 'timeline', 'showcase'];
  function read() {
    var fd = new FormData(form), v = {};
    ORDER.forEach(function (k) { v[k] = String(fd.get(k) || ''); });
    v.hp_note = String(fd.get('hp_note') || '');
    return v;
  }

  function fieldEl(k) { return form.querySelector('[data-f="' + k + '"]'); }
  function showError(k, msg) {
    var f = fieldEl(k), p = f && f.querySelector('.eq-err');
    if (!f || !p) return;
    f.classList.add('eq-bad');
    p.textContent = msg; p.hidden = false;
    [].forEach.call(f.querySelectorAll('input:not([type=radio]),select,textarea'), function (i) { i.setAttribute('aria-invalid', 'true'); });
  }
  function clearError(k) {
    var f = fieldEl(k), p = f && f.querySelector('.eq-err');
    if (!f || !p) return;
    f.classList.remove('eq-bad');
    p.hidden = true; p.textContent = '';
    [].forEach.call(f.querySelectorAll('[aria-invalid]'), function (i) { i.removeAttribute('aria-invalid'); });
  }
  function focusField(k) {
    var f = fieldEl(k);
    var t = f && f.querySelector('input:not([type=radio]),select,textarea,input[type=radio]');
    if (t) t.focus();
  }
  function setAlert(msg) {
    if (!msg) { alertBox.hidden = true; return; }
    alertText.textContent = msg; alertBox.hidden = false;
  }
  function setBusy(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('eq-busy', on);
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    submitBtn.querySelector('.eq-submit-t').textContent = on ? 'Sending…' : 'Send enquiry';
    form.classList.toggle('eq-sending', on);
  }

  var MESSAGES = {
    network: 'We couldn’t reach the server. Please check your internet connection and try again.',
    timeout: 'This is taking longer than expected, so we couldn’t confirm your enquiry. Please try again in a moment.',
    rate_limited: 'Too many attempts in a short time. Please wait a few minutes and try again.',
    upstream: 'We couldn\u2019t confirm that your enquiry was received. Please try again \u2014 or message us on WhatsApp so we can be sure.',
    unconfirmed: 'We couldn’t confirm that your enquiry was received. Please try again — or message us on WhatsApp so we can be sure.',
    default: 'Something went wrong and your enquiry was not sent. Please try again in a moment.'
  };

  function onSubmit(e) {
    e.preventDefault();
    if (sending) return; // duplicate-submit guard (button is also disabled)
    var v = read(), bad = null;
    setAlert('');
    ORDER.forEach(function (k) {
      var msg = checkOne(k, v);
      if (msg) { showError(k, msg); if (!bad) bad = k; } else clearError(k);
    });
    if (bad) { focusField(bad); return; }

    sending = true; setBusy(true);
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 20000);
    fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(v),
      signal: ctrl.signal,
      credentials: 'same-origin',
      cache: 'no-store'
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (j) { return { res: res, j: j }; });
    }).then(function (r) {
      // Success ONLY when the server explicitly confirmed it (HTTP 200 and ok === true).
      if (r.res.status === 200 && r.j && r.j.ok === true) return onSuccess(v);
      var code = (r.j && r.j.code) || 'default';
      if (code === 'invalid' && r.j && r.j.fields) {
        var first = null;
        Object.keys(r.j.fields).forEach(function (k) { if (fieldEl(k)) { showError(k, r.j.fields[k]); if (!first) first = k; } });
        if (first) { focusField(first); return; }
      }
      setAlert(MESSAGES[code] || MESSAGES['default']);
    }).catch(function (err) {
      setAlert(err && err.name === 'AbortError' ? MESSAGES.timeout : MESSAGES.network);
    }).then(function () {
      clearTimeout(timer); sending = false; setBusy(false);
    });
  }

  function onSuccess(v) {
    var first = (v.fullName || '').trim().split(/\s+/)[0];
    form.reset();
    countEl.textContent = '0/' + LIMITS.requirements;
    ORDER.forEach(clearError);
    setAlert('');
    root.querySelector('#eqDoneTitle').textContent = first ? 'Thank you, ' + first + '!' : 'Thank you!';
    showView('done');
    if (!root.hidden) (root.querySelector('#eqDoneTitle')).focus({ preventScroll: true });
  }

  /* ---- wiring ---------------------------------------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target.closest && e.target.closest('[data-enquiry]');
    if (!t) return;
    e.preventDefault();
    open(t, t.getAttribute('data-enquiry-service') || '');
  });
  // Deep link: /#enquiry opens the popup (handy for emails and QR codes)
  function fromHash() { if (location.hash === '#enquiry') open(null); }
  addEventListener('hashchange', fromHash);
  if (document.readyState !== 'loading') fromHash(); else document.addEventListener('DOMContentLoaded', fromHash);

  window.apEnquiry = { open: open, close: close };
})();
