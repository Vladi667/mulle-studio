import { load } from 'cheerio';
import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';
const DATA = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // [{slug,type,dir,hreflangEn,priceBlock,breadcrumb,content}]

const esc = s => String(s);
function renderBlocks(blocks) {
  return (blocks || []).map(b => {
    if (b.type === 'p') return `      <p>${esc(b.text)}</p>`;
    if (b.type === 'h3') return `      <h3>${esc(b.text)}</h3>`;
    if (b.type === 'ul') return `      <ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    if (b.type === 'table') return `      <div class="tablewrap"><table><thead><tr>${b.tableHead.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.tableRows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return '';
  }).join('\n');
}
const PROSE_CSS = `<style>
.lp-hero{padding:clamp(120px,20vh,220px) var(--margin) clamp(30px,5vh,60px);position:relative}
.lp-hero h1{font-size:clamp(30px,5vw,60px);line-height:1.04;letter-spacing:-.02em;max-width:16ch;margin:0 0 18px}
.lp-hero h1 em{font-style:normal;color:var(--blue)}
.lp-lede{font-size:clamp(15px,1.3vw,18px);line-height:1.7;color:var(--txt-70);max-width:60ch;margin:0}
.lp-opener{max-width:820px;margin:clamp(18px,3vh,30px) auto 0;padding:16px 20px;border-left:2px solid var(--blue);background:rgba(0,113,227,.05);border-radius:0 8px 8px 0;color:var(--txt);font-size:15px;line-height:1.6}
.lp-body{max-width:760px;margin:0 auto;padding:0 var(--margin)}
.lp-sec{padding:clamp(30px,5vh,54px) 0;border-top:1px solid var(--hairline)}
.lp-sec:first-child{border-top:0}
.lp-sec h2{font-size:clamp(21px,2.4vw,30px);letter-spacing:-.015em;margin:0 0 16px}
.lp-sec h3{font-size:16px;font-weight:600;margin:22px 0 6px}
.lp-sec p{color:var(--txt-70);line-height:1.7;margin:0 0 14px;max-width:68ch}
.lp-sec ul{color:var(--txt-70);line-height:1.7;margin:0 0 14px;padding-left:20px}
.lp-sec li{margin-bottom:6px}
.lp-sec a{color:var(--blue);text-decoration:none}
.lp-sec a:hover{text-decoration:underline}
.tablewrap{overflow-x:auto;margin:18px 0;border:1px solid var(--hairline);border-radius:8px}
.tablewrap table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:520px}
.tablewrap th{font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--txt-55);text-align:left;padding:11px 15px;border-bottom:1px solid var(--hairline-2);font-weight:500}
.tablewrap td{padding:10px 15px;border-bottom:1px solid var(--hairline);vertical-align:top;color:var(--txt-70)}
.tablewrap tr:last-child td{border-bottom:0}
.faq-item{border-top:1px solid var(--hairline);padding:22px 0}
.faq-item:last-child{border-bottom:1px solid var(--hairline)}
.faq-item h3{font-size:16px;font-weight:600;margin:0 0 8px}
.faq-item p{color:var(--txt-70);line-height:1.65;margin:0;max-width:68ch}
.lp-cta{display:flex;gap:22px;flex-wrap:wrap;align-items:center;margin-top:30px}
.lp-hub{margin-top:12px;font-size:13.5px;color:var(--txt-55)}
.lp-hub a{color:var(--blue);text-decoration:none;margin-right:18px;white-space:nowrap}
</style>`;

for (const P of DATA) {
  const c = P.content;
  const EN = P.lang === 'en';
  // EN pages are built from the English shell and live at the root; FR pages from the French shell under /fr/
  const $ = load(fs.readFileSync(ROOT + (EN ? '/about.html' : '/fr/a-propos.html'), 'utf8'), { decodeEntities: false });
  const path = EN ? '/' + P.slug : '/fr/' + (P.dir ? P.dir + '/' : '') + P.slug;
  const url = O + path;
  $('title').text(c.metaTitle);
  $('meta[name="description"]').attr('content', c.metaDesc);
  $('link[rel="canonical"]').attr('href', url);
  $('meta[property="og:url"]').attr('content', url);
  $('meta[property="og:title"]').attr('content', c.metaTitle.split(' | ')[0]);
  $('meta[property="og:description"]').attr('content', c.metaDesc);
  $('meta[property="og:locale"]').attr('content', EN ? 'en' : 'fr_CH');
  $('link[rel="alternate"][hreflang]').remove();
  // reciprocal hreflang. EN page: altFr points at its French counterpart. FR page: hreflangEn points at its English one.
  const altFr = EN ? P.altFr : path;
  const altEn = EN ? path : P.hreflangEn;
  if (altFr && altEn) {
    $('link[rel="canonical"]').after(
      `\n<link rel="alternate" hreflang="en" href="${O}${altEn}">` +
      `\n<link rel="alternate" hreflang="fr-CH" href="${O}${altFr}">` +
      `\n<link rel="alternate" hreflang="x-default" href="${O}${altEn}">`);
  }
  $('head').append('\n' + PROSE_CSS);
  // language switcher: the active language is marked, the other points at the real counterpart
  $('.langtog').remove();
  $('header').first().append(EN
    ? `<div class="langtog" aria-label="Language"><a href="${path}" class="on" aria-current="page">EN</a><a href="${P.altFr || '/fr/'}">FR</a></div>`
    : `<div class="langtog" aria-label="Language"><a href="${P.langEn || P.hreflangEn || '/'}">EN</a><a href="${path}" class="on" aria-current="page">FR</a></div>`);

  const sectionsHtml = c.sections.map(s => `    <section class="lp-sec">\n      <h2>${esc(s.h2)}</h2>\n${renderBlocks(s.blocks)}\n    </section>`).join('\n');
  const faqHtml = c.faq.map(f => `    <div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('\n');
  const hubHtml = (c.internalLinks || []).map(l => `<a href="${l.href}">${esc(l.anchor)} →</a>`).join('');
  const L = EN
    ? { place: P.place || 'Geneva', faqTitle: 'Frequently asked questions', cta1: 'Start a project', cta1href: '/contact', cta2: 'See the work', cta2href: '/our-work' }
    : { place: P.place || 'Genève', faqTitle: 'Questions fréquentes', cta1: 'Démarrer un projet', cta1href: '/fr/contact', cta2: 'Voir les tarifs', cta2href: '/fr/tarifs' };
  const main = `
<section class="lp-hero">
  <div class="eyebrow"><span class="hr" aria-hidden="true"></span><span>${esc(c.kicker)}</span><span class="sep" aria-hidden="true"></span><b>${esc(L.place)}</b></div>
  <h1>${esc(c.h1)}</h1>
  <p class="lp-lede">${esc(c.lede)}</p>
  ${c.quotableOpener ? `<p class="lp-opener">${esc(c.quotableOpener)}</p>` : ''}
</section>
<div class="lp-body">
${sectionsHtml}
${P.priceBlock || ''}
  <section class="lp-sec">
    <h2>${esc(L.faqTitle)}</h2>
${faqHtml}
  </section>
  <section class="lp-sec">
    <div class="lp-cta">
      <a class="btn" href="${L.cta1href}"><span>${esc(L.cta1)}</span><span class="arr" aria-hidden="true"></span></a>
      <a class="btn" href="${L.cta2href}" style="opacity:.8"><span>${esc(L.cta2)}</span></a>
    </div>
    <p class="lp-hub">${hubHtml}</p>
  </section>
</div>`;
  // the footer lives inside <main> — preserve it when swapping the page body
  const footerHtml = $('main footer').first().length ? '\n' + $.html($('main footer').first()) : '';
  $('main').html(main + footerHtml);

  // schema: (Service|Article) + FAQPage + BreadcrumbList
  const primary = P.type === 'guide'
    ? { '@type': 'Article', headline: c.h1, description: c.metaDesc, inLanguage: EN ? 'en' : 'fr-CH', datePublished: '2026-07-19', dateModified: '2026-07-20', author: { '@type': 'Organization', '@id': O + '/#org' }, publisher: { '@id': O + '/#org' }, mainEntityOfPage: url }
    : { '@type': 'Service', name: c.h1, serviceType: P.serviceType || (EN ? 'Web design' : 'Création de site web'), areaServed: EN ? ['Geneva', 'Switzerland'] : ['Genève', 'Suisse romande'], provider: { '@id': O + '/#org' }, url };
  const faqLd = { '@type': 'FAQPage', mainEntity: c.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const crumbs = { '@type': 'BreadcrumbList', itemListElement: P.breadcrumb.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: O + b.path })) };
  // optional extra schema nodes (e.g. OfferCatalog on a pricing page)
  const graph = [primary, faqLd, crumbs].concat(P.extraSchema || []);
  $('head').append(`\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`);

  const outDir = EN ? ROOT : ROOT + '/fr' + (P.dir ? '/' + P.dir : '');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outDir + '/' + P.slug + '.html', $.html());
  console.log(`wrote ${EN ? '' : 'fr/'}${P.dir ? P.dir + '/' : ''}${P.slug}.html (${Math.round($.html().length / 1024)}KB · ${c.sections.length} sec · ${c.faq.length} FAQ · ${EN ? 'EN' : 'FR'}${altFr && altEn ? ' · hreflang paired' : ''})`);
}
