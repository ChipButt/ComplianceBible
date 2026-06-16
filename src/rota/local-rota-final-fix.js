(function localRotaFinalFix(){
  if (window.__localRotaFinalFix) return;
  window.__localRotaFinalFix = true;

  const key = 'localRota';
  const sections = ['Kitchen','FOH','Office','WFH','Housekeeping','KP','Kitchen PotWash','Social Media Work','Meetings'];

  function pad(n){ return String(n).padStart(2,'0'); }
  function localIso(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function parseIso(s){ const [y,m,d] = String(s || localIso(new Date())).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0); }
  function monday(d){ const x = new Date(d); const offset = (x.getDay() + 6) % 7; x.setHours(12,0,0,0); x.setDate(x.getDate() - offset); return x; }
  function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function rotaState(){ if(!state[key]) state[key] = { sections:[...sections], shifts:[], copiedWeek:null, template:null }; if(!state[key].sections) state[key].sections = [...sections]; if(!state[key].shifts) state[key].shifts = []; return state[key]; }
  function currentMonday(){ const r = rotaState(); r.weekStart = localIso(monday(parseIso(r.weekStart || localIso(new Date())))); return parseIso(r.weekStart); }
  function setWeekByDays(days){ const r = rotaState(); r.weekStart = localIso(monday(addDays(currentMonday(), days))); save(); route = 'rota'; render(); setTimeout(applyFixes,0); }
  function goToday(){ const r = rotaState(); r.weekStart = localIso(monday(new Date())); save(); route = 'rota'; render(); setTimeout(applyFixes,0); }

  window.localRotaPrevWeek = () => setWeekByDays(-7);
  window.localRotaNextWeek = () => setWeekByDays(7);
  window.localRotaToday = goToday;

  function saveTemplate(){
    const r = rotaState();
    const start = currentMonday();
    const end = addDays(start,6);
    const from = localIso(start);
    const to = localIso(end);
    r.template = r.shifts.filter(s => s.date >= from && s.date <= to).map(s => ({...s, id: uid()}));
    save();
    alert('Week saved as template');
  }

  function loadTemplate(){
    const r = rotaState();
    if(!r.template || !r.template.length){ alert('No saved template yet'); return; }
    const target = currentMonday();
    const source = monday(parseIso(r.template[0].date));
    r.template.forEach(s => {
      const offset = Math.round((parseIso(s.date) - source) / 86400000);
      r.shifts.push({...s, id: uid(), date: localIso(addDays(target, offset))});
    });
    save();
    route = 'rota';
    render();
    setTimeout(applyFixes,0);
  }

  function addHitZones(toolbar){
    if(!toolbar || toolbar.dataset.finalHitZones === '1') return;
    toolbar.dataset.finalHitZones = '1';
    toolbar.style.position = 'relative';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'localRotaFinalHit localRotaFinalPrev';
    prev.setAttribute('aria-label','Previous week');
    prev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.localRotaPrevWeek(); });

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'localRotaFinalHit localRotaFinalNext';
    next.setAttribute('aria-label','Next week');
    next.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.localRotaNextWeek(); });

    toolbar.appendChild(prev);
    toolbar.appendChild(next);
  }

  function applyFixes(){
    const r = rotaState();
    r.weekStart = localIso(currentMonday());
    save();

    const toolbar = document.querySelector('.localRotaToolbar');
    addHitZones(toolbar);
    document.querySelectorAll('.localRotaRange').forEach(el => el.style.pointerEvents = 'none');
    document.querySelectorAll('[data-rota-next], .localRotaArrow.next').forEach(el => { el.onclick = e => { e.preventDefault(); e.stopPropagation(); window.localRotaNextWeek(); }; });
    document.querySelectorAll('[data-rota-prev], .localRotaArrow.prev').forEach(el => { el.onclick = e => { e.preventDefault(); e.stopPropagation(); window.localRotaPrevWeek(); }; });
    document.querySelectorAll('[data-rota-today], .localRotaToday').forEach(el => { el.onclick = e => { e.preventDefault(); e.stopPropagation(); window.localRotaToday(); }; });

    const planningButtons = document.querySelector('.localRotaPlanning .buttons');
    if(planningButtons && !planningButtons.querySelector('[data-rota-load-template]')){
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'light';
      load.dataset.rotaLoadTemplate = '1';
      load.textContent = 'Load saved template';
      load.addEventListener('click', loadTemplate);
      planningButtons.appendChild(load);
    }

    const saveTemplateButton = document.querySelector('[data-rota-template]');
    if(saveTemplateButton) saveTemplateButton.onclick = e => { e.preventDefault(); e.stopPropagation(); saveTemplate(); };
  }

  const css = document.createElement('style');
  css.textContent = `.localRotaFinalHit{position:absolute;top:0;height:58px;width:34%;border:0;background:transparent;color:transparent;z-index:999;padding:0;margin:0}.localRotaFinalPrev{left:0}.localRotaFinalNext{right:0}.localRotaArrow,.localRotaToday{position:relative;z-index:1000}.localRotaRange{pointer-events:none!important}`;
  document.head.appendChild(css);

  document.addEventListener('click', e => {
    const load = e.target.closest('[data-rota-load-template]');
    if(load){ e.preventDefault(); e.stopPropagation(); loadTemplate(); }
  }, true);

  new MutationObserver(applyFixes).observe(document.documentElement,{childList:true,subtree:true});
  applyFixes();
})();