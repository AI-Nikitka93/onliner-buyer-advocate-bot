import "dotenv/config";
import { buildReleaseReadiness } from "./release-readiness-core.mjs";

const workerUrl = (process.env.WORKER_URL || "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev").replace(/\/$/, "");
const adminToken = process.env.ADMIN_API_TOKEN || "";
const requireMature = process.argv.includes("--require-mature") || process.env.RELEASE_GATE_REQUIRE_MATURE === "true";

if (!adminToken || /change_me|your_|PASTE_|MY_/.test(adminToken)) {
  throw new Error("ADMIN_API_TOKEN is missing or placeholder in .env");
}

function csv(value, fallback) {
  return String(value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getJson(path, options = {}) {
  const response = await fetch(`${workerUrl}${path}`, {
    headers: options.admin === false ? {} : { "x-admin-token": adminToken },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

const webhookUrl = `${workerUrl}/telegram/webhook`;
const externalInputs = csv(
  process.env.EXTERNAL_PRICE_DOCTOR_INPUTS,
  process.env.ONLINER_CONTRACT_PRODUCT || "redminote15p5ti,redminote15p1br,gvn5070gamingoc",
);

const [
  telegram,
  onliner,
  onlinerDeals,
  channel,
  priceWatch,
  priceWatchDoctor,
  priceWatchScanDoctor,
  product,
  ...externalPriceChecks
] = await Promise.all([
  getJson(`/api/telegram/doctor?expectedWebhookUrl=${encodeURIComponent(webhookUrl)}`),
  getJson(`/api/onliner/doctor?query=${encodeURIComponent(process.env.ONLINER_CONTRACT_QUERY || "redmi note 15 pro")}`),
  getJson(`/api/onliner/deals-doctor?minDiscountPercent=${encodeURIComponent(process.env.MIN_HONEST_DISCOUNT_PERCENT || "20")}`),
  getJson("/api/channel/status"),
  getJson("/api/price-watch/status"),
  getJson(`/api/price-watch/doctor?input=${encodeURIComponent(process.env.PRICE_WATCH_DOCTOR_INPUT || "redminote15p5ti")}`),
  getJson(`/api/price-watch/scan-doctor?input=${encodeURIComponent(process.env.PRICE_WATCH_DOCTOR_INPUT || "redminote15p5ti")}`),
  getJson(`/api/catalog/product?input=${encodeURIComponent(process.env.RELEASE_PRODUCT_INPUT || "redminote15p1br")}`, { admin: false }),
  ...externalInputs.map(async (input) => ({
    input,
    ...(await getJson(`/api/external-price/doctor?input=${encodeURIComponent(input)}`)),
  })),
]);

const summary = buildReleaseReadiness({
  telegram,
  onliner,
  onlinerDeals,
  channel,
  priceWatch,
  priceWatchDoctor,
  priceWatchScanDoctor,
  product,
  externalPriceChecks,
});

summary.workerUrl = workerUrl;
summary.requireMature = requireMature;
summary.priceWatch = {
  status: priceWatch.status,
  enabled: priceWatch.data?.enabled,
  kvConfigured: priceWatch.data?.kvConfigured,
  totalIndexed: priceWatch.data?.totalIndexed,
  activeSample: priceWatch.data?.activeSample,
  latestScheduledRun: priceWatch.data?.schedulerEvidence?.latestScheduledRun,
};

console.log(JSON.stringify(summary, null, 2));

if (requireMature ? !summary.publicReleaseMatureOk : !summary.productionUsableOk) {
  process.exitCode = 1;
}
