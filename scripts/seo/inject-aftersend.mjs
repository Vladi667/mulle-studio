/* ─────────────────────────────────────────────────────────────────
   inject-aftersend.mjs — say what happens after someone writes
   ─────────────────────────────────────────────────────────────────
   The form asked for a name, an email and a note, and then said nothing
   about what follows. With no phone number published, no address and no
   named person, a stranger is being asked to send a message into a void
   and hope. Three lines cost nothing and remove the doubt.

   Idempotent and marker-delimited, like the other injectors. Run it
   after any rebuild of the contact pages, before inject-analytics.

     node scripts/seo/inject-aftersend.mjs
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const START = '<!-- after-send: injected by scripts/seo/inject-aftersend.mjs -->';
const END = '<!-- /after-send -->';

const CSS_ID = 'aftersend-css';
const CSS = `<style id="${CSS_ID}">
/* Deliberately flat. Two earlier attempts used a grid with a counter column and
   both collapsed: li was a grid container, so each inline part of the sentence
   became its own cell and the text wrapped a word at a time inside a 26px
   column. Paragraphs cannot do that. The step number is a styled span in the
   normal text flow, not a grid track. */
.aftersend{margin-top:26px;padding-top:20px;border-top:1px solid var(--hairline)}
.aftersend h4{font-family:var(--mono);font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--txt-40);margin:0 0 14px;font-weight:400}
.aftersend .as-t{margin:0 0 10px;font-size:13.5px;line-height:1.6;color:var(--txt-70);max-width:52ch}
.aftersend .as-t:last-child{margin-bottom:0}
.aftersend .as-n{font-family:var(--mono);font-size:10.5px;color:var(--txt-40);margin-right:9px}
.aftersend .as-k{color:var(--txt);font-weight:500}
</style>`;

const COPY = {
  en: {
    head: 'What happens next',
    steps: [
      '<span class="as-k">A reply within 24 hours.</span> From the person who will do the work, not an autoresponder.',
      '<span class="as-k">A 20-minute call</span> if you want one, to hear what you are actually trying to build.',
      '<span class="as-k">A written quote at the published price.</span> No discovery fee, no obligation to continue.',
    ],
  },
  fr: {
    head: 'Ce qui se passe ensuite',
    steps: [
      '<span class="as-k">Une réponse sous 24 heures.</span> De la personne qui réalisera le travail, pas d\'un répondeur automatique.',
      '<span class="as-k">Un appel de 20 minutes</span> si vous le souhaitez, pour comprendre ce que vous cherchez vraiment à construire.',
      '<span class="as-k">Un devis écrit au prix publié.</span> Pas de frais de cadrage, aucun engagement à poursuivre.',
    ],
  },
};

const PAGES = [
  { file: 'contact.html', lang: 'en' },
  { file: 'fr/contact.html', lang: 'fr' },
];

let changed = 0;
for (const { file, lang } of PAGES) {
  const path = `${ROOT}/${file}`;
  let src = readFileSync(path, 'utf8');
  const before = src;
  const c = COPY[lang];

  const block = [
    START,
    '        <div class="aftersend">',
    `          <h4>${c.head}</h4>`,
    ...c.steps.map((s, i) => `          <p class="as-t"><span class="as-n">0${i + 1}</span>${s}</p>`),
    '        </div>',
    END,
  ].join('\n');

  /* Remove any previous injection, then place the block AFTER the form closes.
     Inside the form, its layout kept squeezing the block into a ~157px column;
     fighting a layout that exists to arrange input fields is not worth it for
     three sentences whose only job is to be read. */
  src = src.replace(new RegExp(`\\n?\\s*${START}[\\s\\S]*?${END}`, 'g'), '');
  const close = src.indexOf('</form>');
  if (close < 0) { console.log(`   no </form> in ${file}, skipped`); continue; }
  const anchor = close + '</form>'.length;
  src = src.slice(0, anchor) + '\n' + block + src.slice(anchor);

  /* Replace the style block rather than only adding it when absent. Adding it
     once meant a later fix to the CSS never reached a page that already had the
     old block: the markup refreshed, the styles did not, and the page kept
     rendering with a rule the source no longer contained. */
  src = src.replace(new RegExp(`\\n?<style id="${CSS_ID}">[\\s\\S]*?<\\/style>`, 'g'), '');
  src = src.replace('</head>', `${CSS}\n</head>`);

  if (src !== before) { writeFileSync(path, src); changed++; }
  console.log(`  ${file}: ${src !== before ? 'injected' : 'already current'}`);
}

// verification
let bad = 0;
for (const { file, lang } of PAGES) {
  const s = readFileSync(`${ROOT}/${file}`, 'utf8');
  const n = (s.match(new RegExp(START, 'g')) || []).length;
  if (n !== 1) { console.log(`   FAIL ${file} has ${n} blocks`); bad++; }
  if (!s.includes(COPY[lang].head)) { console.log(`   FAIL ${file} missing the ${lang} heading`); bad++; }
  if (s.indexOf(START) < s.indexOf('</form>')) { console.log(`   FAIL ${file} block sits inside the form`); bad++; }
  if ((s.match(new RegExp(`id="${CSS_ID}"`, 'g')) || []).length !== 1) { console.log(`   FAIL ${file} style block count`); bad++; }
}
console.log(bad ? `VERIFY FAILED (${bad})` : `verified: both contact pages explain what happens after sending`);
if (bad) process.exitCode = 1;
