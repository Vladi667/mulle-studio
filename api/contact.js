/* ─────────────────────────────────────────────────────────────────
   /api/contact — public contact-form intake for agencefritz.com
   ─────────────────────────────────────────────────────────────────
   Primary delivery path for the contact form. Replaces the previous
   arrangement where the form's action was a 404 and the browser
   posted straight to formsubmit.co with no record kept anywhere.

   Accepts BOTH:
     - application/json                    (the page's fetch)
     - application/x-www-form-urlencoded   (a plain form post, i.e.
       JavaScript disabled or broken) → answers 303 back to the page

   Does:
     1. validates
     2. inserts into Supabase `fritz_leads` (anon insert allowed by RLS)
        — honeypot hits are stored with status 'spam' rather than
          silently dropped, so a false positive is visible
     3. notifies the studio by email through Resend (if configured)
     4. sends the visitor a receipt in their own language
     5. reports `notified` so the page knows whether it must still
        fall back to FormSubmit for the notification

   Required env (Vercel → mulle-studio → Settings → Environment Variables):
     SUPABASE_URL, SUPABASE_ANON_KEY
   Optional env:
     RESEND_API_KEY, RESEND_FROM, RESEND_TO
   ───────────────────────────────────────────────────────────────── */

export const config = { runtime: 'edge' };

const MAX = { name: 200, email: 320, company: 200, discipline: 80, budget: 80, timeline: 80, message: 4000, package: 80, lang: 8, page: 200, click: 200 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const seeOther = (location) =>
  new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });

const clamp = (s, n) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

const newId = () => 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

async function readBody(req) {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    try { return { data: await req.json(), form: false }; }
    catch { return { data: null, form: false }; }
  }
  if (ct.includes('form-urlencoded') || ct.includes('multipart/form-data')) {
    try {
      const fd = await req.formData();
      return { data: Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : ''])), form: true };
    } catch { return { data: null, form: true }; }
  }
  // no content-type: try JSON, then form
  try { return { data: await req.json(), form: false }; }
  catch { return { data: null, form: false }; }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const { data: body, form: isFormPost } = await readBody(req);
  if (!body) return json({ ok: false, error: 'invalid_payload' }, 400);

  const name       = clamp(body.name, MAX.name);
  const email      = clamp(body.email, MAX.email);
  const company    = clamp(body.company, MAX.company);
  const discipline = clamp(body.discipline, MAX.discipline);
  const budget     = clamp(body.budget, MAX.budget);
  const timeline   = clamp(body.timeline, MAX.timeline);
  const message    = clamp(body.message, MAX.message);
  const pkg        = clamp(body.package, MAX.package);
  const lang       = clamp(body.lang, MAX.lang).toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const sourcePage = clamp(body.source_page, MAX.page);
  const gclid      = clamp(body.gclid, MAX.click);
  const msclkid    = clamp(body.msclkid, MAX.click);

  // Honeypot: `fax_number` is the current field. `website` is the legacy name and
  // is still checked so a cached old page keeps working.
  const trapped = !!(clamp(body.fax_number, 100) || clamp(body.website, 100));

  const backTo = (qs) => (lang === 'fr' ? `/fr/contact?${qs}` : `/contact?${qs}`);

  if (!name || !email || !message) {
    return isFormPost ? seeOther(backTo('error=missing')) : json({ ok: false, error: 'missing_required_fields' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return isFormPost ? seeOther(backTo('error=email')) : json({ ok: false, error: 'invalid_email' }, 400);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // The page falls back to FormSubmit on any non-2xx.
    return isFormPost
      ? seeOther(backTo('error=storage'))
      : json({ ok: false, error: 'storage_not_configured' }, 503);
  }

  const id = newId();
  const meta = [
    pkg        ? `Package: ${pkg}`          : '',
    sourcePage ? `Page: ${sourcePage}`      : '',
    `Language: ${lang}`,
    gclid      ? `gclid: ${gclid}`          : '',
    msclkid    ? `msclkid: ${msclkid}`      : '',
    trapped    ? 'Honeypot: filled (stored as spam, not emailed)' : '',
  ].filter(Boolean).join('\n');
  const storedMessage = `${message}\n\n— — —\n${meta}`;

  // ── 1. store ──
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/fritz_leads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([{
        id, name, email, company, discipline, budget, timeline,
        message: storedMessage,
        status: trapped ? 'spam' : 'new',
      }]),
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('[contact] supabase insert failed', r.status, errText);
      return isFormPost ? seeOther(backTo('error=storage')) : json({ ok: false, error: 'storage_write_failed', status: r.status }, 502);
    }
  } catch (e) {
    console.error('[contact] supabase network error', String(e));
    return isFormPost ? seeOther(backTo('error=storage')) : json({ ok: false, error: 'storage_network_error' }, 502);
  }

  // A honeypot hit is recorded and then treated as done: no email either way.
  if (trapped) {
    return isFormPost ? seeOther(backTo('sent=1')) : json({ ok: true, id, notified: true, spam: true });
  }

  // ── 2. notify the studio, and receipt the visitor ──
  let notified = false;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const to   = process.env.RESEND_TO   || 'contact@agencefritz.com';
    const from = process.env.RESEND_FROM || 'Agence Fritz <notify@agencefritz.com>';

    const lines = [
      `From: ${name} <${email}>`,
      company    ? `Company: ${company}`       : '',
      discipline ? `Discipline: ${discipline}` : '',
      pkg        ? `Package interest: ${pkg}`  : '',
      budget     ? `Budget: ${budget}`         : '',
      timeline   ? `Timeline: ${timeline}`     : '',
      sourcePage ? `Page: ${sourcePage}`       : '',
      `Language: ${lang}`,
      gclid      ? `gclid: ${gclid}`           : '',
      msclkid    ? `msclkid: ${msclkid}`       : '',
      '',
      '--- Message ---',
      message,
      '',
      `Lead id: ${id}`,
    ].filter(Boolean).join('\n');

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from, to,
          subject: pkg ? `New enquiry · ${pkg} · ${name}` : `New enquiry · ${name}`,
          reply_to: email,
          text: lines,
        }),
      });
      notified = r.ok;
      if (!r.ok) console.error('[contact] resend notify failed', r.status, await r.text().catch(() => ''));
    } catch (e) {
      console.error('[contact] resend notify error', String(e));
    }

    // Receipt to the visitor — best effort, never affects the response.
    const receipt = lang === 'fr'
      ? {
          subject: 'Votre message est bien arrive — Agence Fritz',
          text: [
            `Bonjour ${name},`, '',
            'Votre message est bien arrive chez Agence Fritz. Voici ce qui suit :',
            '1. une reponse sous 24 heures,',
            '2. un appel de 20 minutes si vous le souhaitez,',
            '3. un devis ecrit au prix publie.', '',
            '--- Votre message ---', message, '',
            'Si vous devez ajouter quelque chose, repondez simplement a cet e-mail.', '',
            'Agence Fritz — Geneve', 'https://agencefritz.com',
          ].join('\n'),
        }
      : {
          subject: 'We have your note — Agence Fritz',
          text: [
            `Hello ${name},`, '',
            'Your note reached Agence Fritz. Here is what happens next:',
            '1. a reply within 24 hours,',
            '2. a 20-minute call if you would like one,',
            '3. a written quote at the published price.', '',
            '--- Your message ---', message, '',
            'If you need to add anything, just reply to this email.', '',
            'Agence Fritz — Geneva', 'https://agencefritz.com',
          ].join('\n'),
        };

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from, to: email, subject: receipt.subject, reply_to: to, text: receipt.text }),
      });
    } catch (e) {
      console.warn('[contact] resend receipt error', String(e));
    }
  }

  return isFormPost
    ? seeOther(backTo(notified ? 'sent=1&r=1' : 'sent=1'))
    : json({ ok: true, id, notified });
}
