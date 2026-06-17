(function(){
  if(window.__userButtonsModalStyle) return;
  window.__userButtonsModalStyle=true;

  function safe(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}}
  function initials(user){try{return userInitials(user.name);}catch(_){var p=String(user.name||user.nickname||'').trim().split(/\s+/);return ((p[0]||'')[0]||'')+((p[1]||'')[0]||'');}}
  function status(user){try{return userStatusLine(user);}catch(_){return user.jobArea||user.area||user.role||'';}}
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
  }
  function openUserModal(id){
    var user=(state.users||[]).find(function(u){return u.id===id;});
    if(!user) return;
    modalRoot.innerHTML='<div class="modalCard userModalCard" role="dialog" aria-modal="true" aria-label="User profile"><div class="userModalStickyHeader"><div class="userModalHeader"><span class="avatarText big">'+safe(initials(user))+'</span><h2>'+safe(user.name||user.nickname)+'</h2><button class="close userModalClose" id="closeUserModal" type="button">×</button></div><div class="userModalTabs"><button data-user-modal-section="personal">Personal</button><button data-user-modal-section="employment">Employment</button><button data-user-modal-section="shifts">Shifts</button><button data-user-modal-section="training">Training</button><button data-user-modal-section="availability">Availability</button></div></div><div id="userModalDetail" class="panel userModalDetail">'+detail(user,'personal')+'</div>'+(typeof isAdminUser==='function'&&isAdminUser()?'<button class="secondary userModalEdit" data-edit-user="'+safe(user.id)+'">Edit Profile</button>':'')+'</div>';
    modalRoot.classList.add('userInfoModalOpen');
    modalRoot.classList.remove('hidden');
    document.body.classList.add('user-info-modal-open');
    document.getElementById('closeUserModal').onclick=closeUserModal;
    modalRoot.onclick=function(event){if(event.target===modalRoot)closeUserModal();};
    document.querySelectorAll('[data-user-modal-section]').forEach(function(btn){
      btn.onclick=function(){
        document.querySelectorAll('[data-user-modal-section]').forEach(function(b){b.classList.toggle('active',b===btn);});
        var d=document.getElementById('userModalDetail');
        if(d)d.innerHTML=detail(user,btn.getAttribute('data-user-modal-section'));
      };
    });
    var first=document.querySelector('[data-user-modal-section="personal"]');if(first)first.classList.add('active');
  }

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

  if(typeof bind==='function'&&!bind.__userButtonsModalStyle){
    var oldBind=bind;
    bind=function(){oldBind();var search=document.getElementById('centralPeopleSearch');document.querySelectorAll('[data-new-user]').forEach(function(button){button.textContent='Add User';button.setAttribute('aria-label','Add User');});if(search){search.placeholder='Search Staff..';search.oninput=window.drawCentralPeopleList;window.drawCentralPeopleList();}};
    bind.__userButtonsModalStyle=true;
  }
  setTimeout(function(){var search=document.getElementById('centralPeopleSearch');if(search)search.placeholder='Search Staff..';document.querySelectorAll('[data-new-user]').forEach(function(button){button.textContent='Add User';button.setAttribute('aria-label','Add User');});if(document.getElementById('centralPeopleList'))window.drawCentralPeopleList();},0);
})();