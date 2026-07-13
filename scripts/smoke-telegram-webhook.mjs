import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const port = Number(process.env.TELEGRAM_SMOKE_PORT || 3100);
const baseUrl = `http://127.0.0.1:${port}`;
const webhookSecret = process.env.TELEGRAM_SMOKE_SECRET || "smoke-secret";
const runtimeStatePath = `data/smoke-telegram-${port}.json`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();
      if (response.ok && data.ok) return data;
    } catch {
      // Server is still starting.
    }
    await wait(250);
  }

  throw new Error("Telegram smoke server did not become healthy.");
}

async function postWebhook(body, secret = webhookSecret) {
  const response = await fetch(`${baseUrl}/telegram/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-telegram-bot-api-secret-token": secret,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const child = spawn(process.execPath, ["dist/server.cjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    RUNTIME_STATE_PATH: runtimeStatePath,
    TELEGRAM_WEBHOOK_SECRET: webhookSecret,
    TELEGRAM_BOT_TOKEN: "",
    TELEGRAM_CHANNEL_ID: "",
    ENABLE_TELEGRAM_DELIVERY: "false",
    AUTO_PUBLISH_CHANNEL: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

const logs = [];
child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
child.stderr.on("data", (chunk) => logs.push(chunk.toString()));

try {
  await waitForHealth();

  const wrongSecret = await postWebhook({
    update_id: 1,
    message: { chat: { id: 101 }, text: "/start" },
  }, "wrong-secret");
  assert(wrongSecret.response.status === 403, "Webhook must reject invalid Telegram secret.");

  const start = await postWebhook({
    update_id: 2,
    message: { chat: { id: 101 }, text: "/start" },
  });
  assert(start.response.ok && start.data.ok === true, "Webhook /start must return ok.");
  assert(start.data.delivery?.dryRun === true, "Webhook /start must stay dry-run without token.");
  assert(String(start.data.delivery?.preview || "").includes("цифровой адвокат"), "Webhook /start preview must contain bot intro.");

  const health = await postWebhook({
    update_id: 3,
    message: { chat: { id: 101 }, text: "/health" },
  });
  assert(health.response.ok && health.data.ok === true, "Webhook /health must return ok.");
  assert(health.data.delivery?.dryRun === true, "Webhook /health must be dry-run without token.");

  const ignored = await postWebhook({
    update_id: 4,
    message: { chat: { id: 101 }, text: "" },
  });
  assert(ignored.response.ok && ignored.data.ignored === true, "Webhook must ignore empty text updates.");

  console.log(JSON.stringify({
    ok: true,
    invalidSecretStatus: wrongSecret.response.status,
    startDryRun: start.data.delivery.dryRun,
    healthDryRun: health.data.delivery.dryRun,
    emptyUpdateIgnored: ignored.data.ignored,
  }, null, 2));
} catch (error) {
  console.error(logs.join(""));
  console.error(error);
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
  await rm(runtimeStatePath, { force: true });
  await rm(`${runtimeStatePath}.tmp`, { force: true });
}
