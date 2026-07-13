import "dotenv/config";

const workerUrl = process.env.WORKER_URL || "https://onliner-buyer-advocate-bot.georgaishkin.workers.dev";
const adminToken = process.env.ADMIN_API_TOKEN || "";

if (!adminToken || /change_me|your_|PASTE_|MY_/.test(adminToken)) {
  throw new Error("ADMIN_API_TOKEN is missing or placeholder in .env");
}

async function request(path, options = {}) {
  const response = await fetch(`${workerUrl}${path}`, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

const webhookUrl = `${workerUrl.replace(/\/$/, "")}/telegram/webhook`;
const setWebhook = await request("/api/telegram/set-webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
  body: JSON.stringify({ webhookUrl }),
});
const doctor = await request(`/api/telegram/doctor?expectedWebhookUrl=${encodeURIComponent(webhookUrl)}`, {
  headers: { "x-admin-token": adminToken },
});

console.log(JSON.stringify({ workerUrl, webhookUrl, setWebhook, doctor }, null, 2));

const allowedUpdates = doctor.data?.checks?.webhook?.allowedUpdates || [];
if (!setWebhook.ok || !doctor.ok || !doctor.data?.checks?.webhook?.configured || !allowedUpdates.includes("callback_query")) {
  throw new Error("Worker webhook setup is incomplete or callback_query is not enabled");
}
