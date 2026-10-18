# Product API and gallery

The active endpoint is:

`https://6a4d3ee4e1cf82a4a17e4001.mockapi.io/product/api/v1/todo`

`product` is the Mock API project/base path; `todo` is the resource shown in its panel.
Set `PRODUCT_API_URL` to that exact URL in each deployment environment. Keep
`PRODUCT_PRICE_MULTIPLIER=1000`: API price `240` represents `240000` UZS on the site.
Admin writes reverse the multiplier. `PRODUCT_API_SYNC=true` enables outbound sync.

## Product fields

- `img`: ordered array of public image URLs. First photo is the card/primary image.
- `title`, `desc`: default Uzbek copy.
- `translations`: `{uz:{title,desc},ru:{title,desc},en:{title,desc}}`.
- `fits`: optional array containing `regular`, `oversize`, or both. Clothing defaults
  to both; caps/bags have no fit choice unless configured.
- `stock`: total quantity. If per-size `sizes` is absent, clothing uses one shared
  stock pool across S/M/L/XL and both fits. No arbitrary per-size quantities are created.
- `sizes`: optional object such as `{S:5,M:10,L:8,XL:3}` for actual independent size
  stock. In this mode total inventory is the sum of these quantities.
- `sharedStock`: true explicitly selects one shared pool; false with `sizes` selects
  per-size inventory. Admin shows a single quantity editor for shared inventory.

Mobile galleries scroll horizontally with snap points, a next-image preview and
accessible page controls. Desktop galleries show all photos in two columns. Existing
header/hero/navigation markup and scroll logic are preserved.

## Import and migration

Use Admin → Settings → product import after deployment. To intentionally refresh
existing API products, the authenticated `/api/admin/import` route accepts
`{"refresh":true}`. Refresh is refused while outbound changes remain pending.
API sources receive namespaced local product IDs and persistent remote-ID mappings,
so a new remote ID 1 cannot reuse an old order's product ID 1. A successful source
switch archives old products, preserving order history and original stock identity.
Generated `title N` records with empty image arrays are imported hidden.

The local catalog was migrated with `scripts/import-current-api.mjs`; the script
forces local SQLite and disables outbound writes and bots. The original product
snapshot is retained under `artifacts/api-migration/local-products-before.json`.
The public fallback catalog is a snapshot of the new API.

## Outbound synchronization

Admin create/edit/delete writes the local product and a durable API job atomically.
Updates use PUT against the mapped remote ID; creates use POST and store the returned
ID. A stable `externalId` recovers a create whose response was lost, avoiding duplicate
products when retried. Payloads preserve translations, all photos, fits and inventory.
Order stock changes also enqueue updates for products linked to the active API.

Failures remain visible in Admin → Settings → Mock API synchronization. Retry there,
or use the existing authenticated cron endpoint. Jobs have claims/leases and revision
checks so a concurrent edit is retained. Pending local changes are never discarded
because the remote API is temporarily unavailable. Tests disable real outbound sync
and use a local HTTP fixture.

Fit choices are stored on individual cart/order lines, included in admin/order history
and Telegram notifications. Duplicate order requests remain idempotent; shared or
per-size stock is checked transactionally across every fit. Large Telegram summaries
are split into bounded messages; an explicitly rejected photo falls back to order text.
An uncertain network failure remains queued for retry.

## Validation

`npm run build`, `npm test`, `npm run test:api`, `npm run test:browser`,
`npm run test:api-data`, `npm run test:telegram`, `npm run test:preserved`.

`tests/current-api-preview.mjs` reads the real local catalog for screenshots only;
it does not submit orders or write to Mock API. No live Telegram test orders are sent.
