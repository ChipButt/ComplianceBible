(function(){
  if(window.__kitchenSafetySystem) return;
  window.__kitchenSafetySystem=true;

  var kitchenDocuments=[
    {cat:'Food Safety',title:'Food Safety Records Book',notes:'Core food safety record pack for The Piston Club kitchen.'},
    {cat:'Food Safety',title:'Fridge & Freezer Temperature Sheet',notes:'Reference/upload for fridge and freezer temperature record sheets.'},
    {cat:'Food Safety',title:'Delivery Temperature Record Sheet',notes:'Reference/upload for delivery temperature checks.'},
    {cat:'Food Safety',title:'Cooked / Reheated / Cooling Temperature Sheet',notes:'Reference/upload for cooked, reheated, cooling and hot-hold food temperature records.'},
    {cat:'Food Safety',title:'Supplier Product Date Code Sheets',notes:'Reference/upload for supplier product/date-code sheets such as MKG Foods, Spring Fresh, Barry the Butcher and Tudor.'},
    {cat:'Food Safety',title:'Kitchen Opening / Closing Safe Methods Record',notes:'Reference/upload for opening checks, closing checks, extra checks and corrective-action notes.'}
  ];

  var checks=[
    {id:'delivery-temperatures',title:'Delivery Temperature Check',area:'Kitchen',freq:'Daily',due:'10:00',sign:false,requiresEvidence:true,items:['Delivery temperature checked','Chilled goods checked below 8°C','Frozen goods checked below -18°C','Issue/corrective action recorded if outside limits'],fields:[
      {name:'supplier',label:'Supplier',type:'text',required:true,placeholder:'e.g. MKG Foods / Spring Fresh / Butcher'},
      {name:'temperature',label:'Temperature',type:'text',required:true,placeholder:'e.g. 4°C / -19°C'},
      {name:'itemsChecked',label:'Items checked',type:'textarea',required:true,placeholder:'List items or delivery checked'},
      {name:'correctiveAction',label:'Corrective action taken',type:'textarea',required:false,placeholder:'Only needed if there was an issue'}
    ]},
    {id:'fridge-freezer-temperatures',title:'Fridge & Freezer Temperatures',area:'Kitchen',freq:'Daily',due:'11:00',sign:false,requiresEvidence:true,items:['Fridge readings checked below 8°C, ideally 1–5°C','Freezer readings checked below -18°C','AM or PM reading recorded as applicable','Corrective action recorded if outside limits'],fields:[
      {name:'unitNumber',label:'Unit number',type:'text',required:true,placeholder:'e.g. 1, 2, 3, walk-in, freezer'},
      {name:'readingPeriod',label:'Reading period',type:'select',required:true,options:['AM','PM','AM and PM']},
      {name:'temperature',label:'Temperature reading',type:'text',required:true,placeholder:'e.g. 3°C / -21°C'},
      {name:'correctiveAction',label:'Corrective action taken',type:'textarea',required:false,placeholder:'Only needed if reading is outside safe range'}
    ]},
    {id:'cooked-reheated-cooling-temperatures',title:'Cooked / Reheated / Cooling Temperatures',area:'Kitchen',freq:'Daily',due:'14:00',sign:false,requiresEvidence:true,items:['Cooked/reheated food checked above 75°C','Cooling checked at two-hour point where applicable','Food labelled and frozen where applicable','Corrective action recorded if required'],fields:[
      {name:'foodOne',label:'Food checked #1',type:'text',required:true,placeholder:'e.g. Beef / sausage / chicken'},
      {name:'tempOne',label:'Cooked temp #1',type:'text',required:true,placeholder:'e.g. 82.4°C'},
      {name:'twoHourOne',label:'+2 hours #1',type:'text',required:false,placeholder:'Cooling temperature after two hours'},
      {name:'foodTwo',label:'Food checked #2',type:'text',required:false,placeholder:'Second item if applicable'},
      {name:'tempTwo',label:'Cooked temp #2',type:'text',required:false,placeholder:'Second cooked temp'},
      {name:'twoHourTwo',label:'+2 hours #2',type:'text',required:false,placeholder:'Second cooling temp'},
      {name:'correctiveAction',label:'Corrective action taken',type:'textarea',required:false,placeholder:'Only needed if there was an issue'}
    ]},
    {id:'hot-held-food-temperatures',title:'Hot Held Food Temperatures',area:'Kitchen',freq:'Daily',due:'14:00',sign:false,requiresEvidence:true,items:['Hot-held food checked above 63°C','Food item and temperature recorded','Corrective action recorded if below safe limit'],fields:[
      {name:'foodChecked',label:'Food checked',type:'text',required:true,placeholder:'e.g. soup / gravy / sauce'},
      {name:'temperature',label:'Temperature',type:'text',required:true,placeholder:'e.g. 68°C'},
      {name:'correctiveAction',label:'Corrective action taken',type:'textarea',required:false,placeholder:'Only needed if there was an issue'}
    ]},
    {id:'date-code-check',title:'Date Code Check',area:'Kitchen',freq:'Daily',due:'10:00',sign:false,requiresEvidence:true,items:['All food checked for use-by date','Out-of-date items removed','Corrective action recorded if issue found'],fields:[
      {name:'areaChecked',label:'Area checked',type:'text',required:true,placeholder:'e.g. fridges / dry store / prep fridge'},
      {name:'result',label:'Result',type:'select',required:true,options:['All OK','Issue found and corrected','Manager notified']},
      {name:'correctiveAction',label:'Corrective action taken',type:'textarea',required:false,placeholder:'Record removed items or issue'}
    ]},
    {id:'supplier-product-date-code',title:'Supplier Product Date Code Sheet',area:'Kitchen',freq:'Daily',due:'10:00',sign:false,requiresEvidence:true,items:['Supplier sheet checked','Product/date codes reviewed','Missing/low/expired items noted','Relevant sheet photographed or uploaded'],fields:[
      {name:'supplier',label:'Supplier / sheet',type:'select',required:true,options:['MKG Foods','Spring Fresh','Barry the Butcher','Tudor','Other']},
      {name:'productsChecked',label:'Products checked',type:'textarea',required:true,placeholder:'List products checked or note sheet section'},
      {name:'issues',label:'Issues / notes',type:'textarea',required:false,placeholder:'Low stock, date issue, replacement required, etc.'}
    ]},
    {id:'kitchen-opening-checks',title:'Kitchen Opening Checks',area:'Kitchen',freq:'Daily',due:'10:00',sign:true,requiresEvidence:true,items:['Opening checks completed','Safe methods followed and supervised','Problems or changes recorded','Relevant evidence uploaded'],fields:[
      {name:'problems',label:'Any problems or changes - what did you do?',type:'textarea',required:false,placeholder:'Record issues, changes or corrective action'},
      {name:'confirmed',label:'Opening checks completed',type:'select',required:true,options:['Yes - completed','No - issue recorded']}
    ]},
    {id:'kitchen-closing-checks',title:'Kitchen Closing Checks',area:'Kitchen',freq:'Daily',due:'22:00',sign:true,requiresEvidence:true,items:['Closing checks completed','Safe methods followed and supervised','Problems or changes recorded','Relevant evidence uploaded'],fields:[
      {name:'problems',label:'Any problems or changes - what did you do?',type:'textarea',required:false,placeholder:'Record issues, changes or corrective action'},
      {name:'confirmed',label:'Closing checks completed',type:'select',required:true,options:['Yes - completed','No - issue recorded']}
    ]},
    {id:'kitchen-corrective-extra-checks',title:'Corrective Action / Extra Kitchen Checks',area:'Kitchen',freq:'Weekly',due:'12:00',sign:true,requiresEvidence:true,items:['Extra checks reviewed','Problems or corrective actions recorded','Evidence uploaded where relevant'],fields:[
      {name:'weekCommencing',label:'Week commencing',type:'text',required:false,placeholder:'Auto date can be used, or enter week start'},
      {name:'extraChecks',label:'Extra checks performed',type:'textarea',required:true,placeholder:'What extra checks were performed?'},
      {name:'correctiveAction',label:'Corrective action / problems or changes',type:'textarea',required:false,placeholder:'Record what was done'}
    ]}
  ];

  function uidSafe(){try{return uid();}catch(_){return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}}
  function saveSafe(){try{save();}catch(_){}}
  function ensureKitchen(){
    state.docs=state.docs||[];state.checks=state.checks||[];
    kitchenDocuments.forEach(function(doc){
      var exists=state.docs.some(function(d){return String(d.title||'').toLowerCase()===doc.title.toLowerCase();});
      if(!exists) state.docs.push({id:uidSafe(),cat:doc.cat,title:doc.title,status:'Missing',expiry:'',notes:doc.notes});
    });
    checks.forEach(function(check){
      var existing=state.checks.find(function(c){return c.id===check.id||String(c.title||'').toLowerCase()===check.title.toLowerCase();});
      if(existing){Object.assign(existing,check);} else state.checks.push(JSON.parse(JSON.stringify(check)));
    });
    saveSafe();
  }
  ensureKitchen();
})();