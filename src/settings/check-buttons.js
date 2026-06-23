(function(){
  if(window.__settingsCheckButtonsUnified) return;
  window.__settingsCheckButtonsUnified=true;

  function e(v){try{return esc(v);}catch(_){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}}
  function cog(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"/><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A8.2 8.2 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"/></svg>';}

  window.settingsChecks=function(){
    var rows=(state.checks||[]).map(function(c){
      return '<article class="settingsCheckActionRow">'+
        '<div class="settingsCheckMain">'+
          '<strong>'+e(c.title)+'</strong>'+
          '<em>'+e(c.area)+' · '+e(c.freq)+' · Due '+e(c.due||'')+'</em>'+
          '<span>'+e((c.items||[]).length)+' checklist items</span>'+
        '</div>'+
        '<div class="settingsCheckActions settingsCheckCogActions">'+
          '<button class="settingsActionButton settingsEditButton settingsCogButton" aria-label="Edit '+e(c.title)+'" data-edit-check="'+e(c.id)+'">'+cog()+'</button>'+
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
          '<select name="freq"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Annual</option><option>Every 6 Months</option></select>'+
          '<input name="due" type="time" value="12:00" required>'+
          '<textarea name="items" placeholder="One checklist item per line" required></textarea>'+
          '<label class="checkline"><input type="checkbox" name="sign"> Requires manager sign-off</label>'+
          '<button class="primary">Add Check</button>'+
        '</form>'+
      '</details>';
  };
})();
