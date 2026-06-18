// Admin settings cleanup: required staff documents by job area/group.
(function staffDocumentGroupSettingsPatch() {
  if (window.__staffDocumentGroupSettingsPatchV1) return;
  window.__staffDocumentGroupSettingsPatchV1 = true;

  const REQ_KEY = 'complianceUserDocumentRequirementsV1';
  const GROUP_KEY = 'complianceStaffDocumentGroupsV1';
  const openDocGroups = {};
  let openCreateDocGroup = false;
  const PERMISSION_KEYS = ['checks','documents','logs','users','rota','inspection','settings'];

  function h(value) {
    try { return esc(value); } catch (_) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    }
  }
  function makeId(value) {
    const clean = String(value || '').trim();
    return clean || 'Group ' + Date.now().toString(36);
  }
  function stableReqId(title) {
    return 'req_' + String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function saveSafe() { try { save(); } catch (_) {} }
  function readJSON(key, fallback) {
    try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed || fallback; } catch (_) { return fallback; }
  }
  function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function normalise(value) { return String(value || '').trim().toLowerCase(); }

  function defaultDocGroups() {
    const base = [
      { id:'Office', label:'Office' },
      { id:'FOH', label:'Front of House' },
      { id:'Kitchen', label:'Kitchen' }
    ];
    (state.areas || []).forEach(area => {
      if (!base.some(group => normalise(group.id) === normalise(area) || normalise(group.label) === normalise(area))) base.push({ id:area, label:area });
    });
    return base;
  }
  function getDocGroups() {
    const saved = readJSON(GROUP_KEY, []);
    const byId = new Map(defaultDocGroups().map(group => [normalise(group.id), group]));
    if (Array.isArray(saved)) saved.forEach(group => {
      if (group && group.id) byId.set(normalise(group.id), { id: group.id, label: group.label || group.id });
    });
    const groups = Array.from(byId.values());
    writeJSON(GROUP_KEY, groups);
    return groups;
  }
  function defaultRequirements() {
    const all = ['Office','FOH','Kitchen','Housekeeping','KP','Kitchen PotWash','Bar','Staff','Supervisor','Admin'];
    const kitchen = ['Kitchen','KP','Kitchen PotWash'];
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
    ].map(([title, staffGroups, expiryMode]) => ({ id: stableReqId(title), title, staffGroups, expiryMode }));
  }
  function migrateRequirement(req) {
    const title = normalise(req && req.title);
    if (title === 'food hygiene certificate') return { ...req, id: req.id || stableReqId('Food Safety & Hygiene Level 2'), title:'Food Safety & Hygiene Level 2', staffGroups:['Kitchen','KP','Kitchen PotWash'], expiryMode:req.expiryMode || 'optional' };
    if (title === 'allergen awareness certificate') return { ...req, id: req.id || stableReqId('Food Allergy and Intolerance'), title:'Food Allergy and Intolerance', staffGroups:['Office','FOH','Kitchen','Housekeeping','KP','Kitchen PotWash','Bar','Staff','Supervisor','Admin'], expiryMode:'none' };
    return { ...req, id: req.id || stableReqId(req.title), staffGroups:Array.isArray(req.staffGroups) ? req.staffGroups : [], expiryMode:req.expiryMode || 'optional' };
  }
  function getRequirements() {
    const saved = readJSON(REQ_KEY, []);
    const byTitle = new Map((Array.isArray(saved) ? saved : []).map(migrateRequirement).map(req => [normalise(req.title), req]));
    defaultRequirements().forEach(req => { if (!byTitle.has(normalise(req.title))) byTitle.set(normalise(req.title), req); });
    const reqs = Array.from(byTitle.values());
    writeJSON(REQ_KEY, reqs);
    return reqs;
  }
  function saveRequirements(reqs) { writeJSON(REQ_KEY, reqs); }
  function permLabel(key) { return ({checks:'Checks',documents:'Documents',logs:'Logs',users:'Users',rota:'Rota',inspection:'Inspection',settings:'Settings'}[key] || key); }
  function fieldChecked(form, name) { return !!(form && form.elements && form.elements[name] && form.elements[name].checked); }
  function userSearchText(user) { return String((user && user.name || '') + ' ' + (user && user.nickname || '') + ' ' + (user && user.email || '')).toLowerCase(); }
  function isNamedAdminUserLocal(user) { return ['chip','vicky','rihanna'].some(name => userSearchText(user).includes(name)); }
  function ensureSettingsStateLocal() {
    state.permissionMatrix = state.permissionMatrix || {};
    const defaults = { Admin:{checks:true,documents:true,logs:true,users:true,rota:true,inspection:true,settings:true}, Supervisor:{checks:true,documents:true,logs:true,users:true,rota:true,inspection:true,settings:true}, Staff:{checks:true,documents:false,logs:true,users:false,rota:true,inspection:false,settings:false} };
    Object.keys(defaults).forEach(group => {
      state.permissionMatrix[group] = state.permissionMatrix[group] || {};
      PERMISSION_KEYS.forEach(key => { if (typeof state.permissionMatrix[group][key] !== 'boolean') state.permissionMatrix[group][key] = defaults[group][key]; });
    });
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = state.rotaSettings.sections || [];
    state.areas = state.areas || [];
    getDocGroups();
    getRequirements();
  }
  function canUseSettings() {
    try { if (typeof isAdminUser === 'function') return isAdminUser(); } catch (_) {}
    return false;
  }

  function groupUsers(group) { return (state.users || []).filter(user => (user.permissionSetId || user.role || 'Staff') === group); }
  function usersDetails(users) {
    return '<details class="permissionUsersDrop"><summary><span class="permissionSummaryText">Select users</span><span class="permissionUserCount">' + users.length + '</span><span class="permissionDetailArrow">⌄</span></summary><div class="permissionUserList">' +
      (state.users || []).map(user => {
        const assigned = users.some(u => u.id === user.id);
        return '<label class="settingsTick permissionUserTick"><input type="checkbox" name="user__' + h(user.id) + '" ' + (assigned ? 'checked' : '') + '><span><strong>' + h(user.nickname || user.name) + '</strong><em>' + h(user.name || '') + '</em></span></label>';
      }).join('') + '</div></details>';
  }
  function permissionButton(group) {
    const p = state.permissionMatrix[group] || {};
    const users = groupUsers(group);
    return '<article class="permissionGroupCard" data-permission-card="' + h(group) + '"><button type="button" class="fdocBar permissionGroupButton" data-toggle-permission-group="' + h(group) + '"><span class="fdocIcon">✓</span><span class="fdocName"><strong>' + h(group) + '</strong><em>' + users.length + ' users · ' + PERMISSION_KEYS.filter(k => p[k]).length + ' permissions enabled</em></span><span class="fdocArrow">⌄</span></button><div class="permissionGroupPanel closed"><form class="permissionGroupForm" data-permission-group-form="' + h(group) + '"><div class="permissionTickList"><h3>Permissions</h3>' + PERMISSION_KEYS.map(key => '<label class="settingsTick permissionTick"><input type="checkbox" name="perm__' + h(key) + '" ' + (p[key] ? 'checked' : '') + '><span>' + h(permLabel(key)) + '</span></label>').join('') + '</div>' + usersDetails(users) + '<div class="permissionActions"><button type="button" class="secondary" data-open-users-tab="true">Open Users tab</button><button class="primary">Save permissions</button></div></form></div></article>';
  }
  function createPermissionGroup() {
    return '<article class="permissionGroupCard createPermissionCard"><button type="button" class="fdocBar permissionGroupButton" data-toggle-create-permission="true"><span class="fdocIcon">+</span><span class="fdocName"><strong>Create permissions group</strong><em>Create a new permission title and starting users</em></span><span class="fdocArrow">⌄</span></button><div class="permissionGroupPanel closed"><form id="createPermissionGroupForm" class="permissionGroupForm"><label class="settingsField"><span>Group title</span><input name="title" placeholder="e.g. Duty Manager" required></label><div class="permissionTickList"><h3>Permissions</h3>' + PERMISSION_KEYS.map(key => '<label class="settingsTick permissionTick"><input type="checkbox" name="perm__' + h(key) + '"><span>' + h(permLabel(key)) + '</span></label>').join('') + '</div><button class="primary">Create permissions group</button></form></div></article>';
  }
  function permissions() {
    const roles = Object.keys(state.permissionMatrix || {}).sort((a,b) => ({Admin:1,Supervisor:2,Staff:3}[a] || 99) - (({Admin:1,Supervisor:2,Staff:3}[b] || 99)) || a.localeCompare(b));
    return '<section class="settingsBlock permissionSettingsBlock"><h2>Permissions</h2><p class="muted">Each group opens like a document button. Users can only belong to one permissions group at a time.</p><div class="permissionGroupList">' + roles.map(permissionButton).join('') + createPermissionGroup() + '</div></section>';
  }

  function docReqCount(groupId) {
    return getRequirements().filter(req => (req.staffGroups || []).some(g => normalise(g) === normalise(groupId))).length;
  }
  function docGroupButton(group) {
    const open = !!openDocGroups[group.id];
    const reqs = getRequirements();
    return '<article class="permissionGroupCard staffDocGroupCard ' + (open ? 'open' : '') + '"><button type="button" class="fdocBar permissionGroupButton" data-toggle-staff-doc-group="' + h(group.id) + '"><span class="fdocIcon">□</span><span class="fdocName"><strong>' + h(group.label) + '</strong><em>' + docReqCount(group.id) + ' required documents</em></span><span class="fdocArrow">⌄</span></button><div class="permissionGroupPanel ' + (open ? '' : 'closed') + '"><form class="staffDocGroupForm" data-staff-doc-group-form="' + h(group.id) + '"><div class="permissionTickList staffDocRequirementTickList"><h3>Required documents</h3>' + reqs.map(req => '<label class="settingsTick permissionTick staffDocRequirementTick"><input type="checkbox" name="req__' + h(req.id) + '" ' + ((req.staffGroups || []).some(g => normalise(g) === normalise(group.id)) ? 'checked' : '') + '><span>' + h(req.title) + '</span></label>').join('') + '</div><button class="primary">Save required documents</button></form></div></article>';
  }
  function createDocGroup() {
    return '<article class="permissionGroupCard createStaffDocGroupCard ' + (openCreateDocGroup ? 'open' : '') + '"><button type="button" class="fdocBar permissionGroupButton" data-toggle-create-staff-doc-group="true"><span class="fdocIcon">+</span><span class="fdocName"><strong>Create staff document group</strong><em>Add another job area or staff grouping</em></span><span class="fdocArrow">⌄</span></button><div class="permissionGroupPanel ' + (openCreateDocGroup ? '' : 'closed') + '"><form id="createStaffDocGroupForm" class="permissionGroupForm"><label class="settingsField"><span>Group title</span><input name="title" placeholder="e.g. Cellar Team" required></label><button class="primary">Create group</button></form></div></article>';
  }
  function requiredDocs() {
    return '<section class="settingsBlock staffDocSettingsBlock"><h2>Required staff documents</h2><p class="muted">Set the documents required for each job area. These feed the staff profile Training tab and Staff Documents in Docs.</p><div class="permissionGroupList staffDocGroupList">' + getDocGroups().map(docGroupButton).join('') + createDocGroup() + '</div></section>';
  }
  function compactPills(items, attrName) {
    return '<div class="settingsPillList">' + items.map(item => '<span class="settingsPill"><span>' + h(item) + '</span>' + (attrName ? '<button type="button" data-' + attrName + '="' + h(item) + '">×</button>' : '') + '</span>').join('') + '</div>';
  }
  function areas() {
    return '<section class="settingsBlock compactSettingsBlock"><h2>Areas / sections</h2><p class="muted">Used by checks, user profiles and rota sections.</p>' + compactPills(state.areas || [], 'delete-area') + '<form id="areaForm" class="settingsCompactForm"><input name="area" placeholder="New area / section" required><button class="primary">Add</button></form></section>';
  }
  function rotaSetup() {
    const sections = (state.rotaSettings && state.rotaSettings.sections) || [];
    return '<section class="settingsBlock compactSettingsBlock"><h2>Rota setup</h2><p class="muted">Sections available when building rota shifts.</p>' + compactPills(sections, '') + '<form id="rotaSectionForm" class="settingsCompactForm"><input name="section" placeholder="New rota section" required><button class="primary">Add</button></form></section>';
  }
  function pubDetails() {
    return '<section class="settingsBlock"><h2>Pub details</h2><form id="pubForm" class="stack settingsForm"><input name="name" value="' + h(state.pub && state.pub.name) + '" placeholder="Pub name"><input name="licence" value="' + h(state.pub && state.pub.licence) + '" placeholder="Premises licence"><input name="dps" value="' + h(state.pub && state.pub.dps) + '" placeholder="DPS"><textarea name="address" placeholder="Address">' + h(state.pub && state.pub.address) + '</textarea><button class="primary">Save pub details</button></form></section>';
  }
  function checkSetup() {
    return '<section class="settingsBlock"><h2>Checklist setup</h2><div class="settingsActionList">' + (state.checks || []).map(c => '<article class="settingsActionRow"><div class="settingsActionMain"><strong>' + h(c.title) + '</strong><em>' + h((c.area || '') + ' · ' + (c.freq || '') + ' · Due ' + (c.due || '')) + '</em><span>' + h((c.items || []).length + ' checklist items') + '</span></div><div class="settingsActionButtons"><button class="secondary settingsSmallButton" data-edit-check="' + h(c.id) + '">Edit</button><button class="primary settingsSmallButton" data-complete="' + h(c.id) + '">Test</button></div></article>').join('') + '</div><details class="settingsExpander"><summary><span>Add new checklist</span><small>Create a recurring check</small></summary><form id="checkForm" class="stack settingsExpanderBody"><input name="title" placeholder="Check title" required><select name="area">' + (state.areas || []).map(a => '<option>' + h(a) + '</option>').join('') + '</select><select name="freq"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option></select><input name="due" type="time" value="12:00" required><textarea name="items" placeholder="One checklist item per line" required></textarea><label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label><button class="primary">Add checklist</button></form></details></section>';
  }

  window.settings = function cleanedSettings() {
    ensureSettingsStateLocal();
    if (!canUseSettings()) return '<section class="card"><h2>Settings unavailable</h2><p>Only admin/supervisor users can change settings.</p></section>';
    return '<section class="hero card settingsHero"><div><p class="eyebrow">Admin only</p><h2>Settings</h2><p>Setup for this pub only. Document uploads stay in the Docs tab and staff profiles.</p></div></section><section class="settingsHub cleanedSettingsHub">' + pubDetails() + permissions() + requiredDocs() + checkSetup() + areas() + rotaSetup() + '</section>';
  };

  function toggleCard(button, openStateObj, key) {
    const card = button.closest('.permissionGroupCard');
    const panel = card && card.querySelector('.permissionGroupPanel');
    const isOpen = !(card && card.classList.contains('open'));
    openStateObj[key] = isOpen;
    if (card) card.classList.toggle('open', isOpen);
    if (panel) panel.classList.toggle('closed', !isOpen);
  }
  function bindStaffDocSettings() {
    document.querySelectorAll('[data-toggle-staff-doc-group]').forEach(button => button.onclick = event => { event.preventDefault(); toggleCard(button, openDocGroups, button.dataset.toggleStaffDocGroup); });
    document.querySelectorAll('[data-toggle-create-staff-doc-group]').forEach(button => button.onclick = event => { event.preventDefault(); openCreateDocGroup = !openCreateDocGroup; render(); });
    document.querySelectorAll('[data-staff-doc-group-form]').forEach(form => form.onsubmit = event => {
      event.preventDefault();
      const groupId = form.dataset.staffDocGroupForm;
      const reqs = getRequirements();
      reqs.forEach(req => {
        req.staffGroups = Array.isArray(req.staffGroups) ? req.staffGroups.filter(g => normalise(g) !== normalise(groupId)) : [];
        if (fieldChecked(form, 'req__' + req.id)) req.staffGroups.push(groupId);
      });
      saveRequirements(reqs);
      render();
    });
    const create = document.getElementById('createStaffDocGroupForm');
    if (create) create.onsubmit = event => {
      event.preventDefault();
      const title = makeId(create.elements.title.value);
      const groups = getDocGroups();
      if (!groups.some(group => normalise(group.id) === normalise(title))) groups.push({ id:title, label:title });
      writeJSON(GROUP_KEY, groups);
      if (!state.areas.some(area => normalise(area) === normalise(title))) state.areas.push(title);
      openCreateDocGroup = false;
      openDocGroups[title] = true;
      saveSafe();
      render();
    };
    document.querySelectorAll('[data-toggle-permission-group]').forEach(button => button.onclick = event => { event.preventDefault(); const group = button.dataset.togglePermissionGroup; const obj = {}; obj[group] = false; toggleCard(button, obj, group); });
    document.querySelectorAll('[data-toggle-create-permission]').forEach(button => button.onclick = event => { event.preventDefault(); const card = button.closest('.permissionGroupCard'); const panel = card && card.querySelector('.permissionGroupPanel'); const isOpen = !(card && card.classList.contains('open')); if (card) card.classList.toggle('open', isOpen); if (panel) panel.classList.toggle('closed', !isOpen); });
    document.querySelectorAll('[data-permission-group-form]').forEach(form => form.onsubmit = event => {
      event.preventDefault();
      const group = form.dataset.permissionGroupForm;
      state.permissionMatrix[group] = state.permissionMatrix[group] || {};
      PERMISSION_KEYS.forEach(key => { state.permissionMatrix[group][key] = fieldChecked(form, 'perm__' + key); });
      (state.users || []).forEach(user => {
        if (isNamedAdminUserLocal(user)) { user.permissionSetId = 'Admin'; user.role = 'Admin'; return; }
        if (fieldChecked(form, 'user__' + user.id)) { user.permissionSetId = group; user.role = group; }
        else if ((user.permissionSetId || user.role) === group) { user.permissionSetId = 'Staff'; user.role = 'Staff'; }
      });
      saveSafe();
      render();
    });
  }

  const style = document.createElement('style');
  style.textContent = '.cleanedSettingsHub .settingsBlock{margin-bottom:14px!important}.staffDocGroupList .permissionGroupCard,.cleanedSettingsHub .permissionGroupCard{padding:0!important}.staffDocRequirementTickList{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}.compactSettingsBlock{padding:12px!important}.settingsPillList{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin:8px 0!important}.settingsPill{display:inline-flex!important;align-items:center!important;gap:6px!important;min-height:30px!important;padding:4px 8px!important;border-radius:999px!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.09)!important;color:#fff8ea!important;font-size:12px!important;font-weight:800!important}.settingsPill button{width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;padding:0!important;border-radius:999px!important;font-size:12px!important;line-height:1!important}.settingsCompactForm{display:grid!important;grid-template-columns:minmax(0,1fr) 70px!important;gap:8px!important;margin-top:8px!important}.settingsCompactForm input,.settingsCompactForm button{min-height:38px!important;height:38px!important;border-radius:12px!important}.cleanedSettingsHub .settingsActionRow{padding:10px 12px!important;border-radius:16px!important}.cleanedSettingsHub .settingsExpander summary{min-height:42px!important;padding:10px 12px!important}.cleanedSettingsHub .settingsExpanderBody{padding-top:10px!important}';
  document.head.appendChild(style);

  if (typeof bind === 'function' && !bind.__staffDocGroupSettingsPatchV1) {
    const previousBind = bind;
    bind = function bindWithStaffDocGroupSettings() {
      previousBind();
      bindStaffDocSettings();
    };
    bind.__staffDocGroupSettingsPatchV1 = true;
  }
})();