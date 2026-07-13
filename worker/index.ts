type Env = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANNEL_ID?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_BOT_USERNAME?: string;
  ADMIN_API_TOKEN: string;
  ENABLE_TELEGRAM_DELIVERY?: string;
  ENABLE_CHANNEL_CRON?: string;
  ONLINER_POLL_QUERY?: string;
  MIN_HONEST_DISCOUNT_PERCENT?: string;
  ONLINER_SEARCH_SCHEMAS?: string;
  ONLINER_SUPERPRICE_CATEGORY_GROUPS?: string;
  ONLINER_DEAL_SCAN_LIMIT?: string;
  ONLINER_DEAL_SCAN_PAGES?: string;
  ONLINER_DEAL_ANALYZE_LIMIT?: string;
  ONLINER_DEAL_MIN_PRICE_BYN?: string;
  ONLINER_DEAL_MIN_OFFERS?: string;
  ONLINER_FETCH_TIMEOUT_MS?: string;
  ONLINER_REVIEW_PAGES_MAX?: string;
  ENABLE_5ELEMENT_PILOT?: string;
  FIVE_ELEMENT_SEARCH_API_KEY?: string;
  DEAL_REPOST_COOLDOWN_HOURS?: string;
  DEAL_REPOST_PRICE_DROP_PERCENT?: string;
  ENABLE_PRICE_WATCHES?: string;
  PRICE_WATCH_DROP_PERCENT?: string;
  PRICE_WATCH_SCAN_LIMIT?: string;
  PRICE_WATCH_NOTIFY_COOLDOWN_HOURS?: string;
  WORKER_PUBLIC_URL?: string;
  PUBLIC_API_RATE_LIMIT_MAX?: string;
  PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS?: string;
  PUBLIC_API_RATE_LIMITER?: RateLimitBinding;
  DEAL_ALERTS_KV?: KVNamespaceLike;
  AUTO_PUBLISH_RARE_THRESHOLD_PERCENT?: string;
};

type RateLimitBinding = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

type KVNamespaceLike = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
};

type ScheduledEvent = {
  scheduledTime: number;
  cron: string;
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

type OnlinerMoney = {
  amount?: string;
  currency?: string;
};

type OnlinerProduct = {
  key: string;
  schema?: {
    key?: string;
    name?: string;
  };
  name?: string;
  name_prefix?: string;
  full_name?: string;
  extended_name?: string;
  html_url?: string;
  images?: { header?: string };
  manufacturer?: { name?: string };
  description_list?: string[];
  micro_description_list?: string[];
  reviews?: {
    rating?: number;
    count?: number;
    html_url?: string;
    url?: string;
  };
  sale?: {
    discount?: number;
    min_prices_median?: OnlinerMoney;
  };
  prices?: {
    price_min?: OnlinerMoney;
    offers?: { count?: number };
    html_url?: string;
    url?: string;
  };
};

type PriceHistoryPoint = {
  date: string;
  price: number;
  currency: string;
};

type OnlinerReview = {
  id?: number | string;
  summary?: string;
  text?: string;
  rating?: number;
  pros?: string;
  cons?: string;
  created_at?: string;
};

type OnlinerReviewsPage = {
  reviews?: OnlinerReview[];
  total?: number;
  page?: {
    limit?: number;
    items?: number;
    current?: number;
    last?: number;
  };
};

type ReviewInsight = {
  label: string;
  count: number;
  examples: string[];
};

type ReviewEvidence = {
  source: "onliner_reviews_api";
  endpoint: string;
  htmlUrl?: string;
  processedCount: number;
  totalCount: number;
  pagesProcessed: number;
  pagesAvailable: number;
  maxPages: number;
  averageFetchedRating?: number;
  latestReviewAt?: string;
  topPros: ReviewInsight[];
  topCons: ReviewInsight[];
  warnings: string[];
};

type PriceComparisonOffer = {
  source: "onliner_marketplace" | "external_5element";
  sellerName: string;
  price: number;
  currency: string;
  url?: string;
  warrantyMonths?: number;
  updatedAt?: string;
  notes: string[];
};

type PriceComparisonSource = {
  source: "onliner_marketplace" | "external_5element" | "external_sites";
  sourceType: "marketplace" | "external_pilot" | "placeholder";
  confidence: "high" | "pilot" | "none";
  label: string;
  status: "ok" | "unavailable" | "not_configured";
  offersCount: number;
  minPrice?: number;
  maxPrice?: number;
  medianPrice?: number;
  url?: string;
  warning?: string;
};

type PriceComparison = {
  sources: PriceComparisonSource[];
  bestOffers: PriceComparisonOffer[];
  warnings: string[];
};

type ProductView = {
  id: string;
  title: string;
  category: string;
  url: string;
  rating: number;
  ratingCount: number;
  currentPrice: number;
  medianPrice: number;
  advertisedDiscountPercent: number;
  honestDiscountPercent: number;
  isFakeDiscount: boolean;
  priceManipulationWarning?: string;
  pros: string[];
  cons: string[];
  historyPoints: PriceHistoryPoint[];
  historyLabel: string;
  priceComparison: PriceComparison;
  reviewEvidence: ReviewEvidence;
  sourceUrls: string[];
};

type OnlinerSearchPage = {
  limit?: number;
  items?: number;
  next_items?: number;
  current?: number;
  last?: number;
};

type OnlinerSearchResult = {
  products: OnlinerProduct[];
  total: number;
  page: OnlinerSearchPage;
};

type OnlinerPosition = {
  id?: string;
  shop_id?: number;
  position_price?: OnlinerMoney;
  shop?: {
    title?: string;
    name?: string;
    html_url?: string;
  };
  shop_url?: string;
  warranty?: number;
  date_update?: string;
  stock_status?: {
    text?: string;
  };
  od_status?: {
    title?: string;
  };
};

type OnlinerPositionsResponse = {
  positions?: {
    primary?: OnlinerPosition[];
    secondary?: OnlinerPosition[];
    extra?: OnlinerPosition[];
    booster?: OnlinerPosition[];
  };
};

type OnlinerShop = {
  id?: number;
  title?: string;
  name?: string;
  html_url?: string;
};

type FiveElementProduct = {
  name?: string;
  title?: string;
  price?: number | string;
  oldPrice?: number | string;
  old_price?: number | string;
  available?: boolean | string;
  link_url?: string;
  url?: string;
};

type FiveElementSearchResponse = {
  products?: FiveElementProduct[];
};

type TelegramReplyMarkup = Record<string, unknown>;

type DealPublishState = {
  productId: string;
  title: string;
  url: string;
  price: number;
  honestDiscountPercent: number;
  postedAt: string;
  status?: "posted" | "reserved";
};

type PriceWatchSubscription = {
  key: string;
  chatId: string;
  productId: string;
  title: string;
  url: string;
  basePrice: number;
  targetPrice: number;
  dropPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt?: string;
  lastPrice?: number;
  lastNotifiedAt?: string;
  disabledReason?: string;
};

type PriceWatchScanEvent = {
  key: string;
  chatId: string;
  productId: string;
  deliveryStatus: "sent" | "dry_run" | "suppressed";
  currentPrice: number;
  targetPrice: number;
  notificationPreview?: string;
};

type PriceWatchScanOptions = {
  keysOverride?: string[];
  dryRunDelivery?: boolean;
  collectEvents?: boolean;
};

type ChannelAuditEntry = {
  id: string;
  at: string;
  trigger: "manual" | "scheduler";
  dryRun: boolean;
  force: boolean;
  published: boolean;
  reason?: string;
  error?: string;
  dealsCount?: number;
  elapsedMs: number;
  selected?: {
    id: string;
    title: string;
    price: number;
    honestDiscountPercent: number;
    url: string;
    externalSources: Array<{
      source: string;
      sourceType?: string;
      confidence?: string;
      label: string;
      status: string;
      offersCount: number;
      minPrice?: number;
      maxPrice?: number;
    }>;
  };
  dedupe?: {
    enabled: boolean;
    reason?: string;
  };
  postTextPreview?: string;
};

type ScheduledTaskAuditEntry = {
  id: string;
  at: string;
  scheduledTime?: string;
  cron?: string;
  elapsedMs: number;
  channel: {
    published?: boolean;
    reason?: string;
    error?: string;
    dealsCount?: number;
    selectedId?: string;
  };
  priceWatches: {
    enabled?: boolean;
    configured?: boolean;
    checked?: number;
    active?: number;
    notified?: number;
    failed?: number;
    scannedKeys?: number;
    reason?: string;
    error?: string;
  };
};

type PublishBestDealOptions = {
  trigger: "manual" | "scheduler";
  force?: boolean;
  dryRun?: boolean;
};

type CatalogCategory = {
  schema: string;
  title: string;
  defaultQuery: string;
};

const CHANNEL_AUDIT_LOG_KEY = "deal-alert:audit-log";
const CHANNEL_AUDIT_LATEST_KEY = "deal-alert:audit-latest";
const CHANNEL_AUDIT_LIMIT = 24;
const CHANNEL_SCHEDULER_STALE_HOURS = 7;
const SCHEDULED_TASK_AUDIT_LOG_KEY = "scheduled-tasks:audit-log";
const SCHEDULED_TASK_AUDIT_LATEST_KEY = "scheduled-tasks:audit-latest";
const SCHEDULED_TASK_AUDIT_LIMIT = 24;
const PRICE_WATCH_INDEX_KEY = "price-watch:index";
const DEFAULT_PRICE_WATCH_DROP_PERCENT = 5;
const DEFAULT_PRICE_WATCH_SCAN_LIMIT = 25;
const DEFAULT_PRICE_WATCH_NOTIFY_COOLDOWN_HOURS = 24;
const DEFAULT_PUBLIC_API_RATE_LIMIT_MAX = 60;
const DEFAULT_PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS = 60;
const publicRateLimitMemory = new Map<string, { count: number; expiresAt: number }>();

const CATALOG_SDAPI_BASE = "https://catalog.onliner.by/sdapi/catalog.api";
const CATALOG_API_BASE = "https://catalog.api.onliner.by";
const SHOP_API_BASE = "https://shop.api.onliner.by";
const FIVE_ELEMENT_SEARCH_BASE = "https://sort.diginetica.net/search";

const DEFAULT_SCHEMAS = ["mobile", "notebook", "tv", "headphones", "tabletpc", "watch", "videocard", "styler"];
const DEFAULT_DEAL_SCAN_LIMIT = 50;
const DEFAULT_DEAL_ANALYZE_LIMIT = 6;
const DEFAULT_DEAL_MIN_PRICE_BYN = 15;
const DEFAULT_DEAL_MIN_OFFERS = 2;
const CATALOG_CATEGORIES: CatalogCategory[] = [
  { schema: "all", title: "Все", defaultQuery: "redmi" },
  { schema: "mobile", title: "Смартфоны", defaultQuery: "redmi" },
  { schema: "notebook", title: "Ноутбуки", defaultQuery: "lenovo" },
  { schema: "tv", title: "Телевизоры", defaultQuery: "samsung" },
  { schema: "headphones", title: "Наушники", defaultQuery: "sony" },
  { schema: "tabletpc", title: "Планшеты", defaultQuery: "ipad" },
  { schema: "watch", title: "Часы", defaultQuery: "apple watch" },
  { schema: "videocard", title: "Видеокарты", defaultQuery: "rtx" },
  { schema: "styler", title: "Техника", defaultQuery: "dyson" },
];

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function envFlag(value: string | undefined) {
  return String(value || "").toLowerCase() === "true";
}

function envNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function envNumberAtLeast(value: string | undefined, fallback: number, minimum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

function text(data: string, status = 200) {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function publicRateLimitConfig(env: Env) {
  return {
    maxRequests: envPositiveInt(env.PUBLIC_API_RATE_LIMIT_MAX, DEFAULT_PUBLIC_API_RATE_LIMIT_MAX, 500),
    windowSeconds: envPositiveInt(env.PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS, 3600),
  };
}

function publicRateLimitIdentity(request: Request) {
  const forwardedFor = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || "unknown";
  return forwardedFor.trim().replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 80) || "unknown";
}

async function checkPublicApiRateLimit(request: Request, env: Env, bucket: string) {
  const { maxRequests, windowSeconds } = publicRateLimitConfig(env);
  if (maxRequests <= 0 || windowSeconds <= 0) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const slot = Math.floor(nowSeconds / windowSeconds);
  const retryAfterSeconds = Math.max(1, (slot + 1) * windowSeconds - nowSeconds);
  const identity = publicRateLimitIdentity(request);
  const rateLimitKey = `${bucket}:${identity}`;

  if (env.PUBLIC_API_RATE_LIMITER) {
    const result = await env.PUBLIC_API_RATE_LIMITER.limit({ key: rateLimitKey });
    if (!result.success) {
      return json({
        ok: false,
        error: "rate_limited",
        retryAfterSeconds,
        limit: maxRequests,
        windowSeconds,
      }, 429, {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String((slot + 1) * windowSeconds),
      });
    }
    return null;
  }

  const key = `rate-limit:public-api:${bucket}:${slot}:${identity}`;
  if (publicRateLimitMemory.size > 1000) {
    for (const [itemKey, item] of publicRateLimitMemory) {
      if (item.expiresAt <= nowSeconds) publicRateLimitMemory.delete(itemKey);
    }
  }
  const memoryEntry = publicRateLimitMemory.get(key);
  const currentMemory = memoryEntry && memoryEntry.expiresAt > nowSeconds ? memoryEntry.count : 0;

  if (currentMemory >= maxRequests) {
    return json({
      ok: false,
      error: "rate_limited",
      retryAfterSeconds,
      limit: maxRequests,
      windowSeconds,
    }, 429, {
      "Retry-After": String(retryAfterSeconds),
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String((slot + 1) * windowSeconds),
    });
  }

  const nextMemory = currentMemory + 1;
  publicRateLimitMemory.set(key, { count: nextMemory, expiresAt: (slot + 1) * windowSeconds });

  if (env.DEAL_ALERTS_KV) {
    try {
      const currentKv = Number(await env.DEAL_ALERTS_KV.get(key)) || 0;
      if (currentKv >= maxRequests) {
        publicRateLimitMemory.set(key, { count: maxRequests, expiresAt: (slot + 1) * windowSeconds });
        return json({
          ok: false,
          error: "rate_limited",
          retryAfterSeconds,
          limit: maxRequests,
          windowSeconds,
        }, 429, {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String((slot + 1) * windowSeconds),
        });
      }
      const expirationTtl = Math.max(60, windowSeconds + 30);
      await env.DEAL_ALERTS_KV.put(key, String(Math.max(currentKv + 1, nextMemory)), { expirationTtl });
    } catch (e) {
      console.error("KV rate limiter check failed (failing open):", e);
    }
  }

  return null;
}

async function runRateLimitDoctor(request: Request, env: Env) {
  const url = new URL(request.url);
  const attempts = Math.max(1, Math.min(200, Number(url.searchParams.get("attempts") || 70) || 70));
  const key = `doctor:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const config = publicRateLimitConfig(env);
  let firstLimitedAt: number | null = null;
  let successCount = 0;

  if (env.PUBLIC_API_RATE_LIMITER) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await env.PUBLIC_API_RATE_LIMITER.limit({ key });
      if (!result.success) {
        firstLimitedAt = attempt;
        break;
      }
      successCount += 1;
    }
  }

  return {
    ok: Boolean(env.PUBLIC_API_RATE_LIMITER),
    bindingConfigured: Boolean(env.PUBLIC_API_RATE_LIMITER),
    fallbackKvConfigured: Boolean(env.DEAL_ALERTS_KV),
    config,
    attempts,
    successCount,
    firstLimitedAt,
    note: env.PUBLIC_API_RATE_LIMITER
      ? "Cloudflare Rate Limiting API is permissive/eventually consistent across requests; this doctor verifies the binding without hitting Onliner."
      : "PUBLIC_API_RATE_LIMITER binding is not configured; Worker will use local fallback only.",
  };
}

function html(data: string, status = 200) {
  return new Response(data, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function median(values: number[]) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100;
}

function pluralRu(count: number, forms: [string, string, string]) {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function formatMoneyValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "нет данных";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatHistoryDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function historyTime(value: string) {
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratingFromOnliner(value: unknown) {
  const raw = toNumber(value);
  return raw > 5 ? round1(raw / 10) : round1(raw);
}

function getTimeoutMs(env: Env) {
  const value = Number(env.ONLINER_FETCH_TIMEOUT_MS || 8000);
  return Number.isFinite(value) && value > 0 ? value : 8000;
}

function getReviewPagesMax(env: Env) {
  const value = Number(env.ONLINER_REVIEW_PAGES_MAX || 3);
  if (!Number.isFinite(value) || value <= 0) return 3;
  return Math.max(1, Math.min(6, Math.floor(value)));
}

function envPositiveInt(value: string | undefined, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

function csvEnv(value: string | undefined) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function telegramApiUrl(env: Env, method: string) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
}

async function fetchJson<T>(url: string, env: Env, retries = 2): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getTimeoutMs(env));

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "OnlinerBuyerAdvocateBot/worker (+cloudflare)",
        },
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data as T;
      lastError = new Error(`HTTP ${response.status} from ${url}: ${JSON.stringify(data).slice(0, 300)}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError || `fetch failed: ${url}`));
}

function extractOnlinerProductKey(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("onliner.by")) return null;
    const blocked = new Set(["reviews", "prices", "used", "create"]);
    const key = url.pathname.split("/").filter(Boolean).reverse().find((part) => !blocked.has(part));
    return key || null;
  } catch {
    return /^[a-z0-9][a-z0-9_-]{3,}$/i.test(trimmed) && !trimmed.includes(" ") ? trimmed.toLowerCase() : null;
  }
}

function searchRelevanceTokens(value: string) {
  const stop = new Set(["https", "http", "www", "catalog", "onliner", "by", "product", "products", "search", "query"]);
  return comparableProductText(value)
    .replace(/\//g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !stop.has(token));
}

function isRelevantSearchResult(query: string, product: OnlinerProduct) {
  const compactQuery = comparableProductText(query).replace(/\s+/g, "");
  const key = comparableProductText(product.key).replace(/\s+/g, "");
  if (key && (compactQuery.includes(key) || key.includes(compactQuery))) return true;

  const queryTokens = searchRelevanceTokens(query);
  if (!queryTokens.length) return false;
  const productText = [
    product.full_name,
    product.extended_name,
    product.name,
    product.name_prefix,
    product.key,
  ].filter(Boolean).join(" ");
  const productTokens = new Set(searchRelevanceTokens(productText));
  let overlap = 0;
  for (const token of queryTokens) {
    if (productTokens.has(token)) overlap += 1;
  }
  return overlap >= Math.min(2, queryTokens.length);
}

function getSearchSchemas(env: Env, schemasOverride?: string[]) {
  if (schemasOverride?.length) return schemasOverride;
  return env.ONLINER_SEARCH_SCHEMAS?.split(",").map((item) => item.trim()).filter(Boolean) || DEFAULT_SCHEMAS;
}

async function searchOnlinerProducts(query: string, env: Env, schemasOverride?: string[], limit = 30, page = 1): Promise<OnlinerSearchResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return { products: [], total: 0, page: { limit, items: 0, next_items: 0, current: page, last: 1 } };

  const schemas = schemasOverride
    ? getSearchSchemas(env, schemasOverride).filter((schema) => schema && schema !== "all")
    : [];
  const url = new URL(`${CATALOG_SDAPI_BASE}/search/products`);
  url.searchParams.set("query", cleanQuery);
  url.searchParams.set("limit", String(Math.max(1, Math.min(50, limit))));
  url.searchParams.set("page", String(Math.max(1, page)));
  schemas.forEach((schema, index) => {
    url.searchParams.append(`schemas[${index}]`, schema);
  });
  const data = await fetchJson<{ products?: OnlinerProduct[]; total?: number; page?: OnlinerSearchPage }>(url.toString(), env);

  const seen = new Set<string>();
  const products: OnlinerProduct[] = [];
  for (const product of data.products || []) {
    if (!product.key || seen.has(product.key)) continue;
    seen.add(product.key);
    products.push(product);
  }
  return {
    products,
    total: data.total || products.length,
    page: data.page || {
      limit,
      items: products.length,
      next_items: 0,
      current: page,
      last: page,
    },
  };
}

async function searchOnlinerSuperPrices(
  env: Env,
  options: { minDiscountPercent: number; limit?: number; page?: number; categoryGroup?: string },
): Promise<OnlinerSearchResult> {
  const limit = Math.max(1, Math.min(50, options.limit || DEFAULT_DEAL_SCAN_LIMIT));
  const page = Math.max(1, options.page || 1);
  const url = new URL(`${CATALOG_API_BASE}/super-prices`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));
  url.searchParams.set("order", "discount:desc");
  url.searchParams.set("discount[from]", String(Math.max(1, Math.floor(options.minDiscountPercent))));
  if (options.categoryGroup) url.searchParams.set("category_group", options.categoryGroup);

  const data = await fetchJson<{
    products?: OnlinerProduct[];
    total?: number;
    total_ungrouped?: number;
    page?: OnlinerSearchPage;
  }>(url.toString(), env);
  return {
    products: data.products || [],
    total: data.total || data.total_ungrouped || data.products?.length || 0,
    page: data.page || { limit, items: data.products?.length || 0, current: page, last: page },
  };
}

function catalogPreview(product: OnlinerProduct) {
  const price = toNumber(product.prices?.price_min?.amount);
  return {
    key: product.key,
    title: product.full_name || product.extended_name || product.name || product.key,
    category: product.name_prefix || "Каталог Onliner.by",
    price,
    currency: product.prices?.price_min?.currency || "BYN",
    rating: ratingFromOnliner(product.reviews?.rating),
    ratingCount: product.reviews?.count || 0,
    offersCount: product.prices?.offers?.count || 0,
    imageUrl: product.images?.header || "",
    url: product.html_url || `https://catalog.onliner.by/${product.key}`,
    description: uniq(product.description_list || product.micro_description_list || [], 2).join(". "),
  };
}

function getCatalogCategory(schema: string | null) {
  return CATALOG_CATEGORIES.find((category) => category.schema === schema) || CATALOG_CATEGORIES[0];
}

async function catalogSearch(request: Request, env: Env) {
  const url = new URL(request.url);
  const category = getCatalogCategory(url.searchParams.get("schema"));
  const rawQuery = url.searchParams.get("q") || url.searchParams.get("query") || "";
  const query = rawQuery.trim() || category.defaultQuery;
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 30) || 30));
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const search = await searchOnlinerProducts(query, env, [category.schema], limit, page);

  return {
    ok: true,
    query,
    schema: category.schema,
    category,
    total: search.total,
    page: search.page,
    hasMore: Boolean((search.page.next_items || 0) > 0 && (search.page.current || page) < (search.page.last || page)),
    products: search.products.slice(0, limit).map(catalogPreview),
  };
}

async function getOnlinerProductByKey(key: string, env: Env) {
  try {
    return await fetchJson<OnlinerProduct>(`${CATALOG_API_BASE}/products/${encodeURIComponent(key)}`, env);
  } catch {
    return fetchJson<OnlinerProduct>(`${CATALOG_SDAPI_BASE}/products/${encodeURIComponent(key)}`, env);
  }
}

async function getOnlinerPositions(key: string, env: Env) {
  try {
    return await fetchJson<OnlinerPositionsResponse>(`${SHOP_API_BASE}/products/${encodeURIComponent(key)}/positions`, env);
  } catch {
    return null;
  }
}

async function getOnlinerShop(shopId: number, env: Env) {
  try {
    return await fetchJson<OnlinerShop>(`${SHOP_API_BASE}/shops/${encodeURIComponent(String(shopId))}`, env, 1);
  } catch {
    return null;
  }
}

function positionSellerName(position: OnlinerPosition) {
  return position.shop?.title
    || position.shop?.name
    || (position.shop_id ? `продавец #${position.shop_id}` : "продавец Onliner");
}

function positionUrl(position: OnlinerPosition, productUrl: string) {
  return position.shop?.html_url || position.shop_url || `${productUrl.replace(/\/$/, "")}/prices`;
}

function normalizeOnlinerPositions(
  key: string,
  productUrl: string,
  positions: OnlinerPositionsResponse | null,
): PriceComparison {
  const rawPositions = [
    ...(positions?.positions?.primary || []),
    ...(positions?.positions?.booster || []),
    ...(positions?.positions?.secondary || []),
    ...(positions?.positions?.extra || []),
  ];
  const seen = new Set<string>();
  const offers: PriceComparisonOffer[] = rawPositions
    .map<PriceComparisonOffer | null>((position) => {
      const price = toNumber(position.position_price?.amount);
      if (price <= 0) return null;
      const id = String(position.id || `${position.shop_id || "shop"}:${price}`);
      if (seen.has(id)) return null;
      seen.add(id);
      const notes = [
        position.warranty ? `гарантия ${position.warranty} мес.` : undefined,
        position.stock_status?.text,
        position.od_status?.title,
      ].filter((note): note is string => Boolean(note));
      return {
        source: "onliner_marketplace" as const,
        sellerName: positionSellerName(position),
        price,
        currency: position.position_price?.currency || "BYN",
        url: positionUrl(position, productUrl),
        warrantyMonths: position.warranty,
        updatedAt: position.date_update,
        notes,
      };
    })
    .filter((offer): offer is PriceComparisonOffer => Boolean(offer))
    .sort((a, b) => a.price - b.price || a.sellerName.localeCompare(b.sellerName));

  const prices = offers.map((offer) => offer.price);
  const catalogUrl = `${productUrl.replace(/\/$/, "")}/prices`;
  const sources: PriceComparisonSource[] = [
    offers.length
      ? {
          source: "onliner_marketplace",
          sourceType: "marketplace",
          confidence: "high",
          label: "Onliner Marketplace",
          status: "ok",
          offersCount: offers.length,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          medianPrice: median(prices),
          url: catalogUrl,
        }
      : {
          source: "onliner_marketplace",
          sourceType: "marketplace",
          confidence: "high",
          label: "Onliner Marketplace",
          status: "unavailable",
          offersCount: 0,
          url: catalogUrl,
          warning: `Onliner не вернул предложения продавцов для ${key}.`,
        },
    {
      source: "external_sites",
      sourceType: "placeholder",
      confidence: "none",
      label: "Внешние сайты РБ",
      status: "not_configured",
      offersCount: 0,
      warning: "Подключаются отдельными источниками: официальный фид/API или устойчивый разрешенный парсер на каждый сайт.",
    },
  ];

  return {
    sources,
    bestOffers: offers.slice(0, 5),
    warnings: sources.map((source) => source.warning).filter((warning): warning is string => Boolean(warning)),
  };
}

function fiveElementSource(status: PriceComparisonSource["status"], offers: PriceComparisonOffer[] = [], warning?: string): PriceComparisonSource {
  const prices = offers.map((offer) => offer.price).filter((price) => price > 0);
  return {
    source: "external_5element",
    sourceType: "external_pilot",
    confidence: "pilot",
    label: "5 элемент (pilot)",
    status,
    offersCount: offers.length,
    minPrice: prices.length ? Math.min(...prices) : undefined,
    maxPrice: prices.length ? Math.max(...prices) : undefined,
    medianPrice: prices.length ? median(prices) : undefined,
    url: "https://5element.by",
    warning,
  };
}

function comparableProductText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\+/g, " plus ")
    .replace(/[^a-zа-я0-9/\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function comparableProductTokens(value: string) {
  return comparableProductText(value)
    .replace(/\//g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

interface MemorySignature {
  ram: number | null;
  storage: number | null;
}

function parseMemory(title: string): MemorySignature {
  const text = comparableProductText(title);
  
  // Try to match RAM/Storage pattern: e.g., "8/256" or "8gb/256gb"
  const slashMatch = text.match(/(\d{1,3})\s*(?:gb|гб)?\s*\/\s*(\d{2,4})\s*(?:gb|гб|tb|тб)?/i);
  if (slashMatch) {
    let ram = Number(slashMatch[1]);
    let storage = Number(slashMatch[2]);
    const isTB = /tb|тб/i.test(slashMatch[0]) || (storage < 10 && /tb|тб/i.test(text));
    if (isTB) {
      if (storage < 10) storage = storage * 1024;
    }
    return { ram, storage };
  }

  let ram: number | null = null;
  let storage: number | null = null;

  const matches = [...text.matchAll(/\b(\d+)\s*(gb|tb|гб|тб)\b/ig)];
  for (const m of matches) {
    let val = Number(m[1]);
    const unit = m[2].toLowerCase();
    const isTB = unit.includes("t") || unit.includes("т");
    if (isTB) {
      val = val * 1024;
    }
    if (storage === null) {
      storage = val;
    } else {
      if (val > storage) {
        ram = storage;
        storage = val;
      } else {
        ram = val;
      }
    }
  }

  return { ram, storage };
}

const PRODUCT_COLOR_ALIASES = [
  { key: "black", pattern: /(?:^|\s)(?:black|черн|ч[её]рн)/i },
  { key: "white", pattern: /(?:^|\s)(?:white|бел)/i },
  { key: "blue", pattern: /(?:^|\s)(?:blue|glacier|син|голуб)/i },
  { key: "purple", pattern: /(?:^|\s)(?:purple|violet|фиолет)/i },
  { key: "green", pattern: /(?:^|\s)(?:green|зелен|зел[её]н)/i },
  { key: "red", pattern: /(?:^|\s)(?:red|красн)/i },
  { key: "brown", pattern: /(?:^|\s)(?:brown|mocha|коричнев)/i },
  { key: "titanium", pattern: /(?:^|\s)(?:titanium|titan|титан)/i },
  { key: "silver", pattern: /(?:^|\s)(?:silver|серебр)/i },
  { key: "gray", pattern: /(?:^|\s)(?:gray|grey|graphite|графит|серый|серая|серое|серые|серого|сером)/i },
  { key: "gold", pattern: /(?:^|\s)(?:gold|золот)/i },
];

function colorSignature(value: string) {
  const text = comparableProductText(value);
  return PRODUCT_COLOR_ALIASES.find((color) => color.pattern.test(text))?.key || "";
}

function isLikelySameProduct(baseTitle: string, candidateTitle: string) {
  const left = new Set(comparableProductTokens(baseTitle));
  const right = new Set(comparableProductTokens(candidateTitle));
  if (!left.size || !right.size) return false;

  const distinctive = ["pro", "plus", "ultra", "max", "lite", "5g", "4g"];
  for (const token of distinctive) {
    if (left.has(token) !== right.has(token)) return false;
  }

  const leftMem = parseMemory(baseTitle);
  const rightMem = parseMemory(candidateTitle);
  if (leftMem.storage !== null && rightMem.storage !== null && leftMem.storage !== rightMem.storage) return false;
  if (leftMem.ram !== null && rightMem.ram !== null && leftMem.ram !== rightMem.ram) return false;

  const leftColor = colorSignature(baseTitle);
  const rightColor = colorSignature(candidateTitle);
  if (leftColor && rightColor && leftColor !== rightColor) return false;

  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / Math.max(left.size, right.size) >= 0.58;
}

function isFiveElementAvailable(value: FiveElementProduct) {
  if (typeof value.available === "boolean") return value.available;
  if (typeof value.available === "string") return !/^(false|0|нет|no)$/i.test(value.available.trim());
  return true;
}

async function findFiveElementOffers(product: OnlinerProduct, env: Env): Promise<PriceComparisonOffer[]> {
  const apiKey = env.FIVE_ELEMENT_SEARCH_API_KEY?.trim();
  if (!envFlag(env.ENABLE_5ELEMENT_PILOT) || !apiKey) return [];

  const title = product.full_name || product.extended_name || product.name || product.key;
  const url = new URL(FIVE_ELEMENT_SEARCH_BASE);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("st", title);
  url.searchParams.set("strategy", "vectors_extended,zero_queries");
  url.searchParams.set("fullData", "true");
  url.searchParams.set("withCorrection", "true");
  url.searchParams.set("withFacets", "false");
  url.searchParams.set("treeFacets", "true");
  url.searchParams.set("offset", "0");
  url.searchParams.set("size", "8");

  const data = await fetchJson<FiveElementSearchResponse>(url.toString(), env, 0);
  const seen = new Set<string>();
  return (data.products || [])
    .map<PriceComparisonOffer | null>((candidate) => {
      const candidateTitle = candidate.name || candidate.title || "";
      const price = toNumber(candidate.price);
      const rawCandidateUrl = candidate.link_url || candidate.url;
      const candidateUrl = rawCandidateUrl
        ? (rawCandidateUrl.startsWith("http") ? rawCandidateUrl : `https://5element.by${rawCandidateUrl.startsWith("/") ? rawCandidateUrl : `/${rawCandidateUrl}`}`)
        : "";
      if (!candidateTitle || price <= 0 || !candidateUrl || !isFiveElementAvailable(candidate)) return null;
      if (!isLikelySameProduct(title, candidateTitle)) return null;
      const key = `${candidateUrl}:${price}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const oldPrice = toNumber(candidate.oldPrice || candidate.old_price);
      const notes = [
        "внешний pilot",
        oldPrice > price ? `было ${formatMoneyValue(oldPrice)} BYN` : undefined,
      ].filter((note): note is string => Boolean(note));
      return {
        source: "external_5element" as const,
        sellerName: "5 элемент",
        price,
        currency: "BYN",
        url: candidateUrl,
        notes,
      };
    })
    .filter((offer): offer is PriceComparisonOffer => Boolean(offer))
    .sort((a, b) => a.price - b.price || a.sellerName.localeCompare(b.sellerName))
    .slice(0, 3);
}

async function addFiveElementPilotSource(comparison: PriceComparison, product: OnlinerProduct, env: Env): Promise<PriceComparison> {
  if (!envFlag(env.ENABLE_5ELEMENT_PILOT)) return comparison;

  const sources = comparison.sources.filter((source) => source.source !== "external_sites" && source.source !== "external_5element");
  if (!env.FIVE_ELEMENT_SEARCH_API_KEY?.trim()) {
    const nextSources = [
      ...sources,
      fiveElementSource("not_configured", [], "5element pilot включен, но FIVE_ELEMENT_SEARCH_API_KEY не задан."),
    ];
    return {
      ...comparison,
      sources: nextSources,
      warnings: nextSources.map((source) => source.warning).filter((warning): warning is string => Boolean(warning)),
    };
  }

  try {
    const externalOffers = await findFiveElementOffers(product, env);
    const status: PriceComparisonSource["status"] = externalOffers.length ? "ok" : "unavailable";
    const warning = externalOffers.length
      ? "5element подключен как price-only pilot через поисковый JSON; совпадение товара проверяется эвристикой, не складским API."
      : "5element pilot не вернул проверяемую цену для этой карточки.";
    const nextSources = [...sources, fiveElementSource(status, externalOffers, warning)];
    const bestOffers = [...comparison.bestOffers, ...externalOffers]
      .sort((a, b) => a.price - b.price || a.sellerName.localeCompare(b.sellerName))
      .slice(0, 5);
    return {
      ...comparison,
      sources: nextSources,
      bestOffers,
      warnings: nextSources.map((source) => source.warning).filter((item): item is string => Boolean(item)),
    };
  } catch {
    const nextSources = [
      ...sources,
      fiveElementSource("unavailable", [], "5element pilot не ответил в пределах таймаута; источник не заявлен как проверенный."),
    ];
    return {
      ...comparison,
      sources: nextSources,
      warnings: nextSources.map((source) => source.warning).filter((item): item is string => Boolean(item)),
    };
  }
}

async function enrichPriceComparison(comparison: PriceComparison, env: Env, skipShopEnrichment?: boolean) {
  if (skipShopEnrichment) return comparison;
  const shopIdPattern = /^продавец #(\d+)$/;
  const offers = await Promise.all(comparison.bestOffers.map(async (offer) => {
    const match = shopIdPattern.exec(offer.sellerName);
    if (!match) return offer;
    const shop = await getOnlinerShop(Number(match[1]), env);
    const title = shop?.title || shop?.name;
    if (!title) return offer;
    return {
      ...offer,
      sellerName: title,
      url: shop.html_url || offer.url,
    };
  }));

  return {
    ...comparison,
    bestOffers: offers,
  };
}

async function getOnlinerPriceHistory(key: string, env: Env) {
  for (const period of ["12m", "2m"] as const) {
    const path = `/products/${encodeURIComponent(key)}/prices-history?period=${period}`;
    const primaryEndpoint = `${CATALOG_API_BASE}${path}`;
    let data;
    let endpoint = primaryEndpoint;
    try {
      data = await fetchJson<{
        prices?: { current?: OnlinerMoney };
        sale?: { discount?: number; min_prices_median?: OnlinerMoney };
        chart_data?: { currency?: string; items?: Array<{ date?: string; price?: string | null }> };
      }>(primaryEndpoint, env);
    } catch {
      const fallbackEndpoint = `${CATALOG_SDAPI_BASE}${path}`;
      try {
        data = await fetchJson<{
          prices?: { current?: OnlinerMoney };
          sale?: { discount?: number; min_prices_median?: OnlinerMoney };
          chart_data?: { currency?: string; items?: Array<{ date?: string; price?: string | null }> };
        }>(fallbackEndpoint, env);
        endpoint = fallbackEndpoint;
      } catch {
        continue;
      }
    }

    const currency = data.chart_data?.currency || data.prices?.current?.currency || "BYN";
    const points = (data.chart_data?.items || [])
      .map((item) => ({ date: item.date || "", price: toNumber(item.price || ""), currency }))
      .filter((point) => point.date && point.price > 0)
      .sort((a, b) => historyTime(a.date) - historyTime(b.date));
    const minPoints = period === "12m" ? 4 : 2;
    if (points.length >= minPoints) {
      return { data, endpoint, period, points, medianPrice: median(points.map((point) => point.price)) };
    }
  }
  return null;
}

function reviewPageUrl(baseUrl: string, page: number) {
  const url = new URL(baseUrl);
  if (page > 1) url.searchParams.set("page", String(page));
  return url.toString();
}

function normalizeReviewText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[“”«»]/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

const NO_EXPLICIT_REVIEW_CLAIM_PATTERN =
  /^(?:нет|нету|никаких|ничего|ни\s+чего|ничего (?:существенного|критичного|страшного)|ничего не (?:напрягает|беспокоит|мешает)|(?:их|его|е[её]) нет|нет такого|нету такого|такого нет|пока (?:нет|никаких)|пока вообще ничего не (?:напрягает|беспокоит|мешает)|пока без (?:минусов|нареканий|замечаний|претензий|проблем|недостатков)|пока не прояв(?:ились|ился|илась|илось)|как будто нет|вс[её] устраивает|вс[её] (?:отлично|хорошо|нормально)|выше|ниже|см\.?\s*(?:выше|ниже)|смотрите\s*(?:выше|ниже)|описал[аи]?\s*(?:выше|ниже)|не выяв(?:ил[аи]?|лено|лены)?|не обнаруж(?:ил[аи]?|ено)|не найден(?:о|а|ы)?|не прояв(?:ились|ился|илась|илось)|не замет(?:ил[аи]?)|не увид(?:ел[аи]?|ено)|не вижу|не сталкивал(?:ся|ась)|не встретил[аи]?|не наш[её]л|не нашла|отсутству(?:ет|ют)|без (?:минусов|нареканий|замечаний|претензий|проблем|недостатков)|нареканий нет|минусов нет|недостатков нет|существенных (?:(?:минусов|недостатков|проблем) )?нет|критичных (?:(?:минусов|недостатков|проблем) )?нет)$/i;

const GENERIC_REVIEW_CLAIM_PATTERN =
  /^(?:телефон|смартфон|товар|модель|аппарат|устройство|понравил(?:ся|ась|ось)?|понравилось|нравится|хороший|отличный|нормальный)$/i;

function isNoExplicitReviewClaim(item: string) {
  return NO_EXPLICIT_REVIEW_CLAIM_PATTERN.test(item) || GENERIC_REVIEW_CLAIM_PATTERN.test(item);
}

function splitReviewClaims(value?: string) {
  const text = (value || "")
    .replace(/\r/g, "\n")
    .replace(/(\d)\/(?=\d)/g, "$1 ");
  return text
    .split(/\n|[;•/]+|\s+-\s+/g)
    .map((item) => normalizeReviewText(item.replace(/^[\s\-*•,.;:!?]+/, "").replace(/[\s,.;:!?]+$/, "")))
    .filter((item) => item.length >= 3 && !isNoExplicitReviewClaim(item))
    .slice(0, 40);
}

const REVIEW_STOP_WORDS = new Set([
  "это", "как", "для", "что", "или", "при", "под", "над", "без", "нет", "очень", "тоже", "еще", "ещё",
  "уже", "все", "всё", "так", "его", "она", "они", "был", "была", "были", "есть", "после", "пока",
  "the", "and", "with", "from", "this", "that",
]);

const REVIEW_FAMILIES = [
  { key: "charging", pattern: /заряд|блок пит|адаптер|кабел|питани/i },
  { key: "heating", pattern: /гре|нагрев|горяч|температур|перегрев/i },
  { key: "battery", pattern: /аккум|батаре|автоном|держит/i },
  { key: "price", pattern: /цен|дорог|стоим|переплат/i },
  { key: "noise", pattern: /шум|громк|писк|скрип/i },
  { key: "screen", pattern: /экран|диспле|матриц|яркост|герцов/i },
  { key: "camera", pattern: /камер|фото|видео|сним/i },
  { key: "software", pattern: /прошив|реклам|обнов|софт|прилож/i },
  { key: "build", pattern: /корпус|пластик|сборк|люфт|кнопк|царап/i },
  { key: "accessories", pattern: /насад|станци|щетк|фильтр|чехол/i },
];

function claimFamily(label: string) {
  return REVIEW_FAMILIES.find((family) => family.pattern.test(label))?.key || "";
}

function claimTokens(label: string) {
  return label
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !REVIEW_STOP_WORDS.has(token));
}

function tokenSimilarity(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const left = new Set(a);
  const right = new Set(b);
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / Math.max(left.size, right.size);
}

function pickClusterLabel(labels: string[]) {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]?.[0] || labels[0] || "";
}

function clusterReviewClaims(claims: string[], limit: number): ReviewInsight[] {
  const clusters: Array<{
    family: string;
    labels: string[];
    tokens: string[];
  }> = [];

  for (const rawClaim of claims) {
    const label = normalizeReviewText(rawClaim);
    if (!label) continue;
    const tokens = claimTokens(label);
    const family = claimFamily(label);
    let target = clusters.find((cluster) => (
      family && cluster.family === family
    ) || tokenSimilarity(tokens, cluster.tokens) >= 0.45);

    if (!target) {
      target = { family, labels: [], tokens };
      clusters.push(target);
    }

    target.labels.push(label);
    target.tokens = claimTokens(pickClusterLabel(target.labels));
  }

  return clusters
    .map((cluster) => {
      const label = pickClusterLabel(cluster.labels);
      return {
        label,
        count: cluster.labels.length,
        examples: uniq(cluster.labels, 3),
      };
    })
    .filter((item) => item.label)
    .sort((a, b) => b.count - a.count || a.label.length - b.label.length)
    .slice(0, limit);
}

function reviewInsightText(item: ReviewInsight) {
  return item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label;
}

function looksNegativeReviewClaim(label: string) {
  return /цена\s+конь|дорог|завыш|высокая цена|слаб|мало держ|не хватает|отсутств|не оправд|недолг|низкая автоном/i.test(label);
}

function buildReviewEvidence(params: {
  product: OnlinerProduct;
  reviewsUrl: string;
  reviews: OnlinerReview[];
  totalCount: number;
  pagesProcessed: number;
  pagesAvailable: number;
  maxPages: number;
  failedPages: number[];
}): ReviewEvidence {
  const ratings = params.reviews
    .map((review) => ratingFromOnliner(review.rating))
    .filter((rating) => rating > 0);
  const dates = params.reviews
    .map((review) => review.created_at || "")
    .filter(Boolean)
    .sort()
    .reverse();
  const topPros = clusterReviewClaims(
    params.reviews
      .flatMap((review) => splitReviewClaims(review.pros || review.summary))
      .filter((claim) => !looksNegativeReviewClaim(claim)),
    4,
  );
  const topCons = clusterReviewClaims(params.reviews.flatMap((review) => splitReviewClaims(review.cons)), 4);
  const warnings = [
    params.totalCount > params.reviews.length
      ? `Обработана первая выборка отзывов: ${params.reviews.length} из ${params.totalCount}.`
      : undefined,
    params.failedPages.length
      ? `Не удалось загрузить страницы отзывов: ${params.failedPages.join(", ")}.`
      : undefined,
    !params.reviews.length
      ? "Onliner не вернул публичные отзывы для этой карточки."
      : undefined,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    source: "onliner_reviews_api",
    endpoint: params.reviewsUrl,
    htmlUrl: params.product.reviews?.html_url,
    processedCount: params.reviews.length,
    totalCount: params.totalCount,
    pagesProcessed: params.pagesProcessed,
    pagesAvailable: params.pagesAvailable,
    maxPages: params.maxPages,
    averageFetchedRating: ratings.length ? round1(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) : undefined,
    latestReviewAt: dates[0],
    topPros,
    topCons,
    warnings,
  };
}

async function getOnlinerReviews(product: OnlinerProduct, env: Env) {
  const reviewsUrl = product.reviews?.url || `${CATALOG_API_BASE}/products/${encodeURIComponent(product.key)}/reviews`;
  const maxPages = getReviewPagesMax(env);
  try {
    const firstPage = await fetchJson<OnlinerReviewsPage>(reviewsUrl, env);
    const firstReviews = firstPage.reviews || [];
    const totalCount = firstPage.total || product.reviews?.count || firstReviews.length;
    const pagesAvailable = firstPage.page?.last || Math.max(1, Math.ceil(totalCount / (firstPage.page?.limit || 10)));
    const pagesToFetch = Math.min(maxPages, pagesAvailable);
    const failedPages: number[] = [];
    const extraPages = pagesToFetch > 1
      ? await Promise.allSettled(
          Array.from({ length: pagesToFetch - 1 }, (_, index) => index + 2)
            .map((page) => fetchJson<OnlinerReviewsPage>(reviewPageUrl(reviewsUrl, page), env).then((data) => ({ page, data }))),
        )
      : [];

    const reviews = [...firstReviews];
    for (const result of extraPages) {
      if (result.status === "fulfilled") {
        reviews.push(...(result.value.data.reviews || []));
      } else {
        const page = extraPages.indexOf(result) + 2;
        failedPages.push(page);
      }
    }

    const seen = new Set<string>();
    const deduped = reviews.filter((review) => {
      const key = String(review.id || [review.summary, review.pros, review.cons, review.text].filter(Boolean).join("|")).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      reviews: deduped,
      evidence: buildReviewEvidence({
        product,
        reviewsUrl,
        reviews: deduped,
        totalCount,
        pagesProcessed: pagesToFetch - failedPages.length,
        pagesAvailable,
        maxPages,
        failedPages,
      }),
    };
  } catch {
    return {
      reviews: [],
      evidence: buildReviewEvidence({
        product,
        reviewsUrl,
        reviews: [],
        totalCount: product.reviews?.count || 0,
        pagesProcessed: 0,
        pagesAvailable: 0,
        maxPages,
        failedPages: [1],
      }),
    };
  }
}

function uniq(values: Array<string | undefined>, limit: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const clean = (value || "").replace(/\s+/g, " ").trim();
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}

function discountManipulationWarning(advertisedDiscount: number, honestDiscountPercent: number) {
  if (advertisedDiscount < 10) return undefined;

  const honestDiscount = Math.max(0, honestDiscountPercent);
  const unsupportedByStableHistory = honestDiscount < Math.max(3, advertisedDiscount / 3);
  if (unsupportedByStableHistory) {
    return `Заявленная скидка ${formatMoneyValue(advertisedDiscount)}% не подтверждается устойчивой историей Onliner: по базовой медиане выходит ${formatMoneyValue(honestDiscount)}%. Возможен короткий завышенный пик цены.`;
  }

  const overstatedByStableHistory = (
    advertisedDiscount >= 30
    && honestDiscount >= 10
    && advertisedDiscount - honestDiscount >= 20
    && advertisedDiscount / Math.max(honestDiscount, 1) >= 1.5
  );
  if (overstatedByStableHistory) {
    return `Заявленная скидка ${formatMoneyValue(advertisedDiscount)}% сильно завышена относительно устойчивой истории Onliner: по базовой медиане выходит ${formatMoneyValue(honestDiscount)}%. Часть скидки может быть нарисована от временного высокого плато или пика цены.`;
  }

  return undefined;
}

async function productFromOnliner(
  product: OnlinerProduct,
  env: Env,
  options: { includeExternalPricePilot?: boolean; skipShopEnrichment?: boolean } = {},
): Promise<ProductView> {
  const productUrl = product.html_url || `https://catalog.onliner.by/${product.key}`;
  const [history, reviewResult, positions] = await Promise.all([
    getOnlinerPriceHistory(product.key, env),
    getOnlinerReviews(product, env),
    getOnlinerPositions(product.key, env),
  ]);
  const { reviews, evidence: reviewEvidence } = reviewResult;
  const currentPrice = toNumber(history?.data.prices?.current?.amount) || toNumber(product.prices?.price_min?.amount);
  const medianPrice = history?.medianPrice || toNumber(product.sale?.min_prices_median?.amount) || currentPrice;
  const advertisedDiscount = toNumber(history?.data.sale?.discount) || toNumber(product.sale?.discount);
  const honestDiscountPercent = medianPrice > 0 ? round1(((medianPrice - currentPrice) / medianPrice) * 100) : 0;
  const priceManipulationWarning = discountManipulationWarning(advertisedDiscount, honestDiscountPercent);
  const isFakeDiscount = Boolean(priceManipulationWarning);
  const pros = reviewEvidence.topPros.map(reviewInsightText).slice(0, 3);
  const cons = reviewEvidence.topCons.map(reviewInsightText).slice(0, 3);
  const onlinerComparison = await enrichPriceComparison(normalizeOnlinerPositions(product.key, productUrl, positions), env, options.skipShopEnrichment);
  const priceComparison = options.includeExternalPricePilot === false
    ? onlinerComparison
    : await addFiveElementPilotSource(onlinerComparison, product, env);

  return {
    id: product.key,
    title: product.full_name || product.extended_name || product.name || product.key,
    category: product.name_prefix || "Каталог Onliner.by",
    url: productUrl,
    rating: ratingFromOnliner(product.reviews?.rating),
    ratingCount: product.reviews?.count || reviews.length,
    currentPrice,
    medianPrice,
    advertisedDiscountPercent: advertisedDiscount,
    honestDiscountPercent,
    isFakeDiscount,
    priceManipulationWarning,
    pros: pros.length ? pros : uniq(product.description_list || product.micro_description_list || [], 3),
    cons: cons.length ? cons : ["В публичных отзывах мало подтвержденных минусов; перед покупкой проверь отзывы вручную."],
    historyPoints: history?.points || [],
    historyLabel: history
      ? `история Onliner: ${history.points.length} ${pluralRu(history.points.length, ["замер", "замера", "замеров"])} цены`
      : "Onliner не вернул график истории цен",
    priceComparison,
    reviewEvidence,
    sourceUrls: [
      product.html_url,
      product.prices?.html_url,
      product.reviews?.html_url,
      reviewEvidence.endpoint,
      history?.endpoint,
      ...priceComparison.bestOffers.map((offer) => offer.url),
    ].filter(Boolean) as string[],
  };
}

async function resolveOnlinerProduct(input: string, env: Env) {
  const key = extractOnlinerProductKey(input);
  if (key) {
    try {
      return productFromOnliner(await getOnlinerProductByKey(key, env), env);
    } catch {
      // Fall through to search.
    }
  }

  const results = (await searchOnlinerProducts(input, env)).products.filter((product) => isRelevantSearchResult(input, product));
  const selected = results.find((item) => toNumber(item.prices?.price_min?.amount) > 0) || results[0];
  return selected ? productFromOnliner(await getOnlinerProductByKey(selected.key, env), env) : null;
}

async function findOnlinerProductChoices(input: string, env: Env, limit = 5) {
  if (extractOnlinerProductKey(input)) return [];
  const products = (await searchOnlinerProducts(input, env, undefined, Math.max(limit, 10))).products
    .filter((product) => isRelevantSearchResult(input, product));
  const seen = new Set<string>();
  return products
    .filter((product) => {
      if (!product.key || seen.has(product.key)) return false;
      seen.add(product.key);
      return true;
    })
    .slice(0, limit);
}

function productCurrentPrice(product: OnlinerProduct) {
  return toNumber(product.prices?.price_min?.amount);
}

function productOffersCount(product: OnlinerProduct) {
  return Number(product.prices?.offers?.count || 0);
}

function productAdvertisedDiscount(product: OnlinerProduct) {
  return toNumber(product.sale?.discount);
}

function productReviewRating(product: OnlinerProduct) {
  return ratingFromOnliner(product.reviews?.rating);
}

type DealFilterOverrides = {
  minDiscountPercent?: number;
};

function dealFilterConfig(env: Env, overrides: DealFilterOverrides = {}) {
  const overrideDiscount = overrides.minDiscountPercent;
  return {
    minDiscountPercent: Number.isFinite(overrideDiscount) && Number(overrideDiscount) > 0
      ? Number(overrideDiscount)
      : Number(env.MIN_HONEST_DISCOUNT_PERCENT || 20),
    scanLimit: envPositiveInt(env.ONLINER_DEAL_SCAN_LIMIT, DEFAULT_DEAL_SCAN_LIMIT, 50),
    scanPages: envPositiveInt(env.ONLINER_DEAL_SCAN_PAGES, 3, 3),
    analyzeLimit: envPositiveInt(env.ONLINER_DEAL_ANALYZE_LIMIT, DEFAULT_DEAL_ANALYZE_LIMIT, 8),
    minPrice: envNumber(env.ONLINER_DEAL_MIN_PRICE_BYN, DEFAULT_DEAL_MIN_PRICE_BYN),
    minOffers: envPositiveInt(env.ONLINER_DEAL_MIN_OFFERS, DEFAULT_DEAL_MIN_OFFERS, 20),
    categoryGroups: csvEnv(env.ONLINER_SUPERPRICE_CATEGORY_GROUPS),
  };
}

function dealCandidateScore(product: OnlinerProduct) {
  const discount = productAdvertisedDiscount(product);
  const price = productCurrentPrice(product);
  const offers = productOffersCount(product);
  const rating = productReviewRating(product);
  const reviews = Number(product.reviews?.count || 0);
  return (
    discount * 2
    + Math.min(offers, 20) * 0.6
    + Math.min(reviews, 20) * 2
    + (rating >= 4 ? 20 : 0)
    + (price >= DEFAULT_DEAL_MIN_PRICE_BYN ? 8 : 0)
    - (reviews === 0 ? 12 : 0)
    - (price < DEFAULT_DEAL_MIN_PRICE_BYN ? 18 : 0)
  );
}

function isSuperPriceCandidate(product: OnlinerProduct, minDiscountPercent: number, minPrice: number, minOffers: number) {
  return (
    product.key
    && productAdvertisedDiscount(product) >= minDiscountPercent
    && productCurrentPrice(product) >= minPrice
    && productOffersCount(product) >= minOffers
  );
}

async function findSuperPriceDealCandidates(env: Env, config = dealFilterConfig(env)) {
  const scopes = config.categoryGroups.length ? config.categoryGroups : [undefined];
  const requests = scopes.flatMap((categoryGroup) => (
    Array.from({ length: config.scanPages }, (_, index) => ({ categoryGroup, page: index + 1 }))
  ));
  const pages = await Promise.allSettled(requests.map(({ categoryGroup, page }) => (
    searchOnlinerSuperPrices(env, {
      minDiscountPercent: config.minDiscountPercent,
      limit: config.scanLimit,
      page,
      categoryGroup,
    })
  )));

  const seen = new Set<string>();
  return pages
    .filter((result): result is PromiseFulfilledResult<OnlinerSearchResult> => result.status === "fulfilled")
    .flatMap((result) => result.value.products)
    .filter((product) => {
      if (!product.key || seen.has(product.key)) return false;
      seen.add(product.key);
      return isSuperPriceCandidate(product, config.minDiscountPercent, config.minPrice, config.minOffers);
    })
    .sort((a, b) => dealCandidateScore(b) - dealCandidateScore(a));
}

async function findQueryDealCandidates(env: Env) {
  const query = env.ONLINER_POLL_QUERY || "redmi";
  return (await searchOnlinerProducts(query, env, undefined, 12)).products;
}

function isPublishableDeal(product: ProductView, minDiscountPercent: number, env: Env) {
  const minPrice = envNumber(env.ONLINER_DEAL_MIN_PRICE_BYN, DEFAULT_DEAL_MIN_PRICE_BYN);
  const minOffers = envPositiveInt(env.ONLINER_DEAL_MIN_OFFERS, DEFAULT_DEAL_MIN_OFFERS, 20);
  const onlinerOffers = product.priceComparison.sources.find((source) => source.source === "onliner_marketplace")?.offersCount || 0;
  const isExtremeDiscount = product.honestDiscountPercent >= 50;
  const priceOk = isExtremeDiscount || product.currentPrice >= minPrice;
  return (
    product.honestDiscountPercent >= minDiscountPercent
    && !product.isFakeDiscount
    && priceOk
    && onlinerOffers >= minOffers
  );
}

function dealViewScore(product: ProductView) {
  const onlinerOffers = product.priceComparison.sources.find((source) => source.source === "onliner_marketplace")?.offersCount || 0;
  return (
    product.honestDiscountPercent * 2
    + Math.min(onlinerOffers, 20) * 0.6
    + Math.min(product.ratingCount, 20) * 2
    + (product.rating >= 4 ? 20 : 0)
    + (product.currentPrice >= DEFAULT_DEAL_MIN_PRICE_BYN ? 8 : 0)
    - (product.ratingCount === 0 ? 12 : 0)
  );
}

async function findDeals(env: Env, overrides: DealFilterOverrides = {}) {
  const config = dealFilterConfig(env, overrides);
  const { minDiscountPercent, analyzeLimit } = config;
  let products = await findSuperPriceDealCandidates(env, config);
  if (!products.length) products = await findQueryDealCandidates(env);

  const converted = await Promise.allSettled(products.slice(0, analyzeLimit).map((product) => (
    productFromOnliner(product, env, { includeExternalPricePilot: false, skipShopEnrichment: true })
  )));
  return converted
    .filter((result): result is PromiseFulfilledResult<ProductView> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((product) => isPublishableDeal(product, minDiscountPercent, env))
    .sort((a, b) => dealViewScore(b) - dealViewScore(a));
}

function dealPublicSummary(product: ProductView) {
  const onlinerSource = product.priceComparison.sources.find((source) => source.source === "onliner_marketplace");
  return {
    id: product.id,
    title: product.title,
    url: product.url,
    currentPrice: product.currentPrice,
    medianPrice: product.medianPrice,
    advertisedDiscountPercent: product.advertisedDiscountPercent,
    honestDiscountPercent: product.honestDiscountPercent,
    isFakeDiscount: product.isFakeDiscount,
    priceManipulationWarning: product.priceManipulationWarning,
    rating: product.rating,
    ratingCount: product.ratingCount,
    onlinerOffers: onlinerSource?.offersCount || 0,
  };
}

async function runOnlinerDealsDoctor(env: Env, overrides: DealFilterOverrides = {}) {
  const startedAt = Date.now();
  const config = dealFilterConfig(env, overrides);
  const scopes = config.categoryGroups.length ? config.categoryGroups : [undefined];
  const requests = scopes.flatMap((categoryGroup) => (
    Array.from({ length: config.scanPages }, (_, index) => ({ categoryGroup, page: index + 1 }))
  ));
  const superPricePages = await Promise.allSettled(requests.map(({ categoryGroup, page }) => (
    searchOnlinerSuperPrices(env, {
      minDiscountPercent: config.minDiscountPercent,
      limit: config.scanLimit,
      page,
      categoryGroup,
    })
  )));
  const fulfilledPages = superPricePages
    .filter((result): result is PromiseFulfilledResult<OnlinerSearchResult> => result.status === "fulfilled");
  const failedPages = superPricePages
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));

  const seen = new Set<string>();
  const rawProducts = fulfilledPages.flatMap((result) => result.value.products);
  const candidates = rawProducts
    .filter((product) => {
      if (!product.key || seen.has(product.key)) return false;
      seen.add(product.key);
      return isSuperPriceCandidate(product, config.minDiscountPercent, config.minPrice, config.minOffers);
    })
    .sort((a, b) => dealCandidateScore(b) - dealCandidateScore(a));

  const converted = await Promise.allSettled(candidates.slice(0, config.analyzeLimit).map((product) => (
    productFromOnliner(product, env, { includeExternalPricePilot: false })
  )));
  const publishableDeals = converted
    .filter((result): result is PromiseFulfilledResult<ProductView> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((product) => isPublishableDeal(product, config.minDiscountPercent, env))
    .sort((a, b) => dealViewScore(b) - dealViewScore(a));
  const conversionErrors = converted
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));

  const ready = Boolean(fulfilledPages.length && rawProducts.length && candidates.length && publishableDeals.length);
  const maxAvailablePage = fulfilledPages.reduce((max, result) => Math.max(max, result.value.page.last || 1), 1);
  const hasUnscannedPages = maxAvailablePage > config.scanPages;

  return {
    ok: ready,
    readyForDiscountRadar: ready,
    source: "catalog.api.onliner.by/super-prices",
    elapsedMs: Date.now() - startedAt,
    config,
    superPrices: {
      ok: fulfilledPages.length > 0,
      checkedScopes: scopes.map((scope) => scope || "all"),
      scannedPagesPerScope: config.scanPages,
      maxAvailablePage,
      hasUnscannedPages,
      successfulScopes: fulfilledPages.length,
      failedScopes: failedPages.length,
      errors: failedPages.slice(0, 3),
      total: fulfilledPages.reduce((sum, result) => sum + (result.value.total || 0), 0),
      rawProductsCount: rawProducts.length,
      qualifiedCandidatesCount: candidates.length,
      firstCandidate: candidates[0] ? {
        key: candidates[0].key,
        title: candidates[0].full_name || candidates[0].extended_name || candidates[0].name || candidates[0].key,
        price: productCurrentPrice(candidates[0]),
        advertisedDiscount: productAdvertisedDiscount(candidates[0]),
        offers: productOffersCount(candidates[0]),
        url: candidates[0].html_url || `https://catalog.onliner.by/${candidates[0].key}`,
      } : null,
    },
    publishableDealsCount: publishableDeals.length,
    deals: publishableDeals.slice(0, 5).map(dealPublicSummary),
    conversionErrors: conversionErrors.slice(0, 3),
    recommendations: [
      ...(fulfilledPages.length ? [] : ["Onliner super-prices endpoint did not return a successful page."]),
      ...(rawProducts.length ? [] : ["Onliner super-prices returned no products for the current discount filter."]),
      ...(candidates.length ? [] : ["No super-prices products passed min price/offers/discount filters."]),
      ...(publishableDeals.length ? [] : ["No converted deal passed honest-discount/rating/source filters."]),
      ...(hasUnscannedPages ? [`Onliner has more super-prices pages than scanned (${config.scanPages}/${maxAvailablePage}); increase ONLINER_DEAL_SCAN_PAGES if coverage is too narrow.`] : []),
    ],
  };
}

async function callTelegram<T>(env: Env, method: string, body?: Record<string, unknown>) {
  const response = await fetch(telegramApiUrl(env, method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json().catch(() => ({})) as { ok?: boolean; result?: T; description?: string };
  if (!response.ok || !data.ok) throw new Error(data.description || `Telegram ${method} failed with HTTP ${response.status}`);
  return data.result as T;
}

function clampTelegramText(value: string) {
  return value.length > 3900 ? `${value.slice(0, 3890)}\n...` : value;
}

async function sendTelegramMessage(env: Env, chatId: string | number, message: string, replyMarkup?: TelegramReplyMarkup) {
  return callTelegram(env, "sendMessage", {
    chat_id: chatId,
    text: clampTelegramText(message),
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

const encoder = new TextEncoder();

async function hmacSha256(keyBytes: Uint8Array, value: string) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function verifyTelegramWebAppInitData(initData: string, botToken: string, expectedQueryId: string) {
  const params = new URLSearchParams(initData);
  const receivedHash = (params.get("hash") || "").toLowerCase();
  const queryId = params.get("query_id") || "";
  const authDate = Number(params.get("auth_date") || 0);
  const now = Math.floor(Date.now() / 1000);

  if (!receivedHash) return { ok: false, error: "Telegram initData hash is missing" };
  if (!queryId || queryId !== expectedQueryId) return { ok: false, error: "Telegram query_id mismatch" };
  if (!authDate || authDate > now + 300 || now - authDate > 86400) {
    return { ok: false, error: "Telegram initData is expired" };
  }

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  if (!dataCheckString) return { ok: false, error: "Telegram initData is empty" };

  const secretKey = await hmacSha256(encoder.encode("WebAppData"), botToken);
  const calculatedHash = bytesToHex(await hmacSha256(secretKey, dataCheckString));
  return timingSafeEqualHex(calculatedHash, receivedHash)
    ? { ok: true, queryId }
    : { ok: false, error: "Telegram initData hash is invalid" };
}

function webAppUrlFromRequest(request: Request) {
  return `${new URL(request.url).origin}/app`;
}

function catalogReplyMarkup(appUrl: string): TelegramReplyMarkup {
  return {
    keyboard: [
      [{ text: "🛒 Каталог Onliner", web_app: { url: appUrl } }],
      [{ text: "🔥 Проверить скидки" }, { text: "👀 Мои подписки" }, { text: "🏥 Статус" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    input_field_placeholder: "Название товара или ссылка Onliner",
  };
}

function catalogInlineMarkup(appUrl: string): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [{ text: "🛒 Открыть каталог", web_app: { url: appUrl } }],
    ],
  };
}

function productReviewsUrl(product: ProductView) {
  return product.reviewEvidence.htmlUrl || `${product.url.replace(/\/$/, "")}/reviews`;
}

function productReplyMarkup(appUrl: string, product: ProductView): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Onliner", url: product.url },
        { text: "Отзывы", url: productReviewsUrl(product) },
      ],
      [{ text: "Следить за ценой", callback_data: `watch:${product.id}` }],
      [{ text: "Каталог", web_app: { url: appUrl } }],
    ],
  };
}

function dealButtonText(index: number, product: ProductView) {
  return `${index + 1}. ${product.title}`.slice(0, 64);
}

function dealsReplyMarkup(appUrl: string, deals: ProductView[]): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      ...deals.slice(0, 3).map((deal, index) => ([
        { text: dealButtonText(index, deal), url: deal.url },
      ])),
      [{ text: "Каталог", web_app: { url: appUrl } }],
    ],
  };
}

function watchReplyMarkup(appUrl: string, product: ProductView): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [{ text: "Не следить", callback_data: `unwatch:${product.id}` }],
      [
        { text: "Onliner", url: product.url },
        { text: "Каталог", web_app: { url: appUrl } },
      ],
    ],
  };
}

function choiceButtonText(index: number, product: OnlinerProduct) {
  const title = product.full_name || product.extended_name || product.name || product.key;
  const price = toNumber(product.prices?.price_min?.amount);
  const priceText = price > 0 ? ` · ${formatMoneyValue(price)} BYN` : "";
  return `${index + 1}. ${title}${priceText}`.slice(0, 64);
}

function productChoicesReplyMarkup(appUrl: string, products: OnlinerProduct[]): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      ...products.slice(0, 5).map((product, index) => ([
        { text: choiceButtonText(index, product), callback_data: `analyze:${product.key}` },
      ])),
      [{ text: "🛒 Открыть каталог", web_app: { url: appUrl } }],
    ],
  };
}

function formatProductChoices(query: string, products: OnlinerProduct[]) {
  return [
    "Нашел несколько похожих товаров.",
    "Выбери точную карточку, чтобы я не разобрал не ту модификацию:",
    "",
    ...products.slice(0, 5).map((product, index) => {
      const title = product.full_name || product.extended_name || product.name || product.key;
      const price = toNumber(product.prices?.price_min?.amount);
      const offers = product.prices?.offers?.count || 0;
      const priceText = price > 0 ? `${formatMoneyValue(price)} BYN` : "цена не указана";
      const offersText = offers ? `, ${offers} ${pluralRu(offers, ["предложение", "предложения", "предложений"])}` : "";
      return `${index + 1}. ${title} — ${priceText}${offersText}`;
    }),
    "",
    `Запрос: ${query}`,
  ].join("\n");
}

function telegramInlineResultId(prefix: string, value: string) {
  return `${prefix}-${value}`.replace(/[^\w-]/g, "-").replace(/-+/g, "-").slice(0, 64) || prefix;
}

function normalizeTelegramUsername(value?: unknown) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function isOwnInlineResultMessage(message: any, env: Env) {
  const viaBotUsername = normalizeTelegramUsername(message?.via_bot?.username);
  if (!viaBotUsername) return false;

  const ownUsernames = new Set([
    normalizeTelegramUsername(env.TELEGRAM_BOT_USERNAME),
    "buyeradvocatebybot",
  ].filter(Boolean));

  if (!ownUsernames.has(viaBotUsername)) return false;

  const text = String(message?.text || "").trim();
  return text.startsWith("🛡️ Цифровой адвокат покупателя")
    || text.startsWith("Не нашел выбранный товар в live Onliner");
}

function formatCatalogInvite(appUrl: string) {
  return [
    "🛒 Каталог Onliner внутри Telegram",
    "",
    "Открой каталог кнопкой ниже, выбери товар, и я разберу цену, историю и честные минусы прямо в чате.",
    "",
    appUrl,
  ].join("\n");
}

function formatBotHealthStatus(env: Env) {
  const channelState = env.TELEGRAM_CHANNEL_ID && !env.TELEGRAM_CHANNEL_ID.includes("@your_")
    ? (envFlag(env.ENABLE_CHANNEL_CRON) ? "включен" : "настроен, автопостинг выключен")
    : "не настроен";
  const priceWatchState = envFlag(env.ENABLE_PRICE_WATCHES) && env.DEAL_ALERTS_KV
    ? "включены"
    : "недоступны";
  const externalState = envFlag(env.ENABLE_5ELEMENT_PILOT)
    ? "Onliner Marketplace + 5 элемент (pilot)"
    : "Onliner Marketplace";

  return [
    "Статус бота:",
    "",
    "- Webhook: работает, это сообщение обработано.",
    "- Каталог: live Onliner API при каждом разборе товара.",
    `- Отзывы: публичные отзывы Onliner, до ${getReviewPagesMax(env)} страниц.`,
    `- Сравнение цен: ${externalState}; это не все сайты РБ.`,
    `- Подписки на цену: ${priceWatchState}.`,
    `- Канал скидок: ${channelState}.`,
    "",
    "Если что-то выглядит странно, пришли ссылку Onliner или открой каталог заново.",
  ].join("\n");
}

function formatReviewEvidenceLine(evidence: ReviewEvidence) {
  const total = evidence.totalCount || evidence.processedCount;
  const pages = evidence.pagesAvailable
    ? `, страниц ${evidence.pagesProcessed}/${evidence.pagesAvailable}`
    : "";
  const average = evidence.averageFetchedRating
    ? `, средняя по выборке ${evidence.averageFetchedRating}/5`
    : "";
  return `Отзывы: обработано ${evidence.processedCount} из ${total}${pages}${average}`;
}

function formatReviewInsightBullets(items: ReviewInsight[], emptyMessage: string) {
  const source = items.map(reviewInsightText).slice(0, 3);
  return source.length ? source.map((item) => `- ${item}`) : [`- ${emptyMessage}`];
}

function formatChannelReviewLines(product: ProductView) {
  const pros = product.reviewEvidence.topPros.map(reviewInsightText).slice(0, 2);
  const cons = product.reviewEvidence.topCons.map(reviewInsightText).slice(0, 2);

  return [
    pros.length
      ? `✅ В отзывах отмечают: ${pros.join(". ")}`
      : "✅ Отзывы: явных повторяющихся плюсов мало; смотри свежие отзывы вручную.",
    cons.length
      ? `⚠️ В отзывах ругают: ${cons.join(". ")}`
      : "⚠️ Минусы: явных повторяющихся минусов мало; проверь карточку перед покупкой.",
  ];
}

function formatMedianDelta(product: ProductView) {
  const value = product.honestDiscountPercent;
  if (!Number.isFinite(value) || Math.abs(value) < 0.1) return "примерно на уровне медианы";
  return value > 0
    ? `на ${formatMoneyValue(value)}% ниже медианы`
    : `на ${formatMoneyValue(Math.abs(value))}% выше медианы`;
}

function formatPriceHistoryLines(product: ProductView) {
  const points = [...product.historyPoints]
    .filter((point) => point.date && point.price > 0)
    .sort((a, b) => historyTime(a.date) - historyTime(b.date));

  if (points.length < 2) {
    return [
      "История цены: Onliner не вернул достаточно данных графика.",
      `Ориентир: медиана ${formatMoneyValue(product.medianPrice)} BYN считается предварительной.`,
    ];
  }

  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const firstDate = formatHistoryDate(points[0].date);
  const lastDate = formatHistoryDate(points[points.length - 1].date);
  const dateRange = firstDate === lastDate ? firstDate : `${firstDate}-${lastDate}`;
  const measurement = `${points.length} ${pluralRu(points.length, ["замер", "замера", "замеров"])} цены Onliner`;

  return [
    `История цены: ${measurement} за ${dateRange}.`,
    `Диапазон истории: ${formatMoneyValue(minPrice)}-${formatMoneyValue(maxPrice)} BYN; медиана ${formatMoneyValue(product.medianPrice)} BYN.`,
    `Сейчас: ${formatMoneyValue(product.currentPrice)} BYN, ${formatMedianDelta(product)}.`,
    "Замер = одна цена из графика Onliner; это не отдельный магазин и не отзыв.",
  ];
}

function formatPriceRange(minPrice?: number, maxPrice?: number) {
  if (!minPrice || !maxPrice) return "нет данных";
  return minPrice === maxPrice
    ? `${formatMoneyValue(minPrice)} BYN`
    : `${formatMoneyValue(minPrice)}-${formatMoneyValue(maxPrice)} BYN`;
}

function formatPriceComparisonLines(comparison: PriceComparison) {
  const onliner = comparison.sources.find((source) => source.source === "onliner_marketplace");
  const externalSources = comparison.sources.filter((source) => (
    source.source !== "onliner_marketplace" && source.source !== "external_sites"
  ));
  const genericExternal = comparison.sources.find((source) => source.source === "external_sites");
  const lines = ["Проверенные источники цен:"];

  if (onliner?.status === "ok") {
    lines.push(`- ${onliner.label}: ${onliner.offersCount} ${pluralRu(onliner.offersCount, ["предложение", "предложения", "предложений"])}, ${formatPriceRange(onliner.minPrice, onliner.maxPrice)}.`);
  } else {
    lines.push(`- ${onliner?.label || "Onliner Marketplace"}: сейчас не отдал предложения продавцов.`);
  }

  for (const offer of comparison.bestOffers.slice(0, 3)) {
    const notes = offer.notes.length ? ` (${offer.notes.slice(0, 2).join(", ")})` : "";
    lines.push(`  • ${offer.sellerName} — ${formatMoneyValue(offer.price)} ${offer.currency}${notes}`);
  }

  for (const source of externalSources) {
    if (source.status === "ok") {
      lines.push(`- ${source.label}: ${source.offersCount} ${pluralRu(source.offersCount, ["предложение", "предложения", "предложений"])}, ${formatPriceRange(source.minPrice, source.maxPrice)}; price-only pilot, совпадение эвристическое.`);
    } else if (source.status === "unavailable") {
      lines.push(`- ${source.label}: сейчас не отдал проверяемые цены.`);
    } else {
      lines.push(`- ${source.label}: не настроен; пока не заявляю как проверенный источник.`);
    }
  }

  if (!externalSources.length && genericExternal) {
    lines.push(`- ${genericExternal.label}: подключаются отдельными источниками; пока не заявляю как проверенные.`);
  }

  return lines;
}

function formatChannelPriceComparisonLines(comparison: PriceComparison) {
  return formatPriceComparisonLines(comparison).filter((line, index) => (
    index < 2 || (line.startsWith("- ") && !line.includes("Внешние сайты РБ"))
  ));
}

function formatProductAnswer(product: ProductView) {
  return [
    "🛡️ Цифровой адвокат покупателя",
    "",
    `Товар: ${product.title}`,
    `Цена сейчас: ${formatMoneyValue(product.currentPrice)} BYN`,
    `Медианный ориентир: ${formatMoneyValue(product.medianPrice)} BYN`,
    `Сравнение с историей: ${formatMedianDelta(product)}`,
    ...formatPriceHistoryLines(product),
    ...(product.priceManipulationWarning ? [`Предупреждение: ${product.priceManipulationWarning}`] : []),
    ...formatPriceComparisonLines(product.priceComparison),
    formatReviewEvidenceLine(product.reviewEvidence),
    "",
    product.isFakeDiscount
      ? "Вердикт: скидка выглядит слабой, фейковой или сильно завышенной относительно истории цены."
      : "Вердикт: цена выглядит ниже медианного ориентира, но покупка должна быть осознанной.",
    "",
    "Повторяющиеся минусы:",
    ...formatReviewInsightBullets(
      product.reviewEvidence.topCons,
      "Явных повторяющихся минусов в обработанных отзывах нет; проверь свежие отзывы вручную.",
    ),
    "",
    "Что чаще хвалят:",
    ...formatReviewInsightBullets(
      product.reviewEvidence.topPros,
      "Явных повторяющихся плюсов в обработанных отзывах нет; смотри карточку и свежие отзывы.",
    ),
    "",
    "Источник: кнопки ниже",
    "",
    "Проект неофициальный, не аффилирован с Onliner.by. Разработано AI_Nikitka93.",
  ].join("\n");
}

function formatDealLine(product: ProductView, index: number) {
  const onlinerSource = product.priceComparison.sources.find((source) => source.source === "onliner_marketplace");
  const offers = onlinerSource?.offersCount || 0;
  const rating = product.ratingCount
    ? `рейтинг ${formatMoneyValue(product.rating)}/5, ${product.ratingCount} ${pluralRu(product.ratingCount, ["отзыв", "отзыва", "отзывов"])}`
    : "отзывов мало";
  return [
    `${index + 1}. ${product.title}`,
    `${formatMoneyValue(product.currentPrice)} BYN; ниже медианы на ${formatMoneyValue(product.honestDiscountPercent)}%; ${offers} ${pluralRu(offers, ["предложение", "предложения", "предложений"])} Onliner; ${rating}.`,
    product.url,
  ].join("\n");
}

function formatDealsAnswer(deals: ProductView[], env: Env) {
  const config = dealFilterConfig(env);
  if (!deals.length) {
    return [
      "Сейчас честных live-скидок Onliner по фильтру не найдено.",
      "",
      `Фильтр: super-prices от ${formatMoneyValue(config.minDiscountPercent)}%, цена от ${formatMoneyValue(config.minPrice)} BYN, минимум ${config.minOffers} ${pluralRu(config.minOffers, ["предложение", "предложения", "предложений"])}.`,
      "Я не публикую карточки, где скидка не подтверждается историей цены или слишком мало предложений.",
    ].join("\n");
  }

  return [
    "🔥 Live-скидки Onliner",
    "",
    `Источник: catalog.api.onliner.by/super-prices. Фильтр: от ${formatMoneyValue(config.minDiscountPercent)}%, цена от ${formatMoneyValue(config.minPrice)} BYN, минимум ${config.minOffers} ${pluralRu(config.minOffers, ["предложение", "предложения", "предложений"])}.`,
    "Скидка считается от медианного ориентира Onliner, поэтому это не гарантия лучшей цены по всей РБ.",
    "",
    ...deals.slice(0, 5).map(formatDealLine),
    "",
    "Проверь карточку и продавца перед покупкой.",
  ].join("\n");
}

function productWebAppQueryResult(appUrl: string, product: ProductView) {
  return {
    type: "article",
    id: telegramInlineResultId("product", product.id),
    title: product.title.slice(0, 120),
    input_message_content: {
      message_text: clampTelegramText(formatProductAnswer(product)),
      link_preview_options: { is_disabled: true },
    },
    reply_markup: productReplyMarkup(appUrl, product),
    url: product.url,
    description: `${product.currentPrice || "нет цены"} BYN · ${formatReviewEvidenceLine(product.reviewEvidence)}`.slice(0, 200),
  };
}

function productNotFoundWebAppQueryResult(appUrl: string) {
  return {
    type: "article",
    id: "product-not-found",
    title: "Товар не найден",
    input_message_content: {
      message_text: "Не нашел выбранный товар в live Onliner. Открой каталог и выбери другой товар.",
      link_preview_options: { is_disabled: true },
    },
    reply_markup: catalogInlineMarkup(appUrl),
  };
}

function formatChannelPost(product: ProductView) {
  return [
    product.isFakeDiscount ? "📢 ФЕЙКОВАЯ СКИДКА? ❌" : "📢 РЕАЛЬНАЯ ВЫГОДА? ✅",
    "",
    `🛒 ${product.title}`,
    `💰 Цена: ${formatMoneyValue(product.currentPrice)} BYN`,
    `Честная выгода от медианы: ${formatMoneyValue(product.honestDiscountPercent)}%`,
    ...formatPriceHistoryLines(product).slice(0, 2),
    ...(product.priceManipulationWarning ? [`⚠️ ${product.priceManipulationWarning}`] : []),
    ...formatChannelPriceComparisonLines(product.priceComparison),
    formatReviewEvidenceLine(product.reviewEvidence),
    "",
    ...formatChannelReviewLines(product),
    "",
    `🛡️ Вердикт: публикуется только как математический сигнал, проверь карточку перед покупкой.`,
    product.url,
  ].join("\n");
}

function catalogAppHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Каталог Onliner</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    :root {
      color-scheme: light dark;
      --bg: var(--tg-theme-bg-color, #f6f7f8);
      --panel: var(--tg-theme-secondary-bg-color, #ffffff);
      --text: var(--tg-theme-text-color, #17212b);
      --muted: var(--tg-theme-hint-color, #6d7885);
      --link: var(--tg-theme-link-color, #2481cc);
      --button: var(--tg-theme-button-color, #2481cc);
      --button-text: var(--tg-theme-button-text-color, #ffffff);
      --line: rgba(109, 120, 133, 0.22);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-size: 15px;
    }
    .shell {
      width: min(920px, 100%);
      margin: 0 auto;
      padding: max(14px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom));
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.15;
      letter-spacing: 0;
    }
    .badge {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.2;
      white-space: nowrap;
    }
    form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      margin-bottom: 10px;
    }
    input, button, .link-button {
      min-height: 44px;
      border-radius: 8px;
      border: 1px solid var(--line);
      font: inherit;
    }
    input {
      width: 100%;
      padding: 0 12px;
      background: var(--panel);
      color: var(--text);
    }
    button, .link-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      background: var(--button);
      color: var(--button-text);
      border-color: transparent;
      font-weight: 650;
      cursor: pointer;
      text-decoration: none;
    }
    button:disabled {
      opacity: 0.65;
      cursor: progress;
    }
    .chips {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 2px 0 12px;
      scrollbar-width: none;
    }
    .chips::-webkit-scrollbar { display: none; }
    .chip {
      flex: 0 0 auto;
      min-height: 36px;
      padding: 0 12px;
      background: var(--panel);
      color: var(--text);
      border: 1px solid var(--line);
      border-radius: 8px;
      font-weight: 600;
    }
    .chip.active {
      background: rgba(36, 129, 204, 0.12);
      border-color: var(--link);
      color: var(--link);
    }
    .status {
      min-height: 22px;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .analysis {
      margin: 0 0 12px;
      padding: 12px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .analysis h2 {
      margin: 0 0 8px;
      font-size: 16px;
      line-height: 1.25;
      letter-spacing: 0;
    }
    .analysis p {
      margin: 6px 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }
    .load-more {
      display: none;
      width: 100%;
      margin-top: 12px;
      background: var(--panel);
      color: var(--link);
      border-color: var(--line);
    }
    .load-more.visible {
      display: block;
    }
    .card {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 10px;
      padding: 10px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .thumb {
      width: 72px;
      height: 72px;
      border-radius: 8px;
      background: rgba(109, 120, 133, 0.12);
      object-fit: contain;
    }
    .title {
      margin: 0 0 6px;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.3;
    }
    .actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .secondary {
      background: transparent;
      color: var(--link);
      border-color: var(--line);
    }
    @media (min-width: 720px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <h1>Каталог Onliner</h1>
      <div class="badge">Адвокат покупателя BY</div>
    </header>

    <form id="searchForm">
      <input id="searchInput" name="q" autocomplete="off" placeholder="redmi note 15, dyson, rtx">
      <button type="submit">Найти</button>
    </form>

    <nav id="categories" class="chips" aria-label="Категории"></nav>
    <div id="status" class="status"></div>
    <section id="analysisPanel" class="analysis" hidden></section>
    <section id="results" class="grid" aria-live="polite"></section>
    <button id="loadMore" class="load-more" type="button">Показать еще</button>
  </main>

  <script>
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const state = {
      categories: [],
      schema: "all",
      query: "",
      loading: false,
      page: 1,
      total: 0,
      hasMore: false
    };

    const categoriesEl = document.getElementById("categories");
    const resultsEl = document.getElementById("results");
    const statusEl = document.getElementById("status");
    const inputEl = document.getElementById("searchInput");
    const formEl = document.getElementById("searchForm");
    const loadMoreEl = document.getElementById("loadMore");
    const analysisPanelEl = document.getElementById("analysisPanel");

    function setStatus(value) {
      statusEl.textContent = value || "";
    }

    function money(product) {
      return product.price > 0 ? product.price + " " + (product.currency || "BYN") : "нет цены";
    }

    function moneyValue(value) {
      return Number.isFinite(Number(value)) && Number(value) > 0
        ? Math.round(Number(value) * 100) / 100 + " BYN"
        : "нет цены";
    }

    function reviewLine(product) {
      const evidence = product && product.reviewEvidence ? product.reviewEvidence : null;
      if (!evidence) return "Отзывы: данные не загружены.";
      const total = evidence.totalCount || evidence.processedCount || 0;
      const average = evidence.averageFetchedRating ? ", средняя " + evidence.averageFetchedRating + "/5" : "";
      return "Отзывы: обработано " + evidence.processedCount + " из " + total + average + ".";
    }

    function priceRange(source) {
      if (!source || !source.minPrice || !source.maxPrice) return "нет данных";
      return source.minPrice === source.maxPrice
        ? moneyValue(source.minPrice)
        : moneyValue(source.minPrice) + "-" + moneyValue(source.maxPrice);
    }

    function priceComparisonLines(product) {
      const comparison = product && product.priceComparison ? product.priceComparison : null;
      if (!comparison) return [];
      const sources = comparison.sources || [];
      const bestOffers = comparison.bestOffers || [];
      const lines = ["Проверенные источники цен:"];
      const onliner = sources.find((source) => source.source === "onliner_marketplace");
      if (onliner && onliner.status === "ok") {
        lines.push("Onliner Marketplace: " + onliner.offersCount + " предлож., " + priceRange(onliner) + ".");
      } else {
        lines.push("Onliner Marketplace: сейчас не отдал предложения продавцов.");
      }
      bestOffers.slice(0, 3).forEach((offer) => {
        const notes = offer.notes && offer.notes.length ? " (" + offer.notes.slice(0, 2).join(", ") + ")" : "";
        lines.push("• " + offer.sellerName + " — " + moneyValue(offer.price) + notes);
      });
      sources
        .filter((source) => source.source !== "onliner_marketplace" && source.source !== "external_sites")
        .forEach((source) => {
          if (source.status === "ok") {
            lines.push(source.label + ": " + source.offersCount + " предлож., " + priceRange(source) + "; price-only pilot, совпадение эвристическое.");
          } else {
            lines.push(source.label + ": сейчас не отдал проверяемые цены.");
          }
        });
      return lines;
    }

    function addParagraph(parent, text) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      parent.append(paragraph);
    }

    function renderWebAnalysis(product) {
      const title = document.createElement("h2");
      title.textContent = product.title || "Товар Onliner";

      const link = document.createElement("a");
      link.href = product.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "link-button secondary";
      link.textContent = "Открыть Onliner";

      analysisPanelEl.replaceChildren(title);
      addParagraph(analysisPanelEl, "Цена сейчас: " + moneyValue(product.currentPrice) + ".");
      addParagraph(analysisPanelEl, "Честная выгода от медианы: " + (product.honestDiscountPercent || 0) + "%.");
      if (product.priceManipulationWarning) addParagraph(analysisPanelEl, "Предупреждение: " + product.priceManipulationWarning);
      addParagraph(analysisPanelEl, reviewLine(product));
      priceComparisonLines(product).forEach((line) => addParagraph(analysisPanelEl, line));
      addParagraph(
        analysisPanelEl,
        product.isFakeDiscount
          ? "Вердикт: скидка выглядит слабой, фейковой или сильно завышенной относительно истории цены."
          : "Вердикт: цена выглядит ниже медианного ориентира, но карточку и продавца надо проверить перед покупкой."
      );
      analysisPanelEl.append(link);
      analysisPanelEl.hidden = false;
      analysisPanelEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function showWebAnalysis(product, button) {
      const originalText = button ? button.textContent : "Разобрать";
      if (button) {
        button.disabled = true;
        button.textContent = "Разбираю...";
      }
      setStatus("Разбираю товар...");
      try {
        const response = await fetch("/api/catalog/product?input=" + encodeURIComponent(product.key));
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok || !data.product) throw new Error(data.error || "catalog product failed");
        renderWebAnalysis(data.product);
        setStatus("Разбор готов");
      } catch (error) {
        setStatus("Не смог загрузить разбор. Открой Onliner или попробуй другой товар.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText || "Разобрать";
        }
      }
    }

    function renderCategories() {
      categoriesEl.replaceChildren(...state.categories.map((category) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chip" + (category.schema === state.schema ? " active" : "");
        button.textContent = category.title;
        button.addEventListener("click", () => {
          state.schema = category.schema;
          state.query = inputEl.value.trim();
          state.page = 1;
          renderCategories();
          search(false);
        });
        return button;
      }));
    }

    async function sendProduct(product, button) {
      const payload = {
        type: "analyze_product",
        key: product.key,
        title: product.title,
        url: product.url
      };
      const queryId = tg && tg.initDataUnsafe && tg.initDataUnsafe.query_id
        ? String(tg.initDataUnsafe.query_id)
        : "";
      if (queryId) {
        const originalText = button ? button.textContent : "Разобрать";
        if (button) {
          button.disabled = true;
          button.textContent = "Разбираю...";
        }
        setStatus("Разбираю товар...");
        try {
          const response = await fetch("/api/webapp/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              queryId: queryId,
              initData: tg.initData || ""
            })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.ok) throw new Error(data.error || "web app analyze failed");
          setStatus("Разбор отправлен в чат");
          if (tg && typeof tg.close === "function") tg.close();
        } catch (error) {
          if (button) {
            button.disabled = false;
            button.textContent = originalText || "Разобрать";
          }
          setStatus("Не смог отправить разбор в чат. Попробуй еще раз.");
        }
        return;
      }

      const payloadText = JSON.stringify(payload);
      if (tg && tg.initData && typeof tg.sendData === "function") {
        tg.sendData(payloadText);
        if (typeof tg.close === "function") tg.close();
        return;
      }
      await showWebAnalysis(product, button);
    }

    function syncLoadMore() {
      loadMoreEl.className = "load-more" + (state.hasMore && !state.loading ? " visible" : "");
      loadMoreEl.disabled = state.loading;
    }

    function renderProducts(products, append) {
      if (!products.length) {
        if (!append) resultsEl.replaceChildren();
        if (!append) setStatus("Ничего не найдено");
        syncLoadMore();
        return;
      }

      const cards = products.map((product) => {
        const card = document.createElement("article");
        card.className = "card";

        const img = document.createElement("img");
        img.className = "thumb";
        img.alt = "";
        img.loading = "lazy";
        img.src = product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Crect width='72' height='72' fill='%23e8eef3'/%3E%3C/svg%3E";

        const body = document.createElement("div");
        const title = document.createElement("p");
        title.className = "title";
        title.textContent = product.title;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = money(product) + " · рейтинг " + (product.rating || "нет") + " · " + product.offersCount + " предлож.";

        const actions = document.createElement("div");
        actions.className = "actions";

        const analyze = document.createElement("button");
        analyze.type = "button";
        analyze.textContent = "Разобрать";
        analyze.addEventListener("click", () => sendProduct(product, analyze));

        const open = document.createElement("a");
        open.className = "link-button secondary";
        open.href = product.url;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        open.textContent = "Onliner";

        actions.append(analyze, open);
        body.append(title, meta, actions);
        card.append(img, body);
        return card;
      });

      if (append) {
        resultsEl.append(...cards);
      } else {
        resultsEl.replaceChildren(...cards);
      }
      syncLoadMore();
    }

    async function loadCategories() {
      const response = await fetch("/api/catalog/categories");
      const data = await response.json();
      state.categories = data.categories || [];
      state.schema = state.categories[0] ? state.categories[0].schema : "mobile";
      renderCategories();
    }

    async function search(append) {
      if (state.loading) return;
      state.loading = true;
      syncLoadMore();
      if (!append) {
        state.page = 1;
        resultsEl.replaceChildren();
      }
      setStatus(append ? "Загружаю еще..." : "Ищу в Onliner...");
      const params = new URLSearchParams({
        schema: state.schema,
        query: inputEl.value.trim(),
        limit: "30",
        page: String(state.page)
      });
      try {
        const response = await fetch("/api/catalog/search?" + params.toString());
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "catalog search failed");
        state.total = data.total || 0;
        state.hasMore = Boolean(data.hasMore);
        const previousCount = append ? resultsEl.children.length : 0;
        const nextProducts = data.products || [];
        renderProducts(nextProducts, Boolean(append));
        setStatus("Показано: " + (previousCount + nextProducts.length) + " из " + state.total);
      } catch (error) {
        if (!append) resultsEl.replaceChildren();
        state.hasMore = false;
        setStatus("Onliner временно не ответил. Попробуй другой запрос.");
      } finally {
        state.loading = false;
        syncLoadMore();
      }
    }

    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      state.page = 1;
      search(false);
    });

    loadMoreEl.addEventListener("click", () => {
      if (!state.hasMore || state.loading) return;
      state.page += 1;
      search(true);
    });

    loadCategories().then(search).catch(() => {
      setStatus("Не удалось загрузить каталог");
    });
  </script>
</body>
</html>`;
}

async function runTelegramDoctor(env: Env, request: Request) {
  const url = new URL(request.url);
  const expectedWebhookUrl = url.searchParams.get("expectedWebhookUrl") || undefined;
  const checks: Record<string, unknown> = {};
  const recommendations: string[] = [];

  let bot: { id: number; username?: string; first_name?: string; is_bot?: boolean } | null = null;
  try {
    bot = await callTelegram(env, "getMe");
    checks.bot = { ok: true, id: bot.id, username: bot.username, firstName: bot.first_name, isBot: bot.is_bot };
  } catch (error) {
    checks.bot = { ok: false, reason: error instanceof Error ? error.message : String(error) };
    recommendations.push("Проверь TELEGRAM_BOT_TOKEN.");
  }

  if (env.TELEGRAM_CHANNEL_ID && !env.TELEGRAM_CHANNEL_ID.includes("@your_")) {
    try {
      const chat = await callTelegram(env, "getChat", { chat_id: env.TELEGRAM_CHANNEL_ID });
      checks.channel = { ok: true, chat };
      if (bot) {
        const member = await callTelegram<{ status: string; can_post_messages?: boolean }>(env, "getChatMember", {
          chat_id: env.TELEGRAM_CHANNEL_ID,
          user_id: bot.id,
        });
        const canPost = member.status === "creator" || (member.status === "administrator" && member.can_post_messages !== false);
        checks.channelAdmin = { ok: canPost, status: member.status, canPostMessages: canPost };
        if (!canPost) recommendations.push("Добавь бота админом канала с правом публикации.");
      }
    } catch (error) {
      checks.channel = { ok: false, reason: error instanceof Error ? error.message : String(error) };
      recommendations.push("Проверь TELEGRAM_CHANNEL_ID и права бота в канале.");
    }
  } else {
    checks.channel = { ok: false, reason: "TELEGRAM_CHANNEL_ID is not configured." };
    recommendations.push("Укажи TELEGRAM_CHANNEL_ID после создания канала.");
  }

  try {
    const webhook = await callTelegram<{
      url?: string;
      pending_update_count?: number;
      allowed_updates?: string[];
      last_error_message?: string;
      last_error_date?: number;
    }>(env, "getWebhookInfo");
    const pendingUpdateCount = webhook.pending_update_count || 0;
    const lastErrorDate = typeof webhook.last_error_date === "number" ? webhook.last_error_date : null;
    const lastErrorAgeHours = lastErrorDate
      ? Math.round(((Date.now() / 1000 - lastErrorDate) / 3600) * 10) / 10
      : null;
    checks.webhook = {
      ok: expectedWebhookUrl ? webhook.url === expectedWebhookUrl : true,
      configured: Boolean(webhook.url),
      url: webhook.url || "",
      expectedWebhookUrl,
      pendingUpdateCount,
      allowedUpdates: webhook.allowed_updates || [],
      lastErrorMessage: webhook.last_error_message || null,
      lastErrorDate,
      lastErrorAt: lastErrorDate ? new Date(lastErrorDate * 1000).toISOString() : null,
      lastErrorAgeHours,
    };
    if (!webhook.url) recommendations.push("Webhook еще не зарегистрирован.");
    if (pendingUpdateCount > 0) recommendations.push(`В Telegram webhook очереди ${pendingUpdateCount} pending updates; проверь обработку входящих событий.`);
    if (lastErrorAgeHours !== null && lastErrorAgeHours < 1) recommendations.push("Telegram недавно видел ошибку webhook; проверь Worker logs и smoke:telegram.");
  } catch (error) {
    checks.webhook = { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }

  return {
    ok: Boolean((checks.bot as any)?.ok && (checks.channelAdmin as any)?.ok),
    readyForLiveDelivery: Boolean((checks.bot as any)?.ok && (checks.channelAdmin as any)?.ok && envFlag(env.ENABLE_TELEGRAM_DELIVERY)),
    readyForChannelCron: Boolean((checks.bot as any)?.ok && (checks.channelAdmin as any)?.ok && envFlag(env.ENABLE_TELEGRAM_DELIVERY) && envFlag(env.ENABLE_CHANNEL_CRON)),
    deliveryEnabled: envFlag(env.ENABLE_TELEGRAM_DELIVERY),
    channelCronEnabled: envFlag(env.ENABLE_CHANNEL_CRON),
    dealDedupeConfigured: Boolean(env.DEAL_ALERTS_KV),
    checks,
    recommendations: [
      ...recommendations,
      ...(envFlag(env.ENABLE_CHANNEL_CRON) ? [] : ["Автопубликация скидок выключена: ENABLE_CHANNEL_CRON != true. Это безопасно для подключения канала и ручного теста."]),
      ...(env.DEAL_ALERTS_KV ? [] : ["Для частого радара скидок подключи DEAL_ALERTS_KV, иначе Worker не сможет надежно подавлять повторные посты."]),
    ],
  };
}

function requireAdmin(request: Request, env: Env) {
  const expected = env.ADMIN_API_TOKEN;
  const actual = request.headers.get("x-admin-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && actual && actual === expected);
}

function dealPublishStateKey(product: ProductView) {
  return `deal-alert:${product.id}`;
}

function dealPublishState(product: ProductView, status: DealPublishState["status"] = "posted"): DealPublishState {
  return {
    productId: product.id,
    title: product.title,
    url: product.url,
    price: product.currentPrice,
    honestDiscountPercent: product.honestDiscountPercent,
    postedAt: new Date().toISOString(),
    status,
  };
}

function parseDealPublishState(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<DealPublishState>;
    if (!parsed.productId || typeof parsed.price !== "number" || !parsed.postedAt) return null;
    return parsed as DealPublishState;
  } catch {
    return null;
  }
}

function parseStringArray(value: string | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  } catch {
    return [];
  }
}

function parsePriceWatch(value: string | null): PriceWatchSubscription | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as PriceWatchSubscription;
    return parsed && typeof parsed.key === "string" && typeof parsed.chatId === "string" && typeof parsed.productId === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function safeChatId(chatId: string | number) {
  return String(chatId).replace(/[^-\w:.@]/g, "_");
}

function priceWatchKey(chatId: string | number, productId: string) {
  return `price-watch:${safeChatId(chatId)}:${productId}`;
}

function priceWatchChatIndexKey(chatId: string | number) {
  return `price-watch:chat:${safeChatId(chatId)}`;
}

function priceWatchDropPercent(env: Env) {
  return envNumberAtLeast(env.PRICE_WATCH_DROP_PERCENT, DEFAULT_PRICE_WATCH_DROP_PERCENT, 0);
}

function priceWatchTargetPrice(product: ProductView, env: Env) {
  const dropPercent = priceWatchDropPercent(env);
  return Math.max(0.01, Math.round(product.currentPrice * (1 - dropPercent / 100) * 100) / 100);
}

async function readPriceWatchIndex(env: Env) {
  if (!env.DEAL_ALERTS_KV) return [] as string[];
  return parseStringArray(await env.DEAL_ALERTS_KV.get(PRICE_WATCH_INDEX_KEY));
}

async function writePriceWatchIndex(env: Env, keys: string[]) {
  if (!env.DEAL_ALERTS_KV) return;
  await env.DEAL_ALERTS_KV.put(PRICE_WATCH_INDEX_KEY, JSON.stringify(Array.from(new Set(keys))));
}

async function addPriceWatchIndex(env: Env, key: string, chatId: string | number, productId: string) {
  if (!env.DEAL_ALERTS_KV) return;
  await writePriceWatchIndex(env, [key, ...await readPriceWatchIndex(env)]);

  const chatIndexKey = priceWatchChatIndexKey(chatId);
  const chatIndex = parseStringArray(await env.DEAL_ALERTS_KV.get(chatIndexKey));
  await env.DEAL_ALERTS_KV.put(chatIndexKey, JSON.stringify(Array.from(new Set([productId, ...chatIndex]))));
}

async function removePriceWatchIndex(env: Env, key: string, chatId: string | number, productId: string) {
  if (!env.DEAL_ALERTS_KV) return;
  await writePriceWatchIndex(env, (await readPriceWatchIndex(env)).filter((item) => item !== key));
  const chatIndexKey = priceWatchChatIndexKey(chatId);
  const chatIndex = parseStringArray(await env.DEAL_ALERTS_KV.get(chatIndexKey)).filter((item) => item !== productId);
  await env.DEAL_ALERTS_KV.put(chatIndexKey, JSON.stringify(chatIndex));
}

async function savePriceWatch(env: Env, subscription: PriceWatchSubscription) {
  if (!env.DEAL_ALERTS_KV) return;
  await env.DEAL_ALERTS_KV.put(subscription.key, JSON.stringify(subscription));
}

async function subscribePriceWatch(env: Env, chatId: string | number, product: ProductView) {
  if (!env.DEAL_ALERTS_KV) {
    return { ok: false, reason: "DEAL_ALERTS_KV is not configured." };
  }
  if (!Number.isFinite(product.currentPrice) || product.currentPrice <= 0) {
    return { ok: false, reason: "У товара сейчас нет проверяемой цены." };
  }

  const key = priceWatchKey(chatId, product.id);
  const existing = parsePriceWatch(await env.DEAL_ALERTS_KV.get(key));
  const now = new Date().toISOString();
  const subscription: PriceWatchSubscription = {
    key,
    chatId: String(chatId),
    productId: product.id,
    title: product.title,
    url: product.url,
    basePrice: product.currentPrice,
    targetPrice: priceWatchTargetPrice(product, env),
    dropPercent: priceWatchDropPercent(env),
    active: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastCheckedAt: existing?.lastCheckedAt,
    lastPrice: product.currentPrice,
    lastNotifiedAt: existing?.lastNotifiedAt,
  };

  await savePriceWatch(env, subscription);
  await addPriceWatchIndex(env, key, chatId, product.id);
  return { ok: true, subscription };
}

async function unsubscribePriceWatch(env: Env, chatId: string | number, productId: string) {
  if (!env.DEAL_ALERTS_KV) {
    return { ok: false, reason: "DEAL_ALERTS_KV is not configured." };
  }
  const key = priceWatchKey(chatId, productId);
  const existing = parsePriceWatch(await env.DEAL_ALERTS_KV.get(key));
  if (existing) {
    await savePriceWatch(env, {
      ...existing,
      active: false,
      updatedAt: new Date().toISOString(),
      disabledReason: "user_unsubscribed",
    });
  }
  if (env.DEAL_ALERTS_KV.delete) await env.DEAL_ALERTS_KV.delete(key);
  await removePriceWatchIndex(env, key, chatId, productId);
  return { ok: true, productId };
}

async function listUserPriceWatches(env: Env, chatId: string | number) {
  if (!env.DEAL_ALERTS_KV) return [] as PriceWatchSubscription[];
  const productIds = parseStringArray(await env.DEAL_ALERTS_KV.get(priceWatchChatIndexKey(chatId)));
  const watches = await Promise.all(productIds.map((productId) => env.DEAL_ALERTS_KV!.get(priceWatchKey(chatId, productId)).then(parsePriceWatch)));
  return watches.filter((watch): watch is PriceWatchSubscription => Boolean(watch?.active));
}

function formatWatchList(watches: PriceWatchSubscription[]) {
  if (!watches.length) {
    return [
      "Пока нет активных подписок на цену.",
      "",
      "Открой разбор товара и нажми «Следить за ценой».",
    ].join("\n");
  }
  return [
    "Активные подписки на цену:",
    "",
    ...watches.slice(0, 10).map((watch, index) => (
      `${index + 1}. ${watch.title}\n` +
      `   база/последняя: ${formatMoneyValue(watch.lastPrice || watch.basePrice)} BYN; порог: ${formatMoneyValue(watch.targetPrice)} BYN\n` +
      `   ${watch.url}`
    )),
  ].join("\n");
}

function formatWatchSubscribed(subscription: PriceWatchSubscription) {
  return [
    "Подписка на цену включена.",
    "",
    subscription.title,
    `Текущая база: ${formatMoneyValue(subscription.basePrice)} BYN`,
    `Сообщу, если live Onliner покажет ${formatMoneyValue(subscription.targetPrice)} BYN или ниже.`,
    "",
    "Это не гарантия наличия товара: перед покупкой всё равно проверяй продавца и условия.",
  ].join("\n");
}

function formatWatchNotification(product: ProductView, subscription: PriceWatchSubscription) {
  const dropFromBase = subscription.basePrice > 0
    ? ((subscription.basePrice - product.currentPrice) / subscription.basePrice) * 100
    : 0;
  return [
    "Цена достигла твоего порога.",
    "",
    product.title,
    `Сейчас: ${formatMoneyValue(product.currentPrice)} BYN`,
    `Твой порог: ${formatMoneyValue(subscription.targetPrice)} BYN`,
    `От базы подписки: ${formatMoneyValue(Math.max(0, dropFromBase))}% ниже`,
    "",
    product.url,
  ].join("\n");
}

function shouldNotifyPriceWatch(subscription: PriceWatchSubscription, product: ProductView, env: Env) {
  if (!subscription.active || product.currentPrice <= 0 || product.currentPrice > subscription.targetPrice) return false;
  const cooldownHours = envNumber(env.PRICE_WATCH_NOTIFY_COOLDOWN_HOURS, DEFAULT_PRICE_WATCH_NOTIFY_COOLDOWN_HOURS);
  const lastNotifiedAt = Date.parse(subscription.lastNotifiedAt || "");
  if (!Number.isFinite(lastNotifiedAt)) return true;
  return (Date.now() - lastNotifiedAt) / 36e5 >= cooldownHours;
}

function workerPublicAppUrl(env: Env) {
  const configured = env.WORKER_PUBLIC_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    return normalized.endsWith("/app") ? normalized : `${normalized}/app`;
  }
  return "https://onliner-buyer-advocate-bot.alexaiartbel.workers.dev/app";
}

async function runPriceWatchScan(env: Env, options: PriceWatchScanOptions = {}) {
  if (!envFlag(env.ENABLE_PRICE_WATCHES)) {
    return { enabled: false, checked: 0, notified: 0, failed: 0, reason: "ENABLE_PRICE_WATCHES is not true." };
  }
  if (!env.DEAL_ALERTS_KV) {
    return { enabled: true, configured: false, checked: 0, notified: 0, failed: 0, reason: "DEAL_ALERTS_KV is not configured." };
  }

  const limit = envPositiveInt(env.PRICE_WATCH_SCAN_LIMIT, DEFAULT_PRICE_WATCH_SCAN_LIMIT, 100);
  const keys = (options.keysOverride || await readPriceWatchIndex(env)).slice(0, limit);
  const events: PriceWatchScanEvent[] = [];
  let checked = 0;
  let active = 0;
  let notified = 0;
  let failed = 0;

  for (const key of keys) {
    const subscription = parsePriceWatch(await env.DEAL_ALERTS_KV.get(key));
    if (!subscription?.active) continue;
    active += 1;
    try {
      const product = await resolveOnlinerProduct(subscription.productId, env);
      if (!product) {
        await savePriceWatch(env, { ...subscription, updatedAt: new Date().toISOString(), disabledReason: "product_not_found" });
        failed += 1;
        continue;
      }
      checked += 1;
      const now = new Date().toISOString();
      const nextSubscription: PriceWatchSubscription = {
        ...subscription,
        title: product.title,
        url: product.url,
        lastCheckedAt: now,
        lastPrice: product.currentPrice,
        updatedAt: now,
      };
      if (shouldNotifyPriceWatch(subscription, product, env)) {
        const notificationText = formatWatchNotification(product, subscription);
        try {
          if (options.dryRunDelivery) {
            events.push({
              key,
              chatId: subscription.chatId,
              productId: subscription.productId,
              deliveryStatus: "dry_run",
              currentPrice: product.currentPrice,
              targetPrice: subscription.targetPrice,
              notificationPreview: notificationText,
            });
          } else {
            await sendTelegramMessage(env, subscription.chatId, notificationText, watchReplyMarkup(workerPublicAppUrl(env), product));
            events.push({
              key,
              chatId: subscription.chatId,
              productId: subscription.productId,
              deliveryStatus: "sent",
              currentPrice: product.currentPrice,
              targetPrice: subscription.targetPrice,
            });
          }
          nextSubscription.lastNotifiedAt = now;
          notified += 1;
        } catch (error) {
          nextSubscription.active = false;
          nextSubscription.disabledReason = error instanceof Error && /forbidden|blocked/i.test(error.message)
            ? "telegram_blocked_bot"
            : "telegram_send_failed";
          failed += 1;
        }
      }
      await savePriceWatch(env, nextSubscription);
    } catch {
      failed += 1;
    }
  }

  return {
    enabled: true,
    configured: true,
    checked,
    active,
    notified,
    failed,
    scannedKeys: keys.length,
    dryRunDelivery: Boolean(options.dryRunDelivery),
    events: options.collectEvents ? events : undefined,
  };
}

async function runPriceWatchStatus(env: Env) {
  const keys = await readPriceWatchIndex(env);
  const sample = env.DEAL_ALERTS_KV
    ? await Promise.all(keys.slice(0, 20).map((key) => env.DEAL_ALERTS_KV!.get(key).then(parsePriceWatch)))
    : [];
  const scheduledAudit = await readScheduledTaskAudit(env);
  const latestScheduledRun = scheduledAudit.latestRun || null;
  const latestScheduledRunAgeHours = hoursSinceIso(latestScheduledRun?.at);
  return {
    ok: true,
    enabled: envFlag(env.ENABLE_PRICE_WATCHES),
    kvConfigured: Boolean(env.DEAL_ALERTS_KV),
    scheduledAudit: {
      configured: scheduledAudit.configured,
      latestRun: latestScheduledRun
        ? {
            at: latestScheduledRun.at,
            scheduledTime: latestScheduledRun.scheduledTime,
            cron: latestScheduledRun.cron,
            elapsedMs: latestScheduledRun.elapsedMs,
            priceWatches: latestScheduledRun.priceWatches,
          }
        : null,
      recentRuns: scheduledAudit.recentRuns.slice(0, 5),
    },
    schedulerEvidence: {
      hasSchedulerRun: Boolean(latestScheduledRun),
      schedulerRuns: scheduledAudit.recentRuns.length,
      latestScheduledRunAgeHours,
      staleAfterHours: CHANNEL_SCHEDULER_STALE_HOURS,
      latestScheduledRun: latestScheduledRun
        ? {
            at: latestScheduledRun.at,
            scheduledTime: latestScheduledRun.scheduledTime,
            cron: latestScheduledRun.cron,
            checked: latestScheduledRun.priceWatches.checked,
            active: latestScheduledRun.priceWatches.active,
            notified: latestScheduledRun.priceWatches.notified,
            failed: latestScheduledRun.priceWatches.failed,
            scannedKeys: latestScheduledRun.priceWatches.scannedKeys,
            reason: latestScheduledRun.priceWatches.reason,
            error: latestScheduledRun.priceWatches.error,
          }
        : null,
    },
    totalIndexed: keys.length,
    activeSample: sample.filter((watch) => watch?.active).length,
    scanLimit: envPositiveInt(env.PRICE_WATCH_SCAN_LIMIT, DEFAULT_PRICE_WATCH_SCAN_LIMIT, 100),
    defaultDropPercent: priceWatchDropPercent(env),
    notifyCooldownHours: envNumber(env.PRICE_WATCH_NOTIFY_COOLDOWN_HOURS, DEFAULT_PRICE_WATCH_NOTIFY_COOLDOWN_HOURS),
    recommendations: [
      ...(envFlag(env.ENABLE_PRICE_WATCHES) ? [] : ["ENABLE_PRICE_WATCHES выключен: личные подписки не сканируются scheduler-ом."]),
      ...(env.DEAL_ALERTS_KV ? [] : ["DEAL_ALERTS_KV не подключен: подписки на цену негде хранить."]),
      ...(envFlag(env.ENABLE_PRICE_WATCHES) && env.DEAL_ALERTS_KV && !latestScheduledRun
        ? ["Личные подписки включены, но durable audit еще не видел ни одного scheduled price-watch scan."]
        : []),
      ...(latestScheduledRunAgeHours !== null && latestScheduledRunAgeHours > CHANNEL_SCHEDULER_STALE_HOURS
        ? [`Последний scheduled price-watch scan старше ${CHANNEL_SCHEDULER_STALE_HOURS} часов; проверь Cloudflare Cron Triggers и Worker logs.`]
        : []),
    ],
  };
}

async function runPriceWatchDoctor(env: Env, request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const input = url.searchParams.get("input") || "redminote15p5ti";
  const product = await resolveOnlinerProduct(input, env);
  if (!product) {
    return {
      ok: false,
      readyForNotificationPath: false,
      input,
      elapsedMs: Date.now() - startedAt,
      reason: "product_not_found",
      recommendation: "Проверь другой product key или live Onliner query.",
    };
  }
  if (!Number.isFinite(product.currentPrice) || product.currentPrice <= 0) {
    return {
      ok: false,
      readyForNotificationPath: false,
      input,
      productId: product.id,
      elapsedMs: Date.now() - startedAt,
      reason: "product_has_no_current_price",
      recommendation: "Для подписки нужна проверяемая текущая цена Onliner.",
    };
  }

  const dropPercent = priceWatchDropPercent(env);
  const basePrice = Math.round((product.currentPrice / Math.max(0.01, 1 - dropPercent / 100)) * 100) / 100;
  const now = new Date().toISOString();
  const subscription: PriceWatchSubscription = {
    key: "price-watch:doctor",
    chatId: "doctor-dry-run",
    productId: product.id,
    title: product.title,
    url: product.url,
    basePrice,
    targetPrice: product.currentPrice,
    dropPercent,
    active: true,
    createdAt: now,
    updatedAt: now,
    lastPrice: product.currentPrice,
  };
  const appUrl = workerPublicAppUrl(env);
  const notificationText = formatWatchNotification(product, subscription);
  const replyMarkup = watchReplyMarkup(appUrl, product);

  return {
    ok: true,
    readyForNotificationPath: true,
    dryRun: true,
    input,
    elapsedMs: Date.now() - startedAt,
    product: {
      id: product.id,
      title: product.title,
      currentPrice: product.currentPrice,
      url: product.url,
    },
    simulatedSubscription: {
      basePrice: subscription.basePrice,
      targetPrice: subscription.targetPrice,
      dropPercent: subscription.dropPercent,
      shouldNotify: shouldNotifyPriceWatch(subscription, product, env),
    },
    notificationPreview: notificationText,
    replyMarkup,
    appUrl,
    note: "Dry-run only: no KV subscription is created and no Telegram message is sent.",
  };
}

async function runPriceWatchScanDoctor(env: Env, request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const input = url.searchParams.get("input") || "redminote15p5ti";
  if (!envFlag(env.ENABLE_PRICE_WATCHES)) {
    return {
      ok: false,
      readyForScheduledScanPath: false,
      input,
      elapsedMs: Date.now() - startedAt,
      reason: "ENABLE_PRICE_WATCHES is not true.",
    };
  }
  if (!env.DEAL_ALERTS_KV) {
    return {
      ok: false,
      readyForScheduledScanPath: false,
      input,
      elapsedMs: Date.now() - startedAt,
      reason: "DEAL_ALERTS_KV is not configured.",
    };
  }

  const product = await resolveOnlinerProduct(input, env);
  if (!product || product.currentPrice <= 0) {
    return {
      ok: false,
      readyForScheduledScanPath: false,
      input,
      elapsedMs: Date.now() - startedAt,
      reason: product ? "product_has_no_current_price" : "product_not_found",
    };
  }

  const dropPercent = priceWatchDropPercent(env);
  const basePrice = Math.round((product.currentPrice / Math.max(0.01, 1 - dropPercent / 100)) * 100) / 100;
  const chatId = `doctor-dry-run:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const key = priceWatchKey(chatId, product.id);
  const beforeKeys = await readPriceWatchIndex(env);
  const now = new Date().toISOString();
  const subscription: PriceWatchSubscription = {
    key,
    chatId,
    productId: product.id,
    title: product.title,
    url: product.url,
    basePrice,
    targetPrice: product.currentPrice,
    dropPercent,
    active: true,
    createdAt: now,
    updatedAt: now,
    lastPrice: product.currentPrice,
  };
  let scan: Awaited<ReturnType<typeof runPriceWatchScan>> | null = null;
  let storedAfterScan: PriceWatchSubscription | null = null;
  let cleanupError: string | undefined;

  try {
    await savePriceWatch(env, subscription);
    await addPriceWatchIndex(env, key, chatId, product.id);
    scan = await runPriceWatchScan(env, {
      keysOverride: [key],
      dryRunDelivery: true,
      collectEvents: true,
    });
    storedAfterScan = parsePriceWatch(await env.DEAL_ALERTS_KV.get(key));
  } finally {
    try {
      await unsubscribePriceWatch(env, chatId, product.id);
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : String(error);
    }
  }

  const afterKeys = await readPriceWatchIndex(env);
  const afterSubscription = parsePriceWatch(await env.DEAL_ALERTS_KV.get(key));
  const events = (scan?.events || []) as PriceWatchScanEvent[];
  const notificationEvent = events.find((event) => event.deliveryStatus === "dry_run") || null;
  const cleanedUp = !afterKeys.includes(key) && !afterSubscription;
  const ready = Boolean(
    scan?.enabled &&
    scan.configured &&
    scan.checked === 1 &&
    scan.active === 1 &&
    scan.notified === 1 &&
    scan.failed === 0 &&
    notificationEvent &&
    storedAfterScan?.lastNotifiedAt &&
    cleanedUp &&
    !cleanupError,
  );

  return {
    ok: ready,
    readyForScheduledScanPath: ready,
    dryRunDelivery: true,
    telegramSent: false,
    input,
    elapsedMs: Date.now() - startedAt,
    product: {
      id: product.id,
      title: product.title,
      currentPrice: product.currentPrice,
      url: product.url,
    },
    temporarySubscription: {
      key,
      created: true,
      targetPrice: subscription.targetPrice,
      basePrice: subscription.basePrice,
      wasIndexed: beforeKeys.includes(key) ? "preexisting" : true,
      lastNotifiedAtAfterScan: storedAfterScan?.lastNotifiedAt,
      cleanedUp,
      cleanupError,
    },
    scan,
    notificationPreview: notificationEvent?.notificationPreview,
    recommendation: ready
      ? undefined
      : "Scanner dry-run did not fully prove checked=1, active=1, notified=1, lastNotifiedAt persistence and cleanup.",
  };
}

function parseChannelAuditLog(value: string | null): ChannelAuditEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.id === "string") as ChannelAuditEntry[]
      : [];
  } catch {
    return [];
  }
}

function parseChannelAuditEntry(value: string | null): ChannelAuditEntry | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ChannelAuditEntry;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function parseScheduledTaskAuditLog(value: string | null): ScheduledTaskAuditEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as ScheduledTaskAuditEntry[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.at === "string") : [];
  } catch {
    return [];
  }
}

function parseScheduledTaskAuditEntry(value: string | null): ScheduledTaskAuditEntry | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ScheduledTaskAuditEntry;
    return parsed && typeof parsed.at === "string" ? parsed : null;
  } catch {
    return null;
  }
}

async function readScheduledTaskAudit(env: Env) {
  if (!env.DEAL_ALERTS_KV) {
    return { configured: false, latestRun: null, recentRuns: [] as ScheduledTaskAuditEntry[] };
  }
  return {
    configured: true,
    latestRun: parseScheduledTaskAuditEntry(await env.DEAL_ALERTS_KV.get(SCHEDULED_TASK_AUDIT_LATEST_KEY)),
    recentRuns: parseScheduledTaskAuditLog(await env.DEAL_ALERTS_KV.get(SCHEDULED_TASK_AUDIT_LOG_KEY)),
  };
}

function channelAuditProduct(product?: ProductView | null): ChannelAuditEntry["selected"] | undefined {
  if (!product) return undefined;
  return {
    id: product.id,
    title: product.title,
    price: product.currentPrice,
    honestDiscountPercent: product.honestDiscountPercent,
    url: product.url,
    externalSources: product.priceComparison.sources
      .filter((source) => source.source !== "onliner_marketplace" && source.source !== "external_sites")
      .map((source) => ({
        source: source.source,
        sourceType: source.sourceType,
        confidence: source.confidence,
        label: source.label,
        status: source.status,
        offersCount: source.offersCount,
        minPrice: source.minPrice,
        maxPrice: source.maxPrice,
      })),
  };
}

async function recordChannelAudit(
  env: Env,
  result: any,
  options: PublishBestDealOptions,
  startedAt: number,
  error?: unknown,
) {
  if (!env.DEAL_ALERTS_KV) return;
  const entry: ChannelAuditEntry = {
    id: `${new Date(startedAt).toISOString()}:${options.trigger}:${Math.random().toString(36).slice(2, 8)}`,
    at: new Date(startedAt).toISOString(),
    trigger: options.trigger,
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    published: Boolean(result?.published),
    reason: result?.reason || result?.dedupe?.reason,
    error: error instanceof Error ? error.message : error ? String(error) : undefined,
    dealsCount: typeof result?.dealsCount === "number" ? result.dealsCount : undefined,
    elapsedMs: Date.now() - startedAt,
    selected: channelAuditProduct(result?.selected),
    dedupe: result?.dedupe
      ? {
          enabled: Boolean(result.dedupe.enabled),
          reason: result.dedupe.reason,
        }
      : undefined,
    postTextPreview: typeof result?.postText === "string" ? result.postText.slice(0, 1000) : undefined,
  };
  const previous = parseChannelAuditLog(await env.DEAL_ALERTS_KV.get(CHANNEL_AUDIT_LOG_KEY));
  const next = [entry, ...previous].slice(0, CHANNEL_AUDIT_LIMIT);
  const ttl = Math.ceil(Math.max(168, envNumber(env.DEAL_REPOST_COOLDOWN_HOURS, 72) * 3) * 3600);
  await env.DEAL_ALERTS_KV.put(CHANNEL_AUDIT_LATEST_KEY, JSON.stringify(entry), { expirationTtl: ttl });
  await env.DEAL_ALERTS_KV.put(CHANNEL_AUDIT_LOG_KEY, JSON.stringify(next), { expirationTtl: ttl });
}

function scheduledEventTime(event?: ScheduledEvent) {
  return event?.scheduledTime ? new Date(event.scheduledTime).toISOString() : undefined;
}

function scheduledChannelSummary(result: unknown): ScheduledTaskAuditEntry["channel"] {
  const value = result && typeof result === "object" ? result as any : {};
  return {
    published: typeof value.published === "boolean" ? value.published : undefined,
    reason: typeof value.reason === "string" ? value.reason : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    dealsCount: typeof value.dealsCount === "number" ? value.dealsCount : undefined,
    selectedId: typeof value.selected?.id === "string" ? value.selected.id : undefined,
  };
}

function scheduledPriceWatchSummary(result: unknown): ScheduledTaskAuditEntry["priceWatches"] {
  const value = result && typeof result === "object" ? result as any : {};
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : undefined,
    configured: typeof value.configured === "boolean" ? value.configured : undefined,
    checked: typeof value.checked === "number" ? value.checked : undefined,
    active: typeof value.active === "number" ? value.active : undefined,
    notified: typeof value.notified === "number" ? value.notified : undefined,
    failed: typeof value.failed === "number" ? value.failed : undefined,
    scannedKeys: typeof value.scannedKeys === "number" ? value.scannedKeys : undefined,
    reason: typeof value.reason === "string" ? value.reason : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
  };
}

async function recordScheduledTaskAudit(
  env: Env,
  event: ScheduledEvent | undefined,
  result: { channel: unknown; priceWatches: unknown },
  startedAt: number,
) {
  if (!env.DEAL_ALERTS_KV) return;
  const entry: ScheduledTaskAuditEntry = {
    id: `${new Date(startedAt).toISOString()}:scheduled:${Math.random().toString(36).slice(2, 8)}`,
    at: new Date(startedAt).toISOString(),
    scheduledTime: scheduledEventTime(event),
    cron: event?.cron,
    elapsedMs: Date.now() - startedAt,
    channel: scheduledChannelSummary(result.channel),
    priceWatches: scheduledPriceWatchSummary(result.priceWatches),
  };
  const previous = parseScheduledTaskAuditLog(await env.DEAL_ALERTS_KV.get(SCHEDULED_TASK_AUDIT_LOG_KEY));
  const next = [entry, ...previous].slice(0, SCHEDULED_TASK_AUDIT_LIMIT);
  const ttl = Math.ceil(Math.max(168, envNumber(env.DEAL_REPOST_COOLDOWN_HOURS, 72) * 3) * 3600);
  await env.DEAL_ALERTS_KV.put(SCHEDULED_TASK_AUDIT_LATEST_KEY, JSON.stringify(entry), { expirationTtl: ttl });
  await env.DEAL_ALERTS_KV.put(SCHEDULED_TASK_AUDIT_LOG_KEY, JSON.stringify(next), { expirationTtl: ttl });
}

async function readChannelAudit(env: Env) {
  if (!env.DEAL_ALERTS_KV) {
    return { configured: false, latestRun: null, recentRuns: [] as ChannelAuditEntry[] };
  }
  return {
    configured: true,
    latestRun: parseChannelAuditEntry(await env.DEAL_ALERTS_KV.get(CHANNEL_AUDIT_LATEST_KEY)),
    recentRuns: parseChannelAuditLog(await env.DEAL_ALERTS_KV.get(CHANNEL_AUDIT_LOG_KEY)),
  };
}

function hoursSinceIso(value: string | undefined, now = Date.now()) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.round(((now - timestamp) / 36e5) * 10) / 10;
}

async function checkDealDedupe(env: Env, product: ProductView, force: boolean | undefined) {
  if (force) return { shouldPublish: true, enabled: Boolean(env.DEAL_ALERTS_KV), reason: "force_publish" };
  if (!env.DEAL_ALERTS_KV) {
    return { shouldPublish: true, enabled: false, reason: "DEAL_ALERTS_KV is not configured; duplicate protection is unavailable." };
  }

  const previous = parseDealPublishState(await env.DEAL_ALERTS_KV.get(dealPublishStateKey(product)));
  if (!previous) return { shouldPublish: true, enabled: true, reason: "first_publish" };

  const cooldownHours = envNumber(env.DEAL_REPOST_COOLDOWN_HOURS, 72);
  const minPriceDropPercent = envNumber(env.DEAL_REPOST_PRICE_DROP_PERCENT, 2);
  const previousAt = Date.parse(previous.postedAt);
  const hoursSince = Number.isFinite(previousAt) ? (Date.now() - previousAt) / 36e5 : cooldownHours;
  const priceDropPercent = previous.price > 0 ? ((previous.price - product.currentPrice) / previous.price) * 100 : 0;

  if (priceDropPercent >= minPriceDropPercent) {
    return {
      shouldPublish: true,
      enabled: true,
      reason: `price_drop_${formatMoneyValue(priceDropPercent)}pct_since_last_post`,
      previous,
    };
  }

  if (hoursSince >= cooldownHours) {
    return {
      shouldPublish: true,
      enabled: true,
      reason: `cooldown_expired_${Math.floor(hoursSince)}h`,
      previous,
    };
  }

  return {
    shouldPublish: false,
    enabled: true,
    reason: `duplicate_suppressed_${Math.max(0, Math.floor(cooldownHours - hoursSince))}h_left`,
    previous,
  };
}

async function rememberDealPublish(env: Env, product: ProductView, status: DealPublishState["status"] = "posted") {
  if (!env.DEAL_ALERTS_KV) return;
  const ttl = Math.ceil(envNumber(env.DEAL_REPOST_COOLDOWN_HOURS, 72) * 3600 * 2);
  await env.DEAL_ALERTS_KV.put(dealPublishStateKey(product), JSON.stringify(dealPublishState(product, status)), {
    expirationTtl: ttl,
  });
}

async function clearDealPublishReservation(env: Env, product: ProductView) {
  if (!env.DEAL_ALERTS_KV?.delete) return;
  const key = dealPublishStateKey(product);
  const current = parseDealPublishState(await env.DEAL_ALERTS_KV.get(key));
  if (current?.productId === product.id && current.status === "reserved") {
    await env.DEAL_ALERTS_KV.delete(key);
  }
}

async function publishBestDealCore(env: Env, options: PublishBestDealOptions = { trigger: "manual" }) {
  const deals = await findDeals(env);
  if (!deals.length) {
    return { published: false, reason: "No honest live Onliner deals matched the filter.", dealsCount: 0 };
  }
  if (!env.TELEGRAM_CHANNEL_ID) {
    return { published: false, reason: "TELEGRAM_CHANNEL_ID is not configured.", dealsCount: deals.length };
  }
  if (env.ENABLE_TELEGRAM_DELIVERY !== "true") {
    return { published: false, reason: "ENABLE_TELEGRAM_DELIVERY is not true.", dealsCount: deals.length };
  }

  const publishedDeals: ProductView[] = [];
  const limit = (options.trigger === "manual" || options.dryRun) ? 1 : 3;
  let firstDedupe: any = undefined;

  for (const deal of deals) {
    if (publishedDeals.length >= limit) break;

    const isFirst = publishedDeals.length === 0;
    const minPercent = isFirst ? envNumber(env.MIN_HONEST_DISCOUNT_PERCENT, 20) : 25;
    if (deal.honestDiscountPercent < minPercent) {
      continue;
    }

    const dedupe = await checkDealDedupe(env, deal, options.force);
    if (isFirst) {
      firstDedupe = dedupe;
    }
    if (!dedupe.shouldPublish) {
      if (isFirst && limit === 1) {
        return { published: false, reason: dedupe.reason, dealsCount: deals.length, selected: deal, dedupe };
      }
      continue;
    }

    const selectedForPost = await enrichSelectedDealForChannel(deal, env);
    const postText = formatChannelPost(selectedForPost);

    if (options.dryRun) {
      return { published: false, dryRun: true, dealsCount: deals.length, selected: selectedForPost, dedupe, trigger: options.trigger, postText };
    }

    await rememberDealPublish(env, selectedForPost, "reserved");
    try {
      await sendTelegramMessage(env, env.TELEGRAM_CHANNEL_ID, postText);
      await rememberDealPublish(env, selectedForPost, "posted");
      publishedDeals.push(selectedForPost);
      if (limit > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } catch (error) {
      await clearDealPublishReservation(env, selectedForPost).catch(() => undefined);
      console.error(`Failed to publish scheduled deal: ${deal.title}`, error);
      if (isFirst) throw error;
    }
  }

  return {
    published: publishedDeals.length > 0,
    publishedCount: publishedDeals.length,
    dealsCount: deals.length,
    selected: deals[0] || null,
    publishedDeals,
    trigger: options.trigger,
    dedupe: firstDedupe,
    reason: publishedDeals.length === 0 ? (firstDedupe?.reason || "No deals published") : undefined,
  };
}

async function publishBestDeal(env: Env, options: PublishBestDealOptions = { trigger: "manual" }) {
  const startedAt = Date.now();
  try {
    const result = await publishBestDealCore(env, options);
    await recordChannelAudit(env, result, options, startedAt).catch((error) => console.error("Channel audit write failed", error));
    return result;
  } catch (error) {
    const result = {
      published: false,
      reason: "publish_exception",
      error: error instanceof Error ? error.message : String(error),
    };
    await recordChannelAudit(env, result, options, startedAt, error).catch((auditError) => console.error("Channel audit write failed", auditError));
    throw error;
  }
}

async function runScheduledBestDeal(env: Env) {
  if (!envFlag(env.ENABLE_CHANNEL_CRON)) {
    return { published: false, reason: "ENABLE_CHANNEL_CRON is not true." };
  }
  return publishBestDeal(env, { trigger: "scheduler" });
}

async function runScheduledTasks(env: Env, event?: ScheduledEvent) {
  const startedAt = Date.now();
  const [channel, priceWatches] = await Promise.allSettled([
    runScheduledBestDeal(env),
    runPriceWatchScan(env),
  ]);
  const result = {
    channel: channel.status === "fulfilled"
      ? channel.value
      : { ok: false, error: channel.reason instanceof Error ? channel.reason.message : String(channel.reason) },
    priceWatches: priceWatches.status === "fulfilled"
      ? priceWatches.value
      : { ok: false, error: priceWatches.reason instanceof Error ? priceWatches.reason.message : String(priceWatches.reason) },
  };
  await recordScheduledTaskAudit(env, event, result, startedAt).catch((error) => console.error("Scheduled task audit write failed", error));
  return result;
}

async function enrichSelectedDealForChannel(product: ProductView, env: Env) {
  if (!envFlag(env.ENABLE_5ELEMENT_PILOT)) return product;
  try {
    return await productFromOnliner(await getOnlinerProductByKey(product.id, env), env);
  } catch {
    return product;
  }
}

async function runExternalPriceDoctor(env: Env, request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const input = url.searchParams.get("input") || "redminote15p5ti";
  const fiveElementEnabled = envFlag(env.ENABLE_5ELEMENT_PILOT);
  const fiveElementKeyConfigured = Boolean(env.FIVE_ELEMENT_SEARCH_API_KEY?.trim());
  const product = fiveElementEnabled && fiveElementKeyConfigured
    ? await resolveOnlinerProduct(input, env)
    : null;
  const source = product?.priceComparison.sources.find((item) => item.source === "external_5element") || null;
  const ready = Boolean(source?.status === "ok" && source.offersCount > 0);

  return {
    ok: ready,
    readyForExternalPricePilot: ready,
    elapsedMs: Date.now() - startedAt,
    input,
    product: product
      ? {
          id: product.id,
          title: product.title,
          currentPrice: product.currentPrice,
          url: product.url,
        }
      : null,
    fiveElement: {
      enabled: fiveElementEnabled,
      keyConfigured: fiveElementKeyConfigured,
      source,
      recommendation: ready
        ? undefined
        : "5 элемент pilot не готов для этого товара: проверь ENABLE_5ELEMENT_PILOT, FIVE_ELEMENT_SEARCH_API_KEY или точность совпадения карточки.",
    },
  };
}

async function runChannelStatus(env: Env) {
  const audit = await readChannelAudit(env);
  const scheduledTaskAudit = await readScheduledTaskAudit(env);
  const channelCronEnabled = envFlag(env.ENABLE_CHANNEL_CRON);
  const schedulerRuns = audit.recentRuns.filter((run) => run.trigger === "scheduler");
  const latestSchedulerRun = schedulerRuns[0] || null;
  const latestRunAgeHours = hoursSinceIso(audit.latestRun?.at);
  const latestSchedulerRunAgeHours = hoursSinceIso(latestSchedulerRun?.at);
  const schedulerEvidence = {
    hasSchedulerRun: Boolean(latestSchedulerRun),
    schedulerRuns: schedulerRuns.length,
    latestRunAgeHours,
    latestSchedulerRunAgeHours,
    staleAfterHours: CHANNEL_SCHEDULER_STALE_HOURS,
    latestSchedulerRun: latestSchedulerRun
      ? {
          at: latestSchedulerRun.at,
          published: latestSchedulerRun.published,
          reason: latestSchedulerRun.reason,
          selectedId: latestSchedulerRun.selected?.id,
        }
      : null,
  };
  return {
    ok: true,
    channelConfigured: Boolean(env.TELEGRAM_CHANNEL_ID),
    deliveryEnabled: envFlag(env.ENABLE_TELEGRAM_DELIVERY),
    channelCronEnabled,
    dealDedupeConfigured: Boolean(env.DEAL_ALERTS_KV),
    externalPricePilotEnabled: envFlag(env.ENABLE_5ELEMENT_PILOT),
    audit,
    scheduledTaskAudit: {
      configured: scheduledTaskAudit.configured,
      latestRun: scheduledTaskAudit.latestRun
        ? {
            at: scheduledTaskAudit.latestRun.at,
            scheduledTime: scheduledTaskAudit.latestRun.scheduledTime,
            cron: scheduledTaskAudit.latestRun.cron,
            elapsedMs: scheduledTaskAudit.latestRun.elapsedMs,
            channel: scheduledTaskAudit.latestRun.channel,
            priceWatches: scheduledTaskAudit.latestRun.priceWatches,
          }
        : null,
      recentRuns: scheduledTaskAudit.recentRuns.slice(0, 5),
    },
    schedulerEvidence,
    recommendations: [
      ...(env.DEAL_ALERTS_KV ? [] : ["DEAL_ALERTS_KV не подключен: нет durable audit/dedupe для канала."]),
      ...(audit.latestRun ? [] : ["Пока нет сохраненных channel audit runs; запусти dry-run или дождись cron."]),
      ...(channelCronEnabled && audit.latestRun && !latestSchedulerRun
        ? ["Worker cron включен, но в durable audit пока нет ни одного scheduler-run; дождись Cloudflare cron или проверь расписание."]
        : []),
      ...(channelCronEnabled && latestSchedulerRunAgeHours !== null && latestSchedulerRunAgeHours > CHANNEL_SCHEDULER_STALE_HOURS
        ? [`Последний scheduler-run старше ${CHANNEL_SCHEDULER_STALE_HOURS} часов; проверь Cloudflare Cron Triggers и Worker logs.`]
        : []),
    ],
  };
}

async function handleWebAppAnalyze(request: Request, env: Env) {
  const body = await request.json().catch(() => ({})) as {
    queryId?: unknown;
    initData?: unknown;
    key?: unknown;
    url?: unknown;
    query?: unknown;
    title?: unknown;
  };
  const queryId = String(body.queryId || "").trim();
  const initData = String(body.initData || "").trim();
  const lookup = String(body.key || body.url || body.query || body.title || "").trim();
  const appUrl = webAppUrlFromRequest(request);

  if (!queryId) return json({ ok: false, error: "queryId is required" }, 400);
  if (!initData) return json({ ok: false, error: "Telegram initData is required" }, 403);
  if (!lookup) return json({ ok: false, error: "product lookup is required" }, 400);

  const validation = await verifyTelegramWebAppInitData(initData, env.TELEGRAM_BOT_TOKEN, queryId);
  if (!validation.ok) return json({ ok: false, error: validation.error }, 403);

  const product = await resolveOnlinerProduct(lookup, env);
  const result = product
    ? productWebAppQueryResult(appUrl, product)
    : productNotFoundWebAppQueryResult(appUrl);

  await callTelegram(env, "answerWebAppQuery", {
    web_app_query_id: queryId,
    result,
  });

  if (product) {
    await autoPublishRareDeal(product, env).catch((e) => console.error("AutoPublish rare deal failed:", e));
  }

  return json({
    ok: true,
    found: Boolean(product),
    source: "answer_web_app_query",
    productId: product?.id,
  });
}

async function autoPublishRareDeal(product: ProductView, env: Env) {
  if (!env.TELEGRAM_CHANNEL_ID || env.ENABLE_TELEGRAM_DELIVERY !== "true") return;

  const rareThreshold = envPositiveInt(env.AUTO_PUBLISH_RARE_THRESHOLD_PERCENT, 35, 100);
  if (!isPublishableDeal(product, rareThreshold, env)) return;

  const dedupe = await checkDealDedupe(env, product, false);
  if (!dedupe.shouldPublish) return;

  const selectedForPost = await enrichSelectedDealForChannel(product, env);
  const postText = formatChannelPost(selectedForPost);

  await rememberDealPublish(env, selectedForPost, "reserved");
  try {
    await sendTelegramMessage(env, env.TELEGRAM_CHANNEL_ID, postText);
    await rememberDealPublish(env, selectedForPost, "posted");
    console.log(`[AutoPublish] Successfully published rare deal: ${product.title} (${product.honestDiscountPercent}% discount)`);
  } catch (error) {
    await clearDealPublishReservation(env, selectedForPost).catch(() => undefined);
    console.error("[AutoPublish] Failed to publish rare deal:", error);
  }
}

async function handleTelegramWebhook(request: Request, env: Env) {
  if (env.TELEGRAM_WEBHOOK_SECRET && request.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ ok: false, error: "Invalid Telegram webhook secret" }, 403);
  }

  const update = await request.json().catch(() => ({})) as any;
  const callbackQuery = update.callback_query;
  const message = update.message || update.edited_message;
  const callbackData = String(callbackQuery?.data || "").trim();
  const callbackChatId = callbackQuery?.message?.chat?.id;
  const chatId = message?.chat?.id;
  const webAppData = String(message?.web_app_data?.data || "").trim();
  const value = String(message?.text || "").trim();
  const appUrl = webAppUrlFromRequest(request);

  if (callbackQuery && (callbackData.startsWith("watch:") || callbackData.startsWith("unwatch:"))) {
    const action = callbackData.startsWith("watch:") ? "watch" : "unwatch";
    const productKey = callbackData.slice(`${action}:`.length).trim();
    if (!callbackChatId || !productKey) return json({ ok: true, ignored: true, reason: "invalid_watch_callback" });

    if (action === "unwatch") {
      const result = await unsubscribePriceWatch(env, callbackChatId, productKey);
      if (callbackQuery.id) {
        await callTelegram(env, "answerCallbackQuery", {
          callback_query_id: callbackQuery.id,
          text: result.ok ? "Подписка отключена." : "Не удалось отключить подписку.",
        }).catch(() => undefined);
      }
      await sendTelegramMessage(env, callbackChatId, result.ok ? "Больше не слежу за этой ценой." : "Не удалось отключить подписку: " + result.reason, catalogReplyMarkup(appUrl));
      return json({ ok: result.ok, source: "price_watch_unsubscribe", productId: productKey, reason: result.reason });
    }

    const product = await resolveOnlinerProduct(productKey, env);
    if (!product) {
      await sendTelegramMessage(env, callbackChatId, "Не нашел выбранный товар в live Onliner. Открой каталог и выбери товар еще раз.", catalogInlineMarkup(appUrl));
      return json({ ok: true, found: false, source: "price_watch_subscribe" });
    }
    const result = await subscribePriceWatch(env, callbackChatId, product);
    if (callbackQuery.id) {
      await callTelegram(env, "answerCallbackQuery", {
        callback_query_id: callbackQuery.id,
        text: result.ok ? "Буду следить за ценой." : "Подписка недоступна.",
      }).catch(() => undefined);
    }
    await sendTelegramMessage(
      env,
      callbackChatId,
      result.ok ? formatWatchSubscribed(result.subscription) : "Подписки на цену пока недоступны: " + result.reason,
      result.ok ? watchReplyMarkup(appUrl, product) : catalogInlineMarkup(appUrl),
    );
    return json({
      ok: result.ok,
      found: true,
      source: "price_watch_subscribe",
      productId: product.id,
      targetPrice: result.subscription?.targetPrice,
      reason: result.reason,
    });
  }

  if (callbackQuery && callbackData.startsWith("analyze:")) {
    const productKey = callbackData.slice("analyze:".length).trim();
    if (callbackQuery.id) {
      try {
        await callTelegram(env, "answerCallbackQuery", {
          callback_query_id: callbackQuery.id,
          text: "Разбираю выбранный товар...",
        });
      } catch {
        // The product answer is more important than clearing the button spinner.
      }
    }
    if (!callbackChatId || !productKey) return json({ ok: true, ignored: true, reason: "invalid_callback" });

    const product = await resolveOnlinerProduct(productKey, env);
    if (!product) {
      await sendTelegramMessage(env, callbackChatId, "Не нашел выбранный товар в live Onliner. Открой каталог и выбери товар еще раз.", catalogInlineMarkup(appUrl));
      return json({ ok: true, found: false, source: "callback_query" });
    }

    await sendTelegramMessage(env, callbackChatId, formatProductAnswer(product), productReplyMarkup(appUrl, product));
    await autoPublishRareDeal(product, env).catch((e) => console.error("AutoPublish rare deal failed:", e));
    return json({ ok: true, found: true, source: "callback_query", productId: product.id });
  }

  if (isOwnInlineResultMessage(message, env)) {
    return json({ ok: true, ignored: true, reason: "own_inline_result" });
  }

  if (chatId && webAppData) {
    let payload: { type?: string; key?: string; query?: string; title?: string; url?: string } = {};
    try {
      payload = JSON.parse(webAppData);
    } catch {
      await sendTelegramMessage(env, chatId, "Каталог отправил нечитаемые данные. Открой каталог заново.", catalogReplyMarkup(appUrl));
      return json({ ok: true, webAppData: false });
    }

    const lookup = payload.key || payload.url || payload.query || payload.title || "";
    if (payload.type !== "analyze_product" || !lookup) {
      await sendTelegramMessage(env, chatId, "Не понял выбор из каталога. Открой каталог и выбери товар еще раз.", catalogReplyMarkup(appUrl));
      return json({ ok: true, webAppData: false });
    }

    const product = await resolveOnlinerProduct(lookup, env);
    if (!product) {
      await sendTelegramMessage(env, chatId, "Не нашел выбранный товар в live Onliner. Попробуй другой запрос.", catalogReplyMarkup(appUrl));
      return json({ ok: true, found: false, source: "web_app_data" });
    }

    await sendTelegramMessage(env, chatId, formatProductAnswer(product), productReplyMarkup(appUrl, product));
    await autoPublishRareDeal(product, env).catch((e) => console.error("AutoPublish rare deal failed:", e));
    return json({ ok: true, found: true, source: "web_app_data", productId: product.id });
  }

  if (!chatId || !value) return json({ ok: true, ignored: true });

  if (value === "/start" || value === "/help") {
    await sendTelegramMessage(env, chatId, [
      "🛡️ *Адвокат Покупателя BY* — твой гид по честным скидкам на catalog.onliner.by!",
      "",
      "🔍 *Что я умею:*",
      "• Анализирую историю цен и рассчитываю реальную (честную) скидку на основе медианной цены.",
      "• Выявляю фейковые скидки и предупреждаю о манипуляциях с ценами.",
      "• Слежу за ценами товаров из твоего списка ожидания и присылаю уведомления об их снижении.",
      "",
      "⚡ *Как пользоваться:*",
      "• Открой интерактивный каталог кнопкой ниже.",
      "• Или просто пришли мне ссылку на товар Onliner либо точное название модели.",
      "",
      "📢 *Наш Telegram-канал:*",
      "Подписывайся на @BuyerAdvocateBYDeals, где автоматически публикуются самые горячие и проверенные скидки без накруток!",
      "",
      "Команды: /catalog, /deals, /watchlist, /health",
    ].join("\n"), catalogInlineMarkup(appUrl));
    return json({ ok: true });
  }

  if (value === "/catalog") {
    await sendTelegramMessage(env, chatId, formatCatalogInvite(appUrl), catalogInlineMarkup(appUrl));
    return json({ ok: true });
  }

  if (value === "/health" || value === "🏥 Статус") {
    await sendTelegramMessage(env, chatId, formatBotHealthStatus(env), catalogReplyMarkup(appUrl));
    return json({ ok: true });
  }

  if (value === "/deals" || value === "🔥 Проверить скидки") {
    const deals = await findDeals(env);
    await sendTelegramMessage(
      env,
      chatId,
      formatDealsAnswer(deals, env),
      deals.length ? dealsReplyMarkup(appUrl, deals) : catalogReplyMarkup(appUrl),
    );
    return json({ ok: true, dealsCount: deals.length });
  }

  if (value === "/watchlist" || value === "👀 Мои подписки") {
    const watches = await listUserPriceWatches(env, chatId);
    await sendTelegramMessage(env, chatId, formatWatchList(watches), catalogReplyMarkup(appUrl));
    return json({ ok: true, source: "price_watch_list", watchesCount: watches.length });
  }

  const choices = await findOnlinerProductChoices(value, env, 5);
  if (choices.length > 1) {
    await sendTelegramMessage(env, chatId, formatProductChoices(value, choices), productChoicesReplyMarkup(appUrl, choices));
    return json({
      ok: true,
      found: true,
      source: "product_choices",
      choicesCount: choices.length,
      productIds: choices.map((product) => product.key),
    });
  }

  const product = choices.length === 1
    ? await resolveOnlinerProduct(choices[0].key, env)
    : await resolveOnlinerProduct(value, env);
  if (!product) {
    await sendTelegramMessage(env, chatId, "Не нашел товар в live Onliner. Открой каталог или пришли более конкретное название.", catalogReplyMarkup(appUrl));
    return json({ ok: true, found: false });
  }

  await sendTelegramMessage(env, chatId, formatProductAnswer(product), productReplyMarkup(appUrl, product));
  await autoPublishRareDeal(product, env).catch((e) => console.error("AutoPublish rare deal failed:", e));
  return json({ ok: true, found: true, productId: product.id });
}

async function handleRequest(request: Request, env: Env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/") {
    return text("Onliner Buyer Advocate Worker is online.");
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({
      ok: true,
      runtime: "cloudflare-worker",
      telegram: {
        tokenConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
        channelConfigured: Boolean(env.TELEGRAM_CHANNEL_ID && !env.TELEGRAM_CHANNEL_ID.includes("@your_")),
        webhookSecretConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
        deliveryEnabled: env.ENABLE_TELEGRAM_DELIVERY === "true",
      },
      onliner: {
        query: env.ONLINER_POLL_QUERY || "redmi",
        minDiscountPercent: Number(env.MIN_HONEST_DISCOUNT_PERCENT || 20),
      },
      publicApiRateLimit: {
        configured: Boolean(env.PUBLIC_API_RATE_LIMITER || env.DEAL_ALERTS_KV),
        bindingConfigured: Boolean(env.PUBLIC_API_RATE_LIMITER),
        fallbackKvConfigured: Boolean(env.DEAL_ALERTS_KV),
        ...publicRateLimitConfig(env),
      },
    });
  }

  if (url.pathname === "/telegram/webhook" && request.method === "POST") {
    return handleTelegramWebhook(request, env);
  }

  if (request.method === "GET" && url.pathname === "/app") {
    return html(catalogAppHtml());
  }

  if (request.method === "POST" && url.pathname === "/api/webapp/analyze") {
    try {
      return await handleWebAppAnalyze(request, env);
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (request.method === "GET" && url.pathname === "/api/catalog/categories") {
    return json({ ok: true, categories: CATALOG_CATEGORIES });
  }

  if (request.method === "GET" && url.pathname === "/api/catalog/search") {
    const limited = await checkPublicApiRateLimit(request, env, "catalog-search");
    if (limited) return limited;
    try {
      return json(await catalogSearch(request, env));
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (request.method === "GET" && url.pathname === "/api/catalog/product") {
    const limited = await checkPublicApiRateLimit(request, env, "catalog-product");
    if (limited) return limited;
    const input = url.searchParams.get("input") || url.searchParams.get("key") || "";
    if (!input.trim()) return json({ ok: false, error: "input is required" }, 400);
    try {
      const product = await resolveOnlinerProduct(input, env);
      return json({ ok: Boolean(product), product });
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (request.method === "GET" && url.pathname === "/api/catalog/deals") {
    const limited = await checkPublicApiRateLimit(request, env, "catalog-deals");
    if (limited) return limited;
    try {
      const minDiscountPercent = Number(url.searchParams.get("minDiscountPercent"));
      const deals = await findDeals(env, { minDiscountPercent });
      return json({ ok: true, deals });
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (url.pathname === "/api/onliner/deals-doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    const minDiscountPercent = Number(url.searchParams.get("minDiscountPercent"));
    return json(await runOnlinerDealsDoctor(env, { minDiscountPercent }));
  }

  if (url.pathname === "/api/telegram/doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    return json(await runTelegramDoctor(env, request));
  }

  if (url.pathname === "/api/telegram/set-webhook" && request.method === "POST") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    const body = await request.json().catch(() => ({})) as { webhookUrl?: string };
    if (!body.webhookUrl) return json({ error: "webhookUrl is required" }, 400);
    const result = await callTelegram(env, "setWebhook", {
      url: body.webhookUrl,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ["message", "callback_query"],
    });
    return json({ ok: true, result });
  }

  if (url.pathname === "/api/onliner/doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    const query = url.searchParams.get("query") || env.ONLINER_POLL_QUERY || "redmi note 15 pro";
    const startedAt = Date.now();
    try {
      const product = await resolveOnlinerProduct(query, env);
      return json({
        ok: Boolean(product),
        readyForLiveSource: Boolean(product && product.currentPrice > 0 && product.historyPoints.length >= 2),
        status: product ? "live_ok" : "not_found",
        elapsedMs: Date.now() - startedAt,
        product,
      });
    } catch (error) {
      return json({
        ok: false,
        readyForLiveSource: false,
        status: "live_failed",
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (url.pathname === "/api/external-price/doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    try {
      return json(await runExternalPriceDoctor(env, request));
    } catch (error) {
      return json({
        ok: false,
        readyForExternalPricePilot: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (url.pathname === "/api/channel/status" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    return json(await runChannelStatus(env));
  }

  if (url.pathname === "/api/price-watch/status" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    return json(await runPriceWatchStatus(env));
  }

  if (url.pathname === "/api/price-watch/doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    try {
      return json(await runPriceWatchDoctor(env, request));
    } catch (error) {
      return json({
        ok: false,
        readyForNotificationPath: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (url.pathname === "/api/price-watch/scan-doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    try {
      return json(await runPriceWatchScanDoctor(env, request));
    } catch (error) {
      return json({
        ok: false,
        readyForScheduledScanPath: false,
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  if (url.pathname === "/api/rate-limit/doctor" && request.method === "GET") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    return json(await runRateLimitDoctor(request, env));
  }

  if (url.pathname === "/api/channel/publish-best-deals" && request.method === "POST") {
    if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    const body = await request.json().catch(() => ({})) as { force?: unknown; dryRun?: unknown; publishToTelegram?: unknown };
    try {
      return json(await publishBestDeal(env, {
        trigger: "manual",
        force: body.force === true,
        dryRun: body.dryRun === true || body.publishToTelegram === false,
      }));
    } catch (error) {
      return json({
        ok: false,
        published: false,
        reason: "publish_exception",
        error: error instanceof Error ? error.message : String(error),
      }, 502);
    }
  }

  return json({ error: "Not found" }, 404);
}

export default {
  fetch: handleRequest,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledTasks(env, event).catch((error) => console.error("Scheduled tasks failed", error)));
  },
};
