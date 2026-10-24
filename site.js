(function () {
  "use strict";
  const PATHS = { en: "/", pt: "/pt/", es: "/es/", fr: "/fr/", de: "/de/" };
  const KEY = "gs42-lang";
  const here = document.documentElement.lang.split("-")[0];
  let stored;
  try { stored = localStorage.getItem(KEY); } catch { /* Storage can be disabled. */ }

  // Explicit locale URLs always win. Only the root negotiates the initial language.
  if (location.pathname === "/" || location.pathname === "/index.html") {
    const browserLocale = (navigator.language || "en").toLowerCase().split("-")[0];
    const preferred = PATHS[stored] ? stored : PATHS[browserLocale] ? browserLocale : "en";
    if (preferred !== "en") {
      location.replace(PATHS[preferred] + location.search + location.hash);
      return;
    }
  }
  document.body.classList.add("js");
  document.querySelectorAll("[data-lang]").forEach((anchor) => {
    anchor.href = PATHS[anchor.dataset.lang] + location.search + location.hash;
    anchor.addEventListener("click", () => {
      anchor.href = PATHS[anchor.dataset.lang] + location.search + location.hash;
      try { localStorage.setItem(KEY, anchor.dataset.lang || here); } catch { /* Navigation still works. */ }
    });
  });

  const menu = document.querySelector(".menu-toggle");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    menu?.setAttribute("aria-expanded", "false");
  }
  if (menu) {
    menu.hidden = false;
    menu.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      menu.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav-links a").forEach((anchor) => anchor.addEventListener("click", closeMenu));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = document.body.classList.contains("menu-open");
    closeMenu();
    if (open) menu?.focus();
    document.querySelectorAll(".language-picker[open]").forEach((picker) => {
      picker.open = false;
      picker.querySelector("summary").focus();
    });
  });
  document.addEventListener("click", (event) => {
    document.querySelectorAll(".language-picker[open]").forEach((picker) => {
      if (!picker.contains(event.target)) picker.open = false;
    });
  });

  let games = [];
  try { games = JSON.parse(document.getElementById("games-data")?.textContent || "[]"); } catch { /* Static links remain available. */ }
  const playable = games.filter((game) => game.genre !== "collection");
  document.querySelectorAll("[data-random]").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      if (!playable.length || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      location.href = playable[Math.floor(Math.random() * playable.length)].play;
    });
  });

  const toast = document.getElementById("toast");
  let toastTimer;
  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3500);
  }
  async function copy(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      notify(button.dataset.copied);
    } catch {
      notify(button.dataset.copyFailed);
    }
  }
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => copy(button.dataset.copy, button));
  });

  const select = document.getElementById("repo-select");
  const commands = document.querySelector("#clone-commands code");
  if (select && commands) {
    select.closest("label").hidden = false;
    document.querySelector(".terminal-repo-name").hidden = true;
    select.addEventListener("change", () => {
      const game = games.find((game) => game.name === select.value);
      if (!game) return;
      commands.textContent = `git clone ${game.code}.git\ncd ${game.name}\npnpm install\npnpm dev`;
      document.querySelector(".source-repo").href = game.code;
      document.querySelector(".source-issues").href = `${game.code}/issues`;
    });
    const button = document.querySelector("[data-copy-commands]");
    button.hidden = false;
    button.addEventListener("click", () => copy(commands.textContent, button));
  }
})();
