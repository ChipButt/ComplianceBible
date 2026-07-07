// Core Settings hub.
// Broad permission-group system built directly into the core settings file.
(function coreSettingsHub() {
  if (window.__coreSettingsHubV3) return;
  window.__coreSettingsHubV3 = true;

  var ROTA_KEY = 'rotaAppUnifiedV2';
  var NOTIFICATION_RULES_KEY = 'complianceBible.notificationRules.v1';
  var REQ_KEY = 'complianceUserDocumentRequirementsV1';
  var GROUP_KEY = 'complianceStaffDocumentGroupsV1';
  var CLEAN_FLAG = 'complianceStaffDocGroupsCleanedToSevenV1';
  var CORE_GROUPS = ['Owner', 'Admin', 'Manager', 'Supervisor', 'Staff'];
  var CORE_STAFF_GROUPS = [
    { id: 'Office', label: 'Office' },
    { id: 'FOH', label: 'FOH' },
    { id: 'Kitchen', label: 'Kitchen' },
    { id: 'KP', label: 'KP' },
    { id: 'Housekeeping', label: 'Housekeeping' },
    { id: 'WFH', label: 'WFH' },
    { id: 'Hybrid', label: 'Hybrid' }
  ];
  var FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Annual', 'Every 6 Months'];
  var openDocGroups = {};
  var openCreateDocGroup = false;
  var settingsModalLockedScrollY = 0;
  var logoPreviewId = '';
  var logoPreviewData = '';
  var logoResolvingId = '';

  var SECTIONS = [
    ['pub', 'Pub Details', 'Business identity, logo and app name.'],
    ['users', 'Users & Permission Groups', 'Staff list, profile privacy and permission groups.'],
    ['documents', 'Work Area Documents', 'Premises document groups and required staff documents.'],
    ['checks', 'Checklist Setup', 'Checklist setup and reusable check sections.'],
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
      ['users.manage', 'Manage Users'],
      ['users.create', 'Create Firebase Users'],
      ['users.edit', 'Edit Users'],
      ['users.archive', 'Archive Users']
    ]],
    ['Documents', [
      ['premisesDocs.view', 'View Premises Documents'],
      ['premisesDocs.manage', 'Manage Premises Documents'],
      ['premisesDocs.notify', 'Premises Document Notifications'],
      ['staffDocs.viewOwn', 'View Own Staff Documents'],
      ['staffDocs.viewAll', 'View All Staff Documents'],
      ['staffDocs.manage', 'Manage Staff Documents'],
      ['staffDocs.notify', 'Staff Document Notifications'],
      ['documents.managePremises', 'Manage Premises Documents'],
      ['documents.manageStaff', 'Manage Staff Documents'],
      ['documents.uploadOwn', 'Upload Own Documents'],
      ['documents.viewOwn', 'View Own Documents'],
      ['documents.viewAll', 'View All Documents']
    ]],
    ['Checks', [
      ['checks.viewAll', 'View All Checks'],
      ['checks.manage', 'Manage Checks'],
      ['checks.notify', 'Check Notifications'],
      ['checks.create', 'Create Checks'],
      ['checks.complete', 'Complete Checks']
    ]],
    ['Rota & Time', [
      ['rota.view', 'View Rota'],
      ['rota.manage', 'Manage Rota & Time Records'],
      ['rota.viewOwn', 'View Own Rota'],
      ['time.clockOwn', 'Clock In/Out'],
      ['rota.notify', 'Rota Notifications']
    ]],
    ['Issues & Inspection', [
      ['issues.view', 'View Issues'],
      ['issues.manage', 'Manage Issues'],
      ['issues.create', 'Create Issues'],
      ['issues.resolve', 'Resolve Maintenance Issues'],
      ['issues.notify', 'Issue Notifications'],
      ['shopping.manage', 'Complete / Remove Shopping Items'],
      ['inspection.view', 'View Inspection Mode'],
      ['inspection.export', 'Export Inspection Report'],
      ['audit.view', 'View Audit Log']
    ]],
    ['Work Areas', [
      ['workAreas.view', 'View Work Areas'],
      ['workAreas.manage', 'Manage Work Areas']
    ]],
    ['Security', [
      ['settings.manage', 'Manage Settings'],
      ['permissions.manage', 'Manage Permissions']
    ]]
  ];

  var DEFAULTS = {
    Owner: '*',
    Admin: '*',
    Manager: '*',
    Supervisor: {
      'settings.view': true, 'settings.manage': false, 'settings.managePermissionGroups': false, 'settings.manageNotificationRules': false, 'permissions.manage': false, 'pub.manage': false,
      'users.viewList': true, 'users.viewPersonal': false, 'users.viewEmployment': true, 'users.viewTraining': true, 'users.manage': false, 'users.create': false, 'users.edit': false, 'users.archive': false,
      'premisesDocs.view': true, 'premisesDocs.manage': false, 'premisesDocs.notify': true,
      'staffDocs.viewOwn': true, 'staffDocs.viewAll': true, 'staffDocs.manage': false, 'staffDocs.notify': true,
      'documents.managePremises': false, 'documents.manageStaff': false, 'documents.uploadOwn': true, 'documents.viewOwn': true, 'documents.viewAll': true,
      'checks.viewAll': true, 'checks.manage': false, 'checks.create': false, 'checks.complete': true, 'checks.notify': true,
      'rota.view': true, 'rota.viewOwn': true, 'rota.manage': false, 'time.clockOwn': true, 'rota.notify': true,
      'issues.view': true, 'issues.manage': true, 'issues.create': true, 'issues.resolve': true, 'issues.notify': true, 'shopping.manage': true, 'inspection.view': true, 'inspection.export': false, 'audit.view': false,
      'workAreas.view': true, 'workAreas.manage': false
    },
    Staff: {
      'settings.view': false, 'settings.manage': false, 'settings.managePermissionGroups': false, 'settings.manageNotificationRules': false, 'permissions.manage': false, 'pub.manage': false,
      'users.viewList': false, 'users.viewPersonal': false, 'users.viewEmployment': false, 'users.viewTraining': false, 'users.manage': false, 'users.create': false, 'users.edit': false, 'users.archive': false,
      'premisesDocs.view': true, 'premisesDocs.manage': false, 'premisesDocs.notify': false,
      'staffDocs.viewOwn': true, 'staffDocs.viewAll': false, 'staffDocs.manage': false, 'staffDocs.notify': false,
      'documents.managePremises': false, 'documents.manageStaff': false, 'documents.uploadOwn': true, 'documents.viewOwn': true, 'documents.viewAll': false,
      'checks.viewAll': false, 'checks.manage': false, 'checks.create': false, 'checks.complete': true, 'checks.notify': true,
      'rota.view': true, 'rota.viewOwn': true, 'rota.manage': false, 'time.clockOwn': true, 'rota.notify': true,
      'issues.view': false, 'issues.manage': false, 'issues.create': true, 'issues.resolve': false, 'issues.notify': false, 'shopping.manage': false, 'inspection.view': false, 'inspection.export': false, 'audit.view': false,
      'workAreas.view': true, 'workAreas.manage': false
    }
  };

  var PERMISSION_ALIASES = {
    'settings.manage': ['settings.manage', 'pub.manage'],
    'permissions.manage': ['permissions.manage', 'settings.managePermissionGroups'],
    'users.create': ['users.create', 'users.manage'],
    'users.edit': ['users.edit', 'users.manage'],
    'users.archive': ['users.archive', 'users.manage'],
    'documents.managePremises': ['documents.managePremises', 'premisesDocs.manage'],
    'documents.manageStaff': ['documents.manageStaff', 'staffDocs.manage'],
    'documents.uploadOwn': ['documents.uploadOwn', 'staffDocs.viewOwn'],
    'documents.viewOwn': ['documents.viewOwn', 'staffDocs.viewOwn'],
    'documents.viewAll': ['documents.viewAll', 'staffDocs.viewAll'],
    'checks.create': ['checks.create', 'checks.manage'],
    'checks.complete': ['checks.complete', 'checks.viewAll'],
    'rota.viewOwn': ['rota.viewOwn', 'rota.view'],
    'issues.create': ['issues.create', 'issues.view'],
    'issues.manage': ['issues.manage', 'issues.resolve']
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
  function normaliseFrequency(value) {
    var text = String(value || 'Daily').trim();
    var key = text.toLowerCase();
    if (key === 'yearly') return 'Annual';
    if (key === 'six-monthly' || key === 'six monthly' || key === 'every six months') return 'Every 6 Months';
    return text || 'Daily';
  }
  function frequencyOptions(selected) {
    var current = normaliseFrequency(selected);
    return FREQUENCY_OPTIONS.map(function (item) {
      return '<option value="' + h(item) + '" ' + (item === current ? 'selected' : '') + '>' + h(item) + '</option>';
    }).join('');
  }
  function todayISO() { try { return typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10); } catch (_) { return new Date().toISOString().slice(0, 10); } }
  function fieldChecked(form, name) { return !!(form && form.elements && form.elements[name] && form.elements[name].checked); }
  function groupOf(user) { return (user && (user.permissionSetId || user.role)) || 'Staff'; }
  function isSystemUser(user) { return !!(user && (user.hidden === true || user.setupAdmin === true)); }
  function showSystemUsers() { return !!(window.ComplianceFirebase && typeof window.ComplianceFirebase.showSystemUsers === 'function' && window.ComplianceFirebase.showSystemUsers()); }
  function visibleUsers() {
    var users = state.users || [];
    return showSystemUsers() ? users : users.filter(function (user) { return !isSystemUser(user); });
  }
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
    return { premisesExpiryDays: 30, staffExpiryDays: 30, checkOverdueMinutes: 0, shiftReminderMinutes: 60, lateShiftMinutes: 1, missedClockOutHours: 10, longBreakMinutes: 45, criticalIssuesAlwaysNotifyAdmin: true, pushEnabled: true, pushApiBase: '', pushVapidPublicKey: '' };
  }
  function stableReqId(title) {
    return 'req_' + String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function coreStaffGroupIds() {
    return CORE_STAFF_GROUPS.map(function (group) { return group.id; });
  }
  function isCoreStaffGroup(groupId) {
    return CORE_STAFF_GROUPS.some(function (group) {
      return normalise(group.id) === normalise(groupId) || normalise(group.label) === normalise(groupId);
    });
  }
  function getDocGroups() {
    var wasCleaned = localStorage.getItem(CLEAN_FLAG) === 'true';
    var saved = readJSON(GROUP_KEY, []);
    var byId = {};
    CORE_STAFF_GROUPS.forEach(function (group) { byId[normalise(group.id)] = { id: group.id, label: group.label }; });
    if (wasCleaned && Array.isArray(saved)) {
      saved.forEach(function (group) {
        if (group && group.id && !byId[normalise(group.id)]) byId[normalise(group.id)] = { id: group.id, label: group.label || group.id };
      });
    }
    var groups = Object.keys(byId).map(function (key) { return byId[key]; });
    writeJSON(GROUP_KEY, groups);
    localStorage.setItem(CLEAN_FLAG, 'true');
    return groups;
  }
  function validStaffGroups(groups) {
    var valid = getDocGroups().map(function (group) { return normalise(group.id); });
    return (Array.isArray(groups) ? groups : []).filter(function (group) { return valid.indexOf(normalise(group)) !== -1; });
  }
  function defaultRequirements() {
    var all = coreStaffGroupIds();
    var kitchen = ['Kitchen', 'KP'];
    return [
      ['New Starter Pay Information', all, 'none'],
      ['New Starter Medical Questionnaire', all, 'none'],
      ['Piston Club Handbook Declaration', all, 'none'],
      ['Fire Safety & Training', all, 'none'],
      ['Food Allergy and Intolerance', all, 'none'],
      ['Safer Food Better Business Health & Safety Awareness', all, 'none'],
      ['Signed Contract', all, 'none'],
      ['Working Hours Opt Out', all, 'none'],
      ['Kitchen Oil & Fryer Training', kitchen, 'none'],
      ['Food Safety & Hygiene Level 2', kitchen, 'optional'],
      ['Challenge 25 Training', [], 'none'],
      ['COSHH Awareness', [], 'none'],
      ['Fire Marshal', [], 'optional'],
      ['Food Safety & Hygiene Level 3', [], 'optional'],
      ['HACCP', [], 'optional'],
      ['First Aid', [], 'optional'],
      ['Cellar Management', [], 'none']
    ].map(function (item) { return { id: stableReqId(item[0]), title: item[0], staffGroups: item[1], expiryMode: item[2] }; });
  }
  function migrateRequirement(req) {
    var title = normalise(req && req.title);
    if (title === 'food hygiene certificate') return Object.assign({}, req, { id: req.id || stableReqId('Food Safety & Hygiene Level 2'), title: 'Food Safety & Hygiene Level 2', staffGroups: ['Kitchen', 'KP'], expiryMode: req.expiryMode || 'optional' });
    if (title === 'allergen awareness certificate') return Object.assign({}, req, { id: req.id || stableReqId('Food Allergy and Intolerance'), title: 'Food Allergy and Intolerance', staffGroups: coreStaffGroupIds(), expiryMode: 'none' });
    return Object.assign({}, req, { id: req.id || stableReqId(req.title), staffGroups: validStaffGroups(req.staffGroups), expiryMode: req.expiryMode || 'optional' });
  }
  function getRequirements() {
    var saved = readJSON(REQ_KEY, []);
    var byTitle = {};
    (Array.isArray(saved) ? saved : []).map(migrateRequirement).forEach(function (req) { byTitle[normalise(req.title)] = req; });
    defaultRequirements().forEach(function (req) {
      var key = normalise(req.title);
      if (!byTitle[key]) byTitle[key] = req;
      else if (!(byTitle[key].staffGroups || []).length && req.staffGroups.length) byTitle[key] = Object.assign({}, byTitle[key], { staffGroups: req.staffGroups });
    });
    var reqs = Object.keys(byTitle).map(function (key) {
      var req = byTitle[key];
      return Object.assign({}, req, { staffGroups: validStaffGroups(req.staffGroups) });
    });
    writeJSON(REQ_KEY, reqs);
    return reqs;
  }
  function saveRequirements(reqs) { writeJSON(REQ_KEY, reqs); }
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
    state.documentCategories = state.documentCategories || ['Licensing', 'Food Safety', 'Fire Safety', 'Health & Safety', 'Equipment'];
    state.checks = state.checks || [];
    getRequirements();
    syncWorkAreasState();
  }

  window.appPermissionAllows = function (key, user) {
    ensureState();
    if (!user && window.ComplianceFirebase && window.ComplianceFirebase.isSignedIn && window.ComplianceFirebase.isSignedIn() && typeof window.ComplianceFirebase.hasPermission === 'function') {
      return window.ComplianceFirebase.hasPermission(key);
    }
    user = user || (typeof me === 'function' ? me() : null);
    if (!user) return false;
    if (namedAdmin(user)) return true;
    var matrix = state.permissionMatrix && state.permissionMatrix[groupOf(user)];
    var keys = PERMISSION_ALIASES[key] || [key];
    return !!(matrix && (matrix['*'] === true || keys.some(function (item) { return matrix[item] === true; })));
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
    return '<section class="coreSettingsPage"><h2 class="coreSettingsTitle">Settings</h2><section class="coreSettingsGrid">' + SECTIONS.map(function (section) {
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
    if (id === 'documents') return documentsSetupSection();
    if (id === 'checks') return checklistSetupSection();
    if (id === 'rota') return rotaSettingsSection();
    if (id === 'issues') return issueSettingsSection();
    if (id === 'areas') return areasSection();
    if (id === 'notifications') return notificationsSection();
    return pubSection();
  }

  function logoPreviewHtml(pub) {
    var remove = (pub.logoImageId || pub.logoData) ? '<button type="button" class="secondary danger full coreRemoveLogoButton" data-remove-pub-logo>Remove Logo</button>' : '';
    if (pub.logoImageId && logoPreviewId === pub.logoImageId && logoPreviewData) return '<div class="coreLogoPreview full"><img src="' + h(logoPreviewData) + '" alt="Current logo"></div>' + remove;
    if (pub.logoImageId) return '<div class="coreLogoPreview full">Logo uploaded</div>' + remove;
    if (pub.logoData) return '<div class="coreLogoPreview full"><img src="' + h(pub.logoData) + '" alt="Current logo"></div>' + remove;
    return '<div class="coreLogoPreview full">No logo uploaded</div>';
  }

  function resolveLogoImage(pub) {
    var imageId = pub && pub.logoImageId;
    if (!imageId) return Promise.resolve(null);
    if (logoPreviewId === imageId && logoPreviewData) return Promise.resolve({ imageId: imageId, dataUrl: logoPreviewData });
    if (logoResolvingId === imageId) return Promise.resolve(null);
    if (!window.ComplianceFirebase || typeof window.ComplianceFirebase.resolveImage !== 'function') return Promise.resolve(null);
    logoResolvingId = imageId;
    return window.ComplianceFirebase.resolveImage(imageId).then(function (result) {
      if (!state.pub || state.pub.logoImageId !== imageId) return;
      logoPreviewId = imageId;
      logoPreviewData = result && result.dataUrl || '';
      applyBranding();
      return result;
    }).catch(function () {}).finally(function () {
      if (logoResolvingId === imageId) logoResolvingId = '';
    });
  }

  function pubSection() {
    var pub = state.pub || {};
    resolveLogoImage(pub);
    return '<form id="corePubForm" class="coreSettingsForm"><label><span>Pub name</span><input name="name" value="' + h(pub.name || '') + '"></label><label><span>App display name</span><input name="appDisplayName" value="' + h(pub.appDisplayName || pub.name || 'Pub Compliance Hub') + '"></label><label><span>Premises licence</span><input name="licence" value="' + h(pub.licence || '') + '"></label><label><span>DPS</span><input name="dps" value="' + h(pub.dps || '') + '"></label><label class="full"><span>Address</span><textarea name="address">' + h(pub.address || '') + '</textarea></label><label class="full"><span>Logo image</span><input name="logo" type="file" accept="image/*"></label>' + logoPreviewHtml(pub) + '<button class="primary full">Save Pub Details</button></form>';
  }

  function usersSection() {
    var systemToggle = '';
    if (window.ComplianceFirebase && typeof window.ComplianceFirebase.hasPermission === 'function' && window.ComplianceFirebase.hasPermission('users.edit')) {
      var checked = window.ComplianceFirebase.showSystemUsers && window.ComplianceFirebase.showSystemUsers();
      systemToggle = '<label class="systemUsersToggle coreSystemUsersToggle"><input id="coreShowSystemUsersToggle" type="checkbox" ' + (checked ? 'checked' : '') + '><span>Show hidden/system users</span></label>';
    }
    return systemToggle + '<div class="coreUserPreview">' + visibleUsers().map(function (user) {
      return '<button type="button" class="personRow centralPersonRow userOpenButton coreUserRow" data-core-open-user="' + h(user.id) + '"><span class="avatarText">' + h(initials(user)) + '</span><span class="userOpenText"><strong>' + h(user.name || user.nickname || 'User') + '</strong><em>' + h(user.jobArea || user.area || user.role || '') + '</em></span><span class="userRolePill">' + h(user.role || user.permissionSetId || 'User') + '</span></button>';
    }).join('') + '</div><h3>Permission Groups</h3><div class="corePermissionGroups">' + allGroups().map(groupCard).join('') + createGroupCard() + '</div>';
  }
  function initials(user) {
    var bits = String((user && user.name) || (user && user.nickname) || 'U').trim().split(/\s+/);
    return ((bits[0] || 'U')[0] || 'U') + ((bits[1] || '')[0] || '');
  }

  function groupCard(group) {
    var matrix = state.permissionMatrix[group] || {};
    var users = visibleUsers();
    var isCore = CORE_GROUPS.indexOf(group) !== -1;
    return '<details class="corePermissionCard" ' + (group === 'Admin' ? 'open' : '') + '><summary><span><strong>' + h(group) + '</strong><em>' + users.filter(function (u) { return groupOf(u) === group; }).length + ' users</em></span><span class="fdocArrow corePermissionChevron" aria-hidden="true">⌄</span></summary><form class="coreGroupForm" data-core-group-form="' + h(group) + '"><label class="full"><span>Group description</span><textarea name="description">' + h(matrix.description || '') + '</textarea></label><section class="coreAssigned"><h4>Who\'s in this group?</h4>' + quickUserControls() + userTickList(group) + '</section>' + PERMISSION_SECTIONS.map(function (section) { return permissionBlock(section, matrix); }).join('') + '<div class="coreFormActions full"><button class="primary">Save ' + h(group) + '</button>' + (isCore ? '' : '<button type="button" class="secondary danger" data-delete-core-group="' + h(group) + '">Delete Group</button>') + '</div></form></details>';
  }
  function quickUserControls() {
    return '<div class="coreQuickUsers"><label><input type="checkbox" data-select-all-users><span>All users</span></label><label><span>Add by work area</span><select data-select-area-users><option value="">Select work area</option>' + areas().map(function (area) { return '<option value="' + h(area) + '">' + h(area) + '</option>'; }).join('') + '</select></label></div>';
  }
  function userTickList(group) {
    return '<div class="coreUserTicks">' + visibleUsers().map(function (user) {
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

  function documentsSetupSection() {
    return documentGroupsSection() + workAreaDocumentsSection();
  }
  function documentGroupsSection() {
    var cats = (state.documentCategories || []).filter(function (cat) { return normalise(cat) !== 'staff'; });
    if (!cats.length) cats = ['Licensing', 'Food Safety', 'Fire Safety', 'Health & Safety', 'Equipment'];
    state.documentCategories = cats.slice();
    return '<section class="settingsBlock documentGroupSetup"><h3>Document Groups</h3><div class="settingsItemList documentGroupList">' + cats.map(function (cat) {
      return '<div class="settingsItemRow documentGroupRow"><span>' + h(cat) + '</span><button type="button" class="settingsDeleteX" data-delete-doc-category="' + h(cat) + '" aria-label="Delete ' + h(cat) + '">×</button></div>';
    }).join('') + '</div><form id="coreDocCategoryForm" class="coreInlineForm"><input name="category" placeholder="Add Document Group" required><button class="primary">Add</button></form></section>';
  }
  function docReqCount(groupId) {
    return getRequirements().filter(function (req) {
      return (req.staffGroups || []).some(function (group) { return normalise(group) === normalise(groupId); });
    }).length;
  }
  function docGroupButton(group) {
    var open = !!openDocGroups[group.id];
    var reqs = getRequirements();
    var deleteButton = isCoreStaffGroup(group.id) ? '' : '<button type="button" class="secondary danger" data-delete-staff-doc-group="' + h(group.id) + '">Delete Group</button>';
    return '<article class="permissionGroupCard staffDocGroupCard ' + (open ? 'open' : '') + '"><button type="button" class="fdocBar permissionGroupButton" data-toggle-staff-doc-group="' + h(group.id) + '"><span class="fdocIcon">□</span><span class="fdocName"><strong>' + h(group.label) + '</strong><em>' + docReqCount(group.id) + ' required documents</em></span><span class="fdocArrow" aria-hidden="true">⌄</span></button><div class="permissionGroupPanel ' + (open ? '' : 'closed') + '"><form class="staffDocGroupForm" data-staff-doc-group-form="' + h(group.id) + '"><div class="permissionTickList staffDocRequirementTickList">' + reqs.map(function (req) {
      var checked = (req.staffGroups || []).some(function (groupId) { return normalise(groupId) === normalise(group.id); });
      return '<label class="settingsTick permissionTick staffDocRequirementTick"><input type="checkbox" name="req__' + h(req.id) + '" ' + (checked ? 'checked' : '') + '><span>' + h(req.title) + '</span></label>';
    }).join('') + '</div><div class="permissionActions">' + deleteButton + '<button class="primary">Save Required Documents</button></div></form></div></article>';
  }
  function createDocGroup() {
    var open = openCreateDocGroup;
    return '<article class="permissionGroupCard createStaffDocGroupCard ' + (open ? 'open' : '') + '"><button type="button" class="fdocBar permissionGroupButton" data-toggle-create-staff-doc-group="true"><span class="fdocIcon">+</span><span class="fdocName"><strong>Add Work Area Document Group</strong></span><span class="fdocArrow" aria-hidden="true">⌄</span></button><div class="permissionGroupPanel ' + (open ? '' : 'closed') + '"><form id="createStaffDocGroupForm" class="permissionGroupForm"><label class="settingsField"><span>Group title</span><input name="title" placeholder="e.g. Cellar Team" required></label><button class="primary">Create Group</button></form></div></article>';
  }
  function workAreaDocumentsSection() {
    return '<section class="settingsBlock staffDocSettingsBlock"><h3>Work Area Documents</h3><div class="permissionGroupList staffDocGroupList">' + getDocGroups().map(docGroupButton).join('') + createDocGroup() + '</div></section>';
  }

  function newId(prefix) {
    try { return typeof uid === 'function' ? uid(prefix) : (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2); } catch (_) { return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2); }
  }
  function checkDueDate(check) { return (check && (check.assignedDueDate || check.dueDate)) || todayISO(); }
  function checkAssigneeLabel(check) {
    if (!check || !check.assignedUserId) return 'Everyone';
    var user = (state.users || []).find(function (item) { return item.id === check.assignedUserId; });
    return user && (user.nickname || user.name) || 'Assigned staff';
  }
  function scheduleLabel(check) {
    var freq = normaliseFrequency(check && check.freq);
    if (freq === 'Weekly') return check && check.assignedWeeklyDay || 'Select day';
    if (freq === 'Monthly') return 'Day ' + (check && check.assignedMonthlyDate || '1');
    if (freq === 'Annual' || freq === 'Every 6 Months') return checkDueDate(check);
    return 'Every day';
  }
  function checkSummary(check) {
    return h(normaliseFrequency(check && check.freq)) + ' · ' + h(scheduleLabel(check)) + ' · Due ' + h(check && check.due || '12:00') + ' · ' + h(checkAssigneeLabel(check));
  }
  function sectionLabel(type) { return { temperature: 'Temperature', document: 'Document Upload', tick: 'Tick Box' }[type] || 'Check'; }
  function sectionCaps(sections) {
    return {
      tick: sections.some(function (section) { return section.type === 'tick'; }),
      document: sections.some(function (section) { return section.type === 'document'; }),
      temperature: sections.some(function (section) { return section.type === 'temperature'; })
    };
  }
  function newBuilderSection(type) {
    return { id: newId('section'), type: type || 'document', items: type === 'tick' ? [''] : [], documentNote: '', equipmentUnit: '', notes: '' };
  }
  function checkSections(check, type) {
    if (check && Array.isArray(check.sections) && check.sections.length) {
      return check.sections.map(function (section) {
        return { id: section.id || newId('section'), type: section.type || 'tick', items: Array.isArray(section.items) ? section.items : [], documentNote: section.documentNote || section.notes || '', equipmentUnit: section.equipmentUnit || '', notes: section.notes || section.documentNote || '' };
      });
    }
    if (!check) return [newBuilderSection(type || 'document')];
    var text = String((check.checkType || '') + ' ' + (check.title || '') + ' ' + (check.items || []).join(' ')).toLowerCase();
    var temperature = !!check.requiresTemperature || check.checkType === 'temperature' || /temp|temperature|fridge|freezer/.test(text);
    var document = !!check.hasDocumentUpload || check.checkType === 'document' || !!(check.requiresEvidence && !temperature);
    var tick = !!check.hasTickItems;
    if (typeof check.hasTickItems !== 'boolean') tick = !!(!temperature && !document && check.items && check.items.length);
    var sections = [];
    if (document) sections.push({ id: newId('section'), type: 'document', documentNote: check.documentNote || '', notes: check.documentNote || '', items: [] });
    if (temperature) sections.push({ id: newId('section'), type: 'temperature', equipmentUnit: check.equipmentUnit || check.title || '', notes: '', items: [] });
    if (tick) sections.push({ id: newId('section'), type: 'tick', items: Array.isArray(check.items) ? check.items : [], notes: '' });
    return sections.length ? sections : [newBuilderSection('document')];
  }
  function checkType(check) {
    var sections = checkSections(check);
    return sections.length === 1 ? sections[0].type : 'sectioned';
  }
  function checkAreas() {
    var byName = {};
    (areas()).concat((state.checks || []).map(function (check) { return check.area || 'General'; })).filter(Boolean).forEach(function (area) {
      if (!byName[normalise(area)]) byName[normalise(area)] = area;
    });
    return Object.keys(byName).map(function (key) { return byName[key]; }).sort(function (a, b) { return a.localeCompare(b); });
  }
  function checksForArea(area) {
    return (state.checks || []).filter(function (check) { return normalise(check.area || 'General') === normalise(area); });
  }
  function checklistSetupSection() {
    var list = checkAreas();
    return '<section class="settingsBlock checklistSetupHub"><h3>Checklist Setup</h3><div class="settingsAreaButtonList">' + list.map(function (area) {
      var checks = checksForArea(area);
      return '<button type="button" class="settingsAreaButton" data-open-core-check-area="' + h(area) + '"><span><strong>' + h(area) + '</strong><small>' + checks.length + ' checks</small></span></button>';
    }).join('') + '</div></section>';
  }
  function checklistAreaContent(area) {
    var checks = checksForArea(area);
    return '<section class="checkSetupAreaView"><div class="checkSetupAreaActions"><button type="button" class="primary" data-create-core-check="' + h(area) + '">Add Check</button></div><div class="checkSetupCheckList">' + (checks.length ? checks.map(function (check) {
      return '<article class="checkSetupCheckRow"><button type="button" class="checkSetupCheckButton" data-edit-core-check="' + h(check.id) + '"><span><strong>' + h(check.title) + '</strong><small>' + checkSummary(check) + '</small></span><span class="checkSetupCog">' + settingsCogIcon() + '</span></button></article>';
    }).join('') : '<p class="muted">No checks in this area yet.</p>') + '</div></section>';
  }
  function addSectionButtons() {
    return '<div class="checkPackageTabs checkBuilderSectionActions"><button type="button" class="checkBuilderAddSection" data-add-core-check-section="tick">Add Tick Box Section</button><button type="button" class="checkBuilderAddSection" data-add-core-check-section="temperature">Add Temperature Section</button><button type="button" class="checkBuilderAddSection" data-add-core-check-section="document">Add Document Upload Section</button></div>';
  }
  function builderItemRow(value) { return '<label class="checkBuilderItem"><input type="text" data-check-item value="' + h(value || '') + '" placeholder="Add tick item here"></label>'; }
  function builderItemRows(section) {
    var items = section && section.items && section.items.length ? section.items : [];
    var rows = items.length ? items.concat(['']) : [''];
    return rows.map(builderItemRow).join('');
  }
  function builderSectionNotes(section) {
    return '<label class="checkBuilderNote checkBuilderAdditionalNotes"><span>Additional Notes</span><textarea data-section-note placeholder="Additional notes for this section">' + h(section && (section.notes || section.documentNote) || '') + '</textarea></label>';
  }
  function builderDocumentPreview(section) {
    return '<div class="fdocBody checkBuilderDocBody"><button type="button" class="fdocThumb empty" tabindex="-1">No document</button><div class="fdocControls"><div class="fdocUploads"><label><span>Choose File</span></label><label><span>Take Photo</span></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input type="checkbox" disabled><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span class="fdocDateInputWrap"><span class="fdocExpiryText">Expiry Date</span><input type="date" disabled></span></label></div></div></div>' + builderSectionNotes(section);
  }
  function builderTemperaturePreview(section) {
    return '<label data-equipment-unit><span>Equipment / unit label</span><input data-equipment-unit-input value="' + h(section && section.equipmentUnit || '') + '" placeholder="Kitchen Fridge 1"></label><div class="temperatureCheckPanel previewOnly"><div class="temperatureMainRow"><div class="checkPhotoThumb empty">No photo</div><div class="temperatureSideControls"><div class="temperaturePhotoButton">Take Photo</div><div class="temperatureEntryRow"><label class="temperatureInputBox"><input placeholder="Temp" disabled><span>°C</span></label><button type="button" class="temperatureSaveButton">Save</button></div></div></div></div>' + builderSectionNotes(section);
  }
  function builderSection(section) {
    var type = section.type || 'document';
    var body = '';
    if (type === 'document') body = builderDocumentPreview(section);
    else if (type === 'temperature') body = builderTemperaturePreview(section);
    else body = '<section class="checkBuilderItems"><div class="checkBuilderItemList" data-check-items>' + builderItemRows(section) + '</div></section>' + builderSectionNotes(section);
    return '<section class="checkBuilderSection" data-builder-section data-section-type="' + h(type) + '" data-section-id="' + h(section.id || newId('section')) + '"><div class="checkBuilderSectionTop"><strong>' + h(sectionLabel(type)) + ' Section</strong><button type="button" class="settingsDeleteX" data-remove-core-check-section aria-label="Remove ' + h(sectionLabel(type)) + ' section">×</button></div><div class="checkTypePanel">' + body + '</div></section>';
  }
  function userOptions(selected) {
    return '<option value="" ' + (!selected ? 'selected' : '') + '>Everyone</option>' + visibleUsers().map(function (user) {
      return '<option value="' + h(user.id) + '" ' + (user.id === selected ? 'selected' : '') + '>' + h(user.nickname || user.name) + '</option>';
    }).join('');
  }
  function scheduleFields(check) {
    var freq = normaliseFrequency(check && check.freq);
    var weekly = check && check.assignedWeeklyDay || 'Monday';
    var monthly = check && check.assignedMonthlyDate || '1';
    var dueDate = checkDueDate(check);
    return '<label data-weekly-assignment ' + (freq === 'Weekly' ? '' : 'hidden') + '><span>Day of Week</span><select name="assignedWeeklyDay">' + ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(function (day) { return '<option ' + (day === weekly ? 'selected' : '') + '>' + day + '</option>'; }).join('') + '</select></label><label data-monthly-assignment ' + (freq === 'Monthly' ? '' : 'hidden') + '><span>Date of Month</span><select name="assignedMonthlyDate">' + Array.from({ length: 31 }, function (_, i) { return String(i + 1); }).map(function (day) { return '<option ' + (day === String(monthly) ? 'selected' : '') + '>' + day + '</option>'; }).join('') + '</select></label><label data-calendar-assignment ' + ((freq === 'Annual' || freq === 'Every 6 Months') ? '' : 'hidden') + '><span>Due Date</span><input name="assignedDueDate" type="date" value="' + h(dueDate) + '"></label>';
  }
  function builderTemplate(check, area, type) {
    var editing = !!(check && check.id);
    var selectedArea = check && check.area || area || (areas()[0]) || 'Whole Pub';
    var freq = normaliseFrequency(check && check.freq || 'Daily');
    var due = check && check.due || '12:00';
    var sections = checkSections(check, type);
    var topActions = editing ? '<div class="checkBuilderTopActions"><button type="button" class="secondary danger" id="deleteCheckBtn">Delete Check</button></div>' : '';
    return '<form id="coreCheckBuilderForm" class="checkBuilderForm" data-editing-check="' + h(editing ? check.id : '') + '" data-return-area="' + h(selectedArea) + '"><input type="hidden" name="area" value="' + h(selectedArea) + '">' + topActions + '<article class="fdoc areaCheckCard open checkBuilderPreview"><div class="fdocBar checkBuilderBar"><span class="fdocIcon">✓</span><span class="fdocName"><strong><input name="title" value="' + h(check && check.title || '') + '" placeholder="Check name" required></strong><em>' + h(selectedArea) + '</em></span></div><div class="fdocPanel"><div class="checkBuilderMetaGrid"><label><span>Frequency</span><select name="freq">' + frequencyOptions(freq) + '</select></label>' + scheduleFields(check || { freq: freq }) + '<label><span>Time Due</span><input name="due" type="time" value="' + h(due) + '" required></label><label><span>Assign Staff Member</span><select name="assignedUserId">' + userOptions(check && check.assignedUserId) + '</select></label></div>' + addSectionButtons() + '<div class="checkBuilderSections" data-builder-sections>' + sections.map(builderSection).join('') + '</div><label class="checkline checkBuilderSign"><input type="checkbox" name="sign" ' + (check && check.sign ? 'checked' : '') + '> Requires manager sign-off</label></div></article><button class="primary checkBuilderSave" type="submit">' + (editing ? 'Save Check Changes' : 'Create Check') + '</button></form>';
  }
  function openChecklistAreaModal(area) {
    renderCoreSettingsModal('checks-area', 'Checklist Setup - ' + (area || 'Area'), checklistAreaContent(area), '');
  }
  function openChecklistEditorModal(id, area, type) {
    var check = id ? (state.checks || []).find(function (item) { return item.id === id; }) : null;
    var editorArea = check && check.area || area || (areas()[0]) || 'Whole Pub';
    renderCoreSettingsModal('checks-builder', (check ? 'Edit Check' : 'New Check'), builderTemplate(check, editorArea, type || checkType(check || {})), '');
  }

  function areasSection() {
    return '<form id="coreAreaForm" class="coreInlineForm"><input name="area" placeholder="New work area"><button class="primary">Add Work Area</button></form><div class="coreAreaList">' + areas().map(function (area) { return '<div class="coreAreaRow" data-core-area="' + h(area) + '"><button type="button" class="coreDrag" aria-label="Move work area">☰</button><span>' + h(area) + '</span><button type="button" class="settingsDeleteX" data-delete-area="' + h(area) + '" aria-label="Delete ' + h(area) + '">×</button></div>'; }).join('') + '</div>';
  }
  function rotaSettingsSection() {
    var sections = state.rotaSettings && Array.isArray(state.rotaSettings.sections) ? state.rotaSettings.sections : areas();
    return '<section class="settingsBlock rotaSetupBlock"><h3>Rota Setup</h3><div class="coreAreaList">' + sections.map(function (section) {
      return '<div class="coreAreaRow" data-core-rota-section="' + h(section) + '"><button type="button" class="coreDrag" aria-label="Move rota section">☰</button><span>' + h(section) + '</span><button type="button" class="settingsDeleteX" data-delete-rota-section="' + h(section) + '" aria-label="Delete ' + h(section) + '">×</button></div>';
    }).join('') + '</div><form id="coreRotaSectionForm" class="coreInlineForm"><input name="section" placeholder="New rota section"><button class="primary">Add Section</button></form></section>';
  }
  function issueSettingsSection() {
    var issueSettings = state.issueSettings || {};
    return '<form id="coreIssueSettingsForm" class="coreSettingsForm"><label class="coreTick full"><input type="checkbox" name="issueNotifications" ' + (issueSettings.issueNotifications !== false ? 'checked' : '') + '><span><strong>Notify managers when issues are reported</strong></span></label><label class="coreTick full"><input type="checkbox" name="issueLog" ' + (issueSettings.issueLog !== false ? 'checked' : '') + '><span><strong>Keep resolved issues in the Issues log</strong></span></label><button class="primary full">Save Issue Settings</button></form>';
  }
  function notificationsSection() {
    var r = state.notificationRules || defaultNotificationRules();
    return '<form id="coreNotificationsForm" class="coreSettingsForm">' + numberField('premisesExpiryDays', 'Premises document expiry warning days', r.premisesExpiryDays) + numberField('staffExpiryDays', 'Staff document expiry warning days', r.staffExpiryDays) + numberField('checkOverdueMinutes', 'Check overdue threshold minutes', r.checkOverdueMinutes) + numberField('shiftReminderMinutes', 'Shift reminder minutes before start', r.shiftReminderMinutes) + numberField('lateShiftMinutes', 'Late shift threshold minutes', r.lateShiftMinutes) + numberField('missedClockOutHours', 'Missed clock-out threshold hours', r.missedClockOutHours) + numberField('longBreakMinutes', 'Long break alert minutes', r.longBreakMinutes) + '<label class="coreTick full"><input type="checkbox" name="criticalIssuesAlwaysNotifyAdmin" ' + (r.criticalIssuesAlwaysNotifyAdmin ? 'checked' : '') + '><span><strong>Critical issues always notify Admin</strong></span></label><label class="coreTick full"><input type="checkbox" name="pushEnabled" ' + (r.pushEnabled !== false ? 'checked' : '') + '><span><strong>Push notifications enabled</strong></span></label>' + textField('pushApiBase', 'Push API base URL', r.pushApiBase) + textField('pushVapidPublicKey', 'VAPID public key', r.pushVapidPublicKey) + '<div class="corePushActions full"><button type="button" class="secondary" data-subscribe-push-device>Subscribe This Device</button><button type="button" class="secondary" data-test-push-device>Test Device Notification</button></div><p id="corePushStatus" class="corePushStatus full">' + h(pushStatusLabel()) + '</p><button class="primary full">Save Notification Rules</button></form>';
  }
  function numberField(name, label, value) { return '<label><span>' + h(label) + '</span><input type="number" min="0" name="' + h(name) + '" value="' + h(value == null ? 0 : value) + '"></label>'; }
  function textField(name, label, value) { return '<label class="full"><span>' + h(label) + '</span><input name="' + h(name) + '" value="' + h(value || '') + '"></label>'; }
  function pushStatusLabel() {
    if (!window.CompliancePush || typeof window.CompliancePush.supportStatus !== 'function') return 'Push: setup unavailable';
    var status = window.CompliancePush.supportStatus();
    if (!status.supported) return 'Push: unsupported on this device';
    if (status.permission === 'denied') return 'Push: permission blocked';
    if (!status.serverReady) return 'Push: server URL or key missing';
    if (status.subscribed) return 'Push: device subscribed';
    return 'Push: ready to subscribe';
  }

  function lockSettingsModalBackground() {
    if (document.body.classList.contains('settings-core-modal-page-locked')) return;
    settingsModalLockedScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    document.body.style.top = '-' + settingsModalLockedScrollY + 'px';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('settings-core-modal-page-locked');
  }
  function unlockSettingsModalBackground() {
    if (!document.body.classList.contains('settings-core-modal-page-locked')) return;
    document.body.classList.remove('settings-core-modal-page-locked');
    document.body.style.top = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, settingsModalLockedScrollY || 0);
  }
  function renderCoreSettingsModal(id, title, body, saveButton) {
    var modal = document.getElementById('modal');
    if (!modal) return;
    lockSettingsModalBackground();
    modal.innerHTML = '<div class="modalCard coreSettingsModalCard"><div class="coreModalHandle ' + (saveButton ? 'hasSave' : '') + '"><h2>' + h(title) + '</h2>' + (saveButton || '') + '<button type="button" class="close" data-close-core-settings>×</button></div><div class="coreModalBody">' + body + '</div></div>';
    modal.classList.remove('hidden');
    modal.classList.add('settingsCoreModalOpen');
    bindModal(id);
  }

  function openSection(id) {
    ensureState();
    var saveButton = id === 'areas' ? '<button type="button" class="primary coreModalSave" data-save-close-core-settings>Save</button>' : '';
    renderCoreSettingsModal(id, sectionTitle(id), sectionBody(id), saveButton);
  }
  function closeSection() {
    var modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('settingsCoreModalOpen');
    modal.innerHTML = '';
    modal.onclick = null;
    unlockSettingsModalBackground();
  }
  window.openCoreSettingsSection = openSection;

  function bindModal(id) {
    var close = document.querySelector('[data-close-core-settings]');
    if (close) close.onclick = function () {
      if (id === 'checks-area') { openSection('checks'); return; }
      if (id === 'checks-builder') {
        var form = document.getElementById('coreCheckBuilderForm');
        openChecklistAreaModal(form && form.dataset.returnArea || '');
        return;
      }
      closeSection();
    };
    var saveClose = document.querySelector('[data-save-close-core-settings]');
    if (saveClose) saveClose.onclick = closeSection;
    var pub = document.getElementById('corePubForm'); if (pub) pub.onsubmit = savePub;
    var removeLogo = document.querySelector('[data-remove-pub-logo]');
    if (removeLogo) removeLogo.onclick = removePubLogo;
    var systemToggle = document.getElementById('coreShowSystemUsersToggle');
    if (systemToggle && window.ComplianceFirebase && typeof window.ComplianceFirebase.setShowSystemUsers === 'function') {
      systemToggle.onchange = function () { window.ComplianceFirebase.setShowSystemUsers(systemToggle.checked); };
    }
    document.querySelectorAll('[data-core-open-user]').forEach(function (button) {
      button.onclick = function () {
        var id = button.dataset.coreOpenUser;
        window.__settingsReturnSectionAfterUserProfile = 'users';
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
    var docCategoryForm = document.getElementById('coreDocCategoryForm'); if (docCategoryForm) docCategoryForm.onsubmit = addDocumentCategory;
    document.querySelectorAll('[data-delete-doc-category]').forEach(function (button) { button.onclick = function () { deleteDocumentCategory(button.dataset.deleteDocCategory); }; });
    bindStaffDocGroups();
    document.querySelectorAll('[data-open-core-check-area]').forEach(function (button) { button.onclick = function () { openChecklistAreaModal(button.dataset.openCoreCheckArea); }; });
    document.querySelectorAll('[data-create-core-check]').forEach(function (button) { button.onclick = function () { openChecklistEditorModal('', button.dataset.createCoreCheck || ''); }; });
    document.querySelectorAll('[data-edit-core-check]').forEach(function (button) { button.onclick = function () { openChecklistEditorModal(button.dataset.editCoreCheck || '', ''); }; });
    bindCheckBuilder();
    var rotaForm = document.getElementById('coreRotaSectionForm'); if (rotaForm) rotaForm.onsubmit = addRotaSection;
    document.querySelectorAll('[data-delete-rota-section]').forEach(function (button) { button.onclick = function () { deleteRotaSection(button.dataset.deleteRotaSection); }; });
    bindRotaDrag();
    var issueForm = document.getElementById('coreIssueSettingsForm'); if (issueForm) issueForm.onsubmit = saveIssueSettings;
    var notifications = document.getElementById('coreNotificationsForm'); if (notifications) notifications.onsubmit = saveNotifications;
    bindPushNotificationButtons();
  }

  function saveUploadedLogo(file, finish) {
    if (!window.ComplianceFirebase || typeof window.ComplianceFirebase.uploadFile !== 'function') {
      alert('Upload failed. Check connection.');
      return;
    }
    var previous = state.pub && state.pub.logoImageId;
    window.ComplianceFirebase.uploadFile(file, { kind: 'pub', folder: 'pub-branding', documentId: 'pub-logo' }).then(function (uploaded) {
      if (!uploaded || !uploaded.imageId) { alert('Upload failed. Check connection.'); return; }
      state.pub.logoImageId = uploaded.imageId;
      state.pub.logoImageCount = uploaded.imageCount || 0;
      state.pub.logoFileName = uploaded.fileName || file.name || 'Pub logo';
      state.pub.logoUpdatedAt = uploaded.uploadedAt || new Date().toISOString();
      state.pub.logoUpdatedBy = uploaded.uploadedBy || '';
      state.pub.logoUploadedAt = state.pub.logoUpdatedAt;
      state.pub.logoUploadedBy = state.pub.logoUpdatedBy;
      delete state.pub.logoData;
      logoPreviewId = '';
      logoPreviewData = '';
      if (previous && previous !== uploaded.imageId && window.ComplianceFirebase && typeof window.ComplianceFirebase.archiveImage === 'function') window.ComplianceFirebase.archiveImage(previous);
      return resolveLogoImage(state.pub).catch(function () {}).then(function () { finish(); });
    }).catch(function (error) {
      alert(error && error.message || 'Upload failed. Check connection.');
    });
  }

  function clearPubLogoFields() {
    state.pub = state.pub || {};
    state.pub.logoImageId = '';
    state.pub.logoImageCount = 0;
    state.pub.logoFileName = '';
    state.pub.logoUpdatedAt = new Date().toISOString();
    var current = window.ComplianceFirebase && typeof window.ComplianceFirebase.currentUser === 'function' ? window.ComplianceFirebase.currentUser() : null;
    state.pub.logoUpdatedBy = current && current.uid || '';
    state.pub.logoUploadedAt = '';
    state.pub.logoUploadedBy = '';
    delete state.pub.logoData;
    logoPreviewId = '';
    logoPreviewData = '';
  }

  function removePubLogo() {
    if (!confirm('Remove pub logo?')) return;
    var previous = state.pub && state.pub.logoImageId;
    var archive = previous && window.ComplianceFirebase && typeof window.ComplianceFirebase.archiveImage === 'function'
      ? window.ComplianceFirebase.archiveImage(previous)
      : Promise.resolve(false);
    archive.catch(function () {}).then(function () {
      clearPubLogoFields();
      saveSafe();
      var saveNow = window.ComplianceFirebase && typeof window.ComplianceFirebase.saveNow === 'function' ? window.ComplianceFirebase.saveNow() : Promise.resolve();
      return saveNow;
    }).then(function () {
      applyBranding();
      closeSection();
    }).catch(function (error) {
      alert(error && error.message || 'Upload failed. Check connection.');
    });
  }

  function savePub(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = new FormData(form);
    state.pub = state.pub || {};
    ['name', 'appDisplayName', 'licence', 'dps', 'address'].forEach(function (key) { state.pub[key] = String(data.get(key) || '').trim(); });
    var file = form.elements.logo && form.elements.logo.files && form.elements.logo.files[0];
    var finish = function () {
      saveSafe();
      var saveNow = window.ComplianceFirebase && typeof window.ComplianceFirebase.saveNow === 'function' ? window.ComplianceFirebase.saveNow() : Promise.resolve();
      saveNow.then(function () {
        applyBranding();
        closeSection();
      }).catch(function (error) {
        alert(error && error.message || 'Upload failed. Check connection.');
      });
    };
    if (file) saveUploadedLogo(file, finish);
    else finish();
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
      if (!input) return;
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
  function notificationRulesFromForm(form) {
    var data = new FormData(form);
    var rules = Object.assign(defaultNotificationRules(), state.notificationRules || {});
    ['premisesExpiryDays', 'staffExpiryDays', 'checkOverdueMinutes', 'shiftReminderMinutes', 'lateShiftMinutes', 'missedClockOutHours', 'longBreakMinutes'].forEach(function (key) { rules[key] = Number(data.get(key) || 0); });
    rules.criticalIssuesAlwaysNotifyAdmin = !!data.get('criticalIssuesAlwaysNotifyAdmin');
    rules.pushEnabled = !!data.get('pushEnabled');
    rules.pushApiBase = String(data.get('pushApiBase') || '').trim();
    rules.pushVapidPublicKey = String(data.get('pushVapidPublicKey') || '').trim();
    return rules;
  }
  function persistNotificationRules(rules) {
    state.notificationRules = rules;
    writeJSON(NOTIFICATION_RULES_KEY, rules);
    if (window.CompliancePush && typeof window.CompliancePush.persistSettings === 'function') {
      window.CompliancePush.persistSettings({ apiBase: rules.pushApiBase, vapidPublicKey: rules.pushVapidPublicKey, enabled: rules.pushEnabled });
    }
    saveSafe();
  }
  function saveNotifications(event) {
    event.preventDefault();
    persistNotificationRules(notificationRulesFromForm(event.currentTarget));
    closeSection();
  }
  function setPushStatus(text) {
    var status = document.getElementById('corePushStatus');
    if (status) status.textContent = text;
  }
  function bindPushNotificationButtons() {
    var form = document.getElementById('coreNotificationsForm');
    if (!form) return;
    var subscribe = document.querySelector('[data-subscribe-push-device]');
    if (subscribe) subscribe.onclick = function () {
      persistNotificationRules(notificationRulesFromForm(form));
      if (!window.CompliancePush || typeof window.CompliancePush.subscribeCurrentDevice !== 'function') { setPushStatus('Push: setup unavailable'); return; }
      setPushStatus('Push: subscribing device');
      window.CompliancePush.subscribeCurrentDevice({
        apiBase: state.notificationRules.pushApiBase,
        vapidPublicKey: state.notificationRules.pushVapidPublicKey,
        enabled: state.notificationRules.pushEnabled
      }).then(function (result) {
        if (result && result.ok && result.server && result.server.skipped) setPushStatus('Push: device subscribed, server URL missing');
        else if (result && result.ok && result.server && result.server.ok === false) setPushStatus('Push: device subscribed, server save failed');
        else if (result && result.ok) setPushStatus('Push: device subscribed');
        else setPushStatus('Push: ' + (result && (result.reason || result.error) || 'subscription failed'));
      });
    };
    var test = document.querySelector('[data-test-push-device]');
    if (test) test.onclick = function () {
      persistNotificationRules(notificationRulesFromForm(form));
      if (!window.CompliancePush || typeof window.CompliancePush.showLocalNotification !== 'function') { setPushStatus('Push: setup unavailable'); return; }
      window.CompliancePush.showLocalNotification('Pub Compliance Hub', 'Device notification test sent.', { route: 'dashboard', url: './index.html?route=dashboard', tag: 'compliance-test-notification' }).then(function (result) {
        setPushStatus(result && result.ok ? 'Push: test sent' : 'Push: subscribe this device first');
      });
    };
  }

  function addDocumentCategory(event) {
    event.preventDefault();
    var name = String(new FormData(event.currentTarget).get('category') || '').trim();
    if (!name) return;
    state.documentCategories = (state.documentCategories || []).filter(function (cat) { return normalise(cat) !== 'staff'; });
    if (!state.documentCategories.some(function (cat) { return normalise(cat) === normalise(name); })) state.documentCategories.push(name);
    saveSafe();
    openSection('documents');
  }
  function deleteDocumentCategory(category) {
    var current = (state.documentCategories || []).filter(function (cat) { return normalise(cat) !== 'staff' && normalise(cat) !== normalise(category); });
    if (!current.length) current = ['General'];
    var replacement = current[0];
    (state.docs || []).forEach(function (doc) { if (normalise(doc.cat) === normalise(category)) doc.cat = replacement; });
    state.documentCategories = current;
    saveSafe();
    openSection('documents');
  }
  function togglePanelCard(button, stateObj, key) {
    var card = button.closest('.permissionGroupCard');
    var panel = card && card.querySelector('.permissionGroupPanel');
    var isOpen = !(card && card.classList.contains('open'));
    stateObj[key] = isOpen;
    if (card) card.classList.toggle('open', isOpen);
    if (panel) panel.classList.toggle('closed', !isOpen);
  }
  function bindStaffDocGroups() {
    document.querySelectorAll('[data-toggle-staff-doc-group]').forEach(function (button) {
      button.onclick = function (event) { event.preventDefault(); togglePanelCard(button, openDocGroups, button.dataset.toggleStaffDocGroup); };
    });
    document.querySelectorAll('[data-toggle-create-staff-doc-group]').forEach(function (button) {
      button.onclick = function (event) { event.preventDefault(); openCreateDocGroup = !(button.closest('.permissionGroupCard') && button.closest('.permissionGroupCard').classList.contains('open')); togglePanelCard(button, { create: openCreateDocGroup }, 'create'); };
    });
    document.querySelectorAll('[data-staff-doc-group-form]').forEach(function (form) {
      form.onsubmit = function (event) {
        event.preventDefault();
        var groupId = form.dataset.staffDocGroupForm;
        var reqs = getRequirements();
        reqs.forEach(function (req) {
          req.staffGroups = Array.isArray(req.staffGroups) ? req.staffGroups.filter(function (group) { return normalise(group) !== normalise(groupId); }) : [];
          if (fieldChecked(form, 'req__' + req.id)) req.staffGroups.push(groupId);
        });
        saveRequirements(reqs);
        saveSafe();
        closeSection();
      };
    });
    document.querySelectorAll('[data-delete-staff-doc-group]').forEach(function (button) {
      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var groupId = button.dataset.deleteStaffDocGroup;
        if (isCoreStaffGroup(groupId)) return;
        writeJSON(GROUP_KEY, getDocGroups().filter(function (group) { return normalise(group.id) !== normalise(groupId); }));
        saveRequirements(getRequirements().map(function (req) {
          return Object.assign({}, req, { staffGroups: (req.staffGroups || []).filter(function (group) { return normalise(group) !== normalise(groupId); }) });
        }));
        delete openDocGroups[groupId];
        saveSafe();
        openSection('documents');
      };
    });
    var createDoc = document.getElementById('createStaffDocGroupForm');
    if (createDoc) createDoc.onsubmit = function (event) {
      event.preventDefault();
      var title = String(createDoc.elements.title.value || '').trim();
      if (!title) return;
      var groups = getDocGroups();
      if (!groups.some(function (group) { return normalise(group.id) === normalise(title); })) groups.push({ id: title, label: title });
      writeJSON(GROUP_KEY, groups);
      if (!state.areas.some(function (area) { return normalise(area) === normalise(title); })) state.areas.push(title);
      openCreateDocGroup = false;
      openDocGroups[title] = true;
      saveSafe();
      openSection('documents');
    };
  }

  function bindBuilderItems(form) {
    if (!form) return;
    form.querySelectorAll('[data-check-items]').forEach(function (list) {
      list.querySelectorAll('[data-check-item]').forEach(function (input) { input.oninput = function () { syncBuilderItems(list); }; });
      syncBuilderItems(list);
    });
  }
  function syncBuilderItems(list) {
    if (!list) return;
    Array.from(list.querySelectorAll('.checkBuilderItem')).forEach(function (row, index, rows) {
      var input = row.querySelector('[data-check-item]');
      if (index < rows.length - 1 && input && !String(input.value || '').trim()) row.remove();
    });
    var inputs = Array.from(list.querySelectorAll('[data-check-item]'));
    var last = inputs[inputs.length - 1];
    if (!last || String(last.value || '').trim()) list.insertAdjacentHTML('beforeend', builderItemRow(''));
    list.querySelectorAll('[data-check-item]').forEach(function (input) { input.oninput = function () { syncBuilderItems(list); }; });
  }
  function builderItemValues(scope) {
    return Array.from((scope && scope.querySelectorAll('[data-check-item]')) || []).map(function (input) { return String(input.value || '').trim(); }).filter(Boolean);
  }
  function addBuilderSection(form, type) {
    var list = form && form.querySelector('[data-builder-sections]');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', builderSection(newBuilderSection(type)));
    bindBuilderSections(form);
  }
  function bindBuilderSections(form) {
    if (!form) return;
    bindBuilderItems(form);
    form.querySelectorAll('[data-add-core-check-section]').forEach(function (button) {
      button.onclick = function () { addBuilderSection(form, button.dataset.addCoreCheckSection); };
    });
    form.querySelectorAll('[data-remove-core-check-section]').forEach(function (button) {
      button.onclick = function () {
        var section = button.closest('[data-builder-section]');
        if (section) section.remove();
        if (!form.querySelector('[data-builder-section]')) addBuilderSection(form, 'document');
      };
    });
  }
  function builderSectionsFromForm(form) {
    var sections = Array.from(form.querySelectorAll('[data-builder-section]')).map(function (section) {
      var type = section.dataset.sectionType || 'document';
      var id = section.dataset.sectionId || newId('section');
      var notes = String((section.querySelector('[data-section-note]') || {}).value || '').trim();
      if (type === 'tick') return { id: id, type: type, items: builderItemValues(section), notes: notes };
      if (type === 'temperature') return { id: id, type: type, equipmentUnit: String((section.querySelector('[data-equipment-unit-input]') || {}).value || '').trim(), notes: notes };
      return { id: id, type: 'document', documentNote: notes, notes: notes };
    }).filter(function (section) { return section.type; });
    return sections.length ? sections : [newBuilderSection('document')];
  }
  function syncBuilderAssignment(form) {
    if (!form) return;
    var freq = normaliseFrequency(form.elements.freq && form.elements.freq.value || '');
    var weekly = form.querySelector('[data-weekly-assignment]');
    var monthly = form.querySelector('[data-monthly-assignment]');
    var calendar = form.querySelector('[data-calendar-assignment]');
    if (weekly) weekly.hidden = freq !== 'Weekly';
    if (monthly) monthly.hidden = freq !== 'Monthly';
    if (calendar) calendar.hidden = !(freq === 'Annual' || freq === 'Every 6 Months');
  }
  function saveChecklistBuilder(form) {
    var data = new FormData(form);
    var sections = builderSectionsFromForm(form);
    var caps = sectionCaps(sections);
    var type = sections.length === 1 ? sections[0].type : 'sectioned';
    var editingId = form.dataset.editingCheck;
    var check = editingId ? (state.checks || []).find(function (item) { return item.id === editingId; }) : null;
    if (!check) {
      check = { id: newId('check') };
      state.checks = state.checks || [];
      state.checks.push(check);
    }
    var title = String(data.get('title') || '').trim();
    var freq = normaliseFrequency(data.get('freq') || 'Daily');
    var firstDoc = sections.find(function (section) { return section.type === 'document'; });
    var firstTemp = sections.find(function (section) { return section.type === 'temperature'; });
    var tickItems = sections.filter(function (section) { return section.type === 'tick'; }).reduce(function (out, section) { return out.concat(section.items || []); }, []);
    Object.assign(check, {
      title: title || 'Untitled Check',
      area: String(data.get('area') || form.dataset.returnArea || 'General'),
      freq: freq,
      due: String(data.get('due') || '12:00'),
      sign: fieldChecked(form, 'sign'),
      checkType: type,
      hasTickItems: caps.tick,
      hasDocumentUpload: caps.document,
      requiresEvidence: caps.document,
      requiresTemperature: caps.temperature,
      items: tickItems,
      sections: sections,
      documentNote: firstDoc && firstDoc.documentNote || ''
    });
    if (firstTemp && firstTemp.equipmentUnit) check.equipmentUnit = firstTemp.equipmentUnit;
    else delete check.equipmentUnit;
    var assignedUserId = String(data.get('assignedUserId') || '');
    if (assignedUserId) check.assignedUserId = assignedUserId;
    else delete check.assignedUserId;
    check.assignedWeeklyDay = String(data.get('assignedWeeklyDay') || 'Monday');
    check.assignedMonthlyDate = String(data.get('assignedMonthlyDate') || '1');
    check.assignedDueDate = String(data.get('assignedDueDate') || check.assignedDueDate || todayISO());
    saveSafe();
    openChecklistAreaModal(check.area);
  }
  function bindCheckBuilder() {
    var builder = document.getElementById('coreCheckBuilderForm');
    if (!builder) return;
    builder.onsubmit = function (event) { event.preventDefault(); saveChecklistBuilder(builder); };
    bindBuilderSections(builder);
    syncBuilderAssignment(builder);
    var freq = builder.elements.freq;
    if (freq) freq.onchange = function () { syncBuilderAssignment(builder); };
    var deleteCheck = document.getElementById('deleteCheckBtn');
    if (deleteCheck) deleteCheck.onclick = function () {
      var id = builder.dataset.editingCheck;
      if (!id) return;
      if (!confirm('Delete this check? Completed history will remain.')) return;
      var returnArea = builder.dataset.returnArea || '';
      state.checks = (state.checks || []).filter(function (check) { return check.id !== id; });
      saveSafe();
      openChecklistAreaModal(returnArea);
    };
  }

  function saveRotaSections(list) {
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = list.slice();
    var rota = readJSON(ROTA_KEY, {});
    rota.sections = list.slice();
    writeJSON(ROTA_KEY, rota);
    saveSafe();
    try { if (typeof writeRotaStateFromCompliance === 'function') writeRotaStateFromCompliance(); } catch (_) {}
  }
  function addRotaSection(event) {
    event.preventDefault();
    var name = String(new FormData(event.currentTarget).get('section') || '').trim();
    if (!name) return;
    var list = state.rotaSettings && Array.isArray(state.rotaSettings.sections) ? state.rotaSettings.sections.slice() : areas();
    if (!list.some(function (section) { return normalise(section) === normalise(name); })) list.push(name);
    saveRotaSections(list);
    openSection('rota');
  }
  function deleteRotaSection(section) {
    saveRotaSections((state.rotaSettings && state.rotaSettings.sections || []).filter(function (item) { return normalise(item) !== normalise(section); }));
    openSection('rota');
  }
  function saveIssueSettings(event) {
    event.preventDefault();
    state.issueSettings = state.issueSettings || {};
    var data = new FormData(event.currentTarget);
    state.issueSettings.issueNotifications = !!data.get('issueNotifications');
    state.issueSettings.issueLog = !!data.get('issueLog');
    saveSafe();
    closeSection();
  }

  function bindAreaDrag() {
    document.querySelectorAll('[data-core-area] .coreDrag').forEach(function (handle) {
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
  function bindRotaDrag() {
    document.querySelectorAll('[data-core-rota-section] .coreDrag').forEach(function (handle) {
      handle.onpointerdown = function (event) {
        var row = handle.closest('[data-core-rota-section]');
        var list = row && row.parentElement;
        if (!row || !list) return;
        event.preventDefault();
        row.classList.add('dragging');
        var onMove = function (moveEvent) {
          moveEvent.preventDefault();
          var target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
          target = target && target.closest && target.closest('[data-core-rota-section]');
          if (!target || target === row || target.parentElement !== list) return;
          var rect = target.getBoundingClientRect();
          list.insertBefore(row, moveEvent.clientY > rect.top + rect.height / 2 ? target.nextSibling : target);
        };
        var finish = function () {
          row.classList.remove('dragging');
          saveRotaSections(Array.from(list.querySelectorAll('[data-core-rota-section]')).map(function (item) { return item.dataset.coreRotaSection; }).filter(Boolean));
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
  function applyBranding() {
    var pub = state.pub || {};
    var title = pub.appDisplayName || pub.name || 'Pub Compliance Hub';
    var topbar = document.querySelector('.topbar');
    if (!topbar) return;
    topbar.classList.add('brandedTopbar');
    var h1 = topbar.querySelector('h1');
    if (h1) h1.textContent = title;
    var logo = topbar.querySelector('.appHeaderLogo');
    var logoSrc = (pub.logoImageId && logoPreviewId === pub.logoImageId ? logoPreviewData : '') || pub.logoData || '';
    if (logoSrc) {
      if (!logo) { logo = document.createElement('img'); logo.className = 'appHeaderLogo'; logo.alt = 'App logo'; var wrap = topbar.firstElementChild; if (wrap) wrap.insertBefore(logo, wrap.firstChild); }
      logo.src = logoSrc;
      logo.hidden = false;
    } else {
      if (pub.logoImageId) resolveLogoImage(pub);
      if (logo) logo.hidden = true;
    }
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
  style.textContent = '.brandedTopbar>div:first-child{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:center!important;gap:9px!important;min-width:0!important}.appHeaderLogo{width:32px!important;height:32px!important;object-fit:contain!important;border-radius:7px!important;background:rgba(255,255,255,.08)!important}.brandedTopbar h1{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.coreSettingsPage{display:grid!important;gap:14px!important}.coreSettingsGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.coreSettingsTile{min-height:86px!important;padding:12px!important;border-radius:18px!important;text-align:left!important;display:grid!important;align-content:start!important;gap:5px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(208,173,88,.52)!important;color:#fff8ea!important;box-shadow:none!important}.coreSettingsTile strong{color:#fff8ea!important;font-size:15px!important;line-height:1.1!important}.coreSettingsTile span{color:#fff8ea!important;opacity:.88!important;font-size:12px!important;line-height:1.22!important}#modal.settingsCoreModalOpen{position:fixed!important;inset:calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0!important;z-index:1400!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:14px!important;background:rgba(0,0,0,.68)!important;overflow:hidden!important;box-sizing:border-box!important}#modal.settingsCoreModalOpen.hidden{display:none!important}#modal .coreSettingsModalCard{width:min(760px,100%)!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;box-sizing:border-box!important}#modal .coreModalHandle{cursor:default!important;min-height:58px!important;padding:10px 12px 10px 16px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 40px!important;gap:12px!important;align-items:center!important;background:#151b22!important;border-bottom:1px solid rgba(255,255,255,.09)!important}#modal .coreModalHandle h2{margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#modal .coreModalBody{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:14px!important;display:grid!important;gap:14px!important}.coreSettingsForm{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.coreSettingsForm .full{grid-column:1/-1!important}.coreSettingsForm label{display:grid!important;gap:5px!important;padding:0 4px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}.coreSettingsForm input,.coreSettingsForm textarea,.coreSettingsForm select,.coreInlineForm input{font-size:16px!important}.coreSettingsForm textarea{min-height:76px!important}.coreLogoPreview{min-height:80px!important;display:grid!important;place-items:center!important;border-radius:16px!important;border:1px dashed rgba(208,173,88,.45)!important;color:#aaa194!important;background:rgba(255,255,255,.035)!important}.coreLogoPreview img{max-width:160px!important;max-height:72px!important;object-fit:contain!important}.coreUserPreview{display:grid!important;gap:8px!important}.coreUserRow{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:8px!important;border-radius:13px!important;background:rgba(255,255,255,.04)!important}.coreUserRow div{display:grid!important}.coreUserRow em{font-style:normal!important;color:#aaa194!important;font-size:12px!important}.coreUserRow small{color:#d0ad58!important;font-weight:850!important}.corePermissionGroups{display:grid!important;gap:10px!important}.corePermissionCard{border-radius:18px!important;border:1px solid rgba(255,255,255,.09)!important;background:rgba(255,255,255,.035)!important;overflow:hidden!important}.corePermissionCard summary{min-height:60px!important;padding:12px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 34px!important;align-items:center!important;gap:10px!important;cursor:pointer!important;list-style:none!important}.corePermissionCard summary::-webkit-details-marker{display:none!important}.corePermissionCard summary span{display:grid!important;gap:3px!important}.corePermissionCard summary strong{color:#fff8ea!important}.corePermissionCard summary em{font-style:normal!important;color:#aaa194!important;font-size:12px!important}.corePermissionCard summary b{width:32px!important;height:32px!important;display:grid!important;place-items:center!important;color:#d0ad58!important}.corePermissionCard summary b:before{content:""!important;width:11px!important;height:11px!important;border-right:4px solid currentColor!important;border-bottom:4px solid currentColor!important;transform:rotate(45deg)!important}.corePermissionCard[open] summary b:before{transform:rotate(225deg)!important}.coreGroupForm{display:grid!important;gap:12px!important;padding:0 12px 12px!important}.coreGroupForm label{padding:0 4px!important}.corePermissionBlock{display:grid!important;gap:8px!important;padding:10px!important;border-radius:16px!important;background:rgba(0,0,0,.18)!important}.corePermissionBlock h4,.coreAssigned h4{margin:0!important;color:#d0ad58!important}.corePermissionTicks,.coreUserTicks{display:grid!important;gap:7px!important}.coreUserTicks{max-height:210px!important;overflow:auto!important}.coreTick{display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;gap:9px!important;align-items:start!important;padding:9px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.07)!important}.coreTick input{width:18px!important;height:18px!important;min-height:18px!important;margin:2px 0 0!important}.coreTick span{display:grid!important;gap:2px!important}.coreTick strong{color:#fff8ea!important;font-size:13px!important}.coreTick em{font-style:normal!important;color:#aaa194!important;font-size:11px!important}.coreQuickUsers{display:grid!important;gap:8px!important;margin:8px 0!important;padding:10px!important;border-radius:14px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important}.coreQuickUsers label{display:grid!important;gap:5px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}.coreFormActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}.coreSummaryGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.coreSummaryGrid span{min-height:44px!important;display:grid!important;place-items:center!important;padding:8px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.09)!important;color:#fff8ea!important;font-weight:850!important;text-align:center!important}.coreInlineForm{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important}.coreAreaList{display:grid!important;gap:8px!important}.coreAreaRow{display:grid!important;grid-template-columns:32px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:10px!important;border-radius:14px!important;background:rgba(255,255,255,.05)!important}.coreDrag{min-width:32px!important;width:32px!important;height:38px!important;padding:0!important;background:transparent!important;color:#d0ad58!important;border:0!important}.coreAreaRow.dragging{opacity:.55!important}.danger{color:#ff6b5d!important}@media(max-width:430px){.coreSettingsGrid,.coreSettingsForm,.coreSummaryGrid{grid-template-columns:1fr!important}.coreFormActions{grid-template-columns:1fr!important}.coreUserRow{grid-template-columns:44px minmax(0,1fr)!important}.coreUserRow small{grid-column:1/-1!important}#modal.settingsCoreModalOpen{padding:10px!important}}';
  style.textContent += '.coreSettingsTile{grid-template-columns:minmax(0,1fr) 34px!important;align-items:center!important;align-content:center!important}.coreSettingsTile .coreSettingsCog{justify-self:end!important;width:34px!important;height:34px!important;border-radius:999px!important;display:grid!important;place-items:center!important;background:#071522!important;color:#d0ad58!important;border:1px solid rgba(208,173,88,.56)!important;font-size:18px!important;line-height:1!important;opacity:1!important}.coreSettingsModalCard,.coreSettingsModalCard *{box-sizing:border-box!important}#modal .coreModalHandle{width:100%!important;max-width:100%!important;min-width:0!important}#modal .coreModalHandle h2{min-width:0!important}#modal .coreModalHandle.hasSave{grid-template-columns:minmax(0,1fr) auto 40px!important}.coreModalSave{min-width:76px!important;min-height:40px!important;height:40px!important;border-radius:999px!important;padding:0 14px!important}.corePermissionCard summary .corePermissionChevron{color:#d0ad58!important}.corePermissionCard:not([open]) summary .corePermissionChevron:before{transform:rotate(45deg)!important}.corePermissionCard[open] summary .corePermissionChevron:before{transform:rotate(225deg)!important}.coreSummaryGrid span{cursor:default!important}.coreAreaRow .settingsDeleteX{justify-self:end!important}.coreInlineForm input{min-width:0!important}.coreModalBody button.primary,.coreModalBody .primary{background:#071522!important;color:#fff8ea!important}.coreModalBody .coreSettingsForm>.primary,.coreModalBody .coreFormActions>.primary,.coreModalBody .coreInlineForm>.primary{background:#071522!important;color:#fff8ea!important}';
  style.textContent += '.coreSettingsCog svg{width:19px!important;height:19px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}button.coreUserRow{width:100%!important;min-height:62px!important;border:1px solid rgba(255,255,255,.08)!important;text-align:left!important;color:#fff8ea!important;background:rgba(255,255,255,.04)!important;box-shadow:none!important}.coreUserRow>span:not(.avatarText){display:grid!important;min-width:0!important}.coreUserRow strong{color:#fff8ea!important}.coreUserRow:focus-visible{outline:2px solid rgba(208,173,88,.7)!important;outline-offset:2px!important}.coreSummaryGrid span{min-height:auto!important;display:block!important;place-items:initial!important;padding:8px 0!important;border-radius:0!important;background:transparent!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.07)!important;color:#aaa194!important;font-weight:800!important;text-align:left!important}.coreSummaryGrid span:last-child{border-bottom:0!important}';
  style.textContent += '.coreSettingsPage{gap:12px!important}.coreSettingsTitle{margin:0 0 6px!important;padding:0!important;border:0!important;background:transparent!important;color:#fff8ea!important;font-size:24px!important;line-height:1.1!important;box-shadow:none!important}.coreSettingsGrid{margin-top:8px!important}#modal.settingsCoreModalOpen .coreModalHandle{cursor:default!important;touch-action:auto!important}#modal.settingsCoreModalOpen .coreSettingsModalCard{transform:none!important;left:auto!important;right:auto!important}#modal.settingsCoreModalOpen .settingsBlock{display:grid!important;gap:12px!important;background:linear-gradient(180deg,#1b2229,#11161c)!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:20px!important;padding:14px!important;color:#fff8ea!important;box-shadow:none!important}#modal.settingsCoreModalOpen .settingsBlock h3{margin:0!important;color:#fff8ea!important;font-size:17px!important;line-height:1.15!important}#modal.settingsCoreModalOpen .permissionGroupPanel .permissionActions{grid-template-columns:1fr!important}#modal.settingsCoreModalOpen .permissionGroupPanel .permissionActions .primary,#modal.settingsCoreModalOpen .permissionGroupPanel .permissionGroupForm>button.primary{background:#071522!important;color:#fff8ea!important;border:1px solid rgba(255,255,255,.16)!important}#modal.settingsCoreModalOpen .checkBuilderBar{grid-template-columns:34px minmax(0,1fr)!important}#modal.settingsCoreModalOpen .checkBuilderTopActions .danger,#modal.settingsCoreModalOpen #deleteCheckBtn{background:#9b1c15!important;color:#fff8ea!important;border:1px solid rgba(255,255,255,.16)!important}#modal.settingsCoreModalOpen .checkBuilderMetaGrid input,#modal.settingsCoreModalOpen .checkBuilderMetaGrid select,#modal.settingsCoreModalOpen .checkTypePanel input,#modal.settingsCoreModalOpen .checkTypePanel textarea{font-size:16px!important}#modal.settingsCoreModalOpen .userRolePill{justify-self:end!important;white-space:nowrap!important}.documentGroupRow{grid-template-columns:minmax(0,1fr) 40px!important}.settings-core-modal-page-locked{overscroll-behavior:none!important}';
  style.textContent += '#modal.settingsCoreModalOpen button.primary,#modal.settingsCoreModalOpen .primary{background:#071522!important;color:#fff8ea!important;border:1px solid rgba(255,255,255,.16)!important}#modal.settingsCoreModalOpen button.primary *,#modal.settingsCoreModalOpen .primary *{color:#fff8ea!important}';
  style.textContent += '#modal.settingsCoreModalOpen .coreSettingsModalCard{height:100%!important;min-height:0!important}#modal.settingsCoreModalOpen .coreModalBody{min-height:0!important;max-height:100%!important;align-items:start!important;align-content:start!important;overscroll-behavior:contain!important}#modal.settingsCoreModalOpen .coreModalBody>*{align-self:start!important;min-height:0!important}#modal.settingsCoreModalOpen #coreCheckBuilderForm{height:auto!important;min-height:0!important;overflow:visible!important}#modal.settingsCoreModalOpen .checkBuilderPreview,#modal.settingsCoreModalOpen .checkBuilderSections,#modal.settingsCoreModalOpen .checkBuilderSection{min-height:0!important}';
  style.textContent += '#modal.settingsCoreModalOpen .corePushActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}#modal.settingsCoreModalOpen .corePushActions button{width:100%!important;background:#071522!important;color:#fff8ea!important;border:1px solid rgba(255,255,255,.16)!important}#modal.settingsCoreModalOpen .corePushStatus{margin:0!important;color:#aaa194!important;font-size:12px!important;font-weight:850!important;line-height:1.25!important}@media(max-width:430px){#modal.settingsCoreModalOpen .corePushActions{grid-template-columns:1fr!important}}';
  style.textContent += '#modal.settingsCoreModalOpen .corePermissionGroups{width:100%!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important;align-items:start!important;align-content:start!important}#modal.settingsCoreModalOpen .corePermissionCard{display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;position:relative!important;overflow:hidden!important;contain:none!important}#modal.settingsCoreModalOpen .corePermissionCard:not([open])>.coreGroupForm,#modal.settingsCoreModalOpen .corePermissionCard:not([open])>.coreSettingsForm{display:none!important}#modal.settingsCoreModalOpen .corePermissionCard[open]>.coreGroupForm,#modal.settingsCoreModalOpen .corePermissionCard[open]>.coreSettingsForm{display:grid!important;position:static!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;grid-template-columns:minmax(0,1fr)!important;box-sizing:border-box!important}#modal.settingsCoreModalOpen .corePermissionCard>summary{width:100%!important;max-width:100%!important;box-sizing:border-box!important;grid-template-columns:minmax(0,1fr) 34px!important}#modal.settingsCoreModalOpen .corePermissionCard>summary span,#modal.settingsCoreModalOpen .corePermissionCard>summary strong,#modal.settingsCoreModalOpen .corePermissionCard>summary em{min-width:0!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important}#modal.settingsCoreModalOpen .coreGroupForm,#modal.settingsCoreModalOpen .coreAssigned,#modal.settingsCoreModalOpen .corePermissionBlock,#modal.settingsCoreModalOpen .corePermissionTicks,#modal.settingsCoreModalOpen .coreUserTicks,#modal.settingsCoreModalOpen .coreQuickUsers{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}#modal.settingsCoreModalOpen .coreTick{grid-template-columns:minmax(0,1fr) 22px!important;align-items:center!important;min-width:0!important;max-width:100%!important}#modal.settingsCoreModalOpen .coreTick input{grid-column:2!important;grid-row:1!important;justify-self:end!important;margin:0!important}#modal.settingsCoreModalOpen .coreTick span{grid-column:1!important;grid-row:1!important;min-width:0!important;max-width:100%!important}#modal.settingsCoreModalOpen .coreQuickUsers label{min-width:0!important;max-width:100%!important}#modal.settingsCoreModalOpen .coreQuickUsers select{width:100%!important;min-width:0!important}@media(max-width:430px){#modal.settingsCoreModalOpen .coreGroupForm{padding:0 10px 10px!important}.corePermissionBlock{padding:9px!important}.coreTick{padding:8px!important}}';
  document.head.appendChild(style);

  ensureState();
  saveSafe();
  applyBranding();
  setTimeout(bindSettingsButtons, 0);
})();
