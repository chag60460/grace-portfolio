const loadButton = document.querySelector('#load-demo');
const closeButton = document.querySelector('#close-demo');
const stage = document.querySelector('#demo-stage');
const poster = document.querySelector('#demo-poster');
const status = document.querySelector('#demo-status');
const fullTabLink = document.querySelector('#full-demo-link');
let frame = null;
let mode = '';
let timeout;

function closeDemo(announce = true) {
  clearTimeout(timeout);
  frame?.remove();
  frame = null;
  mode = '';
  poster.hidden = false;
  closeButton.hidden = true;
  loadButton.hidden = false;
  loadButton.textContent = 'Reopen interactive demo';
  if (announce) {
    status.textContent = 'Demo closed. Submitted demo orders stay in this browser; an unfinished order is not saved.';
    loadButton.focus({ preventScroll: true });
  }
}

function launchDemo(nextMode = '') {
  if (frame && mode !== nextMode && !window.confirm('Start a different demo path? Any unfinished order will be discarded. Submitted demo orders will remain.')) return;
  if (frame && mode === nextMode) {
    document.querySelector('#prototype').scrollIntoView({ block: 'start' });
    return;
  }
  closeDemo(false);
  mode = nextMode;
  const url = new URL('play/index.html', window.location.href);
  if (mode) url.searchParams.set('demo', mode);
  frame = document.createElement('iframe');
  frame.title = mode === 'team' ? 'Corner Cafe coffee-team demo with sample orders' : 'Corner Cafe interactive coffee-ordering demo';
  frame.src = url.href;
  fullTabLink.href = url.href;
  const currentFrame = frame;
  frame.addEventListener('error', () => {
    if (frame !== currentFrame) return;
    clearTimeout(timeout);
    status.textContent = 'The demo document could not load. Reload this page or open the demo in a full tab.';
  });
  poster.hidden = true;
  loadButton.hidden = true;
  closeButton.hidden = false;
  status.textContent = 'Opening the cafe and waiting for the app to be ready...';
  timeout = setTimeout(() => {
    status.textContent = 'The app has not reported that it is ready. Reload this page or use the full-tab link; any startup error is shown inside the demo.';
  }, 12000);
  stage.append(frame);
  document.querySelector('#prototype').scrollIntoView({ block: 'start' });
  closeButton.focus({ preventScroll: true });
}

window.addEventListener('message', event => {
  if (!frame || event.source !== frame.contentWindow) return;
  const frameUrl = new URL(frame.src);
  const matchingOrigin = frameUrl.protocol === 'file:'
    ? event.origin === 'null' || event.origin === 'file://'
    : event.origin === frameUrl.origin;
  if (!matchingOrigin) return;
  if (!event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'corner-cafe-ready') {
    clearTimeout(timeout);
    status.textContent = mode === 'team'
      ? 'Team demo ready. Choose a station; sample orders are added only if this browser has no cafe orders yet.'
      : 'Demo ready. Use a fictional name. Orders stay in this browser; Church Center authentication is simulated.';
  } else if (event.data.type === 'corner-cafe-error') {
    clearTimeout(timeout);
    status.textContent = `The cafe could not start: ${String(event.data.message || 'See the error inside the demo.')}`;
  }
});

loadButton.addEventListener('click', () => launchDemo());
closeButton.addEventListener('click', () => closeDemo());
document.querySelectorAll('[data-demo-mode]').forEach(button => {
  button.addEventListener('click', () => launchDemo(button.dataset.demoMode));
});

const sectionNav = document.querySelector('.cc-jump-links');
const sections = [...sectionNav.querySelectorAll('a')].map(link => ({
  link,
  target: document.getElementById(link.hash.slice(1)),
}));
let navHeight = 0;
let navFrame = 0;
function updateSection() {
  navFrame = 0;
  const height = Math.ceil(sectionNav.getBoundingClientRect().height);
  if (height !== navHeight) {
    navHeight = height;
    sectionNav.parentElement.style.setProperty('--cc-nav-height', `${height}px`);
  }
  let current = sections[0];
  for (const section of sections) {
    if (section.target.getBoundingClientRect().top > height + 24) break;
    current = section;
  }
  for (const section of sections) {
    if (section === current) section.link.setAttribute('aria-current', 'location');
    else section.link.removeAttribute('aria-current');
  }
}
function scheduleSectionUpdate() {
  if (!navFrame) navFrame = requestAnimationFrame(updateSection);
}
window.addEventListener('scroll', scheduleSectionUpdate, { passive: true });
window.addEventListener('hashchange', scheduleSectionUpdate);
window.addEventListener('pageshow', scheduleSectionUpdate);
const sectionLayout = new ResizeObserver(scheduleSectionUpdate);
sectionLayout.observe(sectionNav);
sectionLayout.observe(document.querySelector('.cc-body'));
updateSection();

const figmaTabs = [...document.querySelectorAll('[data-figma-tab]')];
const screenGroups = [
  ['At the counter', [['welcome','At the counter'],['cups','Sign-in cups'],['role','Choose your role'],['name','Name entry'],['temperature','Hot or iced']]],
  ['Iced order', [['iced','Iced selected'],['iced-drinks','Iced espresso menu'],['iced-latte','Iced latte'],['iced-syrup','Iced latte base'],['iced-milk','Iced milk choices'],['iced-soy','Soy milk pour'],['iced-receipt','Iced pickup ticket']]],
  ['Hot order', [['hot','Hot selected'],['drinks','Espresso menu'],['americano','Americano: two shots'],['water-receipt','Americano pickup ticket'],['mocha','Mocha recipe'],['syrup','Espresso and chocolate'],['plain-milk','Plain Mocha: milk'],['plain-dairy','Dairy bottle'],['dairy-receipt','Dairy pickup ticket'],['caramel','Caramel: zero pumps'],['one','Caramel: one pump'],['two','Caramel: two pumps'],['milk','Milk choices'],['soy','Soy carton'],['oat','Oat carton'],['receipt','Preparing'],['history','My orders'],['ready','Ready for pickup']]],
  ['Volunteer stations', [['stations','Team stations'],['taking','Order taking'],['customer','Customer name'],['customer-temp','Staff entry'],['customer-hot','Staff temperature'],['customer-drink','Staff Americano'],['customer-ticket','Customer ticket'],['filter','Choose a milk queue'],['all-queue','All milk orders'],['queue','Non-dairy milk queue'],['selected','Selected pours'],['completed','Milk prepared'],['assembly','Drink assembly'],['assembly-selected','Selected drinks'],['pickup','Pickup queue'],['labels','Cup labels'],['labels-selected','Selected labels']]],
];
const screenPicker = document.getElementById('cc-screen-picker');
for (const [group, screens] of screenGroups) {
  const optgroup = document.createElement('optgroup');
  optgroup.label = group;
  for (const [key, title] of screens) optgroup.append(new Option(title, key));
  screenPicker.append(optgroup);
}
const screenImage = document.getElementById('cc-screen-image');
const screenSteps = [...document.querySelectorAll('[data-screen-step]')];
function showScreen() {
  const option = screenPicker.selectedOptions[0];
  const url = `media/app-screens/${option.value}.webp`;
  screenImage.src = url;
  screenImage.alt = `Corner Cafe app screen: ${option.text}.`;
  screenImage.parentElement.scrollTop = 0;
  document.getElementById('cc-full-screen').href = url;
  document.getElementById('cc-screen-position').textContent = `Screen ${screenPicker.selectedIndex + 1} of ${screenPicker.length} · ${option.text}`;
  for (const button of screenSteps) {
    const next = screenPicker.selectedIndex + Number(button.dataset.screenStep);
    button.disabled = next < 0 || next >= screenPicker.length;
  }
}
screenPicker.addEventListener('change', showScreen);
for (const button of screenSteps) button.addEventListener('click', () => {
  screenPicker.selectedIndex += Number(button.dataset.screenStep);
  showScreen();
});
showScreen();

const cupGrid = document.getElementById('cc-cup-grid');
const cupStates = [['coffee', 'Temperature choice'], ['coffee-jump', 'Selected cup'], ['rest-0', 'Espresso & chocolate']];
for (let i = 1; i <= 6; i++) cupStates.push([`pour-${i}`, `Pump ${i}: pouring`], [`rest-${i}`, `Pump ${i}: settled`]);
cupStates.push(['milk-choices','Milk choices'], ['milk-pour','Oat milk pouring'], ['milk-done','Settled Mocha']);
function showCups() {
  const temp = document.querySelector('[name="cc-cup-temp"]:checked').value;
  cupGrid.replaceChildren(...cupStates.map(([key, title]) => {
    const item = document.createElement('li');
    const image = new Image(480, 420);
    image.loading = 'lazy';
    image.alt = '';
    image.src = `media/cup-states/${temp}/${key}.webp`;
    item.append(image, title);
    return item;
  }));
}
document.querySelector('.cc-temperature').addEventListener('change', showCups);
const embedDetails = document.querySelector('.cc-prototype-embed');
embedDetails.addEventListener('toggle', () => {
  const embed = embedDetails.querySelector('iframe');
  if (embedDetails.open && !embed.hasAttribute('src')) embed.src = embed.dataset.src;
});
function selectFigmaTab(tab) {
  figmaTabs.forEach(button => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
  });
  if (tab.dataset.figmaTab === 'cups' && !cupGrid.childElementCount) showCups();
}
figmaTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectFigmaTab(tab));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = figmaTabs[(index + 1) % figmaTabs.length];
    if (event.key === 'ArrowLeft') target = figmaTabs[(index + figmaTabs.length - 1) % figmaTabs.length];
    if (event.key === 'Home') target = figmaTabs[0];
    if (event.key === 'End') target = figmaTabs[figmaTabs.length - 1];
    if (!target) return;
    event.preventDefault();
    selectFigmaTab(target);
    target.focus();
  });
});
const systemTab = document.getElementById('figma-system-tab');
document.querySelectorAll('[data-show-system]').forEach(link => {
  link.addEventListener('click', () => selectFigmaTab(systemTab));
});
