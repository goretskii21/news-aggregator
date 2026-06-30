const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_KEY = "news:all";
const META_KEY = "news:meta";

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
  }
];

let memoryCache = null;
let memoryCachedAt = 0;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/news") {
      const forceFresh = url.searchParams.get("fresh") === "1";
      return handleNews(env, ctx, forceFresh);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshNews(env));
  }
};

async function handleNews(env, ctx, forceFresh) {
  try {
    if (!forceFresh) {
      const cached = await readCachedNews(env);
      if (cached) return json(cached, 200, { "cache-control": "public, max-age=60" });
    }

    const payload = await refreshNews(env);
    ctx?.waitUntil?.(writeCachedNews(env, payload));
    return json(payload);
  } catch (error) {
    const cached = await readCachedNews(env, true);
    if (cached) return json({ ...cached, stale: true }, 200, { "cache-control": "public, max-age=30" });
    return json({ error: "Не удалось загрузить новости", detail: error.message }, 502);
  }
}

async function readCachedNews(env, allowStale = false) {
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

  if (env.NEWS_CACHE) {
    await Promise.all([
      env.NEWS_CACHE.put(CACHE_KEY, JSON.stringify(payload)),
      env.NEWS_CACHE.put(META_KEY, JSON.stringify({
        updatedAt: payload.updatedAt,
        count: payload.items.length,
        sources: sources.length
      }))
    ]);
  }
}

async function refreshNews(env) {
  const settled = await Promise.allSettled(sources.map(loadSource));
  const items = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 320);

  const payload = { updatedAt: new Date().toISOString(), items };
  await writeCachedNews(env, payload);
  return payload;
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
  return decodeEntities(String(value)
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/Читать дальше\s*→?/gi, " ")
    .replace(/\s+/g, " ")
    .trim());
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
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
