/**
 * Build the Game Studio 42 catalog as static EN and PT pages.
 * Discovers public org repos tagged `gs42-game` and reads each gs42.json.
 */
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ORG = "gamestudio42";
const SITE = "https://gamestudio42.github.io";
const TOPIC = "gs42-game";

const FALLBACK = [
  {
    name: "urbe",
    default_branch: "main",
    html_url: "https://github.com/gamestudio42/urbe",
    homepage: "https://gamestudio42.github.io/urbe/",
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: new Date().toISOString(),
  },
  {
    name: "mineboss",
    default_branch: "master",
    html_url: "https://github.com/gamestudio42/mineboss",
    homepage: "https://gamestudio42.github.io/mineboss/",
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: new Date().toISOString(),
  },
];

const COPY = {
  en: {
    htmlLang: "en",
    title: "Game Studio 42 — open-source games in the browser",
    description: "Open-source games. Play in one click. Fork in two.",
    switchLabel: "PT",
    switchHref: "/pt/",
    switchLang: "pt",
    prompt: "gamestudio42@github:~$",
    name: "Game Studio 42",
    tagline: "Open-source games. Play in one click. Fork in two.",
    playRandom: "./play --random",
    seeGames: "ls games/",
    github: "git remote -v",
    gamesHeading: "ls games/",
    play: "./play",
    code: "git clone",
    fork: "fork",
    copy: "cp link",
    copied: "copied",
    stars: "stars",
    forks: "forks",
    updated: (label) => `updated ${label}`,
    today: "today",
    yesterday: "yesterday",
    daysAgo: (n) => `${n} days ago`,
    manifestoHeading: "cat MANIFESTO.md",
    manifesto: `# Game Studio 42

- Every game is free and runs in the browser.
- All the code is public under the MIT licence.
- Built in the open, commit by commit.
- Fork it, remix it, ship your own.
`,
    shipHeading: "How we ship",
    ship: [
      "Write the game in a public GitHub repo.",
      "A GitHub Action builds it.",
      "GitHub Pages hosts it. Playable in minutes.",
    ],
    remixHeading: "git clone",
    remixIntro: "Clone a game, change the rules, publish your fork on your own Pages.",
    remixCode: `git clone https://github.com/gamestudio42/urbe.git
cd urbe
pnpm install
pnpm dev`,
    help: "Help build it",
    issues: "good first issues",
    discussions: "Discussions",
    followHeading: "tail -f devlog",
    follow: "Star a repo to follow the next commit. RSS lives on GitHub Releases.",
    commits: "commits",
    feed: "releases.atom",
    footer: "MIT licence · built in the open ·",
    share: (title, play) => `Play ${title} in the browser — open source, no install. ${play}`,
  },
  pt: {
    htmlLang: "pt-BR",
    title: "Game Studio 42 — jogos open source no navegador",
    description: "Jogos open source. Um clique para jogar, dois para forkar.",
    switchLabel: "EN",
    switchHref: "/",
    switchLang: "en",
    prompt: "gamestudio42@github:~$",
    name: "Game Studio 42",
    tagline: "Jogos open source. Um clique para jogar, dois para forkar.",
    playRandom: "./play --aleatorio",
    seeGames: "ls games/",
    github: "git remote -v",
    gamesHeading: "ls games/",
    play: "./play",
    code: "git clone",
    fork: "fork",
    copy: "cp link",
    copied: "copiado",
    stars: "estrelas",
    forks: "forks",
    updated: (label) => `atualizado ${label}`,
    today: "hoje",
    yesterday: "ontem",
    daysAgo: (n) => `há ${n} dias`,
    manifestoHeading: "cat MANIFESTO.md",
    manifesto: `# Game Studio 42

- Todo jogo é grátis e roda no navegador.
- O código é público, licença MIT.
- Construído à vista, commit por commit.
- Forka, remixa, publica o teu.
`,
    shipHeading: "Como a gente publica",
    ship: [
      "O jogo mora num repositório público no GitHub.",
      "Uma GitHub Action gera o build.",
      "O GitHub Pages hospeda. Dá para jogar em minutos.",
    ],
    remixHeading: "git clone",
    remixIntro: "Clone um jogo, mude as regras, publique o fork no seu Pages.",
    remixCode: `git clone https://github.com/gamestudio42/urbe.git
cd urbe
pnpm install
pnpm dev`,
    help: "Ajude a construir",
    issues: "good first issues",
    discussions: "Discussions",
    followHeading: "tail -f devlog",
    follow: "Dê uma estrela para acompanhar o próximo commit. O RSS está em GitHub Releases.",
    commits: "commits",
    feed: "releases.atom",
    footer: "Licença MIT · construído à vista ·",
    share: (title, play) => `Jogue ${title} no navegador — open source, sem instalar. ${play}`,
  },
};

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execSync("gh auth token", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function gh(path, accept = "application/vnd.github+json") {
  const headers = {
    Accept: accept,
    "User-Agent": "gs42-site",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const auth = token();
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${path} ${res.status} ${body.slice(0, 200)}`);
  }
  return res;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function relativeDay(iso, t) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (days === 0) return t.today;
  if (days === 1) return t.yesterday;
  return t.daysAgo(days);
}

async function listGameRepos() {
  try {
    const res = await gh(`/orgs/${ORG}/repos?type=public&per_page=100&sort=full_name`);
    const repos = await res.json();
    const tagged = repos.filter((repo) => (repo.topics || []).includes(TOPIC));
    if (tagged.length) return tagged;
    console.warn("no repos with topic", TOPIC, "— using fallback");
    return FALLBACK;
  } catch (error) {
    console.warn("repo list failed, using fallback:", error.message);
    return FALLBACK;
  }
}

async function readManifest(repo) {
  const res = await gh(
    `/repos/${ORG}/${repo.name}/contents/gs42.json`,
    "application/vnd.github.raw",
  );
  return res.json();
}

async function collectGames() {
  const repos = await listGameRepos();
  const games = [];
  for (const repo of repos) {
    let manifest;
    try {
      manifest = await readManifest(repo);
    } catch (error) {
      console.warn(`skip ${repo.name}:`, error.message);
      continue;
    }
    const play = repo.homepage || `${SITE}/${repo.name}/`;
    const branch = repo.default_branch || "main";
    games.push({
      name: repo.name,
      title: manifest.title || repo.name,
      tagline: manifest.tagline || { en: "", pt: "" },
      cover: `https://raw.githubusercontent.com/${ORG}/${repo.name}/${branch}/${manifest.cover}`,
      genre: manifest.genre || "",
      tech: manifest.tech || [],
      order: manifest.order ?? 99,
      play,
      code: repo.html_url,
      fork: `${repo.html_url}/fork`,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      pushedAt: repo.pushed_at,
      discussions: `${repo.html_url}/discussions`,
      commits: `${repo.html_url}/commits`,
      atom: `${repo.html_url}/releases.atom`,
    });
  }
  games.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return games;
}

function card(game, lang, t) {
  const tagline = game.tagline[lang] || game.tagline.en || "";
  const chips = [game.genre, ...game.tech]
    .filter(Boolean)
    .map((item) => `<span class="chip">${esc(item)}</span>`)
    .join("");
  const share = t.share(game.title, game.play);
  return `<article class="term">
        <div class="titlebar">
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="path">~/games/${esc(game.name)}</span>
        </div>
        <a href="${esc(game.play)}"><img src="${esc(game.cover)}" alt="${esc(game.title)}" /></a>
        <div class="term-body">
          <h3>${esc(game.title)}</h3>
          <p>${esc(tagline)}</p>
          <div class="chips">${chips}</div>
          <p class="meta">★ ${game.stars} ${t.stars} · ${game.forks} ${t.forks} · ${t.updated(relativeDay(game.pushedAt, t))}</p>
          <div class="actions">
            <a class="btn" href="${esc(game.play)}">${esc(t.play)}</a>
            <a class="btn ghost" href="${esc(game.code)}">${esc(t.code)}</a>
            <a class="btn ghost" href="${esc(game.fork)}">${esc(t.fork)}</a>
            <button type="button" class="btn ghost" data-copy="${esc(share)}" data-copied="${esc(t.copied)}">${esc(t.copy)}</button>
          </div>
        </div>
      </article>`;
}

function page(lang, games) {
  const t = COPY[lang];
  const selfUrl = lang === "en" ? `${SITE}/` : `${SITE}/pt/`;
  const cards = games.map((game) => card(game, lang, t)).join("\n      ");
  const follow = games
    .map(
      (game) =>
        `<a href="${esc(game.commits)}">${esc(game.title)} ${t.commits}</a> · <a href="${esc(game.atom)}">${esc(t.feed)}</a>`,
    )
    .join("<br />\n          ");
  const talks = games
    .map((game) => `<a href="${esc(game.discussions)}">${esc(game.title)}</a>`)
    .join(" · ");
  const payload = games.map((game) => ({ name: game.name, play: game.play, title: game.title }));

  return `<!doctype html>
<html lang="${t.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(t.title)}</title>
    <meta name="description" content="${esc(t.description)}" />
    <meta name="theme-color" content="#0a0f0a" />
    <meta property="og:title" content="${esc(t.name)}" />
    <meta property="og:description" content="${esc(t.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${selfUrl}" />
    <meta property="og:image" content="${SITE}/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(t.name)}" />
    <meta name="twitter:description" content="${esc(t.description)}" />
    <meta name="twitter:image" content="${SITE}/og-image.jpg" />
    <link rel="canonical" href="${selfUrl}" />
    <link rel="alternate" hreflang="en" href="${SITE}/" />
    <link rel="alternate" hreflang="pt" href="${SITE}/pt/" />
    <link rel="alternate" hreflang="x-default" href="${SITE}/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="crt" aria-hidden="true"></div>
    <div class="wrap">
      <header class="hero">
        <nav class="lang" aria-label="Language">
          <a href="/" data-lang="en"${lang === "en" ? ' aria-current="page"' : ""}>EN</a>
          <a href="/pt/" data-lang="pt"${lang === "pt" ? ' aria-current="page"' : ""}>PT</a>
        </nav>
        <img class="mark" src="/brand/logo-badge.svg" width="96" height="96" alt="${esc(t.name)}" />
        <p class="prompt"><span class="host">${esc(t.prompt)}</span> <span class="cursor" aria-hidden="true"></span></p>
        <h1>${esc(t.name)}</h1>
        <p class="tag">${esc(t.tagline)}</p>
        <div class="actions">
          <a class="btn" href="${esc(games[0] ? games[0].play : "https://github.com/gamestudio42")}" data-random>${esc(t.playRandom)}</a>
          <a class="btn ghost" href="#games">${esc(t.seeGames)}</a>
          <a class="btn ghost" href="https://github.com/gamestudio42">${esc(t.github)}</a>
        </div>
      </header>

      <section id="games">
        <h2><span class="dollar">$</span>${esc(t.gamesHeading)}</h2>
        <div class="games">
      ${cards}
        </div>
      </section>

      <section id="manifesto">
        <h2><span class="dollar">$</span>${esc(t.manifestoHeading)}</h2>
        <div class="manifesto">
          <pre>${esc(t.manifesto)}</pre>
          <p class="meta">${esc(t.shipHeading)}</p>
          <ol class="ship">${t.ship.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
        </div>
      </section>

      <section id="remix">
        <h2><span class="dollar">$</span>${esc(t.remixHeading)}</h2>
        <div class="guide">
          <p>${esc(t.remixIntro)}</p>
          <pre>${esc(t.remixCode)}</pre>
          <p>${esc(t.help)}</p>
          <p class="links">
            <a href="https://github.com/search?q=org%3Agamestudio42+is%3Aopen+label%3A%22good+first+issue%22&amp;type=issues">${esc(t.issues)}</a>
            · ${talks}
          </p>
        </div>
      </section>

      <section id="devlog">
        <h2><span class="dollar">$</span>${esc(t.followHeading)}</h2>
        <p>${esc(t.follow)}</p>
        <p class="links">
          ${follow}
        </p>
      </section>

      <footer>
        ${esc(t.footer)}
        <a href="https://github.com/gamestudio42">github.com/gamestudio42</a>
      </footer>
    </div>
    <div id="toast" hidden></div>
    <script id="games-data" type="application/json">${JSON.stringify(payload)}</script>
    <script src="/site.js"></script>
  </body>
</html>
`;
}

function copyStatic() {
  const files = [
    "styles.css",
    "site.js",
    "404.html",
    "favicon.svg",
    "favicon-32.png",
    "apple-touch-icon.png",
    "og-image.jpg",
    ".nojekyll",
    "brand/logo-mark.svg",
    "brand/logo-badge.svg",
    "brand/logo-full.svg",
    "brand/avatar-512.png",
  ];
  for (const file of files) {
    const dest = join(DIST, file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(ROOT, file), dest);
  }
}

const games = await collectGames();
if (!games.length) throw new Error("no games to publish");
mkdirSync(join(DIST, "pt"), { recursive: true });
copyStatic();
writeFileSync(join(DIST, "index.html"), page("en", games));
writeFileSync(join(DIST, "pt/index.html"), page("pt", games));
writeFileSync(join(DIST, "games.json"), JSON.stringify(games, null, 2));
console.log(`built ${games.length} games → ${DIST}`);
