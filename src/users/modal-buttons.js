(function(){
  if(window.__userButtonsModalStyle) return;
  window.__userButtonsModalStyle=true;

  var lockedScrollY=0;
  var modalCss=document.createElement('style');
  modalCss.id='user-modal-header-lock-overrides';
  modalCss.textContent='#modal.userInfoModalOpen .userModalCard{padding:0 18px 18px!important;overflow-y:auto!important;overflow-x:hidden!important;max-width:calc(100vw - 24px)!important}#modal.userInfoModalOpen .userModalStickyHeader{position:sticky!important;top:0!important;z-index:30!important;margin:0 -18px 14px!important;padding:18px 18px 10px!important;background:#151b22!important;border-radius:24px 24px 0 0!important;box-shadow:0 10px 18px rgba(0,0,0,.20)!important}#modal.userInfoModalOpen .userModalHeader{display:grid!important;grid-template-columns:64px minmax(0,1fr) 34px 34px!important;align-items:center!important;gap:10px!important;margin:0 0 12px!important}#modal.userInfoModalOpen .userModalHeader h2{margin:0!important;font-size:26px!important;line-height:1.05!important;color:#fff8ea!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#modal.userInfoModalOpen .userModalClose,#modal.userInfoModalOpen .userModalEditCog{position:static!important;display:flex!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;border:1px solid rgba(208,173,88,.56)!important;border-radius:999px!important;background:#071522!important;color:#d0ad58!important;box-shadow:0 8px 18px rgba(0,0,0,.30)!important;font-size:24px!important;line-height:1!important;float:none!important}#modal.userInfoModalOpen .userModalEditCog{color:#d0ad58!important;font-size:0!important;background:#071522!important;box-shadow:0 8px 18px rgba(0,0,0,.30)!important;border:1px solid rgba(208,173,88,.56)!important;border-radius:999px!important}#modal.userInfoModalOpen .userModalEditCog svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}#modal.userInfoModalOpen .userModalTabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important;margin:0!important;padding:0!important;background:transparent!important;position:static!important;overflow:visible!important}#modal.userInfoModalOpen .userModalTabs button{min-height:30px!important;height:30px!important;border-radius:10px!important;font-size:10px!important;line-height:1!important;padding:3px 7px!important;white-space:nowrap!important}#modal.userInfoModalOpen .userModalTabs [data-user-modal-section="shifts"],#modal.userInfoModalOpen .userModalTabs [data-user-modal-section="availability"]{display:none!important}#modal.userInfoModalOpen .userModalFloatingClose{display:none!important}#modal.userInfoModalOpen .userModalEdit{display:none!important}body.user-info-modal-open{overflow:hidden!important;position:fixed!important;width:100%!important;left:0!important;right:0!important;touch-action:none!important}body.user-info-modal-open #modal.userInfoModalOpen{touch-action:auto!important}';
  document.head.appendChild(modalCss);

  function safe(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}}
  function initials(user){try{return userInitials(user.name);}catch(_){var p=String(user.name||user.nickname||'').trim().split(/\s+/);return ((p[0]||'')[0]||'')+((p[1]||'')[0]||'');}}
  function status(user){try{return userStatusLine(user);}catch(_){return user.jobArea||user.area||user.role||'';}}
  function approvedCogIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"/><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A8.2 8.2 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"/></svg>';}
  function lockPageScroll(){
    lockedScrollY=window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0;
    document.body.style.top='-'+lockedScrollY+'px';
    document.body.style.position='fixed';
    document.body.style.width='100%';
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
  }
  function unlockPageScroll(){
    document.body.style.top='';
    document.body.style.position='';
    document.body.style.width='';
    document.body.style.left='';
    document.body.style.right='';
    document.body.style.overflow='';
    document.documentElement.style.overflow='';
    window.scrollTo(0,lockedScrollY||0);
  }
  function readUserContext(user){
    var shifts=[], training=[], docs=[], availabilityText='';
    try{var rs=readRotaState()||{};shifts=(rs.shifts||[]).filter(function(s){return s.userId===user.id;}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));});}catch(_){shifts=[];}
    try{training=(state.training||[]).filter(function(t){return t.userId===user.id;});}catch(_){training=[];}
    try{docs=(state.trainingDocs||[]).filter(function(d){return d.userId===user.id;});}catch(_){docs=[];}
    var a=user.availability||{};
    availabilityText=['mon','tue','wed','thu','fri','sat','sun'].map(function(day){return day.toUpperCase()+': '+(a[day]?'Yes':'No');}).join(' · ');
    return {shifts:shifts,training:training,docs:docs,availabilityText:availabilityText};
  }
  function detail(user,section){
    var ctx=readUserContext(user);
    try{return centralProfileDetail(user,section,ctx.shifts,ctx.training,ctx.docs,ctx.availabilityText);}catch(_){
      return '<h2>Personal details</h2><div class="listItem"><p>Name: '+safe(user.name)+'</p><p>Nickname: '+safe(user.nickname||'')+'</p><p>Role: '+safe(user.role||'')+'</p><p>Area: '+safe(user.jobArea||user.area||'')+'</p><p>Email: '+safe(user.email||'No email')+'</p></div>';
    }
  }
  function closeUserModal(){
    modalRoot.classList.add('hidden');
    modalRoot.classList.remove('userInfoModalOpen');
    document.body.classList.remove('user-info-modal-open');
    modalRoot.innerHTML='';
    unlockPageScroll();
  }
  function openUserModal(id){
    var user=(state.users||[]).find(function(u){return u.id===id;});
    if(!user) return;
    lockPageScroll();
    var editButton=(typeof isAdminUser==='function'&&isAdminUser())?'<button class="userModalEditCog" id="userModalEditCog" type="button" aria-label="Edit Profile" title="Edit Profile">'+approvedCogIcon()+'</button>':'';
    modalRoot.innerHTML='<div class="modalCard userModalCard" role="dialog" aria-modal="true" aria-label="User profile"><div class="userModalStickyHeader"><div class="userModalHeader"><span class="avatarText big">'+safe(initials(user))+'</span><h2>'+safe(user.name||user.nickname)+'</h2>'+editButton+'<button class="close userModalClose" id="closeUserModal" type="button">×</button></div><div class="userModalTabs"><button data-user-modal-section="personal">Personal details</button><button data-user-modal-section="employment">Employment</button><button data-user-modal-section="training">Training</button></div></div><div id="userModalDetail" class="panel userModalDetail">'+detail(user,'personal')+'</div></div>';
    modalRoot.classList.add('userInfoModalOpen');
    modalRoot.classList.remove('hidden');
    document.body.classList.add('user-info-modal-open');
    document.getElementById('closeUserModal').onclick=closeUserModal;
    var edit=document.getElementById('userModalEditCog');
    if(edit)edit.onclick=function(){window.__returnToUserProfileId=user.id;closeUserModal();setTimeout(function(){openUserEditor(user.id);},0);};
    modalRoot.onclick=function(event){if(event.target===modalRoot)closeUserModal();};
    document.querySelectorAll('[data-user-modal-section]').forEach(function(btn){
      btn.onclick=function(){
        document.querySelectorAll('[data-user-modal-section]').forEach(function(b){b.classList.toggle('active',b===btn);});
        var d=document.getElementById('userModalDetail');
        if(d)d.innerHTML=detail(user,btn.getAttribute('data-user-modal-section'));
        if(typeof bind==='function') setTimeout(bind,0);
      };
    });
    var first=document.querySelector('[data-user-modal-section="personal"]');if(first)first.classList.add('active');
  }
  window.openUserProfileModal=openUserModal;

  window.drawCentralPeopleList=function(){
    var input=document.getElementById('centralPeopleSearch');
    var list=document.getElementById('centralPeopleList');
    if(!input||!list) return;
    input.placeholder='Search Staff..';
    document.querySelectorAll('[data-new-user]').forEach(function(button){button.textContent='Add User';button.setAttribute('aria-label','Add User');});
    var query=String(input.value||'').toLowerCase();
    list.innerHTML=(state.users||[]).filter(function(user){return String(user.name||'').toLowerCase().includes(query)||String(user.nickname||'').toLowerCase().includes(query);}).sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));}).map(function(user){
      return '<button class="personRow centralPersonRow userOpenButton" data-central-user-modal="'+safe(user.id)+'"><span class="avatarText">'+safe(initials(user))+'</span><span class="userOpenText"><strong>'+safe(user.name)+'</strong><em>'+safe(status(user))+'</em></span><span class="userRolePill">'+safe(user.role||'User')+'</span></button>';
    }).join('');
    document.querySelectorAll('[data-central-user-modal]').forEach(function(btn){btn.onclick=function(){openUserModal(btn.getAttribute('data-central-user-modal'));};});
  };

  document.addEventListener('click',function(event){
    if(!modalRoot.classList.contains('userInfoModalOpen')) return;
    if(event.target.closest('.bottomNav .navBtn,.mainNav .navBtn,[data-route]')) closeUserModal();
  },true);

  document.addEventListener('touchmove',function(event){
    if(!modalRoot.classList.contains('userInfoModalOpen')) return;
    if(!event.target.closest('.userModalCard')) event.preventDefault();
  },{passive:false});

  if(typeof bind==='function'&&!bind.__userButtonsModalStyle){
    var oldBind=bind;
    bind=function(){oldBind();var search=document.getElementById('centralPeopleSearch');document.querySelectorAll('[data-new-user]').forEach(function(button){button.textContent='Add User';button.setAttribute('aria-label','Add User');});if(search){search.placeholder='Search Staff..';search.oninput=window.drawCentralPeopleList;window.drawCentralPeopleList();}};
    bind.__userButtonsModalStyle=true;
  }
  setTimeout(function(){var search=document.getElementById('centralPeopleSearch');if(search)search.placeholder='Search Staff..';document.querySelectorAll('[data-new-user]').forEach(function(button){button.textContent='Add User';button.setAttribute('aria-label','Add User');});if(document.getElementById('centralPeopleList'))window.drawCentralPeopleList();},0);
})();