// Final shared document upload system. Single source of truth for all document upload UI.
(function () {
  if (window.__finalDocumentSystemClean7) return;
  window.__finalDocumentSystemClean7 = true;

  const REQ_KEY = 'complianceUserDocumentRequirementsV1';
  const openCards = {};
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

  function card(o) {
    const record = o.record || {};
    const s = status(record, o.required);
    const badge = s[0] ? '<span class="fdocBadge ' + s[1] + '">' + esc(s[0]) + '</span>' : '<span class="fdocBadge fdocBadgeEmpty" aria-hidden="true"></span>';
    const cardKey = o.kind + ':' + o.key;
    const expanded = !!openCards[cardKey];
    return '<article class="fdoc ' + (expanded ? 'open' : '') + '" data-fdoc-kind="' + esc(o.kind) + '" data-fdoc-key="' + esc(o.key) + '">' +
      '<button type="button" class="fdocBar" data-fdoc-toggle="' + esc(cardKey) + '">' +
        '<span class="fdocIcon">' + icon.doc + '</span>' +
        '<span class="fdocName"><strong>' + esc(o.title) + '</strong><em>' + esc(o.cat || 'Document') + '</em></span>' +
        badge +
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
      '</div>' +
    '</article>';
  }

  function premisesItems() {
    if (hasOnlySectionFilter('Staff documents')) return [];
    return (state.docs || []).filter(d => matchesSelectedFilters('premises', (d.title || '') + ' ' + (d.cat || '')));
  }
  function staffItems() {
    if (hasOnlySectionFilter('Premises documents')) return [];
    const out = [];
    (state.users || []).forEach(user => reqs().forEach(req => {
      const required = requirementAppliesToUser(req, user);
      const existing = userDocs().find(x => x.userId === user.id && x.requirementId === req.id);
      if (!required && !existing) return;
      const hay = ((req.title || '') + ' ' + (user.name || '') + ' ' + (user.nickname || '') + ' ' + group(user)).toLowerCase();
      if (!matchesSelectedFilters('userdoc', hay)) return;
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
  function filterButtons() {
    return '<div class="buttonRow docFinderButtons"><details class="docFilterDrop"><summary>Filter document groups</summary><div class="docFilterOptions">' +
      allFilterLabels().map(label => '<label><input type="checkbox" data-doc-group="' + esc(label) + '" ' + (selectedDocFilters.has(label) ? 'checked' : '') + '> <span>' + esc(label) + '</span></label>').join('') +
      '</div></details></div>';
  }
  function addForm() {
    return '<section class="panel addPremisesPanel"><details class="addPremisesDetails"><summary><span>Add premises document</span><small>Add a licence, certificate, policy, inspection record or other venue document</small></summary><div class="addPremisesBody"><form id="finalDocAdd" class="stack"><input name="title" placeholder="Document title" required><select name="cat"><option>Licensing</option><option>Food Safety</option><option>Fire Safety</option><option>Health & Safety</option><option>Staff</option><option>Equipment</option></select><textarea name="notes" placeholder="Instructions, storage location or renewal notes"></textarea><div class="fdocUploads"><label>' + icon.upload + '<span>Choose File</span><input type="file" name="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>' + icon.camera + '<span>Take Photo</span><input type="file" name="photo" accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input name="noExpiry" type="checkbox"><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span class="fdocDateInputWrap">' + icon.calendar + '<span class="fdocExpiryText">Expiry Date</span><input name="expiry" type="date"></span></label></div><button class="primary">Add document</button></form></div></details></section>';
  }
  documents = function () {
    const premises = premisesItems();
    const staff = staffItems();
    const forcePremises = hasSectionFilter('Premises documents');
    const forceStaff = hasSectionFilter('Staff documents');
    return '<section class="panel"><h2>Find documents</h2>' + filterButtons() + '</section>' +
      renderSection('Premises documents', premises.map(d => ({ kind:'premises', key:d.id, title:d.title, cat:d.cat, record:d, required:true, note:d.notes || 'Upload a clear, current copy and set expiry status.' })), 'No premises documents match this filter.', forcePremises) +
      renderSection('Staff documents', staff, 'No staff documents match this filter.', forceStaff) +
      '<section class="panel"><h2>Training matrix</h2><p class="muted">Training matrix available from staff records.</p></section>' + addForm();
  };

  function viewer(record) {
    if (!record?.fileData) return;
    modalRoot.innerHTML = '<div class="modalCard evidenceViewerModal"><button class="close" id="fdocClose">×</button><h2>' + esc(record.fileName || 'Document evidence') + '</h2>' + (image(record) ? '<img class="fdocFull" src="' + record.fileData + '" alt="Document preview">' : '<div class="fdocFileBig">Document file</div><a class="ghost evidenceOpenLink" href="' + record.fileData + '" download="' + esc(record.fileName || 'document') + '">Open / Download</a>') + '</div>';
    modalRoot.classList.remove('hidden');
    document.getElementById('fdocClose').onclick = () => modalRoot.classList.add('hidden');
  }

  const oldBind = bind;
  bind = function () {
    oldBind();
    document.querySelectorAll('[data-doc-group]').forEach(input => {
      input.onchange = () => {
        if (input.checked) selectedDocFilters.add(input.dataset.docGroup);
        else selectedDocFilters.delete(input.dataset.docGroup);
        render();
      };
    });
    document.querySelectorAll('[data-fdoc-toggle]').forEach(btn => btn.onclick = () => {
      const k = btn.dataset.fdocToggle;
      const article = btn.closest('.fdoc');
      const panel = article && article.querySelector('.fdocPanel');
      const isOpen = !(article && article.classList.contains('open'));
      openCards[k] = isOpen;
      if (article) article.classList.toggle('open', isOpen);
      if (panel) panel.classList.toggle('closed', !isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    document.querySelectorAll('[data-fdoc-file],[data-fdoc-photo]').forEach(input => input.onchange = () => {
      const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); const file = input.files[0]; if (!file) return;
      readFile(file, data => { r.fileData = data; r.fileName = file.name || 'Photo'; r.fileType = file.type || 'image/jpeg'; r.uploadedAt = new Date().toISOString(); saveNow(); render(); });
    });
    document.querySelectorAll('[data-fdoc-noexpiry]').forEach(input => input.onchange = () => { const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); r.noExpiry = input.checked; if (input.checked) { r.expiryDate = ''; r.expiry = ''; } saveNow(); render(); });
    document.querySelectorAll('[data-fdoc-expiry]').forEach(input => input.onchange = () => { const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); r.expiryDate = input.value; r.expiry = input.value; r.noExpiry = false; saveNow(); render(); });
    document.querySelectorAll('[data-fdoc-thumb]').forEach(btn => btn.onclick = e => { e.stopPropagation(); viewer(allRecords().find(r => r.id === btn.dataset.fdocThumb)); });
  };
})();
