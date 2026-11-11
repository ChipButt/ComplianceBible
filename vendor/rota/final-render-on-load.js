// Force final patched UI to render immediately after all override scripts load.
(function(){
  function finalRender(){
    try{
      if(state.view==='timesheets'){
        state.view='admin';
        state.adminPanel='timesheets';
        save();
      }
      if(state.view==='admin' && (!state.adminPanel || state.adminPanel==='shift')){
        state.adminPanel='menu';
        save();
      }
      if(typeof render==='function') render();
      if(state.view==='rota' && typeof renderRota==='function') renderRota();
      window.scrollTo(0,0);
    }catch(e){console.error('Final render failed',e);}
  }
  finalRender();
  setTimeout(finalRender,0);
})();
