(function(){
  if(window.__completeSettingsHub) return;
  window.__completeSettingsHub=true;

  function h(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}}
  function id(){try{return uid();}catch(_){return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}}
  function formData(form){return Object.fromEntries(new FormData(form).entries());}

  function ensureSettingsState(){
    state.permissionMatrix=state.permissionMatrix||{
      Admin:{checks:true,documents:true,logs:true,users:true,rota:true,settings:true},
      Supervisor:{checks:true,documents:true,logs:true,users:true,rota:true,settings:true},
      Staff:{checks:true,documents:false,logs:true,users:false,rota:true,settings:false}
    };
    state.staffDocRequirements=state.staffDocRequirements||[
      {id:id(),group:'All staff',title:'Right to Work evidence',requiresExpiry:false,notes:'Required before employment begins.'},
      {id:id(),group:'All staff',title:'Fire Safety Training record',requiresExpiry:true,notes:'Refreshed yearly.'}
    ];
    state.documentCategories=state.documentCategories||['Licensing','Food Safety','Fire Safety','Health & Safety','Staff','Equipment'];
    state.training=state.training||[];
    state.trainingDocs=state.trainingDocs||[];
    state.users=state.users||[];
    state.areas=state.areas||[];
    state.rotaSettings=state.rotaSettings||{sections:['Kitchen','FOH','Office','WFH','Housekeeping','KP']};
    state.rotaSettings.sections=state.rotaSettings.sections||[];
  }

  function actionRow(title,meta,count,actions){return '<article class="settingsActionRow"><div class="settingsActionMain"><strong>'+h(title)+'</strong><em>'+h(meta||'')+'</em>'+(count?'<span>'+h(count)+'</span>':'')+'</div><div class="settingsActionButtons">'+actions+'</div></article>';}

  function pubDetails(){return '<section class="settingsBlock"><h2>Pub details</h2><p class="muted">Core premises information used in reports and inspection mode.</p><form id="pubForm" class="stack settingsForm"><input name="name" value="'+h(state.pub&&state.pub.name)+'" placeholder="Pub name"><input name="licence" value="'+h(state.pub&&state.pub.licence)+'" placeholder="Premises licence"><input name="dps" value="'+h(state.pub&&state.pub.dps)+'" placeholder="DPS"><textarea name="address" placeholder="Address">'+h(state.pub&&state.pub.address)+'</textarea><button class="primary">Save pub details</button></form></section>';}

  function permissions(){var roles=['Admin','Supervisor','Staff'];var areas=['checks','documents','logs','users','rota','settings'];return '<section class="settingsBlock"><h2>Permissions</h2><p class="muted">Control what each user role can access. These are app-level settings for this pub.</p><form id="permissionForm" class="settingsPermissionGrid">'+roles.map(function(role){var p=state.permissionMatrix[role]||{};return '<fieldset><legend>'+h(role)+'</legend>'+areas.map(function(a){return '<label class="settingsTick"><input type="checkbox" name="'+h(role)+'__'+h(a)+'" '+(p[a]?'checked':'')+'> <span>'+h(a.charAt(0).toUpperCase()+a.slice(1))+'</span></label>';}).join('')+'</fieldset>';}).join('')+'<button class="primary">Save permissions</button></form></section>';}

  function userManagement(){
    var courses=['Food Hygiene','Allergen Awareness','Fire Safety','Challenge 25','Manual Handling'];
    var users=(state.users||[]).map(function(u){
      var records=(state.training||[]).filter(function(t){return t.userId===u.id;});
      var docs=(state.trainingDocs||[]).filter(function(d){return d.userId===u.id;});
      return '<article class="settingsUserCard"><div class="cardTop"><div><strong>'+h(u.nickname||u.name)+'</strong><p>'+h(u.name||'')+' · '+h(u.role||'Staff')+' · '+h(u.jobArea||u.area||'')+'</p><small>'+h(u.email||'No email')+'</small></div><button class="secondary settingsSmallButton" data-edit-user="'+h(u.id)+'">Edit</button></div><div class="settingsUserMeta"><span>'+h(records.length)+' training records</span><span>'+h(docs.length)+' document records</span></div></article>';
    }).join('');
    return '<section class="settingsBlock"><h2>User management</h2><p class="muted">Add and edit users here. These profiles are shared by Compliance Bible and the rota.</p><div class="settingsActionList settingsUserList">'+(users||'<p class="muted">No users yet.</p>')+'</div><details class="settingsExpander" open><summary><span>Add new user</span><small>Create a staff, supervisor or admin profile</small></summary><form id="staffForm" class="stack settingsExpanderBody"><input name="name" placeholder="Full name" required><input name="nickname" placeholder="Nickname shown on rota/checks" required><input name="email" type="email" placeholder="Email"><select name="role"><option>Staff</option><option>Supervisor</option><option>Admin</option></select><select name="area">'+(state.areas||[]).map(function(a){return '<option>'+h(a)+'</option>';}).join('')+'</select><button class="primary">Add user</button></form></details><details class="settingsExpander"><summary><span>Add training record</span><small>Attach a training status to any user</small></summary><form id="trainingForm" class="inlineForm settingsInline"><select name="userId">'+(state.users||[]).map(function(u){return '<option value="'+h(u.id)+'">'+h(u.nickname||u.name)+'</option>';}).join('')+'</select><select name="course">'+courses.map(function(c){return '<option>'+h(c)+'</option>';}).join('')+'</select><select name="status"><option>Valid</option><option>Due Soon</option><option>Missing</option></select><input name="expiry" type="date"><input name="evidence" placeholder="Evidence/notes"><button class="primary">Save training</button></form></details></section>';
  }

  function requiredDocs(){var groups=['All staff','Admin','Supervisor','Staff','FOH','Kitchen','Cellar','Housekeeping','KP','Office'];return '<section class="settingsBlock"><h2>Required staff documents</h2><p class="muted">Set which documents are required for staff groups or job areas.</p><div class="settingsActionList">'+(state.staffDocRequirements||[]).map(function(r){return actionRow(r.title,r.group+(r.requiresExpiry?' · expiry required':' · no expiry required'),r.notes||'','<button class="secondary settingsSmallButton" data-delete-staff-doc-req="'+h(r.id)+'">Remove</button>');}).join('')+'</div><details class="settingsExpander"><summary><span>Add required staff document</span><small>Assign a required document to a role or work group</small></summary><form id="staffDocReqForm" class="stack settingsExpanderBody"><select name="group">'+groups.map(function(g){return '<option>'+h(g)+'</option>';}).join('')+'</select><input name="title" placeholder="Document title" required><label class="checkline"><input type="checkbox" name="requiresExpiry"> Requires expiry date</label><textarea name="notes" placeholder="Notes / examples / requirement details"></textarea><button class="primary">Add requirement</button></form></details></section>';}

  function checkSetup(){return '<section class="settingsBlock"><h2>Checklist setup</h2><p class="muted">Edit built-in checks here. Staff see the clean completion version.</p><div class="settingsActionList">'+(state.checks||[]).map(function(c){return actionRow(c.title,(c.area||'')+' · '+(c.freq||'')+' · Due '+(c.due||''),(c.items||[]).length+' checklist items','<button class="secondary settingsSmallButton" data-edit-check="'+h(c.id)+'">Edit</button><button class="primary settingsSmallButton" data-complete="'+h(c.id)+'">Test</button>');}).join('')+'</div>'+addCheckForm()+'</section>';}
  function addCheckForm(){return '<details class="settingsExpander"><summary><span>Add new checklist</span><small>Create a new recurring check for staff to complete</small></summary><form id="checkForm" class="stack settingsExpanderBody"><input name="title" placeholder="Check title" required><select name="area">'+(state.areas||[]).map(function(a){return '<option>'+h(a)+'</option>';}).join('')+'</select><select name="freq"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option></select><input name="due" type="time" value="12:00" required><textarea name="items" placeholder="One checklist item per line" required></textarea><label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label><button class="primary">Add checklist</button></form></details>';}

  function documentSetup(){return '<section class="settingsBlock"><h2>Document categories</h2><p class="muted">Manage the categories used by premises and staff documents.</p><ul class="plainList settingsSimpleList">'+(state.documentCategories||[]).map(function(c){return '<li><span>'+h(c)+'</span></li>';}).join('')+'</ul><form id="documentCategoryForm" class="inlineForm settingsInline"><input name="category" placeholder="New category" required><button class="primary">Add category</button></form></section>'+(typeof documents==='function'?'<section class="settingsBlock"><h2>Premises documents</h2>'+documents()+'</section>':'');}
  function areas(){return '<section class="settingsBlock"><h2>Areas / sections</h2><p class="muted">Used for checks, user profiles and rota sections.</p><ul class="plainList settingsSimpleList">'+(state.areas||[]).map(function(a){return '<li><span>'+h(a)+'</span><button class="secondary settingsSmallButton" data-delete-area="'+h(a)+'">Remove</button></li>';}).join('')+'</ul><form id="areaForm" class="inlineForm settingsInline"><input name="area" placeholder="New area / section" required><button class="primary">Add area</button></form></section>';}
  function rotaSetup(){var sections=((state.rotaSettings||{}).sections)||[];return '<section class="settingsBlock"><h2>Rota setup</h2><p class="muted">Shared setup for rota sections and future rota integration.</p><ul class="plainList settingsSimpleList">'+sections.map(function(s){return '<li><span>'+h(s)+'</span></li>';}).join('')+'</ul><form id="rotaSectionForm" class="inlineForm settingsInline"><input name="section" placeholder="New rota section" required><button class="primary">Add rota section</button></form></section>';}

  window.settings=function(){
    if(typeof isAdminUser==='function'&&!isAdminUser()) return '<section class="card"><h2>Settings unavailable</h2><p>Only admin/supervisor users can change settings.</p></section>';
    ensureSettingsState();
    return '<section class="hero card settingsHero"><div><p class="eyebrow">Admin only</p><h2>Settings</h2><p>All adjustable setup, users and premises information for this pub.</p></div></section><section class="settingsHub">'+pubDetails()+permissions()+userManagement()+requiredDocs()+checkSetup()+documentSetup()+areas()+rotaSetup()+'</section>';
  };

  if(typeof bind==='function'&&!bind.__completeSettingsHub){var old=bind;bind=function(){old();bindCompleteSettings();};bind.__completeSettingsHub=true;}

  function bindCompleteSettings(){
    var pf=document.getElementById('permissionForm');if(pf)pf.onsubmit=function(ev){ev.preventDefault();['Admin','Supervisor','Staff'].forEach(function(role){state.permissionMatrix[role]=state.permissionMatrix[role]||{};['checks','documents','logs','users','rota','settings'].forEach(function(a){var el=pf.elements[role+'__'+a];state.permissionMatrix[role][a]=!!(el&&el.checked);});});save();render();};
    var uf=document.getElementById('staffForm');if(uf)uf.onsubmit=function(ev){ev.preventDefault();var d=formData(uf);state.users=state.users||[];var newUser={id:id(),name:d.name,nickname:d.nickname,email:d.email||'',role:d.role||'Staff',area:d.area||'',jobArea:d.area||''};state.users.push(newUser);if(!state.currentUser)state.currentUser=newUser.id;save();render();};
    var tf=document.getElementById('trainingForm');if(tf)tf.onsubmit=function(ev){ev.preventDefault();var d=formData(tf);if(!d.userId)return;var existing=(state.training||[]).find(function(t){return t.userId===d.userId&&t.course===d.course;});if(existing){Object.assign(existing,d);}else{state.training.push({id:id(),userId:d.userId,course:d.course,status:d.status,expiry:d.expiry||'',evidence:d.evidence||''});}save();render();};
    var sf=document.getElementById('staffDocReqForm');if(sf)sf.onsubmit=function(ev){ev.preventDefault();var d=formData(sf);state.staffDocRequirements=state.staffDocRequirements||[];state.staffDocRequirements.push({id:id(),group:d.group,title:d.title,requiresExpiry:!!sf.elements.requiresExpiry.checked,notes:d.notes||''});save();render();};
    document.querySelectorAll('[data-delete-staff-doc-req]').forEach(function(btn){btn.onclick=function(){state.staffDocRequirements=(state.staffDocRequirements||[]).filter(function(r){return r.id!==btn.getAttribute('data-delete-staff-doc-req');});save();render();};});
    var cf=document.getElementById('documentCategoryForm');if(cf)cf.onsubmit=function(ev){ev.preventDefault();var d=formData(cf);if(d.category&&!(state.documentCategories||[]).includes(d.category)){state.documentCategories.push(d.category);}save();render();};
    var af=document.getElementById('areaForm');if(af)af.onsubmit=function(ev){ev.preventDefault();var d=formData(af);if(d.area&&!(state.areas||[]).includes(d.area)){state.areas.push(d.area);}save();render();};
    document.querySelectorAll('[data-delete-area]').forEach(function(btn){btn.onclick=function(){state.areas=(state.areas||[]).filter(function(a){return a!==btn.getAttribute('data-delete-area');});save();render();};});
    var rf=document.getElementById('rotaSectionForm');if(rf)rf.onsubmit=function(ev){ev.preventDefault();var d=formData(rf);if(d.section){state.rotaSettings=state.rotaSettings||{sections:[]};state.rotaSettings.sections=state.rotaSettings.sections||[];state.rotaSettings.sections.push(d.section);}save();render();};
    var pub=document.getElementById('pubForm');if(pub)pub.onsubmit=function(ev){ev.preventDefault();var d=formData(pub);state.pub=Object.assign({},state.pub||{},d);save();render();};
  }

  setTimeout(function(){ensureSettingsState();try{save();}catch(_){}},0);
})();
