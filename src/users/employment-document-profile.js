// Employment type rules and staff-document buttons in user profiles.
(function employmentDocumentProfilePatch() {
  if (window.__employmentDocumentProfilePatchV1) return;
  window.__employmentDocumentProfilePatchV1 = true;

  const DOC_REQ_KEY = 'complianceUserDocumentRequirementsV1';
  const CONTRACT_TITLE = 'Signed Contract';

  function safe(value) {
    try { return esc(value); } catch (_) {
      return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
    }
  }
  function normalise(value) { return String(value || '').trim().toLowerCase(); }
  function employmentType(user) { return user && user.employmentType === 'Contractor' ? 'Contractor' : 'Employee'; }
  function allStaffGroups() { return ['FOH', 'Bar', 'Kitchen', 'Office', 'WFH', 'Housekeeping', 'KP', 'Kitchen PotWash', 'Staff', 'Supervisor', 'Admin']; }
  function kitchenGroups() { return ['Kitchen', 'KP', 'Kitchen PotWash']; }
  function stableId(title) { return 'req_' + String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  function defaultRequirements() {
    return [
      ['New Starter Pay Information', allStaffGroups(), 'none'],
      ['New Starter Medical Questionnaire', allStaffGroups(), 'none'],
      ['Piston Club Handbook Declaration', allStaffGroups(), 'none'],
      ['Fire Safety & Training', allStaffGroups(), 'none'],
      ['Food Allergy and Intolerance', allStaffGroups(), 'none'],
      ['Safer Food Better Business Health & Safety Awareness', allStaffGroups(), 'none'],
      [CONTRACT_TITLE, allStaffGroups(), 'none'],
      ['Working Hours Opt Out', allStaffGroups(), 'none'],
      ['Kitchen Oil & Fryer Training', kitchenGroups(), 'none'],
      ['Food Safety & Hygiene Level 2', kitchenGroups(), 'optional'],
      ['Challenge 25 Training', [], 'none'],
      ['COSHH Awareness', [], 'none'],
      ['Fire Marshal', [], 'optional'],
      ['Food Safety & Hygiene Level 3', [], 'optional'],
      ['HACCP', [], 'optional'],
      ['First Aid', [], 'optional'],
      ['Cellar Management', [], 'none']
    ].map(([title, staffGroups, expiryMode]) => ({ id: stableId(title), title, staffGroups, expiryMode }));
  }
  function migrateRequirement(req) {
    const title = normalise(req.title);
    if (title === 'signed contract') return { ...req, id: req.id || stableId(CONTRACT_TITLE), staffGroups: allStaffGroups(), expiryMode: 'none' };
    if (title === 'working hours opt out') return { ...req, id: req.id || stableId('Working Hours Opt Out'), staffGroups: allStaffGroups(), expiryMode: 'none' };
    return { ...req, id: req.id || stableId(req.title) };
  }
  function getRequirements() {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(DOC_REQ_KEY) || '[]');
      if (Array.isArray(parsed)) saved = parsed;
    } catch (_) {}
    const byTitle = new Map(saved.map(migrateRequirement).map(req => [normalise(req.title), req]));
    defaultRequirements().forEach(req => { if (!byTitle.has(normalise(req.title))) byTitle.set(normalise(req.title), req); });
    const merged = Array.from(byTitle.values());
    try { localStorage.setItem(DOC_REQ_KEY, JSON.stringify(merged)); } catch (_) {}
    return merged;
  }
  function userGroupKeys(user) {
    return new Set([user && user.jobArea, user && user.area, user && user.role, user && user.permissionSetId, 'Staff', 'All staff'].map(normalise).filter(Boolean));
  }
  function appliesToUser(req, user) {
    if (!req || !user) return false;
    if (normalise(req.title) === 'signed contract' && employmentType(user) === 'Contractor') return false;
    const groups = Array.isArray(req.staffGroups) ? req.staffGroups : [];
    if (!groups.length) return false;
    const keys = userGroupKeys(user);
    return groups.some(group => keys.has(normalise(group)) || normalise(group) === 'staff' || normalise(group) === 'all staff');
  }
  function userDocs() { state.userRequiredDocuments = state.userRequiredDocuments || []; return state.userRequiredDocuments; }
  function recordFor(userId, requirementId) { return userDocs().find(record => record.userId === userId && record.requirementId === requirementId); }
  function ensureRecord(userId, requirementId) {
    let record = recordFor(userId, requirementId);
    if (!record) { record = { id: uid(), userId, requirementId }; userDocs().push(record); }
    return record;
  }
  function linkedRequirements(user) {
    const reqs = getRequirements();
    const required = reqs.filter(req => appliesToUser(req, user));
    const byId = new Map(required.map(req => [req.id, req]));
    userDocs().filter(record => record.userId === user.id && record.requirementId).forEach(record => {
      const req = reqs.find(item => item.id === record.requirementId);
      if (req && !byId.has(req.id)) byId.set(req.id, req);
    });
    if (employmentType(user) === 'Contractor') {
      const contract = reqs.find(req => normalise(req.title) === 'signed contract');
      if (contract) byId.set(contract.id, contract);
    }
    return Array.from(byId.values());
  }
  function expiryText(record) {
    if (record && record.noExpiry) return 'Does not expire';
    return record && record.expiryDate ? 'Expires ' + record.expiryDate : 'No expiry set';
  }
  function statusLabel(record, required) {
    if (record && record.fileData) return record.noExpiry || record.expiryDate ? 'Uploaded' : 'Uploaded · needs expiry';
    return required ? 'Required' : 'Optional';
  }
  function statusClass(record, required) {
    if (record && record.fileData && (record.noExpiry || record.expiryDate)) return 'complete';
    if (record && record.fileData) return 'warn';
    return required ? 'danger' : 'warn';
  }
  function docButton(user, req) {
    const required = appliesToUser(req, user);
    const record = recordFor(user.id, req.id) || {};
    const key = user.id + '|' + req.id;
    return '<article class="fdoc userProfileDocumentButton" data-profile-doc="' + safe(key) + '">' +
      '<button type="button" class="fdocBar" data-profile-doc-open="' + safe(key) + '">' +
        '<span class="fdocIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg></span>' +
        '<span class="fdocName"><strong>' + safe(req.title) + '</strong><em>' + safe(statusLabel(record, required)) + '</em></span>' +
        '<span class="fdocBadge ' + statusClass(record, required) + '">' + safe(required ? 'Required' : 'Optional') + '</span>' +
        '<span class="fdocDate">' + safe(expiryText(record)) + '</span>' +
        '<span class="fdocArrow" aria-hidden="true">⌄</span>' +
      '</button>' +
    '</article>';
  }
  function staffDocumentList(user) {
    const docs = linkedRequirements(user);
    if (!docs.length) return '<p class="muted">No staff documents linked to this profile.</p>';
    return '<div class="staffProfileDocumentsList">' + docs.map(req => docButton(user, req)).join('') + '</div>';
  }
  function openDocUpload(key) {
    const [userId, requirementId] = String(key || '').split('|');
    const user = state.users.find(item => item.id === userId);
    const req = getRequirements().find(item => item.id === requirementId);
    if (!user || !req) return;
    const record = recordFor(userId, requirementId) || {};
    modalRoot.innerHTML = '<div class="modalCard reportModalCard"><button class="close" id="closeModal" type="button">×</button><h2>' + safe(req.title) + '</h2><p class="muted">' + safe(user.nickname || user.name) + ' · ' + safe(appliesToUser(req, user) ? 'Required' : 'Optional') + '</p><form id="profileDocUploadForm" class="stack">' +
      (record.fileName ? '<p>Current file: ' + safe(record.fileName) + '</p>' : '<p class="muted">No file uploaded yet.</p>') +
      '<input name="file" type="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg">' +
      '<label class="checkline"><input type="checkbox" name="noExpiry" ' + (record.noExpiry || req.expiryMode === 'none' ? 'checked' : '') + '> No Expiry Date</label>' +
      '<label>Expiry date<input name="expiryDate" type="date" value="' + safe(record.expiryDate || '') + '" ' + (record.noExpiry || req.expiryMode === 'none' ? 'disabled' : '') + '></label>' +
      '<button class="primary">Save document</button></form></div>';
    modalRoot.classList.remove('hidden');
    const close = document.getElementById('closeModal');
    if (close) close.onclick = () => modalRoot.classList.add('hidden');
    const form = document.getElementById('profileDocUploadForm');
    const noExpiry = form.querySelector('[name="noExpiry"]');
    const expiry = form.querySelector('[name="expiryDate"]');
    noExpiry.onchange = () => { expiry.disabled = noExpiry.checked; if (noExpiry.checked) expiry.value = ''; };
    form.onsubmit = event => {
      event.preventDefault();
      const file = form.querySelector('[name="file"]').files[0];
      const saveRecord = fileData => {
        const target = ensureRecord(userId, requirementId);
        target.fileName = file ? file.name : target.fileName || '';
        target.fileType = file ? file.type : target.fileType || '';
        target.fileData = fileData || target.fileData || '';
        target.noExpiry = noExpiry.checked;
        target.expiryDate = noExpiry.checked ? '' : expiry.value;
        target.updatedAt = new Date().toISOString();
        save();
        modalRoot.classList.add('hidden');
        render();
      };
      if (file) {
        const reader = new FileReader();
        reader.onload = () => saveRecord(reader.result);
        reader.readAsDataURL(file);
      } else {
        saveRecord('');
      }
    };
  }
  function addEmploymentFieldToModal() {
    const form = document.getElementById('editUserForm');
    if (!form || form.querySelector('[name="employmentType"]')) return;
    const currentUserId = window.__returnToUserProfileId;
    const targetUser = state.users.find(user => user.id === currentUserId) || state.users.find(user => String(user.name || '') === String(form.querySelector('[name="name"]')?.value || ''));
    const selected = employmentType(targetUser || {});
    const wrapper = document.createElement('label');
    wrapper.className = 'editUserField';
    wrapper.innerHTML = '<span>Employment type</span><select name="employmentType"><option ' + (selected === 'Employee' ? 'selected' : '') + '>Employee</option><option ' + (selected === 'Contractor' ? 'selected' : '') + '>Contractor</option></select>';
    const before = form.querySelector('[name="role"]')?.closest('label') || form.querySelector('[name="role"]');
    if (before && before.parentNode) before.parentNode.insertBefore(wrapper, before);
    else form.appendChild(wrapper);
  }
  if (typeof openUserEditor === 'function' && !openUserEditor.__employmentTypeWrapped) {
    const previousOpenUserEditor = openUserEditor;
    openUserEditor = function employmentTypeOpenUserEditor(id) {
      previousOpenUserEditor(id);
      setTimeout(addEmploymentFieldToModal, 0);
    };
    openUserEditor.__employmentTypeWrapped = true;
  }
  if (typeof openCentralAddUserModal === 'function' && !openCentralAddUserModal.__employmentTypeWrapped) {
    openCentralAddUserModal = function openCentralAddUserModalWithEmploymentType() {
      if (!isAdminUser()) return;
      modalRoot.innerHTML = '<div class="modalCard userModalCard"><button class="close" id="closeModal" type="button">×</button><h2>Add User</h2><form id="centralAddUserForm" class="stack"><input name="name" placeholder="Full name" required><input name="nickname" placeholder="Nickname shown on rota/checks" required><input name="email" type="email" placeholder="Email"><select name="employmentType"><option>Employee</option><option>Contractor</option></select><select name="role">' + optionList(['Staff', 'Supervisor', 'Admin'], 'Staff') + '</select><select name="area">' + optionList(state.areas, state.areas[0] || '') + '</select><button class="primary">Add User</button></form></div>';
      modalRoot.classList.remove('hidden');
      const close = document.getElementById('closeModal');
      if (close) close.onclick = () => modalRoot.classList.add('hidden');
      const form = document.getElementById('centralAddUserForm');
      if (form) form.onsubmit = event => {
        const data = fd(event);
        state.users.push({ id: uid(), name: data.name, nickname: data.nickname, email: data.email || '', employmentType: data.employmentType || 'Employee', role: data.role || 'Staff', area: data.area || '', jobArea: data.area || '', permissionSetId: data.role || 'Staff', accountStatus: 'confirmed' });
        save();
        modalRoot.classList.add('hidden');
        render();
      };
    };
    openCentralAddUserModal.__employmentTypeWrapped = true;
  }
  if (typeof centralProfileDetail === 'function' && !centralProfileDetail.__employmentDocumentProfileWrapped) {
    const previousCentralProfileDetail = centralProfileDetail;
    centralProfileDetail = function centralProfileDetailWithEmploymentDocs(user, section, shifts, training, docs, availabilityText) {
      if (section === 'employment') {
        return '<h2>Employment / rota details</h2><div class="listItem"><p>Employment type: ' + safe(employmentType(user)) + '</p><p>Job area: ' + safe(user.jobArea || user.area || '') + '</p><p>Role: ' + safe(user.role || '') + '</p><p>Permission set: ' + safe(user.permissionSetId || '') + '</p><p>Pay rate: £' + Number(user.wage || 0).toFixed(2) + '</p><p>Account status: ' + safe(user.accountStatus || '') + '</p></div>';
      }
      if (section === 'training') {
        return '<h2>Training & Staff Documents</h2><h3>Staff documents</h3>' + staffDocumentList(user) + '<h3>Training records</h3>' + (training.length ? training.map(t => '<div class="listItem"><strong>' + safe(t.course) + '</strong><p>' + safe(t.status) + (t.expiry ? ' · Expires ' + safe(t.expiry) : '') + '</p><p class="muted">' + safe(t.evidence || '') + '</p></div>').join('') : '<p class="muted">No training records.</p>');
      }
      return previousCentralProfileDetail(user, section, shifts, training, docs, availabilityText);
    };
    centralProfileDetail.__employmentDocumentProfileWrapped = true;
  }
  if (Array.isArray(state.users)) {
    let changed = false;
    state.users.forEach(user => { if (!user.employmentType) { user.employmentType = 'Employee'; changed = true; } });
    getRequirements();
    if (changed) save();
  }
  const style = document.createElement('style');
  style.textContent = '#modal.userInfoModalOpen .userModalEditCog{background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0!important;color:#d0ad58!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important}#modal.userInfoModalOpen .userModalTabs{display:flex!important;grid-template-columns:none!important;gap:4px!important;overflow-x:auto!important;scrollbar-width:none!important;padding:0 0 2px!important}#modal.userInfoModalOpen .userModalTabs::-webkit-scrollbar{display:none!important}#modal.userInfoModalOpen .userModalTabs button{flex:1 0 auto!important;min-height:30px!important;height:30px!important;border-radius:10px!important;font-size:10px!important;line-height:1!important;padding:3px 7px!important;white-space:nowrap!important}.staffProfileDocumentsList{display:grid!important;gap:10px!important}.userProfileDocumentButton{padding:0!important}.userProfileDocumentButton .fdocBar{width:100%!important}';
  document.head.appendChild(style);
  const previousBind = bind;
  bind = function employmentDocumentProfileBind() {
    previousBind();
    document.querySelectorAll('[data-profile-doc-open]').forEach(button => {
      button.onclick = () => openDocUpload(button.getAttribute('data-profile-doc-open'));
    });
    addEmploymentFieldToModal();
  };
})();