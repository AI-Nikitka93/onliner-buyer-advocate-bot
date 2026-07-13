const CATALOG_SDAPI_BASE = "https://catalog.onliner.by/sdapi/catalog.api";
const CATALOG_API_BASE = "https://catalog.api.onliner.by";
const SHOP_API_BASE = "https://shop.api.onliner.by";

const query = process.env.ONLINER_CONTRACT_QUERY || "redmi note 15 pro";
const schema = process.env.ONLINER_CONTRACT_SCHEMA || "mobile";
const allowNetworkSkip = process.argv.includes("--soft") || process.env.ONLINER_CONTRACT_ALLOW_NETWORK_SKIP === "true";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function moneyAmount(value) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function errorPayload(error) {
  return {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    causeCode: error?.cause?.code,
    causeMessage: error?.cause?.message,
  };
}

function isNetworkUnavailable(error) {
  const text = JSON.stringify(errorPayload(error)).toLowerCase();
  return [
    "fetch failed",
    "connect timeout",
    "headers timeout",
    "body timeout",
    "und_err_connect_timeout",
    "und_err_headers_timeout",
    "etimedout",
    "econnreset",
    "eai_again",
    "enotfound",
    "aborted",
  ].some((marker) => text.includes(marker));
}

async function fetchJson(url, retries = 3) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "OnlinerBuyerAdvocateBot/contract-smoke (+local)",
        },
        signal: AbortSignal.timeout(20_000),
      });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}: ${JSON.stringify(data).slice(0, 500)}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await wait(750 * (attempt + 1));
    }
  }

  throw lastError;
}

async function main() {
  const searchUrl = `${CATALOG_SDAPI_BASE}/search/${encodeURIComponent(schema)}?query=${encodeURIComponent(query)}`;
  const search = await fetchJson(searchUrl);
  assert(Array.isArray(search.products), "Search response must expose products array.");
  assert(search.products.length > 0, "Search response must include at least one product.");

  const selected = search.products.find((product) => product.key && moneyAmount(product.prices?.price_min?.amount) > 0)
    || search.products.find((product) => product.key);
  assert(selected?.key, "Search response must include a product key.");

  const productUrl = `${CATALOG_API_BASE}/products/${encodeURIComponent(selected.key)}`;
  const product = await fetchJson(productUrl);
  assert(product.key === selected.key, "Product response key must match search key.");
  assert(product.prices?.price_min?.amount || product.prices?.priceMin?.amount, "Product response must expose minimum price.");
  assert(product.html_url || product.htmlUrl, "Product response must expose html URL.");

  const history2mUrl = `${CATALOG_API_BASE}/products/${encodeURIComponent(selected.key)}/prices-history?period=2m`;
  const history2m = await fetchJson(history2mUrl);
  const history2mItems = history2m.chart_data?.items || [];
  const history2mPrices = history2mItems.map((item) => moneyAmount(item.price)).filter((price) => price > 0);
  assert(history2m.prices?.current?.amount, "2m price history must expose current price.");
  assert(history2m.chart_data?.currency, "2m price history must expose chart currency.");
  assert(history2mItems.length > 0, "2m price history must expose chart items.");
  assert(history2mPrices.length >= 2, "2m price history must expose at least two non-null prices.");

  const history12mUrl = `${CATALOG_API_BASE}/products/${encodeURIComponent(selected.key)}/prices-history?period=12m`;
  const history12m = await fetchJson(history12mUrl);
  assert(Array.isArray(history12m.chart_data?.items), "12m price history must expose chart items array.");

  const positionsUrl = `${SHOP_API_BASE}/products/${encodeURIComponent(selected.key)}/positions`;
  const positions = await fetchJson(positionsUrl);
  const primaryPositions = positions.positions?.primary || [];
  const secondaryPositions = positions.positions?.secondary || [];
  assert(Array.isArray(primaryPositions), "Positions response must expose positions.primary array.");
  assert(Array.isArray(secondaryPositions), "Positions response must expose positions.secondary array.");
  assert(primaryPositions.length + secondaryPositions.length > 0, "Positions response must include at least one offer.");

  const reviewsUrl = product.reviews?.url || `${CATALOG_API_BASE}/products/${encodeURIComponent(selected.key)}/reviews`;
  const reviews = await fetchJson(reviewsUrl);
  assert(Array.isArray(reviews.reviews), "Reviews response must expose reviews array.");
  let reviewsPage2 = null;
  if ((reviews.page?.last || 1) > 1) {
    const page2Url = new URL(reviewsUrl);
    page2Url.searchParams.set("page", "2");
    reviewsPage2 = await fetchJson(page2Url.toString());
    assert(Array.isArray(reviewsPage2.reviews), "Reviews page 2 response must expose reviews array.");
    assert(reviewsPage2.page?.current === 2, "Reviews page 2 response must report page.current=2.");
  }

  console.log(JSON.stringify({
    ok: true,
    status: "contract_ok",
    query,
    schema,
    product: {
      key: selected.key,
      title: product.full_name || product.fullName || product.extended_name || product.extendedName || product.name,
      priceMin: product.prices?.price_min?.amount || product.prices?.priceMin?.amount,
      offersCount: product.prices?.offers?.count,
    },
    priceHistory: {
      period2mPoints: history2mItems.length,
      period2mNonNullPrices: history2mPrices.length,
      period2mCurrency: history2m.chart_data.currency,
      period12mPoints: history12m.chart_data.items.length,
      medianSignal: history2m.sale?.min_prices_median?.amount,
    },
    positions: {
      primary: primaryPositions.length,
      secondary: secondaryPositions.length,
    },
    reviews: {
      count: reviews.reviews.length,
      total: reviews.total,
      pageCurrent: reviews.page?.current,
      pageLast: reviews.page?.last,
      page2Count: reviewsPage2?.reviews?.length,
    },
    endpoints: {
      searchUrl,
      productUrl,
      history2mUrl,
      history12mUrl,
      positionsUrl,
      reviewsUrl,
    },
  }, null, 2));
}

try {
  await main();
} catch (error) {
  if (isNetworkUnavailable(error)) {
    console.log(JSON.stringify({
      ok: false,
      status: "network_unavailable",
      strict: !allowNetworkSkip,
      query,
      schema,
      checkedAt: new Date().toISOString(),
      error: errorPayload(error),
      recommendation: "Onliner TCP/HTTPS is unavailable from this machine right now. Retry later or run from a network that can reach catalog.onliner.by, catalog.api.onliner.by, and shop.api.onliner.by.",
    }, null, 2));
    process.exitCode = allowNetworkSkip ? 0 : 2;
  } else {
    console.log(JSON.stringify({
      ok: false,
      status: "contract_failed",
      query,
      schema,
      checkedAt: new Date().toISOString(),
      error: errorPayload(error),
    }, null, 2));
    process.exitCode = 1;
  }
}
