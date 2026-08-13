// SINGLE SOURCE OF TRUTH for every published Fritz price.
//
// WHY THIS EXISTS: prices used to be hardcoded in ~20 build files. When the three one-off
// builds were cut by CHF 300 (commit ad076e6), the change was applied to the generated HTML
// but NOT to the generators — so every builder still emitted 1'500 / 1'700 / 2'500 and would
// silently revert the live site (and make the price estimator quote amounts we do not charge).
//
// RULE: never hardcode a Fritz price in a builder again. Import it from here.
// When a price changes, change it HERE and re-run the affected builders.
//
// NOTE ON MARKET FIGURES: observed market ranges (e.g. "CHF 500 à 1'500" for a logo alone,
// "CHF 1'500 à 4'000" for the romande market) are NOT Fritz prices and must not be sourced
// from this file. They are editorial content and live in the w*-data.json content files.

export const PRICES = {
  // one-off engagements — three SEPARATE purchases, never a cumulative ladder
  identity: 500,
  vitrine: 1300,
  ecommerce: 2100,
  // monthly programmes — these DO legitimately ladder
  marketing: { starter: 390, engine: 790, growth: 1290 },
  growthOps: { signal: 390, compound: 1190, enterprise: 2800 },
};

// COLLISION WARNING for anyone editing price copy from here on:
// CHF 500 is now BOTH Fritz's identity price AND the published floor of the observed
// logo-alone market range ("CHF 500 à CHF 1'500"). CHF 1'200 is no longer a Fritz price
// at all, but it IS the floor of the observed full-identity range ("CHF 1'200 à 3'500").
// Never substitute either figure globally — classify each occurrence as OFFER or MARKET
// first. Market ranges are editorial facts and must not move when a price changes.

// 1200 -> "1'200"  ·  490 -> "490"   (Swiss straight-apostrophe grouping; never a curly quote)
export const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");

// 1200 -> "CHF 1'200"
export const CHF = n => 'CHF ' + group(n);
