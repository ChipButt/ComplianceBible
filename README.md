# Compliance Bible / Pub Compliance Hub

A mobile-first PWA for public house compliance records, daily checks, document tracking, temperature logs, incident/refusal logs, staff training records, issue reporting and inspection-mode exports.

## Current build

This is a static first-version prototype that runs entirely in the browser using localStorage. It is designed so the workflow can be tested immediately before connecting a real backend.

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

## How to run

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Next build stage

Recommended next steps:

1. Add real authentication.
2. Add cloud database storage.
3. Add file upload for documents and evidence photos.
4. Add role-based permissions.
5. Add PDF export.
6. Add push notifications for overdue checks.
7. Add multi-site support.
