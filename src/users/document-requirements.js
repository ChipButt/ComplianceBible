// Required user documents by staff group, with user upload records and expiry/no-expiry support.
(function userDocumentRequirementsPatch() {
  const DOC_REQ_KEY = 'complianceUserDocumentRequirementsV1';

  function allStaffGroups() {
    return ['FOH', 'Bar', 'Kitchen', 'Office', 'WFH', 'Housekeeping', 'KP', 'Kitchen PotWash', 'Staff', 'Supervisor', 'Admin'];
  }
  function kitchenStaffGroups() {
    return ['Kitchen', 'KP', 'Kitchen PotWash'];
  }
  function defaultDocRequirements() {
    return [
      { id: uid(), title: 'New Starter Pay Information', staffGroups: allStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'New Starter Medical Questionnaire', staffGroups: allStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'Piston Club Handbook Declaration', staffGroups: allStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'Fire Safety & Training', staffGroups: allStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'Food Allergy and Intolerance', staffGroups: allStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'Safer Food Better Business Health & Safety Awareness', staffGroups: allStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'Kitchen Oil & Fryer Training', staffGroups: kitchenStaffGroups(), expiryMode: 'none' },
      { id: uid(), title: 'Food Safety & Hygiene Level 2', staffGroups: kitchenStaffGroups(), expiryMode: 'optional' },
      { id: uid(), title: 'Signed Contract', staffGroups: [], expiryMode: 'none' },
      { id: uid(), title: 'Working Hours Opt Out', staffGroups: [], expiryMode: 'none' },
      { id: uid(), title: 'Challenge 25 Training', staffGroups: [], expiryMode: 'none' },
      { id: uid(), title: 'COSHH Awareness', staffGroups: [], expiryMode: 'none' },
      { id: uid(), title: 'Fire Marshal', staffGroups: [], expiryMode: 'optional' },
      { id: uid(), title: 'Food Safety & Hygiene Level 3', staffGroups: [], expiryMode: 'optional' },
      { id: uid(), title: 'HACCP', staffGroups: [], expiryMode: 'optional' },
      { id: uid(), title: 'First Aid', staffGroups: [], expiryMode: 'optional' },
      { id: uid(), title: 'Cellar Management', staffGroups: [], expiryMode: 'none' }
    ];
  }
  function normaliseTitle(value) {
    return String(value || '').trim().toLowerCase();
  }
  function migrateLegacyRequirement(req) {
    const title = normaliseTitle(req.title);
    if (title === 'food hygiene certificate') return { ...req, title: 'Food Safety & Hygiene Level 2', staffGroups: kitchenStaffGroups(), expiryMode: req.expiryMode || 'optional' };
    if (title === 'allergen awareness certificate') return { ...req, title: 'Food Allergy and Intolerance', staffGroups: allStaffGroups(), expiryMode: 'none' };
    if (title === 'right to work document') return { ...req, staffGroups: [], expiryMode: req.expiryMode || 'optional' };
    return req;
  }
  function mergeDefaultRequirements(saved) {
    const migrated = (Array.isArray(saved) ? saved : []).map(migrateLegacyRequirement);
    const byTitle = new Map(migrated.map(req => [normaliseTitle(req.title), req]));
    defaultDocRequirements().forEach(req => {
      const key = normaliseTitle(req.title);
      if (!byTitle.has(key)) byTitle.set(key, req);
    });
    return Array.from(byTitle.values());
  }
  function getDocRequirements() {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(DOC_REQ_KEY) || 'null');
      if (Array.isArray(parsed)) saved = parsed;
    } catch {}
    const merged = mergeDefaultRequirements(saved);
    localStorage.setItem(DOC_REQ_KEY, JSON.stringify(merged));
    return merged;
  }
  function saveDocRequirements(requirements) {
    localStorage.setItem(DOC_REQ_KEY, JSON.stringify(requirements));
  }
  function userGroup(user) {
    return user.jobArea || user.area || 'FOH';
  }
  function requiredDocsForUser(user) {
    const group = userGroup(user);
    return getDocRequirements().filter(req => (req.staffGroups || []).includes(group));
  }
  function getUserDocRecords(userId) {
    state.userRequiredDocuments = state.userRequiredDocuments || [];
    return state.userRequiredDocuments.filter(record => record.userId === userId);
  }
  function docRecordFor(userId, requirementId) {
    return getUserDocRecords(userId).find(record => record.requirementId === requirementId);
  }
  function groupOptions() {
    const groups = Array.from(new Set([...(state.areas || []), ...allStaffGroups()]));
    return groups.filter(Boolean);
  }

  function requirementSettingsPage() {
    const requirements = getDocRequirements();
    const groups = groupOptions();
    return `<h2>User document requirements</h2>
      <p class="muted">Choose which staff groups need which documents. User uploads are handled inside each user profile.</p>
      <div class="docList">${requirements.map(req => `<div class="docItem">
        <div><strong>${esc(req.title)}</strong><span>Required for: ${(req.staffGroups || []).map(esc).join(', ') || 'Optional / manually assign later'}</span><p>${req.expiryMode === 'none' ? 'No expiry required' : 'Expiry date or No Expiry Date option available'}</p></div>
        <div><button class="ghost small" data-edit-doc-req="${req.id}">Edit</button><button class="ghost small" data-delete-doc-req="${req.id}">Remove</button></div>
      </div>`).join('')}</div>
      <h3>Add required document</h3>
      <form id="docRequirementForm" class="stack">
        <input name="title" placeholder="Document name e.g. Personal Licence" required>
        <div class="docRequirementGroups">${groups.map(g => `<label class="checkLabel"><span>${esc(g)}</span><input type="checkbox" name="group_${esc(g)}"></label>`).join('')}</div>
        <label class="checkline"><input type="checkbox" name="noExpiry"> This document never expires</label>
        <button class="primary">Add document requirement</button>
      </form>`;
  }

  function openRequirementEditor(id) {
    const req = getDocRequirements().find(r => r.id === id);
    if (!req) return;
    const groups = groupOptions();
    modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>Edit required document</h2>
      <form id="editDocRequirementForm" class="stack">
        <input name="title" value="${esc(req.title)}" required>
        <div class="docRequirementGroups">${groups.map(g => `<label class="checkLabel"><span>${esc(g)}</span><input type="checkbox" name="group_${esc(g)}" ${(req.staffGroups || []).includes(g) ? 'checked' : ''}></label>`).join('')}</div>
        <label class="checkline"><input type="checkbox" name="noExpiry" ${req.expiryMode === 'none' ? 'checked' : ''}> This document never expires</label>
        <button class="primary">Save requirement</button>
      </form>
    </div>`;
    modalRoot.classList.remove('hidden');
    document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
    document.getElementById('editDocRequirementForm').onsubmit = event => {
      const data = fd(event);
      const all = getDocRequirements();
      const item = all.find(r => r.id === id);
      item.title = data.title;
      item.staffGroups = groups.filter(g => data[`group_${g}`] === 'on');
      item.expiryMode = data.noExpiry ? 'none' : 'optional';
      saveDocRequirements(all);
      modalRoot.classList.add('hidden');
      render();
    };
  }

  function userRequiredDocumentsBlock(user) {
    const required = requiredDocsForUser(user);
    if (!required.length) return '<p class="muted">No required documents for this staff group.</p>';
    return `<div class="requiredDocsList">${required.map(req => {
      const record = docRecordFor(user.id, req.id);
      const status = record ? (record.noExpiry ? 'Uploaded · No expiry date' : `Uploaded · Expires ${esc(record.expiryDate || 'not set')}`) : 'Missing';
      return `<div class="listItem requiredDocItem">
        <strong>${esc(req.title)}</strong>
        <p class="muted">${status}</p>
        ${record?.fileName ? `<p>File: ${esc(record.fileName)}</p>` : ''}
        <form class="userDocUploadForm stack" data-user-doc-upload="${user.id}|${req.id}">
          <input name="file" type="file" accept="image/*,.pdf,.doc,.docx">
          <label class="checkline"><input type="checkbox" name="noExpiry" ${record?.noExpiry || req.expiryMode === 'none' ? 'checked' : ''}> No Expiry Date</label>
          <label>Expiry date<input name="expiryDate" type="date" value="${esc(record?.expiryDate || '')}" ${record?.noExpiry || req.expiryMode === 'none' ? 'disabled' : ''}></label>
          <button class="primary small">Save document</button>
        </form>
      </div>`;
    }).join('')}</div>`;
  }

  const previousSettingsContentForDocs = settingsContent;
  settingsContent = function settingsContentWithDocRequirements() {
    if (settingsTab === 'userDocs') return requirementSettingsPage();
    return previousSettingsContentForDocs();
  };

  const previousSettingsForDocs = settings;
  settings = function settingsWithDocRequirements() {
    if (!isAdminUser()) return previousSettingsForDocs();
    return `<section class="hero card"><div><p class="eyebrow">Admin only</p><h2>Settings</h2><p>Configuration lives here. Normal staff screens are kept clean for completing checks and logs.</p></div>${badge('Admin area', 'ok')}</section>
    <section class="card">
      <nav class="mainNav settingsOnlyNav">
        ${settingsTabButton('checks', 'Checklists')}
        ${settingsTabButton('users', 'Users')}
        ${settingsTabButton('userDocs', 'Required Docs')}
        ${settingsTabButton('documents', 'Documents')}
        ${settingsTabButton('areas', 'Areas')}
        ${settingsTabButton('rota', 'Rota setup')}
        ${settingsTabButton('pub', 'Pub details')}
      </nav>
      ${settingsContent()}
    </section>`;
  };

  const previousCentralProfileDetail = centralProfileDetail;
  centralProfileDetail = function centralProfileDetailWithRequiredDocs(user, section, shifts, training, docs, availabilityText) {
    if (section === 'training') {
      return `<h2>Training & required documents</h2>
        <h3>Required documents</h3>${userRequiredDocumentsBlock(user)}
        <h3>Training records</h3>${training.length ? training.map(t => `<div class="listItem"><strong>${esc(t.course)}</strong><p>${esc(t.status)}${t.expiry ? ' · Expires ' + esc(t.expiry) : ''}</p><p class="muted">${esc(t.evidence || '')}</p></div>`).join('') : '<p class="muted">No training records.</p>'}
        <h3>Other training document records</h3>${docs.length ? docs.map(d => `<div class="listItem"><strong>${esc(d.title)}</strong><p class="muted">${esc(d.note || '')}</p></div>`).join('') : '<p class="muted">No extra training document records.</p>'}`;
    }
    return previousCentralProfileDetail(user, section, shifts, training, docs, availabilityText);
  };

  function bindDocRequirementEvents() {
    document.querySelectorAll('[data-edit-doc-req]').forEach(btn => btn.onclick = () => openRequirementEditor(btn.dataset.editDocReq));
    document.querySelectorAll('[data-delete-doc-req]').forEach(btn => btn.onclick = () => {
      saveDocRequirements(getDocRequirements().filter(req => req.id !== btn.dataset.deleteDocReq));
      render();
    });
    on('docRequirementForm', event => {
      const data = fd(event);
      const groups = groupOptions();
      const all = getDocRequirements();
      all.push({ id: uid(), title: data.title, staffGroups: groups.filter(g => data[`group_${g}`] === 'on'), expiryMode: data.noExpiry ? 'none' : 'optional' });
      saveDocRequirements(all);
      render();
    });
    document.querySelectorAll('[data-user-doc-upload]').forEach(form => {
      const noExpiry = form.querySelector('[name="noExpiry"]');
      const expiry = form.querySelector('[name="expiryDate"]');
      if (noExpiry && expiry) noExpiry.onchange = () => { expiry.disabled = noExpiry.checked; if (noExpiry.checked) expiry.value = ''; };
      form.onsubmit = event => {
        event.preventDefault();
        const [userId, requirementId] = form.dataset.userDocUpload.split('|');
        const file = form.querySelector('[name="file"]').files[0];
        const noExpiryValue = form.querySelector('[name="noExpiry"]').checked;
        const expiryDate = noExpiryValue ? '' : form.querySelector('[name="expiryDate"]').value;
        const saveRecord = fileData => {
          state.userRequiredDocuments = state.userRequiredDocuments || [];
          let record = state.userRequiredDocuments.find(r => r.userId === userId && r.requirementId === requirementId);
          if (!record) {
            record = { id: uid(), userId, requirementId };
            state.userRequiredDocuments.push(record);
          }
          record.fileName = file?.name || record.fileName || '';
          record.fileType = file?.type || record.fileType || '';
          record.fileData = fileData || record.fileData || '';
          record.noExpiry = noExpiryValue;
          record.expiryDate = expiryDate;
          record.updatedAt = new Date().toISOString();
          save();
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
    });
  }

  const previousBindForUserDocs = bind;
  bind = function bindWithUserDocumentRequirements() {
    previousBindForUserDocs();
    bindDocRequirementEvents();
  };
})();