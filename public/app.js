const grid = document.querySelector("#newsGrid");
const status = document.querySelector("#status");
const template = document.querySelector("#newsCardTemplate");
const refreshButton = document.querySelector("#refreshButton");
const categoryChips = [...document.querySelectorAll(".category-chip")];
const sourceChips = [...document.querySelectorAll(".source-chip")];

let items = [];
let activeCategory = "all";
let activeSource = "all";

refreshButton.addEventListener("click", () => loadNews(true));

categoryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategory = chip.dataset.category;
    categoryChips.forEach((item) => item.classList.toggle("active", item === chip));
    render();
  });
});

sourceChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeSource = chip.dataset.source;
    sourceChips.forEach((item) => item.classList.toggle("active", item === chip));
    render();
  });
});

await loadNews();

async function loadNews(forceFresh = false) {
  refreshButton.disabled = true;
  status.textContent = forceFresh ? "Обновляю новости..." : "Загружаю новости...";

  try {
    const response = await fetch(`/api/news${forceFresh ? "?fresh=1" : ""}`);
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
  const filtered = items.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.categories?.includes(activeCategory);
    const matchesSource = activeSource === "all" || item.source === activeSource;
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
