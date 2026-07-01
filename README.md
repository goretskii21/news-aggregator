# News Aggregator

Персональный Telegram-бот для публикации новостей из RSS/news-источников.

Веб-версия удалена: проект больше не отдаёт HTML, публичный API или статические файлы. Worker работает как cron-задача в Cloudflare Workers.

## Архитектура

```text
Cloudflare scheduled cron
  -> загрузка RSS/news-источников
  -> нормализация новостей
  -> сравнение с предыдущим KV payload
  -> отправка новых новостей в Telegram-канал
  -> запись текущего payload в KV
  -> запись telegram:sent:* ключей против дублей
```

HTTP-запросы к Worker возвращают `404 Not Found`. Основной рабочий путь - только `scheduled()`.

## Cloudflare Workers

Основные файлы:

- `src/worker.js` - источники, парсинг, cron и Telegram-публикация.
- `wrangler.toml` - конфиг Worker, cron и KV binding.
- `test/worker-smoke.mjs` - smoke-проверки cron/KV/Telegram.

Деплой настроен через встроенную интеграцию **Cloudflare Workers + GitHub**. После push в `main` Cloudflare запускает проверки и деплой.

Текущая конфигурация сборки в Cloudflare:

```text
Команда сборки: npm install && npm run check && npm run smoke
Команда деплоя: npx wrangler deploy
Production branch: main
```

## KV

KV namespace `news-aggregator-cache` хранит:

- `news:all` - последний нормализованный payload новостей;
- `telegram:sent:*` - отметки отправленных новостей.

Binding в `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "NEWS_CACHE"
id = "86aef1c1040a4043b8d733ee21c593b7"
```

## Telegram

Нужны секреты Worker:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
```

`TELEGRAM_CHANNEL_ID` может быть публичным именем канала, например `@channel_name`, если бот добавлен в канал администратором.

Формат сообщений:

```html
<b>Источник</b>

<b>Тема новости</b>

Краткий текст новости...

<a href="https://example.com/news">Читать полностью</a>
```

Защита от спама:

- максимум 8 новых сообщений за один cron-запуск;
- отправляются только новости, которых не было в предыдущем `news:all`;
- уже отправленные новости отмечаются в KV ключами `telegram:sent:*`;
- TTL sent-ключей - 7 дней;
- первый cron после пустого KV только заполняет `news:all` и не отправляет старый backlog.

## Команды

```sh
npm run check
npm run smoke
wrangler deploy
```

Обычный деплой выполняется через Cloudflare Git integration после push в ветку `main`. `wrangler deploy` нужен только для ручного деплоя с локальной машины.

## Smoke-проверки

- HTTP `fetch()` возвращает `404`.
- Cron загружает источники.
- Cron пишет `news:all` в KV.
- Telegram-публикация отправляет только новые новости.
- Telegram-сообщения используют HTML parse mode.
- Повторный cron не дублирует уже отправленные новости.
