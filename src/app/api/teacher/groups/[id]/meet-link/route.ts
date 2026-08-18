import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsGroup } from "@/lib/teacher-auth";
import type { MeetingProvider } from "@prisma/client";

const schema = z.object({
  meetLink: z
    .string()
    .max(500)
    .refine((v) => !v || /^https?:\/\/\S+/.test(v.trim()), "رابط غير صحيح، يجب أن يبدأ بـ http:// أو https://")
    .transform((v) => (v ? v.trim() : "")),
  meetingProvider: z.enum(["google_meet", "zoom", "discord", "teams", "other"] as const).default("google_meet"),
});

// Update the group's meeting link and/or provider.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { id: groupId } = await params;

  if (!(await assertTeacherOwnsGroup(auth.ctx.teacherId, groupId))) {
    return NextResponse.json({ error: "هذه الحلقة ليست من حلقاتك" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }
  const d = parsed.data;

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      meetLink: d.meetLink || null,
      meetingProvider: d.meetLink ? (d.meetingProvider as MeetingProvider) : undefined,
    },
    select: { id: true, name: true, meetLink: true, meetingProvider: true },
  });

  return NextResponse.json({ ok: true, group });
}
