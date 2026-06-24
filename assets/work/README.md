# Work media — drop your files here

The Work page (`our-work.html`) tiles look for real media in this folder.
Until a file exists, the tile gracefully falls back to its mercury placeholder
(no broken images), so the site is always safe to deploy.

## Wired projects (drop these in)

All four rows are wired. Each falls back to its mercury placeholder until the
file exists, so the site is always safe to deploy.

Images — **16:10** (e.g. 1600 × 1000), JPG preferred, < ~400 KB:

```
assets/work/cafe-plainpalais.jpg       (N° I  — Website)
assets/work/atelier-identity.jpg       (N° II — Brand Identity)
assets/work/eaux-vives-dashboard.jpg   (N° III — Growth dashboard)
```

Video — **16:9**, short (5–20 s), **muted**, loops, ~1080p low-bitrate, < ~5 MB:

```
assets/work/maker-campaign.mp4         (N° IV — Marketing video)
assets/work/maker-campaign-poster.jpg  (poster frame, 16:9)
```

The video autoplays muted on loop; the play glyph hides automatically once it plays.

## How it works

Tiles declare their media with `data-` attributes. A small loader in `mulle.js`
**preloads the file first and only injects it if it actually loads** — so a
missing file simply shows the mercury placeholder (never a broken icon). Drop the
file in, reload, and it appears. Video autoplays muted on loop and the play glyph
hides itself once it plays.

## Adding more tiles

Duplicate any `.wk-tile` block in `our-work.html` and set the data attribute on
its `.wk-canvas`:

- **Website:** keep the `.wk-bar` (browser frame); on the canvas add
  `data-img="assets/work/YOURFILE.jpg" data-alt="…"`.
- **Video:** on the canvas add
  `data-video="assets/work/YOURFILE.mp4" data-poster="assets/work/YOURFILE-poster.jpg"`
  and keep the `.wk-play` + `.wk-vtag` placeholder spans.
- **Image / identity:** add `data-img="assets/work/YOURFILE.jpg"` to the canvas.

Aspect-ratio helpers on `.wk-canvas`: `r-1610` (16:10), `r-169` (16:9), `r-45` (4:5).
Tile widths on `.wk-tile`: `span-4 / span-5 / span-6 / span-7 / span-8 / span-12`.
