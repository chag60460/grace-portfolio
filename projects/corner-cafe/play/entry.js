function report(type, message = '') {
  if (window.parent !== window) {
    window.parent.postMessage({ type, message }, '*');
  }
}

import('./app.js').then(() => {
  if (!document.querySelector('#app h1')) {
    throw new Error('The cafe did not render its first screen.');
  }
  report('corner-cafe-ready');
}).catch(error => {
  console.error('Corner Cafe startup failed:', error);
  const panel = document.createElement('section');
  panel.style.cssText = 'max-width:520px;margin:60px auto;padding:28px;font:16px/1.7 system-ui;color:#543b45;background:#fff7f8;border:1px solid #eedce3;border-radius:16px';
  panel.setAttribute('role', 'alert');
  const heading = document.createElement('h1');
  heading.textContent = 'The cafe could not open.';
  const detail = document.createElement('p');
  detail.textContent = error instanceof Error ? error.message : String(error);
  const help = document.createElement('p');
  help.textContent = 'Reload this page. If you opened a downloaded HTML file, try the portfolio’s HTTP preview instead.';
  panel.append(heading, detail, help);
  document.querySelector('#app').replaceChildren(panel);
  report('corner-cafe-error', detail.textContent);
});
