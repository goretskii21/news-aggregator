# News Aggregator

Агрегатор русскоязычных новостей про игры, софт, железо и технологии.

## Запуск через Docker Compose

```sh
docker compose up --build
```

После запуска откройте:

```text
http://localhost:5173
```

## Локальный запуск без Docker

```sh
npm start
```

Сервер по умолчанию слушает `127.0.0.1:5173`. В контейнере Compose передает `HOST=0.0.0.0`, чтобы порт был доступен с хоста.

## Cloudflare Workers

Проект подготовлен для деплоя в Cloudflare Workers:

- `src/worker.js` - API `/api/news`, cron-обновление и отдача статических assets.
- `public/` - фронт приложения.
- `wrangler.toml` - конфиг Cloudflare Worker.
- `.github/workflows/cloudflare-deploy.yml` - автодеплой из GitHub Actions.

### Architecture

```text
Cron trigger
  -> fetch RSS/news sources
  -> normalize items
  -> write JSON to KV/memory
  -> purge Worker Cache API entry

User request /api/news
  -> Worker Cache API
  -> memory/KV cache
  -> RSS fetch only on cold miss
```

Normal user requests should not fetch external RSS sources on every hit. The fastest path is `caches.default`; the next path is memory/KV. Manual forced refresh is admin-only.

### GitHub Secrets

Для автодеплоя добавьте в GitHub repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

API token должен иметь права на деплой Workers. После push в `main` workflow выполнит `wrangler deploy`.

Worker secret:

```sh
wrangler secret put REFRESH_TOKEN
```

`REFRESH_TOKEN` is required for manual refresh requests:

```text
/api/news?fresh=1&token=...
X-Refresh-Token: ...
```

Do not commit real secret values.

Production domain:

```text
https://news-aggr.goretskiy.pro
```

### KV cache

Worker может работать без KV, но для production лучше создать KV namespace и прописать его ID в `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "NEWS_CACHE"
id = "production-kv-namespace-id"
preview_id = "preview-kv-namespace-id"
```

Cron настроен на обновление новостей каждые 10 минут.

## Security

Implemented in Worker:

- Bad User-Agent blocklist for obvious scripts: `python-requests`, `curl`, `wget`, `scrapy`, `go-http-client`.
- Manual refresh requires `REFRESH_TOKEN`.
- Manual refresh is rate-limited per client IP to once every five minutes.
- API rejects cross-origin `Origin`/`Referer` values.
- `/robots.txt` returns `Disallow: /`.
- Security headers are added to HTML/API/static responses.
- `/api/news` supports `ETag` and `304 Not Modified`.
- `/api/news` uses `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`.
- Static assets use long-lived cache headers.

Recommended free Cloudflare settings for `news-aggr.goretskiy.pro`:

1. Enable WAF Managed Rules where available.
2. Enable Bot Fight Mode or Super Bot Fight Mode if available on the current plan.
3. Add **Security > WAF > Custom rules**:
   - Expression: `(http.host eq "news-aggr.goretskiy.pro")`
   - Action: `Managed Challenge`
4. Add Rate Limiting for `/api/news` if it is available on the account plan.
5. Enable AI bot blocking / AI Crawl Control if the site should not be indexed by AI crawlers.
6. Keep any cache rules conservative unless they preserve `/api/news?fresh=1` as uncached.

If the challenge becomes too aggressive, narrow the expression to suspicious traffic, for example requests without a common browser user agent.

## Commands

```sh
npm run check
npm run smoke
wrangler deploy
```

Check API:

```sh
curl -i -A "Mozilla/5.0 Smoke Check" https://news-aggr.goretskiy.pro/api/news
```

Check ETag / 304:

```sh
ETAG="$(curl -sI -A 'Mozilla/5.0 Smoke Check' https://news-aggr.goretskiy.pro/api/news | awk -F': ' 'tolower($1)=="etag"{print $2}' | tr -d '\r')"
curl -i -A 'Mozilla/5.0 Smoke Check' -H "If-None-Match: $ETAG" https://news-aggr.goretskiy.pro/api/news
```

Manual refresh:

```sh
curl -i -A "Mozilla/5.0 Smoke Check" "https://news-aggr.goretskiy.pro/api/news?fresh=1&token=$REFRESH_TOKEN"
```

Expected smoke checks:

- `/` returns HTML.
- `/api/news` returns JSON.
- `/api/news?fresh=1` without token returns `403`.
- `/api/news?fresh=1` with token works.
- `If-None-Match` returns `304`.
- Bad User-Agent is blocked.
- Scheduled refresh does not require token.
