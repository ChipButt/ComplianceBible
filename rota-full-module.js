// Internal Rota module for Compliance Bible.
// Uses the Rota-App data model but renders inside the Bible app instead of an iframe.
let rotaView = 'schedule';
let rotaWeekStart = rotaMonday(new Date());
let rotaEditingShiftId = null;

function rotaState() {
  const existing = readRotaState() || {};
  existing.currentUserId = existing.currentUserId || state.currentUser || state.users[0]?.id;
  existing.sections = existing.sections || state.rotaSettings?.sections || ROTA_SECTIONS;
  existing.users = state.users || existing.users || ROTA_NAMES.map(rotaMakeUser);
  existing.shifts = existing.shifts || [];
  existing.logs = existing.logs || {};
  existing.leaveRequests = existing.leaveRequests || [];
  existing.alerts = existing.alerts || [];
  return existing;
}
function saveRotaState(rs) {
  localStorage.setItem(ROTA_KEY, JSON.stringify(rs));
}
function rotaMonday(date) {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}
function rotaPlus(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function rotaIso(date) { return new Date(date).toISOString().slice(0, 10); }
function rotaDayLabel(date) { return new Date(rotaIso(date) + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
function rotaMins(time) { const [h, m] = String(time || '00:00').split(':').map(Number); return h * 60 + m; }
function rotaDuration(start, end) { let mins = rotaMins(end) - rotaMins(start); return mins < 0 ? mins + 1440 : mins; }
function rotaHours(start, end) { return Math.round((rotaDuration(start, end) / 60) * 100) / 100; }
function rotaNowTime() { return new Date().toTimeString().slice(0, 5); }
function rotaUser(id) { return state.users.find(u => u.id === id) || rotaState().users.find(u => u.id === id) || state.users[0]; }
function rotaCanAdmin() { return isAdminUser(); }
function rotaLog(rs, shiftId) { rs.logs[shiftId] = rs.logs[shiftId] || { in: null, out: null, breaks: [] }; return rs.logs[shiftId]; }
function rotaActiveShift(rs) { return rs.shifts.find(s => s.userId === (state.currentUser || rs.currentUserId) && rotaLog(rs, s.id).in && !rotaLog(rs, s.id).out); }

function rotaTabButton(id, label) {
  return `<button class="navBtn ${rotaView === id ? 'active' : ''}" data-rota-view="${id}">${label}</button>`;
}

rota = function fullInternalRota() {
  const rs = rotaState();
  return `<section class="card rotaModule">
    <div class="cardTop">
      <div><h2>Rota</h2><p class="muted">Internal rota module using the Rota-App user model.</p></div>
      ${badge(rs.sections.length + ' sections', 'ok')}
    </div>
    <nav class="mainNav rotaTabs">
      ${rotaTabButton('schedule', 'Schedule')}
      ${rotaTabButton('clock', 'Clock In')}
      ${rotaTabButton('people', 'People')}
      ${rotaCanAdmin() ? rotaTabButton('admin', 'Admin') : ''}
      ${rotaCanAdmin() ? rotaTabButton('timesheets', 'Timesheets') : ''}
    </nav>
    <div id="rotaModuleBody">${rotaBody()}</div>
  </section>`;
};

function rotaBody() {
  if (rotaView === 'clock') return rotaClockView();
  if (rotaView === 'people') return rotaPeopleView();
  if (rotaView === 'admin') return rotaAdminView();
  if (rotaView === 'timesheets') return rotaTimesheetsView();
  return rotaScheduleView();
}

function rotaScheduleView() {
  const rs = rotaState();
  const days = Array.from({ length: 7 }, (_, i) => rotaPlus(rotaWeekStart, i));
  return `<div class="toolbar rotaToolbar">
    <button class="ghost small" data-rota-week="prev">Previous</button>
    <strong>${rotaDayLabel(days[0])} – ${rotaDayLabel(days[6])}</strong>
    <button class="ghost small" data-rota-week="next">Next</button>
  </div>
  <div class="rotaGridInternal">
    <div class="rotaGridHead">Area</div>
    ${days.map(day => `<div class="rotaGridHead">${rotaDayLabel(day).replace(' ', '<br>')}</div>`).join('')}
    ${rs.sections.map(section => `<div class="rotaSectionHead">${esc(section)}</div>${days.map(day => rotaDayCell(rs, section, rotaIso(day))).join('')}`).join('')}
  </div>`;
}
function rotaDayCell(rs, section, date) {
  const shifts = rs.shifts.filter(s => s.section === section && s.date === date);
  return `<div class="rotaDayCellInternal">
    ${shifts.length ? shifts.map(s => rotaShiftCard(s)).join('') : '<span class="muted">—</span>'}
    ${rotaCanAdmin() ? `<button class="cellAddShift" data-shift-new="${date}|${esc(section)}">+</button>` : ''}
  </div>`;
}
function rotaShiftCard(shift) {
  const u = rotaUser(shift.userId) || {};
  return `<button class="shiftBlock" data-shift-edit="${shift.id}">
    <strong>${esc(u.nickname || u.name || 'Unassigned')}</strong>
    <span>${esc(shift.start)}–${esc(shift.end)}</span>
    <small>${esc(shift.section)} · ${rotaHours(shift.start, shift.end)} hrs</small>
    ${shift.notes ? `<small>${esc(shift.notes)}</small>` : ''}
  </button>`;
}

function rotaClockView() {
  const rs = rotaState();
  const currentId = state.currentUser || rs.currentUserId;
  const todayShifts = rs.shifts.filter(s => s.userId === currentId && s.date === today());
  const active = rotaActiveShift(rs);
  return `<section class="grid two">
    <article class="card"><h3>Scheduled shifts today</h3>${todayShifts.length ? todayShifts.map(s => rotaClockCard(rs, s)).join('') : '<p class="muted">No scheduled shift today.</p>'}</article>
    <article class="card"><h3>Unscheduled shift</h3><p class="muted">Use this if someone needs to clock in without a scheduled shift.</p><form id="rotaUnscheduledForm" class="stack"><select name="section">${rs.sections.map(s => `<option>${esc(s)}</option>`).join('')}</select><input name="notes" placeholder="Optional duty note"><button class="primary" ${active ? 'disabled' : ''}>Clock in without scheduled shift</button></form></article>
  </section>`;
}
function rotaClockCard(rs, shift) {
  const l = rotaLog(rs, shift.id);
  const on = l.in && !l.out;
  const openBreak = (l.breaks || []).find(b => b.start && !b.end);
  return `<div class="docItem"><div><strong>${esc(shift.section)}</strong><span>${esc(shift.start)}–${esc(shift.end)} · ${esc(shift.notes || '')}</span><p>${l.in ? 'Clocked in: ' + esc(l.in) : 'Not clocked in'}${l.out ? ' · Clocked out: ' + esc(l.out) : ''}</p></div><div><button class="primary small" data-clock-in="${shift.id}" ${l.in ? 'disabled' : ''}>Clock in</button><button class="ghost small" data-clock-out="${shift.id}" ${!on ? 'disabled' : ''}>Clock out</button><button class="ghost small" data-break-toggle="${shift.id}" ${!on ? 'disabled' : ''}>${openBreak ? 'End break' : 'Start break'}</button></div></div>`;
}

function rotaPeopleView() {
  return `<div class="grid cards">${state.users.map(u => `<article class="card"><div class="cardTop"><h3>${esc(u.nickname || u.name)}</h3>${badge(u.role || 'Staff', u.role === 'Admin' ? 'ok' : '')}</div><p><strong>${esc(u.name)}</strong><br>${esc(u.jobArea || u.area || 'FOH')} · ${esc(u.pronouns || 'No pronouns set')}</p><p class="muted">${esc(u.email || 'No email')}<br>${esc(u.mobile || 'No mobile')}</p>${rotaCanAdmin() ? `<button class="ghost small" data-edit-user="${u.id}">Edit profile</button>` : ''}</article>`).join('')}</div>`;
}

function rotaAdminView() {
  const rs = rotaState();
  return `<section class="grid two">
    <article class="card"><h3>Add shift</h3>${rotaShiftForm()}</article>
    <article class="card"><h3>Rota sections</h3><ul class="plainList">${rs.sections.map(s => `<li><span>${esc(s)}</span><button class="ghost small" data-rota-delete-section="${esc(s)}">Remove</button></li>`).join('')}</ul><form id="rotaAddSectionForm" class="inlineForm"><input name="section" placeholder="New section" required><button class="primary">Add</button></form></article>
  </section>`;
}
function rotaShiftForm(shift = null) {
  const rs = rotaState();
  const s = shift || { userId: state.users[0]?.id, section: rs.sections[0], date: today(), start: '09:00', end: '17:00', notes: '' };
  return `<form id="rotaShiftForm" class="stack"><input type="hidden" name="id" value="${esc(s.id || '')}"><select name="userId">${state.users.map(u => `<option value="${u.id}" ${u.id === s.userId ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select><select name="section">${rs.sections.map(sec => `<option ${sec === s.section ? 'selected' : ''}>${esc(sec)}</option>`).join('')}</select><input name="date" type="date" value="${esc(s.date)}"><div class="grid two"><input name="start" type="time" value="${esc(s.start)}"><input name="end" type="time" value="${esc(s.end)}"></div><textarea name="notes" placeholder="Shift notes">${esc(s.notes || '')}</textarea><button class="primary">${s.id ? 'Save shift' : 'Add shift'}</button>${s.id ? `<button type="button" class="ghost" data-shift-delete="${s.id}">Delete shift</button>` : ''}</form>`;
}

function rotaTimesheetsView() {
  const rs = rotaState();
  const rows = rs.shifts.map(s => {
    const l = rotaLog(rs, s.id);
    const paidBreakMins = (l.breaks || []).filter(b => b.paid && b.start && b.end).reduce((sum, b) => sum + rotaDuration(b.start, b.end), 0);
    const unpaidBreakMins = (l.breaks || []).filter(b => !b.paid && b.start && b.end).reduce((sum, b) => sum + rotaDuration(b.start, b.end), 0);
    const workedMins = l.in && l.out ? rotaDuration(l.in, l.out) - unpaidBreakMins : 0;
    const u = rotaUser(s.userId) || {};
    return `<tr><td>${esc(s.date)}</td><td>${esc(u.name || '')}</td><td>${esc(s.section)}</td><td>${esc(l.in || '—')}</td><td>${esc(l.out || '—')}</td><td>${Math.max(0, Math.round(workedMins / 60 * 100) / 100)}</td><td>${Math.round(paidBreakMins / 60 * 100) / 100}</td><td>${Math.round(unpaidBreakMins / 60 * 100) / 100}</td></tr>`;
  }).join('');
  return `<div class="tableWrap"><table><thead><tr><th>Date</th><th>User</th><th>Section</th><th>Clock in</th><th>Clock out</th><th>Payable hrs</th><th>Paid break hrs</th><th>Unpaid break hrs</th></tr></thead><tbody>${rows || '<tr><td colspan="8">No timesheet entries yet.</td></tr>'}</tbody></table></div>`;
}

function rotaOpenShiftEditor(shiftId = '', date = '', section = '') {
  const rs = rotaState();
  const shift = rs.shifts.find(s => s.id === shiftId) || { userId: state.users[0]?.id, section: section || rs.sections[0], date: date || today(), start: '09:00', end: '17:00', notes: '' };
  modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>${shift.id ? 'Edit shift' : 'Add shift'}</h2>${rotaShiftForm(shift)}</div>`;
  modalRoot.classList.remove('hidden');
  document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
  bindRotaEvents();
}

function rotaSaveShift(event) {
  const rs = rotaState();
  const data = fd(event);
  const id = data.id || uid('s');
  const shift = { id, userId: data.userId, section: data.section, date: data.date, start: data.start, end: data.end, notes: data.notes || '' };
  const existing = rs.shifts.find(s => s.id === id);
  if (existing) Object.assign(existing, shift); else rs.shifts.push(shift);
  saveRotaState(rs);
  modalRoot.classList.add('hidden');
  render();
}

function bindRotaEvents() {
  document.querySelectorAll('[data-rota-view]').forEach(btn => btn.onclick = () => { rotaView = btn.dataset.rotaView; render(); });
  document.querySelectorAll('[data-rota-week]').forEach(btn => btn.onclick = () => { rotaWeekStart = rotaPlus(rotaWeekStart, btn.dataset.rotaWeek === 'next' ? 7 : -7); render(); });
  document.querySelectorAll('[data-shift-new]').forEach(btn => btn.onclick = () => { const [date, section] = btn.dataset.shiftNew.split('|'); rotaOpenShiftEditor('', date, section); });
  document.querySelectorAll('[data-shift-edit]').forEach(btn => btn.onclick = () => { if (rotaCanAdmin()) rotaOpenShiftEditor(btn.dataset.shiftEdit); });
  on('rotaShiftForm', rotaSaveShift);
  document.querySelectorAll('[data-shift-delete]').forEach(btn => btn.onclick = () => { const rs = rotaState(); rs.shifts = rs.shifts.filter(s => s.id !== btn.dataset.shiftDelete); delete rs.logs[btn.dataset.shiftDelete]; saveRotaState(rs); modalRoot.classList.add('hidden'); render(); });
  on('rotaAddSectionForm', event => { const rs = rotaState(); const d = fd(event); if (d.section && !rs.sections.includes(d.section)) rs.sections.push(d.section); state.rotaSettings = state.rotaSettings || {}; state.rotaSettings.sections = rs.sections; saveRotaState(rs); save(); render(); });
  document.querySelectorAll('[data-rota-delete-section]').forEach(btn => btn.onclick = () => { const rs = rotaState(); rs.sections = rs.sections.filter(s => s !== btn.dataset.rotaDeleteSection); state.rotaSettings.sections = rs.sections; saveRotaState(rs); save(); render(); });
  document.querySelectorAll('[data-clock-in]').forEach(btn => btn.onclick = () => { const rs = rotaState(); rotaLog(rs, btn.dataset.clockIn).in = rotaNowTime(); saveRotaState(rs); render(); });
  document.querySelectorAll('[data-clock-out]').forEach(btn => btn.onclick = () => { const rs = rotaState(); rotaLog(rs, btn.dataset.clockOut).out = rotaNowTime(); saveRotaState(rs); render(); });
  document.querySelectorAll('[data-break-toggle]').forEach(btn => btn.onclick = () => { const rs = rotaState(); const log = rotaLog(rs, btn.dataset.breakToggle); const open = log.breaks.find(b => b.start && !b.end); if (open) open.end = rotaNowTime(); else log.breaks.push({ start: rotaNowTime(), end: null, paid: confirm('Is this break paid? OK = paid, Cancel = unpaid') }); saveRotaState(rs); render(); });
  on('rotaUnscheduledForm', event => { const rs = rotaState(); const d = fd(event); const shift = { id: uid('s'), userId: state.currentUser || rs.currentUserId, section: d.section, date: today(), start: rotaNowTime(), end: rotaNowTime(), notes: d.notes || 'Unscheduled shift', unscheduled: true }; rs.shifts.push(shift); rotaLog(rs, shift.id).in = rotaNowTime(); saveRotaState(rs); render(); });
}

const previousBindBeforeFullRota = bind;
bind = function bindWithFullRota() {
  previousBindBeforeFullRota();
  bindRotaEvents();
};

render();
