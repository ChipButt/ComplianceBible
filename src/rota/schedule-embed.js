(function embeddedRotaSchedule() {
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
    try {
      parent.postMessage({ type: 'rota-app-height', height: contentHeight() }, '*');
    } catch (_) {}
  }

  function forceScheduleView() {
    try {
      state.view = 'rota';
      if (typeof save === 'function') save();
    } catch (_) {}
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
    formatDateHeaders();
    topModal();
    sendHeight();
  });

  window.rotaGoToday = goToday;
  observer.observe(document.documentElement, { childList: true, subtree: true });
  forceScheduleView();
  if (typeof renderRota === 'function') renderRota();
  revealWhenReady();
  window.addEventListener('resize', sendHeight);
  window.addEventListener('load', function scheduleInitialMeasure() {
    setTimeout(sendHeight, 120);
  });
})();
