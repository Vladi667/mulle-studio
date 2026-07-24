// Inline price estimator — the recon found no ranking competitor has one.
// It is HONEST: it sums Fritz's own PUBLISHED, SEPARATE engagement prices. Invents nothing.
//   Brand identity CHF 1'500 · Brochure site CHF 1'700 · E-commerce CHF 2'500  (separate purchases)
// Straight apostrophe in amounts, to match the rest of the site.
import { load } from 'cheerio';
import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';

const CSS = `<style id="est-css">
.est{border-top:1px solid var(--hairline);padding:clamp(40px,6vh,72px) var(--margin)}
.est-in{max-width:640px;margin:0 auto}
.est .eyebrow{margin:0 0 16px}
.est h2{font-size:clamp(21px,2.4vw,30px);letter-spacing:-.015em;margin:0 0 10px}
.est-lede{color:var(--txt-70);line-height:1.6;margin:0 0 26px;max-width:56ch}
.est fieldset{border:0;margin:0 0 6px;padding:0}
.est legend{font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--txt-55);margin:0 0 10px;padding:0}
.est-opt{display:flex;align-items:center;gap:14px;padding:13px 16px;border:1px solid var(--hairline);border-radius:10px;margin-bottom:8px;cursor:pointer;transition:border-color .15s ease,background .15s ease}
.est-opt:hover{border-color:var(--hairline-2)}
.est-opt:has(input:checked){border-color:var(--blue);background:rgba(0,113,227,.045)}
.est-opt input{accent-color:var(--blue);width:18px;height:18px;flex:none;margin:0}
.est-opt .lbl{flex:1;display:flex;flex-direction:column;gap:2px}
.est-opt .lbl b{font-weight:600;font-size:15px}
.est-opt .lbl span{color:var(--txt-55);font-size:12.5px;line-height:1.35}
.est-opt .amt{font-family:'Geist Mono',ui-monospace,monospace;font-size:13.5px;color:var(--txt-70);white-space:nowrap}
.est-total{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin:24px 0 6px;padding-top:20px;border-top:1px solid var(--hairline)}
.est-total .t-lbl{font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-55)}
.est-total .t-val{font-size:clamp(24px,4vw,34px);font-weight:600;letter-spacing:-.02em;text-align:right}
.est-total .t-val em{font-style:normal;color:var(--txt-55);font-size:13px;font-weight:400;margin-left:8px;white-space:nowrap}
.est-note{color:var(--txt-55);font-size:13px;line-height:1.55;margin:8px 0 0}
.est-cta{display:inline-flex;align-items:center;gap:8px;color:var(--blue);text-decoration:none;font-weight:500;font-size:15px;margin-top:22px}
.est-cta:hover{text-decoration:underline}
.est-cta[aria-disabled=true]{opacity:.38;pointer-events:none}
</style>`;

function block(lang) {
  const T = lang === 'en' ? {
    eyebrow: 'Estimator', h2: 'Estimate your project',
    lede: "The engagements are published and separate. Pick what you need, the total adds up, paid once.",
    legend: 'Brand identity', siteLeg: 'Website',
    identity: ['Brand identity', 'Logo, palette, typography, source files', "CHF 1'500"],
    none: 'No website', vitrine: ['Brochure site', 'Custom design, CMS, mobile-first', "CHF 1'700"], ecom: ['E-commerce', 'Shop, checkout, order handling', "CHF 2'500"],
    totalLbl: 'Project total', once: 'paid once', empty: 'Select at least one engagement.',
    note: 'Ongoing marketing or growth ops is a separate, monthly engagement, from CHF 490 per month.',
    cta: 'Get a free quote for this scope', href: '/contact',
  } : {
    eyebrow: 'Estimateur', h2: 'Estimez votre projet',
    lede: "Les prestations sont publiées et distinctes. Choisissez ce dont vous avez besoin, le total s'additionne, en paiement unique.",
    legend: 'Identité', siteLeg: 'Site web',
    identity: ['Identité de marque', 'Logo, palette, typographies, fichiers sources', "CHF 1'500"],
    none: 'Pas de site', vitrine: ['Site vitrine', 'Design sur-mesure, CMS, mobile-first', "CHF 1'700"], ecom: ['Site e-commerce', 'Boutique, paiement, commandes', "CHF 2'500"],
    totalLbl: 'Total du projet', once: 'paiement unique', empty: 'Sélectionnez au moins une prestation.',
    note: "Accompagnement marketing ou growth ops en option, prestation mensuelle distincte, dès CHF 490 par mois.",
    cta: 'Obtenir un devis gratuit pour ce périmètre', href: '/fr/contact',
  };
  return `
    <section class="est" id="price-estimator" aria-labelledby="est-h2">
      <div class="est-in">
        <div class="eyebrow"><span class="hr" aria-hidden="true"></span><span>${T.eyebrow}</span></div>
        <h2 id="est-h2">${T.h2}</h2>
        <p class="est-lede">${T.lede}</p>
        <fieldset>
          <legend>${T.legend}</legend>
          <label class="est-opt"><input type="checkbox" data-price="1500" name="est-identity"><span class="lbl"><b>${T.identity[0]}</b><span>${T.identity[1]}</span></span><span class="amt">${T.identity[2]}</span></label>
        </fieldset>
        <fieldset>
          <legend>${T.siteLeg}</legend>
          <label class="est-opt"><input type="radio" name="est-site" data-price="1700" checked><span class="lbl"><b>${T.vitrine[0]}</b><span>${T.vitrine[1]}</span></span><span class="amt">${T.vitrine[2]}</span></label>
          <label class="est-opt"><input type="radio" name="est-site" data-price="2500"><span class="lbl"><b>${T.ecom[0]}</b><span>${T.ecom[1]}</span></span><span class="amt">${T.ecom[2]}</span></label>
          <label class="est-opt"><input type="radio" name="est-site" data-price="0"><span class="lbl"><b>${T.none}</b></span><span class="amt"></span></label>
        </fieldset>
        <div class="est-total"><span class="t-lbl">${T.totalLbl}</span><span class="t-val" id="est-total" aria-live="polite" role="status"></span></div>
        <p class="est-note" id="est-empty" hidden>${T.empty}</p>
        <p class="est-note">${T.note}</p>
        <a class="est-cta" href="${T.href}" id="est-cta"><span>${T.cta}</span><span aria-hidden="true">&rarr;</span></a>
      </div>
      <script>(function(){
        var r=document.getElementById('price-estimator'); if(!r) return;
        var out=r.querySelector('#est-total'), empty=r.querySelector('#est-empty'), cta=r.querySelector('#est-cta');
        var once=${JSON.stringify(T.once)};
        function fmt(n){return "CHF "+String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,"'");}
        function calc(){
          var t=0;
          r.querySelectorAll('input:checked').forEach(function(i){t+=parseInt(i.getAttribute('data-price'),10)||0;});
          if(t===0){ out.textContent='\\u2014'; empty.hidden=false; cta.setAttribute('aria-disabled','true'); }
          else { out.innerHTML=fmt(t)+' <em>'+once+'</em>'; empty.hidden=true; cta.removeAttribute('aria-disabled'); }
        }
        r.addEventListener('change',calc); calc();
      })();</script>
    </section>`;
}

const TARGETS = [
  { file: 'fr/guides/prix-site-web-geneve.html', lang: 'fr' },
  { file: 'fr/tarifs.html', lang: 'fr' },
  { file: 'pricing.html', lang: 'en' },
];

for (const { file, lang } of TARGETS) {
  const path = ROOT + '/' + file;
  if (!fs.existsSync(path)) { console.log(`- skip (missing): ${file}`); continue; }
  const $ = load(fs.readFileSync(path, 'utf8'), { decodeEntities: false });
  // idempotent
  $('#price-estimator').remove();
  $('#est-css').remove();
  $('head').append('\n' + CSS);
  // insert before the FAQ section: match by heading text or aria-label, else before footer
  let anchor = $('section').filter((i, el) => {
    const h = $(el).find('h2').first().text().toLowerCase();
    const al = ($(el).attr('aria-label') || '').toLowerCase();
    return /questions fréquentes|frequently asked|faq/.test(h) || /fréquentes|faq/.test(al);
  }).first();
  if (!anchor.length) anchor = $('main footer').first();
  if (anchor.length) { anchor.before(block(lang)); }
  else { console.log(`! no anchor in ${file}`); continue; }
  fs.writeFileSync(path, $.html());
  const words = $('#price-estimator').text().replace(/\s+/g, ' ').trim().length;
  console.log(`✓ ${file} (${lang}) — estimator injected before "${anchor.find('h2').first().text() || anchor.attr('aria-label') || 'footer'}"`);
}
