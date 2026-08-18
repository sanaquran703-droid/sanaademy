import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

// Read-only display data for the session student's profile page.
export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { userId } = auth.ctx;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, avatarUrl: true, username: true },
  });

  return NextResponse.json({
    ok: true,
    fullName: user?.fullName ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    username: user?.username ?? null,
  });
}
