// Core Settings hub.
// Broad permission-group system built directly into the core settings file.
(function coreSettingsHub() {
  if (window.__coreSettingsHubV3) return;
  window.__coreSettingsHubV3 = true;

  var ROTA_KEY = 'rotaAppUnifiedV2';
  var NOTIFICATION_RULES_KEY = 'complianceBible.notificationRules.v1';
  var CORE_GROUPS = ['Admin', 'Supervisor', 'Staff'];

  var SECTIONS = [
    ['pub', 'Pub Details', 'Business identity, logo and app name.'],
    ['users', 'Users & Permission Groups', 'Staff list, profile privacy and permission groups.'],
    ['documents', 'Documents', 'Premises and staff document permissions.'],
    ['checks', 'Checks', 'Checklist templates, setup and notifications.'],
    ['rota', 'Rota & Time', 'Rota access, time records and shift alerts.'],
    ['issues', 'Issues & Inspection', 'Issues, inspection access and report export.'],
    ['areas', 'Work Areas', 'Shared work areas and rota sections.'],
    ['notifications', 'Notification Rules', 'App-wide notification timings.']
  ];

  var PERMISSION_SECTIONS = [
    ['Settings & Pub Details', [
      ['settings.view', 'View Settings'],
      ['settings.managePermissionGroups', 'Manage Permission Groups'],
      ['settings.manageNotificationRules', 'Manage Notification Rules'],
      ['pub.manage', 'Manage Pub Details']
    ]],
    ['Users', [
      ['users.viewList', 'View User List'],
      ['users.viewPersonal', 'View User Personal Details'],
      ['users.viewEmployment', 'View User Employment Details'],
      ['users.viewTraining', 'View User Training Details'],
      ['users.manage', 'Manage Users']
    ]],
    ['Documents', [
      ['premisesDocs.view', 'View Premises Documents'],
      ['premisesDocs.manage', 'Manage Premises Documents'],
      ['premisesDocs.notify', 'Premises Document Notifications'],
      ['staffDocs.viewOwn', 'View Own Staff Documents'],
      ['staffDocs.viewAll', 'View All Staff Documents'],
      ['staffDocs.manage', 'Manage Staff Documents'],
      ['staffDocs.notify', 'Staff Document Notifications']
    ]],
    ['Checks', [
      ['checks.viewAll', 'View All Checks'],
      ['checks.manage', 'Manage Checks'],
      ['checks.notify', 'Check Notifications']
    ]],
    ['Rota & Time', [
      ['rota.view', 'View Rota'],
      ['rota.manage', 'Manage Rota & Time Records'],
      ['time.clockOwn', 'Clock In/Out'],
      ['rota.notify', 'Rota Notifications']
    ]],
    ['Issues & Inspection', [
      ['issues.view', 'View Issues'],
      ['issues.manage', 'Manage Issues'],
      ['issues.resolve', 'Resolve Maintenance Issues'],
      ['issues.notify', 'Issue Notifications'],
      ['shopping.manage', 'Complete / Remove Shopping Items'],
      ['inspection.view', 'View Inspection Mode'],
      ['inspection.export', 'Export Inspection Report']
    ]],
    ['Work Areas', [
      ['workAreas.view', 'View Work Areas'],
      ['workAreas.manage', 'Manage Work Areas']
    ]]
  ];

  var DEFAULTS = {
    Admin: '*',
    Supervisor: {
      'settings.view': true, 'settings.managePermissionGroups': false, 'settings.manageNotificationRules': false, 'pub.manage': false,
      'users.viewList': true, 'users.viewPersonal': false, 'users.viewEmployment': true, 'users.viewTraining': true, 'users.manage': false,
      'premisesDocs.view': true, 'premisesDocs.manage': false, 'premisesDocs.notify': true,
      'staffDocs.viewOwn': true, 'staffDocs.viewAll': true, 'staffDocs.manage': false, 'staffDocs.notify': true,
      'checks.viewAll': true, 'checks.manage': false, 'checks.notify': true,
      'rota.view': true, 'rota.manage': false, 'time.clockOwn': true, 'rota.notify': true,
      'issues.view': true, 'issues.manage': true, 'issues.resolve': true, 'issues.notify': true, 'shopping.manage': true, 'inspection.view': true, 'inspection.export': false,
      'workAreas.view': true, 'workAreas.manage': false
    },
    Staff: {
      'settings.view': false, 'settings.managePermissionGroups': false, 'settings.manageNotificationRules': false, 'pub.manage': false,
      'users.viewList': true, 'users.viewPersonal': false, 'users.viewEmployment': false, 'users.viewTraining': false, 'users.manage': false,
      'premisesDocs.view': true, 'premisesDocs.manage': false, 'premisesDocs.notify': false,
      'staffDocs.viewOwn': true, 'staffDocs.viewAll': false, 'staffDocs.manage': false, 'staffDocs.notify': false,
      'checks.viewAll': false, 'checks.manage': false, 'checks.notify': true,
      'rota.view': true, 'rota.manage': false, 'time.clockOwn': true, 'rota.notify': true,
      'issues.view': false, 'issues.manage': false, 'issues.resolve': false, 'issues.notify': false, 'shopping.manage': false, 'inspection.view': false, 'inspection.export': false,
      'workAreas.view': true, 'workAreas.manage': false
    }
  };

  function h(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function settingsCogIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"/><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A8.2 8.2 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"/></svg>';
  }
  function cssEscape(value) { try { return CSS.escape(String(value)); } catch (_) { return String(value).replace(/"/g, '\\"'); } }
  function readJSON(key, fallback) { try { var parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed || fallback; } catch (_) { return fallback; } }
  function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function saveSafe() { try { if (typeof save === 'function') save(); } catch (_) {} }
  function normalise(value) { return String(value || '').trim().toLowerCase(); }
  function groupOf(user) { return (user && (user.permissionSetId || user.role)) || 'Staff'; }
  function namedAdmin(user) {
    var text = String((user && user.name || '') + ' ' + (user && user.nickname || '') + ' ' + (user && user.email || '')).toLowerCase();
    return text.indexOf('chip') !== -1 || text.indexOf('vicky') !== -1 || text.indexOf('rihanna') !== -1;
  }
  function permissionKeys() {
    return PERMISSION_SECTIONS.reduce(function (out, section) {
      section[1].forEach(function (perm) { out.push(perm[0]); });
      return out;
    }, []);
  }
  function defaultNotificationRules() {
    return { premisesExpiryDays: 30, staffExpiryDays: 30, checkOverdueMinutes: 0, shiftReminderMinutes: 60, lateShiftMinutes: 1, missedClockOutHours: 10, longBreakMinutes: 45, criticalIssuesAlwaysNotifyAdmin: true };
  }
  function areas() {
    var list = [];
    try {
      if (state.rotaSettings && Array.isArray(state.rotaSettings.sections)) list = list.concat(state.rotaSettings.sections);
      if (Array.isArray(state.areas)) list = list.concat(state.areas);
      var rota = readJSON(ROTA_KEY, {});
      if (Array.isArray(rota.sections)) list = list.concat(rota.sections);
    } catch (_) {}
    var unique = Array.from(new Set(list.map(function (item) { return String(item || '').trim(); }).filter(Boolean)));
    return unique.length ? unique : ['FOH', 'Kitchen', 'Office'];
  }
  function syncWorkAreasState() {
    var list = areas();
    state.areas = list.slice();
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = list.slice();
    var rota = readJSON(ROTA_KEY, {});
    rota.sections = list.slice();
    writeJSON(ROTA_KEY, rota);
    return list;
  }

  function ensureState() {
    state.permissionMatrix = state.permissionMatrix || {};
    CORE_GROUPS.forEach(function (group) { state.permissionMatrix[group] = state.permissionMatrix[group] || {}; });
    var keys = permissionKeys();
    Object.keys(state.permissionMatrix).forEach(function (group) {
      var matrix = state.permissionMatrix[group] || {};
      keys.forEach(function (key) {
        if (typeof matrix[key] === 'boolean') return;
        if (DEFAULTS[group] === '*') matrix[key] = true;
        else matrix[key] = !!(DEFAULTS[group] && DEFAULTS[group][key]);
      });
      state.permissionMatrix[group] = matrix;
    });
    (state.users || []).forEach(function (user) {
      if (namedAdmin(user)) { user.permissionSetId = 'Admin'; user.role = 'Admin'; return; }
      if (!user.permissionSetId) user.permissionSetId = user.role || 'Staff';
      if (!state.permissionMatrix[user.permissionSetId]) user.permissionSetId = 'Staff';
      user.role = user.permissionSetId;
    });
    state.pub = state.pub || {};
    state.notificationRules = state.notificationRules || readJSON(NOTIFICATION_RULES_KEY, defaultNotificationRules());
    syncWorkAreasState();
  }

  window.appPermissionAllows = function (key, user) {
    ensureState();
    user = user || (typeof me === 'function' ? me() : null);
    if (!user) return false;
    if (namedAdmin(user)) return true;
    var matrix = state.permissionMatrix && state.permissionMatrix[groupOf(user)];
    return !!(matrix && matrix[key]);
  };

  function allGroups() {
    ensureState();
    return Object.keys(state.permissionMatrix || {}).sort(function (a, b) {
      var ai = CORE_GROUPS.indexOf(a), bi = CORE_GROUPS.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    });
  }

  function settingsPage() {
    ensureState();
    return '<section class="coreSettingsPage"><div class="hero card coreSettingsHero"><div><p class="eyebrow">Settings</p><h2>Settings</h2></div></div><section class="coreSettingsGrid">' + SECTIONS.map(function (section) {
      return '<button type="button" class="coreSettingsTile" data-core-settings-section="' + h(section[0]) + '"><strong>' + h(section[1]) + '</strong><span class="coreSettingsCog" aria-hidden="true">' + settingsCogIcon() + '</span></button>';
    }).join('') + '</section></section>';
  }

  function sectionTitle(id) {
    var section = SECTIONS.find(function (item) { return item[0] === id; });
    return section ? section[1] : 'Settings';
  }
  function sectionBody(id) {
    if (id === 'pub') return pubSection();
    if (id === 'users') return usersSection();
    if (id === 'documents') return '<h3>Premises Documents</h3>' + summary(['premisesDocs.view', 'premisesDocs.manage', 'premisesDocs.notify']) + '<h3>Staff Documents</h3>' + summary(['staffDocs.viewOwn', 'staffDocs.viewAll', 'staffDocs.manage', 'staffDocs.notify']);
    if (id === 'checks') return '<h3>Check Permissions</h3>' + summary(['checks.viewAll', 'checks.manage', 'checks.notify']) + '<h3>Checklist Builder Fields</h3><div class="coreSummaryGrid"><span>Title</span><span>Work area / everyone</span><span>Assigned user / everyone</span><span>Due time</span><span>Daily / Weekly / Monthly / Quarterly / Every 6 Months / Annual</span><span>Check sections</span><span>Photo evidence yes/no</span><span>Signature yes/no</span></div>';
    if (id === 'rota') return '<h3>Rota & Time Permissions</h3>' + summary(['rota.view', 'rota.manage', 'time.clockOwn', 'rota.notify']);
    if (id === 'issues') return '<h3>Issues</h3>' + summary(['issues.view', 'issues.manage', 'issues.resolve', 'issues.notify', 'shopping.manage']) + '<h3>Inspection</h3>' + summary(['inspection.view', 'inspection.export']);
    if (id === 'areas') return areasSection();
    if (id === 'notifications') return notificationsSection();
    return pubSection();
  }

  function pubSection() {
    var pub = state.pub || {};
    return '<form id="corePubForm" class="coreSettingsForm"><label><span>Pub name</span><input name="name" value="' + h(pub.name || '') + '"></label><label><span>App display name</span><input name="appDisplayName" value="' + h(pub.appDisplayName || pub.name || 'Pub Compliance Hub') + '"></label><label><span>Premises licence</span><input name="licence" value="' + h(pub.licence || '') + '"></label><label><span>DPS</span><input name="dps" value="' + h(pub.dps || '') + '"></label><label class="full"><span>Address</span><textarea name="address">' + h(pub.address || '') + '</textarea></label><label class="full"><span>Logo image</span><input name="logo" type="file" accept="image/*"></label>' + (pub.logoData ? '<div class="coreLogoPreview full"><img src="' + pub.logoData + '" alt="Current logo"></div>' : '<div class="coreLogoPreview full">No logo uploaded</div>') + '<button class="primary full">Save Pub Details</button></form>';
  }

  function usersSection() {
    return '<div class="coreUserPreview">' + (state.users || []).map(function (user) {
      var tabs = [];
      if (window.appPermissionAllows('users.viewPersonal') || user.id === state.currentUser) tabs.push('Personal');
      if (window.appPermissionAllows('users.viewEmployment')) tabs.push('Employment');
      if (window.appPermissionAllows('users.viewTraining')) tabs.push('Training');
      return '<button type="button" class="coreUserRow" data-core-open-user="' + h(user.id) + '"><span class="avatarText">' + h(initials(user)) + '</span><span><strong>' + h(user.name || user.nickname || 'User') + '</strong><em>' + h(user.jobArea || user.area || user.role || '') + '</em></span><small>' + (tabs.length ? 'Opens: ' + tabs.join(', ') : 'No profile tab access') + '</small></button>';
    }).join('') + '</div><h3>Permission Groups</h3><div class="corePermissionGroups">' + allGroups().map(groupCard).join('') + createGroupCard() + '</div>';
  }
  function initials(user) {
    var bits = String((user && user.name) || (user && user.nickname) || 'U').trim().split(/\s+/);
    return ((bits[0] || 'U')[0] || 'U') + ((bits[1] || '')[0] || '');
  }

  function groupCard(group) {
    var matrix = state.permissionMatrix[group] || {};
    var users = state.users || [];
    var isCore = CORE_GROUPS.indexOf(group) !== -1;
    return '<details class="corePermissionCard" ' + (group === 'Admin' ? 'open' : '') + '><summary><span><strong>' + h(group) + '</strong><em>' + users.filter(function (u) { return groupOf(u) === group; }).length + ' users</em></span><span class="fdocArrow corePermissionChevron" aria-hidden="true">⌄</span></summary><form class="coreGroupForm" data-core-group-form="' + h(group) + '"><label class="full"><span>Group description</span><textarea name="description">' + h(matrix.description || '') + '</textarea></label><section class="coreAssigned"><h4>Who\'s in this group?</h4>' + quickUserControls() + userTickList(group) + '</section>' + PERMISSION_SECTIONS.map(function (section) { return permissionBlock(section, matrix); }).join('') + '<div class="coreFormActions full"><button class="primary">Save ' + h(group) + '</button>' + (isCore ? '' : '<button type="button" class="secondary danger" data-delete-core-group="' + h(group) + '">Delete Group</button>') + '</div></form></details>';
  }
  function quickUserControls() {
    return '<div class="coreQuickUsers"><label><input type="checkbox" data-select-all-users><span>All users</span></label><label><span>Add by work area</span><select data-select-area-users><option value="">Select work area</option>' + areas().map(function (area) { return '<option value="' + h(area) + '">' + h(area) + '</option>'; }).join('') + '</select></label></div>';
  }
  function userTickList(group) {
    return '<div class="coreUserTicks">' + (state.users || []).map(function (user) {
      var checked = groupOf(user) === group;
      var locked = namedAdmin(user) && group !== 'Admin';
      return '<label class="coreTick"><input type="checkbox" name="user__' + h(user.id) + '" ' + (checked ? 'checked' : '') + ' ' + (locked ? 'disabled' : '') + '><span><strong>' + h(user.nickname || user.name) + '</strong><em>' + h(user.name || '') + '</em></span></label>';
    }).join('') + '</div>';
  }
  function permissionBlock(section, matrix) {
    return '<section class="corePermissionBlock"><h4>' + h(section[0]) + '</h4><div class="corePermissionTicks">' + section[1].map(function (perm) {
      return '<label class="coreTick"><input type="checkbox" name="perm__' + h(perm[0]) + '" ' + (matrix[perm[0]] ? 'checked' : '') + '><span><strong>' + h(perm[1]) + '</strong></span></label>';
    }).join('') + '</div></section>';
  }
  function createGroupCard() {
    return '<details class="corePermissionCard create"><summary><span><strong>Create New Permission Group</strong><em>Copy from an existing group and adjust it.</em></span><span class="fdocArrow corePermissionChevron" aria-hidden="true">⌄</span></summary><form id="coreCreateGroupForm" class="coreSettingsForm"><label><span>New group name</span><input name="name" required></label><label><span>Copy permissions from</span><select name="copyFrom">' + allGroups().map(function (group) { return '<option>' + h(group) + '</option>'; }).join('') + '</select></label><button class="primary full">Create Group</button></form></details>';
  }

  function labelFor(key) {
    for (var i = 0; i < PERMISSION_SECTIONS.length; i++) {
      var found = PERMISSION_SECTIONS[i][1].find(function (perm) { return perm[0] === key; });
      if (found) return found[1];
    }
    return key;
  }
  function summary(keys) {
    return '<div class="coreSummaryGrid">' + keys.map(function (key) { return '<span>' + h(labelFor(key)) + '</span>'; }).join('') + '</div>';
  }
  function areasSection() {
    return '<h3>Work Area Permissions</h3>' + summary(['workAreas.view', 'workAreas.manage']) + '<form id="coreAreaForm" class="coreInlineForm"><input name="area" placeholder="New work area"><button class="primary">Add Work Area</button></form><div class="coreAreaList">' + areas().map(function (area) { return '<div class="coreAreaRow" data-core-area="' + h(area) + '"><button type="button" class="coreDrag" aria-label="Move work area">☰</button><span>' + h(area) + '</span><button type="button" class="settingsDeleteX" data-delete-area="' + h(area) + '" aria-label="Delete ' + h(area) + '">×</button></div>'; }).join('') + '</div>';
  }
  function notificationsSection() {
    var r = state.notificationRules || defaultNotificationRules();
    return '<form id="coreNotificationsForm" class="coreSettingsForm">' + numberField('premisesExpiryDays', 'Premises document expiry warning days', r.premisesExpiryDays) + numberField('staffExpiryDays', 'Staff document expiry warning days', r.staffExpiryDays) + numberField('checkOverdueMinutes', 'Check overdue threshold minutes', r.checkOverdueMinutes) + numberField('shiftReminderMinutes', 'Shift reminder minutes before start', r.shiftReminderMinutes) + numberField('lateShiftMinutes', 'Late shift threshold minutes', r.lateShiftMinutes) + numberField('missedClockOutHours', 'Missed clock-out threshold hours', r.missedClockOutHours) + numberField('longBreakMinutes', 'Long break alert minutes', r.longBreakMinutes) + '<label class="coreTick full"><input type="checkbox" name="criticalIssuesAlwaysNotifyAdmin" ' + (r.criticalIssuesAlwaysNotifyAdmin ? 'checked' : '') + '><span><strong>Critical issues always notify Admin</strong></span></label><button class="primary full">Save Notification Rules</button></form>';
  }
  function numberField(name, label, value) { return '<label><span>' + h(label) + '</span><input type="number" min="0" name="' + h(name) + '" value="' + h(value == null ? 0 : value) + '"></label>'; }

  function openSection(id) {
    ensureState();
    var modal = document.getElementById('modal');
    if (!modal) return;
    var saveButton = id === 'areas' ? '<button type="button" class="primary coreModalSave" data-save-close-core-settings>Save</button>' : '';
    modal.innerHTML = '<div class="modalCard coreSettingsModalCard"><div class="coreModalHandle ' + (saveButton ? 'hasSave' : '') + '"><h2>' + h(sectionTitle(id)) + '</h2>' + saveButton + '<button type="button" class="close" data-close-core-settings>×</button></div><div class="coreModalBody">' + sectionBody(id) + '</div></div>';
    modal.classList.remove('hidden');
    modal.classList.add('settingsCoreModalOpen');
    bindModal(id);
  }
  function closeSection() {
    var modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('settingsCoreModalOpen');
    modal.innerHTML = '';
  }
  window.openCoreSettingsSection = openSection;

  function bindModal(id) {
    var close = document.querySelector('[data-close-core-settings]');
    if (close) close.onclick = closeSection;
    var saveClose = document.querySelector('[data-save-close-core-settings]');
    if (saveClose) saveClose.onclick = closeSection;
    var pub = document.getElementById('corePubForm'); if (pub) pub.onsubmit = savePub;
    document.querySelectorAll('[data-core-open-user]').forEach(function (button) {
      button.onclick = function () {
        var id = button.dataset.coreOpenUser;
        closeSection();
        setTimeout(function () {
          if (typeof window.openUserProfileModal === 'function') window.openUserProfileModal(id);
          else if (typeof openUserEditor === 'function') openUserEditor(id);
        }, 0);
      };
    });
    document.querySelectorAll('[data-core-group-form]').forEach(function (form) { form.onsubmit = function (event) { saveGroup(event, form); }; bindGroupSelectors(form); });
    var create = document.getElementById('coreCreateGroupForm'); if (create) create.onsubmit = createGroup;
    document.querySelectorAll('[data-delete-core-group]').forEach(function (button) { button.onclick = function () { deleteGroup(button.dataset.deleteCoreGroup); }; });
    var areaForm = document.getElementById('coreAreaForm'); if (areaForm) areaForm.onsubmit = addArea;
    document.querySelectorAll('[data-delete-area]').forEach(function (button) { button.onclick = function () { deleteArea(button.dataset.deleteArea); }; });
    bindAreaDrag();
    var notifications = document.getElementById('coreNotificationsForm'); if (notifications) notifications.onsubmit = saveNotifications;
    bindModalDrag();
  }

  function savePub(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = new FormData(form);
    state.pub = state.pub || {};
    ['name', 'appDisplayName', 'licence', 'dps', 'address'].forEach(function (key) { state.pub[key] = String(data.get(key) || '').trim(); });
    var file = form.elements.logo && form.elements.logo.files && form.elements.logo.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function () { state.pub.logoData = reader.result || ''; saveSafe(); applyBranding(); closeSection(); };
      reader.readAsDataURL(file);
    } else { saveSafe(); applyBranding(); closeSection(); }
  }
  function bindGroupSelectors(form) {
    var all = form.querySelector('[data-select-all-users]');
    if (all) all.onchange = function () { form.querySelectorAll('.coreUserTicks input[type="checkbox"]:not(:disabled)').forEach(function (input) { input.checked = all.checked; }); };
    var picker = form.querySelector('[data-select-area-users]');
    if (picker) picker.onchange = function () {
      var area = normalise(picker.value);
      if (!area) return;
      (state.users || []).forEach(function (user) {
        if (normalise(user.jobArea || user.area || '') !== area) return;
        var input = form.querySelector('[name="user__' + cssEscape(user.id) + '"]');
        if (input && !input.disabled) input.checked = true;
      });
      picker.value = '';
    };
  }
  function saveGroup(event, form) {
    event.preventDefault();
    var group = form.dataset.coreGroupForm;
    var matrix = state.permissionMatrix[group] || {};
    matrix.description = form.elements.description ? form.elements.description.value : '';
    permissionKeys().forEach(function (key) { var input = form.querySelector('[name="perm__' + cssEscape(key) + '"]'); matrix[key] = !!(input && input.checked); });
    state.permissionMatrix[group] = matrix;
    (state.users || []).forEach(function (user) {
      if (namedAdmin(user)) { user.permissionSetId = 'Admin'; user.role = 'Admin'; return; }
      var input = form.querySelector('[name="user__' + cssEscape(user.id) + '"]');
      if (input && input.checked) { user.permissionSetId = group; user.role = group; }
      else if (groupOf(user) === group) { user.permissionSetId = 'Staff'; user.role = 'Staff'; }
    });
    saveSafe();
    closeSection();
  }
  function createGroup(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var name = String(form.elements.name.value || '').trim();
    var copyFrom = String(form.elements.copyFrom.value || 'Staff').trim();
    if (!name || state.permissionMatrix[name]) return;
    state.permissionMatrix[name] = Object.assign({}, state.permissionMatrix[copyFrom] || state.permissionMatrix.Staff || {});
    state.permissionMatrix[name].description = 'Custom permission group';
    saveSafe();
    closeSection();
  }
  function deleteGroup(group) {
    if (CORE_GROUPS.indexOf(group) !== -1) return;
    if (!confirm('Delete permission group "' + group + '"? Users in this group will move to Staff.')) return;
    (state.users || []).forEach(function (user) { if (groupOf(user) === group) { user.permissionSetId = 'Staff'; user.role = 'Staff'; } });
    delete state.permissionMatrix[group];
    saveSafe();
    openSection('users');
  }
  function addArea(event) {
    event.preventDefault();
    var name = String(new FormData(event.currentTarget).get('area') || '').trim();
    if (!name) return;
    var list = areas();
    if (!list.some(function (area) { return normalise(area) === normalise(name); })) list.push(name);
    saveAreas(list);
    openSection('areas');
  }
  function deleteArea(area) {
    if (!confirm('Delete work area "' + area + '"?')) return;
    saveAreas(areas().filter(function (item) { return normalise(item) !== normalise(area); }));
    openSection('areas');
  }
  function saveAreas(list) {
    state.areas = list.slice();
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = list.slice();
    var rota = readJSON(ROTA_KEY, {});
    rota.sections = list.slice();
    writeJSON(ROTA_KEY, rota);
    saveSafe();
  }
  function saveNotifications(event) {
    event.preventDefault();
    var data = new FormData(event.currentTarget);
    var rules = defaultNotificationRules();
    ['premisesExpiryDays', 'staffExpiryDays', 'checkOverdueMinutes', 'shiftReminderMinutes', 'lateShiftMinutes', 'missedClockOutHours', 'longBreakMinutes'].forEach(function (key) { rules[key] = Number(data.get(key) || 0); });
    rules.criticalIssuesAlwaysNotifyAdmin = !!data.get('criticalIssuesAlwaysNotifyAdmin');
    state.notificationRules = rules;
    writeJSON(NOTIFICATION_RULES_KEY, rules);
    saveSafe();
    closeSection();
  }

  function bindAreaDrag() {
    document.querySelectorAll('.coreAreaRow .coreDrag').forEach(function (handle) {
      handle.onpointerdown = function (event) {
        var row = handle.closest('.coreAreaRow');
        var list = row && row.parentElement;
        if (!row || !list) return;
        event.preventDefault();
        row.classList.add('dragging');
        var onMove = function (moveEvent) {
          moveEvent.preventDefault();
          var target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
          target = target && target.closest && target.closest('.coreAreaRow');
          if (!target || target === row || target.parentElement !== list) return;
          var rect = target.getBoundingClientRect();
          list.insertBefore(row, moveEvent.clientY > rect.top + rect.height / 2 ? target.nextSibling : target);
        };
        var finish = function () {
          row.classList.remove('dragging');
          saveAreas(Array.from(list.querySelectorAll('.coreAreaRow')).map(function (item) { return item.dataset.coreArea; }).filter(Boolean));
          window.removeEventListener('pointermove', onMove, true);
          window.removeEventListener('pointerup', finish, true);
          window.removeEventListener('pointercancel', finish, true);
        };
        window.addEventListener('pointermove', onMove, true);
        window.addEventListener('pointerup', finish, true);
        window.addEventListener('pointercancel', finish, true);
      };
    });
  }
  function bindModalDrag() {
    var card = document.querySelector('.coreSettingsModalCard');
    var handle = document.querySelector('.coreModalHandle');
    if (!card || !handle) return;
    var startX = 0, startY = 0, baseX = 0, baseY = 0, active = false;
    var move = function (event) {
      if (!active) return;
      var x = baseX + event.clientX - startX;
      var y = baseY + event.clientY - startY;
      card.dataset.x = String(x);
      card.dataset.y = String(y);
      card.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    };
    var stop = function () {
      active = false;
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', stop, true);
      window.removeEventListener('pointercancel', stop, true);
    };
    handle.onpointerdown = function (event) {
      if (event.target.closest('button')) return;
      event.preventDefault();
      active = true;
      startX = event.clientX;
      startY = event.clientY;
      baseX = Number(card.dataset.x || 0);
      baseY = Number(card.dataset.y || 0);
      try { handle.setPointerCapture(event.pointerId); } catch (_) {}
      window.addEventListener('pointermove', move, true);
      window.addEventListener('pointerup', stop, true);
      window.addEventListener('pointercancel', stop, true);
    };
  }
  function applyBranding() {
    var pub = state.pub || {};
    var title = pub.appDisplayName || pub.name || 'Pub Compliance Hub';
    var topbar = document.querySelector('.topbar');
    if (!topbar) return;
    topbar.classList.add('brandedTopbar');
    var h1 = topbar.querySelector('h1');
    if (h1) h1.textContent = title;
    var logo = topbar.querySelector('.appHeaderLogo');
    if (pub.logoData) {
      if (!logo) { logo = document.createElement('img'); logo.className = 'appHeaderLogo'; logo.alt = 'App logo'; var wrap = topbar.firstElementChild; if (wrap) wrap.insertBefore(logo, wrap.firstChild); }
      logo.src = pub.logoData;
      logo.hidden = false;
    } else if (logo) logo.hidden = true;
  }
  function bindSettingsButtons() {
    document.querySelectorAll('[data-core-settings-section]').forEach(function (button) { button.onclick = function () { openSection(button.dataset.coreSettingsSection); }; });
    applyBranding();
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-core-settings-section]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    openSection(button.dataset.coreSettingsSection);
  }, true);
  try { settings = settingsPage; } catch (_) { window.settings = settingsPage; }
  window.settings = settingsPage;
  if (typeof bind === 'function' && !bind.__coreSettingsHubV3) { var oldBind = bind; bind = function () { oldBind(); bindSettingsButtons(); }; bind.__coreSettingsHubV3 = true; }
  if (typeof render === 'function' && !render.__coreSettingsHubV3) { var oldRender = render; render = function () { var result = oldRender(); setTimeout(bindSettingsButtons, 0); return result; }; render.__coreSettingsHubV3 = true; }

  var style = document.createElement('style');
  style.id = 'core-settings-hub-v3-styles';
  style.textContent = '.brandedTopbar>div:first-child{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:center!important;gap:9px!important;min-width:0!important}.appHeaderLogo{width:32px!important;height:32px!important;object-fit:contain!important;border-radius:7px!important;background:rgba(255,255,255,.08)!important}.brandedTopbar h1{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.coreSettingsPage{display:grid!important;gap:14px!important}.coreSettingsGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.coreSettingsTile{min-height:86px!important;padding:12px!important;border-radius:18px!important;text-align:left!important;display:grid!important;align-content:start!important;gap:5px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(208,173,88,.52)!important;color:#fff8ea!important;box-shadow:none!important}.coreSettingsTile strong{color:#fff8ea!important;font-size:15px!important;line-height:1.1!important}.coreSettingsTile span{color:#fff8ea!important;opacity:.88!important;font-size:12px!important;line-height:1.22!important}#modal.settingsCoreModalOpen{position:fixed!important;inset:calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0!important;z-index:1400!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:14px!important;background:rgba(0,0,0,.68)!important;overflow:hidden!important;box-sizing:border-box!important}#modal.settingsCoreModalOpen.hidden{display:none!important}#modal .coreSettingsModalCard{width:min(760px,100%)!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;box-sizing:border-box!important}#modal .coreModalHandle{cursor:grab!important;min-height:58px!important;padding:10px 12px 10px 16px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 40px!important;gap:12px!important;align-items:center!important;background:#151b22!important;border-bottom:1px solid rgba(255,255,255,.09)!important}#modal .coreModalHandle h2{margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#modal .coreModalBody{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:14px!important;display:grid!important;gap:14px!important}.coreSettingsForm{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.coreSettingsForm .full{grid-column:1/-1!important}.coreSettingsForm label{display:grid!important;gap:5px!important;padding:0 4px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}.coreSettingsForm input,.coreSettingsForm textarea,.coreSettingsForm select,.coreInlineForm input{font-size:16px!important}.coreSettingsForm textarea{min-height:76px!important}.coreLogoPreview{min-height:80px!important;display:grid!important;place-items:center!important;border-radius:16px!important;border:1px dashed rgba(208,173,88,.45)!important;color:#aaa194!important;background:rgba(255,255,255,.035)!important}.coreLogoPreview img{max-width:160px!important;max-height:72px!important;object-fit:contain!important}.coreUserPreview{display:grid!important;gap:8px!important}.coreUserRow{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:8px!important;border-radius:13px!important;background:rgba(255,255,255,.04)!important}.coreUserRow div{display:grid!important}.coreUserRow em{font-style:normal!important;color:#aaa194!important;font-size:12px!important}.coreUserRow small{color:#d0ad58!important;font-weight:850!important}.corePermissionGroups{display:grid!important;gap:10px!important}.corePermissionCard{border-radius:18px!important;border:1px solid rgba(255,255,255,.09)!important;background:rgba(255,255,255,.035)!important;overflow:hidden!important}.corePermissionCard summary{min-height:60px!important;padding:12px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 34px!important;align-items:center!important;gap:10px!important;cursor:pointer!important;list-style:none!important}.corePermissionCard summary::-webkit-details-marker{display:none!important}.corePermissionCard summary span{display:grid!important;gap:3px!important}.corePermissionCard summary strong{color:#fff8ea!important}.corePermissionCard summary em{font-style:normal!important;color:#aaa194!important;font-size:12px!important}.corePermissionCard summary b{width:32px!important;height:32px!important;display:grid!important;place-items:center!important;color:#d0ad58!important}.corePermissionCard summary b:before{content:""!important;width:11px!important;height:11px!important;border-right:4px solid currentColor!important;border-bottom:4px solid currentColor!important;transform:rotate(45deg)!important}.corePermissionCard[open] summary b:before{transform:rotate(225deg)!important}.coreGroupForm{display:grid!important;gap:12px!important;padding:0 12px 12px!important}.coreGroupForm label{padding:0 4px!important}.corePermissionBlock{display:grid!important;gap:8px!important;padding:10px!important;border-radius:16px!important;background:rgba(0,0,0,.18)!important}.corePermissionBlock h4,.coreAssigned h4{margin:0!important;color:#d0ad58!important}.corePermissionTicks,.coreUserTicks{display:grid!important;gap:7px!important}.coreUserTicks{max-height:210px!important;overflow:auto!important}.coreTick{display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;gap:9px!important;align-items:start!important;padding:9px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.07)!important}.coreTick input{width:18px!important;height:18px!important;min-height:18px!important;margin:2px 0 0!important}.coreTick span{display:grid!important;gap:2px!important}.coreTick strong{color:#fff8ea!important;font-size:13px!important}.coreTick em{font-style:normal!important;color:#aaa194!important;font-size:11px!important}.coreQuickUsers{display:grid!important;gap:8px!important;margin:8px 0!important;padding:10px!important;border-radius:14px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important}.coreQuickUsers label{display:grid!important;gap:5px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}.coreFormActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}.coreSummaryGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.coreSummaryGrid span{min-height:44px!important;display:grid!important;place-items:center!important;padding:8px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.09)!important;color:#fff8ea!important;font-weight:850!important;text-align:center!important}.coreInlineForm{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important}.coreAreaList{display:grid!important;gap:8px!important}.coreAreaRow{display:grid!important;grid-template-columns:32px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:10px!important;border-radius:14px!important;background:rgba(255,255,255,.05)!important}.coreDrag{min-width:32px!important;width:32px!important;height:38px!important;padding:0!important;background:transparent!important;color:#d0ad58!important;border:0!important}.coreAreaRow.dragging{opacity:.55!important}.danger{color:#ff6b5d!important}@media(max-width:430px){.coreSettingsGrid,.coreSettingsForm,.coreSummaryGrid{grid-template-columns:1fr!important}.coreFormActions{grid-template-columns:1fr!important}.coreUserRow{grid-template-columns:44px minmax(0,1fr)!important}.coreUserRow small{grid-column:1/-1!important}#modal.settingsCoreModalOpen{padding:10px!important}}';
  style.textContent += '.coreSettingsTile{grid-template-columns:minmax(0,1fr) 34px!important;align-items:center!important;align-content:center!important}.coreSettingsTile .coreSettingsCog{justify-self:end!important;width:34px!important;height:34px!important;border-radius:999px!important;display:grid!important;place-items:center!important;background:#071522!important;color:#d0ad58!important;border:1px solid rgba(208,173,88,.56)!important;font-size:18px!important;line-height:1!important;opacity:1!important}.coreSettingsModalCard,.coreSettingsModalCard *{box-sizing:border-box!important}#modal .coreModalHandle{width:100%!important;max-width:100%!important;min-width:0!important}#modal .coreModalHandle h2{min-width:0!important}#modal .coreModalHandle.hasSave{grid-template-columns:minmax(0,1fr) auto 40px!important}.coreModalSave{min-width:76px!important;min-height:40px!important;height:40px!important;border-radius:999px!important;padding:0 14px!important}.corePermissionCard summary .corePermissionChevron{color:#d0ad58!important}.corePermissionCard:not([open]) summary .corePermissionChevron:before{transform:rotate(45deg)!important}.corePermissionCard[open] summary .corePermissionChevron:before{transform:rotate(225deg)!important}.coreSummaryGrid span{cursor:default!important}.coreAreaRow .settingsDeleteX{justify-self:end!important}.coreInlineForm input{min-width:0!important}.coreModalBody button.primary,.coreModalBody .primary{background:#071522!important;color:#fff8ea!important}.coreModalBody .coreSettingsForm>.primary,.coreModalBody .coreFormActions>.primary,.coreModalBody .coreInlineForm>.primary{background:#071522!important;color:#fff8ea!important}';
  style.textContent += '.coreSettingsCog svg{width:19px!important;height:19px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}button.coreUserRow{width:100%!important;min-height:62px!important;border:1px solid rgba(255,255,255,.08)!important;text-align:left!important;color:#fff8ea!important;background:rgba(255,255,255,.04)!important;box-shadow:none!important}.coreUserRow>span:not(.avatarText){display:grid!important;min-width:0!important}.coreUserRow strong{color:#fff8ea!important}.coreUserRow:focus-visible{outline:2px solid rgba(208,173,88,.7)!important;outline-offset:2px!important}.coreSummaryGrid span{min-height:auto!important;display:block!important;place-items:initial!important;padding:8px 0!important;border-radius:0!important;background:transparent!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.07)!important;color:#aaa194!important;font-weight:800!important;text-align:left!important}.coreSummaryGrid span:last-child{border-bottom:0!important}';
  document.head.appendChild(style);

  ensureState();
  saveSafe();
  applyBranding();
  setTimeout(bindSettingsButtons, 0);
})();
