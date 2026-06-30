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

function createEnv() {
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
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
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
assert.ok(rssFetches > 0);

const kvGetsAfterFirst = env.NEWS_CACHE.getCount;
const rssFetchesAfterFirst = rssFetches;
const second = await worker.fetch(request("/api/news"), env, createCtx());
assert.equal(second.status, 200);
assert.equal(env.NEWS_CACHE.getCount, kvGetsAfterFirst);
assert.equal(rssFetches, rssFetchesAfterFirst);

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

console.log("worker smoke checks passed");
