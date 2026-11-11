EURO SPHERE — COMPLETE APP (UPDATED COMPATIBILITY PACKAGE)
=========================================================

Files
-----
index.html                         Main app screens
style.css                          Responsive styling
app.js                             Supabase Auth, dashboard, course locks, admin panel, voice phrasebook
supabase-config.js                 Browser-safe Supabase project URL + publishable key
schema.sql                         Full schema for a BRAND-NEW development database only
MIGRATE-EXISTING-DATABASE.sql      Compatibility migration for the database already set up in this project
README-FIRST.txt                  Setup and limitations

IMPORTANT: WHICH SQL FILE SHOULD I RUN?
---------------------------------------
Your development Supabase project already has profiles, course_access, course_progress,
quiz_results and certificates. For that EXISTING database, review and run
MIGRATE-EXISTING-DATABASE.sql in Supabase SQL Editor. Do NOT blindly run schema.sql over
an existing database. The migration adds the column aliases and content/class tables this
frontend expects, preserves existing course-access rows, and does NOT grant any new courses.
Back up important data and review SQL before execution.

APP SECURITY
------------
- No student is automatically granted A1, A2, B1, B2 or C1 access.
- Admin status comes from the database profile role, never from a frontend email check.
- Course content and live-class records use Row Level Security; only admins can add/remove them.
- Never put a Supabase service_role/secret key in browser code. The publishable key is expected in the frontend.
- A student cannot grant themselves course access by changing the UI; course_access policies must remain admin-only.
- Existing student access rows are preserved by the compatibility migration.

SETUP / TEST
------------
1. Keep a backup of your current folder before copying updated files over it.
2. Check supabase-config.js contains the correct project URL and publishable key. Never use a service_role key.
3. In Supabase SQL Editor, review and run MIGRATE-EXISTING-DATABASE.sql against the development project only.
4. Check Authentication settings. If you want instant signup/login in development, disable email confirmations in Supabase Auth. With confirmation enabled, users must confirm their email before a session is created.
5. The intended owner account is eurospherehisar@gmail.com. Its database role was previously confirmed as admin in the project context. Do not run a role-promotion query unless the role is no longer admin and you have verified the account.
6. Run a local server from this folder: npx --yes serve . -l 3000; then open http://localhost:3000.
7. Test with a student account: dashboard should show all courses locked until the admin explicitly grants access. In Admin Panel, grant one course, refresh student session, and verify that course unlocks. Revoke it and verify it locks again.

KNOWN LIMITATIONS
-----------------
- Voice input uses browser speech recognition (Hindi locale) and a small phrasebook. It is not full AI translation.
- Real video hosting, secure video delivery, server-side quiz grading, automatic certificates, reminders, and teacher messaging require additional backend/service work.
- RLS protects database records, not public video URLs after a URL has been shared.
- Do not deploy to the live website until development tests pass and you explicitly approve deployment.
