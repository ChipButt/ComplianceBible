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

  // The Settings hub is loaded later, so load this repair script now and let it observe
  // the Settings modal when it appears. This restores a visible Add User flow and fixes
  // the oversized Users modal layout.
  if (!document.querySelector('script[data-settings-users-add-fix]')) {
    var script = document.createElement('script');
    script.src = 'src/settings/users-add-fix.js?v=20260707-1';
    script.defer = true;
    script.dataset.settingsUsersAddFix = 'true';
    document.head.appendChild(script);
  }
})();
