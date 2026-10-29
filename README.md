# Game Studio 42

Site público do estúdio, publicado em [gamestudio42.github.io](https://gamestudio42.github.io/).
Uma apresentação dos jogos e do desenvolvimento aberto, com screenshots reais,
layout responsivo e acesso direto para jogar, explorar o código e contribuir.

## Desenvolvimento local

Requer Node.js 22+. O build estático não precisa de dependências npm nem bundler. Os testes de navegador usam Playwright como dependência de desenvolvimento.

```sh
node scripts/build.mjs --offline
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Abra [localhost:4173/pt/](http://localhost:4173/pt/). O modo offline usa o catálogo
versionado e não precisa de rede ou credenciais. `dist/` é gerado e não deve ser editado.

```sh
node --test tests/catalog.test.mjs # catálogo, falhas de rede, HTML e idiomas
node scripts/build.mjs      # atualiza metadados via GitHub antes de gerar dist/
```

O build online usa `GITHUB_TOKEN`, `GH_TOKEN` ou a autenticação do `gh`, nessa ordem.
Sem credenciais, tenta a API pública. Falhas da API preservam os jogos conhecidos.

## Conteúdo e catálogo

- `scripts/content.mjs`: conteúdo editorial em EN, PT-BR, ES, FR e DE.
- `scripts/render.mjs`: HTML estático, metadados, página 404 e estrutura visual.
- `styles.css` e `site.js`: apresentação e melhorias progressivas.
- `data/games.json`: catálogo editorial e fallback completo dos jogos conhecidos.
- `assets/games/`: screenshots locais em WebP, com versões responsivas.
- `assets/SOURCES.md`: origem das imagens e licença da fonte.
- `brand/social-card.svg`: fonte editável da imagem de compartilhamento (1200 × 630).

Para exportar a imagem social com Inkscape e ImageMagick:

```sh
inkscape brand/social-card.svg --export-filename=/tmp/gs42-social.png
magick /tmp/gs42-social.png -quality 90 og-image.jpg
```

O catálogo inclui Urbe, Neo Urbe, Urbe Oasis, MineBoss, Vazante, Sítio e a coleção Plot 42.
Urbe Oasis participa da abertura, do catálogo e de uma seção própria. A capa local
é preservada mesmo quando o manifesto do jogo aponta para um favicon.

### Adicionar um jogo

Para descoberta automática, crie um repositório público na organização
`gamestudio42`, adicione o tópico `gs42-game` e publique um `gs42.json` na raiz:

```json
{
  "title": "Meu jogo",
  "tagline": {
    "en": "A short description.",
    "pt": "Uma descrição curta.",
    "es": "Una descripción breve.",
    "fr": "Une brève description.",
    "de": "Eine kurze Beschreibung."
  },
  "cover": "docs/screenshots/city.jpg",
  "genre": "city-builder",
  "tech": ["TypeScript", "PixiJS"],
  "order": 5
}
```

A URL de jogo vem de `homepage` do repositório ou de
`https://gamestudio42.github.io/<nome>/`. O build pagina a lista de repositórios e
une a descoberta ao catálogo editorial, sem duplicatas. Um manifesto inválido
não remove uma entrada conhecida. Jogos novos com manifestos inválidos são
ignorados com um aviso.

Para assegurar presença também offline, adicione o jogo a `data/games.json` com
metadados verificados, links e screenshots locais. `coverWidth` e `coverHeight`
representam as dimensões reais da imagem `-full.webp`; `coverSmall` tem 800 px
de largura. Não use arte conceitual como se fosse gameplay.

A área de contribuição oferece todos os projetos do catálogo. Ao selecionar um
projeto, os comandos de clone, README, issues e licença acompanham a seleção.
A instalação segue o guia de cada repositório. `default_branch` define a branch
do link de licença, inclusive `master` no MineBoss.

## Idiomas e acessibilidade

Rotas: `/` (EN), `/pt/`, `/es/`, `/fr/` e `/de/`. Na raiz, o site usa a preferência
salva ou o idioma do navegador. Uma URL explícita de idioma tem precedência e
não é redirecionada por uma escolha anterior. A troca manual preserva query e
âncora; bloqueios de armazenamento não impedem os controles de funcionar.

O conteúdo e os links de navegação funcionam sem JavaScript. JS acrescenta menu
mobile, seleção de repositório, cópia e jogo aleatório. O site respeita
`prefers-reduced-motion`, oferece foco visível, link de salto e mensagens de cópia
anunciadas por leitores de tela. O jogo aleatório exclui coletâneas.

## Verificações de PR

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

Os testes de navegador precisam de Python 3 para servir `dist/`. O workflow
`Pull request checks` verifica os cinco idiomas em desktop e celular, alinhamento
dos cards, seleção de projetos, cópia do contato e navegação por teclado.
Capturas do catálogo e relatórios ficam nos artefatos da execução por sete dias.
Esse workflow tem acesso somente de leitura e não publica o site.

## Publicação

O workflow Pages roda os testes, gera `dist/` e publica pelo GitHub Pages em pushes
para `main`, diariamente ou via `workflow_dispatch`. O build também gera `404.html`,
`robots.txt`, `sitemap.xml` e `games.json` (mantido como catálogo público).

O GoatCounter existente continua habilitado. Fonte e screenshots são servidos
localmente; o visitante não precisa consultar a API do GitHub para ver o catálogo.

O perfil da organização fica em [gamestudio42/.github](https://github.com/gamestudio42/.github).
A marca existente permanece em `brand/`.
