// Audited candidate feeds; isolated from the existing production worker.
export const sources = [
  {
    "id": "catalog-0",
    "name": "Ubuntu Security Notices",
    "homepage": "https://ubuntu.com/security/notices/rss.xml",
    "url": "https://ubuntu.com/security/notices/rss.xml",
    "categories": [
      "critical",
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-1",
    "name": "Docker Security",
    "homepage": "https://www.docker.com/blog/category/security/feed/",
    "url": "https://www.docker.com/blog/category/security/feed/",
    "categories": [
      "critical",
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-2",
    "name": "SANS Internet Storm Center",
    "homepage": "https://isc.sans.edu/rssfeed.xml",
    "url": "https://isc.sans.edu/rssfeed.xml",
    "categories": [
      "critical"
    ],
    "role": "official"
  },
  {
    "id": "catalog-3",
    "name": "OpenAI News",
    "homepage": "https://openai.com/news/rss.xml",
    "url": "https://openai.com/news/rss.xml",
    "categories": [
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-4",
    "name": "Google Gemini",
    "homepage": "https://blog.google/products-and-platforms/products/gemini/rss/",
    "url": "https://blog.google/products/gemini/rss/",
    "categories": [
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-5",
    "name": "Google DeepMind",
    "homepage": "https://deepmind.google/blog/rss.xml",
    "url": "https://deepmind.google/blog/rss.xml",
    "categories": [
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-6",
    "name": "Hugging Face",
    "homepage": "https://huggingface.co/blog/feed.xml",
    "url": "https://huggingface.co/blog/feed.xml",
    "categories": [
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-7",
    "name": "Microsoft AI Blog",
    "homepage": "https://news.microsoft.com/source/topics/ai/feed/",
    "url": "https://news.microsoft.com/source/topics/ai/feed/",
    "categories": [
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-8",
    "name": "Claude Code releases",
    "homepage": "https://github.com/anthropics/claude-code/releases.atom",
    "url": "https://github.com/anthropics/claude-code/releases.atom",
    "categories": [
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-9",
    "name": "GitHub Blog",
    "homepage": "https://github.blog/feed/",
    "url": "https://github.blog/feed/",
    "categories": [
      "git",
      "ai"
    ],
    "role": "official"
  },
  {
    "id": "catalog-10",
    "name": "GitHub Changelog",
    "homepage": "https://github.blog/changelog/feed/",
    "url": "https://github.blog/changelog/feed/",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-11",
    "name": "GitLab Blog",
    "homepage": "https://about.gitlab.com/atom.xml",
    "url": "https://about.gitlab.com/atom.xml",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-12",
    "name": "GitLab monthly releases",
    "homepage": "https://docs.gitlab.com/releases/releases.xml",
    "url": "https://docs.gitlab.com/releases/releases.xml",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-13",
    "name": "GitLab patch releases",
    "homepage": "https://docs.gitlab.com/releases/patch-releases.xml",
    "url": "https://docs.gitlab.com/releases/patch-releases.xml",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-14",
    "name": "GitHub CLI releases",
    "homepage": "https://github.com/cli/cli/releases.atom",
    "url": "https://github.com/cli/cli/releases.atom",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-15",
    "name": "GitHub Actions runner releases",
    "homepage": "https://github.com/actions/runner/releases.atom",
    "url": "https://github.com/actions/runner/releases.atom",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-16",
    "name": "Git for Windows releases",
    "homepage": "https://github.com/git-for-windows/git/releases.atom",
    "url": "https://github.com/git-for-windows/git/releases.atom",
    "categories": [
      "git"
    ],
    "role": "official"
  },
  {
    "id": "catalog-17",
    "name": "Docker Blog",
    "homepage": "https://www.docker.com/feed/",
    "url": "https://www.docker.com/blog/feed/",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-18",
    "name": "Kubernetes Blog",
    "homepage": "https://kubernetes.io/feed.xml",
    "url": "https://kubernetes.io/feed.xml",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-19",
    "name": "CNCF Blog",
    "homepage": "https://www.cncf.io/feed/",
    "url": "https://www.cncf.io/feed/",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-20",
    "name": "Helm Blog",
    "homepage": "https://helm.sh/blog/index.xml",
    "url": "https://helm.sh/blog/index.xml",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-21",
    "name": "Moby releases",
    "homepage": "https://github.com/moby/moby/releases.atom",
    "url": "https://github.com/moby/moby/releases.atom",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-22",
    "name": "containerd releases",
    "homepage": "https://github.com/containerd/containerd/releases.atom",
    "url": "https://github.com/containerd/containerd/releases.atom",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-23",
    "name": "runc releases",
    "homepage": "https://github.com/opencontainers/runc/releases.atom",
    "url": "https://github.com/opencontainers/runc/releases.atom",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-24",
    "name": "Docker Compose releases",
    "homepage": "https://github.com/docker/compose/releases.atom",
    "url": "https://github.com/docker/compose/releases.atom",
    "categories": [
      "containers"
    ],
    "role": "official"
  },
  {
    "id": "catalog-25",
    "name": "AWS News Blog",
    "homepage": "https://aws.amazon.com/blogs/aws/feed/",
    "url": "https://aws.amazon.com/blogs/aws/feed/",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-26",
    "name": "AWS Whats New",
    "homepage": "https://aws.amazon.com/about-aws/whats-new/recent/feed/",
    "url": "https://aws.amazon.com/about-aws/whats-new/recent/feed/",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-27",
    "name": "AWS Security Blog",
    "homepage": "https://aws.amazon.com/blogs/security/feed/",
    "url": "https://aws.amazon.com/blogs/security/feed/",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-28",
    "name": "Cloudflare Blog",
    "homepage": "https://blog.cloudflare.com/rss/",
    "url": "https://blog.cloudflare.com/rss/",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-29",
    "name": "Cloudflare Changelog",
    "homepage": "https://developers.cloudflare.com/changelog/rss/index.xml",
    "url": "https://developers.cloudflare.com/changelog/rss/index.xml",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-30",
    "name": "Cloudflare Status",
    "homepage": "https://www.cloudflarestatus.com/history.atom",
    "url": "https://www.cloudflarestatus.com/history.atom",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-31",
    "name": "Hetzner Status",
    "homepage": "https://status.hetzner.com/en.atom",
    "url": "https://status.hetzner.com/en.atom",
    "categories": [
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-32",
    "name": "Microsoft Azure Blog",
    "homepage": "https://azure.microsoft.com/en-us/blog/feed/",
    "url": "https://azure.microsoft.com/en-us/blog/feed/",
    "categories": [
      "microsoft",
      "cloud"
    ],
    "role": "official"
  },
  {
    "id": "catalog-33",
    "name": "Microsoft Entra Blog",
    "homepage": "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=microsoft-entra-blog",
    "url": "https://aka.ms/MTC/RSS-Board-Sidebar?board.id=microsoft-entra-blog",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-34",
    "name": "Microsoft 365 Blog",
    "homepage": "https://www.microsoft.com/en-us/copilot/blog/feed/",
    "url": "https://www.microsoft.com/en-us/copilot/blog/feed/",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-35",
    "name": "Exchange Team Blog",
    "homepage": "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=Exchange",
    "url": "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=Exchange",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-36",
    "name": "Intune Customer Success",
    "homepage": "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=IntuneCustomerSuccess",
    "url": "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=IntuneCustomerSuccess",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-37",
    "name": "Windows IT Pro Blog",
    "homepage": "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=Windows-ITPro-blog",
    "url": "https://aka.ms/MTC/RSS-Board-Sidebar?board.id=Windows-ITPro-blog",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-38",
    "name": "Microsoft Security Blog",
    "homepage": "https://www.microsoft.com/en-us/security/blog/feed/",
    "url": "https://www.microsoft.com/en-us/security/blog/?feed=rss2",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-39",
    "name": "MSRC",
    "homepage": "https://api.msrc.microsoft.com/update-guide/rss",
    "url": "https://api.msrc.microsoft.com/update-guide/rss",
    "categories": [
      "microsoft"
    ],
    "role": "official"
  },
  {
    "id": "catalog-40",
    "name": "Ubuntu Blog",
    "homepage": "https://ubuntu.com/blog/feed",
    "url": "https://ubuntu.com/blog/feed",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-41",
    "name": "Linux kernel releases",
    "homepage": "https://www.kernel.org/feeds/kdist.xml",
    "url": "https://www.kernel.org/feeds/kdist.xml",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-42",
    "name": "Ansible community releases",
    "homepage": "https://rss.community.eng.ansible.com/atom.xml",
    "url": "https://rss.community.eng.ansible.com/atom.xml",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-43",
    "name": "Ansible releases",
    "homepage": "https://github.com/ansible/ansible/releases.atom",
    "url": "https://github.com/ansible/ansible/releases.atom",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-44",
    "name": "systemd releases",
    "homepage": "https://github.com/systemd/systemd/releases.atom",
    "url": "https://github.com/systemd/systemd/releases.atom",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-45",
    "name": "OpenWrt releases",
    "homepage": "https://github.com/openwrt/openwrt/releases.atom",
    "url": "https://github.com/openwrt/openwrt/releases.atom",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-46",
    "name": "BIND / ISC Blog",
    "homepage": "https://www.isc.org/index.xml",
    "url": "https://www.isc.org/index.xml",
    "categories": [
      "linux"
    ],
    "role": "official"
  },
  {
    "id": "catalog-47",
    "name": "Apple Newsroom",
    "homepage": "https://www.apple.com/newsroom/rss-feed.rss",
    "url": "https://www.apple.com/newsroom/rss-feed.rss",
    "categories": [
      "apple"
    ],
    "role": "official"
  },
  {
    "id": "catalog-48",
    "name": "Apple Developer News",
    "homepage": "https://developer.apple.com/news/rss/news.rss",
    "url": "https://developer.apple.com/news/rss/news.rss",
    "categories": [
      "apple"
    ],
    "role": "official"
  },
  {
    "id": "catalog-49",
    "name": "Apple Developer Releases",
    "homepage": "https://developer.apple.com/news/releases/rss/releases.rss",
    "url": "https://developer.apple.com/news/releases/rss/releases.rss",
    "categories": [
      "apple"
    ],
    "role": "official"
  },
  {
    "id": "catalog-50",
    "name": "MacRumors",
    "homepage": "https://feeds.macrumors.com/MacRumors-Front",
    "url": "https://www.macrumors.com/macrumors.xml",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-51",
    "name": "9to5Mac",
    "homepage": "https://9to5mac.com/feed/",
    "url": "https://9to5mac.com/feed/",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-52",
    "name": "MacStories",
    "homepage": "https://www.macstories.net/feed/",
    "url": "https://www.macstories.net/feed/",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-53",
    "name": "Macworld",
    "homepage": "https://www.macworld.com/feed",
    "url": "https://www.macworld.com/feed",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-54",
    "name": "AppleInsider.com",
    "homepage": "https://appleinsider.com/rss/news/",
    "url": "https://appleinsider.com/rss/news/",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-55",
    "name": "PC Gamer",
    "homepage": "https://www.pcgamer.com/rss/",
    "url": "https://www.pcgamer.com/rss/",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-56",
    "name": "Eurogamer",
    "homepage": "https://www.eurogamer.net/feed",
    "url": "https://www.eurogamer.net/feed",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-57",
    "name": "Rock Paper Shotgun",
    "homepage": "https://www.rockpapershotgun.com/feed",
    "url": "https://www.rockpapershotgun.com/feed",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-58",
    "name": "GamesIndustry.biz",
    "homepage": "https://www.gamesindustry.biz/feed",
    "url": "https://www.gamesindustry.biz/feed",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-59",
    "name": "IGN",
    "homepage": "https://www.ign.com/rss/articles/feed",
    "url": "https://feeds.ign.com/ign/all",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-60",
    "name": "OpenNET",
    "homepage": "https://www.opennet.ru/opennews/opennews_all_utf.rss",
    "url": "https://www.opennet.ru/opennews/opennews_all_utf.rss",
    "categories": [
      "critical",
      "linux",
      "containers"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-61",
    "name": "SecurityLab",
    "homepage": "https://www.securitylab.ru/_services/export/rss/news/",
    "url": "https://www.securitylab.ru/_services/export/rss/news/",
    "categories": [
      "critical"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-62",
    "name": "Habr News",
    "homepage": "https://habr.com/ru/rss/news/?fl=ru",
    "url": "https://habr.com/ru/rss/news/?fl=ru",
    "categories": [
      "ai",
      "git",
      "containers",
      "cloud",
      "microsoft",
      "linux"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-63",
    "name": "3DNews",
    "homepage": "https://3dnews.ru/news/rss/",
    "url": "https://3dnews.ru/news/rss/",
    "categories": [
      "ai",
      "microsoft",
      "apple",
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-64",
    "name": "CNews",
    "homepage": "https://www.cnews.ru/inc/rss/news.xml",
    "url": "https://www.cnews.ru/inc/rss/news.xml",
    "categories": [
      "ai",
      "cloud",
      "microsoft"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-65",
    "name": "Comss",
    "homepage": "https://www.comss.ru/rss.php",
    "url": "https://www.comss.ru/rss.php",
    "categories": [
      "microsoft",
      "linux"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-66",
    "name": "AppleInsider.ru",
    "homepage": "https://appleinsider.ru/feed",
    "url": "https://appleinsider.ru/feed",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-67",
    "name": "iPhones.ru",
    "homepage": "https://www.iphones.ru/feed",
    "url": "https://www.iphones.ru/feed",
    "categories": [
      "apple"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-68",
    "name": "GoHa",
    "homepage": "https://www.goha.ru/rss/news",
    "url": "https://www.goha.ru/rss/news",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-69",
    "name": "StopGame",
    "homepage": "https://rss.stopgame.ru/rss_all.xml",
    "url": "https://rss.stopgame.ru/rss_all.xml",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-70",
    "name": "PlayGround",
    "homepage": "https://www.playground.ru/rss/news.xml",
    "url": "https://www.playground.ru/rss/news.xml",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-71",
    "name": "Igromania",
    "homepage": "https://www.igromania.ru/rss/news.xml",
    "url": "https://www.igromania.ru/rss/news.xml",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-72",
    "name": "VGTimes",
    "homepage": "https://vgtimes.ru/rss.xml",
    "url": "https://vgtimes.ru/rss.xml",
    "categories": [
      "games"
    ],
    "role": "editorial"
  },
  {
    "id": "catalog-73",
    "name": "iXBT.games",
    "homepage": "https://ixbt.games/export/news/rss.xml",
    "url": "https://ixbt.games/export/news/rss.xml",
    "categories": [
      "games"
    ],
    "role": "editorial"
  }
];
