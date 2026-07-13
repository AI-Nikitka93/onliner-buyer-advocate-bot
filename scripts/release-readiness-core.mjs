import { channelMaturitySummary } from "./channel-maturity.mjs";

function ok(value) {
  return Boolean(value);
}

function sourceSummary(productPayload) {
  const sources = productPayload?.product?.priceComparison?.sources || [];
  const onliner = sources.find((source) => source.source === "onliner_marketplace");
  const externalPilot = sources.find((source) => source.source === "external_5element");
  return {
    productId: productPayload?.product?.id,
    onliner,
    externalPilot,
    hasSourceConfidence: sources.every((source) => source.sourceType && source.confidence),
    hasBroadExternalPlaceholder: sources.some((source) => source.source === "external_sites" && source.status === "ok"),
  };
}

export function buildReleaseReadiness(input) {
  const channelMaturity = channelMaturitySummary(input.channel?.data || {}, {
    responseOk: input.channel?.ok,
    responseStatus: input.channel?.status,
  });
  const externalChecks = input.externalPriceChecks || [];
  const readyExternal = externalChecks.filter((check) => check.ok && check.data?.readyForExternalPricePilot);
  const partialExternalFailures = externalChecks.filter((check) => !check.ok || !check.data?.readyForExternalPricePilot);
  const productSources = sourceSummary(input.product?.data);

  const requiredChecks = [
    {
      id: "telegram_live_delivery",
      ok: ok(input.telegram?.ok && input.telegram.data?.readyForLiveDelivery && input.telegram.data?.readyForChannelCron),
      evidence: {
        status: input.telegram?.status,
        botUsername: input.telegram?.data?.checks?.bot?.username,
        channelOk: Boolean(input.telegram?.data?.checks?.channelAdmin?.ok),
        webhookConfigured: Boolean(input.telegram?.data?.checks?.webhook?.configured),
        pendingUpdateCount: input.telegram?.data?.checks?.webhook?.pendingUpdateCount ?? null,
      },
    },
    {
      id: "onliner_live_source",
      ok: ok(input.onliner?.ok && input.onliner.data?.readyForLiveSource),
      evidence: {
        status: input.onliner?.status,
        productId: input.onliner?.data?.product?.id,
        historyPoints: input.onliner?.data?.product?.historyPoints?.length,
      },
    },
    {
      id: "onliner_discount_radar",
      ok: ok(input.onlinerDeals?.ok && input.onlinerDeals.data?.readyForDiscountRadar),
      evidence: {
        status: input.onlinerDeals?.status,
        source: input.onlinerDeals?.data?.source,
        minDiscountPercent: input.onlinerDeals?.data?.config?.minDiscountPercent,
        rawProductsCount: input.onlinerDeals?.data?.superPrices?.rawProductsCount,
        qualifiedCandidatesCount: input.onlinerDeals?.data?.superPrices?.qualifiedCandidatesCount,
        publishableDealsCount: input.onlinerDeals?.data?.publishableDealsCount,
        firstDealId: input.onlinerDeals?.data?.deals?.[0]?.id,
      },
    },
    {
      id: "channel_started_gate",
      ok: channelMaturity.startedOk,
      evidence: {
        schedulerRuns: channelMaturity.schedulerRuns,
        latestSchedulerRun: channelMaturity.latestSchedulerRun,
        startedFailures: channelMaturity.startedFailures,
      },
    },
    {
      id: "price_watch_notification_preview",
      ok: ok(input.priceWatchDoctor?.ok && input.priceWatchDoctor.data?.readyForNotificationPath && input.priceWatchDoctor.data?.simulatedSubscription?.shouldNotify),
      evidence: {
        status: input.priceWatchDoctor?.status,
        productId: input.priceWatchDoctor?.data?.product?.id,
        dryRun: input.priceWatchDoctor?.data?.dryRun,
        shouldNotify: input.priceWatchDoctor?.data?.simulatedSubscription?.shouldNotify,
      },
    },
    {
      id: "price_watch_scanner_dry_run",
      ok: ok(
        input.priceWatchScanDoctor?.ok &&
        input.priceWatchScanDoctor.data?.readyForScheduledScanPath &&
        input.priceWatchScanDoctor.data?.telegramSent === false &&
        input.priceWatchScanDoctor.data?.temporarySubscription?.cleanedUp,
      ),
      evidence: {
        status: input.priceWatchScanDoctor?.status,
        productId: input.priceWatchScanDoctor?.data?.product?.id,
        checked: input.priceWatchScanDoctor?.data?.scan?.checked,
        active: input.priceWatchScanDoctor?.data?.scan?.active,
        notified: input.priceWatchScanDoctor?.data?.scan?.notified,
        failed: input.priceWatchScanDoctor?.data?.scan?.failed,
        cleanedUp: input.priceWatchScanDoctor?.data?.temporarySubscription?.cleanedUp,
      },
    },
    {
      id: "source_honesty_metadata",
      ok: ok(
        input.product?.ok &&
        productSources.onliner?.sourceType === "marketplace" &&
        productSources.onliner?.confidence === "high" &&
        (!productSources.externalPilot || (
          productSources.externalPilot.sourceType === "external_pilot" &&
          productSources.externalPilot.confidence === "pilot"
        )) &&
        productSources.hasSourceConfidence &&
        !productSources.hasBroadExternalPlaceholder
      ),
      evidence: productSources,
    },
    {
      id: "external_price_pilot_control",
      ok: readyExternal.length > 0,
      evidence: {
        readyCount: readyExternal.length,
        checkedCount: externalChecks.length,
        partialFailures: partialExternalFailures.length,
      },
    },
  ];

  const productionUsableOk = requiredChecks.every((check) => check.ok);
  const publicReleaseMatureOk = productionUsableOk && channelMaturity.mature24hOk;

  return {
    ok: productionUsableOk,
    productionUsableOk,
    publicReleaseMatureOk,
    generatedAt: new Date().toISOString(),
    requiredChecks,
    maturity: {
      channelMature24hOk: channelMaturity.mature24hOk,
      schedulerRuns: channelMaturity.schedulerRuns,
      schedulerHistorySpanHours: channelMaturity.schedulerHistorySpanHours,
      minSchedulerRunsFor24h: channelMaturity.minSchedulerRunsFor24h,
      minSchedulerHistorySpanHours: channelMaturity.minSchedulerHistorySpanHours,
      failures: channelMaturity.mature24hFailures,
    },
    externalPilot: {
      ok: readyExternal.length > 0,
      readyCount: readyExternal.length,
      checkedCount: externalChecks.length,
      partialFailures: partialExternalFailures.length,
      checks: externalChecks.map((check) => ({
        input: check.input,
        status: check.status,
        ok: check.ok,
        readyForExternalPricePilot: check.data?.readyForExternalPricePilot,
        productId: check.data?.product?.id,
        sourceStatus: check.data?.fiveElement?.source?.status,
        offersCount: check.data?.fiveElement?.source?.offersCount,
        minPrice: check.data?.fiveElement?.source?.minPrice,
      })),
      warning: partialExternalFailures.length
        ? `${partialExternalFailures.length} external pilot control item(s) did not return a matched offer; keep it labeled as pilot.`
        : undefined,
    },
    recommendations: [
      ...requiredChecks.filter((check) => !check.ok).map((check) => `Required check failed: ${check.id}`),
      ...(channelMaturity.mature24hOk ? [] : ["24h public-release maturity is not reached yet; keep goal active until strict gate is green."]),
      ...(partialExternalFailures.length ? ["5element remains a pilot, not an all-category/all-sites comparison."] : []),
    ],
  };
}
