// Local Rota module for Compliance Bible.
// This is intentionally NOT an iframe and does NOT pull live code from another app.
(function installLocalRotaModule(){
  const style = document.createElement('style');
  style.textContent = `
    body.is-rota-route { background:#080a0c; overflow-y:auto!important; }
    body.is-rota-route #appShell { min-height:100vh; overflow:visible!important; }
    body.is-rota-route #app { overflow:visible!important; }

    .localRotaPage{background:#050607;color:#fff8ea;border-radius:24px 24px 0 0;overflow:hidden;padding-bottom:18px;}
    .localRotaToolbar{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;grid-template-areas:'prev range next' '. today .';align-items:center;gap:8px;padding:18px 20px 14px;background:#050607;color:#f0b84a;}
    .localRotaRange{grid-area:range;text-align:center;font-size:18px;line-height:1.15;font-weight:950;white-space:normal;overflow:visible;text-overflow:clip;}
    .localRotaArrow{width:42px;height:42px;display:grid;place-items:center;background:transparent;border:0;color:#f0b84a;padding:0;margin:0;}
    .localRotaArrow.prev{grid-area:prev;justify-self:end;}
    .localRotaArrow.next{grid-area:next;justify-self:start;}
    .localRotaArrow:before{content:'';width:14px;height:14px;border-right:6px solid currentColor;border-bottom:6px solid currentColor;border-radius:2px;display:block;box-sizing:border-box;}
    .localRotaArrow.prev:before{transform:rotate(135deg);}
    .localRotaArrow.next:before{transform:rotate(-45deg);}
    .localRotaToday{grid-area:today;justify-self:center;width:auto;min-width:0;height:auto;min-height:0;padding:4px 8px;border-radius:999px;border:1px solid rgba(240,184,74,.72);background:rgba(176,145,74,.14);color:#fff8ea;font-size:13px;font-weight:950;line-height:1;}

    .localRotaGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px;background:#111820;border-top:1px solid #111820;border-bottom:1px solid #111820;}
    .localRotaDayHead{background:#101010;color:#fff8ea;min-height:58px;display:grid;place-items:center;text-align:center;font-weight:900;line-height:1.05;font-size:13px;padding:5px 2px;}
    .localRotaDayHead span{display:block;}
    .localRotaDayHead .dow{color:#b0914a;font-size:13px;}
    .localRotaDayHead .day{color:#fff8ea;font-size:12px;}
    .localRotaDayHead .month{color:#fff8ea;font-size:11px;}
    .localRotaSection{grid-column:1/-1;background:#050607;color:#b0914a;text-align:center;font-weight:950;font-size:13px;line-height:1;padding:6px 4px;border-top:12px solid #050607;}
    .localRotaCell{background:#fffdf8;color:#111;min-height:126px;padding:6px 4px;display:flex;flex-direction:column;gap:5px;border-right:1px solid #d8d2c4;overflow:hidden;}
    .localRotaCell:last-child{border-right:0;}
    .localRotaEmpty{color:#777;font-size:12px;line-height:1;}
    .localRotaAdd{align-self:center;margin-top:8px;width:28px;height:28px;border-radius:999px;border:1.5px solid #b0914a;background:#050607;color:#b0914a;font-size:22px;line-height:22px;font-weight:950;padding:0;display:grid;place-items:center;}
    .localShift{background:#111;color:#fff8ea;border-left:4px solid #b0914a;border-radius:10px;padding:6px;font-size:11px;line-height:1.2;box-shadow:0 2px 8px rgba(0,0,0,.18);}
    .localShift strong,.localShift span{display:block;}

    .localRotaPlanning{background:#fffdf8;color:#111;margin:14px 0 0;border-radius:18px;padding:14px;border:1px solid #d8d2c4;}
    .localRotaPlanning h2{margin:0 0 10px;font-size:20px;}
    .localRotaPlanning .buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .localRotaPlanning button{border-radius:10px;padding:10px;background:#111;color:#b0914a;font-weight:900;border:0;}
    .localRotaPlanning button.light{background:#f4eddb;color:#111;border:1px solid #d8d2c4;}

    .localRotaModal{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.72);display:flex;align-items:flex-start;justify-content:center;padding:18px 12px;overflow-y:auto;}
    .localRotaModalCard{width:min(560px,100%);background:#fffdf8;color:#111;border:1px solid #b0914a;border-radius:22px;padding:18px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.35);}
    .localRotaModalCard h2{margin:0 44px 14px 0;font-size:22px;}
    .localRotaClose{position:absolute;right:12px;top:10px;width:38px;height:38px;border-radius:999px;border:0;background:#111;color:#b0914a;font-size:26px;line-height:1;padding:0;}
    .localRotaForm{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .localRotaForm label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:900;color:#6f6757;}
    .localRotaForm input,.localRotaForm select,.localRotaForm textarea{width:100%;border:1px solid #d8d2c4;border-radius:12px;padding:10px;background:#fff;color:#111;font-size:16px;}
    .localRotaForm .full{grid-column:1/-1;}
    .localRotaForm textarea{min-height:80px;resize:vertical;}
    .localRotaFormActions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;}
    .localRotaFormActions button{flex:1;border-radius:12px;padding:12px;background:#111;color:#b0914a;border:0;font-weight:950;}
    .localRotaFormActions button.danger{background:#9f2f24;color:#fff;}
  `;
  document.head.appendChild(style);

  const sections = ['Kitchen','FOH','Office','WFH','Housekeeping','KP','Kitchen PotWash','Social Media Work','Meetings'];
  const rotaKey = 'localRota';

  function escRota(value){ return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function rotaData(){ state[rotaKey] ||= { sections:[...sections], shifts:[], copiedWeek:null }; return state[rotaKey]; }
  function startOfWeek(d){ const x = new Date(d); const n = (x.getDay()+6)%7; x.setHours(0,0,0,0); x.setDate(x.getDate()-n); return x; }
  function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function isoDate(d){ return d.toISOString().slice(0,10); }
  function fmtRange(d){ const a = new Date(d); const b = addDays(a,6); return `${a.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} - ${b.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`; }
  function dayParts(d){ return { dow:d.toLocaleDateString('en-GB',{weekday:'short'}), day:d.toLocaleDateString('en-GB',{day:'numeric'}), month:d.toLocaleDateString('en-GB',{month:'short'}) }; }
  function currentWeek(){ const r = rotaData(); r.weekStart ||= isoDate(startOfWeek(new Date())); return new Date(r.weekStart+'T12:00:00'); }
  function setWeek(d){ rotaData().weekStart = isoDate(startOfWeek(d)); save(); render(); }
  function userOptions(selected){ return state.users.map(u => `<option value="${escRota(u.id)}" ${u.id===selected?'selected':''}>${escRota(u.nickname || u.name)}</option>`).join(''); }
  function sectionOptions(selected){ return rotaData().sections.map(s => `<option ${s===selected?'selected':''}>${escRota(s)}</option>`).join(''); }

  function rota(){
    const r = rotaData();
    const week = currentWeek();
    const days = Array.from({length:7},(_,i)=>addDays(week,i));
    const todayWeek = startOfWeek(new Date());
    return `<section class="localRotaPage">
      <div class="localRotaToolbar">
        <button class="localRotaArrow prev" data-rota-prev aria-label="Previous week"></button>
        <div class="localRotaRange">${escRota(fmtRange(week))}</div>
        <button class="localRotaArrow next" data-rota-next aria-label="Next week"></button>
        <button class="localRotaToday" data-rota-today>Today</button>
      </div>
      <div class="localRotaGrid">
        ${days.map(d=>{ const p=dayParts(d); return `<div class="localRotaDayHead"><span class="dow">${escRota(p.dow)}</span><span class="day">${escRota(p.day)}</span><span class="month">${escRota(p.month)}</span></div>`; }).join('')}
        ${r.sections.map(section => `<div class="localRotaSection">${escRota(section)}</div>${days.map(day => rotaCell(section, isoDate(day))).join('')}`).join('')}
      </div>
      <section class="localRotaPlanning">
        <h2>Rota planning</h2>
        <div class="buttons"><button data-rota-copy>Copy current week</button><button class="light" data-rota-paste>Paste copied week here</button><button class="light" data-rota-template>Save week as template</button><button data-rota-save>Save rota</button></div>
      </section>
    </section>`;
  }

  function rotaCell(section,date){
    const shifts = rotaData().shifts.filter(s => s.section===section && s.date===date);
    return `<div class="localRotaCell" data-section="${escRota(section)}" data-date="${escRota(date)}">
      ${shifts.length ? shifts.map(shiftCard).join('') : '<span class="localRotaEmpty">—</span>'}
      <button class="localRotaAdd" data-rota-add data-section="${escRota(section)}" data-date="${escRota(date)}">+</button>
    </div>`;
  }

  function shiftCard(s){ const u = state.users.find(x=>x.id===s.userId); return `<div class="localShift" data-shift-id="${escRota(s.id)}"><strong>${escRota(u?.nickname || u?.name || 'Unknown')}</strong><span>${escRota(s.start)}-${escRota(s.end)}</span></div>`; }

  function openShiftModal(id='', date='', section=''){
    const r = rotaData();
    const existing = r.shifts.find(s=>s.id===id);
    const s = existing || { id:'', userId:state.users[0]?.id || '', section:section || r.sections[0], date:date || isoDate(new Date()), start:'09:00', end:'17:00', notes:'' };
    document.querySelector('.localRotaModal')?.remove();
    const div = document.createElement('div');
    div.className = 'localRotaModal';
    div.innerHTML = `<div class="localRotaModalCard">
      <button class="localRotaClose" data-rota-close>×</button>
      <h2>${existing?'Edit shift':'Add shift'}</h2>
      <form class="localRotaForm" data-rota-form data-shift-id="${escRota(id)}">
        <label>Staff<select name="userId">${userOptions(s.userId)}</select></label>
        <label>Section<select name="section">${sectionOptions(s.section)}</select></label>
        <label>Date<input name="date" type="date" value="${escRota(s.date)}"></label>
        <label>Start<input name="start" type="time" value="${escRota(s.start)}"></label>
        <label>End<input name="end" type="time" value="${escRota(s.end)}"></label>
        <label class="full">Notes<textarea name="notes">${escRota(s.notes||'')}</textarea></label>
        <div class="localRotaFormActions"><button>Save shift</button>${existing?'<button type="button" class="danger" data-rota-delete>Delete</button>':''}</div>
      </form>
    </div>`;
    document.body.appendChild(div);
    window.scrollTo({top:0,behavior:'auto'});
  }

  function bindRota(){
    appRoot.querySelector('[data-rota-prev]')?.addEventListener('click',()=>setWeek(addDays(currentWeek(),-7)));
    appRoot.querySelector('[data-rota-next]')?.addEventListener('click',()=>setWeek(addDays(currentWeek(),7)));
    appRoot.querySelector('[data-rota-today]')?.addEventListener('click',()=>setWeek(new Date()));
    appRoot.querySelectorAll('[data-rota-add]').forEach(btn=>btn.addEventListener('click',()=>openShiftModal('',btn.dataset.date,btn.dataset.section)));
    appRoot.querySelectorAll('.localShift').forEach(card=>card.addEventListener('click',()=>openShiftModal(card.dataset.shiftId)));
    appRoot.querySelector('[data-rota-copy]')?.addEventListener('click',()=>{ const w=isoDate(currentWeek()); rotaData().copiedWeek = rotaData().shifts.filter(s=>s.date>=w && s.date<=isoDate(addDays(currentWeek(),6))).map(s=>({...s,id:uid()})); save(); });
    appRoot.querySelector('[data-rota-paste]')?.addEventListener('click',()=>{ const r=rotaData(); if(!r.copiedWeek) return; const from=startOfWeek(new Date(r.copiedWeek[0]?.date || isoDate(currentWeek()))); const to=currentWeek(); r.copiedWeek.forEach(s=>{ const offset=Math.round((new Date(s.date+'T12:00:00')-from)/86400000); r.shifts.push({...s,id:uid(),date:isoDate(addDays(to,offset))}); }); save(); render(); });
    appRoot.querySelector('[data-rota-save]')?.addEventListener('click',()=>{ save(); alert('Rota saved'); });
    appRoot.querySelector('[data-rota-template]')?.addEventListener('click',()=>{ rotaData().template = rotaData().shifts.filter(s=>s.date>=isoDate(currentWeek()) && s.date<=isoDate(addDays(currentWeek(),6))).map(s=>({...s,id:uid()})); save(); alert('Week saved as template'); });
  }

  document.addEventListener('click', e=>{ if(e.target.matches('[data-rota-close]')) document.querySelector('.localRotaModal')?.remove(); if(e.target.classList.contains('localRotaModal')) e.target.remove(); });
  document.addEventListener('submit', e=>{
    const form = e.target.closest('[data-rota-form]'); if(!form) return; e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const r = rotaData(); const id = form.dataset.shiftId || uid(); const existing = r.shifts.find(s=>s.id===id);
    const next = { id, userId:data.userId, section:data.section, date:data.date, start:data.start, end:data.end, notes:data.notes||'' };
    if(existing) Object.assign(existing,next); else r.shifts.push(next);
    save(); document.querySelector('.localRotaModal')?.remove(); render();
  });
  document.addEventListener('click', e=>{ if(!e.target.matches('[data-rota-delete]')) return; const form=e.target.closest('[data-rota-form]'); rotaData().shifts = rotaData().shifts.filter(s=>s.id!==form.dataset.shiftId); save(); document.querySelector('.localRotaModal')?.remove(); render(); });

  const previousRender = render;
  render = function renderWithLocalRota(){
    if(route === 'rota'){
      document.body.classList.add('is-rota-route');
      appRoot.innerHTML = rota();
      bind();
      bindRota();
      return;
    }
    document.body.classList.remove('is-rota-route');
    previousRender();
  };

  render();
})();