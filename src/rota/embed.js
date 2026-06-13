// Exact Rota route: keep the Compliance Bible header and icon navigation visible.
(function installExactRotaRoute() {
  const style = document.createElement('style');
  style.textContent = `
    body.is-rota-route { background: #080a0c; padding: 0; }
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
    body.is-rota-route #appShell { padding-bottom: 0; min-height: 100vh; }
    body.is-rota-route #app {
      padding-top: calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,80px) + 18px) !important;
      margin: 0 auto !important;
      max-width: 900px !important;
      width: 100% !important;
      min-height: 100vh;
      overflow: visible;
    }
    .rotaExactShell {
      width: 100%;
      min-height: 620px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #eef3ee;
      border-radius: 24px;
    }
    .rotaExactFrame {
      display: block;
      width: 100%;
      height: 620px;
      border: 0;
      margin: 0;
      padding: 0;
      background: #eef3ee;
      border-radius: 24px;
    }
  `;
  document.head.appendChild(style);

  rota = function exactRotaAppTab() {
    return `<section class="rotaExactShell"><iframe class="rotaExactFrame" src="rota-app.html?v=20260609-3" title="Rota App"></iframe></section>`;
  };

  const previousRender = render;
  render = function renderWithExactRotaRoute() {
    previousRender();
    document.body.classList.toggle('is-rota-route', route === 'rota');
  };

  render();
})();
