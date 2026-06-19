// Test Settings Page branch loader.
// The full prototype lives in src/settings/test-settings-page.js so this branch can be reviewed and discarded safely.
(function loadTestSettingsPagePrototype(){
  if(window.__testSettingsPagePrototypeLoader) return;
  window.__testSettingsPagePrototypeLoader = true;
  function load(src){
    var script = document.createElement('script');
    script.src = src;
    script.defer = false;
    document.head.appendChild(script);
    return script;
  }
  var prototype = load('src/settings/test-settings-page.js?v=20260620-2');
  prototype.onload = function(){ load('src/settings/test-settings-page-refinements.js?v=20260620-1'); };
})();