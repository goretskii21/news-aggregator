# News Aggregator

## Production: проверка очереди без отправки в новую группу

Cloudflare разворачивает `main` через Git integration. `wrangler.toml` использует
`src/production-worker.js`: в режиме `NEWS_PIPELINE_MODE=shadow` действующий
канал продолжает работать, а новые источники наполняют SQLite Durable Object
`NewsDelivery`. `TELEGRAM_DELIVERY_ENABLED=false` блокирует отправку в новую группу.
Режим `legacy` выполняет только старую рассылку; `topics` — только новую очередь.
Включать отправку следует отдельно, после проверки источников и очереди из Cloudflare.
Секреты старого канала сохраняются; для новой группы используется `TG_NEWS_BOT`.

Проверки `npm run check` и `npm run smoke` входят в существующую Cloudflare-сборку.
Node.js 22+; версия Wrangler закреплена. Папки `outputs/`, `.wrangler/` и `.dev.vars`
не включаются в Git. Отчёты `npm run preview:sources` создаются в `outputs/`;
другой каталог задаётся переменной `NEWS_REPORT_DIR`.

Откат поведения: вернуть `NEWS_PIPELINE_MODE=legacy`, сохранив экспорт класса
NewsDelivery, binding и миграцию. Не откатывать вслепую к версии до создания класса.

## Локальная проверка на Windows

Production-конфигурация не меняется. `wrangler.local.toml` использует отдельный
локальный KV `local-news-cache` и слушает только `127.0.0.1:8787`.
Docker и авторизация Cloudflare для этого не нужны.

Локальные секреты в `.dev.vars` (файл исключён из Git):

```dotenv
TG_NEWS_BOT=<токен тестового бота>
TELEGRAM_GROUP_CHAT_ID=<числовой ID тестовой группы>
```

Запуск после установки зависимостей:

```sh
node node_modules/wrangler/bin/wrangler.js dev --local --test-scheduled --config wrangler.local.toml
```

В другом терминале один сбор RSS:

```sh
node scripts/local-tick.mjs
```

Или автоматический опрос раз в 10 минут, пока работают оба процесса:

```sh
node scripts/local-tick.mjs --watch
```

Первый сбор только заполняет локальный кэш; последующие могут отправлять реальные
новости в General указанной группы. Маршрутизация по девяти темам пока не реализована.
Это не системная служба: сон/выключение Windows и закрытие процессов останавливают работу.
Остановка — Ctrl+C в обоих терминалах.

Один контролируемый тест настоящего обработчика Worker с реальной отправкой Telegram,
но с тестовыми RSS и KV в памяти:

```sh
node --env-file=.dev.vars test/telegram-live.mjs --send
```

Тест проверяет пустой кэш без отправки, одно новое сообщение и отсутствие дубля
при повторном запуске. Без `--send` отправки нет. Не добавляйте этот live-тест в CI.

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

## Очередь новостей по темам — локальный кандидат

Новый обработчик: `src/topics-worker.js`; конфигурация: `wrangler.topics.local.toml`.
Существующий production entrypoint и `wrangler.toml` не переключены.

- Все 74 RSS/Atom и CISA KEV собираются каждые 10 минут при подключении cron. Конфигурация локального кандидата не создаёт удалённый cron.
- До шести загрузок одновременно. Полный сбор рассчитан на подтверждённый пользователем Workers Paid.
- Отбор и дедупликация выполняются до записи в отдельный SQLite Durable Object `NewsDelivery`.
- Обычный дайджест содержит до пяти новостей. Остаток ждёт следующего времени; обычные новости истекают через 48 часов в очереди со счётчиком expired. Critical и уже подготовленные повторные отправки не истекают автоматически.
- Расписание по Europe/Kyiv: AI 09:00/18:00; Git 09:10/18:10; Containers 09:20/18:20; Cloud 09:30/18:30; Microsoft 09:40/18:40; Linux 18:50; Apple 19:00; Games 19:10.
- Critical отправляется без ожидания дайджеста. Обнаружение ограничено периодом опроса, а не реальным временем.
- Маршруты девяти тем находятся в `src/delivery-queue.js`; группа задаётся `TELEGRAM_GROUP_CHAT_ID`, токен — `TG_NEWS_BOT`.
- `TELEGRAM_DELIVERY_ENABLED` по умолчанию false. Само наличие токена не включает отправку.
- Один запрос отправки за вызов очереди; общий интервал для группы не меньше четырёх секунд, для восстановления используются alarms с шагом от минуты. HTTP 429 приостанавливает всю группу на retry_after.
- Положительное подтверждение Telegram удаляет новости из очереди и фиксирует успешное время дайджеста. Ошибки и тайм-ауты сохраняют задание; интервал повторов растёт до часа.
- Это доставка с возможным повтором: если Telegram принял сообщение, но подтверждение потерялось, повторное сообщение возможно. Telegram sendMessage не предоставляет ключ идемпотентности.
- При первом наполнении допускается материал за последние 48 часов. Перед включением в production нужно проверить и при необходимости очистить тестовую очередь.
- Предел очереди 2000 новостей: превышение даёт ошибку, а не молча отбрасывает свежие материалы.

Проверки без реальной отправки:

```sh
npm run test:delivery
npm run test:selection
npm run smoke
npm run build:topics
npm run test:delivery-runtime
```

Локальный запуск: `npm run dev:topics`. Отдельный порт 8788; scheduled-триггер доступен в режиме test-scheduled. Данный режим собирает источники, но при false не вызывает Telegram. Автоматический локальный таймер для нового кандидата пока не запущен.

Перед удалённым включением: перенести настройки в целевой Worker, создать binding и migration для NewsDelivery, подтвердить group/topic IDs, проверить один контролируемый пост и подготовить откат. Production автоматически разворачивается при push main: не пушить неподтверждённый переход.
