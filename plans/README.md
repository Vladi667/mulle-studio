# Motion audit — `improve-animations`

Audited at `e79f1f1`. Applied in `6be1688` on branch `motion-pass`.
Bar: Emil Kowalski's animation playbook (`~/.claude/skills/improve-animations/AUDIT.md`).

## What was already right

Worth recording, because it narrows what the pass had to touch:

- `--ease-out: cubic-bezier(.22,1,.36,1)` is a strong quint. `--ease-inout: cubic-bezier(.65,0,.35,1)` is fine. No token work needed on curves.
- **No `ease-in` on UI anywhere.** No `transition: all` anywhere.
- Reduced motion is checked in 11 JS sites and 9 CSS sites — the coverage was there, only the policy was wrong (see #4).
- Press feedback exists (`:active` scale on `.index-link`, `.xlink`, `.case-head`, `.sf-social a`).
- The JS motion system is correctly gated on `(hover:hover) and (pointer:fine)` (`mulle.js:9`).

The problem was almost entirely **duration**.

## Applied

| # | Sev | What | Where |
| --- | --- | --- | --- |
| 2 | HIGH | Hover band was 480–700ms. Now `--dur-hover: 220ms` for interface, `--dur-media: 300ms` for large image/video scale. Replaced 8 hand-typed off-scale values (`.3s .35s .4s .45s .5s .55s .6s .7s`) | `mulle.css` throughout |
| 4 | HIGH | Reduced motion no longer nukes every transition. Movement snaps; opacity/colour/shadow keep a 150ms transition. The old blanket `!important` rule was also silently overriding the hand-written `.lb-stage` exception one block above it | `mulle.css` reduced-motion block |
| 5 | MED | Hover transforms neutralised behind `(hover:none),(pointer:coarse)`. iOS Safari applies `:hover` on tap and leaves it stuck until you tap elsewhere — `.wk-frame` lift, `.wk-img` scale, `.pkg` lift and the rest all stuck | `mulle.css` touch block |
| 6 | MED | `.menu li a` animated `padding-left` (layout) → `transform: translateX()` | `mulle.css` |
| 7 | LOW | Duration tokens extended and routed through | `mulle.css:31` |

## Applied, but dead code — no visible effect

Verified after the fact: `.plate-visual`, `.case-plate` and `.case-detail` appear in **no** HTML file, are not injected by `mulle.js` (only queried), and no build script in `scripts/` emits them. They are leftovers from an earlier version of the site. The findings are real defects in the source; they just don't render.

| # | Sev as filed | What | Status |
| --- | --- | --- | --- |
| 1 | HIGH | Cursor tilt: CSS `transition: transform .35s` retargeting against a per-frame `style.transform` write, plus `getBoundingClientRect()` on every `pointermove`. Now 120ms linear floor + rect cached on enter + rAF-batched write | fixed, inert |
| 3 | HIGH | `.case-detail { transition: height 480ms }` fighting `gsap.to(…, {height:0})` | fixed, inert |

Both fixes are kept — if that markup ever returns, it returns correct. But **neither is why the preview feels different.**

## Not applied

| # | Sev | What | Why deferred |
| --- | --- | --- | --- |
| 8 | LOW | `.sdot i { transform: scale(0) }` — a dot appearing from nothing | 10px element; invisible either way |
| — | — | `.sdot` 500ms scroll-progress transition | Lags scroll, but it is state indication, not hover. Wanted a feel-check before touching |
| — | — | Cross-document `@view-transition` on the EN↔FR toggle | Genuine seam (hard reload, no transition) but it is a new capability, not a fix. Separate decision |
| — | — | `.case-detail` content fade behind the height | Dead markup |

## Feel-check list for the preview

Desktop, real pointer:

1. Hover a work card on `/our-work` — lift and image scale should now land, not glide.
2. Open the index menu, sweep the rows — the row shift should feel attached to the cursor.
3. Hover the primary CTA — the fill should arrive at ~220ms instead of ~480ms.

Then toggle **Settings → Accessibility → Display → Reduce motion** and reload: things should stop *moving* but still *fade*. Before this pass, everything went instant and flat.

On a phone: tap a work card and then tap empty space — nothing should stay lifted.
