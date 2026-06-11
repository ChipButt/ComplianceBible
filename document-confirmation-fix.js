// Confirmation rules and evidence viewer fixes for document uploads.
(function(){
  if(window.__docConfirmFix)return;window.__docConfirmFix=true;

  function ok(r){return !!(r&&r.fileData&&(r.noExpiry||r.expiryDate||r.expiry));}
  function setStatus(r){if(!r)return;r.status=ok(r)?'Confirmed':r.fileData?'Uploaded':'Missing';}
  function e(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}

  function fixSavedStatuses(){
    try{(state.docs||[]).forEach(setStatus);(state.userRequiredDocuments||[]).forEach(setStatus);save();}catch(err){}
  }

  function relabel(){
    document.querySelectorAll('.evidenceUploadBox label').forEach(function(label){
      var input=label.querySelector('input[type=file]');
      if(!input)return;
      if(/camera/i.test(input.name)||input.hasAttribute('capture'))label.childNodes[0].textContent='Take Photo';
      else label.childNodes[0].textContent='Choose File';
      label.classList.add('evidenceChoiceBtn');
    });
    document.querySelectorAll('label.checkline').forEach(function(label){
      if(label.textContent.toLowerCase().includes('no expiry')){
        label.childNodes.forEach(function(n){if(n.nodeType===3)n.textContent=' Does Not Expire';});
      }
    });
  }

  function findRecordByData(data){
    var all=[];
    try{all=all.concat(state.docs||[],state.userRequiredDocuments||[]);}catch(e){}
    return all.find(function(r){return r.fileData===data;});
  }

  function viewer(record){
    if(!record||!record.fileData)return;
    var isImage=String(record.fileType||'').startsWith('image/')||String(record.fileData).startsWith('data:image/');
    modalRoot.innerHTML='<div class="modalCard evidenceViewerModal"><button class="close" id="closeEvidenceViewer">×</button><h2>'+e(record.fileName||'Uploaded evidence')+'</h2>'+(isImage?'<img class="evidencePreviewImage" src="'+record.fileData+'" alt="Uploaded evidence">':'<p class="muted">This file is stored. Use the button below to open or download it.</p>')+'<a class="ghost evidenceOpenLink" href="'+record.fileData+'" download="'+e(record.fileName||'document')+'">Open / Download file</a></div>';
    modalRoot.classList.remove('hidden');
    document.getElementById('closeEvidenceViewer').onclick=function(){modalRoot.classList.add('hidden')};
  }

  function bindViewButtons(){
    document.querySelectorAll('[data-view-premises-evidence]').forEach(function(btn){
      btn.onclick=function(ev){ev.preventDefault();var doc=(state.docs||[]).find(function(d){return d.id===btn.dataset.viewPremisesEvidence});viewer(doc);};
    });
    document.querySelectorAll('a[href^="data:"]').forEach(function(a){
      if(a.dataset.fixedViewer)return;a.dataset.fixedViewer='1';
      a.onclick=function(ev){var r=findRecordByData(a.getAttribute('href'));if(r){ev.preventDefault();viewer(r);}};
    });
  }

  function guardForms(){
    document.querySelectorAll('form[data-user-doc-upload],#docForm').forEach(function(form){
      if(form.dataset.confirmGuard)return;form.dataset.confirmGuard='1';
      form.addEventListener('submit',function(){setTimeout(function(){fixSavedStatuses();},250);},true);
    });
  }

  function enhance(){fixSavedStatuses();relabel();bindViewButtons();guardForms();}

  var style=document.createElement('style');
  style.textContent='.evidenceUploadBox{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}.evidenceChoiceBtn{display:flex!important;align-items:center!important;justify-content:center!important;min-height:46px!important;border-radius:14px!important;background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.1)!important;color:#fff8ea!important;font-weight:850!important;text-align:center!important}.evidenceChoiceBtn input[type=file]{position:absolute!important;opacity:0!important;width:1px!important;height:1px!important;pointer-events:none!important}.evidenceViewerModal{max-height:88vh!important;overflow:auto!important}.evidencePreviewImage{width:100%!important;height:auto!important;border-radius:18px!important;background:#fff!important}.evidenceOpenLink{display:flex!important;justify-content:center!important;align-items:center!important;margin-top:12px!important;text-decoration:none!important}';
  document.head.appendChild(style);
  if(typeof bind==='function'&&!bind.__docConfirmFix){var old=bind;bind=function(){old();enhance();};bind.__docConfirmFix=true;}
  document.addEventListener('click',function(){setTimeout(enhance,0)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();