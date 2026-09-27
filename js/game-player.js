document.querySelectorAll('.game-player').forEach(player => {
  const stage = player.querySelector('.game-player-stage');
  const poster = stage.querySelector('img');
  const start = player.querySelector('.game-start');
  const message = player.querySelector('.game-player-status');
  const tools = player.querySelector('.game-player-tools');
  const fullscreen = player.querySelector('.game-fullscreen');
  const close = player.querySelector('.game-close');
  let frame = null;

  start.disabled = false;
  fullscreen.hidden = !document.fullscreenEnabled;

  function loadGame(userInitiated = false) {
    if (frame) return;
    message.hidden = false;

    if (location.protocol === 'file:') {
      message.textContent = 'Game playback requires an HTTP or HTTPS preview.';
      return;
    }

    const embed = document.createElement('iframe');
    embed.title = `Play ${player.dataset.gameTitle}`;
    embed.allow = 'camera; fullscreen; autoplay';
    embed.allowFullscreen = true;
    embed.src = player.dataset.gameSrc;
    frame = embed;

    embed.addEventListener('load', () => {
      if (frame !== embed) return;
      stage.setAttribute('aria-busy', 'false');
      message.textContent = 'Game loaded';
      if (userInitiated) embed.focus({ preventScroll: true });
    }, { once: true });

    message.textContent = 'Loading game...';
    stage.setAttribute('aria-busy', 'true');
    start.hidden = true;
    poster.hidden = true;
    tools.hidden = false;
    player.classList.add('is-playing');
    stage.append(embed);
    if (userInitiated) player.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  start.addEventListener('click', () => loadGame(true));
  loadGame();

  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === player) await document.exitFullscreen();
      else await player.requestFullscreen();
    } catch {
      message.textContent = 'Fullscreen is unavailable in this browser.';
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const expanded = document.fullscreenElement === player;
    const label = expanded ? 'Exit fullscreen' : 'Enter fullscreen';
    fullscreen.setAttribute('aria-pressed', String(expanded));
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label;
  });

  close.addEventListener('click', () => {
    frame?.remove();
    frame = null;
    poster.hidden = false;
    start.hidden = false;
    tools.hidden = true;
    message.hidden = true;
    message.textContent = '';
    stage.setAttribute('aria-busy', 'false');
    player.classList.remove('is-playing');

    if (document.fullscreenElement === player) {
      document.exitFullscreen().catch(() => {
        message.hidden = false;
        message.textContent = 'Press Escape to leave fullscreen.';
      });
    }

    start.focus({ preventScroll: true });
  });
});