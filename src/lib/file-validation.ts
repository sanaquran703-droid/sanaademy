// Content-based upload validation. We never rely on the client-provided
// File.type alone: the magic bytes of the uploaded content are inspected and
// must match both the allow-list for the upload kind and the declared type.

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROOF_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export type UploadKind = "avatar" | "proof";

export function allowedMimeFor(kind: UploadKind): readonly string[] {
  return kind === "avatar" ? IMAGE_MIME : PROOF_MIME;
}

// Detect the real MIME type from the leading bytes (file signature).
export function detectMimeFromBytes(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  ) {
    return "application/pdf";
  }
  return null;
}

export type UploadValidation =
  | { ok: true; mime: string }
  | { ok: false; error: string };

export function validateUpload(
  kind: UploadKind,
  declaredType: string,
  size: number,
  bytes: Uint8Array,
): UploadValidation {
  const allowed = allowedMimeFor(kind);

  if (!declaredType || !allowed.includes(declaredType)) {
    return { ok: false, error: "نوع الملف غير مسموح." };
  }
  if (size > MAX_FILE_SIZE || bytes.byteLength > MAX_FILE_SIZE) {
    return { ok: false, error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت." };
  }

  const detected = detectMimeFromBytes(bytes);
  if (!detected) {
    return { ok: false, error: "تعذّر التحقق من محتوى الملف. الملف غير صالح." };
  }
  if (!allowed.includes(detected)) {
    return { ok: false, error: "نوع الملف غير مسموح." };
  }
  if (detected !== declaredType) {
    return { ok: false, error: "محتوى الملف لا يطابق نوعه." };
  }
  return { ok: true, mime: detected };
}
