import { load } from 'cheerio';
import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';
const DATA = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // [{file, canonical, serviceType, content}]

const esc = s => String(s);
const blocks = bl => (bl || []).map(b =>
  b.type === 'ul' ? `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`
  : `<p>${esc(b.text)}</p>`).join('\n        ');

const SEO_CSS = `<style id="lp-seo-css">
.lp-seo{border-top:1px solid var(--hairline);padding:clamp(56px,9vh,110px) var(--margin)}
.lp-seo-inner{max-width:760px;margin:0 auto}
.lp-seo .eyebrow{margin:0 0 20px}
.lp-seo h2{font-size:clamp(24px,3vw,38px);line-height:1.08;letter-spacing:-.02em;margin:0 0 18px;max-width:20ch}
.lp-seo-intro{font-size:clamp(15px,1.35vw,18px);line-height:1.7;color:var(--txt-70);margin:0 0 8px;max-width:64ch}
.lp-seo h3{font-size:16px;font-weight:600;letter-spacing:-.01em;margin:34px 0 8px}
.lp-seo p{color:var(--txt-70);line-height:1.72;margin:0 0 14px;max-width:66ch}
.lp-seo ul{color:var(--txt-70);line-height:1.72;margin:0 0 14px;padding-left:20px;max-width:66ch}
.lp-seo li{margin-bottom:6px}
.lp-faq{margin-top:44px;border-top:1px solid var(--hairline)}
.lp-faq-item{border-bottom:1px solid var(--hairline);padding:22px 0}
.lp-faq-item h3{font-size:15.5px;font-weight:600;margin:0 0 8px}
.lp-faq-item p{color:var(--txt-70);line-height:1.65;margin:0;max-width:66ch}
.lp-seo-hub{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:34px;padding-top:22px;border-top:1px solid var(--hairline);font-size:13.5px}
.lp-seo-hub a{color:var(--blue);text-decoration:none;white-space:nowrap}
.lp-seo-hub a:hover{text-decoration:underline}
</style>`;

for (const P of DATA) {
  const c = P.content;
  const url = O + P.canonical;
  const file = ROOT + '/fr/' + P.file + '.html';
  const $ = load(fs.readFileSync(file, 'utf8'), { decodeEntities: false });

  // guard: don't double-inject
  $('.lp-seo').remove();
  $('#lp-seo-css').remove();
  $('script[type="application/ld+json"].lp-seo-ld').remove();
  if (!$('#lp-seo-css').length) $('head').append('\n' + SEO_CSS);

  const secHtml = c.sections.map(s => `      <h3>${esc(s.h3)}</h3>\n        ${blocks(s.blocks)}`).join('\n');
  const faqHtml = c.faq.map(f => `        <div class="lp-faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('\n');
  const hubHtml = (c.internalLinks || []).map(l => `<a href="${l.href}">${esc(l.anchor)} →</a>`).join('');
  const band = `
    <section class="lp-seo" aria-labelledby="lp-seo-h2">
      <div class="lp-seo-inner">
        <div class="eyebrow"><span class="hr" aria-hidden="true"></span><span>${esc(c.kicker)}</span></div>
        <h2 id="lp-seo-h2">${esc(c.h2)}</h2>
        <p class="lp-seo-intro">${esc(c.intro)}</p>
${secHtml}
        <div class="lp-faq">
${faqHtml}
        </div>
        <nav class="lp-seo-hub" aria-label="Ressources">${hubHtml}</nav>
      </div>
    </section>`;

  // insert before the "explore" crosslinks band; fall back to before footer
  const anchor = $('section.crosslinks').first();
  if (anchor.length) anchor.before(band);
  else $('main footer').first().before(band);

  // schema: Service + FAQPage + BreadcrumbList (keeps the sitewide ProfessionalService intact)
  const svc = { '@type': 'Service', name: c.h2, serviceType: P.serviceType, areaServed: ['Genève', 'Suisse romande'], provider: { '@id': O + '/#org' }, url };
  const faqLd = { '@type': 'FAQPage', mainEntity: c.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const crumbs = { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: O + '/fr/' },
    { '@type': 'ListItem', position: 2, name: c.h2, item: url },
  ] };
  $('head').append(`\n<script type="application/ld+json" class="lp-seo-ld">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [svc, faqLd, crumbs] })}</script>`);

  fs.writeFileSync(file, $.html());
  const words = $('.lp-seo').text().split(/\s+/).filter(Boolean).length;
  console.log(`✓ ${P.file}: band +${words}w · ${c.sections.length} sec · ${c.faq.length} FAQ · hub:${(c.internalLinks || []).length} · anchor:${anchor.length ? 'crosslinks' : 'footer'}`);
}
