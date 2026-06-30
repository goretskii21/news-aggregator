const CACHE_TTL_MS = 10 * 60 * 1000;
const MANUAL_REFRESH_LIMIT_SECONDS = 5 * 60;
const NEWS_RETENTION_DAYS = 7;
const MAX_NEWS_ITEMS = 320;
const CACHE_KEY = "news:all";
const REFRESH_LIMIT_PREFIX = "refresh-limit";
const NEWS_CACHE_URL = "https://news-aggregator.internal/api/news";
const API_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";
const STATIC_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";
const HTML_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";
const BLOCKED_USER_AGENT_PATTERNS = [
  /python-requests/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /scrapy/i,
  /go-http-client/i
];
const HTML_SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
};
const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=()"
};
const APPLE_CATEGORIES = ["apple", "software", "hardware", "tech"];

const sources = [
  {
    id: "igromania",
    name: "Igromania.ru",
    homepage: "https://www.igromania.ru",
    categories: ["games"],
    timeoutMs: 5000,
    candidates: ["https://www.igromania.ru/rss/news.xml", "https://www.igromania.ru/news/"],
    articlePattern: /<article[\s\S]*?<\/article>|<div[^>]*class=["'][^"']*(?:article|card|item|news)[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name|caption)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "playground",
    name: "PlayGround.ru",
    homepage: "https://www.playground.ru",
    categories: ["games"],
    candidates: [
      "https://www.playground.ru/rss.xml",
      "https://www.playground.ru/rss/news.xml",
      "https://www.playground.ru/news/rss.xml",
      "https://www.playground.ru/news"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "goha",
    name: "GoHa.ru",
    homepage: "https://www.goha.ru",
    categories: ["games"],
    candidates: [
      "https://www.goha.ru/rss/news",
      "https://www.goha.ru/rss",
      "https://www.goha.ru/feeds/rss",
      "https://www.goha.ru/news/rss",
      "https://www.goha.ru/news"
    ],
    articlePattern: /<div[^>]*class=["'][^"']*article-snippet\b[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
    linkPattern: /class=["'][^"']*article-snippet__body-title-link[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
  },
  {
    id: "stopgame",
    name: "StopGame.ru",
    homepage: "https://stopgame.ru",
    categories: ["games"],
    candidates: ["https://rss.stopgame.ru/rss_all.xml", "https://stopgame.ru"],
    articlePattern: /<article[\s\S]*?<\/article>|<div[^>]*class=["'][^"']*(?:site-material-card|material|card)[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "vgtimes",
    name: "VGTimes",
    homepage: "https://vgtimes.ru",
    categories: ["games", "hardware"],
    candidates: ["https://vgtimes.ru/rss.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "ixbt-games",
    name: "IXBT.games",
    homepage: "https://ixbt.games",
    categories: ["games", "hardware"],
    candidates: ["https://ixbt.games/export/news/rss.xml", "https://ixbt.games/export/rss.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "dtf",
    name: "DTF",
    homepage: "https://dtf.ru",
    categories: ["games", "tech"],
    candidates: ["https://dtf.ru/rss"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "3dnews",
    name: "3DNews",
    homepage: "https://3dnews.ru",
    categories: ["hardware", "tech"],
    candidates: ["https://3dnews.ru/news/rss/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "ixbt",
    name: "iXBT",
    homepage: "https://www.ixbt.com",
    categories: ["hardware", "tech"],
    candidates: ["https://www.ixbt.com/export/news/rss.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "habr",
    name: "Habr",
    homepage: "https://habr.com",
    categories: ["software", "tech"],
    candidates: ["https://habr.com/ru/rss/news/?fl=ru"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "opennet",
    name: "OpenNET",
    homepage: "https://www.opennet.ru",
    categories: ["software", "tech"],
    candidates: ["https://www.opennet.ru/opennews/opennews_all.rss"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "securitylab",
    name: "SecurityLab",
    homepage: "https://www.securitylab.ru",
    categories: ["software", "tech"],
    candidates: ["https://www.securitylab.ru/_services/export/rss/news/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "comss",
    name: "Comss",
    homepage: "https://www.comss.ru",
    categories: ["software"],
    candidates: ["https://www.comss.ru/rss.php"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "4pda",
    name: "4PDA",
    homepage: "https://4pda.to",
    categories: ["software", "hardware"],
    candidates: ["https://4pda.to/feed/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "cnews",
    name: "CNews",
    homepage: "https://www.cnews.ru",
    categories: ["tech"],
    candidates: ["https://www.cnews.ru/inc/rss/news.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "gecid",
    name: "GECID",
    homepage: "https://ru.gecid.com",
    categories: ["software", "hardware", "tech"],
    candidates: ["https://ru.gecid.com/rss.php"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "overclockers-ua",
    name: "Overclockers.ua",
    homepage: "https://www.overclockers.ua",
    categories: ["games", "software", "hardware", "tech"],
    candidates: ["https://www.overclockers.ua/rss.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "appleinsider-ru",
    name: "AppleInsider.ru",
    homepage: "https://appleinsider.ru",
    categories: APPLE_CATEGORIES,
    candidates: ["https://appleinsider.ru/feed"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "iphones-ru",
    name: "iPhones.ru",
    homepage: "https://www.iphones.ru",
    categories: APPLE_CATEGORIES,
    candidates: ["https://www.iphones.ru/feed"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "the-verge-apple",
    name: "The Verge Apple",
    homepage: "https://www.theverge.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://www.theverge.com/rss/apple/index.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "macstories",
    name: "MacStories",
    homepage: "https://www.macstories.net",
    categories: APPLE_CATEGORIES,
    candidates: ["https://www.macstories.net/feed/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "gagadget",
    name: "gagadget",
    homepage: "https://gagadget.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://gagadget.com/rss/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "macworld",
    name: "Macworld",
    homepage: "https://www.macworld.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://www.macworld.com/feed"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "9to5mac",
    name: "9to5Mac",
    homepage: "https://9to5mac.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://9to5mac.com/feed/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "macrumors",
    name: "MacRumors",
    homepage: "https://www.macrumors.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://www.macrumors.com/macrumors.xml"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "appleinsider-com",
    name: "AppleInsider.com",
    homepage: "https://appleinsider.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://appleinsider.com/rss/news/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "cult-of-mac",
    name: "Cult of Mac",
    homepage: "https://www.cultofmac.com",
    categories: APPLE_CATEGORIES,
    candidates: ["https://www.cultofmac.com/feed/"],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  }
];

let memoryCache = null;
let memoryCachedAt = 0;
const memoryRefreshLimits = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (isBlockedUserAgent(request)) {
      return withSecurityHeaders(new Response("Forbidden", { status: 403 }));
    }

    if (url.pathname === "/api/news") {
      if (isCrossOriginApiRequest(request)) {
        return json(
          {
            error: "Forbidden",
            detail: "Cross-origin API requests are not allowed."
          },
          403,
          { "cache-control": "no-store" }
        );
      }

      const forceFresh = url.searchParams.get("fresh") === "1";
      return handleNews(request, env, ctx, forceFresh);
    }

    if (url.pathname === "/robots.txt") {
      return text("User-agent: *\nDisallow: /\n", 200, {
        "cache-control": "public, max-age=3600"
      });
    }

    return serveAsset(request, env);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshNews(env, { purgeEdgeCache: true, pruneStoredNews: true }));
  }
};

async function handleNews(request, env, ctx, forceFresh) {
  try {
    if (!forceFresh) {
      const cachedResponse = await caches.default.match(newsCacheRequest());
      if (cachedResponse) {
        if (isFreshNewsResponse(cachedResponse)) return maybeNotModified(request, cachedResponse);
        ctx?.waitUntil?.(caches.default.delete(newsCacheRequest()));
      }

      const cached = await readCachedNews(env);
      if (cached) {
        const response = newsJson(cached);
        ctx?.waitUntil?.(caches.default.put(newsCacheRequest(), response.clone()));
        return maybeNotModified(request, response);
      }
    }

    if (forceFresh) {
      if (!isRefreshAuthorized(request, env)) {
        return json(
          {
            error: "Forbidden",
            detail: "Manual refresh requires a valid refresh token."
          },
          403,
          { "cache-control": "no-store" }
        );
      }

      const limit = await checkManualRefreshLimit(request, env);
      if (!limit.allowed) {
        return json(
          {
            error: "Слишком частое обновление",
            detail: "Ручное обновление доступно не чаще одного раза в пять минут.",
            retryAfter: limit.retryAfter
          },
          429,
          {
            "cache-control": "no-store",
            "retry-after": String(limit.retryAfter)
          }
        );
      }
    }

    const payload = await refreshNews(env, { purgeEdgeCache: true });
    const response = newsJson(payload, forceFresh ? { "cache-control": "no-store" } : {});
    if (!forceFresh) ctx?.waitUntil?.(caches.default.put(newsCacheRequest(), response.clone()));
    return maybeNotModified(request, response);
  } catch (error) {
    const cached = await readCachedNews(env, true);
    if (cached) return newsJson({ ...cached, stale: true }, { "cache-control": "public, max-age=30" });
    return json({ error: "Не удалось загрузить новости", detail: error.message }, 502);
  }
}

function isRefreshAuthorized(request, env) {
  if (!env.REFRESH_TOKEN) return false;
  const url = new URL(request.url);
  const token = request.headers.get("x-refresh-token") || url.searchParams.get("token");
  return token === env.REFRESH_TOKEN;
}

async function checkManualRefreshLimit(request, env) {
  const key = `${REFRESH_LIMIT_PREFIX}:${getClientKey(request)}`;

  if (env.NEWS_CACHE) {
    const previous = await env.NEWS_CACHE.get(key);
    if (previous) {
      const retryAfter = Math.max(1, MANUAL_REFRESH_LIMIT_SECONDS - Math.floor((Date.now() - Number(previous)) / 1000));
      return { allowed: false, retryAfter };
    }

    await env.NEWS_CACHE.put(key, String(Date.now()), { expirationTtl: MANUAL_REFRESH_LIMIT_SECONDS });
    return { allowed: true, retryAfter: 0 };
  }

  const expiresAt = memoryRefreshLimits.get(key) || 0;
  if (expiresAt > Date.now()) {
    return { allowed: false, retryAfter: Math.ceil((expiresAt - Date.now()) / 1000) };
  }

  memoryRefreshLimits.set(key, Date.now() + MANUAL_REFRESH_LIMIT_SECONDS * 1000);
  return { allowed: true, retryAfter: 0 };
}

function getClientKey(request) {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous";
}

async function readCachedNews(env, allowStale = false) {
  if (env.NEWS_DB) {
    const storedPayload = await readStoredNews(env.NEWS_DB);
    if (storedPayload?.items.length) return storedPayload;
  }

  const kvPayload = await env.NEWS_CACHE?.get(CACHE_KEY, { type: "json" });
  if (kvPayload && (allowStale || Date.now() - Date.parse(kvPayload.updatedAt) < CACHE_TTL_MS)) return kvPayload;

  if (memoryCache && (allowStale || Date.now() - memoryCachedAt < CACHE_TTL_MS)) {
    return { updatedAt: new Date(memoryCachedAt).toISOString(), items: memoryCache };
  }

  return null;
}

async function writeCachedNews(env, payload) {
  memoryCache = payload.items;
  memoryCachedAt = Date.parse(payload.updatedAt);

  if (env.NEWS_DB) {
    await writeStoredNews(env.NEWS_DB, payload.items, payload.updatedAt);
    return;
  }

  if (env.NEWS_CACHE) {
    await env.NEWS_CACHE.put(CACHE_KEY, JSON.stringify(payload));
  }
}

async function refreshNews(env, options = {}) {
  const settled = await Promise.allSettled(sources.map(loadSource));
  const items = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, MAX_NEWS_ITEMS);

  const payload = { updatedAt: new Date().toISOString(), items };
  await writeCachedNews(env, payload);
  if (options.pruneStoredNews && env.NEWS_DB) await pruneStoredNews(env.NEWS_DB);
  if (options.purgeEdgeCache) await caches.default.delete(newsCacheRequest());
  return env.NEWS_DB ? await readStoredNews(env.NEWS_DB) : payload;
}

async function readStoredNews(db) {
  const cutoff = retentionCutoff();
  const result = await db.prepare(`
    SELECT id, source, title, excerpt, url, categories, published_at, updated_at
    FROM news_items
    WHERE COALESCE(published_at, fetched_at) >= ?
    ORDER BY COALESCE(published_at, fetched_at) DESC, updated_at DESC
    LIMIT ?
  `).bind(cutoff, MAX_NEWS_ITEMS).all();

  const rows = result.results || [];
  if (!rows.length) return null;

  return {
    updatedAt: rows.reduce((latest, row) => row.updated_at > latest ? row.updated_at : latest, rows[0].updated_at),
    items: rows.map(rowToNewsItem)
  };
}

async function writeStoredNews(db, items, updatedAt) {
  const statements = [];

  for (const item of items) {
    const publishedAt = item.publishedAt || updatedAt;
    statements.push(db.prepare(`
      INSERT INTO news_items (id, url, source, title, excerpt, categories, published_at, fetched_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        id = excluded.id,
        source = excluded.source,
        title = excluded.title,
        excerpt = excluded.excerpt,
        categories = excluded.categories,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at
    `).bind(
      item.id,
      item.url,
      item.source,
      item.title,
      item.excerpt,
      JSON.stringify(item.categories || []),
      publishedAt,
      updatedAt,
      updatedAt
    ));

    statements.push(db.prepare("DELETE FROM news_item_categories WHERE news_id = ?").bind(item.id));
    for (const category of item.categories || []) {
      statements.push(db.prepare(`
        INSERT OR IGNORE INTO news_item_categories (news_id, category)
        VALUES (?, ?)
      `).bind(item.id, category));
    }
  }

  await executeD1Batch(db, statements);
}

async function pruneStoredNews(db) {
  const cutoff = retentionCutoff();
  await db.prepare(`
    DELETE FROM news_item_categories
    WHERE news_id IN (
      SELECT id FROM news_items WHERE COALESCE(published_at, fetched_at) < ?
    )
  `).bind(cutoff).run();
  await db.prepare("DELETE FROM news_items WHERE COALESCE(published_at, fetched_at) < ?").bind(cutoff).run();
}

async function executeD1Batch(db, statements, chunkSize = 50) {
  for (let index = 0; index < statements.length; index += chunkSize) {
    await db.batch(statements.slice(index, index + chunkSize));
  }
}

function rowToNewsItem(row) {
  return {
    id: row.id,
    source: row.source,
    categories: parseCategories(row.categories),
    title: row.title,
    excerpt: row.excerpt,
    url: row.url,
    publishedAt: row.published_at || ""
  };
}

function parseCategories(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function retentionCutoff() {
  return new Date(Date.now() - NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

async function loadSource(source) {
  for (const candidate of source.candidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
          "user-agent": "Mozilla/5.0 news-aggregator"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(source.timeoutMs || 8000)
      });

      if (!response.ok) continue;
      const body = await readResponseBody(response);
      const parsed = looksLikeFeed(body) ? parseFeed(body, source) : parseHtml(body, source, candidate);
      if (parsed.length) return parsed;
    } catch {
      // Try the next likely endpoint; some sources block or rename feeds.
    }
  }

  return [];
}

async function readResponseBody(response) {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const preview = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 1024));
  const contentType = response.headers.get("content-type") || "";
  const charset =
    contentType.match(/charset=([^;\s]+)/i)?.[1] ||
    preview.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i)?.[1] ||
    preview.match(/<meta[^>]+charset=["']?([^"'\s/>]+)/i)?.[1] ||
    "utf-8";

  if (/^(?:cp-?1251|win-?1251|windows-1251)$/i.test(charset.trim())) {
    return decodeWindows1251(bytes);
  }

  if (/^koi8-?r$/i.test(charset.trim())) {
    return decodeKoi8R(bytes);
  }

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return decodeWindows1251(bytes);
  }
}

function decodeWindows1251(bytes) {
  const map = {
    0x80: "\u0402", 0x81: "\u0403", 0x82: "\u201a", 0x83: "\u0453", 0x84: "\u201e", 0x85: "\u2026",
    0x86: "\u2020", 0x87: "\u2021", 0x88: "\u20ac", 0x89: "\u2030", 0x8a: "\u0409", 0x8b: "\u2039",
    0x8c: "\u040a", 0x8d: "\u040c", 0x8e: "\u040b", 0x8f: "\u040f", 0x90: "\u0452", 0x91: "\u2018",
    0x92: "\u2019", 0x93: "\u201c", 0x94: "\u201d", 0x95: "\u2022", 0x96: "\u2013", 0x97: "\u2014",
    0x98: "\u2122", 0x99: "\u0459", 0x9a: "\u203a", 0x9b: "\u045a", 0x9c: "\u045c", 0x9d: "\u045b",
    0x9e: "\u045f", 0x9f: "\u040e", 0xa1: "\u040e", 0xa2: "\u045e", 0xa3: "\u0408", 0xa5: "\u0490",
    0xa8: "\u0401", 0xaa: "\u0404", 0xaf: "\u0407", 0xb2: "\u0406", 0xb3: "\u0456", 0xb4: "\u0491",
    0xb8: "\u0451", 0xba: "\u0454", 0xbc: "\u0458", 0xbd: "\u0405", 0xbe: "\u0455", 0xbf: "\u0457"
  };

  let output = "";
  for (const byte of bytes) {
    if (byte < 0x80) output += String.fromCharCode(byte);
    else if (byte >= 0xc0) output += String.fromCharCode(0x0410 + byte - 0xc0);
    else output += map[byte] || String.fromCharCode(byte);
  }
  return output;
}

function decodeKoi8R(bytes) {
  const table = "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ";
  let output = "";
  for (const byte of bytes) {
    output += byte < 0x80 ? String.fromCharCode(byte) : table[byte - 0x80];
  }
  return output;
}

function looksLikeFeed(xml) {
  return /<(rss|feed|rdf:RDF)\b/i.test(xml) || /<item\b/i.test(xml) || /<entry\b/i.test(xml);
}

function parseFeed(xml, source) {
  const chunks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) || [];
  return chunks.map((chunk) => normalizeItem({
    source,
    title: pickTag(chunk, ["title"]),
    excerpt: pickTag(chunk, ["description", "summary", "content:encoded", "content"]),
    url: pickLink(chunk, source.homepage),
    publishedAt: pickTag(chunk, ["pubDate", "published", "updated", "dc:date"])
  })).filter(Boolean);
}

function parseHtml(html, source, pageUrl) {
  const blocks = html.match(source.articlePattern) || html.match(/<a\b[\s\S]{0,1200}?<\/a>/gi) || [];
  const items = [];

  for (const block of blocks) {
    const match = block.match(source.linkPattern) || block.match(/href=["']([^"']+)["'][\s\S]{0,900}?>([\s\S]*?)<\/a>/i);
    if (!match) continue;

    const title = cleanText(match[2]);
    const url = absolutize(match[1], pageUrl);
    if (!title || title.length < 12 || !url || !url.startsWith(source.homepage)) continue;

    const excerpt = cleanText(
      (block.match(/<(?:p|div)[^>]*(?:description|text|announce|summary|preview)[^>]*>([\s\S]*?)<\/(?:p|div)>/i) || [])[1] ||
      block.replace(match[0], "")
    );

    items.push(normalizeItem({ source, title, excerpt, url, publishedAt: "" }));
  }

  return uniqueByUrl(items).slice(0, 20);
}

function normalizeItem({ source, title, excerpt, url, publishedAt }) {
  const cleanTitle = cleanText(title);
  const cleanExcerpt = truncate(stripRepeatedTitle(cleanText(excerpt || ""), cleanTitle), 220);
  const cleanUrl = absolutize(url, source.homepage);

  if (!cleanTitle || !cleanUrl) return null;

  return {
    id: `${source.id}:${cleanUrl}`,
    source: source.name,
    categories: source.categories || [],
    title: cleanTitle,
    excerpt: cleanExcerpt || "Краткое описание у источника не найдено, но полная новость доступна по ссылке.",
    url: cleanUrl,
    publishedAt: normalizeDate(publishedAt)
  };
}

function stripRepeatedTitle(excerpt, title) {
  if (!excerpt || !title) return excerpt;
  return excerpt.toLowerCase().startsWith(title.toLowerCase())
    ? excerpt.slice(title.length).trim()
    : excerpt;
}

function pickTag(chunk, tags) {
  for (const tag of tags) {
    const escaped = tag.replace(":", "\\:");
    const match = chunk.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"));
    if (match) return match[1];
  }
  return "";
}

function pickLink(chunk, baseUrl) {
  const href = chunk.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (href) return absolutize(href[1], baseUrl);

  const tag = pickTag(chunk, ["link", "guid"]);
  return absolutize(tag, baseUrl);
}

function cleanText(value = "") {
  return decodeEntities(String(value).replace(/<!\[CDATA\[|\]\]>/g, ""))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/Читать дальше\s*→?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
    laquo: "«",
    raquo: "»",
    bdquo: "„",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    ndash: "-",
    mdash: "-",
    hellip: "...",
    bull: "-",
    middot: "-",
    copy: "(c)",
    reg: "(r)",
    trade: "tm",
    shy: "",
    ensp: " ",
    emsp: " ",
    thinsp: " ",
    zwnj: "",
    zwj: ""
  };

  let decoded = value;
  for (let index = 0; index < 2; index += 1) {
    decoded = decoded
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&([a-z]+);/gi, (_, name) => entities[name.toLowerCase()] ?? " ");
  }
  return decoded;
}

function truncate(value, max) {
  if (value.length <= max) return value;
  const shortened = value.slice(0, max - 1);
  return `${shortened.slice(0, shortened.lastIndexOf(" ") || shortened.length)}...`;
}

function absolutize(value = "", baseUrl) {
  const trimmed = cleanText(value);
  if (!trimmed) return "";
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return "";
  }
}

function normalizeDate(value = "") {
  const parsed = Date.parse(cleanText(value));
  return Number.isNaN(parsed) ? "" : new Date(parsed).toISOString();
}

function uniqueByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function json(payload, status = 200, headers = {}) {
  return withSecurityHeaders(new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  }));
}

function newsJson(payload, headers = {}) {
  const body = JSON.stringify(payload);
  return json(payload, 200, {
    "cache-control": API_CACHE_CONTROL,
    etag: createNewsEtag(payload),
    "content-length": String(new TextEncoder().encode(body).length),
    "x-news-updated-at": payload.updatedAt || "",
    ...headers
  });
}

function isFreshNewsResponse(response) {
  const updatedAt = response.headers.get("x-news-updated-at");
  const updatedAtMs = updatedAt ? Date.parse(updatedAt) : 0;
  return Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs < CACHE_TTL_MS;
}

function text(body, status = 200, headers = {}) {
  return withSecurityHeaders(new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...headers
    }
  }));
}

function maybeNotModified(request, response) {
  const etag = response.headers.get("etag");
  if (etag && etagMatches(request.headers.get("if-none-match"), etag)) {
    return withSecurityHeaders(new Response(null, {
      status: 304,
      headers: {
        etag,
        "cache-control": response.headers.get("cache-control") || API_CACHE_CONTROL
      }
    }));
  }
  return withSecurityHeaders(response);
}

function etagMatches(ifNoneMatch, etag) {
  if (!ifNoneMatch) return false;
  return ifNoneMatch
    .split(",")
    .map((value) => normalizeEtag(value))
    .some((value) => value === "*" || value === normalizeEtag(etag));
}

function normalizeEtag(value) {
  return value.trim().replace(/^W\//i, "");
}

function createNewsEtag(payload) {
  const updatedAt = payload.updatedAt || "";
  const count = Array.isArray(payload.items) ? payload.items.length : 0;
  const firstId = Array.isArray(payload.items) && payload.items[0]?.id ? payload.items[0].id : "";
  return `"news-${hashString(`${updatedAt}:${count}:${firstId}`)}"`;
}

function hashString(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function newsCacheRequest() {
  return new Request(NEWS_CACHE_URL, { method: "GET" });
}

async function serveAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const headers = new Headers(response.headers);

  if (response.ok) {
    if (isHtmlPath(url.pathname, headers)) {
      headers.set("cache-control", HTML_CACHE_CONTROL);
      for (const [name, value] of Object.entries(HTML_SECURITY_HEADERS)) headers.set(name, value);
    } else {
      headers.set("cache-control", STATIC_CACHE_CONTROL);
    }
  }

  return withSecurityHeaders(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  }));
}

function isHtmlPath(pathname, headers) {
  return pathname === "/" ||
    pathname.endsWith(".html") ||
    (headers.get("content-type") || "").includes("text/html");
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function isBlockedUserAgent(request) {
  const userAgent = request.headers.get("user-agent") || "";
  return BLOCKED_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function isCrossOriginApiRequest(request) {
  const requestUrl = new URL(request.url);
  for (const headerName of ["origin", "referer"]) {
    const value = request.headers.get(headerName);
    if (!value) continue;

    try {
      const headerUrl = new URL(value);
      if (headerUrl.hostname !== requestUrl.hostname) return true;
    } catch {
      return true;
    }
  }

  return false;
}
