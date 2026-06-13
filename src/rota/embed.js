// Exact Rota route: keep the Compliance Bible header and icon navigation visible.
(function installExactRotaRoute() {
  const style = document.createElement('style');
  style.textContent = `
    body.is-rota-route { background: #eef3ee; padding: 0; }
    body.is-rota-route .topbar { display: flex !important; }
    body.is-rota-route #appShell { padding-bottom: 0; min-height: 100vh; }
    body.is-rota-route #app { padding-top: calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,80px) + 18px) !important; margin: 0 auto !important; max-width: 900px !important; width: 100% !important; min-height: 100vh; overflow: visible; }
    body.is-rota-route .bottomNav { z-index: 119; }
    .rotaExactShell { width: 100%; min-height: calc(100vh - var(--fixed-topbar-height,74px) - var(--fixed-mainnav-height,80px)); margin: 0; padding: 0; overflow: hidden; background: #eef3ee; border-radius: 24px; }
    .rotaExactFrame { display: block; width: 100%; height: calc(100vh - var(--fixed-topbar-height,74px) - var(--fixed-mainnav-height,80px) - 28px); min-height: 620px; border: 0; margin: 0; padding: 0; background: #eef3ee; border-radius: 24px; }
    @supports (height: 100dvh) {
      .rotaExactFrame { height: calc(100dvh - var(--fixed-topbar-height,74px) - var(--fixed-mainnav-height,80px) - 28px); }
    }
  `;
  document.head.appendChild(style);

  rota = function exactRotaAppTab() {
    return `<section class="rotaExactShell"><iframe class="rotaExactFrame" src="rota-app.html?v=20260609-3" title="Rota App"></iframe></section>`;
  };

  const previousRender = render;
  render = function renderWithExactRotaRoute() {
    document.body.classList.toggle('is-rota-route', route === 'rota');
    previousRender();
    document.body.classList.toggle('is-rota-route', route === 'rota');
  };

  render();
})();
