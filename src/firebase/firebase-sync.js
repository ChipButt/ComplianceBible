(function complianceFirebaseStructured() {
  if (window.__complianceFirebaseStructuredV3) return;
  window.__complianceFirebaseStructuredV3 = true;

  var SDK_VERSION = '12.15.0';
  var ROTA_KEY = 'rotaAppUnifiedV2';
  var REQ_KEY = 'complianceUserDocumentRequirementsV1';
  var GROUP_KEY = 'complianceStaffDocumentGroupsV1';
  var NAV_KEY = 'complianceBible.navigation.v1';

  var DEFAULT_OPTIONS = {
    production: true,
    storageMode: 'firestore-images',
    allowFirebaseStorage: false,
    allowSetupPopup: false,
    allowLocalFallback: false,
    setupAdminEmails: []
  };

  var PERMISSION_ALIASES = {
    'settings.manage': ['settings.manage', 'pub.manage'],
    'permissions.manage': ['permissions.manage', 'settings.managePermissionGroups'],
    'users.create': ['users.create', 'users.manage'],
    'users.edit': ['users.edit', 'users.manage'],
    'users.archive': ['users.archive', 'users.manage'],
    'documents.managePremises': ['documents.managePremises', 'premisesDocs.manage'],
    'documents.manageStaff': ['documents.manageStaff', 'staffDocs.manage'],
    'documents.uploadOwn': ['documents.uploadOwn', 'staffDocs.viewOwn'],
    'documents.viewOwn': ['documents.viewOwn', 'staffDocs.viewOwn'],
    'documents.viewAll': ['documents.viewAll', 'staffDocs.viewAll'],
    'checks.create': ['checks.create', 'checks.manage'],
    'checks.complete': ['checks.complete', 'checks.viewAll'],
    'rota.viewOwn': ['rota.viewOwn', 'rota.view'],
    'issues.create': ['issues.create', 'issues.view'],
    'issues.manage': ['issues.manage', 'issues.resolve'],
    'audit.view': ['audit.view']
  };

  var DEFAULT_PERMISSION_SETS = {
    Owner: { description: 'Full owner access', permissions: { '*': true } },
    Admin: { description: 'Full access', permissions: { '*': true } },
    Manager: { description: 'Full manager access', permissions: { '*': true } },
    Supervisor: {
      description: 'Manager access without user/security administration',
      permissions: {
        'settings.view': true,
        'documents.uploadOwn': true,
        'documents.viewOwn': true,
        'documents.viewAll': true,
        'premisesDocs.view': true,
        'staffDocs.viewOwn': true,
        'staffDocs.viewAll': true,
        'checks.complete': true,
        'checks.viewAll': true,
        'rota.viewOwn': true,
        'rota.view': true,
        'issues.create': true,
        'issues.view': true,
        'issues.manage': true,
        'issues.resolve': true,
        'shopping.manage': true,
        'inspection.view': true,
        'workAreas.view': true
      }
    },
    Staff: {
      description: 'Own checks, documents, rota and issue reporting',
      permissions: {
        'documents.uploadOwn': true,
        'documents.viewOwn': true,
        'staffDocs.viewOwn': true,
        'checks.complete': true,
        'rota.viewOwn': true,
        'rota.view': true,
        'issues.create': true,
        'workAreas.view': true
      }
    }
  };

  var services = {};
  var authUser = null;
  var authClaims = {};
  var ready = false;
  var configured = false;
  var applyingRemote = false;
  var saveTimer = 0;
  var statusText = 'Firebase not ready';
  var lastError = '';
  var accessMode = 'booting';
  var unsubscribers = [];
  var dataUnsubscribers = [];
  var staffDocUnsubscribers = {};
  var remote = emptyRemote();

  function emptyRemote() {
    return {
      pub: null,
      member: null,
      permissionSets: [],
      staff: [],
      staffDocuments: {},
      premisesDocuments: [],
      documentRequirements: [],
      workAreas: [],
      checks: [],
      checkCompletions: [],
      rota: [],
      issues: [],
      auditLogs: []
    };
  }

  function options() {
    return Object.assign({}, DEFAULT_OPTIONS, window.COMPLIANCE_FIREBASE_OPTIONS || {});
  }

  function currentConfig() {
    return window.COMPLIANCE_FIREBASE_CONFIG || {};
  }

  function hasUsableConfig(config) {
    return !!(config && config.apiKey && config.authDomain && config.projectId && config.appId);
  }

  function pubId() {
    return String(window.COMPLIANCE_FIREBASE_PUB_ID || localStorage.getItem('complianceBible.firebasePubId.v1') || '').trim();
  }

  function api() {
    return window.ComplianceApp || null;
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  }

  function safeSegment(value) {
    return String(value || 'item').trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
  }

  function stableId(value, fallback) {
    var base = String(value || fallback || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return base || safeSegment(fallback || 'item');
  }

  function clean(value) {
    if (typeof value === 'undefined') return null;
    if (Array.isArray(value)) return value.map(clean);
    if (!value || typeof value !== 'object') return value;
    var out = {};
    Object.keys(value).forEach(function (key) {
      if (typeof value[key] === 'undefined') return;
      out[key] = clean(value[key]);
    });
    return out;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function readJSON(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function isSetupAdmin() {
    var email = String(authUser && authUser.email || '').toLowerCase();
    var allowedEmails = (options().setupAdminEmails || []).map(function (item) { return String(item || '').toLowerCase(); });
    return !!(authClaims.setupAdmin === true || authClaims.complianceSetupAdmin === true || allowedEmails.indexOf(email) !== -1);
  }

  function memberActive(member) {
    return !!(member && member.active !== false && member.archived !== true);
  }

  function currentStaffId() {
    return remote.member && remote.member.staffId || authUser && authUser.uid || '';
  }

  function permissionSetById(id) {
    var found = remote.permissionSets.find(function (set) { return set.id === id; });
    if (found) return found;
    return DEFAULT_PERMISSION_SETS[id] ? Object.assign({ id: id }, DEFAULT_PERMISSION_SETS[id]) : DEFAULT_PERMISSION_SETS.Staff;
  }

  function permissionMapFor(member) {
    var set = permissionSetById(member && member.permissionSetId || member && member.role || 'Staff');
    var permissions = Object.assign({}, set && set.permissions || set || {});
    if (permissions['*'] === true) return permissions;
    Object.keys(PERMISSION_ALIASES).forEach(function (key) {
      if (permissions[key] === true) return;
      if (PERMISSION_ALIASES[key].some(function (alias) { return permissions[alias] === true; })) permissions[key] = true;
    });
    return permissions;
  }

  function hasPermission(key, member) {
    member = member || remote.member;
    if (isSetupAdmin() && (!remote.member || memberActive(remote.member))) return true;
    if (!memberActive(member)) return false;
    var role = String(member.role || '').toLowerCase();
    if (role === 'owner' || role === 'admin' || role === 'manager') return true;
    var permissions = permissionMapFor(member);
    if (permissions['*'] === true) return true;
    var keys = PERMISSION_ALIASES[key] || [key];
    return keys.some(function (item) { return permissions[item] === true; });
  }

  function setStatus(text, error) {
    statusText = text || statusText;
    lastError = error || '';
    renderAuthUI();
  }

  function docData(snapshot) {
    return snapshot.exists() ? Object.assign({ id: snapshot.id }, snapshot.data() || {}) : null;
  }

  function collectionData(snapshot) {
    return snapshot.docs.map(function (doc) { return Object.assign({ id: doc.id }, doc.data() || {}); });
  }

  function stopList(list) {
    while (list.length) {
      try { list.pop()(); } catch (_) {}
    }
  }

  function stopAll() {
    stopList(unsubscribers);
    stopList(dataUnsubscribers);
    Object.keys(staffDocUnsubscribers).forEach(function (key) {
      try { staffDocUnsubscribers[key](); } catch (_) {}
      delete staffDocUnsubscribers[key];
    });
    remote = emptyRemote();
  }

  function pubRef() {
    return services.doc(services.db, 'pubs', pubId());
  }

  function pubCollection(name) {
    return services.collection(services.db, 'pubs', pubId(), name);
  }

  function listenDoc(ref, handler, onError) {
    return services.onSnapshot(ref, function (snapshot) { handler(docData(snapshot)); }, onError || handleListenError);
  }

  function listenCollection(ref, handler, onError) {
    return services.onSnapshot(ref, function (snapshot) { handler(collectionData(snapshot)); }, onError || handleListenError);
  }

  function handleListenError(error) {
    setStatus('Firebase listener blocked', error && error.message || String(error));
  }

  function startListening() {
    stopAll();
    if (!ready || !authUser || !pubId()) return;
    accessMode = 'loading';
    setStatus('Loading pub data');
    unsubscribers.push(listenDoc(pubRef(), function (pub) {
      remote.pub = pub;
      evaluateAccess();
    }));
    unsubscribers.push(listenDoc(services.doc(services.db, 'pubs', pubId(), 'members', authUser.uid), function (member) {
      remote.member = member;
      evaluateAccess();
    }));
  }

  function evaluateAccess() {
    stopList(dataUnsubscribers);
    Object.keys(staffDocUnsubscribers).forEach(function (key) {
      try { staffDocUnsubscribers[key](); } catch (_) {}
      delete staffDocUnsubscribers[key];
    });

    if (!remote.pub) {
      accessMode = isSetupAdmin() ? 'setup' : 'no-pub';
      renderAuthUI();
      return;
    }
    if (!memberActive(remote.member)) {
      accessMode = remote.member && remote.member.archived ? 'archived' : 'no-member';
      renderAuthUI();
      return;
    }
    accessMode = 'member';
    attachDataListeners();
    renderAuthUI();
  }

  function attachDataListeners() {
    dataUnsubscribers.push(listenCollection(pubCollection('permissionSets'), function (items) {
      remote.permissionSets = items;
      rebuildLocalState();
      refreshStaffDocumentListeners();
    }));
    dataUnsubscribers.push(listenCollection(pubCollection('workAreas'), function (items) { remote.workAreas = items; rebuildLocalState(); }));
    dataUnsubscribers.push(listenCollection(pubCollection('documentRequirements'), function (items) { remote.documentRequirements = items; rebuildLocalState(); }));
    dataUnsubscribers.push(listenCollection(pubCollection('premisesDocuments'), function (items) { remote.premisesDocuments = items; rebuildLocalState(); }));
    dataUnsubscribers.push(listenCollection(pubCollection('checks'), function (items) { remote.checks = items; rebuildLocalState(); }));
    dataUnsubscribers.push(listenCollection(pubCollection('issues'), function (items) { remote.issues = items; rebuildLocalState(); }));

    if (hasPermission('users.edit') || hasPermission('documents.viewAll') || hasPermission('checks.viewAll')) {
      dataUnsubscribers.push(listenCollection(pubCollection('staff'), function (items) {
        remote.staff = items;
        rebuildLocalState();
        refreshStaffDocumentListeners();
      }));
    } else {
      dataUnsubscribers.push(listenDoc(services.doc(services.db, 'pubs', pubId(), 'staff', currentStaffId()), function (item) {
        remote.staff = item ? [item] : [];
        rebuildLocalState();
        refreshStaffDocumentListeners();
      }));
    }

    var completionsRef = hasPermission('checks.viewAll')
      ? pubCollection('checkCompletions')
      : services.query(pubCollection('checkCompletions'), services.where('userId', '==', currentStaffId()));
    dataUnsubscribers.push(listenCollection(completionsRef, function (items) { remote.checkCompletions = items; rebuildLocalState(); }));

    var rotaRef = hasPermission('rota.manage')
      ? pubCollection('rota')
      : services.query(pubCollection('rota'), services.where('userId', '==', currentStaffId()));
    dataUnsubscribers.push(listenCollection(rotaRef, function (items) {
      remote.rota = items;
      writeRotaLocal(items);
    }));

    if (hasPermission('audit.view')) {
      dataUnsubscribers.push(listenCollection(pubCollection('auditLogs'), function (items) { remote.auditLogs = items; }));
    }
  }

  function refreshStaffDocumentListeners() {
    var allowedAll = hasPermission('documents.viewAll') || hasPermission('documents.manageStaff');
    var staffIds = allowedAll ? remote.staff.map(function (item) { return item.id; }) : [currentStaffId()];
    staffIds.filter(Boolean).forEach(function (staffId) {
      if (staffDocUnsubscribers[staffId]) return;
      var ref = services.collection(services.db, 'pubs', pubId(), 'staff', staffId, 'documents');
      staffDocUnsubscribers[staffId] = listenCollection(ref, function (items) {
        remote.staffDocuments[staffId] = items.map(function (item) { return Object.assign({ userId: staffId }, item); });
        rebuildLocalState();
      });
    });
    Object.keys(staffDocUnsubscribers).forEach(function (staffId) {
      if (staffIds.indexOf(staffId) !== -1) return;
      try { staffDocUnsubscribers[staffId](); } catch (_) {}
      delete staffDocUnsubscribers[staffId];
      delete remote.staffDocuments[staffId];
    });
  }

  function permissionMatrixFromRemote() {
    var matrix = {};
    Object.keys(DEFAULT_PERMISSION_SETS).forEach(function (id) {
      matrix[id] = normalizePermissionMap(DEFAULT_PERMISSION_SETS[id].permissions || {});
      matrix[id].description = DEFAULT_PERMISSION_SETS[id].description || '';
    });
    remote.permissionSets.forEach(function (set) {
      matrix[set.id] = normalizePermissionMap(set.permissions || set);
      if (set.description) matrix[set.id].description = set.description;
    });
    return matrix;
  }

  function normalizePermissionMap(map) {
    if (map && map['*'] === true) {
      var all = {};
      requestedPermissionKeys().forEach(function (key) { all[key] = true; });
      all['*'] = true;
      return all;
    }
    var out = Object.assign({}, map || {});
    Object.keys(PERMISSION_ALIASES).forEach(function (key) {
      if (out[key] === true) return;
      if (PERMISSION_ALIASES[key].some(function (alias) { return out[alias] === true; })) out[key] = true;
    });
    return out;
  }

  function requestedPermissionKeys() {
    return [
      'settings.manage', 'users.create', 'users.edit', 'users.archive', 'permissions.manage',
      'documents.managePremises', 'documents.manageStaff', 'documents.uploadOwn', 'documents.viewOwn', 'documents.viewAll',
      'checks.create', 'checks.complete', 'checks.viewAll', 'rota.manage', 'rota.viewOwn',
      'issues.create', 'issues.manage', 'audit.view',
      'settings.view', 'pub.manage', 'premisesDocs.view', 'premisesDocs.manage', 'staffDocs.viewOwn', 'staffDocs.viewAll', 'staffDocs.manage',
      'checks.manage', 'rota.view', 'issues.view', 'issues.resolve', 'shopping.manage', 'inspection.view', 'inspection.export', 'workAreas.view', 'workAreas.manage'
    ];
  }

  function rebuildLocalState() {
    var app = api();
    if (!app || typeof app.replaceState !== 'function' || !memberActive(remote.member)) return;
    var current = app.getState && app.getState() || {};
    var next = Object.assign({}, app.defaults ? app.defaults() : {}, {
      pub: remote.pub || { name: '', licence: '', dps: '', address: '' },
      currentUser: currentStaffId(),
      users: staffToUsers(),
      areas: remote.workAreas.map(function (area) { return area.name || area.title || area.id; }).filter(Boolean),
      docs: remote.premisesDocuments.map(function (doc) {
        return Object.assign({ status: doc.status || (doc.imageId || doc.fileData || doc.fileUrl ? 'Stored' : 'Missing') }, doc, { id: doc.id, cat: doc.cat || doc.category || 'Licensing' });
      }),
      checks: remote.checks.map(function (check) { return Object.assign({}, check, { id: check.id }); }),
      done: remote.checkCompletions.map(function (item) { return Object.assign({}, item, { id: item.id, checkId: item.checkId || item.checkID }); }),
      issues: remote.issues.filter(function (item) { return item.recordKind !== 'log'; }).map(function (item) { return Object.assign({}, item, { id: item.id }); }),
      logs: remote.issues.filter(function (item) { return item.recordKind === 'log'; }).map(function (item) { return Object.assign({}, item, { id: item.id }); }),
      userRequiredDocuments: flattenStaffDocuments(),
      training: flattenTraining(),
      permissionMatrix: permissionMatrixFromRemote(),
      documentCategories: Array.from(new Set(remote.documentRequirements.map(function (req) { return req.category; }).filter(Boolean).concat((current.documentCategories || []).filter(function (cat) { return cat !== 'Staff'; })))),
      rotaSettings: Object.assign({}, current.rotaSettings || {}, { sections: remote.workAreas.map(function (area) { return area.name || area.title || area.id; }).filter(Boolean) }),
      shoppingItems: current.shoppingItems || []
    });
    writeJSON(REQ_KEY, remote.documentRequirements);
    applyingRemote = true;
    try {
      app.replaceState(next, { render: true });
      setStatus('Synced structured Firebase data');
    } finally {
      applyingRemote = false;
    }
  }

  function staffToUsers() {
    var byStaffId = {};
    remote.staff.forEach(function (staff) { byStaffId[staff.id] = staff; });
    var byUid = {};
    if (remote.member) byUid[remote.member.uid || authUser.uid] = remote.member;
    return remote.staff.map(function (staff) {
      var member = remote.member && remote.member.staffId === staff.id ? remote.member : null;
      return Object.assign({}, staff, {
        id: staff.id,
        authUid: staff.authUid || member && member.uid || '',
        memberUid: member && member.uid || staff.authUid || '',
        name: staff.name || staff.displayName || '',
        nickname: staff.nickname || staff.displayName || staff.name || '',
        role: member && member.role || staff.role || staff.permissionSetId || 'Staff',
        permissionSetId: member && member.permissionSetId || staff.permissionSetId || staff.role || 'Staff',
        area: staff.area || staff.jobArea || '',
        active: member ? member.active !== false : staff.active !== false,
        archived: member ? member.archived === true : staff.archived === true
      });
    });
  }

  function flattenStaffDocuments() {
    return Object.keys(remote.staffDocuments).reduce(function (all, staffId) {
      return all.concat((remote.staffDocuments[staffId] || []).map(function (doc) {
        return Object.assign({}, doc, { id: doc.id, userId: staffId });
      }));
    }, []);
  }

  function flattenTraining() {
    return remote.staff.reduce(function (all, staff) {
      return all.concat((staff.training || []).map(function (item) { return Object.assign({ id: safeSegment(staff.id + '-' + (item.course || item.title || 'training')), userId: staff.id }, item); }));
    }, []);
  }

  function readRotaLocal() {
    return readJSON(ROTA_KEY, { shifts: [], sections: [] });
  }

  function writeRotaLocal(shifts) {
    var rota = readRotaLocal();
    rota.shifts = shifts || [];
    writeJSON(ROTA_KEY, rota);
  }

  function queueStateSave() {
    if (applyingRemote || !ready || !authUser || accessMode !== 'member') return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCloudStateNow, 700);
  }

  function saveCloudStateNow() {
    if (applyingRemote || !ready || !authUser || accessMode !== 'member') return Promise.resolve();
    var app = api();
    var state = app && app.getState && app.getState();
    if (!state) return Promise.resolve();
    setStatus('Saving structured data');
    return persistState(state)
      .then(function () { setStatus('Synced structured Firebase data'); })
      .catch(function (error) { setStatus('Firebase save failed', error && error.message || String(error)); });
  }

  function persistState(state) {
    var batch = services.writeBatch(services.db);
    var remoteDeletes = [];
    var canManageSettings = hasPermission('settings.manage') || hasPermission('pub.manage');
    var canManagePermissions = hasPermission('permissions.manage');
    var canManageDocs = hasPermission('documents.managePremises') || hasPermission('premisesDocs.manage');
    var canManageStaffDocs = hasPermission('documents.manageStaff') || hasPermission('staffDocs.manage');
    var canUploadOwnDocs = hasPermission('documents.uploadOwn') || hasPermission('staffDocs.viewOwn');
    var canManageChecks = hasPermission('checks.create') || hasPermission('checks.manage');
    var canManageUsers = hasPermission('users.edit');
    var canCompleteChecks = hasPermission('checks.complete');
    var canManageIssues = hasPermission('issues.manage');
    var canCreateIssues = hasPermission('issues.create');

    if (canManageSettings) {
      var pubRecord = Object.assign({}, state.pub || {});
      delete pubRecord.logoData;
      batch.set(pubRef(), clean(Object.assign({}, pubRecord, { updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    }
    if (canManagePermissions) writePermissionSets(batch, state.permissionMatrix || {});
    if (canManageSettings || hasPermission('workAreas.manage')) writeWorkAreas(batch, state.areas || []);
    if (canManageDocs) writePremisesDocuments(batch, state.docs || []);
    if (canManageStaffDocs) writeDocumentRequirements(batch);
    if (canManageStaffDocs || canUploadOwnDocs) writeStaffDocuments(batch, state.userRequiredDocuments || [], canManageStaffDocs);
    if (canManageChecks) writeChecks(batch, state.checks || []);
    if (canManageUsers) writeStaffProfiles(batch, state.users || []);
    if (canCompleteChecks) writeCheckCompletions(batch, state.done || []);
    if (canManageIssues || canCreateIssues) writeIssues(batch, state.issues || [], state.logs || []);
    if (hasPermission('rota.manage')) writeRota(batch, readRotaLocal().shifts || []);
    return batch.commit().then(function () {
      return Promise.all(remoteDeletes);
    });
  }

  function writePermissionSets(batch, matrix) {
    Object.keys(matrix).forEach(function (id) {
      var value = Object.assign({}, matrix[id] || {});
      var description = value.description || '';
      delete value.description;
      batch.set(services.doc(services.db, 'pubs', pubId(), 'permissionSets', id), clean({ id: id, description: description, permissions: normalizePermissionMap(value), updatedAt: services.serverTimestamp(), updatedBy: authUser.uid }), { merge: true });
    });
  }

  function writeWorkAreas(batch, areas) {
    areas.filter(Boolean).forEach(function (name, index) {
      var id = stableId(name, 'area-' + index);
      batch.set(services.doc(services.db, 'pubs', pubId(), 'workAreas', id), clean({ id: id, name: name, order: index, updatedAt: services.serverTimestamp(), updatedBy: authUser.uid }), { merge: true });
    });
  }

  function writePremisesDocuments(batch, docs) {
    docs.forEach(function (doc) {
      var id = doc.id || stableId(doc.title, 'premises-document');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'premisesDocuments', id), clean(Object.assign({}, firestoreEvidenceRecord(doc), { id: id, category: doc.cat || doc.category || '', updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
  }

  function firestoreEvidenceRecord(record) {
    var out = Object.assign({}, record || {});
    delete out.fileData;
    delete out.fileUrl;
    delete out.downloadUrl;
    delete out.storagePath;
    delete out.storageRef;
    return out;
  }

  function scrubFilePayloads(value) {
    if (Array.isArray(value)) return value.map(scrubFilePayloads);
    if (!value || typeof value !== 'object') return value;
    var out = {};
    Object.keys(value).forEach(function (key) {
      if (['fileData', 'fileUrl', 'downloadUrl', 'storagePath', 'storageRef'].indexOf(key) !== -1) return;
      out[key] = scrubFilePayloads(value[key]);
    });
    return out;
  }

  function writeStaffDocuments(batch, records, allowAllStaff) {
    (Array.isArray(records) ? records : []).forEach(function (record) {
      var targetStaffId = safeSegment(record.userId || record.staffId || currentStaffId());
      if (!allowAllStaff && targetStaffId !== currentStaffId()) return;
      var id = record.id || record.requirementId || stableId([targetStaffId, record.title || record.requirementId || 'staff-document'].join('-'), 'staff-document');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'staff', targetStaffId, 'documents', id), clean(Object.assign({}, firestoreEvidenceRecord(record), {
        id: id,
        userId: targetStaffId,
        staffId: targetStaffId,
        updatedAt: services.serverTimestamp(),
        updatedBy: authUser.uid
      })), { merge: true });
    });
  }

  function writeDocumentRequirements(batch) {
    var reqs = readJSON(REQ_KEY, []);
    (Array.isArray(reqs) ? reqs : []).forEach(function (req) {
      var id = req.id || stableId(req.title, 'requirement');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'documentRequirements', id), clean(Object.assign({}, req, { id: id, updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
    var groups = readJSON(GROUP_KEY, []);
    batch.set(pubRef(), clean({ staffDocumentGroups: Array.isArray(groups) ? groups : [], updatedAt: services.serverTimestamp() }), { merge: true });
  }

  function writeChecks(batch, checks) {
    checks.forEach(function (check) {
      var id = check.id || stableId(check.title, 'check');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'checks', id), clean(Object.assign({}, check, { id: id, updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
  }

  function writeStaffProfiles(batch, users) {
    users.filter(function (user) { return user.authUid || user.memberUid; }).forEach(function (user) {
      var staffId = user.id || user.authUid || user.memberUid;
      var memberUid = user.authUid || user.memberUid;
      batch.set(services.doc(services.db, 'pubs', pubId(), 'staff', staffId), clean(Object.assign({}, user, { id: staffId, authUid: memberUid, displayName: user.name || user.nickname || '', updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
      if (memberUid && memberUid !== authUser.uid) {
        batch.set(services.doc(services.db, 'pubs', pubId(), 'members', memberUid), clean({
          uid: memberUid,
          staffId: staffId,
          displayName: user.name || user.nickname || '',
          role: user.role || user.permissionSetId || 'Staff',
          permissionSetId: user.permissionSetId || user.role || 'Staff',
          workAreaIds: user.area ? [stableId(user.area)] : [],
          active: user.active !== false,
          archived: user.archived === true,
          updatedAt: services.serverTimestamp(),
          updatedBy: authUser.uid
        }), { merge: true });
      }
    });
  }

  function writeCheckCompletions(batch, completions) {
    completions.forEach(function (item) {
      if (!hasPermission('checks.viewAll') && item.userId !== currentStaffId()) return;
      var id = item.id || stableId([item.checkId, item.userId, item.date, item.at].join('-'), 'completion');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'checkCompletions', id), clean(Object.assign({}, scrubFilePayloads(item), { id: id, userId: item.userId || currentStaffId(), updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
  }

  function writeIssues(batch, issues, logs) {
    issues.forEach(function (issue) {
      var id = issue.id || stableId(issue.title, 'issue');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'issues', id), clean(Object.assign({}, issue, { id: id, recordKind: 'issue', updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
    logs.forEach(function (log) {
      var id = log.id || stableId([log.type, log.summary, log.created].join('-'), 'log');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'issues', id), clean(Object.assign({}, log, { id: id, recordKind: 'log', updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
  }

  function writeRota(batch, shifts) {
    shifts.forEach(function (shift) {
      var id = shift.id || stableId([shift.userId, shift.date, shift.start].join('-'), 'shift');
      batch.set(services.doc(services.db, 'pubs', pubId(), 'rota', id), clean(Object.assign({}, shift, { id: id, updatedAt: services.serverTimestamp(), updatedBy: authUser.uid })), { merge: true });
    });
  }

  function fallbackFileRecord(file) {
    if (options().production && options().allowLocalFallback !== true) {
      return Promise.reject(new Error('Upload failed. Check connection.'));
    }
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve({ fileName: file.name || 'File', fileType: file.type || '', fileSize: file.size || 0, fileData: reader.result || '', uploadedAt: nowISO(), storageMode: 'local' });
      };
      reader.onerror = function () { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      if (!canvas || typeof canvas.toBlob !== 'function') return resolve(null);
      canvas.toBlob(function (blob) { resolve(blob || null); }, type, quality);
    });
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Compression failed.')); };
      reader.readAsDataURL(blob);
    });
  }

  function loadImageForCompression(file) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      var url = URL.createObjectURL(file);
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Compression failed.'));
      };
      image.src = url;
    });
  }

  function imageCanvas(file, maxWidth, maxHeight, scaleMultiplier) {
    scaleMultiplier = scaleMultiplier || 1;
    return loadImageForCompression(file).then(function (image) {
      var scale = Math.min(1, maxWidth / image.width, maxHeight / image.height) * scaleMultiplier;
      var width = Math.max(1, Math.round(image.width * scale));
      var height = Math.max(1, Math.round(image.height * scale));
      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext('2d');
      if (!context) throw new Error('Compression failed.');
      context.drawImage(image, 0, 0, width, height);
      return { canvas: canvas, width: width, height: height };
    });
  }

  function smallestBlob(candidates) {
    return candidates.filter(Boolean).sort(function (a, b) { return a.blob.size - b.blob.size; })[0] || null;
  }

  function compressImageForFirestore(file) {
    if (!file || !String(file.type || '').startsWith('image/')) {
      return Promise.reject(new Error('Image too large. Retake closer/crop document.'));
    }
    var targetBytes = 650 * 1024;
    var hardLimitBytes = 900 * 1024;
    var qualitySteps = [0.55, 0.5, 0.45, 0.4, 0.35];
    var scaleSteps = [1, 0.9, 0.8];
    var best = null;

    function attemptAtScale(scaleIndex) {
      if (scaleIndex >= scaleSteps.length) {
        if (!best || best.blob.size > hardLimitBytes) throw new Error('Image too large. Retake closer/crop document.');
        return best;
      }
      return imageCanvas(file, 1200, 1600, scaleSteps[scaleIndex]).then(function (rendered) {
        var chain = Promise.resolve();
        qualitySteps.forEach(function (quality) {
          chain = chain.then(function () {
            return Promise.all([
              canvasToBlob(rendered.canvas, 'image/jpeg', quality),
              canvasToBlob(rendered.canvas, 'image/webp', quality)
            ]).then(function (blobs) {
              var candidate = smallestBlob(blobs.map(function (blob) {
                return blob ? { blob: blob, width: rendered.width, height: rendered.height, quality: quality, type: blob.type || 'image/jpeg' } : null;
              }));
              if (candidate && (!best || candidate.blob.size < best.blob.size)) best = candidate;
              if (best && best.blob.size <= targetBytes) throw best;
            });
          });
        });
        return chain.then(function () {
          if (best && best.blob.size <= targetBytes) return best;
          return attemptAtScale(scaleIndex + 1);
        });
      }).catch(function (error) {
        if (error && error.blob) return error;
        throw error;
      });
    }

    return attemptAtScale(0).then(function (result) {
      if (!result || !result.blob) throw new Error('Compression failed.');
      if (result.blob.size > hardLimitBytes) throw new Error('Image too large. Retake closer/crop document.');
      return blobToDataUrl(result.blob).then(function (dataUrl) {
        return Object.assign({}, result, { dataUrl: dataUrl });
      });
    }).catch(function (error) {
      if (error && error.message === 'Image too large. Retake closer/crop document.') throw error;
      throw new Error('Compression failed.');
    });
  }

  function imageChunks(dataUrl) {
    var comma = dataUrl.indexOf(',');
    var prefix = comma === -1 ? 'data:image/jpeg;base64,' : dataUrl.slice(0, comma + 1);
    var payload = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
    var size = 350000;
    var chunks = [];
    for (var index = 0; index < payload.length; index += size) chunks.push(payload.slice(index, index + size));
    return { prefix: prefix, payload: payload, chunks: chunks };
  }

  function firestoreImageKind(uploadOptions) {
    if (uploadOptions.kind === 'pub' || uploadOptions.kind === 'pub-logo' || uploadOptions.folder === 'pub-branding') return 'pub';
    if (uploadOptions.kind === 'userdoc' || uploadOptions.folder === 'staff-documents') return 'userdoc';
    if (uploadOptions.kind === 'premises' || uploadOptions.folder === 'documents') return 'premises';
    return 'check';
  }

  function uploadFirestoreImage(file, uploadOptions) {
    uploadOptions = uploadOptions || {};
    if (!ready || !services.db || !authUser || !pubId()) return fallbackFileRecord(file);
    var kind = firestoreImageKind(uploadOptions);
    var documentId = safeSegment(uploadOptions.documentId || uploadOptions.requirementId || uploadOptions.completionId || 'document');
    var ownerStaffId = safeSegment(uploadOptions.staffId || uploadOptions.userId || currentStaffId());
    var imageId = safeSegment([Date.now(), documentId, Math.random().toString(36).slice(2, 8)].join('-'));
    setStatus('Compressing image');
    return compressImageForFirestore(file).then(function (compressed) {
      var parts = imageChunks(compressed.dataUrl);
      if (!parts.chunks.length) throw new Error('Compression failed.');
      var batch = services.writeBatch(services.db);
      var metaRef = services.doc(services.db, 'pubs', pubId(), 'documentImages', imageId);
      batch.set(metaRef, clean({
        id: imageId,
        kind: kind,
        documentId: documentId,
        ownerStaffId: ownerStaffId,
        chunkCount: parts.chunks.length,
        imageCount: parts.chunks.length,
        chunkSize: 350000,
        dataPrefix: parts.prefix,
        base64Length: parts.payload.length,
        fileName: file.name || 'Document photo',
        fileType: compressed.blob.type || 'image/jpeg',
        fileSize: compressed.blob.size,
        originalFileSize: file.size || 0,
        width: compressed.width,
        height: compressed.height,
        quality: compressed.quality,
        storageMode: 'firestore-images',
        archived: false,
        uploadedAt: services.serverTimestamp(),
        uploadedBy: authUser.uid,
        updatedAt: services.serverTimestamp(),
        updatedBy: authUser.uid
      }));
      parts.chunks.forEach(function (chunk, index) {
        var chunkId = String(index).padStart(4, '0');
        batch.set(services.doc(services.db, 'pubs', pubId(), 'documentImages', imageId, 'chunks', chunkId), clean({
          imageId: imageId,
          index: index,
          data: chunk,
          createdAt: services.serverTimestamp(),
          uploadedBy: authUser.uid
        }));
      });
      setStatus('Uploading compressed image');
      return batch.commit().then(function () {
        setStatus('Image uploaded');
        return {
          imageId: imageId,
          imageCount: parts.chunks.length,
          uploadedAt: nowISO(),
          uploadedBy: authUser.uid,
          fileName: file.name || 'Document photo',
          fileType: compressed.blob.type || 'image/jpeg',
          fileSize: compressed.blob.size,
          originalFileSize: file.size || 0,
          imageWidth: compressed.width,
          imageHeight: compressed.height,
          storageMode: 'firestore-images'
        };
      });
    }).catch(function (error) {
      if (error && error.message === 'Image too large. Retake closer/crop document.') throw error;
      if (error && error.message === 'Compression failed.') throw error;
      throw new Error('Upload failed. Check connection.');
    });
  }

  function uploadFile(file, uploadOptions) {
    uploadOptions = uploadOptions || {};
    if (!file) return Promise.resolve(null);
    return uploadFirestoreImage(file, uploadOptions);
  }

  function resolveImage(imageId) {
    if (!imageId) return Promise.reject(new Error('No image available.'));
    if (!ready || !services.db || !authUser || !pubId()) return Promise.reject(new Error('Upload failed. Check connection.'));
    var metaRef = services.doc(services.db, 'pubs', pubId(), 'documentImages', safeSegment(imageId));
    return services.getDoc(metaRef).then(function (metaSnap) {
      if (!metaSnap.exists()) throw new Error('No image available.');
      var meta = metaSnap.data() || {};
      if (meta.archived === true) throw new Error('No image available.');
      var chunkRef = services.query(services.collection(services.db, 'pubs', pubId(), 'documentImages', safeSegment(imageId), 'chunks'), services.orderBy('index'));
      return services.getDocs(chunkRef).then(function (chunkSnap) {
        var chunks = [];
        chunkSnap.forEach(function (doc) {
          var data = doc.data() || {};
          chunks.push({ index: Number(data.index || 0), data: String(data.data || '') });
        });
        chunks.sort(function (a, b) { return a.index - b.index; });
        if (!chunks.length || (meta.chunkCount && chunks.length < meta.chunkCount)) throw new Error('Upload failed. Check connection.');
        return Object.assign({}, meta, {
          id: imageId,
          dataUrl: String(meta.dataPrefix || 'data:image/jpeg;base64,') + chunks.map(function (chunk) { return chunk.data; }).join('')
        });
      });
    });
  }

  function archiveImage(imageId) {
    if (!imageId || !ready || !services.db || !authUser || !pubId()) return Promise.resolve(false);
    return services.setDoc(services.doc(services.db, 'pubs', pubId(), 'documentImages', safeSegment(imageId)), clean({
      archived: true,
      archivedAt: services.serverTimestamp(),
      archivedBy: authUser.uid,
      updatedAt: services.serverTimestamp(),
      updatedBy: authUser.uid
    }), { merge: true }).then(function () { return true; }).catch(function () { return false; });
  }

  function signIn(email, password) {
    if (!ready || !services.auth) return Promise.reject(new Error('Firebase is not ready.'));
    setStatus('Signing in');
    return services.signInWithEmailAndPassword(services.auth, email, password);
  }

  function signOutUser() {
    if (!ready || !services.auth) return Promise.resolve();
    return services.signOut(services.auth);
  }

  function callFunction(name, payload) {
    return Promise.reject(new Error('This Spark build does not include browser-triggered admin backend actions.'));
  }

  function createPubUser(payload) {
    payload = Object.assign({ pubId: pubId() }, payload || {});
    return callFunction('createPubUser', payload);
  }

  function createPub(payload) {
    payload = Object.assign({ pubId: pubId() }, payload || {});
    if (!ready || !services.db || !authUser || !pubId()) return Promise.reject(new Error('Firebase is not ready.'));
    if (!isSetupAdmin()) return Promise.reject(new Error('Only an approved setup admin can create the first pub.'));
    var batch = services.writeBatch(services.db);
    var setupStaffId = authUser.uid;
    var displayName = authUser.displayName || authUser.email || 'Setup Admin';
    batch.set(pubRef(), clean({
      id: pubId(),
      name: payload.name || 'New Pub',
      licence: payload.licence || '',
      dps: payload.dps || '',
      address: payload.address || '',
      setupComplete: false,
      createdAt: services.serverTimestamp(),
      createdBy: authUser.uid,
      updatedAt: services.serverTimestamp(),
      updatedBy: authUser.uid
    }));
    Object.keys(DEFAULT_PERMISSION_SETS).forEach(function (id) {
      batch.set(services.doc(services.db, 'pubs', pubId(), 'permissionSets', id), clean(Object.assign({ id: id, updatedAt: services.serverTimestamp(), updatedBy: authUser.uid }, DEFAULT_PERMISSION_SETS[id])), { merge: true });
    });
    batch.set(services.doc(services.db, 'pubs', pubId(), 'members', authUser.uid), clean({
      uid: authUser.uid,
      pubId: pubId(),
      staffId: setupStaffId,
      email: authUser.email || '',
      displayName: displayName,
      role: 'Owner',
      permissionSetId: 'Owner',
      workAreaIds: [],
      active: true,
      archived: false,
      setupAdmin: true,
      createdAt: services.serverTimestamp(),
      createdBy: authUser.uid,
      updatedAt: services.serverTimestamp(),
      updatedBy: authUser.uid
    }));
    batch.set(services.doc(services.db, 'pubs', pubId(), 'staff', setupStaffId), clean({
      id: setupStaffId,
      authUid: authUser.uid,
      email: authUser.email || '',
      name: displayName,
      nickname: displayName.split(/\s+/)[0] || 'Setup',
      role: 'Owner',
      permissionSetId: 'Owner',
      accountStatus: 'confirmed',
      active: true,
      archived: false,
      createdAt: services.serverTimestamp(),
      createdBy: authUser.uid,
      updatedAt: services.serverTimestamp(),
      updatedBy: authUser.uid
    }));
    batch.set(services.doc(services.db, 'pubs', pubId(), 'auditLogs', safeSegment(Date.now() + '-pub-created')), clean({
      type: 'pub.created',
      actorUid: authUser.uid,
      actorEmail: authUser.email || '',
      details: { pubId: pubId(), name: payload.name || 'New Pub' },
      createdAt: services.serverTimestamp()
    }));
    return batch.commit().then(function () { return { pubId: pubId(), uid: authUser.uid, staffId: setupStaffId }; });
  }

  function archivePubUser(payload) {
    payload = Object.assign({ pubId: pubId() }, payload || {});
    return callFunction('archivePubUser', payload);
  }

  function importLegacyState(payload) {
    payload = Object.assign({ pubId: pubId(), legacyState: api() && api().getState && api().getState(), extraStorage: { rota: readRotaLocal(), requirements: readJSON(REQ_KEY, []), groups: readJSON(GROUP_KEY, []) } }, payload || {});
    return callFunction('importLegacyPubState', payload);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function ensureStyle() {
    if (document.getElementById('firebase-structured-style')) return;
    var style = document.createElement('style');
    style.id = 'firebase-structured-style';
    style.textContent = '.firebaseStatusBar{position:sticky;top:var(--fixed-topbar-height,0);z-index:3000;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 12px;background:#071522;color:#fff8ea;border-bottom:1px solid rgba(208,173,88,.38);font-size:12px;font-weight:800}.firebaseStatusBar button{min-height:32px!important;height:32px!important;padding:0 10px!important;border-radius:999px!important}.firebaseStatusBar small{display:block;color:#d0ad58;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.firebaseGate{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:18px;background:rgba(3,8,12,.86);backdrop-filter:blur(8px)}.firebaseGate.hidden{display:none!important}.firebaseGateCard{width:min(460px,100%);display:grid;gap:12px;padding:18px;border-radius:20px;background:#151b22;border:1px solid rgba(208,173,88,.5);color:#fff8ea;box-shadow:0 28px 70px rgba(0,0,0,.35)}.firebaseGateCard h2{margin:0;color:#fff8ea}.firebaseGateForm{display:grid;gap:10px}.firebaseGateForm input,.firebaseGateForm textarea{width:100%;box-sizing:border-box}.firebaseGateActions{display:grid;grid-template-columns:1fr;gap:8px}.firebaseError{margin:0;color:#ff8b80;font-weight:800}.firebaseSetupMissing{color:#aaa194}.firebaseSmallText{font-size:12px;color:#aaa194;margin:0}';
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
    var cfgReady = hasUsableConfig(currentConfig()) && !!pubId();
    if (!cfgReady) {
      els.bar.innerHTML = '<span><strong>Firebase config missing</strong><small>Set src/firebase/config.js with project config and pubId</small></span>';
      els.gate.classList.toggle('hidden', options().allowLocalFallback === true);
      els.gate.innerHTML = options().allowLocalFallback === true ? '' : '<div class="firebaseGateCard"><h2>Firebase Setup Required</h2><p class="firebaseSetupMissing">This production build needs Firebase config and COMPLIANCE_FIREBASE_PUB_ID in src/firebase/config.js before staff can sign in.</p></div>';
      return;
    }
    if (!ready) {
      els.bar.innerHTML = '<span><strong>Firebase</strong><small>' + escapeHtml(statusText) + '</small></span>';
      els.gate.classList.add('hidden');
      return;
    }
    if (!authUser) {
      els.bar.innerHTML = '<span><strong>Firebase</strong><small>Sign in required</small></span>';
      els.gate.classList.remove('hidden');
      els.gate.innerHTML = '<div class="firebaseGateCard"><h2>Sign In</h2><form id="firebaseAuthForm" class="firebaseGateForm"><input name="email" type="email" placeholder="Email" autocomplete="email" required><input name="password" type="password" placeholder="Password" autocomplete="current-password" required><div class="firebaseGateActions"><button class="primary">Sign In</button></div></form>' + (lastError ? '<p class="firebaseError">' + escapeHtml(lastError) + '</p>' : '') + '</div>';
      bindAuthForm();
      return;
    }
    els.bar.innerHTML = '<span><strong>' + escapeHtml(authUser.email || 'Signed in') + '</strong><small>' + escapeHtml(statusText) + '</small></span><button type="button" class="ghost small" data-firebase-signout>Sign Out</button>';
    bindSignOut();
    if (accessMode === 'setup') return renderSetupGate(els.gate);
    if (accessMode === 'no-pub') return renderMessageGate(els.gate, 'Pub Not Set Up', 'This pub has not been created yet. Ask the approved setup admin to sign in.');
    if (accessMode === 'no-member') return renderMessageGate(els.gate, 'No Pub Access', 'This Firebase account is not an active member of this pub.');
    if (accessMode === 'archived') return renderMessageGate(els.gate, 'Account Archived', 'This account has been archived and cannot access the app.');
    els.gate.classList.add('hidden');
    els.gate.innerHTML = '';
  }

  function renderMessageGate(gate, title, message) {
    gate.classList.remove('hidden');
    gate.innerHTML = '<div class="firebaseGateCard"><h2>' + escapeHtml(title) + '</h2><p class="firebaseSetupMissing">' + escapeHtml(message) + '</p></div>';
  }

  function renderSetupGate(gate) {
    gate.classList.remove('hidden');
    gate.innerHTML = '<div class="firebaseGateCard"><h2>Create Pub</h2><p class="firebaseSmallText">Approved setup admin only. This creates the pub, default permission sets and your setup member record.</p><form id="firebaseCreatePubForm" class="firebaseGateForm"><input name="name" placeholder="Pub name" required><input name="licence" placeholder="Premises licence number"><input name="dps" placeholder="DPS name"><textarea name="address" placeholder="Pub address"></textarea><button class="primary">Create Pub</button></form>' + (lastError ? '<p class="firebaseError">' + escapeHtml(lastError) + '</p>' : '') + '</div>';
    var form = document.getElementById('firebaseCreatePubForm');
    if (form) form.onsubmit = function (event) {
      event.preventDefault();
      var data = new FormData(form);
      createPub({ name: data.get('name'), licence: data.get('licence'), dps: data.get('dps'), address: data.get('address') })
        .then(function () { setStatus('Pub created'); startListening(); })
        .catch(function (error) { setStatus('Pub setup failed', error && error.message || String(error)); });
    };
  }

  function bindAuthForm() {
    var form = document.getElementById('firebaseAuthForm');
    if (!form) return;
    form.onsubmit = function (event) {
      event.preventDefault();
      signIn(String(form.elements.email.value || '').trim(), String(form.elements.password.value || ''))
        .catch(function (error) { setStatus('Authentication failed', error && error.message || String(error)); });
    };
  }

  function bindSignOut() {
    document.querySelectorAll('[data-firebase-signout]').forEach(function (button) {
      button.onclick = signOutUser;
    });
  }

  function initFirebase() {
    configured = hasUsableConfig(currentConfig()) && !!pubId();
    renderAuthUI();
    if (!configured) return;
    setStatus('Connecting to Firebase');
    Promise.all([
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-firestore.js')
    ]).then(function (modules) {
      var appMod = modules[0], authMod = modules[1], firestoreMod = modules[2];
      var app = appMod.initializeApp(currentConfig());
      services.app = app;
      services.auth = authMod.getAuth(app);
      services.db = firestoreMod.getFirestore(app);
      services.doc = firestoreMod.doc;
      services.collection = firestoreMod.collection;
      services.query = firestoreMod.query;
      services.where = firestoreMod.where;
      services.orderBy = firestoreMod.orderBy;
      services.getDoc = firestoreMod.getDoc;
      services.getDocs = firestoreMod.getDocs;
      services.setDoc = firestoreMod.setDoc;
      services.onSnapshot = firestoreMod.onSnapshot;
      services.writeBatch = firestoreMod.writeBatch;
      services.serverTimestamp = firestoreMod.serverTimestamp;
      services.signInWithEmailAndPassword = authMod.signInWithEmailAndPassword;
      services.signOut = authMod.signOut;
      ready = true;
      setStatus('Firebase ready');
      authMod.onAuthStateChanged(services.auth, function (user) {
        authUser = user || null;
        authClaims = {};
        if (!authUser) {
          stopAll();
          accessMode = 'signed-out';
          setStatus('Sign in required');
          renderAuthUI();
          return;
        }
        authUser.getIdTokenResult().then(function (result) {
          authClaims = result.claims || {};
          startListening();
        }).catch(function () {
          startListening();
        });
      });
    }).catch(function (error) {
      ready = false;
      setStatus('Firebase failed to load', error && error.message || String(error));
    });
  }

  window.ComplianceFirebase = {
    queueStateSave: queueStateSave,
    saveNow: saveCloudStateNow,
    uploadFile: uploadFile,
    resolveImage: resolveImage,
    archiveImage: archiveImage,
    fallbackFileRecord: fallbackFileRecord,
    createPubUser: createPubUser,
    createPub: createPub,
    archivePubUser: archivePubUser,
    importLegacyState: importLegacyState,
    signOut: signOutUser,
    hasPermission: hasPermission,
    isApplyingRemote: function () { return applyingRemote; },
    isSignedIn: function () { return !!authUser; },
    currentUser: function () { return authUser; },
    member: function () { return remote.member; },
    pubId: pubId,
    hasConfig: function () { return hasUsableConfig(currentConfig()); },
    status: function () { return { ready: ready, configured: configured, signedIn: !!authUser, text: statusText, error: lastError, pubId: pubId(), accessMode: accessMode, storageMode: options().storageMode || 'firestore-images' }; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFirebase);
  else initFirebase();
})();
