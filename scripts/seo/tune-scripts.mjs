/* ─────────────────────────────────────────────────────────────────
   tune-scripts.mjs — load a library only where the page can use it
   ─────────────────────────────────────────────────────────────────
   Every page loads gsap, ScrollTrigger, SplitText and Lenis from a CDN.
   Measured on production (mobile, simulated throttling, 2026-09-06):
   homepage 75, /fr/tarifs 86, /fr/guides/prix-site-web-geneve 87. Two of
   the three already clear the target, so this is not a rewrite; it drops
   what is provably dead and shortens the connection to what is not.

   ── Which pages can use SplitText, and how that was established ──
   Not by guessing at the hero markup: the first version of this script
   assumed `.hero-eyeline` and `class="page-hero"` and was wrong three
   times over. `class="page-hero hero-cine"` (12 pages) did not match the
   exact-string test, and two whole call paths were missed. Every route
   into SplitText in assets/mulle.js:

     mulle.js:492  .hero-eyeline                    (homepage headline)
     mulle.js:522  .page-hero h1                    (inner-page headline)
     mulle.js:1961 any data-reveal on an H1–H3      -> revealHeading()
     mulle.js:1093 work rows with a canvas          -> revealHeading()
     mulle.js:1654 .disc-head h2                    -> revealHeading()
     mulle.js:1666 .works-head h2                   -> revealHeading()
     mulle.js:1709 .wd-title                        -> revealHeading()
     mulle.js:2206 .kine-head                       (kinetic headings)
     mulle.js:2067 .steps / .values cascade

   MARKERS below is that list, deliberately widened (bare `data-reveal`
   rather than data-reveal-on-a-heading, bare `page-hero` rather than an
   exact class) so the test errs toward keeping the plugin.

   Confirmed against the live site rather than against itself: SplitText
   tags its output `.split-line`, and on production /fr/guides/prix-site-
   web-geneve and /fr/creation-site-web-geneve render 0 of them while
   /about renders 22. The pages this script strips are pages where the
   plugin measurably does nothing.

   ── What is deliberately NOT removed ──
   gsap and ScrollTrigger drive the scroll progress bar on every page
   (`gsap.to('.progress i', { scrollTrigger: … })`, mulle.js:796), and
   Lenis only initialises when gsap is present (mulle.js:44). Dropping any
   of them would take the progress bar and the smooth scroll with it —
   a change to how the site feels, not a performance fix, and the owner's
   call rather than a side effect of this script.

   preconnect: the libraries come from cdn.jsdelivr.net with none, so every
   page pays DNS, TCP and TLS on the critical path before their first byte.

     node scripts/seo/tune-scripts.mjs
     node scripts/seo/tune-scripts.mjs --check
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const CHECK = process.argv.includes('--check');

const SPLITTEXT = /\n?[ \t]*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[\d.]+\/dist\/SplitText\.min\.js" defer(?:="")?><\/script>/g;
const PRECONNECT = '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>';

/* every marker that can reach a SplitText call — see the header */
const MARKERS = /hero-eyeline|page-hero|data-reveal|kine-head|disc-head|works-head|wd-title|class="steps"|class="values"|wk-canvas/;
const needsSplit = (src) => MARKERS.test(src);

const files = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

let removed = 0, kept = 0, preconnected = 0;
const problems = [], stripped = [];

for (const file of files) {
  const path = `${ROOT}/${file}`;
  let src = readFileSync(path, 'utf8');
  const before = src;

  if (/cdn\.jsdelivr\.net\/npm\/(gsap|lenis)/.test(src)) {
    if (!src.includes('preconnect" href="https://cdn.jsdelivr.net"')) {
      const i = src.indexOf('<link rel="preconnect" href="https://fonts.gstatic.com"');
      if (i < 0) problems.push(`${file}: no font preconnect to anchor to`);
      else {
        const end = src.indexOf('>', i) + 1;
        src = src.slice(0, end) + '\n' + PRECONNECT + src.slice(end);
        preconnected++;
      }
    }
    if (needsSplit(src)) kept++;
    else if (SPLITTEXT.test(src)) { src = src.replace(SPLITTEXT, ''); removed++; stripped.push(file); }
  }

  /* The repo stores LF (core.autocrlf=true normalises on commit), but git checks
     these files out as CRLF. Writing that back verbatim leaves the content right
     and the diff unreadable: a two-line edit lands as a 500-line rewrite, because
     every other line differs by a carriage return. Normalise on the way out, the
     way the rest of the generator chain already does. */
  if (src !== before && !CHECK) writeFileSync(path, src.replace(/\r\n/g, '\n'));
}

console.log(`${CHECK ? 'would change' : 'changed'} — SplitText removed from ${removed} page(s), kept on ${kept}, preconnect added to ${preconnected}`);
for (const p of problems) console.log('   PROBLEM', p);
if (stripped.length) console.log('   stripped:', stripped.join(' '));

/* ── verification ──────────────────────────────────────────────────
   The marker test cannot check itself, so this asserts the outcome
   against facts held independently of it: pages known to split must
   still load the plugin, gsap/ScrollTrigger/Lenis must be untouched
   everywhere, and each page must end up with exactly one preconnect. */
const MUST_KEEP = ['index.html', 'fr/index.html', 'about.html', 'fr/a-propos.html',
                   'contact.html', 'our-work.html', 'fr/tarifs.html', 'privacy.html'];
let bad = problems.length;

for (const file of MUST_KEEP) {
  if (!/SplitText\.min\.js/.test(readFileSync(`${ROOT}/${file}`, 'utf8'))) {
    console.log(`   FAIL ${file} splits text on the live site and must keep the plugin`); bad++;
  }
}
for (const file of files) {
  const s = readFileSync(`${ROOT}/${file}`, 'utf8');
  if (needsSplit(s) && !/SplitText\.min\.js/.test(s) && /cdn\.jsdelivr\.net/.test(s)) {
    console.log(`   FAIL ${file} has a split target but no plugin`); bad++;
  }
  if (/cdn\.jsdelivr\.net\/npm\/(gsap|lenis)/.test(s)) {
    const n = (s.match(/preconnect" href="https:\/\/cdn\.jsdelivr\.net"/g) || []).length;
    if (n !== 1) { console.log(`   FAIL ${file} has ${n} jsdelivr preconnect(s)`); bad++; }
    if (!/dist\/gsap\.min\.js/.test(s) || !/dist\/ScrollTrigger\.min\.js/.test(s) || !/lenis@1/.test(s)) {
      console.log(`   FAIL ${file} lost gsap, ScrollTrigger or Lenis`); bad++;
    }
  }
}
if (bad) { console.log(`VERIFY FAILED (${bad})`); process.exitCode = 1; }
else console.log('verified: SplitText only where a target exists; gsap, ScrollTrigger and Lenis untouched everywhere');
