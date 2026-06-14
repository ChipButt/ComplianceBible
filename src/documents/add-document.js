(function(){
  if(window.__addPremisesFix) return;
  window.__addPremisesFix=true;
  function enhance(){
    var form=document.getElementById('finalDocAdd');
    if(!form) return;
    var panel=form.closest('.panel');
    if(!panel||panel.dataset.addPremisesFixed) return;
    panel.dataset.addPremisesFixed='1';
    panel.classList.add('addPremisesPanel');
    var title=panel.querySelector('h2');
    if(title) title.remove();
    var details=document.createElement('details');
    details.className='addPremisesDetails';
    var summary=document.createElement('summary');
    summary.innerHTML='<span>Add premises document</span><small>Add a licence, certificate, policy, inspection record or other venue document</small>';
    var body=document.createElement('div');
    body.className='addPremisesBody';
    while(panel.firstChild) body.appendChild(panel.firstChild);
    details.appendChild(summary);
    details.appendChild(body);
    panel.appendChild(details);
  }
  function run(){enhance();}
  if(typeof render==='function'&&!render.__addPremisesFixWrapped){var old=render;render=function(){old();setTimeout(run,0);};render.__addPremisesFixWrapped=true;}
  document.addEventListener('click',function(){setTimeout(run,0);},true);
  document.addEventListener('change',function(){setTimeout(run,0);},true);
  setTimeout(run,0);
})();