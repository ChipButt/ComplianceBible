// Force staff profile Training tab to use the approved Docs-tab document buttons.
(function profileTrainingDocButtonsPatch(){
  if(window.__profileTrainingDocButtonsPatchV1) return;
  window.__profileTrainingDocButtonsPatchV1=true;

  const REQ_KEY='complianceUserDocumentRequirementsV1';
  const openCards={};
  const icon={
    doc:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 15h7M9 18h5"/></svg>',
    upload:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
    camera:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5z"/><path d="M8 3v4M16 3v4M5 10h14"/></svg>'
  };

  function h(value){try{return esc(value);}catch(_){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}}
  function normalise(value){return String(value||'').trim().toLowerCase();}
  function stableReqId(title){return 'req_'+String(title||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
  function readJSON(key,fallback){try{const parsed=JSON.parse(localStorage.getItem(key)||'null');return parsed||fallback;}catch(_){return fallback;}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
  function image(record){return String(record&&record.fileType||'').startsWith('image/')||String(record&&record.fileData||'').startsWith('data:image/');}
  function readFile(file,done){const reader=new FileReader();reader.onload=()=>done(reader.result||'');reader.readAsDataURL(file);}

  function defaultRequirements(){
    const all=['Office','FOH','Kitchen','Housekeeping','KP','Kitchen PotWash','Bar','Staff','Supervisor','Admin'];
    const kitchen=['Kitchen','KP','Kitchen PotWash'];
    return [
      ['New Starter Pay Information',all,'none'],['New Starter Medical Questionnaire',all,'none'],['Piston Club Handbook Declaration',all,'none'],['Fire Safety & Training',all,'none'],['Food Allergy and Intolerance',all,'none'],['Safer Food Better Business Health & Safety Awareness',all,'none'],['Signed Contract',all,'none'],['Working Hours Opt Out',all,'none'],['Kitchen Oil & Fryer Training',kitchen,'none'],['Food Safety & Hygiene Level 2',kitchen,'optional'],['Challenge 25 Training',[],'none'],['COSHH Awareness',[],'none'],['Fire Marshal',[],'optional'],['Food Safety & Hygiene Level 3',[],'optional'],['HACCP',[],'optional'],['First Aid',[],'optional'],['Cellar Management',[],'none']
    ].map(([title,staffGroups,expiryMode])=>({id:stableReqId(title),title,staffGroups,expiryMode}));
  }
  function getRequirements(){
    const saved=readJSON(REQ_KEY,[]);
    const byTitle=new Map((Array.isArray(saved)?saved:[]).map(req=>({...req,id:req.id||stableReqId(req.title),staffGroups:Array.isArray(req.staffGroups)?req.staffGroups:[],expiryMode:req.expiryMode||'optional'})).map(req=>[normalise(req.title),req]));
    defaultRequirements().forEach(req=>{if(!byTitle.has(normalise(req.title)))byTitle.set(normalise(req.title),req);});
    const reqs=Array.from(byTitle.values());writeJSON(REQ_KEY,reqs);return reqs;
  }
  function userKeys(user){return new Set([user.jobArea,user.area,user.role,user.permissionSetId,'Staff','All staff'].map(normalise).filter(Boolean));}
  function employmentType(user){return user&&user.employmentType==='Contractor'?'Contractor':'Employee';}
  function applies(req,user){
    if(normalise(req.title)==='signed contract'&&employmentType(user)==='Contractor') return false;
    const groups=Array.isArray(req.staffGroups)?req.staffGroups:[];
    const keys=userKeys(user);
    return groups.some(group=>keys.has(normalise(group))||normalise(group)==='staff'||normalise(group)==='all staff');
  }
  function records(){state.userRequiredDocuments=state.userRequiredDocuments||[];return state.userRequiredDocuments;}
  function recordFor(userId,reqId){let record=records().find(item=>item.userId===userId&&item.requirementId===reqId);if(!record){record={id:uid(),userId,requirementId:reqId};records().push(record);}return record;}
  function linkedReqs(user){
    const reqs=getRequirements();
    const byId=new Map(reqs.filter(req=>applies(req,user)).map(req=>[req.id,req]));
    records().filter(record=>record.userId===user.id&&record.requirementId).forEach(record=>{const req=reqs.find(item=>item.id===record.requirementId);if(req)byId.set(req.id,req);});
    if(employmentType(user)==='Contractor'){const contract=reqs.find(req=>normalise(req.title)==='signed contract');if(contract)byId.set(contract.id,contract);}
    return Array.from(byId.values());
  }
  function confirmed(record){return !!(record&&record.fileData&&(record.noExpiry||record.expiryDate||record.expiry));}
  function status(record,required){if(confirmed(record))return['','complete'];if(record&&record.fileData)return['Uploaded','warn'];return[required?'Required':'Missing','danger'];}
  function expiryText(record){if(record&&record.noExpiry)return'Does not expire';const raw=(record&&(record.expiryDate||record.expiry))||'';if(!raw)return'No expiry set';try{return new Date(raw+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(_){return raw;}}
  function thumb(record){if(!record||!record.fileData)return'<button type="button" class="fdocThumb empty" data-training-doc-thumb="">No document</button>';if(image(record))return'<button type="button" class="fdocThumb" data-training-doc-thumb="'+h(record.id)+'"><img src="'+record.fileData+'" alt="Document preview"></button>';return'<button type="button" class="fdocThumb file" data-training-doc-thumb="'+h(record.id)+'">DOC</button>';}
  function docCard(user,req){
    const required=applies(req,user);
    const record=recordFor(user.id,req.id);
    const s=status(record,required);
    const badge=s[0]?'<span class="fdocBadge '+s[1]+'">'+h(s[0])+'</span>':'<span class="fdocBadge fdocBadgeEmpty" aria-hidden="true"></span>';
    const key=user.id+'|'+req.id;
    const cardKey='userdoc:'+key;
    const expanded=!!openCards[cardKey];
    return '<article class="fdoc '+(expanded?'open':'')+'" data-profile-training-doc="true" data-user-id="'+h(user.id)+'" data-req-id="'+h(req.id)+'">'+
      '<button type="button" class="fdocBar" data-profile-training-toggle="'+h(cardKey)+'">'+
        '<span class="fdocIcon">'+icon.doc+'</span><span class="fdocName"><strong>'+h(req.title)+'</strong><em>'+h((user.nickname||user.name)+' · '+(user.jobArea||user.area||user.role||'Staff'))+'</em></span>'+badge+'<span class="fdocDate">'+h(expiryText(record))+'</span><span class="fdocArrow" aria-hidden="true">⌄</span>'+ 
      '</button><div class="fdocPanel '+(expanded?'':'closed')+'"><p class="fdocInstruction">Upload evidence for '+h(user.nickname||user.name)+' and set expiry status.</p><div class="fdocBody">'+thumb(record)+'<div class="fdocControls"><div class="fdocUploads"><label>'+icon.upload+'<span>Choose File</span><input type="file" data-profile-training-file accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label><label>'+icon.camera+'<span>Take Photo</span><input type="file" data-profile-training-photo accept="image/*" capture="environment"></label></div><div class="fdocMeta"><label class="fdocSwitch"><span class="fdocSwitchText">Does Not<br>Expire</span><input type="checkbox" data-profile-training-noexpiry '+(record.noExpiry?'checked':'')+'><span class="fdocSwitchTrack"></span></label><label class="fdocExpiry"><span class="fdocDateInputWrap">'+icon.calendar+'<span class="fdocExpiryText">Expiry Date</span><input type="date" data-profile-training-expiry value="'+h(record.expiryDate||record.expiry||'')+'" '+(record.noExpiry?'disabled':'')+'></span></label></div></div></div></div></article>';
  }
  function trainingBlock(user,training){
    const reqs=linkedReqs(user);
    const docs=reqs.length?reqs.map(req=>docCard(user,req)).join(''):'<p class="muted">No staff documents linked to this profile.</p>';
    return '<h2>Training & Staff Documents</h2><h3>Staff documents</h3><section class="fdocSection profileTrainingDocSection">'+docs+'</section><h3>Training records</h3>'+(training&&training.length?training.map(t=>'<div class="listItem"><strong>'+h(t.course)+'</strong><p>'+h(t.status)+(t.expiry?' · Expires '+h(t.expiry):'')+'</p><p class="muted">'+h(t.evidence||'')+'</p></div>').join(''):'<p class="muted">No training records.</p>');
  }
  function viewer(record){if(!record||!record.fileData)return;modalRoot.innerHTML='<div class="modalCard evidenceViewerModal"><button class="close" id="fdocClose">×</button><h2>'+h(record.fileName||'Document evidence')+'</h2>'+(image(record)?'<img class="fdocFull" src="'+record.fileData+'" alt="Document preview">':'<div class="fdocFileBig">Document file</div><a class="ghost evidenceOpenLink" href="'+record.fileData+'" download="'+h(record.fileName||'document')+'">Open / Download</a>')+'</div>';modalRoot.classList.remove('hidden');document.getElementById('fdocClose').onclick=()=>modalRoot.classList.add('hidden');}

  if(typeof centralProfileDetail==='function'&&!centralProfileDetail.__profileTrainingDocButtonsPatchV1){
    const oldDetail=centralProfileDetail;
    centralProfileDetail=function profileTrainingDocButtonsDetail(user,section,shifts,training,docs,availabilityText){
      if(section==='training')return trainingBlock(user,training||[]);
      return oldDetail(user,section,shifts,training,docs,availabilityText);
    };
    centralProfileDetail.__profileTrainingDocButtonsPatchV1=true;
  }
  function bindTrainingDocButtons(){
    document.querySelectorAll('[data-profile-training-toggle]').forEach(button=>button.onclick=()=>{const key=button.dataset.profileTrainingToggle;const card=button.closest('.fdoc');const panel=card&&card.querySelector('.fdocPanel');const isOpen=!(card&&card.classList.contains('open'));openCards[key]=isOpen;if(card)card.classList.toggle('open',isOpen);if(panel)panel.classList.toggle('closed',!isOpen);});
    document.querySelectorAll('[data-profile-training-file],[data-profile-training-photo]').forEach(input=>input.onchange=()=>{const card=input.closest('[data-profile-training-doc]');const file=input.files&&input.files[0];if(!card||!file)return;const record=recordFor(card.dataset.userId,card.dataset.reqId);readFile(file,data=>{record.fileData=data;record.fileName=file.name||'Photo';record.fileType=file.type||'image/jpeg';record.uploadedAt=new Date().toISOString();save();const active=document.querySelector('[data-user-modal-section="training"].active');if(active)active.click();else render();});});
    document.querySelectorAll('[data-profile-training-noexpiry]').forEach(input=>input.onchange=()=>{const card=input.closest('[data-profile-training-doc]');if(!card)return;const record=recordFor(card.dataset.userId,card.dataset.reqId);record.noExpiry=input.checked;if(input.checked){record.expiryDate='';record.expiry='';}save();const active=document.querySelector('[data-user-modal-section="training"].active');if(active)active.click();else render();});
    document.querySelectorAll('[data-profile-training-expiry]').forEach(input=>input.onchange=()=>{const card=input.closest('[data-profile-training-doc]');if(!card)return;const record=recordFor(card.dataset.userId,card.dataset.reqId);record.expiryDate=input.value;record.expiry=input.value;record.noExpiry=false;save();const active=document.querySelector('[data-user-modal-section="training"].active');if(active)active.click();else render();});
    document.querySelectorAll('[data-training-doc-thumb]').forEach(button=>button.onclick=event=>{event.stopPropagation();viewer(records().find(record=>record.id===button.dataset.trainingDocThumb));});
  }
  if(typeof bind==='function'&&!bind.__profileTrainingDocButtonsPatchV1){const oldBind=bind;bind=function(){oldBind();bindTrainingDocButtons();};bind.__profileTrainingDocButtonsPatchV1=true;}
})();