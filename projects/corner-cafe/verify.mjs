import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin = process.env.PORTFOLIO_PREVIEW || 'http://127.0.0.1:4174';
const route = '/projects/corner-cafe/';
const galleryOnly = process.argv.includes('--gallery');
const windowsOnly = process.argv.includes('--windows');
const casePresentationOnly = process.argv.includes('--case-presentation');

async function verifyCasePresentation(page) {
  // The portfolio galleries and demo must work even when the third-party viewer is blocked.
  await page.route('https://embed.figma.com/**', route => route.abort('blockedbyclient'));
  const menu = page.getByRole('navigation', { name: 'Case study sections' });
  const active = hash => page.waitForFunction(expected => {
    const current = document.querySelectorAll('.cc-jump-links [aria-current="location"]');
    return current.length === 1 && current[0].hash === expected;
  }, hash);
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(() => scrollTo(0, 0));
    await active('#use-the-app');
    const cover = await page.locator('.cc-hero-art img').evaluate(async img => {
      await img.decode();
      const art = img.getBoundingClientRect(), text = document.querySelector('.cc-hero-copy').getBoundingClientRect();
      return { ratio: img.naturalWidth / img.naturalHeight, right: art.right, beside: art.left >= text.right, below: art.top >= text.bottom };
    });
    assert.equal(cover.ratio, 680 / 520);
    assert.ok(cover.right <= width && (width > 760 ? cover.beside : cover.below));

    await menu.getByRole('link', { name: 'The workflow' }).click();
    await active('#workflow');
    const nav = await menu.boundingBox(), section = await page.locator('#workflow').boundingBox();
    assert.ok(Math.abs(nav.y) < 2 && section.y >= nav.y + nav.height - 1, 'The pinned index must not cover the target');
    const historyLength = await page.evaluate(() => history.length);
    await page.locator('#system').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await active('#system');
    assert.deepEqual(await page.evaluate(() => [location.hash, history.length]), ['#workflow', historyLength]);
    await page.locator('#experience-title').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await active('#workflow');
  }
  const deepLink = new URL(page.url());
  deepLink.hash = 'system';
  await page.setViewportSize({ width: 637, height: 510 });
  await page.goto('about:blank');
  await page.goto(deepLink.href, { waitUntil: 'domcontentloaded' });
  await active('#system');
  await menu.getByRole('link', { name: 'Try it' }).press('Enter');
  await active('#prototype');
  await menu.getByRole('link', { name: 'Figma' }).click();
  await active('#figma');
  await page.goBack();
  await active('#prototype');
  await page.goForward();
  await active('#figma');

  const system = page.getByRole('tab', { name: 'Design system', exact: true });
  assert.equal(await system.getAttribute('aria-selected'), 'true');
  const panel = page.getByRole('tabpanel', { name: 'Design system' });
  const source = new URL(await panel.locator('iframe').getAttribute('src'));
  const components = 'https://www.figma.com/design/O3S4nOxcySQw2P9i1ViK7x?node-id=3-2';
  assert.equal(source.origin, 'https://embed.figma.com');
  assert.equal(source.pathname, new URL(components).pathname);
  assert.equal(source.searchParams.get('node-id'), '3-2', 'Embed Local Components, not the separate review library');
  assert.equal(await panel.getByRole('link', { name: /Open component states/ }).getAttribute('href'), components);
  assert.equal(await panel.getByRole('link', { name: /Open counter foundations/ }).getAttribute('href'),
    'https://www.figma.com/design/zxHthtAJYiEfssRXADRmkI?node-id=78-24');
  const examples = panel.getByRole('list', { name: 'Examples from the current cup components' }).getByRole('img');
  assert.deepEqual(await examples.evaluateAll(imgs => imgs.map(img => img.getAttribute('src'))), [
    'media/cup-states/hot/coffee.webp', 'media/cup-states/iced/pour-2.webp', 'media/cup-states/hot/milk-pour.webp',
  ]);
  for (const example of await examples.all()) {
    await example.scrollIntoViewIfNeeded();
    await example.evaluate(img => img.decode());
    assert.ok(await example.isVisible(), 'Current artwork must be visible even when the embed is blocked');
  }
  await system.press('ArrowRight');
  const app = page.getByRole('tabpanel', { name: 'App walkthrough' });
  const picker = app.getByLabel('Choose a screen');
  const keys = await picker.locator('option').evaluateAll(options => options.map(o => o.value));
  assert.equal(new Set(keys).size, 47);
  assert.ok(await app.getByRole('button', { name: 'Previous' }).isDisabled());
  await app.getByRole('button', { name: 'Next' }).click();
  assert.equal(await picker.inputValue(), 'cups');
  await picker.selectOption('labels-selected');
  assert.ok(await app.getByRole('button', { name: 'Next' }).isDisabled());
  assert.match(await app.getByRole('status').textContent(), /Screen 47 of 47/);
  assert.equal(await app.getByRole('link', { name: /View full-size screen/ }).getAttribute('href'), 'media/app-screens/labels-selected.webp');
  await page.evaluate(async keys => {
    await Promise.all(keys.map(async key => {
      const image = new Image();
      image.src = `media/app-screens/${key}.webp`;
      await image.decode();
      if (image.naturalWidth < 390 || image.naturalHeight < 844) throw Error(`Missing or undersized screen: ${key}`);
    }));
  }, keys);
  assert.equal(await app.locator('iframe').getAttribute('src'), null);
  await app.locator('summary').click();
  const live = new URL(await app.locator('iframe[src]').getAttribute('src'));
  assert.equal(live.origin + live.pathname, 'https://embed.figma.com/proto/O3S4nOxcySQw2P9i1ViK7x');
  assert.ok(!live.searchParams.has('starting-point-node-id') && !live.searchParams.has('node-id'));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('tab', { name: 'App walkthrough' }).press('ArrowRight');
  const cups = page.getByRole('tabpanel', { name: 'Cup components' });
  assert.equal(await cups.getByRole('link', { name: /Open component states/ }).getAttribute('href'), components);
  for (const temp of ['Hot', 'Iced']) {
    await cups.getByRole('radio', { name: temp, exact: true }).check();
    const paths = await cups.locator('li img').evaluateAll(images => images.map(img => img.getAttribute('src')));
    assert.equal(new Set(paths).size, 18);
    assert.ok(paths.every(src => src.startsWith(`media/cup-states/${temp.toLowerCase()}/`)));
    await page.evaluate(paths => Promise.all(paths.map(src => { const img = new Image(); img.src = src; return img.decode(); })), paths);
  }
  await page.getByRole('tab', { name: 'Cup components' }).press('End');
  const motion = page.getByRole('tabpanel', { name: 'Motion storyboard' });
  assert.equal(await motion.locator('li a').count(), 5);
  const pour = motion.getByRole('img', { name: 'Tilted oat carton pouring into the Mocha' });
  await pour.scrollIntoViewIfNeeded();
  await pour.evaluate(img => img.decode());
  assert.ok(await pour.isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile galleries must fit horizontally.');
  await page.locator('#system [data-show-system]').click();
  assert.ok(await panel.isVisible());
}

async function verifyWindowsCaseStudy(page, homeURL) {
  const projectURL = new URL('projects/windows-privacy-settings/windows-privacy-settings.html', homeURL).href;
  await page.goto(projectURL, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.back-link').isVisible(), true);
  const story = page.locator('.case-study');
  const wordCount = (await story.innerText()).trim().split(/\s+/).length;
  assert.ok(wordCount >= 650 && wordCount <= 800, `Windows body must contain 650–800 words, got ${wordCount}`);
  assert.equal(await story.locator('.design-decision').count(), 3);
  assert.equal(await story.locator('figure').count(), 5);
  assert.equal(await story.locator('.screenshot-figure img').count(), 2);
  assert.equal(await story.locator('.screen-pin').count(), 2);
  assert.equal(await story.locator('.state-grid > li').count(), 5);
  assert.equal(await story.locator('table').count(), 0);
  assert.deepEqual(await story.locator('.metric-row dt').allTextContents(), ['+10%', '−1.57s', '6 groups']);
  const paragraphLengths = await story.locator('p').evaluateAll(nodes => nodes.map(node => node.textContent.trim().split(/\s+/).length));
  assert.ok(paragraphLengths.every(length => length <= 80), 'Keep Windows paragraphs short and scannable');
  for (const caption of await story.locator('.explanatory-figure > figcaption').allTextContents()) {
    assert.match(caption, /schematic|illustrat/i);
    assert.match(caption, /not/i, 'Explain that diagrams are not original design artifacts');
  }

  async function checkLayout(root) {
    for (const image of await root.locator('.case-study img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(el => el.decode());
      assert.equal(await image.evaluate(el => {
        const style = getComputedStyle(el);
        const width = el.clientWidth;
        const height = el.clientHeight;
        return el.naturalWidth > 0 && style.height !== '0px' &&
          Number(el.getAttribute('width')) === el.naturalWidth &&
          Number(el.getAttribute('height')) === el.naturalHeight &&
          Math.abs(height - width * el.naturalHeight / el.naturalWidth) < 2;
      }), true, 'Windows screenshots must remain complete and proportional');
    }
    assert.equal(await root.locator('html').evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await root.locator('.main-content').evaluate(el => el.scrollWidth > el.clientWidth), false);
    assert.equal(await root.locator('.layout-fixed .layout-label').evaluate(el => el.scrollWidth > el.clientWidth), true,
      'The fixed-height illustration must actually demonstrate clipped text');
    assert.equal(await root.locator('.layout-flexible .layout-label').evaluate(el => el.scrollWidth <= el.clientWidth), true);
    const sampleHeights = await root.locator('.layout-sample').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
    assert.ok(sampleHeights[1] > sampleHeights[0], 'The flexible illustration must grow to show the full label');
    for (const action of await root.locator('.project-hero-actions a').all()) {
      const target = await action.getAttribute('href');
      assert.equal(await root.locator(target).count(), 1);
      await action.click();
      assert.equal(await root.locator(target).evaluate(el => {
        const bounds = el.getBoundingClientRect();
        const scroller = el.closest('.main-content').getBoundingClientRect();
        return bounds.top >= Math.max(0, scroller.top) && bounds.bottom <= Math.min(innerHeight, scroller.bottom);
      }), true, `The Windows banner action must reveal ${target}`);
    }
  }

  for (const width of [1280, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await checkLayout(page);
  }

  await page.goto(homeURL, { waitUntil: 'domcontentloaded' });
  for (const width of [1280, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#card-windows-privacy-settings').click();
    await page.waitForFunction(() => document.getElementById('project-window-status').hidden);
    const project = page.frameLocator('.project-window-frame');
    assert.equal(await project.locator('.back-link').isVisible(), false);
    await checkLayout(project);
    const startedAt = await project.locator('html').evaluate(() => performance.timeOrigin);
    await page.locator('#project-window-maximize').click();
    await page.locator('#project-window-minimize').click();
    await page.locator('.project-dock-item').click();
    assert.equal(await project.locator('html').evaluate(() => performance.timeOrigin), startedAt);
    await page.locator('#project-window-close').focus();
    await page.keyboard.press('Escape');
    await page.locator('#project-window').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#card-windows-privacy-settings').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('.project-window-frame').count(), 0);
  }
  console.log(`Windows case study passed: ${wordCount} words, three decisions, five figures, standalone and embedded layouts`);
}

async function verifyGraceSection(page) {
  const grace = page.locator('#section-grace');
  const trigger = page.locator('#tab-grace');
  const content = page.locator('#main-content');
  assert.equal(await page.locator('.about-window, [popover]').count(), 0, 'The introduction must be a section, not a popup');
  assert.equal(await grace.isVisible(), false);
  assert.equal(await page.locator('#tab-about').getAttribute('aria-selected'), 'true');
  assert.deepEqual(await page.locator('.nav-item').evaluateAll(nodes => nodes.map(node => node.dataset.section)),
    ['grace', 'about', 'thoughts']);
  assert.equal(await page.locator('#tab-faith, #section-faith').count(), 0);
  assert.equal(await page.locator('#section-about .profile-section, #section-about .about-bio').count(), 0);
  assert.equal(await page.locator('#section-about > h1').textContent(), 'projects');
  assert.equal(await grace.locator('.grace-intro > .about-bio').count(), 2);
  assert.equal(await grace.locator('#grace-faith .about-bio').count(), 3);
  assert.equal(await grace.locator('#grace-faith blockquote').count(), 2);
  assert.equal(await grace.locator('#grace-faith h2').count(), 1);
  assert.equal(await grace.locator('.tag').count(), 5);

  for (const [width, height] of [[1280, 900], [375, 667], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.locator('#tab-about').click();
    await content.evaluate(el => { el.scrollTop = 0; });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const firstPreview = await page.locator('.project-thumb').first().boundingBox();
    const viewport = await content.boundingBox();
    assert.ok(firstPreview.y - viewport.y < 120, `Projects should start near the top at ${width}px`);
    assert.ok(firstPreview.y + firstPreview.height <= viewport.y + viewport.height,
      `The first preview must fit before scrolling at ${width}x${height}`);

    const windowBounds = await page.locator('.home-desktop .main-window').boundingBox();
    for (const section of ['grace', 'thoughts', 'about']) {
      await page.locator(`#tab-${section}`).click();
      assert.equal(await page.locator(`#section-${section}`).isVisible(), true);
      assert.equal(await page.locator('.section:not([hidden])').count(), 1);
      assert.equal(await page.locator('.nav-item[aria-selected="true"]').count(), 1);
      assert.deepEqual(await page.locator('.home-desktop .main-window').boundingBox(), windowBounds,
        `Main window size changes in ${section} at ${width}px`);
    }

    await page.locator('#tab-about').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    assert.equal(await grace.isVisible(), true);
    assert.equal(await page.locator('#window-title').textContent(), 'grace.dev');
    await grace.locator('img').evaluate(image => image.decode());
    await grace.locator('#grace-faith > .about-bio').last().scrollIntoViewIfNeeded();
    const lastParagraph = await grace.locator('#grace-faith > .about-bio').last().boundingBox();
    assert.ok(lastParagraph.y >= viewport.y && lastParagraph.y + lastParagraph.height <= viewport.y + viewport.height,
      `The complete moved content must be reachable at ${width}px`);
    assert.equal(await content.evaluate(el => el.scrollWidth > el.clientWidth), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press('End');
    assert.equal(await page.locator('#tab-thoughts').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await trigger.getAttribute('aria-selected'), 'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-about').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await trigger.getAttribute('aria-selected'), 'true');
  }

  for (const section of ['grace', 'about', 'thoughts']) {
    await page.locator(`#tab-${section}`).click();
    const scrollTop = await content.evaluate(el => { el.scrollTop = 160; return el.scrollTop; });
    await page.locator(`#tab-${section === 'grace' ? 'about' : 'grace'}`).click();
    await page.locator(`#tab-${section}`).click();
    assert.equal(await page.locator(`#tab-${section}`).getAttribute('aria-selected'), 'true');
    assert.equal(await content.evaluate(el => el.scrollTop), scrollTop);
  }
  await page.locator('#tab-about').click();
}

async function verifyGalleryPreviews(page) {
  await verifyGraceSection(page);
  const cards = page.locator('.project-card');
  const subtitle = page.locator('.project-gallery-subtitle');
  const hint = page.locator('#project-gallery-hint');
  assert.equal(await cards.count(), 9);
  assert.equal(await subtitle.textContent(), "things i've built and shipped");
  assert.equal(await hint.evaluate(el => el.tagName), 'P');
  assert.equal(await subtitle.evaluate(el => el.nextElementSibling?.id), 'project-gallery-hint');
  assert.match(await page.locator('#section-about').textContent(),
    /things i've built and shipped\s+select a card to open a project window/,
    'Subtitle and instruction must remain separated in plain text');
  for (const width of [1280, 768, 600, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await subtitle.scrollIntoViewIfNeeded();
    const subtitleBounds = await subtitle.boundingBox();
    const hintBounds = await hint.boundingBox();
    const gap = hintBounds.y - subtitleBounds.y - subtitleBounds.height;
    assert.ok(Math.abs(gap - 5) < 1, `Subtitle and instruction need a 5px gap at ${width}px`);
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
    if (casePresentationOnly) {
      await page.goto(`${base}corner-cafe.html`);
      await verifyCasePresentation(page);
      assert.deepEqual(localErrors, []);
      results.push({ base, casePresentation: true });
      await context.close();
      continue;
    }
    if (windowsOnly) {
      await verifyWindowsCaseStudy(page, new URL('../../index.html', base).href);
      assert.deepEqual(localErrors, [], 'The Windows case study should not throw.');
      results.push({ base, windowsCaseStudy: true });
      await context.close();
      continue;
    }
    if (galleryOnly) {
      await page.goto(new URL('../../index.html', base).href);
      await verifyGalleryPreviews(page);
      assert.deepEqual(localErrors, [], 'The gallery and project windows should not throw.');
      results.push({ base, galleryPreviews: true, cardWindows: true, graceSection: true });
      await context.close();
      continue;
    }
    await page.goto(`${base}play/index.html?demo=drinker`);
    assert.equal(await page.getByLabel('First name').getAttribute('placeholder'), null);
    await page.getByLabel('First name').fill('Demo');
    await page.getByLabel('Last name').fill('Sipper');
    await page.locator('#name-form button[type=submit]').click();
    await page.locator('[data-action=temperature][data-value=hot]').click();
    await page.locator('[data-action=next]').click();
    await page.locator('[data-action=drink][data-value=Latte]').click();
    await page.locator('[data-action=next]').click();
    await page.locator('[data-action=syrup][data-value=caramel]').click();
    const syrup = page.locator('.station-photo');
    const baseSurface = Number(await syrup.getAttribute('data-surface'));
    assert.equal(await syrup.getAttribute('data-amount'), '0');
    await page.getByRole('button', { name: 'Add one pump' }).click();
    assert.ok(Number(await syrup.getAttribute('data-surface')) < baseSurface);
    await page.locator('[data-action=next]').click();
    await page.locator('[data-action=milk][data-value=soy]').click();
    assert.equal(await page.locator('.milk-photo').getAttribute('data-filled'), '1');
    assert.equal(await page.locator('.milk-pose use').getAttribute('href'), '#milk-photo-soy');
    for (const width of [390, 280, 240]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.locator('.milk-option').evaluateAll(nodes => nodes.map(card => {
        const box = card.getBoundingClientRect();
        return { fits: box.width >= 44 && box.height >= 44, inViewport: box.left >= 0 && box.right <= innerWidth };
      }));
      assert.equal(geometry.length, 3);
      assert.ok(geometry.every(item => item.fits && item.inViewport), `Milk choices clipped at ${width}px`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Demo overflow at ${width}px for ${base}`);
    }
    await page.locator('[data-action=submit-order]').click();
    await page.locator('.pickup-ticket h1').waitFor();
    assert.deepEqual(await page.locator('.recipe-lines dd').allTextContents(), ['1 espresso shot', 'Soy milk', '1 pump of caramel syrup']);
    assert.equal(await page.locator('.pickup-ticket .order-state').textContent(), 'Preparing');
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
    await drinker.locator('.pickup-ticket h1').waitFor();
    assert.deepEqual(await drinker.locator('.recipe-lines dd').allTextContents(), ['2 espresso shots + water', 'None']);
    assert.equal(await drinker.locator('.error-banner').count(), 0);
    await page.locator('#close-demo').click();
    await page.locator('[data-demo-mode=team]').click();
    await page.waitForFunction(() => document.querySelector('#demo-status').textContent.startsWith('Team demo ready.'));
    const team = page.frameLocator('#demo-stage iframe');
    assert.equal(await team.locator('main .station-menu .station-link').count(), 3);
    await page.locator('#close-demo').click();
    assert.equal(await page.locator('#demo-stage iframe').count(), 0);
    await verifyCasePresentation(page);
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
      for (const section of ['about', 'grace', 'thoughts']) {
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
    await page.locator('#tab-grace').click();
    const graceScroll = await page.locator('#main-content').evaluate(el => { el.scrollTop = 120; return el.scrollTop; });
    await page.locator('#tab-about').click();
    const galleryScroll = await page.locator('#main-content').evaluate(el => { el.scrollTop = 300; return el.scrollTop; });
    await page.locator('#tab-grace').click();
    assert.equal(await page.locator('#main-content').evaluate(el => el.scrollTop), graceScroll);
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
    const index = project.getByRole('navigation', { name: 'Case study sections' });
    await index.getByRole('link', { name: 'The workflow' }).click();
    await index.locator('[href="#workflow"][aria-current="location"]').waitFor();
    assert.ok(await project.locator('#workflow').evaluate(section => {
      const nav = document.querySelector('.cc-jump-links').getBoundingClientRect();
      const top = section.getBoundingClientRect().top;
      return Math.abs(nav.top) < 2 && top >= nav.bottom - 1 && top < innerHeight;
    }), 'The project window should pin the index without hiding the heading');
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
    await verifyWindowsCaseStudy(page, new URL('../../index.html', base).href);
    assert.deepEqual(localErrors, [], 'The local app and case study should not throw.');
    results.push({ base, fullTabOrder: true, iframeOrder: true, iframeHandshake: true, teamQueue: true, narrowMilkChoices: true, figmaTabControls: true, projectWindowState: true, consistentSections: true, referenceWindowControls: true, compactMenuBar: true, embeddedNavigation: true, openingBanners: true, gameBannerActions: true, galleryPreviews: true, graceSection: true });
    await context.close();
  }
  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await browser.close();
}
