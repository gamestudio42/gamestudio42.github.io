# Game Studio 42

Public site of the studio. GitHub Pages serves the generated catalog at
https://gamestudio42.github.io/.

Open-source games. Play in one click. Fork in two.

## How a game appears here

1. Add a public repo under `gamestudio42`.
2. Tag it with `gs42-game`.
3. Commit a `gs42.json` at the repo root:

```json
{
  "title": "Urbe",
  "tagline": {
    "en": "You set the conditions. The city decides the rest.",
    "pt": "Você cria as condições. A cidade decide o resto."
  },
  "cover": "docs/screenshots/menu.jpg",
  "genre": "city-builder",
  "tech": ["TypeScript", "PixiJS"],
  "order": 1
}
```

4. The Pages workflow rebuilds daily (and on every push to this repo).
   Dispatch it from the Actions tab to publish sooner.

```sh
node scripts/build.mjs   # writes dist/ (needs network + gh auth, or GITHUB_TOKEN)
```

The organization profile README lives in [`gamestudio42/.github`](https://github.com/gamestudio42/.github).
Brand assets, including `brand/avatar-512.png` for the org avatar upload, live in `brand/`.
