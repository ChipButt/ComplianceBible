// Exact Rota route: only the Compliance Bible bottom bar remains.
// Everything above the bottom bar becomes the real Rota App screen.
(function installExactRotaRoute() {
  const style = document.createElement('style');
  style.textContent = `
    body.is-rota-route { background: #eef3ee; padding: 0; }
    body.is-rota-route .topbar { display: none !important; }
    body.is-rota-route #appShell { padding-bottom: 76px; min-height: 100vh; }
    body.is-rota-route #app { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100vw; height: calc(100vh - 76px); overflow: hidden; }
    body.is-rota-route .bottomNav { z-index: 9999; }
    .rotaExactShell { width: 100vw; height: calc(100vh - 76px); margin: 0; padding: 0; overflow: hidden; background: #eef3ee; }
    .rotaExactFrame { display: block; width: 100vw; height: calc(100vh - 76px); border: 0; margin: 0; padding: 0; background: #eef3ee; }
    @supports (height: 100dvh) {
      body.is-rota-route #app { height: calc(100dvh - 76px); }
      .rotaExactShell, .rotaExactFrame { height: calc(100dvh - 76px); }
    }
  `;
  document.head.appendChild(style);

  rota = function exactRotaAppTab() {
    return `<section class="rotaExactShell"><iframe class="rotaExactFrame" src="rota-app.html?v=20260609-3" title="Rota App"></iframe></section>`;
  };

  const previousRender = render;
  render = function renderWithExactRotaRoute() {
    document.body.classList.toggle('is-rota-route', route === 'rota');
    if (route === 'rota') {
      appRoot.innerHTML = rota();
      bind();
      return;
    }
    previousRender();
    document.body.classList.toggle('is-rota-route', route === 'rota');
  };

  render();
})();
