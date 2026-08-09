// Give new pages inbound equity by appending hub links on already-live pages.
// Idempotent: skips if the href is already present anywhere in the file.
import { load } from 'cheerio';
import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';

const EDITS = [
  // guide → regional pillar it naturally supports
  { file: 'fr/guides/combien-coute-site-web-suisse.html', hub: '.lp-hub', anchor: 'Agence web en Suisse romande', href: '/fr/agence-web-suisse-romande' },
  { file: 'fr/guides/prix-logo-identite-visuelle-suisse.html', hub: '.lp-hub', anchor: 'Agence de branding en Suisse', href: '/fr/agence-branding-suisse' },
  // Geneva landers → their regional counterpart (city page points up to region)
  { file: 'fr/creation-site-web-geneve.html', hub: '.lp-hub', anchor: 'Agence web en Suisse romande', href: '/fr/agence-web-suisse-romande' },
  // Geneva branding service page → national branding pillar (band hub)
  { file: 'fr/agence-branding-geneve.html', hub: '.lp-seo-hub', anchor: 'Agence de branding en Suisse', href: '/fr/agence-branding-suisse' },
  // regional pillar → its city supporting pages (hub→spoke: makes the city pages part of a real
  // hierarchy rather than a flat doorway grid, and matches their 3-level breadcrumb)
  { file: 'fr/agence-web-suisse-romande.html', hub: '.lp-hub', anchor: 'Agence web à Fribourg (site bilingue FR/DE)', href: '/fr/agence-web-fribourg' },
  { file: 'fr/agence-web-suisse-romande.html', hub: '.lp-hub', anchor: 'Agence web à Neuchâtel (sites B2B industriels)', href: '/fr/agence-web-neuchatel' },
  { file: 'fr/agence-web-suisse-romande.html', hub: '.lp-hub', anchor: 'Agence web à Lausanne', href: '/fr/agence-web-lausanne' },
  { file: 'fr/agence-web-suisse-romande.html', hub: '.lp-hub', anchor: 'Sites web hôtellerie et restauration', href: '/fr/sites-web-hotellerie-restauration' },
  // live pages → the W8 guides (equity for the new content)
  { file: 'fr/creation-site-web-geneve.html', hub: '.lp-hub', anchor: 'Refonte de site web', href: '/fr/guides/refonte-site-web-suisse' },
  { file: 'fr/agence-web-suisse-romande.html', hub: '.lp-hub', anchor: 'Créer un site internet en Suisse', href: '/fr/guides/creer-un-site-internet-en-suisse' },
  { file: 'fr/guides/combien-coute-site-web-suisse.html', hub: '.lp-hub', anchor: 'Wix ou site sur mesure', href: '/fr/guides/wix-ou-site-sur-mesure' },
  // second inbound for the thin supporting pages — each from a TOPICALLY-related non-sibling page
  // (never city→city; that would recreate the doorway grid the audit flagged)
  { file: 'fr/agence-branding-suisse.html', hub: '.lp-hub', anchor: 'Agence web à Lausanne', href: '/fr/agence-web-lausanne' },        // Il Duca (its case study) is a Lausanne project
  { file: 'fr/agence-web-lausanne.html', hub: '.lp-hub', anchor: 'Sites web hôtellerie et restauration', href: '/fr/sites-web-hotellerie-restauration' }, // Il Duca is a food business → hospitality sector
  { file: 'fr/guides/wix-ou-site-sur-mesure.html', hub: '.lp-hub', anchor: 'Agence web à Neuchâtel (sites B2B industriels)', href: '/fr/agence-web-neuchatel' }, // B2B industrial = classic outgrows-a-template case
  // 2026-08-09: the logo-pricing guide is the site's best-ranking non-brand page (pos ~17 on
  // "prix logo suisse") but had only 3 FR inbound links, while the Geneva lander has 23. These two
  // sources are the most topical non-siblings available: both are pricing pages whose readers are
  // pricing an adjacent deliverable.
  // anchors lowercased to match the existing hub style on both source pages ("prix d'un site web à Genève →")
  { file: 'fr/creation-site-web-geneve.html', hub: '.lp-hub', anchor: "prix d'un logo et d'une identité visuelle", href: '/fr/guides/prix-logo-identite-visuelle-suisse' },
  { file: 'fr/guides/prix-site-web-geneve.html', hub: '.lp-hub', anchor: "prix d'un logo en Suisse", href: '/fr/guides/prix-logo-identite-visuelle-suisse' },
];

for (const e of EDITS) {
  const path = ROOT + '/' + e.file;
  if (!fs.existsSync(path)) { console.log(`- skip (missing): ${e.file}`); continue; }
  const html = fs.readFileSync(path, 'utf8');
  if (html.includes(`href="${e.href}"`)) { console.log(`= already linked: ${e.file} → ${e.href}`); continue; }
  const $ = load(html, { decodeEntities: false });
  const hub = $(e.hub).first();
  if (!hub.length) { console.log(`! no ${e.hub} in ${e.file}`); continue; }
  hub.append(`<a href="${e.href}">${e.anchor} →</a>`);
  fs.writeFileSync(path, $.html());
  console.log(`✓ ${e.file} → ${e.href}`);
}
