import assert from "node:assert/strict";
import worker from "../src/worker.js";

// Explicit live integration test: fake RSS + isolated in-memory KV + real Telegram.
// Sends exactly one message to General through the existing production Worker.
const token = process.env.TG_NEWS_BOT;
const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
if (!token || !chatId) throw new Error("Set TG_NEWS_BOT and TELEGRAM_GROUP_CHAT_ID in .dev.vars");
if (!process.argv.includes("--send")) {
  console.log("Add --send to send one real test message to the configured group's General topic.");
  process.exit(0);
}

const realFetch = globalThis.fetch;
const store = new Map();
const env = {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_CHANNEL_ID: chatId,
  NEWS_CACHE: {
    async get(key, options) {
      const value = store.get(key) ?? null;
      return options?.type === "json" && value ? JSON.parse(value) : value;
    },
    async put(key, value) { store.set(key, value); }
  }
};
let phase = "baseline";
let attempts = 0;
let deliveredId;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith("https://api.telegram.org/")) {
    attempts++;
    assert.equal(attempts, 1, "Refusing more than one Telegram request");
    let response;
    try { response = await realFetch(url, { ...options, signal: AbortSignal.timeout(20000) }); }
    catch { throw new Error("Telegram connection failed (credentials hidden)"); }
    const payload = await response.clone().json();
    if (!response.ok || !payload.ok) throw new Error(`Telegram rejected test: HTTP ${response.status}`);
    assert.equal(String(payload.result.chat.id), String(chatId));
    deliveredId = payload.result.message_id;
    return response;
  }
  if (String(url) !== "https://9to5mac.com/feed/") return new Response("", { status: 404 });
  return new Response(`<rss><channel><item>
    <title>Локальный тест Worker: Telegram работает</title>
    <description>Сообщение отправлено с Windows через обработчик scheduled(). RSS и KV тестовые; Cloudflare production не изменён.</description>
    <link>https://example.com/local-worker-test/${phase}/${process.pid}</link>
    <pubDate>${new Date().toUTCString()}</pubDate>
  </item></channel></rss>`);
};
async function tick() {
  const pending = [];
  await worker.scheduled({}, env, { waitUntil(p) { pending.push(p); } });
  await Promise.all(pending);
}
try {
  await tick();
  assert.equal(attempts, 0, "First run must only initialize the cache");
  phase = "new";
  await tick();
  assert.equal(attempts, 1);
  assert.ok(deliveredId);
  await tick();
  assert.equal(attempts, 1, "Repeated cron must not duplicate the message");
  console.log(`PASS: one real Telegram message delivered (message_id=${deliveredId}); baseline and deduplication passed.`);
} catch (error) {
  console.error(String(error.message).replaceAll(token, "[redacted]"));
  process.exitCode = 1;
} finally {
  globalThis.fetch = realFetch;
}
