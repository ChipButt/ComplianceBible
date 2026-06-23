(function(){
  if(window.__kitchenSafetySystem) return;
  window.__kitchenSafetySystem=true;

  var kitchenDocuments=[
    {cat:'Food Safety',title:'Food Safety Records Book',notes:'Core food safety record pack for The Piston Club kitchen.'},
    {cat:'Food Safety',title:'Fridge & Freezer Temperature Sheet',notes:'Reference/upload for fridge and freezer temperature record sheets.'},
    {cat:'Food Safety',title:'Delivery Temperature Record Sheet',notes:'Reference/upload for delivery temperature checks.'},
    {cat:'Food Safety',title:'Cooked / Reheated / Cooling Temperature Sheet',notes:'Reference/upload for cooked, reheated, cooling and hot-hold food temperature records.'},
    {cat:'Food Safety',title:'Supplier Product Date Code Sheets',notes:'Reference/upload for supplier product/date-code sheets.'},
    {cat:'Food Safety',title:'Kitchen Opening / Closing Safe Methods Record',notes:'Reference/upload for opening checks, closing checks, extra checks and corrective-action notes.'}
  ];

  function uidSafe(){try{return uid();}catch(_){return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}}
  function saveSafe(){try{save();}catch(_){} }
  function ensureKitchen(){
    state.docs=state.docs||[];state.checks=state.checks||[];
    kitchenDocuments.forEach(function(doc){
      var exists=state.docs.some(function(d){return String(d.title||'').toLowerCase()===doc.title.toLowerCase();});
      if(!exists) state.docs.push({id:uidSafe(),cat:doc.cat,title:doc.title,status:'Missing',expiry:'',notes:doc.notes});
    });
    saveSafe();
  }
  ensureKitchen();
})();
