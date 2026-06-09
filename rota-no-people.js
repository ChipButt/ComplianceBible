// Runs inside rota-app.html. Forces the embedded Rota tab to be Schedule-only.
(function scheduleOnlyRotaTab() {
  let rendering = false;

  function cleanTabs() {
    document.querySelectorAll('button').forEach(button => {
      const text = button.textContent.trim().toLowerCase();
      const click = button.getAttribute('onclick') || '';
      const shouldRemove =
        text === 'home' ||
        text === 'people' ||
        text === 'admin' ||
        text === 'timesheets' ||
        text === 'clock in' ||
        click.includes("setView('home')") || click.includes('setView("home")') ||
        click.includes("setView('people')") || click.includes('setView("people")') ||
        click.includes("setView('admin')") || click.includes('setView("admin")') ||
        click.includes("setView('timesheets')") || click.includes('setView("timesheets")') ||
        click.includes("setView('clock')") || click.includes('setView("clock")');
      if (shouldRemove) button.remove();
      if (text === 'schedule') button.classList.add('active');
    });
  }

  function forceScheduleState() {
    if (window.state) {
      window.state.view = 'rota';
      try { if (typeof window.save === 'function') window.save(); } catch (e) {}
    }
  }

  function renderScheduleDirect() {
    if (rendering) return;
    rendering = true;
    try {
      forceScheduleState();
      if (typeof window.renderRota === 'function') {
        window.renderRota();
      } else if (typeof window.render === 'function') {
        window.render();
      }
      forceScheduleState();
      cleanTabs();
    } catch (e) {
      console.error('Schedule-only rota patch failed:', e);
    } finally {
      rendering = false;
    }
  }

  function patchSetView() {
    if (typeof window.setView !== 'function' || window.__scheduleOnlySetViewV3) return;
    const originalSetView = window.setView;
    window.setView = function patchedSetView(view) {
      if (view !== 'rota') {
        forceScheduleState();
        renderScheduleDirect();
        return;
      }
      const result = originalSetView.call(this, 'rota');
      setTimeout(renderScheduleDirect, 0);
      return result;
    };
    window.__scheduleOnlySetViewV3 = true;
  }

  function patchRender() {
    if (typeof window.render !== 'function' || window.__scheduleOnlyRenderV3) return;
    const originalRender = window.render;
    window.render = function patchedRender() {
      if (rendering) return originalRender.apply(this, arguments);
      forceScheduleState();
      const result = typeof window.renderRota === 'function' ? window.renderRota() : originalRender.apply(this, arguments);
      cleanTabs();
      return result;
    };
    window.__scheduleOnlyRenderV3 = true;
  }

  function runPatch() {
    patchSetView();
    patchRender();
    renderScheduleDirect();
    cleanTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPatch);
  } else {
    runPatch();
  }

  window.addEventListener('load', runPatch);
  const interval = setInterval(runPatch, 100);
  setTimeout(() => clearInterval(interval), 10000);
})();