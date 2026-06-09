// Runs inside rota-app.html. Removes the Rota App People option wherever it is regenerated.
(function removeRotaPeopleEverywhere() {
  function removePeopleButtons() {
    document.querySelectorAll('button').forEach(button => {
      const text = button.textContent.trim().toLowerCase();
      const click = button.getAttribute('onclick') || '';
      if (text === 'people' || click.includes("setView('people')") || click.includes('setView("people")')) {
        button.remove();
      }
    });
  }

  function forceAwayFromPeople() {
    if (window.state && window.state.view === 'people') {
      window.state.view = 'rota';
      if (typeof window.save === 'function') window.save();
    }
  }

  function patchShell() {
    if (typeof window.shell !== 'function' || window.__peopleRemovedFromShell) return;
    const originalShell = window.shell;
    window.shell = function patchedRotaShell(inner) {
      originalShell(inner);
      forceAwayFromPeople();
      removePeopleButtons();
    };
    window.__peopleRemovedFromShell = true;
  }

  function patchSetView() {
    if (typeof window.setView !== 'function' || window.__peopleRemovedFromSetView) return;
    const originalSetView = window.setView;
    window.setView = function patchedSetView(view) {
      if (view === 'people') return originalSetView('rota');
      return originalSetView(view);
    };
    window.__peopleRemovedFromSetView = true;
  }

  function patchRender() {
    if (typeof window.render !== 'function' || window.__peopleRemovedFromRender) return;
    const originalRender = window.render;
    window.render = function patchedRender() {
      forceAwayFromPeople();
      originalRender();
      removePeopleButtons();
    };
    window.__peopleRemovedFromRender = true;
  }

  function runPatch() {
    patchShell();
    patchSetView();
    patchRender();
    forceAwayFromPeople();
    removePeopleButtons();
    if (typeof window.render === 'function') window.render();
  }

  runPatch();
  const interval = setInterval(runPatch, 150);
  setTimeout(() => clearInterval(interval), 6000);
})();
