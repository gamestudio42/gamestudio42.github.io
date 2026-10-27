import { execFileSync } from "node:child_process";

export const SITE = "https://gamestudio42.github.io";
export const ORG = "gamestudio42";

export function safeUrl(value, fallback = "") {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function githubClient() {
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token) {
    try {
      token = execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch { /* Public API and the bundled catalog work without authentication. */ }
  }
  return async (path, raw = false) => {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
        "User-Agent": "gs42-site",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    return response.json();
  };
}

function normalize(repo, manifest, saved) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new Error("invalid manifest");
  if (typeof manifest.title !== "string" || !manifest.title.trim()) throw new Error("missing title");
  const name = repo.name;
  const code = `https://github.com/${ORG}/${name}`;
  const branch = repo.default_branch || "main";
  const coverPath = typeof manifest.cover === "string" ? manifest.cover : "";
  const cover = /^https?:\/\//.test(coverPath)
    ? safeUrl(coverPath)
    : coverPath && !coverPath.includes("..") && !coverPath.startsWith("/")
      ? `https://raw.githubusercontent.com/${ORG}/${name}/${encodeURIComponent(branch)}/${coverPath.split("/").map(encodeURIComponent).join("/")}`
      : "";
  const tagline = Object.fromEntries(Object.entries(manifest.tagline || {}).filter(([key, value]) => ["en", "pt", "es", "fr", "de"].includes(key) && typeof value === "string"));
  return {
    ...saved,
    name,
    title: manifest.title,
    tagline: { ...saved?.tagline, ...tagline },
    // Studio art direction stays local; upstream favicons cannot replace screenshots.
    cover: saved?.cover || cover || "/og-image.jpg",
    ...(saved?.coverSmall ? { coverSmall: saved.coverSmall } : {}),
    genre: typeof manifest.genre === "string" ? manifest.genre : "",
    tech: Array.isArray(manifest.tech) ? manifest.tech.filter((item) => typeof item === "string") : [],
    order: saved?.order ?? (Number.isFinite(manifest.order) ? manifest.order : 99),
    play: safeUrl(repo.homepage, saved?.play || `${SITE}/${name}/`),
    code,
    fork: `${code}/fork`,
    discussions: `${code}/discussions`,
    commits: `${code}/commits`,
    atom: `${code}/releases.atom`,
    stars: repo.stargazers_count ?? null,
    forks: repo.forks_count ?? null,
    pushedAt: repo.pushed_at || null,
  };
}

export async function collectGames({ curated, request, offline = false, warn = console.warn }) {
  const games = new Map(curated.map((game) => [game.name, { ...game }]));
  if (!offline) {
    const repos = new Map(curated.map((game) => [game.name, { name: game.name, default_branch: game.default_branch }]));
    try {
      for (let page = 1; ; page++) {
        const result = await request(`/orgs/${ORG}/repos?type=public&per_page=100&sort=full_name&page=${page}`);
        if (!Array.isArray(result)) throw new Error("invalid repository list");
        for (const repo of result) {
          if (/^[a-zA-Z0-9_.-]+$/.test(repo.name) && (games.has(repo.name) || repo.topics?.includes("gs42-game"))) repos.set(repo.name, repo);
        }
        if (result.length < 100) break;
      }
    } catch (error) {
      warn(`Repository discovery unavailable (${error.message}); retaining the curated catalog.`);
    }
    await Promise.all([...repos.values()].map(async (repo) => {
      try {
        const manifest = await request(`/repos/${ORG}/${repo.name}/contents/gs42.json`, true);
        games.set(repo.name, normalize(repo, manifest, games.get(repo.name)));
      } catch (error) {
        warn(`${repo.name}: ${error.message}; ${games.has(repo.name) ? "using bundled metadata" : "not added"}.`);
      }
    }));
  }
  return [...games.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
