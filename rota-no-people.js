// Runs inside rota-app.html. Leaves the Rota tab as Schedule-only.
(function scheduleOnlyRotaTab() {
  function removeNonScheduleButtons() {
    document.querySelectorAll('button').forEach(button => {
      const text = button.textContent.trim().toLowerCase();
      const click = button.getAttribute('onclick') || '';
      if (
        text === 'home' || text === 'people' || text === 'admin' || text === 'timesheets' || text === 'clock in' ||
        click.includes("setView('people')") || click.includes('setView("people")') ||
        click.includes("setView('admin')") || click.includes('setView("admin")') ||
        click.includes("setView('timesheets')") || click.includes('setView("timesheets")') ||
        click.includes("setView('clock')") || click.includes('setView("clock")')
      ) button.remove();
    });
  }

  function forceScheduleOnly() {
    if (window.state && window.state.view !== 'rota') {
      window.state.view = 'rota';
      if (typeof window.save === 'function') window.save();
    }
  }

  function patchSetView() {
    if (typeof window.setView !== 'function' || window.__scheduleOnlySetView) return;
    const originalSetView = window.setView;
    window.setView = function patchedSetView(view) {
      if (view !== 'rota') return originalSetView('rota');
      return originalSetView(view);
    };
    window.__scheduleOnlySetView = true;
  }

  function patchRender() {
    if (typeof window.render !== 'function' || window.__scheduleOnlyRender) return;
    const originalRender = window.render;
    window.render = function patchedRender() {
      forceScheduleOnly();
      originalRender();
      removeNonScheduleButtons();
    };
    window.__scheduleOnlyRender = true;
  }

  function patchShell() {
    if (typeof window.shell !== 'function' || window.__scheduleOnlyShell) return;
    const originalShell = window.shell;
    window.shell = function patchedShell(inner) {
      originalShell(inner);
      removeNonScheduleButtons();
    };
    window.__scheduleOnlyShell = true;
  }

  function runPatch() {
    patchSetView();
    patchRender();
    patchShell();
    forceScheduleOnly();
    removeNonScheduleButtons();
    if (typeof window.render === 'function') window.render();
  }

  runPatch();
  const interval = setInterval(runPatch, 150);
  setTimeout(() => clearInterval(interval), 6000);
})();
