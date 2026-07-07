(function firebaseProjectConfig() {
  // Firebase web config for this deployed app copy. Data access is protected by Firestore rules.
  window.COMPLIANCE_FIREBASE_CONFIG = window.COMPLIANCE_FIREBASE_CONFIG || {
    apiKey: 'AIzaSyAc9jEiUNSapQ-kdgNe8DPUd_UPw21ZRrM',
    authDomain: 'compliancebible.firebaseapp.com',
    projectId: 'compliancebible',
    storageBucket: 'compliancebible.firebasestorage.app',
    messagingSenderId: '194386239844',
    appId: '1:194386239844:web:9caf48b14f33649a929a71',
    measurementId: 'G-JMRF00JQG1'
  };

  window.COMPLIANCE_FIREBASE_PUB_ID = window.COMPLIANCE_FIREBASE_PUB_ID || 'piston-club';

  window.COMPLIANCE_FIREBASE_OPTIONS = window.COMPLIANCE_FIREBASE_OPTIONS || {
    production: true,
    storageMode: 'firestore-images',
    allowFirebaseStorage: false,
    allowLocalFallback: false,
    setupAdminEmails: ['jameschipbutt@hotmail.com']
  };

  // Emergency UI fix: shell.css hides all .mainNav instances to remove the old top nav,
  // but the Settings screen uses .mainNav for its own section buttons. Restore only that
  // Settings navigation so Users / Add user is reachable again.
  if (!document.getElementById('settings-nav-visibility-fix')) {
    var style = document.createElement('style');
    style.id = 'settings-nav-visibility-fix';
    style.textContent = [
      '#app nav.mainNav.settingsOnlyNav{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin:0 0 16px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}',
      '#app nav.mainNav.settingsOnlyNav .navBtn{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:48px!important;padding:10px 12px!important;border-radius:14px!important;background:rgba(255,255,255,.06)!important;color:#fff8ea!important;border:1px solid rgba(255,255,255,.10)!important;font-weight:900!important}',
      '#app nav.mainNav.settingsOnlyNav .navBtn.active{background:linear-gradient(135deg,#b0914a,#d0ad58)!important;color:#070707!important;border:0!important}'
    ].join('\n');
    document.head.appendChild(style);
  }
})();
