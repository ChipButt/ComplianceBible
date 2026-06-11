// Remove redundant Mark Stored controls now evidence upload is the source of truth.
(function(){
  if(window.__removeMarkStored)return;
  window.__removeMarkStored=true;

  function clean(){
    document.querySelectorAll('[data-doc]').forEach(function(btn){
      var text=(btn.textContent||'').trim().toLowerCase();
      if(text.includes('mark stored')||text.includes('mark missing'))btn.remove();
    });
  }

  if(typeof bind==='function'&&!bind.__removeMarkStored){
    var old=bind;
    bind=function(){old();clean();};
    bind.__removeMarkStored=true;
  }

  document.addEventListener('click',function(){setTimeout(clean,0)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
})();