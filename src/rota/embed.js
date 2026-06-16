// Exact Rota route: keep the Compliance Bible header and icon navigation visible.
(function installExactRotaRoute() {
  const style = document.createElement('style');
  style.textContent = `
    body.is-rota-route { background: #080a0c; padding: 0; overflow-y: auto !important; }
    body.is-rota-route .topbar,
    body.is-rota-route #appShell > .topbar {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 10000 !important;
    }
    body.is-rota-route .bottomNav,
    body.is-rota-route #appShell > .bottomNav {
      display: grid !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: fixed !important;
      z-index: 9999 !important;
    }
    body.is-rota-route #appShell { padding-bottom: 0; min-height: 100vh; overflow: visible !important; }
    body.is-rota-route #app {
      padding-top: calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,80px) + 18px) !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      margin: 0 auto !important;
      max-width: 900px !important;
      width: 100% !important;
      min-height: 100vh;
      overflow: visible !important;
    }
    .rotaExactShell {
      width: 100%;
      min-height: 720px;
      margin: 0;
      padding: 0;
      overflow: visible !important;
      background: #050607;
      border-radius: 24px;
    }
    .rotaExactFrame {
      display: block;
      width: 100%;
      height: 720px;
      min-height: 720px;
      border: 0;
      margin: 0;
      padding: 0;
      background: #050607;
      border-radius: 24px;
      overflow: visible !important;
      opacity: 0 !important;
      transition: opacity .01s linear !important;
    }
    .rotaExactFrame.rotaFrameReady {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

  window.addEventListener('message', event => {
    const data = event && event.data;
    if (!data) return;

    if (data.type === 'rota-app-ready') {
      document.querySelectorAll('.rotaExactFrame').forEach(frame => frame.classList.add('rotaFrameReady'));
      return;
    }

    if (data.type === 'rota-scroll-top') {
      const shell = document.querySelector('.rotaExactShell');
      if (shell) shell.scrollIntoView({ block: 'start', inline: 'nearest' });
      window.scrollTo({ top: shell ? Math.max(0, shell.getBoundingClientRect().top + window.scrollY - 8) : 0, behavior: 'auto' });
      return;
    }

    if (data.type !== 'rota-app-height') return;
    const rawHeight = Number(data.height || 0);
    const height = Math.max(650, Math.min(1800, rawHeight + 8));
    document.querySelectorAll('.rotaExactShell').forEach(shell => shell.style.minHeight = height + 'px');
    document.querySelectorAll('.rotaExactFrame').forEach(frame => {
      frame.style.height = height + 'px';
      frame.style.minHeight = height + 'px';
    });
  });

  rota = function exactRotaAppTab() {
    return `<section class="rotaExactShell"><iframe class="rotaExactFrame" src="rota-app.html?v=20260616-6" title="Rota App"></iframe></section>`;
  };

  const previousRender = render;
  render = function renderWithExactRotaRoute() {
    previousRender();
    document.body.classList.toggle('is-rota-route', route === 'rota');
  };

  render();
})();