import { createClient } from "@supabase/supabase-js";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

// Allowed mime types for uploads (payment proofs and avatars).
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function bucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "sana-uploads";
}

export type UploadResult = {
  ok: true;
  url: string;
} | {
  ok: false;
  error: string;
};

// Upload a file under a role-scoped path.
// - student proof:  payments/{studentId}/{timestamp}-{filename}
// - avatar:        avatars/{userId}/{timestamp}-{filename}
async function uploadToBucket(
  bucket: string,
  path: string,
  file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> | ArrayBuffer },
): Promise<UploadResult> {
  if (!file.type || !ALLOWED_MIME.includes(file.type)) {
    return {
      ok: false,
      error: "نوع الملف غير مسموح. مسموح فقط: صور JPG/PNG/WEBP أو ملف PDF.",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.",
    };
  }

  // Normalize the filename: strip directory parts and non-ASCII chars to be safe.
  const safeName = file.name
    .replace(/[\\/]/g, "-")
    .replace(/[^\w.\u0600-\u06FF-]/g, "-")
    .slice(0, 120) || "file";
  const storagePath = `${path}/${Date.now()}-${safeName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
const client = getSupabase();
    const { data, error } = await client.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });
    if (error) {
      return { ok: false, error: "فشل حفظ الملف. تحققي من الاتصال وحاولي مرة أخرى." };
    }
    const { data: signed } = await client.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 15);
    if (!signed?.signedUrl) {
      return { ok: false, error: "فشل إنشاء رابط الملف" };
    }
    return { ok: true, url: signed.signedUrl };
  } catch {
    return { ok: false, error: "فشل حفظ الملف. تحققي من الاتصال وحاولي مرة أخرى." };
  }
}

export async function uploadPaymentProof(
  studentId: string,
  file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> | ArrayBuffer },
): Promise<UploadResult> {
  return uploadToBucket(bucketName(), `payments/${studentId}`, file);
}

export async function uploadAvatar(
  userId: string,
  file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> | ArrayBuffer },
): Promise<UploadResult> {
  return uploadToBucket(bucketName(), `avatars/${userId}`, file);
}
