# Compliance Bible / Pub Compliance Hub

A mobile-first PWA for public house compliance records, daily checks, document tracking, temperature logs, incident/refusal logs, staff training records, issue reporting and inspection-mode exports.

## Current build

This build is a Firebase Spark-compatible multi-user PWA. It uses Firebase Authentication and Cloud Firestore only. Evidence photos are resized and compressed in the browser, then stored as chunked Firestore image documents under each pub.

Firebase Storage, Cloud Functions and Blaze-only features are not used in this emergency production route.

## Included features

- Staff sign-in with Firebase Authentication
- Structured Cloud Firestore sync per pub
- Firestore-only compressed evidence photo uploads
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

## How to run

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Firebase Spark setup

Enable these Firebase products in the Firebase console:

- Authentication: Email/password provider
- Cloud Firestore

Do not enable or configure Firebase Storage for this build. Do not deploy Cloud Functions for this build.

Paste the web app config into `src/firebase/config.js` and set a stable pub ID:

```js
window.COMPLIANCE_FIREBASE_CONFIG = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  messagingSenderId: '...',
  appId: '...'
};
window.COMPLIANCE_FIREBASE_PUB_ID = 'your-pub-id';
window.COMPLIANCE_FIREBASE_OPTIONS = {
  production: true,
  storageMode: 'firestore-images',
  allowFirebaseStorage: false,
  allowLocalFallback: false
};
```

Deploy Firestore rules and hosting:

```bash
firebase deploy --only firestore:rules,hosting
```

## First setup admin

1. Create the first setup admin user in Firebase Authentication.
2. Give that Auth user a custom claim before they sign in:

```js
{ "setupAdmin": true, "complianceSetupAdmin": true }
```

You can set the claim with the Firebase Admin SDK from a trusted machine or Cloud Shell. The setup admin signs in and creates the pub, default permission sets, and their own Owner member/profile records through Firestore.

Because this emergency build does not use Cloud Functions, creating additional Firebase Auth accounts must be done in Firebase Authentication or another trusted admin process. The app can store staff profiles, permissions and document/check data in Firestore, but it cannot securely create Auth users from browser-only code.

## Firestore image storage

Evidence uploads use this flow:

1. The browser resizes the selected/taken photo to a maximum of `1200px` wide and `1600px` high.
2. The browser compresses to JPEG around `0.55` quality, using WebP only when the browser supports it and it produces a smaller file.
3. The upload targets less than `650 KB` and hard-fails above `900 KB`.
4. The compressed image data is split into chunks of up to `350,000` base64 characters.
5. Metadata is written to:

```text
pubs/{pubId}/documentImages/{imageId}
```

6. Chunks are written to:

```text
pubs/{pubId}/documentImages/{imageId}/chunks/{chunkIndex}
```

7. Staff, premises and check records store only metadata links such as `imageId`, `imageCount`, `uploadedAt` and `uploadedBy`. They do not store full image data.

Archived or replaced images are marked with `archived: true` on the metadata document.

## Structured Firestore data

Live production data no longer uses `pubs/{pubId}/app/state`. The app reads and writes these collections instead:

```text
pubs/{pubId}
pubs/{pubId}/members/{uid}
pubs/{pubId}/permissionSets/{permissionSetId}
pubs/{pubId}/staff/{staffId}
pubs/{pubId}/staff/{staffId}/documents/{documentId}
pubs/{pubId}/premisesDocuments/{documentId}
pubs/{pubId}/documentImages/{imageId}
pubs/{pubId}/documentImages/{imageId}/chunks/{chunkIndex}
pubs/{pubId}/documentRequirements/{requirementId}
pubs/{pubId}/workAreas/{workAreaId}
pubs/{pubId}/checks/{checkId}
pubs/{pubId}/checkCompletions/{completionId}
pubs/{pubId}/rota/{shiftId}
pubs/{pubId}/issues/{issueId}
pubs/{pubId}/auditLogs/{logId}
```

## Security rules

`firestore.rules` denies by default. It requires an authenticated active pub member, enforces permission keys stored in `permissionSets`, prevents users from editing their own role/status/admin fields, and protects `documentImages` metadata/chunks by pub membership, document ownership and relevant document/check permissions.

## Production smoke test

Before handing the app to staff, test these flows against a Firebase project:

1. Setup admin signs in and creates the pub.
2. Existing Firebase Auth users can sign in as active pub members.
3. Staff user signs in and only sees allowed screens/actions.
4. Staff user can upload their own allowed document photos and complete assigned checks.
5. Uploaded photos are compressed, saved as Firestore chunks, then reopened from the viewer.
6. Oversized photos show `Image too large. Retake closer/crop document.`
7. Staff user cannot write protected Firestore documents or access another staff member's private document images.
8. Admin can manage permission groups, documents, checks, rota and settings.
9. Archived users cannot access the app.
