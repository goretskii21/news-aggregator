import { setTimeout as delay } from "node:timers/promises";

async function tick() {
  const response = await fetch("http://127.0.0.1:8787/cdn-cgi/local/scheduled", {
    signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  console.log(`${new Date().toISOString()} Local cron invoked.`);
}

const watch = process.argv.includes("--watch");
do {
  try { await tick(); }
  catch {
    console.error("Local cron failed. Start the local Worker and check its output.");
    if (!watch) process.exitCode = 1;
  }
  if (watch) await delay(10 * 60 * 1000);
} while (watch);
