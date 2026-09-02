# Brand marks in the hero band

## What these are, and what they are not

These marks are **freelance work by the studio's founder, predating Fritz**.
They are **not** Agence Fritz client mandates. Fritz has no client work.

Until 2 September 2026 the homepage showed six of them under the label
"Trusted by", and the French homepage under "Ils nous font confiance" — which
states outright that the agency is the trusted party. Neither was true. Under
Swiss unfair-competition law that is an inaccurate statement about one's own
business (LCD art. 3 al. 1 let. b), and it contradicted `llms.txt`, which tells
AI crawlers the studio's work is self-initiated concept work.

## Which marks may be shown

| Mark | Shown | Why |
|---|---|---|
| Deloitte | yes | presented as a client on theomuller.com |
| Clarins | yes | presented as a client on theomuller.com |
| Puig | yes | presented as a client on theomuller.com |
| BCG | **no** | appears only in an unlabelled carousel; unconfirmed |
| Brunello Cucinelli | **no** | appears only in an unlabelled carousel; unconfirmed |
| DSM-Firmenich | **no** | appears only in an unlabelled carousel; unconfirmed |
| Mandarin Oriental | **no** | appeared only in hero generators; no evidence anywhere |
| every other file here | **no** | unused; kept only as source material |

To restore one of the withheld marks, the founder must confirm it individually:
a **direct** freelance engagement for that brand, not work delivered through an
agency that served it, and the year it happened. Then add it back here with the
confirmation recorded in this table.

## Rules

- The caption must stay legible. It sits at 11.5px in `.ht-lbl`; it was 9.5px at
  40% opacity, which is decoration, and a hairline disclaimer under a row of
  logos still reads as a client list.
- Never write "Trusted by", "Ils nous font confiance", "clients" or "client list"
  over these marks — in a page, a generator, a comment, an alt attribute or a
  profile text.
- `scripts/seo/verify-live.mjs` fails the build if any of that wording returns.
