# Runbook

## Local Dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Container

```bash
docker build -t onliner-buyer-advocate-bot:local .
docker compose -f docker-compose.example.yml up --build
```

The compose example reads `.env`, stores runtime state in `./data`, and keeps
Telegram delivery disabled by default.

## Cloudflare Worker 24/7

The always-on free deployment target is Cloudflare Workers:

```bash
npm run worker:dry-run
npm run worker:deploy
npm run worker:doctor
```

Current deployed URL:

```text
https://onliner-buyer-advocate-bot.georgaishkin.workers.dev
```

Upload secrets from local `.env` without printing them:

```bash
npm run worker:secrets
```

After a real channel is configured in `.env`, upload it too:

```bash
npm run worker:secrets:channel
```

Register webhook:

```bash
npm run worker:set-webhook
```

Readiness:

```bash
npm run worker:doctor
```

Telegram Mini App catalog:

```text
https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/app
```

Smoke it after Worker changes:

```bash
npm run worker:test:webapp
npm run worker:dry-run
```

## Verify

```bash
npm run lint
npm run build
npm run verify:prod
npm run contract:onliner:soft
npm start
```

Useful health check:

```bash
curl http://localhost:3000/api/health
```

Read-only live-source readiness check:

```bash
curl "http://localhost:3000/api/onliner/doctor?query=redmi%20note%2015%20pro" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

Recent runtime audit trail:

```bash
curl "http://localhost:3000/api/onliner/audit-runs?limit=20" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

`npm run verify:prod` starts a temporary production server and verifies:

- production admin protection;
- protected Telegram doctor in dry-run mode;
- protected Onliner live-source doctor/audit payloads;
- deterministic dry-run channel post generation;
- Telegram webhook secret handling and dry-run `/start` + `/health`;
- channel posts API shape.

Live Onliner contract checks are separate:

```bash
npm run contract:onliner
npm run contract:onliner:soft
npm run verify:live
```

Use `contract:onliner` before claiming live Onliner readiness. If this machine
cannot reach `catalog.onliner.by`, `catalog.api.onliner.by`, or
`shop.api.onliner.by`, the soft command prints `network_unavailable` with the
underlying TCP/HTTPS error.

Analyze a live Onliner product:

```bash
curl -X POST http://localhost:3000/api/analyze-link ^
  -H "Content-Type: application/json" ^
  -d "{\"linkOrTitle\":\"redmi note 15 pro\"}"
```

Generate a channel post without sending it:

```bash
curl -X POST http://localhost:3000/api/channel/publish-best-deals ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"redmi\",\"minDiscountPercent\":20,\"publishToTelegram\":false}"
```

## Telegram Setup

1. Create a bot in BotFather and put the token into `.env` as
   `TELEGRAM_BOT_TOKEN`.
2. Add the bot as channel admin if channel posting is needed.
3. Set `TELEGRAM_CHANNEL_ID` to `@channel_username` or the `-100...` id.
4. Keep `ENABLE_CHANNEL_CRON=false` while connecting the channel. This allows
   manual verification without scheduled reposts.
5. Keep `ENABLE_TELEGRAM_DELIVERY=false` until dry-run checks look correct if
   you are testing the Express server. The production Worker can keep delivery
   enabled while cron is disabled.
6. Register webhook:

```bash
curl -X POST https://your-domain.example/api/telegram/set-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"webhookUrl\":\"https://your-domain.example/telegram/webhook\"}"
```

7. Enable delivery only after the bot and channel are verified:

```env
ENABLE_TELEGRAM_DELIVERY=true
```

Current production state on 2026-05-22: Cloudflare Worker delivery and channel
cron are enabled, `DEAL_ALERTS_KV` is bound to namespace
`facc5ea0e880428fb3d9997c591d1035`, and a repeat manual publish returned
`duplicate_suppressed_71h_left` without posting a duplicate. Treat
`schedulerEvidence.hasSchedulerRun=true` in `/api/channel/status` as the proof
that Cloudflare Cron has actually delivered an autonomous run; the cron switch
alone is not enough.

## Admin API

Production admin actions require `ADMIN_API_TOKEN`:

```bash
curl -X POST https://your-domain.example/api/channel/publish-best-deals ^
  -H "Content-Type: application/json" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%" ^
  -d "{\"dryRun\":true}"
```

Protected endpoints:

- `POST /api/generate-channel-post`
- `POST /api/channel/publish-best-deals`
- `GET /api/telegram/doctor`
- `POST /api/telegram/set-webhook`
- `GET /api/onliner/doctor`
- `GET /api/onliner/deals-doctor`
- `GET /api/external-price/doctor`
- `GET /api/channel/status`
- `GET /api/onliner/audit-runs`

Read-only Telegram readiness check:

```bash
curl https://your-domain.example/api/telegram/doctor ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

Webhook-specific check:

```bash
curl "https://your-domain.example/api/telegram/doctor?expectedWebhookUrl=https://your-domain.example/telegram/webhook" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

## Channel Scheduler

To run autonomous patrols:

```env
AUTO_PUBLISH_CHANNEL=true
ENABLE_CHANNEL_CRON=true
CHANNEL_POLL_INTERVAL_MINUTES=360
CHANNEL_POLL_ON_START=false
ONLINER_POLL_QUERY=redmi
MIN_HONEST_DISCOUNT_PERCENT=20
ONLINER_DEAL_SCAN_LIMIT=50
ONLINER_DEAL_SCAN_PAGES=3
ONLINER_DEAL_ANALYZE_LIMIT=6
ONLINER_DEAL_MIN_PRICE_BYN=50
ONLINER_DEAL_MIN_OFFERS=2
DEAL_REPOST_COOLDOWN_HOURS=72
DEAL_REPOST_PRICE_DROP_PERCENT=2
ENABLE_PRICE_WATCHES=true
PRICE_WATCH_DROP_PERCENT=5
PRICE_WATCH_SCAN_LIMIT=25
PRICE_WATCH_NOTIFY_COOLDOWN_HOURS=24
WORKER_PUBLIC_URL=https://onliner-buyer-advocate-bot.georgaishkin.workers.dev
PUBLIC_API_RATE_LIMIT_MAX=60
PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS=60
```

Worker deal search reads Onliner `catalog.api.onliner.by/super-prices` first.
`ONLINER_POLL_QUERY` is now a fallback, not the primary discount source.

Protected Onliner discount radar doctor:

```bash
curl "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/onliner/deals-doctor?minDiscountPercent=20" \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected signal: `readyForDiscountRadar=true`, `source` equals
`catalog.api.onliner.by/super-prices`, `superPrices.scannedPagesPerScope` equals
the configured `ONLINER_DEAL_SCAN_PAGES`, `superPrices.rawProductsCount > 0`,
`superPrices.qualifiedCandidatesCount > 0`, and `publishableDealsCount > 0`.
This proves the discount radar is using the live Onliner super-prices feed and
that at least one candidate survives the bot's min price/offers/history filters.
If `superPrices.hasUnscannedPages=true`, increase `ONLINER_DEAL_SCAN_PAGES`
up to the Worker-safe cap if broader coverage is needed. It is now included in
`worker:doctor` and `worker:release-gate`.

Keep `ENABLE_TELEGRAM_DELIVERY=false` for dry-run scheduler proof. Set it to
`true` only after the bot is a channel admin and `TELEGRAM_CHANNEL_ID` is
verified.

For the Cloudflare Worker, `ENABLE_CHANNEL_CRON=true` is the explicit switch
for scheduled channel posts. Leave it `false` while creating the channel or
uploading `TELEGRAM_CHANNEL_ID`.

For frequent discount radar, bind a Workers KV namespace as `DEAL_ALERTS_KV`.
Without that binding, manual publishing still works, but the Worker cannot
reliably suppress repeated posts for the same product across scheduled runs.

Current production Worker state on 2026-05-22:

- `TELEGRAM_CHANNEL_ID=-1003951031034`
- `ENABLE_TELEGRAM_DELIVERY=true`
- `ENABLE_CHANNEL_CRON=true`
- `DEAL_ALERTS_KV=facc5ea0e880428fb3d9997c591d1035`
- `ENABLE_5ELEMENT_PILOT=true`
- `FIVE_ELEMENT_SEARCH_API_KEY=08IE0509XQ`
- `ENABLE_PRICE_WATCHES=true`
- `PRICE_WATCH_DROP_PERCENT=5`
- `PRICE_WATCH_SCAN_LIMIT=25`
- `PRICE_WATCH_NOTIFY_COOLDOWN_HOURS=24`
- `WORKER_PUBLIC_URL=https://onliner-buyer-advocate-bot.georgaishkin.workers.dev`
- `PUBLIC_API_RATE_LIMIT_MAX=60`
- `PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS=60`
- Cloudflare schedule: `0 */6 * * *`

The `5 элемент` integration is intentionally labeled `pilot`: it uses the
site's Diginetica search JSON as a price-only external source, applies exact
model/storage/network/color matching where possible, and is not described as
"all RB sites".

Channel audit status:

```bash
curl https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/channel/status \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected healthy signals: `channelCronEnabled=true`,
`dealDedupeConfigured=true`, `externalPricePilotEnabled=true`,
`audit.configured=true`, and a non-empty `audit.recentRuns` after at least one
manual dry-run or scheduled run.

Personal price-watch status:

```bash
curl https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/price-watch/status \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected healthy signals: `enabled=true`, `kvConfigured=true`, the configured
drop/scan/cooldown values, and after a real Cloudflare cron delivery
`schedulerEvidence.hasSchedulerRun=true`. Users opt in only by pressing
`Следить за ценой` in a product answer; the scheduler scans at most
`PRICE_WATCH_SCAN_LIMIT` subscriptions per cron run and applies
`PRICE_WATCH_NOTIFY_COOLDOWN_HOURS` to avoid repeated private alerts.

The Worker also writes a combined scheduled-task audit to KV on every
`scheduled()` invocation. This audit is exposed through both
`/api/channel/status` as `scheduledTaskAudit` and `/api/price-watch/status` as
`scheduledAudit`, so an empty watchlist can still prove that the production cron
reached the Worker and ran the price-watch scanner.

Private notification dry-run doctor:

```bash
curl "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/price-watch/doctor?input=redminote15p5ti" \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected signal: `readyForNotificationPath=true`, `dryRun=true`,
`simulatedSubscription.shouldNotify=true`, a `notificationPreview` beginning
with `Цена достигла твоего порога.`, and unchanged `totalIndexed` /
`activeSample` before and after the request. This proves the notification
format, threshold logic, and Mini App button without creating a KV subscription
or sending a Telegram message.

Private scheduled-scan dry-run doctor:

```bash
curl "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/price-watch/scan-doctor?input=redminote15p5ti" \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected signal: `readyForScheduledScanPath=true`, `dryRunDelivery=true`,
`telegramSent=false`, `scan.checked=1`, `scan.active=1`, `scan.notified=1`,
`scan.failed=0`, `temporarySubscription.cleanedUp=true`, and a
`notificationPreview` beginning with `Цена достигла твоего порога.`. This
creates one temporary KV subscription, runs the scanner's notification branch
without Telegram delivery, verifies `lastNotifiedAt`, and removes the temporary
subscription/index key before returning.

Public catalog API rate limit:

```bash
curl https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/health
```

Expected Worker health includes `publicApiRateLimit.configured=true` and
`publicApiRateLimit.bindingConfigured=true` in production. The primary
production guard is Cloudflare's native Workers Rate Limiting binding
`PUBLIC_API_RATE_LIMITER`; the KV/memory path is only a fallback for local or
non-bound environments.

Protected binding doctor:

```bash
curl "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/rate-limit/doctor?attempts=70" \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected signal: `bindingConfigured=true` and `firstLimitedAt` is not null.
Cloudflare documents this API as permissive/eventually consistent across
ordinary requests, so this doctor checks the binding directly without generating
Onliner traffic.

External price pilot doctor:

```bash
curl "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/external-price/doctor?input=redminote15p5ti" \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected healthy signal for the current Redmi smoke card:
`readyForExternalPricePilot=true` and `fiveElement.source.status=ok`.

Duplicate proof command:

```bash
curl -X POST https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/channel/publish-best-deals \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_API_TOKEN" \
  -d '{"force":false}'
```

After the first successful post for the same selected product, the expected
response is HTTP 200 with `published=false`,
`reason=duplicate_suppressed_<N>h_left`, and `dedupe.enabled=true`.

Scheduler proof command:

```bash
curl https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/channel/status \
  -H "x-admin-token: $ADMIN_API_TOKEN"
```

Expected started signal: `channelCronEnabled=true`,
`startedOk=true`, `schedulerEvidence.hasSchedulerRun=true`, and
`schedulerEvidence.latestSchedulerRun` not older than the cron interval plus a
small delay. If `channelCronEnabled=true` but `hasSchedulerRun=false`, wait for
the next Cloudflare cron slot or inspect Worker Cron Triggers/logs.

The same gate is scripted:

```bash
npm run worker:channel-gate
```

It exits non-zero until the channel has delivery, cron, KV audit/dedupe, and at
least one non-stale `scheduler` audit entry.

For the stricter public-release maturity check:

```bash
npm run worker:channel-gate:24h
```

This requires the started signal plus `mature24hOk=true`: at least 5 scheduler
runs for the `0 */6 * * *` cron and at least 24 hours between the oldest and
latest visible scheduler audit entries. Until that history exists, the strict
gate is expected to exit non-zero while the normal started gate can be green.

To wait for the next Cloudflare cron delivery instead of polling by hand:

```bash
npm run worker:channel-gate:wait
npm run worker:channel-gate:wait24h
```

Optional controls:

```bash
CHANNEL_GATE_WAIT_MINUTES=90
CHANNEL_GATE_POLL_SECONDS=60
```

Aggregate production release gate:

```bash
npm run worker:release-gate
npm run worker:release-gate:mature
```

`worker:release-gate` checks the current deployed Worker end to end: Telegram
delivery, live Onliner source, live Onliner `super-prices` discount radar,
started channel cron, price-watch notification preview, price-watch scanner
dry-run, source-honesty metadata, and external pilot controls. It exits zero
when `productionUsableOk=true`.
`worker:release-gate:mature` uses the same checks but exits non-zero until
`publicReleaseMatureOk=true`, which currently requires the 24-hour scheduler
history gate. This distinction is intentional: usable production and mature
public release are not the same state.

Telegram user status command:

```text
/health
```

or the reply-keyboard button `🏥 Статус` returns a concise user-facing summary:
webhook handled, live Onliner source on product analysis, review page limit,
price-watch availability, channel state, and the explicit limitation
`это не все сайты РБ`. This command intentionally avoids admin-only readiness
details and should not claim 24-hour maturity.

Docker production image smoke:

```bash
npm run docker:smoke
```

This command requires Docker Desktop/daemon to be running. It builds
`onliner-buyer-advocate-bot:local`, starts a temporary container on a free local
port, verifies `/api/health`, prints the structured result, and stops the
container.

## Stop Rules

- Do not enable channel auto-publish until live data source, channel rights, and
  rate limits are verified.
- Do not auto-publish from stale runtime cache. Cache fallback is for user/admin
  visibility only and must be labeled as stale.
- Do not call the Onliner `period=2m` chart a full 90-day archive. It is live
  site history, but the evidence label must keep the exact period/source.
- Do not trust a large advertised discount from a short price spike. Product
  analysis must prefer Onliner `prices-history?period=12m` with at least 4
  points for the reference median, use `period=2m` only as fallback, and show
  `priceManipulationWarning` when the advertised discount is not confirmed by
  the stable history.
- Do not commit `.env` or `data/runtime-state.json`.
