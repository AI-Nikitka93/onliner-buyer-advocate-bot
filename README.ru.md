# ⚖️ Onliner Buyer Advocate Bot

[English](README.md) | **Русский**

[![Production Verify](https://github.com/AI-Nikitka93/onliner-buyer-advocate-bot/actions/workflows/verify.yml/badge.svg)](https://github.com/AI-Nikitka93/onliner-buyer-advocate-bot/actions/workflows/verify.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare_Workers-F38020.svg?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Stack: Node.js & TypeScript](https://img.shields.io/badge/Stack-Node.js_%2F_TypeScript-3178C6.svg?logo=typescript&logoColor=white)](package.json)

Неофициальный Telegram-бот и автоматический канал-радар, выступающий в роли **«цифрового адвоката покупателя»** на Onliner.by. 

В отличие от стандартных агрегаторов скидок, этот бот выявляет и жестко отсекает **маркетинговые уловки продавцов** (такие как искусственное завышение цены перед распродажей) путем анализа 12-месячной медианы цен.

---

## 🎯 Ключевые возможности

*   **Честный радар скидок (Onliner Super-Prices):**
    *   Сканирует каталог и вычисляет реальное отклонение цены от медианного исторического значения.
    *   Фильтрует накрученные скидки (`isFakeDiscount`). Если продавец заявляет скидку 70%, а цена на самом деле выше или равна обычной медиане — сделка блокируется.
*   **Гибкие правила публикации:**
    *   **Минимальный порог цен:** По умолчанию публикуются товары стоимостью от `15 BYN` (настраивается через `ONLINER_DEAL_MIN_PRICE_BYN`).
    *   **Обход лимита цены для супер-скидок:** Любая честная скидка **от 50% и выше** автоматически обходит ценовой лимит (например, товар за 1 BYN с реальной скидкой 95% попадет в канал).
    *   **Минимальное число предложений:** Сделка рассматривается только при наличии $\ge 2$ продавцов для обеспечения здоровой конкуренции.
*   **Интеграция с внешними источниками:**
    *   Поддерживает пилотное сравнение с ценами сети **«5 элемент»** (`ENABLE_5ELEMENT_PILOT=true`) для кросс-проверки цен по Беларуси.
*   **Индивидуальный мониторинг цен (Price Watches):**
    *   Пользователи могут подписаться на уведомления о падении цены конкретного товара прямо в чате с ботом.
*   **Отказоустойчивость:**
    *   Если API Onliner временно недоступен, бот переключается на резервный кэш с явным предупреждением пользователя (`fallback/stale cache`).

---

## 🚀 Быстрый запуск

### 💻 Локальный запуск (Express + React)

Для локального тестирования интерфейса и отладки сценариев:

1.  **Установите зависимости:**
    ```bash
    npm install
    ```
2.  **Настройте окружение:**
    Скопируйте пример конфигурации и заполните переменные:
    ```bash
    cp .env.example .env
    ```
3.  **Запустите dev-сервер:**
    ```bash
    npm run dev
    ```
    Откройте в браузере: [http://localhost:3000](http://localhost:3000)

---

## 🛡️ Развертывание в Cloudflare Workers

Для круглосуточной и бесплатной работы планировщика и вебхука используется среда Cloudflare Workers.

### Полезные команды сборки и деплоя:

```bash
# Локальный запуск симуляции воркера
npm run worker:dry-run

# Деплой в Cloudflare
npm run worker:deploy

# Запуск тестов работоспособности воркера и API
npm run worker:doctor
```

> [!IMPORTANT]
> Секреты Cloudflare задаются через CLI Wrangler и не должны коммититься в репозиторий:
> `wrangler secret put TELEGRAM_BOT_TOKEN`
> `wrangler secret put ADMIN_API_TOKEN`
> `wrangler secret put TELEGRAM_WEBHOOK_SECRET`

---

## 📊 Доступные API Эндпоинты

### Публичные / Пользовательские:
*   `GET /app` — Входная точка Telegram Mini App
*   `GET /api/health` — Состояние здоровья сервиса
*   `POST /telegram/webhook` — Вебхук обработки сообщений Telegram

### Администрирование (требуется `ADMIN_API_TOKEN`):
*   `GET /api/telegram/doctor` — Диагностика бота и прав в канале
*   `POST /api/telegram/set-webhook` — Настройка адреса вебхука Telegram
*   `GET /api/channel/status` — Лог последнего автопатрулирования канала и KV-кэша
*   `POST /api/channel/publish-best-deals` — Ручной запуск проверки каталога и отправки скидок

---

## ⚙️ Конфигурация планировщика (wrangler.toml / .env)

Бот настраивается через переменные окружения:

| Переменная | Значение по умолчанию | Описание |
| :--- | :---: | :--- |
| `ENABLE_TELEGRAM_DELIVERY` | `false` | Разрешить отправку сообщений в Telegram (иначе работает в режиме `dry-run`) |
| `ENABLE_CHANNEL_CRON` | `false` | Включить автопубликацию скидок по cron-расписанию (`0 */6 * * *`) |
| `MIN_HONEST_DISCOUNT_PERCENT` | `20` | Минимальная честная скидка для публикации |
| `ONLINER_DEAL_MIN_PRICE_BYN` | `15` | Минимальная цена товара в BYN для публикации |
| `ONLINER_DEAL_MIN_OFFERS` | `2` | Минимальное число активных продавцов на Onliner |
| `ENABLE_PRICE_WATCHES` | `true` | Включить мониторинг цен для пользователей |

---

## 🧪 Тестирование и Контроль Качества

Перед отправкой изменений запустите локальную верификацию:

```bash
# Быстрая проверка типов TypeScript
npm run lint

# Сборка проекта для production
npm run build

# Запуск полной цепочки тестов (компиляция, тесты зрелости, локальные smoke-тесты)
npm run verify:prod

# Мягкая проверка соответствия схемы API Onliner (не падает при сетевом таймауте)
npm run contract:onliner:soft
```

---

## 📸 Скриншоты

### 🤖 Интерфейс Telegram-бота
Бот выводит наглядные сигналы выгоды, разоблачая накрутки продавцов, отображая динамику цен и генерируя краткую сводку отзывов покупателей:

<p align="center">
  <img src="docs/images/bot_telegram_price_history.png" width="45%" alt="Проверка истории цен" />
  <img src="docs/images/bot_telegram_price_comparison.png" width="45%" alt="Сравнение цен" />
</p>

---

## 🤝 Участие в разработке

Мы рады любому вкладу в проект! Пожалуйста, ознакомьтесь с нашими руководствами перед началом работы:
*   Правила разработки и формат коммитов: [CONTRIBUTING.md](.github/CONTRIBUTING.md)
*   Политика безопасности и уязвимостей: [SECURITY.md](.github/SECURITY.md)
*   Правила поведения сообщества: [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md)

---

## ⚖️ Лицензия

Проект распространяется на условиях свободной лицензии **MIT**. Подробнее см. в файле [LICENSE](LICENSE).
