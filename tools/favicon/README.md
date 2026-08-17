# Favicon

The icon is the wordmark's own lowercase `f`, cut from the same `PATH_D` the hero draws
(`assets/mulle-machined.js`), at **two optical sizes** rather than one artwork scaled:

- **Display master** (`apple-touch-icon.png` 180, `icon-192/512.png`): the exact wordmark `f`,
  cut free of the `r` at the hook's terminal, glyph at 0.60 of the tile, shifted 9 units down
  so its top-heavy mass sits centred. Opaque RGB squares — iOS applies its own mask.
- **Small masters** (`favicon.svg`, and `favicon.ico` at 16 / 32 / 48): the same `f` redrawn on
  a 16-, 32- and 48-pixel grid so every straight edge lands on whole pixels. Proportions
  converge on the mark as the grid allows (hook reach 2.0 → 1.75 → 1.50 strokes vs 1.36).
  The SVG is the 16 grid: an SVG cannot see the device DPR, and 1× crispness matters most;
  it is exact 2× at Retina. Dark colour scheme adds a hairline keyline so the ink tile does
  not vanish on dark tab strips (Chromium honours `prefers-color-scheme` inside SVG favicons;
  `min-resolution` it does not).

Tile is the site's dark-button material `#1D1D1F`, mark `#F5F5F7`, corner 22% (Apple's
continuous-corner proportion). Monochrome, like the wordmark — the site's blue is a
functional accent, not identity.

Regenerate (Python 3 + Pillow, Node + Playwright):

```
cd tools/favicon
python build.py      # writes the SVG masters
node make.js         # Chromium renders them at exact device pixels
python assemble.py   # ICO (BMP entries), opaque PNGs, manifest -> copied to the site root
```

Every page's `<head>` carries, in this order:
`favicon.ico` (32x32) · `favicon.svg` · `apple-touch-icon.png` · `site.webmanifest` · `theme-color`.
