// Loader shim: replaced iframe embed with the internal Rota module.
// index.html already loads this file, so this pulls in rota-full-module.js without another index change.
(function loadInternalRotaModule() {
  const script = document.createElement('script');
  script.src = 'rota-full-module.js?v=20260609-1';
  script.defer = false;
  document.body.appendChild(script);
})();
