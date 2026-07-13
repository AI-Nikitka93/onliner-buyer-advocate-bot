# Onliner Buyer Advocate Bot

Неофициальный Telegram-бот и канал для проверки товаров Onliner.by в роли
«цифрового адвоката покупателя».

## Что уже умеет

- Express + React интерфейс для локальной проверки сценариев бота и канала.
- Live-чтение публичных JSON-эндпоинтов Onliner:
  - поиск товаров;
  - карточка товара;
  - текущие предложения/цены;
  - график минимальных цен `products/{key}/prices-history`;
  - отзывы.
- Расчет честного отклонения текущей цены от медианы исторических точек
  Onliner. `data/runtime-state.json` используется для кэша и собственных
  runtime-снимков, а не для подделки истории.
- Telegram webhook endpoints:
  - `POST /telegram/webhook`
  - `POST /api/telegram/webhook`
- Admin API protection for channel publishing and webhook setup:
  - `ADMIN_API_TOKEN`
  - `Authorization: Bearer ...` or `x-admin-token: ...`
- Telegram readiness doctor:
  - `getMe` validates the bot token;
  - `getChat` validates the channel id;
  - `getChatMember` validates channel admin/posting rights;
  - `getWebhookInfo` reads back current webhook state.
- Onliner live-source doctor:
  - проверяет живой поиск/карточку/историю цен;
  - показывает `live_ok`, `live_unavailable_cache_available` или
    `live_unavailable_no_cache`;
  - пишет audit-run в runtime state.
- Background channel scheduler:
  - Express: `AUTO_PUBLISH_CHANNEL=true`
  - Worker: `ENABLE_CHANNEL_CRON=true`
  - `CHANNEL_POLL_INTERVAL_MINUTES`
  - optional `CHANNEL_POLL_ON_START=true` for smoke runs
  - `DEAL_ALERTS_KV` binding for Worker duplicate suppression
  - Worker deal search reads live Onliner `catalog.api.onliner.by/super-prices`
    first, then falls back to `ONLINER_POLL_QUERY`.
  - Worker product answers and final channel post previews include the labeled
    `5 элемент (pilot)` price-only source when `ENABLE_5ELEMENT_PILOT=true`.
  - Worker stores a durable channel audit log in `DEAL_ALERTS_KV` so manual and
    scheduled runs can be inspected after the fact.
- Personal price watches:
  - product answers include `Следить за ценой`;
  - the Worker stores explicit user opt-ins in `DEAL_ALERTS_KV`;
  - scheduled scans run only when `ENABLE_PRICE_WATCHES=true`;
  - default notification threshold is controlled by `PRICE_WATCH_DROP_PERCENT`.
- Stale-cache fallback: если live Onliner временно недоступен, бот может
  показать последний сохраненный live-снимок только с явной меткой
  `fallback`/`stale cache`; автопубликация в канал из stale-кэша не выполняется.
- Публикация поста в канал через Telegram Bot API, но только если явно включено
  `ENABLE_TELEGRAM_DELIVERY=true`.

## Локальный запуск

1. Установить зависимости:
   ```bash
   npm install
   ```

2. Создать `.env` по примеру `.env.example`.

3. Запустить dev-сервер:
   ```bash
   npm run dev
   ```

4. Открыть:
   ```text
   http://localhost:3000
   ```

## Проверки

```bash
npm run lint
npm run build
npm run verify:prod
npm run contract:onliner:soft
```

После `npm run build` production запуск:

```bash
npm start
```

Container build/run surface:

```bash
docker build -t onliner-buyer-advocate-bot:local .
docker compose -f docker-compose.example.yml up --build
```

Secrets still come from local `.env` or the hosting platform env manager; the
image does not contain `.env` or runtime state.

`npm run verify:prod` запускает TypeScript-check, production build и
детерминированные smoke-проверки сервера: admin-token защиту, Telegram doctor,
dry-run генерацию поста и Telegram webhook без внешних секретов.

Live-контракт Onliner вынесен отдельно:

- `npm run contract:onliner` — строгая проверка внешних JSON-эндпоинтов Onliner;
- `npm run contract:onliner:soft` — тот же контракт, но временный TCP/HTTPS
  timeout возвращает JSON `network_unavailable` без падения команды;
- `npm run verify:live` — production verify плюс строгий Onliner contract.

Public release gates are tracked in
`docs/RELEASE_GATE_2026-05-20.md`.

GitHub Actions workflow `.github/workflows/verify.yml` runs
`npm run verify:prod` and `npm run contract:onliner:soft` without requiring
secrets.

## Telegram

Минимальные переменные:

```env
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHANNEL_ID="@your_channel_or_-100_id"
TELEGRAM_WEBHOOK_SECRET="random_secret"
ENABLE_TELEGRAM_DELIVERY="false"
ENABLE_CHANNEL_CRON="false"
ADMIN_API_TOKEN="<admin-token>"
```

Пока `ENABLE_TELEGRAM_DELIVERY=false`, сервис работает в `dry-run`: генерирует
тексты, сохраняет state, но не отправляет сообщения в Telegram.

## Cloudflare Worker 24/7

Для бесплатного 24/7 Telegram webhook используется Cloudflare Workers:

```bash
npm run worker:dry-run
npm run worker:deploy
npm run worker:doctor
```

Текущий deployed endpoint:

```text
https://onliner-buyer-advocate-bot.georgaishkin.workers.dev
```

Worker endpoints:

- `GET /app` - Telegram Mini App каталог Onliner
- `POST /telegram/webhook`
- `GET /api/health`
- `GET /api/catalog/categories`
- `GET /api/catalog/search?schema=mobile&query=redmi`
- `GET /api/catalog/product?input=redminote15p1br`
- `GET /api/catalog/deals`
- `GET /api/telegram/doctor`
- `POST /api/telegram/set-webhook`
- `GET /api/onliner/doctor`
- `GET /api/onliner/deals-doctor`
- `GET /api/external-price/doctor?input=redminote15p5ti`
- `GET /api/channel/status`
- `GET /api/price-watch/status`
- `GET /api/price-watch/doctor?input=redminote15p5ti`
- `GET /api/price-watch/scan-doctor?input=redminote15p5ti`
- `POST /api/channel/publish-best-deals`

Cloudflare secrets are set with `wrangler secret put` and must not be committed:

- `TELEGRAM_BOT_TOKEN`
- `ADMIN_API_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- optional after channel creation: `TELEGRAM_CHANNEL_ID`

Project helper scripts:

```bash
npm run worker:secrets
npm run worker:set-webhook
npm run worker:test:webapp
npm run worker:doctor
npm run worker:release-gate
npm run worker:release-gate:mature
npm run docker:smoke
```

After the Telegram channel is created and the bot is added as admin, put
`TELEGRAM_CHANNEL_ID=@channel_username` or `TELEGRAM_CHANNEL_ID=-100...` into
local `.env`, then run:

```bash
npm run worker:secrets:channel
npm run worker:doctor
```

`wrangler.toml` enables a cron trigger every 6 hours. The Worker cron publishes
to the channel only when `TELEGRAM_CHANNEL_ID` exists,
`ENABLE_TELEGRAM_DELIVERY=true`, and `ENABLE_CHANNEL_CRON=true`.

Keep `ENABLE_CHANNEL_CRON=false` while creating the channel and testing manual
posts. For frequent discount radar, bind a Workers KV namespace as
`DEAL_ALERTS_KV`; without it, the Worker cannot reliably suppress repeated posts
for the same product across scheduled runs.

Current production state on 2026-05-22: Worker cron is enabled, `DEAL_ALERTS_KV`
is bound to Cloudflare KV namespace `facc5ea0e880428fb3d9997c591d1035`, and the
first real deal post was followed by `duplicate_suppressed_71h_left` on an
immediate repeat call. Use `npm run worker:doctor` or `GET /api/channel/status`
to check `schedulerEvidence`: `channelCronEnabled=true` means the switch is on,
while `schedulerEvidence.hasSchedulerRun=true` proves Cloudflare has actually
delivered at least one scheduled event into the Worker audit log.
`npm run worker:channel-gate` is the started gate. `npm run
worker:channel-gate:24h` is the stricter release gate and requires
`mature24hOk=true` after at least five visible scheduler runs spanning 24 hours.
`npm run worker:release-gate` is the aggregate production readiness check:
it checks Telegram delivery, live Onliner product data, live Onliner
`super-prices` discount radar, price-watch dry-runs, source honesty, and
external pilot controls before treating the bot as usable. `npm run
worker:release-gate:mature` adds the 24-hour scheduler maturity requirement and
is expected to stay red until enough real cron runs are visible.
Telegram `/health` / `🏥 Статус` returns a user-facing status summary: webhook
handled, Onliner source, review limit, price-watch/channel state, and the
explicit limitation that external comparison is not all RB sites.

Для webhook:

```http
POST /api/telegram/set-webhook
{"webhookUrl":"https://your-domain.example/telegram/webhook"}
```

## Важная честность данных

Текущий live-режим использует график минимальных цен Onliner. Для защиты от
хитрой схемы "сначала поднять цену, потом показать огромную скидку" бот сначала
берет годовой график `period=12m`, если в нем есть минимум 4 точки, и считает
скидку от устойчивой медианы. Двухмесячный `period=2m` используется только как
fallback, когда годовой истории мало. Если заявленная скидка сильно выше
расчета по устойчивой истории, ответ получает `isFakeDiscount=true` и
`priceManipulationWarning`.

## Admin и автоканал

В `NODE_ENV=production` админские endpoints не работают без
`ADMIN_API_TOKEN`. Это защищает:

- `POST /api/generate-channel-post`
- `POST /api/channel/publish-best-deals`
- `GET /api/telegram/doctor`
- `POST /api/telegram/set-webhook`
- `GET /api/onliner/doctor`
- `GET /api/onliner/audit-runs`

Перед включением Telegram delivery:

```bash
curl https://your-domain.example/api/telegram/doctor ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

Проверка live Onliner/cache:

```bash
curl "https://your-domain.example/api/onliner/doctor?query=redmi%20note%2015%20pro" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

Последние audit-runs:

```bash
curl "https://your-domain.example/api/onliner/audit-runs?limit=20" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

С `expectedWebhookUrl` doctor дополнительно сверяет текущий webhook:

```bash
curl "https://your-domain.example/api/telegram/doctor?expectedWebhookUrl=https://your-domain.example/telegram/webhook" ^
  -H "x-admin-token: %ADMIN_API_TOKEN%"
```

Для автоматического патруля канала:

```env
# Express scheduler:
AUTO_PUBLISH_CHANNEL="true"
CHANNEL_POLL_INTERVAL_MINUTES="360"

# Cloudflare Worker scheduler:
ENABLE_CHANNEL_CRON="true"
DEAL_REPOST_COOLDOWN_HOURS="72"
DEAL_REPOST_PRICE_DROP_PERCENT="2"

ONLINER_POLL_QUERY="redmi"
MIN_HONEST_DISCOUNT_PERCENT="20"
ONLINER_DEAL_SCAN_LIMIT="50"
ONLINER_DEAL_SCAN_PAGES="3"
ONLINER_DEAL_ANALYZE_LIMIT="6"
ONLINER_DEAL_MIN_PRICE_BYN="50"
ONLINER_DEAL_MIN_OFFERS="2"

ENABLE_5ELEMENT_PILOT="true"
FIVE_ELEMENT_SEARCH_API_KEY="08IE0509XQ"
```

Если `ENABLE_TELEGRAM_DELIVERY=false`, scheduler сохраняет dry-run посты
локально, но не отправляет их в Telegram. Для Worker частый автопатруль лучше
включать только после подключения `DEAL_ALERTS_KV`.

На текущем продакшен Worker `DEAL_ALERTS_KV` уже подключен, `ENABLE_CHANNEL_CRON`
включен, `ENABLE_PRICE_WATCHES` включен, `5 элемент (pilot)` включен,
расписание Cloudflare: `0 */6 * * *`. Реальные scheduled-запуски проверяются
через `schedulerEvidence` в `/api/channel/status` и `/api/price-watch/status`,
а не только по наличию cron в конфиге.
