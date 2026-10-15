import { z } from "zod";

// Reasonable upper bound for a single permanent bulk-delete request.
export const MAX_BULK_DELETE = 100;

export const uuidSchema = z.string().uuid("معرّف غير صالح");

// Validates a list of entity IDs: non-empty, bounded, and uuid-formatted.
export const idListSchema = z
  .array(uuidSchema)
  .min(1, "لم يتم تحديد أي عناصر")
  .max(MAX_BULK_DELETE, `الحد الأقصى ${MAX_BULK_DELETE} عنصر في العملية الواحدة`);
