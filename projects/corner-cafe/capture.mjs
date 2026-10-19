import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const origin = process.env.PORTFOLIO_PREVIEW || 'http://127.0.0.1:4174';
const demo = `${origin}/projects/corner-cafe/play/index.html`;
const media = new URL('./media/', import.meta.url);
await mkdir(media, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await context.newPage();
const captured = [];
async function screenshot(name, selector) {
  await page.evaluate(() => document.fonts.ready);
  const image = await page.locator(selector).screenshot({
    path: fileURLToPath(new URL(name, media)),
    animations: 'disabled',
  });
  captured.push({ name, width: image.readUInt32BE(16), height: image.readUInt32BE(20) });
}
async function flattenSticky() {
  await page.addStyleTag({ content: '.preview-panel,.queue-action-bar,.sidebar{position:static!important} *{scrollbar-width:none!important} ::-webkit-scrollbar{display:none!important}' });
}
try {
  await page.goto(`${demo}?demo=drinker`);
  await page.getByLabel('First name').fill('Mia');
  await page.getByLabel('Last name').fill('Park');
  await page.locator('#name-form button[type=submit]').click();
  await page.locator('[data-action=temperature][data-value=hot]').click();
  await page.locator('[data-action=next]').click();
  await page.locator('[data-action=drink][data-value=Latte]').click();
  await page.locator('[data-action=next]').click();
  await flattenSticky();
  assert.equal(await page.locator('.syrup-fill').evaluate(node => parseFloat(getComputedStyle(node).height)), 0);
  await screenshot('cup-empty.png', '.preview-panel');
  await page.locator('[data-action=syrup][data-value=caramel]').click();
  assert.equal(await page.locator('.syrup-fill').evaluate(node => parseFloat(getComputedStyle(node).height)), 16);
  await screenshot('cup-syrup.png', '.preview-panel');
  await page.locator('[data-action=next]').click();
  await page.locator('[data-action=milk][data-value=oat]').click();
  await screenshot('cup-milk.png', '.preview-panel');
  assert.equal(await page.locator('.milk-options .choice-card').count(), 3);
  const panel = await page.locator('.order-layout').boundingBox();
  const submit = await page.locator('[data-action=submit-order]').boundingBox();
  assert.ok(panel && submit && submit.y + submit.height <= panel.y + panel.height + 1, 'The capture must include the submit button.');
  await screenshot('customer-full.png', '.order-layout');

  await page.goto(`${demo}?demo=team`);
  await page.locator('main [data-action=steamer]').click();
  await page.locator('[data-action=milk-filter][data-value=non-dairy]').click();
  await page.locator('[data-select]').first().check();
  await flattenSticky();
  assert.equal(await page.locator('.ticket').count(), 2);
  await screenshot('steamer-full.png', '.queue-page');
  console.log(JSON.stringify({ completeMilkChoices: true, submitIncluded: true, captured }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
