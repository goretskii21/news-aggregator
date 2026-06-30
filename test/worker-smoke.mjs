import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
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

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async match(request) {
    const response = this.store.get(request.url);
    return response ? response.clone() : undefined;
  }

  async put(request, response) {
    this.store.set(request.url, response.clone());
  }

  async delete(request) {
    return this.store.delete(request.url);
  }
}

function createEnv(overrides = {}) {
  return {
    REFRESH_TOKEN: "local-refresh-token",
    NEWS_CACHE: new MemoryKV(),
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === "/app.js") {
          return new Response("console.log('ok');", {
            headers: { "content-type": "text/javascript; charset=utf-8" }
          });
        }

        return new Response("<!doctype html><html><body>ok</body></html>", {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }
    },
    ...overrides
  };
}

function createD1() {
  const db = new DatabaseSync(":memory:");
  const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  db.exec(schema);

  return {
    db,
    prepare(sql) {
      return {
        bind(...params) {
          const statement = db.prepare(sql);
          return {
            async all() {
              return { results: statement.all(...params) };
            },
            async run() {
              statement.run(...params);
              return { success: true };
            }
          };
        }
      };
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        for (const statement of statements) await statement.run();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
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

function request(path, options = {}) {
  return new Request(`https://news-aggr.goretskiy.pro${path}`, {
    headers: {
      "user-agent": "Mozilla/5.0 Smoke Test",
      ...options.headers
    }
  });
}

let rssFetches = 0;
globalThis.fetch = async (url) => {
  rssFetches += 1;
  return new Response(`<?xml version="1.0" encoding="utf-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Smoke test news</title>
          <description>Smoke test excerpt</description>
          <link>/news/smoke-${rssFetches}</link>
          <pubDate>Tue, 30 Jun 2026 12:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Escaped html news</title>
          <description>&lt;img src=&quot;https://example.com/image.webp&quot; /&gt;&lt;p&gt;Clean text after media tag&lt;/p&gt;</description>
          <link>/news/escaped-${rssFetches}</link>
          <pubDate>Tue, 30 Jun 2026 12:01:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" }
  });
};

globalThis.caches = { default: new MemoryCache() };

const env = createEnv();

{
  const response = await worker.fetch(request("/"), env, createCtx());
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  assert.match(response.headers.get("cache-control"), /s-maxage=300/);
}

{
  const response = await worker.fetch(request("/app.js"), env, createCtx());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=86400");
}

{
  const response = await worker.fetch(request("/robots.txt"), env, createCtx());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "User-agent: *\nDisallow: /\n");
}

{
  const response = await worker.fetch(request("/api/news", {
    headers: { "user-agent": "curl/8.0" }
  }), env, createCtx());
  assert.equal(response.status, 403);
}

{
  const response = await worker.fetch(request("/api/news", {
    headers: { origin: "https://example.com" }
  }), env, createCtx());
  assert.equal(response.status, 403);
}

const firstCtx = createCtx();
const first = await worker.fetch(request("/api/news"), env, firstCtx);
await firstCtx.flush();
assert.equal(first.status, 200);
assert.match(first.headers.get("cache-control"), /stale-while-revalidate=600/);
assert.ok(first.headers.get("etag"));
const firstPayload = await first.json();
assert.ok(firstPayload.items.length > 0);
const escapedHtmlItem = firstPayload.items.find((item) => item.title === "Escaped html news");
assert.ok(escapedHtmlItem);
assert.equal(escapedHtmlItem.excerpt, "Clean text after media tag");
assert.doesNotMatch(escapedHtmlItem.excerpt, /<img|src=|<p>/i);
assert.ok(rssFetches > 0);

const kvGetsAfterFirst = env.NEWS_CACHE.getCount;
const rssFetchesAfterFirst = rssFetches;
const second = await worker.fetch(request("/api/news"), env, createCtx());
assert.equal(second.status, 200);
assert.equal(env.NEWS_CACHE.getCount, kvGetsAfterFirst);
assert.equal(rssFetches, rssFetchesAfterFirst);

{
  await globalThis.caches.default.put(
    new Request("https://news-aggregator.internal/api/news"),
    new Response(JSON.stringify({
      updatedAt: "2026-06-30T10:00:00.000Z",
      items: [{ id: "stale-cache-item", title: "Stale cache item" }]
    }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        "x-news-updated-at": "2026-06-30T10:00:00.000Z"
      }
    })
  );

  const staleCtx = createCtx();
  const response = await worker.fetch(request("/api/news"), env, staleCtx);
  await staleCtx.flush();
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.notEqual(payload.items[0].id, "stale-cache-item");
  assert.ok(env.NEWS_CACHE.getCount > kvGetsAfterFirst);
}

const notModified = await worker.fetch(request("/api/news", {
  headers: { "if-none-match": first.headers.get("etag") }
}), env, createCtx());
assert.equal(notModified.status, 304);
assert.equal(await notModified.text(), "");

const weakNotModified = await worker.fetch(request("/api/news", {
  headers: { "if-none-match": `W/${first.headers.get("etag")}` }
}), env, createCtx());
assert.equal(weakNotModified.status, 304);
assert.equal(await weakNotModified.text(), "");

{
  const response = await worker.fetch(request("/api/news?fresh=1"), env, createCtx());
  assert.equal(response.status, 403);
}

{
  const ctx = createCtx();
  const response = await worker.fetch(request("/api/news?fresh=1&token=local-refresh-token"), env, ctx);
  await ctx.flush();
  assert.equal(response.status, 200);
}

{
  const response = await worker.fetch(request("/api/news?fresh=1&token=local-refresh-token"), env, createCtx());
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
}

{
  const headerEnv = createEnv();
  globalThis.caches = { default: new MemoryCache() };
  const ctx = createCtx();
  const response = await worker.fetch(request("/api/news?fresh=1", {
    headers: { "x-refresh-token": "local-refresh-token" }
  }), headerEnv, ctx);
  await ctx.flush();
  assert.equal(response.status, 200);
}

{
  const beforeScheduledFetches = rssFetches;
  const ctx = createCtx();
  await worker.scheduled({}, env, ctx);
  await ctx.flush();
  assert.ok(rssFetches > beforeScheduledFetches);
}

{
  const d1 = createD1();
  const d1Env = createEnv({ NEWS_DB: d1 });
  globalThis.caches = { default: new MemoryCache() };

  d1.db.prepare(`
    INSERT INTO news_items (id, url, source, title, excerpt, categories, published_at, fetched_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "old:item",
    "https://example.com/old",
    "Old source",
    "Old title",
    "Old excerpt",
    JSON.stringify(["tech"]),
    "2026-06-01T00:00:00.000Z",
    "2026-06-01T00:00:00.000Z",
    "2026-06-01T00:00:00.000Z"
  );

  const refreshCtx = createCtx();
  const refreshed = await worker.fetch(request("/api/news?fresh=1&token=local-refresh-token"), d1Env, refreshCtx);
  await refreshCtx.flush();
  assert.equal(refreshed.status, 200);
  assert.equal(d1.db.prepare("SELECT COUNT(*) AS count FROM news_items WHERE id = ?").get("old:item").count, 1);
  assert.ok(d1.db.prepare("SELECT COUNT(*) AS count FROM news_items").get().count > 0);

  const fetchesAfterRefresh = rssFetches;
  const fromD1 = await worker.fetch(request("/api/news"), d1Env, createCtx());
  assert.equal(fromD1.status, 200);
  assert.equal(rssFetches, fetchesAfterRefresh);
  const payload = await fromD1.json();
  assert.ok(payload.items.length > 0);
  assert.ok(d1.db.prepare("SELECT COUNT(*) AS count FROM news_item_categories").get().count > 0);

  const scheduledCtx = createCtx();
  await worker.scheduled({}, d1Env, scheduledCtx);
  await scheduledCtx.flush();
  assert.equal(d1.db.prepare("SELECT COUNT(*) AS count FROM news_items WHERE id = ?").get("old:item").count, 0);
}

console.log("worker smoke checks passed");
