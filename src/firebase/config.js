(function firebaseProjectConfig() {
  window.COMPLIANCE_FIREBASE_CONFIG = window.COMPLIANCE_FIREBASE_CONFIG || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };
  window.COMPLIANCE_FIREBASE_PUB_ID = window.COMPLIANCE_FIREBASE_PUB_ID || '';
  window.COMPLIANCE_FIREBASE_OPTIONS = window.COMPLIANCE_FIREBASE_OPTIONS || {
    production: true,
    allowSetupPopup: false,
    allowLocalFallback: false,
    functionsRegion: 'europe-west2',
    setupAdminEmails: []
  };
})();
