// Final top navigation: Schedule, Clock In, People, Admin only. Timesheets lives inside Admin.
(function(){
  shell=function(inner){
    var u=me();
    var set=state.permissionSets[u.permissionSetId]||{name:'Staff'};
    var nav=['<button class="tab '+(state.view==='rota'?'active':'')+'" onclick="setView(\'rota\')">Schedule</button>'];
    if(can('clockIn'))nav.push('<button class="tab '+(state.view==='clock'?'active':'')+'" onclick="setView(\'clock\')">Clock In</button>');
    if(can('viewPeople')||can('manageUsers'))nav.push('<button class="tab '+(state.view==='people'?'active':'')+'" onclick="setView(\'people\')">People</button>');
    if(isAdmin())nav.push('<button class="tab '+(state.view==='admin'?'active':'')+'" onclick="setView(\'admin\')">Admin</button>');
    document.getElementById('app').innerHTML='<header class="topbar"><div><h1>Rota App</h1><p>'+clean(u.name)+' · '+clean(set.name||'Staff')+'</p></div><div class="topActions"><select id="currentUserSelect">'+state.users.map(function(x){return '<option value="'+x.id+'" '+(x.id===state.currentUserId?'selected':'')+'>'+clean(x.nickname||x.name)+' ('+clean((state.permissionSets[x.permissionSetId]||{}).name||'Staff')+')</option>'}).join('')+'</select></div></header><nav class="tabs">'+nav.join('')+'</nav><main>'+inner+'</main>';
    document.getElementById('currentUserSelect').onchange=function(e){state.currentUserId=e.target.value;save();render();};
  };
})();
