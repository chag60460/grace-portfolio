/* ============================================================
   grace-portfolio — main.js
   ============================================================ */

/* ── Section switcher ──────────────────────────────────────
   Nav items are real <button role="tab"> elements. This wires
   them up with proper ARIA state, roving tabindex, and arrow-key
   navigation so the whole site is keyboard operable.
   ─────────────────────────────────────────────────────────── */

const SECTION_TITLES = {
  about:    'portfolio',
  thoughts: 'scribbles',
  faith:    'faith',
};

const sectionScroll = new Map();

function showSection(name, el) {
  const tab = el || document.querySelector(`.nav-item[data-section="${name}"]`);
  const panel = document.getElementById('section-' + name);
  if (!tab || !panel) return;
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
    if (target) showSection(pending, target);
  }
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

/* ── Scribbles journal ── */

const THOUGHT_ENTRIES = [
  {
    date: '2026-07-26',
    title: 'A step toward my dream job',
    category: 'small beginnings',
    paragraphs: ['I applied to my dream job'],
  },
  {
    date: '2026-04-08',
    title: 'Facing the unknown',
    category: 'an honest day',
    paragraphs: ['Feeling lost about the future but faced my emotions honestly'],
  },
  {
    date: '2026-04-07',
    title: 'Showing up & learning',
    category: 'notes & connections',
    paragraphs: ['Went to an EiC networking event and learned some very helpful tips'],
  },
  {
    date: '2026-04-06',
    title: 'A linked list, finally reversed',
    category: 'something clicked',
    paragraphs: ['Figured out how to reverse a linked list for the first time ever!'],
  },
  {
    date: '2026-04-05',
    title: 'Easter, friends & a sunset',
    category: 'life lately',
    paragraphs: ['Easter! Yapped with friends after church and saw sunset later'],
  },
  {
    date: '2026-04-04',
    title: 'A little Shanghai connection',
    category: 'a conversation',
    paragraphs: ['Had a nice conversation with Michael about Shanghai and our shared experience'],
  },
  {
    date: '2026-04-03',
    title: 'Making space for feelings',
    category: 'a quiet moment',
    paragraphs: ['Processed my emotions'],
  },
];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatThoughtDate(date, long = false) {
  // Parse locally so an entry's calendar date does not shift with the time zone.
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: long ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
    ...(long ? { weekday: 'long' } : {}),
  });
}

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
  const covers = document.getElementById('thoughts-covers');
  const reader = document.getElementById('thought-reader');
  const newer = document.getElementById('thoughts-newer');
  const older = document.getElementById('thoughts-older');
  const pageStatus = document.getElementById('thoughts-page-status');
  const latest = document.getElementById('thoughts-read-latest');
  const motionButton = document.getElementById('thoughts-motion');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [...THOUGHT_ENTRIES].sort((a, b) => b.date.localeCompare(a.date));
  const pageSize = 3;
  let page = 0;
  let motionEnabled = true;

  function renderCovers() {
    const start = page * pageSize;
    covers.start = start + 1;
    covers.innerHTML = entries.slice(start, start + pageSize).map((entry, index) => `
      <li>
        <button type="button" class="thought-cover" data-entry="${start + index}" aria-haspopup="dialog">
          <span class="thought-cover-top">
            <svg class="thought-cover-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 3h7l3 3v11H5zM12 3v4h3M8 10h4M8 13h3"/></svg>
            <time datetime="${escapeHtml(entry.date)}">${escapeHtml(formatThoughtDate(entry.date))}</time>
            <span class="thought-cover-number" aria-hidden="true">${String(start + index + 1).padStart(2, '0')}</span>
          </span>
          <span class="thought-cover-title">${escapeHtml(entry.title)}</span>
          <span class="thought-cover-bottom">
            <span class="thought-cover-category">${escapeHtml(entry.category)}</span>
            <span class="thought-cover-open" aria-hidden="true">read entry ↗</span>
          </span>
        </button>
      </li>
    `).join('');
    newer.disabled = page === 0;
    older.disabled = start + pageSize >= entries.length;
    pageStatus.textContent = entries.length
      ? `${start + 1}–${Math.min(start + pageSize, entries.length)} of ${entries.length}`
      : 'No entries yet';
  }

  function openEntry(entry, trigger) {
    document.getElementById('thought-reader-title').textContent = entry.title;
    document.getElementById('thought-reader-category').textContent = entry.category;
    document.getElementById('thought-reader-filename').textContent = `scribbles / ${entry.date}.md`;
    const date = document.getElementById('thought-reader-date');
    date.dateTime = entry.date;
    date.textContent = formatThoughtDate(entry.date, true);
    document.getElementById('thought-reader-copy').replaceChildren(...entry.paragraphs.map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    // Let the native dialog restore focus to its opener, including in Safari.
    trigger.focus({ preventScroll: true });
    reader.showModal();
  }

  covers.addEventListener('click', event => {
    const trigger = event.target.closest('.thought-cover');
    if (trigger) openEntry(entries[Number(trigger.dataset.entry)], trigger);
  });
  latest.addEventListener('click', () => openEntry(entries[0], latest));
  document.getElementById('thought-reader-close').addEventListener('click', () => reader.close());
  reader.addEventListener('click', event => {
    if (event.target !== reader) return;
    const bounds = reader.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) reader.close();
  });

  function turnPage(direction, trigger) {
    page += direction;
    renderCovers();
    if (trigger.disabled) (direction > 0 ? newer : older).focus({ preventScroll: true });
  }
  newer.addEventListener('click', () => turnPage(-1, newer));
  older.addEventListener('click', () => turnPage(1, older));

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

  document.getElementById('thoughts-entry-count').textContent = `${entries.length} entries`;
  latest.hidden = entries.length === 0;
  document.querySelector('.thoughts-pagination').hidden = entries.length <= pageSize;
  motionButton.hidden = false;
  renderCovers();
  updateMotion();
  initScribblesCode(section);
});
