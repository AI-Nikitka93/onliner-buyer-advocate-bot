import "dotenv/config";
import { channelMaturitySummary } from "./channel-maturity.mjs";

const workerUrl = process.env.WORKER_URL || "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev";
const adminToken = process.env.ADMIN_API_TOKEN || "";

if (!adminToken || /change_me|your_|PASTE_|MY_/.test(adminToken)) {
  throw new Error("ADMIN_API_TOKEN is missing or placeholder in .env");
}

async function getJson(path) {
  const response = await fetch(`${workerUrl}${path}`, {
    headers: { "x-admin-token": adminToken },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

function csv(value, fallback) {
  return String(value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getExternalPriceChecks() {
  const inputs = csv(
    process.env.EXTERNAL_PRICE_DOCTOR_INPUTS,
    process.env.ONLINER_CONTRACT_PRODUCT || "redminote15p5ti,redminote15p1br,gvn5070gamingoc",
  );
  const checks = [];
  for (const input of inputs) {
    checks.push({
      input,
      ...(await getJson(`/api/external-price/doctor?input=${encodeURIComponent(input)}`)),
    });
  }
  return checks;
}

const webhookUrl = `${workerUrl.replace(/\/$/, "")}/telegram/webhook`;
const telegram = await getJson(`/api/telegram/doctor?expectedWebhookUrl=${encodeURIComponent(webhookUrl)}`);
const onliner = await getJson(`/api/onliner/doctor?query=${encodeURIComponent(process.env.ONLINER_CONTRACT_QUERY || "redmi note 15 pro")}`);
const onlinerDeals = await getJson(`/api/onliner/deals-doctor?minDiscountPercent=${encodeURIComponent(process.env.MIN_HONEST_DISCOUNT_PERCENT || "20")}`);
const externalPriceChecks = await getExternalPriceChecks();
const readyExternalPriceChecks = externalPriceChecks.filter((check) => check.ok && check.data?.readyForExternalPricePilot);
const partialExternalPriceFailures = externalPriceChecks.filter((check) => !check.ok || !check.data?.readyForExternalPricePilot);
const primaryExternalPrice = readyExternalPriceChecks[0] || externalPriceChecks[0] || { status: 0, ok: false, data: {} };
const channel = await getJson("/api/channel/status");
const channelMaturity = channelMaturitySummary(channel.data || {}, { responseOk: channel.ok, responseStatus: channel.status });
const priceWatch = await getJson("/api/price-watch/status");
const priceWatchDoctor = await getJson(`/api/price-watch/doctor?input=${encodeURIComponent(process.env.PRICE_WATCH_DOCTOR_INPUT || "redminote15p5ti")}`);
const priceWatchScanDoctor = await getJson(`/api/price-watch/scan-doctor?input=${encodeURIComponent(process.env.PRICE_WATCH_DOCTOR_INPUT || "redminote15p5ti")}`);

console.log(JSON.stringify({
  workerUrl,
  telegram: {
    status: telegram.status,
    ok: telegram.ok,
    readyForLiveDelivery: telegram.data?.readyForLiveDelivery,
    readyForChannelCron: telegram.data?.readyForChannelCron,
    channelCronEnabled: telegram.data?.channelCronEnabled,
    dealDedupeConfigured: telegram.data?.dealDedupeConfigured,
    botUsername: telegram.data?.checks?.bot?.username,
    channelOk: Boolean(telegram.data?.checks?.channelAdmin?.ok),
    webhookConfigured: Boolean(telegram.data?.checks?.webhook?.configured),
    allowedUpdates: telegram.data?.checks?.webhook?.allowedUpdates || [],
    pendingUpdateCount: telegram.data?.checks?.webhook?.pendingUpdateCount ?? null,
    lastErrorMessage: telegram.data?.checks?.webhook?.lastErrorMessage || null,
    lastErrorAt: telegram.data?.checks?.webhook?.lastErrorAt || null,
    lastErrorAgeHours: telegram.data?.checks?.webhook?.lastErrorAgeHours ?? null,
    recommendations: telegram.data?.recommendations || [],
  },
  onliner: {
    status: onliner.status,
    ok: onliner.ok,
    readyForLiveSource: onliner.data?.readyForLiveSource,
    sourceStatus: onliner.data?.status,
    productId: onliner.data?.product?.id,
    historyPoints: onliner.data?.product?.historyPoints?.length,
    error: onliner.data?.error,
  },
  onlinerDeals: {
    status: onlinerDeals.status,
    ok: onlinerDeals.ok,
    readyForDiscountRadar: onlinerDeals.data?.readyForDiscountRadar,
    source: onlinerDeals.data?.source,
    minDiscountPercent: onlinerDeals.data?.config?.minDiscountPercent,
    minPrice: onlinerDeals.data?.config?.minPrice,
    minOffers: onlinerDeals.data?.config?.minOffers,
    rawProductsCount: onlinerDeals.data?.superPrices?.rawProductsCount,
    qualifiedCandidatesCount: onlinerDeals.data?.superPrices?.qualifiedCandidatesCount,
    publishableDealsCount: onlinerDeals.data?.publishableDealsCount,
    firstDeal: onlinerDeals.data?.deals?.[0] ? {
      id: onlinerDeals.data.deals[0].id,
      title: onlinerDeals.data.deals[0].title,
      currentPrice: onlinerDeals.data.deals[0].currentPrice,
      honestDiscountPercent: onlinerDeals.data.deals[0].honestDiscountPercent,
      onlinerOffers: onlinerDeals.data.deals[0].onlinerOffers,
    } : null,
    recommendations: onlinerDeals.data?.recommendations || [],
  },
  externalPrice: {
    status: primaryExternalPrice.status,
    ok: readyExternalPriceChecks.length > 0,
    readyForExternalPricePilot: readyExternalPriceChecks.length > 0,
    readyCount: readyExternalPriceChecks.length,
    checkedCount: externalPriceChecks.length,
    partialFailures: partialExternalPriceFailures.length,
    productId: primaryExternalPrice.data?.product?.id,
    fiveElement: {
      enabled: primaryExternalPrice.data?.fiveElement?.enabled,
      keyConfigured: primaryExternalPrice.data?.fiveElement?.keyConfigured,
      status: primaryExternalPrice.data?.fiveElement?.source?.status,
      offersCount: primaryExternalPrice.data?.fiveElement?.source?.offersCount,
      minPrice: primaryExternalPrice.data?.fiveElement?.source?.minPrice,
    },
    checks: externalPriceChecks.map((check) => ({
      input: check.input,
      status: check.status,
      ok: check.ok,
      readyForExternalPricePilot: check.data?.readyForExternalPricePilot,
      productId: check.data?.product?.id,
      sourceStatus: check.data?.fiveElement?.source?.status,
      offersCount: check.data?.fiveElement?.source?.offersCount,
      minPrice: check.data?.fiveElement?.source?.minPrice,
    })),
    recommendations: [
      ...(readyExternalPriceChecks.length ? [] : ["No external price pilot control item is currently ready."]),
      ...(partialExternalPriceFailures.length
        ? [`${partialExternalPriceFailures.length} external price control item(s) did not return a matched pilot offer; keep 5element labeled as pilot.`]
        : []),
    ],
  },
  channel: {
    status: channel.status,
    ok: channel.ok,
    deliveryEnabled: channel.data?.deliveryEnabled,
    channelCronEnabled: channel.data?.channelCronEnabled,
    dealDedupeConfigured: channel.data?.dealDedupeConfigured,
    externalPricePilotEnabled: channel.data?.externalPricePilotEnabled,
    auditConfigured: channel.data?.audit?.configured,
    startedOk: channelMaturity.startedOk,
    mature24hOk: channelMaturity.mature24hOk,
    schedulerHistorySpanHours: channelMaturity.schedulerHistorySpanHours,
    minSchedulerRunsFor24h: channelMaturity.minSchedulerRunsFor24h,
    minSchedulerHistorySpanHours: channelMaturity.minSchedulerHistorySpanHours,
    schedulerEvidence: channel.data?.schedulerEvidence ? {
      hasSchedulerRun: channel.data.schedulerEvidence.hasSchedulerRun,
      schedulerRuns: channel.data.schedulerEvidence.schedulerRuns,
      latestSchedulerRunAgeHours: channel.data.schedulerEvidence.latestSchedulerRunAgeHours,
      latestSchedulerRun: channel.data.schedulerEvidence.latestSchedulerRun,
    } : null,
    schedulerHistory: {
      oldestSchedulerRun: channelMaturity.oldestSchedulerRun
        ? {
            at: channelMaturity.oldestSchedulerRun.at,
            trigger: channelMaturity.oldestSchedulerRun.trigger,
            published: channelMaturity.oldestSchedulerRun.published,
            reason: channelMaturity.oldestSchedulerRun.reason,
            selectedId: channelMaturity.oldestSchedulerRun.selected?.id,
          }
        : null,
      startedFailures: channelMaturity.startedFailures,
      mature24hFailures: channelMaturity.mature24hFailures,
    },
    latestRun: channel.data?.audit?.latestRun ? {
      at: channel.data.audit.latestRun.at,
      trigger: channel.data.audit.latestRun.trigger,
      published: channel.data.audit.latestRun.published,
      reason: channel.data.audit.latestRun.reason,
      selectedId: channel.data.audit.latestRun.selected?.id,
    } : null,
    recentRuns: channel.data?.audit?.recentRuns?.length || 0,
    recommendations: channel.data?.recommendations || [],
  },
  priceWatch: {
    status: priceWatch.status,
    ok: priceWatch.ok,
    enabled: priceWatch.data?.enabled,
    kvConfigured: priceWatch.data?.kvConfigured,
    schedulerEvidence: priceWatch.data?.schedulerEvidence ? {
      hasSchedulerRun: priceWatch.data.schedulerEvidence.hasSchedulerRun,
      schedulerRuns: priceWatch.data.schedulerEvidence.schedulerRuns,
      latestScheduledRunAgeHours: priceWatch.data.schedulerEvidence.latestScheduledRunAgeHours,
      latestScheduledRun: priceWatch.data.schedulerEvidence.latestScheduledRun,
    } : undefined,
    totalIndexed: priceWatch.data?.totalIndexed,
    activeSample: priceWatch.data?.activeSample,
    scanLimit: priceWatch.data?.scanLimit,
    defaultDropPercent: priceWatch.data?.defaultDropPercent,
    notifyCooldownHours: priceWatch.data?.notifyCooldownHours,
    notificationDoctor: {
      status: priceWatchDoctor.status,
      ok: priceWatchDoctor.ok,
      readyForNotificationPath: priceWatchDoctor.data?.readyForNotificationPath,
      productId: priceWatchDoctor.data?.product?.id,
      shouldNotify: priceWatchDoctor.data?.simulatedSubscription?.shouldNotify,
      dryRun: priceWatchDoctor.data?.dryRun,
      appUrl: priceWatchDoctor.data?.appUrl,
    },
    scanDoctor: {
      status: priceWatchScanDoctor.status,
      ok: priceWatchScanDoctor.ok,
      readyForScheduledScanPath: priceWatchScanDoctor.data?.readyForScheduledScanPath,
      productId: priceWatchScanDoctor.data?.product?.id,
      checked: priceWatchScanDoctor.data?.scan?.checked,
      active: priceWatchScanDoctor.data?.scan?.active,
      notified: priceWatchScanDoctor.data?.scan?.notified,
      failed: priceWatchScanDoctor.data?.scan?.failed,
      dryRunDelivery: priceWatchScanDoctor.data?.dryRunDelivery,
      temporarySubscriptionCleanedUp: priceWatchScanDoctor.data?.temporarySubscription?.cleanedUp,
    },
    recommendations: priceWatch.data?.recommendations || [],
  },
}, null, 2));
