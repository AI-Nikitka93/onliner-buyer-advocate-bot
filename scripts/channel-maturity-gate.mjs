import "dotenv/config";
import { channelGateFailures, channelMaturitySummary } from "./channel-maturity.mjs";

const workerUrl = (process.env.WORKER_URL || "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev").replace(/\/$/, "");
const adminToken = process.env.ADMIN_API_TOKEN || "";
const require24h = process.argv.includes("--require-24h") || process.env.CHANNEL_GATE_REQUIRE_24H === "true";

if (!adminToken || /change_me|your_|PASTE_|MY_/.test(adminToken)) {
  throw new Error("ADMIN_API_TOKEN is missing or placeholder in .env");
}

const response = await fetch(`${workerUrl}/api/channel/status`, {
  headers: { "x-admin-token": adminToken },
});
const status = await response.json().catch(() => ({}));

const evidence = status.schedulerEvidence || {};
const latest = evidence.latestSchedulerRun || null;
const latestAge = evidence.latestSchedulerRunAgeHours;
const maturity = channelMaturitySummary(status, { responseOk: response.ok, responseStatus: response.status });
const failures = channelGateFailures(status, { responseOk: response.ok, responseStatus: response.status, require24h });

const summary = {
  ok: failures.length === 0,
  require24h,
  workerUrl,
  channelCronEnabled: status.channelCronEnabled,
  dealDedupeConfigured: status.dealDedupeConfigured,
  auditConfigured: status.audit?.configured,
  startedOk: maturity.startedOk,
  mature24hOk: maturity.mature24hOk,
  schedulerEvidence: {
    hasSchedulerRun: Boolean(evidence.hasSchedulerRun),
    schedulerRuns: evidence.schedulerRuns || 0,
    latestSchedulerRunAgeHours: latestAge ?? null,
    latestSchedulerRun: latest,
  },
  schedulerHistory: {
    spanHours: maturity.schedulerHistorySpanHours,
    minSpanHoursFor24h: maturity.minSchedulerHistorySpanHours,
    minSchedulerRunsFor24h: maturity.minSchedulerRunsFor24h,
    oldestSchedulerRun: maturity.oldestSchedulerRun
      ? {
          at: maturity.oldestSchedulerRun.at,
          trigger: maturity.oldestSchedulerRun.trigger,
          published: maturity.oldestSchedulerRun.published,
          reason: maturity.oldestSchedulerRun.reason,
          selectedId: maturity.oldestSchedulerRun.selected?.id,
        }
      : null,
  },
  latestRun: status.audit?.latestRun
    ? {
        at: status.audit.latestRun.at,
        trigger: status.audit.latestRun.trigger,
        published: status.audit.latestRun.published,
        reason: status.audit.latestRun.reason,
        selectedId: status.audit.latestRun.selected?.id,
      }
    : null,
  recommendations: status.recommendations || [],
  startedFailures: maturity.startedFailures,
  mature24hFailures: maturity.mature24hFailures,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
