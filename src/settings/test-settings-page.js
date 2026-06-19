// Test branch settings page prototype for broader permission groups.
// Built as an isolated override so the clean-slate branch can be compared safely.
(function testSettingsPagePrototype(){
  if(window.__testSettingsPagePrototype) return;
  window.__testSettingsPagePrototype = true;

  const TEST_SETTINGS_SECTION_KEY = 'complianceBible.testSettingsSection.v1';
  const NOTIFICATION_RULES_KEY = 'complianceBible.notificationRules.v1';
  const ROTA_STORAGE_KEY = 'rotaAppUnifiedV2';
  const CORE_GROUPS = ['Admin','Supervisor','Staff'];

  const SETTINGS_SECTIONS = [
    { id:'pub', title:'Pub Details', sub:'Business identity, logo and app display name.' },
    { id:'users', title:'Users & Permission Groups', sub:'Staff list, profile privacy and permission group builder.' },
    { id:'documents', title:'Documents', sub:'Premises documents, staff documents and document responsibility.' },
    { id:'checks', title:'Checks', sub:'Checklist templates, check management and alerts.' },
    { id:'rota', title:'Rota & Time', sub:'Rota access, clocking and time record management.' },
    { id:'issues', title:'Issues & Inspection', sub:'Issue access, inspection mode and report export.' },
    { id:'areas', title:'Work Areas', sub:'Shared work areas / rota sections.' },
    { id:'notifications', title:'Notification Rules', sub:'Timing rules and personal notification defaults.' }
  ];

  const PERMISSION_SECTIONS = [
    { id:'settings', title:'Settings & Pub Details', permissions:[
      ['settings.view','View Settings','Can open the Settings tab.'],
      ['settings.managePermissionGroups','Manage Permission Groups','Can create/edit permission groups and assign users to groups.'],
      ['settings.manageNotificationRules','Manage Notification Rules','Can change app-wide notification timing/rules.'],
      ['pub.manage','Manage Pub Details','Can change pub details, app display name and uploaded logo.']
    ]},
    { id:'users', title:'Users', permissions:[
      ['users.viewList','View User List','Can see the basic staff list.'],
      ['users.viewPersonal','View User Personal Details','Can open the Personal tab in user profiles.'],
      ['users.viewEmployment','View User Employment Details','Can open the Employment tab in user profiles.'],
      ['users.viewTraining','View User Training Details','Can open the Training tab in user profiles.'],
      ['users.manage','Manage Users','Can add/edit users, work areas and profile information. Permission group assignment still requires Manage Permission Groups.']
    ]},
    { id:'documents', title:'Documents', permissions:[
      ['premisesDocs.view','View Premises Documents','Can view premises/business documents.'],
      ['premisesDocs.manage','Manage Premises Documents','Can add, edit, upload, replace and remove premises document records.'],
      ['premisesDocs.notify','Premises Document Notifications','Can receive missing/expiring premises document alerts.'],
      ['staffDocs.viewOwn','View Own Staff Documents','Can see their own staff document status.'],
      ['staffDocs.viewAll','View All Staff Documents','Can see staff documents for everyone.'],
      ['staffDocs.manage','Manage Staff Documents','Can upload/edit/replace/mark staff documents and maintain requirements.'],
      ['staffDocs.notify','Staff Document Notifications','Can receive missing/expiring staff document alerts.']
    ]},
    { id:'checks', title:'Checks', permissions:[
      ['checks.viewAll','View All Checks','Can see all checks and completion history. Assigned checks can still be completed by assigned users.'],
      ['checks.manage','Manage Checks','Can create/edit/delete checklist templates and check structure.'],
      ['checks.notify','Check Notifications','Can receive assigned/overdue check alerts.']
    ]},
    { id:'rota', title:'Rota & Time', permissions:[
      ['rota.view','View Rota','Can see the full rota.'],
      ['rota.manage','Manage Rota & Time Records','Can create/edit/delete/publish shifts and correct time records where needed.'],
      ['time.clockOwn','Clock In/Out','Can use shift start/end/break controls for their own shifts.'],
      ['rota.notify','Rota Notifications','Can receive rota, shift and timing alerts.']
    ]},
    { id:'issues', title:'Issues & Inspection', permissions:[
      ['issues.view','View Issues','Can view reported issues. Everyone can still report a new issue.'],
      ['issues.manage','Manage Issues','Can edit, resolve, reopen or remove issues.'],
      ['issues.notify','Issue Notifications','Can receive issue alerts.'],
      ['inspection.view','View Inspection Mode','Can open Inspection Mode.'],
      ['inspection.export','Export Inspection Report','Can export/download inspection reports.']
    ]},
    { id:'areas', title:'Work Areas', permissions:[
      ['workAreas.view','View Work Areas','Can see the work area / rota section list.'],
      ['workAreas.manage','Manage Work Areas','Can add, rename, reorder or archive work areas.']
    ]}
  ];

  const DEFAULT_GROUP_PERMISSIONS = {
    Admin: true,
    Supervisor: {
      'settings.view': true,
      'settings.managePermissionGroups': false,
      'settings.manageNotificationRules': false,
      'pub.manage': false,
      'users.viewList': true,
      'users.viewPersonal': false,
      'users.viewEmployment': true,
      'users.viewTraining': true,
      'users.manage': false,
      'premisesDocs.view': true,
      'premisesDocs.manage': false,
      'premisesDocs.notify': true,
      'staffDocs.viewOwn': true,
      'staffDocs.viewAll': true,
      'staffDocs.manage': false,
      'staffDocs.notify': true,
      'checks.viewAll': true,
      'checks.manage': false,
      'checks.notify': true,
      'rota.view': true,
      'rota.manage': false,
      'time.clockOwn': true,
      'rota.notify': true,
      'issues.view': true,
      'issues.manage': true,
      'issues.notify': true,
      'inspection.view': true,
      'inspection.export': false,
      'workAreas.view': true,
      'workAreas.manage': false
    },
    Staff: {
      'settings.view': false,
      'settings.managePermissionGroups': false,
      'settings.manageNotificationRules': false,
      'pub.manage': false,
      'users.viewList': true,
      'users.viewPersonal': false,
      'users.viewEmployment': false,
      'users.viewTraining': false,
      'users.manage': false,
      'premisesDocs.view': true,
      'premisesDocs.manage': false,
      'premisesDocs.notify': false,
      'staffDocs.viewOwn': true,
      'staffDocs.viewAll': false,
      'staffDocs.manage': false,
      'staffDocs.notify': false,
      'checks.viewAll': false,
      'checks.manage': false,
      'checks.notify': true,
      'rota.view': true,
      'rota.manage': false,
      'time.clockOwn': true,
      'rota.notify': true,
      'issues.view': false,
      'issues.manage': false,
      'issues.notify': false,
      'inspection.view': false,
      'inspection.export': false,
      'workAreas.view': true,
      'workAreas.manage': false
    }
  };

  function esc(value){
    try { if(typeof window.esc === 'function') return window.esc(value); } catch(_) {}
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function saveSafe(){ try { if(typeof save === 'function') save(); } catch(_){} }
  function uidSafe(){ try { if(typeof uid === 'function') return uid(); } catch(_){} return 'id_' + Math.random().toString(36).slice(2); }
  function currentUser(){ try { return typeof me === 'function' ? me() : null; } catch(_) { return null; } }
  function normalise(value){ return String(value || '').trim().toLowerCase(); }
  function allPermissionKeys(){ return PERMISSION_SECTIONS.flatMap(section => section.permissions.map(item => item[0])); }
  function selectedSection(){ return localStorage.getItem(TEST_SETTINGS_SECTION_KEY) || 'pub'; }
  function setSelectedSection(id){ localStorage.setItem(TEST_SETTINGS_SECTION_KEY, id); }
  function readJSON(key, fallback){ try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed || fallback; } catch(_) { return fallback; } }
  function writeJSON(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(_){} }

  function namedAdmin(user){
    const text = String((user && user.name || '') + ' ' + (user && user.nickname || '') + ' ' + (user && user.email || '')).toLowerCase();
    return text.includes('chip') || text.includes('vicky') || text.includes('rihanna');
  }

  function ensurePrototypePermissions(){
    state.permissionMatrix = state.permissionMatrix || {};
    CORE_GROUPS.forEach(group => { state.permissionMatrix[group] = state.permissionMatrix[group] || {}; });
    const keys = allPermissionKeys();
    Object.keys(state.permissionMatrix).forEach(group => {
      const matrix = state.permissionMatrix[group] || {};
      const defaults = DEFAULT_GROUP_PERMISSIONS[group];
      keys.forEach(key => {
        if(typeof matrix[key] === 'boolean') return;
        if(defaults === true) matrix[key] = true;
        else if(defaults && typeof defaults[key] === 'boolean') matrix[key] = defaults[key];
        else matrix[key] = false;
      });
      state.permissionMatrix[group] = matrix;
    });
    (state.users || []).forEach(user => {
      if(namedAdmin(user)){ user.permissionSetId = 'Admin'; user.role = 'Admin'; return; }
      if(!user.permissionSetId) user.permissionSetId = user.role || 'Staff';
      if(!state.permissionMatrix[user.permissionSetId]) user.permissionSetId = 'Staff';
      user.role = user.permissionSetId;
    });
    state.pub = state.pub || {};
    state.notificationRules = state.notificationRules || readJSON(NOTIFICATION_RULES_KEY, defaultNotificationRules());
    saveSafe();
  }

  function defaultNotificationRules(){
    return {
      premisesExpiryDays: 30,
      staffExpiryDays: 30,
      checkOverdueMinutes: 0,
      shiftReminderMinutes: 60,
      lateShiftMinutes: 1,
      missedClockOutHours: 10,
      longBreakMinutes: 45,
      criticalIssuesAlwaysNotifyAdmin: true
    };
  }

  function userPermissionGroup(user){ return (user && user.permissionSetId) || (user && user.role) || 'Staff'; }
  function groupHasPermission(group, key){
    ensurePrototypePermissions();
    const matrix = state.permissionMatrix && state.permissionMatrix[group];
    return !!(matrix && matrix[key]);
  }
  window.appPermissionAllows = function appPermissionAllows(key, user){
    const u = user || currentUser();
    if(!u) return false;
    if(namedAdmin(u)) return true;
    return groupHasPermission(userPermissionGroup(u), key);
  };

  function userCanOpenAnyProfileTab(){
    return ['users.viewPersonal','users.viewEmployment','users.viewTraining','users.manage'].some(key => window.appPermissionAllows(key));
  }
  function allowedProfileTabs(user){
    if(window.appPermissionAllows('users.manage')) return ['personal','employment','training'];
    const tabs = [];
    if(window.appPermissionAllows('users.viewPersonal') || (user && user.id === state.currentUser)) tabs.push('personal');
    if(window.appPermissionAllows('users.viewEmployment')) tabs.push('employment');
    if(window.appPermissionAllows('users.viewTraining')) tabs.push('training');
    return tabs;
  }

  function currentGroups(){
    ensurePrototypePermissions();
    return Object.keys(state.permissionMatrix || {}).sort((a,b) => {
      const ai = CORE_GROUPS.indexOf(a), bi = CORE_GROUPS.indexOf(b);
      if(ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    });
  }

  function settingsNav(){
    return '<section class="testSettingsNav">' + SETTINGS_SECTIONS.map(section => (
      '<button type="button" class="testSettingsTile ' + (selectedSection() === section.id ? 'active' : '') + '" data-test-settings-section="' + esc(section.id) + '">' +
      '<strong>' + esc(section.title) + '</strong><span>' + esc(section.sub) + '</span></button>'
    )).join('') + '</section>';
  }

  function testSettings(){
    ensurePrototypePermissions();
    const section = selectedSection();
    return '<section class="testSettingsPage">' +
      '<div class="hero card testSettingsHero"><div><p class="eyebrow">Test Settings Page</p><h2>Settings</h2><p>Prototype permission-group settings built on the test-settings-page branch.</p></div></div>' +
      settingsNav() +
      '<section class="card testSettingsPanel">' + sectionContent(section) + '</section>' +
    '</section>';
  }

  function sectionContent(section){
    if(section === 'pub') return pubSection();
    if(section === 'users') return usersPermissionsSection();
    if(section === 'documents') return documentsSection();
    if(section === 'checks') return checksSection();
    if(section === 'rota') return rotaSection();
    if(section === 'issues') return issuesInspectionSection();
    if(section === 'areas') return workAreasSection();
    if(section === 'notifications') return notificationRulesSection();
    return pubSection();
  }

  function pubSection(){
    const pub = state.pub || {};
    const logo = pub.logoData ? '<div class="testLogoPreview"><img src="' + pub.logoData + '" alt="Current logo"></div>' : '<div class="testLogoPreview empty">No logo uploaded</div>';
    return '<div class="testSectionHead"><h2>Pub Details</h2><p>Controls the name, app title and logo shown in the header.</p></div>' +
      '<form id="testPubDetailsForm" class="testFormGrid">' +
        '<label><span>Pub name</span><input name="name" value="' + esc(pub.name || '') + '" placeholder="The Piston Club"></label>' +
        '<label><span>App display name</span><input name="appDisplayName" value="' + esc(pub.appDisplayName || pub.name || 'Pub Compliance Hub') + '" placeholder="Pub Compliance Hub"></label>' +
        '<label><span>Premises licence</span><input name="licence" value="' + esc(pub.licence || '') + '"></label>' +
        '<label><span>DPS</span><input name="dps" value="' + esc(pub.dps || '') + '"></label>' +
        '<label class="full"><span>Address</span><textarea name="address">' + esc(pub.address || '') + '</textarea></label>' +
        '<label class="full"><span>Logo image</span><input name="logo" type="file" accept="image/*"></label>' +
        '<div class="full">' + logo + '</div>' +
        '<button class="primary full">Save Pub Details</button>' +
      '</form>';
  }

  function usersPermissionsSection(){
    return '<div class="testSectionHead"><h2>Users & Permission Groups</h2><p>Everyone can see the basic user list. Profile tabs and management are controlled by permission groups.</p></div>' +
      '<div class="testInfoBox"><strong>User profile rule</strong><p>Tapping a user opens the first profile tab this permission group is allowed to view. Unauthorised profile tabs are hidden.</p></div>' +
      userAccessPreview() +
      '<h3>Permission Groups</h3>' +
      '<div class="testPermissionGroupList">' + currentGroups().map(permissionGroupCard).join('') + createPermissionGroupCard() + '</div>';
  }

  function userAccessPreview(){
    const users = state.users || [];
    return '<details class="testDetails"><summary>Basic user list preview <span>' + users.length + ' users</span></summary>' +
      '<div class="testUserPreviewList">' + users.map(user => {
        const tabs = allowedProfileTabs(user);
        return '<div class="testUserPreviewRow"><span class="avatarText">' + esc((user.name || user.nickname || 'U').split(/\s+/).map(p=>p[0]).join('').slice(0,2)) + '</span><div><strong>' + esc(user.name || user.nickname || 'User') + '</strong><em>' + esc(user.jobArea || user.area || user.role || '') + '</em></div><small>' + (tabs.length ? 'Opens: ' + tabs.map(t => t[0].toUpperCase()+t.slice(1)).join(', ') : 'No profile tab access') + '</small></div>';
      }).join('') + '</div></details>';
  }

  function permissionGroupCard(group){
    const matrix = state.permissionMatrix[group] || {};
    const users = state.users || [];
    const isCore = CORE_GROUPS.includes(group);
    return '<details class="testPermissionGroupCard" ' + (group === 'Admin' ? 'open' : '') + ' data-permission-card="' + esc(group) + '">' +
      '<summary><span><strong>' + esc(group) + '</strong><em>' + users.filter(user => userPermissionGroup(user) === group).length + ' assigned users</em></span><b>Open</b></summary>' +
      '<form class="testPermissionGroupForm" data-test-permission-group-form="' + esc(group) + '">' +
        '<label class="full"><span>Group description</span><textarea name="description" placeholder="What this group is for">' + esc(matrix.description || '') + '</textarea></label>' +
        '<section class="testAssignedUsers"><h4>Assigned users</h4><div class="testCheckboxGrid users">' + users.map(user => {
          const checked = userPermissionGroup(user) === group;
          const locked = namedAdmin(user) && group !== 'Admin';
          return '<label class="testCheck"><input type="checkbox" name="user__' + esc(user.id) + '" ' + (checked ? 'checked' : '') + ' ' + (locked ? 'disabled' : '') + '><span><strong>' + esc(user.nickname || user.name) + '</strong><em>' + esc(user.name || '') + '</em></span></label>';
        }).join('') + '</div></section>' +
        PERMISSION_SECTIONS.map(section => permissionBlock(section, matrix)).join('') +
        '<div class="testFormActions full"><button class="primary">Save ' + esc(group) + '</button>' + (!isCore ? '<button type="button" class="secondary danger" data-delete-permission-group="' + esc(group) + '">Delete Group</button>' : '') + '</div>' +
      '</form></details>';
  }

  function permissionBlock(section, matrix){
    return '<section class="testPermissionBlock"><h4>' + esc(section.title) + '</h4><div class="testCheckboxGrid">' + section.permissions.map(([key,label,desc]) => (
      '<label class="testCheck"><input type="checkbox" name="perm__' + esc(key) + '" ' + (matrix[key] ? 'checked' : '') + '><span><strong>' + esc(label) + '</strong><em>' + esc(desc) + '</em></span></label>'
    )).join('') + '</div></section>';
  }

  function createPermissionGroupCard(){
    return '<details class="testPermissionGroupCard create"><summary><span><strong>Create New Permission Group</strong><em>Copy from Admin, Supervisor or Staff and adjust the tick boxes.</em></span><b>Open</b></summary>' +
      '<form id="testCreatePermissionGroup" class="testFormGrid">' +
      '<label><span>New group name</span><input name="name" placeholder="e.g. Document Checker" required></label>' +
      '<label><span>Copy permissions from</span><select name="copyFrom">' + currentGroups().map(group => '<option>' + esc(group) + '</option>').join('') + '</select></label>' +
      '<button class="primary full">Create Group</button>' +
      '</form></details>';
  }

  function permissionSummary(keys){
    return '<div class="testPermissionSummary">' + keys.map(key => '<span>' + esc(labelForPermission(key)) + '</span>').join('') + '</div>';
  }
  function labelForPermission(key){
    for(const section of PERMISSION_SECTIONS){
      const found = section.permissions.find(item => item[0] === key);
      if(found) return found[1];
    }
    return key;
  }

  function documentsSection(){
    return '<div class="testSectionHead"><h2>Documents</h2><p>Broad document permissions split premises documents, staff documents and notifications.</p></div>' +
      '<h3>Premises Documents</h3>' + permissionSummary(['premisesDocs.view','premisesDocs.manage','premisesDocs.notify']) +
      '<h3>Staff Documents</h3>' + permissionSummary(['staffDocs.viewOwn','staffDocs.viewAll','staffDocs.manage','staffDocs.notify']) +
      '<div class="testInfoBox"><strong>Staff document requirements</strong><p>Requirement setup remains under Manage Staff Documents. Normal staff can view their own status, but they cannot upload their own documents in this version.</p></div>';
  }

  function checksSection(){
    const freqs = ['Daily','Weekly','Monthly','Quarterly','Every 6 Months','Annual'];
    return '<div class="testSectionHead"><h2>Checks</h2><p>Completing a check is controlled by assignment, not by a permission toggle. If a check is assigned to a user/everyone, they can complete it.</p></div>' +
      '<h3>Check Permissions</h3>' + permissionSummary(['checks.viewAll','checks.manage','checks.notify']) +
      '<h3>Checklist Builder Fields</h3><div class="testInfoGrid"><span>Title</span><span>Work area / everyone</span><span>Assigned user / everyone</span><span>Due time</span><span>Frequency: ' + freqs.join(', ') + '</span><span>Check items / sections</span><span>Photo evidence yes/no</span><span>Signature yes/no</span></div>';
  }

  function rotaSection(){
    return '<div class="testSectionHead"><h2>Rota & Time</h2><p>Everyone can view the full rota. Manage Rota includes time-record correction, with audit logging recommended before production use.</p></div>' +
      '<h3>Rota & Time Permissions</h3>' + permissionSummary(['rota.view','rota.manage','time.clockOwn','rota.notify']) +
      '<div class="testInfoBox warn"><strong>Important later</strong><p>Manual time-record edits should store who changed it, old value, new value, reason and timestamp.</p></div>';
  }

  function issuesInspectionSection(){
    return '<div class="testSectionHead"><h2>Issues & Inspection</h2><p>Issue reporting is assumed available to everyone. Viewing/managing issues and exporting reports are controlled here.</p></div>' +
      '<h3>Issues</h3>' + permissionSummary(['issues.view','issues.manage','issues.notify']) +
      '<h3>Inspection</h3>' + permissionSummary(['inspection.view','inspection.export']);
  }

  function workAreasSection(){
    const areas = currentWorkAreas();
    return '<div class="testSectionHead"><h2>Work Areas</h2><p>Work areas and rota sections are treated as the same list.</p></div>' +
      '<h3>Work Area Permissions</h3>' + permissionSummary(['workAreas.view','workAreas.manage']) +
      '<form id="testAddWorkAreaForm" class="testInlineForm"><input name="area" placeholder="New work area"><button class="primary">Add Work Area</button></form>' +
      '<div class="testAreaList">' + areas.map(area => '<div class="testAreaRow"><span>' + esc(area) + '</span><button type="button" class="secondary danger" data-delete-work-area="' + esc(area) + '">Delete</button></div>').join('') + '</div>';
  }

  function currentWorkAreas(){
    const values = [];
    if(state.rotaSettings && Array.isArray(state.rotaSettings.sections)) values.push(...state.rotaSettings.sections);
    if(Array.isArray(state.areas)) values.push(...state.areas);
    return Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  }

  function notificationRulesSection(){
    const rules = state.notificationRules || defaultNotificationRules();
    return '<div class="testSectionHead"><h2>Notification Rules</h2><p>Permission groups decide who may receive each notification type. Users can later opt out personally inside their profile.</p></div>' +
      '<div class="testInfoBox"><strong>Notification rule</strong><p>User receives a notification only if their permission group allows it and their personal notification preference is enabled.</p></div>' +
      '<form id="testNotificationRulesForm" class="testFormGrid">' +
        numberField('premisesExpiryDays','Premises document expiry warning days',rules.premisesExpiryDays) +
        numberField('staffExpiryDays','Staff document expiry warning days',rules.staffExpiryDays) +
        numberField('checkOverdueMinutes','Check overdue threshold minutes',rules.checkOverdueMinutes) +
        numberField('shiftReminderMinutes','Shift reminder minutes before start',rules.shiftReminderMinutes) +
        numberField('lateShiftMinutes','Late shift threshold minutes',rules.lateShiftMinutes) +
        numberField('missedClockOutHours','Missed clock-out threshold hours',rules.missedClockOutHours) +
        numberField('longBreakMinutes','Long break alert minutes',rules.longBreakMinutes) +
        '<label class="testCheck full"><input type="checkbox" name="criticalIssuesAlwaysNotifyAdmin" ' + (rules.criticalIssuesAlwaysNotifyAdmin ? 'checked' : '') + '><span><strong>Critical issues always notify Admin</strong><em>Safety net for severe issues.</em></span></label>' +
        '<button class="primary full">Save Notification Rules</button>' +
      '</form>';
  }
  function numberField(name,label,value){ return '<label><span>' + esc(label) + '</span><input type="number" min="0" name="' + esc(name) + '" value="' + esc(value) + '"></label>'; }

  function bindTestSettings(){
    ensurePrototypePermissions();
    document.querySelectorAll('[data-test-settings-section]').forEach(button => {
      button.onclick = () => { setSelectedSection(button.dataset.testSettingsSection); if(typeof render === 'function') render(); };
    });
    const pubForm = document.getElementById('testPubDetailsForm');
    if(pubForm) pubForm.onsubmit = savePubDetails;
    document.querySelectorAll('[data-test-permission-group-form]').forEach(form => { form.onsubmit = event => savePermissionGroup(event, form); });
    const createGroup = document.getElementById('testCreatePermissionGroup');
    if(createGroup) createGroup.onsubmit = createPermissionGroup;
    document.querySelectorAll('[data-delete-permission-group]').forEach(button => { button.onclick = () => deletePermissionGroup(button.dataset.deletePermissionGroup); });
    const areaForm = document.getElementById('testAddWorkAreaForm');
    if(areaForm) areaForm.onsubmit = addWorkArea;
    document.querySelectorAll('[data-delete-work-area]').forEach(button => { button.onclick = () => deleteWorkArea(button.dataset.deleteWorkArea); });
    const notifForm = document.getElementById('testNotificationRulesForm');
    if(notifForm) notifForm.onsubmit = saveNotificationRules;
    applyBranding();
  }

  function savePubDetails(event){
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    state.pub = state.pub || {};
    state.pub.name = String(data.get('name') || '').trim();
    state.pub.appDisplayName = String(data.get('appDisplayName') || '').trim();
    state.pub.licence = String(data.get('licence') || '').trim();
    state.pub.dps = String(data.get('dps') || '').trim();
    state.pub.address = String(data.get('address') || '').trim();
    const file = form.elements.logo && form.elements.logo.files && form.elements.logo.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () => { state.pub.logoData = reader.result || ''; saveSafe(); applyBranding(); render(); };
      reader.readAsDataURL(file);
    } else {
      saveSafe(); applyBranding(); render();
    }
  }

  function savePermissionGroup(event, form){
    event.preventDefault();
    const group = form.dataset.testPermissionGroupForm;
    const matrix = state.permissionMatrix[group] || {};
    matrix.description = form.elements.description ? form.elements.description.value : '';
    allPermissionKeys().forEach(key => { matrix[key] = !!form.querySelector('[name="perm__' + cssEscape(key) + '"]')?.checked; });
    state.permissionMatrix[group] = matrix;
    (state.users || []).forEach(user => {
      if(namedAdmin(user)){ user.permissionSetId = 'Admin'; user.role = 'Admin'; return; }
      const input = form.querySelector('[name="user__' + cssEscape(user.id) + '"]');
      if(input && input.checked){ user.permissionSetId = group; user.role = group; }
      else if(userPermissionGroup(user) === group){ user.permissionSetId = 'Staff'; user.role = 'Staff'; }
    });
    saveSafe();
    render();
  }
  function cssEscape(value){ try { return CSS.escape(String(value)); } catch(_) { return String(value).replace(/"/g,'\\"'); } }

  function createPermissionGroup(event){
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(form.elements.name.value || '').trim();
    const copyFrom = String(form.elements.copyFrom.value || 'Staff').trim();
    if(!name || state.permissionMatrix[name]) return;
    state.permissionMatrix[name] = Object.assign({}, state.permissionMatrix[copyFrom] || state.permissionMatrix.Staff || {});
    state.permissionMatrix[name].description = 'Custom permission group';
    saveSafe();
    render();
  }

  function deletePermissionGroup(group){
    if(CORE_GROUPS.includes(group)) return;
    if(!confirm('Delete permission group "' + group + '"? Users in this group will move to Staff.')) return;
    (state.users || []).forEach(user => { if(userPermissionGroup(user) === group){ user.permissionSetId = 'Staff'; user.role = 'Staff'; } });
    delete state.permissionMatrix[group];
    saveSafe();
    render();
  }

  function addWorkArea(event){
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('area') || '').trim();
    if(!name) return;
    state.areas = currentWorkAreas();
    if(!state.areas.some(area => normalise(area) === normalise(name))) state.areas.push(name);
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = state.areas.slice();
    syncRotaSections(state.areas);
    saveSafe();
    render();
  }

  function deleteWorkArea(area){
    if(!confirm('Delete work area "' + area + '"? Users already assigned to it will keep their profile value until changed.')) return;
    const next = currentWorkAreas().filter(item => normalise(item) !== normalise(area));
    state.areas = next.slice();
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = next.slice();
    syncRotaSections(next);
    saveSafe();
    render();
  }
  function syncRotaSections(sections){
    const data = readJSON(ROTA_STORAGE_KEY, {});
    data.sections = sections.slice();
    writeJSON(ROTA_STORAGE_KEY, data);
  }

  function saveNotificationRules(event){
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rules = defaultNotificationRules();
    Object.keys(rules).forEach(key => {
      if(typeof rules[key] === 'boolean') rules[key] = !!data.get(key);
      else rules[key] = Number(data.get(key) || 0);
    });
    state.notificationRules = rules;
    writeJSON(NOTIFICATION_RULES_KEY, rules);
    saveSafe();
    render();
  }

  function applyBranding(){
    const pub = state.pub || {};
    const title = pub.appDisplayName || pub.name || 'Pub Compliance Hub';
    const topbar = document.querySelector('.topbar');
    if(!topbar) return;
    topbar.classList.add('brandedTopbar');
    const titleEl = topbar.querySelector('h1');
    if(titleEl) titleEl.textContent = title;
    let logo = topbar.querySelector('.appHeaderLogo');
    if(pub.logoData){
      if(!logo){ logo = document.createElement('img'); logo.className = 'appHeaderLogo'; logo.alt = 'App logo'; const first = topbar.firstElementChild; if(first) first.insertBefore(logo, first.firstChild); }
      logo.src = pub.logoData;
      logo.hidden = false;
    } else if(logo) logo.hidden = true;
  }

  const style = document.createElement('style');
  style.id = 'test-settings-page-prototype-styles';
  style.textContent = `
    .brandedTopbar > div:first-child { display: grid !important; grid-template-columns: auto minmax(0,1fr) !important; align-items: center !important; gap: 9px !important; min-width: 0 !important; }
    .appHeaderLogo { width: 32px !important; height: 32px !important; object-fit: contain !important; border-radius: 7px !important; background: rgba(255,255,255,.08) !important; }
    .brandedTopbar h1 { min-width: 0 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
    .testSettingsPage { display: grid !important; gap: 14px !important; }
    .testSettingsHero p { max-width: 36em !important; }
    .testSettingsNav { display: grid !important; grid-template-columns: repeat(2,minmax(0,1fr)) !important; gap: 9px !important; }
    .testSettingsTile { min-height: 86px !important; padding: 11px !important; border-radius: 18px !important; display: grid !important; align-content: start !important; gap: 5px !important; text-align: left !important; background: rgba(255,255,255,.055) !important; border: 1px solid rgba(255,255,255,.09) !important; color: #fff8ea !important; }
    .testSettingsTile strong { color: #fff8ea !important; font-size: 14px !important; line-height: 1.1 !important; }
    .testSettingsTile span { color: #aaa194 !important; font-size: 11px !important; line-height: 1.2 !important; }
    .testSettingsTile.active { border-color: rgba(208,173,88,.72) !important; background: rgba(176,145,74,.18) !important; }
    .testSettingsPanel { display: grid !important; gap: 14px !important; }
    .testSectionHead { display: grid !important; gap: 4px !important; }
    .testSectionHead h2, .testSectionHead p { margin: 0 !important; }
    .testFormGrid { display: grid !important; grid-template-columns: repeat(2,minmax(0,1fr)) !important; gap: 10px !important; }
    .testFormGrid label, .testFormGrid .full { grid-column: auto !important; }
    .testFormGrid .full { grid-column: 1/-1 !important; }
    .testFormGrid label { display: grid !important; gap: 5px !important; color: #d0ad58 !important; font-size: 12px !important; font-weight: 900 !important; }
    .testFormGrid textarea { min-height: 76px !important; }
    .testLogoPreview { min-height: 80px !important; display: grid !important; place-items: center !important; border-radius: 16px !important; border: 1px dashed rgba(208,173,88,.45) !important; color: #aaa194 !important; background: rgba(255,255,255,.035) !important; }
    .testLogoPreview img { max-width: 160px !important; max-height: 72px !important; object-fit: contain !important; }
    .testInfoBox { padding: 12px !important; border-radius: 16px !important; background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.09) !important; display: grid !important; gap: 4px !important; }
    .testInfoBox.warn { border-color: rgba(208,173,88,.45) !important; }
    .testInfoBox p { margin: 0 !important; }
    .testPermissionGroupList { display: grid !important; gap: 10px !important; }
    .testPermissionGroupCard { border-radius: 18px !important; border: 1px solid rgba(255,255,255,.09) !important; background: rgba(255,255,255,.035) !important; overflow: hidden !important; }
    .testPermissionGroupCard summary { min-height: 60px !important; padding: 12px !important; display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; align-items: center !important; gap: 10px !important; cursor: pointer !important; list-style: none !important; }
    .testPermissionGroupCard summary::-webkit-details-marker { display: none !important; }
    .testPermissionGroupCard summary span { display: grid !important; gap: 3px !important; min-width: 0 !important; }
    .testPermissionGroupCard summary strong { color: #fff8ea !important; }
    .testPermissionGroupCard summary em { color: #aaa194 !important; font-size: 12px !important; font-style: normal !important; }
    .testPermissionGroupForm { display: grid !important; gap: 12px !important; padding: 0 12px 12px !important; }
    .testPermissionBlock { display: grid !important; gap: 8px !important; padding: 10px !important; border-radius: 16px !important; background: rgba(0,0,0,.18) !important; }
    .testPermissionBlock h4, .testAssignedUsers h4 { margin: 0 !important; color: #d0ad58 !important; }
    .testCheckboxGrid { display: grid !important; grid-template-columns: 1fr !important; gap: 7px !important; }
    .testCheckboxGrid.users { max-height: 210px !important; overflow: auto !important; padding-right: 2px !important; }
    .testCheck { display: grid !important; grid-template-columns: 22px minmax(0,1fr) !important; align-items: start !important; gap: 9px !important; padding: 9px !important; border-radius: 13px !important; background: rgba(255,255,255,.045) !important; border: 1px solid rgba(255,255,255,.07) !important; }
    .testCheck input { width: 18px !important; height: 18px !important; min-height: 18px !important; margin: 2px 0 0 !important; }
    .testCheck span { display: grid !important; gap: 2px !important; }
    .testCheck strong { color: #fff8ea !important; font-size: 13px !important; }
    .testCheck em { color: #aaa194 !important; font-size: 11px !important; font-style: normal !important; line-height: 1.25 !important; }
    .testFormActions { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .testPermissionSummary, .testInfoGrid { display: grid !important; gap: 8px !important; grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .testPermissionSummary span, .testInfoGrid span { min-height: 44px !important; display: grid !important; place-items: center !important; padding: 8px !important; border-radius: 13px !important; background: rgba(255,255,255,.055) !important; color: #fff8ea !important; font-weight: 850 !important; text-align: center !important; }
    .testDetails { border-radius: 16px !important; border: 1px solid rgba(255,255,255,.09) !important; background: rgba(255,255,255,.035) !important; }
    .testDetails summary { padding: 11px !important; display: flex !important; justify-content: space-between !important; cursor: pointer !important; color: #fff8ea !important; font-weight: 900 !important; }
    .testUserPreviewList { display: grid !important; gap: 6px !important; padding: 0 10px 10px !important; }
    .testUserPreviewRow { display: grid !important; grid-template-columns: 44px minmax(0,1fr) auto !important; gap: 8px !important; align-items: center !important; padding: 8px !important; border-radius: 13px !important; background: rgba(0,0,0,.18) !important; }
    .testUserPreviewRow div { display: grid !important; gap: 2px !important; min-width: 0 !important; }
    .testUserPreviewRow em { color: #aaa194 !important; font-style: normal !important; font-size: 11px !important; }
    .testUserPreviewRow small { color: #d0ad58 !important; font-weight: 850 !important; }
    .testInlineForm { display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; gap: 8px !important; }
    .testAreaList { display: grid !important; gap: 8px !important; }
    .testAreaRow { display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; gap: 8px !important; align-items: center !important; padding: 10px !important; border-radius: 14px !important; background: rgba(255,255,255,.05) !important; }
    .danger { color: #ff6b5d !important; }
    @media(max-width:430px){ .testSettingsNav,.testFormGrid,.testPermissionSummary,.testInfoGrid { grid-template-columns: 1fr !important; } .testFormActions { grid-template-columns: 1fr !important; } .testUserPreviewRow { grid-template-columns: 44px minmax(0,1fr) !important; } .testUserPreviewRow small { grid-column: 1/-1 !important; } }
  `;
  document.head.appendChild(style);

  const oldSettings = typeof settings === 'function' ? settings : null;
  settings = function testSettingsOverride(){ return testSettings(); };
  settings.__testSettingsPagePrototype = true;

  if(typeof bind === 'function' && !bind.__testSettingsPagePrototype){
    const oldBind = bind;
    bind = function bindWithTestSettingsPage(){ oldBind(); bindTestSettings(); };
    bind.__testSettingsPagePrototype = true;
  }

  const oldRender = typeof render === 'function' ? render : null;
  if(oldRender && !oldRender.__testSettingsPagePrototype){
    render = function renderWithTestSettingsPage(){ oldRender(); applyBranding(); };
    render.__testSettingsPagePrototype = true;
  }

  ensurePrototypePermissions();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBranding); else applyBranding();
})();