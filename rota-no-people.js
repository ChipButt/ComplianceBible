// Runs inside rota-app.html. Removes the Rota App People tab so the main Bible Users tab is the single source of people/profile info.
(function removeRotaPeopleTab() {
  function patch() {
    if (typeof window.shell !== 'function') return false;
    const originalShell = window.shell;
    window.shell = function patchedRotaShell(inner) {
      originalShell(inner);
      document.querySelectorAll('.tabs .tab').forEach(button => {
        if (button.textContent.trim().toLowerCase() === 'people') button.remove();
      });
    };
    if (window.state && window.state.view === 'people') {
      window.state.view = 'rota';
      if (typeof window.save === 'function') window.save();
    }
    if (typeof window.render === 'function') window.render();
    return true;
  }
  if (!patch()) {
    const timer = setInterval(() => { if (patch()) clearInterval(timer); }, 50);
    setTimeout(() => clearInterval(timer), 3000);
  }
})();
