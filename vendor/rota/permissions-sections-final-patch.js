// Final permissions and sections UI patch.
// Rebuilds Permission Sets into list -> open editor -> save flow.
// Adds manageSections permission and confirms section deletion.
(function(){
  const labels = {
    viewPeople:'View people list',
    manageUsers:'Add/edit users and profiles',
    manageRota:'Add/edit shifts and rota',
    manageSections:'Create/delete rota sections',
    viewAllTimesheets:'View all timesheets',
    manageTimesheets:'Manage timesheets',
    viewAllLeave:'View all leave',
    manageLeave:'Approve/edit leave',
    editLeaveBalances:'Edit leave balances',
    viewReports:'View reports',
    managePermissionSets:'Create/edit permission sets',
    viewOwnProfile:'View own profile',
    editOwnPersonal:'Edit own personal details',
    viewOwnShifts:'View own shifts',
    clockIn:'Clock in/out',
    requestLeave:'Request leave',
    viewOwnLeave:'View own leave',
    viewOwnTimesheets:'View own timesheets',
    viewOwnAvailability:'View own availability',
    editOwnAvailability:'Edit own availability'
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeId=name=>'perm_'+String(name||'custom').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')+'_'+Math.random().toString(36).slice(2,6);
  function ensurePermissionShape(){
    state.permissionSets=state.permissionSets||{};
    if(!state.permissionSets.admin){state.permissionSets.admin={id:'admin',name:'Admin',description:'Full access to view and edit everything.',permissions:{}};}
    if(!state.permissionSets.staff){state.permissionSets.staff={id:'staff',name:'Staff',description:'Can manage their own shifts/profile/leave only.',permissions:{}};}
    Object.keys(labels).forEach(key=>{
      if(state.permissionSets.admin.permissions[key]===undefined) state.permissionSets.admin.permissions[key]=true;
      if(state.permissionSets.staff.permissions[key]===undefined) state.permissionSets.staff.permissions[key]=false;
    });
    Object.assign(state.permissionSets.staff.permissions,{
      viewOwnProfile:true,editOwnPersonal:true,viewOwnShifts:true,clockIn:true,requestLeave:true,viewOwnLeave:true,viewOwnTimesheets:true,viewOwnAvailability:true,editOwnAvailability:true,
      viewPeople:false,manageUsers:false,manageRota:false,manageSections:false,managePermissionSets:false
    });
    state.permissionSets.admin.permissions.managePermissionSets=true;
    state.permissionSets.admin.permissions.manageSections=true;
    state.openPermissionSetId=state.openPermissionSetId||null;
    if(typeof save==='function') save();
  }
  function currentPerms(){
    try{let u=state.users.find(x=>x.id===state.currentUserId);return state.permissionSets[u.permissionSetId]?.permissions||{};}catch(e){return {};}
  }
  function hasPerm(key){return !!currentPerms()[key];}
  function setList(){
    ensurePermissionShape();
    const sets=Object.values(state.permissionSets);
    return `<div class="permissionSetsHome"><div class="sectionHeader"><div><h2>Permission sets</h2><p class="muted">Choose a permission set to open and amend it.</p></div><button onclick="createPermissionSetFinal()">+ Create new permission set</button></div><div class="permissionSetList">${sets.map(ps=>{let total=Object.keys(labels).length;let active=Object.values(ps.permissions||{}).filter(Boolean).length;return `<button class="permissionSetListItem" onclick="openPermissionSetFinal('${ps.id}')"><span><strong>${esc(ps.name)}</strong><small>${esc(ps.description||'No description set.')}</small><em>${active} of ${total} permissions enabled</em></span><b>›</b></button>`}).join('')}</div></div>`;
  }
  function editor(ps){
    const isDefault=ps.id==='admin'||ps.id==='staff';
    return `<div class="permissionEditorBubble"><div class="profileTop permissionEditorTop"><button class="roundBtn" onclick="closePermissionSetFinal()">‹</button><h2>${esc(ps.name)}</h2><span></span></div><form onsubmit="savePermissionSetFinal(event,'${ps.id}')" class="permissionEditorForm"><label>Permission set name<input id="permFinalName" value="${esc(ps.name)}" ${ps.id==='admin'?'disabled':''}></label><label>Description<textarea id="permFinalDescription">${esc(ps.description||'')}</textarea></label><div class="permissionBulkActions"><button type="button" class="secondary" onclick="setAllPermissionTicks(true)">Select all</button><button type="button" class="secondary" onclick="setAllPermissionTicks(false)">Deselect all</button></div><div class="permissionTickList">${Object.entries(labels).map(([key,label])=>`<label class="permissionTick"><span>${esc(label)}</span><input class="permissionFinalTick" data-perm="${key}" type="checkbox" ${ps.permissions?.[key]?'checked':''} ${ps.id==='admin'&&key==='managePermissionSets'?'disabled':''}></label>`).join('')}</div><div class="formActions"><button>Save permission set</button><button type="button" class="secondary" onclick="closePermissionSetFinal()">Cancel</button>${!isDefault?`<button type="button" class="danger" onclick="deletePermissionSetFinal('${ps.id}')">Delete permission set</button>`:''}</div></form></div>`;
  }
  window.renderPermissionSets=function(){
    ensurePermissionShape();
    if(!hasPerm('managePermissionSets')) return '<p class="muted">You do not have permission to edit permission sets.</p>';
    if(state.openPermissionSetId&&state.permissionSets[state.openPermissionSetId]) return editor(state.permissionSets[state.openPermissionSetId]);
    return setList();
  };
  window.openPermissionSetFinal=function(id){state.openPermissionSetId=id;if(typeof save==='function')save();if(typeof drawAdmin==='function')drawAdmin();};
  window.closePermissionSetFinal=function(){state.openPermissionSetId=null;if(typeof save==='function')save();if(typeof drawAdmin==='function')drawAdmin();};
  window.setAllPermissionTicks=function(value){document.querySelectorAll('.permissionFinalTick:not(:disabled)').forEach(cb=>cb.checked=value);};
  window.savePermissionSetFinal=function(event,id){
    event.preventDefault();
    ensurePermissionShape();
    const ps=state.permissionSets[id];
    if(!ps) return;
    if(id!=='admin') ps.name=document.getElementById('permFinalName').value.trim()||ps.name;
    ps.description=document.getElementById('permFinalDescription').value.trim();
    document.querySelectorAll('.permissionFinalTick').forEach(cb=>{ps.permissions[cb.dataset.perm]=cb.checked;});
    if(id==='admin') ps.permissions.managePermissionSets=true;
    if(id==='admin') ps.permissions.manageSections=true;
    state.openPermissionSetId=null;
    if(typeof save==='function')save();
    if(typeof drawAdmin==='function')drawAdmin();
  };
  window.createPermissionSetFinal=function(){
    ensurePermissionShape();
    const name=prompt('New permission set name');
    if(!name) return;
    const id=makeId(name);
    state.permissionSets[id]={id,name:name.trim(),description:'Custom permission set.',permissions:JSON.parse(JSON.stringify(state.permissionSets.staff.permissions||{}))};
    state.openPermissionSetId=id;
    if(typeof save==='function')save();
    if(typeof drawAdmin==='function')drawAdmin();
  };
  window.deletePermissionSetFinal=function(id){
    if(id==='admin'||id==='staff') return alert('Default permission sets cannot be deleted.');
    if(state.users.some(u=>u.permissionSetId===id)) return alert('Move users off this permission set before deleting it.');
    if(!confirm('Delete this permission set?')) return;
    delete state.permissionSets[id];
    state.openPermissionSetId=null;
    if(typeof save==='function')save();
    if(typeof drawAdmin==='function')drawAdmin();
  };
  function renderSectionsFinal(){
    ensurePermissionShape();
    if(!hasPerm('manageSections')) return '<h2>Sections</h2><p class="muted">You do not have permission to create or delete sections.</p>';
    return `<h2>Sections</h2><form class="rowForm" onsubmit="addSection(event)"><input id="newSectionName" placeholder="Kitchen, FOH, Office..."><button>Add section</button></form><div class="sectionList">${(state.sections||[]).map(section=>`<div class="sectionRow"><span>${esc(section)}</span><button class="sectionDeleteBtn" aria-label="Delete ${esc(section)}" onclick="removeSection('${esc(section)}')">🗑</button></div>`).join('')}</div>`;
  }
  const previousDrawAdmin=window.drawAdmin||drawAdmin;
  window.drawAdmin=function(){
    previousDrawAdmin();
    const inner=document.getElementById('adminInner');
    if(!inner) return;
    if(state.adminPanel==='permissions') inner.innerHTML=window.renderPermissionSets();
    if(state.adminPanel==='sections') inner.innerHTML=renderSectionsFinal();
  };
  if(typeof drawAdmin!=='undefined') drawAdmin=window.drawAdmin;
  const previousAddSection=window.addSection||addSection;
  window.addSection=function(event){
    if(!hasPerm('manageSections')){ if(event)event.preventDefault(); return alert('You do not have permission to create sections.'); }
    return previousAddSection(event);
  };
  if(typeof addSection!=='undefined') addSection=window.addSection;
  window.removeSection=function(section){
    if(!hasPerm('manageSections')) return alert('You do not have permission to delete sections.');
    if((state.shifts||[]).some(s=>s.section===section)) return alert('Move or delete shifts in this section first.');
    if(!confirm(`You are about to delete the section "${section}". Are you sure?`)) return;
    state.sections=state.sections.filter(s=>s!==section);
    if(typeof save==='function')save();
    if(typeof drawAdmin==='function')drawAdmin();
  };
  ensurePermissionShape();
})();
