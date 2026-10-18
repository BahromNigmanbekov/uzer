# UZER7 storefront

The storefront uses a black and white palette, numbered sections, a category directory,
product photography on neutral surfaces, and a compact brand signature in the footer.

## Preserved areas

The home hero, desktop header, mobile navigation, language controls, dropdowns and
scroll behavior retain their existing markup and logic. The preservation test checks
the original hero, header and scroll handler against their saved SHA-256 hashes.

## Implementation

- `components/brand-home.tsx`: the new content below the existing home hero.
- `lib/brand-copy.ts`: Uzbek, Russian and English brand copy.
- `app/uzer7.css`: responsive storefront styles, scoped away from the header and hero.
- `components/store.tsx`: catalog masthead, product breadcrumbs and compact footer.

Catalog, product, saved items, checkout, account, information and support pages share
the same visual system. Existing product images, campaign settings, prices, sizes,
stock, customer sessions, order processing and admin endpoints are retained.

Color variants are grouped for display by their model. Each card opens the darkest
available catalog color for that model; product pages expose the other real SKUs as
named color links. The selected color uses its own image, price and size stock, and
the cart stores that color's original product ID. The `variantSize` query parameter
preserves an available size across color navigation without changing catalog filters.
The hoodie family uses the requested charcoal catalog photograph as its default.
Color links show both the localized name and a small color sample. Desktop product
pages place the selected product's description and price on the left, its photograph
in the center, and the color/size/purchase controls on the right. Mobile pages stack
these sections while keeping the complete product description together.
Saved items retain individual color choices. Color/size/price filters run before
grouping, so filtered cards open a matching variant. The catalog photos use white
surfaces with no decorative color dots or hover zoom. On mouse devices, hovering a
card fades in another real color of the same model and leaving restores its original
photo. This visual preview does not change the product link, price or selected SKU.
Touch devices retain the original image; reduced-motion settings disable the fade.

The support form renders without a nested component identity that previously caused
its fields to reset when storefront state changed during scrolling.

## Verification

Run `npm run build`, `npm run test:preserved`, `npm run test:browser` and
`npm run test:variants`, plus `node tests/seo.mjs`. Browser tests use an isolated SQLite fixture and a local server;
they do not submit real customer orders or change the production database.

Browser screenshots and the test report are written to `artifacts/uzer7-original/`.
Coverage includes navigation, three languages, filters, search, favorites, registration,
checkout, pickup, support, stock deductions, admin actions, campaign image settings,
unknown-page responses, mobile overflow, and browser runtime errors.

Passing these checks describes the tested local environment. Production still needs
the normal Vercel deployment and a check using the production storage configuration.
