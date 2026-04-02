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
