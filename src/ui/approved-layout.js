(function () {
  if (window.__approvedAppLayout) return;
  window.__approvedAppLayout = true;

  function currentUser() {
    try { return typeof me === 'function' ? me() : null; } catch (e) { return null; }
  }

  function userPermissionSet() {
    var u = currentUser();
    if (!u) return null;
    return u.permissionSetId || u.role || 'Staff';
  }

  function namedAdmin() {
    var u = currentUser();
    if (!u) return false;
    var text = String((u.name || '') + ' ' + (u.nickname || '') + ' ' + (u.email || '')).toLowerCase();
    return text.indexOf('chip') !== -1 || text.indexOf('vicky') !== -1 || text.indexOf('rihanna') !== -1;
  }

  function hasPermission(key) {
    var u = currentUser();
    if (!u) return false;
    if (namedAdmin()) return true;
    var role = String(u.role || '').toLowerCase();
    if (role.indexOf('admin') !== -1 || role.indexOf('manager') !== -1 || role.indexOf('supervisor') !== -1) return true;
    var setName = userPermissionSet();
    var matrix = state && state.permissionMatrix && state.permissionMatrix[setName];
    if (matrix && typeof matrix[key] === 'boolean') return !!matrix[key];
    if (setName) {
      var lower = String(setName).toLowerCase();
      if (lower.indexOf('admin') !== -1 || lower.indexOf('manager') !== -1 || lower.indexOf('supervisor') !== -1) return true;
    }
    return false;
  }

  function canSeeSettings() {
    return hasPermission('settings');
  }

  function countDocs() {
    try {
      var u = currentUser();
      var shared = hasPermission('documents') ? (state.docs || []).filter(function (d) { return d.status !== 'Stored' && !d.fileData; }).length : 0;
      var personal = (state.userRequiredDocuments || []).filter(function (d) {
        if (!hasPermission('documents') && u && d.userId !== u.id) return false;
        return !(d.fileData && (d.noExpiry || d.expiryDate || d.expiry));
      }).length;
      return shared + personal;
    } catch (e) { return 0; }
  }

  function countChecks() {
    try {
      if (!hasPermission('checks')) return 0;
      return (state.checks || []).filter(function (c) { return typeof overdue === 'function' && overdue(c); }).length;
    } catch (e) { return 0; }
  }

  function countIssues() {
    try {
      if (!hasPermission('logs')) return 0;
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

  function syncSettingsTabVisibility() {
    var btn = document.querySelector('.bottomNav .navBtn[data-route="settings"]');
    if (!btn) return;
    var allowed = canSeeSettings();
    btn.hidden = !allowed;
    btn.style.display = allowed ? '' : 'none';
    btn.disabled = !allowed;
    btn.setAttribute('aria-hidden', allowed ? 'false' : 'true');
  }

  function routeFromActiveNav() {
    var active = document.querySelector('.bottomNav .navBtn.active:not([hidden])');
    return active ? active.getAttribute('data-route') : '';
  }

  function applyRouteClasses(routeName) {
    document.body.classList.remove('is-dashboard-route','is-checks-route','is-documents-route','is-logs-route','is-staff-route','is-rota-route','is-inspection-route','is-settings-route');
    if (routeName) document.body.classList.add('is-' + routeName + '-route');
  }

  function cleanupDashboard() {
    var app = document.querySelector('#app');
    if (!app) return;
    var countdown = app.querySelector('.homeCountdown');
    if (countdown && countdown.textContent.trim() === 'No upcoming shift.') countdown.textContent = 'No upcoming shift';
    var unscheduled = app.querySelector('.unscheduledHomeBox');
    if (unscheduled) {
      unscheduled.querySelectorAll('h3,.muted').forEach(function (el) { el.remove(); });
      var startButton = unscheduled.querySelector('[data-main-unscheduled-clock]');
      if (startButton && unscheduled.firstElementChild !== startButton) unscheduled.insertBefore(startButton, unscheduled.firstElementChild);
    }
    app.querySelectorAll('.rotaHomeActions button').forEach(function (btn) { if (btn.getAttribute('data-route') !== 'rota') btn.remove(); });
    app.querySelectorAll('#app > .hero.card').forEach(function (hero) { if (!hero.classList.contains('documentTopBanner')) hero.remove(); });
    app.querySelectorAll('#app > .grid.two').forEach(function (grid) {
      var text = grid.textContent || '';
      if (text.indexOf('Urgent actions') !== -1 || text.indexOf('Recent activity') !== -1) grid.remove();
    });
  }

  function applyPageSpacing() {
    var app = document.querySelector('#app');
    if (!app) return;
    app.style.setProperty('position', 'relative', 'important');
    app.style.setProperty('z-index', '1', 'important');
    app.style.setProperty('padding-top', 'calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,80px) + 28px)', 'important');
  }

  function apply() {
    document.querySelectorAll('.statusStrip').forEach(function (el) { el.remove(); });
    syncSettingsTabVisibility();
    setBadge('checks', countChecks());
    setBadge('documents', countDocs());
    setBadge('logs', countIssues());
    setFixedHeights();
    var routeName = routeFromActiveNav();
    applyRouteClasses(routeName);
    applyPageSpacing();
    if (routeName === 'documents') {
      var hero = document.querySelector('#app > .hero.card');
      if (hero) {
        hero.classList.add('documentTopBanner');
        hero.querySelectorAll('.badge,button').forEach(function (b) { b.remove(); });
      }
    }
    if (routeName === 'dashboard') cleanupDashboard();
  }

  var css = document.createElement('style');
  css.id = 'approved-app-layout-styles';
  css.textContent = [
    '.statusStrip,.mainNav{display:none!important}',
    '#appShell{padding-bottom:0!important;overflow-x:hidden!important}',
    '.topbar{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:300!important;border-radius:0!important;background:#080a0c!important}',
    '.bottomNav{position:fixed!important;left:0!important;right:0!important;top:var(--fixed-topbar-height,74px)!important;bottom:auto!important;z-index:299!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;grid-template-rows:40px 40px!important;height:80px!important;gap:0!important;padding:0!important;margin:0!important;background:#b0914a!important;background-color:#b0914a!important;border-radius:0!important;border-top:1px solid rgba(255,255,255,.2)!important;border-bottom:0!important;box-shadow:0 10px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.22)!important;backdrop-filter:none!important;overflow:hidden!important}',
    '.bottomNav::before,.bottomNav::after{display:none!important;content:none!important}',
    '.bottomNav .navBtn[hidden]{display:none!important}',
    '.bottomNav .navBtn{position:relative!important;overflow:visible!important;width:100%!important;min-width:0!important;height:40px!important;min-height:40px!important;border:0!important;border-right:1px solid rgba(0,0,0,.32)!important;border-bottom:1px solid rgba(0,0,0,.2)!important;border-radius:0!important;background:#b0914a!important;color:#fff8ea!important;padding:3px 2px 4px!important;display:grid!important;place-items:center!important;align-content:center!important;gap:1px!important;font-size:10px!important;font-weight:900!important;letter-spacing:.02em!important;text-transform:uppercase!important;line-height:1!important;text-shadow:0 1px 1px rgba(0,0,0,.34)!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.18),inset -1px -1px 0 rgba(0,0,0,.16)!important}',
    '.bottomNav .navBtn:nth-child(4n){border-right:0!important}',
    '.bottomNav .navBtn:nth-child(n+5){border-bottom:0!important}',
    '.bottomNav .navBtn.active{background:linear-gradient(180deg,rgba(12,13,14,.88),rgba(6,7,8,.82))!important;color:#f0b84a!important;box-shadow:inset 0 0 0 1px rgba(240,184,74,.45),inset 0 -3px 0 #f0b84a!important}',
    '.bottomNav .navBtn:before{display:block!important;font-size:15px!important;line-height:1!important;margin-bottom:1px!important;color:currentColor!important}',
    '.bottomNav .navBtn[data-route="dashboard"]:before{content:"⌂"}',
    '.bottomNav .navBtn[data-route="checks"]:before{content:"✓"}',
    '.bottomNav .navBtn[data-route="documents"]:before{content:"▣"}',
    '.bottomNav .navBtn[data-route="logs"]:before{content:"!"}',
    '.bottomNav .navBtn[data-route="staff"]:before{content:"●"}',
    '.bottomNav .navBtn[data-route="rota"]:before{content:"▦"}',
    '.bottomNav .navBtn[data-route="inspection"]:before{content:"◇"}',
    '.bottomNav .navBtn[data-route="settings"]:before{content:"⚙"}',
    '.bottomNav .navBtn[data-alert-count]::after{content:attr(data-alert-count)!important;position:absolute!important;right:5px!important;top:3px!important;min-width:16px!important;height:16px!important;padding:0 4px!important;border-radius:999px!important;background:#d90808!important;color:#fff!important;font-size:10px!important;font-weight:900!important;line-height:16px!important;text-align:center!important;box-shadow:0 0 0 2px rgba(8,9,10,.96)!important;z-index:3!important}',
    '#app{position:relative!important;z-index:1!important;padding-top:calc(var(--fixed-topbar-height,74px) + var(--fixed-mainnav-height,80px) + 28px)!important}',
    'body.is-documents-route #app > .documentTopBanner{position:static!important;width:auto!important;margin:0 0 18px!important;padding:0!important;border-radius:0!important;min-height:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}',
    'body.is-documents-route #app > .documentTopBanner .eyebrow{display:block!important;font-size:10px!important;line-height:1.15!important;margin:0 0 2px!important;letter-spacing:.32em!important;color:#b0914a!important;overflow:visible!important}',
    'body.is-documents-route #app > .documentTopBanner h2{display:none!important}',
    'body.is-documents-route #app > .documentTopBanner p{display:block!important;margin:0!important;font-size:12px!important;line-height:1.15!important;color:#aaa194!important;max-width:32em!important;overflow:visible!important}',
    'body.is-documents-route #app > .documentTopBanner button,body.is-documents-route #app > .documentTopBanner .badge{display:none!important}',
    '.homeClockCard{text-align:center!important;padding:24px 20px!important}',
    '.homeClockTime,.homeCountdown,.homeNextShiftLine{text-align:center!important;display:block!important;width:100%!important}',
    '.homeCountdown{font-weight:900!important}',
    '.unscheduledHomeBox{display:grid!important;gap:12px!important}',
    '.unscheduledHomeBox .unscheduledStartBtn{width:100%!important;max-width:none!important;justify-self:stretch!important;text-align:center!important;background:linear-gradient(180deg,#3fbf68,#238a46)!important;color:#071009!important;border-color:rgba(255,255,255,.22)!important}',
    '.unscheduledHomeBox label{display:grid!important;gap:6px!important}',
    '.rotaHomeActions{grid-template-columns:1fr!important}',
    '.rotaHomeActions button{width:100%!important}',
    'body.is-dashboard-route #app > .sectionTitle,body.is-dashboard-route #app > .grid.cards{display:none!important}'
  ].join('');
  document.head.appendChild(css);

  if (typeof render === 'function' && !render.__approvedAppLayoutWrapped) {
    var oldRender = render;
    render = function () { oldRender(); apply(); };
    render.__approvedAppLayoutWrapped = true;
  }

  window.addEventListener('resize', function () { setTimeout(apply, 0); });
  document.addEventListener('click', function () { setTimeout(apply, 0); }, true);
  document.addEventListener('change', function () { setTimeout(apply, 0); }, true);
  setTimeout(apply, 0);
})();