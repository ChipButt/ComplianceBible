// Home/status integration fixes for the clean-slate Compliance Bible build.
(function statusCardActions() {
  if (window.__statusCardActionsV3) return;
  window.__statusCardActionsV3 = true;

  const ROTA_STORAGE_KEY = 'rotaAppUnifiedV2';

  function safeState() {
    try { return state || {}; } catch (_) { return {}; }
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char];
    });
  }

  function go(target) {
    try {
      route = target;
      if (typeof render === 'function') render();
      window.scrollTo(0, 0);
    } catch (e) {
      console.warn('Could not route from status card', e);
    }
  }

  function todayISO() {
    try { if (typeof today === 'function') return today(); } catch (_) {}
    return new Date().toISOString().slice(0, 10);
  }

  function saveComplianceState() {
    try { if (typeof save === 'function') save(); } catch (_) {}
  }

  function readRotaData() {
    try {
      const bridged = typeof readRotaState === 'function' && readRotaState();
      if (bridged && typeof bridged === 'object') return normalisedRotaData(bridged);
    } catch (_) {}
    try {
      const parsed = JSON.parse(localStorage.getItem(ROTA_STORAGE_KEY) || 'null');
      if (parsed && typeof parsed === 'object') return normalisedRotaData(parsed);
    } catch (_) {}
    return normalisedRotaData({
      sections: (safeState().rotaSettings && safeState().rotaSettings.sections) || [],
      users: safeState().users || [],
      shifts: [],
      logs: {},
      publishedWeeks: {}
    });
  }

  function normalisedRotaData(data) {
    data.sections = data.sections || [];
    data.users = data.users || safeState().users || [];
    data.shifts = data.shifts || [];
    data.logs = data.logs || {};
    data.publishedWeeks = data.publishedWeeks || {};
    data.alerts = data.alerts || [];
    data.rotaTemplates = data.rotaTemplates || [];
    return data;
  }

  function writeRotaData(data) {
    try { localStorage.setItem(ROTA_STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function currentComplianceUserId() {
    const s = safeState();
    return s.currentUser || (s.users && s.users[0] && s.users[0].id) || '';
  }

  function assignedToCurrentUser(assignedUserId) {
    const value = String(assignedUserId || '').trim();
    const key = value.toLowerCase();
    return !value || key === 'everyone' || key === 'all' || key === 'all users' || value === currentComplianceUserId();
  }

  function isAdminNow() {
    try { return typeof isAdminUser === 'function' && isAdminUser(); } catch (_) { return false; }
  }

  function mondayISO(dateInput) {
    const d = new Date(String(dateInput || todayISO()) + 'T12:00:00');
    const dayOffset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayOffset);
    return d.toISOString().slice(0, 10);
  }

  function isShiftPublished(shift, data) {
    if (!shift) return false;
    const week = data.publishedWeeks && data.publishedWeeks[mondayISO(shift.date)];
    return !!(shift.publishedAt || (week && Array.isArray(week.shiftIds) && week.shiftIds.indexOf(shift.id) !== -1));
  }

  function shiftLog(data, shiftId) {
    data.logs = data.logs || {};
    data.logs[shiftId] = data.logs[shiftId] || { in: null, out: null, breaks: [], events: [] };
    data.logs[shiftId].breaks = Array.isArray(data.logs[shiftId].breaks) ? data.logs[shiftId].breaks : [];
    data.logs[shiftId].events = Array.isArray(data.logs[shiftId].events) ? data.logs[shiftId].events : [];
    return data.logs[shiftId];
  }

  function shiftStartDate(shift) {
    return new Date(String(shift.date || todayISO()) + 'T' + String(shift.start || '00:00') + ':00');
  }

  function shiftEndDate(shift) {
    const start = shiftStartDate(shift);
    const end = new Date(String(shift.date || todayISO()) + 'T' + String(shift.end || '23:59') + ':00');
    if (end < start) end.setDate(end.getDate() + 1);
    return end;
  }

  function openBreak(log) {
    return (log && log.breaks || []).find(function (item) { return item && item.start && !item.end; }) || null;
  }

  function isOpenBreak(log) {
    return !!openBreak(log);
  }

  function breakDurationMs(log) {
    const now = Date.now();
    return (log && log.breaks || []).reduce(function (total, item) {
      if (!item || !item.start) return total;
      const start = new Date(item.start).getTime();
      const end = item.end ? new Date(item.end).getTime() : now;
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return total;
      return total + (end - start);
    }, 0);
  }

  function workedDurationMs(log) {
    if (!log || !log.in) return 0;
    const start = new Date(log.in).getTime();
    const end = log.out ? new Date(log.out).getTime() : Date.now();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
    return Math.max(0, end - start - breakDurationMs(log));
  }

  function formatClock(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; }
  }

  function formatDuration(ms) {
    const mins = Math.max(0, Math.round((ms || 0) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return h + 'h ' + m + 'm';
    if (h) return h + 'h';
    return m + 'm';
  }

  function shiftLabel(shift) {
    return (shift.section || 'Shift') + ' ' + (shift.start || '') + '–' + (shift.end || '');
  }

  function userVisibleShifts(data, userId) {
    const now = new Date();
    return (data.shifts || [])
      .filter(function (shift) { return shift && shift.userId === userId; })
      .filter(function (shift) { return isAdminNow() || isShiftPublished(shift, data); })
      .filter(function (shift) {
        const log = shiftLog(data, shift.id);
        if (log.in && !log.out) return true;
        if (log.out) return false;
        return shiftEndDate(shift) >= now || String(shift.date || '') >= todayISO();
      })
      .sort(function (a, b) {
        return (String(a.date || '') + ' ' + String(a.start || '')).localeCompare(String(b.date || '') + ' ' + String(b.start || ''));
      });
  }

  function activeShift(data, userId) {
    return (data.shifts || []).find(function (shift) {
      return shift.userId === userId && shiftLog(data, shift.id).in && !shiftLog(data, shift.id).out;
    }) || null;
  }

  function nextShiftForHome(data, userId) {
    return activeShift(data, userId) || userVisibleShifts(data, userId)[0] || null;
  }

  function countdownText(shift, log) {
    if (!shift) return 'No upcoming shift';
    if (log && log.in && !log.out) return isOpenBreak(log) ? 'On Break' : 'On Shift';

    const start = shiftStartDate(shift);
    const now = new Date();
    const diff = start - now;
    if (!log.in && diff <= 0 && diff >= -60000) return 'Starting NOW at ' + (shift.section || 'work');
    if (!log.in && diff < -60000) return 'LATE at ' + (shift.section || 'work');

    const minutes = Math.max(0, Math.floor(diff / 60000));
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const bits = [];
    if (days) bits.push(days + ' day' + (days === 1 ? '' : 's'));
    if (hours) bits.push(hours + ' hour' + (hours === 1 ? '' : 's'));
    bits.push(mins + ' minute' + (mins === 1 ? '' : 's'));
    return 'Starting in ' + bits.join(', ') + ' at ' + (shift.section || 'work');
  }

  function recordUserShiftEvent(data, shift, type, at) {
    const s = safeState();
    s.userShiftLogs = s.userShiftLogs || {};
    s.userShiftLogs[shift.userId] = Array.isArray(s.userShiftLogs[shift.userId]) ? s.userShiftLogs[shift.userId] : [];
    const log = shiftLog(data, shift.id);
    let record = s.userShiftLogs[shift.userId].find(function (item) { return item.shiftId === shift.id; });
    if (!record) {
      record = {
        id: 'user_shift_' + shift.id,
        shiftId: shift.id,
        userId: shift.userId,
        date: shift.date,
        area: shift.section || '',
        plannedStart: shift.start || '',
        plannedEnd: shift.end || '',
        events: []
      };
      s.userShiftLogs[shift.userId].push(record);
    }
    record.area = shift.section || record.area || '';
    record.plannedStart = shift.start || record.plannedStart || '';
    record.plannedEnd = shift.end || record.plannedEnd || '';
    record.events = Array.isArray(record.events) ? record.events : [];
    record.events.push({ type: type, at: at });
    record.actualStart = log.in || record.actualStart || '';
    record.actualEnd = log.out || '';
    record.breaks = (log.breaks || []).map(function (item) {
      return { start: item.start || '', end: item.end || '', type: item.type || 'break' };
    });
    record.totalBreakMinutes = Math.round(breakDurationMs(log) / 60000);
    record.totalWorkedMinutes = log.out ? Math.round(workedDurationMs(log) / 60000) : null;
    saveComplianceState();
  }

  function setBadge(routeName, count) {
    const btn = document.querySelector('.bottomNav .navBtn[data-route="' + routeName + '"], .mainNav .navBtn[data-route="' + routeName + '"]');
    if (!btn) return;
    if (count > 0) {
      btn.setAttribute('data-alert-count', String(count > 99 ? '99+' : count));
      btn.setAttribute('aria-label', (btn.textContent || routeName) + ' - ' + count + ' notification' + (count === 1 ? '' : 's'));
    } else {
      btn.removeAttribute('data-alert-count');
    }
  }

  function normaliseFrequency(value) {
    const text = String(value || 'Daily').trim();
    const key = text.toLowerCase();
    if (key === 'yearly') return 'Annual';
    if (key === 'six-monthly' || key === 'six monthly' || key === 'every six months') return 'Every 6 Months';
    return text || 'Daily';
  }

  function assignedCheckDueToday(check) {
    if (!check) return false;
    if (!assignedToCurrentUser(check.assignedUserId)) return false;
    try { if (typeof done === 'function' && done(check.id)) return false; } catch (_) {}
    const freq = normaliseFrequency(check.freq || 'Daily');
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (freq === 'Weekly' && check.assignedWeeklyDay) return days[now.getDay()] === check.assignedWeeklyDay;
    if (freq === 'Monthly' && check.assignedMonthlyDate) return String(now.getDate()) === String(check.assignedMonthlyDate);
    if (freq === 'Annual' || freq === 'Every 6 Months') {
      const raw = String(check.assignedDueDate || check.dueDate || '');
      if (!raw) return true;
      const parts = raw.split('-').map(Number);
      if (freq === 'Annual') return (parts[1] || 0) === (now.getMonth() + 1) && (parts[2] || 0) === now.getDate();
      const otherMonth = ((parts[1] + 5) % 12) + 1;
      return ((parts[1] || 0) === (now.getMonth() + 1) || otherMonth === (now.getMonth() + 1)) && (parts[2] || 0) === now.getDate();
    }
    return true;
  }

  function assignedChecksCount() {
    try { return (safeState().checks || []).filter(assignedCheckDueToday).length; } catch (_) { return 0; }
  }

  function decorateNavBadges() {
    setBadge('dashboard', assignedChecksCount());
    document.querySelectorAll('.bottomNav .navBtn[data-alert-count], .mainNav .navBtn[data-alert-count]').forEach(function (btn) {
      btn.classList.add('hasLeftAlertDot');
    });
  }

  function wireCards() {
    var cards = document.querySelectorAll('.statusStrip > div');
    if (!cards.length) return;

    var routes = ['checks', 'documents', 'logs'];
    var labels = [
      'Open overdue checks',
      'Open missing documents',
      'Open unresolved issues'
    ];

    cards.forEach(function (card, index) {
      if (!routes[index]) return;
      card.classList.add('statusActionCard');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', labels[index]);
      card.dataset.statusRoute = routes[index];
      card.onclick = function () { go(card.dataset.statusRoute); };
      card.onkeydown = function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          go(card.dataset.statusRoute);
        }
      };
    });
  }

  function renderHomeShiftControls(data, shift, log) {
    if (!shift) return '';
    const open = isOpenBreak(log);
    const started = !!log.in && !log.out;
    const ended = !!log.out;
    const breakLine = started || ended ? '<p class="homeShiftTotals">Total break time: <strong>' + formatDuration(breakDurationMs(log)) + '</strong></p>' : '';
    const workedLine = ended ? '<p class="homeShiftTotals">Total hours worked: <strong>' + formatDuration(workedDurationMs(log)) + '</strong></p>' : '';

    if (!started && !ended) {
      return '<div class="homeShiftControlPanel" data-home-shift-panel="' + esc(shift.id) + '">' +
        '<p class="homeShiftSubheading">' + esc(shiftLabel(shift)) + '</p>' +
        '<button type="button" class="startShiftBtn homeShiftStart" data-home-shift-action="start" data-shift-id="' + esc(shift.id) + '">Start Shift</button>' +
      '</div>';
    }

    if (started) {
      return '<div class="homeShiftControlPanel ' + (open ? 'homeBreakActive' : '') + '" data-home-shift-panel="' + esc(shift.id) + '">' +
        '<p class="homeShiftSubheading">' + esc(shiftLabel(shift)) + '</p>' +
        '<p class="homeShiftActual">Started: <strong>' + esc(formatClock(log.in)) + '</strong></p>' +
        breakLine +
        '<button type="button" class="endShiftBtn homeShiftEnd" ' + (open ? 'disabled aria-disabled="true"' : '') + ' data-home-shift-action="end" data-shift-id="' + esc(shift.id) + '">End Shift</button>' +
        '<button type="button" class="' + (open ? 'breakEndBtn' : 'breakUnpaidBtn') + ' homeBreakButton" data-home-shift-action="' + (open ? 'endBreak' : 'startBreak') + '" data-shift-id="' + esc(shift.id) + '">' + (open ? 'End Break' : 'Start Break') + '</button>' +
      '</div>';
    }

    return '<div class="homeShiftControlPanel" data-home-shift-panel="' + esc(shift.id) + '">' +
      '<p class="homeShiftSubheading">' + esc(shiftLabel(shift)) + '</p>' +
      '<p class="homeShiftActual">Started: <strong>' + esc(formatClock(log.in)) + '</strong> · Ended: <strong>' + esc(formatClock(log.out)) + '</strong></p>' +
      breakLine + workedLine +
    '</div>';
  }

  function decorateHomeShiftCard() {
    const card = document.querySelector('.rotaHomePanel .homeClockCard');
    if (!card) return;
    const data = readRotaData();
    const userId = currentComplianceUserId();
    const shift = nextShiftForHome(data, userId);
    const log = shift ? shiftLog(data, shift.id) : null;
    const countdown = card.querySelector('.homeCountdown');
    const line = card.querySelector('.homeNextShiftLine');

    if (!shift) {
      if (countdown) countdown.textContent = 'No upcoming shift';
      if (line) line.remove();
      card.classList.remove('homeClockLate', 'homeClockOnBreak');
      removeHomeControlPanel(card);
      return;
    }

    const breakActive = isOpenBreak(log);
    const message = countdownText(shift, log);
    const late = !!(!log.in && shiftStartDate(shift) < new Date(Date.now() - 60000));
    card.classList.toggle('homeClockLate', late);
    card.classList.toggle('homeClockOnBreak', breakActive);
    if (countdown) countdown.textContent = message;

    let targetLine = line;
    if (!targetLine) {
      targetLine = document.createElement('div');
      targetLine.className = 'homeNextShiftLine';
      card.appendChild(targetLine);
    }
    if (log.in && !log.out) {
      const br = openBreak(log);
      targetLine.textContent = breakActive
        ? (shift.section || 'Shift') + ' · On break since ' + formatClock(br && br.start)
        : (shift.section || 'Shift') + ' · Started ' + formatClock(log.in);
    } else {
      targetLine.textContent = (shift.section || 'Shift') + ' · ' + (shift.start || '') + ' – ' + (shift.end || '');
    }

    const html = renderHomeShiftControls(data, shift, log);
    let panel = document.querySelector('.rotaHomePanel .homeShiftControlPanel');
    if (!html) {
      if (panel) panel.remove();
      return;
    }
    if (!panel) {
      card.insertAdjacentHTML('afterend', html);
    } else if (panel.outerHTML !== html) {
      panel.outerHTML = html;
    }
  }

  function removeHomeControlPanel(card) {
    const panel = card && card.parentElement && card.parentElement.querySelector('.homeShiftControlPanel');
    if (panel) panel.remove();
  }

  function shiftIdFromCard(card) {
    if (!card) return '';
    if (card.dataset.shiftId) return card.dataset.shiftId;
    if (card.dataset.homeShiftPanel) return card.dataset.homeShiftPanel;
    const inlineClick = card.getAttribute('onclick') || '';
    const match = inlineClick.match(/openShiftModal\(['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }

  function injectBreakStyleIntoDoc(doc) {
    if (!doc || !doc.head || doc.getElementById('rota-break-state-style')) return;
    const injected = doc.createElement('style');
    injected.id = 'rota-break-state-style';
    injected.textContent = '.scheduleShiftBlock.onBreak,.compactShift.onBreak,.shiftCard.onBreak{background:#fff2a8!important;color:#111!important;border-color:rgba(214,176,0,.7)!important}.scheduleShiftBlock.onBreak .shiftLine,.compactShift.onBreak *,.shiftCard.onBreak *{color:#111!important}.rotaDragGhost.scheduleShiftBlock.onBreak,.rotaDragGhost.shiftCard.onBreak{background:#fff2a8!important;color:#111!important}';
    doc.head.appendChild(injected);
  }

  function syncBreakClassesInRoot(root, data) {
    if (!root || !root.querySelectorAll) return;
    injectBreakStyleIntoDoc(root.ownerDocument || document);
    root.querySelectorAll('.scheduleShiftBlock,.compactShift,.shiftCard,[data-home-shift-panel]').forEach(function (card) {
      const shiftId = shiftIdFromCard(card);
      if (!shiftId) return;
      const log = shiftLog(data, shiftId);
      const onBreak = !!(log && log.in && !log.out && isOpenBreak(log));
      card.classList.toggle('onBreak', onBreak);
    });
  }

  function syncBreakVisuals() {
    const data = readRotaData();
    syncBreakClassesInRoot(document, data);
    document.querySelectorAll('iframe').forEach(function (frame) {
      try {
        if (frame.contentDocument) syncBreakClassesInRoot(frame.contentDocument, data);
      } catch (_) {}
    });
  }

  function decorateHome() {
    decorateHomeShiftCard();
    syncBreakVisuals();
    document.querySelectorAll('.quickActions.rotaHomeActions, .rotaHomeActions').forEach(function (el) {
      el.remove();
    });
  }

  function shiftHistoryMarkup(userId) {
    const s = safeState();
    const logs = (s.userShiftLogs && s.userShiftLogs[userId]) || [];
    if (!logs.length) return '<h2>Shifts</h2><p class="muted">No shift timestamps recorded yet.</p>';
    const sorted = logs.slice().sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || '')) || String(b.actualStart || '').localeCompare(String(a.actualStart || ''));
    });
    return '<h2>Shifts</h2><div class="userShiftHistory">' + sorted.map(function (item) {
      const events = (item.events || []).map(function (event) {
        return '<li><span>' + esc(event.type || 'Event') + '</span><time>' + esc(formatClock(event.at)) + '</time></li>';
      }).join('');
      const breaks = (item.breaks || []).filter(function (br) { return br.start; }).map(function (br) {
        return '<li><span>Break</span><time>' + esc(formatClock(br.start)) + (br.end ? '–' + esc(formatClock(br.end)) : '–ongoing') + '</time></li>';
      }).join('');
      return '<article class="listItem userShiftLogCard">' +
        '<strong>' + esc(item.date || 'Shift') + ' · ' + esc(item.area || 'Area') + '</strong>' +
        '<p>' + esc(item.plannedStart || '') + ' – ' + esc(item.plannedEnd || '') + '</p>' +
        '<p class="muted">Actual start: ' + esc(formatClock(item.actualStart) || 'Not recorded') + (item.actualEnd ? ' · Actual end: ' + esc(formatClock(item.actualEnd)) : '') + '</p>' +
        '<p class="muted">Total break time: ' + esc(formatDuration((Number(item.totalBreakMinutes) || 0) * 60000)) + (item.totalWorkedMinutes != null ? ' · Total hours worked: ' + esc(formatDuration(Number(item.totalWorkedMinutes) * 60000)) : '') + '</p>' +
        '<ul class="userShiftEventList">' + (events || '<li><span>No timestamp events</span><time></time></li>') + '</ul>' +
        (breaks ? '<h4>Breaks</h4><ul class="userShiftEventList">' + breaks + '</ul>' : '') +
      '</article>';
    }).join('') + '</div>';
  }

  function patchUserProfileDetail() {
    try {
      if (typeof centralProfileDetail !== 'function' || centralProfileDetail.__shiftHistoryPatched) return;
      const oldDetail = centralProfileDetail;
      centralProfileDetail = function centralProfileDetailWithShifts(user, section, shifts, training, docs, availabilityText) {
        if (section === 'shifts') return shiftHistoryMarkup(user && user.id);
        return oldDetail(user, section, shifts, training, docs, availabilityText);
      };
      centralProfileDetail.__shiftHistoryPatched = true;
    } catch (_) {}
  }

  function decorateUserProfileTabs() {
    patchUserProfileDetail();
    const links = document.querySelector('.centralProfilePage .profileLinks');
    if (!links || links.querySelector('[data-central-section="shifts"]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.centralSection = 'shifts';
    btn.textContent = 'Shifts';
    try { if (centralUserActiveSection === 'shifts') btn.classList.add('active'); } catch (_) {}
    links.appendChild(btn);
    btn.onclick = function () {
      try { centralUserActiveSection = 'shifts'; } catch (_) {}
      if (typeof render === 'function') render();
    };
  }

  function applyDocumentButtonGuard() {
    document.querySelectorAll('.fdocBar[data-fdoc-toggle]').forEach(function (bar) {
      if (bar.dataset.docButtonGuard) return;
      bar.dataset.docButtonGuard = '1';
      bar.addEventListener('click', function (event) {
        if (event.target.closest('[data-fdoc-edit]')) return;
        setTimeout(function () {
          const article = bar.closest('.fdoc');
          if (!article) return;
          article.querySelectorAll('[data-fdoc-edit-form]').forEach(function (form) { form.remove(); });
        }, 0);
      });
    });
  }

  function applyAll() {
    wireCards();
    decorateNavBadges();
    decorateHome();
    decorateUserProfileTabs();
    applyDocumentButtonGuard();
    syncBreakVisuals();
  }

  function doShiftAction(btn) {
    const action = btn.dataset.homeShiftAction;
    const shiftId = btn.dataset.shiftId;
    const data = readRotaData();
    const shift = (data.shifts || []).find(function (item) { return item.id === shiftId; });
    if (!shift) return;
    const log = shiftLog(data, shift.id);
    const now = new Date().toISOString();

    if (action === 'start') {
      log.in = now;
      log.actualStart = now;
      log.events.push({ type: 'Start Shift', at: now });
      recordUserShiftEvent(data, shift, 'Start Shift', now);
    }

    if (action === 'startBreak') {
      if (!isOpenBreak(log)) {
        log.breaks.push({ start: now, end: '', type: 'break' });
        log.events.push({ type: 'Start Break', at: now });
        recordUserShiftEvent(data, shift, 'Start Break', now);
      }
    }

    if (action === 'endBreak') {
      const br = openBreak(log);
      if (br) br.end = now;
      log.events.push({ type: 'End Break', at: now });
      recordUserShiftEvent(data, shift, 'End Break', now);
    }

    if (action === 'end') {
      if (isOpenBreak(log)) return;
      log.out = now;
      log.actualEnd = now;
      log.events.push({ type: 'End Shift', at: now });
      recordUserShiftEvent(data, shift, 'End Shift', now);
    }

    writeRotaData(data);
    saveComplianceState();
    syncBreakVisuals();
    if (typeof render === 'function') render();
    setTimeout(applyAll, 0);
  }

  const style = document.createElement('style');
  style.id = 'home-status-fixes-v3';
  style.textContent = `
    .statusActionCard { cursor: pointer !important; position: relative !important; transition: transform .12s ease, border-color .12s ease, background .12s ease !important; padding-right: 46px !important; }
    .statusActionCard::after { content: '›' !important; position: absolute !important; right: 18px !important; top: 50% !important; transform: translateY(-50%) !important; color: #B0914A !important; font-size: 34px !important; line-height: 1 !important; font-weight: 700 !important; opacity: .9 !important; }
    .statusActionCard:active { transform: scale(.985) !important; }
    .statusActionCard:focus-visible { outline: 3px solid rgba(176,145,74,.45) !important; outline-offset: 3px !important; }

    .bottomNav .navBtn, .mainNav .navBtn { position: relative !important; overflow: visible !important; }
    .bottomNav .navBtn[data-alert-count]::after, .mainNav .navBtn[data-alert-count]::after {
      content: '' !important; position: absolute !important; left: auto !important; right: 4px !important; top: 3px !important;
      width: 8px !important; min-width: 8px !important; height: 8px !important; min-height: 8px !important; padding: 0 !important; border-radius: 999px !important;
      background: #d90808 !important; color: transparent !important; font-size: 0 !important; font-weight: 950 !important; line-height: 0 !important;
      text-align: center !important; box-shadow: none !important; border: 0 !important; z-index: 4 !important;
    }

    .quickActions.rotaHomeActions, .rotaHomeActions { display: none !important; }
    .homeClockCard.homeClockLate { background: linear-gradient(180deg,#7b1111,#4f0909) !important; border-color: rgba(255,90,90,.7) !important; }
    .homeClockCard.homeClockLate .homeClockTime, .homeClockCard.homeClockLate .homeCountdown, .homeClockCard.homeClockLate .homeNextShiftLine { color: #fff !important; }
    .homeClockCard.homeClockOnBreak { background: linear-gradient(180deg,#fff2a8,#f3d96a) !important; border-color: rgba(214,176,0,.7) !important; }
    .homeClockCard.homeClockOnBreak .homeClockTime, .homeClockCard.homeClockOnBreak .homeCountdown, .homeClockCard.homeClockOnBreak .homeNextShiftLine { color: #111 !important; }
    .homeShiftControlPanel { display: grid !important; gap: 8px !important; margin: -4px 0 14px !important; padding: 12px !important; border-radius: 18px !important; background: rgba(255,255,255,.045) !important; border: 1px solid rgba(255,255,255,.09) !important; }
    .homeShiftControlPanel.homeBreakActive { background: rgba(255,242,168,.12) !important; border-color: rgba(214,176,0,.5) !important; }
    .homeShiftSubheading { margin: 0 !important; color: #d0ad58 !important; font-size: 13px !important; font-weight: 900 !important; text-align: center !important; }
    .homeShiftActual, .homeShiftTotals { margin: 0 !important; color: #fff8ea !important; font-size: 13px !important; text-align: center !important; }
    .homeShiftEnd[disabled] { background: #5c6064 !important; color: #d2d2d2 !important; cursor: not-allowed !important; opacity: .7 !important; }

    .inspectionUserButton, .inspectionUserButton * { color: #fff8ea !important; }
    .inspectionUserButton em, .inspectionUserButton small { color: #fff8ea !important; opacity: 1 !important; }
    .inspectionUserButton { grid-template-columns: minmax(0,1fr) auto 28px !important; }
    .inspectionUserButton .fdocArrow { color: #fff8ea !important; }

    #modal .temperatureInputBox { height: 34px !important; min-height: 34px !important; max-height: 34px !important; display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; align-items: center !important; overflow: hidden !important; }
    #modal .temperatureInputBox input, #modal .temperatureInputBox span { height: 34px !important; min-height: 34px !important; max-height: 34px !important; line-height: 34px !important; padding-top: 0 !important; padding-bottom: 0 !important; margin: 0 !important; align-self: center !important; transform: none !important; }
    #modal .temperatureSaveButton, #modal .checkSavePrimary { min-height: 34px !important; height: 34px !important; max-height: 34px !important; line-height: 34px !important; padding-top: 0 !important; padding-bottom: 0 !important; display: grid !important; place-items: center !important; align-self: center !important; }
    #modal .temperaturePhotoButton, #modal .checkEvidenceUpload { justify-content: center !important; justify-items: center !important; text-align: center !important; }
    #modal .temperaturePhotoButton span, #modal .checkEvidenceUpload > span { text-align: center !important; }
    #modal .actionRequiredInline { display: grid !important; grid-template-columns: 14px minmax(0,1fr) !important; gap: 12px !important; align-items: center !important; }
    #modal .actionRequiredInline input { margin: 0 !important; }

    .centralProfilePage .profileLinks { grid-template-columns: repeat(4,minmax(0,1fr)) !important; gap: 5px !important; }
    .centralProfilePage .profileLinks button { min-width: 0 !important; padding-left: 3px !important; padding-right: 3px !important; font-size: 10px !important; white-space: nowrap !important; }
    .userShiftHistory { display: grid !important; gap: 10px !important; }
    .userShiftLogCard { display: grid !important; gap: 6px !important; }
    .userShiftEventList { list-style: none !important; margin: 0 !important; padding: 0 !important; display: grid !important; gap: 4px !important; }
    .userShiftEventList li { display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; gap: 8px !important; color: #fff8ea !important; font-size: 12px !important; }
    .userShiftEventList time { color: #d0ad58 !important; font-weight: 900 !important; }

    .scheduleShiftBlock.published, .compactShift.published, .shiftCard.published { background: #c9f2d1 !important; color: #111 !important; border-color: rgba(47,191,91,.55) !important; }
    .scheduleShiftBlock.published .shiftLine { color: #111 !important; }
    .scheduleShiftBlock.onBreak, .compactShift.onBreak, .shiftCard.onBreak { background: #fff2a8 !important; color: #111 !important; border-color: rgba(214,176,0,.7) !important; }
    .scheduleShiftBlock.onBreak .shiftLine, .compactShift.onBreak *, .shiftCard.onBreak * { color: #111 !important; }
  `;
  document.head.appendChild(style);

  document.addEventListener('click', function (event) {
    const action = event.target.closest('[data-home-shift-action]');
    if (action) {
      event.preventDefault();
      doShiftAction(action);
      return;
    }
    setTimeout(applyAll, 0);
  }, true);

  document.addEventListener('change', function () { setTimeout(applyAll, 0); }, true);

  if (typeof bind === 'function' && !bind.__statusCardActionsV3) {
    var oldBind = bind;
    bind = function bindWithStatusActions() {
      oldBind();
      applyAll();
    };
    bind.__statusCardActionsV3 = true;
  }

  const originalRender = typeof render === 'function' && render;
  if (originalRender && !originalRender.__homeStatusFixesWrappedV3) {
    render = function renderWithHomeStatusFixes() {
      originalRender();
      applyAll();
    };
    render.__homeStatusFixesWrappedV3 = true;
  }

  window.addEventListener('resize', function () { setTimeout(applyAll, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll); else applyAll();
  setInterval(function () {
    if (document.querySelector('.rotaHomePanel .homeClockCard')) decorateHomeShiftCard();
    syncBreakVisuals();
  }, 5000);
})();
