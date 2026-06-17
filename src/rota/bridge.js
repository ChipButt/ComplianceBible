// Bridge layer based on ChipButt/Test branch Rota-App.
// It aligns Compliance Bible users with the Rota App user profile model.
const ROTA_KEY = 'rotaAppUnifiedV2';
const ROTA_MANAGERS = ['Vikki Fox', 'Chip Butt', 'Rhiannon Green'];
const ROTA_NAMES = ['Ali','Andrew','April Hobday','April Hood','Ben','Ben McManus','Chan','Charlie','Chip Butt','Darcey Warwick','Ellie','Fleur','Frederick Lees','Hayden Smith','Jake','Jamie Cox','Jess Keddie','Katie','Logan','Maisie Morris','Mandi','Marc Pearmain','Meg','Megan','Paul Davis','Rhiannon Green','Ryan Thompson','Sharon Hiatt','Skye','Sophia Vassalos','Tom Mills','Vikki Fox','Zoe'];
const ROTA_SECTIONS = ['Kitchen','FOH','Office','WFH','Housekeeping','KP','Kitchen PotWash'];
const ROTA_ADMIN_PERMISSIONS = {
  viewPeople: true,
  manageUsers: true,
  manageRota: true,
  viewAllTimesheets: true,
  manageTimesheets: true,
  viewAllLeave: true,
  manageLeave: true,
  editLeaveBalances: true,
  viewReports: true,
  managePermissionSets: true,
  viewOwnProfile: true,
  editOwnPersonal: true,
  viewOwnShifts: true,
  clockIn: true,
  requestLeave: true,
  viewOwnLeave: true,
  viewOwnTimesheets: true,
  viewOwnAvailability: true,
  editOwnAvailability: true
};
const ROTA_STAFF_PERMISSIONS = {
  viewPeople: false,
  manageUsers: false,
  manageRota: false,
  viewAllTimesheets: false,
  manageTimesheets: false,
  viewAllLeave: false,
  manageLeave: false,
  editLeaveBalances: false,
  viewReports: false,
  managePermissionSets: false,
  viewOwnProfile: true,
  editOwnPersonal: true,
  viewOwnShifts: true,
  clockIn: true,
  requestLeave: true,
  viewOwnLeave: true,
  viewOwnTimesheets: true,
  viewOwnAvailability: true,
  editOwnAvailability: true
};
const ROTA_PERMISSION_SETS = {
  admin: { id: 'admin', name: 'Admin', description: 'Full access to manage rota, users, reports, leave and timesheets.', permissions: ROTA_ADMIN_PERMISSIONS },
  staff: { id: 'staff', name: 'Staff', description: 'Own rota, profile, leave and timesheets.', permissions: ROTA_STAFF_PERMISSIONS }
};

function rotaIdFromName(name) {
  return 'u_' + String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
function rotaSplitName(name) {
  const parts = String(name).trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}
function rotaMakeUser(name) {
  const admin = ROTA_MANAGERS.includes(name);
  const sp = rotaSplitName(name);
  return {
    id: rotaIdFromName(name),
    firstName: sp.firstName,
    lastName: sp.lastName,
    name,
    nickname: sp.firstName,
    email: name === 'Chip Butt' ? 'jameschipbutt@hotmail.com' : '',
    mobile: '',
    dob: '',
    address: '',
    wage: 0,
    jobArea: admin ? 'Office' : 'FOH',
    area: admin ? 'Office' : 'FOH',
    pronouns: '',
    permissionSetId: admin ? 'admin' : 'staff',
    role: admin ? 'Admin' : 'Staff',
    rotaRole: admin ? 'admin' : 'staff',
    accountStatus: admin ? 'confirmed' : (name === 'Paul Davis' ? 'invited' : 'no_email'),
    inviteSentAt: name === 'Paul Davis' ? new Date().toISOString() : null,
    confirmedAt: admin ? new Date().toISOString() : null,
    newShiftEmail: true,
    upcomingShiftAlerts: true,
    holidayAllowanceDays: 28,
    holidayCarriedDays: 0,
    holidayAdjustmentDays: 0,
    availability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  };
}
function rotaIsAdminUser(userRecord) {
  const roleText = String(`${userRecord?.role || ''} ${userRecord?.rotaRole || ''} ${userRecord?.permissionSetId || ''}`).toLowerCase();
  return roleText.includes('admin') || roleText.includes('manager') || roleText.includes('supervisor') || ROTA_MANAGERS.includes(userRecord?.name);
}
function rotaNormalizeUser(userRecord) {
  const name = userRecord.name || [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ') || 'Unknown';
  const base = rotaMakeUser(name);
  const admin = rotaIsAdminUser({ ...base, ...userRecord, name });
  return {
    ...base,
    ...userRecord,
    name,
    nickname: userRecord.nickname || base.nickname,
    role: admin ? 'admin' : 'staff',
    rotaRole: admin ? 'admin' : 'staff',
    permissionSetId: admin ? 'admin' : 'staff',
    area: userRecord.jobArea || userRecord.area || base.area,
    jobArea: userRecord.jobArea || userRecord.area || base.jobArea
  };
}

function readRotaState() {
  try { return JSON.parse(localStorage.getItem(ROTA_KEY) || 'null'); } catch { return null; }
}
function writeRotaStateFromCompliance() {
  const rotaState = readRotaState() || {};
  rotaState.view = rotaState.view || 'rota';
  rotaState.sections = state.rotaSettings?.sections || ROTA_SECTIONS;
  rotaState.permissionSets = ROTA_PERMISSION_SETS;
  rotaState.users = state.users.map(rotaNormalizeUser);
  const currentUserExists = rotaState.users.some(u => u.id === state.currentUser);
  rotaState.currentUserId = currentUserExists ? state.currentUser : (rotaState.users.find(u => u.name === 'Chip Butt')?.id || rotaState.users[0]?.id || rotaIdFromName('Chip Butt'));
  rotaState.shifts = rotaState.shifts || [];
  rotaState.logs = rotaState.logs || {};
  rotaState.leaveRequests = rotaState.leaveRequests || [];
  rotaState.alerts = rotaState.alerts || [];
  localStorage.setItem(ROTA_KEY, JSON.stringify(rotaState));
}
function mergeRotaUsersIntoCompliance() {
  ensureExtendedState();
  const existingRota = readRotaState();
  const sourceUsers = existingRota?.users?.length ? existingRota.users : ROTA_NAMES.map(rotaMakeUser);
  const byId = new Map((state.users || []).map(u => [u.id, u]));
  state.users = sourceUsers.map(ru => {
    const existing = byId.get(ru.id) || {};
    const role = ru.permissionSetId === 'admin' || ru.role === 'admin' || ROTA_MANAGERS.includes(ru.name) ? 'Admin' : 'Staff';
    const merged = {
      ...rotaMakeUser(ru.name || [ru.firstName, ru.lastName].filter(Boolean).join(' ') || 'Unknown'),
      ...ru,
      ...existing,
      role,
      rotaRole: ru.role || (role === 'Admin' ? 'admin' : 'staff'),
      area: ru.jobArea || ru.area || existing.area || 'FOH',
      jobArea: ru.jobArea || ru.area || existing.jobArea || 'FOH'
    };
    return {
      ...merged,
      permissionSetId: role === 'Admin' ? 'admin' : 'staff',
      rotaRole: role === 'Admin' ? 'admin' : 'staff'
    };
  });
  state.currentUser = state.users.find(u => u.name === 'Chip Butt')?.id || state.users[0]?.id;
  state.areas = Array.from(new Set([...(state.areas || []), ...ROTA_SECTIONS]));
  state.rotaSettings = state.rotaSettings || {};
  state.rotaSettings.sections = Array.from(new Set([...(state.rotaSettings.sections || []), ...ROTA_SECTIONS]));
  save();
  writeRotaStateFromCompliance();
}

function rotaUserDetails(user) {
  return `<dl class="profileDetails">
    <div><dt>Email</dt><dd>${esc(user.email || 'No email')}</dd></div>
    <div><dt>Mobile</dt><dd>${esc(user.mobile || 'Not set')}</dd></div>
    <div><dt>Pronouns</dt><dd>${esc(user.pronouns || 'Not set')}</dd></div>
    <div><dt>Job area</dt><dd>${esc(user.jobArea || user.area || 'Not set')}</dd></div>
    <div><dt>Wage</dt><dd>£${Number(user.wage || 0).toFixed(2)}</dd></div>
    <div><dt>Holiday allowance</dt><dd>${esc(user.holidayAllowanceDays || 0)} days</dd></div>
    <div><dt>Account</dt><dd>${esc(user.accountStatus || 'not set')}</dd></div>
  </dl>`;
}

const previousUserProfileCard = userProfileCard;
userProfileCard = function rotaUserProfileCard(user) {
  const records = state.training.filter(t => t.userId === user.id);
  const docs = (state.trainingDocs || []).filter(d => d.userId === user.id);
  return `<article class="card">
    <div class="cardTop"><h3>${esc(user.nickname || user.name)}</h3>${badge(user.role, user.role === 'Admin' ? 'ok' : '')}</div>
    <p><strong>${esc(user.name)}</strong></p>
    ${rotaUserDetails(user)}
    <h3>Training</h3>
    ${records.length ? `<ul class="plainList">${records.map(t => `<li><span>${esc(t.course)} · ${esc(t.status)}</span><small>${esc(t.expiry ? 'Expires ' + t.expiry : 'No expiry')}</small></li>`).join('')}</ul>` : '<p class="muted">No training records.</p>'}
    <h3>Training documents</h3>
    ${docs.length ? `<ul class="plainList">${docs.map(d => `<li><span>${esc(d.title)}</span><small>${esc(d.note || 'No note')}</small></li>`).join('')}</ul>` : '<p class="muted">No uploaded training document records yet.</p>'}
    ${isAdminUser() ? `<button class="ghost" data-edit-user="${user.id}">Edit profile / add training document</button>` : ''}
  </article>`;
};

const previousRotaPage = rota;
function resetRotaScheduleScroll() {
  const reset = () => {
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, 0);
    try {
      document.getElementById('rotaScheduleFrame')?.contentWindow?.scrollTo(0, 0);
    } catch (_) {}
  };
  reset();
  requestAnimationFrame(reset);
}
window.__rotaScheduleScrollReset = resetRotaScheduleScroll;

rota = function rotaSchedulePage() {
  writeRotaStateFromCompliance();
  resetRotaScheduleScroll();
  return `<section class="rotaEmbedCard rotaScheduleEmbed">
    <iframe id="rotaScheduleFrame" class="rotaFrame" title="Rota schedule" src="rota-app.html?v=20260617-5"></iframe>
  </section>`;
};

window.addEventListener('message', event => {
  const data = event.data || {};
  if (!data || typeof data !== 'object') return;
  if (data.type === 'rota-app-height') {
    document.documentElement.style.removeProperty('--rota-frame-height');
  }
  if (data.type === 'rota-app-ready' && document.body.classList.contains('is-rota-route')) resetRotaScheduleScroll();
  if (data.type === 'rota-scroll-top') window.scrollTo({ top: 0, behavior: 'smooth' });
});

function saveRotaUserFromModal(user, formData) {
  user.firstName = formData.firstName || user.firstName;
  user.lastName = formData.lastName || user.lastName;
  user.name = [user.firstName, user.lastName].filter(Boolean).join(' ') || formData.name || user.name;
  user.nickname = formData.nickname;
  user.email = formData.email;
  user.mobile = formData.mobile;
  user.dob = formData.dob;
  user.address = formData.address;
  user.wage = Number(formData.wage || 0);
  user.jobArea = formData.jobArea;
  user.area = formData.jobArea;
  user.pronouns = formData.pronouns;
  user.role = formData.role;
  user.rotaRole = formData.role === 'Admin' ? 'admin' : 'staff';
  user.permissionSetId = formData.role === 'Admin' ? 'admin' : 'staff';
  user.newShiftEmail = !!formData.newShiftEmail;
  user.upcomingShiftAlerts = !!formData.upcomingShiftAlerts;
  user.holidayAllowanceDays = Number(formData.holidayAllowanceDays || 0);
}

openUserEditor = function rotaUserEditor(id) {
  const user = state.users.find(x => x.id === id);
  if (!user) return;
  modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>Edit user profile</h2>
    <form id="editUserForm" class="stack">
      <div class="grid two"><input name="firstName" value="${esc(user.firstName || '')}" placeholder="First name"><input name="lastName" value="${esc(user.lastName || '')}" placeholder="Last name"></div>
      <input name="nickname" value="${esc(user.nickname || '')}" placeholder="Nickname" required>
      <input name="email" value="${esc(user.email || '')}" placeholder="Email">
      <input name="mobile" value="${esc(user.mobile || '')}" placeholder="Mobile">
      <input name="dob" type="date" value="${esc(user.dob || '')}">
      <textarea name="address" placeholder="Address">${esc(user.address || '')}</textarea>
      <div class="grid two"><input name="wage" type="number" step="0.01" value="${esc(user.wage || 0)}" placeholder="Hourly wage"><input name="pronouns" value="${esc(user.pronouns || '')}" placeholder="Pronouns"></div>
      <select name="jobArea">${state.areas.map(a => `<option ${a === (user.jobArea || user.area) ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
      <select name="role"><option ${user.role === 'Staff' ? 'selected' : ''}>Staff</option><option ${user.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option><option ${user.role === 'Admin' ? 'selected' : ''}>Admin</option></select>
      <div class="grid two"><input name="holidayAllowanceDays" type="number" step="0.5" value="${esc(user.holidayAllowanceDays || 28)}" placeholder="Holiday allowance"><label class="checkline"><input type="checkbox" name="newShiftEmail" ${user.newShiftEmail !== false ? 'checked' : ''}> New shift email</label></div>
      <label class="checkline"><input type="checkbox" name="upcomingShiftAlerts" ${user.upcomingShiftAlerts !== false ? 'checked' : ''}> Upcoming shift alerts</label>
      <button class="primary">Save user profile</button>
    </form>
    <h3>Add training document record</h3><form id="trainingDocForm" class="stack"><input name="title" placeholder="Document title e.g. Food Hygiene Certificate" required><textarea name="note" placeholder="Upload/link note for now. Real file upload comes with backend storage."></textarea><button class="primary">Add training document record</button></form>
  </div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  document.getElementById('editUserForm').onsubmit = e => { const data = fd(e); saveRotaUserFromModal(user, data); save(); writeRotaStateFromCompliance(); modalRoot.classList.add('hidden'); render(); };
  document.getElementById('trainingDocForm').onsubmit = e => { const d = fd(e); state.trainingDocs.push({ id: uid(), userId: id, title: d.title, note: d.note, created: new Date().toISOString() }); save(); modalRoot.classList.add('hidden'); render(); };
};

mergeRotaUsersIntoCompliance();
