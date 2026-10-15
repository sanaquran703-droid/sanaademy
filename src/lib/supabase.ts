import { createClient } from "@supabase/supabase-js";
import { validateUpload, MAX_FILE_SIZE, type UploadKind } from "./file-validation";

export { MAX_FILE_SIZE };

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

type UploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer> | ArrayBuffer;
};

// Upload a file under a role-scoped path.
// - student proof:  payments/{studentId}/{timestamp}-{filename}
// - avatar:        avatars/{userId}/{timestamp}-{filename}
async function uploadToBucket(
  bucket: string,
  path: string,
  kind: UploadKind,
  file: UploadFile,
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.",
    };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, error: "تعذّر قراءة الملف المرفوع." };
  }

  // Content-based validation: never trust the client-declared File.type alone.
  const check = validateUpload(kind, file.type, file.size, bytes);
  if (!check.ok) {
    return { ok: false, error: check.error };
  }

  // Normalize the filename: strip directory parts and non-ASCII chars to be safe.
  const safeName = file.name
    .replace(/[\\/]/g, "-")
    .replace(/[^\w.\u0600-\u06FF-]/g, "-")
    .slice(0, 120) || "file";
  const storagePath = `${path}/${Date.now()}-${safeName}`;

  try {
    const client = getSupabase();
    const { data, error } = await client.storage
      .from(bucket)
      .upload(storagePath, Buffer.from(bytes), {
        contentType: check.mime,
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
  file: UploadFile,
): Promise<UploadResult> {
  return uploadToBucket(bucketName(), `payments/${studentId}`, "proof", file);
}

export async function uploadAvatar(
  userId: string,
  file: UploadFile,
): Promise<UploadResult> {
  return uploadToBucket(bucketName(), `avatars/${userId}`, "avatar", file);
}
