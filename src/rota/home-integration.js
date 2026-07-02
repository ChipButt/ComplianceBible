// Integrates the Rota App Home screen into the main Compliance Home tab and keeps Rota Admin tools in Settings.
(function rotaMainIntegrationPatch() {
  if (window.__rotaMainIntegrationPatchV2) return;
  window.__rotaMainIntegrationPatchV2 = true;

  function safeRotaState() {
    const base = (typeof readRotaState === 'function' && readRotaState()) || {};
    base.sections = base.sections || (state.rotaSettings && state.rotaSettings.sections) || (typeof ROTA_SECTIONS !== 'undefined' ? ROTA_SECTIONS : ['FOH', 'Kitchen', 'Office']);
    base.users = state.users || base.users || [];
    base.shifts = base.shifts || [];
    base.logs = base.logs || {};
    base.leaveRequests = base.leaveRequests || [];
    return base;
  }

  function saveRotaStateLocal(data) {
    if (typeof ROTA_KEY !== 'undefined') localStorage.setItem(ROTA_KEY, JSON.stringify(data));
  }

  function currentUserId() { return state.currentUser || (state.users && state.users[0] && state.users[0].id); }
  function assignedToCurrentUser(assignedUserId) { const value = String(assignedUserId || '').trim(); const key = value.toLowerCase(); return !value || key === 'everyone' || key === 'all' || key === 'all users' || value === currentUserId(); }
  function rotaUserById(id) { return (state.users || []).find(u => u.id === id) || safeRotaState().users.find(u => u.id === id) || (state.users || [])[0] || {}; }
  function isSystemUser(user) { return !!(user && (user.hidden === true || user.setupAdmin === true)); }
  function assignableUsers() { return (state.users || []).filter(user => !isSystemUser(user)); }
  function timeNowShort() { return new Date().toTimeString().slice(0, 5); }
  function mins(time) { const bits = String(time || '00:00').split(':').map(Number); return (bits[0] || 0) * 60 + (bits[1] || 0); }
  function durationMins(start, end) { const raw = mins(end) - mins(start); return raw < 0 ? raw + 1440 : raw; }
  function hours(start, end) { return Math.round(durationMins(start, end) / 60 * 100) / 100; }
  function niceDate(date) { try { return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return date || ''; } }
  function startDate(shift) { return new Date(String(shift.date || today()) + 'T' + String(shift.start || '00:00') + ':00'); }
  function makeShiftId() { return 's_' + Math.random().toString(36).slice(2, 9); }
  function normaliseFrequency(value) { const text = String(value || 'Daily').trim(); const key = text.toLowerCase(); if (key === 'yearly') return 'Annual'; if (key === 'six-monthly' || key === 'six monthly' || key === 'every six months') return 'Every 6 Months'; return text || 'Daily'; }
  function todayParts() { const bits = today().split('-').map(Number); return { month: bits[1] || 0, day: bits[2] || 0 }; }
  function dueDateParts(check) { const bits = String(check.assignedDueDate || check.dueDate || '').split('-').map(Number); return { raw: check.assignedDueDate || check.dueDate || '', month: bits[1] || 0, day: bits[2] || 0 }; }
  function sameMonthDay(a, b) { return a.month === b.month && a.day === b.day; }
  function sixMonthPairDue(start, now) { if (!start.month || !start.day) return false; const pairMonth = ((start.month + 5) % 12) + 1; return sameMonthDay(start, now) || (now.month === pairMonth && now.day === start.day); }

  function rotaLog(data, shiftId) {
    data.logs[shiftId] = data.logs[shiftId] || { in: null, out: null, breaks: [] };
    return data.logs[shiftId];
  }

  function activeShift(data, userId) {
    const id = userId || currentUserId();
    return data.shifts.find(shift => shift.userId === id && rotaLog(data, shift.id).in && !rotaLog(data, shift.id).out);
  }

  function todaysShifts(data, userId) {
    const id = userId || currentUserId();
    return data.shifts.filter(shift => shift.userId === id && shift.date === today()).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  }

  function assignedCheckDueToday(check) {
    if (!check) return false;
    if (!assignedToCurrentUser(check.assignedUserId)) return false;
    try { if (typeof done === 'function' && done(check.id)) return false; } catch (e) {}
    const freq = normaliseFrequency(check.freq || 'Daily');
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (freq === 'Weekly' && check.assignedWeeklyDay) return days[now.getDay()] === check.assignedWeeklyDay;
    if (freq === 'Monthly' && check.assignedMonthlyDate) return String(now.getDate()) === String(check.assignedMonthlyDate);
    if (freq === 'Annual') { const annual = dueDateParts(check); return annual.raw ? sameMonthDay(annual, todayParts()) : true; }
    if (freq === 'Every 6 Months') { const six = dueDateParts(check); return six.raw ? sixMonthPairDue(six, todayParts()) : true; }
    return true;
  }

  function assignedChecksHomeBlock() {
    const checks = (state.checks || []).filter(assignedCheckDueToday);
    if (!checks.length) return '';
    return `<div class="homeAssignedChecks"><h2>Assigned checks</h2>${checks.map(check => {
      if (typeof window.renderHomeAssignedCheckButton === 'function') return window.renderHomeAssignedCheckButton(check);
      return `<button type="button" data-open-assigned-check="${esc(check.id)}" class="homeAssignedCheck"><span>${esc(check.title)}</span><small>${esc(check.area || '')} · ${esc(normaliseFrequency(check.freq))} · Due ${esc(check.due || '')}</small></button>`;
    }).join('')}</div>`;
  }

  function upcomingShifts(data, userId) {
    const id = userId || currentUserId();
    return data.shifts.filter(shift => shift.userId === id && shift.date >= today()).sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }

  function nextShift(data, userId) {
    const now = new Date();
    return upcomingShifts(data, userId).filter(shift => startDate(shift) > now && !rotaLog(data, shift.id).out)[0] || upcomingShifts(data, userId)[0];
  }

  function countdownText(shift) {
    if (!shift) return 'No upcoming shift';
    const minutes = Math.max(0, Math.floor((startDate(shift) - new Date()) / 60000));
    const days = Math.floor(minutes / 1440);
    const hoursLeft = Math.floor((minutes % 1440) / 60);
    const minsLeft = minutes % 60;
    const bits = [];
    if (days) bits.push(days + ' day' + (days === 1 ? '' : 's'));
    if (hoursLeft) bits.push(hoursLeft + ' hour' + (hoursLeft === 1 ? '' : 's'));
    bits.push(minsLeft + ' minute' + (minsLeft === 1 ? '' : 's'));
    return 'Starting in ' + bits.join(', ') + ' at ' + (shift.section || 'work');
  }

  function clockText() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function homeClockCard(data) {
    const n = nextShift(data, currentUserId());
    return `<div class="homeClockCard">
      <div class="homeClockTime">${esc(clockText())}</div>
      <div class="homeCountdown">${esc(countdownText(n))}</div>
      ${n ? `<div class="homeNextShiftLine">${esc(n.section)} · ${esc(n.start)} – ${esc(n.end)}</div>` : ''}
    </div>`;
  }

  function hasShiftToday(data) {
    return todaysShifts(data, currentUserId()).length > 0;
  }

  function unscheduledBox(data, live) {
    if (hasShiftToday(data)) return '';
    return `<div class="workCard unscheduledHomeBox">
      <h3>Start unscheduled shift</h3>
      <p class="muted">Use this if no shift has been added for you today.</p>
      <label>Section<select id="mainUnscheduledSection">${data.sections.map(section => `<option>${esc(section)}</option>`).join('')}</select></label>
      <label>Note<input id="mainUnscheduledNote" placeholder="Optional duty note"></label>
      <button class="startShiftBtn unscheduledStartBtn" ${live ? 'disabled' : ''} data-main-unscheduled-clock>Start Unscheduled Shift</button>
    </div>`;
  }

  function shiftButtons(data, shift) {
    const log = rotaLog(data, shift.id);
    const live = activeShift(data, currentUserId());
    const isThisLive = live && live.id === shift.id;
    if (isThisLive) {
      return `<button class="endShiftBtn" data-main-clock-out="${shift.id}">End Shift</button>
        <button class="breakUnpaidBtn secondary" data-main-break="${shift.id}|unpaid">Start Unpaid Break</button>
        <button class="breakPaidBtn secondary" data-main-break="${shift.id}|paid">Start Paid Break</button>`;
    }
    if (!live && shift.date === today() && !log.out) return `<button class="startShiftBtn" data-main-clock-in="${shift.id}">Start Shift</button>`;
    return '';
  }

  function shiftCard(data, shift) {
    const log = rotaLog(data, shift.id);
    const status = log.in && !log.out ? 'On shift' : log.out ? 'Completed' : shift.date === today() ? 'Today' : 'Upcoming';
    return `<div class="homeShiftCard mainClockCard">
      <div>
        <strong>${esc(niceDate(shift.date))}</strong>
        <h3>${esc(shift.start)} – ${esc(shift.end)}</h3>
        <p>${esc(shift.section)}</p>
        <p class="muted">${esc(status + (shift.notes ? ' · ' + shift.notes : ''))}</p>
      </div>
      <div class="homeShiftActions">${shiftButtons(data, shift)}</div>
    </div>`;
  }

  function rotaHomeBlock() {
    const data = safeRotaState();
    const meUser = rotaUserById(currentUserId());
    const live = activeShift(data, currentUserId());
    const shifts = upcomingShifts(data, currentUserId());
    return `<section class="panel homePanel rotaHomePanel">
      <div class="rotaHomeIdentity">
        <span class="avatarText big">${esc(userInitials(meUser.name || meUser.nickname || 'U'))}</span>
        <div>
          <p class="muted">Rota Home</p>
          <h2>${esc(meUser.nickname || meUser.name || 'Current user')}</h2>
          <p>${esc(meUser.jobArea || meUser.area || meUser.role || '')}</p>
        </div>
        ${live ? badge('On shift', 'ok') : badge('Ready')}
      </div>
      ${homeClockCard(data)}
      ${unscheduledBox(data, live)}
      ${assignedChecksHomeBlock()}
      <h2>Upcoming shifts</h2>
      <div class="homeShiftList">${shifts.length ? shifts.map(shift => shiftCard(data, shift)).join('') : '<p class="muted">No upcoming shifts</p>'}</div>
    </section>`;
  }

  if (typeof dashboard === 'function' && !dashboard.__rotaHomeIntegratedV2) {
    const oldDashboard = dashboard;
    dashboard = function dashboardWithExactRotaHome() {
      return rotaHomeBlock() + oldDashboard();
    };
    dashboard.__rotaHomeIntegratedV2 = true;
  }

  function rotaAdminSettings() {
    const data = safeRotaState();
    return `<h2>Rota Admin</h2>
      <p class="muted">Rota admin tools live here instead of inside the Rota schedule tab.</p>
      <section class="grid two">
        <article class="panel"><h3>Add shift</h3>${mainShiftForm()}</article>
        <article class="panel"><h3>Sections</h3><form id="mainRotaSectionForm" class="rowForm"><input name="section" placeholder="New section"><button>Add section</button></form><div class="sectionList">${data.sections.map(section => `<div class="sectionRow"><span>${esc(section)}</span><button class="iconBtn danger" data-main-delete-section="${esc(section)}">×</button></div>`).join('')}</div></article>
      </section>
      <section class="panel"><h3>Existing shifts</h3><div class="tableWrap"><table><tr><th>Date</th><th>User</th><th>Shift</th><th>Section</th><th></th></tr>${data.shifts.sort((a,b)=>`${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)).map(shift => { const u = rotaUserById(shift.userId) || {}; return `<tr><td>${esc(shift.date)}</td><td>${esc(u.name || '')}</td><td>${esc(shift.start)}-${esc(shift.end)}</td><td>${esc(shift.section)}</td><td><button class="small secondary" data-main-edit-shift="${shift.id}">Edit</button></td></tr>`; }).join('') || '<tr><td colspan="5">No shifts yet.</td></tr>'}</table></div></section>
      <section class="panel"><h3>Timesheets</h3>${mainTimesheetTable(data)}</section>`;
  }

  function mainShiftForm(shift) {
    const data = safeRotaState();
    const users = assignableUsers();
    const s = shift || { id: '', userId: (users.find(u => u.role !== 'Admin') || users[0] || {}).id || '', section: data.sections[0] || 'FOH', date: today(), start: '09:00', end: '17:00', notes: '' };
    return `<form id="mainRotaShiftForm" class="formGrid">
      <input type="hidden" name="id" value="${esc(s.id || '')}">
      <label>Staff<select name="userId">${users.map(u => `<option value="${u.id}" ${u.id === s.userId ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
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

  if (typeof settingsContent === 'function' && !settingsContent.__rotaAdminIntegratedV2) {
    const oldSettingsContent = settingsContent;
    settingsContent = function settingsContentWithRotaAdmin() {
      if (settingsTab === 'rota') return rotaAdminSettings();
      return oldSettingsContent();
    };
    settingsContent.__rotaAdminIntegratedV2 = true;
  }

  function openMainShiftEditor(id) {
    const data = safeRotaState();
    const shift = data.shifts.find(s => s.id === id);
    if (!shift) return;
    modalRoot.innerHTML = `<div class="modalCard"><button class="close" id="closeModal">×</button><h2>Edit shift</h2>${mainShiftForm(shift)}</div>`;
    modalRoot.classList.remove('hidden');
    document.getElementById('closeModal').onclick = () => modalRoot.classList.add('hidden');
    bindRotaMainIntegration();
  }

  function bindRotaMainIntegration() {
    document.querySelectorAll('[data-main-clock-in]').forEach(btn => btn.onclick = () => { const data = safeRotaState(); const log = rotaLog(data, btn.dataset.mainClockIn); log.in = new Date().toISOString(); log.out = null; saveRotaStateLocal(data); render(); });
    document.querySelectorAll('[data-main-clock-out]').forEach(btn => btn.onclick = () => { const data = safeRotaState(); const log = rotaLog(data, btn.dataset.mainClockOut); log.out = new Date().toISOString(); const shift = data.shifts.find(s => s.id === btn.dataset.mainClockOut); if (shift && shift.unscheduled) shift.end = timeNowShort(); saveRotaStateLocal(data); render(); });
    document.querySelectorAll('[data-main-break]').forEach(btn => btn.onclick = () => { const bits = btn.dataset.mainBreak.split('|'); const data = safeRotaState(); const log = rotaLog(data, bits[0]); log.breaks = log.breaks || []; log.breaks.push({ start: new Date().toISOString(), end: null, paid: bits[1] === 'paid' }); saveRotaStateLocal(data); render(); });
    document.querySelectorAll('[data-main-unscheduled-clock]').forEach(btn => btn.onclick = () => { const data = safeRotaState(); if (activeShift(data)) return alert('You are already clocked in.'); const id = makeShiftId(); const t = timeNowShort(); data.shifts.push({ id, userId: currentUserId(), section: document.getElementById('mainUnscheduledSection').value, date: today(), start: t, end: t, notes: document.getElementById('mainUnscheduledNote').value || 'Unscheduled shift', unscheduled: true, publishedAt: new Date().toISOString() }); data.logs[id] = { in: new Date().toISOString(), out: null, breaks: [] }; saveRotaStateLocal(data); render(); });
    const shiftForm = document.getElementById('mainRotaShiftForm');
    if (shiftForm) shiftForm.onsubmit = event => { event.preventDefault(); const data = safeRotaState(); const formData = new FormData(shiftForm); const id = formData.get('id') || makeShiftId(); const shift = { id, userId: formData.get('userId'), section: formData.get('section'), date: formData.get('date'), start: formData.get('start'), end: formData.get('end'), notes: formData.get('notes') || '', publishedAt: new Date().toISOString() }; const existing = data.shifts.find(s => s.id === id); if (existing) Object.assign(existing, shift); else data.shifts.push(shift); saveRotaStateLocal(data); modalRoot.classList.add('hidden'); render(); };
    const sectionForm = document.getElementById('mainRotaSectionForm');
    if (sectionForm) sectionForm.onsubmit = event => { event.preventDefault(); const formData = new FormData(sectionForm); const name = String(formData.get('section') || '').trim(); if (!name) return; const data = safeRotaState(); if (!data.sections.includes(name)) data.sections.push(name); state.rotaSettings = state.rotaSettings || {}; state.rotaSettings.sections = data.sections; saveRotaStateLocal(data); save(); render(); };
    document.querySelectorAll('[data-main-delete-section]').forEach(btn => btn.onclick = () => { const data = safeRotaState(); data.sections = data.sections.filter(s => s !== btn.dataset.mainDeleteSection); state.rotaSettings.sections = data.sections; saveRotaStateLocal(data); save(); render(); });
    document.querySelectorAll('[data-main-edit-shift]').forEach(btn => btn.onclick = () => openMainShiftEditor(btn.dataset.mainEditShift));
    document.querySelectorAll('[data-main-delete-shift]').forEach(btn => btn.onclick = () => { const data = safeRotaState(); data.shifts = data.shifts.filter(s => s.id !== btn.dataset.mainDeleteShift); delete data.logs[btn.dataset.mainDeleteShift]; saveRotaStateLocal(data); modalRoot.classList.add('hidden'); render(); });
  }

  if (typeof bind === 'function' && !bind.__rotaMainIntegrationV2) {
    const oldBind = bind;
    bind = function bindWithRotaMainIntegration() {
      oldBind();
      bindRotaMainIntegration();
    };
    bind.__rotaMainIntegrationV2 = true;
  }

  const style = document.createElement('style');
  style.textContent = `
    .rotaHomePanel.homePanel { display: grid; gap: 16px; }
    .rotaHomeIdentity { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; }
    .homeClockCard { padding: 20px; border-radius: 24px; background: radial-gradient(circle at 90% 20%, rgba(176,145,74,.22), transparent 28%), linear-gradient(135deg, #111820, #080a0d); border: 1px solid rgba(176,145,74,.28); box-shadow: 0 12px 30px rgba(0,0,0,.25); }
    .homeClockTime { font-size: clamp(42px, 16vw, 72px); line-height: .95; font-weight: 900; letter-spacing: -.07em; color: #fff8ea; }
    .homeCountdown { margin-top: 10px; color: #d0ad58; font-weight: 800; }
    .homeNextShiftLine { margin-top: 6px; color: #a69e90; }
    .homeShiftList { display: grid; gap: 12px; }
    .homeShiftCard { display: grid; grid-template-columns: 1fr; gap: 12px; padding: 16px; border-radius: 22px; background: linear-gradient(180deg, rgba(27,33,39,.96), rgba(17,22,27,.96)); border: 1px solid rgba(255,255,255,.08); }
    .homeShiftCard strong { color: #d0ad58; }
    .homeShiftCard h3 { margin: 4px 0; font-size: 24px; }
    .homeShiftActions { display: grid; gap: 8px; }
    .homeAssignedChecks { display: grid; gap: 10px; }
    .homeAssignedChecks h2 { margin: 0; }
    .homeAssignedCheck { width: 100%; display: grid; gap: 4px; min-height: 58px; padding: 12px 14px; text-align: left; border-radius: 16px; background: linear-gradient(180deg, rgba(27,33,39,.96), rgba(17,22,27,.96)); border: 1px solid rgba(208,173,88,.36); color: #fff8ea; }
    .homeAssignedCheck span { color: #fff8ea; font-size: 15px; font-weight: 900; }
    .homeAssignedCheck small { color: #d0ad58; font-size: 12px; font-weight: 780; }
    .rotaHomeActions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    @media(max-width:430px){ .rotaHomeActions { grid-template-columns: 1fr; } .rotaHomeIdentity { grid-template-columns: auto 1fr; } .rotaHomeIdentity .badge { grid-column: 1 / -1; justify-self: start; } }
  `;
  document.head.appendChild(style);
})();
