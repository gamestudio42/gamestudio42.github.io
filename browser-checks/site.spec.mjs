import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const curated = JSON.parse(readFileSync(new URL('../data/games.json', import.meta.url), 'utf8'));
import { COPY } from '../scripts/content.mjs';

for (const locale of ['en', 'pt', 'es', 'fr', 'de']) {
  test(`${locale}: cards align and every project can be explored`, async ({ page }, testInfo) => {
    await page.goto(locale === 'en' ? '/' : `/${locale}/`);
    await page.evaluate(() => document.fonts.ready);
    const cards = page.locator('.game-card');
    await expect(cards).toHaveCount(curated.length - 1);
    const actions = await page.locator('.game-card .card-actions').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
    if (testInfo.project.name === 'desktop') {
      for (let i = 0; i < actions.length; i += 2) expect(Math.abs(actions[i] - actions[i + 1])).toBeLessThan(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('.snap-store-link[href="https://snapcraft.io/vazante"]')).toHaveCount(1);
    await expect(page.locator('.snap-store-link')).toHaveCount(curated.filter((game) => game.snapStore).length);
    await expect(page.locator('#game-neo-urbe .platform')).toContainText(COPY[locale].platformLabels.snap);
    await expect(page.locator('#game-sitio .platform')).toContainText(COPY[locale].platformLabels.browser);
    await expect(page.locator('#game-sitio .platform')).not.toContainText(COPY[locale].platformLabels.snap);
    await page.locator('#games').scrollIntoViewIfNeeded();
    await testInfo.attach(`catalog-${locale}`, { body: await page.screenshot(), contentType: 'image/png' });
    for (const name of ['dead-sector', 'void-frontier']) {
      const game = page.locator(`#game-${name}`);
      const cover = game.locator('.game-image img');
      await game.scrollIntoViewIfNeeded();
      await cover.evaluate(img => img.decode());
      await expect(cover).toHaveJSProperty('complete', true);
      expect(await cover.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    }
    await testInfo.attach(`new-games-${locale}`, { body: await page.screenshot(), contentType: 'image/png' });
    const t = COPY[locale];
    const dialog = page.getByRole('dialog');
    for (const trigger of await page.locator('[data-share]').all()) {
      const card = trigger.locator('xpath=ancestor::article');
      const title = await card.locator('h3').innerText();
      const url = await card.locator('.play-link').getAttribute('href');
      await trigger.click();
      await expect(dialog).toHaveAccessibleName(t.shareTitle.replace('{title}', title));
      await expect(dialog.getByLabel(t.gameLink, { exact: true })).toHaveValue(url);
      const text = t.shareText.replace('{title}', title);
      const destinations = { WhatsApp: 'https://wa.me/', X: 'https://x.com/intent/tweet', Threads: 'https://www.threads.com/intent/post', Bluesky: 'https://bsky.app/intent/compose' };
      for (const [network, destination] of Object.entries(destinations)) {
        const link = dialog.getByRole('link', { name: network, exact: true });
        const intent = new URL(await link.getAttribute('href'));
        expect(intent.origin + intent.pathname).toBe(destination);
        expect(intent.searchParams.get('text')).toBe(network === 'X' ? text : `${text} ${url}`);
        if (network === 'X') expect(intent.searchParams.get('url')).toBe(url);
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      if (title === 'Sítio') {
        const path = testInfo.outputPath(`sharing-${locale}.png`);
        await page.screenshot({ path });
        await testInfo.attach(`sharing-${locale}`, { path, contentType: 'image/png' });
      }
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    const select = page.locator('#repo-select');
    await expect(select.locator('option')).toHaveCount(curated.length);
    for (const [name, branch] of curated.map(game => [game.name, game.default_branch])) {
      await select.selectOption(name);
      const repo = `https://github.com/gamestudio42/${name}`;
      await expect(page.locator('.project-guide')).toHaveAttribute('href', `${repo}#readme`);
      await expect(page.locator('.project-license')).toHaveAttribute('href', `${repo}/blob/${branch}/LICENSE`);
      await expect(page.locator('.source-issues')).toHaveAttribute('href', `${repo}/issues`);
      await expect(page.locator('#clone-commands code')).toHaveText(`git clone ${repo}.git\ncd ${name}`);
    }
  });
}

test('contact is copyable and failure leaves the address available', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/pt/#support');
  const copy = page.getByRole('button', { name: 'Copiar e-mail', exact: true });
  await copy.click();
  await expect(page.getByRole('status')).toHaveText('E-mail copiado');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('talkgamestudio42@gmail.com');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await copy.click();
  await expect(page.getByRole('status')).toHaveText('Selecione o endereço acima e copie manualmente.');
  await expect(page.locator('.contact-actions a')).toHaveText('talkgamestudio42@gmail.com');
});

test('mobile navigation closes and focuses the destination', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/pt/');
  const toggle = page.getByRole('button', { name: /Menu/ });
  await toggle.click();
  await page.getByRole('link', { name: 'Apoio e serviços', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#support')).toBeFocused();
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});


test('sharing copies the current game, retains manual fallback and contains keyboard focus', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await page.goto('/pt/');
  const trigger = page.getByRole('button', { name: 'Compartilhar jogo — Sítio', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  const copy = dialog.getByRole('button', { name: 'Copiar link', exact: true });
  await expect(copy).toBeFocused();
  await expect(dialog.locator('.share-native')).toBeHidden();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await copy.click();
  await expect(dialog.getByRole('status')).toHaveText('Link copiado');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://gamestudio42.github.io/sitio/');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await copy.click();
  await expect(dialog.getByRole('status')).toHaveText('Não foi possível copiar. Copie o link diretamente.');
  await dialog.getByLabel('Link do jogo', { exact: true }).click();
  await page.keyboard.press('ControlOrMeta+A');
  expect(await dialog.locator('input').evaluate(el => el.value.slice(el.selectionStart, el.selectionEnd))).toBe('https://gamestudio42.github.io/sitio/');
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Compartilhar jogo — Vazante', exact: true }).click();
  await expect(dialog.locator('input')).toHaveValue('https://gamestudio42.github.io/vazante/');
  await expect(dialog.getByRole('status')).toBeEmpty();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
});

test('native sharing receives the game and handles cancellation and failure', async ({ page }) => {
  await page.addInitScript(() => {
    window.nativeCalls = [];
    window.shareResult = 'success';
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
      window.nativeCalls.push(data);
      if (window.shareResult !== 'success') throw new DOMException('test', window.shareResult);
    } });
  });
  await page.goto('/pt/');
  await page.getByRole('button', { name: 'Compartilhar jogo — Sítio', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const native = dialog.getByRole('button', { name: 'Mais aplicativos' });
  await native.click();
  expect(await page.evaluate(() => window.nativeCalls)).toEqual([{ title: 'Sítio', text: 'Jogue Sítio, da Game Studio 42.', url: 'https://gamestudio42.github.io/sitio/' }]);
  await page.evaluate(() => { window.shareResult = 'AbortError'; });
  await native.click();
  await expect(dialog.getByRole('status')).toBeEmpty();
  await expect(native).toBeEnabled();
  await page.evaluate(() => { window.shareResult = 'NotAllowedError'; });
  await native.click();
  await expect(dialog.getByRole('status')).toHaveText('Não foi possível compartilhar. Copie o link ou escolha uma rede.');
  await expect(dialog.getByRole('button', { name: 'Copiar link', exact: true })).toBeEnabled();
});


test('PR preview keeps assets, language switching and sharing inside the right scope', async ({ page }) => {
  const base = '/pr-preview/pr-999/';
  const requests = [];
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.addInitScript(() => localStorage.setItem('gs42-lang', 'pt'));
  await page.goto(base + 'pt/#games');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('script[data-goatcounter]')).toHaveCount(0);
  await expect(page.locator('.brand').first()).toHaveAttribute('href', base + 'pt/');
  await page.locator('#game-dead-sector').scrollIntoViewIfNeeded();
  await expect(page.locator('#game-dead-sector .game-image img')).toHaveJSProperty('complete', true);
  expect(await page.locator('#game-dead-sector .game-image img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await page.locator('[data-share="void-frontier"]').click();
  await expect(page.locator('#share-url')).toHaveValue('https://gamestudio42.github.io/void-frontier/');
  await page.keyboard.press('Escape');
  await page.locator('.site-header .language-picker summary').click();
  await page.locator('.site-header [data-lang="de"]').click();
  await expect(page).toHaveURL(new RegExp(base + 'de/#games$'));
  expect(await page.evaluate(() => localStorage.getItem('gs42-lang'))).toBe('pt');
  await page.goto(base);
  await expect(page).toHaveURL(new RegExp(base + 'de/$'));
  await page.goto(base + '404.html');
  await expect(page.locator('.button-primary')).toHaveAttribute('href', base);
  expect(requests.filter(path => /^\/(?:assets|brand)\//.test(path) || ['/site.js', '/styles.css'].includes(path))).toEqual([]);
});
