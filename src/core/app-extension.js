// Compliance Bible UX restructuring: admin settings, shared users, training documents, and rota integration placeholder.
let settingsTab = 'checks';

function isAdminUser() {
  return me().role === 'Admin' || me().role === 'Supervisor';
}

function ensureExtendedState() {
  state.trainingDocs = state.trainingDocs || [];
  state.rotaSettings = state.rotaSettings || {
    source: 'Pending integration with existing Rota App',
    sections: ['Kitchen', 'FOH', 'Office', 'WFH', 'Housekeeping', 'KP']
  };
  state.documentCategories = state.documentCategories || ['Licensing', 'Food Safety', 'Fire Safety', 'Health & Safety', 'Staff', 'Equipment'];
}

function extendedNav(id, label) {
  return `<button class="navBtn ${route === id ? 'active' : ''}" data-route="${id}">${label}</button>`;
}

shell = function extendedShell(content) {
  ensureExtendedState();
  const overdueCount = state.checks.filter(overdue).length;
  const missingDocs = state.docs.filter(d => d.status !== 'Stored').length;
  const openIssues = state.issues.filter(i => i.status !== 'Resolved').length;
  const adminNav = isAdminUser() ? `${extendedNav('settings', 'Settings')}` : '';
  return `
    <section class="profileSwitch">
      <div><strong>${esc(state.pub.name)}</strong><span>${esc(me().nickname)} · ${esc(me().role)}</span></div>
      <select id="userSwitch">${state.users.map(u => `<option value="${u.id}" ${u.id === state.currentUser ? 'selected' : ''}>${esc(u.nickname)} (${esc(u.role)})</option>`).join('')}</select>
    </section>
    <nav class="mainNav">
      ${extendedNav('dashboard', 'Dashboard')}
      ${extendedNav('checks', 'Checks')}
      ${extendedNav('documents', 'Documents')}
      ${extendedNav('logs', 'Logs')}
      ${extendedNav('staff', 'Users')}
      ${extendedNav('rota', 'Rota')}
      ${extendedNav('inspection', 'Inspection')}
      ${adminNav}
    </nav>
    <section class="statusStrip">
      <div>${badge(overdueCount, overdueCount ? 'danger' : 'ok')}<span>Overdue checks</span></div>
      <div>${badge(missingDocs, missingDocs ? 'warn' : 'ok')}<span>Missing docs</span></div>
      <div>${badge(openIssues, openIssues ? 'warn' : 'ok')}<span>Open issues</span></div>
    </section>
    ${content}`;
};

render = function extendedRender() {
  ensureExtendedState();
  const pages = { dashboard, checks, documents, logs, staff, rota, inspection, settings };
  if (route === 'settings' && !isAdminUser()) route = 'dashboard';
  appRoot.innerHTML = shell((pages[route] || dashboard)());
  bind();
};

checkCard = function staffCheckCard(c) {
  const d = done(c.id), od = overdue(c);
  return `<article class="card checkCard ${d ? 'done' : od ? 'overdue' : ''}">
    <div class="cardTop"><h3>${esc(c.title)}</h3>${d ? badge('Done', 'ok') : od ? badge('Overdue', 'danger') : badge('Due ' + c.due, 'warn')}</div>
    <p>${esc(c.area)} · ${esc(c.freq)}${c.sign ? ' · Manager sign-off' : ''}</p>
    <button class="primary" data-complete="${c.id}">${d ? 'View / redo check' : 'Complete check'}</button>
  </article>`;
};

checks = function staffChecks() {
  return `<section class="card">
    <h2>Checks to complete</h2>
    <p class="muted">This page is for staff completing checks. Checklist setup now lives in Settings.</p>
    <div class="grid cards">${state.checks.map(checkCard).join('')}</div>
  </section>
  <section class="card"><h2>Completion history</h2>${history()}</section>`;
};

staff = function userProfilesPage() {
  return `<section class="card">
    <h2>User profiles</h2>
    <p class="muted">This is the shared master user area for Compliance Bible and the future Rota tab.</p>
    <div class="grid cards">${state.users.map(userProfileCard).join('')}</div>
  </section>`;
};

function userProfileCard(u) {
  const records = state.training.filter(t => t.userId === u.id);
  const docs = (state.trainingDocs || []).filter(d => d.userId === u.id);
  return `<article class="card">
    <div class="cardTop"><h3>${esc(u.nickname)}</h3>${badge(u.role, u.role === 'Admin' ? 'ok' : '')}</div>
    <p><strong>${esc(u.name)}</strong><br>${esc(u.area)} · ${esc(u.email || 'No email')}</p>
    <h3>Training</h3>
    ${records.length ? `<ul class="plainList">${records.map(t => `<li><span>${esc(t.course)} · ${esc(t.status)}</span><small>${esc(t.expiry ? 'Expires ' + t.expiry : 'No expiry')}</small></li>`).join('')}</ul>` : '<p class="muted">No training records.</p>'}
    <h3>Training documents</h3>
    ${docs.length ? `<ul class="plainList">${docs.map(d => `<li><span>${esc(d.title)}</span><small>${esc(d.note || 'No note')}</small></li>`).join('')}</ul>` : '<p class="muted">No uploaded training document records yet.</p>'}
    ${isAdminUser() ? `<button class="ghost" data-edit-user="${u.id}">Edit profile / add training document</button>` : ''}
  </article>`;
}

function rota() {
  return `<section class="hero card">
    <div><p class="eyebrow">Coming integration</p><h2>Rota</h2><p>This tab is reserved for the existing Rota App functionality. User profiles will be shared with the main Compliance Bible app.</p></div>
    ${badge('Not connected yet', 'warn')}
  </section>
  <section class="card">
    <h2>Planned Rota integration</h2>
    <ul class="plainList">
      <li>Use the same master user profiles as Compliance Bible.</li>
      <li>Keep rota sections such as Kitchen, FOH, Office, WFH, Housekeeping and KP.</li>
      <li>Bring across shift creation, editing, viewing, clock in/out, breaks and notes.</li>
      <li>Store training documents on each user profile, not separately inside rota.</li>
    </ul>
    <p class="muted">I checked ChipButt/Test, but it currently contains the Planuf Budget Builder rather than the Rota App code. Once the correct Rota App source is available, this tab can be wired to the exact current rota functionality.</p>
  </section>`;
}

function settings() {
  if (!isAdminUser()) return `<section class="card"><h2>Settings unavailable</h2><p>Only admin/supervisor users can change settings.</p></section>`;
  return `<section class="hero card"><div><p class="eyebrow">Admin only</p><h2>Settings</h2><p>Configuration lives here. Normal staff screens are kept clean for completing checks and logs.</p></div>${badge('Admin area', 'ok')}</section>
  <section class="card">
    <nav class="mainNav">
      ${settingsTabButton('checks', 'Checklists')}
      ${settingsTabButton('users', 'Users')}
      ${settingsTabButton('documents', 'Documents')}
      ${settingsTabButton('areas', 'Areas')}
      ${settingsTabButton('rota', 'Rota setup')}
      ${settingsTabButton('pub', 'Pub details')}
    </nav>
    ${settingsContent()}
  </section>`;
}

function settingsTabButton(id, label) {
  return `<button class="navBtn ${settingsTab === id ? 'active' : ''}" data-settings-tab="${id}">${label}</button>`;
}

function settingsContent() {
  if (settingsTab === 'checks') return settingsChecks();
  if (settingsTab === 'users') return settingsUsers();
  if (settingsTab === 'documents') return settingsDocuments();
  if (settingsTab === 'areas') return settingsAreas();
  if (settingsTab === 'rota') return settingsRota();
  if (settingsTab === 'pub') return settingsPub();
  return settingsChecks();
}

function settingsChecks() {
  return `<h2>Checklist setup</h2>
  <p class="muted">Edit the built-in checks here. Staff will only see the clean completion version.</p>
  <div class="docList">${state.checks.map(c => `<div class="docItem"><div><strong>${esc(c.title)}</strong><span>${esc(c.area)} · ${esc(c.freq)} · Due ${esc(c.due)}</span><p>${esc((c.items || []).length)} checklist items</p></div><div><button class="ghost small" data-edit-check="${c.id}">Edit</button><button class="primary small" data-complete="${c.id}">Test</button></div></div>`).join('')}</div>
  <h3>Add new checklist</h3>
  <form id="checkForm" class="stack">
    <input name="title" placeholder="Check title" required>
    <select name="area">${state.areas.map(a => `<option>${esc(a)}</option>`).join('')}</select>
    <select name="freq"><option>Daily</option><option>Weekly</option><option>Monthly</option></select>
    <input name="due" type="time" value="12:00" required>
    <textarea name="items" placeholder="One checklist item per line" required></textarea>
    <label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label>
    <button class="primary">Add checklist</button>
  </form>`;
}

function settingsUsers() {
  const courses = ['Food Hygiene', 'Allergen Awareness', 'Fire Safety', 'Challenge 25', 'Manual Handling'];
  return `<h2>User profile setup</h2>
  <p class="muted">This will become the shared user system for Compliance Bible and Rota.</p>
  <div class="grid cards">${state.users.map(userProfileCard).join('')}</div>
  <h3>Add user</h3>
  <form id="staffForm" class="stack"><input name="name" placeholder="Full name" required><input name="nickname" placeholder="Nickname shown on rota/checks" required><input name="email" type="email" placeholder="Email"><select name="role"><option>Staff</option><option>Supervisor</option><option>Admin</option></select><select name="area">${state.areas.map(a => `<option>${esc(a)}</option>`).join('')}</select><button class="primary">Add user</button></form>
  <h3>Add training record</h3>
  <form id="trainingForm" class="inlineForm"><select name="userId">${state.users.map(u => `<option value="${u.id}">${esc(u.nickname)}</option>`).join('')}</select><select name="course">${courses.map(c => `<option>${esc(c)}</option>`).join('')}</select><select name="status"><option>Valid</option><option>Due Soon</option><option>Missing</option></select><input name="expiry" type="date"><input name="evidence" placeholder="Evidence/notes"><button class="primary">Save</button></form>`;
}

function settingsDocuments() {
  return `<h2>Document setup</h2><p class="muted">Manage document records and categories here.</p>${documents()}`;
}

function settingsAreas() {
  return `<h2>Areas / sections</h2><p class="muted">These areas are used for checks, user profiles and rota sections.</p>
  <ul class="plainList">${state.areas.map(a => `<li><span>${esc(a)}</span><button class="ghost small" data-delete-area="${esc(a)}">Remove</button></li>`).join('')}</ul>
  <form id="areaForm" class="inlineForm"><input name="area" placeholder="New area / section" required><button class="primary">Add area</button></form>`;
}

function settingsRota() {
  return `<h2>Rota setup</h2><p class="muted">The full rota will live in the Rota tab. This section holds shared setup only.</p>
  <h3>Rota sections</h3><ul class="plainList">${state.rotaSettings.sections.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  <form id="rotaSectionForm" class="inlineForm"><input name="section" placeholder="New rota section" required><button class="primary">Add rota section</button></form>`;
}

function settingsPub() {
  return `<h2>Pub details</h2><form id="pubForm" class="stack"><input name="name" value="${esc(state.pub.name)}" placeholder="Pub name"><input name="licence" value="${esc(state.pub.licence)}" placeholder="Premises licence"><input name="dps" value="${esc(state.pub.dps)}" placeholder="DPS"><textarea name="address" placeholder="Address">${esc(state.pub.address)}</textarea><button class="primary">Save pub details</button></form>`;
}

function openUserEditor(id) {
  const u = state.users.find(x => x.id === id);
  if (!u) return;
  modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>Edit user profile</h2>
    <form id="editUserForm" class="stack"><input name="name" value="${esc(u.name)}" required><input name="nickname" value="${esc(u.nickname)}" required><input name="email" value="${esc(u.email || '')}"><select name="role">${['Staff', 'Supervisor', 'Admin'].map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select><select name="area">${state.areas.map(a => `<option ${u.area === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select><button class="primary">Save user profile</button></form>
    <h3>Add training document record</h3><form id="trainingDocForm" class="stack"><input name="title" placeholder="Document title e.g. Food Hygiene Certificate" required><textarea name="note" placeholder="Upload/link note for now. Real file upload comes with backend storage."></textarea><button class="primary">Add training document record</button></form>
  </div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  document.getElementById('editUserForm').onsubmit = e => { const d = fd(e); Object.assign(u, d); save(); modalRoot.classList.add('hidden'); render(); };
  document.getElementById('trainingDocForm').onsubmit = e => { const d = fd(e); state.trainingDocs.push({ id: uid(), userId: id, title: d.title, note: d.note, created: new Date().toISOString() }); save(); modalRoot.classList.add('hidden'); render(); };
}

const previousBindForAppExtension = bind;
bind = function extendedBind() {
  previousBindForAppExtension();
  document.querySelectorAll('[data-settings-tab]').forEach(b => b.onclick = () => { settingsTab = b.dataset.settingsTab; render(); });
  document.querySelectorAll('[data-edit-user]').forEach(b => b.onclick = () => openUserEditor(b.dataset.editUser));
  on('areaForm', e => { const d = fd(e); if (d.area && !state.areas.includes(d.area)) state.areas.push(d.area); save(); render(); });
  document.querySelectorAll('[data-delete-area]').forEach(b => b.onclick = () => { state.areas = state.areas.filter(a => a !== b.dataset.deleteArea); save(); render(); });
  on('rotaSectionForm', e => { const d = fd(e); state.rotaSettings.sections.push(d.section); save(); render(); });
  on('pubForm', e => { const d = fd(e); state.pub = { ...state.pub, ...d }; save(); render(); });
};

ensureExtendedState();
render();
