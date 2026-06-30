import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1";
const CACHE_TTL = 10 * 60 * 1000;
const APPLE_CATEGORIES = ["apple", "software", "hardware", "tech"];

const sources = [
  {
    id: "igromania",
    name: "Igromania.ru",
    homepage: "https://www.igromania.ru",
    categories: ["games"],
    timeoutMs: 5000,
    candidates: [
      "https://www.igromania.ru/rss/news.xml",
      "https://www.igromania.ru/news/"
    ],
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
    candidates: [
      "https://rss.stopgame.ru/rss_all.xml",
      "https://stopgame.ru"
    ],
    articlePattern: /<article[\s\S]*?<\/article>|<div[^>]*class=["'][^"']*(?:site-material-card|material|card)[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "vgtimes",
    name: "VGTimes",
    homepage: "https://vgtimes.ru",
    categories: ["games", "hardware"],
    candidates: [
      "https://vgtimes.ru/rss.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "ixbt-games",
    name: "IXBT.games",
    homepage: "https://ixbt.games",
    categories: ["games", "hardware"],
    candidates: [
      "https://ixbt.games/export/news/rss.xml",
      "https://ixbt.games/export/rss.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "dtf",
    name: "DTF",
    homepage: "https://dtf.ru",
    categories: ["games", "tech"],
    candidates: [
      "https://dtf.ru/rss"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "3dnews",
    name: "3DNews",
    homepage: "https://3dnews.ru",
    categories: ["hardware", "tech"],
    candidates: [
      "https://3dnews.ru/news/rss/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "ixbt",
    name: "iXBT",
    homepage: "https://www.ixbt.com",
    categories: ["hardware", "tech"],
    candidates: [
      "https://www.ixbt.com/export/news/rss.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "habr",
    name: "Habr",
    homepage: "https://habr.com",
    categories: ["software", "tech"],
    candidates: [
      "https://habr.com/ru/rss/news/?fl=ru"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "opennet",
    name: "OpenNET",
    homepage: "https://www.opennet.ru",
    categories: ["software", "tech"],
    candidates: [
      "https://www.opennet.ru/opennews/opennews_all.rss"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "securitylab",
    name: "SecurityLab",
    homepage: "https://www.securitylab.ru",
    categories: ["software", "tech"],
    candidates: [
      "https://www.securitylab.ru/_services/export/rss/news/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "comss",
    name: "Comss",
    homepage: "https://www.comss.ru",
    categories: ["software"],
    candidates: [
      "https://www.comss.ru/rss.php"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "4pda",
    name: "4PDA",
    homepage: "https://4pda.to",
    categories: ["software", "hardware"],
    candidates: [
      "https://4pda.to/feed/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "cnews",
    name: "CNews",
    homepage: "https://www.cnews.ru",
    categories: ["tech"],
    candidates: [
      "https://www.cnews.ru/inc/rss/news.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "gecid",
    name: "GECID",
    homepage: "https://ru.gecid.com",
    categories: ["software", "hardware", "tech"],
    candidates: [
      "https://ru.gecid.com/rss.php"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "overclockers-ua",
    name: "Overclockers.ua",
    homepage: "https://www.overclockers.ua",
    categories: ["games", "software", "hardware", "tech"],
    candidates: [
      "https://www.overclockers.ua/rss.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "appleinsider-ru",
    name: "AppleInsider.ru",
    homepage: "https://appleinsider.ru",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://appleinsider.ru/feed"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "iphones-ru",
    name: "iPhones.ru",
    homepage: "https://www.iphones.ru",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://www.iphones.ru/feed"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "the-verge-apple",
    name: "The Verge Apple",
    homepage: "https://www.theverge.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://www.theverge.com/rss/apple/index.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "macstories",
    name: "MacStories",
    homepage: "https://www.macstories.net",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://www.macstories.net/feed/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "gagadget",
    name: "gagadget",
    homepage: "https://gagadget.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://gagadget.com/rss/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "macworld",
    name: "Macworld",
    homepage: "https://www.macworld.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://www.macworld.com/feed"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "9to5mac",
    name: "9to5Mac",
    homepage: "https://9to5mac.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://9to5mac.com/feed/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "macrumors",
    name: "MacRumors",
    homepage: "https://www.macrumors.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://www.macrumors.com/macrumors.xml"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "appleinsider-com",
    name: "AppleInsider.com",
    homepage: "https://appleinsider.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://appleinsider.com/rss/news/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  },
  {
    id: "cult-of-mac",
    name: "Cult of Mac",
    homepage: "https://www.cultofmac.com",
    categories: APPLE_CATEGORIES,
    candidates: [
      "https://www.cultofmac.com/feed/"
    ],
    articlePattern: /<article[\s\S]*?<\/article>/gi,
    linkPattern: /href=["']([^"']+)["'][\s\S]*?(?:<h[23][^>]*>|class=["'][^"']*(?:title|name)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/h[23]>|<\/a>|<\/div>)/i
  }
];

let cachedNews = null;
let cachedAt = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/api/news") {
    await handleNews(res, url.searchParams.get("fresh") === "1");
    return;
  }

  await serveStatic(url.pathname, res);
});

server.listen(PORT, HOST, () => {
  console.log(`News aggregator is running at http://${HOST}:${PORT}`);
});

async function handleNews(res, forceFresh) {
  try {
    const now = Date.now();
    if (!forceFresh && cachedNews && now - cachedAt < CACHE_TTL) {
      sendJson(res, { updatedAt: new Date(cachedAt).toISOString(), items: cachedNews });
      return;
    }

    const settled = await Promise.allSettled(sources.map(loadSource));
    const items = settled
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, 320);

    cachedNews = items;
    cachedAt = now;
    sendJson(res, { updatedAt: new Date(cachedAt).toISOString(), items });
  } catch (error) {
    sendJson(res, { error: "Не удалось загрузить новости", detail: error.message }, 502);
  }
}

async function loadSource(source) {
  for (const candidate of source.candidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          "accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
          "user-agent": "Mozilla/5.0 news-aggregator demo"
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

  try {
    return new TextDecoder(normalizeCharset(charset), { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

function normalizeCharset(charset) {
  return charset.trim().toLowerCase()
    .replace(/^cp-?1251$/, "windows-1251")
    .replace(/^win-?1251$/, "windows-1251");
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

async function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { "content-type": contentType(filePath) });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

function contentType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  }[extname(filePath)] || "application/octet-stream";
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}
