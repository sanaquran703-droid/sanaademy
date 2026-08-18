import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/teacher-auth";
import { prisma } from "@/lib/prisma";
import { assertTeacherOwnsStudent } from "@/lib/teacher-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, BookOpen, History, TrendingUp } from "lucide-react";

type Grade = "excellent" | "very_good" | "good" | "needs_review" | null;
const GRADE_LABELS: Record<string, string> = {
  excellent: "ممتاز",
  very_good: "جيد جداً",
  good: "جيد",
  needs_review: "يحتاج مراجعة",
};

const LESSON_STATUS_LABELS: Record<string, string> = {
  completed: "مكتملة",
  absent: "غائبة",
  excused: "مأذون",
  scheduled: "مجدولة",
};

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) {
    notFound();
  }

  const { id: studentId } = await params;

  if (!(await assertTeacherOwnsStudent(auth.ctx.teacherId, studentId))) {
    notFound();
  }

  const [student, yearLessons] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true, username: true, phone: true } },
        memorizationPlan: true,
        enrollments: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { academicYear: true, group: { select: { name: true, teacher: { select: { user: { select: { fullName: true } } } } } } },
        },
      },
    }),
    prisma.lesson.findMany({
      where: { studentId },
      orderBy: { scheduledAt: "desc" },
      take: 6,
      include: {
        evaluation: { select: { memorization: true, review: true, tajweed: true, commitment: true } },
      },
    }),
  ]);

  if (!student) notFound();

  const attendanceRows = await prisma.attendance.findMany({
    where: { studentId },
    select: { status: true },
  });
  const total = attendanceRows.length;
  const attended = attendanceRows.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : null;

  const u = student.user;
  const group = student.enrollments[0]?.group;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">{u.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {group?.name ?? "—"}
            {group?.teacher?.user.fullName ? ` · المعلمة ${group.teacher.user.fullName}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-lg">
          <Link href="/teacher/students">العودة للطالبات</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<Phone className="h-4 w-4" />} label="رقم ولي الأمر" value={student.guardianPhone ?? u.phone ?? "—"} />
        <InfoCard
          icon={<BookOpen className="h-4 w-4" />}
          label="نسبة الحضور"
          value={attendancePct !== null ? `${attendancePct}%` : "—"}
        />
        <InfoCard
          icon={<History className="h-4 w-4" />}
          label="الحصص المسجَّلة"
          value={total > 0 ? `${total} حصة` : "لا يوجد"}
        />
        <InfoCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="تقدم الحفظ"
          value={student.memorizationPlan?.progressPct ? `${student.memorizationPlan.progressPct}%` : "—"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Memorization plan */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-primary">خطة الحفظ</h2>
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              {student.memorizationPlan ? (
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 text-muted-foreground">المحفوظ الحالي:</span>
                    <span className="font-medium">
                      {student.memorizationPlan.currentSurah || "—"}
                      {(student.memorizationPlan.currentAyahFrom ?? student.memorizationPlan.currentAyahTo)
                        ? ` ${student.memorizationPlan.currentAyahFrom ?? ""}-${student.memorizationPlan.currentAyahTo ?? ""}`
                        : null}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 text-muted-foreground">المراجعة:</span>
                    <span className="font-medium">
                      {student.memorizationPlan.reviewSurah || "—"}
                      {(student.memorizationPlan.reviewAyahFrom ?? student.memorizationPlan.reviewAyahTo)
                        ? ` ${student.memorizationPlan.reviewAyahFrom ?? ""}-${student.memorizationPlan.reviewAyahTo ?? ""}`
                        : null}
                    </span>
                  </div>
                  {student.memorizationPlan.notes && (
                    <div className="flex gap-2">
                      <span className="w-28 shrink-0 text-muted-foreground">ملاحظات:</span>
                      <span className="text-muted-foreground">{student.memorizationPlan.notes}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button asChild size="sm" className="rounded-lg">
                      <Link href={`/teacher/students/${studentId}/plan`}>تعديل الخطة</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  لم تُوضع خطة حفظ بعد.
                  <Button asChild size="sm" className="ms-3 rounded-lg">
                    <Link href={`/teacher/students/${studentId}/plan`}>وضع الخطة</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent lessons */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-primary">آخر الحصص</h2>
          <div className="space-y-3">
            {yearLessons.length === 0 ? (
              <Card className="rounded-2xl p-5 text-sm text-muted-foreground">لا توجد حصص مسجَّلة بعد.</Card>
            ) : (
              yearLessons.map((l) => (
                <Card key={l.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span dir="ltr" className="font-medium">{new Date(l.scheduledAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
                      <Badge variant={l.status === "completed" ? "default" : "secondary"} className="rounded-full">
                        {LESSON_STATUS_LABELS[l.status] ?? l.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {l.newPortion ? <span>محفوظ: {l.newPortion}</span> : null}
                      {l.reviewPortion ? <span className="ms-2">مراجعة: {l.reviewPortion}</span> : null}
                    </div>
                    {l.evaluation && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(["memorization", "review", "tajweed", "commitment"] as const).map((dim) => (
                          <Badge key={dim} variant="outline" className="rounded-full bg-secondary/10 text-secondary">
                            {GRADE_LABELS[(l.evaluation?.[dim] as Grade) ?? ""] ?? "—"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
