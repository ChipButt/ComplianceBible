// Corrected: the Rota tab must show the actual Rota App UI, not a re-created rota layout.
rota = function exactRotaAppTab() {
  return `<section class="rotaExactShell">
    <iframe class="rotaExactFrame" src="rota-app.html?v=20260609-2" title="Rota App"></iframe>
  </section>`;
};

render();
