# الحالة الحقيقية لمشروع سَنَا — مراجعة read-only على الكود الفعلي

> مراجعة تمت اليوم على الكود الموجود فعليًا في `D:\quran-sana\Sana-quran-academy-platform`. كل الإجابات مبنية على قراءة الملفات نفسها وتشغيل أوامر فعلية — مش افتراضات.

## Teacher Portal

**غير موجود (placeholder)** — الحقيقة المؤكدة من الكود:
- `src/app/(app)/teacher/` يحتوي على ملف واحد فقط: `page.tsx`
- الـdashboard يعرض 3 كروت كلهم قيمتها "—" ويقول حرفيًا: **"شاشات المعلمة (قائمة الطالبات، تسجيل الحصة، التقييم) قيد الإنشاء"**
- **مفيش** `/teacher/students` ولا `/teacher/students/[id]` ولا `/teacher/students/[id]/plan` ولا `/teacher/groups` — directories كلها غير موجودة
- **مفيش** `src/app/api/teacher/` نهائيًا — لا توجد API endpoints للمعلمة أصلًا
- **مفيش** Quick Lesson Form ولا `prisma.$transaction` ولا `requireTeacher()` ولا `assertTeacherOwnsStudent()`
- هذا يحسم التناقض: أي ملف توثيق قديم يقول إن Teacher Portal شبه مكتمل — **الكود بيقول العكس: صفر تنفيذ**

## Login System

**3 بوابات منفصلة** — تم تنفيذها في المهمة السابقة ومختبرة:
- `/login/admin` + `/login/teacher` + `/login/student` + صفحة اختيار على `/login`
- Role validation **حقيقي على السيرفر** في `src/app/api/auth/login/route.ts`: حقل `expectedRole` + مقارنة بالدور الفعلي من الـDB → **403** لو الدور مش مطابق (متأكد بالاختبار الفعلي: Admin حاول الدخول من بوابة الطالبات → رُفض 403)
- `src/lib/auth.ts`: JWT (jose/HS256) + bcrypt + HttpOnly cookie، مش NextAuth ولا Supabase Auth
- `src/middleware.ts`: يحمي `/admin|/teacher|/student` ويوجه المتصل بدور غلط لـdashboard الخاص به

## Supabase Storage

**محذوف** — `src/lib/supabase.ts` غير موجود في `src` كلها (تأكدت بالبحث الكامل):
- كان موجود من الأول لكن مفيش أي كود بيستخدمه → اتحذف في التنظيف (بإرادتك)
- **لكن**: `Payment.proofUrl` موجود في الـschema وواجهة الأدمن للمدفوعات بتقرا الـ`proofUrl` فقط (عرض رابط خارجي + confirm/reject) — **مفيش أي upload form ولا workflow رفع حاليًا**
- **نحتاج نرجعه** لو هنبني إثبات الدفع (سواء Supabase Storage أو حل أخف مثل رفع إلى presigned URL أو سلة تخزين أبسط) — ده جزء من Scope Student Portal الجاي

## Student Portal

**جزئي (placeholder)** — `src/app/(app)/student/` ملف واحد `page.tsx`:
- كروت "حصة اليوم" و"خطة الحفظ" و"حالة الاشتراك" كلهم **hard-coded values** (مثلاً "آل عمران — 80%") مش من الـDB
- النص يقول: "باقي شاشات الطالبة (الجدول، خطة الحفظ، سجل التسميع، المدفوعات) قيد الإنشاء"
- لا توجد أي API تحت `src/app/api/student/`

## DB / Migrations

**متزامن** — نتائج فعلية شُغّلت:
- `npx prisma migrate status` → "1 migration found ... **Database schema is up to date!**"
- الـschema = **14 model بالضبط**: User, Student, Teacher, Admin, Program, Group, Schedule, Enrollment, MemorizationPlan, Lesson, Attendance, Evaluation, Payment, LoginAttempt ✓
- لا يوجد drift بين الـschema والـDB (التحقق اتعمل سابقًا: 14 جدول live = 14 جدول schema، كل الأعمدة متطابقة)

## Build

**نظيف** — نتائج فعلية:
- `npx tsc --noEmit` → exit code 0 (صفر أخطاء)
- `npm run build` (شُغّل سابقًا) → Compiled successfully, Linting 0 errors, 19 static page
- ملاحظة: `npm run build` شغّلته أنا في المهمة السابقة بعد تنفيذ البوابات — تأكد منه

## فجوات أمنية ظاهرة

1. **لا توجد حماية server-side لـ teacher/student نهائيًا** — لأن لا توجد API endpoints لهم أصلاً. الـguard الوحيد الموجود `requireAdmin()` في `src/lib/api-helpers.ts` (لا يوجد `requireTeacher()` ولا `assertTeacherOwnsStudent()`)
2. الـauthorization الحالي كله على مستوى البوابات عبر الـmiddleware فقط — مقبول دلوقتي لأن مفيش API حساسة للطلاب/المعلمات، لكن **أول ما تُبنى Teacher API لازم يبدأ كل endpoint بـrequireTeacher() + ownership check**
3. الـschema فيه `Payment.proofUrl` كـstring اختياري — لما نبني الرفع لازم يتقيد بـfile-type validation وsize limit على السيرفر (مش من الـclient فقط)
4. مفيش CSRF protection على الـAPI — الكوكيز HttpOnly + JSON-only API بتخفف الخطر، بس يبقى في الاعتبار
5. الـdev env بيستخدم AUTH_SECRET توليد جديد قوي (ممتاز) — بس سكريبتات الـseed التجريبية في `scripts/` فيها كلمات مرور واضحة، لا تُرفع لأي repo

## آخر commit فعلي

**لا يوجد git repository إطلاقًا** — `git status` → `fatal: not a git repository`
- المجلد مش git repo (وده سبب كمان إن ملفات tmp كانت موجودة قبلًا)
- أقرب حاجة: الملفات المعدلة اليوم هي كل شغل البوابات الثلاث + migration_lock + baseline migration (مذكورة في قسم modified files)
- **توصية**: عمل `git init` + أول commit قبل بدء أي شغل جديد — ده مهم جدًا لمتابعة تاريخ الشغل

## الفجوة الكبرى المتبقية (خلاصة)

| المكون | النسبة التقريبية |
|--------|------------------|
| Schema + migrations + config | ✅ 100% |
| Login + 3 portals | ✅ 100% |
| Admin portal | ~90% (يحتاج صفحات تفاصيل + edit/حذف) |
| Teacher portal | 0% (placeholder) |
| Student portal | 0% (placeholder) |
| نظام الحصص (Lesson/Attendance/Evaluation) | 0% من الـfrontend + API |
| رفع إثبات الدفع | 0% |
