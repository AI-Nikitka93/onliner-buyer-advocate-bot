# Release Gate - 2026-05-20

This file is the current no-go checklist for calling the bot/channel public.

## Locally Proven

- `npm run verify:prod` passes.
- Admin endpoints reject missing `ADMIN_API_TOKEN` in production smoke.
- Telegram webhook dry-run accepts `/start` and `/health` and rejects wrong
  webhook secret.
- Onliner live-source doctor and audit endpoints return structured payloads.
- Product analysis can fall back to stale runtime cache only with explicit
  `fallback` evidence warnings.
- Channel autopublish does not publish from stale cache.
- Docker production surface exists without secrets. Local Docker image build was
  not proven because Docker Desktop daemon was not running on this machine.
- Cloudflare Worker production target is deployed at
  `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev`.
- Telegram webhook is registered to the Worker and `getWebhookInfo` matches.
- Worker Onliner doctor is live-green from Cloudflare network for
  `redmi note 15 pro` with 41 `period=2m` history points.
- Worker Telegram Mini App catalog is deployed at `/app`.
- `npm run worker:test:webapp` verifies `/app`, catalog categories/search,
  `/start` Web App keyboard, and `message.web_app_data` product selection.
- Catalog parser was corrected to use Onliner full-text
  `/sdapi/catalog.api/search/products?query=...`; live checks now return
  relevant products for `dyson`, `ноутбук`, `rtx`, and category-filtered
  `samsung` TV search.
- Catalog pagination is live: API accepts `limit` up to 50 and `page`, while
  the Telegram Mini App loads 30 products per page and shows `Показать еще`
  when Onliner reports more results.
- Review parsing is live: Worker fetches paginated Onliner reviews with
  `ONLINER_REVIEW_PAGES_MAX=3`, stores processed/total counts, clusters
  repeated pros/cons, and includes the evidence block in Telegram answers.
- Real Telegram Web test after deploy confirmed `dyson` replies with
  `Отзывы: обработано 30 из 61, страниц 3/7`, repeated cons, repeated pros, and
  a direct Onliner reviews URL.
- Telegram product answers now disable web previews and use inline buttons
  `Onliner`, `Отзывы`, and `Каталог`, so product analysis no longer expands a
  huge Onliner preview card in the chat.
- Mini App product selection from Telegram inline Web App was corrected:
  `/app` now uses `initDataUnsafe.query_id` + `/api/webapp/analyze`, the Worker
  validates signed Telegram `initData`, and replies via `answerWebAppQuery`.
  The deterministic Worker smoke covers this path, including Telegram's newer
  `signature` field in `initData`. Live Telegram Web proof also returned
  `source=answer_web_app_query` for `redminote15p1br` and displayed the Xiaomi
  answer in chat via `@BuyerAdvocateBYBot`. Direct browser automation still
  cannot physically click inside Telegram Web's cross-origin Web App iframe.
- Product answers now use buyer-readable price-history copy: no raw
  `period=2m` / `точек` wording, with date range, number of Onliner price
  measurements, min-max history range, median, and a one-line explanation of
  what a measurement means.
- Product answers now include an RB price-comparison block from Onliner seller
  positions plus the labeled `5 элемент (pilot)` external price-only source
  when live matching succeeds. This is still not "all RB sites"; additional
  external sites remain gated until each source has a stable adapter, allowed
  feed/API, and live smoke proof.

## Current Launch Gate

Completed on 2026-05-22:

1. Real `TELEGRAM_CHANNEL_ID` configured: `-1003951031034`.
2. Bot is channel admin with post permission.
3. `TELEGRAM_CHANNEL_ID` uploaded as Cloudflare Worker secret.
4. `npm run worker:doctor` returned `readyForLiveDelivery=true`,
   `readyForChannelCron=true`, and `dealDedupeConfigured=true`.
5. Cloudflare KV namespace `DEAL_ALERTS_KV`
   (`facc5ea0e880428fb3d9997c591d1035`) is bound for channel repost
   suppression.
6. Worker `ENABLE_CHANNEL_CRON=true` is deployed with schedule `0 */6 * * *`.
7. First real deal post was sent, then an immediate repeat returned
   `published=false` / `duplicate_suppressed_71h_left`.
8. Personal price-watch subscriptions are live in production: Telegram product
   answers expose `Следить за ценой`, opt-in/out persists through KV, scheduled
   scans are wired, `/watchlist` is covered by Worker smoke tests, and logged-in
   Telegram Web QA confirmed subscribe and unsubscribe on a real product answer.
9. Docker production image smoke is proven: `npm run docker:smoke` builds
   `onliner-buyer-advocate-bot:local`, starts a temporary container, verifies
   `/api/health`, and stops the container.
10. `WORKER_PUBLIC_URL` is configured in production, so scheduled private
    price-watch notifications can build Mini App buttons without relying on a
    hardcoded Worker URL.
11. Public Worker catalog endpoints are protected by Cloudflare's native
    Workers Rate Limiting binding `PUBLIC_API_RATE_LIMITER`: `/api/catalog/search`,
    `/api/catalog/product`, and `/api/catalog/deals` share production settings
    `PUBLIC_API_RATE_LIMIT_MAX=60` and
    `PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS=60`. The local fallback uses
    memory/KV only when the native binding is absent.
12. First real Cloudflare scheduled audit is recorded. At
    `2026-05-22T00:00:48.798Z` the Worker ran from cron `0 */6 * * *`,
    channel publish was correctly suppressed as duplicate
    (`duplicate_suppressed_69h_left`, selected `aj159pwhite`), and
    `npm run worker:channel-gate` exited zero with
    `schedulerEvidence.hasSchedulerRun=true`.
13. Scheduled price-watch audit is recorded for the same real cron invocation:
    `/api/price-watch/status` returned `schedulerEvidence.hasSchedulerRun=true`,
    `cron="0 */6 * * *"`, `checked=0`, `active=0`, `notified=0`, `failed=0`,
    `scannedKeys=0`, and no recommendations. This proves production cron reached
    the price-watch scanner; it does not prove a real private notification with
    an active watch because the watchlist was empty after cleanup.
14. Channel gate semantics are now split. `npm run worker:channel-gate` proves
    `startedOk=true` for a non-stale scheduler audit entry; `npm run
    worker:channel-gate:24h` is the public-release maturity check and requires
    `mature24hOk=true` with at least 5 visible scheduler runs spanning 24 hours.
15. Price comparison wording and API metadata now avoid a broad-market claim:
    sources expose `sourceType` and `confidence`, and user-facing text says
    `Проверенные источники цен:` instead of implying all RB sites were checked.
16. Private price-watch scanner has a production-safe dry-run doctor:
    `GET /api/price-watch/scan-doctor?input=...` creates a temporary KV
    subscription, runs the scanner with `dryRunDelivery=true`, expects
    `checked=1`, `active=1`, `notified=1`, `failed=0`, verifies
    `lastNotifiedAt`, and cleans up the temporary subscription/index key without
    sending Telegram.

Still useful before calling the channel fully mature:

1. Keep collecting 24-72 hours of autonomous scheduler history. The first real
   scheduler audit is now proven, but `npm run worker:channel-gate:24h` should
   remain red until `mature24hOk=true` with multiple fresh runs visible in
   `/api/channel/status` and `/api/price-watch/status`.
2. Repeat a real Telegram native-client Mini App smoke after every major UI
   change.
3. Run the scan doctor on production after deploys that touch price-watch logic.
4. Run strict `npm run contract:onliner` from a network that can reach Onliner or
   keep using Worker `/api/onliner/doctor` as deployment-network evidence.

## Current Blockers

- Local soft Onliner contract is currently green, including review pagination
  for `redminote15p1br`. Keep strict/live checks separated because Onliner
  availability can still drift by network.
- A first real scheduler run exists; 24-72 hour autonomous history is still
  accumulating.
