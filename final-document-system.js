// Final shared document upload system. Single source of truth for all document upload UI.
(function () {
  if (window.__finalDocumentSystemV2) return;
  window.__finalDocumentSystemV2 = true;

  const REQ_KEY = 'complianceUserDocumentRequirementsV1';
  let filter = 'all';
  const openCards = {};

  const icons = {
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5z"/><path d="M8 3v4M16 3v4M5 10h14"/><path d="M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2"/></svg>'
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }
  function makeId() { try { return uid(); } catch { return 'id_' + Math.random().toString(36).slice(2); } }
  function todayValue() { try { return today(); } catch { return new Date().toISOString().slice(0, 10); } }
  function readReqs() { try { const r = JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; } }
  function groupFor(user) { return user.jobArea || user.area || 'FOH'; }
  function userRecords() { state.userRequiredDocuments = state.userRequiredDocuments || []; return state.userRequiredDocuments; }
  function saveApp() { try { save(); } catch {} }
  function readFile(file, done) { if (!file) return; const reader = new FileReader(); reader.onload = () => done(reader.result || ''); reader.readAsDataURL(file); }
  function isImage(record) { return String(record?.fileType || '').startsWith('image/') || String(record?.fileData || '').startsWith('data:image/'); }
  function isConfirmed(record) { return !!(record?.fileData && (record.noExpiry || record.expiryDate || record.expiry)); }
  function recordStatus(record, required) {
    if (isConfirmed(record)) return { label: 'Confirmed', kind: 'ok' };
    if (record?.fileData) return { label: 'Uploaded', kind: 'warn' };
    return { label: required ? 'Required' : 'Missing', kind: 'danger' };
  }
  function updateStatus(record) { if (record) record.status = recordStatus(record, true).label; }
  function expiryLabel(record) {
    if (record?.noExpiry) return 'Does not expire';
    const raw = record?.expiryDate || record?.expiry;
    if (!raw) return 'No expiry set';
    try { return new Date(raw + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return raw; }
  }
  function premisesRecord(id) { return (state.docs || []).find(d => d.id === id); }
  function userRecord(userId, reqId) {
    let record = userRecords().find(r => r.userId === userId && r.requirementId === reqId);
    if (!record) { record = { id: makeId(), userId, requirementId: reqId }; userRecords().push(record); }
    return record;
  }
  function getRecord(kind, key) {
    if (kind === 'premises') return premisesRecord(key);
    const [userId, reqId] = key.split('|');
    return userRecord(userId, reqId);
  }
  function allRecords() { return (state.docs || []).concat(state.userRequiredDocuments || []); }

  function preview(record) {
    if (!record?.fileData) return '<button type="button" class="fdocThumb empty" data-fdoc-thumb="">No document</button>';
    if (isImage(record)) return '<button type="button" class="fdocThumb" data-fdoc-thumb="' + esc(record.id) + '"><img src="' + record.fileData + '" alt="Document preview"></button>';
    return '<button type="button" class="fdocThumb file" data-fdoc-thumb="' + esc(record.id) + '">DOC</button>';
  }

  function card(opts) {
    const record = opts.record || {};
    const status = recordStatus(record, opts.required);
    const cardKey = opts.kind + ':' + opts.key;
    const expanded = !!openCards[cardKey];
    return '<article class="fdoc" data-fdoc-kind="' + esc(opts.kind) + '" data-fdoc-key="' + esc(opts.key) + '">' +
      '<button type="button" class="fdocBar" data-fdoc-toggle="' + esc(cardKey) + '">' +
        '<span class="fdocIcon">' + icons.doc + '</span>' +
        '<span class="fdocName"><strong>' + esc(opts.title) + '</strong><em>' + esc(opts.cat || 'Document') + '</em></span>' +
        '<span class="fdocBadge ' + status.kind + '">' + esc(status.label) + '</span>' +
        '<span class="fdocDate">' + esc(expiryLabel(record)) + '</span>' +
        '<span class="fdocArrow">' + (expanded ? '⌃' : '⌄') + '</span>' +
      '</button>' +
      '<div class="fdocPanel ' + (expanded ? '' : 'closed') + '">' +
        '<p class="fdocInstruction">' + esc(opts.note || 'Upload a clear, current copy of this document.') + '</p>' +
        '<div class="fdocBody">' +
          preview(record) +
          '<div class="fdocControls">' +
            '<div class="fdocUploads">' +
              '<label>' + icons.upload + '<span>Choose File</span><input type="file" data-fdoc-file accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label>' +
              '<label>' + icons.camera + '<span>Take Photo</span><input type="file" data-fdoc-photo accept="image/*" capture="environment"></label>' +
            '</div>' +
            '<div class="fdocMeta">' +
              '<label class="fdocSwitch"><span class="fdocSwitchText">Does Not Expire</span><input type="checkbox" data-fdoc-noexpiry ' + (record.noExpiry ? 'checked' : '') + '><span class="fdocSwitchTrack"></span></label>' +
              '<label class="fdocExpiry"><span>Expiry Date</span><span class="fdocDateInputWrap">' + icons.calendar + '<input type="date" data-fdoc-expiry value="' + esc((record.expiryDate || record.expiry) || '') + '" ' + (record.noExpiry ? 'disabled' : '') + '></span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function premisesList() {
    const f = ['all', 'premises', 'staff'].includes(filter) ? 'all' : filter;
    const docs = (state.docs || []).filter(d => filter !== 'staff' && (f === 'all' || ((d.title || '') + ' ' + (d.cat || '')).toLowerCase().includes(f.toLowerCase())));
    return docs.map(d => { updateStatus(d); return card({ kind: 'premises', key: d.id, title: d.title, cat: d.cat, record: d, required: true, note: d.notes || 'Upload a clear, current copy and set expiry status.' }); }).join('') || '<p class="muted">No premises documents match this filter.</p>';
  }
  function staffList() {
    if (filter === 'premises') return '<p class="muted">Staff documents hidden by filter.</p>';
    const f = ['all', 'premises', 'staff'].includes(filter) ? 'all' : filter;
    const out = [];
    (state.users || []).forEach(user => {
      readReqs().forEach(req => {
        const needed = (req.staffGroups || []).includes(groupFor(user));
        const record = userRecords().find(r => r.userId === user.id && r.requirementId === req.id);
        if (!needed && !record) return;
        const hay = ((req.title || '') + ' ' + (user.name || '') + ' ' + (user.nickname || '') + ' ' + groupFor(user)).toLowerCase();
        if (f !== 'all' && !hay.includes(f.toLowerCase())) return;
        if (record) updateStatus(record);
        out.push(card({ kind: 'userdoc', key: user.id + '|' + req.id, title: req.title, cat: (user.nickname || user.name) + ' · ' + groupFor(user), record, required: needed, note: 'Upload evidence for ' + (user.nickname || user.name) + ' and set expiry status.' }));
      });
    });
    return out.join('') || '<p class="muted">No staff documents match this filter.</p>';
  }
  function filterButton(id, label) { return '<button class="secondary ' + (filter === id ? 'activeFilter' : '') + '" data-final-filter="' + esc(id) + '">' + esc(label) + '</button>'; }
  function filterButtons() {
    const common = ['Allergen Awareness', 'Food Hygiene', 'Challenge 25', 'Right to Work', 'Fire Safety'];
    const buttons = [filterButton('all', 'All documents'), filterButton('premises', 'Premises documents'), filterButton('staff', 'All staff documents')].concat(common.map(x => filterButton(x, x)));
    readReqs().forEach(r => { if (!common.some(c => c.toLowerCase() === String(r.title || '').toLowerCase())) buttons.push(filterButton(r.title, r.title)); });
    return '<div class="buttonRow docFinderButtons">' + buttons.join('') + '</div>';
  }
  function addForm() {
    return '<section class="panel"><h2>Add premises document</h2><form id="finalDocAdd" class="stack"><input name="title" placeholder="Document title" required><select name="cat"><option>Licensing</option><option>Food Safety</option><option>Fire Safety</option><option>Health & Safety</option><option>Staff</option><option>Equipment</option></select><textarea name="notes" placeholder="Instructions, storage location or renewal notes"></textarea><div class="fdocUploads"><label>' + icons.upload + '<span>Choose File</span><input type="file" name="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>' + icons.camera + '<span>Take Photo</span><input type="file" name="photo" accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not Expire</span><input name="noExpiry" type="checkbox"><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span>Expiry Date</span><span class="fdocDateInputWrap">' + icons.calendar + '<input name="expiry" type="date"></span></label></div><button class="primary">Add document</button></form></section>';
  }
  function matrixFallback() { return '<section class="panel"><h2>Training matrix</h2><p class="muted">Training matrix available from staff records.</p></section>'; }

  documents = function () {
    return '<section class="hero card"><div><p class="eyebrow">Document Hub</p><h2>All documents and staff training</h2><p>Find, upload, photograph and confirm required documents.</p></div>' + badge('Central vault', 'ok') + '</section><section class="panel"><h2>Find documents</h2>' + filterButtons() + '</section><section class="fdocSection"><h2>Premises documents</h2>' + premisesList() + '</section><section class="fdocSection"><h2>Staff documents</h2>' + staffList() + '</section>' + matrixFallback() + addForm();
  };

  if (typeof centralProfileDetail === 'function') {
    const oldDetail = centralProfileDetail;
    centralProfileDetail = function (user, section, shifts, training, docs, availabilityText) {
      if (section !== 'training') return oldDetail(user, section, shifts, training, docs, availabilityText);
      const blocks = readReqs().filter(req => (req.staffGroups || []).includes(groupFor(user))).map(req => {
        const record = userRecords().find(r => r.userId === user.id && r.requirementId === req.id);
        if (record) updateStatus(record);
        return card({ kind: 'userdoc', key: user.id + '|' + req.id, title: req.title, cat: groupFor(user), record, required: true, note: 'Upload evidence for ' + (user.nickname || user.name) + ' and set expiry status.' });
      }).join('') || '<p class="muted">No required documents for this staff group.</p>';
      return '<h2>Training & required documents</h2><section class="fdocSection">' + blocks + '</section><h3>Training records</h3>' + (training.length ? training.map(t => '<div class="listItem"><strong>' + esc(t.course) + '</strong><p>' + esc(t.status) + (t.expiry ? ' · Expires ' + esc(t.expiry) : '') + '</p><p class="muted">' + esc(t.evidence || '') + '</p></div>').join('') : '<p class="muted">No training records.</p>');
    };
  }

  function viewer(record) {
    if (!record?.fileData) return;
    modalRoot.innerHTML = '<div class="modalCard evidenceViewerModal"><button class="close" id="fdocClose">×</button><h2>' + esc(record.fileName || 'Document evidence') + '</h2>' + (isImage(record) ? '<img class="fdocFull" src="' + record.fileData + '" alt="Document preview">' : '<div class="fdocFileBig">Document file</div><a class="ghost evidenceOpenLink" href="' + record.fileData + '" download="' + esc(record.fileName || 'document') + '">Open / Download</a>') + '</div>';
    modalRoot.classList.remove('hidden');
    document.getElementById('fdocClose').onclick = () => modalRoot.classList.add('hidden');
  }

  function bindFinal() {
    document.querySelectorAll('[data-final-filter]').forEach(btn => btn.onclick = () => { filter = btn.dataset.finalFilter; render(); });
    document.querySelectorAll('[data-fdoc-toggle]').forEach(btn => btn.onclick = () => { openCards[btn.dataset.fdocToggle] = !openCards[btn.dataset.fdocToggle]; render(); });
    document.querySelectorAll('.fdoc').forEach(cardEl => {
      if (cardEl.dataset.bound) return;
      cardEl.dataset.bound = '1';
      const kind = cardEl.dataset.fdocKind;
      const key = cardEl.dataset.fdocKey;
      let record = getRecord(kind, key);
      const noExpiry = cardEl.querySelector('[data-fdoc-noexpiry]');
      const expiryInput = cardEl.querySelector('[data-fdoc-expiry]');
      function saveMeta() { record = getRecord(kind, key); record.noExpiry = !!noExpiry.checked; record.expiryDate = noExpiry.checked ? '' : expiryInput.value; record.expiry = noExpiry.checked ? '' : expiryInput.value; updateStatus(record); saveApp(); render(); }
      noExpiry.onchange = () => { expiryInput.disabled = noExpiry.checked; if (noExpiry.checked) expiryInput.value = ''; saveMeta(); };
      expiryInput.onchange = saveMeta;
      function saveFile(file) { if (!file) return; readFile(file, data => { record = getRecord(kind, key); record.fileName = file.name || 'Photo'; record.fileType = file.type || 'image/jpeg'; record.fileData = data; record.uploadedAt = new Date().toISOString(); record.noExpiry = !!noExpiry.checked; record.expiryDate = noExpiry.checked ? '' : expiryInput.value; record.expiry = noExpiry.checked ? '' : expiryInput.value; updateStatus(record); saveApp(); render(); }); }
      cardEl.querySelector('[data-fdoc-file]').onchange = function () { saveFile(this.files[0]); };
      cardEl.querySelector('[data-fdoc-photo]').onchange = function () { saveFile(this.files[0]); };
    });
    document.querySelectorAll('[data-fdoc-thumb]').forEach(btn => btn.onclick = e => { e.stopPropagation(); viewer(allRecords().find(r => r.id === btn.dataset.fdocThumb)); });
    const add = document.getElementById('finalDocAdd');
    if (add && !add.dataset.bound) {
      add.dataset.bound = '1';
      add.onsubmit = ev => {
        ev.preventDefault();
        const fd = new FormData(add);
        const file = (add.querySelector('[name=file]').files || [])[0] || (add.querySelector('[name=photo]').files || [])[0];
        function done(data) { const record = { id: makeId(), title: fd.get('title'), cat: fd.get('cat'), notes: fd.get('notes') || '', fileName: file ? file.name : '', fileType: file ? file.type : '', fileData: data || '', noExpiry: fd.get('noExpiry') === 'on', expiryDate: fd.get('noExpiry') === 'on' ? '' : fd.get('expiry'), expiry: fd.get('noExpiry') === 'on' ? '' : fd.get('expiry'), uploadedAt: file ? new Date().toISOString() : '' }; updateStatus(record); state.docs.push(record); saveApp(); render(); }
        file ? readFile(file, done) : done('');
      };
    }
  }

  const css = document.createElement('style');
  css.textContent = `
    :root { --fdoc-gold:#d5aa45; --fdoc-gold2:#ffca58; --fdoc-line:rgba(213,170,69,.38); --fdoc-dark:#050607; --fdoc-tray:#0a0b0d; --fdoc-box:#151719; --fdoc-text:#fff5e2; --fdoc-muted:#b9b0a2; }
    .fdocSection{display:grid;gap:10px;margin:14px 0}.fdocSection>h2{margin:6px 4px!important}.fdoc{background:#050607;border:1px solid var(--fdoc-line);border-radius:20px;overflow:hidden;box-shadow:0 16px 34px rgba(0,0,0,.38),inset 0 0 0 1px rgba(255,255,255,.025)}
    .fdocBar{width:100%;display:grid;grid-template-columns:44px minmax(0,1fr) auto auto 28px;gap:10px;align-items:center;min-height:66px!important;padding:9px 11px!important;background:linear-gradient(180deg,rgba(43,34,14,.74),rgba(16,16,16,.98))!important;border:0!important;border-bottom:1px solid var(--fdoc-line)!important;border-radius:0!important;color:var(--fdoc-text)!important;text-align:left!important;box-shadow:none!important}.fdocIcon{width:34px;height:34px;border-radius:50%;border:1px solid rgba(213,170,69,.64);display:flex;align-items:center;justify-content:center;color:var(--fdoc-gold2);background:radial-gradient(circle at 35% 20%,rgba(255,202,88,.18),rgba(213,170,69,.06));box-shadow:0 0 16px rgba(213,170,69,.12)}.fdocIcon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.fdocName{display:grid;min-width:0}.fdocName strong{font-size:16px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:850}.fdocName em{font-style:normal;color:var(--fdoc-gold2);font-size:13px;margin-top:3px}.fdocBadge{border:1px solid rgba(213,170,69,.62);border-radius:8px;padding:7px 10px;color:var(--fdoc-text);font-size:12px;font-weight:850;background:rgba(0,0,0,.25)}.fdocBadge.ok{color:#68df8a;border-color:rgba(104,223,138,.5)}.fdocBadge.warn{color:#ffca58}.fdocBadge.danger{color:#ffca58}.fdocDate{color:#ddd4c4;font-size:14px;white-space:nowrap}.fdocArrow{color:var(--fdoc-gold2);font-size:22px;text-align:right;line-height:1}
    .fdocPanel{padding:10px 11px 12px;background:linear-gradient(180deg,rgba(12,13,14,.98),rgba(6,7,8,.99))}.fdocPanel.closed{display:none}.fdocInstruction{margin:0 0 10px!important;color:var(--fdoc-muted)!important;font-size:13px!important;line-height:1.35!important}.fdocBody{display:grid;grid-template-columns:92px 1fr;gap:12px;align-items:stretch}.fdocThumb{width:88px;height:116px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025));display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--fdoc-gold2);font-weight:850;text-align:center;padding:5px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.7)}.fdocThumb img{width:100%;height:100%;object-fit:cover}.fdocThumb.empty{font-size:12px;color:#bdb3a4}.fdocThumb.file{font-size:18px}.fdocControls{display:grid;gap:8px}.fdocUploads,.fdocMeta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fdocUploads label,.fdocSwitch,.fdocExpiry{min-height:48px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.13);display:flex;align-items:center;justify-content:center;color:var(--fdoc-text);font-weight:760;font-size:14px;padding:8px;box-sizing:border-box}.fdocUploads label{gap:9px}.fdocUploads svg,.fdocDateInputWrap svg{width:22px;height:22px;fill:none;stroke:var(--fdoc-gold2);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.fdocUploads input{position:absolute;opacity:0;width:1px;height:1px}.fdocSwitch{justify-content:space-between;gap:8px}.fdocSwitchText{white-space:nowrap}.fdocSwitch input{position:absolute;opacity:0}.fdocSwitchTrack{width:44px;height:24px;border-radius:999px;background:#262626;position:relative;box-shadow:inset 0 0 0 1px rgba(255,255,255,.11)}.fdocSwitchTrack:after{content:"";position:absolute;width:20px;height:20px;left:2px;top:2px;border-radius:50%;background:#8c8c8c;transition:left .15s ease,background .15s ease}.fdocSwitch input:checked+.fdocSwitchTrack{background:rgba(213,170,69,.32)}.fdocSwitch input:checked+.fdocSwitchTrack:after{left:22px;background:var(--fdoc-gold2);box-shadow:0 0 12px rgba(255,202,88,.42)}.fdocExpiry{display:grid;grid-template-columns:auto 1fr;gap:6px;justify-content:stretch;text-align:left}.fdocDateInputWrap{display:flex;align-items:center;gap:7px;min-width:0}.fdocExpiry input{min-height:30px!important;height:30px!important;padding:2px 4px!important;font-size:13px!important;border:0!important;background:transparent!important;color:var(--fdoc-text)!important;width:100%}.fdocFull{width:100%;height:auto;border-radius:18px;background:#fff}.fdocFileBig{padding:40px;text-align:center;background:rgba(255,255,255,.06);border-radius:18px;color:var(--fdoc-text);font-weight:850}.evidenceViewerModal{max-height:88vh;overflow:auto}
    @media(max-width:430px){.fdocBar{grid-template-columns:36px minmax(0,1fr) auto 24px}.fdocDate{display:none}.fdocIcon{width:32px;height:32px}.fdocBadge{font-size:11px;padding:6px 7px}.fdocBody{grid-template-columns:78px 1fr;gap:9px}.fdocThumb{width:74px;height:96px}.fdocUploads label,.fdocSwitch,.fdocExpiry{font-size:12px;min-height:42px}.fdocMeta{grid-template-columns:1fr}.fdocExpiry{grid-template-columns:1fr}.fdocName strong{font-size:15px}.fdocSwitch{justify-content:center}.fdocSwitchText{white-space:normal}.fdocUploads svg,.fdocDateInputWrap svg{width:19px;height:19px}}
  `;
  document.head.appendChild(css);

  if (typeof bind === 'function' && !bind.__finalDocumentSystemV2) {
    const oldBind = bind;
    bind = function () { oldBind(); bindFinal(); };
    bind.__finalDocumentSystemV2 = true;
  }

  render();
})();