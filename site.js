(function () {
  const KEY = "gs42-lang";
  const PATHS = {
    en: "/",
    pt: "/pt/",
    es: "/es/",
    fr: "/fr/",
    de: "/de/",
  };

  function localeFromPath(pathname) {
    const match = pathname.match(/^\/(pt|es|fr|de)(?:\/|$)/);
    return match ? match[1] : "en";
  }

  function localeFromNavigator() {
    const lang = (navigator.language || "en").toLowerCase();
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("es")) return "es";
    if (lang.startsWith("fr")) return "fr";
    if (lang.startsWith("de")) return "de";
    return "en";
  }

  const here = localeFromPath(location.pathname);
  const stored = localStorage.getItem(KEY);

  if (stored && PATHS[stored] && stored !== here) {
    location.replace(PATHS[stored] + location.hash);
    return;
  }
  if (!stored) {
    const suggested = localeFromNavigator();
    if (suggested !== here) {
      location.replace(PATHS[suggested] + location.hash);
      return;
    }
  }

  document.querySelectorAll("[data-lang]").forEach((anchor) => {
    anchor.addEventListener("click", () => {
      localStorage.setItem(KEY, anchor.getAttribute("data-lang") || here);
    });
  });

  const dataNode = document.getElementById("games-data");
  const games = dataNode ? JSON.parse(dataNode.textContent) : [];

  document.querySelectorAll("[data-random]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      if (!games.length) return;
      const pick = games[Math.floor(Math.random() * games.length)];
      location.href = pick.play;
    });
  });

  const toast = document.getElementById("toast");
  let toastTimer = 0;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = "$ " + message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 1800);
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
        showToast(button.getAttribute("data-copied") || "copied");
      } catch {
        showToast("clipboard unavailable");
      }
    });
  });
})();
