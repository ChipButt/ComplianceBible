(function(){
  if(window.__settingsCheckButtonsUnified) return;
  window.__settingsCheckButtonsUnified=true;

  function e(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}}

  window.settingsChecks=function(){
    var rows=(state.checks||[]).map(function(c){
      return '<article class="settingsCheckActionRow">'+
        '<div class="settingsCheckMain">'+
          '<strong>'+e(c.title)+'</strong>'+
          '<em>'+e(c.area)+' · '+e(c.freq)+' · Due '+e(c.due||'')+'</em>'+
          '<span>'+e((c.items||[]).length)+' checklist items</span>'+
        '</div>'+
        '<div class="settingsCheckActions">'+
          '<button class="settingsActionButton settingsEditButton" data-edit-check="'+e(c.id)+'">Edit</button>'+
          '<button class="settingsActionButton settingsTestButton" data-complete="'+e(c.id)+'">Test</button>'+
        '</div>'+
      '</article>';
    }).join('');
    return '<h2>Checklist setup</h2>'+
      '<section class="settingsCheckList">'+rows+'</section>'+
      '<details class="settingsAddCheckDetails">'+
        '<summary><span>Add new Check</span></summary>'+
        '<form id="checkForm" class="stack settingsAddCheckBody">'+
          '<input name="title" placeholder="Check title" required>'+
          '<select name="area">'+(state.areas||[]).map(function(a){return '<option>'+e(a)+'</option>';}).join('')+'</select>'+
          '<select name="freq"><option>Daily</option><option>Weekly</option><option>Monthly</option></select>'+
          '<input name="due" type="time" value="12:00" required>'+
          '<textarea name="items" placeholder="One checklist item per line" required></textarea>'+
          '<label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label>'+
          '<button class="primary">Add Check</button>'+
        '</form>'+
      '</details>';
  };
})();
