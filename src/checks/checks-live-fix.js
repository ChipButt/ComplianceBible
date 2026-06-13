// Compatibility binding only. Real Checks UI lives in src/checks/area-groups.js.
(function(){
  try {
    if (window.checks) checks = window.checks;
    if (typeof render === 'function') setTimeout(function(){ render(); }, 0);
  } catch (_) {}
})();
