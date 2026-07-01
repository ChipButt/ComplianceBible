# Compliance Bible / Pub Compliance Hub

A mobile-first PWA for public house compliance records, daily checks, document tracking, temperature logs, incident/refusal logs, staff training records, issue reporting and inspection-mode exports.

## Current build

This build is a Firebase-backed multi-user PWA. Production data is stored in structured Firestore collections under each pub, staff sign in with Firebase Authentication, privileged user creation happens through Cloud Functions, and evidence files are stored in Firebase Storage.

## Included features

- Admin-controlled staff user creation
- Daily, weekly and custom compliance checks
- Overdue detection based on exact due times
- Document vault records with categories and expiry dates
- Fridge/freezer temperature logs
- Incident, refusal, accident, maintenance and pest logs
- Staff list and training matrix
- Issue reporting and resolving
- Read-only inspection mode
- Text export of inspection report
- PWA manifest and service worker
- Firebase Authentication, Cloud Functions, Firestore sync and Storage upload integration

## How to run

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Firebase production setup

Enable these Firebase products in the Firebase console:

- Authentication: Email/password provider
- Cloud Firestore
- Cloud Storage
- Cloud Functions

Paste the web app config into `src/firebase/config.js` and set a stable pub ID:

```js
window.COMPLIANCE_FIREBASE_CONFIG = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...'
};
window.COMPLIANCE_FIREBASE_PUB_ID = 'your-pub-id';
```

Production mode keeps the old setup popup hidden and disables local-only upload fallback:

```js
window.COMPLIANCE_FIREBASE_OPTIONS = {
  production: true,
  allowSetupPopup: false,
  allowLocalFallback: false,
  functionsRegion: 'europe-west2',
  setupAdminEmails: []
};
```

Install and deploy the backend:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules,storage
```

Deploy hosting after adding the real config:

```bash
firebase deploy --only hosting
```

## First setup admin

1. Create the first setup admin user in Firebase Authentication.
2. Give that Auth user a custom claim before they sign in:

```js
{ "setupAdmin": true, "complianceSetupAdmin": true }
```

You can set the claim with the Firebase Admin SDK from a trusted machine or Cloud Shell. The setup admin signs in, creates the pub, then creates the first Owner/Admin/Manager from inside the app. Once another full-access user exists, archive or hide the setup admin through the app rather than deleting Firestore records by hand.

## Structured Firestore data

Live production data no longer uses `pubs/{pubId}/app/state`. The app reads and writes these collections instead:

```text
pubs/{pubId}
pubs/{pubId}/members/{uid}
pubs/{pubId}/permissionSets/{permissionSetId}
pubs/{pubId}/staff/{staffId}
pubs/{pubId}/staff/{staffId}/documents/{documentId}
pubs/{pubId}/premisesDocuments/{documentId}
pubs/{pubId}/documentRequirements/{requirementId}
pubs/{pubId}/workAreas/{workAreaId}
pubs/{pubId}/checks/{checkId}
pubs/{pubId}/checkCompletions/{completionId}
pubs/{pubId}/rota/{shiftId}
pubs/{pubId}/issues/{issueId}
pubs/{pubId}/auditLogs/{logId}
```

Staff and manager accounts must be created from inside the app. The callable `createPubUser` function creates the Firebase Auth user, member record, staff profile, role/permission assignment and audit log together. There is no public Create Account button.

## Security rules

`firestore.rules` and `storage.rules` deny by default. They require an authenticated active pub member, enforce the permission keys stored in `permissionSets`, prevent users from editing their own role/status/admin fields, and restrict Storage to these production paths:

```text
pubs/{pubId}/staff/{staffId}/documents/{documentId}/...
pubs/{pubId}/premisesDocuments/{documentId}/...
pubs/{pubId}/checkCompletions/{completionId}/...
```

Sensitive account actions are handled by Cloud Functions using the Firebase Admin SDK. `archivePubUser` prevents archiving the last active full-access Owner/Admin/Manager.

## One-time migration

If you need to seed structured Firestore from an old local/demo state, sign in as a setup admin or a user with `settings.manage`, then run this once in the browser console:

```js
ComplianceFirebase.importLegacyState()
```

This imports pub details, areas, permission groups, users that already have Firebase UIDs, document records, checks, check completions, rota shifts, issues and logs into the structured collections. It does not keep the old shared state document in live use.

## Production smoke test

Before handing the app to staff, test these flows against a Firebase project:

1. Setup admin signs in and creates the pub.
2. Setup admin creates an Owner/Admin/Manager.
3. Owner/Admin/Manager creates a staff user with a temporary password.
4. Staff user signs in and only sees allowed screens/actions.
5. Staff user can upload their own allowed documents and complete assigned checks.
6. Staff user cannot write protected Firestore documents or access another staff member's Storage files.
7. Admin can manage users, permission groups, documents, checks, rota and settings.
8. Archived users cannot access the app.
9. The last active full-access Owner/Admin/Manager cannot be archived.
