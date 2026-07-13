# Project State

Updated: 2026-07-13

## Current Goal

Turn the AI Studio prototype into a truthful runnable Onliner buyer-advocate bot
and Telegram channel service.

## Current Status

- **System Audit (2026-07-13)**: Completed a 360-degree system audit, QA test run, and dependency upgrade. 8 vulnerabilities patched, 42 packages updated. Key fixes applied to the Cloudflare Worker: robust RAM/storage title matching heuristic (`parseMemory`), rate limiter KV fail-open wrapping, KV TTL clamping to min 60s, and CATALOG_SDAPI_BASE fallback for price history. CSS variables introduced in `src/index.css` to satisfy the Zero-Trust style gate.
- React/Vite + Express app runs locally.
- Live Onliner data path exists through public catalog JSON endpoints, including
  the product `prices-history` chart.
- Live Onliner review parsing now fetches paginated review pages through
  `catalog.api.onliner.by/products/{key}/reviews?page={n}` and stores
  `reviewEvidence`: processed/total counts, pages processed/available, average
  fetched rating, top repeated pros, and top repeated cons.
- Runtime snapshots persist to `data/runtime-state.json`.
- Runtime audit runs persist to `data/runtime-state.json` for Onliner analysis,
  live-source doctor, and channel publish attempts.
- Telegram webhook and sendMessage delivery layer exists.
- Telegram readiness doctor exists for token, channel, admin rights, and webhook
  readback.
- Onliner live-source doctor exists for admin checks. It returns structured
  `live_ok` / `live_unavailable_cache_available` /
  `live_unavailable_no_cache` readiness and never silently converts stale cache
  into a fresh live proof.
- Onliner live requests have a configurable timeout
  `ONLINER_FETCH_TIMEOUT_MS` to avoid hanging webhook/admin flows.
- Onliner review depth is capped by `ONLINER_REVIEW_PAGES_MAX` (currently `3`)
  so single-product analysis can inspect up to 30 reviews without blowing up
  Cloudflare subrequests during deal scans.
- Worker product analysis has an enabled external `5 элемент (pilot)`
  price-only adapter behind `ENABLE_5ELEMENT_PILOT=true` and
  `FIVE_ELEMENT_SEARCH_API_KEY`. It is labeled as `external_5element`, not as
  broad RB-site coverage. Scheduled deal scans still score candidates from
  Onliner first, then enrich only the selected channel post with the external
  pilot to avoid broad third-party rate-limit risk.
- 5element pilot viability was rechecked on 2026-05-21: the site loads
  Diginetica client `https://cdn.diginetica.net/1892/client.js` with public key
  `08IE0509XQ`, and direct Diginetica search returned Redmi Note 15 Pro/Pro+
  rows. Keep the source labeled pilot because this is a site search client, not
  a partner stock/pricing contract.
- Browser smoke on 2026-05-21 used a local Worker wrapper with
  `ENABLE_5ELEMENT_PILOT=true`: `/app` loaded, `redmi note 15 pro` search
  returned 30 cards, the `Смартфоны` chip worked, `Onliner` opened a real
  catalog URL, and `/api/catalog/product?input=redminote15p1br` returned
  `external_5element` `ok`. Screenshot:
  `output/playwright/onliner-bot-miniapp-local-pilot-2026-05-21.png`.
- Ordinary-user smoke on 2026-05-21 simulated `/start`, a plain text query
  `redmi note 15 pro`, Mini App `web_app_data`, and a no-result query without
  admin routes. The bot returned catalog entry buttons, product analysis with
  Onliner Marketplace + 5element pilot evidence, no synthetic no-result
  evidence, and a Mini App click on `Разобрать` emitted Telegram WebApp data.
  Screenshot: `output/playwright/ordinary-user-miniapp-2026-05-21.png`.
- Worker and Express Onliner review parsing filters no-complaint phrases such
  as `Без нареканий`, `Не выявил`, `Пока никаких`, `Все устраивает`, and
  `Ничего существенного` before repeated-cons clustering.
- `/api/analyze-link` no longer creates Gemini/emergency synthetic product
  cards when no confirmed live/demo product is found; it returns `404` /
  `found=false`.
- Onliner search result selection now rejects weak/fuzzy results that do not
  overlap the query by title/key tokens, so gibberish queries should not become
  random product analysis.
- Telegram plain-text search now treats ambiguous product names as a choice
  flow: for queries such as `redmi note 15 pro` the bot sends inline buttons
  for matching Onliner cards instead of immediately analyzing the first fuzzy
  result. Selecting a button uses `callback_query` with `analyze:{productKey}`
  and then analyzes the exact chosen product.
- Telegram delivery defaults to dry-run until `ENABLE_TELEGRAM_DELIVERY=true`.
- Production admin endpoints are protected by `ADMIN_API_TOKEN`.
- In-memory rate limiting is active for `/api` and `/telegram` routes.
- Channel scheduler exists behind `AUTO_PUBLISH_CHANNEL`.
- Docker production surface exists (`Dockerfile`, `.dockerignore`,
  `docker-compose.example.yml`) and keeps secrets/runtime state outside the
  image. Local Docker build is not yet proven because Docker Desktop daemon was
  not running (`dockerDesktopLinuxEngine` pipe missing).
- GitHub Actions verify workflow exists at `.github/workflows/verify.yml` and
  runs deterministic production verification plus soft Onliner contract.
- Current release/no-go checklist is in
  `docs/RELEASE_GATE_2026-05-20.md`.
- No real Telegram token or channel rights were present during implementation.
- Telegram bot token was later configured in local `.env` and read-only
  `getMe` verified bot `@BuyerAdvocateBYBot` / `Адвокат Покупателя BY`.
  Channel id/admin rights are now configured for
  `Адвокат Покупателя BY | Скидки` / `@BuyerAdvocateBYDeals`
  (`TELEGRAM_CHANNEL_ID=-1003951031034`).
- Cloudflare Worker 24/7 deployment was added and deployed:
  `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev`.
- Telegram Mini App catalog is now served by the Worker at
  `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/app`.
  It exposes category chips, live Onliner search, product cards, and
  `Telegram.WebApp.sendData()` selection back to the bot through
  `message.web_app_data`.
- Worker public catalog endpoints now exist:
  `/api/catalog/categories`, `/api/catalog/search`, `/api/catalog/product`, and
  `/api/catalog/deals`.
- Worker catalog search uses Onliner full-text
  `/sdapi/catalog.api/search/products?query=...` with optional
  `schemas[0]=...` filters. Do not replace it with
  `/search/{schema}?query=...`: that endpoint behaves like a category listing
  and ignores arbitrary text queries in practice.
- Telegram webhook is registered to
  `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/telegram/webhook`
  with secret-token protection.
- Worker Telegram doctor verifies bot token, webhook, channel id, and channel
  admin rights. Channel live delivery and scheduled channel cron are enabled on
  Cloudflare Worker with `DEAL_ALERTS_KV` duplicate suppression.
- Worker Onliner doctor from Cloudflare network verified live source for
  `redmi note 15 pro`: `redminote15p1br`, current price `1199`, 41 history
  points from `period=2m`.
- Worker webhook smoke verified wrong secret -> `403` and correct secret with
  empty update -> ignored `200`.
- Onliner price history is parsed from the site chart endpoint. The daily chart
  is about two months; the yearly chart is monthly, so the app must not call it
  a private 90-day archive.

## M:\AI Preflight

Read:

- `M:\AI\AGENTS.md`
- `M:\AI\README.md`
- `M:\AI\WORKSHOP_CAPABILITY_MAP_2026-05-17.md`
- `M:\AI\AGENT_SKILLS\README.md`
- `M:\AI\AGENT_SKILLS\01_REGISTRY\skill_index.jsonl`
- local skills: `frontend-visual-quality-gate`, `security-and-hardening`,
  `shipping-and-launch`

Selected zones:

- `API` for external endpoint/live-check discipline.
- `Agents` for bot/runtime orchestration.
- `PROMTS` conceptually for AI persona, but no prompt-vault edit was needed.
- Media/GPU zones were not used.

## Implemented Files

- `src/server/onliner.ts` - live Onliner search/product/positions/reviews and
  price-history client.
- `src/server/store.ts` - atomic JSON runtime state store.
- `src/server/telegram.ts` - Telegram Bot API delivery, webhook helpers, and
  readiness doctor.
- `src/server/security.ts` - rate limiting and admin token middleware.
- `scripts/smoke-server.mjs` - deterministic production smoke for admin
  protection, Telegram doctor, demo channel post generation, and channel posts
  API.
- `scripts/smoke-telegram-webhook.mjs` - deterministic Telegram webhook smoke
  without real Telegram token.
- `scripts/contract-onliner.mjs` - strict/soft live Onliner JSON contract check,
  including review pagination page 2 when available.
- `scripts/test-worker-webapp.mjs` - deterministic Worker Mini App smoke for
  `/app`, catalog search, `/start` Web App keyboard, and `web_app_data`.
- `scripts/sync-worker-secrets.mjs`, `scripts/set-worker-webhook.mjs`, and
  `scripts/worker-doctor.mjs` - Cloudflare Worker operational helpers.
- `server.ts` - health, live analysis, channel publish, Telegram webhook endpoints.
- `src/types.ts` - data-source/evidence metadata.
- `src/App.tsx` and `PriceHistoryChart.tsx` - UI shows real Onliner history
  points when available and labels fallback evidence.
- `.env.example`, `.gitignore`, `README.md`, `RUNBOOK.md`.

## Known Gaps

- `TELEGRAM_BOT_TOKEN`, public HTTPS webhook, channel posting rights,
  `ENABLE_CHANNEL_CRON=true`, and `DEAL_ALERTS_KV` are proven through
  Cloudflare Worker.
- Need long-running scheduled ingestion only for an additional local audit trail;
  current user-facing history comes from Onliner `prices-history`. The first
  audit-run trail now exists, but 24-72h autonomous evidence is still missing.
- Need green strict `npm run contract:onliner` from a network that can reach
  Onliner before claiming current live-source readiness.
- Cloudflare Worker live-source doctor is green for one query. Local strict
  `npm run contract:onliner` may still fail from this PC if Onliner TCP/HTTPS is
  blocked, so keep both evidences separate.
- Production deployment target now exists on Cloudflare Workers. The Express UI
  server remains local/container-ready; the always-on Telegram runtime is the
  Worker.
- The Worker Mini App is intentionally self-contained HTML for now. The richer
  React/Vite simulator is not served by Worker assets yet.

## Latest Verification

- `npm run verify:prod` passed. This is deterministic and does not depend on
  Onliner network availability.
- `npm run worker:test:webapp` passed after Mini App changes.
- `npm run lint` passed after Mini App changes.
- `npm run worker:dry-run` passed after Worker deployment changes.
- `npm run worker:deploy` deployed Worker version
  `93fc07fa-5f4c-407e-bada-003df5b91ca5`.
- Catalog parser fix deployed Worker version
  `fa7cee7c-cf75-4512-a927-175bea29632a`.
- Catalog pagination fix deployed Worker version
  `96ffcb97-9de5-4e24-8523-775b5b50895d`.
- Browser-test/status-label fix deployed Worker version
  `f3d05f9d-adb8-4b58-8e0f-b5eab808d9de`.
- Telegram Web inline Web App button fix deployed Worker version
  `2d9b77d8-25c0-4f99-a879-d40f617ca08b`.
- Paginated review-evidence parser deployed Worker version
  `9e385910-5413-4349-8a5d-a890c4770eaa`.
- Telegram product-answer cleanup deployed Worker version
  `ce610af6-f95d-460f-92b6-7403885b7f07`: product answers now disable
  Telegram web page previews and expose `Onliner`, `Отзывы`, and `Каталог`
  as buttons instead of raw URLs that expand into large preview cards.
- Inline Mini App product selection fix deployed Worker version
  `3a1a7ed6-f9ec-4a2e-ba9f-7343e59437bd`: `/app` now detects Telegram
  `initDataUnsafe.query_id`, posts the selected product to
  `/api/webapp/analyze`, validates signed Telegram `initData`, and answers the
  inline Web App session with `answerWebAppQuery`. The older `sendData` path is
  still kept for reply-keyboard Web Apps. Version
  `eadef370-9a73-4b0c-9f43-0a61f283b256` was superseded because the first
  HMAC validator incorrectly removed Telegram's newer `signature` field.
- Live `/app` returned `200 text/html`, included Telegram SDK,
  `sendData`, and `Каталог Onliner`.
- Live `/app` after the inline fix returned the updated Mini App code with
  `initDataUnsafe`, `/api/webapp/analyze`, and the old `sendData` fallback.
- Live `/api/catalog/categories` returned 8 categories.
- Live `/api/catalog/search?schema=mobile&query=redmi&limit=2` returned 2
  products; first result was
  `Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB международная версия (коричневый)`.
- Live catalog search after parser fix:
  - `schema=all&query=dyson&limit=12` returned 12 products; first was
    `Dyson V8 Absolute 476596-01`.
  - `schema=all&query=ноутбук&limit=12` returned 12 products; first was
    `Apple MacBook Neo 13" A18 Pro 2026 MHFF4`.
  - `schema=all&query=rtx&limit=12` returned 12 products; first was
    `Gigabyte GeForce RTX 5070 Gaming OC 12G GV-N5070GAMING OC-12GD`.
  - `schema=tv&query=samsung&limit=12` returned 12 TV products; first was
    `Samsung Crystal UHD 4K U8000F UE43U8000FUXRU`.
- Live catalog pagination after the pagination fix:
  - `schema=all&query=redmi&limit=30&page=1` returned 30 products,
    `total=7346`, `hasMore=true`, first was
    `Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB международная версия (коричневый)`.
  - `schema=all&query=redmi&limit=30&page=2` returned 30 products; first was
    `Xiaomi Redmi Note 15 Pro+ 5G 12GB/256GB международная версия (коричневый)`.
  - `schema=all&query=redmi&limit=30&page=3` returned 30 products; first was
    `Xiaomi Redmi Buds 8 Active M2537E1 (черный, международная версия)`.
- Live production review evidence after the review parser fix:
  - `/api/catalog/product?input=dyson` returned `Dyson V8 Absolute 476596-01`.
  - `reviewEvidence.processedCount=30`, `totalCount=61`,
    `pagesProcessed=3`, `pagesAvailable=7`, average fetched rating `4.5/5`.
  - Top repeated cons: `Цена (10 упом.)`, `Хранение насадок (5 упом.)`,
    `Батарея (4 упом.)`.
  - Top repeated pros: `Качество (4 упом.)`,
    `Вибро режим для нужных насадок (4 упом.)`,
    `Качество, зарядка, эффективность (3 упом.)`.
- In-app browser manual test opened `/app`, verified desktop and mobile
  viewport behavior, searched `dyson`, clicked `Показать еще`, and confirmed
  the status label shows `Показано: 30 из ...` rather than the earlier
  malformed `Показано: 0 30 из ...`.
- Browser artifacts:
  - `output/playwright/onliner-bot-miniapp-mobile-tested.png`
  - `output/playwright/onliner-bot-telegram-entry.png`
  - `output/playwright/onliner-bot-telegram-web-login.png`
- Telegram public bot landing page opens for `@BuyerAdvocateBYBot`. Telegram Web
  requires QR login in this browser, so real chat interaction from the user's
  account was not performed in-browser.
- After the user logged into Telegram Web, real chat testing confirmed:
  - `/catalog` reaches the Worker webhook and returns the catalog invite.
  - The catalog invite now includes a visible inline `Открыть каталог` Web App
    button in Telegram Web.
  - Clicking `Открыть каталог` opens Telegram's Web App launch confirmation and
    then opens the catalog iframe inside Telegram Web.
  - Sending `dyson` as a normal chat message returns a live product analysis for
    `Dyson V8 Absolute 476596-01`, with current price `1144.61 BYN`, median
    `1183.35 BYN`, `period=2m` history with 39 points, and review-derived
    cons.
  - After the paginated review parser deploy, sending `dyson` again in Telegram
    Web returned the new review block:
    `Отзывы: обработано 30 из 61, страниц 3/7, средняя по выборке 4.5/5`,
    `Повторяющиеся минусы`, and `Что чаще хвалят`.
  - After the Telegram cleanup deploy, sending `dyson` in Telegram Web returned
    the same analysis without a large Onliner link preview and with inline
    buttons `Onliner`, `Отзывы`, and `Каталог`.
  - The chat history contains Telegram's service message
    `Data from the "Каталог Onliner" button was transferred to the bot`, followed
    by a product analysis, proving the `web_app_data` path works in a real chat.
- Browser automation could not click inside the Telegram Web App iframe after
  launch because the in-app browser blocks cross-origin iframe input; this is
  a browser-tool limitation, not a Worker error. This limitation was observed
  again after the `answerWebAppQuery` fix, while the Mini App itself was visible
  with updated product cards and `Разобрать` buttons.
- Live Telegram `answerWebAppQuery` proof after the final inline fix:
  reusing the opened Mini App's real signed `tgWebAppData` and `query_id`,
  `/api/webapp/analyze` returned `200 ok`, `source=answer_web_app_query`, and
  `productId=redminote15p1br`. Telegram Web then showed a new message marked
  `via @BuyerAdvocateBYBot` with the Xiaomi product analysis:
  `Отзывы: обработано 19 из 19, страниц 2/2, средняя по выборке 4.7/5`.
- Price-history explanation copy deployed Worker version
  `b2e4485c-9aa6-474e-88d9-65e0cb2412cf`: Telegram product answers no longer
  expose raw `period=2m` / `точек` wording. They now explain the price history
  as Onliner price measurements, show the date range, min-max range, median,
  current price relation to the median, and define a measurement as one price
  from the Onliner graph.
- RB price-comparison block deployed Worker version
  `f01c4f6f-9327-49c8-986a-2fd395b2ed40`: product analysis now fetches
  `shop.api.onliner.by/products/{key}/positions`, summarizes Onliner seller
  offers as a Belarus price-comparison source, enriches the top offers with
  shop names through `shop.api.onliner.by/shops/{shopId}`, and states honestly
  that external RB sites are only verified per source. On 2026-05-22 this was
  extended with the labeled `5 элемент (pilot)` adapter; it still must not be
  described as "all RB sites".
- External RB source audit saved in
  `docs/RB_PRICE_SOURCE_AUDIT_2026-05-21.md`: current conclusion is that the bot
  must not claim "all RB sites". `5element.by` is now the first deployed
  external pilot, `AMD.by` is technically possible but HTML-fragile, Kufar must
  be treated as secondary-market classifieds, and many other sites expose prices
  technically but block automated search in `robots.txt` or require partner/API
  access.
- Additional browser artifact:
  - `output/playwright/onliner-bot-telegram-webapp-opened.png`
  - `output/playwright/onliner-bot-telegram-review-evidence.png`
  - `output/playwright/onliner-bot-telegram-clean-buttons.png`
  - `output/playwright/onliner-bot-telegram-webapp-inline-open-after-fix.png`
  - `output/playwright/onliner-bot-telegram-answer-web-app-query-live.png`
  - `output/playwright/onliner-bot-telegram-price-history-copy.png`
  - `output/playwright/onliner-bot-telegram-price-comparison-rb.png`
- `npm run worker:doctor` returned bot `BuyerAdvocateBYBot`, webhook configured,
  Onliner live source ready with product `redminote15p1br` and 41 history
  points; channel readiness remains false because `TELEGRAM_CHANNEL_ID` is not
  configured.
- `npm audit --omit=dev` returned 0 production vulnerabilities.
- `npm run contract:onliner:soft` later returned `contract_ok` on
  2026-05-20. The review contract confirmed page 1 and page 2 pagination for
  `redminote15p1br`: `total=19`, `pageLast=2`, `page2Count=9`.
- Smoke now includes protected `/api/telegram/doctor`; without real token/channel
  it returns `readyForLiveDelivery=false` with setup recommendations.
- Smoke includes protected `/api/onliner/doctor` and `/api/onliner/audit-runs`;
  the payload is deterministic in shape and can report unavailable live source
  without breaking production smoke.
- Production auth smoke:
  - without `ADMIN_API_TOKEN`, protected channel endpoint returned `503`;
  - with `ADMIN_API_TOKEN`, missing header returned `401`;
  - with `x-admin-token`, protected dry-run request completed.
- Scheduler smoke with `AUTO_PUBLISH_CHANNEL=true`,
  `CHANNEL_POLL_ON_START=true`, and high discount threshold completed without
  publishing low-quality deals.
- Playwright UI smoke for Telegram doctor passed on desktop and mobile: button
  visible, protected endpoint response rendered, no console errors, no
  horizontal overflow.
- 2026-05-21 current smoke:
  - `npm run verify:prod` passed: TypeScript, production build, server smoke,
    and Telegram webhook dry-run smoke are green.
  - `npm run worker:test:webapp` passed.
  - `npm run worker:doctor` returned bot `BuyerAdvocateBYBot`, webhook
    configured, Onliner live source ready with `redminote15p5ti` and 40 history
    points; `readyForLiveDelivery=false` remains because
    `TELEGRAM_CHANNEL_ID` is not configured.
  - `npm run contract:onliner:soft` returned `contract_ok` for
    `redmi note 15 pro`: product `redminote15p1br`, 47 offers, 40 non-null
    2-month history prices, 19 total reviews with page 2 verified.
  - `npm audit --omit=dev` returned 0 vulnerabilities.
  - Live Worker catalog search returned 3 products for
    `redmi note 15 pro`; first result was
    `Xiaomi Redmi Note 15 Pro 5G 8GB/256GB международная версия (титановый)`
    with price `990` and 49 offers.
  - Live Worker product endpoint returned `redminote15p1br` with 40 history
    points, 19 processed reviews, and price-comparison sources including
    Onliner Marketplace plus an unconfigured external-source placeholder.
  - Direct browser check of the deployed Mini App `/app` loaded live catalog
    results with product names, BYN prices, ratings, offer counts, and
    `Разобрать` / `Onliner` buttons. Screenshot:
    `output/playwright/onliner-bot-miniapp-live-check-2026-05-21.png`.
  - Local ordinary-user choice-flow smoke passed after the ambiguity fix:
    `/start` returned the catalog invite, plain text `redmi note 15 pro`
    returned `product_choices` with 5 inline choices instead of product
    analysis, selecting `analyze:redminote15p5ti` returned the product answer,
    a no-result query stayed honest, and the Mini App `Разобрать` path still
    emitted Web App data. Screenshot:
    `output/playwright/ordinary-user-choice-flow-2026-05-21.png`.
  - Telegram Web App duplicate-reply bug fixed and deployed Worker version
    `d76392ef-1a6d-4e11-a794-954c9728c60d`: webhook now ignores messages that
    Telegram inserts as `via_bot: BuyerAdvocateBYBot` when they are our own
    `answerWebAppQuery` product result, preventing the extra
    `Не нашел товар в live Onliner...` reply after a successful `Разобрать`.
    `scripts/test-worker-webapp.mjs` covers this with an own-inline-result
    update and asserts no second Telegram API call is made. Live Worker webhook
    smoke returned `{ ok: true, ignored: true, reason: "own_inline_result" }`.
  - Discount channel safety work: Worker now has an explicit
    `ENABLE_CHANNEL_CRON` switch, so adding `TELEGRAM_CHANNEL_ID` no longer
    implicitly starts scheduled channel posts. `DEAL_ALERTS_KV` is supported as
    optional Workers KV dedupe storage for repeated deal suppression, with
    `DEAL_REPOST_COOLDOWN_HOURS` and `DEAL_REPOST_PRICE_DROP_PERCENT` controls.
    `scripts/test-worker-webapp.mjs` covers disabled cron and duplicate
    suppression with an in-memory KV stand-in.
  - Ambiguous-text choice-flow fix deployed Worker version
    `b3fcdbe4-7066-4285-85ae-f9cdbc92a3a7`: live bot code now contains the
    `redmi note 15 pro` style flow that returns product choices before exact
    product analysis.
  - Post-deploy checks passed:
    `npm run worker:dry-run`, `npm run worker:deploy`,
    `npm run worker:doctor`, live `/api/catalog/search`,
    live `/api/catalog/product`, live Mini App browser smoke,
    live `/telegram/webhook` secret/empty-update smoke,
    `npm run worker:test:webapp`, `npm run verify:prod`, and
    `npm run contract:onliner:soft`.
  - Live Mini App after deploy opened `/app`, searched
    `redmi note 15 pro`, showed Redmi product rows, BYN prices, 30
    `Разобрать` buttons, 31 `Onliner` buttons, and no console errors.
    Screenshot:
    `output/playwright/onliner-bot-miniapp-live-after-deploy-2026-05-21.png`.
  - 2026-05-22 channel connection:
    local `.env` and Cloudflare Worker secret `TELEGRAM_CHANNEL_ID` set to
    `-1003951031034`; `npm run worker:doctor` returned
    `readyForLiveDelivery=true`, channel title
    `Адвокат Покупателя BY | Скидки`, username `BuyerAdvocateBYDeals`,
    `channelAdmin.ok=true`, `status=administrator`, and
    `canPostMessages=true`. A direct Telegram API test post succeeded with
    `messageId=2`. Manual deal endpoint did not post because no honest live
    deal matched the current filter. This was superseded later on 2026-05-22 by
    the KV/cron launch proof below.
  - 2026-05-22 discount-search upgrade deployed Worker version
    `9eafd8d2-b92d-47a6-9806-d87c84eb3891`: channel deal search now reads
    live Onliner `catalog.api.onliner.by/super-prices` first, sorted by
    `discount:desc` and filtered by `MIN_HONEST_DISCOUNT_PERCENT`,
    `ONLINER_DEAL_MIN_PRICE_BYN`, and `ONLINER_DEAL_MIN_OFFERS`. The old
    `ONLINER_POLL_QUERY=redmi` path remains as fallback only. Worker manual
    publish now accepts `dryRun=true` / `publishToTelegram=false`, returning the
    selected deal and `postText` without sending a Telegram post or writing
    dedupe state.
  - Live post-deploy discount proof on 2026-05-22:
    `/api/catalog/deals?minDiscountPercent=20` returned live deals; first was
    `Ajazz AJ159P (белый)`, price `119 BYN`, honest discount `63.9%`, rating
    `4`, `10` Onliner Marketplace offers. Protected
    `/api/channel/publish-best-deals` with `dryRun=true` returned
    `published=false`, `dryRun=true`, `dealsCount=3`, selected `aj159pwhite`,
    and a clean post preview without the earlier non-informative review text
    `Выше`. No real deal post was sent during this dry-run check.
  - 2026-05-22 production channel radar launch:
    created Cloudflare KV namespace `DEAL_ALERTS_KV`
    (`facc5ea0e880428fb3d9997c591d1035`), bound it in `wrangler.toml`, set
    Worker `ENABLE_CHANNEL_CRON=true`, and deployed Worker version
    `2047fbc0-8caa-4401-9f00-744831990bad` with schedule `0 */6 * * *`.
    `npm run worker:doctor` returned `readyForLiveDelivery=true`,
    `readyForChannelCron=true`, `channelCronEnabled=true`,
    `dealDedupeConfigured=true`, `channelOk=true`, and `webhookConfigured=true`.
  - First real deal post was sent through protected
    `/api/channel/publish-best-deals` on 2026-05-21T21:40:23Z
    (2026-05-22 Minsk time): selected `aj159pwhite` / `Ajazz AJ159P (белый)`,
    price `119 BYN`, honest discount `63.9%`, `dealsCount=3`,
    `dedupe.reason=first_publish`.
  - Immediate second manual publish without `force` returned
    `published=false`, `reason=duplicate_suppressed_71h_left`, and
    `dedupe.enabled=true`, proving the public channel did not receive a second
    identical post. KV read command confirmed the stored publish state:
    `wrangler kv key get "deal-alert:aj159pwhite" --binding DEAL_ALERTS_KV --remote --text`.
  - Channel post text was hardened before the real post: `formatChannelPost`
    no longer labels product specs as “Часто хвалят”; it uses only
    `reviewEvidence.topPros/topCons` for review claims and otherwise says that
    repeated review claims are not confirmed.
  - 2026-05-22 manual production Mini App check found and fixed a web fallback
    bug: Telegram's public `telegram-web-app.js` exposes a `sendData` shim even
    outside a real Telegram client, so `Разобрать` could silently send data into
    nothing in a normal browser. Worker version
    `454b4d13-6ed4-43ea-bc5c-034d299a2bf2` now uses Telegram `sendData` only
    when `tg.initData` is present; otherwise it renders a compact web analysis
    panel on the page. The `Onliner` control is now a real link. Manual
    Playwright check passed: opened production `/app`, searched `dyson`, loaded
    60 results, clicked `Разобрать`, saw analysis for `Dyson V8 Absolute
    476596-01`, verified `https://catalog.onliner.by/...` href and no console
    errors. Screenshot:
    `output/playwright/manual-prod-miniapp-2026-05-22.png`.
  - 2026-05-22 logged-in Telegram Web ordinary-user check passed against
    `@BuyerAdvocateBYBot`: `/start` returned the catalog invite, plain text
    `redmi note 15 pro` returned 5 exact choice buttons instead of analyzing an
    arbitrary fuzzy match, and the direct product URL
    `https://catalog.onliner.by/mobile/xiaomi/redminote15p5ti` returned a live
    product analysis with 39 history points, 48 marketplace offers, and 20
    processed reviews. Inline choice buttons were visible, but automated
    Telegram Web clicking did not reliably trigger the callback; the callback
    path remains covered by `scripts/test-worker-webapp.mjs`.
  - The same logged-in Telegram Web check exposed noisy Onliner `cons` phrases
    being treated as repeated минусы: `их нет`, `Телефон`, `Нет такого`,
    `Не найдено`, `Всё отлично`, `Пока без нареканий`,
    `Пока не проявились!`, and `Существенных минусов нет`. Worker and Node
    server review parsing now filter those no-explicit-cons/generic phrases and
    preserve numeric capacity values such as `8/256` instead of splitting them
    into `В современном мире 8`. Final deployed Worker version:
    `5c7dcc47-8584-4903-859e-74f420a6c5ee`.
  - Final live Telegram Web retest of the same product URL after deploy showed
    clean repeated минусы: `Не сразу привык к размеру` and
    `В современном мире 8 256 это базовый минимум, которого уже не всегда
    хватает`; the earlier no-complaint phrases were absent and `Onliner`,
    `Отзывы`, and `Каталог` buttons were present.
  - Final verification on 2026-05-22 passed:
    `npm run worker:test:webapp`, `npm run lint`, `npm run worker:dry-run`,
    `npm run worker:deploy`, `npm run verify:prod`, `npm run worker:doctor`.
    `worker:doctor` returned `readyForLiveDelivery=true`,
    `readyForChannelCron=true`, `dealDedupeConfigured=true`,
    `channelOk=true`, `webhookConfigured=true`, and Onliner product
    `redminote15p5ti` with `historyPoints=39`. Protected
    `/api/channel/publish-best-deals` returned `published=false`,
    `reason=duplicate_suppressed_71h_left`, selected `aj159pwhite`, proving no
    duplicate public channel post was sent during the check.
  - 2026-05-22 external comparison hardening deployed Worker version
    `77b999d4-d1b8-47e4-92fb-32f93ac3478a`: production
    `ENABLE_5ELEMENT_PILOT=true`, 5element live Diginetica search is enabled
    as a labeled `5 элемент (pilot)` price-only source, and the matching now
    rejects external candidates when both Onliner and 5element expose different
    recognized colors. Regression test uses a cheaper wrong-color candidate to
    prove it cannot win over the correct-color candidate.
  - Live production product check for `redminote15p5ti` returned
    `external_5element` status `ok`, `offersCount=1`, `minPrice=1399`,
    while Onliner Marketplace remained `48` offers at `990-1581.35 BYN`.
    Logged-in Telegram Web retest of the direct product URL showed the same
    `5 элемент (pilot): 1 предложение, 1399 BYN` line and clean repeated
    minuses.
  - Mini App production browser smoke after the same deploy opened `/app`,
    searched `redmi note 15 pro`, showed `Показано: 30 из 66`, clicked
    `Разобрать`, and the web analysis panel showed `Сравнение цен по РБ`,
    Onliner Marketplace, top Onliner sellers, and the `5 элемент (pilot)`
    line with `1399 BYN`, with no console errors. Screenshot:
    `output/playwright/miniapp-prod-5element-2026-05-22.png`.
  - Channel post preview now enriches only the selected deal with external
    comparison before formatting. Protected `dryRun=true, force=true` returned
    no Telegram send and post text containing `5 элемент (pilot): сейчас не
    отдал проверяемые цены` for selected `aj159pwhite`; ordinary non-force
    publish still returned `duplicate_suppressed_71h_left`.
  - 2026-05-22 channel observability hardening deployed Worker version
    `04c9b49c-0e8d-41b8-900d-a1032db7331c`: channel publish attempts now write
    durable KV audit entries under `deal-alert:audit-*`, and protected
    `GET /api/channel/status` returns delivery/cron/dedupe/external-pilot
    flags plus latest/recent runs. Production status after a dry-run preview
    and duplicate check returned `channelCronEnabled=true`,
    `dealDedupeConfigured=true`, `externalPricePilotEnabled=true`,
    `audit.configured=true`, `recentRuns=2`, latest reason
    `duplicate_suppressed_70h_left`.
  - Added protected `GET /api/external-price/doctor`; production check for
    `redminote15p5ti` returned `readyForExternalPricePilot=true`,
    `fiveElement.source.status=ok`, `offersCount=1`, `minPrice=1399`.
  - Webhook setup now registers `allowed_updates=["message","callback_query"]`
    so Telegram inline choice buttons can be delivered after webhook resets.
    `npm run worker:set-webhook` now asserts `callback_query` is present; live
    doctor readback returned allowed updates `message` and `callback_query`.
    Telegram still reports an old `lastErrorMessage` from a previous 500, but
    current direct webhook smoke passed after this deploy.
  - Logged-in Telegram Web inline-callback retest passed after the webhook
    allowed-updates fix: plain text `redmi note 15 pro` returned choice
    buttons, selecting the first choice produced a fresh product analysis at
    01:46 for `Xiaomi Redmi Note 15 Pro 5G 8GB/256GB` with Onliner
    Marketplace `48` offers at `990-1581.35 BYN`, `5 элемент (pilot):
    1 предложение, 1399 BYN`, 20 processed reviews, link buttons `Onliner`,
    `Отзывы`, `Каталог`, and clean repeated минусы without the earlier
    no-complaint/generic phrases.
  - Final post-callback verification passed:
    `npm run worker:doctor`, `npm run worker:test:webapp`,
    `npm run smoke:telegram`, and `npm run verify:prod`. Production doctor
    returned `readyForLiveDelivery=true`, `readyForChannelCron=true`,
    `allowedUpdates=["message","callback_query"]`,
    `readyForExternalPricePilot=true`, 5element `offersCount=1`,
    `minPrice=1399`, and channel audit `recentRuns=2`.
  - 2026-05-22 scheduler-evidence gate deployed Worker version
    `2a3fbb26-4ae0-4204-a23b-cc554a7e8e5a`: protected
    `GET /api/channel/status` now returns `schedulerEvidence`, separating
    `channelCronEnabled=true` from proof that Cloudflare actually delivered a
    scheduled event. Production status at 01:50 Minsk showed the correct
    remaining gap: `schedulerEvidence.hasSchedulerRun=false`,
    `schedulerRuns=0`, latest audit `trigger=manual`, and recommendation
    `Worker cron включен, но в durable audit пока нет ни одного scheduler-run`.
    Added `npm run worker:channel-gate`; it intentionally exited non-zero with
    `no scheduler-run has been recorded in channel audit yet` until the next
    real Cloudflare cron run is recorded.
  - Verification for this scheduler-evidence change: `npm run worker:test:webapp`,
    `npm run lint`, `npm run worker:dry-run`, `npm run worker:deploy`,
    `npm run worker:doctor`, `npm run smoke:telegram`, `npm run verify:prod`,
    and `npm audit --omit=dev` passed. Docker image proof was still open at this
    point, but was closed later by `npm run docker:smoke`.
  - 2026-05-22 personal price-watch subscriptions deployed Worker version
    `60101754-c847-4a29-b9a9-787ef754d549`: product answers now include
    `Следить за ценой`, callback opt-in/out is stored in KV, `/watchlist` lists
    active watches, scheduled scans run alongside channel publishing, and
    protected `GET /api/price-watch/status` reports the feature health.
    Verification passed with `npm run lint`, `npm run worker:test:webapp`,
    `npm run verify:prod`, `npm run worker:dry-run`, `npm run worker:deploy`,
    `npm run worker:doctor`, and `npm run smoke:telegram`. Logged-in Telegram
    Web manual QA selected a live product from the existing search result,
    confirmed the new `Следить за ценой` button, enabled a watch at `948 BYN`
    with target `900.6 BYN`, then clicked `Не следить` and received `Больше не
    слежу за этой ценой`. Post-cleanup doctor showed `priceWatch.ok=true`,
    `enabled=true`, `kvConfigured=true`, `totalIndexed=0`, and
    `activeSample=0`.
  - 2026-05-22 hardening follow-up deployed Worker version
    `5f9e4176-2f4b-4d2c-825b-b0f4623711e9`: added `WORKER_PUBLIC_URL` so
    scheduled private price-watch notifications no longer depend on a hardcoded
    `workers.dev` app URL. Regression coverage asserts scheduled watch
    notifications use the configured public app URL.
  - Docker production proof is now closed: Docker Desktop daemon was started,
    `npm run docker:smoke` was added, and the command built
    `onliner-buyer-advocate-bot:local`, started a temporary container, verified
    `/api/health` with `ok=true`, and stopped the container. The latest clean
    run used temporary container `onliner-buyer-advocate-bot-smoke-1779405548718`
    on local port `19603`.
  - Current post-deploy verification for version
    `5f9e4176-2f4b-4d2c-825b-b0f4623711e9`: `npm run lint`,
    `npm run worker:test:webapp`, `npm run worker:dry-run`,
    `npm run verify:prod`, `npm run worker:deploy`, `npm run worker:doctor`,
    `npm run smoke:telegram`, `npm run docker:smoke`, and
    `npm audit --omit=dev` passed. `npx wrangler versions view` confirmed
    handlers `fetch, scheduled`, secrets, `DEAL_ALERTS_KV`, and
    `WORKER_PUBLIC_URL`. `npm run worker:channel-gate` is still intentionally
    red only because no real Cloudflare scheduled event has been recorded yet:
    `schedulerEvidence.hasSchedulerRun=false`, `schedulerRuns=0`; the next
    configured slot after the last check at `2026-05-22T02:21:57+03:00` is
    `2026-05-22T03:00:00+03:00`.
  - Added `npm run worker:channel-gate:wait` for hands-free cron proof. Its
    one-shot test mode (`CHANNEL_GATE_ONCE=true`) ran against production and
    returned the expected single remaining failure:
    `no scheduler-run has been recorded in channel audit yet`.
  - Live Onliner discount endpoint proof after the latest deploy:
    `GET /api/catalog/deals?minDiscountPercent=20` returned HTTP 200,
    `ok=true`, and 3 publishable candidates. Top candidates were
    `aj159pwhite` at `119 BYN` / `63.9%`, `prf0181338` at `2091.9 BYN` /
    `69.5%`, and `lego41739` at `81.88 BYN` / `69.4%`, with Onliner seller
    offer counts present for each.
  - Dependency hardening: upgraded dev dependency `wrangler` from `4.93.0` to
    `4.93.1`, removing the `miniflare -> ws` moderate audit finding. Current
    `npm audit`, `npm run lint`, `npm run worker:test:webapp`,
    `npm run worker:dry-run`, and `npm run docker:smoke` passed after the
    lockfile update. Docker build now reports `found 0 vulnerabilities` during
    `npm ci` and after production `npm prune --omit=dev`.
  - 2026-05-22 public Worker API hardening deployed Worker version
    `fc27db46-de6f-418f-b081-f4dc9a661c94`: public catalog endpoints
    `/api/catalog/search`, `/api/catalog/product`, and `/api/catalog/deals`
    now use Cloudflare native `PUBLIC_API_RATE_LIMITER` first, with the
    existing KV/memory limiter only as fallback when the binding is absent.
    Config is `PUBLIC_API_RATE_LIMIT_MAX=60` and
    `PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS=60`. `npx wrangler versions view`
    confirmed `env.PUBLIC_API_RATE_LIMITER (60 requests/60s) Rate Limit`.
    Protected production `GET /api/rate-limit/doctor?attempts=70` returned
    `bindingConfigured=true`, `fallbackKvConfigured=true`, `successCount=61`,
    and `firstLimitedAt=62`. This is the correct proof surface because
    Cloudflare's rate-limit binding is permissive/eventually consistent across
    ordinary requests; naive browser/request bursts are not a strict exact-429
    proof.
  - Telegram doctor observability now includes webhook `pendingUpdateCount`,
    `lastErrorAt`, and `lastErrorAgeHours`. Production doctor at 02:37 Minsk
    returned `pendingUpdateCount=0`; Telegram still reports an old webhook
    `lastErrorMessage` from `2026-05-21T21:22:05.000Z`, but it is stale
    enough that the doctor gives no current recommendation.
  - Fresh manual Telegram Web QA at 02:40 Minsk confirmed real bot callback
    behavior in the logged-in browser: `Следить за ценой` created a watch for
    `Xiaomi Redmi Note 15 Pro 5G 8GB/256GB` at `948 BYN` with target
    `900.6 BYN`, and the newly returned `Не следить` button removed it with
    `Больше не слежу за этой ценой`. The test subscription was cleaned up.
    Text entry through the browser automation surface was blocked by the
    session's missing virtual clipboard, so command typing was not used as the
    manual proof.
  - Fresh direct Mini App production QA opened
    `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/app`,
    loaded live results (`Показано: 30 из 7346`), clicked `Разобрать` for
    `Xiaomi Redmi Note 15 Pro+ 5G`, and saw a completed analysis with
    Onliner Marketplace `47` offers, 20/20 processed reviews, and
    `5 элемент (pilot): 2 предлож., 1699 BYN`. The `Видеокарты` category
    then loaded `Показано: 30 из 2409`; clicking `Разобрать` for
    `Gigabyte GeForce RTX 5070 Gaming OC 12G` produced an analysis with
    Onliner Marketplace `69` offers, 9/9 processed reviews, and
    `5 элемент (pilot): 1 предлож., 2666 BYN`.
  - Fresh production verification at 02:37-02:42 Minsk passed:
    `npm run worker:doctor`, `npm run smoke:telegram`, `npm run verify:prod`,
    `npm run contract:onliner`, and live
    `GET /api/catalog/deals?minDiscountPercent=20&limit=5`. The deals endpoint
    returned HTTP 200 with live candidates including `aj159pwhite` at
    `119 BYN` / `63.9%`, `prf0181338` at `2091.9 BYN` / `69.5%`, and
    `lego41739` at `81.88 BYN` / `69.4%`.
  - Current not-100-percent items remain explicit: `npm run worker:channel-gate`
    is still red because no real Cloudflare `scheduled` event has been recorded
    in durable channel audit yet (`schedulerEvidence.hasSchedulerRun=false`,
    `schedulerRuns=0`); production personal price-watch notification from a
    real Cloudflare cron with a real active watch is still unproven; broad
    cross-market comparison remains Onliner Marketplace plus a `5 элемент`
    pilot where matching works, while generic `external_sites` is still
    `not_configured`.
  - 2026-05-22 scheduled-task audit hardening deployed Worker version
    `74bbfdcc-6101-4ee2-b232-53f3f9ab0631`: every real Cloudflare
    `scheduled()` invocation now writes a combined durable KV audit under
    `scheduled-tasks:audit-*`, exposed as `scheduledTaskAudit` in
    `/api/channel/status` and `scheduledAudit` / `schedulerEvidence` in
    `/api/price-watch/status`. Local coverage added to
    `scripts/test-worker-webapp.mjs` proves that scheduled price-watch
    notification runs are preserved in audit history and cooldown runs do not
    resend.
  - First real production Cloudflare cron proof is now green. At
    `2026-05-22T03:17:06+03:00`, `npm run worker:channel-gate` exited zero:
    latest scheduler run at `2026-05-22T00:00:48.798Z`, cron `0 */6 * * *`,
    `schedulerEvidence.hasSchedulerRun=true`, `schedulerRuns=1`,
    selected `aj159pwhite`, and reason `duplicate_suppressed_69h_left`.
    This proves the channel did not repost because KV dedupe worked, not because
    cron failed.
  - The same production doctor run proved scheduled price-watch scanner entry:
    `/api/price-watch/status` returned `schedulerEvidence.hasSchedulerRun=true`,
    `schedulerRuns=1`, `latestScheduledRunAgeHours=0.3`,
    `scheduledTime=2026-05-22T00:00:48.000Z`, `cron=0 */6 * * *`,
    `checked=0`, `active=0`, `notified=0`, `failed=0`, and `scannedKeys=0`.
    There were no active watches after manual cleanup, so this proves the
    scheduled scanner executed but does not prove a real private notification
    from cron with an active watch.
  - Fresh external/review production proof after the scheduled-audit deploy:
    `GET /api/catalog/product` for `redminote15p1br` returned Onliner
    Marketplace `47` offers at `1199 BYN`, `5 элемент (pilot)` `2` offers at
    `1699 BYN`, and `20/20` processed reviews over `2` pages;
    `redminote15p5ti` returned Onliner Marketplace `48` offers at `990 BYN`,
    `5 элемент (pilot)` `1` offer at `1399 BYN`, and `20/20` reviews;
    `gvn5070gamingoc` resolved to `gvn5070gamingoc1`, returned Onliner
    Marketplace `69` offers at `2291.34 BYN`, `5 элемент (pilot)` `1` offer at
    `2666 BYN`, and `9/9` reviews. This proves the current pilot is alive on
    several categories, but not that all RB sites are connected.
  - Post-deploy verification for `74bbfdcc-6101-4ee2-b232-53f3f9ab0631`:
    `npm run lint`, `npm run worker:test:webapp`, `npm run worker:dry-run`,
    `npm run worker:deploy`, `npm run worker:doctor`, `npm run
    worker:channel-gate`, `npm run smoke:telegram`, `npm run verify:prod`,
    `npm audit`, `npm run docker:smoke`, and `npx wrangler versions view
    74bbfdcc-6101-4ee2-b232-53f3f9ab0631` passed or returned the expected
    green status. `wrangler versions view` confirmed handlers
    `fetch, scheduled`, secrets, `DEAL_ALERTS_KV`, `PUBLIC_API_RATE_LIMITER`,
    `ENABLE_CHANNEL_CRON=true`, and `ENABLE_PRICE_WATCHES=true`.
  - `scripts/worker-doctor.mjs` now checks the external price pilot across
    multiple control inputs (`redminote15p5ti`, `redminote15p1br`,
    `gvn5070gamingoc` by default) instead of letting one transient 5element
    miss turn the whole production doctor red. Fresh run returned
    `externalPrice.ok=true`, `readyCount=3`, `checkedCount=3`, with 5element
    offers at `1399`, `1699`, and `2666 BYN` respectively.
  - 2026-05-22 price-watch notification proof deployed Worker version
    `f856b9cc-e1ae-402a-b6e0-af32939bad6c`: added protected
    `GET /api/price-watch/doctor?input=...`, a dry-run notification doctor that
    resolves a live Onliner product, simulates a threshold-hit subscription,
    returns the exact notification preview and Mini App reply markup, and does
    not create a KV subscription or send Telegram. Production proof for
    `redminote15p5ti` returned `readyForNotificationPath=true`, `dryRun=true`,
    `shouldNotify=true`, app URL
    `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/app`, preview
    `Цена достигла твоего порога.`, and `totalIndexed/activeSample` stayed
    `0/0` before and after the doctor call.
  - Latest production doctor after the notification proof returned Telegram
    green, channel scheduler gate green, price-watch scheduler evidence green,
    and notification doctor green. External 5element controls returned
    `readyCount=2` of `checkedCount=3`; the RTX control missed on that run, so
    5element remains correctly labeled as `pilot` rather than a guaranteed
    all-category source.
  - 2026-05-22 follow-up hardening split the channel cron gate into started vs
    24h maturity. `scripts/channel-maturity.mjs`,
    `scripts/channel-maturity-gate.mjs`, `scripts/wait-channel-maturity-gate.mjs`,
    and `scripts/worker-doctor.mjs` now expose `startedOk`, `mature24hOk`,
    `schedulerHistorySpanHours`, and strict `npm run worker:channel-gate:24h`.
    Fresh production gate output showed `startedOk=true`, `mature24hOk=false`,
    `schedulerRuns=1`, `schedulerHistory.spanHours=0`, so the normal gate is
    green while the strict 24h gate is correctly red until more real cron runs
    accumulate.
  - The same follow-up tightened source honesty. `PriceComparisonSource` now
    exposes `sourceType` (`marketplace`, `external_pilot`, `placeholder`) and
    `confidence` (`high`, `pilot`, `none`), Telegram/Mini App text now says
    `Проверенные источники цен:`, and 5element output explicitly says it is a
    price-only pilot with heuristic matching.
  - Deployed this hardening as Cloudflare Worker version
    `c560a4dc-3af5-4b0f-a61c-774b9ec812d8` at `2026-05-22T00:55:07.724Z`.
    `wrangler versions view` confirmed handlers `fetch, scheduled`, KV
    `DEAL_ALERTS_KV`, rate limit binding `PUBLIC_API_RATE_LIMITER`, Telegram
    secrets, and the enabled cron/price-watch/channel flags. Production checks
    after deploy:
    `npm run worker:doctor`, `npm run worker:channel-gate`, `npm run
    worker:channel-gate:24h`, public `GET /api/catalog/product`, and in-app
    browser Mini App smoke. The normal gate returned `startedOk=true` and
    `mature24hOk=false`; the strict 24h gate correctly exited non-zero with
    `schedulerRuns 1 < 5` and `scheduler history span 0h < 24h`. Public product
    API for `redminote15p1br` returned Onliner Marketplace as
    `sourceType=marketplace`, `confidence=high`, and 5element as
    `sourceType=external_pilot`, `confidence=pilot`.
  - Browser smoke on the deployed Mini App loaded
    `https://onliner-buyer-advocate-bot.georgaishkin.workers.dev/app`, showed
    `Показано: 30 из 7346`, clicked the first `Разобрать`, and verified the
    analysis panel text `Проверенные источники цен:` plus
    `5 элемент (pilot): 2 предлож., 1699 BYN; price-only pilot, совпадение
    эвристическое.` Screenshot capture from the in-app browser timed out, but
    the DOM snapshot confirmed the visible text and flow.
  - Latest local verification after the deploy passed: `npm run verify:prod`
    (now includes `worker:test:maturity`), `npm run worker:test:webapp`,
    `npm audit`, and `npm run docker:smoke`.
  - 2026-05-22 price-watch scanner proof deployed Worker version
    `38d21fd8-94ee-4570-84d8-970ba474496e` at `2026-05-22T01:07:08.690Z`.
    Added protected `GET /api/price-watch/scan-doctor?input=...`: it creates
    one temporary KV price-watch subscription, runs the real scanner with
    `dryRunDelivery=true`, verifies the notification branch without Telegram
    delivery, checks `lastNotifiedAt`, and removes the temporary subscription
    and index key before returning.
  - Production scan-doctor proof for `redminote15p5ti` returned HTTP 200 with
    `readyForScheduledScanPath=true`, `dryRunDelivery=true`,
    `telegramSent=false`, `scan.checked=1`, `scan.active=1`,
    `scan.notified=1`, `scan.failed=0`, `scan.scannedKeys=1`,
    event `deliveryStatus=dry_run`, preview `Цена достигла твоего порога.`,
    and `temporarySubscription.cleanedUp=true`. A follow-up
    `/api/price-watch/status` returned `totalIndexed=0`, `activeSample=0`,
    proving the doctor did not leave a production watch behind.
  - Post-deploy verification for `38d21fd8-94ee-4570-84d8-970ba474496e`:
    `npm run verify:prod`, `npm run worker:test:webapp`, `npm audit`, `npm run
    worker:dry-run`, `npm run worker:deploy`, `npm run worker:doctor`,
    `npm run worker:channel-gate`, direct
    `/api/price-watch/scan-doctor`, `/api/price-watch/status`,
    `npm run worker:channel-gate:24h`, `npx wrangler versions view
    38d21fd8-94ee-4570-84d8-970ba474496e`, and `npm run docker:smoke` were
    run. Normal channel gate is green; strict 24h gate is correctly red with
    `schedulerRuns 1 < 5` and `scheduler history span 0h < 24h`.
  - 2026-05-22 aggregate release gate added in repo scripts, no Worker redeploy
    required: `scripts/release-readiness-core.mjs`,
    `scripts/release-readiness.mjs`, and
    `scripts/test-release-readiness.mjs`. `npm run verify:prod` now includes
    `worker:test:release`. `npm run worker:release-gate` checks Telegram live
    delivery, live Onliner, started cron, price-watch preview, price-watch
    scanner dry-run, source-honesty metadata, and external pilot controls in
    one production summary. Fresh production output returned
    `productionUsableOk=true`, `publicReleaseMatureOk=false`, all required
    checks green, `schedulerRuns=1`, `schedulerHistorySpanHours=0`, and the
    expected recommendation to keep the goal active until 24h maturity is green.
    `npm run worker:release-gate:mature` correctly exited non-zero with the
    same 24h maturity failure. Local verification after this change:
    `npm run lint`, `npm run worker:test:release`, `npm run
    worker:test:webapp`, `npm run verify:prod`, and `npm audit` passed.
  - 2026-05-22 user-facing Telegram status hardening deployed Worker version
    `da6655be-5fc5-4aca-939a-6e9d8d186e21` at `2026-05-22T01:16:53.991Z`.
    `/health` / `🏥 Статус` in Telegram now returns a practical user summary:
    webhook handled, live Onliner API used during product analysis, review page
    limit, current comparison sources (`Onliner Marketplace + 5 элемент
    (pilot)`), explicit `это не все сайты РБ`, price-watch availability, and
    channel state. Local `scripts/test-worker-webapp.mjs` asserts this copy so
    future edits do not regress back to vague `Worker online` text.
  - Verification after the status-command deploy: `npm run verify:prod`,
    `npm audit`, `npm run worker:dry-run`, `npm run worker:deploy`, `npm run
    worker:release-gate`, `npm run worker:doctor`, `npx wrangler versions view
    da6655be-5fc5-4aca-939a-6e9d8d186e21`, and `npm run docker:smoke` passed.
    Production `worker:release-gate` returned `productionUsableOk=true`,
    `publicReleaseMatureOk=false`, all required checks green, and the expected
    24h maturity recommendation. The strict maturity gap remains
    `schedulerRuns 1 < 5`.
  - 2026-05-22 anti-manipulation discount hardening added after a real Onliner
    watch example showed a seller-style high-price spike: `Casio MTP-1302PD-1A1`
    currently shows `229 BYN` and advertised `-68%` against a short `705 BYN`
    spike, but the 12-month stable median is about `265.64 BYN`. Worker and
    Express product analysis now prefer Onliner `prices-history?period=12m`
    when it has at least 4 points and only fall back to `period=2m` when the
    yearly evidence is too thin. Product payloads now expose
    `advertisedDiscountPercent` and `priceManipulationWarning`; Telegram,
    Mini App, and local React messages surface the warning when the advertised
    discount is not confirmed by stable history.
  - Local live proof against current Onliner for `mtp1302pd1a1` returned
    `currentPrice=229`, `medianPrice=265.64`,
    `advertisedDiscountPercent=68`, `honestDiscountPercent=13.8`,
    `isFakeDiscount=true`, `historyEndpoint=...period=12m`, and warning
    `Возможен короткий завышенный пик цены.` This directly covers the seller
    trick shown in the user's screenshot.
  - Discount radar hardening from the same pass: `ONLINER_DEAL_SCAN_PAGES`
    added and raised to `3`, `ONLINER_DEAL_ANALYZE_LIMIT` raised to `6`,
    `/api/onliner/deals-doctor` and release gate now prove live
    `catalog.api.onliner.by/super-prices`; request-level `minDiscountPercent`
    no longer mutates `env`, and channel publish reserves KV dedupe before
    sending Telegram so a KV write failure cannot send an untracked duplicate.
  - Verification after these local changes passed: `npm run lint`,
    `npm run worker:test:webapp`, `npm run worker:test:release`,
    `npm run verify:prod`, `npm audit`, and `npm run worker:dry-run`.
    Cloudflare deploy is currently blocked outside the code: repeated
    `wrangler deploy`, `wrangler versions upload`, and `npx wrangler@4.94.0
    deploy` attempts failed with Cloudflare API
    `entitlements.not_available [code: 10007]`. A diagnostic attempt without
    the native `[[ratelimits]]` binding produced the same API error, so the
    binding was restored. Existing production remains deployed at version
    `2461280e-3972-4ecf-b2da-d65c081e26fc`; the new anti-manipulation logic is
    verified locally but not yet deployed until Cloudflare upload/deploy access
    recovers.
  - Because current production selected `mtp1302pd1a1` during the 12:00 UTC
    cron before the new protection could be deployed, a correction message was
    sent to the Telegram channel via the configured bot. Telegram returned
    `ok=true`, correction `message_id=5`; the message states that the real
    12-month-history discount is about `13.8%`, not `68%`, and warns about the
    short high-price spike.
  - 2026-05-22 full production verification after Cloudflare deploy recovered:
    `npm run worker:deploy` succeeded and deployed Worker version
    `3ce714e7-b102-4e4a-aebe-809c17de9152` at
    `2026-05-22T16:25:30.797Z`. Post-deploy checks passed:
    `npm run verify:prod`, `npm run worker:test:webapp`, `npm audit`,
    `npm run worker:dry-run`, `npm run worker:release-gate`,
    `npm run worker:doctor`, direct public
    `/api/catalog/product?input=mtp1302pd1a1`, and `npx wrangler versions view
    3ce714e7-b102-4e4a-aebe-809c17de9152`.
  - Production now includes the seller-spike protection for the user's Casio
    example. Public Worker response for `mtp1302pd1a1` returned
    `currentPrice=229`, `medianPrice=265.64`,
    `advertisedDiscountPercent=68`, `honestDiscountPercent=13.8`,
    `isFakeDiscount=true`, warning
    `Заявленная скидка 68% не подтверждается устойчивой историей Onliner...`,
    `historyPoints=12`, and `historyEndpoint=...period=12m`.
  - Manual browser QA was run through the in-app browser and Telegram Web.
    Mini App loaded `/app`, searched `Casio MTP-1302PD-1A1`, clicked
    `Разобрать`, and showed the same warning plus `Проверенные источники цен`
    with Onliner Marketplace and 5 элемент pilot state; Mini App console had
    no error/warning logs. Telegram Web direct chat test sent `/health`,
    `mtp1302pd1a1`, and `/deals`; the bot responded with live webhook status,
    the Casio anti-manipulation warning, reviews summary, checked price
    sources, and live Onliner discounts from `catalog.api.onliner.by/super-prices`.
  - Remaining non-green gate is only public-release maturity:
    `npm run worker:channel-gate:24h` still correctly exits non-zero with
    `schedulerRuns 3 < 5` and `scheduler history span 12h < 24h`. Normal
    production usability is green (`productionUsableOk=true`), but keep the
    goal open until the 24h maturity gate turns green.
  - 2026-05-22 additional seller-trick hardening for the Ajazz mouse example:
    Onliner page `aj159pwhite` showed advertised `-69%` against a temporary
    `382 BYN` high-price plateau, while the 12-month stable median was
    `186.13 BYN` and current price `119 BYN`, so the honest discount is
    `36.1%`. Worker and Express now also flag cases where the advertised
    discount is materially higher than the stable-history discount, not only
    cases where the stable discount is near zero.
  - Deployed Worker version `1b0ebc7a-b385-4476-a062-39c1acb7b0b6` at
    `2026-05-22T16:40:44.184Z`. Live public API for `aj159pwhite` returned
    `advertisedDiscountPercent=69`, `honestDiscountPercent=36.1`,
    `isFakeDiscount=true`, warning
    `Заявленная скидка 69% сильно завышена относительно устойчивой истории
    Onliner...`, `historyPoints=9`, and `historyEndpoint=...period=12m`.
  - Verification after the Ajazz hardening passed: `npm run lint`,
    `npm run worker:test:webapp`, `npm run worker:test:release`,
    `npm run verify:prod`, `npm audit`, `npm run worker:dry-run`,
    `npm run worker:deploy`, `npm run worker:release-gate`,
    `npm run worker:doctor`, direct `/api/catalog/product?input=aj159pwhite`,
    direct `/api/catalog/deals`, `npx wrangler versions view
    1b0ebc7a-b385-4476-a062-39c1acb7b0b6`, and manual Mini App + Telegram Web
    checks. Fresh `/api/catalog/deals` returned only `dcl284frf` and
    `stankn12`; `aj159pwhite` is no longer publishable. Fresh Telegram
    `/deals` also omitted Ajazz; older chat messages may still contain prior
    pre-hardening `/deals` output.
