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

  function apply() {
    document.querySelectorAll('.statusStrip').forEach(function (el) { el.remove(); });
    setBadge('checks', countChecks());
    setBadge('documents', countDocs());
    setBadge('logs', countIssues());

    var active = document.querySelector('.bottomNav .navBtn.active');
    var routeName = active ? active.getAttribute('data-route') : '';
    document.body.classList.toggle('is-documents-route', routeName === 'documents');

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
  css.textContent = '.statusStrip{display:none!important}.bottomNav .navBtn{position:relative!important;overflow:visible!important}.bottomNav .navBtn[data-alert-count]::after{content:attr(data-alert-count)!important;position:absolute!important;right:8px!important;top:4px!important;min-width:17px!important;height:17px!important;padding:0 4px!important;border-radius:999px!important;background:#d90808!important;color:#fff!important;font-size:10px!important;font-weight:900!important;line-height:17px!important;text-align:center!important;box-shadow:0 0 0 2px rgba(8,9,10,.96)!important;z-index:3!important}body.is-documents-route #app{padding-top:0!important}body.is-documents-route #app > .documentTopBanner{width:calc(100% + 28px)!important;margin:-16px -14px 14px!important;padding:9px 18px 11px!important;border-radius:0!important;border-top:0!important;border-left:0!important;border-right:0!important;min-height:0!important;background:linear-gradient(180deg,#080a0c,#050607)!important;border-bottom:1px solid rgba(255,255,255,.09)!important;box-shadow:0 12px 28px rgba(0,0,0,.28)!important}body.is-documents-route #app > .documentTopBanner .eyebrow{font-size:10px!important;line-height:1!important;margin:0 0 4px!important;letter-spacing:.32em!important;color:#b0914a!important}body.is-documents-route #app > .documentTopBanner h2{font-size:16px!important;line-height:1.08!important;margin:0 0 4px!important;color:#fff8ea!important;letter-spacing:-.03em!important}body.is-documents-route #app > .documentTopBanner p{display:block!important;margin:0!important;font-size:12px!important;line-height:1.25!important;color:#aaa194!important;max-width:32em!important}body.is-documents-route #app > .documentTopBanner button,body.is-documents-route #app > .documentTopBanner .badge{display:none!important}';
  document.head.appendChild(css);

  if (typeof render === 'function' && !render.__approvedAppLayoutWrapped) {
    var oldRender = render;
    render = function () {
      oldRender();
      apply();
    };
    render.__approvedAppLayoutWrapped = true;
  }

  document.addEventListener('click', function () { setTimeout(apply, 0); }, true);
  document.addEventListener('change', function () { setTimeout(apply, 0); }, true);
  setTimeout(apply, 0);
})();