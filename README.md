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

Compose поднимает два контейнера:

- `news-aggr` - локальный frontend/API сервер.
- `news-aggr-local-d1` - SQLite-база, приближенная к Cloudflare D1 для локальной разработки.

Локальная база хранится в Docker volume `news-aggr_local-d1-data` и инициализируется схемой из `db/schema.sql`.

Открыть SQLite shell:

```sh
docker compose exec local-d1 sqlite3 /data/news-aggr-d1.sqlite
```

Проверить таблицы:

```sh
docker compose exec local-d1 sqlite3 /data/news-aggr-d1.sqlite ".tables"
```

Важно: сейчас приложение продолжает читать новости из memory/KV-like кэша. Контейнер `local-d1` подготовлен как локальный аналог D1 для следующего шага - переноса хранения нормализованных новостей в SQLite/D1.

## Локальный запуск без Docker

```sh
npm start
```

Сервер по умолчанию слушает `127.0.0.1:5173`. В контейнере Compose передает `HOST=0.0.0.0`, чтобы порт был доступен с хоста.

## Cloudflare Workers

Проект подготовлен для деплоя в Cloudflare Workers:

- `src/worker.js` - API `/api/news`, cron-обновление и отдача статических ресурсов.
- `public/` - фронт приложения.
- `wrangler.toml` - конфиг Cloudflare Worker.

Деплой настроен через встроенную интеграцию **Cloudflare Workers + GitHub**. После push в `main` Cloudflare сам запускает проверки и `wrangler deploy`.

Текущая конфигурация сборки в Cloudflare:

```text
Команда сборки: npm install && npm run check && npm run smoke
Команда деплоя: npx wrangler deploy
Production branch: main
```

### Архитектура

```text
Cron-триггер
  -> загрузка RSS/news-источников
  -> нормализация новостей
  -> запись JSON в KV/memory-кэш
  -> сброс записи в Worker Cache API

Запрос пользователя /api/news
  -> Worker Cache API
  -> memory/KV-кэш
  -> загрузка RSS только при полном промахе кэша
```

Обычные пользовательские запросы не должны ходить во внешние RSS-источники каждый раз. Самый быстрый путь - `caches.default`, затем memory/KV-кэш. Ручное принудительное обновление доступно только с админским токеном.

### Секреты Worker

Для ручного обновления фидов нужен секрет `REFRESH_TOKEN` в Cloudflare Worker:

```sh
wrangler secret put REFRESH_TOKEN
```

Ручное обновление принимает токен через URL-параметр или HTTP-заголовок:

```text
/api/news?fresh=1&token=...
X-Refresh-Token: ...
```

Реальные значения секретов нельзя коммитить в репозиторий.

Продовый домен:

```text
https://news-aggr.goretskiy.pro
```

### KV-кэш

Прод использует KV namespace `news-aggregator-cache` для постоянного кэша новостей и ключей ограничения частоты для ручного обновления. В `wrangler.toml` namespace привязан как `NEWS_CACHE`:

```toml
[[kv_namespaces]]
binding = "NEWS_CACHE"
id = "86aef1c1040a4043b8d733ee21c593b7"
```

Cron обновляет новости каждые 10 минут. На каждом успешном обновлении Worker пишет один KV-ключ `news:all`.

### D1 / локальный SQLite

Для локальной разработки добавлен контейнер `local-d1`. Это обычный SQLite, как и Cloudflare D1 под капотом, с таблицами:

- `news_items` - нормализованные новости, уникальные по `url`.
- `news_item_categories` - категории новости для быстрых фильтров.
- `source_runs` - диагностические записи по загрузке источников.

Когда будем переносить прод на D1, в `wrangler.toml` нужно будет добавить D1 binding, например:

```toml
[[d1_databases]]
binding = "NEWS_DB"
database_name = "news-aggregator"
database_id = "..."
```

Реальный `database_id` создаётся в Cloudflare и не должен выдумываться заранее.

## Безопасность

Что реализовано в Worker:

- Блокировка очевидных скриптов по User-Agent: `python-requests`, `curl`, `wget`, `scrapy`, `go-http-client`.
- Ручное обновление требует `REFRESH_TOKEN`.
- Ручное обновление ограничено по IP: не чаще одного раза в пять минут.
- API отклоняет междоменные запросы по `Origin`/`Referer`.
- `/robots.txt` отдаёт `Disallow: /`.
- HTML/API/static-ответы получают базовые заголовки безопасности.
- `/api/news` поддерживает `ETag` и `304 Not Modified`.
- `/api/news` отдаёт `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`.
- Статические ресурсы кэшируются коротко, потому что файлы пока не fingerprinted.

Что настроено в Cloudflare для `news-aggr.goretskiy.pro`:

1. **AI Crawl Control**: все 32 краулера из списка Cloudflare переведены в режим `Block`.
2. `/robots.txt` закрывает сайт от индексации.
3. KV-кэш включён через привязку `NEWS_CACHE`.

Рекомендованные дополнительные бесплатные настройки Cloudflare:

1. Включить WAF Managed Rules, если доступны на текущем плане.
2. Включить Bot Fight Mode, если он не мешает нормальному использованию.
3. Добавить Rate Limiting для `/api/news`, если настройка доступна на аккаунте.
4. Держать Cache Rules консервативными и не кэшировать `/api/news?fresh=1`.

## Команды

```sh
npm run check
npm run smoke
wrangler deploy
```

Обычный деплой выполняется через Cloudflare Git integration после push в ветку `main`. `wrangler deploy` нужен только для ручного деплоя с локальной машины.

Проверка API:

```sh
curl -i -A "Mozilla/5.0 Smoke Check" https://news-aggr.goretskiy.pro/api/news
```

Проверка `ETag` / `304 Not Modified`:

```sh
ETAG="$(curl -sI -A 'Mozilla/5.0 Smoke Check' https://news-aggr.goretskiy.pro/api/news | awk -F': ' 'tolower($1)=="etag"{print $2}' | tr -d '\r')"
curl -i -A 'Mozilla/5.0 Smoke Check' -H "If-None-Match: $ETAG" https://news-aggr.goretskiy.pro/api/news
```

Ручное обновление:

```sh
curl -i -A "Mozilla/5.0 Smoke Check" "https://news-aggr.goretskiy.pro/api/news?fresh=1&token=$REFRESH_TOKEN"
```

Ожидаемые smoke-проверки:

- `/` возвращает HTML.
- `/api/news` возвращает JSON.
- `/api/news?fresh=1` без токена возвращает `403`.
- `/api/news?fresh=1` с токеном работает.
- `If-None-Match` возвращает `304`.
- Плохой User-Agent блокируется.
- Cron-обновление не требует токен.
