// Final shared document upload system. Single source of truth for all document upload UI.
(function () {
  if (window.__finalDocumentSystemClean) return;
  window.__finalDocumentSystemClean = true;

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
  function status(record, required) { if (confirmed(record)) return ['Confirmed','ok']; if (record?.fileData) return ['Uploaded','warn']; return [required ? 'Required' : 'Missing','danger']; }
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
  function allRecords() { return (state.docs || []).concat(state.userRequiredDocuments || []); }

  function thumb(record) {
    if (!record?.fileData) return '<button type="button" class="fdocThumb empty" data-fdoc-thumb="">No document</button>';
    if (image(record)) return '<button type="button" class="fdocThumb" data-fdoc-thumb="' + esc(record.id) + '"><img src="' + record.fileData + '" alt="Document preview"></button>';
    return '<button type="button" class="fdocThumb file" data-fdoc-thumb="' + esc(record.id) + '">DOC</button>';
  }

  function card(o) {
    const record = o.record || {};
    const s = status(record, o.required);
    const cardKey = o.kind + ':' + o.key;
    const expanded = !!openCards[cardKey];
    return '<article class="fdoc" data-fdoc-kind="' + esc(o.kind) + '" data-fdoc-key="' + esc(o.key) + '">' +
      '<button type="button" class="fdocBar" data-fdoc-toggle="' + esc(cardKey) + '">' +
        '<span class="fdocIcon">' + icon.doc + '</span>' +
        '<span class="fdocName"><strong>' + esc(o.title) + '</strong><em>' + esc(o.cat || 'Document') + '</em></span>' +
        '<span class="fdocBadge ' + s[1] + '">' + esc(s[0]) + '</span>' +
        '<span class="fdocDate">' + esc(expiryText(record)) + '</span>' +
        '<span class="fdocArrow">' + (expanded ? '⌃' : '⌄') + '</span>' +
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
              '<label class="fdocSwitch"><span class="fdocSwitchText">Does Not Expire</span><input type="checkbox" data-fdoc-noexpiry ' + (record.noExpiry ? 'checked' : '') + '><span class="fdocSwitchTrack"></span></label>' +
              '<label class="fdocExpiry"><span>Expiry Date</span><span class="fdocDateInputWrap">' + icon.calendar + '<input type="date" data-fdoc-expiry value="' + esc((record.expiryDate || record.expiry) || '') + '" ' + (record.noExpiry ? 'disabled' : '') + '></span></label>' +
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
  function addForm() { return '<section class="panel"><h2>Add premises document</h2><form id="finalDocAdd" class="stack"><input name="title" placeholder="Document title" required><select name="cat"><option>Licensing</option><option>Food Safety</option><option>Fire Safety</option><option>Health & Safety</option><option>Staff</option><option>Equipment</option></select><textarea name="notes" placeholder="Instructions, storage location or renewal notes"></textarea><div class="fdocUploads"><label>' + icon.upload + '<span>Choose File</span><input type="file" name="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>' + icon.camera + '<span>Take Photo</span><input type="file" name="photo" accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not Expire</span><input name="noExpiry" type="checkbox"><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span>Expiry Date</span><span class="fdocDateInputWrap">' + icon.calendar + '<input name="expiry" type="date"></span></label></div><button class="primary">Add document</button></form></section>'; }

  documents = function () { return '<section class="hero card"><div><p class="eyebrow">Document Hub</p><h2>All documents and staff training</h2><p>Find, upload, photograph and confirm required documents.</p></div>' + badge('Central vault','ok') + '</section><section class="panel"><h2>Find documents</h2>' + filterButtons() + '</section><section class="fdocSection"><h2>Premises documents</h2>' + premisesList() + '</section><section class="fdocSection"><h2>Staff documents</h2>' + staffList() + '</section><section class="panel"><h2>Training matrix</h2><p class="muted">Training matrix available from staff records.</p></section>' + addForm(); };

  if (typeof centralProfileDetail === 'function') {
    const oldDetail = centralProfileDetail;
    centralProfileDetail = function (user, section, shifts, training, docs, availabilityText) {
      if (section !== 'training') return oldDetail(user, section, shifts, training, docs, availabilityText);
      const blocks = reqs().filter(req => (req.staffGroups || []).includes(group(user))).map(req => card({ kind:'userdoc', key:user.id + '|' + req.id, title:req.title, cat:group(user), record:userDocs().find(r => r.userId === user.id && r.requirementId === req.id), required:true, note:'Upload evidence for ' + (user.nickname || user.name) + ' and set expiry status.' })).join('') || '<p class="muted">No required documents for this staff group.</p>';
      return '<h2>Training & required documents</h2><section class="fdocSection">' + blocks + '</section><h3>Training records</h3>' + (training.length ? training.map(t => '<div class="listItem"><strong>' + esc(t.course) + '</strong><p>' + esc(t.status) + (t.expiry ? ' · Expires ' + esc(t.expiry) : '') + '</p><p class="muted">' + esc(t.evidence || '') + '</p></div>').join('') : '<p class="muted">No training records.</p>');
    };
  }

  function viewer(record) {
    if (!record?.fileData) return;
    modalRoot.innerHTML = '<div class="modalCard evidenceViewerModal"><button class="close" id="fdocClose">×</button><h2>' + esc(record.fileName || 'Document evidence') + '</h2>' + (image(record) ? '<img class="fdocFull" src="' + record.fileData + '" alt="Document preview">' : '<div class="fdocFileBig">Document file</div><a class="ghost evidenceOpenLink" href="' + record.fileData + '" download="' + esc(record.fileName || 'document') + '">Open / Download</a>') + '</div>'; modalRoot.classList.remove('hidden'); document.getElementById('fdocClose').onclick = () => modalRoot.classList.add('hidden');
  }

  function bindFinal() {
    document.querySelectorAll('[data-final-filter]').forEach(btn => btn.onclick = () => { filter = btn.dataset.finalFilter; render(); });
    document.querySelectorAll('[data-fdoc-toggle]').forEach(btn => btn.onclick = () => { openCards[btn.dataset.fdocToggle] = !openCards[btn.dataset.fdocToggle]; render(); });
    document.querySelectorAll('.fdoc').forEach(cardEl => {
      if (cardEl.dataset.bound) return; cardEl.dataset.bound = '1';
      const kind = cardEl.dataset.fdocKind, key = cardEl.dataset.fdocKey;
      let record = getRecord(kind, key);
      const noExpiry = cardEl.querySelector('[data-fdoc-noexpiry]');
      const expiryInput = cardEl.querySelector('[data-fdoc-expiry]');
      function saveMeta() { record = getRecord(kind, key); record.noExpiry = !!noExpiry.checked; record.expiryDate = noExpiry.checked ? '' : expiryInput.value; record.expiry = noExpiry.checked ? '' : expiryInput.value; saveNow(); render(); }
      noExpiry.onchange = () => { expiryInput.disabled = noExpiry.checked; if (noExpiry.checked) expiryInput.value = ''; saveMeta(); };
      expiryInput.onchange = saveMeta;
      function saveFile(file) { if (!file) return; readFile(file, data => { record = getRecord(kind, key); record.fileName = file.name || 'Photo'; record.fileType = file.type || 'image/jpeg'; record.fileData = data; record.uploadedAt = new Date().toISOString(); record.noExpiry = !!noExpiry.checked; record.expiryDate = noExpiry.checked ? '' : expiryInput.value; record.expiry = noExpiry.checked ? '' : expiryInput.value; saveNow(); render(); }); }
      cardEl.querySelector('[data-fdoc-file]').onchange = function () { saveFile(this.files[0]); };
      cardEl.querySelector('[data-fdoc-photo]').onchange = function () { saveFile(this.files[0]); };
    });
    document.querySelectorAll('[data-fdoc-thumb]').forEach(btn => btn.onclick = e => { e.stopPropagation(); viewer(allRecords().find(r => r.id === btn.dataset.fdocThumb)); });
    const add = document.getElementById('finalDocAdd');
    if (add && !add.dataset.bound) { add.dataset.bound = '1'; add.onsubmit = ev => { ev.preventDefault(); const fd = new FormData(add); const file = (add.querySelector('[name=file]').files || [])[0] || (add.querySelector('[name=photo]').files || [])[0]; function done(data) { const record = { id:uidx(), title:fd.get('title'), cat:fd.get('cat'), notes:fd.get('notes') || '', fileName:file ? file.name : '', fileType:file ? file.type : '', fileData:data || '', noExpiry:fd.get('noExpiry') === 'on', expiryDate:fd.get('noExpiry') === 'on' ? '' : fd.get('expiry'), expiry:fd.get('noExpiry') === 'on' ? '' : fd.get('expiry'), uploadedAt:file ? new Date().toISOString() : '' }; state.docs.push(record); saveNow(); render(); } file ? readFile(file, done) : done(''); }; }
  }

  const css = document.createElement('style');
  css.id = 'final-document-system-neutral-styles';
  css.textContent = `
    :root{--fdoc-accent:#f8f1e5;--fdoc-accent2:#d7d0c4;--fdoc-line:rgba(255,255,255,.24);--fdoc-text:#f8f1e5;--fdoc-muted:#aaa298}
    .fdocSection{display:grid;gap:10px;margin:14px 0}.fdocSection>h2{margin:6px 4px!important}.fdoc{background:#030405;border:1px solid var(--fdoc-line);border-radius:18px;overflow:hidden;box-shadow:0 14px 28px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.025)}
    .fdocBar{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) auto auto 26px;gap:10px;align-items:center;min-height:62px!important;padding:8px 11px!important;background:linear-gradient(180deg,rgba(18,19,20,.96),rgba(9,9,10,.99))!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.18)!important;border-radius:0!important;color:var(--fdoc-text)!important;text-align:left!important;box-shadow:none!important}.fdocIcon{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;color:var(--fdoc-accent);background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(0,0,0,.38)}.fdocIcon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.fdocName{display:grid;min-width:0}.fdocName strong{font-size:15px;line-height:1.06;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:850;color:var(--fdoc-text)}.fdocName em{font-style:normal;color:var(--fdoc-accent2);font-size:12px;margin-top:3px}.fdocBadge{border:1px solid rgba(255,255,255,.30);border-radius:8px;padding:6px 9px;color:var(--fdoc-text);font-size:12px;font-weight:820;background:rgba(0,0,0,.28)}.fdocBadge.ok{color:#68df8a;border-color:rgba(104,223,138,.5)}.fdocBadge.warn,.fdocBadge.danger{color:var(--fdoc-text)}.fdocDate{color:#d7d0c4;font-size:13px;white-space:nowrap}.fdocArrow{color:var(--fdoc-accent);font-size:19px;text-align:right;line-height:1}
    .fdocPanel{padding:9px 10px 11px;background:linear-gradient(180deg,#090a0b,#050607)}.fdocPanel.closed{display:none}.fdocInstruction{margin:0 0 9px!important;color:var(--fdoc-muted)!important;font-size:12.5px!important;line-height:1.35!important}.fdocBody{display:grid;grid-template-columns:86px 1fr;gap:11px;align-items:stretch}.fdocThumb{width:82px;height:108px;border-radius:11px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.025));display:flex;align-items:center;justify-content:center;overflow:hidden;color:#d9d0c2;font-weight:850;text-align:center;padding:6px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.76),0 8px 15px rgba(0,0,0,.24)}.fdocThumb img{width:100%;height:100%;object-fit:cover}.fdocThumb.empty{font-size:11px;background:linear-gradient(180deg,#17191b,#101113);color:#bcb3a5}.fdocControls{display:grid;gap:8px}.fdocUploads,.fdocMeta{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:stretch}.fdocUploads label,.fdocSwitch,.fdocExpiry{height:46px;min-height:46px;border-radius:11px;background:linear-gradient(180deg,#181a1c,#101113);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:var(--fdoc-text);font-weight:720;font-size:13px;padding:7px 10px;box-sizing:border-box}.fdocUploads label{gap:8px;white-space:nowrap}.fdocUploads svg,.fdocDateInputWrap svg{width:19px;height:19px;fill:none;stroke:var(--fdoc-accent);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.fdocUploads input{position:absolute;opacity:0;width:1px;height:1px}.fdocSwitch{display:grid;grid-template-columns:minmax(0,1fr) auto;justify-content:normal;gap:8px;overflow:hidden;text-align:left}.fdocSwitchText{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;color:var(--fdoc-text)}.fdocSwitch input{position:absolute;opacity:0}.fdocSwitchTrack{justify-self:end;width:38px;height:22px;border-radius:999px;background:#242526;position:relative;box-shadow:inset 0 0 0 1px rgba(255,255,255,.11);flex:0 0 auto}.fdocSwitchTrack:after{content:"";position:absolute;width:18px;height:18px;left:2px;top:2px;border-radius:50%;background:#8c8c8c;transition:left .15s ease,background .15s ease}.fdocSwitch input:checked+.fdocSwitchTrack{background:rgba(255,255,255,.20)}.fdocSwitch input:checked+.fdocSwitchTrack:after{left:18px;background:var(--fdoc-accent);box-shadow:0 0 10px rgba(255,255,255,.22)}.fdocExpiry{display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px;justify-content:stretch;text-align:left;overflow:hidden}.fdocExpiry>span:first-child{color:var(--fdoc-text);white-space:nowrap}.fdocDateInputWrap{display:flex;align-items:center;gap:6px;min-width:0}.fdocExpiry input{min-height:28px!important;height:28px!important;padding:0!important;font-size:12.5px!important;border:0!important;background:transparent!important;color:var(--fdoc-text)!important;width:100%;min-width:0}.fdocFull{width:100%;height:auto;border-radius:18px;background:#fff}.fdocFileBig{padding:40px;text-align:center;background:rgba(255,255,255,.06);border-radius:18px;color:var(--fdoc-text);font-weight:850}.evidenceViewerModal{max-height:88vh;overflow:auto}
    @media(max-width:430px){.fdocBar{grid-template-columns:34px minmax(0,1fr) auto 22px;min-height:58px!important;padding:7px 9px!important;gap:8px}.fdocDate{display:none}.fdocIcon{width:30px;height:30px}.fdocIcon svg{width:17px;height:17px}.fdocBadge{font-size:10.5px;padding:5px 7px}.fdocName strong{font-size:14px}.fdocName em{font-size:11.5px}.fdocPanel{padding:8px 9px 10px}.fdocInstruction{font-size:12px!important;margin-bottom:8px!important}.fdocBody{grid-template-columns:70px 1fr;gap:8px}.fdocThumb{width:66px;height:86px;font-size:10px}.fdocUploads,.fdocMeta{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px}.fdocUploads label,.fdocSwitch,.fdocExpiry{height:38px;min-height:38px;padding:5px 7px;font-size:11px;border-radius:10px}.fdocSwitchText,.fdocExpiry>span:first-child{font-size:11px;white-space:nowrap}.fdocSwitchTrack{width:34px;height:20px}.fdocSwitchTrack:after{width:16px;height:16px}.fdocSwitch input:checked+.fdocSwitchTrack:after{left:16px}.fdocUploads svg,.fdocDateInputWrap svg{width:16px;height:16px}.fdocExpiry input{font-size:11px!important;height:24px!important;min-height:24px!important}}
  `;
  document.head.appendChild(css);

  if (typeof bind === 'function' && !bind.__finalDocumentSystemClean) { const oldBind = bind; bind = function () { oldBind(); bindFinal(); }; bind.__finalDocumentSystemClean = true; }
  render();
})();