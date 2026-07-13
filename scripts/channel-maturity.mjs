const DEFAULT_MIN_SCHEDULER_RUNS_FOR_24H = 5;
const DEFAULT_MIN_SCHEDULER_HISTORY_SPAN_HOURS = 24;

function roundHours(value) {
  return Math.round(value * 10) / 10;
}

function validTimestamp(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function channelStartedFailures(status, options = {}) {
  const evidence = status.schedulerEvidence || {};
  const staleAfterHours = Number(evidence.staleAfterHours || 7);
  const latestAge = evidence.latestSchedulerRunAgeHours;
  const failures = [];

  if (options.responseOk === false) failures.push(`channel/status HTTP ${options.responseStatus || "unknown"}`);
  if (!status.channelConfigured) failures.push("TELEGRAM_CHANNEL_ID is not configured");
  if (!status.deliveryEnabled) failures.push("ENABLE_TELEGRAM_DELIVERY is not true");
  if (!status.channelCronEnabled) failures.push("ENABLE_CHANNEL_CRON is not true");
  if (!status.dealDedupeConfigured) failures.push("DEAL_ALERTS_KV is not configured");
  if (!status.audit?.configured) failures.push("channel audit is not configured");
  if (!evidence.hasSchedulerRun) failures.push("no scheduler-run has been recorded in channel audit yet");
  if (typeof latestAge === "number" && latestAge > staleAfterHours) {
    failures.push(`latest scheduler-run is stale: ${latestAge}h > ${staleAfterHours}h`);
  }

  return failures;
}

export function schedulerHistory(status, options = {}) {
  const evidence = status.schedulerEvidence || {};
  const minSchedulerRunsFor24h = Number(options.minSchedulerRunsFor24h || DEFAULT_MIN_SCHEDULER_RUNS_FOR_24H);
  const minSchedulerHistorySpanHours = Number(options.minSchedulerHistorySpanHours || DEFAULT_MIN_SCHEDULER_HISTORY_SPAN_HOURS);
  const auditRuns = Array.isArray(status.audit?.recentRuns) ? status.audit.recentRuns : [];
  const schedulerRuns = auditRuns
    .filter((run) => run?.trigger === "scheduler" && validTimestamp(run.at) !== null)
    .sort((a, b) => validTimestamp(b.at) - validTimestamp(a.at));
  const runCount = Number(evidence.schedulerRuns || schedulerRuns.length || 0);
  const timestamps = schedulerRuns.map((run) => validTimestamp(run.at)).filter((value) => value !== null);
  const latestTimestamp = timestamps.length ? Math.max(...timestamps) : validTimestamp(evidence.latestSchedulerRun?.at);
  const oldestTimestamp = timestamps.length ? Math.min(...timestamps) : latestTimestamp;
  const schedulerHistorySpanHours = latestTimestamp !== null && oldestTimestamp !== null && latestTimestamp >= oldestTimestamp
    ? roundHours((latestTimestamp - oldestTimestamp) / 36e5)
    : 0;

  return {
    schedulerRuns: runCount,
    schedulerHistorySpanHours,
    minSchedulerRunsFor24h,
    minSchedulerHistorySpanHours,
    latestSchedulerRun: evidence.latestSchedulerRun || schedulerRuns[0] || null,
    oldestSchedulerRun: schedulerRuns.length ? schedulerRuns[schedulerRuns.length - 1] : null,
  };
}

export function channelMaturitySummary(status, options = {}) {
  const startedFailures = channelStartedFailures(status, options);
  const history = schedulerHistory(status, options);
  const mature24hFailures = [];

  if (history.schedulerRuns < history.minSchedulerRunsFor24h) {
    mature24hFailures.push(`schedulerRuns ${history.schedulerRuns} < ${history.minSchedulerRunsFor24h}`);
  }
  if (history.schedulerHistorySpanHours < history.minSchedulerHistorySpanHours) {
    mature24hFailures.push(`scheduler history span ${history.schedulerHistorySpanHours}h < ${history.minSchedulerHistorySpanHours}h`);
  }

  return {
    startedOk: startedFailures.length === 0,
    mature24hOk: startedFailures.length === 0 && mature24hFailures.length === 0,
    ...history,
    startedFailures,
    mature24hFailures,
  };
}

export function channelGateFailures(status, options = {}) {
  const summary = channelMaturitySummary(status, options);
  return options.require24h
    ? [...summary.startedFailures, ...summary.mature24hFailures]
    : summary.startedFailures;
}
