import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

// Active students for the signed-in teacher, grouped by their group.
// Optionally filters by name (client can pass ?name=...).
export async function GET(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const nameFilter = searchParams.get("name")?.trim() || null;

  const year = currentAcademicYear();

  const groups = await prisma.group.findMany({
    where: { teacherId: auth.ctx.teacherId, isActive: true },
    include: { 
      program: { select: { name: true } },
      enrollments: {
        where: {
          academicYear: year,
          status: "active",
          ...(nameFilter ? { student: { user: { fullName: { contains: nameFilter, mode: "insensitive" } } } } : {}),
        },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, avatarUrl: true } },
              memorizationPlan: {
                select: {
                  currentSurah: true,
                  progressPct: true,
                }
              },
              evaluations: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: {
                  memorization: true,
                  createdAt: true,
                }
              }
            }
          }
        }
      }
    },
  });

  const out = groups.map((group) => ({
    groupId: group.id,
    groupName: group.name,
    programName: group.program?.name ?? null,
    students: group.enrollments.map((e) => ({
      id: e.student.id,
      fullName: e.student.user.fullName,
      avatarUrl: e.student.user.avatarUrl,
      groupName: group.name,
      plan: e.student.memorizationPlan ? {
        surah: e.student.memorizationPlan.currentSurah,
        progress: e.student.memorizationPlan.progressPct
      } : null,
      lastEvaluation: e.student.evaluations[0] ? {
        grade: e.student.evaluations[0].memorization,
        date: e.student.evaluations[0].createdAt
      } : null
    })),
  }));

  return NextResponse.json({ ok: true, groups: out, academicYear: year });
}
