// Final shared document upload system. Single source of truth for all document upload UI.
(function () {
  if (window.__finalDocumentSystemClean4) return;
  window.__finalDocumentSystemClean4 = true;

  const REQ_KEY = 'complianceUserDocumentRequirementsV1';
  const openCards = {};
  let filter = 'all';

  const icon = {
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5z"/><path d="M8 3v4M16 3v4M5 10h14"/></svg>'
  };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function uidx() { try { return uid(); } catch { return 'id_' + Math.random().toString(36).slice(2); } }
  function reqs() { try { const r = JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; } }
  function group(user) { return user.jobArea || user.area || 'FOH'; }
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
        '<span class="fdocArrow">⌄</span>' +
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

  function premisesList() {
    const f = ['all','premises','staff'].includes(filter) ? 'all' : filter;
    const docs = (state.docs || []).filter(d => filter !== 'staff' && (f === 'all' || ((d.title || '') + ' ' + (d.cat || '')).toLowerCase().includes(f.toLowerCase())));
    return docs.map(d => card({ kind:'premises', key:d.id, title:d.title, cat:d.cat, record:d, required:true, note:d.notes || 'Upload a clear, current copy and set expiry status.' })).join('') || '<p class="muted">No premises documents match this filter.</p>';
  }
  function staffList() {
    if (filter === 'premises') return '<p class="muted">Staff documents hidden by filter.</p>';
    const f = ['all','premises','staff'].includes(filter) ? 'all' : filter;
    const out = [];
    (state.users || []).forEach(user => reqs().forEach(req => {
      const needed = (req.staffGroups || []).includes(group(user));
      const r = userDocs().find(x => x.userId === user.id && x.requirementId === req.id);
      if (!needed && !r) return;
      const hay = ((req.title || '') + ' ' + (user.name || '') + ' ' + (user.nickname || '') + ' ' + group(user)).toLowerCase();
      if (f !== 'all' && !hay.includes(f.toLowerCase())) return;
      out.push(card({ kind:'userdoc', key:user.id + '|' + req.id, title:req.title, cat:(user.nickname || user.name) + ' · ' + group(user), record:r, required:needed, note:'Upload evidence for ' + (user.nickname || user.name) + ' and set expiry status.' }));
    }));
    return out.join('') || '<p class="muted">No staff documents match this filter.</p>';
  }
  function filterButton(id, label) { return '<button class="secondary ' + (filter === id ? 'activeFilter' : '') + '" data-final-filter="' + esc(id) + '">' + esc(label) + '</button>'; }
  function filterButtons() {
    const common = ['Allergen Awareness','Food Hygiene','Challenge 25','Right to Work','Fire Safety'];
    const buttons = [filterButton('all','All documents'), filterButton('premises','Premises documents'), filterButton('staff','All staff documents')].concat(common.map(x => filterButton(x, x)));
    reqs().forEach(r => { if (!common.some(c => c.toLowerCase() === String(r.title || '').toLowerCase())) buttons.push(filterButton(r.title, r.title)); });
    return '<div class="buttonRow docFinderButtons">' + buttons.join('') + '</div>';
  }
  function addForm() { return '<section class="panel"><h2>Add premises document</h2><form id="finalDocAdd" class="stack"><input name="title" placeholder="Document title" required><select name="cat"><option>Licensing</option><option>Food Safety</option><option>Fire Safety</option><option>Health & Safety</option><option>Staff</option><option>Equipment</option></select><textarea name="notes" placeholder="Instructions, storage location or renewal notes"></textarea><div class="fdocUploads"><label>' + icon.upload + '<span>Choose File</span><input type="file" name="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>' + icon.camera + '<span>Take Photo</span><input type="file" name="photo" accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input name="noExpiry" type="checkbox"><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span class="fdocDateInputWrap">' + icon.calendar + '<span class="fdocExpiryText">Expiry Date</span><input name="expiry" type="date"></span></label></div><button class="primary">Add document</button></form></section>'; }
  documents = function () { return '<section class="panel"><h2>Find documents</h2>' + filterButtons() + '</section><section class="fdocSection"><h2>Premises documents</h2>' + premisesList() + '</section><section class="fdocSection"><h2>Staff documents</h2>' + staffList() + '</section><section class="panel"><h2>Training matrix</h2><p class="muted">Training matrix available from staff records.</p></section>' + addForm(); };

  if (typeof centralProfileDetail === 'function') {
    const oldDetail = centralProfileDetail;
    centralProfileDetail = function (user, section, shifts, training, docs, availabilityText) {
      if (section !== 'training') return oldDetail(user, section, shifts, training, docs, availabilityText);
      const blocks = reqs().filter(req => (req.staffGroups || []).includes(group(user))).map(req => card({ kind:'userdoc', key:user.id + '|' + req.id, title:req.title, cat:group(user), record:userDocs().find(r => r.userId === user.id && r.requirementId === req.id), required:true, note:'Upload evidence for ' + (user.nickname || user.name) + ' and set expiry status.' })).join('') || '<p class="muted">No required documents for this staff group.</p>';
      return '<h2>Training & required documents</h2><section class="fdocSection">' + blocks + '</section><h3>Training records</h3>' + (training.length ? training.map(t => '<div class="listItem"><strong>' + esc(t.course) + '</strong><p>' + esc(t.status) + (t.expiry ? ' · Expires ' + esc(t.expiry) : '') + '</p><p class="muted">' + esc(t.evidence || '') + '</p></div>').join('') : '<p class="muted">No training records.</p>');
    };
  }

  const oldBind = bind;
  bind = function () {
    oldBind();
    document.querySelectorAll('[data-final-filter]').forEach(b => b.onclick = () => { filter = b.dataset.finalFilter; render(); });
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
      readFile(file, data => { r.fileData = data; r.fileName = file.name; r.fileType = file.type; r.uploadedAt = new Date().toISOString(); saveNow(); render(); });
    });
    document.querySelectorAll('[data-fdoc-noexpiry]').forEach(input => input.onchange = () => { const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); r.noExpiry = input.checked; if (input.checked) { r.expiryDate = ''; r.expiry = ''; } saveNow(); render(); });
    document.querySelectorAll('[data-fdoc-expiry]').forEach(input => input.onchange = () => { const article = input.closest('.fdoc'); const r = getRecord(article.dataset.fdocKind, article.dataset.fdocKey); r.expiryDate = input.value; r.expiry = input.value; r.noExpiry = false; saveNow(); render(); });
  };
  setTimeout(() => { try { render(); } catch {} }, 0);
})();