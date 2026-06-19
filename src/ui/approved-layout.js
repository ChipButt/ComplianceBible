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

  function navLabel(routeName) {
    return {
      dashboard: 'Home',
      checks: 'Checks',
      documents: 'Docs',
      logs: 'Issues',
      staff: 'Users',
      rota: 'Rota',
      inspection: 'Inspect',
      settings: 'Settings'
    }[routeName] || routeName || '';
  }

  function navIcon(routeName) {
    var icons = {
      dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
      checks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
      documents: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg>',
      logs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
      staff: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
      rota: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 2v4M16 2v4M5 9h14M9 13h2M13 13h2M9 17h2M13 17h2"/></svg>',
      inspection: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
      settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"/><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A8.2 8.2 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"/></svg>'
    };
    return icons[routeName] || '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>';
  }

  function syncBottomNavButtons() {
    document.querySelectorAll('.bottomNav .navBtn').forEach(function (btn) {
      var routeName = btn.getAttribute('data-route') || '';
      var count = btn.getAttribute('data-alert-count') || '';
      btn.setAttribute('aria-label', navLabel(routeName));
      btn.innerHTML = '<span class="navGlyph" ' + (count ? 'data-alert-count="' + count + '"' : '') + '>' + navIcon(routeName) + '</span><span class="navLabel">' + navLabel(routeName) + '</span>';
    });
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
    app.querySelectorAll('.rotaHomeActions button').forEach(function (btn) { if (btn.getAttribute('data-route') === 'rota') btn.remove(); });
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

  function hardScrollToPageTop() {
    var scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function lockStaffProfileOpeningPosition(routeName) {
    if (routeName !== 'staff') return;
    var profile = document.querySelector('.centralProfilePage');
    if (!profile || profile.dataset.openPositionLocked === '1') return;
    profile.dataset.openPositionLocked = '1';
    hardScrollToPageTop();
    requestAnimationFrame(hardScrollToPageTop);
    setTimeout(hardScrollToPageTop, 0);
    setTimeout(hardScrollToPageTop, 80);
    setTimeout(hardScrollToPageTop, 180);
    setTimeout(hardScrollToPageTop, 320);
  }

  function apply() {
    document.querySelectorAll('.statusStrip').forEach(function (el) { el.remove(); });
    syncSettingsTabVisibility();
    setBadge('checks', countChecks());
    setBadge('documents', countDocs());
    setBadge('logs', countIssues());
    syncBottomNavButtons();
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
    lockStaffProfileOpeningPosition(routeName);
  }

  var css = document.createElement('style');
  css.id = 'approved-app-layout-styles';
  css.textContent = [
    '.statusStrip,.mainNav{display:none!important}',
    '#appShell{padding-bottom:0!important;overflow-x:hidden!important}',
    '.topbar{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:300!important;border-radius:0!important;background:#080a0c!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:10px!important;padding:8px 12px!important;min-height:48px!important}',
    '.topbar .eyebrow{display:none!important}',
    '.topbar h1{font-size:18px!important;line-height:1!important;margin:0!important}',
    '#globalProfileCircle{width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;font-size:13px!important}',
    '.bottomNav{position:fixed!important;left:0!important;right:0!important;top:var(--fixed-topbar-height,48px)!important;bottom:auto!important;z-index:299!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;grid-template-rows:27px 27px!important;height:54px!important;gap:0!important;padding:0!important;margin:0!important;background:#b0914a!important;background-color:#b0914a!important;border-radius:0!important;border-top:1px solid rgba(255,255,255,.2)!important;border-bottom:0!important;box-shadow:0 10px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.22)!important;backdrop-filter:none!important;overflow:hidden!important}',
    '.bottomNav::before,.bottomNav::after{display:none!important;content:none!important}',
    '.bottomNav .navBtn[hidden]{display:none!important}',
    '.bottomNav .navBtn{position:relative!important;overflow:visible!important;width:100%!important;min-width:0!important;height:27px!important;min-height:27px!important;border:0!important;border-right:1px solid rgba(0,0,0,.32)!important;border-bottom:1px solid rgba(0,0,0,.2)!important;border-radius:0!important;background:#b0914a!important;color:#fff8ea!important;padding:0 3px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;font-size:9.5px!important;font-weight:900!important;letter-spacing:0!important;text-transform:uppercase!important;line-height:1!important;white-space:nowrap!important;text-shadow:0 1px 1px rgba(0,0,0,.34)!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.18),inset -1px -1px 0 rgba(0,0,0,.16)!important}',
    '.bottomNav .navBtn:nth-child(4n){border-right:0!important}',
    '.bottomNav .navBtn:nth-child(n+5){border-bottom:0!important}',
    '.bottomNav .navBtn.active{background:linear-gradient(180deg,rgba(12,13,14,.88),rgba(6,7,8,.82))!important;color:#f0b84a!important;box-shadow:inset 0 0 0 1px rgba(240,184,74,.45),inset 0 -3px 0 #f0b84a!important}',
    '.bottomNav .navBtn:before{display:none!important;content:none!important}',
    '.bottomNav .navGlyph{position:relative!important;width:15px!important;height:15px!important;min-width:15px!important;display:inline-grid!important;place-items:center!important;color:currentColor!important}',
    '.bottomNav .navGlyph svg{width:15px!important;height:15px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}',
    '.bottomNav .navLabel{display:block!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important}',
    '.bottomNav .navGlyph[data-alert-count]::after{content:attr(data-alert-count)!important;position:absolute!important;right:-8px!important;top:-8px!important;min-width:15px!important;height:15px!important;padding:0 3px!important;border-radius:999px!important;background:#d90808!important;color:#fff!important;font-size:9px!important;font-weight:900!important;line-height:15px!important;text-align:center!important;box-shadow:0 0 0 2px rgba(8,9,10,.96)!important;z-index:3!important}',
    '#app{position:relative!important;z-index:1!important;padding-top:calc(var(--fixed-topbar-height,48px) + var(--fixed-mainnav-height,54px) + 20px)!important}',
    'body.is-staff-route .centralProfilePage{scroll-margin-top:calc(var(--fixed-topbar-height,48px) + var(--fixed-mainnav-height,54px) + 20px)!important}',
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
