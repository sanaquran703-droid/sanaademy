import { createClient } from "@supabase/supabase-js";

// Server-only Supabase admin client (service role key).
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const supabase = supabaseAdmin;

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
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });
    if (error) {
      return { ok: false, error: "فشل حفظ الملف. تحققي من الاتصال وحاولي مرة أخرى." };
    }
    // Sign the URL regardless of bucket policy so it is always readable server-side.
    const { data: signed } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60 * 24 * 30); // 30 days
    return { ok: true, url: signed?.signedUrl ?? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}` };
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
