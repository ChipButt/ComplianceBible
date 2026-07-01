(function firebaseProjectConfig() {
  // Do not commit real Firebase API keys or project config to this public repository.
  // For production, inject these values at deploy time or use the Firebase Setup flow only on a trusted setup device.
  window.COMPLIANCE_FIREBASE_CONFIG = window.COMPLIANCE_FIREBASE_CONFIG || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  window.COMPLIANCE_FIREBASE_PUB_ID = window.COMPLIANCE_FIREBASE_PUB_ID || 'piston-club';

  window.COMPLIANCE_FIREBASE_OPTIONS = window.COMPLIANCE_FIREBASE_OPTIONS || {
    production: true,
    storageMode: 'firestore-images',
    allowFirebaseStorage: false,
    allowLocalFallback: false
  };
})();
