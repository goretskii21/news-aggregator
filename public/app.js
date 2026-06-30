const grid = document.querySelector("#newsGrid");
const status = document.querySelector("#status");
const template = document.querySelector("#newsCardTemplate");
const refreshButton = document.querySelector("#refreshButton");
const pageTitle = document.querySelector("#pageTitle");
const categoryChips = [...document.querySelectorAll(".category-chip")];
const sourceChips = [...document.querySelectorAll(".source-chip")];
const sourceAllChip = sourceChips.find((chip) => chip.dataset.source === "all");

const categoryTitles = {
  all: "Новости",
  games: "Игровые новости",
  software: "Новости софта",
  hardware: "Новости железа",
  tech: "Новости технологий"
};

let items = [];
let activeCategory = "all";
let activeSources = new Set();

refreshButton.addEventListener("click", () => loadNews());

categoryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategory = chip.dataset.category;
    categoryChips.forEach((item) => item.classList.toggle("active", item === chip));
    render();
  });
});

sourceChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const source = chip.dataset.source;
    if (source === "all") {
      activeSources.clear();
    } else if (activeSources.has(source)) {
      activeSources.delete(source);
    } else {
      activeSources.add(source);
    }

    updateSourceChips();
    render();
  });
});

await loadNews();

async function loadNews(forceFresh = false) {
  refreshButton.disabled = true;
  status.textContent = items.length ? "Обновляю список..." : "Загружаю новости...";

  try {
    const response = await fetch(`/api/news${forceFresh ? "?fresh=1" : ""}`);
    if (response.status === 429) {
      const payload = await response.json();
      render();
      status.textContent = `Ручное обновление доступно через ${formatDuration(payload.retryAfter || 300)}.`;
      return;
    }

    if (!response.ok) throw new Error("Bad response");

    const payload = await response.json();
    items = Array.isArray(payload.items) ? payload.items : [];
    render(payload.updatedAt);
  } catch {
    items = [];
    render();
    status.textContent = "Не удалось загрузить новости. Проверьте подключение и попробуйте обновить.";
  } finally {
    refreshButton.disabled = false;
  }
}

function render(updatedAt) {
  pageTitle.textContent = categoryTitles[activeCategory] || categoryTitles.all;

  const filtered = items.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.categories?.includes(activeCategory);
    const matchesSource = !activeSources.size || activeSources.has(item.source);
    return matchesCategory && matchesSource;
  });

  grid.replaceChildren(...filtered.map(createCard));

  if (!items.length) {
    status.textContent = "Новостей пока нет: источники не ответили или изменили разметку.";
    return;
  }

  const updateText = updatedAt ? ` Обновлено ${formatDate(updatedAt)}.` : "";
  status.textContent = `${filtered.length} новостей из ${items.length}.${updateText}`;
}

function updateSourceChips() {
  const allSourcesSelected = activeSources.size === 0;
  sourceAllChip.classList.toggle("active", allSourcesSelected);
  sourceAllChip.setAttribute("aria-pressed", String(allSourcesSelected));

  sourceChips
    .filter((chip) => chip.dataset.source !== "all")
    .forEach((chip) => {
      const isActive = activeSources.has(chip.dataset.source);
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
}

function createCard(item) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector(".source").textContent = item.source;
  node.querySelector("time").textContent = formatDate(item.publishedAt);
  node.querySelector("h2").textContent = item.title;
  node.querySelector("p").textContent = item.excerpt;

  const link = node.querySelector(".more");
  link.href = item.url;
  link.setAttribute("aria-label", `Открыть первоисточник: ${item.title}`);

  return node;
}

function formatDate(value) {
  if (!value) return "без даты";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "без даты";

  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDuration(seconds) {
  const minutes = Math.ceil(Number(seconds) / 60);
  return `${minutes} ${pluralize(minutes, "минуту", "минуты", "минут")}`;
}

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
