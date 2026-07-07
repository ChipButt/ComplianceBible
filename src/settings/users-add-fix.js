// Settings Users repair for blank demo app.
// Restores a clear Add User action and stops the Users modal opening in a huge expanded/janky state.
(function settingsUsersAddFix() {
  if (window.__settingsUsersAddFixV1) return;
  window.__settingsUsersAddFixV1 = true;

  var injected = false;
  var observer = null;

  function h(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function appState() {
    try { return window.ComplianceApp && ComplianceApp.getState ? ComplianceApp.getState() : window.state || {}; }
    catch (_) { return window.state || {}; }
  }

  function saveAndRender() {
    try { if (window.ComplianceApp && ComplianceApp.save) ComplianceApp.save(); else if (typeof save === 'function') save(); } catch (_) {}
    try { if (window.ComplianceApp && ComplianceApp.render) ComplianceApp.render(); else if (typeof render === 'function') render(); } catch (_) {}
  }

  function newId() {
    try { if (typeof uid === 'function') return uid(); } catch (_) {}
    return 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function userAreas() {
    var state = appState();
    var areas = [];
    if (Array.isArray(state.areas)) areas = areas.concat(state.areas);
    if (state.rotaSettings && Array.isArray(state.rotaSettings.sections)) areas = areas.concat(state.rotaSettings.sections);
    areas = Array.from(new Set(areas.map(function (area) { return String(area || '').trim(); }).filter(Boolean)));
    return areas.length ? areas : ['FOH', 'Kitchen', 'Office'];
  }

  function injectStyle() {
    if (injected) return;
    injected = true;
    var style = document.createElement('style');
    style.id = 'settings-users-add-fix-style';
    style.textContent = [
      '#modal.settingsCoreModalOpen{inset:calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0!important;padding:10px!important;align-items:flex-start!important;overflow:hidden!important}',
      '#modal.settingsCoreModalOpen .coreSettingsModalCard{width:min(720px,100%)!important;max-height:calc(100svh - var(--fixed-topbar-height,112px) - var(--fixed-mainnav-height,80px) - 20px)!important;border-radius:24px!important}',
      '#modal.settingsCoreModalOpen .coreModalBody{padding:12px!important;gap:12px!important;overflow-y:auto!important;overflow-x:hidden!important}',
      '#modal.settingsCoreModalOpen .settingsBlock{padding:14px!important;border-radius:18px!important;max-height:none!important}',
      '.settingsUserActionBar{display:grid!important;gap:10px!important;margin:0 0 14px!important}',
      '.settingsAddUserButton{width:100%!important;min-height:56px!important;border-radius:16px!important;background:linear-gradient(135deg,#b0914a,#d0ad58)!important;color:#070707!important;border:0!important;font-size:17px!important;font-weight:950!important}',
      '.settingsAddUserPanel{display:none!important;margin:0 0 14px!important;padding:14px!important;border-radius:18px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(208,173,88,.42)!important}',
      '.settingsAddUserPanel.open{display:grid!important}',
      '.settingsAddUserForm{display:grid!important;gap:10px!important}',
      '.settingsAddUserForm input,.settingsAddUserForm select{width:100%!important;min-height:48px!important;box-sizing:border-box!important}',
      '.settingsAddUserForm label{display:grid!important;gap:5px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}',
      '.settingsAddUserForm .settingsAddUserActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}',
      '.settingsAddUserError{color:#ff8b80!important;font-weight:900!important;margin:0!important}',
      '#modal.settingsCoreModalOpen .corePermissionCard{max-height:none!important;overflow:hidden!important}',
      '#modal.settingsCoreModalOpen .corePermissionCard:not([open]) form{display:none!important}',
      '#modal.settingsCoreModalOpen .corePermissionCard[open] form{display:grid!important}',
      '#modal.settingsCoreModalOpen .corePermissionCard summary{position:relative!important}',
      '#modal.settingsCoreModalOpen .coreUserPreview{margin-bottom:14px!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function closePermissionGroupsByDefault(modal) {
    if (!modal || modal.dataset.usersFixCollapsed === 'true') return;
    modal.dataset.usersFixCollapsed = 'true';
    modal.querySelectorAll('.corePermissionCard[open]').forEach(function (details) {
      details.removeAttribute('open');
    });
  }

  function currentUsersModal() {
    var modal = document.querySelector('#modal.settingsCoreModalOpen .coreSettingsModalCard');
    if (!modal) return null;
    var title = modal.querySelector('.coreModalHandle h2');
    if (!title || !/Users\s*&\s*Permission Groups/i.test(title.textContent || '')) return null;
    return modal;
  }

  function addUserPanelHtml() {
    var areas = userAreas();
    return '<div class="settingsUserActionBar">' +
      '<button type="button" class="settingsAddUserButton" data-settings-open-add-user>Add User</button>' +
      '<section class="settingsAddUserPanel" data-settings-add-user-panel>' +
      '<form class="settingsAddUserForm" id="settingsAddUserForm">' +
      '<label>Full name<input name="name" placeholder="Full name" required></label>' +
      '<label>Display name / nickname<input name="nickname" placeholder="Nickname shown in app" required></label>' +
      '<label>Email<input name="email" type="email" placeholder="name@example.com" required></label>' +
      '<label>Temporary password<input name="temporaryPassword" type="password" autocomplete="new-password" minlength="6" placeholder="Temporary password" required></label>' +
      '<label>Role<select name="role"><option>Staff</option><option>Supervisor</option><option>Manager</option><option>Admin</option><option>Owner</option></select></label>' +
      '<label>Work area<select name="area">' + areas.map(function (area) { return '<option value="' + h(area) + '">' + h(area) + '</option>'; }).join('') + '</select></label>' +
      '<p class="settingsAddUserError" data-settings-add-user-error hidden></p>' +
      '<div class="settingsAddUserActions"><button type="button" class="secondary" data-settings-cancel-add-user>Cancel</button><button class="primary">Create User</button></div>' +
      '</form></section></div>';
  }

  function enhanceUsersModal() {
    injectStyle();
    var modal = currentUsersModal();
    if (!modal) return;
    closePermissionGroupsByDefault(modal);
    var body = modal.querySelector('.coreModalBody');
    if (!body || body.querySelector('[data-settings-open-add-user]')) return;
    body.insertAdjacentHTML('afterbegin', addUserPanelHtml());
    bindAddUser(body);
  }

  function bindAddUser(root) {
    var open = root.querySelector('[data-settings-open-add-user]');
    var panel = root.querySelector('[data-settings-add-user-panel]');
    var cancel = root.querySelector('[data-settings-cancel-add-user]');
    var form = root.querySelector('#settingsAddUserForm');
    var error = root.querySelector('[data-settings-add-user-error]');
    if (open && panel) open.onclick = function () { panel.classList.add('open'); setTimeout(function () { var input = panel.querySelector('input[name="name"]'); if (input) input.focus(); }, 30); };
    if (cancel && panel) cancel.onclick = function () { panel.classList.remove('open'); if (form) form.reset(); if (error) error.hidden = true; };
    if (!form) return;
    form.onsubmit = function (event) {
      event.preventDefault();
      if (error) { error.hidden = true; error.textContent = ''; }
      var data = Object.fromEntries(new FormData(form).entries());
      var payload = {
        email: String(data.email || '').trim().toLowerCase(),
        temporaryPassword: String(data.temporaryPassword || ''),
        displayName: String(data.name || '').trim(),
        role: data.role || 'Staff',
        permissionSetId: data.role || 'Staff',
        workAreaIds: data.area ? [data.area] : [],
        staffProfile: {
          name: String(data.name || '').trim(),
          nickname: String(data.nickname || data.name || '').trim(),
          email: String(data.email || '').trim().toLowerCase(),
          role: data.role || 'Staff',
          permissionSetId: data.role || 'Staff',
          area: data.area || '',
          jobArea: data.area || ''
        }
      };
      if (!payload.staffProfile.name || !payload.staffProfile.nickname || !payload.email || !payload.temporaryPassword) return;
      var createRemote = window.ComplianceFirebase && window.ComplianceFirebase.isSignedIn && window.ComplianceFirebase.isSignedIn() && typeof window.ComplianceFirebase.createPubUser === 'function';
      if (createRemote) {
        form.querySelector('button.primary').disabled = true;
        window.ComplianceFirebase.createPubUser(payload).then(function () {
          form.reset();
          panel.classList.remove('open');
          form.querySelector('button.primary').disabled = false;
        }).catch(function (err) {
          form.querySelector('button.primary').disabled = false;
          if (error) { error.textContent = err && err.message || 'Could not create user.'; error.hidden = false; }
        });
        return;
      }
      var state = appState();
      state.users = Array.isArray(state.users) ? state.users : [];
      var id = newId();
      state.users.push({ id: id, name: payload.staffProfile.name, nickname: payload.staffProfile.nickname, email: payload.email, role: payload.role, permissionSetId: payload.permissionSetId, area: payload.staffProfile.area, jobArea: payload.staffProfile.jobArea, active: true });
      if (!state.currentUser) state.currentUser = id;
      saveAndRender();
    };
  }

  function start() {
    injectStyle();
    enhanceUsersModal();
    if (observer) return;
    observer = new MutationObserver(enhanceUsersModal);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
