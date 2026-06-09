// Makes the Compliance Bible Rota tab behave like loading the existing Rota App.
rota = function embeddedRotaAppPage() {
  return `<section class="card rotaEmbedCard">
    <div class="cardTop">
      <div>
        <h2>Rota</h2>
        <p class="muted">Loaded from the existing Rota App branch.</p>
      </div>
      <a class="ghost small rotaOpenLink" href="rota-app.html" target="_blank" rel="noopener">Open full screen</a>
    </div>
    <iframe class="rotaFrame" src="rota-app.html" title="Rota App"></iframe>
  </section>`;
};

render();
