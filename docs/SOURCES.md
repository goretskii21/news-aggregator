# Источники новостей по категориям

Рабочий каталог и резерв по состоянию на **20 октября 2026**. Подключение сверено с [каталогом RSS/Atom](../src/source-catalog.js) и [обработчиком CISA KEV](../src/topics-worker.js). Последняя доступная проверка из Cloudflare: **20.10.2026, 16:11:08 по Киеву**. Это снимок доступности, а не постоянно обновляемый статус.

В рабочий опрос включены **74 RSS/Atom-ленты и 1 JSON-поток CISA KEV**. Ещё **9 источников включены через адаптеры** (API, HTML и RSS Google с восстановлением даты со страницы статьи). Всего в таблицах 84 уникальных адреса; некоторые повторяются в разных категориях. Несколько лент могут принадлежать одному издателю.

«Подключён» означает, что Worker пытается загрузить источник каждые 10 минут, включая источники с временной ошибкой. Это не означает отправку каждой записи: действуют фильтры, окно актуальности, дедупликация и лимиты дайджеста. OK означает успешный разбор в указанном запуске; число записей относится ко всей полученной ленте, а не к числу отобранных новостей.

## Содержание

- [🚨 Critical / Security](#category-1)
- [🤖 AI](#category-2)
- [🦊 GitLab / GitHub](#category-3)
- [🐳 Docker / Kubernetes](#category-4)
- [☁️ Cloud](#category-5)
- [🪟 Microsoft](#category-6)
- [🐧 Linux / Networking](#category-7)
- [🍎 Apple](#category-8)
- [🎮 Games](#category-9)

<a id="category-1"></a>

## 🚨 Critical / Security

Docker Engine/Swarm разных поколений, Ansible, Ubuntu 22.04+ и связанные компоненты. Материал из security-ленты — кандидат на оценку, а не автоматически Critical. Автоматический срочный сигнал сейчас требует релевантной записи CISA KEV.

6 RSS/JSON-потоков; 4 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [Ubuntu Security Notices](https://ubuntu.com/security/notices/rss.xml) | EN | Официальный | RSS/Atom · подключён | Тайм-аут |
| [CISA KEV](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) | EN | Официальный | JSON · подключён | OK · 1748 записей |
| [Docker Security](https://www.docker.com/blog/category/security/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Moby advisories](https://github.com/moby/moby/security/advisories) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [Ansible advisories](https://github.com/ansible/ansible/security/advisories) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [containerd advisories](https://github.com/containerd/containerd/security/advisories) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [runc advisories](https://github.com/opencontainers/runc/security/advisories) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [SANS Internet Storm Center](https://isc.sans.edu/rssfeed.xml) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [OpenNET](https://www.opennet.ru/opennews/opennews_all_utf.rss) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [SecurityLab](https://www.securitylab.ru/_services/export/rss/news/) | RU | Редакционный | RSS/Atom · подключён | OK · 100 записей |

<a id="category-2"></a>

## 🤖 AI

OpenAI, Claude/Anthropic, Gemini и практические изменения моделей, API и инструментов. Технические материалы Hugging Face дополняют новости производителей.

10 RSS/JSON-потоков; 2 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [OpenAI News](https://openai.com/news/rss.xml) | EN | Официальный | RSS/Atom · подключён | OK · 1300 записей |
| [Anthropic News](https://www.anthropic.com/news) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [Google Gemini](https://blog.google/products/gemini/rss/) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Google DeepMind](https://deepmind.google/blog/rss.xml) | EN | Официальный | RSS/Atom · подключён | OK · 100 записей |
| [Google Developers AI](https://developers.googleblog.com/en/) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [Hugging Face](https://huggingface.co/blog/feed.xml) | EN | Официальный | RSS/Atom · подключён | OK · 884 записей |
| [Microsoft AI Blog](https://news.microsoft.com/source/topics/ai/feed/) | EN | Официальный | RSS/Atom · подключён | HTTP 403 |
| [Claude Code releases](https://github.com/anthropics/claude-code/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [GitHub Blog](https://github.blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Habr News](https://habr.com/ru/rss/news/?fl=ru) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [3DNews](https://3dnews.ru/news/rss/) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [CNews](https://www.cnews.ru/inc/rss/news.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 200 записей |

<a id="category-3"></a>

## 🦊 GitLab / GitHub

GitLab/GitHub: CI/CD, Actions, релизы, изменения поведения и ограничения сервисов. Общие ленты фильтруются по заголовку.

9 RSS/JSON-потоков; 0 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [GitHub Blog](https://github.blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [GitHub Changelog](https://github.blog/changelog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [GitLab Blog](https://about.gitlab.com/atom.xml) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [GitLab monthly releases](https://docs.gitlab.com/releases/releases.xml) | EN | Официальный | RSS/Atom · подключён | OK · 42 записей |
| [GitLab patch releases](https://docs.gitlab.com/releases/patch-releases.xml) | EN | Официальный | RSS/Atom · подключён | OK · 108 записей |
| [GitHub CLI releases](https://github.com/cli/cli/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [GitHub Actions runner releases](https://github.com/actions/runner/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Git for Windows releases](https://github.com/git-for-windows/git/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Habr News](https://habr.com/ru/rss/news/?fl=ru) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |

<a id="category-4"></a>

## 🐳 Docker / Kubernetes

Docker, Swarm, Kubernetes и экосистема контейнеров. Релизы и практические изменения; security-only ленты обрабатываются отдельно.

11 RSS/JSON-потоков; 0 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [Docker Security](https://www.docker.com/blog/category/security/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Docker Blog](https://www.docker.com/blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Kubernetes Blog](https://kubernetes.io/feed.xml) | EN | Официальный | RSS/Atom · подключён | OK · 50 записей |
| [CNCF Blog](https://www.cncf.io/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Helm Blog](https://helm.sh/blog/index.xml) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Moby releases](https://github.com/moby/moby/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [containerd releases](https://github.com/containerd/containerd/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [runc releases](https://github.com/opencontainers/runc/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Docker Compose releases](https://github.com/docker/compose/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [OpenNET](https://www.opennet.ru/opennews/opennews_all_utf.rss) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [Habr News](https://habr.com/ru/rss/news/?fl=ru) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |

<a id="category-5"></a>

## ☁️ Cloud

AWS, Hetzner, Cloudflare: инфраструктура, продукты и существенные инциденты. Плановые работы без актуального влияния не включаются автоматически.

10 RSS/JSON-потоков; 1 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [AWS News Blog](https://aws.amazon.com/blogs/aws/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [AWS Whats New](https://aws.amazon.com/about-aws/whats-new/recent/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 100 записей |
| [AWS Security Blog](https://aws.amazon.com/blogs/security/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Cloudflare Blog](https://blog.cloudflare.com/rss/) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Cloudflare Changelog](https://developers.cloudflare.com/changelog/rss/index.xml) | EN | Официальный | RSS/Atom · подключён | OK · 1369 записей |
| [Cloudflare Status](https://www.cloudflarestatus.com/history.atom) | EN | Официальный | RSS/Atom · подключён | OK · 25 записей |
| [Hetzner Status](https://status.hetzner.com/en.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Hetzner News](https://www.hetzner.com/news/) | EN | Официальный | Адаптер · подключён | Windows: HTTP 429; повторы с паузой ≥ 1 ч |
| [Microsoft Azure Blog](https://azure.microsoft.com/en-us/blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Habr News](https://habr.com/ru/rss/news/?fl=ru) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [CNews](https://www.cnews.ru/inc/rss/news.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 200 записей |

<a id="category-6"></a>

## 🪟 Microsoft

Entra, Azure, M365, Exchange, Intune, Windows и серверные изменения. Comss делится между Microsoft и Linux по заголовку.

12 RSS/JSON-потоков; 0 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [Microsoft Azure Blog](https://azure.microsoft.com/en-us/blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Microsoft Entra Blog](https://aka.ms/MTC/RSS-Board-Sidebar?board.id=microsoft-entra-blog) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Microsoft 365 Blog](https://www.microsoft.com/en-us/microsoft-365/blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [Exchange Team Blog](https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=Exchange) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Intune Customer Success](https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=IntuneCustomerSuccess) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Windows IT Pro Blog](https://aka.ms/MTC/RSS-Board-Sidebar?board.id=Windows-ITPro-blog) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/feed/) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [MSRC](https://api.msrc.microsoft.com/update-guide/rss) | EN | Официальный | RSS/Atom · подключён | OK · 5182 записей |
| [Habr News](https://habr.com/ru/rss/news/?fl=ru) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [3DNews](https://3dnews.ru/news/rss/) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [CNews](https://www.cnews.ru/inc/rss/news.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 200 записей |
| [Comss](https://www.comss.ru/rss.php) | RU | Редакционный | RSS/Atom · подключён | OK · 10 записей |

<a id="category-7"></a>

## 🐧 Linux / Networking

Ubuntu, Linux, Ansible, ядро, OpenWrt, DNS и сети. Уязвимости требуют отдельной проверки применимости к версиям пользователя.

11 RSS/JSON-потоков; 0 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [Ubuntu Security Notices](https://ubuntu.com/security/notices/rss.xml) | EN | Официальный | RSS/Atom · подключён | Тайм-аут |
| [Ubuntu Blog](https://ubuntu.com/blog/feed) | EN | Официальный | RSS/Atom · подключён | Тайм-аут |
| [Linux kernel releases](https://www.kernel.org/feeds/kdist.xml) | EN | Официальный | RSS/Atom · подключён | OK · 9 записей |
| [Ansible community releases](https://rss.community.eng.ansible.com/atom.xml) | EN | Официальный | RSS/Atom · подключён | OK · 100 записей |
| [Ansible releases](https://github.com/ansible/ansible/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [systemd releases](https://github.com/systemd/systemd/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [OpenWrt releases](https://github.com/openwrt/openwrt/releases.atom) | EN | Официальный | RSS/Atom · подключён | OK · 10 записей |
| [BIND / ISC Blog](https://www.isc.org/index.xml) | EN | Официальный | RSS/Atom · подключён | OK · 363 записей |
| [OpenNET](https://www.opennet.ru/opennews/opennews_all_utf.rss) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [Habr News](https://habr.com/ru/rss/news/?fl=ru) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [Comss](https://www.comss.ru/rss.php) | RU | Редакционный | RSS/Atom · подключён | OK · 10 записей |

<a id="category-8"></a>

## 🍎 Apple

macOS, iOS, iPadOS, Mac/Apple Silicon и инструменты Apple. Отсеиваются продажи телефонов, аксессуары, слухи и предварительные релизы.

11 RSS/JSON-потоков; 0 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [Apple Newsroom](https://www.apple.com/newsroom/rss-feed.rss) | EN | Официальный | RSS/Atom · подключён | OK · 20 записей |
| [Apple Developer News](https://developer.apple.com/news/rss/news.rss) | EN | Официальный | RSS/Atom · подключён | OK · 148 записей |
| [Apple Developer Releases](https://developer.apple.com/news/releases/rss/releases.rss) | EN | Официальный | RSS/Atom · подключён | OK · 42 записей |
| [MacRumors](https://www.macrumors.com/macrumors.xml) | EN | Редакционный | RSS/Atom · подключён | OK · 20 записей |
| [9to5Mac](https://9to5mac.com/feed/) | EN | Редакционный | RSS/Atom · подключён | OK · 100 записей |
| [MacStories](https://www.macstories.net/feed/) | EN | Редакционный | RSS/Atom · подключён | OK · 30 записей |
| [Macworld](https://www.macworld.com/feed) | EN | Редакционный | RSS/Atom · подключён | OK · 20 записей |
| [AppleInsider.com](https://appleinsider.com/rss/news/) | EN | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [3DNews](https://3dnews.ru/news/rss/) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [AppleInsider.ru](https://appleinsider.ru/feed) | RU | Редакционный | RSS/Atom · подключён | OK · 20 записей |
| [iPhones.ru](https://www.iphones.ru/feed) | RU | Редакционный | RSS/Atom · подключён | OK · 20 записей |

<a id="category-9"></a>

## 🎮 Games

Игровые новости в целом; приоритет Diablo IV, AION 2 и основной WoW, без ограничения только этими играми. WoW: Forever считается общей игровой новостью.

12 RSS/JSON-потоков; 2 дополнительных адаптера.

| Источник / ссылка на ленту или страницу | Язык | Тип источника | Подключение | Последняя проверка |
|---|---|---|---|---|
| [PC Gamer](https://www.pcgamer.com/rss/) | EN | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [Eurogamer](https://www.eurogamer.net/feed) | EN | Редакционный | RSS/Atom · подключён | OK · 100 записей |
| [Rock Paper Shotgun](https://www.rockpapershotgun.com/feed) | EN | Редакционный | RSS/Atom · подключён | OK · 100 записей |
| [GamesIndustry.biz](https://www.gamesindustry.biz/feed) | EN | Редакционный | RSS/Atom · подключён | OK · 100 записей |
| [IGN](https://feeds.ign.com/ign/all) | EN | Редакционный | RSS/Atom · подключён | HTTP 403 |
| [Blizzard News](https://news.blizzard.com/en-us) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [AION 2 official announcements](https://aion2.plaync.com/en-us/board/notice/list) | EN | Официальный | Адаптер · подключён | Адаптер добавлен 20.10; актуальный результат — в diagnostics |
| [3DNews](https://3dnews.ru/news/rss/) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [GoHa](https://www.goha.ru/rss/news) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [StopGame](https://rss.stopgame.ru/rss_all.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |
| [PlayGround](https://www.playground.ru/rss/news.xml) | RU | Редакционный | RSS/Atom · подключён | Тайм-аут после HTTP 200 |
| [Igromania](https://www.igromania.ru/rss/news.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 30 записей |
| [VGTimes](https://vgtimes.ru/rss.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 40 записей |
| [iXBT.games](https://ixbt.games/export/news/rss.xml) | RU | Редакционный | RSS/Atom · подключён | OK · 50 записей |

## Известные ограничения

- В снимке Cloudflare Microsoft AI Blog и IGN отвечают HTTP 403; Ubuntu Security Notices и Ubuntu Blog достигают тайм-аута; у PlayGround загрузка тела обрывается по тайм-ауту после HTTP 200. Они остаются в повторном опросе.
- Cloudflare Blog и Apple Developer News восстановились в последующей проверке без замены URL.
- Доступность русских ресурсов с Windows в Украине и из Cloudflare различается. OpenNET, CNews, AppleInsider.ru и Igromania не исключены по локальным тайм-аутам и проверяются на стороне Worker.
- Anthropic разбирается из HTML, Blizzard и AION 2 — через публичные JSON-списки их сайтов. Эти API не имеют гарантии стабильности; изменение схемы будет видно в diagnostics.
- GitHub advisories подключены через публичный API без токена. Ansible вернул HTTP 200 и пустой список: это не доказательство отсутствия CVE. Покрытие ограничено опубликованными repository advisories, максимум 100 последних на репозиторий через API. При HTTP 403/429 используется официальный HTML-список (10 последних записей на первой странице). HTML не содержит полных диапазонов версий/CVE: эти поля не выдумываются, запись помечается `metadataIncomplete`. Отозванные записи исключаются. Уязвимые/исправленные диапазоны сохраняются в нормализованных данных адаптера; автоматического сопоставления с инвентаризацией серверов пока нет. Срочность по-прежнему определяется CISA KEV.
- Возможный официальный резерв Ubuntu: [данные Canonical в формате OSV](https://github.com/canonical/ubuntu-security-notices). Он ещё не подключён.

## Как обновлять каталог

1. Для RSS/Atom изменить запись в `src/source-catalog.js`: URL, уникальный id, name, categories и role. При смене name учитывать, что он используется при сопоставлении диагностических записей.
2. Проверить публичную ленту существующим парсером, а затем доступность из Cloudflare. HTML-страницы не добавлять в RSS-каталог без адаптера.
3. Обновить эту таблицу, явно указав время проверки. Фактический статус после cron хранится в закрытом ключе `topics:diagnostics` существующего NEWS_CACHE.
4. Изменение общего фильтра находится в `src/news-selection.js`. Для пересмотра уже накопленной очереди обновить версию правил в `src/queue-review.js` и проверить миграцию тестами.

Секреты и Telegram ID здесь не нужны. Основной код не загружает таблицу Markdown: поведение определяется исходниками, а таблица служит документацией.

## Режим адаптеров и расход

Код: [source-adapters.js](../src/source-adapters.js). Девять источников обновляются раз в час; между обновлениями используется приватный KV-кэш нормализованных записей. Ошибки тоже кэшируются на час, `Retry-After` может увеличить паузу до суток. Cron остаётся каждые 10 минут. Google RSS не содержит дат: максимум для 10 записей за обновление дата берётся со страницы статьи; без подтверждённой даты запись исключается. Google Developers фильтруется по AI.

Локальная проверка 20.10.2026: Moby — 26, containerd — 33, runc — 13, Anthropic — 14, Google — 8, Blizzard — 15, AION 2 — 10 записей; Ansible — пустой список. Hetzner — HTTP 429. Для Hetzner реализован разбор JSON-LD и датированных HTML article; на реальном содержимом он ещё не подтверждён из-за ограничения доступа. Защита сайта не обходится. Исторические статусы в таблицах выше относятся к старому снимку RSS; текущие статусы адаптеров хранятся отдельно в том же `topics:diagnostics` с `checkedAt` и `cached`.


## Проверка из Cloudflare после подключения

**20.10.2026 16:51:15 по Киеву**, штатный production cron: Anthropic — OK, 14; Google Developers AI — OK, 8; Blizzard — OK, 15; AION 2 — OK, 10. GitHub API всех четырёх репозиториев — 403; Hetzner — 429. Это подтвердило отличие доступности от Windows.

**20.10.2026 16:54:43 по Киеву**, изолированный Cloudflare remote preview без очереди и Telegram: резервный HTML GitHub — Moby/containerd/runc по 10 записей, Ansible — корректный пустой список; HTTP 200. Этот путь включён при ошибках API 403/429. Hetzner повторно 429; его HTML-парсер проверен тестовыми данными, но сбор реальной страницы пока не подтверждён. Актуальный production-статус и выбранный `transport` появятся в `topics:diagnostics` следующего cron.

Правила фильтрации, включая исключение российских внутренних и корпоративных новостей при сохранении русскоязычных источников: [FILTERING.md](FILTERING.md).

## Восстановление RSS Ubuntu — 20.10.2026

Оба официальных RSS доступны из Windows, но из Cloudflare запросы без явных заголовков достигали тайм-аута. В штатном загрузчике для ubuntu.com и canonical.com добавлены User-Agent и Accept. Изолированная проверка на Cloudflare 20.10.2026 17:47 по Киеву: Ubuntu Security Notices — HTTP 200, 10 записей, 163 мс; Ubuntu Blog — HTTP 200, 12 записей, 164 мс. URL и парсер сохранены; OSV/JSON-адаптер не потребовался. Это результат remote preview, а не утверждение о последнем production cron. Предыдущие отметки тайм-аутов выше исторические; актуальный статус хранится в приватном topics:diagnostics.

## Повторная проверка и восстановление — 21.10.2026

Полный штатный сборщик проверен в изолированном Cloudflare remote preview **21.10.2026 17:28 по Киеву**: **82 из 84 источников** успешно разобраны либо вернули корректный пустой список advisories. Это снимок доступности источников, не гарантия постоянного доступа и не число отобранных новостей. Проверка не вызывала очередь и Telegram.

| Источник | Изменение | Проверка из Cloudflare |
|---|---|---|
| Microsoft AI Blog | Явные User-Agent/Accept | HTTP 200, 10 записей |
| Microsoft 365 Blog | Прямой официальный RSS https://www.microsoft.com/en-us/copilot/blog/feed/ вместо старого редиректа; явные заголовки | HTTP 200, 10 записей |
| Microsoft Security Blog | Официальный RSS https://www.microsoft.com/en-us/security/blog/?feed=rss2; явные заголовки | HTTP 200, 10 записей |
| IGN | Явные заголовки запроса | HTTP 200, 20 записей |
| PlayGround | Чтение первых 20 **полностью полученных** RSS-записей, затем отмена потока | HTTP 200, 20 записей, bounded=true |
| Anthropic News | Поддержка новой разметки: заголовок и дата в общей строке data-listing-row, а не внутри одной ссылки; старый формат сохранён | HTTP 200, 24 записи |

Прежний Microsoft 365 URL уже перенаправлялся издателем в Copilot / AI at Work Blog; используется прямой адрес того же потока. Имя источника сохранено для совместимости очереди. Это не обещание покрытия всех публикаций Microsoft 365.

PlayGround отдаёт из Cloudflare 20 полных записей, после чего тело зависает. Увеличение тайм-аута до 25 секунд не помогло. Теперь сохраняется только ограниченная свежая страница из 20 завершённых item, незавершённая следующая запись не используется; сетевой поток закрывается. Подход не загружает весь архив, не увеличивает бесконечно ожидание и явно отмечается в diagnostics.

**Не восстановлены:** AppleInsider.ru (HTTP 200, затем тайм-аут тела; альтернативные RSS/Atom тоже недоступны из Cloudflare) и Hetzner News (429; проверенные локализованные страницы и blog feed вернули 404). Они остаются в повторном опросе; защита сайта не обходится. Предыдущие статусы выше исторические, текущий production-результат появится в topics:diagnostics после очередного cron.

Новые темы «Кино» и «Что посмотреть»: источники, адаптеры подписок и ограничения описаны в [MEDIA-SOURCES.md](MEDIA-SOURCES.md).
