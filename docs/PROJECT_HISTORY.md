# Project History

### 2026-07-13 18:24:00 +03:00 — Dependency audit and update
- Changed: Run npm audit fix to resolve vulnerabilities, and npm update to update package dependencies to their latest compatible versions. Fixed 8 package vulnerabilities (including vite, undici, ws, protobufjs, esbuild, @babel/core). Updated 42 packages to their wanted semver-compatible versions. Initialized git repository for tracking changes.
- Files: package-lock.json, docs/PROJECT_HISTORY.md
- Verification: Run npm run verify:prod (tsc lint, maturity tests, readiness tests, vite build, server and telegram webhook smoke tests) which passed successfully.
- Status: DONE

### 2026-07-13 19:54:00 +03:00 — GitHub repository packaging and community health files
- Changed: Packaged the repository for GitHub by adding MIT LICENSE, SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, PULL_REQUEST_TEMPLATE.md, config.yml, bug_report.yml, and feature_request.yml. Rewrote README.md for professional presentation.
- Files: LICENSE, README.md, .github/SECURITY.md, .github/CODE_OF_CONDUCT.md, .github/CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md, .github/ISSUE_TEMPLATE/config.yml, .github/ISSUE_TEMPLATE/bug_report.yml, .github/ISSUE_TEMPLATE/feature_request.yml, docs/PROJECT_HISTORY.md
- Verification: Ran npm run verify:prod which passed successfully.
- Status: DONE

### 2026-07-13 19:57:00 +03:00 — Bilingual repository documentation setup
- Changed: Split README.md into two language variants. Created root English README.md and Russian README.ru.md, linking both at the top of each file to support international developers.
- Files: README.md, README.ru.md, docs/PROJECT_HISTORY.md
- Verification: Validated file layouts and link formatting.
- Status: DONE

### 2026-07-13 21:15:00 +03:00 — Embedded screenshots and branding assets for GitHub presentation
- Changed: Copied local screenshots and avatars into the project at docs/images/ and updated README.md and README.ru.md with relative image paths.
- Files: README.md, README.ru.md, docs/images/*, docs/PROJECT_HISTORY.md
- Verification: Pushed changes to GitHub repository origin master.
- Status: DONE

### 2026-07-13 22:23:00 +03:00 — Simplified README layout
- Changed: Removed Web Dashboard and Branding/Avatars sections from English and Russian READMEs to focus purely on the Telegram Bot and Channel features.
- Files: README.md, README.ru.md, docs/PROJECT_HISTORY.md
- Verification: Pushed changes to master branch on GitHub.
- Status: DONE

### 2026-07-13 22:26:00 +03:00 — Product-only README presentation (hiding installation & setup)
- Changed: Removed all technical installation commands, deployment scripts, Cloudflare settings, and local developer setup instructions from README.md and README.ru.md. Maintained only high-level features, Telegram Bot/Channel links, and Telegram UI screenshots.
- Files: README.md, README.ru.md, docs/PROJECT_HISTORY.md
- Verification: Pushed changes to GitHub repository origin master.
- Status: DONE

### 2026-07-14 13:28:00 +03:00 — Фильтрация выбросов истории цен и аномалий
- Changed: Добавлена фильтрация заглушек цен (8888, 9999, 99999, 999999) и экстремальных выбросов цены (> 3x от минимума) в историю цен Onliner.by. Санирована медианная цена, получаемая из API, во избежание фейковых скидок при отсутствии товара на складе.
- Files: src/server/onliner.ts, docs/PROJECT_HISTORY.md
- Verification: Пройдены тесты линтинга и верификации, развернуто в Cloudflare Workers через wrangler.
- Status: DONE







### 2026-07-14 13:40:00 +03:00 — Core Data Parsing & Logic Audit (Onliner Edge Cases)
- Changed: Fixed deep discount suppression in 
ormalizePriceHistory by using median instead of minPrice. Updated piMedianPrice clipping logic to handle outliers securely without dropping legitimate extreme discounts. Addressed NaN/Infinity edge cases in originalPrice computation, and fixed a bug where a missing currentPrice would incorrectly yield a 100% discount.
- Files: src/server/onliner.ts
- Verification: Ran 
pm run build and 
px tsc --noEmit. Both passed successfully.
- Status: DONE
