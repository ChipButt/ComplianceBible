const KEY = 'complianceBible.v1';
const appRoot = document.getElementById('app');
const modalRoot = document.getElementById('modal');
const installButton = document.getElementById('installBtn');

const uid = () => {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
};
const today = () => new Date().toISOString().slice(0, 10);
const clone = (value) => JSON.parse(JSON.stringify(value));

const defaults = {
  pub: { name: 'The Compliance Arms', licence: 'PREM-0001', dps: 'Manager Name', address: '1 High Street, Your Town' },
  currentUser: 'u1',
  users: [
    { id: 'u1', name: 'Admin Manager', nickname: 'Admin', role: 'Admin', area: 'Office', email: 'admin@example.com' },
    { id: 'u2', name: 'Bar Supervisor', nickname: 'Bar Sup', role: 'Supervisor', area: 'Bar', email: 'bar@example.com' },
    { id: 'u3', name: 'Kitchen Team', nickname: 'Kitchen', role: 'Staff', area: 'Kitchen', email: 'kitchen@example.com' }
  ],
  areas: ['Bar', 'Kitchen', 'Cellar', 'Toilets', 'Beer Garden', 'Office', 'FOH'],
  docs: [
    ['Licensing', 'Premises licence'],
    ['Licensing', 'Premises licence summary'],
    ['Food Safety', 'HACCP / SFBB pack'],
    ['Fire Safety', 'Fire risk assessment'],
    ['Health & Safety', 'General risk assessment'],
    ['Equipment', 'Gas safety certificate']
  ].map(([cat, title]) => ({ id: uid(), cat, title, status: 'Missing', expiry: '', notes: 'Add record, expiry date and storage location.' })),
  checks: [
    { id: 'open', title: 'Opening Checks', area: 'Whole Pub', freq: 'Daily', due: '10:00', sign: true, items: ['Fire exits clear', 'Toilets clean and stocked', 'Bar ready', 'First aid kit present', 'No obvious hazards', 'Fridges checked'] },
    { id: 'fridge', title: 'Fridge & Freezer Temperatures', area: 'Kitchen', freq: 'Daily', due: '11:00', items: ['Kitchen Fridge 1 recorded', 'Kitchen Fridge 2 recorded', 'Freezer recorded', 'Corrective action logged if outside range'] },
    { id: 'clean', title: 'Cleaning Schedule', area: 'Whole Pub', freq: 'Daily', due: '16:00', items: ['Bar surfaces sanitised', 'Tables wiped', 'Toilets checked', 'Kitchen clean down complete', 'Bins checked'] },
    { id: 'close', title: 'Closing Checks', area: 'Whole Pub', freq: 'Daily', due: '23:59', sign: true, items: ['Appliances off where required', 'Fridges/freezers shut', 'Waste removed', 'Doors/windows secure', 'Incidents logged', 'Alarm set'] },
    { id: 'fire', title: 'Weekly Fire Alarm Test', area: 'Whole Pub', freq: 'Weekly', due: '12:00', sign: true, items: ['Call point tested', 'Alarm sounded', 'Panel reset', 'Faults reported'] },
    { id: 'cellar', title: 'Cellar Safety Check', area: 'Cellar', freq: 'Weekly', due: '15:00', items: ['Access clear', 'CO2 safety signage visible', 'Gas cylinders secure', 'Temperature acceptable', 'Leaks or hazards checked'] }
  ],
  done: [],
  temps: [],
  logs: [],
  training: [
    { id: uid(), userId: 'u1', course: 'Challenge 25', status: 'Valid', expiry: '2026-12-31', evidence: 'Signed policy acknowledgement' },
    { id: uid(), userId: 'u2', course: 'Food Hygiene', status: 'Due Soon', expiry: '2026-07-31', evidence: 'Certificate needed' },
    { id: uid(), userId: 'u3', course: 'Allergen Awareness', status: 'Missing', expiry: '', evidence: 'Training not yet recorded' }
  ],
  issues: [
    { id: uid(), title: 'Example: replace missing wet-floor sign', area: 'Bar', severity: 'Medium', status: 'Open', notes: 'Demo issue - edit or resolve.', created: new Date().toISOString() }
  ],
  trainingDocs: [],
  userRequiredDocuments: [],
  rotaSettings: {
    source: 'Pending integration with existing Rota App',
    sections: ['Kitchen', 'FOH', 'Office', 'WFH', 'Housekeeping', 'KP']
  },
  documentCategories: ['Licensing', 'Food Safety', 'Fire Safety', 'Health & Safety', 'Staff', 'Equipment'],
  permissionMatrix: {
    Admin: { checks: true, documents: true, logs: true, users: true, rota: true, inspection: true, settings: true },
    Supervisor: { checks: true, documents: true, logs: true, users: true, rota: true, inspection: true, settings: true },
    Staff: { checks: true, documents: false, logs: true, users: false, rota: true, inspection: false, settings: false }
  }
};

let state = load();
let route = 'dashboard';
let settingsTab = 'checks';
let lastPermittedRoute = 'dashboard';
let deferredInstallPrompt = null;
const PERMISSION_KEYS = ['checks', 'documents', 'logs', 'users', 'rota', 'inspection', 'settings'];

try {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
} catch (_) {}

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...clone(defaults), ...stored };
  } catch (error) {
    console.warn('Storage reset after load error', error);
    return clone(defaults);
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function user(id) { return state.users.find(u => u.id === id) || state.users[0]; }
function me() { return user(state.currentUser); }
function done(checkId) { return state.done.find(c => c.checkId === checkId && c.date === today()); }
function dueDT(check) { const [h, m] = check.due.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; }
function overdue(check) { return !done(check.id) && new Date() > dueDT(check); }
function badge(text, kind = '') { return `<span class="badge ${kind}">${esc(text)}</span>`; }
function nav(id, label) { return `<button class="navBtn ${route === id ? 'active' : ''}" data-route="${id}">${label}</button>`; }
function optionList(values, selected) { return values.map(v => `<option ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join(''); }

function isNamedAdminUser(userRecord) {
  const text = String(`${userRecord?.name || ''} ${userRecord?.nickname || ''} ${userRecord?.email || ''}`).toLowerCase();
  return text.includes('chip') || text.includes('vicky') || text.includes('rihanna');
}

function ensureCoreState() {
  state.users = state.users || [];
  state.areas = state.areas || [];
  state.docs = state.docs || [];
  state.checks = state.checks || [];
  state.done = state.done || [];
  state.temps = state.temps || [];
  state.logs = state.logs || [];
  state.training = state.training || [];
  state.trainingDocs = state.trainingDocs || [];
  state.userRequiredDocuments = state.userRequiredDocuments || [];
  state.documentCategories = state.documentCategories || clone(defaults.documentCategories);
  state.rotaSettings = state.rotaSettings || clone(defaults.rotaSettings);
  state.rotaSettings.sections = Array.from(new Set([...(state.rotaSettings.sections || []), ...defaults.rotaSettings.sections]));
  state.permissionMatrix = state.permissionMatrix || {};
  Object.entries(defaults.permissionMatrix).forEach(([group, permissions]) => {
    state.permissionMatrix[group] = state.permissionMatrix[group] || {};
    PERMISSION_KEYS.forEach(key => {
      if (typeof state.permissionMatrix[group][key] !== 'boolean') state.permissionMatrix[group][key] = !!permissions[key];
    });
  });
  state.users.forEach(userRecord => {
    if (isNamedAdminUser(userRecord)) {
      userRecord.role = 'Admin';
      userRecord.permissionSetId = 'Admin';
    }
    if (!userRecord.permissionSetId) userRecord.permissionSetId = userRecord.role || 'Staff';
  });
}

function ensureExtendedState() {
  ensureCoreState();
}

function isAdminUser() {
  const current = me();
  if (!current) return false;
  if (isNamedAdminUser(current)) return true;
  const role = String(current.role || '').toLowerCase();
  if (role.includes('admin') || role.includes('supervisor') || role.includes('manager')) return true;
  const setName = current.permissionSetId || current.role || 'Staff';
  const permissions = state.permissionMatrix?.[setName];
  if (permissions?.settings === true) return true;
  const setLower = String(setName || '').toLowerCase();
  return setLower.includes('admin') || setLower.includes('supervisor') || setLower.includes('manager');
}

function shell(content) {
  ensureCoreState();
  const overdueCount = state.checks.filter(overdue).length;
  const missingDocs = state.docs.filter(d => d.status !== 'Stored').length;
  const openIssues = state.issues.filter(i => i.status !== 'Resolved').length;
  const adminNav = isAdminUser() ? nav('settings', 'Settings') : '';
  return `
    <section class="profileSwitch">
      <div><strong>${esc(state.pub.name)}</strong><span>${esc(me().nickname)} · ${esc(me().role)}</span></div>
      <select id="userSwitch">${state.users.map(u => `<option value="${u.id}" ${u.id === state.currentUser ? 'selected' : ''}>${esc(u.nickname)} (${esc(u.role)})</option>`).join('')}</select>
    </section>
    <nav class="mainNav">${nav('dashboard', 'Dashboard')}${nav('checks', 'Checks')}${nav('documents', 'Documents')}${nav('logs', 'Logs')}${nav('staff', 'Users')}${nav('rota', 'Rota')}${nav('inspection', 'Inspection')}${adminNav}</nav>
    <section class="statusStrip">
      <div>${badge(overdueCount, overdueCount ? 'danger' : 'ok')}<span>Overdue checks</span></div>
      <div>${badge(missingDocs, missingDocs ? 'warn' : 'ok')}<span>Missing docs</span></div>
      <div>${badge(openIssues, openIssues ? 'warn' : 'ok')}<span>Open issues</span></div>
    </section>
    ${content}`;
}

function render() {
  ensureCoreState();
  const pages = { dashboard, checks, documents, logs, staff, rota, inspection, settings };
  if (route === 'settings' && !isAdminUser()) route = lastPermittedRoute || 'dashboard';
  if (!pages[route]) route = lastPermittedRoute || 'dashboard';
  if (route !== 'settings' || isAdminUser()) lastPermittedRoute = route;
  document.body.classList.toggle('is-rota-route', route === 'rota');
  appRoot.innerHTML = shell((pages[route] || dashboard)());
  bind();
  resetRouteScroll();
}

function resetRouteScroll() {
  if (route !== 'rota') return;
  const reset = () => {
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  };
  reset();
  requestAnimationFrame(reset);
  setTimeout(reset, 80);
}

function setNavIcons() {
  const icons = { dashboard: '⌂', checks: '✓', documents: '□', logs: '!', staff: '◉', rota: '▦', inspection: '◇', settings: '⚙' };
  document.querySelectorAll('.bottomNav .navBtn').forEach(btn => {
    btn.dataset.icon = icons[btn.dataset.route] || '•';
  });
}

function dashboard() {
  return `<section class="hero card"><div><p class="eyebrow">Today · ${today()}</p><h2>${state.checks.filter(c => done(c.id)).length}/${state.checks.length} checks complete</h2><p>Daily checks, evidence, overdue items and urgent compliance issues in one place.</p></div><button class="primary" data-route="inspection">Open Inspection Mode</button></section><section class="grid two"><article class="card"><h3>Urgent actions</h3>${actions()}</article><article class="card"><h3>Recent activity</h3>${activity()}</article></section><h2 class="sectionTitle">Today’s checks</h2><section class="grid cards">${state.checks.map(checkCard).join('')}</section>`;
}
function actions() {
  const items = [];
  state.checks.filter(overdue).forEach(c => items.push('Overdue: ' + c.title));
  state.docs.filter(d => d.status !== 'Stored').slice(0, 4).forEach(d => items.push('Document needed: ' + d.title));
  state.training.filter(t => t.status !== 'Valid').forEach(t => items.push('Training: ' + user(t.userId).nickname + ' · ' + t.course));
  return items.length ? `<ul class="plainList">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">No urgent actions.</p>';
}
function activity() {
  const items = [
    ...state.done.map(c => ({ text: `${c.title} completed by ${user(c.userId).nickname}`, at: c.at })),
    ...state.logs.map(l => ({ text: `${l.type}: ${l.summary}`, at: l.created })),
    ...state.issues.map(i => ({ text: `Issue: ${i.title}`, at: i.created }))
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
  return items.length ? `<ul class="plainList">${items.map(x => `<li><span>${esc(x.text)}</span><small>${new Date(x.at).toLocaleString()}</small></li>`).join('')}</ul>` : '<p class="muted">No activity yet.</p>';
}
function checkCard(c) {
  const d = done(c.id), od = overdue(c);
  const editButton = isAdminUser() ? `<button class="ghost small" data-edit-check="${c.id}">Edit</button>` : '';
  return `<article class="card checkCard ${d ? 'done' : od ? 'overdue' : ''}"><div class="cardTop"><h3>${esc(c.title)}</h3>${d ? badge('Done', 'ok') : od ? badge('Overdue', 'danger') : badge('Due ' + c.due, 'warn')}</div><p>${esc(c.area)} · ${esc(c.freq)}${c.sign ? ' · Manager sign-off' : ''}</p><div class="miniRow"><button class="primary" data-complete="${c.id}">${d ? 'View / redo check' : 'Complete check'}</button>${editButton}</div></article>`;
}
function checks() {
  return `<section class="card"><h2>Checks to complete</h2><p class="muted">Checklist setup lives in Settings. This screen stays focused on completion.</p><div class="grid cards">${state.checks.map(checkCard).join('')}</div></section><section class="card"><h2>Completion history</h2>${history()}</section>`;
}
function history() {
  return state.done.length ? `<div class="tableWrap"><table><thead><tr><th>Date</th><th>Check</th><th>User</th><th>Result</th><th>Notes</th></tr></thead><tbody>${[...state.done].reverse().map(c => `<tr><td>${esc(c.date)}</td><td>${esc(c.title)}</td><td>${esc(user(c.userId).nickname)}</td><td>${esc(c.result)}</td><td>${esc(c.notes)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No completed checks yet.</p>';
}
function documents() {
  return `<section class="grid two"><article class="card"><h2>Document Vault</h2><div class="docList">${state.docs.map(d => `<div class="docItem"><div><strong>${esc(d.title)}</strong><span>${esc(d.cat)} · ${d.expiry ? 'Expires ' + esc(d.expiry) : 'No expiry set'}</span><p>${esc(d.notes)}</p></div><div>${badge(d.status, d.status === 'Stored' ? 'ok' : 'warn')}<button class="ghost small" data-doc="${d.id}">${d.status === 'Stored' ? 'Mark missing' : 'Mark stored'}</button></div></div>`).join('')}</div></article><article class="card"><h2>Add document record</h2><form id="docForm" class="stack"><input name="title" placeholder="Document title" required><select name="cat"><option>Licensing</option><option>Food Safety</option><option>Fire Safety</option><option>Health & Safety</option><option>Staff</option><option>Equipment</option></select><input name="expiry" type="date"><textarea name="notes" placeholder="Notes, location, renewal info"></textarea><button class="primary">Add document</button></form><p class="muted">This first build stores document records. File uploads can be connected later.</p></article></section>`;
}
function logs() {
  return `<section class="grid two"><article class="card"><h2>Temperature log</h2><form id="tempForm" class="stack"><input name="unit" placeholder="Unit e.g. Kitchen Fridge 1" required><input name="reading" type="number" step="0.1" placeholder="Temperature °C" required><textarea name="action" placeholder="Corrective action if needed"></textarea><button class="primary">Save temperature</button></form>${temps()}</article><article class="card"><h2>Incident / Refusal / Maintenance log</h2><form id="logForm" class="stack"><select name="type"><option>Incident</option><option>Alcohol Refusal</option><option>Accident</option><option>Maintenance</option><option>Pest Sighting</option><option>Cleaning Exception</option></select><input name="summary" placeholder="Short summary" required><textarea name="details" placeholder="Details, witnesses, action taken"></textarea><button class="primary">Add log</button></form>${logList()}</article></section><section class="card"><h2>Report an issue</h2><form id="issueForm" class="issueForm"><input name="title" placeholder="Issue title" required><select name="area">${state.areas.map(a => `<option>${esc(a)}</option>`).join('')}</select><select name="severity"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea name="notes" placeholder="What needs fixing?"></textarea><button class="primary">Report issue</button></form><div class="issueList">${state.issues.map(i => `<div class="docItem"><div><strong>${esc(i.title)}</strong><span>${esc(i.area)} · ${esc(i.severity)} · ${new Date(i.created).toLocaleString()}</span><p>${esc(i.notes)}</p></div><div>${badge(i.status, i.status === 'Resolved' ? 'ok' : 'warn')}<button class="ghost small" data-issue="${i.id}">${i.status === 'Resolved' ? 'Reopen' : 'Resolve'}</button></div></div>`).join('')}</div></section>`;
}
function temps() {
  return state.temps.length ? `<ul class="plainList">${[...state.temps].reverse().slice(0, 8).map(t => `<li><span>${esc(t.unit)}: ${esc(t.reading)}°C ${t.status === 'Check' ? '⚠️' : '✓'}</span><small>${new Date(t.created).toLocaleString()}</small></li>`).join('')}</ul>` : '<p class="muted">No temperature readings yet.</p>';
}
function logList() {
  return state.logs.length ? `<ul class="plainList">${[...state.logs].reverse().slice(0, 8).map(l => `<li><span>${esc(l.type)}: ${esc(l.summary)}</span><small>${new Date(l.created).toLocaleString()}</small></li>`).join('')}</ul>` : '<p class="muted">No logs yet.</p>';
}
function staff() {
  const courses = ['Food Hygiene', 'Allergen Awareness', 'Fire Safety', 'Challenge 25', 'Manual Handling'];
  return `<section class="grid two"><article class="card"><h2>Staff</h2>${state.users.map(u => `<div class="staffCard"><strong>${esc(u.nickname)}</strong><span>${esc(u.name)} · ${esc(u.role)} · ${esc(u.area)}</span><small>${esc(u.email || '')}</small></div>`).join('')}</article><article class="card"><h2>Add staff member</h2><form id="staffForm" class="stack"><input name="name" placeholder="Full name" required><input name="nickname" placeholder="Nickname shown internally" required><input name="email" type="email" placeholder="Email"><select name="role"><option>Staff</option><option>Supervisor</option><option>Admin</option></select><select name="area">${state.areas.map(a => `<option>${esc(a)}</option>`).join('')}</select><button class="primary">Add staff</button></form></article></section><section class="card"><h2>Training matrix</h2><div class="tableWrap"><table><thead><tr><th>Staff</th>${courses.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${state.users.map(u => `<tr><td>${esc(u.nickname)}</td>${courses.map(course => { const t = state.training.find(x => x.userId === u.id && x.course === course); return `<td>${t ? badge(t.status, t.status === 'Valid' ? 'ok' : 'warn') : badge('Missing', 'danger')}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><h3>Add training record</h3><form id="trainingForm" class="inlineForm"><select name="userId">${state.users.map(u => `<option value="${u.id}">${esc(u.nickname)}</option>`).join('')}</select><select name="course">${courses.map(c => `<option>${esc(c)}</option>`).join('')}</select><select name="status"><option>Valid</option><option>Due Soon</option><option>Missing</option></select><input name="expiry" type="date"><input name="evidence" placeholder="Evidence/notes"><button class="primary">Save</button></form></section>`;
}
function inspection() {
  return `<section class="hero card"><div><p class="eyebrow">Read-only pack</p><h2>Inspection Mode</h2><p>Show the current compliance position without exposing private admin settings.</p></div><button class="primary" id="exportBtn">Export report</button></section><section class="grid two"><article class="card"><h3>Pub details</h3><p><strong>${esc(state.pub.name)}</strong><br>${esc(state.pub.address)}<br>Premises licence: ${esc(state.pub.licence)}<br>DPS: ${esc(state.pub.dps)}</p></article><article class="card"><h3>Today’s checks</h3><p>${state.done.filter(c => c.date === today()).length}/${state.checks.length} completed today.</p>${state.checks.map(c => `<div class="miniRow"><span>${esc(c.title)}</span>${done(c.id) ? badge('Done', 'ok') : overdue(c) ? badge('Overdue', 'danger') : badge('Pending', 'warn')}</div>`).join('')}</article><article class="card"><h3>Required documents</h3>${state.docs.map(d => `<div class="miniRow"><span>${esc(d.title)}</span>${badge(d.status, d.status === 'Stored' ? 'ok' : 'warn')}</div>`).join('')}</article><article class="card"><h3>Staff training</h3>${state.training.map(t => `<div class="miniRow"><span>${esc(user(t.userId).nickname)} · ${esc(t.course)}</span>${badge(t.status, t.status === 'Valid' ? 'ok' : 'warn')}</div>`).join('')}</article></section>`;
}

function rota() {
  requestAnimationFrame(() => window.scrollTo(0, 0));
  return `<section class="rotaEmbedCard rotaScheduleEmbed">
    <iframe id="rotaScheduleFrame" class="rotaFrame" title="Rota schedule" src="rota-app.html?v=20260617-10"></iframe>
  </section>`;
}

function settings() {
  if (!isAdminUser()) return `<section class="card"><h2>Settings unavailable</h2><p>Only admin/supervisor users can change settings.</p></section>`;
  return `<section class="hero card"><div><p class="eyebrow">Admin only</p><h2>Settings</h2><p>Configuration lives here. Normal staff screens are kept clean for completing checks and logs.</p></div>${badge('Admin area', 'ok')}</section>
  <section class="card">
    <nav class="mainNav settingsOnlyNav">
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
  <div class="docList">${state.checks.map(c => `<div class="docItem"><div><strong>${esc(c.title)}</strong><span>${esc(c.area)} · ${esc(c.freq)} · Due ${esc(c.due)}</span><p>${esc((c.items || []).length)} checklist items</p></div><div><button class="ghost small" data-edit-check="${c.id}">Edit</button><button class="primary small" data-complete="${c.id}">Test</button></div></div>`).join('')}</div>
  <h3>Add new checklist</h3>
  <form id="checkForm" class="stack">
    <input name="title" placeholder="Check title" required>
    <select name="area">${optionList(state.areas)}</select>
    <select name="freq">${optionList(['Daily', 'Weekly', 'Monthly', 'Yearly'])}</select>
    <input name="due" type="time" value="12:00" required>
    <textarea name="items" placeholder="One checklist item per line" required></textarea>
    <label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label>
    <button class="primary">Add checklist</button>
  </form>`;
}

function settingsUsers() {
  const courses = ['Food Hygiene', 'Allergen Awareness', 'Fire Safety', 'Challenge 25', 'Manual Handling'];
  return `<h2>User profile setup</h2>
  <div class="grid cards">${state.users.map(userProfileCard).join('')}</div>
  <h3>Add user</h3>
  <form id="staffForm" class="stack"><input name="name" placeholder="Full name" required><input name="nickname" placeholder="Nickname shown on rota/checks" required><input name="email" type="email" placeholder="Email"><select name="role">${optionList(['Staff', 'Supervisor', 'Admin'])}</select><select name="area">${optionList(state.areas)}</select><button class="primary">Add user</button></form>
  <h3>Add training record</h3>
  <form id="trainingForm" class="inlineForm"><select name="userId">${state.users.map(u => `<option value="${u.id}">${esc(u.nickname)}</option>`).join('')}</select><select name="course">${courses.map(c => `<option>${esc(c)}</option>`).join('')}</select><select name="status">${optionList(['Valid', 'Due Soon', 'Missing'])}</select><input name="expiry" type="date"><input name="evidence" placeholder="Evidence/notes"><button class="primary">Save</button></form>`;
}

function settingsDocuments() {
  return `<h2>Document setup</h2>${documents()}`;
}

function settingsAreas() {
  return `<h2>Areas / sections</h2>
  <ul class="plainList">${state.areas.map(a => `<li><span>${esc(a)}</span><button class="ghost small" data-delete-area="${esc(a)}">Remove</button></li>`).join('')}</ul>
  <form id="areaForm" class="inlineForm"><input name="area" placeholder="New area / section" required><button class="primary">Add area</button></form>`;
}

function settingsRota() {
  return `<h2>Rota setup</h2><ul class="plainList">${state.rotaSettings.sections.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  <form id="rotaSectionForm" class="inlineForm"><input name="section" placeholder="New rota section" required><button class="primary">Add rota section</button></form>`;
}

function settingsPub() {
  return `<h2>Pub details</h2><form id="pubForm" class="stack"><input name="name" value="${esc(state.pub.name)}" placeholder="Pub name"><input name="licence" value="${esc(state.pub.licence)}" placeholder="Premises licence"><input name="dps" value="${esc(state.pub.dps)}" placeholder="DPS"><textarea name="address" placeholder="Address">${esc(state.pub.address)}</textarea><button class="primary">Save pub details</button></form>`;
}

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

function bind() {
  setNavIcons();
  document.querySelectorAll('[data-route]').forEach(b => b.onclick = () => { route = b.dataset.route; render(); });
  document.querySelectorAll('.bottomNav [data-route]').forEach(b => b.classList.toggle('active', b.dataset.route === route));
  const userSwitch = document.getElementById('userSwitch');
  if (userSwitch) userSwitch.onchange = e => { state.currentUser = e.target.value; save(); render(); };
  document.querySelectorAll('[data-complete]').forEach(b => b.onclick = () => openCheck(b.dataset.complete));
  document.querySelectorAll('[data-edit-check]').forEach(b => b.onclick = () => openEditCheck(b.dataset.editCheck));
  document.querySelectorAll('[data-settings-tab]').forEach(b => b.onclick = () => { settingsTab = b.dataset.settingsTab; render(); });
  document.querySelectorAll('[data-edit-user]').forEach(b => b.onclick = () => openUserEditor(b.dataset.editUser));
  document.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => { const d = state.docs.find(x => x.id === b.dataset.doc); if (d) d.status = d.status === 'Stored' ? 'Missing' : 'Stored'; save(); render(); });
  document.querySelectorAll('[data-issue]').forEach(b => b.onclick = () => { const i = state.issues.find(x => x.id === b.dataset.issue); if (i) i.status = i.status === 'Resolved' ? 'Open' : 'Resolved'; save(); render(); });
  on('checkForm', e => { const d = fd(e); state.checks.push({ id: uid(), title: d.title, area: d.area, freq: d.freq, due: d.due, sign: e.target.sign.checked, items: d.items.split('\n').map(x => x.trim()).filter(Boolean) }); save(); render(); });
  on('docForm', e => { const d = fd(e); state.docs.push({ id: uid(), title: d.title, cat: d.cat, expiry: d.expiry, notes: d.notes, status: 'Missing' }); save(); render(); });
  on('tempForm', e => { const d = fd(e); const r = Number(d.reading); state.temps.push({ id: uid(), unit: d.unit, reading: r, action: d.action, status: r > 8 || r < -30 ? 'Check' : 'OK', userId: state.currentUser, created: new Date().toISOString() }); save(); render(); });
  on('logForm', e => { const d = fd(e); state.logs.push({ id: uid(), type: d.type, summary: d.summary, details: d.details, userId: state.currentUser, created: new Date().toISOString() }); save(); render(); });
  on('issueForm', e => { const d = fd(e); state.issues.push({ id: uid(), title: d.title, area: d.area, severity: d.severity, status: 'Open', notes: d.notes, created: new Date().toISOString() }); save(); render(); });
  on('staffForm', e => { const d = fd(e); state.users.push({ id: uid(), name: d.name, nickname: d.nickname, email: d.email, role: d.role, area: d.area }); save(); render(); });
  on('trainingForm', e => { const d = fd(e); const existing = state.training.find(t => t.userId === d.userId && t.course === d.course); existing ? Object.assign(existing, d) : state.training.push({ id: uid(), ...d }); save(); render(); });
  on('areaForm', e => { const d = fd(e); if (d.area && !state.areas.includes(d.area)) state.areas.push(d.area); save(); render(); });
  document.querySelectorAll('[data-delete-area]').forEach(b => b.onclick = () => { state.areas = state.areas.filter(a => a !== b.dataset.deleteArea); save(); render(); });
  on('rotaSectionForm', e => { const d = fd(e); if (d.section && !state.rotaSettings.sections.includes(d.section)) state.rotaSettings.sections.push(d.section); save(); render(); });
  on('pubForm', e => { const d = fd(e); state.pub = { ...state.pub, ...d }; save(); render(); });
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.onclick = exportReport;
}
function fd(e) { e.preventDefault(); return Object.fromEntries(new FormData(e.target).entries()); }
function on(id, fn) { const el = document.getElementById(id); if (el) el.onsubmit = fn; }

function openEditCheck(id) {
  const c = state.checks.find(x => x.id === id);
  if (!c) return;
  modalRoot.innerHTML = `<div class="modalCard">
    <button class="close" id="closeModal">×</button>
    <h2>Edit checklist</h2>
    <form id="editCheckForm" class="stack">
      <input name="title" value="${esc(c.title)}" required>
      <select name="area">${optionList(state.areas, c.area)}</select>
      <select name="freq">${optionList(['Daily', 'Weekly', 'Monthly', 'Yearly'], c.freq)}</select>
      <input name="due" type="time" value="${esc(c.due)}" required>
      <textarea name="items" required>${esc((c.items || []).join('\n'))}</textarea>
      <label class="checkline"><input type="checkbox" name="sign" ${c.sign ? 'checked' : ''}> Requires manager sign-off</label>
      <button class="primary">Save checklist changes</button>
      <button type="button" class="ghost" id="deleteCheckBtn">Delete this checklist</button>
    </form>
  </div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  document.getElementById('deleteCheckBtn').onclick = () => {
    if (confirm('Delete this checklist? Completed history will remain, but this check will no longer appear.')) {
      state.checks = state.checks.filter(x => x.id !== id);
      save();
      modalRoot.classList.add('hidden');
      render();
    }
  };
  document.getElementById('editCheckForm').onsubmit = e => {
    const d = fd(e);
    c.title = d.title;
    c.area = d.area;
    c.freq = d.freq;
    c.due = d.due;
    c.sign = e.target.sign.checked;
    c.items = d.items.split('\n').map(x => x.trim()).filter(Boolean);
    save();
    modalRoot.classList.add('hidden');
    render();
  };
}

function openUserEditor(id) {
  const u = state.users.find(x => x.id === id);
  if (!u) return;
  modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>Edit user profile</h2>
    <form id="editUserForm" class="stack"><input name="name" value="${esc(u.name)}" required><input name="nickname" value="${esc(u.nickname)}" required><input name="email" value="${esc(u.email || '')}"><select name="role">${optionList(['Staff', 'Supervisor', 'Admin'], u.role)}</select><select name="area">${optionList(state.areas, u.area)}</select><button class="primary">Save user profile</button></form>
    <h3>Add training document record</h3><form id="trainingDocForm" class="stack"><input name="title" placeholder="Document title e.g. Food Hygiene Certificate" required><textarea name="note" placeholder="Upload/link note for now. Real file upload comes with backend storage."></textarea><button class="primary">Add training document record</button></form>
  </div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  document.getElementById('editUserForm').onsubmit = e => { const d = fd(e); Object.assign(u, d); save(); modalRoot.classList.add('hidden'); render(); };
  document.getElementById('trainingDocForm').onsubmit = e => { const d = fd(e); state.trainingDocs.push({ id: uid(), userId: id, title: d.title, note: d.note, created: new Date().toISOString() }); save(); modalRoot.classList.add('hidden'); render(); };
}

function openCheck(id) {
  const c = state.checks.find(x => x.id === id);
  if (!c) return;
  modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>${esc(c.title)}</h2><p>${esc(c.area)} · Due ${esc(c.due)}</p><form id="completeForm" class="stack">${c.items.map((it, i) => `<label class="checkline"><input type="checkbox" name="i${i}" required> ${esc(it)}</label>`).join('')}<select name="result"><option>Pass</option><option>Pass with action</option><option>Fail - manager notified</option></select><textarea name="notes" placeholder="Notes / corrective action / evidence"></textarea><button class="primary">Save completed check</button></form></div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  document.getElementById('completeForm').onsubmit = e => {
    const d = fd(e);
    state.done.push({ id: uid(), checkId: id, title: c.title, userId: state.currentUser, date: today(), at: new Date().toISOString(), result: d.result, notes: d.notes || '' });
    save();
    modalRoot.classList.add('hidden');
    render();
  };
}
function exportReport() {
  const lines = [
    `${state.pub.name} - Inspection Report`,
    `Generated: ${new Date().toLocaleString()}`,
    `Premises licence: ${state.pub.licence}`,
    `DPS: ${state.pub.dps}`,
    '',
    "TODAY'S CHECKS",
    ...state.checks.map(c => `${c.title}: ${done(c.id) ? 'DONE' : overdue(c) ? 'OVERDUE' : 'PENDING'}`),
    '',
    'DOCUMENTS',
    ...state.docs.map(d => `${d.cat} - ${d.title}: ${d.status}${d.expiry ? ' expiry ' + d.expiry : ''}`),
    '',
    'TRAINING',
    ...state.training.map(t => `${user(t.userId).nickname} - ${t.course}: ${t.status}`),
    '',
    'OPEN ISSUES',
    ...state.issues.filter(i => i.status !== 'Resolved').map(i => `${i.severity} - ${i.area}: ${i.title}`)
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inspection-report-${today()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installButton) installButton.classList.remove('hidden');
});
if (installButton) installButton.onclick = async () => { if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); deferredInstallPrompt = null; } };
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));

function startApp() {
  try {
    ensureCoreState();
    save();
    render();
  } catch (error) {
    console.error(error);
    appRoot.innerHTML = `<section class="card"><h2>App load error</h2><p>The app failed to start. Refresh the page, or clear site data and reload.</p><pre>${esc(error.message)}</pre></section>`;
  }
}
