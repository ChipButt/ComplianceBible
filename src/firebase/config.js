(function firebaseProjectConfig() {
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
    allowSetupPopup: false,
    allowLocalFallback: false,
    allowFirebaseStorage: false,
    storageMode: 'firestore-images',
    functionsRegion: 'europe-west2',
    setupAdminEmails: ['jameschipbutt@hotmail.com']
  };
})();
