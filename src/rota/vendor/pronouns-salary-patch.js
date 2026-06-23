// Pronoun dropdown/custom format and annual salary cost calculation patch.
(function(){
  const pronounOptions=['he/him','she/her','they/them','he/they','she/they','Other'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function today(){return new Date().toISOString().slice(0,10)}
  function monthStart(){let d=new Date();return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10)}
  function monthEnd(){let d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10)}
  function daysBetweenInclusive(a,b){return Math.max(1,Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)+1)}
  function mins(t){let [h,m]=String(t||'00:00').split(':').map(Number);return (h||0)*60+(m||0)}
  function shiftDurationMinutes(s){let start=mins(s.start),end=mins(s.end);if(end<=start)end+=1440;return Math.max(0,end-start)}
  function shiftLog(id){return state.logs?.[id]||{in:null,out:null,breaks:[]}}
  function breakMinutes(sid,paid){let l=shiftLog(sid);return (l.breaks||[]).filter(b=>b.end&&(paid==null||b.paid===paid)).reduce((t,b)=>t+Math.max(0,Math.round((new Date(b.end)-new Date(b.start))/60000)),0)}
  function payableMinutes(s){let l=shiftLog(s.id);let total=l.in&&l.out?Math.max(0,Math.round((new Date(l.out)-new Date(l.in))/60000)):shiftDurationMinutes(s);return Math.max(0,total-breakMinutes(s.id,false))}
  function shiftsForUserInRange(uid,start,end){return (state.shifts||[]).filter(s=>s.userId===uid&&s.date>=start&&s.date<=end)}
  function salaryRangeCost(user,start,end){let annual=Number(user.salaryAnnualAmount||user.wage||0);let days=daysBetweenInclusive(start,end);return annual*(days/365)}
  function hourlyRangeCost(user,shifts){return shifts.reduce((t,s)=>t+(payableMinutes(s)/60)*Number(user.wage||0),0)}
  function userCostForRange(user,start,end){let shifts=shiftsForUserInRange(user.id,start,end);let hours=shifts.reduce((t,s)=>t+payableMinutes(s)/60,0);let unpaid=shifts.reduce((t,s)=>t+breakMinutes(s.id,false)/60,0);let paidBreak=shifts.reduce((t,s)=>t+breakMinutes(s.id,true)/60,0);let cost=(user.payType==='salary')?salaryRangeCost(user,start,end):hourlyRangeCost(user,shifts);return{shifts:shifts.length,hours,cost,unpaid,paidBreak};}
  function selectedPronounValue(user){return pronounOptions.includes(user.pronouns)?user.pronouns:(user.pronouns?'Other':'they/them')}
  function pronounHtml(user){let selected=selectedPronounValue(user);return `<label>Pronouns<select id="edit_pronouns_select">${pronounOptions.map(p=>`<option value="${esc(p)}" ${selected===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label><label id="customPronounsWrap" style="${selected==='Other'?'':'display:none'}">Custom pronouns<input id="edit_pronouns_custom" placeholder="text box / text box" value="${selected==='Other'?esc(user.pronouns):''}"></label>`}
  const oldRenderProfileEdit=window.renderProfileEdit||renderProfileEdit;
  window.renderProfileEdit=function(){
    oldRenderProfileEdit();
    let u=typeof profileUser==='function'?profileUser():null;if(!u)return;
    let pronounInput=document.getElementById('edit_pronouns');
    if(pronounInput){
      let label=pronounInput.closest('label');
      label.insertAdjacentHTML('afterend',pronounHtml(u));
      label.remove();
      let sel=document.getElementById('edit_pronouns_select');
      sel.onchange=function(){document.getElementById('customPronounsWrap').style.display=this.value==='Other'?'':'none'};
    }
    let salaryWeekly=document.getElementById('edit_salaryWeeklyAmount');
    if(salaryWeekly){
      let label=salaryWeekly.closest('label');
      label.innerHTML=`Annual salary (£)<input id="edit_salaryAnnualAmount" type="number" step="0.01" value="${Number(u.salaryAnnualAmount||u.wage||0)}">`;
    }
  };
  if(typeof renderProfileEdit!=='undefined')renderProfileEdit=window.renderProfileEdit;
  const oldSaveProfileEdit=window.saveProfileEdit||saveProfileEdit;
  window.saveProfileEdit=function(e){
    if(e)e.preventDefault();
    let uid=state.profileUserId;
    let result=oldSaveProfileEdit(e);
    let u=state.users.find(x=>x.id===uid);if(!u)return result;
    let sel=document.getElementById('edit_pronouns_select');
    if(sel){u.pronouns=sel.value==='Other'?(document.getElementById('edit_pronouns_custom')?.value.trim()||'Other'):sel.value;}
    let annual=document.getElementById('edit_salaryAnnualAmount');
    if(annual){u.salaryAnnualAmount=Number(annual.value||0);if(u.payType==='salary')u.wage=u.salaryAnnualAmount;}
    save();return result;
  };
  if(typeof saveProfileEdit!=='undefined')saveProfileEdit=window.saveProfileEdit;
  function costReportHtml(){let start=monthStart(),end=monthEnd();return `<div class="panel costReportPanel"><h2>Staff cost report</h2><p class="muted">Salary users are calculated from annual salary across the selected date range. Hourly users are calculated from payable shift hours.</p><div class="costRange"><label>From<input id="costStart" type="date" value="${start}"></label><label>To<input id="costEnd" type="date" value="${end}"></label></div><div class="costQuickButtons"><button type="button" class="secondary" onclick="setCostRange('week')">This week</button><button type="button" class="secondary" onclick="setCostRange('month')">This month</button><button type="button" class="secondary" onclick="setCostRange('year')">This year</button></div><div class="costUserList">${state.users.map(u=>`<label class="checkLabel"><span>${esc(u.name)} <small>${u.payType==='salary'?'salary':'hourly'}</small></span><input class="costUser" type="checkbox" value="${u.id}"></label>`).join('')}</div><button onclick="calculateSelectedStaffCosts()">Calculate selected users</button><div id="costResults"></div></div>`}
  window.setCostRange=function(mode){let now=new Date(),start,end;if(mode==='week'){let d=new Date();let n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);start=d.toISOString().slice(0,10);let e=new Date(d);e.setDate(e.getDate()+6);end=e.toISOString().slice(0,10);}else if(mode==='year'){start=new Date(now.getFullYear(),0,1).toISOString().slice(0,10);end=new Date(now.getFullYear(),11,31).toISOString().slice(0,10);}else{start=monthStart();end=monthEnd();}document.getElementById('costStart').value=start;document.getElementById('costEnd').value=end;}
  window.calculateSelectedStaffCosts=function(){let start=document.getElementById('costStart').value,end=document.getElementById('costEnd').value,ids=[...document.querySelectorAll('.costUser:checked')].map(x=>x.value);if(!ids.length)return alert('Select at least one user.');let total={shifts:0,hours:0,cost:0,unpaid:0};let rows=ids.map(id=>{let u=state.users.find(x=>x.id===id),r=userCostForRange(u,start,end);total.shifts+=r.shifts;total.hours+=r.hours;total.cost+=r.cost;total.unpaid+=r.unpaid;return `<tr><td>${esc(u.name)}<br><span class="muted">${u.payType==='salary'?'Annual salary':'Hourly wage'}</span></td><td>${r.shifts}</td><td>${r.hours.toFixed(2)}</td><td>${r.unpaid.toFixed(2)}</td><td>£${r.cost.toFixed(2)}</td></tr>`}).join('');document.getElementById('costResults').innerHTML=`<div class="tableWrap"><table><tr><th>User</th><th>Shifts</th><th>Payable hrs</th><th>Unpaid break hrs</th><th>Cost</th></tr>${rows}<tr><th>Total</th><th>${total.shifts}</th><th>${total.hours.toFixed(2)}</th><th>${total.unpaid.toFixed(2)}</th><th>£${total.cost.toFixed(2)}</th></tr></table></div>`;}
  const oldDrawAdmin=window.drawAdmin||drawAdmin;
  window.drawAdmin=function(){oldDrawAdmin();if(state.adminPanel==='users'){let old=document.querySelector('.costReportPanel');if(old)old.remove();let inner=document.getElementById('adminInner');if(inner)inner.insertAdjacentHTML('beforeend',costReportHtml());}}
  if(typeof drawAdmin!=='undefined')drawAdmin=window.drawAdmin;
  const oldRenderProfile=window.renderProfile||renderProfile;
  window.renderProfile=function(){oldRenderProfile();try{let u=profileUser();let card=document.querySelector('.profileCostCard');if(card){let r=userCostForRange(u,monthStart(),monthEnd());card.innerHTML=`<strong>Month so far</strong><span>${r.hours.toFixed(2)} payable hrs</span><span>£${r.cost.toFixed(2)}</span><small>${u.payType==='salary'?'Annual salary pro-rata for this month':'Hourly wage from payable shifts'} · unpaid breaks removed: ${r.unpaid.toFixed(2)} hrs</small>`;}}catch(e){}}
  if(typeof renderProfile!=='undefined')renderProfile=window.renderProfile;
})();
