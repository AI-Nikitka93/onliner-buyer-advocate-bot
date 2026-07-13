import assert from "node:assert/strict";
import { channelGateFailures, channelMaturitySummary } from "./channel-maturity.mjs";

function schedulerRun(at, id) {
  return {
    id,
    at,
    trigger: "scheduler",
    dryRun: false,
    force: false,
    published: false,
    reason: "duplicate_suppressed",
    elapsedMs: 100,
    selected: { id: `product-${id}` },
  };
}

function statusWithRuns(runs) {
  const latest = runs[0] || null;
  return {
    channelConfigured: true,
    deliveryEnabled: true,
    channelCronEnabled: true,
    dealDedupeConfigured: true,
    audit: {
      configured: true,
      latestRun: latest,
      recentRuns: runs,
    },
    schedulerEvidence: {
      hasSchedulerRun: Boolean(latest),
      schedulerRuns: runs.length,
      latestSchedulerRunAgeHours: latest ? 0.1 : null,
      staleAfterHours: 7,
      latestSchedulerRun: latest
        ? {
            at: latest.at,
            published: latest.published,
            reason: latest.reason,
            selectedId: latest.selected.id,
          }
        : null,
    },
  };
}

const oneRunStatus = statusWithRuns([
  schedulerRun("2026-05-22T00:00:00.000Z", "r1"),
]);
const oneRun = channelMaturitySummary(oneRunStatus);
assert.equal(oneRun.startedOk, true);
assert.equal(oneRun.mature24hOk, false);
assert.deepEqual(channelGateFailures(oneRunStatus), []);
assert.ok(channelGateFailures(oneRunStatus, { require24h: true }).length > 0);
assert.match(oneRun.mature24hFailures.join("\n"), /schedulerRuns 1 < 5/);

const matureStatus = statusWithRuns([
  schedulerRun("2026-05-22T00:00:00.000Z", "r5"),
  schedulerRun("2026-05-21T18:00:00.000Z", "r4"),
  schedulerRun("2026-05-21T12:00:00.000Z", "r3"),
  schedulerRun("2026-05-21T06:00:00.000Z", "r2"),
  schedulerRun("2026-05-21T00:00:00.000Z", "r1"),
]);
const mature = channelMaturitySummary(matureStatus);
assert.equal(mature.startedOk, true);
assert.equal(mature.mature24hOk, true);
assert.equal(mature.schedulerRuns, 5);
assert.equal(mature.schedulerHistorySpanHours, 24);
assert.deepEqual(channelGateFailures(matureStatus, { require24h: true }), []);

const noRun = channelMaturitySummary(statusWithRuns([]));
assert.equal(noRun.startedOk, false);
assert.equal(noRun.mature24hOk, false);
assert.match(noRun.startedFailures.join("\n"), /no scheduler-run/);

console.log("channel maturity tests passed");
