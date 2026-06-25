# Compliance Bible / Pub Compliance Hub

A mobile-first PWA for public house compliance records, daily checks, document tracking, temperature logs, incident/refusal logs, staff training records, issue reporting and inspection-mode exports.

## Current build

This build runs as a static PWA with localStorage fallback and optional Firebase cloud sync. When Firebase is configured, users sign in with Firebase Authentication, shared app data is stored in Cloud Firestore, and document/check evidence files are uploaded to Cloud Storage.

## Included features

- Admin/staff user switching
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
- Firebase Authentication, Firestore sync and Storage upload integration

## How to run

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Firebase setup

Enable these Firebase products in the Firebase console:

- Authentication: Email/password provider
- Cloud Firestore
- Cloud Storage

Add the Web app config either in `src/firebase/config.js` or through the in-app `Firebase Setup` button. Use the same Pub ID on each device that should share the same pub data.

Security rules for Firestore and Storage are included in `firestore.rules` and `storage.rules`.

## Next build stage

Recommended next steps:

1. Tighten Firebase rules with pub-specific membership/roles.
2. Add admin-managed invites for staff accounts.
3. Add PDF export.
4. Add multi-site support.
