// Final replacement flow: show available users and replace the assigned user on a shift.
(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function today(){return new Date().toISOString().slice(0,10)}
  function mins(t){var p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)}
  function overlaps(a,b){if(a.date!==b.date)return false;var as=mins(a.start),ae=mins(a.end),bs=mins(b.start),be=mins(b.end);if(ae<=as)ae+=1440;if(be<=bs)be+=1440;return as<be&&bs<ae}
  function userName(id){var u=(state.users||[]).find(function(x){return x.id===id});return u?u.name:'Unassigned'}
  function availableUsers(shift){return (state.users||[]).filter(function(u){if(u.id===shift.userId)return false;return !(state.shifts||[]).some(function(s){return s.id!==shift.id&&s.userId===u.id&&overlaps(s,shift)})})}
  window.openReplacementModal=function(shiftId){var shift=(state.shifts||[]).find(function(s){return s.id===shiftId});if(!shift)return alert('Shift not found.');var users=availableUsers(shift);document.querySelector('.modalBackdrop')?.remove();var wrap=document.createElement('div');wrap.className='modalBackdrop';wrap.innerHTML='<div class="shiftModal replacementModal"><button class="modalClose" onclick="closeReplacementModal()">×</button><h2>Find Replacement</h2><p class="muted">Replacing '+esc(userName(shift.userId))+' for '+esc(shift.section)+' on '+esc(shift.date)+' from '+esc(shift.start)+'-'+esc(shift.end)+'.</p><div class="replacementList">'+(users.length?users.map(function(u){return '<button class="replacementUserBtn" onclick="replaceShiftUser(\''+shift.id+'\',\''+u.id+'\')"><strong>'+esc(u.name)+'</strong><span>'+esc(u.jobArea||'')+'</span></button>'}).join(''):'<p class="muted">No available replacement users for this shift time.</p>')+'</div></div>';document.body.appendChild(wrap)};
  window.closeReplacementModal=function(){document.querySelector('.modalBackdrop')?.remove()};
  window.replaceShiftUser=function(shiftId,userId){var shift=(state.shifts||[]).find(function(s){return s.id===shiftId});if(!shift)return alert('Shift not found.');shift.previousUserId=shift.userId;shift.userId=userId;shift.replacedAt=new Date().toISOString();shift.updatedSincePublish=true;save();closeReplacementModal();if(typeof render==='function')render()};
  function nextShiftForCurrentProfile(){var uid=state.profileUserId||state.currentUserId;return (state.shifts||[]).filter(function(s){return s.userId===uid&&s.date>=today()}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))||String(a.start).localeCompare(String(b.start))})[0]}
  function wire(){var btn=[].slice.call(document.querySelectorAll('button')).find(function(b){return b.textContent.trim().toLowerCase()==='find replacement'});if(!btn)return;var shift=nextShiftForCurrentProfile();if(!shift){btn.disabled=true;btn.textContent='No shift to replace';return;}btn.onclick=function(){openReplacementModal(shift.id)}}
  var oldProfile=window.renderProfile||renderProfile;
  window.renderProfile=function(){oldProfile();setTimeout(wire,0)};
  try{renderProfile=window.renderProfile}catch(e){}
})();
