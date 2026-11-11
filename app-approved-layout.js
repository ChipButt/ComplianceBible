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
    document.querySelectorAll('.statusStrip').forEach(el => el.remove());
    setBadge('checks', countChecks());
    setBadge('documents', countDocs());
    setBadge('logs', countIssues());
  }

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