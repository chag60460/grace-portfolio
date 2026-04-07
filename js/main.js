/* ============================================================
   grace-portfolio — main.js
   ============================================================ */

/* ── Section switcher ──────────────────────────────────────
   Called by onclick in each .nav-item.
   Updates the active section, nav highlight, and window title.
   ─────────────────────────────────────────────────────────── */

const SECTION_TITLES = {
  about:    'about me',
  faith:    'faith',
  projects: 'projects',
  skills:   'skills',
  resume:   'resume',
};

function showSection(name, el) {
  // Deactivate all sections and nav items
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate the chosen section and nav item
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');

  // Update the window titlebar
  document.getElementById('window-title').textContent = SECTION_TITLES[name] ?? name;
}

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

/* ── Small Wins Calendar ────────────────────────────────────
   A flippable month grid under the Faith section.
   Days with wins show a flower marker; clicking opens an
   overlay card with that day's list of small wins.
   ─────────────────────────────────────────────────────────── */

const SMALL_WINS = {
  // Format: 'YYYY-MM-DD': ['win1', 'win2', ...]
  '2026-04-06': ['Figured out how to reverse a linked list for the first time ever!'],
  '2026-04-05': ['Easter! Yapped with friends after church and saw sunset later'],
  '2026-04-04': ['Had a nice conversation with Michael about Shanghai and our shared experience'],
  '2026-04-03': ['Processed my emotions'],
};

let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
let openedDay = null;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Simple hash to derive a number from text
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Pastel color palette
const PASTEL = ['#f5c0e0','#c5b8f0','#b8d8f0','#b8e8d0','#f5d8b0','#e8c5f0','#c5e0f5','#f0c5c5'];

// Generate inline SVG cartoon based on win text
function getWinIllustration(wins) {
  const text = wins.join(' ').toLowerCase();
  const h = hashStr(text);
  const c1 = PASTEL[h % PASTEL.length];
  const c2 = PASTEL[(h + 3) % PASTEL.length];

  // Keyword-to-scene mapping
  const scenes = [
    { keywords: ['code','bug','linked list','reverse','debug','feature','shipped','program'],
      draw: (c1, c2) => `
        <rect x="25" y="22" width="50" height="36" rx="4" fill="${c1}" stroke="#9a70d0" stroke-width="1.5"/>
        <rect x="30" y="28" width="40" height="24" rx="2" fill="#fff" opacity="0.8"/>
        <text x="50" y="38" text-anchor="middle" font-size="6" fill="#6a4a9a" font-family="monospace">&lt;/&gt;</text>
        <text x="50" y="46" text-anchor="middle" font-size="5" fill="#9a85aa" font-family="monospace">01101</text>
        <circle cx="70" cy="20" r="6" fill="${c2}"/><text x="70" y="22" text-anchor="middle" font-size="7">✨</text>
        <rect x="35" y="58" width="30" height="3" rx="1.5" fill="#d0b8f0"/>
      ` },
    { keywords: ['church','easter','bible','pray','god','faith','service','verse'],
      draw: (c1, c2) => `
        <rect x="30" y="35" width="40" height="35" rx="2" fill="${c1}" stroke="#d0a0c8" stroke-width="1"/>
        <polygon points="50,15 30,35 70,35" fill="${c2}"/>
        <rect x="47" y="20" width="6" height="15" rx="1" fill="#fff" opacity="0.8"/>
        <rect x="43" y="25" width="14" height="5" rx="1" fill="#fff" opacity="0.8"/>
        <circle cx="50" cy="50" r="6" fill="#fff" opacity="0.5"/>
        <circle cx="20" cy="25" r="3" fill="${c2}" opacity="0.5"/>
        <circle cx="78" cy="28" r="4" fill="${c1}" opacity="0.6"/>
      ` },
    { keywords: ['friend','yap','conversation','talk','chat','call'],
      draw: (c1, c2) => `
        <circle cx="35" cy="45" r="14" fill="${c1}"/>
        <circle cx="35" cy="38" r="8" fill="#fff" opacity="0.7"/>
        <circle cx="33" cy="37" r="1.5" fill="#5a4a6a"/><circle cx="37" cy="37" r="1.5" fill="#5a4a6a"/>
        <path d="M32 40 Q35 43 38 40" stroke="#e8a0c8" fill="none" stroke-width="1.2"/>
        <circle cx="65" cy="45" r="14" fill="${c2}"/>
        <circle cx="65" cy="38" r="8" fill="#fff" opacity="0.7"/>
        <circle cx="63" cy="37" r="1.5" fill="#5a4a6a"/><circle cx="67" cy="37" r="1.5" fill="#5a4a6a"/>
        <path d="M62 40 Q65 43 68 40" stroke="#e8a0c8" fill="none" stroke-width="1.2"/>
        <path d="M44 30 Q50 22 56 30" stroke="#d0b8f0" fill="none" stroke-width="1.5" stroke-dasharray="2 2"/>
      ` },
    { keywords: ['sunset','walk','sunshine','spring','nature','outside'],
      draw: (c1, c2) => `
        <circle cx="50" cy="35" r="16" fill="#ffcc80" opacity="0.8"/>
        <line x1="50" y1="12" x2="50" y2="18" stroke="#ffcc80" stroke-width="2" stroke-linecap="round"/>
        <line x1="28" y1="35" x2="22" y2="35" stroke="#ffcc80" stroke-width="2" stroke-linecap="round"/>
        <line x1="72" y1="35" x2="78" y2="35" stroke="#ffcc80" stroke-width="2" stroke-linecap="round"/>
        <line x1="35" y1="20" x2="31" y2="16" stroke="#ffcc80" stroke-width="2" stroke-linecap="round"/>
        <line x1="65" y1="20" x2="69" y2="16" stroke="#ffcc80" stroke-width="2" stroke-linecap="round"/>
        <path d="M15 60 Q30 45 45 55 Q55 40 70 50 Q80 42 90 55 L90 70 L10 70 Z" fill="${c1}" opacity="0.6"/>
        <circle cx="30" cy="62" r="3" fill="${c2}"/><circle cx="60" cy="58" r="2.5" fill="${c2}"/>
      ` },
    { keywords: ['cook','meal','recipe','bake','food'],
      draw: (c1, c2) => `
        <ellipse cx="50" cy="55" rx="28" ry="10" fill="${c1}" stroke="#d0a0c8" stroke-width="1"/>
        <path d="M22 55 Q22 35 50 35 Q78 35 78 55" fill="${c2}" opacity="0.6"/>
        <path d="M42 30 Q44 20 46 30" stroke="#d0b8f0" fill="none" stroke-width="1.5" opacity="0.6"/>
        <path d="M50 28 Q52 18 54 28" stroke="#d0b8f0" fill="none" stroke-width="1.5" opacity="0.6"/>
        <path d="M56 30 Q58 22 60 30" stroke="#d0b8f0" fill="none" stroke-width="1.5" opacity="0.6"/>
      ` },
    { keywords: ['emotion','process','journal','gratitude','grateful','reflect'],
      draw: (c1, c2) => `
        <rect x="28" y="20" width="44" height="50" rx="4" fill="#fff" stroke="${c1}" stroke-width="1.5"/>
        <line x1="34" y1="32" x2="66" y2="32" stroke="#d0b8f0" stroke-width="1"/>
        <line x1="34" y1="39" x2="60" y2="39" stroke="#d0b8f0" stroke-width="1"/>
        <line x1="34" y1="46" x2="63" y2="46" stroke="#d0b8f0" stroke-width="1"/>
        <line x1="34" y1="53" x2="55" y2="53" stroke="#d0b8f0" stroke-width="1"/>
        <path d="M50 18 L53 24 L47 24 Z" fill="${c2}"/>
        <circle cx="72" cy="22" r="5" fill="${c1}" opacity="0.5"/>
        <text x="72" y="24" text-anchor="middle" font-size="6">♡</text>
      ` },
    { keywords: ['read','book','chapter'],
      draw: (c1, c2) => `
        <path d="M50 25 L25 30 L25 65 L50 60 Z" fill="${c1}" stroke="#d0a0c8" stroke-width="1"/>
        <path d="M50 25 L75 30 L75 65 L50 60 Z" fill="${c2}" stroke="#d0a0c8" stroke-width="1"/>
        <line x1="50" y1="25" x2="50" y2="60" stroke="#d0a0c8" stroke-width="1.5"/>
        <line x1="30" y1="38" x2="45" y2="35" stroke="#fff" stroke-width="1" opacity="0.6"/>
        <line x1="30" y1="44" x2="45" y2="41" stroke="#fff" stroke-width="1" opacity="0.6"/>
        <line x1="55" y1="35" x2="70" y2="38" stroke="#fff" stroke-width="1" opacity="0.6"/>
        <line x1="55" y1="41" x2="70" y2="44" stroke="#fff" stroke-width="1" opacity="0.6"/>
        <circle cx="50" cy="18" r="4" fill="#ffcc80" opacity="0.5"/>
      ` },
    { keywords: ['help','volunteer','serve','encourage','kind'],
      draw: (c1, c2) => `
        <path d="M50 65 L35 48 A14 14 0 0 1 50 30 A14 14 0 0 1 65 48 Z" fill="${c1}" stroke="#e8a0c8" stroke-width="1.5"/>
        <circle cx="35" cy="25" r="4" fill="${c2}" opacity="0.5"/>
        <circle cx="68" cy="22" r="3" fill="${c2}" opacity="0.5"/>
        <circle cx="22" cy="50" r="2.5" fill="${c1}" opacity="0.4"/>
        <circle cx="78" cy="48" r="3" fill="${c1}" opacity="0.4"/>
      ` },
  ];

  for (const { keywords, draw } of scenes) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">${draw(c1, c2)}</svg>`;
      }
    }
  }

  // Default: star + sparkles
  return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,15 56,35 78,35 60,47 67,67 50,54 33,67 40,47 22,35 44,35" fill="${c1}" stroke="#d0a0c8" stroke-width="1"/>
    <circle cx="25" cy="22" r="4" fill="${c2}" opacity="0.5"/>
    <circle cx="78" cy="20" r="3" fill="${c2}" opacity="0.5"/>
    <circle cx="18" cy="55" r="2.5" fill="${c1}" opacity="0.4"/>
    <circle cx="82" cy="58" r="3.5" fill="${c1}" opacity="0.4"/>
  </svg>`;
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('cal-week-label');
  if (!grid || !label) return;

  closeDay();
  openedDay = null;

  label.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const wins = SMALL_WINS[key];
  const isToday = currentDate.getTime() === today.getTime();

  const classes = ['cal-day'];
  if (wins) classes.push('has-wins');
  if (isToday) classes.push('today');

  const onclick = wins ? ` onclick="toggleDay(this, '${key}')"` : '';

  let pageContent = '';
  if (wins) {
    const illustration = getWinIllustration(wins);
    const preview = wins.map(w => `<span>${w}</span>`).join('<br>');
    pageContent = `<div class="page-illustration">${illustration}</div><div class="page-wins">${preview}</div>`;
  }

  const dayName = DAY_NAMES[currentDate.getDay()];

  grid.innerHTML = `<div class="${classes.join(' ')}"${onclick}>` +
    `<div class="cal-day-page">${pageContent}</div>` +
    `<div class="cal-day-cover"><span class="cover-weekday">${dayName}</span>${currentDate.getDate()}</div>` +
  `</div>`;
}

function toggleDay(el, dateKey) {
  if (el.classList.contains('opened')) {
    // Close this day
    el.classList.remove('opened');
    openedDay = null;
    hideDetail();
    return;
  }

  // Close previously opened day
  if (openedDay) {
    openedDay.classList.remove('opened');
  }

  el.classList.add('opened');
  openedDay = el;
  showDetail(dateKey);
}

function showDetail(dateKey) {
  let panel = document.getElementById('wins-detail');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'wins-detail';
    panel.id = 'wins-detail';
    document.querySelector('.wins-calendar').appendChild(panel);
  }

  const [y, m, d] = dateKey.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const wins = SMALL_WINS[dateKey] || [];
  const listHtml = wins.map(w => `<li>${w}</li>`).join('');

  panel.innerHTML =
    `<div class="wins-detail-header">` +
      `<div><div class="wins-detail-date">${dateStr}</div>` +
      `<div class="wins-detail-sub">small wins ✿</div></div>` +
      `<button class="wins-detail-close" onclick="closeDay()">✕</button>` +
    `</div>` +
    `<ul class="wins-detail-list">${listHtml}</ul>`;

  panel.classList.add('open');
}

function hideDetail() {
  const panel = document.getElementById('wins-detail');
  if (panel) panel.classList.remove('open');
}

function closeDay() {
  if (openedDay) {
    openedDay.classList.remove('opened');
    openedDay = null;
  }
  hideDetail();
}

// Calendar navigation
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    renderCalendar();
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    renderCalendar();
  });

  renderCalendar();
});
