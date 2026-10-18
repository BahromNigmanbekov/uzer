# Selected catalog import — 2026-10-19

Source: https://blackstop.in/products.json?limit=250. Exact title matching selected 20 products; no fuzzy replacement by a similarly named shirt/crop top. The source product page URL is stored on each API record. Existing API records are preserved.

Run `node scripts/import-blackstop-selection.mjs` to prepare and validate; add `--write` to create missing selected records. Stable source IDs prevent duplicate imports. Artifacts contain the source snapshot, prepared payloads, image checks, before/after API backups, import results and a visual contact sheet.

## Inventory and options

The owner requested two units per size. Each source size therefore has quantity 2, and total stock is the sum of size quantities. Fits share that size quantity, matching the current shop inventory model. These are owner-specified quantities, not the source shop's stock. Source availability is retained separately as `sourceVariants`.

Only fits actually offered on the source are enabled. Source option combinations are retained for reference; the storefront currently exposes the union of sizes for both fits. For example, a source XS may be Oversize only. The owner should confirm size/fit availability before fulfilling an order; this schema does not track stock separately for every size/fit pair.

Images remain the source CDN URLs, in source order. All 104 unique URLs returned successful image responses at import time. The contact sheet was visually inspected: `I'm So Poor B T-shirt` is blue, despite its ambiguous name; `Emotionally Available R` is white with a red print. Basic Black's source variant incorrectly says White; its name and photos establish black.

## Recommended retail prices

These are positioning estimates in UZS, not calculated landed costs or guaranteed margins. API `price` uses thousands of UZS because the existing app multiplies it by 1000. E.g. 239 means 239,000 UZS. Metadata stores the full UZS amount and review date.

Observed comparison points:

- [OZBE official catalog](https://www.ozbe.uz/): printed tees around 265,000–300,000 UZS; sweatshirts around 420,000 UZS.
- [OZBE discounts](https://www.ozbe.uz/discount): selected tees advertised at 189,000 UZS.
- [Local seller's cotton oversize listing](https://www.olx.uz/d/oz/obyavlenie/erkaklar-uchun-oversize-paxta-futbolka-qulaylik-va-uslub-ID4qiBe.html): 99,000 UZS, a lower market segment rather than a direct brand equivalent.

Chosen prices: Basic Regular 159,000; Basic Oversize Taupe 179,000 and White 189,000; Red Car 229,000; most printed Regular/Oversize tees 239,000; selected graphics/heavier tees 249,000; Porsche GT3 and Ferrari 279,000; Basic Sweatshirt 329,000. Both fits use the same retail price in the current single-price product model. Confirm purchasing, freight, duties, tax and margin before committing to these prices long term.

Descriptions are newly written in Uzbek, Russian and English using source facts. They do not copy source marketing paragraphs or transfer shipping promises to UZER7. Import does not claim Blackstop merchandise is manufactured by UZER7.
