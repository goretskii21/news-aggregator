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

Compose поднимает один контейнер:

- `news-aggr` - локальный frontend/API сервер.

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
  -> запись одного JSON payload в KV
  -> отправка новых новостей в Telegram-канал
  -> сброс записи в Worker Cache API

Запрос пользователя /api/news
  -> Worker Cache API
  -> KV
  -> memory fallback
  -> ответ без обращений к внешним RSS-источникам
```

Обычные пользовательские запросы не ходят во внешние RSS-источники. Новости собирает только scheduled cron каждые 10 минут, затем пользователи читают готовый payload из Worker Cache API или KV. Ручное принудительное обновление отключено.

### Telegram-канал

Cron может публиковать новые новости в Telegram-канал через Bot API. Для этого в Worker должны быть добавлены секреты:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
```

`TELEGRAM_CHANNEL_ID` может быть публичным именем канала, например `@channel_name`, если бот добавлен в канал администратором. Если секреты не заданы, Telegram-публикация просто пропускается.

Защита от спама:

- максимум 8 новых сообщений за один cron-запуск;
- уже отправленные новости отмечаются в KV ключами `telegram:sent:*`;
- TTL отметки отправки - 7 дней;
- сообщения отправляются в `parse_mode: HTML`.

Продовый домен:

```text
https://news-aggr.goretskiy.pro
```

### KV-кэш

KV namespace `news-aggregator-cache` хранит готовый payload новостей. В `wrangler.toml` namespace привязан как `NEWS_CACHE`:

```toml
[[kv_namespaces]]
binding = "NEWS_CACHE"
id = "86aef1c1040a4043b8d733ee21c593b7"
```

Cron обновляет новости каждые 10 минут и пишет один ключ `news:all`.

## Безопасность

Что реализовано в Worker:

- Блокировка очевидных скриптов по User-Agent: `python-requests`, `curl`, `wget`, `scrapy`, `go-http-client`.
- Ручное обновление через `/api/news?fresh=1` отключено.
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
4. Держать Cache Rules консервативными для `/api/news`.

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

Ожидаемые smoke-проверки:

- `/` возвращает HTML.
- `/api/news` возвращает JSON.
- `/api/news?fresh=1` возвращает `403`, потому что ручное обновление отключено.
- `If-None-Match` возвращает `304`.
- Плохой User-Agent блокируется.
- Cron-обновление пишет новости в KV.
- Telegram-публикация отправляет только новые новости и не дублирует уже отправленные.
