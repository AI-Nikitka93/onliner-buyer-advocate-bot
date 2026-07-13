# Agent Review - 2026-05-21

Scope: multi-agent read-only review of the Onliner Buyer Advocate Bot, current
source viability, and practical improvement roadmap.

## Verdict

This is no longer just a prototype. The Cloudflare Worker runtime, Telegram
webhook, Mini App catalog, live Onliner search/product analysis, price-history,
review parsing, and Onliner Marketplace offer comparison are implemented and
currently smoke-tested.

Update 2026-05-22: the discount channel launch blockers from this review were
closed for the public channel path. Channel id/admin rights are configured,
`DEAL_ALERTS_KV` is bound, Worker `ENABLE_CHANNEL_CRON=true` is deployed, one
real deal post was sent, and an immediate repeat was suppressed by KV. Remaining
maturity gaps are 24-72h autonomous scheduler evidence, personal alert storage,
and continued source/claim hardening.

## Implementation Update - 2026-05-21

Implemented in the repo after this review:

- Worker product analysis now supports a `5 элемент (pilot)` price-only source
  behind `ENABLE_5ELEMENT_PILOT=true` and `FIVE_ELEMENT_SEARCH_API_KEY`.
  It is a separate `external_5element` source, not a broad "all RB sites" claim.
- The pilot is not used during scheduled deal scans, so one channel cycle does
  not fan out into many external requests.
- Product matching rejects weak search results before selecting the first
  Onliner result. Unknown/gibberish searches should return `not_found` instead
  of a random product.
- Review cons now filter no-complaint phrases such as `Без нареканий`,
  `Не выявил`, `Пока никаких`, `Все устраивает`, and `Ничего существенного`
  before clustering repeated negatives.
- Express `/api/analyze-link` no longer creates Gemini/emergency synthetic
  product cards when no confirmed product is found.

Verification added:

- `scripts/test-worker-webapp.mjs` asserts the 5element pilot source, external
  best offer, Telegram answer text, and no-complaint cons filtering.
- `scripts/smoke-server.mjs` asserts unknown analysis returns `404` /
  `found=false` and does not return `isMocked` or `isAiGenerated`.
- Browser smoke against a local Worker wrapper opened `/app`, searched
  `redmi note 15 pro`, clicked the `Смартфоны` chip, verified 30 visible cards,
  clicked `Onliner`, and captured
  `output/playwright/onliner-bot-miniapp-local-pilot-2026-05-21.png`.

Deployment note: this code was not deployed to Cloudflare in this session.
`wrangler.toml` keeps `ENABLE_5ELEMENT_PILOT=false`; enable it only after adding
the current 5element/Diginetica key or a partner feed/API key outside secrets.
On 2026-05-21, `https://5element.by/` loaded
`https://cdn.diginetica.net/1892/client.js`, where the public Diginetica key was
`08IE0509XQ`; a direct `sort.diginetica.net/search` smoke returned Redmi Note 15
Pro/Pro+ rows, so the adapter is technically viable but still labeled pilot.

## Current Evidence

- `npm run verify:prod` passed on 2026-05-21.
- `npm run contract:onliner:soft` returned `contract_ok` for
  `redmi note 15 pro`: product `redminote15p1br`, 46 offers, 40 non-null
  2-month history prices, 20 reviews, page 2 verified.
- `npm run worker:test:webapp` passed.
- `node scripts/smoke-server.mjs` passed after `/api/analyze-link` stopped
  returning synthetic unknown products.
- Original 2026-05-21 snapshot: `npm run worker:doctor` returned Onliner
  `live_ok`; Telegram bot and webhook were configured, but
  `readyForLiveDelivery=false` and `readyForChannelCron=false` because the
  channel was not configured. Superseded on 2026-05-22: both are now true.
- `npm audit --omit=dev` returned 0 production vulnerabilities.
- Local Worker-wrapper live product check with `ENABLE_5ELEMENT_PILOT=true`
  returned `external_5element` `ok`, 3 5element offers at `1699 BYN`, and
  top cons without no-complaint phrases.
- Live Worker `/api/catalog/search?schema=mobile&query=redmi note 15 pro&limit=3`
  returned `total=66`, 3 products, first price `990 BYN`.
- Live Worker `/api/catalog/product?input=redminote15p1br` returned 40 history
  points, 47 Onliner Marketplace offers, 20/20 reviews, and external source
  status `not_configured`.

## Source Status On 2026-05-21

| Source | Status | Decision |
| --- | --- | --- |
| Onliner catalog/product/history | Core source | Use honestly as Onliner data. |
| Onliner Marketplace positions | Ready now | Label as `Onliner Marketplace`, not all RB sites. |
| Onliner `sdapi` search | Fetchable but sensitive | Keep user-initiated and low-rate; avoid calling it official. |
| 5element / Diginetica | Best external pilot | Add only as labeled pilot with exact matching and monitoring. |
| AMD.by | Fragile / unstable today | Do not use for silent claims until live recheck is green. |
| Kufar.by | Classifieds-only | Separate secondary-market section, never retail comparison. |
| shop.by | Not automatic search | Robots block needed search/model routes; use feed/API or pasted URL only. |
| 21vek.by / deal.by / 1k.by | Not automatic search | Robots/query restrictions make silent crawling unsuitable. |
| Wildberries / Ozon | Not for now | Anti-bot / seller-API scope; no public buyer-search source. |

Allowed wording:

> Проверяю Onliner и предложения Onliner Marketplace. Внешние источники
> подключаются только отдельными проверенными адаптерами и показываются с
> названием источника, временем проверки и уровнем уверенности.

Forbidden wording:

> Сравниваю все сайты Беларуси.

## Main Risks

### P0 - Synthetic fallback can weaken product truth

Resolved in code on 2026-05-21 for `/api/analyze-link`: unknown products now
return `404` / `found=false`. Keep synthetic mode only in an explicit demo lab
if it is ever needed again.

Recommended action: keep tests around this path; do not reintroduce synthetic
cards into public buyer evidence or channel decisions.

### P0 - Channel launch gate, superseded 2026-05-22

The original review found the Worker deployed but the Telegram channel not
configured. At that time doctor output still said:

- no `TELEGRAM_CHANNEL_ID`;
- no channel admin/posting proof;
- `ENABLE_CHANNEL_CRON=false`;
- no `DEAL_ALERTS_KV`;
- no 24-72h autonomous scheduler evidence.

2026-05-22 update: channel id/admin proof, Worker secret, `ENABLE_CHANNEL_CRON`,
`DEAL_ALERTS_KV`, first real post, and duplicate suppression are now proven.
The remaining gap here is autonomous scheduler history over time.

### P1 - Express and Worker logic can drift

Worker is the real always-on runtime and has the newer catalog/pagination/WebApp
logic. Express still carries AI Studio prototype/demo paths. Future work should
either share domain modules or clearly mark Worker as production and Express as
local simulator/admin lab.

### P1 - Review cons need cleanup

Resolved in code on 2026-05-21 for Worker and Express Onliner parsing. The
filter should remain covered by worker smoke fixtures because live review wording
changes over time.

Recommended action: later add a separate `no_explicit_cons_found` signal if the
UI needs to show "no repeated negative evidence" explicitly.

### P1 - No personal alert storage yet

KV dedupe is enough for channel repost suppression, but personal watchlists need
indexed durable rows: `chat_id`, `product_key`, threshold, last price, and
last notification time.

Recommended action: use D1 or another relational store for watchlists; keep KV
for lightweight dedupe/cooldown state.

## Prioritized Improvements

1. P0: record 24-72h autonomous scheduler history now that channel id, admin
   rights, uploaded secret, doctor green, manual real post, `DEAL_ALERTS_KV`,
   and duplicate suppression are proven.
2. P1: keep KV dedupe monitored for skipped publish / Telegram errors.
3. P1: add D1-backed personal watchlists and opt-in price alerts.
4. P1: add source-confidence labels: `strong`, `preliminary`,
   `weak_history`, `external_not_configured`, `classifieds_only`.
5. P1: add Worker-side per-user/chat rate limits before personal alerts or AI
   calls grow.
6. P1: make observability actionable: alert on Onliner failures, Telegram 429,
   skipped publish, webhook pending updates, KV/D1 errors.
7. P2: update older docs/UI copy that still imply 90-day owned history or broad
   RB coverage.
8. P2: enable the 5element pilot only after a fresh source/key check and live
   smoke, then monitor adapter health.

## Suggested Roadmap

### 1. Launch safety, current status

- Done on 2026-05-22: configured `TELEGRAM_CHANNEL_ID=-1003951031034`, added
  the bot as channel admin, uploaded Worker secret, ran `npm run
  worker:doctor`, bound `DEAL_ALERTS_KV`, enabled `ENABLE_CHANNEL_CRON=true`,
  sent one real deal post, and verified immediate duplicate suppression.
- Next: collect 24-72h autonomous scheduler evidence and alert on skipped
  publish / Telegram / KV errors.

### 2. Trust hardening, 2-4 days

- Add confidence/source labels.
- Tighten Telegram copy to `Onliner Marketplace`, not `all RB sites`.
- Keep the no-synthetic and no-complaint filters covered in smoke tests.

### 3. Retention, 1 week

- Add D1 watchlists.
- Add explicit opt-in alerts.
- Add thresholds, batching, cooldowns, and per-user limits.

### 4. External expansion, after stability

- Add 5element as a labeled pilot source.
- Store fixtures.
- Monitor adapter health.
- Do not add shop.by/21vek/deal.by automatic search without permission/feed.

## Commands Used / Recommended

```powershell
npm run verify:prod
npm run contract:onliner:soft
npm run worker:test:webapp
node scripts/smoke-server.mjs
npm run worker:doctor
npm audit --omit=dev
```

Useful recheck URLs:

- `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/catalog/search?schema=mobile&query=redmi%20note%2015%20pro&limit=3`
- `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/api/catalog/product?input=redminote15p1br`
- `https://catalog.api.onliner.by/products/redminote15p1br/prices-history?period=2m`
- `https://shop.api.onliner.by/products/redminote15p1br/positions`
- `https://www.shop.by/robots.txt`
- `https://www.21vek.by/robots.txt`
- `https://deal.by/robots.txt`
- `https://api.kufar.by/search-api/v2/search/rendered-paginated?query=redmi%20note%2015%20pro%208%2F256&size=5`

## M:\AI Preflight

Checked:

- `M:\AI\AGENTS.md`
- `M:\AI\README.md`
- `M:\AI\WORKSHOP_CAPABILITY_MAP_2026-05-17.md`
- `M:\AI\API\README.md`
- `M:\AI\AGENT_SKILLS\README.md`

Selected routes:

- `API` for external source and live-check discipline.
- `Agents` / active subagents for parallel read-only review.
- Media/GPU zones were not used.
