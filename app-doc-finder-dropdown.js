(function(){
  if(window.__docFinderDropdown) return;
  window.__docFinderDropdown=true;
  var selected=new Set();
  var labels=['Premises documents','Staff documents','Licensing','Food Safety','Fire Safety','Health & Safety','Staff','Equipment','Allergen Awareness','Food Hygiene','Challenge 25','Right to Work'];
  function key(v){return String(v||'').toLowerCase();}
  function matchesCard(card, value){
    var text=key(card.textContent);
    var v=key(value);
    if(v==='premises documents') return card.dataset.fdocKind==='premises';
    if(v==='staff documents') return card.dataset.fdocKind==='userdoc';
    return text.indexOf(v)!==-1;
  }
  function applyFilter(){
    var vals=Array.from(selected);
    document.querySelectorAll('.fdoc').forEach(function(card){
      var show=!vals.length || vals.some(function(v){return matchesCard(card,v);});
      card.style.display=show?'':'none';
    });
  }
  function build(){
    var host=document.querySelector('.docFinderButtons');
    if(!host||host.dataset.dropdownBuilt) return;
    host.dataset.dropdownBuilt='1';
    host.innerHTML='<details class="docFilterDrop"><summary>Filter document groups</summary><div class="docFilterOptions">'+labels.map(function(label){var safe=label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');return '<label><input type="checkbox" data-doc-group="'+safe+'"> <span>'+safe+'</span></label>';}).join('')+'</div></details>';
    host.querySelectorAll('[data-doc-group]').forEach(function(box){
      box.checked=selected.has(box.dataset.docGroup);
      box.addEventListener('change',function(){
        if(box.checked) selected.add(box.dataset.docGroup); else selected.delete(box.dataset.docGroup);
        applyFilter();
      });
    });
    applyFilter();
  }
  function run(){build();applyFilter();}
  if(typeof render==='function'&&!render.__docFinderDropdownWrapped){var old=render;render=function(){old();setTimeout(run,0);};render.__docFinderDropdownWrapped=true;}
  document.addEventListener('click',function(){setTimeout(run,0);},true);
  document.addEventListener('change',function(){setTimeout(run,0);},true);
  setTimeout(run,0);
})();