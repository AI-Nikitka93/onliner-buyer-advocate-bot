import assert from "node:assert/strict";
import { buildReleaseReadiness } from "./release-readiness-core.mjs";

function schedulerRun(at, id) {
  return {
    id,
    at,
    trigger: "scheduler",
    published: false,
    reason: "duplicate_suppressed",
    selected: { id: `product-${id}` },
  };
}

function channelStatus(runs) {
  const latest = runs[0] || null;
  return {
    status: 200,
    ok: true,
    data: {
      channelConfigured: true,
      deliveryEnabled: true,
      channelCronEnabled: true,
      dealDedupeConfigured: true,
      audit: { configured: true, latestRun: latest, recentRuns: runs },
      schedulerEvidence: {
        hasSchedulerRun: Boolean(latest),
        schedulerRuns: runs.length,
        latestSchedulerRunAgeHours: latest ? 0.1 : null,
        staleAfterHours: 7,
        latestSchedulerRun: latest,
      },
    },
  };
}

function baseInput(runs) {
  return {
    telegram: {
      status: 200,
      ok: true,
      data: {
        readyForLiveDelivery: true,
        readyForChannelCron: true,
        checks: {
          bot: { ok: true, username: "BuyerAdvocateBYBot" },
          channelAdmin: { ok: true },
          webhook: { configured: true, pendingUpdateCount: 0 },
        },
      },
    },
    onliner: {
      status: 200,
      ok: true,
      data: { readyForLiveSource: true, product: { id: "redminote15p5ti", historyPoints: [{}, {}] } },
    },
    onlinerDeals: {
      status: 200,
      ok: true,
      data: {
        readyForDiscountRadar: true,
        source: "catalog.api.onliner.by/super-prices",
        config: { minDiscountPercent: 20 },
        superPrices: { rawProductsCount: 20, qualifiedCandidatesCount: 3 },
        publishableDealsCount: 2,
        deals: [{ id: "vrv80a" }],
      },
    },
    channel: channelStatus(runs),
    priceWatchDoctor: {
      status: 200,
      ok: true,
      data: {
        readyForNotificationPath: true,
        dryRun: true,
        product: { id: "redminote15p5ti" },
        simulatedSubscription: { shouldNotify: true },
      },
    },
    priceWatchScanDoctor: {
      status: 200,
      ok: true,
      data: {
        readyForScheduledScanPath: true,
        telegramSent: false,
        product: { id: "redminote15p5ti" },
        scan: { checked: 1, active: 1, notified: 1, failed: 0 },
        temporarySubscription: { cleanedUp: true },
      },
    },
    product: {
      status: 200,
      ok: true,
      data: {
        product: {
          id: "redminote15p1br",
          priceComparison: {
            sources: [
              { source: "onliner_marketplace", sourceType: "marketplace", confidence: "high", status: "ok" },
              { source: "external_5element", sourceType: "external_pilot", confidence: "pilot", status: "ok" },
            ],
          },
        },
      },
    },
    externalPriceChecks: [
      {
        input: "redminote15p5ti",
        status: 200,
        ok: true,
        data: {
          readyForExternalPricePilot: true,
          product: { id: "redminote15p5ti" },
          fiveElement: { source: { status: "ok", offersCount: 1, minPrice: 1399 } },
        },
      },
    ],
  };
}

const startedOnly = buildReleaseReadiness(baseInput([
  schedulerRun("2026-05-22T00:00:00.000Z", "r1"),
]));
assert.equal(startedOnly.productionUsableOk, true);
assert.equal(startedOnly.publicReleaseMatureOk, false);
assert.equal(startedOnly.maturity.channelMature24hOk, false);
assert.ok(startedOnly.recommendations.some((item) => /24h/.test(item)));

const mature = buildReleaseReadiness(baseInput([
  schedulerRun("2026-05-22T00:00:00.000Z", "r5"),
  schedulerRun("2026-05-21T18:00:00.000Z", "r4"),
  schedulerRun("2026-05-21T12:00:00.000Z", "r3"),
  schedulerRun("2026-05-21T06:00:00.000Z", "r2"),
  schedulerRun("2026-05-21T00:00:00.000Z", "r1"),
]));
assert.equal(mature.productionUsableOk, true);
assert.equal(mature.publicReleaseMatureOk, true);

const brokenSourceInput = baseInput([
  schedulerRun("2026-05-22T00:00:00.000Z", "r1"),
]);
brokenSourceInput.product.data.product.priceComparison.sources[1].confidence = undefined;
const brokenSource = buildReleaseReadiness(brokenSourceInput);
assert.equal(brokenSource.productionUsableOk, false);
assert.ok(brokenSource.requiredChecks.find((check) => check.id === "source_honesty_metadata" && !check.ok));

const brokenDealsInput = baseInput([
  schedulerRun("2026-05-22T00:00:00.000Z", "r1"),
]);
brokenDealsInput.onlinerDeals.data.readyForDiscountRadar = false;
brokenDealsInput.onlinerDeals.data.publishableDealsCount = 0;
const brokenDeals = buildReleaseReadiness(brokenDealsInput);
assert.equal(brokenDeals.productionUsableOk, false);
assert.ok(brokenDeals.requiredChecks.find((check) => check.id === "onliner_discount_radar" && !check.ok));

const brokenExternalInput = baseInput([
  schedulerRun("2026-05-22T00:00:00.000Z", "r1"),
]);
brokenExternalInput.externalPriceChecks = [{
  input: "redminote15p5ti",
  status: 200,
  ok: true,
  data: {
    readyForExternalPricePilot: false,
    product: { id: "redminote15p5ti" },
    fiveElement: { source: { status: "unavailable", offersCount: 0 } },
  },
}];
const brokenExternal = buildReleaseReadiness(brokenExternalInput);
assert.equal(brokenExternal.productionUsableOk, false);
assert.ok(brokenExternal.requiredChecks.find((check) => check.id === "external_price_pilot_control" && !check.ok));

console.log("release readiness tests passed");
