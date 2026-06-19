// Core Settings prototype for the test-settings-page branch.
// This replaces the temporary stacked prototype files and keeps the branch self-contained.
(function coreSettingsPrototype(){
  if(window.__coreSettingsPrototypeV1) return;
  window.__coreSettingsPrototypeV1 = true;

  var MODAL_CLASS = 'settingsPrototypeModalOpen';
  var ROTA_KEY = 'rotaAppUnifiedV2';
  var NOTIFICATION_RULES_KEY = 'complianceBible.notificationRules.v1';
  var CORE_GROUPS = ['Admin','Supervisor','Staff'];
  var dragState = null;

  var SETTINGS_SECTIONS = [
    {id:'pub', title:'Pub Details', sub:'Business identity, logo and app name.'},
    {id:'users', title:'Users & Permission Groups', sub:'Staff list, profile privacy and permission groups.'},
    {id:'documents', title:'Documents', sub:'Premises and staff document permissions.'},
    {id:'checks', title:'Checks', sub:'Checklist templates, setup and notifications.'},
    {id:'rota', title:'Rota & Time', sub:'Rota access, time records and shift alerts.'},
    {id:'issues', title:'Issues & Inspection', sub:'Issues, inspection access and report export.'},
    {id:'areas', title:'Work Areas', sub:'Shared work areas and rota sections.'},
    {id:'notifications', title:'Notification Rules', sub:'App-wide notification timings.'}
  ];

  var PERMISSION_SECTIONS = [
    {id:'settings', title:'Settings & Pub Details', permissions:[
      ['settings.view','View Settings'],
      ['settings.managePermissionGroups','Manage Permission Groups'],
      ['settings.manageNotificationRules','Manage Notification Rules'],
      ['pub.manage','Manage Pub Details']
    ]},
    {id:'users', title:'Users', permissions:[
      ['users.viewList','View User List'],
      ['users.viewPersonal','View User Personal Details'],
      ['users.viewEmployment','View User Employment Details'],
      ['users.viewTraining','View User Training Details'],
      ['users.manage','Manage Users']
    ]},
    {id:'documents', title:'Documents', permissions:[
      ['premisesDocs.view','View Premises Documents'],
      ['premisesDocs.manage','Manage Premises Documents'],
      ['premisesDocs.notify','Premises Document Notifications'],
      ['staffDocs.viewOwn','View Own Staff Documents'],
      ['staffDocs.viewAll','View All Staff Documents'],
      ['staffDocs.manage','Manage Staff Documents'],
      ['staffDocs.notify','Staff Document Notifications']
    ]},
    {id:'checks', title:'Checks', permissions:[
      ['checks.viewAll','View All Checks'],
      ['checks.manage','Manage Checks'],
      ['checks.notify','Check Notifications']
    ]},
    {id:'rota', title:'Rota & Time', permissions:[
      ['rota.view','View Rota'],
      ['rota.manage','Manage Rota & Time Records'],
      ['time.clockOwn','Clock In/Out'],
      ['rota.notify','Rota Notifications']
    ]},
    {id:'issues', title:'Issues & Inspection', permissions:[
      ['issues.view','View Issues'],
      ['issues.manage','Manage Issues'],
      ['issues.notify','Issue Notifications'],
      ['inspection.view','View Inspection Mode'],
      ['inspection.export','Export Inspection Report']
    ]},
    {id:'areas', title:'Work Areas', permissions:[
      ['workAreas.view','View Work Areas'],
      ['workAreas.manage','Manage Work Areas']
    ]}
  ];

  var DEFAULTS = {
    Admin: true,
    Supervisor: {
      'settings.view':true,'settings.managePermissionGroups':false,'settings.manageNotificationRules':false,'pub.manage':false,
      'users.viewList':true,'users.viewPersonal':false,'users.viewEmployment':true,'users.viewTraining':true,'users.manage':false,
      'premisesDocs.view':true,'premisesDocs.manage':false,'premisesDocs.notify':true,
      'staffDocs.viewOwn':true,'staffDocs.viewAll':true,'staffDocs.manage':false,'staffDocs.notify':true,
      'checks.viewAll':true,'checks.manage':false,'checks.notify':true,
      'rota.view':true,'rota.manage':false,'time.clockOwn':true,'rota.notify':true,
      'issues.view':true,'issues.manage':true,'issues.notify':true,'inspection.view':true,'inspection.export':false,
      'workAreas.view':true,'workAreas.manage':false
    },
    Staff: {
      'settings.view':false,'settings.managePermissionGroups':false,'settings.manageNotificationRules':false,'pub.manage':false,
      'users.viewList':true,'users.viewPersonal':false,'users.viewEmployment':false,'users.viewTraining':false,'users.manage':false,
      'premisesDocs.view':true,'premisesDocs.manage':false,'premisesDocs.notify':false,
      'staffDocs.viewOwn':true,'staffDocs.viewAll':false,'staffDocs.manage':false,'staffDocs.notify':false,
      'checks.viewAll':false,'checks.manage':false,'checks.notify':true,
      'rota.view':true,'rota.manage':false,'time.clockOwn':true,'rota.notify':true,
      'issues.view':false,'issues.manage':false,'issues.notify':false,'inspection.view':false,'inspection.export':false,
      'workAreas.view':true,'workAreas.manage':false
    }
  };

  function html(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cssEscape(value){try{return CSS.escape(String(value));}catch(_){return String(value).replace(/"/g,'\\"');}}
  function readJSON(key,fallback){try{var parsed=JSON.parse(localStorage.getItem(key)||'null');return parsed||fallback;}catch(_){return fallback;}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
  function saveSafe(){try{if(typeof save==='function')save();}catch(_){}}
  function uidSafe(){try{if(typeof uid==='function')return uid();}catch(_){}return 'id_'+Math.random().toString(36).slice(2);}
  function norm(value){return String(value||'').trim().toLowerCase();}
  function namedAdmin(user){var text=String((user&&user.name||'')+' '+(user&&user.nickname||'')+' '+(user&&user.email||'')).toLowerCase();return text.indexOf('chip')>-1||text.indexOf('vicky')>-1||text.indexOf('rihanna')>-1;}
  function allPermissionKeys(){return PERMISSION_SECTIONS.reduce(function(out,section){section.permissions.forEach(function(p){out.push(p[0]);});return out;},[]);}
  function currentGroup(user){return (user&&user.permissionSetId)||(user&&user.role)||'Staff';}
  function currentGroups(){ensureSettingsState();return Object.keys(state.permissionMatrix||{}).sort(function(a,b){var ai=CORE_GROUPS.indexOf(a),bi=CORE_GROUPS.indexOf(b);if(ai>-1||bi>-1)return(ai===-1?99:ai)-(bi===-1?99:bi);return a.localeCompare(b);});}
  function currentAreas(){var out=[];try{if(state.rotaSettings&&Array.isArray(state.rotaSettings.sections))out=out.concat(state.rotaSettings.sections);if(Array.isArray(state.areas))out=out.concat(state.areas);}catch(_){}return Array.from(new Set(out.map(function(v){return String(v||'').trim();}).filter(Boolean)));}

  function ensureSettingsState(){
    state.permissionMatrix=state.permissionMatrix||{};
    CORE_GROUPS.forEach(function(group){state.permissionMatrix[group]=state.permissionMatrix[group]||{};});
    var keys=allPermissionKeys();
    Object.keys(state.permissionMatrix).forEach(function(group){
      var matrix=state.permissionMatrix[group]||{};
      var defaults=DEFAULTS[group];
      keys.forEach(function(key){
        if(typeof matrix[key]==='boolean')return;
        if(defaults===true)matrix[key]=true;
        else if(defaults&&typeof defaults[key]==='boolean')matrix[key]=defaults[key];
        else matrix[key]=false;
      });
      state.permissionMatrix[group]=matrix;
    });
    (state.users||[]).forEach(function(user){
      if(namedAdmin(user)){user.permissionSetId='Admin';user.role='Admin';return;}
      if(!user.permissionSetId)user.permissionSetId=user.role||'Staff';
      if(!state.permissionMatrix[user.permissionSetId])user.permissionSetId='Staff';
      user.role=user.permissionSetId;
    });
    state.pub=state.pub||{};
    state.notificationRules=state.notificationRules||readJSON(NOTIFICATION_RULES_KEY,{premisesExpiryDays:30,staffExpiryDays:30,checkOverdueMinutes:0,shiftReminderMinutes:60,lateShiftMinutes:1,missedClockOutHours:10,longBreakMinutes:45,criticalIssuesAlwaysNotifyAdmin:true});
  }

  window.appPermissionAllows=function(key,user){ensureSettingsState();user=user||((typeof me==='function')?me():null);if(!user)return false;if(namedAdmin(user))return true;var matrix=state.permissionMatrix&&state.permissionMatrix[currentGroup(user)];return !!(matrix&&matrix[key]);};

  function settings(){
    ensureSettingsState();
    return '<section class="coreSettingsPage"><div class="hero card coreSettingsHero"><div><p class="eyebrow">Settings</p><h2>Settings</h2><p>Choose a section to manage app setup and permission groups.</p></div></div><section class="coreSettingsGrid">'+SETTINGS_SECTIONS.map(function(section){return '<button type="button" class="coreSettingsTile" data-core-settings-section="'+html(section.id)+'"><strong>'+html(section.title)+'</strong><span>'+html(section.sub)+'</span></button>';}).join('')+'</section></section>';
  }
  window.settings=settings;

  function sectionHtml(id){
    if(id==='pub')return pubSection();
    if(id==='users')return usersSection();
    if(id==='documents')return documentsSection();
    if(id==='checks')return checksSection();
    if(id==='rota')return rotaSection();
    if(id==='issues')return issuesSection();
    if(id==='areas')return areasSection();
    if(id==='notifications')return notificationsSection();
    return pubSection();
  }

  function pubSection(){var pub=state.pub||{};return '<form id="corePubForm" class="coreSettingsForm"><label><span>Pub name</span><input name="name" value="'+html(pub.name||'')+'"></label><label><span>App display name</span><input name="appDisplayName" value="'+html(pub.appDisplayName||pub.name||'Pub Compliance Hub')+'"></label><label><span>Premises licence</span><input name="licence" value="'+html(pub.licence||'')+'"></label><label><span>DPS</span><input name="dps" value="'+html(pub.dps||'')+'"></label><label class="full"><span>Address</span><textarea name="address">'+html(pub.address||'')+'</textarea></label><label class="full"><span>Logo image</span><input name="logo" type="file" accept="image/*"></label>'+(pub.logoData?'<div class="coreLogoPreview full"><img src="'+pub.logoData+'" alt="Current logo"></div>':'<div class="coreLogoPreview full">No logo uploaded</div>')+'<button class="primary full">Save Pub Details</button></form>';}

  function usersSection(){return '<div class="coreNote">Everyone can see the basic user list. Profile access is split by Personal, Employment and Training tabs.</div><div class="coreUserPreview">'+(state.users||[]).map(function(user){var tabs=[];if(window.appPermissionAllows('users.viewPersonal')||user.id===state.currentUser)tabs.push('Personal');if(window.appPermissionAllows('users.viewEmployment'))tabs.push('Employment');if(window.appPermissionAllows('users.viewTraining'))tabs.push('Training');return '<div class="coreUserRow"><span class="avatarText">'+html(initials(user))+'</span><div><strong>'+html(user.name||user.nickname||'User')+'</strong><em>'+html(user.jobArea||user.area||user.role||'')+'</em></div><small>'+(tabs.length?'Opens: '+tabs.join(', '):'No profile tab access')+'</small></div>';}).join('')+'</div><h3>Permission Groups</h3><div class="corePermissionGroups">'+currentGroups().map(groupCard).join('')+createGroupCard()+'</div>';}
  function initials(user){var name=String((user&&user.name)||(user&&user.nickname)||'U').trim().split(/\s+/);return ((name[0]||'U')[0]||'U')+((name[1]||'')[0]||'');}

  function groupCard(group){var matrix=state.permissionMatrix[group]||{};var users=state.users||[];var isCore=CORE_GROUPS.indexOf(group)>-1;return '<details class="corePermissionCard" '+(group==='Admin'?'open':'')+'><summary><span><strong>'+html(group)+'</strong><em>'+users.filter(function(u){return currentGroup(u)===group;}).length+' users</em></span><b aria-hidden="true"></b></summary><form class="coreGroupForm" data-core-group-form="'+html(group)+'"><label class="full"><span>Group description</span><textarea name="description">'+html(matrix.description||'')+'</textarea></label><section class="coreAssigned"><h4>Who\'s in this group?</h4>'+quickUserControls(group)+userTickList(group)+'</section>'+PERMISSION_SECTIONS.map(function(section){return permissionBlock(section,matrix);}).join('')+'<div class="coreFormActions full"><button class="primary">Save '+html(group)+'</button>'+(isCore?'':'<button type="button" class="secondary danger" data-delete-core-group="'+html(group)+'">Delete Group</button>')+'</div></form></details>';}
  function quickUserControls(group){var areas=currentAreas();return '<div class="coreQuickUsers"><label><input type="checkbox" data-select-all-users><span>All users</span></label><label><span>Add by work area</span><select data-select-area-users><option value="">Select work area</option>'+areas.map(function(area){return '<option value="'+html(area)+'">'+html(area)+'</option>';}).join('')+'</select></label></div>';}
  function userTickList(group){return '<div class="coreUserTicks">'+(state.users||[]).map(function(user){var checked=currentGroup(user)===group;var locked=namedAdmin(user)&&group!=='Admin';return '<label class="coreTick"><input type="checkbox" name="user__'+html(user.id)+'" '+(checked?'checked':'')+' '+(locked?'disabled':'')+'><span><strong>'+html(user.nickname||user.name)+'</strong><em>'+html(user.name||'')+'</em></span></label>';}).join('')+'</div>';}
  function permissionBlock(section,matrix){return '<section class="corePermissionBlock"><h4>'+html(section.title)+'</h4><div class="corePermissionTicks">'+section.permissions.map(function(p){return '<label class="coreTick"><input type="checkbox" name="perm__'+html(p[0])+'" '+(matrix[p[0]]?'checked':'')+'><span><strong>'+html(p[1])+'</strong></span></label>';}).join('')+'</div></section>';}
  function createGroupCard(){return '<details class="corePermissionCard create"><summary><span><strong>Create New Permission Group</strong><em>Copy from an existing group and adjust it.</em></span><b aria-hidden="true"></b></summary><form id="coreCreateGroupForm" class="coreSettingsForm"><label><span>New group name</span><input name="name" required></label><label><span>Copy permissions from</span><select name="copyFrom">'+currentGroups().map(function(group){return '<option>'+html(group)+'</option>';}).join('')+'</select></label><button class="primary full">Create Group</button></form></details>';}

  function summary(keys){return '<div class="coreSummaryGrid">'+keys.map(function(key){return '<span>'+html(labelFor(key))+'</span>';}).join('')+'</div>';}
  function labelFor(key){for(var i=0;i<PERMISSION_SECTIONS.length;i++){var found=PERMISSION_SECTIONS[i].permissions.find(function(p){return p[0]===key;});if(found)return found[1];}return key;}
  function documentsSection(){return '<h3>Premises Documents</h3>'+summary(['premisesDocs.view','premisesDocs.manage','premisesDocs.notify'])+'<h3>Staff Documents</h3>'+summary(['staffDocs.viewOwn','staffDocs.viewAll','staffDocs.manage','staffDocs.notify']);}
  function checksSection(){return '<h3>Check Permissions</h3>'+summary(['checks.viewAll','checks.manage','checks.notify'])+'<h3>Checklist Builder Fields</h3><div class="coreSummaryGrid"><span>Title</span><span>Work area / everyone</span><span>Assigned user / everyone</span><span>Due time</span><span>Daily / Weekly / Monthly / Quarterly / Every 6 Months / Annual</span><span>Check sections</span><span>Photo evidence yes/no</span><span>Signature yes/no</span></div>';}
  function rotaSection(){return '<h3>Rota & Time Permissions</h3>'+summary(['rota.view','rota.manage','time.clockOwn','rota.notify']);}
  function issuesSection(){return '<h3>Issues</h3>'+summary(['issues.view','issues.manage','issues.notify'])+'<h3>Inspection</h3>'+summary(['inspection.view','inspection.export']);}
  function areasSection(){var areas=currentAreas();return '<h3>Work Area Permissions</h3>'+summary(['workAreas.view','workAreas.manage'])+'<form id="coreAreaForm" class="coreInlineForm"><input name="area" placeholder="New work area"><button class="primary">Add Work Area</button></form><div class="coreAreaList">'+areas.map(function(area){return '<div class="coreAreaRow" data-core-area="'+html(area)+'"><button type="button" class="coreDrag" aria-label="Move work area">☰</button><span>'+html(area)+'</span><button type="button" class="secondary danger" data-delete-area="'+html(area)+'">Delete</button></div>';}).join('')+'</div>';}
  function notificationsSection(){var r=state.notificationRules||{};return '<form id="coreNotificationsForm" class="coreSettingsForm">'+numberField('premisesExpiryDays','Premises document expiry warning days',r.premisesExpiryDays)+numberField('staffExpiryDays','Staff document expiry warning days',r.staffExpiryDays)+numberField('checkOverdueMinutes','Check overdue threshold minutes',r.checkOverdueMinutes)+numberField('shiftReminderMinutes','Shift reminder minutes before start',r.shiftReminderMinutes)+numberField('lateShiftMinutes','Late shift threshold minutes',r.lateShiftMinutes)+numberField('missedClockOutHours','Missed clock-out threshold hours',r.missedClockOutHours)+numberField('longBreakMinutes','Long break alert minutes',r.longBreakMinutes)+'<label class="coreTick full"><input type="checkbox" name="criticalIssuesAlwaysNotifyAdmin" '+(r.criticalIssuesAlwaysNotifyAdmin?'checked':'')+'><span><strong>Critical issues always notify Admin</strong></span></label><button class="primary full">Save Notification Rules</button></form>';}
  function numberField(name,label,value){return '<label><span>'+html(label)+'</span><input type="number" min="0" name="'+html(name)+'" value="'+html(value==null?0:value)+'"></label>';}

  function openSectionModal(id){ensureSettingsState();var title=(SETTINGS_SECTIONS.find(function(s){return s.id===id;})||{}).title||'Settings';modalRoot=document.getElementById('modal');if(!modalRoot)return;modalRoot.innerHTML='<div class="modalCard coreSettingsModalCard"><div class="coreModalHandle"><h2>'+html(title)+'</h2><button type="button" class="close" data-close-core-settings>×</button></div><div class="coreModalBody">'+sectionHtml(id)+'</div></div>';modalRoot.classList.remove('hidden');modalRoot.classList.add(MODAL_CLASS);document.body.classList.add('settings-modal-open');bindModalContents();}
  function closeSectionModal(){modalRoot=document.getElementById('modal');if(!modalRoot)return;modalRoot.classList.add('hidden');modalRoot.classList.remove(MODAL_CLASS);document.body.classList.remove('settings-modal-open');modalRoot.innerHTML='';}

  function bindModalContents(){
    var close=document.querySelector('[data-close-core-settings]');if(close)close.onclick=closeSectionModal;
    var pub=document.getElementById('corePubForm');if(pub)pub.onsubmit=savePub;
    document.querySelectorAll('[data-core-group-form]').forEach(function(form){form.onsubmit=function(event){saveGroup(event,form);};bindGroupQuickControls(form);});
    var create=document.getElementById('coreCreateGroupForm');if(create)create.onsubmit=createGroup;
    document.querySelectorAll('[data-delete-core-group]').forEach(function(btn){btn.onclick=function(){deleteGroup(btn.dataset.deleteCoreGroup);};});
    var area=document.getElementById('coreAreaForm');if(area)area.onsubmit=addArea;
    document.querySelectorAll('[data-delete-area]').forEach(function(btn){btn.onclick=function(){deleteArea(btn.dataset.deleteArea);};});
    bindAreaDrag();
    var notify=document.getElementById('coreNotificationsForm');if(notify)notify.onsubmit=saveNotifications;
    bindModalDrag();
  }

  function savePub(event){event.preventDefault();var form=event.currentTarget;var data=new FormData(form);state.pub=state.pub||{};['name','appDisplayName','licence','dps','address'].forEach(function(key){state.pub[key]=String(data.get(key)||'').trim();});var file=form.elements.logo&&form.elements.logo.files&&form.elements.logo.files[0];if(file){var reader=new FileReader();reader.onload=function(){state.pub.logoData=reader.result||'';saveSafe();applyBranding();openSectionModal('pub');};reader.readAsDataURL(file);}else{saveSafe();applyBranding();openSectionModal('pub');}}
  function saveGroup(event,form){event.preventDefault();var group=form.dataset.coreGroupForm;var matrix=state.permissionMatrix[group]||{};matrix.description=form.elements.description?form.elements.description.value:'';allPermissionKeys().forEach(function(key){var input=form.querySelector('[name="perm__'+cssEscape(key)+'"]');matrix[key]=!!(input&&input.checked);});state.permissionMatrix[group]=matrix;(state.users||[]).forEach(function(user){if(namedAdmin(user)){user.permissionSetId='Admin';user.role='Admin';return;}var input=form.querySelector('[name="user__'+cssEscape(user.id)+'"]');if(input&&input.checked){user.permissionSetId=group;user.role=group;}else if(currentGroup(user)===group){user.permissionSetId='Staff';user.role='Staff';}});saveSafe();openSectionModal('users');}
  function bindGroupQuickControls(form){var all=form.querySelector('[data-select-all-users]');if(all)all.onchange=function(){form.querySelectorAll('.coreUserTicks input[type="checkbox"]:not(:disabled)').forEach(function(i){i.checked=all.checked;});};var picker=form.querySelector('[data-select-area-users]');if(picker)picker.onchange=function(){var area=norm(picker.value);if(!area)return;(state.users||[]).forEach(function(user){if(norm(user.jobArea||user.area||'')!==area)return;var input=form.querySelector('[name="user__'+cssEscape(user.id)+'"]');if(input&&!input.disabled)input.checked=true;});picker.value='';};}
  function createGroup(event){event.preventDefault();var form=event.currentTarget;var name=String(form.elements.name.value||'').trim();var copy=String(form.elements.copyFrom.value||'Staff').trim();if(!name||state.permissionMatrix[name])return;state.permissionMatrix[name]=Object.assign({},state.permissionMatrix[copy]||state.permissionMatrix.Staff||{});state.permissionMatrix[name].description='Custom permission group';saveSafe();openSectionModal('users');}
  function deleteGroup(group){if(CORE_GROUPS.indexOf(group)>-1)return;if(!confirm('Delete permission group "'+group+'"? Users in this group will move to Staff.'))return;(state.users||[]).forEach(function(user){if(currentGroup(user)===group){user.permissionSetId='Staff';user.role='Staff';}});delete state.permissionMatrix[group];saveSafe();openSectionModal('users');}
  function addArea(event){event.preventDefault();var name=String(new FormData(event.currentTarget).get('area')||'').trim();if(!name)return;var areas=currentAreas();if(!areas.some(function(a){return norm(a)===norm(name);}))areas.push(name);saveAreas(areas);openSectionModal('areas');}
  function deleteArea(area){if(!confirm('Delete work area "'+area+'"?'))return;saveAreas(currentAreas().filter(function(a){return norm(a)!==norm(area);}));openSectionModal('areas');}
  function saveAreas(areas){state.areas=areas.slice();state.rotaSettings=state.rotaSettings||{sections:[]};state.rotaSettings.sections=areas.slice();var rota=readJSON(ROTA_KEY,{});rota.sections=areas.slice();writeJSON(ROTA_KEY,rota);saveSafe();}
  function saveNotifications(event){event.preventDefault();var data=new FormData(event.currentTarget);var rules={};['premisesExpiryDays','staffExpiryDays','checkOverdueMinutes','shiftReminderMinutes','lateShiftMinutes','missedClockOutHours','longBreakMinutes'].forEach(function(k){rules[k]=Number(data.get(k)||0);});rules.criticalIssuesAlwaysNotifyAdmin=!!data.get('criticalIssuesAlwaysNotifyAdmin');state.notificationRules=rules;writeJSON(NOTIFICATION_RULES_KEY,rules);saveSafe();openSectionModal('notifications');}

  function bindAreaDrag(){document.querySelectorAll('.coreAreaRow .coreDrag').forEach(function(handle){handle.onpointerdown=function(event){var row=handle.closest('.coreAreaRow');var list=row&&row.parentElement;if(!row||!list)return;event.preventDefault();row.classList.add('dragging');var onMove=function(e){e.preventDefault();var target=document.elementFromPoint(e.clientX,e.clientY);target=target&&target.closest&&target.closest('.coreAreaRow');if(!target||target===row||target.parentElement!==list)return;var rect=target.getBoundingClientRect();list.insertBefore(row,e.clientY>rect.top+rect.height/2?target.nextSibling:target);};var finish=function(){row.classList.remove('dragging');var order=Array.from(list.querySelectorAll('.coreAreaRow')).map(function(r){return r.dataset.coreArea;}).filter(Boolean);saveAreas(order);window.removeEventListener('pointermove',onMove,true);window.removeEventListener('pointerup',finish,true);window.removeEventListener('pointercancel',finish,true);};window.addEventListener('pointermove',onMove,true);window.addEventListener('pointerup',finish,true);window.addEventListener('pointercancel',finish,true);};});}
  function bindModalDrag(){var card=document.querySelector('.coreSettingsModalCard');var handle=document.querySelector('.coreModalHandle');if(!card||!handle)return;var sx=0,sy=0,bx=0,by=0;handle.onpointerdown=function(event){if(event.target.closest('button'))return;event.preventDefault();sx=event.clientX;sy=event.clientY;bx=Number(card.dataset.x||0);by=Number(card.dataset.y||0);dragState=true;};handle.onpointermove=function(event){if(!dragState)return;var x=bx+(event.clientX-sx),y=by+(event.clientY-sy);card.dataset.x=String(x);card.dataset.y=String(y);card.style.transform='translate('+x+'px,'+y+'px)';};handle.onpointerup=handle.onpointercancel=function(){dragState=false;};}
  function applyBranding(){var pub=state.pub||{};var title=pub.appDisplayName||pub.name||'Pub Compliance Hub';var topbar=document.querySelector('.topbar');if(!topbar)return;topbar.classList.add('brandedTopbar');var h1=topbar.querySelector('h1');if(h1)h1.textContent=title;var logo=topbar.querySelector('.appHeaderLogo');if(pub.logoData){if(!logo){logo=document.createElement('img');logo.className='appHeaderLogo';logo.alt='App logo';var wrap=topbar.firstElementChild;if(wrap)wrap.insertBefore(logo,wrap.firstChild);}logo.src=pub.logoData;logo.hidden=false;}else if(logo)logo.hidden=true;}
  function removeShiftFullStops(){document.querySelectorAll('body *').forEach(function(el){if(el.childNodes.length===1&&el.firstChild.nodeType===3){el.textContent=el.textContent.replace(/No upcoming shift\./g,'No upcoming shift').replace(/No upcoming shifts\./g,'No upcoming shifts');}});}

  function bindSettingsCore(){document.querySelectorAll('[data-core-settings-section]').forEach(function(button){button.onclick=function(){openSectionModal(button.dataset.coreSettingsSection);};});applyBranding();removeShiftFullStops();}
  if(typeof bind==='function'&&!bind.__coreSettingsPrototypeV1){var oldBind=bind;bind=function(){oldBind();bindSettingsCore();};bind.__coreSettingsPrototypeV1=true;}
  if(typeof render==='function'&&!render.__coreSettingsPrototypeV1){var oldRender=render;render=function(){var result=oldRender();setTimeout(function(){bindSettingsCore();},0);return result;};render.__coreSettingsPrototypeV1=true;}

  var style=document.createElement('style');style.textContent=''
  +'.brandedTopbar>div:first-child{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:center!important;gap:9px!important;min-width:0!important}.appHeaderLogo{width:32px!important;height:32px!important;object-fit:contain!important;border-radius:7px!important;background:rgba(255,255,255,.08)!important}.brandedTopbar h1{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}'
  +'.coreSettingsPage{display:grid!important;gap:14px!important}.coreSettingsGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.coreSettingsTile{min-height:86px!important;padding:12px!important;border-radius:18px!important;text-align:left!important;display:grid!important;align-content:start!important;gap:5px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(208,173,88,.52)!important;color:#fff8ea!important;box-shadow:none!important}.coreSettingsTile strong{color:#fff8ea!important;font-size:15px!important;line-height:1.1!important}.coreSettingsTile span{color:#fff8ea!important;opacity:.88!important;font-size:12px!important;line-height:1.22!important}'
  +'#modal.'+MODAL_CLASS+'{position:fixed!important;inset:calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0!important;z-index:1400!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:14px!important;background:rgba(0,0,0,.68)!important;overflow:hidden!important;box-sizing:border-box!important}#modal.'+MODAL_CLASS+'.hidden{display:none!important}#modal .coreSettingsModalCard{width:min(760px,100%)!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;box-sizing:border-box!important}#modal .coreModalHandle{cursor:grab!important;min-height:58px!important;padding:10px 12px 10px 16px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 40px!important;gap:12px!important;align-items:center!important;background:#151b22!important;border-bottom:1px solid rgba(255,255,255,.09)!important}#modal .coreModalHandle h2{margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#modal .coreModalBody{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:14px!important;display:grid!important;gap:14px!important}'
  +'.coreSettingsForm{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.coreSettingsForm label,.coreSettingsForm .full{grid-column:auto!important}.coreSettingsForm .full{grid-column:1/-1!important}.coreSettingsForm label{display:grid!important;gap:5px!important;padding:0 4px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}.coreSettingsForm input,.coreSettingsForm textarea,.coreSettingsForm select{font-size:16px!important}.coreSettingsForm textarea{min-height:76px!important}.coreLogoPreview{min-height:80px!important;display:grid!important;place-items:center!important;border-radius:16px!important;border:1px dashed rgba(208,173,88,.45)!important;color:#aaa194!important;background:rgba(255,255,255,.035)!important}.coreLogoPreview img{max-width:160px!important;max-height:72px!important;object-fit:contain!important}'
  +'.coreNote{padding:10px 12px!important;border-radius:14px!important;background:rgba(255,255,255,.045)!important;color:#fff8ea!important}.coreUserPreview{display:grid!important;gap:8px!important}.coreUserRow{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:8px!important;border-radius:13px!important;background:rgba(255,255,255,.04)!important}.coreUserRow div{display:grid!important}.coreUserRow em{font-style:normal!important;color:#aaa194!important;font-size:12px!important}.coreUserRow small{color:#d0ad58!important;font-weight:850!important}'
  +'.corePermissionGroups{display:grid!important;gap:10px!important}.corePermissionCard{border-radius:18px!important;border:1px solid rgba(255,255,255,.09)!important;background:rgba(255,255,255,.035)!important;overflow:hidden!important}.corePermissionCard summary{min-height:60px!important;padding:12px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 34px!important;align-items:center!important;gap:10px!important;cursor:pointer!important;list-style:none!important}.corePermissionCard summary::-webkit-details-marker{display:none!important}.corePermissionCard summary span{display:grid!important;gap:3px!important}.corePermissionCard summary strong{color:#fff8ea!important}.corePermissionCard summary em{font-style:normal!important;color:#aaa194!important;font-size:12px!important}.corePermissionCard summary b{width:32px!important;height:32px!important;display:grid!important;place-items:center!important;color:#d0ad58!important}.corePermissionCard summary b:before{content:""!important;width:11px!important;height:11px!important;border-right:4px solid currentColor!important;border-bottom:4px solid currentColor!important;transform:rotate(45deg)!important}.corePermissionCard[open] summary b:before{transform:rotate(225deg)!important}.coreGroupForm{display:grid!important;gap:12px!important;padding:0 12px 12px!important}.coreGroupForm label{padding:0 4px!important}.corePermissionBlock{display:grid!important;gap:8px!important;padding:10px!important;border-radius:16px!important;background:rgba(0,0,0,.18)!important}.corePermissionBlock h4,.coreAssigned h4{margin:0!important;color:#d0ad58!important}.corePermissionTicks,.coreUserTicks{display:grid!important;gap:7px!important}.coreUserTicks{max-height:210px!important;overflow:auto!important}.coreTick{display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;gap:9px!important;align-items:start!important;padding:9px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.07)!important}.coreTick input{width:18px!important;height:18px!important;min-height:18px!important;margin:2px 0 0!important}.coreTick span{display:grid!important;gap:2px!important}.coreTick strong{color:#fff8ea!important;font-size:13px!important}.coreTick em{font-style:normal!important;color:#aaa194!important;font-size:11px!important}.coreQuickUsers{display:grid!important;gap:8px!important;margin:8px 0!important;padding:10px!important;border-radius:14px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important}.coreQuickUsers label{display:grid!important;gap:5px!important;color:#d0ad58!important;font-size:12px!important;font-weight:900!important}.coreFormActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}'
  +'.coreSummaryGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.coreSummaryGrid span{min-height:44px!important;display:grid!important;place-items:center!important;padding:8px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.09)!important;color:#fff8ea!important;font-weight:850!important;text-align:center!important}.coreInlineForm{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important}.coreInlineForm input{font-size:16px!important}.coreAreaList{display:grid!important;gap:8px!important}.coreAreaRow{display:grid!important;grid-template-columns:32px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:10px!important;border-radius:14px!important;background:rgba(255,255,255,.05)!important}.coreDrag{min-width:32px!important;width:32px!important;height:38px!important;padding:0!important;background:transparent!important;color:#d0ad58!important;border:0!important}.coreAreaRow.dragging{opacity:.55!important}.danger{color:#ff6b5d!important}'
  +'#modal.homeActionModalOpen .homeModalListButton{white-space:normal!important;height:auto!important;min-height:74px!important;align-items:start!important}#modal.homeActionModalOpen .homeModalListButton span,#modal.homeActionModalOpen .homeModalListButton small{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.25!important;display:block!important}'
  +'@media(max-width:430px){.coreSettingsGrid,.coreSettingsForm,.coreSummaryGrid{grid-template-columns:1fr!important}.coreFormActions{grid-template-columns:1fr!important}.coreUserRow{grid-template-columns:44px minmax(0,1fr)!important}.coreUserRow small{grid-column:1/-1!important}#modal.'+MODAL_CLASS+'{padding:10px!important}}';document.head.appendChild(style);

  ensureSettingsState();saveSafe();applyBranding();setInterval(removeShiftFullStops,2000);
})();