(function installLocalRotaControlsFix(){
  if (window.__localRotaControlsFix) return;
  window.__localRotaControlsFix = true;

  const rotaKey = 'localRota';
  let swipeStartX = null;
  let swipeStartY = null;

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

  function isoDate(date){
    return date.toISOString().slice(0,10);
  }

  function rotaState(){
    if (!state[rotaKey]) {
      state[rotaKey] = {
        sections: ['Kitchen','FOH','Office','WFH','Housekeeping','KP','Kitchen PotWash','Social Media Work','Meetings'],
        shifts: [],
        copiedWeek: null
      };
    }
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

  document.addEventListener('click', function(e){
    const prev = e.target.closest('[data-rota-prev], .localRotaArrow.prev');
    const next = e.target.closest('[data-rota-next], .localRotaArrow.next');
    const today = e.target.closest('[data-rota-today], .localRotaToday');

    if (!prev && !next && !today) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (prev) moveWeek(-7);
    if (next) moveWeek(7);
    if (today) goToday();
  }, true);

  document.addEventListener('touchstart', function(e){
    if (!e.target.closest('.localRotaPage, .localRotaGrid')) return;
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
    swipeStartX = null;
    swipeStartY = null;

    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    moveWeek(dx < 0 ? 7 : -7);
  }, { passive: true, capture: true });
})();