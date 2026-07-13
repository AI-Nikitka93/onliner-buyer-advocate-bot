# RB Price Source Audit

Date: 2026-05-21

Purpose: decide which Belarus price sources can be added to the Telegram buyer
bot without pretending that fragile or blocked scraping is a reliable market
comparison.

Test query used for live smoke checks:

- `redmi note 15 pro 8/256`

## Decision

Do not claim "prices across all RB sites".

Honest user-facing wording should be:

- "Onliner Marketplace sellers" when using the current Onliner positions source.
- "5element live search" only after a dedicated adapter is implemented and
  monitored.
- "Other sites are checked only when they have a permitted adapter/feed, or when
  the user gives a direct product URL."
- "Kufar is classifieds/secondary market, not a store-price source."

## Source Matrix

| Source | Status | Live evidence | Main blocker |
| --- | --- | --- | --- |
| Onliner Marketplace | READY_NOW | Already deployed through `shop.api.onliner.by/products/{key}/positions`; live smoke for `redminote15p1br` returned 46 offers, 1199-1972.67 BYN. | This is Onliner sellers, not all external RB sites. |
| 5element.by | DEPLOYED_PILOT | Site loads Diginetica config from `https://cdn.diginetica.net/1892/client.js`; live call to `https://sort.diginetica.net/search?...` returned JSON products with `name`, `price`, `oldPrice`, `available`, and `link_url`. Deployed on 2026-05-22 as labeled `5 элемент (pilot)` with exact model/storage/network/color matching where possible; live `redminote15p5ti` returned `1` offer at `1399 BYN`. | This depends on a third-party search provider and must be rate-limited. It is price-only, not a partner stock/pricing contract, so do not describe it as official or as all RB sites. |
| AMD.by | POSSIBLE_BUT_FRAGILE | Live autocomplete endpoint `https://www.amd.by/index.php?route=extension/module/sphinxautocomplete&search=...&type=pc` returned HTML cards with title, URL, code, and price. Example: `Телефон Xiaomi Redmi Note 15 Pro 8GB/256GB...`, `1 019.70 BYN-like site symbol`. | HTML autocomplete, not a stable API. Needs parser maintenance and careful currency normalization. |
| 21vek.by | NOT_FOR_AUTOMATIC_SEARCH | Search page contains `__NEXT_DATA__` with product title/price/status when fetched manually. Example: `Смартфон Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB`, `1699.00`. | `robots.txt` disallows `/search`; do not use automatic search without permission/feed. |
| shop.by | NOT_FOR_AUTOMATIC_SEARCH | Search HTML has `schema.org/Product` and `AggregateOffer`; technically exposes title/URL/min price. | `robots.txt` disallows `*/find/*`, `*/find_tips/`, `*/model/*`, `?findtext=*`, and broad query URLs. Use only with permission/feed or user-provided direct URL. |
| deal.by | NOT_FOR_AUTOMATIC_SEARCH | Search HTML exposed product names/prices. Example: `Смартфон Redmi Note 15 Pro 4G 8/256Gb`, `795 руб.` | `robots.txt` disallows `/search` and broad query URLs. Marketplace search is noisy. |
| 1k.by | NOT_FOR_AUTOMATIC_SEARCH | Search endpoint responds, but tested query did not provide useful matched product data. | `robots.txt` disallows `/products/`, query URLs, and offer paths. |
| Kufar.by | SECONDARY_MARKET_ONLY | JSON endpoint responded with ads, `subject`, `price_byn`, `ad_link`, and seller/account parameters. Example: `Xiaomi redmi note 15 Pro 8/256 НОВЫЙ/ГАРАНТИЯ`, `760 BYN`. | Classifieds, not retail. `robots.txt` disallows query pages. New/used/grey-market listings must not be mixed into retail price comparison. |
| Wildberries.by | NOT_FOR_NOW | Public page loads, but direct `search.wb.ru` smoke returned `429 Too Many Requests`. Official WB API is seller/API-key oriented, not a public buyer search feed. | Anti-bot/rate limiting plus API terms. |
| Ozon.by | NOT_FOR_NOW | Search request entered repeated `__rr` redirect challenge in CLI. Official Ozon Seller API requires credentials and does not provide a general public buyer-search feed for our bot. | Anti-bot/challenge and seller-API scope. |
| Sila.by | NOT_FOR_AUTOMATIC_SEARCH | Search page returns HTML with product/price content. | `robots.txt` disallows `/search*` and `*?*`. |
| xistore.by | NOT_FOR_AUTOMATIC_SEARCH | Search page returns HTML with product/price content. | `robots.txt` disallows `/search/` and query URLs. |
| mi.by | NOT_FOR_AUTOMATIC_SEARCH | Search page returns HTML with product/price content. | `robots.txt` disallows `*/search/`, `?q=`, and broad query URLs. |
| shop.mts.by | NOT_FOR_AUTOMATIC_SEARCH | Search page returns HTML with product/price content. | `robots.txt` disallows `*/search/*`, `?q`, and filter query URLs. |

## Recommended Bot Behavior

1. Keep the current Onliner Marketplace block as the only deployed "RB price
   comparison" source until another adapter is added and tested.
2. Keep `5element.by` as the first deployed external pilot, labeled explicitly
   as `5 элемент (pilot)`, with exact matching by model, memory, network
   variant, and color where possible.
3. Add `AMD.by` only as a second pilot if we accept an HTML-autocomplete parser
   and test it in CI with fixtures.
4. Add a separate "secondary market" section for Kufar, not mixed into store
   prices.
5. For 21vek/shop.by/deal.by/1k/sila/xistore/mi/mts: do not run automatic search
   scraping. If needed, build a "check pasted URL" feature, or use a partner
   feed/API.

## Matching Rules Before Showing a Price

- Require brand and base model match.
- Require memory match when the query/product has memory (`8/256`, `12/256`,
  etc.).
- Separate `Pro`, `Pro+`, `5G`, and non-5G variants.
- Separate new retail offers from classifieds and used/refurbished offers.
- Show source name, timestamp, and a confidence label.
- If confidence is low, show "possible matches" instead of a price comparison.
- 2026-05-22 implementation note: `PriceComparisonSource` now exposes
  `sourceType` and `confidence`; the UI says `Проверенные источники цен:` and
  labels 5element as a price-only pilot with heuristic matching.

## User-Facing Copy

Recommended:

> Сравнение цен: сейчас проверены Onliner Marketplace и пилотные внешние
> источники, если они доступны. Я не смешиваю магазины, маркетплейсы и
> объявления Kufar в одну "лучшую цену".

Not allowed:

> Мы сравнили все сайты Беларуси.
