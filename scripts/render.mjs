import { COPY, LOCALES } from "./content.mjs";
import { SITE } from "./catalog.mjs";

export const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const lines = (value) => value.split("\n").map(esc).join("<br>");
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const diagonal = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const codeIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/></svg>';
const copyIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V4H4v11h4"/></svg>';
const githubIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path stroke="none" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.06c-3.09.67-3.74-1.31-3.74-1.31-.51-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.14 1.7 1.14.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.47-.28-5.06-1.23-5.06-5.49 0-1.21.43-2.2 1.14-2.97-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.14a10.6 10.6 0 0 1 5.56 0c2.12-1.44 3.04-1.14 3.04-1.14.61 1.53.23 2.66.12 2.94.71.77 1.14 1.76 1.14 2.97 0 4.27-2.6 5.2-5.08 5.48.4.35.75 1.02.75 2.06V22c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z"/></svg>';

function photo(game, t, { hero = false, sizes = "(max-width: 700px) 100vw, 50vw" } = {}) {
  const source = game.coverSmall ? ` srcset="${esc(game.coverSmall)} 800w, ${esc(game.cover)} ${game.coverWidth}w" sizes="${sizes}"` : "";
  return `<img src="${esc(game.cover)}"${source} width="${game.coverWidth || 1200}" height="${game.coverHeight || 750}" alt="${esc(t.screenshot)} — ${esc(game.title)}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function head(locale, title, description, { noindex = false } = {}) {
  const url = SITE + locale.path;
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#101310">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">
  ${LOCALES.map((item) => `<link rel="alternate" hreflang="${item.id}" href="${SITE}${item.path}">`).join("\n  ")}
  <link rel="alternate" hreflang="x-default" href="${SITE}/">`}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/og-image.jpg?v=2">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/og-image.jpg?v=2">
  <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png?v=2" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
  <link rel="preload" href="/assets/fonts/space-grotesk.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/styles.css">`;
}

function languageNav(locale, t) {
  return `<details class="language-picker"><summary aria-label="${esc(t.languages)}">${locale.id.toUpperCase()} <span aria-hidden="true">⌄</span></summary>
    <nav aria-label="${esc(t.languages)}">${LOCALES.map((item) => `<a href="${item.path}" data-lang="${item.id}" lang="${item.htmlLang}" hreflang="${item.id}"${locale.id === item.id ? ' aria-current="page"' : ""}>${item.name}<span>${item.id.toUpperCase()}</span></a>`).join("")}</nav>
  </details>`;
}

function logo(home) {
  return `<a class="brand" href="${home}" aria-label="Game Studio 42"><span class="brand-mark" aria-hidden="true"></span><span>GAME STUDIO <b>42</b><small>INDEPENDENT & OPEN SOURCE</small></span></a>`;
}

function card(game, lang, t, index, count) {
  return `<article class="game-card game-${esc(game.name)}" id="game-${esc(game.name)}">
    <a class="game-image" href="${esc(game.play)}" aria-label="${esc(t.play)} — ${esc(game.title)}">
      ${photo(game, t, { sizes: "(max-width: 700px) 100vw, 50vw" })}<span class="game-number">${String(index + 1).padStart(2, "0")}</span><span class="image-arrow">${diagonal}</span>
    </a>
    <div class="game-info"><div class="game-meta"><span>${esc(t.genres[game.genre] || game.genre)}</span><span class="platform"><i></i>${t.browser}</span></div>
    <div class="game-title"><h3><a href="${esc(game.play)}">${esc(game.title)}</a></h3><span aria-hidden="true">↗</span></div>
    <p>${esc(game.description?.[lang] || game.tagline[lang] || game.tagline.en || "")}</p>
    <div class="card-actions"><a class="text-link play-link" href="${esc(game.play)}" aria-label="${esc(t.play)} — ${esc(game.title)}">${esc(t.play)} ${arrow}</a>
      <a class="code-link" href="${esc(game.code)}" aria-label="${esc(t.code)} — ${esc(game.title)}">${codeIcon}${esc(t.code)}</a>
      <button hidden class="icon-button share-button" type="button" data-copy="${esc(game.play)}" data-copied="${esc(t.copied)}" data-copy-failed="${esc(t.copyFailed)}" aria-label="${esc(t.share)} — ${esc(game.title)}">${copyIcon}</button>
    </div></div>
  </article>`;
}

export function page(locale, games) {
  const lang = locale.id;
  const t = COPY[lang];
  const find = (name) => games.find((game) => game.name === name);
  const oasis = find("urbe-oasis");
  const plot = find("plot42");
  const playable = games.filter((game) => game.name !== "plot42");
  const worlds = [oasis, find("neo-urbe"), find("urbe")].filter(Boolean);
  const heroWorlds = [oasis, find("neo-urbe"), find("vazante")].filter(Boolean);
  const first = worlds[0] || playable[0];
  const payload = games.map(({ name, title, play, code, genre }) => ({ name, title, play, code, genre }));
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="${locale.htmlLang}">
<head>${head(locale, t.title, t.description)}</head>
<body id="top">
  <a class="skip-link" href="#main">${t.skip}</a>
  <header class="site-header">
    <div class="header-inner">${logo(locale.path)}
      <nav class="nav-links" id="main-nav" aria-label="${t.navigation}"><a href="#games">${t.games}</a><a href="#studio">${t.studio}</a><a href="#open-source">${t.source} ${diagonal}</a></nav>
      <div class="header-tools">${languageNav(locale, t)}<a class="header-github icon-button" href="https://github.com/gamestudio42" aria-label="${t.github}">${githubIcon}</a><button class="menu-toggle" hidden type="button" aria-expanded="false" aria-controls="main-nav">${t.menu}<span aria-hidden="true">☰</span></button></div>
    </div>
  </header>
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-worlds">${heroWorlds.map((game, index) => `<a class="world world-${index} world-${esc(game.name)}" href="${esc(game.play)}" aria-label="${t.play} — ${esc(game.title)}">${photo(game, t, { hero: true, sizes: index === 0 ? "(max-width: 800px) 90vw, 35vw" : "25vw" })}<span class="world-label"><small>0${index + 1}</small>${esc(game.title)}<span class="world-play">${esc(t.play)}</span> ${diagonal}</span></a>`).join("")}</div>
      <div class="container hero-content">
        <p class="eyebrow"><span class="status-dot"></span>${t.eyebrow}</p>
        <h1 id="hero-title">${t.heroLine1}<br><span>${t.heroLine2}<br>${t.heroLine3}</span></h1>
        <p class="hero-intro">${t.intro}</p>
        <div class="hero-actions"><a class="button button-primary" href="#games">${t.explore}${arrow}</a><a class="text-link" href="#open-source">${t.buildWithUs}${diagonal}</a></div>
      </div>
      <div class="container hero-bottom"><a href="#games">↓<span>${t.scroll}</span></a><span class="capture-label"><i></i>${t.screenshot}</span></div>
    </section>
    <div class="principles"><div class="container">${t.pillars.map((item, i) => `<span><b aria-hidden="true">${["↗", "∞", "&lt;/&gt;"][i]}</b>${item}</span>`).join("")}<span class="principles-signature" aria-hidden="true">GS42</span></div></div>
    <section class="collection section container" id="games" aria-labelledby="collection-title">
      <div class="section-top"><p class="eyebrow">${t.collectionLabel}</p><span class="section-counter">[ ${String(playable.length).padStart(2, "0")} ]</span></div>
      <div class="section-heading"><h2 id="collection-title">${lines(t.collectionTitle)}</h2><div><p>${t.collectionIntro}</p><a class="text-link random-link" data-random href="${esc(first.play)}"><span aria-hidden="true">⤨</span>${t.surprise}${arrow}</a></div></div>
      <div class="games-grid">${playable.map((game, index) => card(game, lang, t, index, playable.length)).join("\n")}</div>
      ${plot ? `<a class="collection-banner" href="${esc(plot.play)}"><span class="plot-symbol" aria-hidden="true">42<span>LAB</span></span><div><span class="eyebrow">PLOT 42 / ${esc(t.genres.collection)}</span><h3>${t.collectionMore}</h3><p>${t.plotIntro}</p></div><span class="text-link">${t.plotAction}${diagonal}</span></a>` : ""}
    </section>
    ${oasis ? `<section class="oasis-feature" id="oasis" aria-labelledby="oasis-title">
      <div class="oasis-image">${photo(oasis, t, { sizes: "(max-width: 900px) 100vw, 55vw" })}<span class="oasis-image-label">${t.screenshot} / URBE OASIS</span></div>
      <div class="container oasis-content"><p class="eyebrow">${t.oasisLabel}</p><span class="oasis-wordmark">URBE <b>OASIS</b></span><h2 id="oasis-title">${t.oasisLine1}<br><em>${t.oasisLine2}</em></h2><p>${t.oasisIntro}</p><ul>${t.oasisFeatures.map((feature) => `<li>${feature}</li>`).join("")}</ul><a class="button button-sand" href="${esc(oasis.play)}">${t.oasisPlay}${arrow}</a><a class="text-link oasis-code" href="${esc(oasis.code)}">${t.code}${codeIcon}</a></div>
      <div class="container oasis-caption"><span>${t.oasisCaption}</span><span>03 / GS42</span></div>
    </section>` : ""}
    <section class="studio section container" id="studio" aria-labelledby="studio-title"><p class="eyebrow">${t.studioLabel}</p><div class="studio-layout"><div class="studio-intro"><h2 id="studio-title">${lines(t.studioTitle)}</h2><p>${t.studioIntro}</p><a class="text-link" href="https://github.com/gamestudio42">${t.github}${diagonal}</a><div class="studio-monogram" aria-hidden="true">42<span>ALWAYS<br>EXPLORING.</span></div></div><ol class="studio-values">${t.values.map(([title, body], i) => `<li><span class="value-number">0${i + 1}</span><div><h3>${title}</h3><p>${body}</p></div></li>`).join("")}</ol></div></section>
    <section class="community-section section" id="community" aria-labelledby="community-title"><div class="container">
      <p class="eyebrow">${t.communityLabel}</p>
      <div class="community-heading"><h2 id="community-title">${esc(t.communityTitle.replace(/\n/g, " "))}</h2><p>${t.communityIntro}</p></div>
      <div class="community-modes"><article><span class="value-number" aria-hidden="true">01 /</span><h3>${t.sharedTitle}</h3><p>${t.sharedBody}</p></article><article><span class="value-number" aria-hidden="true">02 /</span><h3>${t.adoptionTitle}</h3><p>${t.adoptionBody}</p></article></div>
      <p class="community-benefit">${t.communityBenefit}</p>
      <div class="community-actions"><a class="button button-primary" href="https://github.com/gamestudio42/.github/issues/new?template=project-submission.yml">${t.proposeProject}${arrow}</a><a class="text-link" href="https://github.com/gamestudio42/.github/blob/main/docs/PROJECT_SUBMISSIONS.md#${lang === "pt" ? "português" : "english"}">${t.submissionGuide}${diagonal}</a></div>
      <p class="community-languages">${t.submissionLanguages}</p><p class="community-note">${t.communityNote}</p>
    </div></section>
    <section class="source-section" id="open-source" aria-labelledby="source-title"><div class="container source-layout"><div><p class="eyebrow">${t.sourceLabel}</p><h2 id="source-title">${lines(t.sourceTitle)}</h2><p class="source-intro">${t.sourceIntro}</p><a class="text-link source-repo" href="${esc(first.code)}">${githubIcon}${t.repo}${diagonal}</a><a class="text-link source-issues" href="${esc(first.code)}/issues">${t.contribute}${arrow}</a></div>
      <div class="terminal"><div class="terminal-bar"><span class="terminal-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>~/gamestudio42</span><span class="terminal-shell">bash</span></div>
        <div class="terminal-project"><span class="terminal-repo-name">${esc(first.title)}</span><label class="repo-picker" hidden>${t.chooseRepo}<select id="repo-select">${worlds.map((game) => `<option value="${esc(game.name)}">${esc(game.title)}</option>`).join("")}</select></label><button hidden class="icon-button command-copy" type="button" data-copy-commands data-copied="${t.commandsCopied}" data-copy-failed="${t.commandsFailed}" aria-label="${t.copyCommands}">${copyIcon}</button></div>
        <pre id="clone-commands"><code>git clone ${esc(first.code)}.git
cd ${esc(first.name)}
pnpm install
pnpm dev</code></pre><div class="terminal-footer"><span class="status-dot"></span>MIT LICENSE <span>↗ OPEN SOURCE</span></div><p class="dev-note">${t.devNote}</p></div>
    </div></section>
    <section class="closing container"><p>${t.outro}</p><a href="#games" class="circle-link" aria-label="${t.explore}">${arrow}</a></section>
  </main>
  <footer class="site-footer container"><div class="footer-top">${logo(locale.path)}<p>${t.footerNote}</p><a class="text-link" href="#top">${t.backTop}<span aria-hidden="true">↑</span></a></div><div class="footer-bottom"><span>© ${new Date().getUTCFullYear()} GAME STUDIO 42</span><a href="https://github.com/gamestudio42/gamestudio42.github.io/blob/main/LICENSE">MIT LICENSE</a><a href="https://github.com/gamestudio42">GITHUB ${diagonal}</a>${languageNav(locale, t)}</div></footer>
  <div id="toast" class="toast" role="status" aria-live="polite" aria-atomic="true"></div>
  <script id="games-data" type="application/json">${json}</script>
  <script src="/site.js" defer></script>
  <script data-goatcounter="https://gamestudio42.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body></html>`;
}

export function notFoundPage() {
  const locale = LOCALES[0];
  const t = COPY.en;
  return `<!doctype html><html lang="en"><head>${head(locale, "404 — Game Studio 42", t.notFoundText, { noindex: true })}</head><body><main class="not-found container">${logo("/")}<p class="eyebrow">404 / WORLD NOT FOUND</p><h1>${t.notFound}</h1><p>${t.notFoundText}</p><a class="button button-primary" href="/">${t.returnHome}${arrow}</a><nav aria-label="Language">${LOCALES.map((item) => `<a href="${item.path}">${item.name}</a>`).join("")}</nav></main></body></html>`;
}
