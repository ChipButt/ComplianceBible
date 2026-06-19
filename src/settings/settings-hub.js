// Test Settings Page branch loader.
// The full prototype lives in src/settings/test-settings-page.js so this branch can be reviewed and discarded safely.
(function loadTestSettingsPagePrototype(){
  if(window.__testSettingsPagePrototypeLoader) return;
  window.__testSettingsPagePrototypeLoader = true;
  var script = document.createElement('script');
  script.src = 'src/settings/test-settings-page.js?v=20260620-1';
  script.defer = false;
  document.head.appendChild(script);
})();