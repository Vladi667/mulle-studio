/* ─────────────────────────────────────────────────────────────────
   contact-form.js — one script for /contact and /fr/contact
   ─────────────────────────────────────────────────────────────────
   Language comes from <html lang>, never from the browser or from
   localStorage, so the French page always speaks French.

   Delivery order:
     1. POST /api/contact           → stores the lead + emails the studio
     2. if that call fails, or reports notified:false (Resend not yet
        configured), also POST to FormSubmit so the studio is notified
        by at least one channel
     3. if both fail, show the mailto fallback

   With JavaScript off the form posts itself to /api/contact and the
   function answers 303 back to ?sent=1, which this script also renders.
   ───────────────────────────────────────────────────────────────── */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var status  = document.getElementById('formStatus');
  var btn     = document.getElementById('formSubmit');
  var pkgInp  = document.getElementById('package');
  var discInp = document.getElementById('discipline');
  var msgInp  = document.getElementById('message');

  var FR = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('fr') === 0;

  var T = FR ? {
    sending: 'Envoi de votre message…',
    sent:    '<b>Message envoyé.</b> Merci — nous vous répondons sous 24 heures.',
    receipt: ' Un accusé de réception vient de partir vers votre boîte mail.',
    missing: "Merci d'indiquer votre nom, votre e-mail et un petit mot.",
    badMail: "Cette adresse e-mail semble incomplète. Vérifiez-la et renvoyez.",
    error:   "Une erreur est survenue à l'envoi. Écrivez-nous directement à <a href=\"mailto:contact@agencefritz.com\">contact@agencefritz.com</a>.",
    btnSending: 'Envoi…',
    btnSent: 'Envoyé'
  } : {
    sending: 'Sending your note…',
    sent:    "<b>Message sent.</b> Thanks — we'll reply within 24 hours.",
    receipt: ' A receipt is on its way to your inbox.',
    missing: 'Please fill in your name, email, and a short note.',
    badMail: 'That email address looks incomplete. Check it and send again.',
    error:   'Something went wrong sending your note. Please email us directly at <a href="mailto:contact@agencefritz.com">contact@agencefritz.com</a>.',
    btnSending: 'Sending…',
    btnSent: 'Sent'
  };

  var PKG_MAP = FR ? {
    'creative-starter':      { label: 'Creative Starter',        discipline: 'Marketing',              preface: 'Je souhaite commencer par le Creative Starter.' },
    'creative-engine':       { label: 'Creative Engine',         discipline: 'Marketing',              preface: 'Je souhaite commencer par le Creative Engine.' },
    'growth-engine':         { label: 'Growth Engine',           discipline: 'Marketing',              preface: 'Je souhaite commencer par le Growth Engine.' },
    'brand-identity':        { label: 'Brand Identity',          discipline: 'Brand & Website Design', preface: "Je souhaite commencer par l'identité de marque." },
    'business-website':      { label: 'Business Website',        discipline: 'Brand & Website Design', preface: 'Je souhaite commencer par un site vitrine.' },
    'commerce-suite':        { label: 'Commerce Suite',          discipline: 'Brand & Website Design', preface: 'Je souhaite commencer par une surface e-commerce.' },
    'growth-ops-signal':     { label: 'Growth Ops · Signal',     discipline: 'Growth Ops',             preface: 'Je souhaite commencer par Growth Ops · Signal.' },
    'growth-ops-compound':   { label: 'Growth Ops · Compound',   discipline: 'Growth Ops',             preface: 'Je souhaite commencer par Growth Ops · Compound.' },
    'growth-ops-enterprise': { label: 'Growth Ops · Enterprise', discipline: 'Growth Ops',             preface: 'Je souhaite commencer par Growth Ops · Enterprise.' }
  } : {
    'creative-starter':      { label: 'Creative Starter',        discipline: 'Marketing',              preface: "I'd like to start with the Creative Starter." },
    'creative-engine':       { label: 'Creative Engine',         discipline: 'Marketing',              preface: "I'd like to start with the Creative Engine." },
    'growth-engine':         { label: 'Growth Engine',           discipline: 'Marketing',              preface: "I'd like to start with the Growth Engine." },
    'brand-identity':        { label: 'Brand Identity',          discipline: 'Brand & Website Design', preface: "I'd like to start with Brand Identity." },
    'business-website':      { label: 'Business Website',        discipline: 'Brand & Website Design', preface: "I'd like to start with a Business Website." },
    'commerce-suite':        { label: 'Commerce Suite',          discipline: 'Brand & Website Design', preface: "I'd like to start with the Commerce Suite." },
    'growth-ops-signal':     { label: 'Growth Ops · Signal',     discipline: 'Growth Ops',             preface: "I'd like to start with Growth Ops · Signal." },
    'growth-ops-compound':   { label: 'Growth Ops · Compound',   discipline: 'Growth Ops',             preface: "I'd like to start with Growth Ops · Compound." },
    'growth-ops-enterprise': { label: 'Growth Ops · Enterprise', discipline: 'Growth Ops',             preface: "I'd like to start with Growth Ops · Enterprise." }
  };

  function setStatus(kind, html) {
    if (!status) return;
    status.hidden = false;
    status.className = 'form-status ' + kind;
    status.innerHTML = html;
  }

  function track(event, data) {
    try { if (window.va) window.va('event', { name: event, data: data || {} }); } catch (e) {}
  }

  var params = new URLSearchParams(location.search);

  // ── prefill from ?package= ──
  var slug = (params.get('package') || '').toLowerCase();
  if (slug && PKG_MAP[slug]) {
    var p = PKG_MAP[slug];
    if (pkgInp) pkgInp.value = p.label;
    if (discInp && !discInp.value) discInp.value = p.discipline;
    if (msgInp && !msgInp.value) msgInp.value = p.preface + '\n\n';
    setTimeout(function () {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (msgInp) {
        msgInp.focus({ preventScroll: true });
        try { msgInp.setSelectionRange(msgInp.value.length, msgInp.value.length); } catch (e) {}
      }
    }, 250);
  }

  // ── context: language, page, ad click ids (kept for the session) ──
  function remember(key) {
    var v = params.get(key);
    try {
      if (v) sessionStorage.setItem('fritz_' + key, v);
      else v = sessionStorage.getItem('fritz_' + key) || '';
    } catch (e) { v = v || ''; }
    return v || '';
  }
  var ctx = {
    lang: FR ? 'fr' : 'en',
    source_page: (function () {
      try { return sessionStorage.getItem('fritz_entry') || document.referrer || location.pathname; }
      catch (e) { return location.pathname; }
    })(),
    gclid: remember('gclid'),
    msclkid: remember('msclkid')
  };
  ['lang', 'source_page', 'gclid', 'msclkid'].forEach(function (k) {
    var el = form.querySelector('[name="' + k + '"]');
    if (el) el.value = ctx[k];
  });

  // ── render the no-JavaScript round trip (?sent=1 / ?error=…) ──
  if (params.get('sent') === '1') {
    setStatus('ok', T.sent + (params.get('r') === '1' ? T.receipt : ''));
    track('form_submitted', { path: location.pathname, mode: 'nojs' });
  } else if (params.get('error')) {
    setStatus('err', params.get('error') === 'email' ? T.badMail : params.get('error') === 'missing' ? T.missing : T.error);
  }

  function sendToFormSubmit(p) {
    return fetch('https://formsubmit.co/ajax/contact@agencefritz.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: p.name, email: p.email, company: p.company || '',
        discipline: p.discipline || '', budget: p.budget || '', timeline: p.timeline || '',
        package: p.package || '', message: p.message,
        _subject: p.package ? 'Project — ' + p.package : 'New enquiry — Agence Fritz',
        _template: 'table', _captcha: 'false'
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return r.ok && (d.success === 'true' || d.success === true);
      });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = Object.fromEntries(new FormData(form).entries());

    if (!p.name || !p.email || !p.message) { setStatus('err', T.missing); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) { setStatus('err', T.badMail); return; }

    var label = btn.querySelector('span');
    var orig = label.textContent;
    btn.disabled = true;
    label.textContent = T.btnSending;
    setStatus('pending', T.sending);

    function succeed(mode, receipted) {
      form.reset();
      setStatus('ok', T.sent + (receipted ? T.receipt : ''));
      label.textContent = T.btnSent;
      track('form_submitted', { path: location.pathname, mode: mode, pkg: p.package || '' });
    }
    function fail() {
      btn.disabled = false;
      label.textContent = orig;
      setStatus('err', T.error);
    }

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(p)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
      })
      .then(function (res) {
        if (res.ok && res.d && res.d.ok) {
          succeed('api', !!res.d.notified);
          // Resend not configured yet: make sure the studio still hears about it.
          if (!res.d.notified) sendToFormSubmit(p).catch(function () {});
          return;
        }
        throw new Error('api failed');
      })
      .catch(function () {
        return sendToFormSubmit(p).then(function (sent) {
          if (sent) succeed('formsubmit', false);
          else fail();
        }).catch(fail);
      });
  });
})();
