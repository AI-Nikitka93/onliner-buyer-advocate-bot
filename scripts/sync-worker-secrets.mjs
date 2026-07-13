import "dotenv/config";
import { spawn } from "node:child_process";

const requiredSecrets = ["TELEGRAM_BOT_TOKEN", "ADMIN_API_TOKEN", "TELEGRAM_WEBHOOK_SECRET"];
const optionalSecrets = ["TELEGRAM_CHANNEL_ID"];
const allSecrets = process.argv.includes("--include-channel")
  ? [...requiredSecrets, ...optionalSecrets]
  : requiredSecrets;

function isPlaceholder(value) {
  return !value || /PASTE_|change_me|MY_|your_/.test(value);
}

function wranglerBin() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function putSecret(name, value) {
  return new Promise((resolve, reject) => {
    const child = spawn(wranglerBin(), ["wrangler", "secret", "put", name], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ name, uploaded: true });
      else reject(new Error(`${name} upload failed with code ${code}\n${stdout}\n${stderr}`));
    });
    child.stdin.write(`${value}\n`);
    child.stdin.end();
  });
}

const results = [];
for (const name of allSecrets) {
  const value = process.env[name] || "";
  if (isPlaceholder(value)) {
    const required = requiredSecrets.includes(name);
    results.push({ name, uploaded: false, required, reason: "missing_or_placeholder" });
    if (required) process.exitCode = 1;
    continue;
  }
  results.push(await putSecret(name, value));
}

console.log(JSON.stringify({ ok: process.exitCode !== 1, results }, null, 2));
