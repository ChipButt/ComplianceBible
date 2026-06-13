(function(){
  if(window.__areaCheckGroups) return;
  window.__areaCheckGroups=true;

  var openAreas={};
  var openChecks={};

  function escx(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}}
  function nowDate(){try{return today();}catch(_){return new Date().toISOString().slice(0,10);}}
  function userId(){return state.currentUser||'unknown';}
  function userName(){try{var u=me();return u.nickname||u.name||'Current user';}catch(_){return 'Current user';}}
  function uidx(){try{return uid();}catch(_){return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}}
  function saveSafe(){try{save();}catch(_){}}
  function isDoneToday(id){return (state.done||[]).some(function(d){return d.checkId===id&&d.date===nowDate();});}
  function isTempCheck(c){var t=String(c.title||'').toLowerCase();return /temp|fridge|freezer|hot held|cooked|reheated|cooling|delivery temperature/.test(t);}
  function dueChecks(){return (state.checks||[]).filter(function(c){return !isDoneToday(c.id);});}
  function grouped(list){var g={};list.forEach(function(c){var a=c.area||'General';(g[a]=g[a]||[]).push(c);});return g;}

  function readFile(file){return new Promise(function(resolve){if(!file)return resolve(null);var r=new FileReader();r.onload=function(){resolve({fileName:file.name||'Evidence',fileType:file.type||'',fileData:r.result||'',uploadedAt:new Date().toISOString()});};r.onerror=function(){resolve(null);};r.readAsDataURL(file);});}
  function extractTemp(text){var m=String(text||'').match(/-?\d+(?:\.\d+)?\s*(?:°\s*)?[cC]?/g);if(!m||!m.length)return '';var vals=m.map(function(x){return x.replace(/[^0-9.\-]/g,'');}).filter(Boolean);return vals.length?vals[0]+'°C':'';}
  function autoReadTemp(file,input,status){
    if(!file||!input) return;
    var fromName=extractTemp(file.name||'');
    if(fromName&&!input.value){input.value=fromName;if(status)status.textContent='Temperature read from filename. Check and edit if needed.';}
    if(!window.Tesseract){if(status)status.textContent='Photo uploaded. Enter temperature manually if it has not appeared.';return;}
    if(status)status.textContent='Reading temperature from photo...';
    window.Tesseract.recognize(file,'eng').then(function(res){var temp=extractTemp(res&&res.data&&res.data.text);if(temp){input.value=temp;if(status)status.textContent='Temperature auto-filled. Check and edit if needed.';}else if(status)status.textContent='Could not read temperature. Please type it manually.';}).catch(function(){if(status)status.textContent='Could not read temperature. Please type it manually.';});
  }

  function itemRows(c){
    var temp=isTempCheck(c);
    var items=(c.items&&c.items.length?c.items:['Complete this check']);
    return items.map(function(it,i){return '<div class="checkTaskRow" data-task-row="'+i+'"><label class="checkTaskTick"><input type="checkbox" name="task_'+i+'" required><span>'+escx(it)+'</span></label>'+(temp?'<label class="checkTaskTemp"><span>Temperature</span><input type="text" name="temp_'+i+'" placeholder="e.g. 2°C"></label>':'')+'<label class="checkTaskEvidence"><span>Photo / file proof</span><input type="file" name="evidence_'+i+'" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg" capture="environment" '+(c.requiresEvidence?'required':'')+'></label>'+(temp?'<small class="tempReadStatus" data-temp-status="'+i+'">Upload a photo to try auto-reading the temperature. You can edit it.</small>':'')+'</div>';}).join('');
  }
  function fieldRows(c){return (c.fields||[]).filter(function(f){return !/date|time|person|signature|signed/i.test(f.name+' '+f.label);}).map(function(f){var req=f.required?' required':'';if(f.type==='textarea')return '<label class="checkExtraField"><span>'+escx(f.label)+(f.required?' *':'')+'</span><textarea name="field_'+escx(f.name)+'" placeholder="'+escx(f.placeholder||'')+'"'+req+'></textarea></label>';if(f.type==='select')return '<label class="checkExtraField"><span>'+escx(f.label)+(f.required?' *':'')+'</span><select name="field_'+escx(f.name)+'"'+req+'><option value="">Select...</option>'+(f.options||[]).map(function(o){return '<option>'+escx(o)+'</option>';}).join('')+'</select></label>';return '<label class="checkExtraField"><span>'+escx(f.label)+(f.required?' *':'')+'</span><input type="text" name="field_'+escx(f.name)+'" placeholder="'+escx(f.placeholder||'')+'"'+req+'></label>';}).join('');}

  function checkCard(c){var expanded=!!openChecks[c.id];return '<article class="fdoc areaCheckCard" data-area-check="'+escx(c.id)+'"><button type="button" class="fdocBar" data-toggle-check="'+escx(c.id)+'"><span class="fdocIcon">✓</span><span class="fdocName"><strong>'+escx(c.title)+'</strong><em>'+escx(c.freq||'')+' · Due '+escx(c.due||'')+'</em></span><span class="fdocBadge danger">To do</span><span class="fdocArrow">'+(expanded?'⌃':'⌄')+'</span></button><div class="fdocPanel '+(expanded?'':'closed')+'"><form class="areaCheckForm" data-check-form="'+escx(c.id)+'"><section class="autoLogStrip"><div><small>Date</small><strong>'+escx(nowDate())+'</strong></div><div><small>Time</small><strong>Auto on save</strong></div><div><small>User</small><strong>'+escx(userName())+'</strong></div></section>'+itemRows(c)+fieldRows(c)+'<label class="checkExtraField"><span>Notes / corrective action</span><textarea name="notes" placeholder="Only add notes if something needs recording"></textarea></label><button class="primary saveCheckButton">Save completed check</button></form></div></article>';}

  window.checks=function(){var list=dueChecks();var groups=grouped(list);var keys=Object.keys(groups).sort();var doneCount=(state.done||[]).filter(function(d){return d.date===nowDate();}).length;return '<section class="card checksPage"><h2>Checks to complete</h2><p class="muted">Open an area, complete the check, upload proof, then save. Completed checks disappear until due again.</p><section class="areaGroupList">'+(keys.length?keys.map(function(area){var open=openAreas[area]!==false;return '<details class="areaGroup" '+(open?'open':'')+' data-area-group="'+escx(area)+'"><summary><span>'+escx(area)+'</span><small>'+groups[area].length+' checks to complete</small></summary><div class="areaGroupBody">'+groups[area].map(checkCard).join('')+'</div></details>';}).join(''):'<div class="emptyState">No checks currently due.</div>')+'</section></section><section class="card"><h2>Completed today</h2><p class="muted">'+doneCount+' checks completed today.</p>'+history()+'</section>';};

  function bindAreaGroups(){
    document.querySelectorAll('[data-area-group]').forEach(function(d){d.addEventListener('toggle',function(){openAreas[d.getAttribute('data-area-group')]=d.open;});});
    document.querySelectorAll('[data-toggle-check]').forEach(function(btn){btn.onclick=function(e){e.preventDefault();e.stopPropagation();var id=btn.getAttribute('data-toggle-check');openChecks[id]=!openChecks[id];render();};});
    document.querySelectorAll('[data-check-form]').forEach(function(form){
      form.querySelectorAll('input[type=file]').forEach(function(inp){inp.onchange=function(){var row=inp.closest('.checkTaskRow');var temp=row&&row.querySelector('.checkTaskTemp input');var status=row&&row.querySelector('.tempReadStatus');if(temp)autoReadTemp(inp.files&&inp.files[0],temp,status);};});
      form.onsubmit=function(e){e.preventDefault();var checkId=form.getAttribute('data-check-form');var c=(state.checks||[]).find(function(x){return x.id===checkId;});if(!c)return;var fd=new FormData(form);var tasks=(c.items&&c.items.length?c.items:['Complete this check']);var promises=[];var taskData=tasks.map(function(label,i){var file=(form.querySelector('[name=evidence_'+i+']')||{}).files?.[0];promises.push(readFile(file));return {label:label,checked:!!fd.get('task_'+i),temperature:fd.get('temp_'+i)||'',evidence:null};});Promise.all(promises).then(function(files){files.forEach(function(file,i){taskData[i].evidence=file;});var fieldValues={};(c.fields||[]).forEach(function(f){fieldValues[f.name]=fd.get('field_'+f.name)||'';});state.done=state.done||[];state.done.push({id:uidx(),checkId:checkId,title:c.title,userId:userId(),userName:userName(),date:nowDate(),at:new Date().toISOString(),result:'Completed',notes:fd.get('notes')||'',fields:fieldValues,tasks:taskData});saveSafe();openChecks[checkId]=false;render();});};
    });
  }
  if(typeof bind==='function'&&!bind.__areaCheckGroups){var old=bind;bind=function(){old();bindAreaGroups();};bind.__areaCheckGroups=true;}
  window.openCheck=function(id){openChecks[id]=true;render();setTimeout(function(){var el=document.querySelector('[data-area-check="'+CSS.escape(id)+'"]');if(el)el.scrollIntoView({block:'center'});},50);};
  if(typeof render==='function')setTimeout(function(){render();},0);
})();