# AI Agents Project History Log

### 2026-07-13 18:30:00 +03:00 — System Audit, Code and Style fixes, and Dependency updates
- **Status**: DONE
- **Coordinate Agent**: Antigravity Coordinator (Gemini 3.5 Flash)
- **Subagents Triad**:
  1. QA Specialist (`dabc69c5-698d-472a-9c0f-677a72d5b84e`)
  2. System Auditor (`fc5204b7-3db8-4cd6-a5a7-18de2b239ed3`)
  3. Release Manager (`c1131e9d-15dc-4ba0-bf2c-6702a41f0a39`)
- **Vulnerabilities Patched**: Run `npm audit fix` resolved all 8 security vulnerabilities (vite, undici, ws, protobufjs, esbuild, @babel/core).
- **Dependencies Updated**: 42 outdated npm packages safely updated to their latest semver-compatible versions.
- **Code & Logic Fixes**:
  - **Heuristic matching bug resolved** in `worker/index.ts`: Replaced `storageSignature` with a robust `parseMemory` utility which extracts and compares both RAM and storage size (normalizing TB to GB). It explicitly rejects candidates with differing memory configurations.
  - **Rate limiter transient KV failures resolved** in `worker/index.ts`: Wrapped all `env.DEAL_ALERTS_KV` reads/writes in a try-catch block to fail-open.
  - **Rate limiter TTL crash resolved** in `worker/index.ts`: Clamped `expirationTtl` to `Math.max(60, windowSeconds + 30)` to satisfy Cloudflare's minimum 60-second KV TTL rule.
  - **Missing SDAPI Price History fallback resolved** in `worker/index.ts`: Updated `getOnlinerPriceHistory` to fall back to `CATALOG_SDAPI_BASE` if `CATALOG_API_BASE` is unreachable.
- **Style Fixes**:
  - **Zero-Trust style gate resolved** in `src/index.css`: Replaced hardcoded CSS colors with CSS variables defined under the `@theme` directive, utilizing `var()` reference syntax to satisfy `adwp_guardrails.ps1`.
- **Verification Summary**:
  - `adwp_guardrails.ps1` -> PASS
  - `npm run verify:prod` (tsc lint, maturity tests, release readiness tests, vite build, server & telegram webhook smoke checks) -> PASS
  - `npm run contract:onliner:soft` -> PASS
  - `npm run worker:test:webapp` -> PASS
  - `npm run docker:smoke` -> FAIL (WSL/Docker host virtual hard disk `E_ACCESSDENIED` issue)
- **Git Status**: Staged and committed initial files.
- **Worker Deployment & Configuration (2026-07-13 18:40:00 +03:00)**:
  - **Account migration**: Migrated worker deployment to the active user account (`35cf1c14e9e9c6adcb3ab43d0082ba0c`).
  - **KV Namespace created**: Created a new `DEAL_ALERTS_KV` namespace (`85b6047d0b2b45d08d462bbadff51ef7`) and bound it in `wrangler.toml`.
  - **Worker Deployed**: Successfully deployed worker to `https://onliner-buyer-advocate-bot.alexaiartbel.workers.dev`.
  - **Subrequest Limit Optimization**: Added `skipShopEnrichment` to `productFromOnliner` and `enrichPriceComparison` options to prevent shop lookup fetches for all deal candidates during discount scans. This keeps subrequests during cron scans well below Cloudflare's limit of 50, resolving the `publish_exception` (Too many subrequests).
  - **Secrets Synced**: Uploaded `TELEGRAM_BOT_TOKEN`, `ADMIN_API_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `TELEGRAM_CHANNEL_ID` to the new worker.
  - **Webhook Configured**: Successfully set Telegram webhook pointing to the new worker URL via Bot API bypass.
  - **Git status**: Committed latest configuration and code changes.
- **Worker Instant Rare Deal Auto-Publishing (2026-07-13 18:48:00 +03:00)**:
  - **Implementation**: Added `autoPublishRareDeal(product, env)` helper to verify if a checked product is a rare discount (default threshold `>= 35%` honest discount, configurable via `AUTO_PUBLISH_RARE_THRESHOLD_PERCENT`), check channel deduplication, and instantly post to the Telegram channel.
  - **Endpoints Integration**: Integrated this function into webhook callback queries (`analyze:`), web app analyze calls (`/api/webapp/analyze`), and direct bot chat search queries.
  - **Verification**: Ran standard TS typings and verification suites. Deployed changes successfully to `https://onliner-buyer-advocate-bot.alexaiartbel.workers.dev`.
- **Multi-Deal Scheduled Publishing (2026-07-13 18:52:00 +03:00)**:
  - **Implementation**: Updated `publishBestDealCore` inside `worker/index.ts` to iterate through all scanned deal candidates. Instead of publishing only the single best deal, it can now publish up to 3 qualifying deals per scheduler run if they meet the steep/sharp discount threshold (default: >=25%).
  - **Verification & Deployment**: Completed test verification and redeployed to Cloudflare.
- **Price Threshold Constraint Lowered (2026-07-13 18:55:00 +03:00)**:
  - **Change**: Updated `ONLINER_DEAL_MIN_PRICE_BYN` from `50` to `15` BYN across wrangler.toml, local .env configuration, Worker codebase default, and local Express server configurations.
  - **Impact**: Enables scanning, catching, and publishing great discounts on cheaper goods (e.g. starting from 15 BYN instead of 50 BYN).
  - **Redeployment**: Changes deployed successfully to Cloudflare Workers.

### 2026-07-13 19:00:00 +03:00 — Deal-Scanning Logic Verification and Audit
- Changed: Created and executed a detailed verification and audit script for the Onliner catalog deal scanner and filtering logic.
- Files: `scripts/audit_onliner.ts`, `data/audit_results.json`.
- Verification: Ran `npx tsx scripts/audit_onliner.ts` to fetch 100 super-price discounts, fetch history, check criteria, and generate reports.
- Status: DONE

- **Rating Constraint Removed (2026-07-13 19:02:00 +03:00)**:
  - **Change**: Removed `ratingOk` constraint check from `isPublishableDeal` inside both `worker/index.ts` and `src/server/onliner.ts`.
  - **Impact**: Products with ratings under 4.0 (like popular SSDs and other products with mixed reviews) can now be published if they offer a genuine honest discount.
  - **Redeployment**: Changes compiled and deployed successfully to Cloudflare.
- **Extreme Discount Price Check Bypass (2026-07-13 19:04:00 +03:00)**:
  - **Change**: Added an exception in `isPublishableDeal` (both in Worker and Express server) where any deal with an honest discount $\ge 50\%$ automatically bypasses the minimum price constraint of 15 BYN.
  - **Impact**: Ensures that extreme/rare bargains (e.g. products marked down by 90%+ to 1 BYN) are captured and posted to the channel instead of being filtered.
  - **Redeployment**: Successfully updated and deployed to Cloudflare.
- **Final Verification & Test Suite Fixes (2026-07-13 19:50:00 +03:00)**:
  - **Correction**: Resolved testing assertions in `scripts/test-worker-webapp.mjs` by returning `dedupe` and `reason` of the primary candidate at the root of the `publishBestDealCore` returned object when looping through multiple deals.
  - **Verification results**: Ran `npm run verify:prod` (Lint, Maturity, Release, Build, server and telegram smoke tests) -> **PASS**. Ran `npm run worker:test:webapp` -> **PASS**.
  - **Redeployment**: Final verified worker deployed to Cloudflare successfully.
- **GitHub Repository Packaging (2026-07-13 19:54:00 +03:00)**:
  - **Change**: Added MIT LICENSE, SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, PULL_REQUEST_TEMPLATE.md, and structured YAML Issue templates (config, bug_report, feature_request). Rewrote README.md.
  - **Status**: DONE.
- **Bilingual Repository Documentation (2026-07-13 19:57:00 +03:00)**:
  - **Change**: Split README.md into two language variants. Created root English README.md and Russian README.ru.md, linking both at the top of each file to support international developers.
  - **Status**: DONE.
- **GitHub Screenshot Integration (2026-07-13 21:15:00 +03:00)**:
  - **Change**: Added responsive screenshots and branding assets to `docs/images/` and updated `README.md` and `README.ru.md` to reference them using relative paths.
  - **Status**: DONE.
- **README layout simplified (2026-07-13 22:23:00 +03:00)**:
  - **Change**: Removed Local Web Dashboard and Branding/Avatars sections from both READMEs.
  - **Status**: DONE.
- **Product-only README (2026-07-13 22:26:00 +03:00)**:
  - **Change**: Removed all local/CF/endpoints/verify command blocks from both READMEs. Only kept bot/channel value props, screenshots, and direct Telegram links.
  - **Status**: DONE.
