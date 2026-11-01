import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin = process.env.PORTFOLIO_PREVIEW || 'http://127.0.0.1:4174';
const route = '/projects/corner-cafe/';
const galleryOnly = process.argv.includes('--gallery');

async function verifyGalleryPreviews(page) {
  const cards = page.locator('.project-card');
  assert.equal(await cards.count(), 9);
  for (const width of [1280, 768, 600, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const columns = await page.locator('.projects-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width > 600 ? 2 : 1, `Wrong gallery column count at ${width}px`);
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await card.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      const preview = await card.locator('.project-thumb').boundingBox();
      assert.ok(Math.abs(preview.height - preview.width * 10 / 16) < 1, `Preview is not 16:10 at ${width}px`);
      if (width === 1280) assert.ok(preview.height >= 300, 'Desktop previews must be substantially taller than the old 80px strips');
      const title = await card.locator('.project-name').boundingBox();
      assert.ok(title.y >= preview.y + preview.height, 'Project title must sit below the preview');
      assert.ok((await card.locator('.project-desc').textContent()).trim().length <= 110, 'Keep the gallery description short');
      assert.equal(await card.evaluate(el => {
        const previewBounds = el.querySelector('.project-thumb').getBoundingClientRect();
        return [...el.querySelectorAll('img')].every(image => {
          const bounds = image.getBoundingClientRect();
          return image.complete && image.naturalWidth > 0 && getComputedStyle(image).objectFit === 'contain' &&
            bounds.left >= previewBounds.left - 1 && bounds.right <= previewBounds.right + 1 &&
            bounds.top >= previewBounds.top - 1 && bounds.bottom <= previewBounds.bottom + 1;
        });
      }), true, 'Preview images must load and fit without cropping or overflowing');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#main-content').evaluate(el => el.scrollWidth > el.clientWidth), false);
  }
  assert.match(await page.locator('#card-windows-privacy-settings img').getAttribute('src'), /ia-grouping\.png$/);
  for (const id of ['card-siri-agent', 'card-fritter']) {
    assert.equal(await page.locator(`#${id} .project-screens img`).count(), 3);
    assert.ok(await page.locator(`#${id} .project-screens`).getAttribute('aria-label'));
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const card of await cards.all()) {
    const name = await card.locator('.project-name').textContent();
    await card.locator('.project-thumb').click();
    await page.waitForFunction(() => document.getElementById('project-window-status').hidden, null, { timeout: 15000 });
    assert.equal(await page.locator('#project-window-title').textContent(), name);
    await page.locator('#project-window-close').click();
    assert.equal(await card.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('.project-window-frame').count(), 0);
  }
}

async function verifyOpeningBanners(page) {
  const cards = await page.locator('.project-card').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(cards.length, 9);
  for (const [width, height] of [[1280, 900], [1280, 720], [375, 667], [320, 667]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    for (const id of cards) {
      await page.locator(`#${id}`).click();
      await page.waitForFunction(() => document.getElementById('project-window-status').hidden);
      const project = page.frameLocator(`.project-window-frame[data-project="${id}"]`);
      const banner = project.locator('.project-hero, .cc-hero');
      assert.equal(await banner.count(), 1, `${id} must have one opening banner`);
      assert.equal(await banner.locator('h1').count(), 1);
      await banner.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await banner.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const actions = banner.locator('.project-hero-actions a, .cc-actions a');
      const geometry = await actions.first().evaluate(el => {
        const bounds = el.getBoundingClientRect();
        return { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right, width: innerWidth, height: innerHeight };
      });
      assert.ok(geometry.top >= 0 && geometry.bottom <= geometry.height &&
        geometry.left >= 0 && geometry.right <= geometry.width,
      `${id} primary action requires scrolling at ${width}x${height}: ${JSON.stringify(geometry)}`);
      assert.equal(await project.locator('html').evaluate(() => document.documentElement.scrollWidth > innerWidth), false,
        `${id} opening banner overflows at ${width}px`);

      for (const action of await actions.all()) {
        const href = await action.getAttribute('href');
        assert.ok(href.startsWith('#'), `${id} should lead to its existing in-page work`);
        assert.equal(await project.locator(href).count(), 1, `${id} action target ${href} is missing or duplicated`);
        await action.click();
        assert.equal(await project.locator(href).evaluate(el => {
          const bounds = el.getBoundingClientRect();
          return bounds.top < innerHeight && bounds.bottom > 0;
        }), true, `${id} action did not reveal ${href}`);
      }

      if (width === 1280 && height === 900 && await project.locator('.game-player').count()) {
        const play = banner.locator('[data-game-open]');
        await play.click();
        if (new URL(page.url()).protocol === 'file:') {
          assert.match(await project.locator('.game-player-status').textContent(), /requires an HTTP or HTTPS preview/);
          assert.equal(await project.locator('.game-player-stage iframe').count(), 0);
        } else {
          const game = project.frameLocator('.game-player-stage iframe');
          await game.locator('button').first().waitFor();
          const startedAt = await game.locator('html').evaluate(() => performance.timeOrigin);
          await play.click();
          assert.equal(await project.locator('.game-player-stage iframe').count(), 1);
          assert.equal(await game.locator('html').evaluate(() => performance.timeOrigin), startedAt, 'Play must not restart a running game');
          await project.locator('.game-close').click();
          assert.equal(await project.locator('.game-player-stage iframe').count(), 0);
          await play.click();
          await project.frameLocator('.game-player-stage iframe').locator('button').first().waitFor();
          assert.equal(await project.locator('.game-player-stage iframe').count(), 1, 'Play must reopen a closed game');
        }
      }
      await page.locator('#project-window-close').click();
      assert.equal(await page.locator('.project-window-frame').count(), 0);
    }
    console.log(`Opening banners passed at ${width}x${height}`);
  }
}

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
    if (galleryOnly) {
      await page.goto(new URL('../../index.html', base).href);
      await verifyGalleryPreviews(page);
      assert.deepEqual(localErrors, [], 'The gallery and project windows should not throw.');
      results.push({ base, galleryPreviews: true, cardWindows: true });
      await context.close();
      continue;
    }
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
    assert.equal(await page.locator('.cc-back').first().isVisible(), true, 'Standalone pages must keep their back links');
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
    await page.goto(new URL('../../index.html', base).href);
    await verifyGalleryPreviews(page);
    assert.equal(await page.locator('.section-nav .nav-icon, .section-nav svg').count(), 0);
    assert.equal(await page.locator('.project-card').first().evaluate(el => getComputedStyle(el, '::after').content), '"\u2197"');
    for (const width of [320, 375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      let sectionBounds;
      for (const section of ['about', 'faith', 'thoughts']) {
        await page.locator(`#tab-${section}`).click();
        const bounds = await page.locator('.home-desktop .main-window').boundingBox();
        if (sectionBounds) assert.deepEqual(bounds, sectionBounds, `Section window size changes on ${section} at ${width}px`);
        sectionBounds = bounds;
        const tabWidths = await page.locator('.nav-item').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
        assert.ok(Math.max(...tabWidths) - Math.min(...tabWidths) < 1, `Unequal tab widths at ${width}px`);
        assert.equal(await page.locator('.nav-item').first().evaluate(el => getComputedStyle(el).borderRadius), '0px');
        const menuHeight = await page.locator('.home-menubar').evaluate(el => el.getBoundingClientRect().height);
        assert.ok(menuHeight <= (width > 600 ? 28 : 61), `Menu bar is too tall at ${width}px: ${menuHeight}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await page.locator('#main-content').evaluate(el => getComputedStyle(el).overflowY), 'auto');
      }
    }
    await page.locator('#tab-about').click();
    const galleryScroll = await page.locator('#main-content').evaluate(el => { el.scrollTop = 300; return el.scrollTop; });
    await page.locator('#tab-faith').click();
    assert.equal(await page.locator('#main-content').evaluate(el => el.scrollTop), 0);
    await page.locator('#tab-about').click();
    assert.equal(await page.locator('#main-content').evaluate(el => el.scrollTop), galleryScroll);
    await page.locator('#card-corner-cafe').click();
    await page.waitForFunction(() => document.getElementById('project-window-status').hidden);
    assert.equal(await page.locator('#project-window-link').count(), 0);
    assert.equal(await page.locator('.project-window-control > svg').count(), 3);
    assert.equal(await page.locator('.window-expand-icon').isVisible(), true);
    assert.equal(await page.locator('.window-restore-icon').isVisible(), false);
    const dots = await page.locator('.project-window-control').evaluateAll(nodes => nodes.map(node => {
      const bounds = node.getBoundingClientRect();
      return { x: bounds.x, width: bounds.width, height: bounds.height, color: getComputedStyle(node).backgroundColor };
    }));
    assert.deepEqual(dots.map(dot => [dot.width, dot.height]), [[14, 14], [14, 14], [14, 14]]);
    assert.deepEqual(dots.slice(1).map((dot, i) => dot.x - dots[i].x - dots[i].width), [9, 9]);
    assert.deepEqual(dots.map(dot => dot.color), ['rgb(255, 92, 96)', 'rgb(250, 200, 0)', 'rgb(53, 199, 89)']);
    const project = page.frameLocator('.project-window-frame[data-project="card-corner-cafe"]');
    assert.equal(await project.locator('.cc-back:visible').count(), 0, 'Embedded project windows must not duplicate close with back links');
    await project.locator('[data-demo-mode=drinker]').click();
    const windowDemo = project.frameLocator('#demo-stage iframe');
    await windowDemo.getByLabel('First name').fill('Window');
    await windowDemo.getByLabel('Last name').fill('Visitor');
    const projectTime = await project.locator('html').evaluate(() => performance.timeOrigin);
    const demoTime = await windowDemo.locator('html').evaluate(() => performance.timeOrigin);
    await project.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const floating = await page.locator('#project-window').boundingBox();
    await page.locator('#project-window-maximize').click();
    assert.equal(await page.locator('#project-window-maximize').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.window-expand-icon').isVisible(), false);
    assert.equal(await page.locator('.window-restore-icon').isVisible(), true);
    await page.waitForFunction(() => {
      const bounds = document.getElementById('project-window').getBoundingClientRect();
      return bounds.width === innerWidth && bounds.height === innerHeight;
    });
    assert.equal(await page.locator('#project-window').evaluate(el => el.getBoundingClientRect().width), 1280);
    assert.equal(context.pages().length, 1, 'Maximize must not open another tab');
    await page.locator('#project-window-maximize').click();
    await page.waitForFunction(expected => {
      const bounds = document.getElementById('project-window').getBoundingClientRect();
      return bounds.width === expected.width && bounds.height === expected.height;
    }, floating);
    assert.deepEqual(await page.locator('#project-window').boundingBox(), floating);
    await project.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const projectScroll = await project.locator('html').evaluate(() => scrollY);
    const scrollAnchor = await project.locator('#prototype').evaluate(el => el.getBoundingClientRect().top);
    await page.locator('#project-window-minimize').click();
    assert.equal(await page.locator('#project-window').isVisible(), false);
    assert.equal(await page.locator('.project-window-frame').count(), 1);
    await page.locator('#card-windows-privacy-settings').click();
    await page.waitForFunction(() => document.getElementById('project-window-status').hidden);
    await page.locator('#project-window-minimize').click();
    assert.equal(await page.locator('.project-dock-item:not([hidden])').count(), 2);
    await page.locator('.project-dock-item[data-project="card-corner-cafe"]').click();
    assert.equal(await windowDemo.getByLabel('First name').inputValue(), 'Window');
    assert.equal(await windowDemo.getByLabel('Last name').inputValue(), 'Visitor');
    assert.equal(await project.locator('html').evaluate(() => performance.timeOrigin), projectTime);
    assert.equal(await windowDemo.locator('html').evaluate(() => performance.timeOrigin), demoTime);
    await project.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await project.locator('html').evaluate(() => scrollY), projectScroll,
      `Prototype viewport position: ${scrollAnchor} before, ${await project.locator('#prototype').evaluate(el => el.getBoundingClientRect().top)} after`);
    await page.locator('#project-window-close').click();
    assert.equal(await page.locator('.project-window-frame[data-project="card-corner-cafe"]').count(), 0);
    await page.locator('.project-dock-item[data-project="card-windows-privacy-settings"]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.project-window-frame').count(), 0);
    assert.equal(await page.locator('#project-dock').isVisible(), false);
    await verifyOpeningBanners(page);
    assert.deepEqual(localErrors, [], 'The local app and case study should not throw.');
    results.push({ base, fullTabOrder: true, iframeOrder: true, iframeHandshake: true, teamQueue: true, narrowMilkChoices: true, figmaTabControls: true, projectWindowState: true, consistentSections: true, referenceWindowControls: true, compactMenuBar: true, embeddedNavigation: true, openingBanners: true, gameBannerActions: true, galleryPreviews: true });
    await context.close();
  }
  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await browser.close();
}
