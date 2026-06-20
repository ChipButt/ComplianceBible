// Final shared document upload system. Single source of truth for all document upload UI.
(function () {
  if (window.__finalDocumentSystemClean8) return;
  window.__finalDocumentSystemClean8 = true;

  const REQ_KEY = 'complianceUserDocumentRequirementsV1';
  const openCards = {};
  const editCards = {};
  const selectedDocFilters = new Set();
  const baseFilterLabels = ['Premises documents','Staff documents','Licensing','Food Safety','Fire Safety','Health & Safety','Staff','Equipment','Allergen Awareness','Food Hygiene','Challenge 25','Right to Work'];

  const icon = {
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5z"/><path d="M8 3v4M16 3v4M5 10h14"/></svg>'
  };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function uidx() { try { return uid(); } catch { return 'id_' + Math.random().toString(36).slice(2); } }
  function isAdminNow() { try { return typeof isAdminUser === 'function' && isAdminUser(); } catch { return false; } }
  function defaultReqs() {
    return [
      { id: uidx(), title: 'Right to Work document', staffGroups: ['FOH', 'Kitchen', 'Office', 'WFH', 'Housekeeping', 'KP', 'Kitchen PotWash'], expiryMode: 'optional' },
      { id: uidx(), title: 'Food Hygiene certificate', staffGroups: ['Kitchen', 'KP', 'Kitchen PotWash'], expiryMode: 'optional' },
      { id: uidx(), title: 'Allergen Awareness certificate', staffGroups: ['FOH', 'Kitchen', 'KP', 'Kitchen PotWash'], expiryMode: 'optional' }
    ];
  }
  function reqs() {
    try {
      const saved = JSON.parse(localStorage.getItem(REQ_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    const defaults = defaultReqs();
    try { localStorage.setItem(REQ_KEY, JSON.stringify(defaults)); } catch {}
    return defaults;
  }
  function norm(value) { return String(value || '').trim().toLowerCase(); }
  function group(user) { return user.jobArea || user.area || user.role || user.permissionSetId || 'FOH'; }
  function userGroupKeys(user) {
    return new Set([user.jobArea, user.area, user.role, user.permissionSetId, 'Staff', 'All staff'].map(norm).filter(Boolean));
  }
  function requirementAppliesToUser(req, user) {
    const groups = Array.isArray(req.staffGroups) ? req.staffGroups : [];
    if (!groups.length) return false;
    const keys = userGroupKeys(user);
    return groups.some(g => keys.has(norm(g)) || norm(g) === 'all staff' || norm(g) === 'staff');
  }
  function userDocs() { state.userRequiredDocuments = state.userRequiredDocuments || []; return state.userRequiredDocuments; }
  function saveNow() { try { save(); } catch {} }
  function readFile(file, done) { const r = new FileReader(); r.onload = () => done(r.result || ''); r.readAsDataURL(file); }
  function image(record) { return String(record?.fileType || '').startsWith('image/') || String(record?.fileData || '').startsWith('data:image/'); }
  function confirmed(record) { return !!(record?.fileData && (record.noExpiry || record.expiryDate || record.expiry)); }
  function status(record, required) { if (confirmed(record)) return ['', 'complete']; if (record?.fileData) return ['Uploaded','warn']; return [required ? 'Required' : 'Missing','danger']; }
  function statusText(record, required) {
    const s = status(record, required);
    if (s[0]) return s[0];
    return confirmed(record) ? 'Stored' : (required ? 'Required' : 'Missing');
  }
  function expiryText(record) {
    if (record?.noExpiry) return 'Does not expire';
    const raw = record?.expiryDate || record?.expiry;
    if (!raw) return 'No expiry set';
    try { return new Date(raw + 'T12:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); } catch { return raw; }
  }
  function getUserRecord(userId, reqId) {
    let r = userDocs().find(x => x.userId === userId && x.requirementId === reqId);
    if (!r) { r = { id: uidx(), userId, requirementId: reqId }; userDocs().push(r); }
    return r;
  }
  function getRecord(kind, key) {
    if (kind === 'premises') return (state.docs || []).find(d => d.id === key);
    const parts = key.split('|'); return getUserRecord(parts[0], parts[1]);
  }
  function filterKey(value) { return String(value || '').toLowerCase(); }
  function selectedFilters() { return Array.from(selectedDocFilters); }
  function hasSectionFilter(label) { return selectedFilters().some(v => filterKey(v) === filterKey(label)); }
  function hasOnlySectionFilter(label) {
    const filters = selectedFilters();
    return filters.length && filters.every(v => filterKey(v) === filterKey(label));
  }
  function matchesSelectedFilters(kind, text) {
    const filters = selectedFilters();
    if (!filters.length) return true;
    const haystack = filterKey(text);
    return filters.some(value => {
      const selected = filterKey(value);
      if (selected === 'premises documents') return kind === 'premises';
      if (selected === 'staff documents') return kind === 'userdoc';
      return haystack.includes(selected);
    });
  }
  function allFilterLabels() {
    const labels = [...baseFilterLabels];
    reqs().forEach(req => {
      if (req.title && !labels.some(label => filterKey(label) === filterKey(req.title))) labels.push(req.title);
    });
    return labels;
  }
  function allRecords() { return (state.docs || []).concat(state.userRequiredDocuments || []); }
  function thumb(record) {
    if (!record?.fileData) return '<button type="button" class="fdocThumb empty" data-fdoc-thumb="">No document</button>';
    if (image(record)) return '<button type="button" class="fdocThumb" data-fdoc-thumb="' + esc(record.id) + '"><img src="' + record.fileData + '" alt="Document preview"></button>';
    return '<button type="button" class="fdocThumb file" data-fdoc-thumb="' + esc(record.id) + '">DOC</button>';
  }

  function docCategoryOptions(selected) {
    const cats = (state.documentCategories || ['Licensing','Food Safety','Fire Safety','Health & Safety','Equipment']).filter(cat => filterKey(cat) !== 'staff');
    return cats.map(cat => '<option value="' + esc(cat) + '" ' + (cat === selected ? 'selected' : '') + '>' + esc(cat) + '</option>').join('');
  }
  function editForm(o, record, cardKey) {
    if (!isAdminNow() || o.kind !== 'premises' || !editCards[cardKey]) return '';
    return '<form class="fdocEditForm" data-fdoc-edit-form>' +
      '<label><span>Document title</span><input name="title" value="' + esc(record.title || o.title || '') + '" required></label>' +
      '<label><span>Section</span><select name="cat">' + docCategoryOptions(record.cat || o.cat || 'Licensing') + '</select></label>' +
      '<label><span>Notes</span><textarea name="notes">' + esc(record.notes || '') + '</textarea></label>' +
      '<button class="primary fdocSaveDocument" type="submit">Save Document</button>' +
      '<button class="fdocDeleteDocument" type="button" data-fdoc-delete-document>Delete Document</button>' +
    '</form>';
  }
  function card(o) {
    const record = o.record || {};
    const s = status(record, o.required);
    const cardKey = o.kind + ':' + o.key;
    const expanded = !!openCards[cardKey];
    const statusSubtitle = !!o.statusSubtitle;
    const subtitle = statusSubtitle ? statusText(record, o.required) : (o.cat || 'Document');
    const canEdit = isAdminNow() && o.kind === 'premises';
    const badge = (!statusSubtitle && s[0]) ? '<span class="fdocBadge ' + s[1] + '">' + esc(s[0]) + '</span>' : '<span class="fdocBadge fdocBadgeEmpty" aria-hidden="true"></span>';
    const cog = canEdit ? '<span class="fdocCog" role="button" tabindex="0" aria-label="Edit document" data-fdoc-edit>' + cogIcon() + '</span>' : badge;
    return '<article class="fdoc ' + (expanded ? 'open' : '') + '" data-fdoc-kind="' + esc(o.kind) + '" data-fdoc-key="' + esc(o.key) + '">' +
      '<button type="button" class="fdocBar" data-fdoc-toggle="' + esc(cardKey) + '">' +
        '<span class="fdocIcon">' + icon.doc + '</span>' +
        '<span class="fdocName"><strong>' + esc(o.title) + '</strong><em>' + esc(subtitle) + '</em></span>' +
        cog +
        '<span class="fdocDate">' + esc(expiryText(record)) + '</span>' +
        '<span class="fdocArrow" aria-hidden="true">⌄</span>' +
      '</button>' +
      '<div class="fdocPanel ' + (expanded ? '' : 'closed') + '">' +
        '<p class="fdocInstruction">' + esc(o.note || 'Upload a clear, current copy of this document.') + '</p>' +
        '<div class="fdocBody">' + thumb(record) +
          '<div class="fdocControls">' +
            '<div class="fdocUploads">' +
              '<label>' + icon.upload + '<span>Choose File</span><input type="file" data-fdoc-file accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label>' +
              '<label>' + icon.camera + '<span>Take Photo</span><input type="file" data-fdoc-photo accept="image/*" capture="environment"></label>' +
            '</div>' +
            '<div class="fdocMeta">' +
              '<label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input type="checkbox" data-fdoc-noexpiry ' + (record.noExpiry ? 'checked' : '') + '><span class="fdocSwitchTrack"></span></label>' +
              '<label class="fdocExpiry"><span class="fdocDateInputWrap">' + icon.calendar + '<span class="fdocExpiryText">Expiry Date</span><input type="date" data-fdoc-expiry value="' + esc((record.expiryDate || record.expiry) || '') + '" ' + (record.noExpiry ? 'disabled' : '') + '></span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +
        editForm(o, record, cardKey) +
      '</div>' +
    '</article>';
  }

  function cogIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"/><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A8.2 8.2 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"/></svg>';
  }

  window.approvedDocumentUI = {
    renderCard: card,
    getUserRecord,
    getRequirements: reqs,
    requirementAppliesToUser
  };

  function premisesItems() {
    if (hasOnlySectionFilter('Staff documents')) return [];
    return (state.docs || []).filter(d => matchesSelectedFilters('premises', (d.title || '') + ' ' + (d.cat || '')));
  }
  function staffItems() {
    if (hasOnlySectionFilter('Premises documents')) return [];
    return allStaffItems().filter(item => matchesSelectedFilters('userdoc', (item.title || '') + ' ' + (item.cat || '')));
  }
  function allStaffItems() {
    const out = [];
    (state.users || []).forEach(user => reqs().forEach(req => {
      const required = requirementAppliesToUser(req, user);
      const existing = userDocs().find(x => x.userId === user.id && x.requirementId === req.id);
      if (!required && !existing) return;
      const record = required ? getUserRecord(user.id, req.id) : existing;
      out.push({ kind:'userdoc', key:user.id + '|' + req.id, title:req.title, cat:(user.nickname || user.name) + ' · ' + group(user), record, required, note:'Upload evidence for ' + (user.nickname || user.name) + ' and set expiry status.' });
    }));
    return out;
  }
  function renderSection(title, items, emptyText, forceShow) {
    if (!items.length && !forceShow) return '';
    const body = items.length ? items.map(card).join('') : '<p class="muted">' + esc(emptyText) + '</p>';
    return '<section class="fdocSection"><h2>' + esc(title) + '</h2>' + body + '</section>';
  }
  function uniqueLabels(labels) {
    const seen = new Set();
    return labels.filter(label => { const key = filterKey(label); if (!key || seen.has(key)) return false; seen.add(key); return true; });
  }
  function groupLabels() {
    return uniqueLabels(['Premises documents','Staff documents'].concat((state.docs || []).map(doc => doc.cat || 'Document'), reqs().map(req => req.title)));
  }
  function itemsForGroup(label) {
    const key = filterKey(label);
    if (key === 'premises documents') return (state.docs || []).map(d => ({ kind:'premises', key:d.id, title:d.title, cat:d.cat, record:d, required:true, statusSubtitle:true, note:d.notes || 'Upload a clear, current copy and set expiry status.' }));
    if (key === 'staff documents') return allStaffItems();
    const premises = (state.docs || []).filter(d => filterKey((d.cat || '') + ' ' + (d.title || '')).includes(key)).map(d => ({ kind:'premises', key:d.id, title:d.title, cat:d.cat, record:d, required:true, statusSubtitle:true, note:d.notes || 'Upload a clear, current copy and set expiry status.' }));
    const staff = allStaffItems().filter(item => filterKey((item.title || '') + ' ' + (item.cat || '')).includes(key));
    return premises.concat(staff);
  }
  function groupButton(label) {
    return '<button type="button" class="docGroupButton" data-open-doc-group="' + esc(label) + '"><span>' + esc(label) + '</span><small>' + itemsForGroup(label).length + ' docs</small></button>';
  }
  function addForm() {
    if (!isAdminNow()) return '';
    return '<section class="panel addPremisesPanel"><details class="addPremisesDetails"><summary><span>Add premises document</span></summary><div class="addPremisesBody"><form id="finalDocAdd" class="stack"><input name="title" placeholder="Document title" required><select name="cat">' + docCategoryOptions('Licensing') + '</select><textarea name="notes" placeholder="Instructions, storage location or renewal notes"></textarea><div class="fdocUploads"><label>' + icon.upload + '<span>Choose File</span><input type="file" name="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>' + icon.camera + '<span>Take Photo</span><input type="file" name="photo" accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input name="noExpiry" type="checkbox"><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span class="fdocDateInputWrap">' + icon.calendar + '<span class="fdocExpiryText">Expiry Date</span><input name="expiry" type="date"></span></label></div><button class="primary">Add document</button></form></div></details></section>';
  }
  function premiseSectionItems(cat) {
    return (state.docs || []).filter(d => filterKey(d.cat || '') === filterKey(cat)).map(d => ({ kind:'premises', key:d.id, title:d.title, cat:d.cat, record:d, required:true, statusSubtitle:true, note:d.notes || 'Upload a clear, current copy and set expiry status.' }));
  }
  function premisesSections() {
    const categories = (state.documentCategories || ['Licensing','Food Safety','Fire Safety','Health & Safety','Equipment']).filter(cat => filterKey(cat) !== 'staff');
    return categories.map(cat => renderSection(cat, premiseSectionItems(cat), 'No documents in this section.', true)).join('');
  }
  documents = function () {
    return '<section class="docTopAction">' + groupButton('Staff Documents') + '</section><section class="docsPremises"><h2>Premises Documents</h2>' + premisesSections() + addForm() + '</section>';
  };

  function closeDocumentGroupModal() {
    modalRoot.classList.add('hidden');
    modalRoot.classList.remove('docGroupModalOpen');
    modalRoot.innerHTML = '';
    modalRoot.onclick = null;
  }
  function staffName(user) {
    return String(user?.name || user?.nickname || '').trim();
  }
  function staffRequirementButtons() {
    return reqs().slice().sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))).map(req => {
      const count = staffItemsForRequirement(req).length;
      return '<button type="button" class="docGroupButton staffDocRequirementButton" data-open-staff-doc-requirement="' + esc(req.id) + '"><span>' + esc(req.title) + '</span><small>' + count + ' staff</small></button>';
    }).join('');
  }
  function staffItemsForRequirement(req) {
    const users = (state.users || []).slice().sort((a, b) => staffName(a).localeCompare(staffName(b)));
    return users.map(user => {
      const required = requirementAppliesToUser(req, user);
      const existing = userDocs().find(x => x.userId === user.id && x.requirementId === req.id);
      if (!required && !existing) return null;
      const record = required ? getUserRecord(user.id, req.id) : existing;
      return { kind:'userdoc', key:user.id + '|' + req.id, title:staffName(user) || user.nickname || 'Staff member', cat:group(user) + ' · ' + req.title, record, required, statusSubtitle:true, note:'Upload evidence for ' + (staffName(user) || user.nickname || 'this staff member') + ' and set expiry status.' };
    }).filter(Boolean);
  }
  function openStaffDocumentsModal() {
    modalRoot.innerHTML = '<div class="modalCard docGroupModal" role="dialog" aria-modal="true"><div class="docGroupModalTop"><h2>Staff Documents</h2><button class="close" id="docGroupClose" type="button">×</button></div><div class="docGroupModalBody"><section class="docGroupGrid staffDocRequirementGrid">' + staffRequirementButtons() + '</section></div></div>';
    modalRoot.classList.add('docGroupModalOpen');
    modalRoot.classList.remove('hidden');
    document.getElementById('docGroupClose').onclick = closeDocumentGroupModal;
    modalRoot.onclick = event => { if (event.target === modalRoot) closeDocumentGroupModal(); };
    bindDocumentControls(modalRoot);
  }
  function openStaffRequirementModal(reqId) {
    const req = reqs().find(item => item.id === reqId);
    if (!req) return;
    const items = staffItemsForRequirement(req);
    modalRoot.innerHTML = '<div class="modalCard docGroupModal" role="dialog" aria-modal="true"><div class="docGroupModalTop"><h2>' + esc(req.title) + '</h2><button class="close" id="docGroupClose" type="button">×</button></div><div class="docGroupModalBody">' + renderSection(req.title, items, 'No staff documents for this requirement.', true) + '</div></div>';
    modalRoot.classList.add('docGroupModalOpen');
    modalRoot.classList.remove('hidden');
    document.getElementById('docGroupClose').onclick = closeDocumentGroupModal;
    modalRoot.onclick = event => { if (event.target === modalRoot) closeDocumentGroupModal(); };
    bindDocumentControls(modalRoot);
  }
  function openDocumentGroupModal(label) {
    if (filterKey(label) === 'staff documents') {
      openStaffDocumentsModal();
      return;
    }
    const items = itemsForGroup(label);
    modalRoot.innerHTML = '<div class="modalCard docGroupModal" role="dialog" aria-modal="true"><div class="docGroupModalTop"><h2>' + esc(label) + '</h2><button class="close" id="docGroupClose" type="button">×</button></div><div class="docGroupModalBody">' + renderSection(label, items, 'No documents in this group.', true) + '</div></div>';
    modalRoot.classList.add('docGroupModalOpen');
    modalRoot.classList.remove('hidden');
    document.getElementById('docGroupClose').onclick = closeDocumentGroupModal;
    modalRoot.onclick = event => { if (event.target === modalRoot) closeDocumentGroupModal(); };
    bindDocumentControls(modalRoot);
  }

  function viewer(record) {
    if (!record?.fileData) return;
    modalRoot.innerHTML = '<div class="modalCard evidenceViewerModal"><button class="close" id="fdocClose">×</button><h2>' + esc(record.fileName || 'Document evidence') + '</h2>' + (image(record) ? '<img class="fdocFull" src="' + record.fileData + '" alt="Document preview">' : '<div class="fdocFileBig">Document file</div><a class="ghost evidenceOpenLink" href="' + record.fileData + '" download="' + esc(record.fileName || 'document') + '">Open / Download</a>') + '</div>';
    modalRoot.classList.remove('hidden');
    document.getElementById('fdocClose').onclick = () => modalRoot.classList.add('hidden');
  }

  function bindDocumentControls(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-doc-group]').forEach(input => {
      input.onchange = () => {
        if (input.checked) selectedDocFilters.add(input.dataset.docGroup);
        else selectedDocFilters.delete(input.dataset.docGroup);
        render();
      };
    });
    scope.querySelectorAll('[data-open-doc-group]').forEach(btn => btn.onclick = () => openDocumentGroupModal(btn.dataset.openDocGroup));
    scope.querySelectorAll('[data-open-staff-doc-requirement]').forEach(btn => btn.onclick = () => openStaffRequirementModal(btn.dataset.openStaffDocRequirement));
    scope.querySelectorAll('[data-fdoc-toggle]').forEach(btn => btn.onclick = event => {
      if (event.target.closest('[data-fdoc-edit]')) return;
      const k = btn.dataset.fdocToggle;
      editCards[k] = false;
      const article = btn.closest('.fdoc');
      const panel = article && article.querySelector('.fdocPanel');
      const isOpen = !(article && article.classList.contains('open'));
      openCards[k] = isOpen;
      if (article) article.classList.toggle('open', isOpen);
      if (panel) panel.classList.toggle('closed', !isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    scope.querySelectorAll('[data-fdoc-edit]').forEach(btn => btn.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      const article = btn.closest('.fdoc');
      if (!article || article.dataset.fdocKind !== 'premises' || !isAdminNow()) return;
      const key = article.dataset.fdocKind + ':' + article.dataset.fdocKey;
      openCards[key] = true;
      editCards[key] = true;
      render();
    });
    scope.querySelectorAll('[data-fdoc-edit]').forEach(btn => btn.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') btn.onclick(event);
    });
    scope.querySelectorAll('[data-fdoc-file],[data-fdoc-photo]').forEach(input => input.onchange = () => {
      const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); const file = input.files[0]; if (!file) return;
      readFile(file, data => { r.fileData = data; r.fileName = file.name || 'Photo'; r.fileType = file.type || 'image/jpeg'; r.uploadedAt = new Date().toISOString(); saveNow(); render(); });
    });
    scope.querySelectorAll('[data-fdoc-noexpiry]').forEach(input => input.onchange = () => { const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); r.noExpiry = input.checked; if (input.checked) { r.expiryDate = ''; r.expiry = ''; } saveNow(); render(); });
    scope.querySelectorAll('[data-fdoc-expiry]').forEach(input => input.onchange = () => { const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); r.expiryDate = input.value; r.expiry = input.value; r.noExpiry = false; saveNow(); render(); });
    scope.querySelectorAll('[data-fdoc-thumb]').forEach(btn => btn.onclick = e => { e.stopPropagation(); viewer(allRecords().find(r => r.id === btn.dataset.fdocThumb)); });
    scope.querySelectorAll('[data-fdoc-edit-form]').forEach(form => {
      const article = form.closest('.fdoc');
      if (!article || article.dataset.fdocKind !== 'premises') return;
      const record = getRecord('premises', article.dataset.fdocKey);
      const expiryInput = form.elements.expiry;
      const noExpiry = form.elements.noExpiry;
      if (noExpiry && expiryInput) noExpiry.onchange = () => { expiryInput.disabled = noExpiry.checked; if (noExpiry.checked) expiryInput.value = ''; };
      form.onsubmit = event => {
        event.preventDefault();
        if (!record) return;
        const data = new FormData(form);
        record.title = String(data.get('title') || '').trim() || record.title;
        record.cat = String(data.get('cat') || record.cat || 'Licensing');
        record.notes = String(data.get('notes') || '');
        const key = article.dataset.fdocKind + ':' + article.dataset.fdocKey;
        editCards[key] = false;
        openCards[key] = false;
        saveNow();
        render();
      };
    });
    scope.querySelectorAll('[data-fdoc-delete-document]').forEach(button => button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      const article = button.closest('.fdoc');
      if (!article || article.dataset.fdocKind !== 'premises' || !isAdminNow()) return;
      const record = getRecord('premises', article.dataset.fdocKey);
      if (!record || !confirm('Delete this document? Uploaded evidence on this document will also be removed.')) return;
      state.docs = (state.docs || []).filter(doc => doc.id !== record.id);
      delete openCards['premises:' + record.id];
      delete editCards['premises:' + record.id];
      saveNow();
      render();
    });
    const add = scope.getElementById ? scope.getElementById('finalDocAdd') : null;
    if (add) add.onsubmit = event => {
      event.preventDefault();
      const data = new FormData(add);
      const file = (add.elements.file.files && add.elements.file.files[0]) || (add.elements.photo.files && add.elements.photo.files[0]);
      const record = { id: uidx(), title: data.get('title'), cat: data.get('cat'), notes: data.get('notes') || '', expiry: data.get('expiry') || '', expiryDate: data.get('expiry') || '', noExpiry: !!data.get('noExpiry'), status: file ? 'Stored' : 'Missing' };
      const finish = fileData => { if (fileData) { record.fileData = fileData; record.fileName = file.name || 'Photo'; record.fileType = file.type || 'image/jpeg'; record.uploadedAt = new Date().toISOString(); } state.docs.push(record); saveNow(); render(); };
      if (file) readFile(file, finish); else finish('');
    };
  }

  const oldBind = bind;
  bind = function () {
    oldBind();
    bindDocumentControls(document);
  };
})();
