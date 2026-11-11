(function installExactRotaRoute() {
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
