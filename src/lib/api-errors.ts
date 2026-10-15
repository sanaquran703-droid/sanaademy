import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Parse a JSON request body without leaking parsing errors as 500s.
export async function readJson(
  req: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    const data = await req.json();
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }),
    };
  }
}

// Map expected Prisma errors to appropriate HTTP status codes without exposing
// internal database details or stack traces.
export function prismaErrorResponse(
  err: unknown,
  fallback = "تعذّر تنفيذ العملية",
): NextResponse {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
      case "P2002":
        return NextResponse.json({ error: "البيانات مكررة" }, { status: 409 });
      case "P2003":
      case "P2014":
        return NextResponse.json(
          { error: "لا يمكن إتمام العملية لوجود بيانات مرتبطة" },
          { status: 409 },
        );
      default:
        break;
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
