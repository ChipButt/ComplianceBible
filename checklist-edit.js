// Adds checklist editing without disturbing existing stored data.
function checklistOptionList(values, selected) {
  return values.map(v => `<option ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join('');
}

checkCard = function checkCard(c) {
  const d = done(c.id), od = overdue(c);
  return `<article class="card checkCard ${d ? 'done' : od ? 'overdue' : ''}">
    <div class="cardTop"><h3>${esc(c.title)}</h3>${d ? badge('Done', 'ok') : od ? badge('Overdue', 'danger') : badge('Due ' + c.due, 'warn')}</div>
    <p>${esc(c.area)} · ${esc(c.freq)}${c.sign ? ' · Manager sign-off' : ''}</p>
    <div class="miniRow">
      <button class="primary" data-complete="${c.id}">${d ? 'View / redo check' : 'Complete check'}</button>
      <button class="ghost small" data-edit-check="${c.id}">Edit checklist</button>
    </div>
  </article>`;
};

checks = function checks() {
  return `<section class="grid two">
    <article class="card">
      <h2>Manage checklists</h2>
      <p class="muted">Use Edit to change checklist items, due time, area, frequency and manager sign-off.</p>
      ${state.checks.map(c => `<div class="docItem">
        <div><strong>${esc(c.title)}</strong><span>${esc(c.area)} · ${esc(c.freq)} · Due ${esc(c.due)}</span></div>
        <div><button class="ghost small" data-edit-check="${c.id}">Edit</button><button class="primary small" data-complete="${c.id}">Complete</button></div>
      </div>`).join('')}
    </article>
    <article class="card">
      <h2>Add custom check</h2>
      <form id="checkForm" class="stack">
        <input name="title" placeholder="Check title" required>
        <select name="area">${checklistOptionList(state.areas)}</select>
        <select name="freq"><option>Daily</option><option>Weekly</option><option>Monthly</option></select>
        <input name="due" type="time" value="12:00" required>
        <textarea name="items" placeholder="One checklist item per line" required></textarea>
        <label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label>
        <button class="primary">Add check</button>
      </form>
    </article>
  </section>
  <section class="card"><h2>Completion history</h2>${history()}</section>`;
};

function openEditCheck(id) {
  const c = state.checks.find(x => x.id === id);
  if (!c) return;
  modalRoot.innerHTML = `<div class="modalCard">
    <button class="close" id="closeModal">×</button>
    <h2>Edit checklist</h2>
    <p class="muted">For fridge/freezer checks, put each unit on its own line, for example: Kitchen Fridge 1 recorded.</p>
    <form id="editCheckForm" class="stack">
      <input name="title" value="${esc(c.title)}" required>
      <select name="area">${checklistOptionList(state.areas, c.area)}</select>
      <select name="freq">${checklistOptionList(['Daily', 'Weekly', 'Monthly'], c.freq)}</select>
      <input name="due" type="time" value="${esc(c.due)}" required>
      <textarea name="items" required>${esc((c.items || []).join('\n'))}</textarea>
      <label class="checkline"><input type="checkbox" name="sign" ${c.sign ? 'checked' : ''}> Requires manager sign-off</label>
      <button class="primary">Save checklist changes</button>
      <button type="button" class="ghost" id="deleteCheckBtn">Delete this checklist</button>
    </form>
  </div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  document.getElementById('deleteCheckBtn').onclick = () => {
    if (confirm('Delete this checklist? Completed history will remain, but this check will no longer appear.')) {
      state.checks = state.checks.filter(x => x.id !== id);
      save();
      modalRoot.classList.add('hidden');
      render();
    }
  };
  document.getElementById('editCheckForm').onsubmit = e => {
    const d = fd(e);
    c.title = d.title;
    c.area = d.area;
    c.freq = d.freq;
    c.due = d.due;
    c.sign = e.target.sign.checked;
    c.items = d.items.split('\n').map(x => x.trim()).filter(Boolean);
    save();
    modalRoot.classList.add('hidden');
    render();
  };
}

const originalBindForChecklistEditing = bind;
bind = function patchedBind() {
  originalBindForChecklistEditing();
  document.querySelectorAll('[data-edit-check]').forEach(b => b.onclick = () => openEditCheck(b.dataset.editCheck));
};

render();
