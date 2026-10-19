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

const figmaTabs = [...document.querySelectorAll('[data-figma-tab]')];
function selectFigmaTab(tab) {
  figmaTabs.forEach(button => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
  });
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
document.querySelector('[data-show-system]').addEventListener('click', () => selectFigmaTab(figmaTabs[1]));
