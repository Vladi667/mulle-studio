# Carousel logos — drop your files here

The "Trusted by" carousel shows brand **names as text** until a matching logo
file exists in this folder, then it swaps the name for the logo automatically.
The logo is rendered as a **monochrome graphite silhouette** to match the site
(via a CSS `brightness(0)` filter) — so the source files must be **transparent**
(transparent SVG preferred, or transparent PNG/WebP). Colour/background is
irrelevant; only the shape (alpha) is used.

Filenames are derived from the brand name (lowercase, accents stripped, spaces →
hyphens). Drop any of these (the loader tries `.svg`, then `.png`, then `.webp`):

```
assets/logos/bcg.svg
assets/logos/brunello-cucinelli.svg
assets/logos/clarins.svg
assets/logos/credit-agricole.svg
assets/logos/deloitte.svg
assets/logos/dsm-firmenich.svg
assets/logos/dyn-group.svg
assets/logos/mandarin-oriental.svg
assets/logos/next-bank.svg
assets/logos/puig.svg
assets/logos/roof.svg
assets/logos/saunier-duval.svg
```

Tips:
- **Transparent SVG** is best (crisp at any size, tiny file).
- Each logo should be the **wordmark or mark on a transparent background**, trimmed tight.
- No file = the brand simply stays as its text name (safe to deploy anytime).
- To add a brand not listed, just add its `.mq-item` text to the carousel and drop `assets/logos/<slugified-name>.svg`.
