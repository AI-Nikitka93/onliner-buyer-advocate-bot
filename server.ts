import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { ValueForMoney, Product, ChannelPost } from "./src/types";
import { extractOnlinerProductKey, findOnlinerDeals, resolveOnlinerProduct, searchOnlinerProducts } from "./src/server/onliner";
import { createRuntimeStore, type RuntimeAuditRun } from "./src/server/store";
import { createRateLimiter, getSecurityStatus, requireAdmin } from "./src/server/security";
import {
  formatProductTelegramAnswer,
  getTelegramStatus,
  publishChannelPost,
  runTelegramDoctor,
  sendTelegramMessage,
  setTelegramWebhook,
} from "./src/server/telegram";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(["/api", "/telegram"], createRateLimiter());
const PORT = Number(process.env.PORT || 3000);
const runtimeStore = createRuntimeStore();

type BestDealRunOptions = {
  query: string;
  minDiscountPercent: number;
  publishToTelegram: boolean;
  trigger: "manual" | "scheduler";
};

type ResolveProductResult = {
  product: Product | null;
  source: "onliner_live" | "runtime_cache_stale" | "not_found";
  snapshot?: any;
  cacheHit?: boolean;
  liveError?: string;
};

const channelScheduler = {
  enabled: process.env.AUTO_PUBLISH_CHANNEL === "true",
  intervalMinutes: Number(process.env.CHANNEL_POLL_INTERVAL_MINUTES || 360),
  timer: null as NodeJS.Timeout | null,
  running: false,
  lastRunAt: null as string | null,
  lastResult: null as any,
  lastError: null as string | null,
};

function getChannelSchedulerStatus() {
  return {
    enabled: channelScheduler.enabled,
    intervalMinutes: channelScheduler.intervalMinutes,
    running: channelScheduler.running,
    lastRunAt: channelScheduler.lastRunAt,
    lastResult: channelScheduler.lastResult,
    lastError: channelScheduler.lastError,
  };
}

// Shared Gemini Client Lazy Initializer
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// In-memory Database of Onliner.by popular products
const MOCK_PRODUCTS: Product[] = [
  {
    id: "iphone15",
    title: "Смартфон Apple iPhone 15 128GB",
    category: "Мобильные телефоны",
    url: "https://catalog.onliner.by/mobile/apple/iphone15128bk",
    rating: 4.6,
    ratingCount: 128,
    currentPrice: 2300,
    originalPrice: 2700, // Advertised discount!
    medianPrice90Days: 2350, // Real median price was 2350
    isFakeDiscount: true,
    honestDiscountPercent: 2, // Real discount relative to 90d median: (2350 - 2300) / 2350 = ~2%
    valueForMoney: ValueForMoney.OVERPRICED,
    pros: [
      "Приятные пастельные цвета корпуса и матовое стекло задней панели",
      "Удобный разъем USB Type-C вместо устаревшего Lightning",
      "Яркий экран с пиковой яркостью до 2000 нит на солнце",
      "Dynamic Island вместо старой челки",
      "Качественные стереодинамики и отличная стабилизация видео"
    ],
    cons: [
      "Устаревшая частота обновления экрана 60 Гц (нет плавности 120 Гц)",
      "Крайне медленная скорость передачи данных по USB-С (стандарт USB 2.0)",
      "Слабая комплектация (нет зарядного устройства, только кабель)",
      "Заметно нагревается под сильной нагрузкой в играх",
      "Переплата за бренд более 25% по сравнению с аналогами на Android"
    ],
    specs: {
      "Операционная система": "iOS 17",
      "Размер экрана": "6.1\"",
      "Технология экрана": "OLED (Super Retina XDR)",
      "Частота обновления экрана": "60 Гц",
      "Процессор": "Apple A16 Bionic",
      "Оперативная память": "6 ГБ",
      "Встроенная память": "128 ГБ",
      "Основная камера": "48 Мп + 12 Мп",
      "Быстрая зарядка": "Да (20 Вт)",
      "Материал корпуса": "Алюминий, стекло"
    },
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80",
    reviewsText: [
      "Телефон хороший, но за эти деньги экран 60 герц в 2024 году это позор. Любой дешевый андроид работает плавнее визуально.",
      "Наконец-то добавили USB-C, теперь один кабель для ноута и телефона. Но кабель в комплекте медленный, фильм передается по полчаса. Пришлось докупать хороший провод.",
      "Батарея держит ровно день, ни больше ни меньше. Заряжается медленнее китайцев. Камера отличная, вопросов нет.",
      "Приятный в руке, задняя спинка шершавая, чехол даже носить не хочется. Но ценник на старте в Минске космос.",
      "Перешел со старого XR - небо и земля. Экран яркий, цвета крутые. Dynamic Island прикольный, но быстро приедается."
    ]
  },
  {
    id: "redminote13",
    title: "Смартфон Xiaomi Redmi Note 13 Pro 8GB/256GB",
    category: "Мобильные телефоны",
    url: "https://catalog.onliner.by/mobile/xiaomi/redmin13pro8256g",
    rating: 4.8,
    ratingCount: 342,
    currentPrice: 850,
    originalPrice: 1100, // Advertised price
    medianPrice90Days: 1070, // Median was 1070
    isFakeDiscount: false,
    honestDiscountPercent: 20.5, // (1070 - 850) / 1070 = ~20.5%
    valueForMoney: ValueForMoney.POPULAR,
    pros: [
      "Великолепный AMOLED экран 120 Гц с тонкими рамками",
      "Мощная зарядка на 67 Вт в комплекте (заряжает до 100% за 45 минут)",
      "Основная камера 200 Мп с оптической стабилизацией (отличные дневные фото)",
      "Наличие разъема 3.5 мм для наушников и ИК-порта",
      "Чехол и защитная пленка уже идут в коробке от производителя"
    ],
    cons: [
      "Огромное количество встроенной рекламы и ненужных приложений в системе",
      "Пластиковая боковая рамка корпуса, уступающая металлу по прочности",
      "Качество видеозаписи ночью оставляет желать лучшего, заметны шумы",
      "Автономность падает на 120 Гц, аккумулятор садится быстрее ожидаемого",
      "Процессор Snapdragon 7s Gen 2 троттлит и нагревается при длительном гейминге"
    ],
    specs: {
      "Операционная система": "Android 13 (HyperOS)",
      "Размер экрана": "6.67\"",
      "Технология экрана": "AMOLED",
      "Частота обновления экрана": "120 Гц",
      "Процессор": "Qualcomm Snapdragon 7s Gen 2",
      "Оперативная память": "8 ГБ",
      "Встроенная память": "256 ГБ",
      "Основная камера": "200 Мп + 8 Мп + 2 Мп",
      "Быстрая зарядка": "Да (67 Вт)",
      "Материал корпуса": "Пластик, стекло"
    },
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=300&q=80",
    reviewsText: [
      "Экран бомбический, после 60 герц обратно не вернусь. Цвета сочные. Зарядка заряжает моментально, это спасение.",
      "Камера на 200 мп это маркетинг. Фотографирует отлично, спору нет, но весят фото много. Ночью часто мажет снимки.",
      "Бесит реклама во встроенной музыке и проводнике. Пришлось полдня лазить по настройкам, чтобы ее отключить.",
      "Корпус собран хорошо, хотя рамка из пластика. Пару раз падал на ламинат - жив, стекло экрана прочное.",
      "За 850 рублей это лучший выбор на рынке сейчас. Очень шустрый за свои деньги."
    ]
  },
  {
    id: "lgoled",
    title: "Телевизор LG OLED55C3RLA",
    category: "Телевизоры",
    url: "https://catalog.onliner.by/tv/lg/oled55c3rla",
    rating: 4.9,
    ratingCount: 64,
    currentPrice: 3400,
    originalPrice: 4300,
    medianPrice90Days: 4200,
    isFakeDiscount: false,
    honestDiscountPercent: 19, // (4200 - 3400) / 4200 = 19%
    valueForMoney: ValueForMoney.OPTIMUM,
    pros: [
      "Безупречный бесконечный контраст и глубокий черный цвет OLED панели",
      "Поддержка 120 Гц контента и технологии G-Sync/FreeSync для консолей",
      "Отличный смарт-интерфейс webOS 23 с пультом-указателем Magic Remote",
      "Минимальная толщина экрана и очень тонкие элегантные рамки",
      "Отличные углы обзора без искажения цвета"
    ],
    cons: [
      "Экран глянцевый и сильно отражает люстры и окна в яркой комнате",
      "Есть риск выгорания пикселей при длительном отображении статики (логотипы каналов, ПК)",
      "Встроенный звук достаточно плоский, для полного погружения нужен саундбар",
      "Высокое энергопотребление по сравнению с классическими LED телевизорами"
    ],
    specs: {
      "Диагональ экрана": "55\"",
      "Разрешение": "3840x2160 (4K UHD)",
      "Технология экрана": "OLED",
      "Частота обновления экрана": "120 Гц",
      "Smart TV": "Да (LG webOS)",
      "Игровые функции": "HDMI 2.1, VRR, ALLM, G-Sync",
      "Аудиосистема": "40 Вт (2.2 канала)"
    },
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80",
    reviewsText: [
      "После обычного ЖК телевизора черный цвет на OLED реально поражает. Ночью смотреть фильмы одно удовольствие.",
      "Пульт Magic Remote лучший на рынке, работает как лазерная указка. Смарт работает шустро, не тупит как андроид свистки.",
      "Панель очень тонкая, вешать на стену было страшно, боялся погнуть. Ножки металлические, стоят устойчиво.",
      "В солнечный день на экране видно всю комнату, приходится закрывать шторы плотно. Матового покрытия очень не хватает."
    ]
  },
  {
    id: "macbookair",
    title: "Ноутбук Apple MacBook Air 13\" M3 2024 (8/256GB)",
    category: "Ноутбуки",
    url: "https://catalog.onliner.by/notebook/apple/air13m38256bk",
    rating: 4.7,
    ratingCount: 88,
    currentPrice: 3800,
    originalPrice: 4000,
    medianPrice90Days: 3850,
    isFakeDiscount: false,
    honestDiscountPercent: 1.3,
    valueForMoney: ValueForMoney.OPTIMUM,
    pros: [
      "Фантастическая производительность процессора M3 без нагрева и шума (нет кулеров)",
      "Рекордная автономность - честные 15-18 часов работы от одного заряда",
      "Яркий и четкий экран Liquid Retina с сочными цветами",
      "Легендарный прочный алюминиевый корпус весом всего 1.24 кг",
      "Магнитный разъем зарядки MagSafe 3 освобождает порты Thunderbolt"
    ],
    cons: [
      "Всего 8 ГБ оперативной памяти в базовой версии (уже мало для тяжелых задач)",
      "За эти деньги SSD объемом 256 ГБ - это издевательство от Apple",
      "Абсолютно неремонтопригоден (все распаяно на материнской плате)",
      "Нельзя подключить более двух внешних мониторов (и то только при закрытой крышке)",
      "Темно-синий цвет Midnight мгновенно собирает все отпечатки пальцев"
    ],
    specs: {
      "Процессор": "Apple M3 (8 ядер)",
      "Оперативная память": "8 ГБ LPDDR5",
      "Объем накопителя": "256 ГБ SSD",
      "Экран": "13.6\" IPS (2560x1664)",
      "Видеокарта": "Apple M3 GPU (8 ядер)",
      "Время работы": "До 18 часов",
      "Вес": "1.24 кг",
      "Охлаждение": "Пассивное (бесшумное)"
    },
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80",
    reviewsText: [
      "Работает бесшумно, вообще нет вентиляторов. Для работы с текстом и браузера идеальная печатная машинка.",
      "Midnight цвет красивый, но заляпывается пальцами за 5 минут. Приходится постоянно протирать тряпочкой.",
      "8 ГБ оперативки хватает для вкладок Chrome и мессенджеров, но если открыть тяжелый код или фотошоп, начинает юзать своп.",
      "Автономность космос - забыл когда заряжал последний раз. Спокойно ухожу на весь день в кофейню без блока питания."
    ]
  },
  {
    id: "dyson",
    title: "Стайлер Dyson Airwrap Multi-Styler Complete",
    category: "Фены и приборы для укладки",
    url: "https://catalog.onliner.by/styler/dyson/airwrapcomplete",
    rating: 4.3,
    ratingCount: 45,
    currentPrice: 1650,
    originalPrice: 2350, // Якобы огромная скидка 30%!
    medianPrice90Days: 1600, // А на самом деле цена всегда была 1600 BYN. Её подняли перед распродажей до 2350!
    isFakeDiscount: true,
    honestDiscountPercent: -3, // Реальная цена увеличилась на 3% по сравнению со средней! Подорожание перед скидкой обнаружено!
    valueForMoney: ValueForMoney.OVERPRICED,
    pros: [
      "Уникальный эффект Коанда для бережной укладки воздухом без экстремального перегрева полотна волоса",
      "Огромный набор качественных магнитных насадок под разные типы причесок в комплекте",
      "Шикарный подарочный кейс для хранения всей экосистемы девайса",
      "Высочайшее качество сборки и очень приятные премиальные тактильные материалы",
      "Экономит массу времени на ежедневную укладку в домашних условиях"
    ],
    cons: [
      "Колоссальная искусственная наценка за бренд и агрессивный инстаграм-маркетинг",
      "Вторичные продавцы постоянно завышают цену перед распродажами для создания иллюзии 30% скидки",
      "Стайлер не подходит для тяжелых, густых или азиатских жестких волос (укладка спадает через час)",
      "Шнур питания толстый, тяжелый и не вращается в некоторых базовых ревизиях",
      "Риск нарваться на качественную китайскую подделку на рынке РБ составляет более 40%"
    ],
    specs: {
      "Мощность": "1300 Вт",
      "Количество насадок": "6",
      "Ионизация": "Да",
      "Подача холодного воздуха": "Да (28 °C)",
      "Режимы нагрева": "3",
      "Режимы скорости воздушного потока": "3",
      "Длина шнура": "2.6 м"
    },
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80",
    reviewsText: [
      "Подарил девушке, укладка супер. Но цена, конечно, безумная за фен с насадками. Маркетинг делает свое дело.",
      "Слабый пластиковый фиксатор насадок за такие бешеные деньги. Насадки со временем люфтят при нагреве.",
      "У меня жесткие волосы, кудри распадаются через 30 минут без тонны лака. Жутко обидно за потраченные деньги.",
      "Красивый чехол из кожи, приятно трогать. Сам аппарат легкий, руки не устают. Но покупать его без скидки - бред."
    ]
  }
];

const PRODUCT_REGISTRY = new Map<string, Product>();

function upsertCatalogProduct(product: Product) {
  PRODUCT_REGISTRY.set(product.id, product);
  return product;
}

function listCatalogProducts() {
  const stored = runtimeStore.listProducts();
  for (const product of stored) PRODUCT_REGISTRY.set(product.id, product);
  return Array.from(PRODUCT_REGISTRY.values());
}

function findCatalogProduct(productId: string | undefined | null) {
  if (!productId) return null;
  return PRODUCT_REGISTRY.get(productId) || runtimeStore.getProduct(productId);
}

function recordAuditRun(
  type: RuntimeAuditRun["type"],
  trigger: RuntimeAuditRun["trigger"],
  startedAtMs: number,
  status: RuntimeAuditRun["status"],
  details: Omit<RuntimeAuditRun, "id" | "type" | "trigger" | "status" | "startedAt" | "finishedAt" | "durationMs"> = {},
) {
  const finishedAt = new Date();
  runtimeStore.addAuditRun({
    id: `run_${type}_${finishedAt.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    trigger,
    status,
    startedAt: new Date(startedAtMs).toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAtMs,
    ...details,
  });
}

function hasLiveOnlinerEvidence(product: Product) {
  return product.dataSource === "onliner_live" || product.priceEvidence?.source === "onliner_live";
}

function findRuntimeCachedProduct(queryText: string) {
  const cleanQuery = queryText.trim();
  const key = extractOnlinerProductKey(cleanQuery);
  const lower = cleanQuery.toLowerCase();
  const liveProducts = listCatalogProducts().filter(hasLiveOnlinerEvidence);

  if (key) {
    const exact = liveProducts.find((product) => product.id.toLowerCase() === key.toLowerCase());
    if (exact) return exact;
  }

  return liveProducts.find((product) => {
    const title = product.title.toLowerCase();
    const url = product.url.toLowerCase();
    return title.includes(lower) || lower.includes(product.id.toLowerCase()) || url.includes(lower);
  }) || null;
}

function markProductAsStaleCache(product: Product, reason: string): Product {
  const warnings = new Set(product.priceEvidence?.warnings || []);
  warnings.add(`Live-refresh Onliner сейчас не прошел: ${reason}. Показан последний сохраненный снимок; перед покупкой проверь цену в карточке.`);

  return {
    ...product,
    dataSource: "fallback",
    priceEvidence: {
      source: "fallback",
      currentPriceSource: `runtime cache: ${runtimeStore.statePath}`,
      medianPriceSource: product.priceEvidence?.medianPriceSource || `runtime cache: ${runtimeStore.statePath}`,
      medianWindowLabel: `${product.priceEvidence?.medianWindowLabel || "последний сохраненный live-снимок"}; stale cache fallback`,
      capturedAt: new Date().toISOString(),
      offersCount: product.priceEvidence?.offersCount || product.offersCount,
      historySource: product.priceEvidence?.historySource,
      historyPointsCount: product.priceEvidence?.historyPointsCount || product.priceHistory?.length,
      historyWindowDays: product.priceEvidence?.historyWindowDays,
      historyPeriod: product.priceEvidence?.historyPeriod,
      warnings: Array.from(warnings),
    },
  };
}

async function resolveProductWithRuntimeFallback(
  queryText: string,
  trigger: RuntimeAuditRun["trigger"],
): Promise<ResolveProductResult> {
  const startedAt = Date.now();
  let liveError = "";

  try {
    const liveProduct = await resolveOnlinerProduct(queryText);
    if (liveProduct) {
      upsertCatalogProduct(liveProduct);
      const snapshot = runtimeStore.recordPriceSnapshot(liveProduct);
      recordAuditRun("onliner_analysis", trigger, startedAt, "success", {
        query: queryText,
        productId: liveProduct.id,
        productsFound: 1,
        source: "onliner_live",
        cacheHit: false,
      });
      return { product: liveProduct, source: "onliner_live", snapshot, cacheHit: false };
    }
  } catch (error: any) {
    liveError = error.message || String(error);
    console.error("Onliner live analysis failed, checking runtime cache:", liveError);
  }

  const cached = findRuntimeCachedProduct(queryText);
  if (cached) {
    const fallbackProduct = markProductAsStaleCache(cached, liveError || "live product not found");
    upsertCatalogProduct(fallbackProduct);
    recordAuditRun("onliner_analysis", trigger, startedAt, "degraded", {
      query: queryText,
      productId: fallbackProduct.id,
      productsFound: 1,
      source: "runtime_cache_stale",
      cacheHit: true,
      error: liveError || undefined,
    });
    return {
      product: fallbackProduct,
      source: "runtime_cache_stale",
      cacheHit: true,
      liveError: liveError || undefined,
    };
  }

  recordAuditRun("onliner_analysis", trigger, startedAt, liveError ? "failed" : "skipped", {
    query: queryText,
    productsFound: 0,
    source: "onliner_live",
    cacheHit: false,
    error: liveError || undefined,
  });

  return {
    product: null,
    source: "not_found",
    cacheHit: false,
    liveError: liveError || undefined,
  };
}

for (const product of MOCK_PRODUCTS) {
  upsertCatalogProduct({
    ...product,
    dataSource: "demo",
    priceEvidence: {
      source: "demo",
      currentPriceSource: "seed demo product in server.ts",
      medianPriceSource: "seed demo product in server.ts",
      medianWindowLabel: "демо-история 90 дней, не live-доказательство",
      capturedAt: new Date().toISOString(),
      warnings: ["Демо-товар нужен для локального UX smoke, не для публикации в канал."],
    },
  });
}

// Helper to calculate observed service facts without pretending demo metrics are production traffic.
const SYSTEM_STATS = {
  totalMockSpentCalculated: 0,
  savedMoneyTotal: 0,
  impulsiveTriesBlocked: 0,
  activeUsersCount: 0,
  realDealsTracked: 0,
};

// API Endpoints: Products
app.get("/api/products", (req, res) => {
  res.json(listCatalogProducts());
});

// API Endpoints: Stats
app.get("/api/stats", (req, res) => {
  const storeStats = runtimeStore.getStats();
  res.json({
    ...SYSTEM_STATS,
    realDealsTracked: storeStats.realDealsTracked,
    trackedProductsCount: storeStats.productsCount,
    priceSnapshotsCount: storeStats.snapshotsCount,
    channelPostsCount: storeStats.channelPostsCount,
    auditRunsCount: storeStats.auditRunsCount,
    lastAuditRun: storeStats.lastAuditRun,
    dataMode: "live_onliner_with_demo_fallback",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "onliner-buyer-advocate",
    now: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    telegram: getTelegramStatus(),
    store: runtimeStore.getStats(),
    security: getSecurityStatus(),
    channelScheduler: getChannelSchedulerStatus(),
    onliner: {
      liveEndpointsUsed: [
        "https://catalog.onliner.by/sdapi/catalog.api/search/{schema}",
        "https://catalog.onliner.by/sdapi/catalog.api/products/{key}",
        "https://catalog.api.onliner.by/products/{key}/prices-history?period=2m",
        "https://shop.api.onliner.by/products/{key}/positions",
        "https://catalog.api.onliner.by/products/{key}/reviews?page={n}",
      ],
      fetchTimeoutMs: Number(process.env.ONLINER_FETCH_TIMEOUT_MS || 8000),
      reviewPagesMax: Number(process.env.ONLINER_REVIEW_PAGES_MAX || 3),
      liveCachedProducts: listCatalogProducts().filter(hasLiveOnlinerEvidence).length,
    },
  });
});

app.get("/api/onliner/search", async (req, res) => {
  const query = String(req.query.query || "").trim();
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  try {
    const products = await searchOnlinerProducts(query);
    res.json({ products: products.slice(0, 10) });
  } catch (error: any) {
    res.status(502).json({ error: "Onliner search failed", details: error.message });
  }
});

// API Endpoint: Analyze custom links or search query
app.post("/api/analyze-link", async (req, res) => {
  const { linkOrTitle } = req.body;
  const queryText = String(linkOrTitle || "").trim();
  if (!queryText) {
    return res.status(400).json({ error: "Не передан поисковый запрос или ссылка" });
  }

  // First try the real public Onliner catalog endpoints. This is the product path
  // that powers Telegram/channel decisions; demo data is only a fallback.
  const liveResult = await resolveProductWithRuntimeFallback(queryText, "manual");
  if (liveResult.product) {
    return res.json({
      found: true,
      product: liveResult.product,
      source: liveResult.source,
      snapshot: liveResult.snapshot,
      cacheHit: liveResult.cacheHit,
      liveError: liveResult.liveError,
    });
  }

  // Check if matches mock DB
  const lowercaseInput = queryText.toLowerCase();
  const matched = listCatalogProducts().find(p => 
    lowercaseInput.includes(p.id) || 
    lowercaseInput.includes(p.title.toLowerCase()) ||
    p.url.toLowerCase().includes(lowercaseInput) ||
    p.title.toLowerCase().includes(lowercaseInput)
  );

  if (matched) {
    return res.json({ found: true, product: matched });
  }

  return res.status(404).json({
    found: false,
    source: "not_found",
    error: "Не нашел подтвержденную карточку товара в live Onliner или локальном демо-каталоге.",
    liveError: liveResult.liveError,
    recommendations: [
      "Попробуй точное название модели, например с памятью и версией.",
      "Вставь прямую ссылку на карточку Onliner.by.",
      "Если нужен внешний магазин, его нужно подключать отдельным проверяемым источником.",
    ],
  });
});

// API Endpoint: AI Chat Assistant with Advocate Persona
app.post("/api/chat", async (req, res) => {
  const { messages, activeProductId } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Неверный формат истории сообщений" });
  }
  if (messages.length === 0 || typeof messages[messages.length - 1]?.text !== "string") {
    return res.status(400).json({ error: "История сообщений пуста или последнее сообщение некорректно" });
  }

  const latestMessage = messages[messages.length - 1].text;
  const activeProduct = findCatalogProduct(activeProductId);

  const ai = getGeminiClient();
  if (ai) {
    try {
      // Build active product context if applicable
      let productContext = "";
      if (activeProduct) {
        productContext = `
КОНТЕКСТ АКТИВНОГО ТОВАРА:
Название: ${activeProduct.title}
Источник данных: ${activeProduct.dataSource || "unknown"}
Категория: ${activeProduct.category}
Текущая цена: ${activeProduct.currentPrice} BYN
Заявленная зачеркнутая цена: ${activeProduct.originalPrice} BYN
Медианный ориентир: ${activeProduct.medianPrice90Days} BYN (${activeProduct.priceEvidence?.medianWindowLabel || "окно не подтверждено"})
Честная скидка: ${activeProduct.honestDiscountPercent}% относительно медианы
Индекс фейковости скидки: ${activeProduct.isFakeDiscount ? "ФЕЙКОВАЯ СКИДКА! (Цену накрутили)" : "ЧЕСТНАЯ СКИДКА"}
Оценка Value for money: ${activeProduct.valueForMoney}
Зафиксированные плюсы: ${activeProduct.pros.join(", ")}
Зафиксированные честные минусы: ${activeProduct.cons.join(", ")}
Покрытие отзывов: ${activeProduct.reviewEvidence ? `${activeProduct.reviewEvidence.processedCount} из ${activeProduct.reviewEvidence.totalCount || activeProduct.reviewEvidence.processedCount}` : "нет детальной выборки"}
Характеристики: ${JSON.stringify(activeProduct.specs)}
`;
      }

      const systemInstruction = `
Ты - "Цифровой адвокат покупателя" (Честный ИИ-помощник для Onliner.by).
Твоя главная миссия - ЗАЩИЩАТЬ КОШЕЛЕК И ИНТЕРЕСЫ ПОКУПАТЕЛЯ, уберегать его от маркетинговых ловушек, фейковых скидок, переплаты за бренд и импульсивных ненужных трат.

ПРАВИЛА ТВОЕГО ПОВЕДЕНИЯ:
1. Будь бескомпромиссно объективным и честным. Не хвали товары ради продажи. Подсвечивай слабые стороны так же ярко, как и сильные.
2. Говори простым, доступным языком "на пальцах". Если пользователь спрашивает про сложные технические термины (например в характеристиках), переводи их на бытовой уровень без занудного жаргона и сложных формул.
3. ЕДКИЙ, НО ДРУЖЕЛЮБНЫЙ ТОН: Разоблачай уловки продавцов. Если видишь фейковую скидку, прямо скажи: "Вас пытаются надуть!". Если вещь переоценена, скажи: "70% цены - это просто налог на логотип".
4. Если пользователь проявляет признаки импульсивной траты (хочет купить прямо сейчас дорогую или раскрученную вещь), твоя задача - включить режим охлаждения бюджета: посоветуй отложить покупку на 2-3 дня, спроси, действительно ли она ему нужна, расскажи про скрытые проблемы товара, мешающие комфортному использованию.
5. Отвечай исключительно на русском языке в лаконичном, структурированном стиле с использованием эмодзи 🛡️, 💸, ⚠️, ❌, ✅, ⚖️ где это уместно.
6. Если источник данных demo, ai_generated или fallback, прямо говори, что это не live-доказательство и нельзя использовать такой товар для публикации в канал.
`;

      const contents = messages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      // Insert active product context into prompt for backend guidance
      if (productContext) {
        contents.push({
          role: "user",
          parts: [{ text: `[Контекст для ИИ: ${productContext}]\nПользователь спрашивает: ${latestMessage}` }]
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ text: response.text });
    } catch (e: any) {
      console.error("Gemini chat error, falling back to static expert responder:", e);
    }
  }

  // Smart fallback chatbot logic if Gemini is offline
  let reply = "🛡️ Я на страже вашего бюджета! Как ваш цифровой адвокат покупателя на Onliner.by, я рекомендую всегда проверять историю цен.";
  const msgLower = latestMessage.toLowerCase();
  
  if (activeProduct) {
    if (msgLower.includes("минус") || msgLower.includes("недостат") || msgLower.includes("плохо")) {
      reply = `⚖️ **Честные недостатки ${activeProduct.title}:**\n${activeProduct.cons.map(c => `- ${c}`).join("\n")}\n\n⚠️ Мой совет: хорошенько подумайте, готовы ли вы мириться с этими вещами ради бренда!`;
    } else if (msgLower.includes("плюс") || msgLower.includes("хорош") || msgLower.includes("достоин")) {
      reply = `✅ **Главные плюсы ${activeProduct.title}:**\n${activeProduct.pros.map(p => `- ${p}`).join("\n")}\n\nНо помните, продавцы трубят только об этом, забывая упомянуть косяки!`;
    } else if (msgLower.includes("скидк") || msgLower.includes("цена") || msgLower.includes("дешев")) {
      if (activeProduct.isFakeDiscount) {
        reply = `❌⚠️ **Внимание: скидка выглядит нечестной!**\nПродавец заявляет цену до распродажи в ${activeProduct.originalPrice} BYN. Медианный ориентир сейчас: ${activeProduct.medianPrice90Days} BYN (${activeProduct.priceEvidence?.medianWindowLabel || "окно не подтверждено"}).\n\nФактическая экономия составляет около **${activeProduct.honestDiscountPercent}%**. Не поддавайтесь на красивую зачеркнутую цену без истории!`;
      } else {
        reply = `✅ **Математический патруль видит реальное снижение:**\nТекущая цена в ${activeProduct.currentPrice} BYN ниже медианного ориентира (${activeProduct.medianPrice90Days} BYN) на **${activeProduct.honestDiscountPercent}%**.\nИсточник окна: ${activeProduct.priceEvidence?.medianWindowLabel || "не подтверждено"}. Рассматривать можно только если товар действительно нужен.`;
      }
    } else {
      reply = `🛡️ По товару **${activeProduct.title}** я могу провести глубокий анализ. Нажмите кнопку «Сводка мнений» или спросите меня: "Какие тут минусы?" или "Честная ли цена?".\n\nТакже вы можете запустить «Анти-импульсивный трекер», чтобы проверить свои нервы!`;
    }
  } else {
    if (msgLower.includes("120") || msgLower.includes("герц") || msgLower.includes("частот")) {
      reply = `📺 **Что такое 120 Гц экрана «на пальцах»?**\nПредставьте блокнот с рисунками: если вы быстро его перелистываете, картинка «оживает». 60 Гц — это 60 страниц в секунду, а 120 Гц — это 120 страниц.\n\n*Зачем это надо?* Экран работает в два раза плавнее. Списки прокручиваются идеально мягко, игры выглядят суперреалистично. \n*Кому это НЕ надо?* Если вы только читаете новости и смотрите видео в YouTube (они всё равно идут в 30 или 60 кадров), платить за 120 Гц лишние 300 BYN смысла нет!`;
    } else if (msgLower.includes("oled") || msgLower.includes("олед")) {
      reply = `💡 **Разница между OLED и обычным экраном:**\nВ обычном телевизоре сзади горит огромная лампа (подсветка). Из-за этого черный цвет выглядит темно-серым.\n\nВ OLED каждый пиксель — это крошечная лампочка. Когда нужно показать черный цвет, пиксель просто тухнет. Мы получаем абсолютно идеальный черный цвет и бесконечную контрастность.\n\n⚠️ **Обратная сторона адвоката:** OLED экраны могут выгорать со временем, если горит одна и та же статичная картинка (например, значок канала ОНТ), а еще они сильно бликуют на солнце. Стоит ли переплаты в 2 раза? Только для киноманов и ночных просмотров.`;
    } else {
      reply = `🤖 Привет! Я твой ИИ-адвокат Onliner.by. Напиши мне модель гаджета, отправь ссылку на каталог, или спроси о технологиях (например, "Что такое IPS экран?").\n\nЯ разложу всё на пальцах и спасу твои сбережения!`;
    }
  }

  res.json({ text: reply });
});

// API Endpoint: AI Summary of hundreds of Onliner reviews
app.post("/api/summarize-reviews", async (req, res) => {
  const { productId } = req.body;
  const product = findCatalogProduct(productId);

  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const reviewEvidenceLine = product.reviewEvidence
        ? `Отзывы обработаны: ${product.reviewEvidence.processedCount} из ${product.reviewEvidence.totalCount || product.reviewEvidence.processedCount}. Топ плюсов: ${JSON.stringify(product.reviewEvidence.topPros)}. Топ минусов: ${JSON.stringify(product.reviewEvidence.topCons)}.`
        : "Детальная выборка отзывов не сохранена.";
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Ты - ИИ-суммаризатор отзывов покупателей Onliner.by с позиционированием "Цифровой адвокат".
На основе следующих реальных комментариев покупателей о товаре "${product.title}":
${JSON.stringify(product.reviewsText)}
${reviewEvidenceLine}

Сделай честную, объективную выжимку плюсов и минусов, избегая маркетингового шума. 
Разбей ответ на 3 блока:
1. ⚖️ **Вердикт большинства** (краткое саммари общего настроения покупателей простым языком).
2. ✅ **Что хвалят в реальности** (3-4 пункта емко).
3. ❌ **Скрытые косяки и жалобы** (3-4 конкретных жалобы, на что ругаются реальные владельцы после 1-3 месяцев использования).

Будь максимально строгим адвокатом. На пиши ни одной надуманной хвалебной фразы. Использовать русский язык.`,
      });
      return res.json({ summary: response.text });
    } catch (e: any) {
      console.error("Gemini summarize-reviews failed, using local DB:", e);
    }
  }

  // Pre-formatted default high-fidelity response
  const formatPros = (product.reviewEvidence?.topPros?.length
    ? product.reviewEvidence.topPros.map((item) => item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label)
    : product.pros
  ).slice(0, 3).map(p => `• ${p}`).join("\n");
  const formatCons = (product.reviewEvidence?.topCons?.length
    ? product.reviewEvidence.topCons.map((item) => item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label)
    : product.cons
  ).slice(0, 3).map(c => `• ${c}`).join("\n");
  const reviewEvidenceNote = product.reviewEvidence
    ? `Обработано ${product.reviewEvidence.processedCount} из ${product.reviewEvidence.totalCount || product.reviewEvidence.processedCount} отзывов Onliner.`
    : `Использована сохраненная локальная выжимка отзывов.`;
  const fallbackSummary = `
⚖️ **Вердикт большинства покупателей:**
Продукт имеет среднюю оценку ${product.rating}/5. ${reviewEvidenceNote} Ниже не рекламная похвала, а повторяющиеся сигналы владельцев.

✅ **Что хвалят в реальности (Мнение народа):**
${formatPros}

❌ **Скрытые косяки и жалобы (На что ругаются владельцы через месяц):**
${formatCons}

🛡️ *Адвокат Onliner предупреждает:* Накрутка положительных отзывов продавцами - частая механика. Всегда доверяйте только тем владельцам, которые указывают физические недостатки сборки и деталей!
`;
  res.json({ summary: fallbackSummary });
});

// API Endpoint: Compare user's current device with target product
app.post("/api/compare", async (req, res) => {
  const { targetProductId, oldDeviceName } = req.body;
  const targetProduct = findCatalogProduct(targetProductId);

  if (!targetProduct) {
    return res.status(404).json({ error: "Целевой товар не найден" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Ты - "цифровой адвокат покупателя" для Onliner.by. 
Пользователь просит сравнить его текущее старое устройство "${oldDeviceName}" с новой моделью "${targetProduct.title}", которую он думает купить по текущей цене ${targetProduct.currentPrice} BYN.

Сделай честное, жесткое сравнение целесообразности перехода. Дай ответ исключительно на русском языке, содержащий:
1. ⚙️ **Реальный прирост в повседневной жизни**: Назови цифры или ощущения "на пальцах" (например, "будет работать на 15% быстрее, вы этого даже не заметите при чтении книг").
2. 💸 **Целесообразность трат**: Стоит ли отдавать ${targetProduct.currentPrice} BYN за эти улучшения?
3. 🛡️ **Честный вердикт адвоката**: Дай одну из оценок: "СТОИТ МЕНЯТЬ" (только если прирост колоссальный), "ЖДАТЬ СКИДКИ" или "ОТКАЗАТЬСЯ ОТ ПОКУПКИ" (если старое устройство еще отлично справляется, а новое - переоцененный маркетинг). Докажи математически.`,
      });
      return res.json({ comparison: response.text });
    } catch (e: any) {
      console.error("Gemini compare failed:", e);
    }
  }

  // Fallback Comparison
  const fallbackComparison = `
⚖️ **СРАВНЕНИЕ: Ваш [${oldDeviceName}] против [${targetProduct.title}]**

💸 **Реальный прирост в повседневных задачах:**
Переход со старого устройства на ${targetProduct.title} обеспечит около 20-25% прироста в синтетических тестах. На практике: анимация будет чуть плавнее, но приложения будут загружаться буквально на 0.5 секунды быстрее. Экран станет ярче на солнце, но в помещении разница незаметна.

⚖️ **Финансовый аудит (Целесообразность траты ${targetProduct.currentPrice} BYN):**
Потратить такую сумму ради минорных улучшений — решение нерациональное. Ваше текущее устройство "${oldDeviceName}" прекрасно решит все базовые задачи еще как минимум год.

🛡️ **ОКОНЧАТЕЛЬНЫЙ ВЕРДИКТ АДВОКАТА:**
**ОТКАЗАТЬСЯ ОТ ПОКУПКИ (НЕРАЦИОНАЛЬНО)!** ❌
Сэкономленные деньги в количестве ${targetProduct.currentPrice} BYN принесут вам гораздо больше пользы в банке или на более важные статьи бюджета. Прирост технологий не оправдывает опустошение кошелька!
`;
  res.json({ comparison: fallbackComparison });
});

// API Endpoint: Generate telegram channel post for a product
async function finalizeChannelPost(post: ChannelPost, publishToTelegram: boolean) {
  let delivery: any = {
    ok: false,
    dryRun: true,
    reason: publishToTelegram
      ? "Telegram delivery was requested but not attempted yet."
      : "publishToTelegram=false; post was generated and saved locally only.",
  };

  if (publishToTelegram) {
    try {
      delivery = await publishChannelPost(post);
    } catch (error: any) {
      delivery = { ok: false, dryRun: false, reason: error.message };
    }
  }

  post.deliveryStatus = delivery.ok ? "sent" : delivery.dryRun ? "dry_run" : "failed";
  post.deliveryDetails = delivery.reason || (delivery.ok ? "Sent through Telegram Bot API." : "Telegram delivery failed.");
  runtimeStore.addChannelPost(post);
  return delivery;
}

async function publishBestDealsRun(options: BestDealRunOptions) {
  const startedAt = Date.now();
  let deals: Product[] = [];

  try {
    deals = await findOnlinerDeals(options.query, options.minDiscountPercent);
    for (const deal of deals) {
      upsertCatalogProduct(deal);
      runtimeStore.recordPriceSnapshot(deal);
    }
  } catch (error: any) {
    const liveError = error.message || String(error);
    const cachedCandidates = listCatalogProducts()
      .filter((product) => hasLiveOnlinerEvidence(product))
      .filter((product) => product.honestDiscountPercent >= options.minDiscountPercent && !product.isFakeDiscount)
      .map((product) => markProductAsStaleCache(product, liveError))
      .slice(0, 5);

    recordAuditRun("channel_publish", options.trigger, startedAt, cachedCandidates.length ? "degraded" : "failed", {
      query: options.query,
      productsFound: cachedCandidates.length,
      postsCreated: 0,
      published: false,
      source: cachedCandidates.length ? "runtime_cache_stale" : "onliner_live",
      cacheHit: cachedCandidates.length > 0,
      error: liveError,
      details: {
        reason: "Live Onliner source failed. Cached candidates are returned for admin review only and are not auto-published.",
      },
    });

    return {
      published: false,
      trigger: options.trigger,
      query: options.query,
      minDiscountPercent: options.minDiscountPercent,
      reason: "Live Onliner source is unavailable; stale cached deals were not auto-published.",
      deals: [],
      cachedCandidates,
      liveError,
    };
  }

  const selected = deals[0];
  if (!selected) {
    recordAuditRun("channel_publish", options.trigger, startedAt, "skipped", {
      query: options.query,
      productsFound: 0,
      postsCreated: 0,
      published: false,
      source: "onliner_live",
      cacheHit: false,
      details: {
        minDiscountPercent: options.minDiscountPercent,
      },
    });

    return {
      published: false,
      trigger: options.trigger,
      query: options.query,
      minDiscountPercent: options.minDiscountPercent,
      reason: "No honest live Onliner deals matched the filter.",
      deals: [],
    };
  }

  const advertisedDiscount = selected.originalPrice > 0
    ? Math.round(((selected.originalPrice - selected.currentPrice) / selected.originalPrice) * 100)
    : Math.max(0, Math.round(selected.honestDiscountPercent));
  const post: ChannelPost = {
    id: `post_live_${selected.id}_${Date.now()}`,
    productId: selected.id,
    title: selected.title,
    category: selected.category,
    advertisedDiscount,
    realDiscount: Math.round(selected.honestDiscountPercent),
    honestyScore: selected.isFakeDiscount ? 15 : Math.min(99, Math.max(50, 70 + Math.round(selected.honestDiscountPercent))),
    honestyVerdict: selected.isFakeDiscount ? "ФЕЙКОВАЯ СКИДКА! ❌" : "РЕАЛЬНАЯ ВЫГОДА! ✅",
    currentPrice: selected.currentPrice,
    regularPrice: selected.medianPrice90Days,
    pros: selected.pros.slice(0, 2).join(". "),
    cons: selected.cons.slice(0, 2).join(". "),
    buyerAdvocateVerdict: `🛡️ Живой фильтр Onliner нашел цену ниже медианного ориентира на ${selected.honestDiscountPercent}%. Минусы перед покупкой: ${selected.cons.slice(0, 2).join("; ")}. Данные: ${selected.priceEvidence?.medianWindowLabel || "live-снимок"}.`,
    timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    views: 0,
    shares: 0,
    commentsCount: 0,
  };

  const delivery = await finalizeChannelPost(post, options.publishToTelegram);
  recordAuditRun("channel_publish", options.trigger, startedAt, delivery.ok || delivery.dryRun ? "success" : "degraded", {
    query: options.query,
    productId: selected.id,
    productsFound: deals.length,
    postsCreated: 1,
    published: Boolean(delivery.ok),
    source: "onliner_live",
    cacheHit: false,
    details: {
      deliveryStatus: post.deliveryStatus,
      minDiscountPercent: options.minDiscountPercent,
    },
  });

  return {
    published: delivery.ok,
    trigger: options.trigger,
    query: options.query,
    minDiscountPercent: options.minDiscountPercent,
    post,
    delivery,
    candidates: deals.slice(0, 5),
  };
}

app.get("/api/channel/posts", (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
  res.json({ posts: runtimeStore.listChannelPosts(limit) });
});

app.get("/api/onliner/doctor", requireAdmin, async (req, res) => {
  const query = String(req.query.query || process.env.ONLINER_POLL_QUERY || "redmi note 15 pro").trim();
  const startedAt = Date.now();
  let liveProduct: Product | null = null;
  let liveError = "";

  try {
    liveProduct = await resolveOnlinerProduct(query);
  } catch (error: any) {
    liveError = error.message || String(error);
  }

  const historyPointsCount = liveProduct?.priceEvidence?.historyPointsCount || liveProduct?.priceHistory?.length || 0;
  const readyForLiveSource = Boolean(liveProduct && liveProduct.currentPrice > 0 && historyPointsCount >= 2);
  const cached = findRuntimeCachedProduct(query) || listCatalogProducts().find(hasLiveOnlinerEvidence) || null;
  const status = readyForLiveSource
    ? "live_ok"
    : cached
      ? "live_unavailable_cache_available"
      : "live_unavailable_no_cache";
  const recommendations = readyForLiveSource
    ? []
    : [
        cached
          ? "Onliner live check failed or returned weak history; stale runtime cache is available only as a clearly labeled fallback."
          : "No live Onliner result and no live runtime cache are available for this query.",
        "Run npm run contract:onliner from a network that can reach catalog.onliner.by, catalog.api.onliner.by, and shop.api.onliner.by before claiming live readiness.",
      ];

  recordAuditRun("onliner_doctor", "manual", startedAt, readyForLiveSource ? "success" : cached ? "degraded" : "failed", {
    query,
    productId: liveProduct?.id || cached?.id,
    productsFound: liveProduct ? 1 : cached ? 1 : 0,
    source: readyForLiveSource ? "onliner_live" : cached ? "runtime_cache_stale" : "onliner_live",
    cacheHit: !readyForLiveSource && Boolean(cached),
    error: liveError || undefined,
    details: {
      status,
      historyPointsCount,
      historyPeriod: liveProduct?.priceEvidence?.historyPeriod,
    },
  });

  res.json({
    ok: readyForLiveSource,
    readyForLiveSource,
    status,
    query,
    checkedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    liveProduct: liveProduct ? {
      id: liveProduct.id,
      title: liveProduct.title,
      currentPrice: liveProduct.currentPrice,
      historyPointsCount,
      historyPeriod: liveProduct.priceEvidence?.historyPeriod,
      medianWindowLabel: liveProduct.priceEvidence?.medianWindowLabel,
    } : null,
    cacheFallback: cached ? {
      id: cached.id,
      title: cached.title,
      lastCheckedAt: cached.lastCheckedAt,
      currentPrice: cached.currentPrice,
      historyPointsCount: cached.priceEvidence?.historyPointsCount || cached.priceHistory?.length || 0,
    } : null,
    liveError: liveError || undefined,
    recommendations,
  });
});

app.get("/api/onliner/audit-runs", requireAdmin, (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
  const type = String(req.query.type || "").trim() as RuntimeAuditRun["type"] | "";
  res.json({ runs: runtimeStore.listAuditRuns(limit, type || undefined) });
});

app.post("/api/generate-channel-post", requireAdmin, async (req, res) => {
  const { productId, criticLevel, publishToTelegram } = req.body; // criticLevel: "mild" | "normal" | "roast"
  const product = findCatalogProduct(productId);

  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  let levelInstruction = "Сбалансированная объективная критика.";
  if (criticLevel === "roast") {
    levelInstruction = "МАКСИМАЛЬНЫЙ РАЗНОС (Жесткий разнос всех уловок продавца и недостатков товара. Никакой пощады маркетингу Apple/Xiaomi. Пиши язвительно и увлекательно!).";
  } else if (criticLevel === "mild") {
    levelInstruction = "Мягкая критика с акцентом на альтернативы.";
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Ты - ИИ-редактор популярного Telegram-канала "Честный Onliner | Адвокат Покупателя".
Создай цепляющий, саркастичный и полезный пост для своего канала про товар "${product.title}" со следующими финансовыми вводными:
- Источник данных: ${product.dataSource || "unknown"}.
- Заявленная скидка продавцом: С ${product.originalPrice} BYN до ${product.currentPrice} BYN.
- Медианный ориентир: ${product.medianPrice90Days} BYN (${product.priceEvidence?.medianWindowLabel || "окно не подтверждено"}).
- Честная скидка: ${product.honestDiscountPercent}%.
- Является ли скидка фейком: ${product.isFakeDiscount ? "Да (ценник накрутили прямо перед распродажей)" : "Нет (цена действительно упала ниже обычной)"}.
- Повторяющиеся плюсы из отзывов: ${JSON.stringify(product.reviewEvidence?.topPros || product.pros)}.
- Повторяющиеся минусы из отзывов: ${JSON.stringify(product.reviewEvidence?.topCons || product.cons)}.
- Покрытие отзывов: ${product.reviewEvidence ? `${product.reviewEvidence.processedCount} из ${product.reviewEvidence.totalCount || product.reviewEvidence.processedCount}` : "детальная выборка не сохранена"}.

Формат ИИ-редактора: ${levelInstruction}

Сделай потрясающий Telegram пост на русском языке, укладывающийся в 1000 символов, следующего формата:
📢 **[КРИЧАЩИЙ ЦЕПЛЯЮЩИЙ ЗАГОЛОВОК С РАЗОБЛАЧЕНИЕМ]**
🛒 Товар: ${product.title}
💰 Заявленная скидка: -${Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100)}% (С ${product.originalPrice} BYN до ${product.currentPrice} BYN)

⚖️ **РАЗОБЛАЧЕНИЕ ЦЕНЫ:**
(Здесь напиши математический расчет. Реальная ли скидка относительно медианного ориентира или наглый фейк? Если источник не onliner_live, честно пометь как демо.)

⚠️ **ЗА ЧТО ЭТОТ ТОВАР МОЖНО ПРЕНЕБРЕЧЬ (ЧЕСТНЫЕ МИНУСЫ):**
(2-3 жестких, правдивых косяка из списка консенсуса владельцев)

🛡️ **ВЕРДИКТ АДВОКАТА:**
(Окончательный совет покупателю в 1 предложении: брать или бежать?)`,
      });

      // Calculate dynamic scores for visualization
      const post: ChannelPost = {
        id: "post_" + Math.random().toString(36).substr(2, 9),
        productId: product.id,
        title: product.title,
        category: product.category,
        advertisedDiscount: Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100),
        realDiscount: Math.round(product.honestDiscountPercent),
        honestyScore: product.isFakeDiscount ? 15 : 92,
        honestyVerdict: product.isFakeDiscount ? "ФЕЙКОВАЯ СКИДКА! ❌" : "РЕАЛЬНАЯ ВЫГОДА! ✅",
        currentPrice: product.currentPrice,
        regularPrice: product.medianPrice90Days,
        pros: product.pros.slice(0, 2).join(". "),
        cons: product.cons.slice(0, 2).join(". "),
        buyerAdvocateVerdict: response.text ? response.text.trim() : "Не покупайте этот товар во избежание разочарования.",
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        views: Math.floor(Math.random() * 800) + 120,
        shares: Math.floor(Math.random() * 45) + 5,
        commentsCount: Math.floor(Math.random() * 23) + 2
      };

      const delivery = await finalizeChannelPost(post, Boolean(publishToTelegram));
      return res.json({ post, delivery });
    } catch (e: any) {
      console.error("Gemini context post generation failed. Generating standard post:", e);
    }
  }

  // Pre-compiled fallback for posts if Gemini fails or is missing
  const advertisedDiscount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
  const reviewCoverage = product.reviewEvidence
    ? `\n📣 **ОТЗЫВЫ:** обработано ${product.reviewEvidence.processedCount} из ${product.reviewEvidence.totalCount || product.reviewEvidence.processedCount}; повторяющиеся жалобы ниже.`
    : "";
  const fakeVerdict = product.isFakeDiscount 
    ? `🚨 **МАРКЕТИНГОВЫЙ РАЗВОД ОБНАРУЖЕН!**\nПродавец уверяет нас в щедрой скидке в -${advertisedDiscount}%! Но медианный ориентир сейчас ${product.medianPrice90Days} BYN. Реальная разница составляет ${Math.round(product.honestDiscountPercent)}%. Источник окна: ${product.priceEvidence?.medianWindowLabel || "не подтверждено"}.`
    : `✅ **СНИЖЕНИЕ ПОДТВЕРЖДЕНО!**\nТекущая цена ниже медианного ориентира (${product.medianPrice90Days} BYN). Честная выгода составляет ${Math.round(product.honestDiscountPercent)}%. Источник окна: ${product.priceEvidence?.medianWindowLabel || "не подтверждено"}.`;

  const fallbackPost: ChannelPost = {
    id: "post_fallback_" + product.id,
    productId: product.id,
    title: product.title,
    category: product.category,
    advertisedDiscount,
    realDiscount: Math.round(product.honestDiscountPercent),
    honestyScore: product.isFakeDiscount ? 12 : 94,
    honestyVerdict: product.isFakeDiscount ? "ФЕЙКОВАЯ СКИДКА! ❌" : "РЕАЛЬНАЯ ВЫГОДА! ✅",
    currentPrice: product.currentPrice,
    regularPrice: product.medianPrice90Days,
    pros: product.pros.slice(0, 2).join(". "),
    cons: product.cons.slice(0, 2).join(". "),
    buyerAdvocateVerdict: `📢 **${product.isFakeDiscount ? 'ОСТОРОЖНО: НАКРУТКА ЦЕНЫ!' : 'АКЦИЯ ПОДТВЕРЖДЕНА!'}**\n\n🛒 ${product.title}\n💰 Цена сейчас: ${product.currentPrice} BYN (Было заявлено ${product.originalPrice} BYN)\n\n⚖️ **РАЗОБЛАЧЕНИЕ ЦЕННИКА:**\n${fakeVerdict}${reviewCoverage}\n\n⚠️ **КРИТИЧЕСКИЕ МИНУСЫ ТОВАРА:**\n- ${product.cons[0]}\n- ${product.cons[1]}\n\n⚖️ **СЛОВО АДВОКАТУ:**\n${product.isFakeDiscount ? 'Бегите от этой "скидки" подальше, цена надута!' : 'С покупкой можно согласиться, если прибор действительно нужен.'}`,
    timestamp: "12:35",
    views: 450,
    shares: 12,
    commentsCount: 5
  };

  const delivery = await finalizeChannelPost(fallbackPost, Boolean(publishToTelegram));
  res.json({ post: fallbackPost, delivery });
});

app.post("/api/channel/publish-best-deals", requireAdmin, async (req, res) => {
  const query = String(req.body?.query || process.env.ONLINER_POLL_QUERY || "redmi").trim();
  const minDiscountPercent = Number(req.body?.minDiscountPercent || process.env.MIN_HONEST_DISCOUNT_PERCENT || 20);
  const publishToTelegram = Boolean(req.body?.publishToTelegram);

  try {
    res.json(await publishBestDealsRun({ query, minDiscountPercent, publishToTelegram, trigger: "manual" }));
  } catch (error: any) {
    res.status(502).json({ error: "Failed to publish best live deals", details: error.message });
  }
});

app.get("/api/telegram/doctor", requireAdmin, async (req, res) => {
  const expectedWebhookUrl = String(req.query.expectedWebhookUrl || "").trim() || undefined;
  try {
    res.json(await runTelegramDoctor(expectedWebhookUrl));
  } catch (error: any) {
    res.status(502).json({ error: "Telegram doctor failed", details: error.message });
  }
});

app.post("/api/telegram/set-webhook", requireAdmin, async (req, res) => {
  const webhookUrl = String(req.body?.webhookUrl || "").trim();
  if (!webhookUrl) {
    return res.status(400).json({ error: "webhookUrl is required" });
  }

  try {
    const result = await setTelegramWebhook(webhookUrl);
    res.json(result);
  } catch (error: any) {
    res.status(502).json({ error: "Telegram setWebhook failed", details: error.message });
  }
});

app.post(["/telegram/webhook", "/api/telegram/webhook"], async (req, res) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.header("x-telegram-bot-api-secret-token") !== secret) {
    return res.status(403).json({ ok: false, error: "Invalid Telegram webhook secret" });
  }

  const update = req.body;
  const message = update?.message || update?.edited_message;
  const chatId = message?.chat?.id;
  const text = String(message?.text || "").trim();

  if (!chatId || !text) {
    return res.json({ ok: true, ignored: true });
  }

  try {
    if (text === "/start" || text === "/help") {
      const answer = [
        "🛡️ Я цифровой адвокат покупателя для Onliner.by.",
        "",
        "Отправь ссылку на товар или название модели, а я проверю цену, отзывы и честные минусы.",
        "Команды:",
        "/deals - найти живые честные скидки по дефолтному запросу",
        "/health - статус сервиса",
        "",
        "Важно: проект неофициальный и не аффилирован с Onliner.by. Разработано AI_Nikitka93.",
      ].join("\n");
      const delivery = await sendTelegramMessage(chatId, answer);
      return res.json({ ok: true, delivery });
    }

    if (text === "/health") {
      const delivery = await sendTelegramMessage(chatId, `Сервис работает. Telegram delivery: ${JSON.stringify(getTelegramStatus())}`);
      return res.json({ ok: true, delivery });
    }

    if (text === "/deals") {
      let deals: Product[] = [];
      let staleCache = false;
      let dealsError = "";
      try {
        deals = await findOnlinerDeals(process.env.ONLINER_POLL_QUERY || "redmi", Number(process.env.MIN_HONEST_DISCOUNT_PERCENT || 20));
      } catch (error: any) {
        dealsError = error.message || String(error);
        staleCache = true;
        deals = listCatalogProducts()
          .filter(hasLiveOnlinerEvidence)
          .filter((product) => product.honestDiscountPercent >= Number(process.env.MIN_HONEST_DISCOUNT_PERCENT || 20) && !product.isFakeDiscount)
          .map((product) => markProductAsStaleCache(product, dealsError))
          .slice(0, 5);
      }
      const answer = deals.length
        ? `${staleCache ? "Live Onliner сейчас недоступен; показываю только stale cache для ручной проверки:\n\n" : "Нашел честные live-кандидаты:\n\n"}${deals.slice(0, 5).map((deal) => `- ${deal.title}: ${deal.currentPrice} BYN, выгода ${deal.honestDiscountPercent}%\n${deal.url}`).join("\n\n")}`
        : staleCache
          ? "Live Onliner сейчас недоступен, а сохраненного live-кэша по честным скидкам нет. Публиковать нечего."
          : "Сейчас честных live-скидок по дефолтному запросу не найдено. Это лучше, чем публиковать мусор.";
      const delivery = await sendTelegramMessage(chatId, answer);
      return res.json({ ok: true, delivery, dealsCount: deals.length, staleCache, liveError: dealsError || undefined });
    }

    const resolved = await resolveProductWithRuntimeFallback(text, "telegram");
    if (!resolved.product) {
      const delivery = await sendTelegramMessage(chatId, "Не смог найти товар в live Onliner. Пришли точную ссылку из catalog.onliner.by или более конкретное название.");
      return res.json({ ok: true, delivery, found: false });
    }

    const delivery = await sendTelegramMessage(chatId, formatProductTelegramAnswer(resolved.product));
    res.json({
      ok: true,
      found: true,
      productId: resolved.product.id,
      source: resolved.source,
      cacheHit: resolved.cacheHit,
      liveError: resolved.liveError,
      delivery,
    });
  } catch (error: any) {
    console.error("Telegram webhook handling failed:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

async function runScheduledChannelCycle() {
  if (channelScheduler.running) return;

  channelScheduler.running = true;
  channelScheduler.lastRunAt = new Date().toISOString();
  channelScheduler.lastError = null;

  try {
    const result = await publishBestDealsRun({
      query: process.env.ONLINER_POLL_QUERY || "redmi",
      minDiscountPercent: Number(process.env.MIN_HONEST_DISCOUNT_PERCENT || 20),
      publishToTelegram: process.env.AUTO_PUBLISH_CHANNEL === "true",
      trigger: "scheduler",
    });
    channelScheduler.lastResult = {
      published: result.published,
      reason: result.reason,
      query: result.query,
      minDiscountPercent: result.minDiscountPercent,
      postId: result.post?.id,
      deliveryStatus: result.post?.deliveryStatus,
    };
  } catch (error: any) {
    channelScheduler.lastError = error.message;
    console.error("Scheduled channel cycle failed:", error);
  } finally {
    channelScheduler.running = false;
  }
}

function startChannelScheduler() {
  if (!channelScheduler.enabled) return;

  if (!Number.isFinite(channelScheduler.intervalMinutes) || channelScheduler.intervalMinutes < 5) {
    channelScheduler.intervalMinutes = 360;
  }

  const intervalMs = channelScheduler.intervalMinutes * 60_000;
  channelScheduler.timer = setInterval(() => {
    void runScheduledChannelCycle();
  }, intervalMs);

  if (process.env.CHANNEL_POLL_ON_START === "true") {
    setTimeout(() => void runScheduledChannelCycle(), 2_000);
  }

  console.log(`[Channel Scheduler] enabled; interval=${channelScheduler.intervalMinutes} minutes`);
}

// Configure Vite middleware in development or express static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Honest Onliner Advocate Service] running on port ${PORT}`);
    startChannelScheduler();
  });
}

startServer();
