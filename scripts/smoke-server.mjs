import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const port = Number(process.env.SMOKE_PORT || 3099);
const baseUrl = `http://127.0.0.1:${port}`;
const adminToken = process.env.SMOKE_ADMIN_TOKEN || "smoke-admin-token";
const runtimeStatePath = `data/smoke-server-${port}.json`;

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

  throw new Error("Server did not become healthy.");
}

async function postJson(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function getJson(path, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
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
    ADMIN_API_TOKEN: adminToken,
    AUTO_PUBLISH_CHANNEL: "false",
    RUNTIME_STATE_PATH: runtimeStatePath,
    GEMINI_API_KEY: "MY_GEMINI_API_KEY",
    TELEGRAM_BOT_TOKEN: "",
    TELEGRAM_CHANNEL_ID: "",
    ENABLE_TELEGRAM_DELIVERY: "false",
    ONLINER_FETCH_TIMEOUT_MS: "500",
    ONLINER_SEARCH_SCHEMAS: "mobile",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

const logs = [];
child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
child.stderr.on("data", (chunk) => logs.push(chunk.toString()));

try {
  const health = await waitForHealth();
  assert(health.security?.adminRequired === true, "Admin protection must be required in production.");
  assert(health.security?.adminTokenConfigured === true, "Admin token must be visible as configured.");

  const unauthorized = await postJson("/api/generate-channel-post", {
    productId: "iphone15",
    criticLevel: "normal",
  });
  assert(unauthorized.response.status === 401, "Protected channel endpoint must reject missing admin token.");

  const unauthorizedDoctor = await getJson("/api/telegram/doctor");
  assert(unauthorizedDoctor.response.status === 401, "Telegram doctor must reject missing admin token.");

  const unauthorizedOnlinerDoctor = await getJson("/api/onliner/doctor");
  assert(unauthorizedOnlinerDoctor.response.status === 401, "Onliner doctor must reject missing admin token.");

  const doctor = await getJson("/api/telegram/doctor", { "x-admin-token": adminToken });
  assert(doctor.response.ok, "Telegram doctor must accept valid admin token.");
  assert(doctor.data?.readyForLiveDelivery === false, "Telegram doctor must stay false without token/channel.");
  assert(doctor.data?.status?.tokenConfigured === false, "Telegram doctor must report missing token in smoke mode.");

  const onlinerDoctor = await getJson("/api/onliner/doctor?query=redmi%20note%2015%20pro", { "x-admin-token": adminToken });
  assert(onlinerDoctor.response.ok, "Onliner doctor must return a structured readiness payload with valid admin token.");
  assert(typeof onlinerDoctor.data?.readyForLiveSource === "boolean", "Onliner doctor must expose readyForLiveSource.");
  assert(typeof onlinerDoctor.data?.status === "string", "Onliner doctor must expose source status.");

  const authorized = await postJson(
    "/api/generate-channel-post",
    { productId: "iphone15", criticLevel: "normal", publishToTelegram: false },
    { "x-admin-token": adminToken },
  );
  assert(authorized.response.ok, "Protected channel post endpoint must accept valid admin token.");
  assert(authorized.data?.post?.productId === "iphone15", "Channel post smoke must use the deterministic demo product.");
  assert(authorized.data?.delivery?.dryRun === true, "Channel post smoke must stay in dry-run mode.");

  const products = await fetch(`${baseUrl}/api/products`).then((response) => response.json());
  assert(Array.isArray(products), "Products endpoint must return an array.");
  assert(products.some((product) => product.id === "iphone15"), "Products endpoint must expose seeded demo products.");

  const unknownAnalysis = await postJson("/api/analyze-link", {
    linkOrTitle: "zzzz-no-such-product-20260521",
  });
  assert(unknownAnalysis.response.status === 404, "Unknown products must not create synthetic buyer evidence.");
  assert(unknownAnalysis.data?.found === false, "Unknown analysis must return found=false.");
  assert(!unknownAnalysis.data?.product, "Unknown analysis must not return a fake product.");
  assert(!unknownAnalysis.data?.isMocked && !unknownAnalysis.data?.isAiGenerated, "Unknown analysis must not be mocked or AI-generated.");

  const posts = await fetch(`${baseUrl}/api/channel/posts?limit=5`).then((response) => response.json());
  assert(Array.isArray(posts.posts), "Channel posts endpoint must return an array.");

  const audit = await getJson("/api/onliner/audit-runs?limit=5", { "x-admin-token": adminToken });
  assert(audit.response.ok, "Onliner audit endpoint must accept valid admin token.");
  assert(Array.isArray(audit.data?.runs), "Onliner audit endpoint must return an array.");
  assert(audit.data.runs.some((run) => run.type === "onliner_doctor"), "Onliner audit must include the doctor run.");

  console.log(JSON.stringify({
    ok: true,
    health: {
      adminRequired: health.security.adminRequired,
      schedulerEnabled: health.channelScheduler.enabled,
      liveCachedProducts: health.onliner.liveCachedProducts,
    },
    authorizedChannelDryRun: {
      productId: authorized.data.post.productId,
      deliveryStatus: authorized.data.post.deliveryStatus,
      dryRun: authorized.data.delivery.dryRun,
    },
    telegramDoctor: {
      ok: doctor.data.ok,
      readyForLiveDelivery: doctor.data.readyForLiveDelivery,
      tokenConfigured: doctor.data.status.tokenConfigured,
      recommendations: doctor.data.recommendations,
    },
    onlinerDoctor: {
      ok: onlinerDoctor.data.ok,
      readyForLiveSource: onlinerDoctor.data.readyForLiveSource,
      status: onlinerDoctor.data.status,
      cacheFallback: Boolean(onlinerDoctor.data.cacheFallback),
    },
    productsCount: products.length,
    channelPostsCount: posts.posts.length,
    auditRunsCount: audit.data.runs.length,
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
