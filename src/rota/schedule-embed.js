(function embeddedRotaSchedule() {
  var heightFrame = 0;
  var mutationFrame = 0;

  function offsetDate(date, days) {
    var copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function mondayDate(date) {
    var copy = new Date(date);
    var dayOffset = (copy.getDay() + 6) % 7;
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - dayOffset);
    return copy;
  }

  function isoDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function replaceChar(char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function currentWeekDates() {
    var start = window.__rbWeekStart ? new Date(window.__rbWeekStart + 'T12:00:00') : mondayDate(new Date());
    start = mondayDate(start);
    return [0, 1, 2, 3, 4, 5, 6].map(function mapWeek(day) {
      return isoDate(offsetDate(start, day));
    });
  }

  function currentWeekShifts() {
    var dates = currentWeekDates();
    try {
      return (state.shifts || []).filter(function filterShift(shift) {
        return dates.includes(shift.date);
      });
    } catch (_) {
      return [];
    }
  }

  function publishedWeekForShift(shift) {
    var weekStartKey = isoDate(mondayDate(new Date(shift.date + 'T12:00:00')));
    return state.publishedWeeks && state.publishedWeeks[weekStartKey];
  }

  function isShiftPublished(shift) {
    var week = publishedWeekForShift(shift);
    return !!(shift.publishedAt || (week && Array.isArray(week.shiftIds) && week.shiftIds.includes(shift.id)));
  }

  function alertId() {
    return 'alert_' + Math.random().toString(36).slice(2, 9);
  }

  function templateId() {
    return 'tpl_' + Math.random().toString(36).slice(2, 9);
  }

  function defaultTemplateName() {
    var dates = currentWeekDates();
    return 'Week of ' + dates[0];
  }

  function shiftToTemplateItem(shift, dates) {
    return {
      dayOffset: dates.indexOf(shift.date),
      userId: shift.userId,
      section: shift.section,
      start: shift.start,
      end: shift.end,
      notes: shift.notes || '',
      unassigned: shift.userId === 'unassigned'
    };
  }

  function setScheduleWeek(date) {
    var start = mondayDate(new Date(date));
    try {
      weekStart = start;
    } catch (_) {}
    window.__rbWeekStart = isoDate(start);
  }

  function moveWeek(days) {
    try {
      var current = window.__rbWeekStart ? new Date(window.__rbWeekStart + 'T12:00:00') : mondayDate(new Date());
      setScheduleWeek(offsetDate(current, days));
      forceScheduleView();
      if (typeof renderRota === 'function') renderRota();
      setTimeout(enhanceScheduleToolbar, 0);
    } catch (_) {}
  }

  window.add = window.add || offsetDate;

  function contentHeight() {
    var grid = document.getElementById('rotaGrid');
    if (!grid) return 650;

    var bottom = 0;
    Array.prototype.slice.call(grid.children).forEach(function measureChild(el) {
      if (el.offsetParent !== null) bottom = Math.max(bottom, el.offsetTop + el.offsetHeight);
    });
    return Math.max(420, Math.ceil(bottom + 12));
  }

  function sendHeight() {
    if (heightFrame) return;
    var run = function sendMeasuredHeight() {
      heightFrame = 0;
      try {
        parent.postMessage({ type: 'rota-app-height', height: contentHeight() }, '*');
      } catch (_) {}
    };
    heightFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 16);
  }

  function forceScheduleView() {
    try {
      if (state.view !== 'rota') {
        state.view = 'rota';
        if (typeof save === 'function') save();
      }
    } catch (_) {}
  }

  function disableDraftShiftAlerts() {
    var noop = function draftShiftAlert() {};
    try {
      window.queueNewShiftAlert = noop;
      queueNewShiftAlert = noop;
    } catch (_) {}
  }

  function queuePublishNotification(shift, type) {
    if (!shift.userId || shift.userId === 'unassigned') return false;
    var user = (state.users || []).find(function findUser(candidate) {
      return candidate.id === shift.userId;
    });
    if (!user || !user.email) return false;
    state.alerts = state.alerts || [];
    state.alerts.push({
      id: alertId(),
      type: type || 'published_shift_notice',
      userId: user.id,
      email: user.email,
      shiftId: shift.id,
      createdAt: new Date().toISOString(),
      fixedOn: true
    });
    return true;
  }

  function publishCurrentScheduleWeek() {
    try {
      state.shifts = state.shifts || [];
      state.publishedWeeks = state.publishedWeeks || {};
      var dates = currentWeekDates();
      var assigned = currentWeekShifts().filter(function assignedShift(shift) {
        return shift.userId && shift.userId !== 'unassigned';
      });
      var newlyPublished = assigned.filter(function unpublishedShift(shift) {
        return !isShiftPublished(shift);
      });
      var publishedAt = new Date().toISOString();
      assigned.forEach(function markLive(shift) {
        shift.publishedAt = shift.publishedAt || publishedAt;
      });
      var notified = 0;
      newlyPublished.forEach(function notifyStaff(shift) {
        if (queuePublishNotification(shift, 'published_shift_notice')) notified += 1;
      });
      state.publishedWeeks[dates[0]] = {
        publishedAt: publishedAt,
        sections: Array.from(new Set(assigned.map(function shiftSection(shift) { return shift.section; }))).filter(Boolean),
        shiftIds: assigned.map(function shiftId(shift) { return shift.id; })
      };
      if (typeof save === 'function') save();
      alert(assigned.length + ' shift(s) are now live. ' + notified + ' staff notification(s) queued.');
      if (typeof renderRota === 'function') renderRota();
      setTimeout(enhanceScheduleToolbar, 0);
    } catch (_) {}
  }

  function patchPlanningActions() {
    disableDraftShiftAlerts();
    if (window.__embeddedRotaPlanningPatched) return;

    window.saveCurrentWeekAsTemplate = saveCurrentScheduleTemplate;
    window.publishCurrentWeek = publishCurrentScheduleWeek;
    try {
      saveCurrentWeekAsTemplate = window.saveCurrentWeekAsTemplate;
    } catch (_) {}
    try {
      publishCurrentWeek = window.publishCurrentWeek;
    } catch (_) {}
    window.__embeddedRotaPlanningPatched = true;
  }

  function saveCurrentScheduleTemplate() {
    try {
      state.rotaTemplates = state.rotaTemplates || [];
      var dates = currentWeekDates();
      var nameInput = document.querySelector('#rotaTemplateName');
      var name = (nameInput?.value || '').trim() || defaultTemplateName();
      var items = currentWeekShifts().map(function mapTemplateShift(shift) {
        return shiftToTemplateItem(shift, dates);
      });
      state.rotaTemplates.push({
        id: templateId(),
        name: name,
        createdAt: new Date().toISOString(),
        items: items
      });
      if (typeof save === 'function') save();
      if (nameInput) nameInput.value = '';
      if (typeof renderRota === 'function') renderRota();
      setTimeout(enhanceScheduleToolbar, 0);
    } catch (_) {}
  }

  function setPlanningButtonLabels(container) {
    container.querySelectorAll('button').forEach(function normalizePlanningButton(button) {
      var text = (button.textContent || '').trim().toLowerCase();
      if (text === 'save rota' || text === 'save & send notifications') {
        button.textContent = 'Publish rota';
      }
    });
  }

  function renderPlanningStatus(container) {
    var row = container.querySelector('.rotaPlanStatus');
    if (!row) {
      row = document.createElement('div');
      row.className = 'rotaPlanStatus';
      var actions = container.querySelector('.scheduleActions') || container.querySelector('.planningActions');
      if (actions) actions.insertAdjacentElement('afterend', row);
      else container.appendChild(row);
    }
    var shifts = currentWeekShifts();
    var liveCount = shifts.filter(isShiftPublished).length;
    var draftCount = Math.max(0, shifts.length - liveCount);
    row.innerHTML = '<span>Draft: ' + draftCount + '</span><span>Live: ' + liveCount + '</span>';
  }

  function renderTemplateSaveRow(container) {
    var row = container.querySelector('.rotaTemplateSaveRow');
    if (!row) {
      row = document.createElement('div');
      row.className = 'rotaTemplateSaveRow';
      var actions = container.querySelector('.scheduleActions') || container.querySelector('.planningActions');
      if (actions) actions.insertAdjacentElement('afterend', row);
      else container.appendChild(row);
    }
    var input = row.querySelector('#rotaTemplateName');
    if (!input) {
      row.innerHTML = '<label>Template name<input id="rotaTemplateName" type="text" placeholder="' + escapeHtml(defaultTemplateName()) + '"></label>';
    }
  }

  function renderTemplateLoader(container) {
    var templates = (state.rotaTemplates || []).slice();
    var row = container.querySelector('.rotaTemplateLoader');
    if (!row) {
      row = document.createElement('div');
      row.className = 'templateLoadRow rotaTemplateLoader';
      var status = container.querySelector('.rotaPlanStatus');
      if (status) status.insertAdjacentElement('afterend', row);
      else container.appendChild(row);
    }

    var signature = templates.map(function templateSignature(template) {
      var count = Array.isArray(template.items) ? template.items.length : 0;
      return [template.id, template.name, count].join(':');
    }).join('|');
    if (row.dataset.templateSignature === signature) return;
    row.dataset.templateSignature = signature;

    var options = templates.length
      ? templates.map(function optionForTemplate(template) {
          var count = Array.isArray(template.items) ? template.items.length : 0;
          return '<option value="' + escapeHtml(template.id) + '">' + escapeHtml(template.name || 'Untitled template') + ' (' + count + ' shifts)</option>';
        }).join('')
      : '<option value="">No saved templates yet</option>';

    row.innerHTML = '<label>Saved templates<select id="scheduleTemplateSelect" ' + (templates.length ? '' : 'disabled') + '>' + options + '</select></label><button type="button" class="secondary" data-load-template ' + (templates.length ? '' : 'disabled') + '>Load into this week</button>';
    var loadButton = row.querySelector('[data-load-template]');
    var select = row.querySelector('#scheduleTemplateSelect');
    if (loadButton && select) {
      loadButton.onclick = function loadSelectedTemplate() {
        if (!select.value || typeof window.loadTemplateToCurrentWeek !== 'function') return;
        window.loadTemplateToCurrentWeek(select.value);
      };
    }
  }

  function enhancePlanningTools() {
    patchPlanningActions();
    var tools = document.querySelector('.scheduleAdminTools');
    if (!tools) return;

    setPlanningButtonLabels(tools);
    renderTemplateSaveRow(tools);
    renderPlanningStatus(tools);
    renderTemplateLoader(tools);
  }

  function goToday() {
    try {
      setScheduleWeek(new Date());
      forceScheduleView();
      if (typeof renderRota === 'function') renderRota();
      setTimeout(enhanceScheduleToolbar, 0);
    } catch (_) {}
  }

  function topModal() {
    var modal = document.querySelector('.modalBackdrop');
    if (!modal) return;

    modal.style.setProperty('align-items', 'flex-start', 'important');
    modal.style.setProperty('padding-top', '18px', 'important');
    modal.scrollTop = 0;
    try {
      parent.postMessage({ type: 'rota-scroll-top' }, '*');
    } catch (_) {}
    sendHeight();
  }

  function splitHeaderCell(el) {
    if (!el || el.dataset.rotaSplit === '1') return;

    var text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    var match = text.match(/^([A-Za-z]{3,9})\s+(\d{1,2})\s+([A-Za-z]{3,9})$/);
    if (!match) return;

    el.innerHTML = '<span>' + match[1] + '</span><span>' + match[2] + '</span><span>' + match[3] + '</span>';
    el.dataset.rotaSplit = '1';
    el.style.setProperty('display', 'grid', 'important');
    el.style.setProperty('gap', '1px', 'important');
    el.style.setProperty('line-height', '1.05', 'important');
    el.style.setProperty('text-align', 'center', 'important');
  }

  function formatBandDayHeader(el) {
    if (!el || el.dataset.rotaDateStack === '1') return;

    var strong = el.querySelector('strong');
    var dateSpan = el.querySelector('span');
    var day = (strong?.textContent || '').trim();
    var dateText = (dateSpan?.textContent || '').trim().replace(/\s+/g, ' ');
    var match = dateText.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
    if (!day || !match) return;

    el.innerHTML = '<strong>' + day + '</strong><span class="rotaDateNumber">' + match[1] + '</span><span class="rotaDateMonth">' + match[2] + '</span>';
    el.dataset.rotaDateStack = '1';
  }

  function formatDateHeaders() {
    document.querySelectorAll('th,td,.dayHeader,.day,.date').forEach(splitHeaderCell);
    document.querySelectorAll('.bandDayHead').forEach(formatBandDayHeader);
  }

  function bindWeekArrow(button, direction, label, className) {
    var freshButton = button.cloneNode(true);
    freshButton.removeAttribute('onclick');
    freshButton.classList.add('rotaWeekArrow', className);
    freshButton.setAttribute('aria-label', label);
    freshButton.onclick = function changeWeek(event) {
      event.preventDefault();
      moveWeek(direction);
    };
    button.replaceWith(freshButton);
    return freshButton;
  }

  function enhanceScheduleToolbar() {
    var toolbar = document.querySelector('.toolbar');
    if (!toolbar) {
      sendHeight();
      return false;
    }

    var buttons = toolbar.querySelectorAll('button.secondary');
    if (buttons[0]) {
      bindWeekArrow(buttons[0], -7, 'Previous week', 'prev');
    }
    if (buttons[1]) {
      bindWeekArrow(buttons[1], 7, 'Next week', 'next');
    }

    var date = toolbar.querySelector('strong');
    if (date) {
      date.classList.add('rotaWeekDate');
      date.style.setProperty('white-space', 'normal', 'important');
      date.style.setProperty('overflow', 'visible', 'important');
      date.style.setProperty('text-overflow', 'clip', 'important');
    }

    if (!toolbar.querySelector('.rotaTodayButton')) {
      var todayButton = document.createElement('button');
      todayButton.type = 'button';
      todayButton.className = 'rotaTodayButton';
      todayButton.setAttribute('aria-label', 'Go to current week');
      todayButton.innerHTML = '<span class="rotaTodayButtonText">Today</span>';
      todayButton.onclick = goToday;
      toolbar.appendChild(todayButton);
    }

    toolbar.querySelectorAll('.rotaTodayButton').forEach(function normalizeTodayButton(button) {
      button.type = 'button';
      button.setAttribute('aria-label', 'Go to current week');
      if (!button.querySelector('.rotaTodayButtonText')) {
        button.innerHTML = '<span class="rotaTodayButtonText">Today</span>';
      }
    });

    formatDateHeaders();
    enhancePlanningTools();
    sendHeight();
    return true;
  }

  function collapseLoadedButtons() {
    document.querySelectorAll('details[open]').forEach(function closeDetails(details) {
      details.removeAttribute('open');
    });
    document.querySelectorAll('[aria-expanded="true"]').forEach(function collapseControl(el) {
      el.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.open,.expanded,.activePanel').forEach(function collapsePanel(el) {
      if (el.closest('#rotaGrid')) el.classList.remove('open', 'expanded', 'activePanel');
    });
  }

  function revealWhenReady() {
    if (!enhanceScheduleToolbar()) {
      setTimeout(revealWhenReady, 40);
      return;
    }

    collapseLoadedButtons();
    requestAnimationFrame(function firstFrame() {
      requestAnimationFrame(function secondFrame() {
        document.body.classList.add('rota-ready');
        sendHeight();
        try {
          parent.postMessage({ type: 'rota-app-ready' }, '*');
        } catch (_) {}
      });
    });
  }

  try {
    var originalRenderRota = renderRota;
    renderRota = function embeddedRenderRota() {
      patchPlanningActions();
      forceScheduleView();
      originalRenderRota();
      setTimeout(enhanceScheduleToolbar, 0);
      setTimeout(sendHeight, 80);
    };
  } catch (_) {}

  try {
    var originalOpenShiftModal = openShiftModal;
    openShiftModal = function embeddedTopShiftModal() {
      originalOpenShiftModal.apply(this, arguments);
      setTimeout(topModal, 0);
      setTimeout(topModal, 80);
    };
  } catch (_) {}

  try {
    render = function embeddedScheduleOnlyRender() {
      forceScheduleView();
      if (typeof renderRota === 'function') renderRota();
    };
  } catch (_) {}

  var observer = new MutationObserver(function syncEmbedState() {
    if (mutationFrame) return;
    mutationFrame = requestAnimationFrame(function runEmbedSync() {
      mutationFrame = 0;
      formatDateHeaders();
      enhancePlanningTools();
      topModal();
      sendHeight();
    });
  });

  window.rotaGoToday = goToday;
  observer.observe(document.documentElement, { childList: true, subtree: true });
  patchPlanningActions();
  forceScheduleView();
  if (typeof renderRota === 'function') renderRota();
  revealWhenReady();
  window.addEventListener('resize', sendHeight);
  window.addEventListener('load', function scheduleInitialMeasure() {
    setTimeout(sendHeight, 120);
  });
})();
