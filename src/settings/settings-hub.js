// Test Settings Page branch loader.
// Emergency-safe version: only load the stable prototype, not the broken refinement layer.
(function loadTestSettingsPagePrototype(){
  if(window.__testSettingsPagePrototypeLoader) return;
  window.__testSettingsPagePrototypeLoader = true;
  var script = document.createElement('script');
  script.src = 'src/settings/test-settings-page.js?v=20260620-3';
  script.defer = false;
  document.head.appendChild(script);
})();