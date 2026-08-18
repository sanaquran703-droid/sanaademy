Set-Location "D:\quran-sana\Sana-quran-academy-platform"

# Commit 1: student auth layer + supabase storage helper + deps
git add package.json package-lock.json src/lib/student-auth.ts src/lib/supabase.ts
git commit -m "feat(student): add student auth layer, Supabase storage helper, and supabase-js dependency

- requireStudent() + getActiveEnrollment() authorization layer (401/403 role gating)
- uploadPaymentProof/uploadAvatar helpers with MIME/size validation and signed URLs
- bucket sana-uploads must exist in Supabase Storage (private)"

# Commit 2: student API endpoints
git add src/app/api/student/
git commit -m "feat(student): add 7 student API endpoints (dashboard, schedule, plan, lessons, payments, profile)

- GET dashboard / schedule / plan / lessons (scoped to active enrollment)
- GET+POST payments: multipart proof upload to Supabase Storage, duplicate-month 409
- PATCH profile (JSON password change + multipart avatar)
- GET profile/me helper"

# Commit 3: student UI pages
git add "src/app/(app)/student/"
git commit -m "feat(student): add Student Portal UI (layout + 6 pages)

- Sidebar layout with role guard
- Dashboard (4 stat cards), schedule, memorization plan, lessons with pagination
- Payments with proof upload form + confirmation dialog
- Profile with avatar upload + password change"

# Commit 4: security tests and diagnostic scripts (gitignored-friendly)
git add scripts/
git commit -m "chore(scripts): add student portal security tests and diagnostic scripts

- test-student-security.js: 22 security tests (auth, role gating, upload validation)
- seed-test-student.js, probe-payments*.js, probe-storage.js, make-tiny-jpg.js"

git log --oneline -6
git status --short
