# Priority 0 — تنظيف وتثبيت الأساس

**التاريخ:** 16 أغسطس 2026
**الهدف:** تثبيت أساس المشروع قبل البدء في بناء تجربة الطالبة والمعلمة.

---

## 1. الملفات المحذوفة

| الملف | السبب |
| --- | --- |
| `docker-compose.yml` | منسوخ من مشروع آخر (`r4t-ops-platform`، قاعدة بيانات باسم `r4t_ops_db`) ولا يُستخدم — تم الحذف بطلبك |
| `netlify.toml` | كان يتعارض مع إعدادات `next.config.ts` (الـbuild كان يطلع غير standalone) ولا يُستخدم في الـdeploy |
| `src/lib/supabase.ts` | ملف ميت من مشروع تاني (دوال `uploadCV`/`deleteCV` للـcandidates) — لا يوجد أي كود يستخدمه |
| `.tmp-check.js` | ملف debugging متسبي من جلسة Claude Code |
| `.tmp-prisma-test.js` | ملف debugging متسبي من جلسة Claude Code |

## 2. الـDependencies المحذوفة من `package.json`

الاعتمادات التالية كانت مثبتة بدون أي استخدام فعلي في الكود (تم التحقق بالبحث في `src/`):

`@anthropic-ai/sdk`, `next-auth`, `@auth/prisma-adapter`, `openai`, `pdf-parse`, `@supabase/supabase-js`, `exceljs`, `uuid`, `zustand`, `cmdk`, `react-dropzone`, `recharts`, `date-fns`, `@types/uuid`, `@types/pdf-parse`

**النتيجة:** بيئة أنظف، build أسرع، وحجم Docker image أصغر، وسطح هجمات أمان أقل.

**الاعتمادات المتبقية كلها مستخدمة:** `next`, `react`, `@prisma/client`, `jose`, `bcryptjs`, `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, Radix UI components, `autoprefixer`, `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`.

## 3. إصلاحات `next.config.ts`

| قبل | بعد |
| --- | --- |
| `output: "standalone"` مشروط بـ `NETLIFY` env | `output: "standalone"` دائمًا (Netlify config محذوف) |
| `serverExternalPackages` تضمن `pdf-parse` (محذوف) | `["@prisma/client"]` فقط |
| `images.remotePatterns` تضمن `*.supabase.co` | أُزيل (مفيش رفع صور من Supabase حاليًا) |

## 4. توحيد `AUTH_SECRET` (أهم إصلاح)

الكود يستخدم `AUTH_SECRET` (نظام جلسات مخصص بـ `jose` — **مش NextAuth**). لكن ملفات الإعداد القديمة كانت تشير إلى `NEXTAUTH_SECRET` و `NEXTAUTH_URL`، ولو أي حد ضبط الـenv منها كان هيحصل crash فوري.

| الملف | التعديل |
| --- | --- |
| `.env` | حُذف `NEXT_PUBLIC_SUPABASE_*` و `SUPABASE_SERVICE_ROLE_KEY` و `SUPABASE_STORAGE_BUCKET` (مفيش كود يستخدمهم) + حُذف سطر `DATABASE_URL` مكسور كان متعلق |
| `.env.example` | أُعيد كتابته بالكامل: `AUTH_SECRET` واضح ومُوثّق + تعليمات توليد سر قوي (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) + ملاحظة أن `DATABASE_URL` للـruntime و `DIRECT_URL` للـmigrations فقط |

> **ملاحظة مهمة:** الـ`AUTH_SECRET` الحالي (`sana-academy-2026-secure-secret-key`) قابل للتخمين. **قبل الـproduction لازم تولّد سرًا عشوائيًا 64 حرف** وتضعه في الـenv على Render. لو غيّرته دلوقتي، كل الجلسات الحالية هتتوقف (مش مشكلة في مرحلة التطوير).

## 5. إصلاح `render.yaml`

كان بيشير لمشروع `r4t-ops-platform` مع قاعدة بيانات `r4t-postgres` منسوخة من مشروع آخر.

| التعديل | التفاصيل |
| --- | --- |
| `name` | `r4t-ops-platform` → `sana-quran-academy` |
| الـdatabases block | حُذف (مفيش DB بتنشأ من Render — انت تستخدم Supabase مباشرة) |
| `DATABASE_URL` | من `fromDatabase: r4t-postgres` → `sync: false` (بتدخله يدويًا في Render dashboard) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | استبدلوا بـ`AUTH_SECRET` + `DIRECT_URL` |
| `INTERNAL_API_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, Supabase vars | حُذفوا (غير مستخدمين) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | أُضيف |

## 6. Prisma: تثبيت الإصدار + ترتيب الـmigrations بأمان

**الإصدار:** `prisma@5.20.0` (dev) و `@prisma/client@5.20.0` — متطابقان، مفيش خلط إصدارات. ملاحظة: آخر إصدار متاح حاليًا هو 5.22.x؛ لو عايز تثبت إصدارًا محددًا اعمل `npm i -D prisma@5.20.0` و `npm i @prisma/client@5.20.0` و commit الـlock.

**مشكلة الـmigrations:** المشروع اتبنى بـ`db push` تمامًا على Supabase، فمفيش مجلد `prisma/migrations` إطلاقًا. هذا يعني:
- `prisma migrate deploy` هيشتكي أو تعمل أشياء غير متوقعة.
- مفيش history رسمي لأي تغيير مستقبلي على الـschema.

**الحل الآمن (بدون أي Reset للـSupabase):**

تم إنشاء `prisma/migrations/0000_baseline/migration.sql` في نسختك المحلية من السكربت — هذا الـSQL يطابق الـschema الحالي 100% (تم توليده بـ `prisma migrate diff --from-empty`).

**الخطوة الوحيدة المطلوبة منك** (تشغّلها مرة واحدة على جهازك — لا تلمس الـDB إطلاقًا):

```powershell
cd D:\quran-sana\Sana-quran-academy-platform
node scripts/make-baseline.js      # يولّد migration.sql (اتعملت بالفعل)
node scripts/verify-baseline.js    # يقارن بالـDB الحي، وإذا طابق يسجّلها كمطبّقة
```

`verify-baseline.js` بيعمل الآتي:
1. `prisma migrate diff --from-migrations --to-schema-datasource` — يقارن الـmigrations folder بقاعدة Supabase الحية.
2. لو المطابقة تامة → `prisma migrate resolve --applied 0000_baseline` — **يسجّل فقط، لا ينفذ أي SQL**.
3. لو في فرق → يتوقف فورًا ويطلع الفرق، من غير ما يغيّر أي حاجة في الـDB.

بعد كده الـmigration history مرتبة وآمنة، وأي تغيير مستقبلي هيتعمل بـ `npx prisma migrate dev --name <name>` و `prisma migrate deploy` على الإنتاج.

## 7. الـSeed Script

`prisma/seed.ts` سليم وآمن (يتخطى إذا admin موجود بالفعل) — لم يتغير.

## 8. الخطوات التالية المطلوبة منك

1. **نظّف الـnode_modules والـlockfile وأعد التثبيت** (مهم بعد حذف الـdependencies — الـ`package-lock.json` الحالي لسه فيه الـpackages القديمة):

```powershell
cd D:\quran-sana\Sana-quran-academy-platform
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

2. **شغّل سكربت ترتيب الـmigrations** (من القسم 6).

3. **اختبر الـbuild:**

```powershell
npm run build
```

4. **(موصى به قبل الـproduction)** ولّد `AUTH_SECRET` قوي جديد.

5. **Commit التغييرات:**

```powershell
git add .
git commit -m "Priority 0: cleanup unused deps/files, unify AUTH_SECRET, fix render config, establish baseline migrations"
```

---

*ملاحظة: `.next/` موجودة في مجلد المشروع رغم أن `.gitignore` يستثنيها — تأكد إنها مش متـcommitted في الـgit history، ولو موجودة اتعمل `git rm -r --cached .next`.*
