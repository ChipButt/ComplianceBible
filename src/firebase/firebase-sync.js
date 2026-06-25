(function complianceFirebaseSync() {
  if (window.__complianceFirebaseSyncV1) return;
  window.__complianceFirebaseSyncV1 = true;

  var SDK_VERSION = '12.15.0';
  var CONFIG_OVERRIDE_KEY = 'complianceBible.firebaseConfig.v1';
  var PUB_ID_KEY = 'complianceBible.firebasePubId.v1';
  var EXTRA_STORAGE_KEYS = [
    'rotaAppUnifiedV2',
    'complianceUserDocumentRequirementsV1',
    'complianceStaffDocumentGroupsV1',
    'complianceBible.notificationRules.v1',
    'complianceBible.pushSettings.v1'
  ];

  var services = {};
  var authUser = null;
  var appDocRef = null;
  var unsubscribeAppState = null;
  var saveTimer = 0;
  var applyingRemote = false;
  var configured = false;
  var ready = false;
  var statusText = 'Cloud sync not configured';
  var lastError = '';
  var delegatedAuthEventsInstalled = false;

  function readJSON(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function appApi() {
    return window.ComplianceApp || null;
  }

  function currentState() {
    var api = appApi();
    return api && typeof api.getState === 'function' ? api.getState() : null;
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  }

  function currentConfig() {
    var base = window.COMPLIANCE_FIREBASE_CONFIG || {};
    var override = readJSON(CONFIG_OVERRIDE_KEY, {});
    return Object.assign({}, base, override);
  }

  function hasUsableConfig(config) {
    return !!(config && config.apiKey && config.authDomain && config.projectId && config.appId);
  }

  function pubId() {
    return String(localStorage.getItem(PUB_ID_KEY) || window.COMPLIANCE_FIREBASE_PUB_ID || 'default-pub').trim() || 'default-pub';
  }

  function safeSegment(value) {
    return String(value || 'file').trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
  }

  function authUserId(value) {
    return 'fb_' + String(value || '').replace(/[^a-zA-Z0-9]+/g, '').slice(0, 28);
  }

  function adminLike(user) {
    var text = String((user && user.role || '') + ' ' + (user && user.permissionSetId || '')).toLowerCase();
    return text.indexOf('admin') !== -1 || text.indexOf('supervisor') !== -1 || text.indexOf('manager') !== -1;
  }

  function mapAuthUserToState(nextState, user, options) {
    options = options || {};
    if (!nextState || !user) return nextState;
    nextState.users = Array.isArray(nextState.users) ? nextState.users : [];
    nextState.areas = Array.isArray(nextState.areas) && nextState.areas.length ? nextState.areas : ['FOH', 'Kitchen', 'Office'];
    var email = String(user.email || '').trim().toLowerCase();
    var matched = nextState.users.find(function byUid(item) { return item.authUid === user.uid; }) ||
      nextState.users.find(function byEmail(item) { return email && String(item.email || '').trim().toLowerCase() === email; });
    var linkedUsers = nextState.users.filter(function linked(item) { return !!item.authUid; });
    var hasLinkedAdmin = linkedUsers.some(adminLike);
    var shouldBeAdmin = options.firstCloudUser || (!hasLinkedAdmin && !matched);
    if (!matched) {
      matched = {
        id: authUserId(user.uid),
        authUid: user.uid,
        name: user.displayName || user.email || 'New user',
        nickname: user.displayName || String(user.email || 'User').split('@')[0],
        email: user.email || '',
        role: shouldBeAdmin ? 'Admin' : 'Staff',
        permissionSetId: shouldBeAdmin ? 'Admin' : 'Staff',
        area: nextState.areas[0] || 'FOH'
      };
      nextState.users.push(matched);
    } else {
      matched.authUid = user.uid;
      matched.email = matched.email || user.email || '';
      matched.name = matched.name || user.displayName || user.email || 'User';
      matched.nickname = matched.nickname || user.displayName || String(user.email || 'User').split('@')[0];
      if (shouldBeAdmin) {
        matched.role = 'Admin';
        matched.permissionSetId = 'Admin';
      }
    }
    nextState.currentUser = matched.id;
    return nextState;
  }

  function collectExtraStorage() {
    var out = {};
    EXTRA_STORAGE_KEYS.forEach(function collect(key) {
      try {
        var value = localStorage.getItem(key);
        if (value != null) out[key] = value;
      } catch (_) {}
    });
    return out;
  }

  function applyExtraStorage(extra) {
    if (!extra || typeof extra !== 'object') return;
    EXTRA_STORAGE_KEYS.forEach(function apply(key) {
      try {
        if (Object.prototype.hasOwnProperty.call(extra, key)) localStorage.setItem(key, extra[key]);
      } catch (_) {}
    });
  }

  function cleanForFirestore(value, parent) {
    if (typeof value === 'undefined') return null;
    if (Array.isArray(value)) return value.map(function cleanItem(item) { return cleanForFirestore(item, null); });
    if (!value || typeof value !== 'object') return value;
    var out = {};
    Object.keys(value).forEach(function cleanKey(key) {
      var item = value[key];
      if (key === 'fileData' && typeof item === 'string' && item.indexOf('data:') === 0 && value.fileUrl) {
        out[key] = value.fileUrl;
        return;
      }
      if (key === 'photo' && item && typeof item === 'object') {
        out[key] = cleanForFirestore(item, value);
        return;
      }
      out[key] = cleanForFirestore(item, value);
    });
    return out;
  }

  function setStatus(text, error) {
    statusText = text || statusText;
    lastError = error || '';
    renderAuthUI();
  }

  function appPayload() {
    var state = currentState();
    var sharedState = clone(state || {});
    if (sharedState && typeof sharedState === 'object') sharedState.currentUser = '';
    return {
      state: cleanForFirestore(sharedState, null),
      extraStorage: collectExtraStorage(),
      updatedBy: authUser && authUser.uid || '',
      updatedByEmail: authUser && authUser.email || ''
    };
  }

  function saveCloudStateNow() {
    if (!ready || !authUser || !appDocRef || applyingRemote) return Promise.resolve();
    var payload = appPayload();
    payload.updatedAt = services.serverTimestamp();
    setStatus('Saving to Firebase');
    return services.setDoc(appDocRef, payload, { merge: true })
      .then(function saved() { setStatus('Synced with Firebase'); })
      .catch(function failed(error) { setStatus('Firebase save failed', error && error.message || String(error)); });
  }

  function queueStateSave() {
    if (!ready || !authUser || !appDocRef || applyingRemote) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCloudStateNow, 650);
  }

  function replaceLocalState(nextState) {
    var api = appApi();
    if (!api || typeof api.replaceState !== 'function') return;
    applyingRemote = true;
    try {
      api.replaceState(nextState, { render: true });
    } finally {
      applyingRemote = false;
    }
  }

  function userListSignature(nextState) {
    try { return JSON.stringify(nextState && nextState.users || []); } catch (_) { return ''; }
  }

  function applyCloudSnapshot(snapshot) {
    if (!snapshot.exists()) {
      var firstState = clone(currentState() || {});
      mapAuthUserToState(firstState, authUser, { firstCloudUser: true });
      replaceLocalState(firstState);
      saveCloudStateNow();
      return;
    }
    if (snapshot.metadata && snapshot.metadata.hasPendingWrites) return;
    var data = snapshot.data() || {};
    applyingRemote = true;
    try {
      applyExtraStorage(data.extraStorage || {});
    } finally {
      applyingRemote = false;
    }
    var nextState = clone(data.state || currentState() || {});
    var beforeUsers = userListSignature(nextState);
    mapAuthUserToState(nextState, authUser, {});
    var usersChanged = beforeUsers !== userListSignature(nextState);
    replaceLocalState(nextState);
    setStatus('Synced with Firebase');
    if (usersChanged) saveCloudStateNow();
  }

  function stopListening() {
    if (typeof unsubscribeAppState === 'function') {
      try { unsubscribeAppState(); } catch (_) {}
    }
    unsubscribeAppState = null;
    appDocRef = null;
  }

  function startListening() {
    stopListening();
    if (!authUser || !services.db) return;
    appDocRef = services.doc(services.db, 'pubs', pubId(), 'app', 'state');
    setStatus('Loading cloud data');
    unsubscribeAppState = services.onSnapshot(appDocRef, applyCloudSnapshot, function listenFailed(error) {
      setStatus('Firebase listener failed', error && error.message || String(error));
    });
  }

  function fallbackFileRecord(file) {
    return new Promise(function read(resolve) {
      if (!file) return resolve(null);
      var reader = new FileReader();
      reader.onload = function loaded() {
        resolve({
          fileName: file.name || 'File',
          fileType: file.type || '',
          fileSize: file.size || 0,
          fileData: reader.result || '',
          uploadedAt: new Date().toISOString(),
          storageMode: 'local'
        });
      };
      reader.onerror = function failed() { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  function uploadFile(file, options) {
    options = options || {};
    if (!file) return Promise.resolve(null);
    if (!ready || !services.storage || !authUser) return fallbackFileRecord(file);
    var folder = safeSegment(options.folder || 'uploads');
    var name = safeSegment(file.name || 'file');
    var path = 'pubs/' + safeSegment(pubId()) + '/uploads/' + authUser.uid + '/' + folder + '/' + Date.now() + '-' + name;
    var storageReference = services.storageRef(services.storage, path);
    return services.uploadBytes(storageReference, file, { contentType: file.type || 'application/octet-stream' })
      .then(function uploaded(snapshot) { return services.getDownloadURL(snapshot.ref); })
      .then(function gotUrl(url) {
        return {
          fileName: file.name || 'File',
          fileType: file.type || '',
          fileSize: file.size || 0,
          fileData: url,
          fileUrl: url,
          storagePath: path,
          uploadedAt: new Date().toISOString(),
          uploadedBy: authUser.uid,
          storageMode: 'firebase'
        };
      })
      .catch(function failedUpload(error) {
        setStatus('Firebase upload failed', error && error.message || String(error));
        return fallbackFileRecord(file);
      });
  }

  function signIn(email, password) {
    if (!ready || !services.auth) return Promise.reject(new Error('Firebase is not ready.'));
    setStatus('Signing in');
    return services.signInWithEmailAndPassword(services.auth, email, password);
  }

  function createAccount(email, password) {
    if (!ready || !services.auth) return Promise.reject(new Error('Firebase is not ready.'));
    setStatus('Creating account');
    return services.createUserWithEmailAndPassword(services.auth, email, password);
  }

  function signOutUser() {
    if (!ready || !services.auth) return Promise.resolve();
    return services.signOut(services.auth);
  }

  function configText() {
    var cfg = currentConfig();
    return JSON.stringify({
      apiKey: cfg.apiKey || '',
      authDomain: cfg.authDomain || '',
      projectId: cfg.projectId || '',
      storageBucket: cfg.storageBucket || '',
      messagingSenderId: cfg.messagingSenderId || '',
      appId: cfg.appId || ''
    }, null, 2);
  }

  function openSetup() {
    var modal = document.getElementById('modal');
    if (!modal) return;
    modal.innerHTML = '<div class="modalCard firebaseSetupModal"><button class="close" id="firebaseSetupClose" type="button">&times;</button><h2>Firebase Setup</h2><form id="firebaseSetupForm" class="stack"><label><span>Pub ID</span><input name="pubId" value="' + escapeHtml(pubId()) + '" required></label><label><span>Firebase config JSON</span><textarea name="config" spellcheck="false" required>' + escapeHtml(configText()) + '</textarea></label><button class="primary">Save Firebase Setup</button></form></div>';
    modal.classList.remove('hidden');
    var close = document.getElementById('firebaseSetupClose');
    if (close) close.onclick = function closeSetup() { modal.classList.add('hidden'); modal.innerHTML = ''; };
    var form = document.getElementById('firebaseSetupForm');
    if (form) form.onsubmit = function saveSetup(event) {
      event.preventDefault();
      try {
        var parsed = JSON.parse(form.elements.config.value || '{}');
        writeJSON(CONFIG_OVERRIDE_KEY, parsed);
        localStorage.setItem(PUB_ID_KEY, String(form.elements.pubId.value || 'default-pub').trim() || 'default-pub');
        window.location.reload();
      } catch (error) {
        alert('Firebase config JSON is not valid.');
      }
    };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function ensureStyle() {
    if (document.getElementById('firebase-sync-style')) return;
    var style = document.createElement('style');
    style.id = 'firebase-sync-style';
    style.textContent = '.firebaseStatusBar{position:sticky;top:var(--fixed-topbar-height,0);z-index:3000;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px 12px;background:#071522;color:#fff8ea;border-bottom:1px solid rgba(208,173,88,.38);font-size:12px;font-weight:800}.firebaseStatusBar button{min-height:32px!important;height:32px!important;padding:0 10px!important;border-radius:999px!important}.firebaseStatusBar small{display:block;color:#d0ad58;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.firebaseGate{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:18px;background:rgba(3,8,12,.82);backdrop-filter:blur(8px)}.firebaseGate.hidden{display:none!important}.firebaseGateCard{width:min(420px,100%);display:grid;gap:12px;padding:18px;border-radius:20px;background:#151b22;border:1px solid rgba(208,173,88,.5);color:#fff8ea;box-shadow:0 28px 70px rgba(0,0,0,.35)}.firebaseGateCard h2{margin:0;color:#fff8ea}.firebaseGateForm{display:grid;gap:10px}.firebaseGateForm input,.firebaseSetupModal textarea,.firebaseSetupModal input{width:100%;box-sizing:border-box}.firebaseGateActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.firebaseSetupModal textarea{min-height:220px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.firebaseError{margin:0;color:#ff8b80;font-weight:800}.firebaseLocalOnly{color:#aaa194}@media(max-width:520px){.firebaseStatusBar{grid-template-columns:minmax(0,1fr) auto}.firebaseStatusBar [data-firebase-signout]{grid-column:2}.firebaseGateActions{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function ensureAuthContainers() {
    ensureStyle();
    var bar = document.getElementById('firebaseStatusBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'firebaseStatusBar';
      bar.className = 'firebaseStatusBar';
      var shell = document.getElementById('appShell');
      if (shell && shell.firstElementChild) shell.insertBefore(bar, shell.children[1] || null);
      else document.body.insertBefore(bar, document.body.firstChild);
    }
    var gate = document.getElementById('firebaseAuthGate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'firebaseAuthGate';
      gate.className = 'firebaseGate hidden';
      document.body.appendChild(gate);
    }
    return { bar: bar, gate: gate };
  }

  function renderAuthUI() {
    if (!document.body) return;
    var els = ensureAuthContainers();
    var cfgReady = hasUsableConfig(currentConfig());
    var email = authUser && authUser.email || '';
    if (!cfgReady) {
      els.bar.innerHTML = '<span><strong>Local mode</strong><small>Firebase setup needed for cloud login and storage</small></span><button type="button" class="ghost small" data-firebase-setup onclick="window.ComplianceFirebase&&window.ComplianceFirebase.openSetup&&window.ComplianceFirebase.openSetup()">Firebase Setup</button>';
      els.gate.classList.add('hidden');
    } else if (!ready) {
      els.bar.innerHTML = '<span><strong>Firebase</strong><small>' + escapeHtml(statusText) + '</small></span><button type="button" class="ghost small" data-firebase-setup onclick="window.ComplianceFirebase&&window.ComplianceFirebase.openSetup&&window.ComplianceFirebase.openSetup()">Setup</button>';
      els.gate.classList.add('hidden');
    } else if (!authUser) {
      els.bar.innerHTML = '<span><strong>Firebase</strong><small>Sign in required</small></span><button type="button" class="ghost small" data-firebase-setup onclick="window.ComplianceFirebase&&window.ComplianceFirebase.openSetup&&window.ComplianceFirebase.openSetup()">Setup</button>';
      els.gate.classList.remove('hidden');
      els.gate.innerHTML = '<div class="firebaseGateCard"><h2>Sign In</h2><form id="firebaseAuthForm" class="firebaseGateForm"><input name="email" type="email" placeholder="Email" autocomplete="email" required><input name="password" type="password" placeholder="Password" autocomplete="current-password" required><div class="firebaseGateActions"><button class="primary" data-auth-action="signin">Sign In</button><button class="ghost" data-auth-action="create">Create Account</button></div></form>' + (lastError ? '<p class="firebaseError">' + escapeHtml(lastError) + '</p>' : '') + '</div>';
    } else {
      els.bar.innerHTML = '<span><strong>Signed in</strong><small>' + escapeHtml(email) + ' - ' + escapeHtml(statusText) + '</small></span><button type="button" class="ghost small" data-firebase-setup onclick="window.ComplianceFirebase&&window.ComplianceFirebase.openSetup&&window.ComplianceFirebase.openSetup()">Setup</button><button type="button" class="ghost small" data-firebase-signout onclick="window.ComplianceFirebase&&window.ComplianceFirebase.signOut&&window.ComplianceFirebase.signOut()">Sign Out</button>';
      els.gate.classList.add('hidden');
      els.gate.innerHTML = '';
    }
    bindAuthUI();
  }

  function bindAuthUI() {
    var form = document.getElementById('firebaseAuthForm');
    if (form) {
      form.onsubmit = function submitAuth(event) {
        event.preventDefault();
        var action = event.submitter && event.submitter.dataset.authAction || 'signin';
        var email = String(form.elements.email.value || '').trim();
        var password = String(form.elements.password.value || '');
        var task = action === 'create' ? createAccount(email, password) : signIn(email, password);
        task.catch(function authFailed(error) { setStatus('Authentication failed', error && error.message || String(error)); });
      };
    }
  }

  function installAuthDelegates() {
    if (delegatedAuthEventsInstalled) return;
    delegatedAuthEventsInstalled = true;
    document.addEventListener('click', function delegatedAuthClick(event) {
      var target = event.target && event.target.closest ? event.target : null;
      if (!target) return;
      if (target.closest('[data-firebase-setup]')) {
        event.preventDefault();
        openSetup();
        return;
      }
      if (target.closest('[data-firebase-signout]')) {
        event.preventDefault();
        signOutUser();
      }
    });
  }

  function installLocalStorageHook() {
    if (Storage.prototype.__complianceFirebaseHooked) return;
    var originalSetItem = Storage.prototype.setItem;
    var originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function hookedSetItem(key, value) {
      var result = originalSetItem.apply(this, arguments);
      if (this === localStorage && EXTRA_STORAGE_KEYS.indexOf(String(key)) !== -1 && !applyingRemote) queueStateSave();
      return result;
    };
    Storage.prototype.removeItem = function hookedRemoveItem(key) {
      var result = originalRemoveItem.apply(this, arguments);
      if (this === localStorage && EXTRA_STORAGE_KEYS.indexOf(String(key)) !== -1 && !applyingRemote) queueStateSave();
      return result;
    };
    Storage.prototype.__complianceFirebaseHooked = true;
    window.addEventListener('storage', function syncedStorage(event) {
      if (EXTRA_STORAGE_KEYS.indexOf(String(event.key || '')) !== -1 && !applyingRemote) queueStateSave();
    });
  }

  function initFirebase() {
    installAuthDelegates();
    configured = hasUsableConfig(currentConfig());
    renderAuthUI();
    if (!configured) return;
    setStatus('Connecting to Firebase');
    Promise.all([
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-storage.js')
    ]).then(function loaded(modules) {
      var appMod = modules[0];
      var authMod = modules[1];
      var firestoreMod = modules[2];
      var storageMod = modules[3];
      var app = appMod.initializeApp(currentConfig());
      services.app = app;
      services.auth = authMod.getAuth(app);
      services.db = firestoreMod.getFirestore(app);
      services.storage = storageMod.getStorage(app);
      services.doc = firestoreMod.doc;
      services.setDoc = firestoreMod.setDoc;
      services.onSnapshot = firestoreMod.onSnapshot;
      services.serverTimestamp = firestoreMod.serverTimestamp;
      services.storageRef = storageMod.ref;
      services.uploadBytes = storageMod.uploadBytes;
      services.getDownloadURL = storageMod.getDownloadURL;
      services.signInWithEmailAndPassword = authMod.signInWithEmailAndPassword;
      services.createUserWithEmailAndPassword = authMod.createUserWithEmailAndPassword;
      services.signOut = authMod.signOut;
      ready = true;
      setStatus('Firebase ready');
      authMod.onAuthStateChanged(services.auth, function authChanged(user) {
        authUser = user || null;
        if (authUser) startListening();
        else {
          stopListening();
          setStatus('Sign in required');
        }
        renderAuthUI();
      });
    }).catch(function firebaseFailed(error) {
      ready = false;
      setStatus('Firebase failed to load', error && error.message || String(error));
    });
  }

  window.ComplianceFirebase = {
    queueStateSave: queueStateSave,
    saveNow: saveCloudStateNow,
    uploadFile: uploadFile,
    fallbackFileRecord: fallbackFileRecord,
    openSetup: openSetup,
    signOut: signOutUser,
    isApplyingRemote: function isApplyingRemote() { return applyingRemote; },
    isSignedIn: function isSignedIn() { return !!authUser; },
    currentUser: function currentUser() { return authUser; },
    hasConfig: function hasConfig() { return hasUsableConfig(currentConfig()); },
    status: function status() { return { ready: ready, configured: configured, signedIn: !!authUser, text: statusText, error: lastError, pubId: pubId() }; }
  };

  installLocalStorageHook();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }
})();
