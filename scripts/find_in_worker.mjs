import fs from "fs";
import path from "path";

const workerPath = "worker/index.ts";
const content = fs.readFileSync(workerPath, "utf8");
const lines = content.split("\n");

function search(query) {
  console.log(`\n=== Searching for "${query}" ===`);
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
}

search("DEAL_ALERTS_KV");
search("5element");
search("5 элемент");
search("DEAL_REPOST_COOLDOWN_HOURS");
search("isFakeDiscount");
search("medianPrice90Days");
