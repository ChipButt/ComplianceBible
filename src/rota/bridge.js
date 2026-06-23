// Blank demo bridge for the localStorage prototype.
// This branch keeps the app modules loaded but removes pre-populated pub, user,
// document, check, training, issue and rota data so the app can be tested from a clean state.

const ROTA_KEY = 'rotaAppUnifiedV2';
const BLANK_DEMO_CLEANED_KEY = 'complianceBible.blankDemoApp.cleaned.v1';
const ROTA_PERMISSION_SETS = {
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to manage rota, users, reports, leave and timesheets.',
    permissions: {
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
    }
  },
  staff: {
    id: 'staff',
    name: 'Staff',
    description: 'Own rota, profile, leave and timesheets.',
    permissions: {
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
    }
  }
};

function readRotaState() {
  try { return JSON.parse(localStorage.getItem(ROTA_KEY) || 'null'); } catch (_) { return null; }
}

function writeRotaStateFromCompliance() {
  const rotaState = readRotaState() || {};
  rotaState.view = rotaState.view || 'rota';
  rotaState.sections = Array.isArray(state.rotaSettings?.sections) ? state.rotaSettings.sections.slice() : [];
  rotaState.permissionSets = ROTA_PERMISSION_SETS;
  rotaState.users = Array.isArray(state.users) ? state.users.slice() : [];
  rotaState.currentUserId = state.currentUser || rotaState.users[0]?.id || '';
  rotaState.shifts = Array.isArray(rotaState.shifts) ? rotaState.shifts : [];
  rotaState.logs = rotaState.logs && typeof rotaState.logs === 'object' ? rotaState.logs : {};
  rotaState.leaveRequests = Array.isArray(rotaState.leaveRequests) ? rotaState.leaveRequests : [];
  rotaState.alerts = Array.isArray(rotaState.alerts) ? rotaState.alerts : [];
  localStorage.setItem(ROTA_KEY, JSON.stringify(rotaState));
}

function mergeRotaUsersIntoCompliance() {
  ensureExtendedState();
  const existingRota = readRotaState();
  const sourceUsers = existingRota?.users?.length ? existingRota.users : (state.users || []);
  state.users = sourceUsers.slice();
  state.currentUser = state.users.find(u => u.id === state.currentUser)?.id || state.users[0]?.id || '';
  state.areas = Array.from(new Set([...(state.areas || []), ...((state.rotaSettings && state.rotaSettings.sections) || [])])).filter(Boolean);
  save();
  writeRotaStateFromCompliance();
}

function hasOriginalDemoData() {
  const demoUsers = new Set(['u1', 'u2', 'u3', 'Admin Manager', 'Bar Supervisor', 'Kitchen Team', 'admin@example.com', 'bar@example.com', 'kitchen@example.com']);
  const demoDocs = new Set(['Premises licence', 'Premises licence summary', 'HACCP / SFBB pack', 'Fire risk assessment', 'General risk assessment', 'Gas safety certificate']);
  const demoChecks = new Set(['Opening Checks', 'Cleaning Schedule', 'Closing Checks', 'Weekly Fire Alarm Test', 'Cellar Safety Check']);
  const demoTraining = new Set(['Challenge 25', 'Food Hygiene', 'Allergen Awareness']);
  const pub = state.pub || {};
  if (pub.name === 'The Compliance Arms' || pub.licence === 'PREM-0001' || pub.dps === 'Manager Name' || pub.address === '1 High Street, Your Town') return true;
  if ((state.users || []).some(u => demoUsers.has(u.id) || demoUsers.has(u.name) || demoUsers.has(u.email))) return true;
  if ((state.docs || []).some(d => demoDocs.has(d.title))) return true;
  if ((state.checks || []).some(c => demoChecks.has(c.title))) return true;
  if ((state.training || []).some(t => demoTraining.has(t.course) || ['u1', 'u2', 'u3'].includes(t.userId))) return true;
  if ((state.issues || []).some(i => String(i.title || '').includes('Example: replace missing wet-floor sign') || String(i.notes || '').includes('Demo issue'))) return true;
  return false;
}

function applyBlankDemoState() {
  ensureExtendedState();
  if (hasOriginalDemoData()) {
    state.pub = { name: '', licence: '', dps: '', address: '' };
    state.currentUser = 'setup-local';
    state.users = [{ id: 'setup-local', name: 'Local Setup User', nickname: 'Setup', role: 'Admin', area: '', email: '', permissionSetId: 'Admin' }];
    state.areas = [];
    state.docs = [];
    state.checks = [];
    state.done = [];
    state.temps = [];
    state.logs = [];
    state.training = [];
    state.issues = [];
    state.trainingDocs = [];
    state.userRequiredDocuments = [];
    state.rotaSettings = { source: '', sections: [] };
    localStorage.setItem(BLANK_DEMO_CLEANED_KEY, 'true');
    save();
  }
  writeRotaStateFromCompliance();
}

applyBlankDemoState();

function resetRotaScheduleScroll() {
  const scroller = document.scrollingElement || document.documentElement;
  if (scroller) scroller.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
}
window.__rotaScheduleScrollReset = resetRotaScheduleScroll;

const previousRotaPage = rota;
rota = function rotaSchedulePage() {
  writeRotaStateFromCompliance();
  return `<section class="rotaEmbedCard rotaScheduleEmbed"><iframe id="rotaScheduleFrame" class="rotaFrame" title="Rota schedule" src="rota-app.html?v=20260619-1"></iframe></section>`;
};

window.addEventListener('message', event => {
  const data = event.data || {};
  if (!data || typeof data !== 'object') return;
  if (data.type === 'rota-app-height') document.documentElement.style.removeProperty('--rota-frame-height');
  if (data.type === 'rota-app-ready' && document.body.classList.contains('is-rota-route')) resetRotaScheduleScroll();
  if (data.type === 'rota-scroll-top') resetRotaScheduleScroll();
});

try { render(); } catch (error) { console.error('Blank demo app render failed', error); }
