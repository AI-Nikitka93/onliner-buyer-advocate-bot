import "dotenv/config";

const CATALOG_SDAPI_BASE = "https://catalog.onliner.by/sdapi/catalog.api";
const CATALOG_API_BASE = "https://catalog.api.onliner.by";

const MIN_HONEST_DISCOUNT_PERCENT = Number(process.env.MIN_HONEST_DISCOUNT_PERCENT || 20);
const ONLINER_DEAL_MIN_PRICE_BYN = Number(process.env.ONLINER_DEAL_MIN_PRICE_BYN || 15);
const ONLINER_DEAL_MIN_OFFERS = Number(process.env.ONLINER_DEAL_MIN_OFFERS || 2);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function ratingFromOnliner(value: unknown): number {
  const raw = toNumber(value);
  if (raw > 5) return round1(raw / 10);
  return round1(raw);
}

function discountManipulationWarning(advertisedDiscount: number, honestDiscountPercent: number) {
  if (advertisedDiscount < 10) return undefined;

  const honestDiscount = Math.max(0, honestDiscountPercent);
  const unsupportedByStableHistory = honestDiscount < Math.max(3, advertisedDiscount / 3);
  if (unsupportedByStableHistory) {
    return `Заявленная скидка ${advertisedDiscount}% не подтверждается устойчивой историей Onliner: по базовой медиане выходит ${round1(honestDiscount)}%. Возможен короткий завышенный пик цены.`;
  }

  const overstatedByStableHistory = (
    advertisedDiscount >= 30
    && honestDiscount >= 10
    && advertisedDiscount - honestDiscount >= 20
    && advertisedDiscount / Math.max(honestDiscount, 1) >= 1.5
  );
  if (overstatedByStableHistory) {
    return `Заявленная скидка ${advertisedDiscount}% сильно завышена относительно устойчивой истории Onliner: по базовой медиане выходит ${round1(honestDiscount)}%. Часть скидки может быть нарисована от временного высокого плато или пика цены.`;
  }

  return undefined;
}

async function fetchJson<T>(url: string, retries = 2): Promise<T> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "OnlinerBuyerAdvocateBot/audit-script (+local)",
        },
        signal: AbortSignal.timeout(15_000),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 200)}`);
      }
      return JSON.parse(text) as T;
    } catch (error: any) {
      lastError = error;
      if (attempt < retries) {
        await wait(500 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

async function fetchOnlinerPriceHistoryPeriod(key: string, period: "2m" | "12m"): Promise<any> {
  const path = `/products/${encodeURIComponent(key)}/prices-history?period=${period}`;
  try {
    return await fetchJson(`${CATALOG_API_BASE}${path}`);
  } catch {
    return await fetchJson(`${CATALOG_SDAPI_BASE}${path}`);
  }
}

async function getOnlinerPriceHistory(key: string): Promise<{ points: any[]; medianPrice: number; period: string } | null> {
  try {
    const monthly = await fetchOnlinerPriceHistoryPeriod(key, "12m");
    const points = (monthly.chart_data?.items || [])
      .map((item: any) => ({
        date: item.date || "",
        price: toNumber(item.price || ""),
      }))
      .filter((point: any) => point.date && point.price > 0);
    if (points.length >= 4) {
      return {
        points,
        medianPrice: median(points.map((p: any) => p.price)),
        period: "12m",
      };
    }
  } catch {
    // try fallback
  }

  try {
    const daily = await fetchOnlinerPriceHistoryPeriod(key, "2m");
    const points = (daily.chart_data?.items || [])
      .map((item: any) => ({
        date: item.date || "",
        price: toNumber(item.price || ""),
      }))
      .filter((point: any) => point.date && point.price > 0);
    if (points.length >= 2) {
      return {
        points,
        medianPrice: median(points.map((p: any) => p.price)),
        period: "2m",
      };
    }
  } catch {
    // failed
  }
  return null;
}

async function runAudit() {
  console.log("Fetching top 100 super-price discounts from Onliner...");
  let rawProducts: any[] = [];
  try {
    const page1 = await fetchJson<any>(`${CATALOG_API_BASE}/super-prices?limit=50&page=1&order=discount:desc`);
    if (page1.products) rawProducts.push(...page1.products);
    const page2 = await fetchJson<any>(`${CATALOG_API_BASE}/super-prices?limit=50&page=2&order=discount:desc`);
    if (page2.products) rawProducts.push(...page2.products);
  } catch (err: any) {
    console.error("Failed to fetch super-prices:", err.message);
    process.exit(1);
  }

  console.log(`Successfully fetched ${rawProducts.length} raw products. Retrieving price histories...`);
  
  const processedProducts: any[] = [];
  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const key = p.key;
    const name = p.full_name || p.extended_name || p.name || key;
    console.log(`[${i+1}/${rawProducts.length}] Processing ${name} (${key})...`);
    
    let history: any = null;
    try {
      history = await getOnlinerPriceHistory(key);
      await wait(150); // Be polite to Onliner API
    } catch (err: any) {
      console.warn(`Failed to fetch history for ${key}:`, err.message);
    }
    
    const currentPrice = toNumber(p.prices?.price_min?.amount) || 0;
    
    const apiMedianPrice = toNumber(p.sale?.min_prices_median?.amount);
    
    const medianPrice = history?.medianPrice || apiMedianPrice || currentPrice;
    
    const advertisedDiscount = toNumber(p.sale?.discount);
    
    const honestDiscountPercent = medianPrice > 0 ? round1(((medianPrice - currentPrice) / medianPrice) * 100) : 0;
    
    const botWarning = discountManipulationWarning(advertisedDiscount, honestDiscountPercent);
    const botIsFake = Boolean(botWarning);
    
    const rating = ratingFromOnliner(p.reviews?.rating || 0);
    const ratingCount = p.reviews?.count || 0;
    const offersCount = p.prices?.offers?.count || 0;
    
    // Audit specific checks:
    // 1. Fake discount: currentPrice marked up (currentPrice > medianPrice) OR honest discount < 40% of advertised
    const isAuditFakeDiscount = (currentPrice > medianPrice) || (honestDiscountPercent < 0.40 * advertisedDiscount);
    const fakeReason = currentPrice > medianPrice 
      ? `Price marked up: current (${currentPrice}) > median (${medianPrice})`
      : honestDiscountPercent < 0.40 * advertisedDiscount
        ? `Honest discount (${honestDiscountPercent}%) < 40% of advertised (${advertisedDiscount}%)`
        : "";

    // 2. Poor rating: rating < 4.0 (if there are reviews)
    const isAuditPoorRating = ratingCount > 0 && rating < 4.0;

    // 3. Low offers count: offers < 2
    const isAuditLowOffers = offersCount < 2;
    
    // Bot's publish check:
    // honestDiscountPercent >= MIN_HONEST_DISCOUNT_PERCENT (20)
    // && !botIsFake
    // && currentPrice >= ONLINER_DEAL_MIN_PRICE_BYN (15)
    // && offersCount >= ONLINER_DEAL_MIN_OFFERS (2)
    // && (ratingCount === 0 || rating >= 4.0)
    const botRatingOk = ratingCount === 0 || rating >= 4.0;
    
    const botFiltersPassed = 
      honestDiscountPercent >= MIN_HONEST_DISCOUNT_PERCENT &&
      !botIsFake &&
      currentPrice >= ONLINER_DEAL_MIN_PRICE_BYN &&
      offersCount >= ONLINER_DEAL_MIN_OFFERS &&
      botRatingOk;
      
    const filterReasons: string[] = [];
    if (honestDiscountPercent < MIN_HONEST_DISCOUNT_PERCENT) {
      filterReasons.push(`Honest discount ${honestDiscountPercent}% is below threshold ${MIN_HONEST_DISCOUNT_PERCENT}%`);
    }
    if (botIsFake) {
      filterReasons.push(`Bot marked as fake discount: ${botWarning}`);
    }
    if (currentPrice < ONLINER_DEAL_MIN_PRICE_BYN) {
      filterReasons.push(`Current price ${currentPrice} BYN is below threshold ${ONLINER_DEAL_MIN_PRICE_BYN} BYN`);
    }
    if (offersCount < ONLINER_DEAL_MIN_OFFERS) {
      filterReasons.push(`Offers count ${offersCount} is below threshold ${ONLINER_DEAL_MIN_OFFERS}`);
    }
    if (!botRatingOk) {
      filterReasons.push(`Rating ${rating} is below 4.0`);
    }
    
    processedProducts.push({
      key,
      name,
      advertisedDiscount,
      honestDiscountPercent,
      currentPrice,
      medianPrice,
      rating,
      ratingCount,
      offersCount,
      botIsFake,
      botWarning,
      isAuditFakeDiscount,
      fakeReason,
      isAuditPoorRating,
      isAuditLowOffers,
      botFiltersPassed,
      botFilterReason: filterReasons.join("; ") || "PASSED"
    });
  }

  // Save the full audit output as JSON
  const fs = await import("fs");
  const path = await import("path");
  
  const outputDir = "data";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, "audit_results.json"),
    JSON.stringify(processedProducts, null, 2),
    "utf-8"
  );
  console.log(`Saved full audit results to ${path.join(outputDir, "audit_results.json")}`);
  
  // Format top 20 candidates table and output it
  const top20 = processedProducts.slice(0, 20);
  console.log("\n--- Top 20 Candidates Audit Summary ---");
  console.table(top20.map((p, idx) => ({
    Index: idx + 1,
    Name: p.name.slice(0, 30),
    "Adv %": p.advertisedDiscount,
    "Honest %": p.honestDiscountPercent,
    "Price BYN": p.currentPrice,
    "Median BYN": p.medianPrice,
    Offers: p.offersCount,
    Rating: p.rating,
    BotStatus: p.botFiltersPassed ? "PASS" : "FILTERED",
  })));
}

runAudit().catch((err) => {
  console.error("Audit run crashed:", err);
  process.exit(1);
});
