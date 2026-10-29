import { test, expect } from '@playwright/test';

for (const locale of ['en', 'pt', 'es', 'fr', 'de']) {
  test(`${locale}: cards align and every project can be explored`, async ({ page }, testInfo) => {
    await page.goto(locale === 'en' ? '/' : `/${locale}/`);
    await page.evaluate(() => document.fonts.ready);
    const cards = page.locator('.game-card');
    await expect(cards).toHaveCount(6);
    const actions = await page.locator('.game-card .card-actions').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
    if (testInfo.project.name === 'desktop') {
      for (let i = 0; i < actions.length; i += 2) expect(Math.abs(actions[i] - actions[i + 1])).toBeLessThan(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('.snap-store-link')).toHaveAttribute('href', 'https://snapcraft.io/vazante');
    await page.locator('#games').scrollIntoViewIfNeeded();
    await testInfo.attach(`catalog-${locale}`, { body: await page.screenshot(), contentType: 'image/png' });
    const select = page.locator('#repo-select');
    await expect(select.locator('option')).toHaveCount(7);
    for (const [name, branch] of [['sitio', 'main'], ['vazante', 'main'], ['mineboss', 'master'], ['plot42', 'main'], ['urbe', 'main'], ['neo-urbe', 'main'], ['urbe-oasis', 'main']]) {
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
