# Discount Alerts Channel Plan

Date: 2026-05-21

## Goal

Make discounts visible fast without misleading users:

- public Telegram channel for checked hot deals;
- bot/Web App for product analysis and later personal watchlists;
- no claim that every Belarus shop is covered until each source is verified.

## Telegram channel

Recommended channel name:

```text
Адвокат Покупателя BY | Скидки
```

Username candidates, in order:

```text
@BuyerAdvocateBYDeals
@AdvocateDealsBY
@BuyerDealsBY
```

Channel description:

```text
Живые проверенные скидки и падения цен по Onliner и подключенным источникам РБ. Без фейковых скидок и без рекламы. Проект AI_Nikitka93, не аффилирован с Onliner.by.
```

Pinned post draft:

```text
🛡 Здесь публикуются только проверенные сигналы:

- цена ниже истории, а не просто красивая рекламная скидка;
- есть реальные предложения продавцов;
- источник и ограничения указаны в посте.

Бот для разбора товара: @BuyerAdvocateBYBot
```

## Product design

Channel-first MVP:

1. User subscribes to the channel.
2. Worker scans live Onliner deals on schedule.
3. Worker posts only honest candidates: price below history, not fake discount, rating threshold, seller offers visible.
4. Every post links back to `@BuyerAdvocateBYBot` / Mini App for full analysis.

Personal alerts, next increment:

1. User opens bot or Web App and explicitly opts in.
2. User taps `Следить за ценой`.
3. Bot stores chat id, product key, threshold, last price and last notification time.
4. Scheduler sends a private alert only if the user has opted in and the threshold is crossed.

2026-05-22 implementation update:

- Product answers now include the `Следить за ценой` inline button.
- `watch:{productKey}` and `unwatch:{productKey}` callbacks store/remove explicit
  opt-ins in `DEAL_ALERTS_KV`.
- `/watchlist` lists the user's active price watches.
- Worker scheduled tasks scan personal watches when `ENABLE_PRICE_WATCHES=true`,
  using `PRICE_WATCH_DROP_PERCENT`, `PRICE_WATCH_SCAN_LIMIT`, and
  `PRICE_WATCH_NOTIFY_COOLDOWN_HOURS`.
- This is still a lightweight KV implementation. D1 remains the better future
  storage if watchlists need many users, indexing, analytics, or per-user
  threshold editing.

## Current implementation status

Implemented now:

- Worker manual channel publishing endpoint exists: `POST /api/channel/publish-best-deals`.
- Worker scheduled handler exists.
- `ENABLE_CHANNEL_CRON=false` is the safe setup default, so adding a channel id does not start scheduled posts by accident.
- Production Worker now has `ENABLE_CHANNEL_CRON=true`.
- `DEAL_ALERTS_KV` dedupe storage is bound for repeated deal suppression.
- Worker discount search now reads live Onliner `catalog.api.onliner.by/super-prices` first. The old `ONLINER_POLL_QUERY` path is only a fallback.
- Manual Worker publish supports `dryRun=true`, so agents can verify selected deal and post text without posting to the public channel.

Live channel radar status on 2026-05-22:

- Create Telegram channel from a user account. Done: `Адвокат Покупателя BY | Скидки` / `@BuyerAdvocateBYDeals`.
- Add `@BuyerAdvocateBYBot` as channel admin with post permission. Done, doctor verified `canPostMessages=true`.
- Set Worker secret `TELEGRAM_CHANNEL_ID`. Done: `-1003951031034`.
- Bind Workers KV namespace as `DEAL_ALERTS_KV` before frequent cron. Done:
  `facc5ea0e880428fb3d9997c591d1035`.
- Run `npm run worker:doctor` until channel checks pass. Done:
  `readyForLiveDelivery=true`, `readyForChannelCron=true`,
  `dealDedupeConfigured=true`.
- Do one manual real deal post. Done: `Ajazz AJ159P (белый)` /
  `aj159pwhite`, `119 BYN`, honest discount `63.9%`.
- Verify duplicate suppression. Done: immediate repeat returned
  `published=false`, `reason=duplicate_suppressed_71h_left`, and
  `dedupe.enabled=true`.

## Truth constraints

- Telegram Bot API does not let the bot start private conversations with users. Users must start the bot or opt in before private alerts.
- A bot can post to a channel only when it has access and the needed admin rights.
- Telegram broadcasts have rate limits; personal notifications use scheduler
  scan limits and cooldowns.
- Cloudflare KV free plan is enough for small dedupe/watch state, but it has
  daily read/write limits.
- D1 is the better next storage for personal watchlists because it needs indexed
  user/product rows at scale.

## Sources checked

- Telegram bots introduction: https://core.telegram.org/bots
- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram bot broadcasting FAQ: https://core.telegram.org/bots/faq
- Cloudflare Workers KV pricing: https://developers.cloudflare.com/kv/platform/pricing/
- Cloudflare D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
