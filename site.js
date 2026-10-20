(function () {
  const KEY = "gs42-lang";
  const here = location.pathname.startsWith("/pt") ? "pt" : "en";
  const stored = localStorage.getItem(KEY);

  if (stored && stored !== here) {
    location.replace((stored === "pt" ? "/pt/" : "/") + location.hash);
    return;
  }
  if (!stored && navigator.language.toLowerCase().startsWith("pt") && here !== "pt") {
    location.replace("/pt/" + location.hash);
    return;
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
