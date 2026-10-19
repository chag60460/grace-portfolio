import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin = process.env.PORTFOLIO_PREVIEW || 'http://127.0.0.1:4174';
const route = '/projects/corner-cafe/';
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const base of [`${origin}${route}`, new URL('./', import.meta.url).href]) {
    console.log(`Checking ${base}`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const localErrors = [];
    page.on('pageerror', error => {
      if (!error.stack?.includes('figma.com')) localErrors.push(error.message);
    });
    await page.goto(`${base}play/index.html?demo=drinker`);
    await page.getByLabel('First name').fill('Demo');
    await page.getByLabel('Last name').fill('Sipper');
    await page.locator('#name-form button[type=submit]').click();
    await page.locator('[data-action=temperature][data-value=hot]').click();
    await page.locator('[data-action=next]').click();
    await page.locator('[data-action=drink][data-value=Latte]').click();
    await page.locator('[data-action=next]').click();
    await page.locator('[data-action=syrup][data-value=caramel]').click();
    await page.locator('[data-action=next]').click();
    await page.locator('[data-action=milk][data-value=soy]').click();
    for (const width of [390, 280, 240]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.locator('.milk-options .choice-card').evaluateAll(nodes => nodes.map(card => {
        const box = card.getBoundingClientRect();
        const icon = card.querySelector('.milk-illustration').getBoundingClientRect();
        return { fits: icon.left >= box.left && icon.right <= box.right, inViewport: box.left >= 0 && box.right <= innerWidth };
      }));
      assert.ok(geometry.every(item => item.fits && item.inViewport), `Milk choices clipped at ${width}px`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Demo overflow at ${width}px for ${base}`);
    }
    await page.locator('[data-action=submit-order]').click();
    await page.getByRole('heading', { name: /A little happiness/ }).waitFor();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}play/index.html?demo=team`);
    await page.locator('main [data-action=steamer]').click();
    await page.locator('[data-action=milk-filter][data-value=both]').click();
    assert.ok(await page.locator('.ticket').count() >= 1);

    await page.goto(`${base}corner-cafe.html`);
    await page.locator('[data-demo-mode=drinker]').click();
    await page.waitForFunction(() => document.querySelector('#demo-status').textContent.startsWith('Demo ready.'));
    const drinker = page.frameLocator('#demo-stage iframe');
    await drinker.getByLabel('First name').fill('Demo');
    await drinker.getByLabel('Last name').fill('Visitor');
    await drinker.locator('#name-form button[type=submit]').click();
    await drinker.locator('[data-action=temperature][data-value=cold]').click();
    await drinker.locator('[data-action=next]').click();
    await drinker.locator('[data-action=drink][data-value=Americano]').click();
    await drinker.locator('[data-action=submit-order]').click();
    await drinker.getByRole('heading', { name: /A little happiness/ }).waitFor();
    assert.equal(await drinker.locator('.error-banner').count(), 0);
    await page.locator('#close-demo').click();
    await page.locator('[data-demo-mode=team]').click();
    await page.waitForFunction(() => document.querySelector('#demo-status').textContent.startsWith('Team demo ready.'));
    const team = page.frameLocator('#demo-stage iframe');
    assert.equal(await team.locator('main .role-grid .choice-card').count(), 3);
    await page.locator('#close-demo').click();
    assert.equal(await page.locator('#demo-stage iframe').count(), 0);
    assert.equal(await page.locator('#figma iframe[src^="https://embed.figma.com/"]').count(), 2);
    await page.locator('#figma-system-tab').click();
    assert.equal(await page.locator('#figma-system-panel').isVisible(), true);
    await page.locator('#figma-system-tab').press('ArrowLeft');
    assert.equal(await page.locator('#figma-app-tab').getAttribute('aria-selected'), 'true');
    for (const width of [320, 375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Case-study overflow at ${width}px`);
    }
    assert.deepEqual(localErrors, [], 'The local app and case study should not throw.');
    results.push({ base, fullTabOrder: true, iframeOrder: true, iframeHandshake: true, teamQueue: true, narrowMilkChoices: true, figmaTabControls: true });
    await context.close();
  }
  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await browser.close();
}
