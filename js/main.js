/* ============================================================
   grace-portfolio — main.js
   ============================================================ */

/* ── Section switcher ──────────────────────────────────────
   Nav items are real <button role="tab"> elements. This wires
   them up with proper ARIA state, roving tabindex, and arrow-key
   navigation so the whole site is keyboard operable.
   ─────────────────────────────────────────────────────────── */

const SECTION_TITLES = {
  grace:    'grace.dev',
  about:    'portfolio',
  thoughts: 'scribbles',
};

// Portfolio keeps the clean URL; other sections get a shareable hash.
const SECTION_HASHES = {
  grace:    'aboutme',
  about:    '',
  thoughts: 'productideas',
};

const sectionScroll = new Map();

function sectionFromHash(hash) {
  const fragment = hash.replace(/^#/, '');
  if (!fragment || fragment.startsWith('card-') || document.getElementById(fragment)?.matches('.projects-grid > h2')) return 'about';
  return Object.keys(SECTION_HASHES).find(name => SECTION_HASHES[name] === fragment) ?? null;
}

function syncSectionUrl(name, mode) {
  if (mode === 'none' || sectionFromHash(location.hash) === name) return;
  const url = new URL(location.href);
  url.hash = SECTION_HASHES[name] ?? '';
  history[mode === 'replace' ? 'replaceState' : 'pushState'](null, '', url.href);
}

function syncWindowDock() {
  const dock = document.getElementById('project-dock');
  dock.hidden = !dock.querySelector('.project-dock-item:not([hidden])');
}

function showSection(name, el, historyMode = 'push') {
  const tab = el || document.querySelector(`.nav-item[data-section="${name}"]`);
  const panel = document.getElementById('section-' + name);
  if (!tab || !panel) return;
  syncSectionUrl(name, historyMode);
  const content = document.getElementById('main-content');
  const previous = document.querySelector('.section.active');
  if (previous && previous !== panel) sectionScroll.set(previous.id, content.scrollTop);

  // Deactivate all panels and tabs
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.hidden = true;
  });
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.setAttribute('aria-selected', 'false');
    n.tabIndex = -1;
  });

  // Activate the chosen panel and tab
  panel.classList.add('active');
  panel.hidden = false;
  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  tab.tabIndex = 0;
  if (previous !== panel) content.scrollTop = sectionScroll.get(panel.id) ?? 0;

  // Update the window titlebar
  document.getElementById('window-title').textContent = SECTION_TITLES[name] ?? name;
  if (name !== 'thoughts') document.getElementById('thought-reader').close();
}

/* ── Wire up tabs: click + arrow keys ── */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = Array.from(document.querySelectorAll('.nav-item[data-section]'));
  tabs.forEach((tab, i) => {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;

    tab.addEventListener('click', () => showSection(tab.dataset.section, tab));

    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      let next = null;

      if (e.key in keys) next = (i + keys[e.key] + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;

      e.preventDefault();
      showSection(tabs[next].dataset.section, tabs[next]);
      tabs[next].focus();
    });
  });

  // Restore section from sessionStorage (set by project-page back links)
  const pending = sessionStorage.getItem('openSection');
  if (pending) {
    sessionStorage.removeItem('openSection');
    const target = document.querySelector(`.nav-item[data-section="${pending}"]`);
    if (target) showSection(pending, target, 'replace');
  }

  const linked = sectionFromHash(location.hash);
  if (linked && linked !== 'about') showSection(linked, null, 'none');

  // A gallery anchor may be inside a hidden tab when traversing history.
  window.addEventListener('popstate', () => {
    const name = sectionFromHash(location.hash);
    if (!name) return;
    if (!document.getElementById('section-' + name).classList.contains('active')) {
      showSection(name, null, 'none');
    }
    if (name === 'about' && location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
    }
  });
});

/* ── Live clock ─────────────────────────────────────────────
   Renders a real-time clock in the menu bar.
   Updates every 30 seconds.
   ─────────────────────────────────────────────────────────── */

function updateClock() {
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    hour:    'numeric',
    minute:  '2-digit',
  });
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = formatted;
}

updateClock();
setInterval(updateClock, 30_000);

/* ── Scribbles ── */

const SCRIBBLES_CODE_SNIPPETS = [
  'const { fn, ...cfg } = ctx ?? {};',
  'const run = (...args) => fn?.(...args);',
  'type Ref<T> = { v: T; ref?: Ref<T> };',
  'type Fn<T> = (...args: T[]) => Promise<T>;',
  'const ast = src?.trim()?.split(/\\s+/);',
  'if (ctx !== null && ctx?.ref) { fn(ctx); }',
  'const out = [...buf].map((x) => ({ ...x }));',
  'await fn?.({ ...cfg, ...opts });',
  'const get = (k) => cfg?.[k] ?? null;',
  'type Map<T> = { [K in keyof T]?: T[K] };',
  'for (const [k, v] of map) { fn?.(k, v); }',
  'const chain = (a) => (b) => fn?.(a)?.(b);',
];

function initScribblesCode(section) {
  const canvas = document.getElementById('thoughts-code-scan');
  const context = canvas.getContext('2d');
  const base = document.createElement('canvas');
  const baseContext = base.getContext('2d');
  if (!context || !baseContext) {
    console.error('Scribbles code background unavailable: Canvas 2D could not be initialized.');
    return;
  }

  const streams = SCRIBBLES_CODE_SNIPPETS.map(code => code.replaceAll(' ', ''));
  const palette = ['#a0508a', '#af6d85', '#be7b9b', '#a8687c', '#b77da2'];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let columns = 1;
  let rows = 1;
  let inView = false;
  let frameId = null;
  let previousTime = null;
  let lastPaint = -Infinity;
  let elapsed = 0;

  function drawColumn(target, column, alpha, glow = 0) {
    const code = streams[column % streams.length];
    const color = palette[column % palette.length];
    target.save();
    target.font = '10px ui-monospace, "SFMono-Regular", Menlo, monospace';
    target.textAlign = 'center';
    target.textBaseline = 'middle';
    target.globalAlpha = alpha;
    target.fillStyle = color;
    target.shadowColor = color;
    target.shadowBlur = glow;
    for (let row = 0; row < rows; row++) {
      target.fillText(
        code[(row + column * 3) % code.length],
        (column + .5) * width / columns,
        (row + .5) * height / rows,
      );
    }
    target.restore();
  }

  function paint() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(base, 0, 0);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    // Reuse the fixed glyphs, adding light only to the one or two active columns.
    context.globalCompositeOperation = 'lighter';
    const scanColumn = elapsed / 6400 * columns;
    for (let column = 0; column < columns; column++) {
      const distance = Math.abs(column - scanColumn);
      const light = Math.max(0, 1 - Math.min(distance, columns - distance));
      if (light > 0) drawColumn(context, column, .56 * light, light * 2);
    }
    context.globalCompositeOperation = 'source-over';
  }

  function shouldAnimate() {
    return width > 0 && height > 0 && inView && !section.hidden &&
      section.dataset.motion === 'on' && !document.hidden;
  }

  function stop() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
    lastPaint = -Infinity;
  }

  function animate(timestamp) {
    frameId = null;
    if (!shouldAnimate()) {
      previousTime = null;
      return;
    }
    if (previousTime !== null) elapsed = (elapsed + timestamp - previousTime) % 6400;
    previousTime = timestamp;
    if (timestamp - lastPaint >= 1000 / 30) {
      paint();
      lastPaint = timestamp;
    }
    frameId = requestAnimationFrame(animate);
  }

  function syncMotion() {
    if (shouldAnimate()) {
      if (frameId === null) frameId = requestAnimationFrame(animate);
    } else {
      stop();
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      stop();
      return;
    }
    const nextRatio = Math.min(window.devicePixelRatio, 2);
    if (width === bounds.width && height === bounds.height && pixelRatio === nextRatio) {
      syncMotion();
      return;
    }
    width = bounds.width;
    height = bounds.height;
    pixelRatio = nextRatio;
    columns = Math.max(1, Math.floor(width / 10));
    rows = Math.max(1, Math.floor(height / 10));
    for (const layer of [canvas, base]) {
      layer.width = Math.max(1, Math.round(width * pixelRatio));
      layer.height = Math.max(1, Math.round(height * pixelRatio));
    }
    baseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    for (let column = 0; column < columns; column++) drawColumn(baseContext, column, .25);
    paint();
    syncMotion();
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncMotion();
  }).observe(canvas);
  new MutationObserver(syncMotion).observe(section, {
    attributes: true,
    attributeFilter: ['hidden', 'data-motion'],
  });
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', syncMotion);
  resize();
}

document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('section-thoughts');
  const reader = document.getElementById('thought-reader');
  const readerBody = reader.querySelector('.thought-reader-body');
  const maximize = document.getElementById('thought-reader-maximize');
  const latest = document.getElementById('thoughts-read-latest');
  const entry = document.getElementById('thoughts-entry');
  const dockItems = document.getElementById('project-dock-items');
  const motionButton = document.getElementById('thoughts-motion');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const restore = document.createElement('button');
  restore.type = 'button';
  restore.id = 'thought-reader-restore';
  restore.className = 'project-dock-item';
  restore.setAttribute('aria-haspopup', 'dialog');
  restore.setAttribute('aria-controls', reader.id);
  let readerOpener = latest;
  let readerScroll = 0;
  let motionEnabled = true;

  function openReader(trigger) {
    if (trigger !== restore) readerOpener = trigger;
    trigger.focus({ preventScroll: true });
    reader.showModal();
    readerBody.scrollTop = readerScroll;
    restore.remove();
    syncWindowDock();
  }

  function closeReader() {
    readerScroll = readerBody.scrollTop;
    reader.close();
    restore.remove();
    syncWindowDock();
    const target = readerOpener.getClientRects().length
      ? readerOpener
      : document.querySelector('.nav-item[aria-selected="true"]');
    target.focus({ preventScroll: true });
  }

  [latest, entry].forEach(trigger => {
    trigger.hidden = false;
    trigger.addEventListener('click', () => openReader(trigger));
  });
  restore.addEventListener('click', () => openReader(restore));
  document.getElementById('thought-reader-minimize').addEventListener('click', () => {
    readerScroll = readerBody.scrollTop;
    const title = document.getElementById('thought-reader-title').textContent.trim();
    restore.textContent = title;
    restore.setAttribute('aria-label', `Restore ${title}`);
    restore.title = `Restore ${title}`;
    reader.close();
    dockItems.append(restore);
    syncWindowDock();
    restore.focus({ preventScroll: true });
  });
  maximize.addEventListener('click', () => {
    const maximized = reader.classList.toggle('is-maximized');
    const label = maximized ? 'Restore entry window size' : 'Maximize entry window';
    maximize.setAttribute('aria-pressed', String(maximized));
    maximize.setAttribute('aria-label', label);
    maximize.title = label;
  });
  document.getElementById('thought-reader-close').addEventListener('click', closeReader);
  reader.addEventListener('cancel', event => {
    event.preventDefault();
    closeReader();
  });
  reader.addEventListener('click', event => {
    if (event.target !== reader) return;
    const bounds = reader.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) closeReader();
  });

  function updateMotion() {
    const enabled = motionEnabled && !reducedMotion.matches;
    section.dataset.motion = enabled ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(enabled));
    motionButton.disabled = reducedMotion.matches;
    document.getElementById('thoughts-motion-label').textContent = reducedMotion.matches
      ? 'Reduced motion'
      : `Motion ${enabled ? 'on' : 'off'}`;
  }
  motionButton.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    updateMotion();
  });
  reducedMotion.addEventListener('change', updateMotion);

  motionButton.hidden = false;
  updateMotion();
  initScribblesCode(section);
});
