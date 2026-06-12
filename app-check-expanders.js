(function(){
  if(window.__checkExpandersConfirmed) return;
  window.__checkExpandersConfirmed=true;
  var openChecks={};
  function e(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}}
  function b(text,kind){try{return badge(text,kind);}catch(_){return '<span class="badge '+(kind||'')+'">'+e(text)+'</span>';}}
  function doneFor(id){try{return done(id);}catch(_){return null;}}
  function overdueFor(c){try{return overdue(c);}catch(_){return false;}}
  function checkItems(c){return (c.items||[]).map(function(it){return '<li>'+e(it)+'</li>';}).join('')||'<li>No checklist items configured.</li>';}
  function checkFields(c){return (c.fields||[]).map(function(f){return '<li><strong>'+e(f.label||f.name)+'</strong>'+(f.required?' <span>Required</span>':'')+'</li>';}).join('');}
  window.checkCard=function(c){
    var d=doneFor(c.id), od=overdueFor(c), expanded=!!openChecks[c.id];
    var status=d?b('Done','ok'):(od?b('Overdue','danger'):b('Due '+(c.due||''),'warn'));
    var fields=checkFields(c);
    return '<article class="fdoc checkExpander '+(d?'done':od?'overdue':'')+'" data-check-card="'+e(c.id)+'">'+
      '<button type="button" class="fdocBar" data-check-expand="'+e(c.id)+'">'+
        '<span class="fdocIcon">✓</span>'+
        '<span class="fdocName"><strong>'+e(c.title)+'</strong><em>'+e(c.area)+' · '+e(c.freq)+(c.sign?' · Manager sign-off':'')+'</em></span>'+
        status+
        '<span class="fdocDate">'+(d?'Completed':('Due '+e(c.due||'')))+'</span>'+
        '<span class="fdocArrow">'+(expanded?'⌃':'⌄')+'</span>'+
      '</button>'+
      '<div class="fdocPanel '+(expanded?'':'closed')+'">'+
        '<div class="checkExpanderBody">'+
          '<p class="fdocInstruction">Open this check to complete the required checklist, fill any specific fields and upload supporting evidence where required.</p>'+
          '<h4>Checklist</h4><ul class="plainList checkItemList">'+checkItems(c)+'</ul>'+
          (fields?'<h4>Required details</h4><ul class="plainList checkFieldList">'+fields+'</ul>':'')+
          (c.requiresEvidence?'<p class="muted evidenceRequired">Photo/file evidence is required for this check.</p>':'')+
          '<button class="primary" data-complete="'+e(c.id)+'">'+(d?'View / redo check':'Complete check')+'</button>'+
        '</div>'+
      '</div>'+
    '</article>';
  };
  window.checks=function(){
    return '<section class="card checksPage"><h2>Checks to complete</h2><p class="muted">This page is for staff completing checks. Checklist setup now lives in Settings.</p><section class="fdocSection checkExpanderSection">'+(state.checks||[]).map(window.checkCard).join('')+'</section></section><section class="card"><h2>Completion history</h2>'+history()+'</section>';
  };
  if(typeof bind==='function'&&!bind.__checkExpandersConfirmed){
    var oldBind=bind;
    bind=function(){
      oldBind();
      document.querySelectorAll('[data-check-expand]').forEach(function(btn){
        btn.onclick=function(ev){ev.preventDefault();ev.stopPropagation();var id=btn.getAttribute('data-check-expand');openChecks[id]=!openChecks[id];render();};
      });
    };
    bind.__checkExpandersConfirmed=true;
  }
  if(typeof render==='function') render();
})();