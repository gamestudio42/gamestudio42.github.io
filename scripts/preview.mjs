/** Relocate only site-owned URLs; playable games and canonical URLs stay public. */
export function basePath(value = "/") {
  if (value === "/" || /^\/pr-preview\/pr-[1-9][0-9]*\/$/.test(value)) return value;
  throw new Error("Base path must be / or /pr-preview/pr-<number>/");
}

export function previewHtml(html, base = "/") {
  basePath(base);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8"><meta name="site-base" content="${base}">`);
  if (base === "/") return html;
  return html
    .replace(/(\b(?:href|src)=")\/(?!\/)/g, `$1${base}`)
    .replace(/srcset="([^"]*)"/g, (_, value) => `srcset="${value.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}`)}"`)
    .replace(/<meta name="robots"[^>]*>/g, "")
    .replace("</head>", '<meta name="robots" content="noindex,nofollow"></head>')
    .replace(/\s*<script data-goatcounter[^>]*><\/script>/g, "");
}

export function previewCss(css, base = "/") {
  basePath(base);
  return css.replace(/(url\(["']?)\/(?!\/)/g, `$1${base}`);
}
