(function () {
  if (window.__approvedAppLayout) return;
  window.__approvedAppLayout = true;

  function currentUser() {
    try { return typeof me === 'function' ? me() : null; } catch (e) { return null; }
  }

  function canSeeSharedAlerts() {
    var u = currentUser();
    var role = String(u && u.role ? u.role : '').toLowerCase();
    return role.indexOf('admin') !== -1 || role.indexOf('manager') !== -1 || role.indexOf('supervisor') !== -1;
  }

  function countDocs() {
    try {
      var u = currentUser();
      var shared = canSeeSharedAlerts() ? (state.docs || []).filter(function (d) { return d.status !== 'Stored' && !d.fileData; }).length : 0;
      var personal = (state.userRequiredDocuments || []).filter(function (d) {
        if (!canSeeSharedAlerts() && u && d.userId !== u.id) return false;
        return !(d.fileData && (d.noExpiry || d.expiryDate || d.expiry));
      }).length;
      return shared + personal;
    } catch (e) { return 0; }
  }

  function countChecks() {
    try {
      if (!canSeeSharedAlerts()) return 0;
      return (state.checks || []).filter(function (c) { return typeof overdue === 'function' && overdue(c); }).length;
    } catch (e) { return 0; }
  }

  function countIssues() {
    try {
      if (!canSeeSharedAlerts()) return 0;
      return (state.issues || []).filter(function (i) { return i.status !== 'Resolved'; }).length;
    } catch (e) { return 0; }
  }

  function setBadge(routeName, count) {
    var btn = document.querySelector('.bottomNav .navBtn[data-route="' + routeName + '"]');
    if (!btn) return;
    if (count > 0) btn.setAttribute('data-alert-count', String(count));
    else btn.removeAttribute('data-alert-count');
  }

  function setFixedHeights() {
    var top = document.querySelector('.topbar');
    var nav = document.querySelector('.bottomNav');
    if (top) document.documentElement.style.setProperty('--fixed-topbar-height', top.offsetHeight + 'px');
    if (nav) document.documentElement.style.setProperty('--fixed-mainnav-height', nav.offsetHeight + 'px');
  }

  function routeFromActiveNav() {
    var active = document.querySelector('.bottomNav .navBtn.active');
    return active ? active.getAttribute('data-route') : '';
  }

  function applyRouteClasses(routeName) {
    document.body.classList.remove('is-dashboard-route','is-checks-route','is-documents-route','is-logs-route','is-staff-route','is-rota-route','is-inspection-route','is-settings-route');
    if (routeName) document.body.classList.add('is-' + routeName + '-route');
  }

  function apply() {
    document.querySelectorAll('.statusStrip').forEach(function (el) { el.remove(); });
    setBadge('checks', countChecks());
    setBadge('documents', countDocs());
    setBadge('logs', countIssues());
    setFixedHeights();

    var routeName = routeFromActiveNav();
    applyRouteClasses(routeName);

    if (routeName === 'documents') {
      var hero = document.querySelector('#app > .hero.card');
      if (hero) {
        hero.classList.add('documentTopBanner');
        hero.querySelectorAll('.badge,button').forEach(function (b) { b.remove(); });
      }
    }
  }

  var css = document.createElement('style');
  css.id = 'approved-app-layout-styles';
  css.textContent = [
    '.statusStrip,.mainNav{display:none!important}',
    '#appShell{padding-bottom:0!important;overflow-x:hidden!important}',
    '.topbar{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:120!important;border-radius:0!important}',
    '.bottomNav{position:fixed!important;left:0!important;right:0!important;top:var(--fixed-topbar-height,74px)!important;bottom:auto!important;z-index:119!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;grid-auto-rows:42px!important;gap:0!important;padding:0!important;background:#b0914a!important;border-top:1px solid rgba(255,255,255,.16)!important;border-bottom:1px solid rgba(0,0,0,.55)!important;box-shadow:0 10px 24px rgba(0,0,0,.23)!important;backdrop-filter:none!important;overflow:visible!important}',
    '.bottomNav .navBtn{position:relative!important;overflow:visible!important;width:100%!important;min-width:0!important;height:42px!important;min-height:42px!important;border:0!important;border-right:1px solid rgba(0,0,0,.28)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;border-radius:0!important;background:transparent!important;color:#fff8ea!important;padding:3px 2px 4px!important;display:grid!important;place-items:center!important;align-content:center!important;gap:1px!important;font-size:10px!important;font-weight:900!important;letter-spacing:.02em!important;text-transform:uppercase!important;line-height:1!important}',
    '.bottomNav .navBtn:nth-child(4n){border-right:0!important}',
    '.bottomNav .navBtn.active{background:rgba(5,6,7,.76)!important;color:#f0b84a!important;box-shadow:inset 0 0 0 1px rgba(240,184,74,.32)!important}',
    '.bottomNav .navBtn:before{display:block!important;font-size:15px!important;line-height:1!important;margin-bottom:1px!important;color:currentColor!important}',
    '.bottomNav .navBtn[data-route="dashboard"]:before{content:"⌂"}',
    '.bottomNav .navBtn[data-route="checks"]:before{content:"✓"}',
    '.bottomNav .navBtn[data-route="documents"]:before{content:"▣"}',
    '.bottomNav .navBtn[data-route="logs"]:before{content:"≡"}',
    '.bottomNav .navBtn[data-route="staff"]:before{content:"●"}',
    '.bottomNav .navBtn[data-route="rota"]:before{content:"◷"}',
    '.bottomNav .navBtn[data-route="inspection"]:before{content:"◇"}',
    '.bottomNav .navBtn[data-route="settings"]:before{content:"⚙"}',
    '.bottomNav .navBtn[data-alert-count]::after{content:attr(data-alert-count)!important;position:absolute!important;right:5px!important;top:3px!important;min-width:16px!important;height:16px!important;padding:0 4px!important;border-radius:999px!important;background:#d90808!important;color:#fff!important;font-size:10px!important;font-weight:900!important;line-height:16px!important;text-align:center!important;box-shadow:0 0 0 2px rgba(8,9,10,.96)!important;z-index:3!important}',
    'body:not(.is-documents-route) #app{padding-top:calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,86px) + 12px)!important}',
    'body.is-documents-route #app{padding-top:calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,86px) + var(--docbar-fixed-height,42px) + 12px)!important}',
    'body.is-documents-route #app > .documentTopBanner{position:fixed!important;top:calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,86px))!important;left:0!important;right:0!important;z-index:118!important;width:100%!important;margin:0!important;padding:5px 18px 7px!important;border-radius:0!important;border-top:0!important;border-left:0!important;border-right:0!important;min-height:var(--docbar-fixed-height,42px)!important;overflow:visible!important;background:linear-gradient(180deg,#080a0c,#050607)!important;border-bottom:1px solid rgba(255,255,255,.09)!important;box-shadow:0 10px 24px rgba(0,0,0,.25)!important}',
    'body.is-documents-route #app > .documentTopBanner .eyebrow{display:block!important;font-size:10px!important;line-height:1.15!important;margin:0 0 2px!important;letter-spacing:.32em!important;color:#b0914a!important;overflow:visible!important}',
    'body.is-documents-route #app > .documentTopBanner h2{display:none!important}',
    'body.is-documents-route #app > .documentTopBanner p{display:block!important;margin:0!important;font-size:12px!important;line-height:1.15!important;color:#aaa194!important;max-width:32em!important;overflow:visible!important}',
    'body.is-documents-route #app > .documentTopBanner button,body.is-documents-route #app > .documentTopBanner .badge{display:none!important}'
  ].join('');
  document.head.appendChild(css);

  if (typeof render === 'function' && !render.__approvedAppLayoutWrapped) {
    var oldRender = render;
    render = function () {
      oldRender();
      apply();
    };
    render.__approvedAppLayoutWrapped = true;
  }

  window.addEventListener('resize', function () { setTimeout(apply, 0); });
  document.addEventListener('click', function () { setTimeout(apply, 0); }, true);
  document.addEventListener('change', function () { setTimeout(apply, 0); }, true);
  setTimeout(apply, 0);
})();
