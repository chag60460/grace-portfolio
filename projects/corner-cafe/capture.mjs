import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const origin = process.env.PORTFOLIO_PREVIEW || 'http://127.0.0.1:4174';
const demo = `${origin}/projects/corner-cafe/play/index.html`;
const media = new URL('./media/', import.meta.url);
await mkdir(media, { recursive: true });
const browser = await chromium.launch();
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' };
const save = name => fileURLToPath(new URL(name, media));

async function pixels(page, selector, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(img => img.offsetWidth).map(img => img.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  return page.locator(selector).screenshot({ path: name ? save(name) : undefined, animations: 'disabled', caret: 'hide' });
}

async function captureShowcase({ drinks, pickup, queue }, colors) {
  const stage = await browser.newPage({ viewport: { width: 680, height: 520 }, deviceScaleFactor: 2 });
  function phone(image, id, x, y, w, h, angle) {
    const screenWidth = w - 10;
    const screenHeight = screenWidth * image.readUInt32BE(20) / image.readUInt32BE(16);
    return `<g transform="translate(${x} ${y}) rotate(${angle} ${w/2} ${h/2})">
      <rect y="8" width="${w}" height="${h}" rx="23" fill="${colors.ink}" opacity=".13"/>
      <rect width="${w}" height="${h}" rx="23" fill="${colors.paper}" stroke="${colors.edge}" stroke-width="1.5"/>
      <rect x="${w/2-25}" y="7" width="50" height="4" rx="2" fill="${colors.line}"/>
      <clipPath id="${id}"><rect x="5" y="18" width="${w-10}" height="${h-24}" rx="16"/></clipPath>
      <g clip-path="url(#${id})"><rect x="5" y="18" width="${screenWidth}" height="${h-24}" fill="${colors.bg}"/>
      <image x="5" y="18" width="${screenWidth}" height="${screenHeight}" href="data:image/png;base64,${image.toString('base64')}"/></g>
    </g>`;
  }
  await stage.setContent(`<style>*{margin:0}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="680" height="520" viewBox="0 0 680 520">
    <rect width="680" height="520" rx="38" fill="${colors.cream}"/><circle cx="318" cy="260" r="205" fill="${colors.paper}"/>
    ${phone(drinks, 'drinks', 29, 85, 202, 350, -6)}
    ${phone(queue, 'queue', 450, 85, 202, 350, 5)}
    ${phone(pickup, 'pickup', 233, 55, 214, 405, 0)}
  </svg>`);
  await stage.screenshot({ path: save('screen-showcase.png'), omitBackground: true });
  await stage.close();
}

try {
  const counter = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
  await counter.goto(demo);
  await counter.locator('#lever').press('ArrowDown');
  await counter.locator('#machine[data-state="ready"]').waitFor();
  await counter.locator('#lever').evaluate(node => node.blur());
  await pixels(counter, '#machine', 'counter-cover.png');
  await counter.screenshot({ path: save('social.jpg'), quality: 88 });
  await counter.close();

  const page = await browser.newPage(mobile);
  const button = name => page.getByRole('button', { name, exact: true });
  await page.goto(`${demo}?demo=drinker`);
  const colors = await page.locator('[data-cafe]').evaluate(el => {
    const token = name => getComputedStyle(el).getPropertyValue(`--${name}`).trim();
    return { bg: token('bg'), cream: token('buttercream'), paper: token('paper'), edge: token('card-edge'), ink: token('ink'), line: token('line') };
  });
  await page.getByLabel('First name').fill('Mia');
  await page.getByLabel('Last name').fill('Park');
  await page.locator('#name-form button').click();
  await page.locator('[data-action="temperature"][data-value="hot"]').click();
  await page.locator('[data-action="next"]').click();
  await page.locator('[data-action="drink"][data-value="Mocha"]').click();
  const drinks = await pixels(page, '.main-shell');
  await page.locator('[data-action="next"]').click();
  await page.setViewportSize({ width: 1200, height: 820 });
  await button('Lavender').click();
  const syrup = page.locator('.station-photo');
  assert.equal(await syrup.getAttribute('data-flavor'), 'lavender');
  assert.equal(await syrup.getAttribute('data-amount'), '0');
  const base = Number(await syrup.getAttribute('data-surface'));
  await pixels(page, '.station-photo', 'cup-base.png');
  await button('Add one pump').click();
  await button('Add one pump').click();
  assert.equal(await syrup.getAttribute('data-amount'), '2');
  assert.ok(Number(await syrup.getAttribute('data-surface')) < base);
  await pixels(page, '.station-photo', 'cup-syrup.png');
  await button('Choose milk').click();
  const milk = page.locator('.milk-photo');
  assert.equal(await milk.getAttribute('data-flavor'), 'lavender');
  assert.equal(await milk.getAttribute('data-amount'), '2');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2030-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T12:00:01Z'));
  await button('Oat milk').press('Enter');
  await page.clock.runFor(1120);
  const pour = await milk.evaluate(svg => {
    const jet = svg.querySelector('.milk-jet').getBBox();
    return { amount: Number(svg.dataset.filled), surface: Number(svg.dataset.milkSurface), jetEnd: jet.y + jet.height,
      jetHeight: jet.height, pack: svg.querySelector('.milk-pose use').getAttribute('href') };
  });
  assert.ok(pour.amount > .1 && pour.amount < .8 && pour.jetHeight > 30 && Math.abs(pour.jetEnd-pour.surface) < .2);
  assert.equal(pour.pack, '#milk-photo-oat');
  await milk.screenshot({ path: save('cup-milk.png') });
  await page.clock.runFor(2200);
  await page.clock.resume();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.milk-photo').getAttribute('data-filled'), '1');
  await page.setViewportSize(mobile.viewport);
  assert.equal(await page.locator('.milk-option').count(), 3);
  assert.ok(await button('Place my order').isEnabled());
  await pixels(page, '.milk-step', 'customer-full.png');
  await button('Place my order').click();
  await button('Mark ready (demo)').click();
  assert.equal(await page.locator('.pickup-ticket .order-state').textContent(), 'Ready for pickup');
  const pickup = await pixels(page, '.main-shell');

  const staff = await browser.newPage(mobile);
  await staff.goto(`${demo}?demo=team`);
  await staff.locator('main [data-action="steamer"]').click();
  await staff.locator('[data-action="milk-filter"][data-value="non-dairy"]').click();
  await staff.getByRole('checkbox').first().check();
  assert.equal(await staff.locator('.ticket').count(), 2);
  await staff.addStyleTag({ content: '.queue-action-bar {position:static!important}' });
  await pixels(staff, '.desk-page', 'steamer-full.png');
  const queue = await pixels(staff, '.main-shell');
  await captureShowcase({ drinks, pickup, queue }, colors);
  console.log('Captured three current app screens, a lavender Mocha, and the oat milk stream in contact with its surface.');
} finally {
  await browser.close();
}
