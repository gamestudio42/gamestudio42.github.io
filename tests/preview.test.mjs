import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basePath, previewHtml, previewCss } from '../scripts/preview.mjs';
import { previewPlan, previewRemovalPlan } from '../scripts/preview-plan.mjs';
import { page, notFoundPage } from '../scripts/render.mjs';
import { LOCALES } from '../scripts/content.mjs';
const games = JSON.parse(readFileSync(new URL('../data/games.json', import.meta.url)));
const base = '/pr-preview/pr-123/';

test('preview rewrites local URLs in all locales without rewriting external game URLs', () => {
  for (const locale of LOCALES) {
    const html = previewHtml(page(locale, games), base);
    for (const [, url] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]+)"/g)) assert.ok(url.startsWith(base), url);
    for (const [, value] of html.matchAll(/srcset="([^"]+)"/g)) for (const item of value.split(',')) assert.ok(item.trim().startsWith(base));
    assert.ok(html.includes('href="https://gamestudio42.github.io/void-frontier/"'));
    assert.ok(html.includes('href="https://snapcraft.io/vazante"'));
    assert.ok(html.includes('content="noindex,nofollow"'));
    assert.ok(!html.includes('data-goatcounter'));
    assert.ok(html.includes(`<meta name="site-base" content="${base}">`));
  }
  assert.ok(previewHtml(notFoundPage(), base).includes(`href="${base}"`));
  const css = previewCss(readFileSync(new URL('../styles.css', import.meta.url), 'utf8'), base);
  assert.ok(css.includes(`url("${base}assets/fonts/space-grotesk.ttf")`));
  assert.ok(css.includes(`url("${base}brand/logo-mark.svg")`));
  assert.ok(previewHtml(page(LOCALES[0], games)).includes('data-goatcounter'));
});

test('preview rejects unsafe or ambiguous base paths', () => {
  for (const input of ['//example.com/', '/pr-preview/../', '/pr-preview/pr-0/', '/" onclick="x', '/pr-preview/pr-2']) assert.throws(() => basePath(input));
});

const run = { event: 'pull_request', conclusion: 'success', head_sha: 'abc', head_repository: { full_name: 'contributor/site' } };
const pr = { number: 123, state: 'open', head: { sha: 'abc', repo: { full_name: 'contributor/site' } } };
const artifact = { name: 'preview-pr-123', id: 42, expired: false };

test('publisher accepts current fork and same-repository builds and skips stale or closed PRs', () => {
  assert.deepEqual(previewPlan(run, [artifact], pr), { number: 123, artifactId: 42 });
  const repo = { full_name: 'gamestudio42/gamestudio42.github.io' };
  assert.ok(previewPlan({ ...run, head_repository: repo }, [artifact], { ...pr, head: { sha: 'abc', repo } }));
  assert.equal(previewPlan(run, [artifact], { ...pr, state: 'closed' }), null);
  assert.equal(previewPlan({ ...run, head_sha: 'old' }, [artifact], pr), null);
  assert.equal(previewPlan({ ...run, conclusion: 'failure' }, [artifact], pr), null);
  assert.equal(previewPlan({ ...run, event: 'push' }, [artifact], pr), null);
});

test('publisher rejects artifact spoofing, expired/duplicate artifacts and repository mismatch', () => {
  assert.throws(() => previewPlan(run, [{ ...artifact, name: 'preview-pr-124' }], pr));
  assert.throws(() => previewPlan(run, [artifact, artifact], pr));
  assert.throws(() => previewPlan(run, [{ ...artifact, expired: true }], pr));
  assert.throws(() => previewPlan(run, [{ ...artifact, name: '../preview-pr-123' }], pr));
  assert.throws(() => previewPlan({ ...run, head_repository: { full_name: 'other/repo' } }, [artifact], pr));
});


test('preview cleanup is idempotent for missing previews and only removes closed PR directories', async () => {
  const closed = { number: 9, state: 'closed' };
  assert.equal(await previewRemovalPlan(closed, async () => { throw { status: 404 }; }), null);
  assert.equal(await previewRemovalPlan(closed, async () => []), null);
  assert.equal(await previewRemovalPlan({ ...closed, state: 'open' }, () => assert.fail('should not read')), null);
  assert.deepEqual(await previewRemovalPlan(closed, async (path, ref) => {
    assert.equal(path, 'pr-preview/pr-9');
    assert.equal(ref, 'gh-pages');
    return [{ name: 'index.html', type: 'file' }];
  }), { number: 9 });
  await assert.rejects(previewRemovalPlan(closed, async () => { throw new Error('permission denied'); }), /permission denied/);
  await assert.rejects(previewRemovalPlan(closed, async () => ({ type: 'file' })), /directory/);
});
