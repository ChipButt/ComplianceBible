// Central Users tab: replaces Compliance cards with the Rota App People-style list plus combined profile detail.
let centralUserProfileId = null;
let centralUserPanel = 'list';

function userInitials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}
function userStatusLine(user) {
  const rs = readRotaState() || {};
  const shifts = rs.shifts || [];
  const logs = rs.logs || {};
  const live = shifts.find(s => s.userId === user.id && logs[s.id]?.in && !logs[s.id]?.out);
  const upcoming = shifts.find(s => s.userId === user.id && s.date >= today());
  if (live) return 'On shift';
  if (upcoming) return 'Upcoming shift';
  if (user.accountStatus === 'invited') return 'Invited';
  if (user.accountStatus === 'confirmed') return 'Confirmed';
  return user.jobArea || user.area || '';
}

function resetCentralUserProfilePosition() {
  const run = () => {
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };
  run();
  requestAnimationFrame(run);
  setTimeout(run, 0);
  setTimeout(run, 80);
  setTimeout(run, 180);
}

staff = function centralUsersPage() {
  if (centralUserPanel === 'profile' && centralUserProfileId) return centralUserProfilePage();
  return `<section class="rotaPeopleShell">
    <div class="sectionHeader">
      <h2>People</h2>
      ${isAdminUser() ? '<button class="rotaRoundAdd" data-new-user="true">+</button>' : ''}
    </div>
    <input id="centralPeopleSearch" class="rotaPeopleSearch" placeholder="Search ${state.users.length} people">
    <div id="centralPeopleList" class="rotaPeopleList"></div>
  </section>`;
};

function drawCentralPeopleList() {
  const input = document.getElementById('centralPeopleSearch');
  const list = document.getElementById('centralPeopleList');
  if (!input || !list) return;
  const query = input.value.toLowerCase();
  list.innerHTML = state.users
    .filter(user => String(user.name || '').toLowerCase().includes(query) || String(user.nickname || '').toLowerCase().includes(query))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map(user => `<button class="personRow centralPersonRow" data-central-user="${user.id}">
      <span class="avatarText">${esc(userInitials(user.name))}</span>
      <div><strong>${esc(user.name)}</strong><p>${esc(userStatusLine(user))}</p></div>
      <span class="chev">›</span>
    </button>`).join('');
  document.querySelectorAll('[data-central-user]').forEach(btn => btn.onclick = () => {
    centralUserProfileId = btn.dataset.centralUser;
    centralUserPanel = 'profile';
    render();
    resetCentralUserProfilePosition();
  });
}

function centralUserProfilePage() {
  const user = state.users.find(u => u.id === centralUserProfileId) || state.users[0];
  const rs = readRotaState() || {};
  const shifts = (rs.shifts || []).filter(s => s.userId === user.id).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const next = shifts.find(s => s.date >= today());
  const training = state.training.filter(t => t.userId === user.id);
  const docs = (state.trainingDocs || []).filter(d => d.userId === user.id);
  const availability = user.availability || {};
  const availabilityText = ['mon','tue','wed','thu','fri','sat','sun'].map(day => `${day.toUpperCase()}: ${availability[day] ? 'Yes' : 'No'}`).join(' · ');
  return `<section class="profilePage centralProfilePage">
    <div class="profileTop">
      <button class="roundBtn" data-users-back="true">‹</button>
      <h2>${esc(user.nickname || user.name)}</h2>
      ${isAdminUser() || user.id === state.currentUser ? `<button class="secondary" data-edit-user="${user.id}">Edit Profile</button>` : '<span></span>'}
    </div>
    <div class="profileHero">
      <span class="avatarText big">${esc(userInitials(user.name))}</span>
      <div>${next ? `<p>Starting at ${esc(next.section)}</p><h2>${esc(next.start)} – ${esc(next.end)}</h2>` : '<p>No upcoming shift</p>'}</div>
    </div>
    <div class="quickActions">
      <button class="secondary">Find replacement</button>
      <button data-route="rota">Open rota</button>
    </div>
    <div class="profileLinks">
      <button data-central-section="personal">Personal details <span>›</span></button>
      <button data-central-section="employment">Employment / rota details <span>›</span></button>
      <button data-central-section="shifts">Upcoming shifts <span>›</span></button>
      <button data-central-section="training">Training & documents <span>›</span></button>
      <button data-central-section="availability">Availability <span>›</span></button>
    </div>
    <div id="centralProfileDetail" class="panel centralProfileDetail">
      ${centralProfileDetail(user, 'personal', shifts, training, docs, availabilityText)}
    </div>
  </section>`;
}

function centralProfileDetail(user, section, shifts, training, docs, availabilityText) {
  if (section === 'employment') return `<h2>Employment / rota details</h2><div class="listItem"><p>Job area: ${esc(user.jobArea || user.area || '')}</p><p>Role: ${esc(user.role || '')}</p><p>Permission set: ${esc(user.permissionSetId || '')}</p><p>Pay rate: £${Number(user.wage || 0).toFixed(2)}</p><p>Account status: ${esc(user.accountStatus || '')}</p><p>Holiday allowance: ${esc(user.holidayAllowanceDays || 0)} days</p><p>Carried days: ${esc(user.holidayCarriedDays || 0)}</p><p>Manual adjustment: ${esc(user.holidayAdjustmentDays || 0)}</p><p>New shift email: ${user.newShiftEmail !== false ? 'Yes' : 'No'}</p><p>Upcoming shift alerts: ${user.upcomingShiftAlerts !== false ? 'Yes' : 'No'}</p></div>`;
  if (section === 'shifts') return `<h2>Upcoming shifts</h2>${shifts.length ? shifts.map(s => `<div class="listItem"><strong>${esc(s.date)}</strong><p>${esc(s.start)} – ${esc(s.end)}</p><p class="muted">${esc(s.section)}${s.notes ? ', ' + esc(s.notes) : ''}</p></div>`).join('') : '<p class="muted">No shifts.</p>'}`;
  if (section === 'training') return `<h2>Training & documents</h2><h3>Training records</h3>${training.length ? training.map(t => `<div class="listItem"><strong>${esc(t.course)}</strong><p>${esc(t.status)}${t.expiry ? ' · Expires ' + esc(t.expiry) : ''}</p><p class="muted">${esc(t.evidence || '')}</p></div>`).join('') : '<p class="muted">No training records.</p>'}<h3>Training documents</h3>${docs.length ? docs.map(d => `<div class="listItem"><strong>${esc(d.title)}</strong><p class="muted">${esc(d.note || '')}</p></div>`).join('') : '<p class="muted">No training document records.</p>'}`;
  if (section === 'availability') return `<h2>Availability</h2><div class="listItem"><p>${esc(availabilityText)}</p></div>`;
  return `<h2>Personal details</h2><div class="listItem"><p>Name: ${esc(user.name)}</p><p>Nickname: ${esc(user.nickname || '')}</p><p>Email: ${esc(user.email || 'No email')}</p><p>Mobile: ${esc(user.mobile || 'No mobile')}</p><p>Date of birth: ${esc(user.dob || 'Not set')}</p><p>Pronouns: ${esc(user.pronouns || 'Not set')}</p><p>Address: ${esc(user.address || 'Not set')}</p></div>`;
}

function bindCentralUsers() {
  const search = document.getElementById('centralPeopleSearch');
  if (search) { search.oninput = drawCentralPeopleList; drawCentralPeopleList(); }
  document.querySelectorAll('[data-users-back]').forEach(btn => btn.onclick = () => { centralUserPanel = 'list'; centralUserProfileId = null; render(); resetCentralUserProfilePosition(); });
  document.querySelectorAll('[data-central-section]').forEach(btn => btn.onclick = () => {
    const user = state.users.find(u => u.id === centralUserProfileId) || state.users[0];
    const rs = readRotaState() || {};
    const shifts = (rs.shifts || []).filter(s => s.userId === user.id).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const training = state.training.filter(t => t.userId === user.id);
    const docs = (state.trainingDocs || []).filter(d => d.userId === user.id);
    const a = user.availability || {};
    const availabilityText = ['mon','tue','wed','thu','fri','sat','sun'].map(day => `${day.toUpperCase()}: ${a[day] ? 'Yes' : 'No'}`).join(' · ');
    const detail = document.getElementById('centralProfileDetail');
    if (detail) detail.innerHTML = centralProfileDetail(user, btn.dataset.centralSection, shifts, training, docs, availabilityText);
  });
}

const previousBindForCentralUsers = bind;
bind = function bindWithCentralUsers() {
  previousBindForCentralUsers();
  bindCentralUsers();
};