# Mulle® Studio

Marketing site for Mulle — a Geneva studio for brand, web and growth systems.

Static site (HTML/CSS/JS), no build step. Liquid-mercury design system:
all-monospace type, WebGL fluid hero, Three.js liquid-metal scenes,
GSAP ScrollTrigger + Lenis motion.

## Structure
- `index.html` and the six section pages (`marketing`, `brand-web`, `growth-ops`, `about`, `our-work`, `contact`) + `404.html`
- `assets/` — `mulle.css`, `mulle.js` (Lenis + GSAP), `mulle-fluid.js` (WebGL hero), `mulle-three.js` (Three.js mercury), logos, fonts via Google Fonts CDN

## Run locally
Any static server, e.g. `npx http-server -p 4178 -c-1 .`

## Deploy
Static deploy on Vercel — no serverless functions, no env vars.

The contact form composes an email to `contact@agencefritz.com` (no backend required).
