(function () {
  "use strict";
  const base = document.querySelector('meta[name="site-base"]')?.content || "/";
  const PATHS = { en: "/", pt: "/pt/", es: "/es/", fr: "/fr/", de: "/de/" };
  for (const lang of Object.keys(PATHS)) PATHS[lang] = base + PATHS[lang].slice(1);
  const KEY = base === "/" ? "gs42-lang" : `gs42-lang:${base}`;
  const here = document.documentElement.lang.split("-")[0];
  let stored;
  try { stored = localStorage.getItem(KEY); } catch { /* Storage can be disabled. */ }

  // Explicit locale URLs always win. Only the root negotiates the initial language.
  if (location.pathname === base || location.pathname === `${base}index.html`) {
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
    document.querySelectorAll(".nav-links a").forEach((anchor) => anchor.addEventListener("click", () => {
      closeMenu();
      const target = document.getElementById(anchor.dataset.section);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }));
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

  // Map the game showcase and code section to their parent navigation topics.
  const navLinks = [...document.querySelectorAll(".nav-links [data-section]")];
  const sectionTopics = { games: "games", oasis: "games", studio: "studio", community: "community", support: "support", "open-source": "community" };
  const sections = [...document.querySelectorAll("main > section")];
  const header = document.querySelector(".site-header");
  let navFrame = 0;
  function updateNavigation() {
    navFrame = 0;
    const edge = (header?.getBoundingClientRect().bottom || 0) + 24;
    const section = sections.find((item) => {
      const bounds = item.getBoundingClientRect();
      return bounds.top <= edge && bounds.bottom > edge;
    });
    const active = sectionTopics[section?.id];
    navLinks.forEach((anchor) => {
      if (anchor.dataset.section === active) anchor.setAttribute("aria-current", "location");
      else anchor.removeAttribute("aria-current");
    });
  }
  function scheduleNavigation() {
    if (!navFrame) navFrame = requestAnimationFrame(updateNavigation);
  }
  window.addEventListener("scroll", scheduleNavigation, { passive: true });
  window.addEventListener("resize", scheduleNavigation);
  window.addEventListener("hashchange", scheduleNavigation);
  window.addEventListener("load", scheduleNavigation);
  if (header && typeof ResizeObserver !== "undefined") new ResizeObserver(scheduleNavigation).observe(header);
  updateNavigation();

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
  function copyFeedback(button, message) {
    const status = button.closest("dialog")?.querySelector(".share-status");
    if (status) status.textContent = message;
    else notify(message);
  }
  async function copy(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback(button, button.dataset.copied);
    } catch {
      copyFeedback(button, button.dataset.copyFailed);
    }
  }
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => copy(button.dataset.copy, button));
  });

  const shareDialog = document.getElementById("share-dialog");
  if (shareDialog && typeof shareDialog.showModal === "function") {
    const urlInput = shareDialog.querySelector(".share-url");
    const copyButton = shareDialog.querySelector(".share-copy");
    const nativeButton = shareDialog.querySelector(".share-native");
    const status = shareDialog.querySelector(".share-status");
    let opener;
    let shareData;
    document.querySelectorAll("[data-share]").forEach((button) => {
      button.hidden = false;
      button.addEventListener("click", () => {
        const game = playable.find((item) => item.name === button.dataset.share);
        if (!game) return;
        opener = button;
        shareData = { title: game.title, text: shareDialog.dataset.text.replace("{title}", () => game.title), url: game.play };
        shareDialog.querySelector("#share-title").textContent = shareDialog.dataset.title.replace("{title}", () => game.title);
        urlInput.value = game.play;
        copyButton.dataset.copy = game.play;
        status.textContent = "";
        const message = `${shareData.text} ${shareData.url}`;
        const intents = {
          WhatsApp: ["https://wa.me/", { text: message }],
          X: ["https://x.com/intent/tweet", { text: shareData.text, url: shareData.url }],
          Threads: ["https://www.threads.com/intent/post", { text: message }],
          Bluesky: ["https://bsky.app/intent/compose", { text: message }],
        };
        shareDialog.querySelectorAll("[data-network]").forEach((anchor) => {
          const [base, params] = intents[anchor.dataset.network];
          anchor.href = `${base}?${new URLSearchParams(params)}`;
        });
        nativeButton.hidden = typeof navigator.share !== "function";
        shareDialog.showModal();
      });
    });
    shareDialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [...shareDialog.querySelectorAll("button, a[href], input")].filter(el => !el.hidden && !el.disabled);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    shareDialog.querySelector(".share-close").addEventListener("click", () => shareDialog.close());
    shareDialog.addEventListener("click", (event) => {
      const bounds = shareDialog.getBoundingClientRect();
      if (event.target === shareDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) shareDialog.close();
    });
    shareDialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
    nativeButton.addEventListener("click", async () => {
      nativeButton.disabled = true;
      status.textContent = "";
      try { await navigator.share(shareData); }
      catch (error) { if (error.name !== "AbortError") status.textContent = shareDialog.dataset.failed; }
      finally { nativeButton.disabled = false; }
    });
  }

  const select = document.getElementById("repo-select");
  const commands = document.querySelector("#clone-commands code");
  if (select && commands) {
    select.closest("label").hidden = false;
    document.querySelector(".terminal-repo-name").hidden = true;
    select.addEventListener("change", () => {
      const game = games.find((game) => game.name === select.value);
      if (!game) return;
      commands.textContent = `git clone ${game.code}.git\ncd ${game.name}`;
      document.querySelector(".project-guide").href = `${game.code}#readme`;
      document.querySelector(".project-license").href = `${game.code}/blob/${encodeURIComponent(game.default_branch || "main")}/LICENSE`;
      document.querySelector(".source-repo").href = game.code;
      document.querySelector(".source-issues").href = `${game.code}/issues`;
    });
    const button = document.querySelector("[data-copy-commands]");
    button.hidden = false;
    button.addEventListener("click", () => copy(commands.textContent, button));
  }
})();
