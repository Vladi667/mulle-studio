/* ─────────────────────────────────────────────────────────────────
   analytics.js — conversion events for Vercel Web Analytics
   ─────────────────────────────────────────────────────────────────
   Cookieless. Records what someone DID, never who they are: no ids,
   no email, no message text — only the event name and a short label.

   Events
     page_view          automatic, from the Vercel script
     cta_start_project  any link into the contact page
     mailto_clicked     the studio address, link or copy button
     booking_clicked    the discovery-call link (arrives with WP6)
     pricing_viewed     a pricing page reached the screen
     estimator_used     the price estimator was changed
     form_submitted     fired by contact-form.js on a successful send

   window.va is stubbed by the snippet the injector writes, so calls
   made before the script loads are queued rather than lost, and calls
   made while Web Analytics is switched off are simply discarded.
   ───────────────────────────────────────────────────────────────── */
(function () {
  function track(name, data) {
    try { if (window.va) window.va('event', { name: name, data: data || {} }); } catch (e) {}
  }
  window.fritzTrack = track;

  var path = location.pathname;
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';

  // ── clicks, by delegation so injected markup is covered too ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a, button') : null;
    if (!a) return;
    var href = (a.getAttribute('href') || '').toLowerCase();

    if (href.indexOf('mailto:') === 0 || a.id === 'mailXL') {
      track('mailto_clicked', { from: path, lang: lang });
      return;
    }
    if (a.hasAttribute('data-booking') || href.indexOf('cal.com') > -1 || href.indexOf('calendly.com') > -1) {
      track('booking_clicked', { from: path, lang: lang });
      return;
    }
    // any route into the contact page: /contact, /fr/contact, contact.html?package=…
    if (href.indexOf('contact') > -1 && href.indexOf('mailto:') !== 0) {
      var pkg = (href.split('package=')[1] || '').split('&')[0];
      track('cta_start_project', { from: path, lang: lang, pkg: pkg || '' });
    }
  }, true);

  // ── a pricing page was actually seen ──
  if (/\/(pricing|fr\/tarifs)$/.test(path.replace(/\/$/, ''))) {
    track('pricing_viewed', { lang: lang });
  }

  // ── the estimator was used (first interaction only) ──
  var estimatorSeen = false;
  document.addEventListener('change', function (e) {
    var host = e.target.closest ? e.target.closest('#price-estimator') : null;
    if (!host || estimatorSeen) return;
    estimatorSeen = true;
    track('estimator_used', { from: path, lang: lang });
  }, true);
})();
