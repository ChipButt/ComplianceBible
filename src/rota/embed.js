// Clean rota placeholder.
// The broken rota rebuild and patch stack have been removed from the running app.
(function installCleanRotaPlaceholder(){
  const style = document.createElement('style');
  style.textContent = `
    body.is-rota-route { background:#080a0c; }
    .rotaCleanCard {
      background:#0c1015;
      border:1px solid rgba(176,145,74,.42);
      border-radius:22px;
      padding:22px;
      color:#fff8ea;
      margin:18px auto;
      max-width:720px;
    }
    .rotaCleanCard h2 { margin:0 0 10px; color:#f0b84a; }
    .rotaCleanCard p { margin:0 0 10px; line-height:1.45; }
  `;
  document.head.appendChild(style);

  rota = function cleanRotaRoute(){
    return `<section class="rotaCleanCard"><h2>Rota integration reset</h2><p>The broken rota rebuild has been removed from the running app.</p><p>The next rota build needs to be a clean local import of the original working RotaApp source, not a patch stack.</p></section>`;
  };

  const previousRender = render;
  render = function renderWithCleanRotaRoute(){
    previousRender();
    document.body.classList.toggle('is-rota-route', route === 'rota');
  };

  render();
})();