import { spawn } from "node:child_process";
import { createServer } from "node:net";

const image = process.env.DOCKER_IMAGE || "onliner-buyer-advocate-bot:local";
const containerName = `onliner-buyer-advocate-bot-smoke-${Date.now()}`;
const healthTimeoutMs = Number(process.env.DOCKER_SMOKE_TIMEOUT_MS || 60000);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";
    if (options.capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || options.allowFailure) {
        resolve({ code, stdout, stderr });
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}${stderr ? `\n${stderr}` : ""}`));
      }
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(() => {
        if (port) resolve(port);
        else reject(new Error("Could not allocate a local Docker smoke port."));
      });
    });
  });
}

async function waitForHealth(port) {
  const deadline = Date.now() + healthTimeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      const data = await response.json();
      if (response.ok && data?.ok) return data;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await wait(1000);
  }
  throw new Error(`Docker smoke health endpoint did not become ready: ${lastError}`);
}

await run("docker", ["info"], { capture: true });
await run("docker", ["build", "-t", image, "."]);

const port = await getFreePort();
const runResult = await run("docker", [
  "run",
  "--rm",
  "-d",
  "-p",
  `127.0.0.1:${port}:3000`,
  "--name",
  containerName,
  image,
], { capture: true });
const containerId = runResult.stdout.trim();

try {
  const health = await waitForHealth(port);
  console.log(JSON.stringify({
    ok: true,
    image,
    container: containerName,
    containerId,
    port,
    health: {
      ok: health.ok,
      service: health.service,
      geminiConfigured: health.geminiConfigured,
      telegram: health.telegram,
      adminRequired: health.security?.adminRequired,
      productsCount: health.store?.productsCount,
    },
  }, null, 2));
} catch (error) {
  await run("docker", ["logs", containerId], { allowFailure: true });
  throw error;
} finally {
  await run("docker", ["stop", containerId], { capture: true, allowFailure: true });
}
