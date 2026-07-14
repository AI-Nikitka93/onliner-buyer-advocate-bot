import { ValueForMoney } from "../types";
import type { PriceHistoryPoint, Product, ReviewEvidence, ReviewInsight } from "../types";

const CATALOG_SDAPI_BASE = "https://catalog.onliner.by/sdapi/catalog.api";
const CATALOG_API_BASE = "https://catalog.api.onliner.by";
const SHOP_API_BASE = "https://shop.api.onliner.by";
const DEFAULT_DEAL_SCAN_LIMIT = 50;
const DEFAULT_DEAL_ANALYZE_LIMIT = 4;
const DEFAULT_DEAL_MIN_PRICE_BYN = 15;
const DEFAULT_DEAL_MIN_OFFERS = 2;

const DEFAULT_SEARCH_SCHEMAS = [
  "mobile",
  "notebook",
  "tv",
  "headphones",
  "tabletpc",
  "watch",
  "videocard",
  "styler",
];

type OnlinerMoney = {
  amount?: string;
  currency?: string;
};

type OnlinerProduct = {
  id: number;
  key: string;
  name?: string;
  name_prefix?: string;
  full_name?: string;
  extended_name?: string;
  status?: string;
  description?: string;
  description_list?: string[];
  micro_description_list?: string[];
  html_url?: string;
  images?: { header?: string };
  manufacturer?: { name?: string };
  reviews?: {
    rating?: number;
    count?: number;
    html_url?: string;
    url?: string;
  };
  sale?: {
    is_on_sale?: boolean;
    discount?: number;
    min_prices_median?: OnlinerMoney;
  };
  prices?: {
    price_min?: OnlinerMoney;
    price_max?: OnlinerMoney;
    offers?: { count?: number };
    html_url?: string;
    url?: string;
  };
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

type OnlinerPositionsResponse = {
  positions?: {
    primary?: Array<{
      position_price?: OnlinerMoney;
      shop?: { title?: string };
    }>;
    secondary?: Array<{
      position_price?: OnlinerMoney;
      shop?: { title?: string };
    }>;
  };
};

type OnlinerPriceHistoryResponse = {
  prices?: {
    current?: OnlinerMoney;
    min?: OnlinerMoney;
    max?: OnlinerMoney;
  };
  sale?: {
    is_on_sale?: boolean;
    discount?: number;
    min_prices_median?: OnlinerMoney;
  };
  chart_data?: {
    currency?: string;
    items?: Array<{
      date?: string;
      price?: string | null;
    }>;
  };
};

type NormalizedPriceHistory = {
  response: OnlinerPriceHistoryResponse;
  period: "2m" | "12m";
  endpoint: string;
  points: PriceHistoryPoint[];
  medianPrice: number;
  windowDays?: number;
  label: string;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMoneyValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "нет данных";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function pluralRu(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100;
  const one = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (one > 1 && one < 5) return forms[1];
  if (one === 1) return forms[0];
  return forms[2];
}

function ratingFromOnliner(value: unknown): number {
  const raw = toNumber(value);
  if (raw > 5) return round1(raw / 10);
  return round1(raw);
}

function envPositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

function envPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function csvEnv(value: string | undefined): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFetchTimeoutMs() {
  const value = Number(process.env.ONLINER_FETCH_TIMEOUT_MS || 8000);
  return Number.isFinite(value) && value > 0 ? value : 8000;
}

function getReviewPagesMax() {
  const value = Number(process.env.ONLINER_REVIEW_PAGES_MAX || 3);
  if (!Number.isFinite(value) || value <= 0) return 3;
  return Math.max(1, Math.min(6, Math.floor(value)));
}

async function fetchJson<T>(url: string, retries = 2): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let shouldRetry = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "OnlinerBuyerAdvocateBot/1.0 (+local prototype)",
        },
        signal: controller.signal,
      });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      lastError = new Error(`Onliner request failed ${response.status}: ${url}`);
      shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry) break;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      shouldRetry = true;
    } finally {
      clearTimeout(timeout);
    }

    if (shouldRetry && attempt < retries) {
      await wait(400 * (attempt + 1));
    }
  }

  throw lastError || new Error(`Onliner request failed: ${url}`);
}

export function extractOnlinerProductKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("onliner.by")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const blocked = new Set(["reviews", "prices", "used", "create"]);
    const key = [...parts].reverse().find((part) => !blocked.has(part));
    return key || null;
  } catch {
    if (/^[a-z0-9][a-z0-9_-]{3,}$/i.test(trimmed) && !trimmed.includes(" ")) {
      return trimmed.toLowerCase();
    }
    return null;
  }
}

function comparableProductText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\+/g, " plus ")
    .replace(/[^a-zа-я0-9/\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchRelevanceTokens(value: string): string[] {
  const stop = new Set(["https", "http", "www", "catalog", "onliner", "by", "product", "products", "search", "query"]);
  return comparableProductText(value)
    .replace(/\//g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !stop.has(token));
}

function isRelevantSearchResult(query: string, product: OnlinerProduct): boolean {
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

export async function searchOnlinerProducts(
  query: string,
  schemas = process.env.ONLINER_SEARCH_SCHEMAS?.split(",").map((s) => s.trim()).filter(Boolean) || DEFAULT_SEARCH_SCHEMAS,
): Promise<OnlinerProduct[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const settled = await Promise.allSettled(
    schemas.map(async (schema) => {
      const url = `${CATALOG_SDAPI_BASE}/search/${encodeURIComponent(schema)}?query=${encodeURIComponent(cleanQuery)}`;
      const data = await fetchJson<{ products?: OnlinerProduct[] }>(url);
      return data.products || [];
    }),
  );

  const seen = new Set<string>();
  const products: OnlinerProduct[] = [];

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const product of result.value) {
      if (!product.key || seen.has(product.key)) continue;
      seen.add(product.key);
      products.push(product);
    }
  }

  return products;
}

async function searchOnlinerSuperPrices(minDiscountPercent: number): Promise<OnlinerProduct[]> {
  const limit = envPositiveInt(process.env.ONLINER_DEAL_SCAN_LIMIT, DEFAULT_DEAL_SCAN_LIMIT, 50);
  const categoryGroups = csvEnv(process.env.ONLINER_SUPERPRICE_CATEGORY_GROUPS);
  const scopes = categoryGroups.length ? categoryGroups : [undefined];
  const settled = await Promise.allSettled(scopes.map(async (categoryGroup) => {
    const url = new URL(`${CATALOG_API_BASE}/super-prices`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", "1");
    url.searchParams.set("order", "discount:desc");
    url.searchParams.set("discount[from]", String(Math.max(1, Math.floor(minDiscountPercent))));
    if (categoryGroup) url.searchParams.set("category_group", categoryGroup);
    const data = await fetchJson<{ products?: OnlinerProduct[] }>(url.toString());
    return data.products || [];
  }));

  const seen = new Set<string>();
  return settled
    .filter((result): result is PromiseFulfilledResult<OnlinerProduct[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter((product) => {
      if (!product.key || seen.has(product.key)) return false;
      seen.add(product.key);
      return true;
    });
}

export async function getOnlinerProductByKey(key: string): Promise<OnlinerProduct> {
  try {
    return await fetchJson<OnlinerProduct>(`${CATALOG_API_BASE}/products/${encodeURIComponent(key)}`);
  } catch {
    return fetchJson<OnlinerProduct>(`${CATALOG_SDAPI_BASE}/products/${encodeURIComponent(key)}`);
  }
}

async function getOnlinerPositions(key: string): Promise<OnlinerPositionsResponse | null> {
  try {
    return await fetchJson<OnlinerPositionsResponse>(`${SHOP_API_BASE}/products/${encodeURIComponent(key)}/positions`);
  } catch {
    return null;
  }
}

function median(values: number[]): number {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return round2(sorted[middle]);
  return round2((sorted[middle - 1] + sorted[middle]) / 2);
}

function priceHistoryDateMs(date: string): number {
  const normalized = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
  const ms = new Date(`${normalized}T00:00:00.000Z`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function normalizePriceHistory(
  response: OnlinerPriceHistoryResponse,
  period: "2m" | "12m",
  endpoint: string,
): NormalizedPriceHistory {
  const currency = response.chart_data?.currency || response.prices?.current?.currency || "BYN";
  const rawPoints = (response.chart_data?.items || [])
    .map((item) => ({
      date: item.date || "",
      price: toNumber(item.price || ""),
      currency,
      source: "onliner_prices_history" as const,
    }))
    .filter((point) => point.date && point.price > 0)
    .sort((a, b) => priceHistoryDateMs(a.date) - priceHistoryDateMs(b.date));

  // Filter out common placeholder prices used on Onliner when stock is depleted or items are disabled
  const basePoints = rawPoints.filter((point) => {
    return (
      point.price !== 8888 &&
      point.price !== 9999 &&
      point.price !== 99999 &&
      point.price !== 999999
    );
  });

  const baseMedian = median(basePoints.map((p) => p.price));

  // Filter out extreme stock-shortage spikes (outliers > 3x median price)
  // We use median instead of minPrice to avoid filtering out legitimate old high prices during massive discounts
  const points = basePoints.filter((point) => {
    if (baseMedian > 0 && point.price > baseMedian * 3) {
      return false;
    }
    return true;
  });

  const times = points.map((point) => priceHistoryDateMs(point.date)).filter((time) => time > 0);
  const windowDays = times.length >= 2
    ? Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000))
    : undefined;
  const historyMedian = median(points.map((point) => point.price));
  const pointLabel = `${points.length} ${pluralRu(points.length, ["замер цены", "замера цены", "замеров цены"])}`;
  const windowLabel = windowDays ? ` за ${windowDays} ${pluralRu(windowDays, ["день", "дня", "дней"])}` : "";
  const label = period === "2m"
    ? `история Onliner: дневные медианы минимальных цен, ${pointLabel}${windowLabel}`
    : `история Onliner: месячные медианы минимальных цен, ${pointLabel}${windowLabel}`;

  return {
    response,
    period,
    endpoint,
    points,
    medianPrice: historyMedian,
    windowDays,
    label,
  };
}

async function fetchOnlinerPriceHistoryPeriod(key: string, period: "2m" | "12m"): Promise<NormalizedPriceHistory> {
  const path = `/products/${encodeURIComponent(key)}/prices-history?period=${period}`;
  const primaryEndpoint = `${CATALOG_API_BASE}${path}`;

  try {
    const response = await fetchJson<OnlinerPriceHistoryResponse>(primaryEndpoint);
    return normalizePriceHistory(response, period, primaryEndpoint);
  } catch {
    const fallbackEndpoint = `${CATALOG_SDAPI_BASE}${path}`;
    const response = await fetchJson<OnlinerPriceHistoryResponse>(fallbackEndpoint);
    return normalizePriceHistory(response, period, fallbackEndpoint);
  }
}

async function getOnlinerPriceHistory(key: string): Promise<NormalizedPriceHistory | null> {
  try {
    const monthly = await fetchOnlinerPriceHistoryPeriod(key, "12m");
    if (monthly.points.length >= 4) return monthly;
  } catch {
    // The history chart is useful but not mandatory for rendering the product.
  }

  try {
    const daily = await fetchOnlinerPriceHistoryPeriod(key, "2m");
    return daily.points.length >= 2 ? daily : null;
  } catch {
    return null;
  }
}

function reviewPageUrl(baseUrl: string, page: number): string {
  const url = new URL(baseUrl);
  if (page > 1) url.searchParams.set("page", String(page));
  return url.toString();
}

function normalizeReviewText(value: string): string {
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

function isNoExplicitReviewClaim(item: string): boolean {
  return NO_EXPLICIT_REVIEW_CLAIM_PATTERN.test(item) || GENERIC_REVIEW_CLAIM_PATTERN.test(item);
}

function splitReviewClaims(value?: string): string[] {
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

function claimFamily(label: string): string {
  return REVIEW_FAMILIES.find((family) => family.pattern.test(label))?.key || "";
}

function claimTokens(label: string): string[] {
  return label
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !REVIEW_STOP_WORDS.has(token));
}

function tokenSimilarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const left = new Set(a);
  const right = new Set(b);
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / Math.max(left.size, right.size);
}

function pickClusterLabel(labels: string[]): string {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]?.[0] || labels[0] || "";
}

function clusterReviewClaims(claims: string[], limit: number): ReviewInsight[] {
  const clusters: Array<{ family: string; labels: string[]; tokens: string[] }> = [];

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
        examples: uniqNonEmpty(cluster.labels, 3),
      };
    })
    .filter((item) => item.label)
    .sort((a, b) => b.count - a.count || a.label.length - b.label.length)
    .slice(0, limit);
}

function reviewInsightText(item: ReviewInsight): string {
  return item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label;
}

function looksNegativeReviewClaim(label: string): boolean {
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

async function getOnlinerReviews(product: OnlinerProduct): Promise<{ reviews: OnlinerReview[]; evidence: ReviewEvidence }> {
  const reviewsUrl = product.reviews?.url || `${CATALOG_API_BASE}/products/${encodeURIComponent(product.key)}/reviews`;
  const maxPages = getReviewPagesMax();

  try {
    const firstPage = await fetchJson<OnlinerReviewsPage>(reviewsUrl);
    const firstReviews = firstPage.reviews || [];
    const totalCount = firstPage.total || product.reviews?.count || firstReviews.length;
    const pagesAvailable = firstPage.page?.last || Math.max(1, Math.ceil(totalCount / (firstPage.page?.limit || 10)));
    const pagesToFetch = Math.min(maxPages, pagesAvailable);
    const failedPages: number[] = [];
    const extraPages = pagesToFetch > 1
      ? await Promise.allSettled(
          Array.from({ length: pagesToFetch - 1 }, (_, index) => index + 2)
            .map((page) => fetchJson<OnlinerReviewsPage>(reviewPageUrl(reviewsUrl, page)).then((data) => ({ page, data }))),
        )
      : [];

    const reviews = [...firstReviews];
    for (const result of extraPages) {
      if (result.status === "fulfilled") {
        reviews.push(...(result.value.data.reviews || []));
      } else {
        failedPages.push(extraPages.indexOf(result) + 2);
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

function extractPositionPrices(positions: OnlinerPositionsResponse | null): number[] {
  const allPositions = [
    ...(positions?.positions?.primary || []),
    ...(positions?.positions?.secondary || []),
  ];

  return allPositions
    .map((position) => toNumber(position.position_price?.amount))
    .filter((price) => price > 0)
    .sort((a, b) => a - b);
}

function uniqNonEmpty(values: Array<string | undefined>, limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const clean = (value || "").replace(/\s+/g, " ").trim();
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    result.push(clean);
    if (result.length >= limit) break;
  }

  return result;
}

function buildSpecs(product: OnlinerProduct): Record<string, string> {
  const specs: Record<string, string> = {};
  const descriptionList = product.description_list || product.micro_description_list || [];

  descriptionList.slice(0, 8).forEach((item, index) => {
    specs[`Описание ${index + 1}`] = item;
  });

  if (product.manufacturer?.name) specs["Производитель"] = product.manufacturer.name;
  if (product.status) specs["Статус в каталоге"] = product.status;
  if (!Object.keys(specs).length && product.description) specs["Описание"] = product.description;

  return specs;
}

function chooseValueForMoney(rating: number, ratingCount: number, honestDiscountPercent: number, currentPrice: number, medianPrice: number): ValueForMoney {
  if (currentPrice > medianPrice * 1.05 || rating < 4.0) return ValueForMoney.OVERPRICED;
  if (honestDiscountPercent >= 15 && rating >= 4.5 && ratingCount >= 10) return ValueForMoney.POPULAR;
  return ValueForMoney.OPTIMUM;
}

function buildReviewText(reviews: OnlinerReview[]): string[] {
  return reviews
    .map((review) => [review.summary, review.pros, review.cons, review.text].filter(Boolean).join(". "))
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 10);
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

export async function productFromOnliner(product: OnlinerProduct): Promise<Product> {
  const [positions, reviewResult, priceHistory] = await Promise.all([
    getOnlinerPositions(product.key),
    getOnlinerReviews(product),
    getOnlinerPriceHistory(product.key),
  ]);
  const { reviews, evidence: reviewEvidence } = reviewResult;

  const positionPrices = extractPositionPrices(positions);
  const currentPrice = toNumber(priceHistory?.response.prices?.current?.amount)
    || toNumber(product.prices?.price_min?.amount)
    || positionPrices[0]
    || 0;
  let apiMedianPrice = toNumber(priceHistory?.response.sale?.min_prices_median?.amount)
    || toNumber(product.sale?.min_prices_median?.amount);

  if (
    apiMedianPrice === 8888 ||
    apiMedianPrice === 9999 ||
    apiMedianPrice === 99999 ||
    apiMedianPrice === 999999
  ) {
    apiMedianPrice = currentPrice;
  } else if (currentPrice >= 15 && apiMedianPrice > currentPrice * 10) {
    // Only cap extreme anomalies (e.g. >10x current price) to avoid destroying legitimate deep discounts
    apiMedianPrice = currentPrice;
  }

  const medianPrice = priceHistory?.medianPrice || apiMedianPrice || currentPrice;
  const advertisedDiscount = toNumber(priceHistory?.response.sale?.discount) || toNumber(product.sale?.discount);
  const originalPrice = advertisedDiscount > 0 && advertisedDiscount < 100 && currentPrice > 0
    ? Math.round(currentPrice / (1 - advertisedDiscount / 100))
    : Math.max(currentPrice, medianPrice);

  const honestDiscountPercent = (medianPrice > 0 && currentPrice > 0) ? round1(((medianPrice - currentPrice) / medianPrice) * 100) : 0;
  const priceManipulationWarning = currentPrice > 0 ? discountManipulationWarning(advertisedDiscount, honestDiscountPercent) : undefined;
  const isFakeDiscount = Boolean(priceManipulationWarning);
  const rating = ratingFromOnliner(product.reviews?.rating);
  const ratingCount = product.reviews?.count || reviews.length;

  const reviewPros = reviewEvidence.topPros.map(reviewInsightText).slice(0, 4);
  const reviewCons = reviewEvidence.topCons.map(reviewInsightText).slice(0, 4);
  const descriptionPros = uniqNonEmpty(product.description_list || [], 4);

  const pros = reviewPros.length ? reviewPros : descriptionPros.length ? descriptionPros : ["Есть актуальные данные карточки Onliner.by"];
  const cons = reviewCons.length
    ? reviewCons
    : [
        "В публичных отзывах мало подтвержденных минусов; нужен ручной просмотр отзывов перед жестким вердиктом",
        priceHistory
          ? "История цен взята из графика минимальных цен Onliner; перед дорогой покупкой проверьте карточку вручную"
          : "История цен недоступна в ответе Onliner; использован только текущий ценовой сигнал карточки",
      ];

  const capturedAt = new Date().toISOString();
  const productUrl = product.html_url || `https://catalog.onliner.by/${product.key}`;
  const reviewsUrl = product.reviews?.html_url || `${productUrl}/reviews`;
  const pricesUrl = product.prices?.html_url || `${productUrl}/prices`;
  const priceEvidenceWarnings = priceHistory
    ? [
        priceHistory.period === "2m"
          ? "Onliner отдает дневной график примерно за 2 месяца; это реальная история сайта, но не ровно 90 дней."
          : "Onliner отдает годовой график помесячно; это реальная история сайта, но не дневные замеры за 90 дней.",
        priceHistory.points.length < 7
          ? "В истории мало ненулевых замеров цены; вердикт нужно считать предварительным."
          : undefined,
      ].filter((warning): warning is string => Boolean(warning))
    : [
        apiMedianPrice > 0
          ? "Onliner не отдал график цен; медиана взята из sale.min_prices_median."
          : "Onliner не вернул график или медианный сигнал цены для этой карточки.",
      ];

  return {
    id: product.key,
    dataSource: "onliner_live",
    title: product.full_name || product.extended_name || product.name || product.key,
    category: product.name_prefix || "Каталог Onliner.by",
    url: productUrl,
    rating,
    ratingCount,
    currentPrice,
    originalPrice,
    medianPrice90Days: medianPrice,
    advertisedDiscountPercent: advertisedDiscount,
    isFakeDiscount,
    honestDiscountPercent,
    priceManipulationWarning,
    valueForMoney: chooseValueForMoney(rating, ratingCount, honestDiscountPercent, currentPrice, medianPrice),
    pros,
    cons,
    specs: buildSpecs(product),
    imageUrl: product.images?.header || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80",
    reviewsText: buildReviewText(reviews),
    offersCount: product.prices?.offers?.count || positionPrices.length,
    lastCheckedAt: capturedAt,
    sourceUrls: [productUrl, pricesUrl, reviewsUrl, reviewEvidence.endpoint, priceHistory?.endpoint].filter((url): url is string => Boolean(url)),
    priceHistory: priceHistory?.points,
    reviewEvidence,
    priceEvidence: {
      source: "onliner_live",
      currentPriceSource: priceHistory?.endpoint || product.prices?.url || `${SHOP_API_BASE}/products/${product.key}/positions`,
      medianPriceSource: priceHistory
        ? "catalog.api.onliner.by products/{key}/prices-history chart_data.items"
        : "product.sale.min_prices_median from Onliner catalog API",
      medianWindowLabel: priceHistory?.label || "медианный сигнал Onliner без доступного графика истории",
      capturedAt,
      offersCount: product.prices?.offers?.count || positionPrices.length,
      historySource: priceHistory?.endpoint,
      historyPointsCount: priceHistory?.points.length,
      historyWindowDays: priceHistory?.windowDays,
      historyPeriod: priceHistory?.period,
      warnings: priceEvidenceWarnings,
    },
  };
}

export async function resolveOnlinerProduct(input: string): Promise<Product | null> {
  const key = extractOnlinerProductKey(input);
  if (key) {
    try {
      return productFromOnliner(await getOnlinerProductByKey(key));
    } catch {
      // If a pasted URL has an old key, fall back to search by the raw input.
    }
  }

  const searchResults = (await searchOnlinerProducts(input)).filter((product) => isRelevantSearchResult(input, product));
  const firstPriced = searchResults.find((product) => toNumber(product.prices?.price_min?.amount) > 0) || searchResults[0];
  if (!firstPriced) return null;

  return productFromOnliner(await getOnlinerProductByKey(firstPriced.key));
}

function productCurrentPrice(product: OnlinerProduct): number {
  return toNumber(product.prices?.price_min?.amount);
}

function productOffersCount(product: OnlinerProduct): number {
  return Number(product.prices?.offers?.count || 0);
}

function productAdvertisedDiscount(product: OnlinerProduct): number {
  return toNumber(product.sale?.discount);
}

function dealCandidateScore(product: OnlinerProduct): number {
  const discount = productAdvertisedDiscount(product);
  const price = productCurrentPrice(product);
  const offers = productOffersCount(product);
  const rating = ratingFromOnliner(product.reviews?.rating);
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

function isSuperPriceCandidate(product: OnlinerProduct, minDiscountPercent: number): boolean {
  const minPrice = envPositiveNumber(process.env.ONLINER_DEAL_MIN_PRICE_BYN, DEFAULT_DEAL_MIN_PRICE_BYN);
  const minOffers = envPositiveInt(process.env.ONLINER_DEAL_MIN_OFFERS, DEFAULT_DEAL_MIN_OFFERS, 20);
  return (
    product.key
    && productAdvertisedDiscount(product) >= minDiscountPercent
    && productCurrentPrice(product) >= minPrice
    && productOffersCount(product) >= minOffers
  );
}

function isPublishableDeal(product: Product, minDiscountPercent: number): boolean {
  const minPrice = envPositiveNumber(process.env.ONLINER_DEAL_MIN_PRICE_BYN, DEFAULT_DEAL_MIN_PRICE_BYN);
  const minOffers = envPositiveInt(process.env.ONLINER_DEAL_MIN_OFFERS, DEFAULT_DEAL_MIN_OFFERS, 20);
  const isExtremeDiscount = product.honestDiscountPercent >= 50;
  const priceOk = isExtremeDiscount || product.currentPrice >= minPrice;
  return (
    product.honestDiscountPercent >= minDiscountPercent
    && !product.isFakeDiscount
    && priceOk
    && product.offersCount >= minOffers
  );
}

export async function findOnlinerDeals(query: string, minDiscountPercent = 20): Promise<Product[]> {
  const analyzeLimit = envPositiveInt(process.env.ONLINER_DEAL_ANALYZE_LIMIT, DEFAULT_DEAL_ANALYZE_LIMIT, 8);
  const superPriceProducts = await searchOnlinerSuperPrices(minDiscountPercent).catch(() => []);
  const products = superPriceProducts
    .filter((product) => isSuperPriceCandidate(product, minDiscountPercent))
    .sort((a, b) => dealCandidateScore(b) - dealCandidateScore(a));
  const selected = (products.length ? products : await searchOnlinerProducts(query)).slice(0, analyzeLimit);
  const converted = await Promise.allSettled(selected.map((product) => productFromOnliner(product)));

  return converted
    .filter((result): result is PromiseFulfilledResult<Product> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((product) => isPublishableDeal(product, minDiscountPercent))
    .sort((a, b) => b.honestDiscountPercent - a.honestDiscountPercent);
}
