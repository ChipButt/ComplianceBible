(function embeddedRotaSchedule() {
  var heightFrame = 0;
  var mutationFrame = 0;
  var draggedShiftId = '';
  var lastDragMoveAt = 0;

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

  function sectionKey(section) {
    return String(section || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function rotaVisibilityPrefs() {
    state.rotaSectionVisibility = state.rotaSectionVisibility || {};
    var userId = state.currentUserId || 'default';
    state.rotaSectionVisibility[userId] = state.rotaSectionVisibility[userId] || {};
    return state.rotaSectionVisibility[userId];
  }

  function rotaSectionHidden(section) {
    var key = sectionKey(section);
    return !!(key && rotaVisibilityPrefs()[key]);
  }

  function setRotaSectionHidden(section, hidden) {
    var key = sectionKey(section);
    if (!key) return;
    var prefs = rotaVisibilityPrefs();
    if (hidden) prefs[key] = true;
    else delete prefs[key];
    if (typeof save === 'function') save();
  }

  function eyeIcon(open) {
    if (open) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.6 12s3.5-6 9.4-6 9.4 6 9.4 6-3.5 6-9.4 6-9.4-6-9.4-6Z"/><circle cx="12" cy="12" r="3"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.6 12s3.5-6 9.4-6c2 0 3.7.7 5 1.6M21.4 12s-3.5 6-9.4 6c-2 0-3.7-.7-5-1.6"/><path d="M4 4l16 16"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/></svg>';
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

  function pushBridge() {
    try {
      if (window.CompliancePush) return window.CompliancePush;
    } catch (_) {}
    try {
      if (window.parent && window.parent !== window && window.parent.CompliancePush) return window.parent.CompliancePush;
    } catch (_) {}
    return null;
  }

  function queuePublishedShiftPushes(shifts, weekStart, publishedAt) {
    var bridge = pushBridge();
    if (!bridge || typeof bridge.notifyRotaPublished !== 'function' || !shifts.length) return;
    var payload = {
      weekStart: weekStart,
      publishedAt: publishedAt,
      users: (state.users || []).map(function pushUser(user) {
        return {
          id: user.id,
          name: user.name || '',
          nickname: user.nickname || '',
          email: user.email || '',
          upcomingShiftAlerts: user.upcomingShiftAlerts
        };
      }),
      shifts: shifts.map(function pushShift(shift) {
        return {
          id: shift.id,
          userId: shift.userId,
          section: shift.section,
          date: shift.date,
          start: shift.start,
          end: shift.end,
          notes: shift.notes || ''
        };
      })
    };
    try {
      Promise.resolve(bridge.notifyRotaPublished(payload)).catch(function ignorePushError() {});
    } catch (_) {}
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
      queuePublishedShiftPushes(newlyPublished, dates[0], publishedAt);
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
    } catch (_) {}
  }

  function topModal() {
    var modal = document.querySelector('.modalBackdrop');
    if (!modal) return;

    if (modal.dataset.rotaTopAligned !== '1') {
      modal.style.setProperty('align-items', 'flex-start', 'important');
      modal.style.setProperty('padding-top', '18px', 'important');
      modal.dataset.rotaTopAligned = '1';
    }
    if (modal.scrollTop !== 0) modal.scrollTop = 0;
    if (modal.dataset.rotaScrollTopSent !== '1') {
      modal.dataset.rotaScrollTopSent = '1';
      try {
        parent.postMessage({ type: 'rota-scroll-top' }, '*');
      } catch (_) {}
    }
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

  function syncRotaSectionVisibility(sectionBand) {
    var title = sectionBand && sectionBand.querySelector('.sectionBandTitle');
    if (!title) return;

    var section = sectionBand.dataset.rotaSection || title.dataset.rotaSectionTitle || (title.querySelector('.rotaSectionTitleText')?.textContent || title.textContent || '').trim();
    section = section.replace(/\s+/g, ' ');
    if (!section) return;

    sectionBand.dataset.rotaSection = section;
    title.dataset.rotaSectionTitle = section;
    title.classList.add('rotaVisibilityHeader');

    var hidden = rotaSectionHidden(section);
    var label = hidden ? 'Show ' + section + ' on rota' : 'Hide ' + section + ' on rota';
    title.innerHTML = '<span class="rotaSectionTitleText">' + escapeHtml(section) + '</span><button type="button" class="rotaVisibilityToggle ' + (hidden ? 'is-hidden' : 'is-visible') + '" aria-label="' + escapeHtml(label) + '" title="' + escapeHtml(label) + '" aria-pressed="' + String(!hidden) + '">' + eyeIcon(!hidden) + '</button>';

    var button = title.querySelector('.rotaVisibilityToggle');
    var weekGrid = sectionBand.querySelector('.bandWeekGrid');
    sectionBand.classList.toggle('rotaSectionHidden', hidden);
    if (weekGrid) weekGrid.hidden = hidden;
    if (button) {
      button.onclick = function toggleRotaSectionVisibility(event) {
        event.preventDefault();
        event.stopPropagation();
        setRotaSectionHidden(section, !rotaSectionHidden(section));
        syncRotaSectionVisibility(sectionBand);
        sendHeight();
      };
    }
  }

  function applyRotaSectionVisibility() {
    document.querySelectorAll('.rotaSectionBand').forEach(syncRotaSectionVisibility);
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

  function canManageSchedule() {
    try {
      return typeof can !== 'function' || can('manageRota');
    } catch (_) {
      return false;
    }
  }

  function isVisibleScheduleShift(shift) {
    try {
      return typeof visibleShift === 'function' ? visibleShift(shift) : true;
    } catch (_) {
      return true;
    }
  }

  function shiftIdFromCard(card) {
    if (!card) return '';
    if (card.dataset.shiftId) return card.dataset.shiftId;
    var inlineClick = card.getAttribute('onclick') || '';
    var match = inlineClick.match(/openShiftModal\(['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }

  function clearDropTargets() {
    document.querySelectorAll('.rotaDropTarget,.rotaDragging').forEach(function clearClass(el) {
      el.classList.remove('rotaDropTarget', 'rotaDragging');
    });
  }

  function moveShiftToCell(shiftId, cell) {
    if (!shiftId || !cell) return false;
    var date = cell.dataset.rotaDate;
    var section = cell.dataset.rotaSection;
    if (!date || !section) return false;

    var shift = (state.shifts || []).find(function findShift(candidate) {
      return candidate.id === shiftId;
    });
    if (!shift) return false;
    if (shift.date === date && shift.section === section) return false;

    shift.date = date;
    shift.section = section;
    shift.unscheduled = false;
    if (typeof save === 'function') save();
    lastDragMoveAt = Date.now();
    if (typeof renderRota === 'function') renderRota();
    return true;
  }

  function dropCellFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    return el ? el.closest('.rotaDropCell') : null;
  }

  function beginNativeShiftDrag(card, event) {
    var shiftId = shiftIdFromCard(card);
    if (!shiftId) return;
    draggedShiftId = shiftId;
    card.classList.add('rotaDragging');
    try {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', shiftId);
    } catch (_) {}
  }

  function wireDropCell(cell) {
    if (cell.dataset.rotaDropWired === '1') return;
    cell.dataset.rotaDropWired = '1';

    cell.addEventListener('dragover', function allowDrop(event) {
      if (!draggedShiftId) return;
      event.preventDefault();
      cell.classList.add('rotaDropTarget');
      try {
        event.dataTransfer.dropEffect = 'move';
      } catch (_) {}
    });

    cell.addEventListener('dragenter', function enterDrop(event) {
      if (!draggedShiftId) return;
      event.preventDefault();
      cell.classList.add('rotaDropTarget');
    });

    cell.addEventListener('dragleave', function leaveDrop(event) {
      if (!event.relatedTarget || !cell.contains(event.relatedTarget)) {
        cell.classList.remove('rotaDropTarget');
      }
    });

    cell.addEventListener('drop', function dropShift(event) {
      event.preventDefault();
      var shiftId = draggedShiftId;
      try {
        shiftId = shiftId || event.dataTransfer.getData('text/plain');
      } catch (_) {}
      clearDropTargets();
      draggedShiftId = '';
      moveShiftToCell(shiftId, cell);
    });
  }

  function startTouchShiftDrag(card, event) {
    if (!canManageSchedule()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    var shiftId = shiftIdFromCard(card);
    if (!shiftId) return;

    var isMouse = event.pointerType === 'mouse';
    var startX = event.clientX;
    var startY = event.clientY;
    var ghost = null;
    var active = false;
    var pressTimer = setTimeout(function beginTimedDrag() {
      beginDrag(event.clientX, event.clientY);
    }, isMouse ? 120 : 240);

    function beginDrag(x, y) {
      if (active) return;
      active = true;
      draggedShiftId = shiftId;
      card.classList.add('rotaDragging');
      ghost = card.cloneNode(true);
      ghost.classList.add('rotaDragGhost');
      ghost.style.width = Math.max(84, Math.round(card.getBoundingClientRect().width)) + 'px';
      document.body.appendChild(ghost);
      moveGhost(x, y);
      try {
        card.setPointerCapture(event.pointerId);
      } catch (_) {}
    }

    function cleanup() {
      clearTimeout(pressTimer);
      if (ghost) ghost.remove();
      card.classList.remove('rotaDragging');
      clearDropTargets();
      draggedShiftId = '';
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
      try {
        card.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }

    function moveGhost(x, y) {
      if (!ghost) return;
      ghost.style.transform = 'translate(' + Math.round(x + 10) + 'px,' + Math.round(y + 10) + 'px)';
    }

    function onPointerMove(moveEvent) {
      var dx = moveEvent.clientX - startX;
      var dy = moveEvent.clientY - startY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (!active && isMouse && distance > 4) {
        clearTimeout(pressTimer);
        beginDrag(moveEvent.clientX, moveEvent.clientY);
      }
      if (!active && !isMouse && distance > 10) {
        cleanup();
        return;
      }
      if (!active) return;
      moveEvent.preventDefault();
      moveGhost(moveEvent.clientX, moveEvent.clientY);
      document.querySelectorAll('.rotaDropTarget').forEach(function clearCell(cell) {
        cell.classList.remove('rotaDropTarget');
      });
      var cell = dropCellFromPoint(moveEvent.clientX, moveEvent.clientY);
      if (cell) cell.classList.add('rotaDropTarget');
    }

    function onPointerUp(upEvent) {
      if (active) {
        upEvent.preventDefault();
        var cell = dropCellFromPoint(upEvent.clientX, upEvent.clientY);
        if (cell) moveShiftToCell(shiftId, cell);
      }
      cleanup();
    }

    function onPointerCancel() {
      cleanup();
    }

    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerCancel, true);
  }

  function wireShiftCard(card) {
    var shiftId = shiftIdFromCard(card);
    if (!shiftId) return;

    card.dataset.shiftId = shiftId;
    card.draggable = true;
    card.classList.add('rotaDraggableShift');
    card.setAttribute('title', 'Drag to move shift; tap to edit');

    if (card.dataset.rotaDragWired === '1') return;
    card.dataset.rotaDragWired = '1';

    card.addEventListener('dragstart', function dragShift(event) {
      beginNativeShiftDrag(card, event);
    });
    card.addEventListener('dragend', function endDrag() {
      draggedShiftId = '';
      clearDropTargets();
    });
    card.addEventListener('pointerdown', function pointerDrag(event) {
      startTouchShiftDrag(card, event);
    });
  }

  function wireScheduleDragDrop() {
    if (!canManageSchedule()) return;

    var dates = currentWeekDates();
    document.querySelectorAll('.rotaSectionBand').forEach(function wireBand(sectionBand) {
      var section = (sectionBand.querySelector('.sectionBandTitle')?.textContent || '').trim();
      if (!section) return;

      var cells = sectionBand.querySelectorAll('.bandDayCell,.compactDayCell,.rotaDayCell');
      cells.forEach(function wireCell(cell, dayIndex) {
        var date = dates[dayIndex];
        if (!date) return;

        cell.dataset.rotaSection = section;
        cell.dataset.rotaDate = date;
        cell.classList.add('rotaDropCell');
        wireDropCell(cell);

        var shifts = (state.shifts || []).filter(function matchesCell(shift) {
          return shift.section === section && shift.date === date && isVisibleScheduleShift(shift);
        }).sort(function sortShift(a, b) {
          return String(a.start).localeCompare(String(b.start));
        });

        cell.querySelectorAll('.scheduleShiftBlock,.shiftCard').forEach(function wireCard(card, index) {
          if (shifts[index]) card.dataset.shiftId = shifts[index].id;
          wireShiftCard(card);
        });
      });
    });
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
    applyRotaSectionVisibility();
    enhancePlanningTools();
    wireScheduleDragDrop();
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
      var previousScrollX = window.scrollX || 0;
      var previousScrollY = window.scrollY || 0;
      patchPlanningActions();
      forceScheduleView();
      originalRenderRota();
      enhanceScheduleToolbar();
      if (previousScrollX || previousScrollY) window.scrollTo(previousScrollX, previousScrollY);
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
      wireScheduleDragDrop();
      topModal();
      sendHeight();
    });
  });

  window.rotaGoToday = goToday;
  document.addEventListener('click', function suppressClickAfterDrag(event) {
    if (Date.now() - lastDragMoveAt > 500) return;
    var shiftCard = event.target.closest('.rotaDraggableShift');
    if (!shiftCard) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);
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
