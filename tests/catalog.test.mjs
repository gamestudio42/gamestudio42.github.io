import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { collectGames, safeUrl } from "../scripts/catalog.mjs";
import { page, notFoundPage } from "../scripts/render.mjs";
import { COPY, LOCALES } from "../scripts/content.mjs";

const curated = JSON.parse(readFileSync(new URL("../data/games.json", import.meta.url), "utf8"));
const quiet = () => {};

test("offline build includes Oasis and every existing catalog entry without requests", async () => {
  const games = await collectGames({ curated, offline: true, request: () => assert.fail("offline request") });
  assert.deepEqual(games.map((game) => game.name), ["plot42", "vazante", "urbe-oasis", "neo-urbe", "urbe", "mineboss"]);
  assert.equal(games.find((game) => game.name === "urbe-oasis").play, "https://gamestudio42.github.io/urbe-oasis/");
});

test("GitHub outage preserves complete local metadata and does not invent live statistics", async () => {
  const games = await collectGames({ curated, request: async () => { throw new Error("network unavailable"); }, warn: quiet });
  assert.equal(games.length, 6);
  for (const game of games) {
    assert.equal(game.title, curated.find((saved) => saved.name === game.name).title);
    assert.equal(game.stars, undefined);
    assert.equal(game.pushedAt, undefined);
  }
});

test("Oasis is fetched even without the discovery topic and keeps its real local screenshot", async () => {
  const calls = [];
  const request = async (path) => {
    calls.push(path);
    if (path.startsWith("/orgs/")) return [{ name: "urbe", topics: ["gs42-game"] }];
    if (path.includes("/urbe-oasis/")) return { title: "Urbe Oasis", cover: "apps/oasis/public/favicon.svg", tagline: { pt: "Uma nova descrição." }, genre: "city-builder", order: 99 };
    throw new Error("404");
  };
  const games = await collectGames({ curated, request, warn: quiet });
  const oasis = games.find((game) => game.name === "urbe-oasis");
  assert.ok(calls.includes("/repos/gamestudio42/urbe-oasis/contents/gs42.json"));
  assert.equal(oasis.order, 1);
  assert.equal(oasis.cover, "/assets/games/urbe-oasis-full.webp");
  assert.equal(oasis.tagline.pt, "Uma nova descrição.");
  assert.equal(oasis.tagline.en, curated.find((game) => game.name === "urbe-oasis").tagline.en);
  assert.equal(games.length, 6);
});

test("discovery paginates, adds valid new games and rejects malformed manifests", async () => {
  const filler = Array.from({ length: 99 }, (_, i) => ({ name: `tool-${i}`, topics: [] }));
  const request = async (path) => {
    if (path.endsWith("&page=1")) return [...filler, { name: "new-world", topics: ["gs42-game"], homepage: "javascript:alert(1)", default_branch: "main" }];
    if (path.endsWith("&page=2")) return [{ name: "broken-world", topics: ["gs42-game"] }];
    if (path.includes("/new-world/")) return { title: "New world", cover: "docs/city.jpg", genre: "collection", tech: ["TypeScript", 42] };
    if (path.includes("/broken-world/")) return { title: null };
    throw new Error("404");
  };
  const games = await collectGames({ curated, request, warn: quiet });
  assert.equal(games.length, 7);
  const added = games.find((game) => game.name === "new-world");
  assert.equal(added.play, "https://gamestudio42.github.io/new-world/");
  assert.deepEqual(added.tech, ["TypeScript"]);
  assert.equal(added.cover, "https://raw.githubusercontent.com/gamestudio42/new-world/main/docs/city.jpg");
  assert.ok(page(LOCALES[0], games).includes('id="game-new-world"'));
});

test("unsafe or malformed outgoing URLs are not emitted", () => {
  assert.equal(safeUrl("javascript:alert(1)", "safe"), "safe");
  assert.equal(safeUrl("data:text/html,hello", "safe"), "safe");
  assert.equal(safeUrl("relative", "safe"), "safe");
  assert.equal(safeUrl("https://example.com/play"), "https://example.com/play");
});

test("every locale contains the full portfolio, valid anchors and SEO alternates", () => {
  for (const locale of LOCALES) {
    const html = page(locale, curated);
    assert.ok(html.includes(`<html lang="${locale.htmlLang}">`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal((html.match(/<article /g) || []).length, 5);
    assert.equal((html.match(/rel="alternate"/g) || []).length, 6);
    assert.ok(html.includes('id="oasis"'));
    assert.ok(html.includes('id="game-vazante"'));
    assert.ok(html.includes(COPY[locale.id].genres["real-time-tactics"]));
    assert.ok(html.includes('href="https://gamestudio42.github.io/plot42/"'));
    assert.ok(html.includes('href="https://gamestudio42.github.io/urbe-oasis/"'));
    assert.ok(!html.includes("undefined"));
    for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${anchor}"`), `${locale.id} missing ${anchor}`);
    assert.deepEqual(Object.keys(COPY[locale.id]).sort(), Object.keys(COPY.en).sort());
  }
});

test("repository text cannot break out of HTML or embedded JSON", () => {
  const malicious = structuredClone(curated);
  malicious[1].title = '</script><img src=x onerror="alert(1)">';
  malicious[1].tagline.pt = '<svg onload="alert(1)">';
  const html = page(LOCALES[1], malicious);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<svg onload='));
  const payload = html.match(/<script id="games-data" type="application\/json">(.*?)<\/script>/s)[1];
  assert.equal(JSON.parse(payload)[1].title, malicious[1].title);
});

test("bundled covers and their responsive variants exist", () => {
  for (const game of curated) {
    for (const path of [game.cover, game.coverSmall]) assert.ok(existsSync(new URL(`..${path}`, import.meta.url)), path);
  }
});

test("404 has recovery links for all five languages and is not indexed", () => {
  const html = notFoundPage();
  assert.ok(html.includes('content="noindex"'));
  for (const locale of LOCALES) assert.ok(html.includes(`href="${locale.path}"`));
});

test("Snap Store is optional, localized and retained across catalog refreshes", async () => {
  const request = async (path) => {
    if (path.startsWith("/orgs/")) return [];
    if (path.includes("/vazante/")) return { title: "Vazante", genre: "real-time-tactics", tagline: {} };
    throw new Error("404");
  };
  for (const offline of [true, false]) {
    const games = await collectGames({ curated, request, offline, warn: quiet });
    assert.deepEqual(games.filter((game) => game.snapStore).map((game) => game.name), ["vazante"]);
    for (const locale of LOCALES) {
      const html = page(locale, games);
      assert.equal((html.match(/class="snap-store-link"/g) || []).length, 1);
      assert.ok(html.includes('href="https://snapcraft.io/vazante"'));
      assert.ok(html.includes('src="https://snapcraft.io/en/dark/install.svg" width="182" height="56"'));
      assert.ok(html.includes(COPY[locale.id].installLinux));
      assert.ok(html.includes(COPY[locale.id].snapStoreLabel.replace("{title}", "Vazante")));
      assert.equal((html.match(/ · Linux/g) || []).length, 1);
    }
  }
  const withoutStore = curated.map(({ snapStore, ...game }) => game);
  assert.ok(!page(LOCALES[0], withoutStore).includes('class="snap-store-link"'));
  const futureGame = structuredClone(withoutStore);
  futureGame.find((game) => game.name === "urbe").snapStore = "https://snapcraft.io/another-game";
  assert.ok(page(LOCALES[0], futureGame).includes('href="https://snapcraft.io/another-game"'));
});
