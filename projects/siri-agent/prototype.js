(() => {
  'use strict';

  const root = document.querySelector('[data-siri-prototype]');
  const launch = root.querySelector('[data-prototype-launch]');
  const placeholder = root.querySelector('[data-prototype-placeholder]');
  const status = root.querySelector('[data-prototype-status]');
  const open = root.querySelector('[data-prototype-open]');
  const caption = root.querySelector('[data-prototype-caption]');
  const frameContainer = root.querySelector('.proto-frame');
  const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
  const localPage = window.location.protocol === 'file:' || loopback.has(window.location.hostname);
  const configured = root.dataset.prototypeUrl.trim();
  let prototype;

  if (!configured && !localPage) return;

  try {
    prototype = new URL(configured || 'http://127.0.0.1:5173/?screen=siri');
    const localTarget = loopback.has(prototype.hostname);
    if (prototype.username || prototype.password
      || (!localPage && localTarget)
      || (prototype.protocol !== 'https:' && !(localPage && localTarget && prototype.protocol === 'http:'))) {
      throw new TypeError('Use a hosted HTTPS URL, or a loopback preview URL when viewing the portfolio locally.');
    }
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    console.error('Siri prototype URL is invalid:', error.message);
    status.setAttribute('role', 'alert');
    status.textContent = 'The interactive prototype URL is not configured correctly. The design screens above are still available.';
    return;
  }

  const fullSize = new URL(prototype);
  fullSize.searchParams.delete('embed');
  open.href = fullSize.href;
  open.hidden = false;
  prototype.searchParams.set('embed', '1');
  launch.hidden = false;
  status.textContent = localPage && loopback.has(prototype.hostname)
    ? 'Launch the live Siri app inside this page. The local Siri preview must be running on port ' + prototype.port + '.'
    : 'Launch the live Siri app inside this page. AI replies begin only after you send a message.';
  if (localPage && loopback.has(prototype.hostname)) {
    caption.textContent += ' Local preview only: this connection is not published to the portfolio website.';
  }

  let frame = null;
  let timer;

  const fail = () => {
    window.clearTimeout(timer);
    if (frame) frame.remove();
    frame = null;
    frameContainer.setAttribute('aria-busy', 'false');
    placeholder.hidden = false;
    status.setAttribute('role', 'alert');
    status.textContent = 'The Siri app did not finish loading. Check that the preview is running, or use open full size if the host blocks embedding.';
    launch.disabled = false;
    launch.textContent = 'Try again';
  };

  launch.addEventListener('click', () => {
    window.clearTimeout(timer);
    if (frame) frame.remove();
    launch.disabled = true;
    launch.textContent = 'Loading prototype...';
    status.setAttribute('role', 'status');
    status.textContent = 'Opening Siri. A sleeping free host can take about a minute to wake up.';
    frameContainer.setAttribute('aria-busy', 'true');
    frame = document.createElement('iframe');
    // Keep the loading frame in layout so browsers initialize its app normally.
    frame.className = 'proto-embed proto-embed--loading';
    frame.title = 'Siri Agent interactive prototype';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.src = prototype.href;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.addEventListener('error', fail);
    frameContainer.append(frame);
    timer = window.setTimeout(fail, 90_000);
  });

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== prototype.origin
      || event.data?.type !== 'siri-prototype:ready') return;
    window.clearTimeout(timer);
    frame.classList.remove('proto-embed--loading');
    frame.removeAttribute('aria-hidden');
    frame.removeAttribute('tabindex');
    frameContainer.setAttribute('aria-busy', 'false');
    placeholder.hidden = true;
    frame.focus();
  });
})();
