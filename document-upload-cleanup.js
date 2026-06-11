// Remove the older duplicate document upload UI so only the evidence card remains.
(function(){
  if(window.__documentUploadCleanup)return;
  window.__documentUploadCleanup=true;

  function cleanup(){
    document.querySelectorAll('.evidenceUploadActions').forEach(function(block){
      block.remove();
    });

    document.querySelectorAll('.evidenceUploadBox').forEach(function(block){
      if(!block.closest('.evidenceCard')) block.remove();
    });

    document.querySelectorAll('.docItem').forEach(function(card){
      var cards=card.querySelectorAll('.evidenceCard');
      if(cards.length>1){
        cards.forEach(function(c,i){if(i<cards.length-1)c.remove();});
      }
    });

    document.querySelectorAll('form[data-user-doc-upload]').forEach(function(form){
      var cards=form.querySelectorAll('.evidenceCard');
      if(cards.length>1){
        cards.forEach(function(c,i){if(i<cards.length-1)c.remove();});
      }
      form.querySelectorAll('input[name="file"]').forEach(function(input){input.remove();});
    });
  }

  if(typeof bind==='function'&&!bind.__documentUploadCleanup){
    var old=bind;
    bind=function(){old();setTimeout(cleanup,0);};
    bind.__documentUploadCleanup=true;
  }

  document.addEventListener('click',function(){setTimeout(cleanup,0);},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanup);else cleanup();
})();