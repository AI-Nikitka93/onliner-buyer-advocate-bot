# Implementation Notes - 2026-05-20

## What Changed

The project moved from a mock-only AI Studio demo toward a runnable bot/channel
service:

- real Onliner live client;
- Onliner price-history chart parsing;
- paginated Onliner review parsing with repeated pros/cons clustering;
- atomic runtime state;
- Telegram webhook and channel delivery layer;
- Telegram readiness doctor for token, channel, admin rights, and webhook
  readback;
- dry-run delivery safety;
- admin-token protection for publishing/webhook setup;
- in-memory rate limiting for API/webhook routes;
- background channel scheduler behind env flags;
- configurable Onliner request timeout;
- configurable review page cap through `ONLINER_REVIEW_PAGES_MAX`;
- stale-cache fallback for bot/product analysis with explicit evidence
  warnings;
- persistent runtime audit runs for Onliner analysis, Onliner doctor, and
  channel publish attempts;
- protected Onliner live-source doctor and audit API;
- Dockerfile/.dockerignore/docker-compose example for production-style service
  packaging;
- GitHub Actions verify workflow for `verify:prod` and soft Onliner contract;
- truthfulness metadata in product records;
- launch/runbook documentation.

## Live Sources Checked

- `https://catalog.onliner.by/sdapi/catalog.api/search/mobile?query=iphone%2015`
- `https://catalog.onliner.by/sdapi/catalog.api/products/redminote15p1br`
- `https://catalog.api.onliner.by/products/redminote15p1br/prices-history?period=2m`
- `https://catalog.api.onliner.by/products/redminote15p1br/prices-history?period=12m`
- `https://shop.api.onliner.by/products/redminote15p1br/positions`
- `https://catalog.api.onliner.by/products/redminote15p1br/reviews`
- `https://catalog.api.onliner.by/products/redminote15p1br/reviews?page=2`
- Telegram Bot API official docs for `sendMessage` and `setWebhook`.

## Readiness

Ready for local dry-run:

- search/analyze live Onliner products;
- calculate the median from real Onliner chart points when available;
- fetch a bounded review sample and show processed/total review evidence;
- generate bot answers;
- generate channel posts;
- accept Telegram webhook payloads;
- persist price snapshots.
- run an autonomous channel patrol in dry-run or Telegram delivery mode.
- run a read-only Telegram readiness check before live delivery.
- run an admin Onliner live/cache doctor and inspect recent audit-runs.

Historical note from 2026-05-20; superseded by
`docs/RELEASE_GATE_2026-05-20.md` and `STATE.md` on 2026-05-22.

Not ready to call the full public channel launch at that time:

- channel id/admin rights were still missing;
- no public claim of a private 90-day archive; Onliner daily chart is shorter
  and yearly chart is monthly;
- no 24-72 hour ingestion proof.

## Verification Added

- `npm run verify:prod`
- `npm run contract:onliner:soft`
- protected `/api/telegram/doctor` smoke:
  - missing admin token -> `401`;
  - valid admin token -> doctor responds;
  - no real Telegram token/channel -> `readyForLiveDelivery=false`.
- protected `/api/onliner/doctor` smoke:
  - missing admin token -> `401`;
  - valid admin token -> structured live-source/cache payload;
  - audit endpoint includes the doctor run.
- production admin smoke:
  - no `ADMIN_API_TOKEN` -> protected endpoint rejects with `503`;
  - token configured but missing request header -> `401`;
  - matching `x-admin-token` -> protected dry-run request runs.
- scheduler smoke:
  - `AUTO_PUBLISH_CHANNEL=true`
  - `CHANNEL_POLL_ON_START=true`
  - high discount threshold prevents low-quality post while proving the cycle.
- deterministic production smoke no longer depends on live Onliner network.
- live Onliner JSON contract is separate:
  - `npm run contract:onliner` for strict source verification;
  - `npm run contract:onliner:soft` for a non-failing network availability
    report.
- Current live contract status on 2026-05-20 after the review update:
  `contract_ok`, including page-2 review pagination.
- Docker CLI was present, but local image build could not run at that time
  because Docker Desktop daemon was not running (`dockerDesktopLinuxEngine`
  pipe missing). This was later closed with `npm run docker:smoke`.
