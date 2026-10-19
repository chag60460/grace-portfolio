import { DRINK_SHOTS, SYRUPS, MILKS, cupLevels, createOrder, milkQueue, finishMilk, markReady, isOrder, seedOrders } from './domain.mjs';

const STORAGE_KEY = 'corner-cafe-orders-v1';
const app = document.querySelector('#app');
let storageError = '';
let orders = readOrders();
let screen = 'welcome';
let account = null;
let role = null;
let forCustomer = false;
let draft = newDraft();
let filter = 'both';
let selected = new Set();
let trackedId = null;
let ownIds = [];
let animationTimers = [];
let toastTimer;
let artId = 0;

function newDraft() {
  return { firstName: '', lastName: '', temperature: null, drink: null, syrup: 'none', pumps: 0, milk: null };
}

function readOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isOrder)) throw new Error('Saved order data is invalid.');
    storageError = '';
    return parsed;
  } catch (error) {
    console.error('Unable to load cafe orders:', error);
    storageError = 'Saved orders could not be loaded. Ordering is paused to protect your data. Allow browser storage or use a fresh local browser profile.';
    return [];
  }
}

function saveOrders(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    orders = next;
    storageError = '';
    return true;
  } catch (error) {
    console.error('Unable to save cafe orders:', error);
    storageError = 'Your change was not saved. Free some browser storage or allow local storage, then try again.';
    toast(storageError, true);
    return false;
  }
}

function mutateOrders(update) {
  const latest = readOrders();
  if (storageError) {
    toast(storageError, true);
    return false;
  }
  return saveOrders(update(latest));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function icon(name, size = 22) {
  const paths = {
    cup: '<path d="M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M8 4l4 3 4-3M8 20l4-3 4 3M3 11l5-1-1-5m10 14-1-5 5-1M3 13l5 1-1 5m10-14-1 5 5 1"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    print: '<path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6Z"/><path d="M17 11h1"/>',
    milk: '<path d="m8 3 8 0 3 5v13H5V8l3-5Zm-3 5h14M8 3v5m8-5v5"/><path d="M9 12h6v5H9Z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
    logout: '<path d="M9 3H4v18h5m6-15 6 6-6 6m-6-6h12"/>',
    leaf: '<path d="M20 3C9 1 2 7 5 15c8 6 16-1 15-12Z"/><path d="M3 21 15 9"/>',
    oat: '<path d="M12 22V3m0 6C7 9 5 6 6 3c4 0 6 2 6 6Zm0 6c-5 0-7-3-6-6 4 0 6 2 6 6Zm0 5c-5 0-7-3-6-6 4 0 6 2 6 6Zm0-11c5 0 7-3 6-6-4 0-6 2-6 6Zm0 6c5 0 7-3 6-6-4 0-6 2-6 6Zm0 5c5 0 7-3 6-6-4 0-6 2-6 6Z"/>',
    soy: '<path d="M20 3C11 1 2 10 3 18c1 5 8 4 13-1S23 8 20 3Zm0 0 2-2"/><circle cx="8" cy="16" r="2.3"/><circle cx="12.5" cy="11.5" r="2.3"/><circle cx="17" cy="7" r="2.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    sparkle: '<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/>',
  };
  return `<svg data-icon="${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cup}</svg>`;
}

function flower() {
  return '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><g fill="currentColor"><ellipse cx="50" cy="25" rx="15" ry="23"/><ellipse cx="50" cy="75" rx="15" ry="23"/><ellipse cx="25" cy="50" rx="23" ry="15"/><ellipse cx="75" cy="50" rx="23" ry="15"/><ellipse cx="32" cy="32" rx="14" ry="22" transform="rotate(-45 32 32)"/><ellipse cx="68" cy="68" rx="14" ry="22" transform="rotate(-45 68 68)"/><ellipse cx="32" cy="68" rx="14" ry="22" transform="rotate(45 32 68)"/><ellipse cx="68" cy="32" rx="14" ry="22" transform="rotate(45 68 32)"/></g><circle cx="50" cy="50" r="17" fill="#fff8e8"/><path d="M44 52q6 7 12 0" stroke="#756143" stroke-width="2.5" stroke-linecap="round"/><circle cx="44" cy="46" r="1.7" fill="#756143"/><circle cx="56" cy="46" r="1.7" fill="#756143"/></svg>';
}

function shotLabel(drink) {
  const shots = DRINK_SHOTS[drink];
  return `${shots} espresso shot${shots === 1 ? '' : 's'}`;
}

function ingredientCupArt() {
  const id = `ingredient-clip-${++artId}`;
  const cold = draft.temperature === 'cold';
  const syrup = SYRUPS.find(item => item.id === draft.syrup);
  const milk = MILKS.find(item => item.id === draft.milk);
  const levels = cupLevels(draft.pumps, screen === 'milk' && milk ? 1 : 0);
  const shape = cold
    ? 'M121 139h158l-19 166q-2 15-20 15h-80q-18 0-20-15Z'
    : 'M113 139h174l-13 133c-3 29-22 48-51 48h-48c-29 0-48-19-51-48Z';
  return `<svg class="cup-art ingredient-cup ${cold ? 'iced' : 'hot'}" viewBox="0 0 400 380" fill="none" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
    <ellipse cx="202" cy="329" rx="100" ry="13" fill="#766452" opacity=".10"/>
    ${cold ? '<path d="m255 72-14 68" stroke="var(--cup-color)" stroke-width="9" stroke-linecap="round"/>' : '<path d="M281 168h13c48 0 45 76-14 76" stroke="var(--cup-color)" stroke-width="14"/>'}
    <path d="${shape}" fill="#fffaf7" fill-opacity=".72"/>
    <g clip-path="url(#${id})">
      <rect class="liquid syrup-fill" x="110" width="180" style="y:${320 - levels.syrup}px;height:${levels.syrup}px" fill="${syrup.color}"/>
      <rect class="liquid milk-fill" x="110" width="180" style="y:${320 - levels.syrup - levels.milk}px;height:${levels.milk}px" fill="${milk?.color || '#fff6e7'}"/>
      <path d="m135 159 13 125" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".65"/>
    </g>
    <path d="${shape}" stroke="var(--cup-outline)" stroke-width="3"/>
    <ellipse cx="200" cy="139" rx="${cold ? 79 : 87}" ry="10" stroke="var(--cup-outline)" stroke-width="3" fill="#fffaf7" fill-opacity=".3"/>
    <g class="cup-face"><circle cx="182" cy="247" r="4" fill="#675064"/><circle cx="217" cy="247" r="4" fill="#675064"/><path d="M191 257q9 10 18 0" stroke="#675064" stroke-width="3" stroke-linecap="round"/><ellipse cx="172" cy="256" rx="8" ry="4.5" fill="#dba1ac" opacity=".7"/><ellipse cx="228" cy="256" rx="8" ry="4.5" fill="#dba1ac" opacity=".7"/></g>
    <g class="syrup-dispenser" style="--pour-color:${syrup.color}">
      <path class="syrup-pour-stream" d="M206 46v271" stroke="${syrup.color}" stroke-width="5" stroke-linecap="round"/>
      <rect x="267" y="54" width="39" height="65" rx="9" fill="${syrup.color}" stroke="#fff7" stroke-width="2"/>
      <rect x="271" y="74" width="31" height="25" rx="3" fill="#fff4e4"/>
      <text x="286" y="89" text-anchor="middle" fill="#88735a" font-size="7">${escapeHtml(syrup.name)}</text>
      <path d="M286 43v12" stroke="#8c767c" stroke-width="6"/>
      <path class="syrup-pump" d="M206 48v-8h87" stroke="#8c767c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g class="milk-dispenser">
      <path class="milk-pour-stream" d="M233 40Q206 45 206 96V317" stroke="${milk?.color || '#fff6e7'}" stroke-width="9" stroke-linecap="round"/>
      <g transform="rotate(-35 239 55)">
        <path d="M239 40h42v66h-42Zm0 0 8-13h26l8 13" fill="${milk?.color || '#fff6e7'}" stroke="#bfa987" stroke-width="2" stroke-linejoin="round"/>
        <g transform="translate(249 52)" color="#9b815e">${icon(milk?.icon || 'milk', 23)}</g>
        <text x="260" y="93" text-anchor="middle" fill="#88735a" font-size="9">${escapeHtml(milk?.short || 'Milk')}</text>
      </g>
    </g>
  </svg>`;
}

function cupArt(temperature = 'hot', drink = 'Latte', small = false) {
  const id = `cup-clip-${++artId}`;
  const cold = temperature === 'cold';
  const coffeeColor = drink === 'Americano' ? '#775044' : drink === 'Mocha' ? '#ad7963' : '#d2a180';
  return `<svg class="cup-art ${cold ? 'iced' : 'hot'} ${small ? 'small-art' : ''}" viewBox="0 0 400 380" fill="none" aria-hidden="true">
    <ellipse cx="202" cy="329" rx="100" ry="13" fill="#766452" opacity=".10"/>
    <g class="cup-body">
    ${cold ? `
      <path d="m228 51-19 97" stroke="var(--cup-outline)" stroke-width="13" stroke-linecap="round"/><path d="m228 51-19 97" stroke="var(--cup-color)" stroke-width="6" stroke-linecap="round"/>
      <defs><clipPath id="${id}"><path d="m121 131 19 174q2 15 20 15h80q18 0 20-15l19-174Z"/></clipPath></defs>
      <path d="m121 131 19 174q2 15 20 15h80q18 0 20-15l19-174Z" fill="#f4e7d9" stroke="#a98976" stroke-width="3"/>
      <g clip-path="url(#${id})"><path d="M117 175q40-13 80 0t84 0v151H117Z" fill="${coffeeColor}"/>
      <path d="M127 227q44 25 72-3t70 2v104H127Z" fill="#f2ddc2" opacity=".55"/>
      <g fill="#fff9f1" fill-opacity=".6" stroke="#fff9f1" stroke-width="2"><rect x="142" y="145" width="37" height="31" rx="8" transform="rotate(-13 142 145)"/><rect x="211" y="157" width="39" height="32" rx="8" transform="rotate(12 211 157)"/><rect x="175" y="190" width="34" height="31" rx="7" transform="rotate(-8 175 190)"/></g>
      <path d="M140 149 155 296" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".45"/></g>
      <rect x="113" y="121" width="175" height="18" rx="9" fill="var(--cup-color)" stroke="var(--cup-outline)" stroke-width="3"/>
      <rect x="140" y="227" width="120" height="61" rx="7" fill="var(--cup-color)"/>
    ` : `
      <g class="steam" stroke="var(--cup-outline)" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M163 101c-18-21 17-27 1-49"/><path d="M201 92c-18-21 17-27 1-49"/><path d="M237 101c-18-21 17-27 1-49"/></g>
      <path d="M277 160h16c57 0 49 89-11 87" stroke="var(--cup-outline)" stroke-width="4"/><path d="M277 160h16c57 0 49 89-11 87" stroke="var(--cup-color)" stroke-width="20"/>
      <path d="M113 139h174l-13 133c-3 29-22 48-51 48h-48c-29 0-48-19-51-48l-11-133Z" fill="var(--cup-color)" stroke="var(--cup-outline)" stroke-width="3"/>
      <path d="M127 155h17l9 121q2 16 11 25" stroke="#fff8fa" stroke-width="9" stroke-linecap="round" opacity=".65"/>
      <ellipse cx="200" cy="140" rx="87" ry="19" fill="#fff0f5" stroke="var(--cup-outline)" stroke-width="3"/>
      <ellipse cx="200" cy="141" rx="73" ry="11" fill="${coffeeColor}"/>
      <path d="M177 140q22-15 44 0-22 16-44 0Z" fill="#f5dfc3"/><path d="M185 140q15-9 30 0-15 10-30 0Z" fill="${coffeeColor}"/>
    `}
    <g class="cup-face"><circle cx="182" cy="247" r="4" fill="#675064"/><circle cx="217" cy="247" r="4" fill="#675064"/><path d="M191 257q9 10 18 0" stroke="#675064" stroke-width="3" stroke-linecap="round"/><ellipse cx="172" cy="256" rx="8" ry="4.5" fill="#dba1ac" opacity=".7"/><ellipse cx="228" cy="256" rx="8" ry="4.5" fill="#dba1ac" opacity=".7"/></g>
    </g>
  </svg>`;
}

function toast(message, error = false) {
  const element = document.querySelector('#toast');
  clearTimeout(toastTimer);
  element.textContent = message;
  element.className = `toast visible${error ? ' error' : ''}`;
  toastTimer = setTimeout(() => { element.className = 'toast'; }, error ? 8000 : 3500);
}

function clearAnimation() {
  animationTimers.forEach(clearTimeout);
  animationTimers = [];
}

function go(next) {
  clearAnimation();
  selected.clear();
  screen = next;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('h1')?.focus({ preventScroll: true });
}

function button(label, action, options = {}) {
  return `<button type="button" class="button ${options.secondary ? 'secondary' : ''} ${options.className || ''}" data-action="${action}" ${options.disabled ? 'disabled' : ''}>${label}${options.arrow === false ? '' : icon('arrow', 19)}</button>`;
}

function title(eyebrow, heading, description) {
  return `<div class="page-heading"><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1">${heading}</h1><p>${description}</p></div>`;
}

function shell(content) {
  const team = Boolean(account && role && role !== 'drinker');
  const inOrder = ['name', 'temperature', 'drink', 'syrup', 'milk'].includes(screen);
  const nav = account ? `
    <div class="nav-caption">${team ? 'THE COFFEE CORNER' : 'YOUR COFFEE BREAK'}</div>
    ${team ? `<button class="nav-item ${['roles', 'audience'].includes(screen) ? 'active' : ''}" data-action="roles">${icon('users')}Coffee team</button>
      <button class="nav-item ${screen === 'order-taker' || screen === 'labels' || forCustomer && inOrder ? 'active' : ''}" data-action="order-taker">${icon('print')}Order taker</button>
      <button class="nav-item ${screen.startsWith('steam') ? 'active' : ''}" data-action="steamer">${icon('milk')}Milk steamer</button>
      <button class="nav-item ${screen === 'mixer' ? 'active' : ''}" data-action="mixer">${icon('cup')}Drink mixer</button>` :
      `<button class="nav-item ${inOrder ? 'active' : ''}" data-action="new-order">${icon('cup')}Order a coffee</button>
      <button class="nav-item ${screen === 'my-orders' || screen === 'status' ? 'active' : ''}" data-action="my-orders">${icon('clock')}My orders <span class="nav-count">${ownIds.length}</span></button>`}
    <button class="nav-item" data-action="audience">${icon('home')}Switch team / drinker</button>
    ` : `<div class="nav-caption">A SPACE TO SLOW DOWN</div><div class="nav-item active">${icon('home')}Welcome in</div>`;
  return `<div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#" data-action="brand" aria-label="Corner Cafe home"><span class="brand-icon">${icon('cup', 28)}</span><span>corner<span class="brand-second">cafe<span class="brand-dot">.</span></span></span></a>
      <nav aria-label="Main navigation">${nav}</nav>
      <div class="sidebar-bottom"><div class="sidebar-flower">${flower()}</div><p>Good coffee.<br>Better company.</p><span>Made with love, served together.</span></div>
      ${account ? `<div class="profile"><span class="avatar">${escapeHtml((account.firstName || 'G')[0])}</span><div><strong>${escapeHtml(account.firstName || 'Guest')}</strong><small>${account.type === 'church' ? 'Church Center · demo' : 'Here for a little happy'}</small></div><button class="icon-button" data-action="sign-out" aria-label="Sign out">${icon('logout', 18)}</button></div>` : '<div class="sidebar-note">Your neighborhood, in a cup.</div>'}
    </aside>
    <div class="main-shell">
      <header class="topbar"><div class="breadcrumb">Corner Cafe <span>/</span> ${team ? 'Behind the counter' : 'A little cup of happy'}</div><div class="header-right"><span class="open-badge"><i></i>The cafe is open</span><span class="demo-badge">LOCAL PROTOTYPE</span></div></header>
      ${storageError ? `<div class="error-banner" role="alert">${escapeHtml(storageError)}</div>` : ''}
      <main id="main">${content}</main>
      <footer><span>${icon('heart', 14)} A little coffee. A lot of community.</span><span>Freshly made, just for you.</span></footer>
    </div>
  </div>`;
}

function preview() {
  const syrup = SYRUPS.find(item => item.id === draft.syrup);
  const milk = MILKS.find(item => item.id === draft.milk);
  return `<aside class="preview-panel">
    <div class="preview-top"><span class="eyebrow">YOUR CUP, YOUR WAY</span><span class="handwritten">a little work of heart ${icon('heart', 15)}</span></div>
    <div class="cup-stage" id="cup-stage">
      <div class="art-halo"></div><span class="art-sparkle sparkle-one">${icon('sparkle', 30)}</span><span class="art-sparkle sparkle-two">${icon('sparkle', 17)}</span><span class="art-dot"></span>
      ${['syrup', 'milk'].includes(screen) ? ingredientCupArt() : cupArt(draft.temperature || 'hot', draft.drink || 'Latte')}
    </div>
    <div class="animation-caption" id="animation-caption" aria-live="polite">${['syrup', 'milk'].includes(screen) ? draft.pumps ? `${draft.pumps} pump${draft.pumps === 1 ? '' : 's'} of ${syrupName(syrup)}${screen === 'milk' && milk ? ` + ${milk.name}` : ''}.` : screen === 'milk' && milk ? `A cup of ${milk.name}.` : 'An empty cup, ready for your little details.' : 'A little cup of possibilities.'}</div>
    <div class="recipe"><span class="eyebrow">THE LITTLE DETAILS</span><h3>${draft.temperature ? (draft.temperature === 'hot' ? 'Hot' : 'Iced') : 'Your'} ${draft.drink || 'happy place'}</h3><div class="recipe-tags">
      ${draft.temperature ? `<span>${icon(draft.temperature === 'hot' ? 'sun' : 'snow', 14)}${draft.temperature === 'hot' ? 'Warm & cozy' : 'Cool & refreshing'}</span>` : '<span>Made fresh</span><span>Made with love</span>'}
      ${draft.drink ? `<span>${shotLabel(draft.drink)}</span>` : ''}
      ${draft.drink && draft.drink !== 'Americano' ? `<span>${draft.pumps && draft.syrup !== 'none' ? `${draft.pumps} pump${draft.pumps === 1 ? '' : 's'} ${escapeHtml(syrup.name.toLowerCase())}` : 'No syrup'}</span>${milk ? `<span>${escapeHtml(milk.name)}</span>` : ''}` : ''}
    </div></div>
    <div class="preview-foot">${icon('heart', 16)} Every cup makes a little connection.</div>
  </aside>`;
}

function welcome() {
  return `<section class="welcome-grid"><div class="welcome-copy"><span class="eyebrow"><span class="tiny-flower">✳</span> COME AS YOU ARE</span><h1 tabindex="-1">A little cup<br>of <em>happy.</em></h1><p>Your favorite coffee. Your favorite people.<br>There’s a place for you at the corner.</p><div class="welcome-actions">${button('Sign in as a Guest', 'guest')}${button(`${icon('home', 19)} Sign in with Church Center`, 'church', { secondary: true, arrow: false })}</div><p class="fine-print">No account? No problem. Your next cup is a tap away.</p><div class="welcome-divider"></div><div class="welcome-promise"><span class="mini-round">${icon('heart', 19)}</span><span>Lovingly made by our coffee team.<br><strong>Always worth slowing down for.</strong></span></div></div>
    <div class="welcome-art"><span class="art-label">freshly brewed & full of joy</span><div class="welcome-orbit"></div><div class="hero-flower">${flower()}</div><span class="hero-sparkle">${icon('sparkle', 42)}</span>${cupArt('hot')}<span class="hero-sticker">${icon('heart', 17)} made with love</span><div class="art-caption">meet your morning, made better.</div></div></section>
    <div class="welcome-bottom"><span>01 <strong>Make it yours</strong> <small>A cup for every kind of day.</small></span><span>02 <strong>We’ll make it with love</strong> <small>Our team takes it from here.</small></span><span>03 <strong>Sip & stay a while</strong> <small>Good things happen over coffee.</small></span></div>`;
}

function choiceCard(action, value, heading, detail, visual, active = false, extra = '') {
  return `<button type="button" class="choice-card ${active ? 'selected' : ''} ${extra}" data-action="${action}" data-value="${value}" aria-pressed="${active}"><span class="choice-check">${active ? icon('check', 14) : ''}</span>${visual}<strong>${heading}</strong><span class="choice-detail">${detail}</span></button>`;
}

function audience() {
  return `<section class="center-page">${title('COME AS YOU ARE', account.firstName ? `Welcome in, ${escapeHtml(account.firstName)}.` : 'Welcome to the corner.', 'How are you spending your time at the corner today?')}<div class="role-grid two">
    ${choiceCard('drinker', '', 'Coffee drinker', 'Find your new favorite little ritual.', `<div class="role-visual peach">${icon('cup', 42)}</div>`)}
    ${choiceCard('roles', '', 'Coffee team', 'A little teamwork. A lot of happy cups.', `<div class="role-visual lavender">${icon('users', 42)}</div>`)}
    </div><p class="helper-note">${account.type === 'church' ? 'Church Center demo account · No real authentication or credentials.' : 'Guest demo access · Explore either side of the counter.'}</p></section>`;
}

function rolePicker() {
  return `<section class="center-page">${title('BEHIND THE COUNTER', 'Good things take a team.', 'Pick your station. Let’s make someone’s day a little sweeter.')}<div class="role-grid">
    ${choiceCard('order-taker', '', 'Order taker', 'A warm hello, a new order, a fresh label.', `<div class="role-visual peach">${icon('print', 38)}</div>`)}
    ${choiceCard('steamer', '', 'Milk steamer', 'Make every pour a little more lovely.', `<div class="role-visual mint">${icon('milk', 38)}</div>`)}
    ${choiceCard('mixer', '', 'Drink mixer', 'Bring it all together. Send out some joy.', `<div class="role-visual lavender">${icon('cup', 38)}</div>`)}
    </div>${demoQueueControl()}</section>`;
}

function demoQueueControl() {
  return `<div class="demo-note"><span>${icon('sparkle', 19)} Want to explore the team screens? Add four sample orders.</span><button class="text-button" data-action="seed">Add demo orders ${icon('plus', 16)}</button></div>`;
}

function nameScreen() {
  return `<section class="order-layout"><div class="builder"><button class="back-link" data-action="${forCustomer ? 'order-taker' : 'audience'}">${icon('back', 16)} Back</button>${title('FIRST, A LITTLE HELLO', forCustomer ? 'Who’s the lucky sipper?' : 'What should we call you?', 'So we know whose name to call when a little happiness is ready.')}<form id="name-form"><div class="name-fields"><label>First name<input name="firstName" autocomplete="given-name" placeholder="e.g. Grace" required maxlength="40" value="${escapeHtml(draft.firstName)}"></label><label>Last name<input name="lastName" autocomplete="family-name" placeholder="e.g. Chang" required maxlength="40" value="${escapeHtml(draft.lastName)}"></label></div><p class="helper-note">${icon('heart', 16)} Just your name, just for your coffee.</p><button class="button" type="submit">Let’s make your coffee ${icon('arrow', 19)}</button></form></div>${preview()}</section>`;
}

function stepper() {
  const steps = ['temperature', 'drink', 'syrup', 'milk'];
  return `<ol class="stepper" aria-label="Order progress">${steps.map((step, index) => `<li class="${step === screen ? 'current' : steps.indexOf(screen) > index ? 'complete' : ''}" ${step === screen ? 'aria-current="step"' : ''}><span>${steps.indexOf(screen) > index ? icon('check', 12) : `0${index + 1}`}</span><small>${['Temperature', 'Your drink', 'Syrup', 'Milk'][index]}</small></li>`).join('')}</ol>`;
}

function wizard() {
  let content = '';
  let next = '';
  let previous = 'name';
  if (screen === 'temperature') {
    content = `${title('LET’S MAKE SOMETHING LOVELY', 'What’s your kind of cozy?', 'Something warm to hold, or a little chill to brighten your day?')}<div class="temperature-grid">
      ${choiceCard('temperature', 'hot', 'Hot & cozy', 'A warm little hug in a cup.', `<div class="temperature-art hot-card">${cupArt('hot', 'Latte', true)}</div>`, draft.temperature === 'hot')}
      ${choiceCard('temperature', 'cold', 'Iced & happy', 'A refreshing kind of pick-me-up.', `<div class="temperature-art cold-card">${cupArt('cold', 'Latte', true)}</div>`, draft.temperature === 'cold')}
      </div>`;
    next = button('Find my drink', 'next', { disabled: !draft.temperature });
  } else if (screen === 'drink') {
    previous = 'temperature';
    content = `${title('A CUP THAT FEELS LIKE YOU', 'Pick your happy place.', 'Three classics. Endless little reasons to love them.')}<div class="drink-options">${[
      ['Americano', 'Espresso + water. Simple, bold, beautiful.', 'peach'],
      ['Latte', 'Espresso meets your favorite silky milk.', 'lavender'],
      ['Mocha', 'Coffee, chocolate, and a little extra joy.', 'mint'],
    ].map(([name, detail, color]) => choiceCard('drink', name, name, `${shotLabel(name)} · ${detail}`, `<span class="drink-icon ${color}">${icon('cup', 28)}</span>`, draft.drink === name, 'horizontal')).join('')}</div><p class="helper-note">Mocha includes chocolate. Americano skips milk and syrup.</p>`;
    next = button(draft.drink === 'Americano' ? 'Place my order' : 'Make it a little sweeter', draft.drink === 'Americano' ? 'submit-order' : 'next', { disabled: !draft.drink || Boolean(storageError) });
  } else if (screen === 'syrup') {
    previous = 'drink';
    content = `${title('A LITTLE SOMETHING SWEET', 'Sweeten the moment.', 'Start with an empty cup. Pick a flavor and watch each pump fill it.')}<div class="syrup-options">${SYRUPS.map(syrup => choiceCard('syrup', syrup.id, syrup.name, syrup.note, `<span class="syrup-swatch" style="--swatch:${syrup.color}">${syrup.id === 'none' ? icon('minus', 19) : '<span></span>'}</span>`, draft.syrup === syrup.id)).join('')}</div><div class="pump-control"><div><strong>How sweet?</strong><span>0–6 pumps · your little sweet spot</span></div><div class="stepper-control"><button class="icon-button" data-action="pump-down" aria-label="Remove one syrup pump" ${draft.pumps === 0 || draft.syrup === 'none' ? 'disabled' : ''}>${icon('minus', 20)}</button><output aria-label="Syrup pump count">${draft.pumps}</output><button class="icon-button" data-action="pump-up" aria-label="Add one syrup pump" ${draft.pumps === 6 || draft.syrup === 'none' ? 'disabled' : ''}>${icon('plus', 20)}</button></div></div>`;
    next = button('One last little detail', 'next');
  } else {
    previous = 'syrup';
    content = `${title('THE FINISHING TOUCH', 'A splash of something lovely.', 'Your syrup stays right here. Choose a milk and watch your cup fill up.')}<div class="milk-options">${MILKS.map(milk => choiceCard('milk', milk.id, milk.name, milk.note, `<div class="milk-illustration ${milk.id}">${icon(milk.icon, 34)}<span>${milk.short}</span></div>`, draft.milk === milk.id)).join('')}</div><div class="allergy-note">${icon('leaf', 18)}<span>Oat and soy are non-dairy. Our shared equipment may come into contact with allergens.</span></div>`;
    next = button(forCustomer ? 'Place customer’s order' : 'Place my order', 'submit-order', { disabled: !draft.milk || Boolean(storageError) });
  }
  return `<section class="order-layout"><div class="builder">${stepper()}${content}<div class="builder-actions"><button class="back-link" data-action="back" data-value="${previous}">${icon('back', 17)} Back</button>${next}</div><div class="customer-note">Made for <strong>${escapeHtml(`${draft.firstName} ${draft.lastName}`)}</strong>${forCustomer ? ' · Ordered by the coffee team' : ''}</div></div>${preview()}</section>`;
}

function orderTaker() {
  return `<section class="center-page">${title('ORDER TAKER', 'Every cup starts with hello.', 'Take a new order or get the little labels ready for the team.')}<div class="role-grid two">
    ${choiceCard('labels', '', 'Print labels', `${orders.length} order${orders.length === 1 ? '' : 's'} in the cafe queue.`, `<div class="role-visual lavender">${icon('print', 42)}</div>`)}
    ${choiceCard('customer-order', '', 'Place an order', 'Make something lovely for a coffee drinker.', `<div class="role-visual peach">${icon('cup', 42)}</div>`)}
    </div>${demoQueueControl()}</section>`;
}

function milkFilter() {
  return `<section class="center-page">${title('MILK STEAMER', 'Find your flow.', 'Which milks are you looking after today?')}<div class="role-grid">
    ${choiceCard('milk-filter', 'dairy', 'Dairy', 'The classic 2% milk crew.', `<div class="role-visual peach">${icon('milk', 40)}</div>`)}
    ${choiceCard('milk-filter', 'non-dairy', 'Non-dairy', 'Oat & soy, made with love.', `<div class="role-visual mint">${icon('leaf', 40)}</div>`)}
    ${choiceCard('milk-filter', 'both', 'A little of both', 'Keep an eye on every pour.', `<div class="role-visual lavender">${icon('heart', 40)}</div>`)}
    </div></section>`;
}

function orderDetails(order) {
  const milk = MILKS.find(item => item.id === order.milk);
  const syrup = SYRUPS.find(item => item.id === order.syrup);
  return `${order.temperature === 'hot' ? 'Hot' : 'Iced'} ${order.drink} · ${shotLabel(order.drink)}${milk ? ` · ${milk.name}` : ''}${order.pumps ? ` · ${order.pumps} pump${order.pumps === 1 ? '' : 's'} ${syrupName(syrup)}` : ''}`;
}

function syrupName(syrup) { return syrup?.name.toLowerCase() || ''; }

function ticket(order, selectable = true, mode = screen) {
  const milk = MILKS.find(item => item.id === order.milk);
  return `<article class="ticket ${selected.has(order.id) ? 'is-selected' : ''} ${order.status === 'ready' ? 'is-ready' : ''}" data-order-id="${order.id}" ${mode === 'steam-queue' ? 'data-swipe="true"' : ''}>
    <div class="ticket-top"><span class="ticket-number">#${order.number}</span>${selectable ? `<label class="ticket-select"><span class="sr-only">Select order ${order.number} for ${escapeHtml(order.firstName)}</span><input type="checkbox" data-select="${order.id}" ${selected.has(order.id) ? 'checked' : ''}></label>` : `<span class="status-pill">${order.status === 'ready' ? 'Ready' : 'In the making'}</span>`}</div>
    <h3>${escapeHtml(order.firstName)} <span>${escapeHtml(order.lastName)}</span></h3>
    <div class="ticket-drink">${icon(order.temperature === 'hot' ? 'sun' : 'snow', 17)} ${order.temperature === 'hot' ? 'Hot' : 'Iced'} ${order.drink} · ${shotLabel(order.drink)}</div>
    <div class="ticket-tags">${milk ? `<span class="${milk.group === 'dairy' ? 'peach' : 'mint'}">${milk.name}</span>` : '<span class="peach">No milk</span>'}<span>${order.pumps ? `${order.pumps} pump${order.pumps === 1 ? '' : 's'} ${syrupName(SYRUPS.find(item => item.id === order.syrup))}` : 'No syrup'}</span></div>
    <div class="ticket-bottom">${mode === 'steam-queue' ? `${icon('arrow', 16)} Swipe right to finish milk <button class="text-button" data-action="finish-one" data-value="${order.id}" aria-label="Finish milk for order ${order.number}">Done ${icon('check', 15)}</button>` : `${icon('clock', 14)} ${order.status === 'ready' ? 'Ready for a happy hello' : order.milkDone ? 'Milk step complete' : order.temperature === 'cold' ? 'Cold milk · no steaming' : 'Waiting on milk'}`}</div>
  </article>`;
}

function emptyState(heading, detail) {
  return `<div class="empty-state"><span class="empty-flower">${flower()}</span><h3>${heading}</h3><p>${detail}</p></div>`;
}

function visibleOrders() {
  if (screen === 'steam-queue') return milkQueue(orders, filter);
  if (screen === 'mixer') return orders.filter(order => order.status !== 'ready');
  return orders;
}

function queueScreen() {
  const isSteam = screen === 'steam-queue';
  const isMixer = screen === 'mixer';
  const list = visibleOrders();
  const ready = orders.filter(order => order.status === 'ready');
  const headings = isSteam ? ['MILK STEAMER', 'A little pour, a lot of love.', 'Select orders or swipe a card right to finish its milk. Cold drinks use cold milk.'] : isMixer ? ['DRINK MIXER', 'Happiness, coming right up.', 'Bring each cup together, then let its person know it’s ready.'] : ['ORDER TAKER / LABELS', 'Little labels. Happy cups.', 'Select your labels, then print them for the coffee team.'];
  return `<section class="queue-page">${title(...headings)}<div class="queue-toolbar"><div class="queue-tabs">${isSteam ?
    [['dairy', 'Dairy'], ['non-dairy', 'Non-dairy'], ['both', 'Both']].map(([value, label]) => `<button class="pill-tab ${filter === value ? 'active' : ''}" data-action="queue-filter" data-value="${value}" aria-pressed="${filter === value}">${label} <span>${milkQueue(orders, value).length}</span></button>`).join('') :
    `<span class="queue-title">${isMixer ? 'In the making' : 'Order labels'} <span class="count-bubble">${list.length}</span></span>`}</div><button class="text-button" data-action="select-all" ${list.length ? '' : 'disabled'}>${list.length && list.every(order => selected.has(order.id)) ? 'Deselect all' : 'Select all'}</button></div>
    ${list.length ? isSteam ? MILKS.filter(milk => list.some(order => order.milk === milk.id)).map(milk => `<div class="milk-group"><h2>${milk.name} <span class="count-bubble">${list.filter(order => order.milk === milk.id).length}</span></h2><div class="ticket-grid">${list.filter(order => order.milk === milk.id).map(order => ticket(order)).join('')}</div></div>`).join('') : `<div class="ticket-grid">${list.map(order => ticket(order)).join('')}</div>` : emptyState('All caught up.', 'A quiet little moment. New orders will appear here automatically.')}
    <div class="queue-action-bar"><span><strong>${selected.size}</strong> ${isSteam ? 'pour' : 'order'}${selected.size === 1 ? '' : 's'} selected</span>${button(isSteam ? `Finish milk ${icon('check', 17)}` : isMixer ? `Mark as ready ${icon('check', 17)}` : `Print selected ${icon('print', 17)}`, isSteam ? 'finish-selected' : isMixer ? 'ready-selected' : 'print-selected', { disabled: !selected.size, arrow: false })}</div>
    ${isMixer ? `<div class="ready-heading"><h2>${icon('check', 21)} Ready for pickup <span class="count-bubble">${ready.length}</span></h2></div>${ready.length ? `<div class="ticket-grid">${ready.map(order => ticket(order, false)).join('')}</div>` : '<p class="helper-note">Finished drinks will have a happy home here.</p>'}` : ''}
    ${orders.length ? '' : demoQueueControl()}
    <p class="helper-note local-note">Local demo · Orders sync between tabs on this browser, not between devices.</p>
    </section>`;
}

function statusScreen() {
  const order = orders.find(item => item.id === trackedId);
  if (!order) return `<section class="center-page">${title('YOUR COFFEE', 'Your next happy moment.', 'Place a coffee order to follow its journey here.')}${button('Make a coffee', 'new-order')}</section>`;
  const ready = order.status === 'ready';
  return `<section class="status-page"><span class="status-eyebrow">${icon(ready ? 'check' : 'clock', 17)} ORDER #${order.number} · ${ready ? 'READY FOR PICKUP' : 'IN THE MAKING'}</span><h1 tabindex="-1">${ready ? 'Your happy is here!' : 'A little happiness<br>is on its way.'}</h1><p>${ready ? `${escapeHtml(order.firstName)}, your coffee is ready. Come say hello at the counter!` : `We’re making your cup with love, ${escapeHtml(order.firstName)}.<br>Stay a little. We’ll let you know right here.`}</p><div class="status-art ${ready ? 'celebrate' : ''}"><div class="art-halo"></div>${cupArt(order.temperature, order.drink)}${ready ? `<span class="status-flower">${flower()}</span>` : '<span class="preparing-dots"><i></i><i></i><i></i></span>'}</div><div class="status-recipe"><strong>${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)} <span>#${order.number}</span></strong><p>${escapeHtml(orderDetails(order))}</p><div class="journey"><span class="done">${icon('check', 13)} Order received</span><span class="${ready ? 'done' : 'current'}">${icon(ready ? 'check' : 'cup', 13)} Made with love</span><span class="${ready ? 'done' : ''}">${icon('heart', 13)} Ready for you</span></div></div><div class="status-actions">${button(forCustomer ? 'Take another order' : 'Another little cup?', forCustomer ? 'customer-order' : 'new-order', { secondary: true, arrow: false })}${!ready ? '<button class="text-button" data-action="simulate-ready">Preview “drink ready” <span class="demo-tag">DEMO</span></button>' : ''}</div><p class="helper-note">This page updates when the drink mixer marks your order ready.</p></section>`;
}

function myOrders() {
  const mine = orders.filter(order => ownIds.includes(order.id));
  return `<section class="queue-page">${title('YOUR LITTLE COFFEE BREAK', 'Your cups of happy.', 'A home for the coffees you’ve ordered in this session.')}<div class="ticket-grid">${mine.map(order => `<div>${ticket(order, false)}<button class="text-button track-button" data-action="track" data-value="${order.id}">Follow my coffee ${icon('arrow', 16)}</button></div>`).join('')}</div>${mine.length ? '' : emptyState('Your first cup is waiting.', 'Make it hot or iced. Make it a little bit yours.')}<div class="section-action">${button('Order a coffee', 'new-order')}</div></section>`;
}

function render() {
  const pages = {
    welcome, audience, roles: rolePicker, name: nameScreen,
    temperature: wizard, drink: wizard, syrup: wizard, milk: wizard,
    'order-taker': orderTaker, 'steam-filter': milkFilter, 'steam-queue': queueScreen,
    mixer: queueScreen, labels: queueScreen, status: statusScreen, 'my-orders': myOrders,
  };
  app.innerHTML = shell(pages[screen]());
}

function paintCup(pumps, milkFraction = 0, immediate = false) {
  const stage = document.querySelector('#cup-stage');
  if (!stage?.querySelector('.ingredient-cup')) return;
  const levels = cupLevels(pumps, milkFraction);
  if (immediate) stage.classList.add('reset-fill');
  const syrup = stage.querySelector('.syrup-fill');
  const milk = stage.querySelector('.milk-fill');
  syrup.style.y = `${320 - levels.syrup}px`;
  syrup.style.height = `${levels.syrup}px`;
  milk.style.y = `${320 - levels.syrup - levels.milk}px`;
  milk.style.height = `${levels.milk}px`;
  if (immediate) {
    void stage.offsetWidth;
    stage.classList.remove('reset-fill');
  }
}

function animate(kind, fromPumps = 0) {
  clearAnimation();
  const stage = document.querySelector('#cup-stage');
  const caption = document.querySelector('#animation-caption');
  if (!stage || !caption) return;
  stage.classList.remove('jumping', 'pumping', 'pouring');
  void stage.offsetWidth;
  if (kind === 'jump') {
    stage.classList.add('jumping');
    caption.textContent = draft.temperature === 'hot' ? 'One cozy little cup, coming up.' : 'Oh, that’s a cool choice.';
  } else if (kind === 'syrup') {
    paintCup(fromPumps, 0, true);
    if (!draft.pumps || draft.syrup === 'none') {
      paintCup(0, 0, true);
      caption.textContent = 'Simply coffee. Simply lovely.';
      return;
    }
    const syrup = SYRUPS.find(item => item.id === draft.syrup);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paintCup(draft.pumps, 0, true);
      caption.textContent = `${draft.pumps} pumps of ${syrupName(syrup)} in your cup.`;
      return;
    }
    const pours = draft.pumps - fromPumps;
    stage.style.setProperty('--pumps', pours);
    stage.classList.add('pumping');
    for (let count = fromPumps + 1; count <= draft.pumps; count++) {
      animationTimers.push(setTimeout(() => {
        paintCup(count);
        caption.textContent = `${count} of ${draft.pumps} ${syrupName(syrup)} pumps. A little sweeter.`;
      }, (count - fromPumps - 1) * 650 + 280));
    }
    animationTimers.push(setTimeout(() => {
      stage.classList.remove('pumping');
      caption.textContent = `${draft.pumps} pump${draft.pumps === 1 ? '' : 's'} of ${syrupName(syrup)}. Your sweet spot.`;
    }, pours * 650 + 250));
  } else if (kind === 'milk') {
    const milk = MILKS.find(item => item.id === draft.milk);
    paintCup(draft.pumps, 0, true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paintCup(draft.pumps, 1, true);
      caption.textContent = `${milk.name} over your syrup. Made just for you.`;
      return;
    }
    stage.classList.add('pouring');
    animationTimers.push(setTimeout(() => paintCup(draft.pumps, 1), 200));
    caption.textContent = `A silky splash of ${milk.name.toLowerCase()}.`;
    animationTimers.push(setTimeout(() => {
      stage.classList.remove('pouring');
      caption.textContent = 'Made just the way you love it.';
    }, 2100));
  }
}

function beginOrder(customer = false) {
  forCustomer = customer;
  draft = newDraft();
  if (!customer && account?.firstName && account?.lastName) {
    draft.firstName = account.firstName;
    draft.lastName = account.lastName;
    go('temperature');
  } else go('name');
}

function submitOrder() {
  if (!['drink', 'milk'].includes(screen)) return;
  let created;
  try {
    const saved = mutateOrders(latest => {
      created = createOrder(draft, latest);
      return [...latest, created];
    });
    if (!saved) return;
  } catch (error) {
    console.error('Order validation failed:', error);
    toast(error.message, true);
    return;
  }
  trackedId = created.id;
  if (!forCustomer) ownIds.push(created.id);
  go('status');
  toast('A little happiness is officially in the making.');
}

function finish(ids) {
  const eligible = new Set(milkQueue(orders, filter).map(order => order.id));
  const validIds = ids.filter(id => eligible.has(id));
  if (!validIds.length) return;
  if (!mutateOrders(latest => finishMilk(latest, validIds))) return;
  selected.clear();
  render();
  toast(`${validIds.length} milk ${validIds.length === 1 ? 'pour' : 'pours'} complete. Lovely teamwork.`);
}

const actions = {
  brand: () => go(account ? 'audience' : 'welcome'),
  guest: () => { account = { type: 'guest' }; role = null; go('audience'); },
  church: () => { account = { type: 'church', firstName: 'Grace', lastName: 'Chang' }; role = null; go('audience'); toast('Demo account connected. No real Church Center sign-in.'); },
  'sign-out': () => { account = null; role = null; ownIds = []; trackedId = null; forCustomer = false; draft = newDraft(); go('welcome'); },
  audience: () => { if (account) { role = null; forCustomer = false; go('audience'); } },
  drinker: () => { role = 'drinker'; beginOrder(); },
  roles: () => { if (account) { role = 'team'; forCustomer = false; go('roles'); } },
  'order-taker': () => { if (account) { role = 'order-taker'; forCustomer = false; go('order-taker'); } },
  steamer: () => { if (account) { role = 'steamer'; forCustomer = false; go('steam-filter'); } },
  mixer: () => { if (account) { role = 'mixer'; forCustomer = false; go('mixer'); } },
  labels: () => { if (account) go('labels'); },
  'customer-order': () => { if (account) { role = 'order-taker'; beginOrder(true); } },
  'new-order': () => { if (account) { role = 'drinker'; beginOrder(); } else actions.guest(); },
  'my-orders': () => go('my-orders'),
  back: value => go(value),
  temperature: value => { draft.temperature = value; render(); animate('jump'); },
  drink: value => { draft.drink = value; render(); animate('jump'); },
  syrup: value => { const wasNone = draft.syrup === 'none'; draft.syrup = value; if (value === 'none') draft.pumps = 0; else if (wasNone) draft.pumps = 2; render(); animate('syrup'); },
  'pump-up': () => { if (draft.pumps < 6 && draft.syrup !== 'none') { const previous = draft.pumps; draft.pumps++; render(); animate('syrup', previous); } },
  'pump-down': () => { if (draft.pumps > 0) { clearAnimation(); draft.pumps--; render(); } },
  milk: value => { draft.milk = value; render(); animate('milk'); },
  next: () => {
    if (screen === 'temperature' && draft.temperature) go('drink');
    else if (screen === 'drink' && draft.drink) go('syrup');
    else if (screen === 'syrup') go('milk');
  },
  'submit-order': submitOrder,
  'milk-filter': value => { filter = value; go('steam-queue'); },
  'queue-filter': value => { filter = value; selected.clear(); render(); },
  'select-all': () => { const list = visibleOrders(); const all = list.every(order => selected.has(order.id)); selected = new Set(all ? [] : list.map(order => order.id)); render(); },
  'finish-one': value => finish([value]),
  'finish-selected': () => finish([...selected]),
  'ready-selected': () => {
    const count = selected.size;
    if (!mutateOrders(latest => markReady(latest, [...selected]))) return;
    selected.clear(); render(); toast(`${count} happy ${count === 1 ? 'cup is' : 'cups are'} ready for pickup.`);
  },
  'simulate-ready': () => {
    if (!mutateOrders(latest => markReady(latest, [trackedId]))) return;
    render(); toast('Demo preview: your drink is ready.');
  },
  track: value => { trackedId = value; forCustomer = false; go('status'); },
  seed: () => {
    if (!mutateOrders(latest => {
      const max = Math.max(100, ...latest.map(order => order.number));
      return [...latest, ...seedOrders().map((order, index) => ({ ...order, number: max + index + 1 }))];
    })) return;
    render(); toast('Four sample orders added. The counter is ready.');
  },
  'print-selected': () => {
    const labels = orders.filter(order => selected.has(order.id));
    if (!labels.length) return;
    document.querySelector('#print-area').innerHTML = labels.map(order => `<section class="print-label"><header>CORNER CAFE <strong>#${order.number}</strong></header><h2>${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)}</h2><p>${escapeHtml(orderDetails(order))}</p><small>Made with love.</small></section>`).join('');
    window.print();
  },
};

app.addEventListener('click', event => {
  const element = event.target.closest('[data-action]');
  if (!element || element.disabled) return;
  event.preventDefault();
  const action = actions[element.dataset.action];
  if (!action) return;
  action(element.dataset.value);
  if (['temperature', 'drink', 'syrup', 'milk', 'pump-up', 'pump-down', 'queue-filter', 'select-all'].includes(element.dataset.action)) {
    const candidates = app.querySelectorAll(`[data-action="${element.dataset.action}"]`);
    [...candidates].find(candidate => candidate.dataset.value === element.dataset.value)?.focus({ preventScroll: true });
  }
});

app.addEventListener('submit', event => {
  if (event.target.id !== 'name-form') return;
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const firstName = String(data.get('firstName')).trim();
  const lastName = String(data.get('lastName')).trim();
  if (!firstName || !lastName) {
    toast('Please enter both a first and last name.', true);
    form.querySelector(`[name="${!firstName ? 'firstName' : 'lastName'}"]`).focus();
    return;
  }
  draft.firstName = firstName;
  draft.lastName = lastName;
  if (!forCustomer) Object.assign(account, { firstName, lastName });
  go('temperature');
});

app.addEventListener('change', event => {
  if (!event.target.matches('[data-select]')) return;
  const id = event.target.dataset.select;
  event.target.checked ? selected.add(id) : selected.delete(id);
  render();
  app.querySelector(`[data-select="${id}"]`)?.focus({ preventScroll: true });
});

let pointerStart = null;
app.addEventListener('pointerdown', event => {
  const card = event.target.closest('[data-swipe]');
  if (card && !event.target.closest('button, input, label')) pointerStart = { id: card.dataset.orderId, x: event.clientX, y: event.clientY };
});
app.addEventListener('pointerup', event => {
  if (pointerStart && event.clientX - pointerStart.x > 70 && Math.abs(event.clientY - pointerStart.y) < 65) finish([pointerStart.id]);
  pointerStart = null;
});
app.addEventListener('pointercancel', () => { pointerStart = null; });
window.addEventListener('afterprint', () => { document.querySelector('#print-area').innerHTML = ''; });
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  const wasReady = orders.find(order => order.id === trackedId)?.status === 'ready';
  orders = readOrders();
  const eligibleIds = new Set(visibleOrders().map(order => order.id));
  selected = new Set([...selected].filter(id => eligibleIds.has(id)));
  if (['status', 'mixer', 'labels', 'steam-queue', 'order-taker', 'roles', 'my-orders'].includes(screen) || storageError) render();
  if (!wasReady && orders.find(order => order.id === trackedId)?.status === 'ready') toast('Your coffee is ready! Come say hello at the counter.');
});

const demoEntry = new URLSearchParams(window.location.search).get('demo');
if (demoEntry === 'drinker') {
  account = { type: 'guest' };
  role = 'drinker';
  beginOrder();
} else if (demoEntry === 'team') {
  account = { type: 'guest', firstName: 'Volunteer' };
  role = 'team';
  if (!orders.length && !storageError) {
    mutateOrders(latest => latest.length ? latest : seedOrders());
  }
  go('roles');
} else {
  render();
}
