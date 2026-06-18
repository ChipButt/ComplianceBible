// Central Users tab: replaces Compliance cards with the Rota App People-style list plus combined profile detail.
let centralUserProfileId = null;
let centralUserPanel = 'list';
let centralUserActiveSection = 'personal';
const USER_DOC_REQ_KEY = 'complianceUserDocumentRequirementsV1';
const USER_DOC_GROUPS = ['Office', 'FOH', 'Kitchen', 'KP', 'Housekeeping', 'WFH', 'Hybrid'];
const USER_DOC_KITCHEN_GROUPS = ['Kitchen', 'KP'];
const AVAILABILITY_DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday']
];
const centralProfileOpenDocCards = {};
const centralProfileDocIcon = {
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5z"/><path d="M8 3v4M16 3v4M5 10h14"/></svg>'
};

function normaliseUserValue(value) {
  return String(value || '').trim().toLowerCase();
}

function stableUserDocReqId(title) {
  return 'req_' + String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function readUserJSON(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed || fallback;
  } catch (_) {
    return fallback;
  }
}

function writeUserJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

function defaultUserDocRequirements() {
  return [
    ['New Starter Pay Information', USER_DOC_GROUPS, 'none'],
    ['New Starter Medical Questionnaire', USER_DOC_GROUPS, 'none'],
    ['Piston Club Handbook Declaration', USER_DOC_GROUPS, 'none'],
    ['Fire Safety & Training', USER_DOC_GROUPS, 'none'],
    ['Food Allergy and Intolerance', USER_DOC_GROUPS, 'none'],
    ['Safer Food Better Business Health & Safety Awareness', USER_DOC_GROUPS, 'none'],
    ['Signed Contract', USER_DOC_GROUPS, 'none'],
    ['Working Hours Opt Out', USER_DOC_GROUPS, 'none'],
    ['Kitchen Oil & Fryer Training', USER_DOC_KITCHEN_GROUPS, 'none'],
    ['Food Safety & Hygiene Level 2', USER_DOC_KITCHEN_GROUPS, 'optional'],
    ['Challenge 25 Training', [], 'none'],
    ['COSHH Awareness', [], 'none'],
    ['Fire Marshal', [], 'optional'],
    ['Food Safety & Hygiene Level 3', [], 'optional'],
    ['HACCP', [], 'optional'],
    ['First Aid', [], 'optional'],
    ['Cellar Management', [], 'none']
  ].map(([title, staffGroups, expiryMode]) => ({ id: stableUserDocReqId(title), title, staffGroups, expiryMode }));
}

function cleanUserDocGroups(groups) {
  const valid = new Set(USER_DOC_GROUPS.map(normaliseUserValue));
  return (Array.isArray(groups) ? groups : []).filter(group => valid.has(normaliseUserValue(group)));
}

function getUserDocRequirements() {
  const saved = readUserJSON(USER_DOC_REQ_KEY, []);
  const defaultsByTitle = new Map(defaultUserDocRequirements().map(req => [normaliseUserValue(req.title), req]));
  const byTitle = new Map();
  (Array.isArray(saved) ? saved : []).forEach(req => {
    if (!req || !req.title) return;
    const titleKey = normaliseUserValue(req.title);
    let next = { ...req, id: req.id || stableUserDocReqId(req.title), staffGroups: cleanUserDocGroups(req.staffGroups), expiryMode: req.expiryMode || 'optional' };
    if (titleKey === 'food hygiene certificate') next = { ...next, id: stableUserDocReqId('Food Safety & Hygiene Level 2'), title: 'Food Safety & Hygiene Level 2', staffGroups: USER_DOC_KITCHEN_GROUPS, expiryMode: req.expiryMode || 'optional' };
    if (titleKey === 'allergen awareness certificate') next = { ...next, id: stableUserDocReqId('Food Allergy and Intolerance'), title: 'Food Allergy and Intolerance', staffGroups: USER_DOC_GROUPS, expiryMode: 'none' };
    if (titleKey === 'signed contract') next = { ...next, id: stableUserDocReqId('Signed Contract'), title: 'Signed Contract', staffGroups: cleanUserDocGroups(req.staffGroups).length ? cleanUserDocGroups(req.staffGroups) : USER_DOC_GROUPS, expiryMode: 'none' };
    if (titleKey === 'working hours opt out') next = { ...next, id: stableUserDocReqId('Working Hours Opt Out'), title: 'Working Hours Opt Out', staffGroups: cleanUserDocGroups(req.staffGroups).length ? cleanUserDocGroups(req.staffGroups) : USER_DOC_GROUPS, expiryMode: 'none' };
    byTitle.set(normaliseUserValue(next.title), next);
  });
  defaultsByTitle.forEach((req, titleKey) => {
    const existing = byTitle.get(titleKey);
    if (!existing) byTitle.set(titleKey, req);
    else if (!(existing.staffGroups || []).length && req.staffGroups.length) byTitle.set(titleKey, { ...existing, staffGroups: req.staffGroups });
  });
  const merged = Array.from(byTitle.values()).map(req => ({ ...req, staffGroups: cleanUserDocGroups(req.staffGroups) }));
  writeUserJSON(USER_DOC_REQ_KEY, merged);
  return merged;
}

function employmentType(user) {
  return user && user.employmentType === 'Contractor' ? 'Contractor' : 'Employee';
}

function userDocumentGroupKeys(user) {
  return new Set([user?.jobArea, user?.area, user?.role, user?.permissionSetId, 'Staff', 'All staff'].map(normaliseUserValue).filter(Boolean));
}

function userDocumentApplies(req, user) {
  if (!req || !user) return false;
  if (normaliseUserValue(req.title) === 'signed contract' && employmentType(user) === 'Contractor') return false;
  const groups = Array.isArray(req.staffGroups) ? req.staffGroups : [];
  const keys = userDocumentGroupKeys(user);
  return groups.some(group => keys.has(normaliseUserValue(group)) || normaliseUserValue(group) === 'staff' || normaliseUserValue(group) === 'all staff');
}

function userDocumentRecords() {
  state.userRequiredDocuments = state.userRequiredDocuments || [];
  return state.userRequiredDocuments;
}

function userDocumentRecordFor(userId, requirementId, create = true) {
  let record = userDocumentRecords().find(item => item.userId === userId && item.requirementId === requirementId);
  if (!record && create) {
    record = { id: uid(), userId, requirementId };
    userDocumentRecords().push(record);
  }
  return record;
}

function linkedUserRequirements(user) {
  const reqs = getUserDocRequirements();
  const byId = new Map(reqs.filter(req => userDocumentApplies(req, user)).map(req => [req.id, req]));
  userDocumentRecords().filter(record => record.userId === user.id && record.requirementId).forEach(record => {
    const req = reqs.find(item => item.id === record.requirementId);
    if (req) byId.set(req.id, req);
  });
  if (employmentType(user) === 'Contractor') {
    const contract = reqs.find(req => normaliseUserValue(req.title) === 'signed contract');
    if (contract) byId.set(contract.id, contract);
  }
  return Array.from(byId.values());
}

function isDocumentImage(record) {
  return String(record?.fileType || '').startsWith('image/') || String(record?.fileData || '').startsWith('data:image/');
}

function readProfileDocumentFile(file, done) {
  const reader = new FileReader();
  reader.onload = () => done(reader.result || '');
  reader.readAsDataURL(file);
}

function confirmedProfileDocument(record) {
  return !!(record?.fileData && (record.noExpiry || record.expiryDate || record.expiry));
}

function profileDocumentStatus(record, required) {
  if (confirmedProfileDocument(record)) return ['', 'complete'];
  if (record?.fileData) return ['Uploaded', 'warn'];
  return [required ? 'Required' : 'Missing', 'danger'];
}

function profileDocumentExpiryText(record) {
  if (record?.noExpiry) return 'Does not expire';
  const raw = record?.expiryDate || record?.expiry || '';
  if (!raw) return 'No expiry set';
  try {
    return new Date(raw + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) {
    return raw;
  }
}

function profileDocumentThumb(record) {
  if (!record?.fileData) return '<button type="button" class="fdocThumb empty" data-training-doc-thumb="">No document</button>';
  if (isDocumentImage(record)) return `<button type="button" class="fdocThumb" data-training-doc-thumb="${esc(record.id)}"><img src="${record.fileData}" alt="Document preview"></button>`;
  return `<button type="button" class="fdocThumb file" data-training-doc-thumb="${esc(record.id)}">DOC</button>`;
}

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

staff = function centralUsersPage() {
  if (centralUserPanel === 'profile' && centralUserProfileId) return centralUserProfilePage();
  return `<section class="rotaPeopleShell">
    <div class="sectionHeader">
      <h2>People</h2>
      ${isAdminUser() ? '<button class="rotaRoundAdd usersAddUserBtn" data-new-user="true" type="button">Add User</button>' : ''}
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
    centralUserActiveSection = 'personal';
    render();
  });
}

function openCentralAddUserModal() {
  if (!isAdminUser()) return;
  modalRoot.innerHTML = `<div class="modalCard userModalCard"><button class="close" id="closeModal" type="button">x</button><h2>Add User</h2><form id="centralAddUserForm" class="stack"><input name="name" placeholder="Full name" required><input name="nickname" placeholder="Nickname shown on rota/checks" required><input name="email" type="email" placeholder="Email"><select name="employmentType"><option>Employee</option><option>Contractor</option></select><select name="role">${optionList(['Staff', 'Supervisor', 'Admin'], 'Staff')}</select><select name="area">${optionList(state.areas, state.areas[0] || '')}</select><button class="primary">Add User</button></form></div>`;
  modalRoot.classList.remove('hidden');
  const close = document.getElementById('closeModal');
  if (close) close.onclick = () => modalRoot.classList.add('hidden');
  const form = document.getElementById('centralAddUserForm');
  if (form) form.onsubmit = event => {
    const data = fd(event);
    const newUser = {
      id: uid(),
      name: data.name,
      nickname: data.nickname,
      email: data.email || '',
      employmentType: data.employmentType || 'Employee',
      role: data.role || 'Staff',
      area: data.area || '',
      jobArea: data.area || '',
      permissionSetId: data.role || 'Staff',
      accountStatus: 'confirmed'
    };
    state.users.push(newUser);
    save();
    modalRoot.classList.add('hidden');
    render();
  };
}

function timeOptions(selected) {
  const out = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
      out.push(`<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`);
    }
  }
  return out.join('');
}

function migrateAvailability(user) {
  user.availability = user.availability || {};
  AVAILABILITY_DAYS.forEach(([key]) => {
    const current = user.availability[key];
    if (typeof current === 'boolean') {
      user.availability[key] = { allDay: current, ranges: [] };
    } else if (!current || typeof current !== 'object' || Array.isArray(current)) {
      user.availability[key] = { allDay: false, ranges: [] };
    } else {
      current.allDay = !!current.allDay;
      current.ranges = Array.isArray(current.ranges) ? current.ranges : [];
    }
  });
  return user.availability;
}

function availabilityRangeRow(userId, dayKey, range, index) {
  const start = range?.start || '09:00';
  const end = range?.end || '17:00';
  return `<div class="availabilityRange" data-availability-range="${esc(userId + '|' + dayKey + '|' + index)}"><select data-availability-start>${timeOptions(start)}</select><select data-availability-end>${timeOptions(end)}</select><button type="button" class="availabilityRemove" data-availability-remove="${esc(userId + '|' + dayKey + '|' + index)}" aria-label="Remove time range">×</button></div>`;
}

function availabilityEditor(user) {
  const availability = migrateAvailability(user);
  return `<div class="availabilityEditor" data-availability-user="${esc(user.id)}">${AVAILABILITY_DAYS.map(([key, label]) => {
    const day = availability[key] || { allDay: false, ranges: [] };
    const ranges = day.ranges && day.ranges.length ? day.ranges : [];
    return `<section class="availabilityDay" data-availability-day="${esc(key)}"><h4>${esc(label)}</h4><p class="availabilityAllDayHeading">All Day</p><label class="availabilityAllDay"><input type="checkbox" data-availability-allday="${esc(user.id + '|' + key)}" ${day.allDay ? 'checked' : ''}></label><p class="availabilitySubhead">Specific<br>times</p><div class="availabilityRanges">${ranges.length ? ranges.map((range, index) => availabilityRangeRow(user.id, key, range, index)).join('') : '<p class="muted availabilityNoRanges">No specific times</p>'}</div><button type="button" class="availabilityAdd" data-availability-add="${esc(user.id + '|' + key)}" aria-label="Add another time range">+</button></section>`;
  }).join('')}</div>`;
}

function shiftList(shifts) {
  const upcoming = (shifts || []).filter(s => !s.date || s.date >= today()).slice(0, 5);
  if (!upcoming.length) return '<p class="muted">No upcoming shifts.</p>';
  return upcoming.map(s => `<div class="listItem"><strong>${esc(s.date || 'Upcoming shift')}</strong><p>${esc((s.start || '') + (s.end ? ' - ' + s.end : ''))}</p><p class="muted">${esc(s.section || '')}${s.notes ? ' · ' + esc(s.notes) : ''}</p></div>`).join('');
}

function profileDocumentCard(user, req) {
  const required = userDocumentApplies(req, user);
  const record = userDocumentRecordFor(user.id, req.id);
  const status = profileDocumentStatus(record, required);
  const badge = status[0] ? `<span class="fdocBadge ${status[1]}">${esc(status[0])}</span>` : '<span class="fdocBadge fdocBadgeEmpty" aria-hidden="true"></span>';
  const key = user.id + '|' + req.id;
  const cardKey = 'userdoc:' + key;
  const expanded = !!centralProfileOpenDocCards[cardKey];
  return `<article class="fdoc ${expanded ? 'open' : ''}" data-profile-training-doc="true" data-user-id="${esc(user.id)}" data-req-id="${esc(req.id)}"><button type="button" class="fdocBar" data-profile-training-toggle="${esc(cardKey)}"><span class="fdocIcon">${centralProfileDocIcon.doc}</span><span class="fdocName"><strong>${esc(req.title)}</strong><em>${esc((user.nickname || user.name) + ' · ' + (user.jobArea || user.area || user.role || 'Staff'))}</em></span>${badge}<span class="fdocDate">${esc(profileDocumentExpiryText(record))}</span><span class="fdocArrow" aria-hidden="true">⌄</span></button><div class="fdocPanel ${expanded ? '' : 'closed'}"><p class="fdocInstruction">Upload evidence for ${esc(user.nickname || user.name)} and set expiry status.</p><div class="fdocBody">${profileDocumentThumb(record)}<div class="fdocControls"><div class="fdocUploads"><label>${centralProfileDocIcon.upload}<span>Choose File</span><input type="file" data-profile-training-file accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>${centralProfileDocIcon.camera}<span>Take Photo</span><input type="file" data-profile-training-photo accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input type="checkbox" data-profile-training-noexpiry ${record.noExpiry ? 'checked' : ''}><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span class="fdocDateInputWrap">${centralProfileDocIcon.calendar}<span class="fdocExpiryText">Expiry Date</span><input type="date" data-profile-training-expiry value="${esc(record.expiryDate || record.expiry || '')}" ${record.noExpiry ? 'disabled' : ''}></span></label></div></div></div></div></article>`;
}

function trainingDocumentBlock(user, training) {
  const reqs = linkedUserRequirements(user);
  const docs = reqs.length ? reqs.map(req => profileDocumentCard(user, req)).join('') : '<p class="muted">No staff documents linked to this profile.</p>';
  return `<h2>Training & Staff Documents</h2><h3>Staff documents</h3><section class="fdocSection profileTrainingDocSection">${docs}</section><h3>Training records</h3>${training.length ? training.map(t => `<div class="listItem"><strong>${esc(t.course)}</strong><p>${esc(t.status)}${t.expiry ? ' · Expires ' + esc(t.expiry) : ''}</p><p class="muted">${esc(t.evidence || '')}</p></div>`).join('') : '<p class="muted">No training records.</p>'}`;
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
      <div>${next ? `<p>Starting at ${esc(next.section)}</p><h2>${esc(next.start)} - ${esc(next.end)}</h2>` : '<p>No upcoming shift</p>'}</div>
    </div>
    <div class="quickActions">
      <button class="secondary">Find replacement</button>
      <button data-route="rota">Open rota</button>
    </div>
    <div class="profileLinks">
      <button class="${centralUserActiveSection === 'personal' ? 'active' : ''}" data-central-section="personal">Personal details</button>
      <button class="${centralUserActiveSection === 'employment' ? 'active' : ''}" data-central-section="employment">Employment</button>
      <button class="${centralUserActiveSection === 'training' ? 'active' : ''}" data-central-section="training">Training</button>
    </div>
    <div id="centralProfileDetail" class="panel centralProfileDetail">
      ${centralProfileDetail(user, centralUserActiveSection, shifts, training, docs, availabilityText)}
    </div>
  </section>`;
}

function centralProfileDetail(user, section, shifts, training, docs, availabilityText) {
  if (section === 'employment' || section === 'shifts' || section === 'availability') {
    migrateAvailability(user);
    return `<h2>Employment</h2><div class="listItem"><p>Employment type: ${esc(employmentType(user))}</p><p>Job area: ${esc(user.jobArea || user.area || '')}</p><p>Role: ${esc(user.role || '')}</p><p>Permission set: ${esc(user.permissionSetId || '')}</p><p>Pay rate: £${Number(user.wage || 0).toFixed(2)}</p><p>Account status: ${esc(user.accountStatus || '')}</p><p>New shift email: ${user.newShiftEmail !== false ? 'Yes' : 'No'}</p><p>Upcoming shift alerts: ${user.upcomingShiftAlerts !== false ? 'Yes' : 'No'}</p></div><h3>Upcoming shifts</h3>${shiftList(shifts)}<h3>Availability</h3>${availabilityEditor(user)}`;
  }
  if (section === 'training') return trainingDocumentBlock(user, training || []);
  return `<h2>Personal details</h2><div class="listItem"><p>Name: ${esc(user.name)}</p><p>Nickname: ${esc(user.nickname || '')}</p><p>Email: ${esc(user.email || 'No email')}</p><p>Mobile: ${esc(user.mobile || 'No mobile')}</p><p>Date of birth: ${esc(user.dob || 'Not set')}</p><p>Pronouns: ${esc(user.pronouns || 'Not set')}</p><p>Address: ${esc(user.address || 'Not set')}</p></div>`;
}

function parseAvailabilityKey(value) {
  const parts = String(value || '').split('|');
  return { userId: parts[0], dayKey: parts[1], index: Number(parts[2] || 0) };
}

function refreshActiveProfileSection() {
  const activeModalTab = document.querySelector('[data-user-modal-section].active');
  if (activeModalTab) {
    activeModalTab.click();
    return;
  }
  render();
}

function openProfileDocumentViewer(record) {
  if (!record?.fileData) return;
  modalRoot.innerHTML = `<div class="modalCard evidenceViewerModal"><button class="close" id="fdocClose">×</button><h2>${esc(record.fileName || 'Document evidence')}</h2>${isDocumentImage(record) ? `<img class="fdocFull" src="${record.fileData}" alt="Document preview">` : `<div class="fdocFileBig">Document file</div><a class="ghost evidenceOpenLink" href="${record.fileData}" download="${esc(record.fileName || 'document')}">Open / Download</a>`}</div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('fdocClose').onclick = () => modalRoot.classList.add('hidden');
}

function bindTrainingDocumentControls() {
  document.querySelectorAll('[data-profile-training-toggle]').forEach(button => {
    if (button.dataset.boundTrainingToggle) return;
    button.dataset.boundTrainingToggle = '1';
    button.onclick = () => {
      const key = button.dataset.profileTrainingToggle;
      const card = button.closest('.fdoc');
      const panel = card && card.querySelector('.fdocPanel');
      const isOpen = !(card && card.classList.contains('open'));
      centralProfileOpenDocCards[key] = isOpen;
      if (card) card.classList.toggle('open', isOpen);
      if (panel) panel.classList.toggle('closed', !isOpen);
    };
  });
  document.querySelectorAll('[data-profile-training-file],[data-profile-training-photo]').forEach(input => {
    if (input.dataset.boundTrainingFile) return;
    input.dataset.boundTrainingFile = '1';
    input.onchange = () => {
      const card = input.closest('[data-profile-training-doc]');
      const file = input.files && input.files[0];
      if (!card || !file) return;
      const record = userDocumentRecordFor(card.dataset.userId, card.dataset.reqId);
      readProfileDocumentFile(file, data => {
        record.fileData = data;
        record.fileName = file.name || 'Photo';
        record.fileType = file.type || 'image/jpeg';
        record.uploadedAt = new Date().toISOString();
        save();
        refreshActiveProfileSection();
      });
    };
  });
  document.querySelectorAll('[data-profile-training-noexpiry]').forEach(input => {
    if (input.dataset.boundNoExpiry) return;
    input.dataset.boundNoExpiry = '1';
    input.onchange = () => {
      const card = input.closest('[data-profile-training-doc]');
      if (!card) return;
      const record = userDocumentRecordFor(card.dataset.userId, card.dataset.reqId);
      record.noExpiry = input.checked;
      if (input.checked) {
        record.expiryDate = '';
        record.expiry = '';
      }
      save();
      refreshActiveProfileSection();
    };
  });
  document.querySelectorAll('[data-profile-training-expiry]').forEach(input => {
    if (input.dataset.boundExpiry) return;
    input.dataset.boundExpiry = '1';
    input.onchange = () => {
      const card = input.closest('[data-profile-training-doc]');
      if (!card) return;
      const record = userDocumentRecordFor(card.dataset.userId, card.dataset.reqId);
      record.expiryDate = input.value;
      record.expiry = input.value;
      record.noExpiry = false;
      save();
      refreshActiveProfileSection();
    };
  });
  document.querySelectorAll('[data-training-doc-thumb]').forEach(button => {
    if (button.dataset.boundDocThumb) return;
    button.dataset.boundDocThumb = '1';
    button.onclick = event => {
      event.stopPropagation();
      openProfileDocumentViewer(userDocumentRecords().find(record => record.id === button.dataset.trainingDocThumb));
    };
  });
}

function bindAvailabilityEditor() {
  document.querySelectorAll('[data-availability-allday]').forEach(input => {
    if (input.dataset.boundAvailability) return;
    input.dataset.boundAvailability = '1';
    input.onchange = () => {
      const key = parseAvailabilityKey(input.dataset.availabilityAllday);
      const user = state.users.find(item => item.id === key.userId);
      if (!user) return;
      const availability = migrateAvailability(user);
      availability[key.dayKey].allDay = input.checked;
      save();
    };
  });
  document.querySelectorAll('[data-availability-start],[data-availability-end]').forEach(select => {
    if (select.dataset.boundAvailability) return;
    select.dataset.boundAvailability = '1';
    select.onchange = () => {
      const row = select.closest('[data-availability-range]');
      const key = parseAvailabilityKey(row && row.dataset.availabilityRange);
      const user = state.users.find(item => item.id === key.userId);
      if (!user) return;
      const availability = migrateAvailability(user);
      availability[key.dayKey].ranges[key.index] = availability[key.dayKey].ranges[key.index] || { start: '09:00', end: '17:00' };
      availability[key.dayKey].ranges[key.index].start = row.querySelector('[data-availability-start]').value;
      availability[key.dayKey].ranges[key.index].end = row.querySelector('[data-availability-end]').value;
      availability[key.dayKey].allDay = false;
      const allDay = document.querySelector(`[data-availability-allday="${key.userId}|${key.dayKey}"]`);
      if (allDay) allDay.checked = false;
      save();
    };
  });
  document.querySelectorAll('[data-availability-add]').forEach(button => {
    if (button.dataset.boundAvailability) return;
    button.dataset.boundAvailability = '1';
    button.onclick = () => {
      const key = parseAvailabilityKey(button.dataset.availabilityAdd);
      const user = state.users.find(item => item.id === key.userId);
      if (!user) return;
      const availability = migrateAvailability(user);
      availability[key.dayKey].allDay = false;
      availability[key.dayKey].ranges.push({ start: '09:00', end: '17:00' });
      save();
      refreshActiveProfileSection();
    };
  });
  document.querySelectorAll('[data-availability-remove]').forEach(button => {
    if (button.dataset.boundAvailability) return;
    button.dataset.boundAvailability = '1';
    button.onclick = () => {
      const key = parseAvailabilityKey(button.dataset.availabilityRemove);
      const user = state.users.find(item => item.id === key.userId);
      if (!user) return;
      const availability = migrateAvailability(user);
      availability[key.dayKey].ranges.splice(key.index, 1);
      save();
      refreshActiveProfileSection();
    };
  });
}

function bindCentralUsers() {
  const search = document.getElementById('centralPeopleSearch');
  if (search) { search.oninput = drawCentralPeopleList; drawCentralPeopleList(); }
  document.querySelectorAll('[data-new-user]').forEach(btn => btn.onclick = openCentralAddUserModal);
  document.querySelectorAll('[data-users-back]').forEach(btn => btn.onclick = () => { centralUserPanel = 'list'; centralUserProfileId = null; centralUserActiveSection = 'personal'; render(); });
  document.querySelectorAll('[data-central-section]').forEach(btn => btn.onclick = () => {
    centralUserActiveSection = btn.dataset.centralSection || 'personal';
    render();
  });
  bindTrainingDocumentControls();
  bindAvailabilityEditor();
}

const previousBindForCentralUsers = bind;
bind = function bindWithCentralUsers() {
  previousBindForCentralUsers();
  bindCentralUsers();
};

if (Array.isArray(state.users)) {
  let changed = false;
  state.users.forEach(user => {
    if (!user.employmentType) {
      user.employmentType = 'Employee';
      changed = true;
    }
    const before = JSON.stringify(user.availability || {});
    migrateAvailability(user);
    if (JSON.stringify(user.availability || {}) !== before) changed = true;
  });
  getUserDocRequirements();
  if (changed) save();
}
