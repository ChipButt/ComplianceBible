"use strict";

const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2/options");

admin.initializeApp();
setGlobalOptions({ region: process.env.FUNCTIONS_REGION || "europe-west2" });

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

const ALL_PERMISSION_KEYS = [
  "settings.manage",
  "users.create",
  "users.edit",
  "users.archive",
  "permissions.manage",
  "documents.managePremises",
  "documents.manageStaff",
  "documents.uploadOwn",
  "documents.viewOwn",
  "documents.viewAll",
  "checks.create",
  "checks.complete",
  "checks.viewAll",
  "rota.manage",
  "rota.viewOwn",
  "issues.create",
  "issues.manage",
  "audit.view",
  "settings.view",
  "pub.manage",
  "premisesDocs.view",
  "premisesDocs.manage",
  "staffDocs.viewOwn",
  "staffDocs.viewAll",
  "staffDocs.manage",
  "checks.manage",
  "rota.view",
  "issues.view",
  "issues.resolve",
  "shopping.manage",
  "inspection.view",
  "inspection.export",
  "workAreas.view",
  "workAreas.manage"
];

const PERMISSION_ALIASES = {
  "settings.manage": ["settings.manage", "pub.manage"],
  "permissions.manage": ["permissions.manage", "settings.managePermissionGroups"],
  "users.create": ["users.create", "users.manage"],
  "users.edit": ["users.edit", "users.manage"],
  "users.archive": ["users.archive", "users.manage"],
  "documents.managePremises": ["documents.managePremises", "premisesDocs.manage"],
  "documents.manageStaff": ["documents.manageStaff", "staffDocs.manage"],
  "documents.uploadOwn": ["documents.uploadOwn", "staffDocs.viewOwn"],
  "documents.viewOwn": ["documents.viewOwn", "staffDocs.viewOwn"],
  "documents.viewAll": ["documents.viewAll", "staffDocs.viewAll"],
  "checks.create": ["checks.create", "checks.manage"],
  "checks.complete": ["checks.complete", "checks.viewAll"],
  "rota.viewOwn": ["rota.viewOwn", "rota.view"],
  "issues.create": ["issues.create", "issues.view"],
  "issues.manage": ["issues.manage", "issues.resolve"],
  "audit.view": ["audit.view"]
};

const FULL_ACCESS_ROLES = new Set(["owner", "admin", "manager"]);

const FULL_ACCESS_PERMISSIONS = ALL_PERMISSION_KEYS.reduce((out, key) => {
  out[key] = true;
  return out;
}, { "*": true });

const DEFAULT_PERMISSION_SETS = {
  Owner: {
    description: "Full owner access",
    permissions: FULL_ACCESS_PERMISSIONS
  },
  Admin: {
    description: "Full admin access",
    permissions: FULL_ACCESS_PERMISSIONS
  },
  Manager: {
    description: "Full manager access",
    permissions: FULL_ACCESS_PERMISSIONS
  },
  Supervisor: {
    description: "Operational access without user/security administration",
    permissions: {
      "settings.view": true,
      "documents.uploadOwn": true,
      "documents.viewOwn": true,
      "documents.viewAll": true,
      "premisesDocs.view": true,
      "staffDocs.viewOwn": true,
      "staffDocs.viewAll": true,
      "checks.complete": true,
      "checks.viewAll": true,
      "rota.viewOwn": true,
      "rota.view": true,
      "issues.create": true,
      "issues.view": true,
      "issues.manage": true,
      "issues.resolve": true,
      "shopping.manage": true,
      "inspection.view": true,
      "workAreas.view": true
    }
  },
  Staff: {
    description: "Own checks, documents, rota and issue reporting",
    permissions: {
      "documents.uploadOwn": true,
      "documents.viewOwn": true,
      "staffDocs.viewOwn": true,
      "checks.complete": true,
      "rota.viewOwn": true,
      "rota.view": true,
      "issues.create": true,
      "workAreas.view": true
    }
  }
};

function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Sign in before using this action.");
  }
  return request.auth;
}

function safeSegment(value, fallback = "item") {
  const raw = String(value || fallback).trim();
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || fallback;
}

function assertPubId(value) {
  const pubId = String(value || "").trim();
  if (!pubId || pubId.includes("/") || pubId.length > 80) {
    throw new HttpsError("invalid-argument", "A valid pubId is required.");
  }
  return pubId;
}

function text(value, fallback = "") {
  return String(value == null ? fallback : value).trim();
}

function cleanForFirestore(value) {
  if (typeof value === "undefined") return null;
  if (value === null) return null;
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    const ctorName = value.constructor && value.constructor.name;
    if (/FieldValue|Timestamp|GeoPoint|DocumentReference|Transform/.test(String(ctorName || ""))) return value;
  }
  if (Array.isArray(value)) return value.map(cleanForFirestore);
  if (typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((key) => {
      if (typeof value[key] !== "undefined") out[key] = cleanForFirestore(value[key]);
    });
    return out;
  }
  return value;
}

function envSetupAdminEmails() {
  return String(process.env.SETUP_ADMIN_EMAILS || process.env.COMPLIANCE_SETUP_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isSetupAdminRequest(request) {
  if (!request.auth) return false;
  const token = request.auth.token || {};
  const email = String(token.email || "").toLowerCase();
  return token.setupAdmin === true || token.complianceSetupAdmin === true || envSetupAdminEmails().includes(email);
}

function pubRef(pubId) {
  return db.collection("pubs").doc(pubId);
}

function memberRef(pubId, uid) {
  return pubRef(pubId).collection("members").doc(uid);
}

function staffRef(pubId, staffId) {
  return pubRef(pubId).collection("staff").doc(staffId);
}

function activeMember(member) {
  return !!(member && member.active !== false && member.archived !== true);
}

function roleHasFullAccess(role) {
  return FULL_ACCESS_ROLES.has(String(role || "").toLowerCase());
}

function permissionSetFromDefault(permissionSetId) {
  const fallback = DEFAULT_PERMISSION_SETS[permissionSetId] || DEFAULT_PERMISSION_SETS.Staff;
  return cleanForFirestore({ id: permissionSetId || "Staff", ...fallback });
}

async function permissionSet(pubId, permissionSetId) {
  const id = permissionSetId || "Staff";
  const snap = await pubRef(pubId).collection("permissionSets").doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : permissionSetFromDefault(id);
}

function permissionsFromSet(set) {
  const map = { ...(set && set.permissions ? set.permissions : set || {}) };
  if (map["*"] === true) return map;
  Object.keys(PERMISSION_ALIASES).forEach((key) => {
    if (map[key] === true) return;
    if (PERMISSION_ALIASES[key].some((alias) => map[alias] === true)) map[key] = true;
  });
  return map;
}

async function getActiveMember(pubId, uid) {
  const snap = await memberRef(pubId, uid).get();
  const member = snap.exists ? { id: snap.id, ...snap.data() } : null;
  if (!activeMember(member)) {
    throw new HttpsError("permission-denied", "You are not an active member of this pub.");
  }
  return member;
}

async function hasPermission(pubId, member, key) {
  if (roleHasFullAccess(member.role)) return true;
  const set = await permissionSet(pubId, member.permissionSetId || member.role || "Staff");
  const permissions = permissionsFromSet(set);
  if (permissions["*"] === true) return true;
  const keys = PERMISSION_ALIASES[key] || [key];
  return keys.some((item) => permissions[item] === true);
}

async function requirePermission(pubId, request, key) {
  const actor = requireAuth(request);
  if (isSetupAdminRequest(request)) {
    const setupMemberSnap = await memberRef(pubId, actor.uid).get();
    if (setupMemberSnap.exists) {
      const setupMember = { id: setupMemberSnap.id, ...setupMemberSnap.data() };
      if (!activeMember(setupMember)) {
        throw new HttpsError("permission-denied", "This setup admin is archived for this pub.");
      }
      return { ...setupMember, setupAdmin: true };
    }
    return { uid: actor.uid, setupAdmin: true };
  }
  const member = await getActiveMember(pubId, actor.uid);
  if (!(await hasPermission(pubId, member, key))) {
    throw new HttpsError("permission-denied", "You do not have permission to perform this action.");
  }
  return member;
}

async function writeAudit(pubId, request, type, details = {}) {
  const actor = request.auth || {};
  await pubRef(pubId).collection("auditLogs").add(cleanForFirestore({
    type,
    actorUid: actor.uid || "",
    actorEmail: actor.token && actor.token.email || "",
    details,
    createdAt: FieldValue.serverTimestamp()
  }));
}

async function writeDefaultPermissionSets(writerOrBatch, pubId) {
  Object.keys(DEFAULT_PERMISSION_SETS).forEach((id) => {
    writerOrBatch.set(
      pubRef(pubId).collection("permissionSets").doc(id),
      cleanForFirestore({ id, ...DEFAULT_PERMISSION_SETS[id], updatedAt: FieldValue.serverTimestamp() }),
      { merge: true }
    );
  });
}

async function setComplianceClaims(uid, pubId, extraClaims = {}) {
  const user = await auth.getUser(uid);
  const claims = { ...(user.customClaims || {}) };
  const pubIds = Array.isArray(claims.compliancePubIds) ? claims.compliancePubIds.slice() : [];
  if (!pubIds.includes(pubId)) pubIds.push(pubId);
  await auth.setCustomUserClaims(uid, { ...claims, ...extraClaims, compliancePubIds: pubIds });
}

async function assertCanRemoveFullAccessMember(pubId, targetUid) {
  const target = await memberRef(pubId, targetUid).get();
  if (!target.exists) throw new HttpsError("not-found", "User member record not found.");
  const targetMember = { id: target.id, ...target.data() };
  if (!activeMember(targetMember)) return;

  const permissionSetsSnap = await pubRef(pubId).collection("permissionSets").get();
  const permissionSets = new Map();
  permissionSetsSnap.forEach((doc) => permissionSets.set(doc.id, { id: doc.id, ...doc.data() }));

  function memberFull(member) {
    if (roleHasFullAccess(member.role)) return true;
    const set = permissionSets.get(member.permissionSetId || member.role || "Staff") || permissionSetFromDefault(member.permissionSetId || member.role || "Staff");
    return permissionsFromSet(set)["*"] === true;
  }

  if (!memberFull(targetMember)) return;

  const membersSnap = await pubRef(pubId).collection("members").where("active", "==", true).get();
  const fullAccessMembers = [];
  membersSnap.forEach((doc) => {
    const member = { id: doc.id, ...doc.data() };
    if (member.archived !== true && memberFull(member)) fullAccessMembers.push(member);
  });
  if (fullAccessMembers.length <= 1) {
    throw new HttpsError("failed-precondition", "You cannot archive the last active owner/admin/manager.");
  }
}

function makeBatchWriter() {
  let batch = db.batch();
  let count = 0;
  const commits = [];

  function rotateIfNeeded() {
    if (count < 450) return;
    commits.push(batch.commit());
    batch = db.batch();
    count = 0;
  }

  return {
    set(ref, data, options) {
      batch.set(ref, cleanForFirestore(data), options);
      count += 1;
      rotateIfNeeded();
    },
    update(ref, data) {
      batch.update(ref, cleanForFirestore(data));
      count += 1;
      rotateIfNeeded();
    },
    async commit() {
      if (count) commits.push(batch.commit());
      await Promise.all(commits);
    }
  };
}

exports.createPub = onCall(async (request) => {
  const actor = requireAuth(request);
  if (!isSetupAdminRequest(request)) {
    throw new HttpsError("permission-denied", "Only an approved setup admin can create the first pub.");
  }
  const data = request.data || {};
  const pubId = assertPubId(data.pubId);
  const existing = await pubRef(pubId).get();
  if (existing.exists) {
    throw new HttpsError("already-exists", "This pub already exists.");
  }

  const setupStaffId = actor.uid;
  const actorEmail = actor.token && actor.token.email || "";
  const displayName = text(actor.token && actor.token.name, actorEmail || "Setup Admin");
  const batch = db.batch();
  batch.set(pubRef(pubId), cleanForFirestore({
    id: pubId,
    name: text(data.name, "New Pub"),
    licence: text(data.licence),
    dps: text(data.dps),
    address: text(data.address),
    setupComplete: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid
  }));
  await writeDefaultPermissionSets(batch, pubId);
  batch.set(memberRef(pubId, actor.uid), cleanForFirestore({
    uid: actor.uid,
    pubId,
    staffId: setupStaffId,
    email: actorEmail,
    displayName,
    role: "Owner",
    permissionSetId: "Owner",
    workAreaIds: [],
    active: true,
    archived: false,
    setupAdmin: true,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid
  }));
  batch.set(staffRef(pubId, setupStaffId), cleanForFirestore({
    id: setupStaffId,
    authUid: actor.uid,
    email: actorEmail,
    name: displayName,
    nickname: displayName.split(/\s+/)[0] || "Setup",
    role: "Owner",
    permissionSetId: "Owner",
    accountStatus: "confirmed",
    active: true,
    archived: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid
  }));
  batch.set(pubRef(pubId).collection("auditLogs").doc(), cleanForFirestore({
    type: "pub.created",
    actorUid: actor.uid,
    actorEmail,
    details: { pubId, name: text(data.name, "New Pub") },
    createdAt: FieldValue.serverTimestamp()
  }));
  await batch.commit();
  await setComplianceClaims(actor.uid, pubId, { setupAdmin: true, complianceSetupAdmin: true });
  return { pubId, staffId: setupStaffId, uid: actor.uid };
});

exports.createPubUser = onCall(async (request) => {
  const actor = requireAuth(request);
  const data = request.data || {};
  const pubId = assertPubId(data.pubId);
  const actorMember = await requirePermission(pubId, request, "users.create");

  const email = text(data.email).toLowerCase();
  const temporaryPassword = String(data.temporaryPassword || "");
  const displayName = text(data.displayName || data.name);
  if (!email || !email.includes("@")) throw new HttpsError("invalid-argument", "A valid email address is required.");
  if (temporaryPassword.length < 6) throw new HttpsError("invalid-argument", "Temporary password must be at least 6 characters.");
  if (!displayName) throw new HttpsError("invalid-argument", "Display name is required.");

  const role = text(data.role, "Staff") || "Staff";
  const permissionSetId = text(data.permissionSetId, role) || "Staff";
  const targetFullAccess = roleHasFullAccess(role) || ["owner", "admin", "manager"].includes(permissionSetId.toLowerCase());
  if (targetFullAccess && !actorMember.setupAdmin && !roleHasFullAccess(actorMember.role) && !(await hasPermission(pubId, actorMember, "permissions.manage"))) {
    throw new HttpsError("permission-denied", "Only a full-access user can create another full-access user.");
  }
  const workAreaIds = Array.isArray(data.workAreaIds)
    ? data.workAreaIds.map((item) => text(item)).filter(Boolean)
    : [];
  const profile = cleanForFirestore(data.staffProfile || {});

  let createdUser = null;
  try {
    createdUser = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName,
      emailVerified: false,
      disabled: false
    });

    const staffId = createdUser.uid;
    const batch = db.batch();
    batch.set(memberRef(pubId, createdUser.uid), cleanForFirestore({
      uid: createdUser.uid,
      pubId,
      staffId,
      email,
      displayName,
      role,
      permissionSetId,
      workAreaIds,
      active: true,
      archived: false,
      setupAdmin: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }));
    batch.set(staffRef(pubId, staffId), cleanForFirestore({
      id: staffId,
      authUid: createdUser.uid,
      userId: staffId,
      email,
      name: profile.name || displayName,
      nickname: profile.nickname || displayName.split(/\s+/)[0] || displayName,
      displayName,
      employmentType: profile.employmentType || "Employee",
      area: profile.area || workAreaIds[0] || "",
      jobArea: profile.jobArea || profile.area || workAreaIds[0] || "",
      workAreaIds,
      role,
      permissionSetId,
      accountStatus: "invited",
      active: true,
      archived: false,
      staffProfile: profile,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }));
    batch.set(pubRef(pubId).collection("auditLogs").doc(), cleanForFirestore({
      type: "user.created",
      actorUid: actor.uid,
      actorEmail: actor.token && actor.token.email || "",
      targetUid: createdUser.uid,
      targetEmail: email,
      details: { role, permissionSetId, workAreaIds },
      createdAt: FieldValue.serverTimestamp()
    }));
    await batch.commit();
    await setComplianceClaims(createdUser.uid, pubId);
    return { uid: createdUser.uid, staffId };
  } catch (error) {
    if (createdUser && createdUser.uid) {
      try { await auth.deleteUser(createdUser.uid); } catch (_) {}
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error && error.message ? error.message : "Could not create user.");
  }
});

exports.archivePubUser = onCall(async (request) => {
  const actor = requireAuth(request);
  const data = request.data || {};
  const pubId = assertPubId(data.pubId);
  await requirePermission(pubId, request, "users.archive");

  const targetUid = text(data.uid || data.memberUid || data.authUid);
  if (!targetUid) throw new HttpsError("invalid-argument", "Target user uid is required.");
  if (targetUid === actor.uid) throw new HttpsError("failed-precondition", "You cannot archive your own account.");
  await assertCanRemoveFullAccessMember(pubId, targetUid);

  const memberSnap = await memberRef(pubId, targetUid).get();
  if (!memberSnap.exists) throw new HttpsError("not-found", "User member record not found.");
  const member = memberSnap.data() || {};
  const staffId = member.staffId || targetUid;

  const batch = db.batch();
  batch.set(memberRef(pubId, targetUid), cleanForFirestore({
    active: false,
    archived: true,
    archivedAt: FieldValue.serverTimestamp(),
    archivedBy: actor.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid
  }), { merge: true });
  batch.set(staffRef(pubId, staffId), cleanForFirestore({
    active: false,
    archived: true,
    accountStatus: "archived",
    archivedAt: FieldValue.serverTimestamp(),
    archivedBy: actor.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid
  }), { merge: true });
  batch.set(pubRef(pubId).collection("auditLogs").doc(), cleanForFirestore({
    type: "user.archived",
    actorUid: actor.uid,
    actorEmail: actor.token && actor.token.email || "",
    targetUid,
    details: { staffId },
    createdAt: FieldValue.serverTimestamp()
  }));
  await batch.commit();
  try { await auth.updateUser(targetUid, { disabled: true }); } catch (_) {}
  return { uid: targetUid, staffId, archived: true };
});

exports.importLegacyPubState = onCall(async (request) => {
  const actor = requireAuth(request);
  const data = request.data || {};
  const pubId = assertPubId(data.pubId);
  await requirePermission(pubId, request, "settings.manage");

  const legacy = data.legacyState || {};
  const extra = data.extraStorage || {};
  const writer = makeBatchWriter();
  const counts = {
    workAreas: 0,
    permissionSets: 0,
    staff: 0,
    premisesDocuments: 0,
    documentRequirements: 0,
    checks: 0,
    checkCompletions: 0,
    rota: 0,
    issues: 0
  };

  writer.set(pubRef(pubId), cleanForFirestore({
    ...(legacy.pub || {}),
    importedAt: FieldValue.serverTimestamp(),
    importedBy: actor.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid
  }), { merge: true });

  Object.keys(DEFAULT_PERMISSION_SETS).forEach((id) => {
    counts.permissionSets += 1;
    writer.set(pubRef(pubId).collection("permissionSets").doc(id), cleanForFirestore({
      id,
      ...DEFAULT_PERMISSION_SETS[id],
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });
  Object.keys(legacy.permissionMatrix || {}).forEach((id) => {
    const permissionMap = { ...(legacy.permissionMatrix[id] || {}) };
    const description = permissionMap.description || "";
    delete permissionMap.description;
    counts.permissionSets += 1;
    writer.set(pubRef(pubId).collection("permissionSets").doc(safeSegment(id)), cleanForFirestore({
      id,
      description,
      permissions: permissionMap,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  (Array.isArray(legacy.areas) ? legacy.areas : []).filter(Boolean).forEach((name, index) => {
    const id = safeSegment(name, `area-${index}`);
    counts.workAreas += 1;
    writer.set(pubRef(pubId).collection("workAreas").doc(id), {
      id,
      name,
      order: index,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }, { merge: true });
  });

  (Array.isArray(legacy.users) ? legacy.users : []).forEach((user) => {
    const staffId = safeSegment(user.id || user.authUid || user.memberUid || user.email || user.name, "staff");
    const authUid = text(user.authUid || user.memberUid || "");
    counts.staff += 1;
    writer.set(staffRef(pubId, staffId), cleanForFirestore({
      ...user,
      id: staffId,
      authUid,
      active: user.active !== false,
      archived: user.archived === true,
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
    if (authUid) {
      writer.set(memberRef(pubId, authUid), cleanForFirestore({
        uid: authUid,
        pubId,
        staffId,
        email: user.email || "",
        displayName: user.name || user.nickname || "",
        role: user.role || user.permissionSetId || "Staff",
        permissionSetId: user.permissionSetId || user.role || "Staff",
        workAreaIds: user.area ? [user.area] : [],
        active: user.active !== false,
        archived: user.archived === true,
        importedAt: FieldValue.serverTimestamp(),
        importedBy: actor.uid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid
      }), { merge: true });
    }
  });

  (Array.isArray(legacy.docs) ? legacy.docs : []).forEach((doc) => {
    const id = safeSegment(doc.id || doc.title, "premises-document");
    counts.premisesDocuments += 1;
    writer.set(pubRef(pubId).collection("premisesDocuments").doc(id), cleanForFirestore({
      ...doc,
      id,
      category: doc.category || doc.cat || "",
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  const requirements = Array.isArray(extra.requirements) ? extra.requirements : (Array.isArray(legacy.documentRequirements) ? legacy.documentRequirements : []);
  requirements.forEach((req) => {
    const id = safeSegment(req.id || req.title, "document-requirement");
    counts.documentRequirements += 1;
    writer.set(pubRef(pubId).collection("documentRequirements").doc(id), cleanForFirestore({
      ...req,
      id,
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });
  if (Array.isArray(extra.groups)) {
    writer.set(pubRef(pubId), {
      staffDocumentGroups: extra.groups,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }, { merge: true });
  }

  (Array.isArray(legacy.userRequiredDocuments) ? legacy.userRequiredDocuments : []).forEach((doc) => {
    const staffId = text(doc.userId);
    if (!staffId) return;
    const id = safeSegment(doc.id || doc.requirementId || doc.title, "staff-document");
    counts.documentRequirements += 1;
    writer.set(staffRef(pubId, safeSegment(staffId)).collection("documents").doc(id), cleanForFirestore({
      ...doc,
      id,
      userId: staffId,
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  (Array.isArray(legacy.checks) ? legacy.checks : []).forEach((check) => {
    const id = safeSegment(check.id || check.title, "check");
    counts.checks += 1;
    writer.set(pubRef(pubId).collection("checks").doc(id), cleanForFirestore({
      ...check,
      id,
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  (Array.isArray(legacy.done) ? legacy.done : []).forEach((item) => {
    const id = safeSegment(item.id || `${item.checkId || "check"}-${item.userId || "user"}-${item.date || item.at || Date.now()}`, "completion");
    counts.checkCompletions += 1;
    writer.set(pubRef(pubId).collection("checkCompletions").doc(id), cleanForFirestore({
      ...item,
      id,
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  const rota = extra.rota || {};
  (Array.isArray(rota.shifts) ? rota.shifts : []).forEach((shift) => {
    const id = safeSegment(shift.id || `${shift.userId || "user"}-${shift.date || "date"}-${shift.start || "start"}`, "shift");
    counts.rota += 1;
    writer.set(pubRef(pubId).collection("rota").doc(id), cleanForFirestore({
      ...shift,
      id,
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  (Array.isArray(legacy.issues) ? legacy.issues : []).forEach((issue) => {
    const id = safeSegment(issue.id || issue.title, "issue");
    counts.issues += 1;
    writer.set(pubRef(pubId).collection("issues").doc(id), cleanForFirestore({
      ...issue,
      id,
      recordKind: "issue",
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });
  (Array.isArray(legacy.logs) ? legacy.logs : []).forEach((log) => {
    const id = safeSegment(log.id || `${log.type || "log"}-${log.created || Date.now()}`, "log");
    counts.issues += 1;
    writer.set(pubRef(pubId).collection("issues").doc(id), cleanForFirestore({
      ...log,
      id,
      recordKind: "log",
      importedAt: FieldValue.serverTimestamp(),
      importedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid
    }), { merge: true });
  });

  writer.set(pubRef(pubId).collection("auditLogs").doc(), cleanForFirestore({
    type: "legacy.imported",
    actorUid: actor.uid,
    actorEmail: actor.token && actor.token.email || "",
    details: counts,
    createdAt: FieldValue.serverTimestamp()
  }));
  await writer.commit();
  return { imported: true, counts };
});
