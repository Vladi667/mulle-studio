/* ─────────────────────────────────────────────────────────────────
   optimise-images.mjs — smaller pixels, identical design
   ─────────────────────────────────────────────────────────────────
   Lighthouse on the homepage: 542 KiB wasted on images served far
   larger than they are displayed, and 276 KiB more on serving JPEG and
   PNG where WebP would do. The posters are 1600px wide and drawn into
   cards a few hundred pixels across.

   This writes a WebP beside every poster and logo and rewrites the
   markup to a <picture> that prefers it, keeping the original as the
   fallback. Nothing about the design changes: same file, same crop,
   same position. If a browser cannot take WebP it gets exactly what it
   gets today.

     node scripts/seo/optimise-images.mjs            # convert + rewrite
     node scripts/seo/optimise-images.mjs --check    # report only
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const CHECK = process.argv.includes('--check');
const kb = (n) => Math.round(n / 1024);

/* Posters are displayed at card width. 1200px covers a 2x retina card without
   carrying a full-bleed original around. */
const TARGETS = [
  { dir: 'assets/work', match: /-poster\.jpg$/, width: 1200, quality: 74 },
  { dir: 'assets/logos', match: /\.png$/, width: 400, quality: 80 },
];

let saved = 0, made = 0;
const converted = [];

for (const { dir, match, width, quality } of TARGETS) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  for (const file of readdirSync(abs)) {
    if (!match.test(file)) continue;
    const src = join(abs, file);
    const out = src.replace(/\.(jpg|png)$/, '.webp');
    const before = statSync(src).size;

    if (!CHECK) {
      const img = sharp(src);
      const meta = await img.metadata();
      await img
        .resize({ width: Math.min(width, meta.width || width), withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toFile(out);
    }
    if (!existsSync(out)) continue;
    const after = statSync(out).size;
    saved += before - after;
    made++;
    converted.push({ web: `${dir}/${file}`, webp: `${dir}/${file}`.replace(/\.(jpg|png)$/, '.webp'), before, after });
    console.log(`  ${dir}/${file.padEnd(38)} ${String(kb(before)).padStart(4)}KB -> ${String(kb(after)).padStart(4)}KB webp`);
  }
}

console.log(`\n${made} image(s), ${kb(saved)}KB saved in total`);

/* ── rewrite the markup: <img src="…jpg"> becomes a <picture> ── */
if (!CHECK) {
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'))
    .concat(readdirSync(join(ROOT, 'fr')).filter((f) => f.endsWith('.html')).map((f) => 'fr/' + f));

  let touched = 0;
  for (const page of pages) {
    const p = join(ROOT, page);
    let src = readFileSync(p, 'utf8');
    const before = src;

    // <img class="wd-poster" src="…-poster.jpg" alt="" loading="lazy">
    src = src.replace(
      /<img([^>]*?)src="((?:\/|assets\/)[^"]*?-poster)\.jpg"([^>]*?)>/g,
      (m, pre, base, post) => {
        if (m.includes('.webp')) return m;
        return `<picture><source srcset="${base}.webp" type="image/webp"><img${pre}src="${base}.jpg"${post}></picture>`;
      },
    );

    // hero marks
    src = src.replace(
      /<img src="((?:\/|)assets\/logos\/[^"]+)\.png" alt="([^"]*)">/g,
      (m, base, alt) => `<picture><source srcset="${base}.webp" type="image/webp"><img src="${base}.png" alt="${alt}"></picture>`,
    );

    if (src !== before) { writeFileSync(p, src); touched++; console.log(`  rewrote ${page}`); }
  }
  console.log(`${touched} page(s) now prefer WebP`);
}
