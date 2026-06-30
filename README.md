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

### GitHub Secrets

Для автодеплоя добавьте в GitHub repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

API token должен иметь права на деплой Workers. После push в `main` workflow выполнит `wrangler deploy`.

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

Manual feed refresh is limited in the Worker: `/api/news?fresh=1` can be called once per client every five minutes. With `NEWS_CACHE` bound, the limit is stored in KV; without KV, the Worker uses an in-memory fallback.

Recommended free Cloudflare settings for `news-aggr.goretskiy.pro`:

1. Enable **Security > Settings > Browser Integrity Check**.
2. Add **Security > WAF > Custom rules**:
   - Expression: `(http.host eq "news-aggr.goretskiy.pro")`
   - Action: `Managed Challenge`

If the challenge becomes too aggressive, narrow the expression to suspicious traffic, for example requests without a common browser user agent.
