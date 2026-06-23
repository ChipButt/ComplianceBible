// Main Docs hub: central document finder plus staff docs and training matrix.
(function docsHubFinalPatch() {
  let docsFilter = 'all';

  function docReqs() {
    try { return JSON.parse(localStorage.getItem('complianceUserDocumentRequirementsV1') || '[]'); } catch { return []; }
  }
  function userDocRecords() {
    state.userRequiredDocuments = state.userRequiredDocuments || [];
    return state.userRequiredDocuments;
  }
  function allTrainingNames() {
    const names = new Set(['Food Hygiene', 'Allergen Awareness', 'Fire Safety', 'Challenge 25', 'Manual Handling']);
    state.training.forEach(t => names.add(t.course));
    docReqs().forEach(r => names.add(r.title));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }
  function groupForUser(user) {
    return user.jobArea || user.area || 'FOH';
  }
  function requiredForUser(user) {
    const group = groupForUser(user);
    return docReqs().filter(req => (req.staffGroups || []).includes(group));
  }
  function statusKind(status) {
    if (status === 'Valid' || status === 'Stored' || status === 'Uploaded' || status === 'No Expiry') return 'ok';
    if (status === 'Due Soon' || status === 'Expires Soon') return 'warn';
    return 'danger';
  }
  function recordStatus(record) {
    if (!record) return { label: 'Missing', kind: 'danger' };
    if (record.noExpiry) return { label: 'No Expiry', kind: 'ok' };
    if (!record.expiryDate) return { label: 'Uploaded', kind: 'warn' };
    const now = new Date(today() + 'T00:00:00');
    const expiry = new Date(record.expiryDate + 'T00:00:00');
    const days = Math.ceil((expiry - now) / 86400000);
    if (days < 0) return { label: 'Expired', kind: 'danger' };
    if (days <= 30) return { label: 'Expires Soon', kind: 'warn' };
    return { label: 'Valid', kind: 'ok' };
  }
  function staffDocRows(filter = 'all') {
    const reqs = docReqs();
    const records = userDocRecords();
    let rows = [];
    state.users.forEach(user => {
      reqs.forEach(req => {
        const groupRequired = (req.staffGroups || []).includes(groupForUser(user));
        const record = records.find(r => r.userId === user.id && r.requirementId === req.id);
        if (!groupRequired && !record) return;
        const haystack = `${req.title} ${user.name} ${user.nickname} ${groupForUser(user)}`.toLowerCase();
        if (filter !== 'all' && !haystack.includes(filter.toLowerCase())) return;
        const status = recordStatus(record);
        rows.push({ user, req, record, status, groupRequired });
      });
    });
    return rows;
  }
  function premisesRows(filter = 'all') {
    return state.docs.filter(doc => filter === 'all' || `${doc.title} ${doc.cat}`.toLowerCase().includes(filter.toLowerCase()));
  }
  function finderButton(id, label) {
    return `<button class="secondary ${docsFilter === id ? 'activeFilter' : ''}" data-docs-filter="${esc(id)}">${esc(label)}</button>`;
  }
  function docFinderButtons() {
    const reqs = docReqs();
    const buttons = [finderButton('all', 'All documents'), finderButton('premises', 'Premises documents'), finderButton('staff', 'All staff documents')];
    const common = ['Allergen Awareness', 'Food Hygiene', 'Challenge 25', 'Right to Work', 'Fire Safety'];
    common.forEach(name => buttons.push(finderButton(name, name)));
    reqs.map(r => r.title).filter(title => !common.some(c => c.toLowerCase() === title.toLowerCase())).forEach(title => buttons.push(finderButton(title, title)));
    return `<div class="buttonRow docFinderButtons">${buttons.join('')}</div>`;
  }
  function trainingStatusFor(user, item) {
    const training = state.training.find(t => t.userId === user.id && t.course.toLowerCase() === item.toLowerCase());
    if (training) return { label: training.status, kind: statusKind(training.status), extra: training.expiry ? `Expires ${training.expiry}` : 'No expiry set' };
    const req = docReqs().find(r => r.title.toLowerCase() === item.toLowerCase());
    if (req) {
      const needed = (req.staffGroups || []).includes(groupForUser(user));
      const record = userDocRecords().find(r => r.userId === user.id && r.requirementId === req.id);
      if (!needed && !record) return { label: 'N/A', kind: '', extra: 'Not required' };
      const status = recordStatus(record);
      return { ...status, extra: record?.noExpiry ? 'No expiry date' : record?.expiryDate ? `Expires ${record.expiryDate}` : 'No expiry set' };
    }
    return { label: 'Missing', kind: 'danger', extra: 'No record' };
  }
  function trainingMatrix() {
    const names = allTrainingNames();
    return `<section class="panel"><h2>Training matrix</h2><p class="muted">Shows training records and required staff document status in one table.</p><div class="tableWrap trainingMatrixWrap"><table class="trainingMatrix"><thead><tr><th>Staff</th><th>Group</th>${names.map(name => `<th>${esc(name)}</th>`).join('')}</tr></thead><tbody>${state.users.map(user => `<tr><td><strong>${esc(user.nickname || user.name)}</strong><br><span class="muted">${esc(user.name)}</span></td><td>${esc(groupForUser(user))}</td>${names.map(name => { const status = trainingStatusFor(user, name); return `<td title="${esc(status.extra)}">${badge(status.label, status.kind)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  function documentList() {
    const showPremises = docsFilter === 'all' || docsFilter === 'premises' || !['staff'].includes(docsFilter);
    const showStaff = docsFilter === 'all' || docsFilter === 'staff' || docsFilter !== 'premises';
    const premisesFilter = ['all', 'premises', 'staff'].includes(docsFilter) ? 'all' : docsFilter;
    const staffFilter = ['all', 'premises', 'staff'].includes(docsFilter) ? 'all' : docsFilter;
    const premises = showPremises && docsFilter !== 'staff' ? premisesRows(premisesFilter) : [];
    const staffDocs = showStaff ? staffDocRows(staffFilter) : [];
    return `<section class="grid two">
      <article class="panel"><h2>Premises documents</h2><div class="docList">${premises.length ? premises.map(d => `<div class="docItem"><div><strong>${esc(d.title)}</strong><span>${esc(d.cat)} · ${d.expiry ? 'Expires ' + esc(d.expiry) : 'No expiry set'}</span><p>${esc(d.notes)}</p></div><div>${badge(d.status, d.status === 'Stored' ? 'ok' : 'warn')}<button class="ghost small" data-doc="${d.id}">${d.status === 'Stored' ? 'Mark missing' : 'Mark stored'}</button></div></div>`).join('') : '<p class="muted">No premises documents match this filter.</p>'}</div></article>
      <article class="panel"><h2>Staff documents</h2><div class="docList">${staffDocs.length ? staffDocs.map(row => `<div class="docItem"><div><strong>${esc(row.req.title)}</strong><span>${esc(row.user.name)} · ${esc(groupForUser(row.user))}</span><p>${row.record?.fileName ? 'File: ' + esc(row.record.fileName) : row.groupRequired ? 'Required but no file uploaded' : 'Uploaded, not currently required for group'}</p><p>${row.record?.noExpiry ? 'No Expiry Date' : row.record?.expiryDate ? 'Expires ' + esc(row.record.expiryDate) : 'No expiry date set'}</p></div><div>${badge(row.status.label, row.status.kind)}<button class="ghost small" data-route="staff">Open user</button></div></div>`).join('') : '<p class="muted">No staff documents match this filter.</p>'}</div></article>
    </section>`;
  }

  documents = function centralDocumentsHub() {
    return `<section class="hero card"><div><p class="eyebrow">Document Hub</p><h2>All documents and staff training</h2><p>Find premises records, staff certificates, uploaded required documents, and training status from one place.</p></div>${badge('Central vault', 'ok')}</section>
      <section class="panel"><h2>Document groups</h2>${docFinderButtons()}</section>
      ${documentList()}
      ${trainingMatrix()}
      <section class="panel"><h2>Add premises document record</h2><form id="docForm" class="stack"><input name="title" placeholder="Document title" required><select name="cat"><option>Licensing</option><option>Food Safety</option><option>Fire Safety</option><option>Health & Safety</option><option>Staff</option><option>Equipment</option></select><input name="expiry" type="date"><textarea name="notes" placeholder="Notes, location, renewal info"></textarea><button class="primary">Add document</button></form></section>`;
  };

  const previousBindDocsHub = bind;
  bind = function bindDocsHub() {
    previousBindDocsHub();
    document.querySelectorAll('[data-docs-filter]').forEach(button => button.onclick = () => { docsFilter = button.dataset.docsFilter; render(); });
  };

  const style = document.createElement('style');
  style.textContent = `
    .docFinderButtons { gap: 8px; }
    .docFinderButtons button.activeFilter { background: var(--accent) !important; color: #111 !important; }
    .trainingMatrixWrap { max-height: 70vh; }
    .trainingMatrix th:first-child, .trainingMatrix td:first-child { position: sticky; left: 0; background: var(--panel); z-index: 2; }
    .trainingMatrix th { white-space: nowrap; }
    .trainingMatrix td { min-width: 120px; }
  `;
  document.head.appendChild(style);
})();
