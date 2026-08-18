# إصلاح Baseline Migration — ملخص كامل

## المشكلة التي ظهرت

عند تشغيل `node scripts\verify-baseline.js` ظهر الخطأ:

```
Could not determine the connector from the migrations directory (missing migration_lock.toml).
```

## سبب الخطأ

مجلد migrations كان ناقص ملف `prisma/migrations/migration_lock.toml`، وهو ملف إلزامي في Prisma يتعرّف منه CLI على أن المجلد هو migration directory ويحدد نوع قاعدة البيانات (postgresql هنا).

## ما تم فعله (بأمان كامل)

| الخطوة | التفاصيل | التغيير على DB؟ |
|--------|----------|-----------------|
| 1 | إنشاء `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`) | لا |
| 2 | تحديث `scripts/verify-baseline.js` (يحمّل .env تلقائيًا، يقارن الجداول والأعمدة فعليًا مع الـDB الحية، ولا يسجّل الـbaseline إلا بعد مطابقة كاملة) | قراءة فقط |
| 3 | التحقق: 14 جدول في الـbaseline == 14 جدول في Supabase الحية، كل الأعمدة متطابقة | قراءة فقط |
| 4 | تسجيل الـbaseline: `prisma migrate resolve --applied 0000_baseline` → **INSERT واحد فقط** في جدول التتبع `_prisma_migrations` | سطر واحد في tracking table |

**لم يتم:** لا migrate reset، لا db push، لا حذف/تعديل جداول أو بيانات، لا تغيير schema.

## تشخيص اتصال قاعدة البيانات (مهم — اقرأ هذا)

أثناء التشخيص اكتشفنا مشكلة شبكة على جهازك (مشكلة في Prisma Client فقط، ليست في المشروع):

- `DATABASE_URL` يشير إلى `db.gvhejkcmlqtmxvankijc.supabase.co` (الـTCP المباشر) — هذا الـhost بيتحلل على **IPv6 فقط** وشبكة جهازك لا تدعمه (`ENETUNREACH`)، فيفشل Prisma Client.
- `DIRECT_URL` يشير إلى `aws-0-eu-north-1.pooler.supabase.com` (الـpooler) — يعمل تمامًا على IPv4.
- **Prisma CLI** (db execute / migrate resolve) نجح على الاثنين، لكن **Prisma Client** (اللي بيستخدمه موقعك فعليًا) يحتاج اتصال الـTCP المباشر.

### توصية مهمة قبل أي launch حقيقي

منصة Next.js بتستخدم Prisma Client اللي بيقرأ `DATABASE_URL`. لو اتصال الـhost المباشر لسه محظور من شبكتك، نفس المشكلة هتظهر في الإنتاج. عندك خياران:

1. **(مؤقت/شبكة)** إعادة تشغيل الراوتر أو تعديل إعدادات IPv6 — host المباشر هو الطريقة الصحيحة.
2. **(بدون تغيير إعدادات)** استخدام `aws-0-eu-north-1.pooler.supabase.com` كـ`DATABASE_URL` أيضًا — يعمل لكن pooler (pgbouncer) لا يدعم بعض عمليات Prisma (مثل interactive transactions وبعض الـmigrations). للمشروع الحالي اللي كل queries بسيطة، غالبًا شغال كويس.

## النتائج النهائية (كلها نجحت ✅)

### 1. `node scripts\verify-baseline.js`
```
NOTE: DATABASE_URL unreachable. Trying DIRECT_URL (pooler)...
Connected via: DIRECT_URL (pooler)
Baseline defines 14 tables; live DB has 14 user tables.
RESULT: baseline matches the live database schema exactly. Safe to record baseline as applied.
Migration 0000_baseline marked as applied.
Baseline recorded as applied. Migration history is now established.
```

### 2. `npx prisma validate`
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
The schema at prisma\schema.prisma is valid 🚀
```

### 3. `npm run build`
```
▲ Next.js 15.5.23 - ✓ Compiled successfully in 6.3s - ✓ Linting and checking validity of types
✓ Collecting page data ✓ Generating static pages (16/16) ✓ Finalizing page optimization
0 errors — كل الـRoutes (admin/student/teacher/api/auth) اتبنت بنجاح
```

## الوضع الآن

- Migration history مرتبة: `0000_baseline` مسجلة كمطبّقة (14 جدول).
- أي `prisma migrate dev` قادم سينشئ migrations جديدة فوقها بأمان.
- المشروع جاهز لبدء Priority 1 (نظام الحصص + بوابات الطالب والمعلم).
