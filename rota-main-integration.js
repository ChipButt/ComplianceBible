// Moves Rota Home features into the main Home tab and Rota Admin features into main Settings.
(function rotaMainIntegrationPatch() {
  function rs() {
    const base = readRotaState() || {};
    base.sections = base.sections || state.rotaSettings?.sections || ROTA_SECTIONS;
    base.users = state.users || base.users || [];
    base.shifts = base.shifts || [];
    base.logs = base.logs || {};
    base.leaveRequests = base.leaveRequests || [];
    return base;
  }
  function saveRs(data) {
    localStorage.setItem(ROTA_KEY, JSON.stringify(data));
  }
  function rotaUserById(id) {
    return state.users.find(u => u.id === id) || rs().users.find(u => u.id === id) || state.users[0];
  }
  function timeNowShort() { return new Date().toTimeString().slice(0, 5); }
  function mins(time) { const [h, m] = String(time || '00:00').split(':').map(Number); return h * 60 + m; }
  function durationMins(start, end) { const raw = mins(end) - mins(start); return raw < 0 ? raw + 1440 : raw; }
  function hours(start, end) { return Math.round(durationMins(start, end) / 60 * 100) / 100; }
  function rotaLog(data, shiftId) {
    data.logs[shiftId] = data.logs[shiftId] || { in: null, out: null, breaks: [] };
    return data.logs[shiftId];
  }
  function activeShift(data, userId = state.currentUser) {
    return data.shifts.find(shift => shift.userId === userId && rotaLog(data, shift.id).in && !rotaLog(data, shift.id).out);
  }
  function todaysShifts(data, userId = state.currentUser) {
    return data.shifts.filter(shift => shift.userId === userId && shift.date === today()).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  }
  function nextShift(data, userId = state.currentUser) {
    return data.shifts.filter(shift => shift.userId === userId && shift.date >= today()).sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))[0];
  }
  function shiftLine(shift) {
    return `${esc(shift.section)} · ${esc(shift.start)}–${esc(shift.end)} · ${hours(shift.start, shift.end)} hrs`;
  }
  function rotaHomeBlock() {
    const data = rs();
    const meUser = rotaUserById(state.currentUser);
    const todayList = todaysShifts(data, state.currentUser);
    const active = activeShift(data, state.currentUser);
    const next = nextShift(data, state.currentUser);
    return `<section class="panel rotaHomePanel">
      <div class="profileTop rotaHomeTop">
        <span class="avatarText big">${esc(userInitials(meUser.name || meUser.nickname))}</span>
        <div><h2>${esc(meUser.nickname || meUser.name)}</h2><p>${esc(meUser.jobArea || meUser.area || '')} · ${esc(meUser.role || '')}</p></div>
        ${active ? badge('On shift', 'ok') : badge('Ready')}
      </div>
      <div class="profileHero rotaHomeHero">
        <div>${next ? `<p>Next shift</p><h2>${esc(next.start)} – ${esc(next.end)}</h2><p class="muted">${esc(next.date)} · ${esc(next.section)}</p>` : '<p>No upcoming shift</p><h2>—</h2>'}</div>
      </div>
      <div class="quickActions">
        <button data-route="rota">Open schedule</button>
        <button data-route="staff">Open users</button>
      </div>
      <h3>Clock In</h3>
      <div class="workCard">
        <h3>Start unscheduled shift</h3>
        <p class="muted">Use this if no shift has been added for you.</p>
        <label>Section<select id="mainUnscheduledSection">${data.sections.map(section => `<option>${esc(section)}</option>`).join('')}</select></label>
        <label>Note<input id="mainUnscheduledNote" placeholder="Optional duty note"></label>
        <button ${active ? 'disabled' : ''} data-main-unscheduled-clock>Clock in without scheduled shift</button>
      </div>
      ${todayList.length ? todayList.map(shift => mainClockCard(data, shift)).join('') : '<p class="muted">No scheduled shifts today.</p>'}
    </section>`;
  }
  function mainClockCard(data, shift) {
    const log = rotaLog(data, shift.id);
    const on = log.in && !log.out;
    return `<div class="workCard mainClockCard">
      <h3>${esc(shift.section)}</h3>
      <p>${esc(shift.start)} – ${esc(shift.end)}</p>
      <p class="muted">${esc(shift.notes || '')}</p>
      <span class="statusBadge ${on ? 'live' : ''}">${on ? 'Clocked in' : log.out ? 'Clocked out' : 'Ready'}</span>
      <div class="breakControls">
        <button ${log.in ? 'disabled' : ''} data-main-clock-in="${shift.id}">Clock in</button>
        <button ${!on ? 'disabled' : ''} data-main-clock-out="${shift.id}">Clock out</button>
        <button class="secondary" ${!on ? 'disabled' : ''} data-main-break="${shift.id}|unpaid">Unpaid break</button>
        <button class="secondary" ${!on ? 'disabled' : ''} data-main-break="${shift.id}|paid">Paid break</button>
      </div>
    </div>`;
  }

  const oldDashboard = dashboard;
  dashboard = function dashboardWithRotaHome() {
    return rotaHomeBlock() + oldDashboard();
  };

  function rotaAdminSettings() {
    const data = rs();
    return `<h2>Rota Admin</h2>
      <p class="muted">Rota admin tools now live here instead of inside the Rota schedule tab.</p>
      <section class="grid two">
        <article class="panel"><h3>Add shift</h3>${mainShiftForm()}</article>
        <article class="panel"><h3>Sections</h3><form id="mainRotaSectionForm" class="rowForm"><input name="section" placeholder="New section"><button>Add section</button></form><div class="sectionList">${data.sections.map(section => `<div class="sectionRow"><span>${esc(section)}</span><button class="iconBtn danger" data-main-delete-section="${esc(section)}">×</button></div>`).join('')}</div></article>
      </section>
      <section class="panel"><h3>Existing shifts</h3><div class="tableWrap"><table><tr><th>Date</th><th>User</th><th>Shift</th><th>Section</th><th></th></tr>${data.shifts.sort((a,b)=>`${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)).map(shift => { const u = rotaUserById(shift.userId) || {}; return `<tr><td>${esc(shift.date)}</td><td>${esc(u.name || '')}</td><td>${esc(shift.start)}-${esc(shift.end)}</td><td>${esc(shift.section)}</td><td><button class="small secondary" data-main-edit-shift="${shift.id}">Edit</button></td></tr>`; }).join('') || '<tr><td colspan="5">No shifts yet.</td></tr>'}</table></div></section>
      <section class="panel"><h3>Timesheets</h3>${mainTimesheetTable(data)}</section>`;
  }
  function mainShiftForm(shift = null) {
    const data = rs();
    const s = shift || { id: '', userId: state.users.find(u => u.role !== 'Admin')?.id || state.users[0]?.id || '', section: data.sections[0] || 'FOH', date: today(), start: '09:00', end: '17:00', notes: '' };
    return `<form id="mainRotaShiftForm" class="formGrid">
      <input type="hidden" name="id" value="${esc(s.id || '')}">
      <label>Staff<select name="userId">${state.users.map(u => `<option value="${u.id}" ${u.id === s.userId ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
      <label>Section<select name="section">${data.sections.map(section => `<option ${section === s.section ? 'selected' : ''}>${esc(section)}</option>`).join('')}</select></label>
      <label>Date<input name="date" type="date" value="${esc(s.date)}"></label>
      <label>Start<input name="start" type="time" value="${esc(s.start)}"></label>
      <label>End<input name="end" type="time" value="${esc(s.end)}"></label>
      <label class="full">Notes<textarea name="notes">${esc(s.notes || '')}</textarea></label>
      <div class="full formActions"><button>${s.id ? 'Save shift' : 'Add shift'}</button>${s.id ? `<button type="button" class="danger" data-main-delete-shift="${s.id}">Delete</button>` : ''}</div>
    </form>`;
  }
  function mainTimesheetTable(data) {
    const rows = data.shifts.map(shift => {
      const u = rotaUserById(shift.userId) || {};
      const log = rotaLog(data, shift.id);
      const out = log.out || '';
      const inTime = log.in || '';
      let payable = '—';
      if (inTime && out) payable = `${Math.round(durationMins(inTime.slice(11,16) || inTime, out.slice(11,16) || out) / 60 * 100) / 100} hrs`;
      return `<tr><td>${esc(shift.date)}</td><td>${esc(u.name || '')}</td><td>${esc(shift.section)}</td><td>${esc(inTime || '—')}</td><td>${esc(out || '—')}</td><td>${payable}</td></tr>`;
    }).join('');
    return `<div class="tableWrap"><table><tr><th>Date</th><th>User</th><th>Section</th><th>Clock in</th><th>Clock out</th><th>Payable</th></tr>${rows || '<tr><td colspan="6">No timesheets yet.</td></tr>'}</table></div>`;
  }

  const oldSettingsContent = settingsContent;
  settingsContent = function settingsContentWithRotaAdmin() {
    if (settingsTab === 'rota') return rotaAdminSettings();
    return oldSettingsContent();
  };

  function openMainShiftEditor(id) {
    const data = rs();
    const shift = data.shifts.find(s => s.id === id);
    if (!shift) return;
    modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>Edit shift</h2>${mainShiftForm(shift)}</div>`;
    modalRoot.classList.remove('hidden');
    document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
    bindRotaMainIntegration();
  }

  function bindRotaMainIntegration() {
    document.querySelectorAll('[data-main-clock-in]').forEach(btn => btn.onclick = () => { const data = rs(); const log = rotaLog(data, btn.dataset.mainClockIn); log.in = new Date().toISOString(); log.out = null; saveRs(data); render(); });
    document.querySelectorAll('[data-main-clock-out]').forEach(btn => btn.onclick = () => { const data = rs(); const log = rotaLog(data, btn.dataset.mainClockOut); log.out = new Date().toISOString(); const shift = data.shifts.find(s => s.id === btn.dataset.mainClockOut); if (shift?.unscheduled) shift.end = timeNowShort(); saveRs(data); render(); });
    document.querySelectorAll('[data-main-break]').forEach(btn => btn.onclick = () => { const [id, paid] = btn.dataset.mainBreak.split('|'); const data = rs(); const log = rotaLog(data, id); log.breaks = log.breaks || []; log.breaks.push({ start: new Date().toISOString(), end: new Date().toISOString(), paid: paid === 'paid' }); saveRs(data); render(); });
    document.querySelectorAll('[data-main-unscheduled-clock]').forEach(btn => btn.onclick = () => { const data = rs(); if (activeShift(data)) return alert('You are already clocked in.'); const id = uid(); const t = timeNowShort(); data.shifts.push({ id, userId: state.currentUser, section: document.getElementById('mainUnscheduledSection').value, date: today(), start: t, end: t, notes: document.getElementById('mainUnscheduledNote').value || 'Unscheduled shift', unscheduled: true }); data.logs[id] = { in: new Date().toISOString(), out: null, breaks: [] }; saveRs(data); render(); });
    const shiftForm = document.getElementById('mainRotaShiftForm');
    if (shiftForm) shiftForm.onsubmit = event => { event.preventDefault(); const data = rs(); const formData = new FormData(shiftForm); const id = formData.get('id') || uid(); const shift = { id, userId: formData.get('userId'), section: formData.get('section'), date: formData.get('date'), start: formData.get('start'), end: formData.get('end'), notes: formData.get('notes') || '' }; const existing = data.shifts.find(s => s.id === id); if (existing) Object.assign(existing, shift); else data.shifts.push(shift); saveRs(data); modalRoot.classList.add('hidden'); render(); };
    const sectionForm = document.getElementById('mainRotaSectionForm');
    if (sectionForm) sectionForm.onsubmit = event => { event.preventDefault(); const formData = new FormData(sectionForm); const name = String(formData.get('section') || '').trim(); if (!name) return; const data = rs(); if (!data.sections.includes(name)) data.sections.push(name); state.rotaSettings = state.rotaSettings || {}; state.rotaSettings.sections = data.sections; saveRs(data); save(); render(); };
    document.querySelectorAll('[data-main-delete-section]').forEach(btn => btn.onclick = () => { const data = rs(); data.sections = data.sections.filter(s => s !== btn.dataset.mainDeleteSection); state.rotaSettings.sections = data.sections; saveRs(data); save(); render(); });
    document.querySelectorAll('[data-main-edit-shift]').forEach(btn => btn.onclick = () => openMainShiftEditor(btn.dataset.mainEditShift));
    document.querySelectorAll('[data-main-delete-shift]').forEach(btn => btn.onclick = () => { const data = rs(); data.shifts = data.shifts.filter(s => s.id !== btn.dataset.mainDeleteShift); delete data.logs[btn.dataset.mainDeleteShift]; saveRs(data); modalRoot.classList.add('hidden'); render(); });
  }

  const oldBind = bind;
  bind = function bindWithRotaMainIntegration() {
    oldBind();
    bindRotaMainIntegration();
  };

  render();
})();
