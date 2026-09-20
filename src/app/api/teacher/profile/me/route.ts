import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireTeacher();
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
