(function(){
  if(window.__pubFireSafetySystem) return;
  window.__pubFireSafetySystem=true;

  var fireDocuments=[
    {cat:'Fire Safety',title:'Fire Safety Booklet / Fire Log Book',notes:'Core fire safety reference pack for this premises.'},
    {cat:'Fire Safety',title:'Fire Safety Training Guidance',notes:'Staff fire safety training guidance. Training should be given at commencement and refreshed yearly.'},
    {cat:'Fire Safety',title:'Fire Drills Guidance',notes:'Guidance for carrying out and recording fire drills.'},
    {cat:'Fire Safety',title:'Fire Escape Route Inspection Guidance',notes:'Daily fire escape route inspection guidance and route requirements.'},
    {cat:'Fire Safety',title:'Emergency Lighting Testing & Maintenance Guidance',notes:'Daily, monthly and annual emergency lighting test guidance.'},
    {cat:'Fire Safety',title:'Fire Alarm Weekly Test Guidance',notes:'Weekly fire alarm test instructions and call point testing guidance.'},
    {cat:'Fire Safety',title:'Fire Extinguisher Register',notes:'Register of fire extinguisher location, type, size and service records.'}
  ];

  var fireChecks=[
    {id:'fire-alarm-weekly',title:'Weekly Fire Alarm Test',area:'Whole Pub',freq:'Weekly',due:'12:00',sign:true,requiresEvidence:true,items:['Test carried out using a manual call point','Alarm sounded correctly','Panel reset after test','Any faults recorded and escalated'],fields:[
      {name:'zone',label:'Zone',type:'text',required:true,placeholder:'e.g. Zone 1 / Bar'},
      {name:'location',label:'Location / call point tested',type:'text',required:true,placeholder:'e.g. Front bar call point'},
      {name:'result',label:'Result / details of faults',type:'textarea',required:true,placeholder:'What happened during the test?'},
      {name:'faultCleared',label:'Fault cleared',type:'select',required:true,options:['No fault found','Yes','No - manager notified']}
    ]},
    {id:'fire-drill',title:'Fire Drill Record',area:'Whole Pub',freq:'Every 6 Months',due:'12:00',sign:true,requiresEvidence:true,items:['Evacuation drill completed','Staff knew allocated duties','Exit routes used in accordance with practised plan','Any issues recorded'],fields:[
      {name:'evacuationTime',label:'Evacuation time',type:'text',required:true,placeholder:'e.g. 3 minutes'},
      {name:'remarks',label:'Remarks',type:'textarea',required:false,placeholder:'Issues, observations or action required'}
    ]},
    {id:'escape-route-daily',title:'Fire Escape Route Inspection',area:'Whole Pub',freq:'Daily',due:'10:00',sign:true,requiresEvidence:true,items:['Routes checked by competent person','Final exits clear and usable','Fire exit signs visible','Security chains removed before public admission if used'],fields:[
      {name:'backDoor',label:'Back Door',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'hotelRoomEntrance',label:'Hotel Room Entrance',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'mainFrontDoor',label:'Main Front Door',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'frontDoorFire',label:'Front Door (fire)',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'frontDoorToilets',label:'Front Door (toilets)',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'bifold',label:'Bifold',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'kitchenDoors',label:'Kitchen Doors',type:'select',required:true,options:['Clear / satisfactory','Defect found','Not applicable']},
      {name:'defectAction',label:'Defect / action taken',type:'textarea',required:false,placeholder:'Record defect and action taken if applicable'}
    ]},
    {id:'emergency-lighting-daily',title:'Emergency Lighting Visual Check',area:'Whole Pub',freq:'Daily',due:'10:00',sign:true,requiresEvidence:true,items:['Charge indicator visually inspected','No obvious defects or damage','Issue recorded if present'],fields:[
      {name:'location',label:'Location / unit checked',type:'text',required:true,placeholder:'e.g. Bar corridor emergency light'},
      {name:'indicator',label:'Charge indicator',type:'select',required:true,options:['On / satisfactory','Off / fault','Not applicable']},
      {name:'comments',label:'Comments',type:'textarea',required:false,placeholder:'Any issue or action required'}
    ]},
    {id:'emergency-lighting-monthly',title:'Emergency Lighting Monthly Test',area:'Whole Pub',freq:'Monthly',due:'12:00',sign:true,requiresEvidence:true,items:['Emergency mode switched on/tested','Lights operated during test','Faults recorded'],fields:[
      {name:'location',label:'Location / unit tested',type:'text',required:true,placeholder:'e.g. Back corridor'},
      {name:'testMethod',label:'Test method',type:'select',required:true,options:['Test switch','Main power simulation','Other']},
      {name:'result',label:'Result',type:'select',required:true,options:['Pass','Pass with action','Fail - manager notified']},
      {name:'comments',label:'Comments / maintenance notes',type:'textarea',required:false,placeholder:'Record maintenance date, fault or action'}
    ]},
    {id:'emergency-lighting-annual',title:'Emergency Lighting Annual 3-Hour Test',area:'Whole Pub',freq:'Annual',due:'12:00',sign:true,requiresEvidence:true,items:['Annual 3-hour discharge test completed','Competent engineer / service record uploaded','Faults recorded and actioned'],fields:[
      {name:'engineer',label:'Competent engineer / company',type:'text',required:true,placeholder:'Engineer or contractor name'},
      {name:'locations',label:'Locations covered',type:'textarea',required:true,placeholder:'List areas/lights included'},
      {name:'result',label:'Result',type:'select',required:true,options:['Pass','Pass with remedial action','Fail - manager notified']},
      {name:'comments',label:'Comments / certificate reference',type:'textarea',required:false,placeholder:'Certificate number, notes or defects'}
    ]},
    {id:'fire-extinguisher-monthly',title:'Fire Extinguisher Visual Check',area:'Whole Pub',freq:'Monthly',due:'12:00',sign:true,requiresEvidence:true,items:['Extinguisher present in correct location','Type and size checked','No obvious damage or missing appliance','Defects/action recorded'],fields:[
      {name:'reference',label:'Extinguisher reference number',type:'text',required:true,placeholder:'e.g. FE-01'},
      {name:'location',label:'Location',type:'text',required:true,placeholder:'e.g. Bar entrance'},
      {name:'typeSize',label:'Type / size',type:'text',required:true,placeholder:'e.g. CO2 2kg'},
      {name:'condition',label:'Condition',type:'select',required:true,options:['Present / satisfactory','Missing','Damaged','Needs service']},
      {name:'defectAction',label:'Defect / action taken',type:'textarea',required:false,placeholder:'Record issue and action'}
    ]},
    {id:'fire-safety-training-review',title:'Fire Safety Training Review',area:'Staff',freq:'Annual',due:'12:00',sign:true,requiresEvidence:true,items:['Staff training records reviewed','New starters identified','Annual refreshers checked','Fire warden/additional duties checked where applicable'],fields:[
      {name:'staffCovered',label:'Staff / groups covered',type:'textarea',required:true,placeholder:'List staff or groups reviewed'},
      {name:'actionRequired',label:'Action required',type:'textarea',required:false,placeholder:'Record missing refreshers, new starters or follow-up'}
    ]}
  ];

  function safeUid(){try{return uid();}catch(e){return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}}
  function saveState(){try{save();}catch(e){}}
  function ensureFireSafetyRecords(){
    state.docs=state.docs||[];state.checks=state.checks||[];
    fireDocuments.forEach(function(doc){
      var exists=state.docs.some(function(d){return String(d.title||'').toLowerCase()===doc.title.toLowerCase();});
      if(!exists) state.docs.push({id:safeUid(),cat:doc.cat,title:doc.title,status:'Missing',expiry:'',notes:doc.notes});
    });
    fireChecks.forEach(function(check){
      var existing=state.checks.find(function(c){return c.id===check.id||String(c.title||'').toLowerCase()===check.title.toLowerCase();});
      if(existing){Object.assign(existing,check);} else state.checks.push(JSON.parse(JSON.stringify(check)));
    });
    saveState();
  }

  function escapeHtml(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function getToday(){try{return today();}catch(e){return new Date().toISOString().slice(0,10);}}
  function currentUserId(){return state.currentUser;}
  function currentUserName(){try{return me().nickname||me().name||'Current user';}catch(e){return 'Current user';}}
  function readEvidence(file,done){if(!file){done(null);return;}if(window.ComplianceFirebase&&typeof window.ComplianceFirebase.uploadFile==='function'){window.ComplianceFirebase.uploadFile(file,{folder:'fire-safety-evidence'}).then(done).catch(function(){done(null);});return;}var r=new FileReader();r.onload=function(){done({fileName:file.name||'Evidence',fileType:file.type||'',fileData:r.result||'',uploadedAt:new Date().toISOString(),storageMode:'local'});};r.readAsDataURL(file);}
  function fieldHtml(f){
    var req=f.required?' required':'';
    var label='<span>'+escapeHtml(f.label)+(f.required?' *':'')+'</span>';
    if(f.type==='textarea') return '<label class="fireField">'+label+'<textarea name="field_'+escapeHtml(f.name)+'" placeholder="'+escapeHtml(f.placeholder||'')+'"'+req+'></textarea></label>';
    if(f.type==='select') return '<label class="fireField">'+label+'<select name="field_'+escapeHtml(f.name)+'"'+req+'><option value="">Select...</option>'+(f.options||[]).map(function(o){return '<option>'+escapeHtml(o)+'</option>';}).join('')+'</select></label>';
    return '<label class="fireField">'+label+'<input name="field_'+escapeHtml(f.name)+'" type="text" placeholder="'+escapeHtml(f.placeholder||'')+'"'+req+'></label>';
  }

  window.openCheck=function(id){
    var c=(state.checks||[]).find(function(x){return x.id===id;});
    if(!c) return;
    var fields=(c.fields||[]).map(fieldHtml).join('');
    var evidenceRequired=c.requiresEvidence?' required':'';
    modalRoot.innerHTML='<div class="modalCard fireCheckModal"><button class="close" id="closeModal">×</button><h2>'+escapeHtml(c.title)+'</h2><p class="muted">'+escapeHtml(c.area)+' · '+escapeHtml(c.freq)+' · Auto logged as '+escapeHtml(currentUserName())+'</p><form id="completeForm" class="stack fireCheckForm"><section class="fireAutoLog"><div><small>Date</small><strong>'+escapeHtml(getToday())+'</strong></div><div><small>Time</small><strong>Auto on submit</strong></div><div><small>Completed by</small><strong>'+escapeHtml(currentUserName())+'</strong></div></section>'+(c.items||[]).map(function(it,i){return '<label class="checkline"><input type="checkbox" name="i'+i+'" required> '+escapeHtml(it)+'</label>';}).join('')+fields+'<label class="fireField"><span>Photo / file evidence'+(c.requiresEvidence?' *':'')+'</span><input name="evidence" type="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg" capture="environment"'+evidenceRequired+'></label><textarea name="notes" placeholder="Extra notes / corrective action / evidence notes"></textarea><button class="primary">Save completed check</button></form></div>';
    modalRoot.classList.remove('hidden');
    document.getElementById('closeModal').onclick=function(){modalRoot.classList.add('hidden');};
    document.getElementById('completeForm').onsubmit=function(e){
      e.preventDefault();
      var form=e.target;
      var data=Object.fromEntries(new FormData(form).entries());
      var fieldValues={};
      (c.fields||[]).forEach(function(f){fieldValues[f.name]=data['field_'+f.name]||'';});
      var file=(form.querySelector('[name=evidence]').files||[])[0];
      readEvidence(file,function(evidence){
        state.done=state.done||[];
        state.done.push({id:safeUid(),checkId:id,title:c.title,userId:currentUserId(),date:getToday(),at:new Date().toISOString(),result:'Completed',notes:data.notes||'',fields:fieldValues,evidence:evidence,items:(c.items||[]).slice()});
        saveState();modalRoot.classList.add('hidden');if(typeof render==='function')render();
      });
    };
  };

  ensureFireSafetyRecords();
})();
