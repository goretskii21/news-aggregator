import assert from "node:assert/strict";
import worker from "../src/worker.js";

class MemoryKV {
  constructor() {
    this.store = new Map();
    this.getCount = 0;
    this.putCount = 0;
  }

  async get(key, options) {
    this.getCount += 1;
    const entry = this.store.get(key);
    if (!entry || (entry.expiresAt && entry.expiresAt <= Date.now())) {
      this.store.delete(key);
      return null;
    }

    return options?.type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  async put(key, value, options = {}) {
    this.putCount += 1;
    this.store.set(key, {
      value,
      expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : 0
    });
  }
}

function createEnv(overrides = {}) {
  return {
    NEWS_CACHE: new MemoryKV(),
    ...overrides
  };
}

function createCtx() {
  const promises = [];
  return {
    waitUntil(promise) {
      promises.push(Promise.resolve(promise));
    },
    async flush() {
      await Promise.all(promises);
    }
  };
}

function request(path) {
  return new Request(`https://example.com${path}`);
}

let rssFetches = 0;
const telegramMessages = [];

globalThis.fetch = async (url, options = {}) => {
  if (String(url).startsWith("https://api.telegram.org/")) {
    const body = JSON.parse(options.body || "{}");
    telegramMessages.push({ url: String(url), body });
    return new Response(JSON.stringify({ ok: true, result: { message_id: telegramMessages.length } }), {
      headers: { "content-type": "application/json" }
    });
  }

  rssFetches += 1;
  return new Response(`<?xml version="1.0" encoding="utf-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Smoke test news</title>
          <description>Smoke test excerpt</description>
          <link>/news/smoke</link>
          <pubDate>Tue, 30 Jun 2026 12:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Escaped html news</title>
          <description>&lt;img src=&quot;https://example.com/image.webp&quot; /&gt;&lt;p&gt;Clean text after media tag&lt;/p&gt;</description>
          <link>/news/escaped</link>
          <pubDate>Tue, 30 Jun 2026 12:01:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" }
  });
};

{
  const response = await worker.fetch(request("/"));
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not Found");
}

{
  const env = createEnv();
  const ctx = createCtx();
  await worker.scheduled({}, env, ctx);
  await ctx.flush();

  assert.ok(rssFetches > 0);
  assert.equal(env.NEWS_CACHE.putCount, 1);
  assert.equal(telegramMessages.length, 0);

  const payload = await env.NEWS_CACHE.get("news:all", { type: "json" });
  assert.ok(payload.updatedAt);
  assert.ok(payload.items.length > 0);

  const escapedHtmlItem = payload.items.find((item) => item.title === "Escaped html news");
  assert.ok(escapedHtmlItem);
  assert.equal(escapedHtmlItem.excerpt, "Clean text after media tag");
  assert.doesNotMatch(escapedHtmlItem.excerpt, /<img|src=|<p>/i);
}

{
  const env = createEnv({
    TELEGRAM_BOT_TOKEN: "telegram-token",
    TELEGRAM_CHANNEL_ID: "@news_channel"
  });
  await env.NEWS_CACHE.put("news:all", JSON.stringify({
    updatedAt: "2026-06-30T11:50:00.000Z",
    items: [{ id: "previous:item", title: "Previous item" }]
  }));

  telegramMessages.length = 0;

  const ctx = createCtx();
  await worker.scheduled({}, env, ctx);
  await ctx.flush();

  assert.equal(telegramMessages.length, 8);
  assert.ok(telegramMessages.every((message) => message.url === "https://api.telegram.org/bottelegram-token/sendMessage"));
  assert.ok(telegramMessages.every((message) => message.body.chat_id === "@news_channel"));
  assert.ok(telegramMessages.every((message) => message.body.parse_mode === "HTML"));
  assert.ok(telegramMessages.every((message) => message.body.text.includes("<b>")));
  assert.ok(telegramMessages.every((message) => message.body.text.includes("<a href=\"https://")));
  assert.ok(telegramMessages.every((message) => !message.body.text.includes("\"><b>")));
  assert.ok(telegramMessages.every((message) => !message.body.text.includes("<img")));

  const secondCtx = createCtx();
  await worker.scheduled({}, env, secondCtx);
  await secondCtx.flush();
  assert.equal(telegramMessages.length, 8);
}

console.log("worker smoke checks passed");
