# Favicon — Machined

The icon is the hero in miniature: the wordmark's own `f` — cut from the same `PATH_D` the
hero draws — as a **technical drawing** on a paper sheet, in the hero's material: paper
`#F5F5F7`, ink `#1D1D1F`, hairline rules, and the blue `#0071E3` crosshair on the drawing's
datum corner (stem-left at the top of the hook).

Every frame is **drawn for its size** — optical sizing, nothing scaled:

- **Tab sizes — the object.** `favicon.ico` carries five frames, one per size browsers actually
  request: 16 (1×), 20 (125%), 24 (150%), 32 (2×), 48 (3×). Each is a solid ink `f` on the
  paper sheet with its hairline frame and the crosshair, drawn on an integer grid so every
  straight edge is a whole pixel. (A 1px-outline *plan* was drawn at 32/48 too; low-passed to
  its physical size it reads grey and ghostly beside any solid favicon. The drawing is shown
  pressed-in at tab sizes — the hero's own plan → object idea.)
- **Home-screen sizes — also the object.** `apple-touch-icon.png` (180) and `icon-192/512.png`
  are the exact wordmark `f`, solid, with the crosshair and (on the touch icon) one dimension
  line under the `f` — the hero's "874 × 321". Square, opaque RGB on paper; the OS masks it.
  (The *plan* — a hairline outline — was drawn here first and looked beautiful at 180. But iOS
  Safari uses the touch icon for its **tab bar at 16pt** and its tab overview, and downscaled
  to 48 device px the outline was a ghost — 3.6% dark pixels, never reaching black. One file
  serves every iOS surface, so the tab bar decides. The plan lives in the hero.)

Why there is **no SVG favicon**: an SVG is one geometry for all sizes; browsers that see one
prefer it and would ignore the per-size frames. Browsers pick ICO frames by exact size.

Regenerate (Python 3 + Pillow, Node + Playwright):

```
cd tools/favicon
python machined.py   # writes the SVG masters (m-16 … m-512)
node make.js         # Chromium renders them at exact device pixels
python assemble.py   # 5-frame ICO (BMP entries), opaque PNGs, manifest → copied to the root
```

Every page's `<head>` carries, in this order:
`favicon.ico` (sizes 16 20 24 32 48) · `apple-touch-icon.png` · `site.webmanifest` · `theme-color`.
