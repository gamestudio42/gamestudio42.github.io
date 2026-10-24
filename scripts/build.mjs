/** Static, progressively enhanced studio site. No client framework or bundler. */
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectGames, githubClient, SITE } from "./catalog.mjs";
import { LOCALES } from "./content.mjs";
import { page, notFoundPage } from "./render.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const offline = process.argv.includes("--offline");
const curated = JSON.parse(readFileSync(join(ROOT, "data/games.json"), "utf8"));
const games = await collectGames({ curated, offline, request: offline ? null : githubClient() });
if (!games.length) throw new Error("No games to publish");
mkdirSync(DIST, { recursive: true });
for (const file of ["styles.css", "site.js", "favicon.svg", "favicon-32.png", "apple-touch-icon.png", "og-image.jpg", ".nojekyll"]) {
  copyFileSync(join(ROOT, file), join(DIST, file));
}
for (const directory of ["brand", "assets"]) cpSync(join(ROOT, directory), join(DIST, directory), { recursive: true });
for (const locale of LOCALES) {
  const directory = join(DIST, locale.path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "index.html"), page(locale, games));
}
writeFileSync(join(DIST, "404.html"), notFoundPage());
writeFileSync(join(DIST, "games.json"), JSON.stringify(games, null, 2) + "\n");
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.map((locale) => `<url><loc>${SITE}${locale.path}</loc></url>`).join("")}</urlset>\n`);
console.log(`Built ${games.length} catalog entries × ${LOCALES.length} locales${offline ? " (offline)" : ""} → ${DIST}`);
