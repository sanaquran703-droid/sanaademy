# scripts/setup-migrations.md

هذا الملف يشرح كيف يتم تسجيل الـmigration history بشكل آمن (بدون أي تغيير على قاعدة بيانات Supabase).

## الخطوة 1: توليد baseline migration

```bash
cd D:\quran-sana\Sana-quran-academy-platform
node scripts/make-baseline.js
```

هذا يولّد `prisma/migrations/0000_baseline/migration.sql` — وهو الـSQL الكامل لبناء الـschema الحالي من قاعدة فارغة.

## الخطوة 2: التحقق والمطابقة مع قاعدة البيانات الحية

```bash
node scripts/verify-baseline.js
```

هذا السكربت:
1. يقارن الـmigrations folder بقاعدة البيانات الحية عبر `prisma migrate diff --from-migrations --to-schema-datasource`.
2. إذا كان الناتج فارغًا (مطابقة تامة) → يسجّل `0000_baseline` كمطبّق عبر `prisma migrate resolve --applied 0000_baseline` **بدون تنفيذ أي SQL**.
3. إذا وجد فرقًا → يتوقف ويشرح الفرق، ولا يغيّر أي شيء في الـDB.

## ملاحظات مهمة

- **لا تشغّل أبدًا** `prisma migrate reset` أو `prisma db push --force-reset` — ده هيحذف بيانات Supabase.
- الـbaseline migration لا يغيّر الـDB إطلاقًا؛ هو فقط يسجّل التاريخ عشان `prisma migrate deploy` شغال من دلوقتي.
- أي تغيير مستقبلي على الـschema يتم عبر `npx prisma migrate dev --name <name>` (development) ثم `migrate deploy` (production).
