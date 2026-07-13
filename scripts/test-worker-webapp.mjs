import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const worker = (await import("../worker/index.ts")).default;

const env = {
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_WEBHOOK_SECRET: "test-secret",
  ADMIN_API_TOKEN: "admin-token",
  ENABLE_TELEGRAM_DELIVERY: "true",
  ENABLE_5ELEMENT_PILOT: "true",
  FIVE_ELEMENT_SEARCH_API_KEY: "test-5element-key",
};

const telegramCalls = [];
const originalFetch = globalThis.fetch;

function memoryKv() {
  const store = new Map();
  return {
    async get(key) {
      return store.get(key) || null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

function signedTelegramInitData(queryId) {
  const fields = {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: queryId,
    signature: "test-signature",
    user: JSON.stringify({ id: 123, first_name: "Test" }),
  };
  const dataCheckString = Object.entries(fields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(env.TELEGRAM_BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href.startsWith("https://api.telegram.org/")) {
    telegramCalls.push({
      url: href,
      body: options.body ? JSON.parse(String(options.body)) : {},
    });
    return Response.json({ ok: true, result: { message_id: telegramCalls.length } });
  }
  if (href.startsWith("https://sort.diginetica.net/search?")) {
    const requestUrl = new URL(href);
    assert.equal(requestUrl.searchParams.get("apiKey"), "test-5element-key");
    return Response.json({
      products: [
        {
          name: "Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB международная версия, черный",
          price: 1179,
          oldPrice: 1299,
          available: true,
          link_url: "https://5element.example/redmi-note-15-pro-plus-black",
        },
        {
          name: "Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB Mocha Brown EU",
          price: 1189,
          oldPrice: 1299,
          available: true,
          link_url: "https://5element.example/redmi-note-15-pro-plus-brown",
        },
        {
          name: "Xiaomi Redmi Note 15 4G 8GB/256GB",
          price: 799,
          available: true,
          link_url: "https://5element.example/redmi-note-15",
        },
      ],
    });
  }
  if (href.includes("catalog.api.onliner.by/super-prices")) {
    const requestUrl = new URL(href);
    const page = requestUrl.searchParams.get("page") || "1";
    const categoryGroup = requestUrl.searchParams.get("category_group") || "";
    if (categoryGroup === "page2only" && page === "1") {
      return Response.json({
        products: [
          {
            key: "cheapbox70",
            schema: { key: "toystorage", name: "Хранение игрушек" },
            full_name: "Ikea Small Box 70",
            name_prefix: "Коробка",
            html_url: "https://catalog.onliner.by/toystorage/ikea/cheapbox70",
            prices: { price_min: { amount: "9.90", currency: "BYN" }, offers: { count: 1 } },
            sale: { discount: 70, min_prices_median: { amount: "33.00", currency: "BYN" } },
            reviews: { rating: 0, count: 0 },
          },
        ],
        total: 2,
        total_ungrouped: 2,
        page: { limit: 50, items: 1, current: 1, last: 2 },
      });
    }
    if (categoryGroup === "page2only" && page === "2") {
      return Response.json({
        products: [
          {
            key: "vrv80a",
            schema: { key: "vacuumcleaner", name: "Пылесосы" },
            full_name: "Dreame R10s Lite Cordless Vacuum Cleaner VRV80A",
            name_prefix: "Пылесос",
            html_url: "https://catalog.onliner.by/vacuumcleaner/dreame/vrv80a",
            prices: { price_min: { amount: "299", currency: "BYN" }, offers: { count: 11 } },
            sale: { discount: 67, min_prices_median: { amount: "897.63", currency: "BYN" } },
            reviews: { rating: 0, count: 0 },
          },
        ],
        total: 2,
        total_ungrouped: 2,
        page: { limit: 50, items: 1, current: 2, last: 2 },
      });
    }
    if (page !== "1") {
      return Response.json({
        products: [],
        total: 22523,
        total_ungrouped: 22523,
        page: { limit: 50, items: 0, current: Number(page), last: 2 },
      });
    }
    return Response.json({
      products: [
        {
          key: "cheapbox70",
          schema: { key: "toystorage", name: "Хранение игрушек" },
          full_name: "Ikea Small Box 70",
          name_prefix: "Коробка",
          html_url: "https://catalog.onliner.by/toystorage/ikea/cheapbox70",
          prices: { price_min: { amount: "9.90", currency: "BYN" }, offers: { count: 1 } },
          sale: { discount: 70, min_prices_median: { amount: "33.00", currency: "BYN" } },
          reviews: { rating: 0, count: 0 },
        },
        {
          key: "vrv80a",
          schema: { key: "vacuumcleaner", name: "Пылесосы" },
          full_name: "Dreame R10s Lite Cordless Vacuum Cleaner VRV80A",
          name_prefix: "Пылесос",
          html_url: "https://catalog.onliner.by/vacuumcleaner/dreame/vrv80a",
          prices: { price_min: { amount: "299", currency: "BYN" }, offers: { count: 11 } },
          sale: { discount: 67, min_prices_median: { amount: "897.63", currency: "BYN" } },
          reviews: { rating: 0, count: 0 },
        },
      ],
      total: 22523,
      total_ungrouped: 22523,
      page: { limit: 50, items: 2, current: 1, last: 1 },
    });
  }
  if (href.includes("/search/products?") && href.includes("query=redmi+note+15+pro")) {
    return Response.json({
      total: 3,
      page: { limit: 30, items: 3, next_items: 0, current: 1, last: 1 },
      products: [
        {
          key: "redminote15p5ti",
          schema: { key: "mobile", name: "Мобильные телефоны" },
          full_name: "Xiaomi Redmi Note 15 Pro 5G 8GB/256GB международная версия (титановый)",
          name_prefix: "Смартфон",
          html_url: "https://catalog.onliner.by/mobile/redminote15p5ti",
          prices: { price_min: { amount: "990", currency: "BYN" }, offers: { count: 9 } },
          reviews: { rating: 44, count: 12 },
        },
        {
          key: "redminote15p1br",
          schema: { key: "mobile", name: "Мобильные телефоны" },
          full_name: "Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB международная версия (коричневый)",
          name_prefix: "Смартфон",
          html_url: "https://catalog.onliner.by/mobile/redminote15p1br",
          prices: { price_min: { amount: "1199", currency: "BYN" }, offers: { count: 12 } },
          reviews: { rating: 45, count: 20 },
        },
        {
          key: "redminote154g",
          schema: { key: "mobile", name: "Мобильные телефоны" },
          full_name: "Xiaomi Redmi Note 15 4G 8GB/256GB",
          name_prefix: "Смартфон",
          html_url: "https://catalog.onliner.by/mobile/redminote154g",
          prices: { price_min: { amount: "799", currency: "BYN" }, offers: { count: 7 } },
          reviews: { rating: 43, count: 8 },
        },
      ],
    });
  }
  if (href.includes("/search/products?") && href.includes("query=dyson")) {
    const requestUrl = new URL(href);
    const limit = Number(requestUrl.searchParams.get("limit") || 10);
    const page = Number(requestUrl.searchParams.get("page") || 1);
    const products = Array.from({ length: limit }, (_, index) => {
      const number = ((page - 1) * limit) + index + 1;
      return {
        key: `dyson${number}`,
        schema: { key: "vacuumcleaner", name: "Пылесосы" },
        full_name: `Dyson V${number} Absolute`,
        name_prefix: "Пылесос",
        html_url: `https://catalog.onliner.by/vacuumcleaner/dyson/dyson${number}`,
        prices: { price_min: { amount: "1144.61", currency: "BYN" }, offers: { count: 13 } },
        reviews: { rating: 47, count: 61 },
      };
    });
    return Response.json({
      total: 75,
      page: {
        limit,
        items: products.length,
        next_items: page < 3 ? limit : 0,
        current: page,
        last: 3,
      },
      products,
    });
  }
  if (href.includes("/search/products?") && href.includes("query=no-search-deals")) {
    return Response.json({
      total: 0,
      page: { limit: 30, items: 0, next_items: 0, current: 1, last: 1 },
      products: [],
    });
  }
  if (href.includes("/search/products?") && href.includes("query=redmi")) {
    return Response.json({
      products: [{
        key: "redminote15p1br",
        schema: { key: "mobile", name: "Мобильные телефоны" },
        full_name: "Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB",
        name_prefix: "Смартфон",
        html_url: "https://catalog.onliner.by/mobile/redminote15p1br",
        prices: { price_min: { amount: "1199", currency: "BYN" }, offers: { count: 12 } },
        reviews: { rating: 45, count: 20 },
      }],
    });
  }
  if (href.includes("/search/mobile?query=redmi")) {
    return Response.json({
      products: [{
        key: "redminote15p1br",
        full_name: "Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB",
        name_prefix: "Смартфон",
        html_url: "https://catalog.onliner.by/mobile/redminote15p1br",
        prices: { price_min: { amount: "1199", currency: "BYN" }, offers: { count: 12 } },
        reviews: { rating: 45, count: 20 },
      }],
    });
  }
  if (href.includes("/products/vrv80a/prices-history")) {
    return Response.json({
      prices: { current: { amount: "299", currency: "BYN" } },
      sale: { discount: 67, min_prices_median: { amount: "897.63", currency: "BYN" } },
      chart_data: {
        currency: "BYN",
        items: [
          { date: "2026-04-01", price: "897.63" },
          { date: "2026-04-15", price: "897.63" },
          { date: "2026-05-01", price: "897.63" },
          { date: "2026-05-20", price: "299" },
        ],
      },
    });
  }
  if (href.includes("/products/vrv80a/positions")) {
    return Response.json({
      positions: {
        primary: [
          {
            id: "shop-a:vrv80a",
            shop_id: 201,
            position_price: { amount: "299", currency: "BYN" },
            shop: { title: "CleanTech", html_url: "https://cleantech.example" },
            warranty: 24,
            date_update: "2026-05-22T10:00:00+03:00",
          },
          {
            id: "shop-b:vrv80a",
            shop_id: 202,
            position_price: { amount: "329", currency: "BYN" },
            shop: { title: "HomeMarket", html_url: "https://homemarket.example" },
            warranty: 24,
            date_update: "2026-05-22T11:00:00+03:00",
          },
        ],
      },
    });
  }
  if (href.includes("/products/vrv80a/reviews")) {
    return Response.json({
      reviews: [],
      total: 0,
      page: { limit: 10, items: 0, current: 1, last: 1 },
    });
  }
  if (href.endsWith("/products/mtp1302pd1a1")) {
    return Response.json({
      key: "mtp1302pd1a1",
      schema: { key: "watch", name: "Наручные часы" },
      full_name: "Наручные часы Casio MTP-1302PD-1A1",
      name_prefix: "Наручные часы",
      html_url: "https://catalog.onliner.by/watch/casio/mtp1302pd1a1",
      prices: { price_min: { amount: "229", currency: "BYN" }, offers: { count: 2 } },
      sale: { discount: 68, min_prices_median: { amount: "705.32", currency: "BYN" } },
      reviews: { rating: 49, count: 19 },
    });
  }
  if (href.includes("/products/mtp1302pd1a1/prices-history")) {
    const requestUrl = new URL(href);
    const period = requestUrl.searchParams.get("period");
    if (period === "12m") {
      return Response.json({
        prices: { current: { amount: "229", currency: "BYN" } },
        sale: { discount: 68, min_prices_median: { amount: "705.32", currency: "BYN" } },
        chart_data: {
          currency: "BYN",
          items: [
            { date: "2025-06-01", price: "265" },
            { date: "2025-08-01", price: "265" },
            { date: "2025-10-01", price: "265" },
            { date: "2025-12-01", price: "289.15" },
            { date: "2026-02-01", price: "266.28" },
            { date: "2026-04-01", price: "705.31" },
            { date: "2026-05-01", price: "705.31" },
            { date: "2026-05-26", price: "229" },
          ],
        },
      });
    }
    return Response.json({
      prices: { current: { amount: "229", currency: "BYN" } },
      sale: { discount: 68, min_prices_median: { amount: "705.32", currency: "BYN" } },
      chart_data: {
        currency: "BYN",
        items: [
          { date: "2026-04-01", price: "705.31" },
          { date: "2026-05-26", price: "229" },
        ],
      },
    });
  }
  if (href.includes("/products/mtp1302pd1a1/positions")) {
    return Response.json({
      positions: {
        primary: [
          {
            id: "shop-a:mtp1302pd1a1",
            shop_id: 301,
            position_price: { amount: "229", currency: "BYN" },
            shop: { title: "WatchSeller", html_url: "https://watchseller.example" },
            warranty: 12,
            date_update: "2026-05-22T12:00:00+03:00",
          },
          {
            id: "shop-b:mtp1302pd1a1",
            shop_id: 302,
            position_price: { amount: "239", currency: "BYN" },
            shop: { title: "TimeMarket", html_url: "https://timemarket.example" },
            warranty: 12,
            date_update: "2026-05-22T12:20:00+03:00",
          },
        ],
      },
    });
  }
  if (href.includes("/products/mtp1302pd1a1/reviews")) {
    return Response.json({
      reviews: [],
      total: 19,
      page: { limit: 10, items: 0, current: 1, last: 1 },
    });
  }
  if (href.endsWith("/products/aj159pwhite")) {
    return Response.json({
      key: "aj159pwhite",
      schema: { key: "mouse", name: "Мыши" },
      full_name: "Игровая мышь Ajazz AJ159P (белый)",
      name_prefix: "Игровая мышь",
      html_url: "https://catalog.onliner.by/mouse/ajazz/aj159pwhite",
      prices: { price_min: { amount: "119", currency: "BYN" }, offers: { count: 10 } },
      sale: { discount: 69, min_prices_median: { amount: "382", currency: "BYN" } },
      reviews: { rating: 46, count: 865 },
    });
  }
  if (href.includes("/products/aj159pwhite/prices-history")) {
    return Response.json({
      prices: { current: { amount: "119", currency: "BYN" } },
      sale: { discount: 69, min_prices_median: { amount: "382", currency: "BYN" } },
      chart_data: {
        currency: "BYN",
        items: [
          { date: "2025-08-01", price: "192.80" },
          { date: "2025-09-01", price: "186.13" },
          { date: "2025-11-01", price: "124.99" },
          { date: "2025-12-01", price: "125.00" },
          { date: "2026-01-01", price: "184.33" },
          { date: "2026-02-01", price: "382.00" },
          { date: "2026-03-01", price: "382.00" },
          { date: "2026-04-01", price: "382.00" },
          { date: "2026-05-01", price: "119.00" },
        ],
      },
    });
  }
  if (href.includes("/products/aj159pwhite/positions")) {
    return Response.json({
      positions: {
        primary: [
          {
            id: "shop-a:aj159pwhite",
            shop_id: 401,
            position_price: { amount: "119", currency: "BYN" },
            shop: { title: "MouseMarket", html_url: "https://mousemarket.example" },
            warranty: 12,
            date_update: "2026-05-22T12:00:00+03:00",
          },
          {
            id: "shop-b:aj159pwhite",
            shop_id: 402,
            position_price: { amount: "129", currency: "BYN" },
            shop: { title: "GameGear", html_url: "https://gamegear.example" },
            warranty: 12,
            date_update: "2026-05-22T12:20:00+03:00",
          },
        ],
      },
    });
  }
  if (href.includes("/products/aj159pwhite/reviews")) {
    return Response.json({
      reviews: [],
      total: 865,
      page: { limit: 10, items: 0, current: 1, last: 1 },
    });
  }
  if (href.endsWith("/products/redminote15p1br")) {
    return Response.json({
      key: "redminote15p1br",
      full_name: "Xiaomi Redmi Note 15 Pro+ 5G 8GB/256GB международная версия (коричневый)",
      name_prefix: "Смартфон",
      html_url: "https://catalog.onliner.by/mobile/redminote15p1br",
      prices: { price_min: { amount: "1199", currency: "BYN" }, offers: { count: 12 } },
      reviews: { rating: 45, count: 20 },
    });
  }
  if (href.includes("/products/redminote15p1br/prices-history")) {
    return Response.json({
      prices: { current: { amount: "1199", currency: "BYN" } },
      chart_data: {
        currency: "BYN",
        items: [
          { date: "2026-05-01", price: "1299" },
          { date: "2026-05-02", price: "1199" },
        ],
      },
    });
  }
  if (href.includes("/products/redminote15p1br/positions")) {
    return Response.json({
      positions: {
        primary: [
          {
            id: "shop-a:redmi",
            shop_id: 101,
            position_price: { amount: "1199", currency: "BYN" },
            shop_url: "https://shop.api.onliner.by/shops/101",
            warranty: 12,
            date_update: "2026-05-20T10:00:00+03:00",
          },
          {
            id: "shop-b:redmi",
            shop_id: 102,
            position_price: { amount: "1249", currency: "BYN" },
            shop: { title: "5 элемент", html_url: "https://5element.example" },
            shop_url: "https://shop.api.onliner.by/shops/102",
            warranty: 24,
            date_update: "2026-05-20T11:00:00+03:00",
          },
          {
            id: "shop-c:redmi",
            shop_id: 103,
            position_price: { amount: "1350", currency: "BYN" },
            shop: { title: "TechMarket", html_url: "https://techmarket.example" },
            shop_url: "https://shop.api.onliner.by/shops/103",
            warranty: 12,
            date_update: "2026-05-20T12:00:00+03:00",
          },
        ],
      },
    });
  }
  if (href.endsWith("/shops/101")) {
    return Response.json({ id: 101, title: "JUST-MOBILE", html_url: "https://just-mobile.example" });
  }
  if (href.includes("/products/redminote15p1br/reviews")) {
    const requestUrl = new URL(href);
    const page = Number(requestUrl.searchParams.get("page") || 1);
    const pages = {
      1: [
        {
          pros: "Быстрый\nХороший экран",
          cons: "Нет зарядки в комплекте\nГреется под нагрузкой",
          text: "Комплект без зарядного блока, под играми корпус заметно горячий.",
          rating: 4,
          created_at: "2026-05-10T10:00:00+03:00",
        },
        {
          pros: "Очень быстрый",
          cons: "Зарядки нет в коробке\nНагревается в играх",
          text: "В остальном норм, но зарядку пришлось покупать отдельно.",
          rating: 5,
          created_at: "2026-05-09T10:00:00+03:00",
        },
      ],
      2: [
        {
          pros: "Экран яркий",
          cons: "Нет зарядного блока\nГреется при зарядке",
          text: "После часа игры становится теплым.",
          rating: 4,
          created_at: "2026-05-08T10:00:00+03:00",
        },
        {
          pros: "Камера хорошая",
          cons: "Цена завышена\nБез нареканий\nПока никаких\nВсе устраивает\nих нет\nТелефон\nНет такого\nни чего\nНе найдено\nВсё отлично\nПока без нареканий\nПока не проявились!\nПока вообще ничего не напрягает\nСущественных минусов нет\nВ современном мире 8/256 это базовый минимум, которого уже не всегда хватает",
          text: "Покупать стоит только со скидкой.",
          rating: 3,
          created_at: "2026-05-07T10:00:00+03:00",
        },
      ],
      3: [
        {
          pros: "Производительность",
          cons: "Блок зарядки отсутствует\nНе выявил\nКак будто нет\nНе сталкивался\nНичего существенного",
          text: "Без блока питания в комплекте экономия спорная.",
          rating: 4,
          created_at: "2026-05-06T10:00:00+03:00",
        },
      ],
    };
    const reviews = pages[page] || [];
    return Response.json({
      reviews,
      total: 25,
      page: { limit: 10, items: reviews.length, current: page, last: 3 },
    });
  }
  return originalFetch(url, options);
};

try {
  const appResponse = await worker.fetch(new Request("https://example.test/app"), env);
  assert.equal(appResponse.status, 200);
  assert.match(appResponse.headers.get("content-type") || "", /text\/html/);
  const appHtml = await appResponse.text();
  assert.match(appHtml, /telegram-web-app\.js/);
  assert.match(appHtml, /sendData/);
  assert.match(appHtml, /initDataUnsafe/);
  assert.match(appHtml, /\/api\/webapp\/analyze/);
  assert.match(appHtml, /analysisPanel/);
  assert.match(appHtml, /showWebAnalysis/);
  assert.match(appHtml, /link-button/);
  assert.match(appHtml, /tg\.initData && typeof tg\.sendData/);
  assert.match(appHtml, /Каталог Onliner/i);

  const categoriesResponse = await worker.fetch(new Request("https://example.test/api/catalog/categories"), env);
  assert.equal(categoriesResponse.status, 200);
  const categories = await categoriesResponse.json();
  assert.equal(categories.categories[0].schema, "all");
  assert.ok(categories.categories.some((category) => category.schema === "mobile"));

  const searchResponse = await worker.fetch(new Request("https://example.test/api/catalog/search?schema=all&query=redmi"), env);
  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json();
  assert.equal(search.products[0].key, "redminote15p1br");

  const dysonResponse = await worker.fetch(new Request("https://example.test/api/catalog/search?schema=all&query=dyson&limit=30&page=2"), env);
  assert.equal(dysonResponse.status, 200);
  const dysonSearch = await dysonResponse.json();
  assert.equal(dysonSearch.products.length, 30);
  assert.equal(dysonSearch.products[0].key, "dyson31");
  assert.equal(dysonSearch.products[0].category, "Пылесос");
  assert.equal(dysonSearch.total, 75);
  assert.equal(dysonSearch.page.current, 2);
  assert.equal(dysonSearch.hasMore, true);

  const rateLimitEnv = {
    ...env,
    DEAL_ALERTS_KV: memoryKv(),
    PUBLIC_API_RATE_LIMIT_MAX: "2",
    PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS: "60",
  };
  const rateHeaders = { "cf-connecting-ip": "198.51.100.10" };
  assert.equal((await worker.fetch(new Request("https://example.test/api/catalog/search?schema=all&query=redmi", { headers: rateHeaders }), rateLimitEnv)).status, 200);
  assert.equal((await worker.fetch(new Request("https://example.test/api/catalog/search?schema=all&query=redmi", { headers: rateHeaders }), rateLimitEnv)).status, 200);
  const limitedSearchResponse = await worker.fetch(new Request("https://example.test/api/catalog/search?schema=all&query=redmi", { headers: rateHeaders }), rateLimitEnv);
  assert.equal(limitedSearchResponse.status, 429);
  assert.equal(limitedSearchResponse.headers.get("x-ratelimit-limit"), "2");
  assert.ok(Number(limitedSearchResponse.headers.get("retry-after")) > 0);
  const limitedSearch = await limitedSearchResponse.json();
  assert.equal(limitedSearch.error, "rate_limited");

  let rateLimitCalls = 0;
  const rateDoctorEnv = {
    ...env,
    PUBLIC_API_RATE_LIMITER: {
      async limit() {
        rateLimitCalls += 1;
        return { success: rateLimitCalls <= 2 };
      },
    },
  };
  const rateDoctorUnauthorized = await worker.fetch(new Request("https://example.test/api/rate-limit/doctor?attempts=4"), rateDoctorEnv);
  assert.equal(rateDoctorUnauthorized.status, 401);
  const rateDoctorResponse = await worker.fetch(new Request("https://example.test/api/rate-limit/doctor?attempts=4", {
    headers: { "x-admin-token": "admin-token" },
  }), rateDoctorEnv);
  assert.equal(rateDoctorResponse.status, 200);
  const rateDoctor = await rateDoctorResponse.json();
  assert.equal(rateDoctor.bindingConfigured, true);
  assert.equal(rateDoctor.firstLimitedAt, 3);
  assert.equal(rateDoctor.successCount, 2);

  const startUpdate = {
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: 123, type: "private" },
      text: "/start",
    },
  };
  const webhookResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify(startUpdate),
  }), env);
  assert.equal(webhookResponse.status, 200);

  const sendMessage = telegramCalls.find((call) => call.url.endsWith("/sendMessage"));
  assert.ok(sendMessage, "sendMessage should be called");
  assert.equal(sendMessage.body.reply_markup.inline_keyboard[0][0].web_app.url, "https://example.test/app");

  const healthResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 10,
      message: { message_id: 10, chat: { id: 123, type: "private" }, text: "/health" },
    }),
  }), env);
  assert.equal(healthResponse.status, 200);
  const healthAnswer = telegramCalls.at(-1)?.body?.text || "";
  assert.match(healthAnswer, /Статус бота/);
  assert.match(healthAnswer, /Webhook: работает/);
  assert.match(healthAnswer, /live Onliner API/);
  assert.match(healthAnswer, /5 элемент \(pilot\)/);
  assert.match(healthAnswer, /это не все сайты РБ/);
  assert.match(healthAnswer, /Подписки на цену: недоступны/);

  const dealsResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 11,
      message: { message_id: 11, chat: { id: 123, type: "private" }, text: "/deals" },
    }),
  }), env);
  assert.equal(dealsResponse.status, 200);
  const dealsResult = await dealsResponse.json();
  assert.equal(dealsResult.dealsCount, 1);
  const dealsAnswer = telegramCalls.at(-1)?.body || {};
  assert.match(dealsAnswer.text || "", /Live-скидки Onliner/);
  assert.match(dealsAnswer.text || "", /catalog\.api\.onliner\.by\/super-prices/);
  assert.match(dealsAnswer.text || "", /Dreame R10s Lite/);
  assert.match(dealsAnswer.text || "", /ниже медианы на 66\.7%/);
  assert.ok(
    (dealsAnswer.reply_markup?.inline_keyboard?.flat() || [])
      .some((button) => button.url === "https://catalog.onliner.by/vacuumcleaner/dreame/vrv80a"),
    "/deals should expose a direct Onliner button for the selected deal",
  );

  const strictDealsResponse = await worker.fetch(new Request("https://example.test/api/catalog/deals?minDiscountPercent=80"), env);
  assert.equal(strictDealsResponse.status, 200);
  const strictDeals = await strictDealsResponse.json();
  assert.equal(strictDeals.deals.length, 0, "request-level minDiscountPercent override should be applied without mutating env");
  const defaultDealsResponse = await worker.fetch(new Request("https://example.test/api/catalog/deals"), env);
  assert.equal(defaultDealsResponse.status, 200);
  const defaultDeals = await defaultDealsResponse.json();
  assert.equal(defaultDeals.deals[0].id, "vrv80a", "default deal filter should still use env/default threshold after strict request");

  const manipulatedPriceResponse = await worker.fetch(new Request("https://example.test/api/catalog/product?input=mtp1302pd1a1"), env);
  assert.equal(manipulatedPriceResponse.status, 200);
  const manipulatedPrice = await manipulatedPriceResponse.json();
  assert.equal(manipulatedPrice.product.id, "mtp1302pd1a1");
  assert.equal(manipulatedPrice.product.advertisedDiscountPercent, 68);
  assert.equal(manipulatedPrice.product.isFakeDiscount, true);
  assert.ok(manipulatedPrice.product.honestDiscountPercent < 20, "12m stable history should neutralize a short high-price spike");
  assert.ok(manipulatedPrice.product.medianPrice < 300, "reference price should stay near the stable 12-month price, not the inflated spike");
  assert.ok(
    manipulatedPrice.product.sourceUrls.some((sourceUrl) => /period=12m/.test(sourceUrl)),
    "anti-manipulation price evidence should use the 12m history when enough points exist",
  );
  assert.match(manipulatedPrice.product.priceManipulationWarning, /короткий завышенный пик цены/);

  const manipulatedWebhookResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 12,
      message: { message_id: 12, chat: { id: 123, type: "private" }, text: "mtp1302pd1a1" },
    }),
  }), env);
  assert.equal(manipulatedWebhookResponse.status, 200);
  const manipulatedAnswer = telegramCalls.at(-1)?.body?.text || "";
  assert.match(manipulatedAnswer, /Наручные часы Casio/);
  assert.match(manipulatedAnswer, /короткий завышенный пик цены/);
  assert.match(manipulatedAnswer, /скидка выглядит слабой, фейковой или сильно завышенной/);

  const overstatedPlateauResponse = await worker.fetch(new Request("https://example.test/api/catalog/product?input=aj159pwhite"), env);
  assert.equal(overstatedPlateauResponse.status, 200);
  const overstatedPlateau = await overstatedPlateauResponse.json();
  assert.equal(overstatedPlateau.product.id, "aj159pwhite");
  assert.equal(overstatedPlateau.product.advertisedDiscountPercent, 69);
  assert.equal(overstatedPlateau.product.honestDiscountPercent, 36.1);
  assert.equal(overstatedPlateau.product.isFakeDiscount, true);
  assert.ok(overstatedPlateau.product.medianPrice < 200, "stable 12m median should stay below the temporary 382 BYN plateau");
  assert.match(overstatedPlateau.product.priceManipulationWarning, /сильно завышена/);
  assert.match(overstatedPlateau.product.priceManipulationWarning, /высокого плато/);

  const overstatedWebhookResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 13,
      message: { message_id: 13, chat: { id: 123, type: "private" }, text: "aj159pwhite" },
    }),
  }), env);
  assert.equal(overstatedWebhookResponse.status, 200);
  const overstatedAnswer = telegramCalls.at(-1)?.body?.text || "";
  assert.match(overstatedAnswer, /Ajazz AJ159P/);
  assert.match(overstatedAnswer, /сильно завышена/);
  assert.match(overstatedAnswer, /высокого плато/);

  const ambiguousTextUpdate = {
    update_id: 5,
    message: {
      message_id: 5,
      chat: { id: 123, type: "private" },
      text: "redmi note 15 pro",
    },
  };
  const ambiguousTextResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify(ambiguousTextUpdate),
  }), env);
  assert.equal(ambiguousTextResponse.status, 200);
  const ambiguousTextResult = await ambiguousTextResponse.json();
  assert.equal(ambiguousTextResult.source, "product_choices");
  assert.equal(ambiguousTextResult.choicesCount, 3);
  const choiceMessage = telegramCalls.at(-1)?.body || {};
  assert.match(choiceMessage.text || "", /Нашел несколько похожих товаров/);
  assert.match(choiceMessage.text || "", /Redmi Note 15 Pro 5G/);
  assert.match(choiceMessage.text || "", /Redmi Note 15 Pro\+ 5G/);
  assert.doesNotMatch(choiceMessage.text || "", /Цифровой адвокат покупателя/);
  const choiceButtons = choiceMessage.reply_markup?.inline_keyboard?.flat() || [];
  assert.ok(choiceButtons.some((button) => button.callback_data === "analyze:redminote15p1br"));

  const choiceCallbackResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 6,
      callback_query: {
        id: "choice-callback-1",
        from: { id: 123, first_name: "Test" },
        message: { message_id: 5, chat: { id: 123, type: "private" } },
        data: "analyze:redminote15p1br",
      },
    }),
  }), env);
  assert.equal(choiceCallbackResponse.status, 200);
  const choiceCallbackResult = await choiceCallbackResponse.json();
  assert.equal(choiceCallbackResult.source, "callback_query");
  assert.equal(choiceCallbackResult.productId, "redminote15p1br");
  const choiceAnswer = telegramCalls.at(-1)?.body?.text || "";
  assert.match(choiceAnswer, /Цифровой адвокат покупателя/);
  assert.match(choiceAnswer, /Redmi Note 15 Pro\+ 5G/);
  const productAnswerButtons = telegramCalls.at(-1)?.body?.reply_markup?.inline_keyboard?.flat() || [];
  assert.ok(productAnswerButtons.some((button) => button.callback_data === "watch:redminote15p1br"), "product answer should expose price watch opt-in");

  const watchKv = memoryKv();
  const watchEnv = {
    ...env,
    DEAL_ALERTS_KV: watchKv,
    ENABLE_PRICE_WATCHES: "true",
    PRICE_WATCH_DROP_PERCENT: "0",
    WORKER_PUBLIC_URL: "https://public.example",
  };
  const watchSubscribeResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 7,
      callback_query: {
        id: "watch-callback-1",
        from: { id: 123, first_name: "Test" },
        message: { message_id: 6, chat: { id: 123, type: "private" } },
        data: "watch:redminote15p1br",
      },
    }),
  }), watchEnv);
  assert.equal(watchSubscribeResponse.status, 200);
  const watchSubscribe = await watchSubscribeResponse.json();
  assert.equal(watchSubscribe.source, "price_watch_subscribe");
  assert.equal(watchSubscribe.productId, "redminote15p1br");
  assert.equal(watchSubscribe.targetPrice, 1199);
  assert.match(telegramCalls.at(-1)?.body?.text || "", /Подписка на цену включена/);

  const watchListResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 8,
      message: { message_id: 7, chat: { id: 123, type: "private" }, text: "/watchlist" },
    }),
  }), watchEnv);
  assert.equal(watchListResponse.status, 200);
  const watchList = await watchListResponse.json();
  assert.equal(watchList.source, "price_watch_list");
  assert.equal(watchList.watchesCount, 1);
  assert.match(telegramCalls.at(-1)?.body?.text || "", /Активные подписки на цену/);

  const watchScheduledWaits = [];
  const telegramCallsBeforeWatchScan = telegramCalls.length;
  await worker.scheduled(
    { scheduledTime: Date.now(), cron: "0 */6 * * *" },
    watchEnv,
    { waitUntil: (promise) => watchScheduledWaits.push(promise) },
  );
  await Promise.all(watchScheduledWaits);
  assert.equal(telegramCalls.length, telegramCallsBeforeWatchScan + 1, "price watch scheduler should notify when threshold is reached");
  assert.match(telegramCalls.at(-1)?.body?.text || "", /Цена достигла твоего порога/);
  assert.ok(
    (telegramCalls.at(-1)?.body?.reply_markup?.inline_keyboard?.flat() || [])
      .some((button) => button.web_app?.url === "https://public.example/app"),
    "scheduled price watch notifications should use configured public app URL",
  );

  const watchScheduledCooldownWaits = [];
  const telegramCallsBeforeWatchCooldown = telegramCalls.length;
  await worker.scheduled(
    { scheduledTime: Date.now(), cron: "0 */6 * * *" },
    watchEnv,
    { waitUntil: (promise) => watchScheduledCooldownWaits.push(promise) },
  );
  await Promise.all(watchScheduledCooldownWaits);
  assert.equal(telegramCalls.length, telegramCallsBeforeWatchCooldown, "price watch cooldown should suppress repeat notifications");

  const watchStatusResponse = await worker.fetch(new Request("https://example.test/api/price-watch/status", {
    headers: { "x-admin-token": "admin-token" },
  }), watchEnv);
  assert.equal(watchStatusResponse.status, 200);
  const watchStatus = await watchStatusResponse.json();
  assert.equal(watchStatus.enabled, true);
  assert.equal(watchStatus.kvConfigured, true);
  assert.equal(watchStatus.schedulerEvidence.hasSchedulerRun, true);
  assert.ok(watchStatus.schedulerEvidence.schedulerRuns >= 2);
  assert.equal(watchStatus.schedulerEvidence.latestScheduledRun.cron, "0 */6 * * *");
  assert.equal(watchStatus.schedulerEvidence.latestScheduledRun.checked, 1);
  assert.equal(watchStatus.schedulerEvidence.latestScheduledRun.notified, 0);
  assert.ok(
    watchStatus.scheduledAudit.recentRuns.some((run) => run.priceWatches.notified === 1),
    "scheduled audit should preserve the earlier notification run",
  );
  assert.equal(watchStatus.totalIndexed, 1);
  assert.equal(watchStatus.activeSample, 1);

  const unauthorizedWatchDoctorResponse = await worker.fetch(new Request("https://example.test/api/price-watch/doctor?input=redminote15p1br"), watchEnv);
  assert.equal(unauthorizedWatchDoctorResponse.status, 401);
  const telegramCallsBeforeWatchDoctor = telegramCalls.length;
  const watchDoctorResponse = await worker.fetch(new Request("https://example.test/api/price-watch/doctor?input=redminote15p1br", {
    headers: { "x-admin-token": "admin-token" },
  }), watchEnv);
  assert.equal(watchDoctorResponse.status, 200);
  const watchDoctor = await watchDoctorResponse.json();
  assert.equal(watchDoctor.readyForNotificationPath, true);
  assert.equal(watchDoctor.dryRun, true);
  assert.equal(watchDoctor.product.id, "redminote15p1br");
  assert.equal(watchDoctor.simulatedSubscription.shouldNotify, true);
  assert.match(watchDoctor.notificationPreview, /Цена достигла твоего порога/);
  assert.ok(
    (watchDoctor.replyMarkup.inline_keyboard.flat() || [])
      .some((button) => button.web_app?.url === "https://public.example/app"),
    "price-watch doctor should expose the same Mini App button as real notifications",
  );
  assert.equal(telegramCalls.length, telegramCallsBeforeWatchDoctor, "price-watch doctor must not send Telegram messages");

  const unauthorizedWatchScanDoctorResponse = await worker.fetch(new Request("https://example.test/api/price-watch/scan-doctor?input=redminote15p1br"), watchEnv);
  assert.equal(unauthorizedWatchScanDoctorResponse.status, 401);
  const telegramCallsBeforeWatchScanDoctor = telegramCalls.length;
  const watchScanDoctorResponse = await worker.fetch(new Request("https://example.test/api/price-watch/scan-doctor?input=redminote15p1br", {
    headers: { "x-admin-token": "admin-token" },
  }), watchEnv);
  assert.equal(watchScanDoctorResponse.status, 200);
  const watchScanDoctor = await watchScanDoctorResponse.json();
  assert.equal(watchScanDoctor.readyForScheduledScanPath, true);
  assert.equal(watchScanDoctor.dryRunDelivery, true);
  assert.equal(watchScanDoctor.telegramSent, false);
  assert.equal(watchScanDoctor.product.id, "redminote15p1br");
  assert.equal(watchScanDoctor.scan.checked, 1);
  assert.equal(watchScanDoctor.scan.active, 1);
  assert.equal(watchScanDoctor.scan.notified, 1);
  assert.equal(watchScanDoctor.scan.failed, 0);
  assert.equal(watchScanDoctor.scan.events[0].deliveryStatus, "dry_run");
  assert.match(watchScanDoctor.notificationPreview, /Цена достигла твоего порога/);
  assert.ok(watchScanDoctor.temporarySubscription.lastNotifiedAtAfterScan, "scan doctor should persist lastNotifiedAt before cleanup");
  assert.equal(watchScanDoctor.temporarySubscription.cleanedUp, true);
  assert.equal(telegramCalls.length, telegramCallsBeforeWatchScanDoctor, "price-watch scan doctor must not send Telegram messages");
  const watchStatusAfterScanDoctorResponse = await worker.fetch(new Request("https://example.test/api/price-watch/status", {
    headers: { "x-admin-token": "admin-token" },
  }), watchEnv);
  assert.equal(watchStatusAfterScanDoctorResponse.status, 200);
  const watchStatusAfterScanDoctor = await watchStatusAfterScanDoctorResponse.json();
  assert.equal(watchStatusAfterScanDoctor.totalIndexed, 1, "scan doctor must clean up its temporary index key");
  assert.equal(watchStatusAfterScanDoctor.activeSample, 1, "scan doctor must not remove the real test subscription");

  const watchUnsubscribeResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify({
      update_id: 9,
      callback_query: {
        id: "watch-callback-2",
        from: { id: 123, first_name: "Test" },
        message: { message_id: 8, chat: { id: 123, type: "private" } },
        data: "unwatch:redminote15p1br",
      },
    }),
  }), watchEnv);
  assert.equal(watchUnsubscribeResponse.status, 200);
  const watchUnsubscribe = await watchUnsubscribeResponse.json();
  assert.equal(watchUnsubscribe.source, "price_watch_unsubscribe");
  assert.equal(watchUnsubscribe.productId, "redminote15p1br");
  assert.match(telegramCalls.at(-1)?.body?.text || "", /Больше не слежу/);

  const webAppUpdate = {
    update_id: 2,
    message: {
      message_id: 2,
      chat: { id: 123, type: "private" },
      web_app_data: {
        data: JSON.stringify({ type: "analyze_product", key: "redminote15p1br" }),
        button_text: "Каталог Onliner",
      },
    },
  };
  const webAppResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify(webAppUpdate),
  }), env);
  assert.equal(webAppResponse.status, 200);
  const webAppResult = await webAppResponse.json();
  assert.equal(webAppResult.source, "web_app_data");
  assert.equal(webAppResult.productId, "redminote15p1br");

  const productResponse = await worker.fetch(new Request("https://example.test/api/catalog/product?input=redminote15p1br"), env);
  assert.equal(productResponse.status, 200);
  const productPayload = await productResponse.json();
  assert.equal(productPayload.product.reviewEvidence.processedCount, 5);
  assert.equal(productPayload.product.reviewEvidence.totalCount, 25);
  assert.equal(productPayload.product.reviewEvidence.pagesProcessed, 3);
  assert.equal(productPayload.product.priceComparison.sources[0].source, "onliner_marketplace");
  assert.equal(productPayload.product.priceComparison.sources[0].sourceType, "marketplace");
  assert.equal(productPayload.product.priceComparison.sources[0].confidence, "high");
  assert.equal(productPayload.product.priceComparison.sources[0].offersCount, 3);
  assert.equal(productPayload.product.priceComparison.sources[0].minPrice, 1199);
  assert.equal(productPayload.product.priceComparison.sources[0].maxPrice, 1350);
  const fiveElementSource = productPayload.product.priceComparison.sources.find((source) => source.source === "external_5element");
  assert.ok(fiveElementSource, "5element pilot source should be present");
  assert.equal(fiveElementSource.label, "5 элемент (pilot)");
  assert.equal(fiveElementSource.sourceType, "external_pilot");
  assert.equal(fiveElementSource.confidence, "pilot");
  assert.equal(fiveElementSource.status, "ok");
  assert.equal(fiveElementSource.offersCount, 1);
  assert.equal(fiveElementSource.minPrice, 1189);
  assert.equal(fiveElementSource.maxPrice, 1189);
  assert.equal(productPayload.product.priceComparison.bestOffers[0].sellerName, "5 элемент");
  assert.equal(productPayload.product.priceComparison.bestOffers[0].source, "external_5element");
  assert.equal(productPayload.product.priceComparison.bestOffers[0].price, 1189);
  assert.match(productPayload.product.priceComparison.bestOffers[0].url, /brown/);
  assert.equal(productPayload.product.priceComparison.bestOffers[1].sellerName, "JUST-MOBILE");
  assert.ok(
    productPayload.product.reviewEvidence.topCons.some((item) => item.count >= 3 && /заряд/i.test(item.label)),
    "review evidence should cluster repeated charging complaints",
  );
  assert.ok(
    productPayload.product.reviewEvidence.topCons.some((item) => item.count >= 2 && /гре|нагрев/i.test(item.label)),
    "review evidence should cluster repeated heating complaints",
  );
  assert.ok(
    productPayload.product.reviewEvidence.topCons.every((item) => !/без нареканий|не выявил|не выявила|не заметил|не заметила|пока никаких|как будто нет|не сталкивался|все устраивает|ничего существенного|их нет|нет такого|ни чего|телефон|смартфон|товар|модель|аппарат|не найдено|вс[её] отлично|пока без нареканий|пока не проявились|пока вообще ничего не напрягает|существенных минусов нет/i.test(item.label)),
    "review evidence should not treat no-explicit-cons phrases as repeated cons",
  );
  assert.ok(
    productPayload.product.reviewEvidence.topCons.every((item) => !/^в современном мире 8$/i.test(item.label)),
    "review evidence should not split numeric capacity values like 8/256 into broken cons",
  );

  const webAppAnswerBody = telegramCalls.at(-1)?.body || {};
  const webAppAnswer = webAppAnswerBody.text || "";
  assert.match(webAppAnswer, /Отзывы: обработано 5 из 25/);
  assert.match(webAppAnswer, /История цены:/);
  assert.match(webAppAnswer, /2 замера цены Onliner/);
  assert.match(webAppAnswer, /01\.05\.2026-02\.05\.2026/);
  assert.match(webAppAnswer, /Диапазон истории: 1199-1299 BYN/);
  assert.match(webAppAnswer, /Замер = одна цена из графика Onliner/);
  assert.doesNotMatch(webAppAnswer, /period=|точек/);
  assert.match(webAppAnswer, /Проверенные источники цен:/);
  assert.match(webAppAnswer, /Onliner Marketplace: 3 предложения, 1199-1350 BYN/);
  assert.match(webAppAnswer, /5 элемент \(pilot\): 1 предложение, 1189 BYN; price-only pilot, совпадение эвристическое/);
  assert.match(webAppAnswer, /5 элемент — 1189 BYN/);
  assert.match(webAppAnswer, /JUST-MOBILE — 1199 BYN/);
  assert.doesNotMatch(webAppAnswer, /Внешние сайты РБ: подключаются отдельными источниками/);
  assert.match(webAppAnswer, /Повторяющиеся минусы/);
  const repeatedConsBlock = webAppAnswer.split("Повторяющиеся минусы:")[1]?.split("Что чаще хвалят:")[0] || "";
  assert.doesNotMatch(repeatedConsBlock, /без нареканий|не выявил|не выявила|не заметил|не заметила|пока никаких|как будто нет|не сталкивался|все устраивает|ничего существенного|их нет|нет такого|ни чего|телефон|смартфон|товар|модель|аппарат|не найдено|вс[её] отлично|пока без нареканий|пока не проявились|пока вообще ничего не напрягает|существенных минусов нет/i);
  assert.equal(webAppAnswerBody.disable_web_page_preview, true);
  assert.doesNotMatch(webAppAnswer, /https:\/\/catalog\.onliner\.by\/mobile\/redminote15p1br/);
  const productButtons = webAppAnswerBody.reply_markup?.inline_keyboard?.flat() || [];
  assert.ok(productButtons.some((button) => button.text === "Onliner" && button.url === "https://catalog.onliner.by/mobile/redminote15p1br"));
  assert.ok(productButtons.some((button) => button.text === "Отзывы" && /\/reviews$/.test(button.url || "")));
  assert.ok(productButtons.some((button) => button.text === "Каталог" && button.web_app?.url === "https://example.test/app"));

  const inlineAnalyzeResponse = await worker.fetch(new Request("https://example.test/api/webapp/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      queryId: "web-query-1",
      initData: signedTelegramInitData("web-query-1"),
      key: "redminote15p1br",
    }),
  }), env);
  assert.equal(inlineAnalyzeResponse.status, 200);
  const inlineAnalyzeResult = await inlineAnalyzeResponse.json();
  assert.equal(inlineAnalyzeResult.source, "answer_web_app_query");
  assert.equal(inlineAnalyzeResult.productId, "redminote15p1br");

  const inlineAnalyzeCall = telegramCalls.at(-1);
  assert.ok(inlineAnalyzeCall?.url.endsWith("/answerWebAppQuery"), "inline Mini App analyze should answer WebApp query");
  assert.equal(inlineAnalyzeCall.body.web_app_query_id, "web-query-1");
  assert.equal(inlineAnalyzeCall.body.result.type, "article");
  assert.deepEqual(inlineAnalyzeCall.body.result.input_message_content.link_preview_options, { is_disabled: true });
  assert.doesNotMatch(inlineAnalyzeCall.body.result.input_message_content.message_text, /period=|точек/);
  assert.match(inlineAnalyzeCall.body.result.input_message_content.message_text, /2 замера цены Onliner/);
  assert.match(inlineAnalyzeCall.body.result.input_message_content.message_text, /Диапазон истории: 1199-1299 BYN/);
  assert.match(inlineAnalyzeCall.body.result.input_message_content.message_text, /Проверенные источники цен:/);
  assert.match(inlineAnalyzeCall.body.result.input_message_content.message_text, /Onliner Marketplace: 3 предложения, 1199-1350 BYN/);
  assert.match(inlineAnalyzeCall.body.result.input_message_content.message_text, /5 элемент \(pilot\): 1 предложение, 1189 BYN; price-only pilot, совпадение эвристическое/);
  assert.match(inlineAnalyzeCall.body.result.input_message_content.message_text, /Отзывы: обработано 5 из 25/);
  assert.doesNotMatch(
    inlineAnalyzeCall.body.result.input_message_content.message_text,
    /https:\/\/catalog\.onliner\.by\/mobile\/redminote15p1br/,
  );
  const inlineButtons = inlineAnalyzeCall.body.result.reply_markup?.inline_keyboard?.flat() || [];
  assert.ok(inlineButtons.some((button) => button.text === "Onliner" && button.url === "https://catalog.onliner.by/mobile/redminote15p1br"));
  assert.ok(inlineButtons.some((button) => button.text === "Отзывы" && /\/reviews$/.test(button.url || "")));

  const telegramCallsBeforeOwnResult = telegramCalls.length;
  const ownInlineResultUpdate = {
    update_id: 4,
    message: {
      message_id: 4,
      chat: { id: 123, type: "private" },
      via_bot: {
        id: 999,
        is_bot: true,
        first_name: "Адвокат Покупателя BY",
        username: "BuyerAdvocateBYBot",
      },
      text: inlineAnalyzeCall.body.result.input_message_content.message_text,
    },
  };
  const ownInlineResultResponse = await worker.fetch(new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret",
    },
    body: JSON.stringify(ownInlineResultUpdate),
  }), env);
  assert.equal(ownInlineResultResponse.status, 200);
  const ownInlineResult = await ownInlineResultResponse.json();
  assert.equal(ownInlineResult.reason, "own_inline_result");
  assert.equal(telegramCalls.length, telegramCallsBeforeOwnResult, "own inline result should not trigger a second bot reply");

  const scheduledWaits = [];
  const telegramCallsBeforeDisabledCron = telegramCalls.length;
  await worker.scheduled(
    { scheduledTime: Date.now(), cron: "0 */6 * * *" },
    { ...env, TELEGRAM_CHANNEL_ID: "@buyer_deals", MIN_HONEST_DISCOUNT_PERCENT: "1", ENABLE_CHANNEL_CRON: "false" },
    { waitUntil: (promise) => scheduledWaits.push(promise) },
  );
  await Promise.all(scheduledWaits);
  assert.equal(telegramCalls.length, telegramCallsBeforeDisabledCron, "disabled channel cron must not publish after channel id is configured");

  const alertsKv = memoryKv();
  const channelEnv = {
    ...env,
    TELEGRAM_CHANNEL_ID: "@buyer_deals",
    ENABLE_CHANNEL_CRON: "true",
    ONLINER_POLL_QUERY: "no-search-deals",
    MIN_HONEST_DISCOUNT_PERCENT: "20",
    DEAL_ALERTS_KV: alertsKv,
  };
  const telegramCallsBeforeDryRun = telegramCalls.length;
  const dryRunPublishResponse = await worker.fetch(new Request("https://example.test/api/channel/publish-best-deals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": "admin-token",
    },
    body: JSON.stringify({ dryRun: true }),
  }), channelEnv);
  assert.equal(dryRunPublishResponse.status, 200);
  const dryRunPublish = await dryRunPublishResponse.json();
  assert.equal(dryRunPublish.published, false);
  assert.equal(dryRunPublish.dryRun, true);
  assert.equal(dryRunPublish.selected.id, "vrv80a");
  assert.match(dryRunPublish.postText, /Dreame R10s Lite/);
  assert.match(dryRunPublish.postText, /5 элемент \(pilot\): сейчас не отдал проверяемые цены/);
  assert.equal(telegramCalls.length, telegramCallsBeforeDryRun, "dry-run channel publish must not call Telegram");

  const firstPublishResponse = await worker.fetch(new Request("https://example.test/api/channel/publish-best-deals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": "admin-token",
    },
    body: JSON.stringify({ force: false }),
  }), channelEnv);
  assert.equal(firstPublishResponse.status, 200);
  const firstPublish = await firstPublishResponse.json();
  assert.equal(firstPublish.published, true);
  assert.equal(firstPublish.selected.id, "vrv80a");
  assert.equal(firstPublish.dedupe.enabled, true);
  assert.match(telegramCalls.at(-1)?.body?.text || "", /Dreame R10s Lite/);

  const telegramCallsBeforeDuplicate = telegramCalls.length;
  const duplicatePublishResponse = await worker.fetch(new Request("https://example.test/api/channel/publish-best-deals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": "admin-token",
    },
    body: JSON.stringify({ force: false }),
  }), channelEnv);
  assert.equal(duplicatePublishResponse.status, 200);
  const duplicatePublish = await duplicatePublishResponse.json();
  assert.equal(duplicatePublish.published, false);
  assert.match(duplicatePublish.reason, /duplicate_suppressed/);
  assert.equal(telegramCalls.length, telegramCallsBeforeDuplicate, "duplicate deal should not send another channel message");

  const preSchedulerStatusResponse = await worker.fetch(new Request("https://example.test/api/channel/status", {
    headers: { "x-admin-token": "admin-token" },
  }), channelEnv);
  assert.equal(preSchedulerStatusResponse.status, 200);
  const preSchedulerStatus = await preSchedulerStatusResponse.json();
  assert.equal(preSchedulerStatus.schedulerEvidence.hasSchedulerRun, false);
  assert.equal(preSchedulerStatus.schedulerEvidence.schedulerRuns, 0);
  assert.ok(
    preSchedulerStatus.recommendations.some((item) => /нет ни одного scheduler-run/.test(item)),
    "channel status should warn when cron is enabled but no scheduler audit exists yet",
  );

  const scheduledEnabledWaits = [];
  const telegramCallsBeforeScheduledDuplicate = telegramCalls.length;
  await worker.scheduled(
    { scheduledTime: Date.now(), cron: "0 */6 * * *" },
    channelEnv,
    { waitUntil: (promise) => scheduledEnabledWaits.push(promise) },
  );
  await Promise.all(scheduledEnabledWaits);
  assert.equal(telegramCalls.length, telegramCallsBeforeScheduledDuplicate, "scheduled duplicate should not send another channel message");

  const channelStatusResponse = await worker.fetch(new Request("https://example.test/api/channel/status", {
    headers: { "x-admin-token": "admin-token" },
  }), channelEnv);
  assert.equal(channelStatusResponse.status, 200);
  const channelStatus = await channelStatusResponse.json();
  assert.equal(channelStatus.channelCronEnabled, true);
  assert.equal(channelStatus.dealDedupeConfigured, true);
  assert.equal(channelStatus.externalPricePilotEnabled, true);
  assert.equal(channelStatus.audit.configured, true);
  assert.equal(channelStatus.audit.latestRun.trigger, "scheduler");
  assert.match(channelStatus.audit.latestRun.reason, /duplicate_suppressed/);
  assert.equal(channelStatus.scheduledTaskAudit.configured, true);
  assert.equal(channelStatus.scheduledTaskAudit.latestRun.cron, "0 */6 * * *");
  assert.equal(channelStatus.scheduledTaskAudit.latestRun.channel.selectedId, "vrv80a");
  assert.match(channelStatus.scheduledTaskAudit.latestRun.channel.reason, /duplicate_suppressed/);
  assert.equal(channelStatus.schedulerEvidence.hasSchedulerRun, true);
  assert.ok(channelStatus.schedulerEvidence.schedulerRuns >= 1);
  assert.equal(channelStatus.schedulerEvidence.latestSchedulerRun.selectedId, "vrv80a");
  assert.ok(
    !channelStatus.recommendations.some((item) => /нет ни одного scheduler-run/.test(item)),
    "scheduler warning should clear after a scheduler audit exists",
  );
  assert.ok(channelStatus.audit.recentRuns.length >= 4, "channel status should keep recent manual and scheduled audit runs");
  assert.ok(channelStatus.audit.recentRuns.some((run) => run.dryRun && /5 элемент \(pilot\)/.test(run.postTextPreview || "")));

  const externalDoctorResponse = await worker.fetch(new Request("https://example.test/api/external-price/doctor?input=redminote15p1br", {
    headers: { "x-admin-token": "admin-token" },
  }), channelEnv);
  assert.equal(externalDoctorResponse.status, 200);
  const externalDoctor = await externalDoctorResponse.json();
  assert.equal(externalDoctor.readyForExternalPricePilot, true);
  assert.equal(externalDoctor.fiveElement.source.status, "ok");
  assert.equal(externalDoctor.fiveElement.source.offersCount, 1);

  const dealsDoctorUnauthorized = await worker.fetch(new Request("https://example.test/api/onliner/deals-doctor"), channelEnv);
  assert.equal(dealsDoctorUnauthorized.status, 401);
  const dealsDoctorResponse = await worker.fetch(new Request("https://example.test/api/onliner/deals-doctor?minDiscountPercent=20", {
    headers: { "x-admin-token": "admin-token" },
  }), channelEnv);
  assert.equal(dealsDoctorResponse.status, 200);
  const dealsDoctor = await dealsDoctorResponse.json();
  assert.equal(dealsDoctor.readyForDiscountRadar, true);
  assert.equal(dealsDoctor.source, "catalog.api.onliner.by/super-prices");
  assert.equal(dealsDoctor.superPrices.rawProductsCount, 2);
  assert.equal(dealsDoctor.superPrices.qualifiedCandidatesCount, 1);
  assert.equal(dealsDoctor.publishableDealsCount, 1);
  assert.equal(dealsDoctor.deals[0].id, "vrv80a");

  const page2DealsDoctorResponse = await worker.fetch(new Request("https://example.test/api/onliner/deals-doctor?minDiscountPercent=20", {
    headers: { "x-admin-token": "admin-token" },
  }), {
    ...channelEnv,
    ONLINER_SUPERPRICE_CATEGORY_GROUPS: "page2only",
    ONLINER_DEAL_SCAN_PAGES: "2",
  });
  assert.equal(page2DealsDoctorResponse.status, 200);
  const page2DealsDoctor = await page2DealsDoctorResponse.json();
  assert.equal(page2DealsDoctor.readyForDiscountRadar, true);
  assert.equal(page2DealsDoctor.superPrices.scannedPagesPerScope, 2);
  assert.equal(page2DealsDoctor.superPrices.maxAvailablePage, 2);
  assert.equal(page2DealsDoctor.superPrices.qualifiedCandidatesCount, 1);
  assert.equal(page2DealsDoctor.deals[0].id, "vrv80a", "discount radar should scan the configured second super-prices page");

  const failingPublishKv = {
    async get() {
      return null;
    },
    async put(key) {
      if (String(key) === "deal-alert:vrv80a") throw new Error("simulated deal dedupe write failure");
    },
    async delete() {},
  };
  const telegramCallsBeforeFailingPublish = telegramCalls.length;
  const failingPublishResponse = await worker.fetch(new Request("https://example.test/api/channel/publish-best-deals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": "admin-token",
    },
    body: JSON.stringify({ force: false }),
  }), { ...channelEnv, DEAL_ALERTS_KV: failingPublishKv });
  assert.equal(failingPublishResponse.status, 502);
  const failingPublish = await failingPublishResponse.json();
  assert.equal(failingPublish.published, false);
  assert.match(failingPublish.error, /simulated deal dedupe write failure/);
  assert.equal(telegramCalls.length, telegramCallsBeforeFailingPublish, "channel publish must not send Telegram before dedupe state is reserved");

  const setWebhookResponse = await worker.fetch(new Request("https://example.test/api/telegram/set-webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": "admin-token",
    },
    body: JSON.stringify({ webhookUrl: "https://example.test/telegram/webhook" }),
  }), channelEnv);
  assert.equal(setWebhookResponse.status, 200);
  const setWebhookCall = telegramCalls.at(-1)?.body || {};
  assert.deepEqual(setWebhookCall.allowed_updates, ["message", "callback_query"]);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("worker webapp smoke passed");
