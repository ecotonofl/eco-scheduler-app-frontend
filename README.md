# EcoGo frontend: project workspace review

Adds a Projects navigation tab alongside the existing Driver and Supervisor scheduler. A project connects field stops, samples, their requested/reported tests, and itemized invoices. Existing standalone stops remain supported. Existing EcotonoFL logo, home-screen icons and manifest are retained.

The design refinement is based on the recovered June 28, 2026 `ecotonofl-field-ops-v2.zip` prototype: navy sidebar, blue/green navigation accents, light panels and compact status badges. Earlier scheduling descriptions also informed light-blue headings and warm table rows. Only working Driver, Supervisor and Projects routes are shown. Search projects by code, name or client without losing the selected project. Mobile navigation remains visible; dates/times stay paired.

The broader Project Workspace plan was recovered from a shared chat. Its equipment, monitoring-well, COC, field-note, QA/QC, notification and report sections remain roadmap items rather than inactive navigation tabs. This increment does not display a fabricated health score, live map or automated notification state. The recovered prototype itself, its sample contacts and private chat contents are not included in the public repository.

## Local review with synthetic data

Start the companion backend branch first (its `docs/WORKSPACE.md` describes the API). Use a fresh local database, not a production export.

```bash
npm ci
REACT_APP_API_URL=http://localhost:4000 npm start
```

1. Open Projects, choose New and create a synthetic project with code, name, client and site.
2. Choose Schedule fieldwork. Supervisor fills project/client/site details; choose the date and Florida time beside each other and schedule a stop. Use the schedule date picker to review another day. Driver continues showing today's Florida route.
3. Return to Projects and choose that project, then Samples & Tests. Add a planned sample; edit it to Collected with collection date/time. Add a test and report a result (including text such as `ND` or `<0.01`).
4. Open Invoices. Create a draft with line descriptions, quantities and dollar unit prices. The API calculates integer-cent totals. Open it to track Sent, Paid or Void. These statuses do not send email or collect payment.
5. Restart the local API and verify the same records still appear. Keep using synthetic data until authentication and roles have been implemented.

Changing project details does not rewrite historical stop details or invoice amounts. Invoices reference current project client details; immutable billing snapshots and invoice PDF export are future work. Samples belong to a project in this increment; stop-level sample assignment and laboratory imports are future work.

## Validation

```bash
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

Tests exercise the rendered project, sample/test and invoice forms, API rejection recovery, exact-cent conversion, Florida midnight and winter/summer time conversion. Backend HTTP/SQLite integration tests independently cover persisted relationships and amounts.

## Review before production

This frontend requires the companion workspace API. The backend storage guard intentionally refuses production startup until persistent storage has been verified and the database restored. Follow backend `docs/STORAGE.md` before any deployment. This branch does not provision storage, migrate production, or deploy either service. The application currently has no authenticated access controls; do not enter real client/sample/billing records into a public staging deployment.
