// Compact profile circle for the main app header.
// Combines the old Compliance profile switch and the Rota Home identity/clock controls into one modal.
(function profileCircleFinalPatch() {
  if (window.__profileCircleFinalPatchV2) return;
  window.__profileCircleFinalPatchV2 = true;

  function currentUser() {
    return (window.state && state.users && state.users.find(u => u.id === state.currentUser)) || (window.state && state.users && state.users[0]) || {};
  }

  function initials(name) {
    const text = String(name || 'User').trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  }

  function getRotaData() {
    let data = {};
    try {
      if (typeof readRotaState === 'function') data = readRotaState() || {};
      else if (typeof ROTA_KEY !== 'undefined') data = JSON.parse(localStorage.getItem(ROTA_KEY) || '{}');
    } catch (e) { data = {}; }
    data.sections = data.sections || (state.rotaSettings && state.rotaSettings.sections) || (typeof ROTA_SECTIONS !== 'undefined' ? ROTA_SECTIONS : ['FOH', 'Kitchen', 'Office']);
    data.users = state.users || data.users || [];
    data.shifts = data.shifts || [];
    data.logs = data.logs || {};
    return data;
  }

  function saveRotaData(data) {
    if (typeof ROTA_KEY !== 'undefined') localStorage.setItem(ROTA_KEY, JSON.stringify(data));
  }

  function todayStr() {
    return typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  }

  function timeNowShort() {
    return new Date().toTimeString().slice(0, 5);
  }

  function rotaLog(data, shiftId) {
    data.logs[shiftId] = data.logs[shiftId] || { in: null, out: null, breaks: [] };
    return data.logs[shiftId];
  }

  function liveShift(data) {
    return (data.shifts || []).find(shift => {
      const log = rotaLog(data, shift.id);
      return shift.userId === state.currentUser && log.in && !log.out;
    });
  }

  function todaysShifts(data) {
    return (data.shifts || [])
      .filter(shift => shift.userId === state.currentUser && shift.date === todayStr())
      .sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));
  }

  function upcomingShifts(data) {
    return (data.shifts || [])
      .filter(shift => shift.userId === state.currentUser && shift.date >= todayStr())
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }

  function nextShift(data) {
    return upcomingShifts(data)[0];
  }

  function makeId() {
    return 's_' + Math.random().toString(36).slice(2, 9);
  }

  function userLabel(user) {
    return `${user.nickname || user.name || 'User'}${user.role ? ' · ' + user.role : ''}`;
  }

  function ensureButton() {
    const topbar = document.querySelector('.topbar');
    if (!topbar || document.body.classList.contains('is-rota-route')) return;

    let button = document.getElementById('globalProfileCircle');
    if (!button) {
      button = document.createElement('button');
      button.id = 'globalProfileCircle';
      button.type = 'button';
      button.setAttribute('aria-label', 'Current user profile');
      topbar.appendChild(button);
      button.addEventListener('click', openProfileModal);
    }

    const user = currentUser();
    button.textContent = initials(user.nickname || user.name);
    button.title = userLabel(user);
  }

  function statusBadgeHtml(data) {
    const live = liveShift(data);
    return live ? '<span class="badge ok">On Shift</span>' : '<span class="badge">Ready</span>';
  }

  function shiftSummaryHtml(data) {
    const live = liveShift(data);
    const next = nextShift(data);
    if (live) return `<div class="compactProfileShift"><p class="muted">Current shift</p><strong>${esc(live.section || 'Shift')}</strong><span>${esc(live.start || '')} – ${esc(live.end || '')}</span></div>`;
    if (next) return `<div class="compactProfileShift"><p class="muted">Next shift</p><strong>${esc(next.section || 'Shift')}</strong><span>${esc(next.date || '')} · ${esc(next.start || '')} – ${esc(next.end || '')}</span></div>`;
    return '<div class="compactProfileShift"><p class="muted">Next shift</p><strong>No upcoming shift</strong><span>Nothing scheduled yet.</span></div>';
  }

  function shiftControlsHtml(data) {
    const live = liveShift(data);
    const today = todaysShifts(data);
    if (live) {
      return `<div class="compactProfileControls">
        <button data-profile-clock-out="${esc(live.id)}">End Shift</button>
        <button class="secondary" data-profile-break="${esc(live.id)}|unpaid">Start Unpaid Break</button>
        <button class="secondary" data-profile-break="${esc(live.id)}|paid">Start Paid Break</button>
      </div>`;
    }
    if (today.length) {
      return `<div class="compactProfileControls">
        ${today.map(shift => `<button data-profile-clock-in="${esc(shift.id)}">Start ${esc(shift.section || 'Shift')} ${esc(shift.start || '')}</button>`).join('')}
      </div>`;
    }
    return `<div class="compactProfileUnscheduled">
      <p class="muted">No shift today. Start an unscheduled shift if needed.</p>
      <label>Section<select id="profileUnscheduledSection">${data.sections.map(section => `<option>${esc(section)}</option>`).join('')}</select></label>
      <label>Note<input id="profileUnscheduledNote" placeholder="Optional duty note"></label>
      <button data-profile-unscheduled>Start Unscheduled Shift</button>
    </div>`;
  }

  function openFullProfile() {
    const current = currentUser();
    modalRoot.classList.add('hidden');
    if (typeof openCentralUserProfile === 'function') return openCentralUserProfile(current.id);
    if (typeof route !== 'undefined') route = 'staff';
    if (typeof render === 'function') render();
  }

  function openProfileModal() {
    if (!window.modalRoot || !window.state) return;
    const user = currentUser();
    const data = getRotaData();
    modalRoot.innerHTML = `<div class="modalCard profileCircleModal">
      <button class="close" id="closeProfileCircleModal">×</button>
      <div class="profileCircleModalTop">
        <span class="avatarText big">${esc(initials(user.nickname || user.name))}</span>
        <div>
          <p class="muted">${esc(state.pub && state.pub.name ? state.pub.name : 'Current user')}</p>
          <h2>${esc(user.nickname || user.name || 'User')}</h2>
          <p>${esc([user.role, user.area || user.jobArea].filter(Boolean).join(' · '))}</p>
        </div>
        ${statusBadgeHtml(data)}
      </div>

      <label>Switch user
        <select id="compactUserSwitch">
          ${state.users.map(u => `<option value="${u.id}" ${u.id === state.currentUser ? 'selected' : ''}>${esc(u.nickname || u.name)} (${esc(u.role || 'User')})</option>`).join('')}
        </select>
      </label>

      ${shiftSummaryHtml(data)}
      ${shiftControlsHtml(data)}

      <div class="profileCircleActions profileCircleActionsThree">
        <button id="openFullProfileFromCircle">Full Profile</button>
        <button data-route="rota">Schedule</button>
        <button data-route="settings">Settings</button>
      </div>
    </div>`;
    modalRoot.classList.remove('hidden');

    const close = document.getElementById('closeProfileCircleModal');
    if (close) close.onclick = () => modalRoot.classList.add('hidden');

    const select = document.getElementById('compactUserSwitch');
    if (select) select.onchange = event => {
      state.currentUser = event.target.value;
      if (typeof save === 'function') save();
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
      setTimeout(() => openProfileModal(), 60);
    };

    const fullProfile = document.getElementById('openFullProfileFromCircle');
    if (fullProfile) fullProfile.onclick = openFullProfile;

    modalRoot.querySelectorAll('[data-route]').forEach(btn => btn.onclick = () => {
      if (typeof route !== 'undefined') route = btn.dataset.route;
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
      setTimeout(ensureButton, 0);
    });

    modalRoot.querySelectorAll('[data-profile-clock-in]').forEach(btn => btn.onclick = () => {
      const data = getRotaData();
      if (liveShift(data)) return alert('You are already clocked in.');
      const log = rotaLog(data, btn.dataset.profileClockIn);
      log.in = new Date().toISOString();
      log.out = null;
      saveRotaData(data);
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
    });

    modalRoot.querySelectorAll('[data-profile-clock-out]').forEach(btn => btn.onclick = () => {
      const data = getRotaData();
      const log = rotaLog(data, btn.dataset.profileClockOut);
      log.out = new Date().toISOString();
      const shift = data.shifts.find(s => s.id === btn.dataset.profileClockOut);
      if (shift && shift.unscheduled) shift.end = timeNowShort();
      saveRotaData(data);
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
    });

    modalRoot.querySelectorAll('[data-profile-break]').forEach(btn => btn.onclick = () => {
      const bits = btn.dataset.profileBreak.split('|');
      const data = getRotaData();
      const log = rotaLog(data, bits[0]);
      log.breaks = log.breaks || [];
      log.breaks.push({ start: new Date().toISOString(), end: null, paid: bits[1] === 'paid' });
      saveRotaData(data);
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
    });

    const unscheduled = modalRoot.querySelector('[data-profile-unscheduled]');
    if (unscheduled) unscheduled.onclick = () => {
      const data = getRotaData();
      if (liveShift(data)) return alert('You are already clocked in.');
      const id = makeId();
      const t = timeNowShort();
      data.shifts.push({
        id,
        userId: state.currentUser,
        section: document.getElementById('profileUnscheduledSection').value,
        date: todayStr(),
        start: t,
        end: t,
        notes: document.getElementById('profileUnscheduledNote').value || 'Unscheduled shift',
        unscheduled: true,
        publishedAt: new Date().toISOString()
      });
      data.logs[id] = { in: new Date().toISOString(), out: null, breaks: [] };
      saveRotaData(data);
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
    };
  }

  const style = document.createElement('style');
  style.textContent = `
    .profileSwitch,
    .rotaHomeIdentity {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      overflow: hidden !important;
    }

    .topbar {
      display: grid !important;
      grid-template-columns: 1fr auto !important;
      align-items: start !important;
      gap: 12px !important;
    }

    #globalProfileCircle {
      width: 54px !important;
      height: 54px !important;
      min-width: 54px !important;
      min-height: 54px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      align-self: start !important;
      margin-top: 2px !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, #B0914A, #d0ad58) !important;
      color: #060708 !important;
      border: 1px solid rgba(255,255,255,.16) !important;
      box-shadow: 0 10px 26px rgba(176,145,74,.24) !important;
      font-size: 18px !important;
      font-weight: 950 !important;
      letter-spacing: -.04em !important;
      padding: 0 !important;
      z-index: 12 !important;
    }

    .profileCircleModalTop {
      display: grid !important;
      grid-template-columns: auto 1fr auto !important;
      gap: 14px !important;
      align-items: center !important;
      margin-bottom: 18px !important;
    }

    .compactProfileShift {
      margin-top: 14px !important;
      padding: 14px !important;
      border-radius: 18px !important;
      background: rgba(255,255,255,.045) !important;
      border: 1px solid rgba(255,255,255,.08) !important;
    }

    .compactProfileShift p { margin: 0 0 4px !important; }
    .compactProfileShift strong { display: block !important; color: #fff8ea !important; font-size: 18px !important; }
    .compactProfileShift span { color: #a69e90 !important; }

    .compactProfileControls,
    .compactProfileUnscheduled {
      display: grid !important;
      gap: 10px !important;
      margin-top: 12px !important;
    }

    .profileCircleActions {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
      margin-top: 14px !important;
    }

    .profileCircleActionsThree {
      grid-template-columns: 1fr 1fr 1fr !important;
    }

    @media(max-width:430px){
      .profileCircleModalTop { grid-template-columns: auto 1fr !important; }
      .profileCircleModalTop .badge { grid-column: 1 / -1 !important; justify-self: start !important; }
      .profileCircleActionsThree { grid-template-columns: 1fr !important; }
    }

    .rotaHomePanel { margin-top: 0 !important; }
  `;
  document.head.appendChild(style);

  function afterRender() { ensureButton(); }

  if (typeof bind === 'function' && !bind.__profileCircleFinalPatchV2) {
    const oldBind = bind;
    bind = function bindWithProfileCircle() {
      oldBind();
      afterRender();
    };
    bind.__profileCircleFinalPatchV2 = true;
  }

  document.addEventListener('click', () => setTimeout(afterRender, 0), true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afterRender); else afterRender();
})();