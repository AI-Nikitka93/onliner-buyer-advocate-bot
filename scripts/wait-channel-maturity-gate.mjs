import "dotenv/config";
import { channelGateFailures, channelMaturitySummary } from "./channel-maturity.mjs";

const workerUrl = (process.env.WORKER_URL || "https://onliner-buyer-advocate-bot.alexaiartbel.workers.dev").replace(/\/$/, "");
const adminToken = process.env.ADMIN_API_TOKEN || "";
const waitMinutes = Math.max(1, Number(process.env.CHANNEL_GATE_WAIT_MINUTES || 90) || 90);
const pollSeconds = Math.max(10, Number(process.env.CHANNEL_GATE_POLL_SECONDS || 60) || 60);
const once = process.env.CHANNEL_GATE_ONCE === "true";
const require24h = process.argv.includes("--require-24h") || process.env.CHANNEL_GATE_REQUIRE_24H === "true";

if (!adminToken || /change_me|your_|PASTE_|MY_/.test(adminToken)) {
  throw new Error("ADMIN_API_TOKEN is missing or placeholder in .env");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readStatus() {
  const response = await fetch(`${workerUrl}/api/channel/status`, {
    headers: { "x-admin-token": adminToken },
  });
  const status = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`channel/status HTTP ${response.status}`);
  return status;
}

const deadline = Date.now() + waitMinutes * 60_000;
let lastSummary = null;

while (Date.now() <= deadline) {
  const status = await readStatus();
  const maturity = channelMaturitySummary(status);
  const failures = channelGateFailures(status, { require24h });
  const evidence = status.schedulerEvidence || {};
  lastSummary = {
    ok: failures.length === 0,
    require24h,
    checkedAt: new Date().toISOString(),
    workerUrl,
    channelCronEnabled: status.channelCronEnabled,
    dealDedupeConfigured: status.dealDedupeConfigured,
    startedOk: maturity.startedOk,
    mature24hOk: maturity.mature24hOk,
    schedulerEvidence: {
      hasSchedulerRun: Boolean(evidence.hasSchedulerRun),
      schedulerRuns: evidence.schedulerRuns || 0,
      latestSchedulerRunAgeHours: evidence.latestSchedulerRunAgeHours ?? null,
      latestSchedulerRun: evidence.latestSchedulerRun || null,
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
    startedFailures: maturity.startedFailures,
    mature24hFailures: maturity.mature24hFailures,
    failures,
  };

  console.log(JSON.stringify(lastSummary, null, 2));
  if (!failures.length) process.exit(0);
  if (once) process.exit(1);
  await wait(pollSeconds * 1000);
}

console.error(JSON.stringify({
  ok: false,
  timedOut: true,
  waitMinutes,
  pollSeconds,
  lastSummary,
}, null, 2));
process.exit(1);
