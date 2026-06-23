// Payroll, breaks, salary-hours and unscheduled-shift confirmation patch.
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=p=>p+'_'+Math.random().toString(36).slice(2,9);
  const today=()=>new Date().toISOString().slice(0,10);
  const mins=t=>{let [h,m]=String(t||'00:00').split(':').map(Number);return (h||0)*60+(m||0)};
  const timeNow=()=>new Date().toTimeString().slice(0,5);
  const isoNow=()=>new Date().toISOString();
  const plus=(d,n)=>{d=new Date(d);d.setDate(d.getDate()+n);return d};
  const monday=d=>{d=new Date(d);let n=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d};
  const iso=d=>d.toISOString().slice(0,10);
  const dateIn=(d,a,b)=>d>=a&&d<=b;
  const monthStart=()=>{let d=new Date();return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10)};
  const monthEnd=()=>{let d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10)};
  function ensurePayrollDefaults(){
    state.users=(state.users||[]).map(u=>({...u,payType:u.payType||'hourly',salaryWeeklyAmount:Number(u.salaryWeeklyAmount||0),contractedHoursPerWeek:Number(u.contractedHoursPerWeek||37.5),wage:Number(u.wage||0)}));
    state.logs=state.logs||{};
    save();
  }
  function shiftDurationMinutes(s){let start=mins(s.start),end=mins(s.end);if(end<=start)end+=1440;return Math.max(0,end-start);}
  function shiftLog(sid){return state.logs[sid]||{in:null,out:null,breaks:[]};}
  function breakMinutes(sid,paid){let l=shiftLog(sid);return (l.breaks||[]).filter(b=>b.end&&(paid==null||b.paid===paid)).reduce((t,b)=>t+Math.max(0,Math.round((new Date(b.end)-new Date(b.start))/60000)),0);}
  function payableMinutes(s){let l=shiftLog(s.id);let total=l.in&&l.out?Math.max(0,Math.round((new Date(l.out)-new Date(l.in))/60000)):shiftDurationMinutes(s);return Math.max(0,total-breakMinutes(s.id,false));}
  function userCostForShift(user,shift){let hours=payableMinutes(shift)/60;if((user.payType||'hourly')==='salary'){let weekly=Number(user.salaryWeeklyAmount||user.wage||0);let contracted=Number(user.contractedHoursPerWeek||37.5);return contracted>0?weekly*(hours/contracted):0;}return hours*Number(user.wage||0);}
  function shiftsForUserInRange(uid,start,end){return (state.shifts||[]).filter(s=>s.userId===uid&&dateIn(s.date,start,end));}
  function costForUserRange(uid,start,end){let u=state.users.find(x=>x.id===uid);if(!u)return{hours:0,cost:0,unpaid:0,paidBreak:0,shifts:0};let shifts=shiftsForUserInRange(uid,start,end);return shifts.reduce((a,s)=>{a.hours+=payableMinutes(s)/60;a.unpaid+=breakMinutes(s.id,false)/60;a.paidBreak+=breakMinutes(s.id,true)/60;a.cost+=userCostForShift(u,s);a.shifts+=1;return a;},{hours:0,cost:0,unpaid:0,paidBreak:0,shifts:0});}
  function weekHoursForSalaryUser(uid,weekStartDate,ignoreId,proposed){let dates=[0,1,2,3,4,5,6].map(n=>iso(plus(weekStartDate,n)));let shifts=(state.shifts||[]).filter(s=>s.id!==ignoreId&&s.userId===uid&&dates.includes(s.date));if(proposed)shifts.push(proposed);return shifts.reduce((t,s)=>t+shiftDurationMinutes(s)/60,0);}
  function checkSalaryOverHours(shift,ignoreId){let u=state.users.find(x=>x.id===shift.userId);if(!u||(u.payType||'hourly')!=='salary')return true;let contracted=Number(u.contractedHoursPerWeek||0);if(!contracted)return true;let wk=monday(new Date(shift.date+'T12:00:00'));let total=weekHoursForSalaryUser(u.id,wk,ignoreId,shift);if(total>contracted){setTimeout(()=>markOverContractUsers(),0);return confirm(`${u.name} is salaried for ${contracted} contracted hours per week. This rota will assign ${total.toFixed(2)} hours that week. Continue anyway?`);}return true;}
  function markOverContractUsers(){document.querySelectorAll('[data-user-id]').forEach(el=>el.classList.remove('overContractUser'));let wk=typeof weekStart!=='undefined'?weekStart:monday(new Date());state.users.forEach(u=>{if((u.payType||'hourly')!=='salary')return;let total=weekHoursForSalaryUser(u.id,wk,null,null);if(total>Number(u.contractedHoursPerWeek||0)){document.querySelectorAll(`[data-user-id="${u.id}"]`).forEach(el=>el.classList.add('overContractUser'));}});}
  function activeBreakForShift(sid){let l=shiftLog(sid);return (l.breaks||[]).find(b=>!b.end);}
  window.startUnscheduledShift=function(){
    ensurePayrollDefaults();
    if(typeof activeShift==='function'&&activeShift())return alert('You are already clocked in.');
    let section=document.getElementById('unscheduledSection')?.value||state.sections?.[0]||'Unassigned';
    let note=document.getElementById('unscheduledNote')?.value||'Unscheduled shift';
    if(!confirm(`You are about to start an unscheduled shift in ${section}. Confirm start shift?`))return;
    let sid=uid('s'),t=timeNow();
    state.shifts.push({id:sid,userId:state.currentUserId,section,date:today(),start:t,end:t,notes:note,unscheduled:true,publishedAt:null});
    state.logs[sid]={in:isoNow(),out:null,breaks:[]};
    save();
    renderClock();
  };
  if(typeof startUnscheduledShift!=='undefined')startUnscheduledShift=window.startUnscheduledShift;
  window.startBreak=function(sid,paid){let l=shiftLog(sid);if((l.breaks||[]).some(b=>!b.end))return alert('There is already an active break. End that break first.');l.breaks=l.breaks||[];l.breaks.push({id:uid('break'),start:isoNow(),end:null,paid:!!paid});state.logs[sid]=l;save();renderClock();};
  if(typeof startBreak!=='undefined')startBreak=window.startBreak;
  window.endBreak=function(sid){let l=shiftLog(sid);let b=(l.breaks||[]).find(x=>!x.end);if(!b)return alert('No active break to end.');b.end=isoNow();state.logs[sid]=l;save();renderClock();};
  const oldRenderClock=window.renderClock||renderClock;
  window.renderClock=function(){
    oldRenderClock();
    document.querySelectorAll('.workCard').forEach(card=>{
      let html=card.innerHTML;
      let match=html.match(/clockOut\('([^']+)'\)/);
      if(!match)return;
      let sid=match[1],active=activeBreakForShift(sid),unpaid=breakMinutes(sid,false),paid=breakMinutes(sid,true);
      let controls=card.querySelector('.breakControls');
      if(!controls)return;
      if(active){controls.innerHTML=`<button class="secondary" onclick="endBreak('${sid}')">End Break</button>`;}
      let info=document.createElement('p');
      info.className='muted breakSummary';
      info.textContent=`Breaks logged: paid ${paid} min · unpaid ${unpaid} min`;
      card.appendChild(info);
    });
  };
  renderClock=window.renderClock;
  const oldSaveShiftModal=window.saveShiftModal||saveShiftModal;
  window.saveShiftModal=function(e,sid){
    if(e)e.preventDefault();
    let proposed={id:sid||uid('s'),userId:document.getElementById('modalShiftUser')?.value,section:document.getElementById('modalShiftSection')?.value,date:document.getElementById('modalShiftDate')?.value,start:document.getElementById('modalShiftStart')?.value,end:document.getElementById('modalShiftEnd')?.value};
    if(!checkSalaryOverHours(proposed,sid||null))return;
    return oldSaveShiftModal(e,sid);
  };
  saveShiftModal=window.saveShiftModal;
  const oldSaveShift=window.saveShift||saveShift;
  window.saveShift=function(e){
    if(e)e.preventDefault();
    let proposed={id:uid('s'),userId:document.getElementById('shiftUser')?.value,section:document.getElementById('shiftSection')?.value,date:document.getElementById('shiftDate')?.value,start:document.getElementById('shiftStart')?.value,end:document.getElementById('shiftEnd')?.value};
    if(!checkSalaryOverHours(proposed,null))return;
    return oldSaveShift(e);
  };
  saveShift=window.saveShift;
  const oldRenderProfile=window.renderProfile||renderProfile;
  window.renderProfile=function(){oldRenderProfile();try{let u=typeof profileUser==='function'?profileUser():state.users.find(x=>x.id===state.profileUserId);if(!u||!(typeof can==='function'?can('manageUsers'):true))return;if(state.profilePanel&&state.profilePanel!=='home')return;let result=costForUserRange(u.id,monthStart(),monthEnd());let hero=document.querySelector('.profileHero');if(hero&&!document.querySelector('.profileCostCard'))hero.insertAdjacentHTML('afterend',`<div class="profileCostCard"><strong>Month so far</strong><span>${result.hours.toFixed(2)} payable hrs</span><span>£${result.cost.toFixed(2)}</span><small>Unpaid breaks removed: ${result.unpaid.toFixed(2)} hrs</small></div>`);}catch(e){}};
  renderProfile=window.renderProfile;
  const oldRenderProfileEdit=window.renderProfileEdit||renderProfileEdit;
  window.renderProfileEdit=function(){oldRenderProfileEdit();let u=typeof profileUser==='function'?profileUser():null;if(!u)return;let employment=document.querySelector('.editProfileForm h2.full:nth-of-type(2)');let form=document.querySelector('.editProfileForm');if(form&&!document.getElementById('edit_payType')){let html=`<label>Pay type<select id="edit_payType"><option value="hourly" ${u.payType!=='salary'?'selected':''}>Hourly wage</option><option value="salary" ${u.payType==='salary'?'selected':''}>Salary</option></select></label><label>Weekly salary amount (£)<input id="edit_salaryWeeklyAmount" type="number" step="0.01" value="${Number(u.salaryWeeklyAmount||0)}"></label><label>Contracted hours per week<input id="edit_contractedHoursPerWeek" type="number" step="0.25" value="${Number(u.contractedHoursPerWeek||37.5)}"></label>`;let wage=document.getElementById('edit_wage');if(wage)wage.closest('label').insertAdjacentHTML('afterend',html);}};
  renderProfileEdit=window.renderProfileEdit;
  const oldSaveProfileEdit=window.saveProfileEdit||saveProfileEdit;
  window.saveProfileEdit=function(e){if(e)e.preventDefault();let uid=state.profileUserId;let result=oldSaveProfileEdit(e);let u=state.users.find(x=>x.id===uid);if(u){u.payType=document.getElementById('edit_payType')?.value||u.payType||'hourly';u.salaryWeeklyAmount=Number(document.getElementById('edit_salaryWeeklyAmount')?.value||u.salaryWeeklyAmount||0);u.contractedHoursPerWeek=Number(document.getElementById('edit_contractedHoursPerWeek')?.value||u.contractedHoursPerWeek||37.5);save();}return result;};
  saveProfileEdit=window.saveProfileEdit;
  function usersCostReportHtml(){let start=monthStart(),end=monthEnd();return `<div class="panel costReportPanel"><h2>Staff cost report</h2><div class="costRange"><label>From<input id="costStart" type="date" value="${start}"></label><label>To<input id="costEnd" type="date" value="${end}"></label></div><div class="costUserList">${state.users.map(u=>`<label class="checkLabel"><span>${esc(u.name)}</span><input class="costUser" type="checkbox" value="${u.id}"></label>`).join('')}</div><button onclick="calculateSelectedStaffCosts()">Calculate selected users</button><div id="costResults"></div></div>`;}
  window.calculateSelectedStaffCosts=function(){let start=document.getElementById('costStart').value,end=document.getElementById('costEnd').value,ids=[...document.querySelectorAll('.costUser:checked')].map(x=>x.value);if(!ids.length)return alert('Select at least one user.');let total={hours:0,cost:0,unpaid:0,paidBreak:0,shifts:0};let rows=ids.map(id=>{let u=state.users.find(x=>x.id===id),r=costForUserRange(id,start,end);Object.keys(total).forEach(k=>total[k]+=r[k]);return `<tr><td>${esc(u?.name||'User')}</td><td>${r.shifts}</td><td>${r.hours.toFixed(2)}</td><td>${r.unpaid.toFixed(2)}</td><td>£${r.cost.toFixed(2)}</td></tr>`;}).join('');document.getElementById('costResults').innerHTML=`<div class="tableWrap"><table><tr><th>User</th><th>Shifts</th><th>Payable hrs</th><th>Unpaid break hrs</th><th>Cost</th></tr>${rows}<tr><th>Total</th><th>${total.shifts}</th><th>${total.hours.toFixed(2)}</th><th>${total.unpaid.toFixed(2)}</th><th>£${total.cost.toFixed(2)}</th></tr></table></div>`;};
  const oldDrawAdmin=window.drawAdmin||drawAdmin;
  window.drawAdmin=function(){oldDrawAdmin();if(state.adminPanel==='users'){let inner=document.getElementById('adminInner');if(inner&&!document.querySelector('.costReportPanel'))inner.insertAdjacentHTML('beforeend',usersCostReportHtml());setTimeout(markOverContractUsers,0);}};
  drawAdmin=window.drawAdmin;
  ensurePayrollDefaults();
})();
