(() => {
  // File pages send opaque message origins even when the browser reports "file://".
  const messageOrigin = location.protocol === 'file:' ? 'null' : location.origin;
  const targetOrigin = messageOrigin === 'null' ? '*' : messageOrigin;
  const embedded = window.parent !== window &&
    new URLSearchParams(location.search).get('portfolio-window') === '1';

  if (embedded) {
    document.documentElement.classList.add('project-embedded');
    const home = new URL('../../index.html', location.href);
    const close = (returnToPortfolio = false) => window.parent.postMessage({
      type: 'portfolio-project-close', returnToPortfolio,
    }, targetOrigin);

    // Close the parent window rather than loading another portfolio inside it.
    document.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const destination = new URL(link.href);
      if (destination.origin !== home.origin || destination.pathname !== home.pathname) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close(true);
    }, true);

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.fullscreenElement ||
          document.pointerLockElement || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      close();
    });

    window.parent.postMessage({ type: 'portfolio-project-ready' }, targetOrigin);
    return;
  }

  const dialog = document.getElementById('project-window');
  if (!dialog) return;
  if (typeof dialog.showModal !== 'function') {
    console.warn('Project windows are unavailable in this browser; project links will open normally.');
    return;
  }

  const title = document.getElementById('project-window-title');
  const body = document.getElementById('project-window-body');
  const status = document.getElementById('project-window-status');
  const maximize = document.getElementById('project-window-maximize');
  const dock = document.getElementById('project-dock');
  const dockItems = document.getElementById('project-dock-items');
  const projects = new Map();
  let activeProject = null;

  function renderDock() {
    let minimizedCount = 0;
    projects.forEach(project => {
      const problem = !project.loading && Boolean(project.message);
      project.restoreButton.hidden = !project.minimized;
      project.restoreButton.textContent = `${project.name}${problem ? ' (load issue)' : ''}`;
      project.restoreButton.setAttribute('aria-label', `Restore ${project.name}${problem ? ', loading problem' : ''}`);
      project.restoreButton.title = `Restore ${project.name}`;
      if (project.minimized) minimizedCount++;
    });
    dock.hidden = minimizedCount === 0;
  }

  function renderActiveProject() {
    body.setAttribute('aria-busy', String(Boolean(activeProject?.loading)));
    status.textContent = activeProject?.message || '';
    status.hidden = !activeProject?.message;
    if (!activeProject) return;

    title.textContent = activeProject.name;
    dialog.classList.toggle('is-maximized', activeProject.maximized);
    const maximizeLabel = activeProject.maximized ? 'Restore window size' : 'Maximize project window';
    maximize.setAttribute('aria-pressed', String(activeProject.maximized));
    maximize.setAttribute('aria-label', maximizeLabel);
    maximize.title = maximizeLabel;
  }

  function showLoadProblem(project, message) {
    clearTimeout(project.loadingTimeout);
    project.loading = false;
    project.message = message;
    renderActiveProject();
    renderDock();
  }

  function createProject(card) {
    const name = card.querySelector('.project-name').textContent.trim();
    const url = new URL(card.href);
    url.searchParams.set('portfolio-window', '1');

    const frame = document.createElement('iframe');
    frame.className = 'project-window-frame';
    frame.title = `${name} project`;
    frame.dataset.project = card.id;
    frame.hidden = true;
    frame.allow = 'camera; fullscreen; autoplay';
    frame.allowFullscreen = true;

    const restoreButton = document.createElement('button');
    restoreButton.type = 'button';
    restoreButton.className = 'project-dock-item';
    restoreButton.dataset.project = card.id;
    restoreButton.hidden = true;
    restoreButton.setAttribute('aria-haspopup', 'dialog');
    restoreButton.setAttribute('aria-controls', dialog.id);

    const project = {
      card, name, frame, restoreButton,
      minimized: false,
      maximized: matchMedia('(max-width: 600px)').matches,
      loading: true,
      message: `Loading ${name}...`,
      loadingTimeout: null,
    };
    projects.set(card.id, project);
    restoreButton.addEventListener('click', () => showProject(project, restoreButton));
    frame.addEventListener('error', () => {
      if (projects.get(card.id) !== project) return;
      showLoadProblem(project, 'This project could not be loaded. Close this window and select the card again to retry.');
    });
    frame.src = url.href;
    dockItems.append(restoreButton);
    // Keep frames attached while hidden: moving an iframe reloads its document.
    body.append(frame);
    project.loadingTimeout = setTimeout(() => {
      showLoadProblem(project, 'This project is taking longer than expected. If it stays blank, close this window and select the card again.');
    }, 15000);
    return project;
  }

  function showProject(project, trigger) {
    if (activeProject && activeProject !== project) minimizeProject(activeProject);
    activeProject = project;
    project.minimized = false;
    project.frame.hidden = false;
    renderActiveProject();
    trigger.focus({ preventScroll: true });
    if (!dialog.open) dialog.showModal();
    renderDock();
  }

  function minimizeProject(project) {
    project.minimized = true;
    project.frame.hidden = true;
    activeProject = null;
    dialog.close();
    renderActiveProject();
    renderDock();
    project.restoreButton.focus({ preventScroll: true });
  }

  function closeProject(project) {
    const wasActive = activeProject === project;
    if (wasActive) {
      activeProject = null;
      dialog.close();
    }
    clearTimeout(project.loadingTimeout);
    project.frame.remove();
    project.restoreButton.remove();
    projects.delete(project.card.id);
    renderActiveProject();
    renderDock();
    if (wasActive) {
      const target = project.card.getClientRects().length
        ? project.card
        : document.querySelector('.nav-item[aria-selected="true"]');
      target.focus({ preventScroll: true });
    }
  }

  document.querySelectorAll('.project-card').forEach(card => {
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-controls', dialog.id);
    card.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || (card.target && card.target !== '_self') ||
          card.hasAttribute('download')) return;
      event.preventDefault();
      showProject(projects.get(card.id) || createProject(card), card);
    });
  });
  document.getElementById('project-gallery-hint').hidden = false;

  document.getElementById('project-window-close').addEventListener('click', () => closeProject(activeProject));
  document.getElementById('project-window-minimize').addEventListener('click', () => minimizeProject(activeProject));
  maximize.addEventListener('click', () => {
    activeProject.maximized = !activeProject.maximized;
    renderActiveProject();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeProject(activeProject);
  });

  window.addEventListener('message', event => {
    if (event.origin !== messageOrigin) return;
    const project = [...projects.values()].find(item => event.source === item.frame.contentWindow);
    if (!project) return;
    if (event.data?.type === 'portfolio-project-ready') {
      clearTimeout(project.loadingTimeout);
      project.loading = false;
      project.message = '';
      renderActiveProject();
      renderDock();
    } else if (event.data?.type === 'portfolio-project-close') {
      if (project === activeProject && event.data.returnToPortfolio === true) showSection('about');
      closeProject(project);
    }
  });
})();
