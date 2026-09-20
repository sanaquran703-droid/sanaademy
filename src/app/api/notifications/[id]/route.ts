import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markAsRead } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await markAsRead(id, session.id);
  return NextResponse.json({ ok: true });
}
