/** Static, progressively enhanced studio site. No client framework or bundler. */
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { collectGames, githubClient, SITE } from "./catalog.mjs";
import { LOCALES } from "./content.mjs";
import { page, notFoundPage } from "./render.mjs";

import { basePath, previewHtml, previewCss } from "./preview.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith("--")) throw new Error(`Missing ${name}`);
  return process.argv[index + 1];
};
const base = basePath(arg("--base-path", "/"));
const output = arg("--out-dir", "dist");
const DIST = resolve(ROOT, output);
if (!/^dist(?:-preview)?(?:\/|$)/.test(relative(ROOT, DIST))) throw new Error("Output must be inside dist or dist-preview");
const offline = process.argv.includes("--offline");
const curated = JSON.parse(readFileSync(join(ROOT, "data/games.json"), "utf8"));
const games = await collectGames({ curated, offline, request: offline ? null : githubClient() });
if (!games.length) throw new Error("No games to publish");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const file of ["styles.css", "site.js", "favicon.svg", "favicon-32.png", "apple-touch-icon.png", "og-image.jpg", ".nojekyll"]) {
  copyFileSync(join(ROOT, file), join(DIST, file));
}
writeFileSync(join(DIST, "styles.css"), previewCss(readFileSync(join(ROOT, "styles.css"), "utf8"), base));
for (const directory of ["brand", "assets"]) cpSync(join(ROOT, directory), join(DIST, directory), { recursive: true });
for (const locale of LOCALES) {
  const directory = join(DIST, locale.path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "index.html"), previewHtml(page(locale, games), base));
}
writeFileSync(join(DIST, "404.html"), previewHtml(notFoundPage(), base));
writeFileSync(join(DIST, "games.json"), JSON.stringify(games, null, 2) + "\n");
writeFileSync(join(DIST, "robots.txt"), base === "/" ? `User-agent: *\nAllow: /\nDisallow: /pr-preview/\nSitemap: ${SITE}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.map((locale) => `<url><loc>${SITE}${locale.path}</loc></url>`).join("")}</urlset>\n`);
console.log(`Built ${games.length} catalog entries × ${LOCALES.length} locales${offline ? " (offline)" : ""} → ${DIST}`);
