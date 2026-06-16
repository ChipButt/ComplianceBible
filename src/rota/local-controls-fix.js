(function installLocalRotaControlsFix(){
  if (window.__localRotaControlsFix) return;
  window.__localRotaControlsFix = true;

  const rotaKey = 'localRota';
  let swipeStartX = null;
  let swipeStartY = null;
  let toolbarTapStart = null;

  function startOfWeek(date){
    const d = new Date(date);
    const offset = (d.getDay() + 6) % 7;
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - offset);
    return d;
  }

  function addDays(date, days){
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function isoDate(date){ return date.toISOString().slice(0,10); }

  function rotaState(){
    if (!state[rotaKey]) state[rotaKey] = { sections: ['Kitchen','FOH','Office','WFH','Housekeeping','KP','Kitchen PotWash','Social Media Work','Meetings'], shifts: [], copiedWeek: null };
    return state[rotaKey];
  }

  function currentWeekDate(){
    const r = rotaState();
    return new Date((r.weekStart || isoDate(startOfWeek(new Date()))) + 'T12:00:00');
  }

  function rerenderRota(){
    route = 'rota';
    save();
    if (typeof render === 'function') render();
  }

  function moveWeek(days){
    const r = rotaState();
    r.weekStart = isoDate(startOfWeek(addDays(currentWeekDate(), days)));
    rerenderRota();
  }

  function goToday(){
    rotaState().weekStart = isoDate(startOfWeek(new Date()));
    rerenderRota();
  }

  function protectToolbar(){
    document.querySelectorAll('.localRotaRange').forEach(el => el.style.pointerEvents = 'none');
    document.querySelectorAll('.localRotaArrow').forEach(el => {
      el.style.position = 'relative';
      el.style.zIndex = '10';
      el.style.pointerEvents = 'auto';
    });
  }

  function toolbarDirection(clientX){
    const toolbar = document.querySelector('.localRotaToolbar');
    if (!toolbar) return 0;
    const rect = toolbar.getBoundingClientRect();
    const x = clientX - rect.left;
    if (x < rect.width * 0.32) return -7;
    if (x > rect.width * 0.68) return 7;
    return 0;
  }

  document.addEventListener('click', function(e){
    protectToolbar();
    const prev = e.target.closest('[data-rota-prev], .localRotaArrow.prev');
    const next = e.target.closest('[data-rota-next], .localRotaArrow.next');
    const today = e.target.closest('[data-rota-today], .localRotaToday');
    if (!prev && !next && !today) return;
    e.preventDefault();
    e.stopPropagation();
    if (prev) return moveWeek(-7);
    if (next) return moveWeek(7);
    if (today) return goToday();
  }, true);

  document.addEventListener('pointerdown', function(e){
    protectToolbar();
    if (!e.target.closest('.localRotaToolbar')) return;
    toolbarTapStart = { x: e.clientX, y: e.clientY };
  }, true);

  document.addEventListener('pointerup', function(e){
    if (!toolbarTapStart) return;
    const start = toolbarTapStart;
    toolbarTapStart = null;
    if (!e.target.closest('.localRotaToolbar')) return;
    if (Math.abs(e.clientX - start.x) > 12 || Math.abs(e.clientY - start.y) > 12) return;
    const direction = toolbarDirection(e.clientX);
    if (!direction) return;
    e.preventDefault();
    e.stopPropagation();
    moveWeek(direction);
  }, true);

  document.addEventListener('touchstart', function(e){
    protectToolbar();
    if (!e.target.closest('.localRotaPage, .localRotaGrid, .localRotaToolbar')) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
  }, { passive: true, capture: true });

  document.addEventListener('touchend', function(e){
    if (swipeStartX === null || swipeStartY === null) return;
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - swipeStartX;
    const dy = touch.clientY - swipeStartY;
    const startedX = swipeStartX;
    swipeStartX = null;
    swipeStartY = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy)) return moveWeek(dx < 0 ? 7 : -7);
    if (Math.abs(dx) <= 12 && Math.abs(dy) <= 12) {
      const direction = toolbarDirection(startedX);
      if (direction) moveWeek(direction);
    }
  }, { passive: true, capture: true });

  new MutationObserver(protectToolbar).observe(document.documentElement, { childList:true, subtree:true });
  protectToolbar();
})();