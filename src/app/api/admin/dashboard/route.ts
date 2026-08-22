import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { currentAcademicYear } from "@/lib/academic-year";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const year = currentAcademicYear();
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    activeStudents,
    teachers,
    activeGroups,
    weekLessons,
    attendanceStats,
    pendingPayments
  ] = await Promise.all([
    prisma.enrollment.count({ where: { academicYear: year, status: "active" } }),
    prisma.teacher.count(),
    prisma.group.count({ where: { isActive: true } }),
    prisma.lesson.count({
      where: {
        scheduledAt: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        lesson: {
          scheduledAt: { gte: thirtyDaysAgo },
        },
      },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "pending" },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  // Calculate attendance percentage
  const totalAttendance = attendanceStats.reduce((acc, curr) => acc + curr._count, 0);
  const presentCount = attendanceStats.find(a => a.status === "present")?._count || 0;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return NextResponse.json({
    ok: true,
    stats: {
      activeStudents,
      teachers,
      activeGroups,
      weekLessons,
      attendanceRate,
      pendingPayments: {
        count: pendingPayments._count,
        totalAmount: pendingPayments._sum.amount || 0,
      },
    },
  });
}
