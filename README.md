# ⚖️ Onliner Buyer Advocate Bot

**English** | [Русский](README.ru.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: Telegram](https://img.shields.io/badge/Platform-Telegram-26A69A.svg?logo=telegram&logoColor=white)](https://t.me/OnlinerAdvocated_ai_bot)

An unofficial Telegram Bot and automated channel discount radar acting as a **"digital buyer advocate"** for Onliner.by.

Unlike standard discount scrapers, this bot exposes and strictly filters out **deceptive marketing markups** (such as artificial price hikes right before a sale) by analyzing the 12-month median price history of products.

---

## 🎯 Key Features

*   **Honest Discount Radar (Onliner Super-Prices):**
    *   Scans the catalog and calculates the actual price deviation relative to the historical median price.
    *   Filters out artificial or fake discounts (`isFakeDiscount`). If a seller claims a 70% discount but the current price is close to or higher than the 12-month median price, the deal is blocked.
*   **Smart Publishing Policies:**
    *   Filters out cheap/low-value items by default (minimum price threshold is set to 15 BYN).
    *   **Bypass Price Limits for Deep Discounts:** Any genuine discount of **50% or higher** automatically bypasses the minimum price check (e.g., an item priced at 1 BYN with a 95% honest discount is published).
    *   **Minimum Offers Count:** Only considers deals with $\ge 2$ active sellers on Onliner to guarantee price competition.
*   **Personal Price Watches:**
    *   Users can subscribe to real-time price drop notifications for specific items directly inside the Telegram Bot.
*   **Alternative Price Sources:**
    *   Compares pricing with other major retail chains (e.g., "5 element") to double-verify the national deal quality.

---

## 🔗 Live Access

*   💬 **Telegram Chat Bot**: [@OnlinerAdvocated_ai_bot](https://t.me/OnlinerAdvocated_ai_bot)
*   📢 **Telegram Discount Channel**: Access link is available inside the main menu of the chat bot.

---

## 📸 Screenshots

### 🤖 Telegram Bot Interface
The bot delivers clear value signals by exposing artificial price markups, displaying price dynamics, and providing summarized user reviews:

<p align="center">
  <img src="docs/images/bot_telegram_price_history.png" width="45%" alt="Price History Check" />
  <img src="docs/images/bot_telegram_price_comparison.png" width="45%" alt="Price Comparison Check" />
</p>

---

## ⚖️ License

This project is licensed under the **MIT License**. For details, please see the [LICENSE](LICENSE) file.
