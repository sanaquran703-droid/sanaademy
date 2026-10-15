import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/teacher-auth";
import { prisma } from "@/lib/prisma";
import { assertTeacherOwnsStudent } from "@/lib/teacher-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Phone, BookOpen, History, TrendingUp, ChevronRight, 
  Calendar, Star, Award, GraduationCap, MapPin, 
  User as UserIcon, MessageSquare, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type Grade = "excellent" | "very_good" | "good" | "needs_review" | null;
const GRADE_LABELS: Record<string, string> = {
  excellent: "ممتاز",
  very_good: "جيد جداً",
  good: "جيد",
  needs_review: "مراجعة",
};

const GRADE_COLORS: Record<string, string> = {
  excellent: "text-green-600 bg-green-50 border-green-200",
  very_good: "text-blue-600 bg-blue-50 border-blue-200",
  good: "text-yellow-600 bg-yellow-50 border-yellow-200",
  needs_review: "text-destructive bg-destructive/5 border-destructive/20",
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
  const { id: studentId } = await params;
  const auth = await requireTeacher();
  if (!auth.ok) {
    notFound();
  }

  if (!(await assertTeacherOwnsStudent(auth.ctx.teacherId, studentId))) {
    notFound();
  }

  const [student, yearLessons] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true, username: true, phone: true, avatarUrl: true } },
        memorizationPlan: true,
        enrollments: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          include: { group: { select: { name: true, teacher: { select: { user: { select: { fullName: true } } } } } } },
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
  const enrollments = student.enrollments;

  return (
    <div className="space-y-8 pb-10">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-2xl hover:bg-primary/5">
            <Link href="/teacher/students"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">{u.fullName}</h1>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>طالبة نشطة في {enrollments.length} حلقات</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="rounded-2xl border-primary/20 hover:bg-primary/5 font-bold h-10">
            <Link href={`/teacher/students/${studentId}/plan`}>
              <TrendingUp className="ml-2 h-4 w-4" /> تعديل الخطة
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          {/* Profile Card */}
          <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center font-black text-3xl shadow-inner shrink-0 overflow-hidden">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    u.fullName.charAt(0)
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 w-full">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">رقم ولي الأمر</div>
                    <div className="flex items-center gap-2 font-bold text-lg" dir="ltr">
                      <Phone className="h-4 w-4 text-primary/60" />
                      {student.guardianPhone ?? u.phone ?? "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">اسم المستخدم</div>
                    <div className="flex items-center gap-2 font-bold text-lg text-primary/80">
                      <UserIcon className="h-4 w-4 text-primary/60" />
                      {u.username}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">الحلقات الحالية</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {enrollments.map((e, idx) => (
                        <Badge key={idx} variant="outline" className="rounded-xl bg-primary/5 text-primary border-primary/10 font-black px-3">
                          {e.group?.name || "حلقة غير معروفة"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">الملاحظات</div>
                    <div className="flex items-center gap-2 font-bold text-muted-foreground">
                      {student.notes || "لا توجد ملاحظات"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memorization Plan */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-primary flex items-center gap-2 px-2">
              <BookOpen className="h-5 w-5 text-secondary" /> خطة الحفظ والمراجعة
            </h2>
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm bg-card/50 overflow-hidden">
              <CardContent className="p-8">
                {student.memorizationPlan ? (
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3 relative overflow-hidden">
                      <div className="absolute -top-2 -right-2 opacity-5"><BookOpen className="h-20 w-20" /></div>
                      <div className="text-xs font-black text-primary uppercase tracking-widest">المحفوظ الحالي</div>
                      <div className="text-2xl font-black text-primary">
                        {student.memorizationPlan.currentSurah || "—"}
                      </div>
                      <div className="text-sm font-bold text-primary/60">
                        {(student.memorizationPlan.currentAyahFrom ?? student.memorizationPlan.currentAyahTo)
                          ? `من آية ${student.memorizationPlan.currentAyahFrom ?? "1"} إلى ${student.memorizationPlan.currentAyahTo ?? "الأخيرة"}`
                          : "لم يتم تحديد الآيات"}
                      </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100/50 space-y-3 relative overflow-hidden">
                      <div className="absolute -top-2 -right-2 opacity-5"><Star className="h-20 w-20 text-amber-600" /></div>
                      <div className="text-xs font-black text-amber-600 uppercase tracking-widest">المراجعة الحالية</div>
                      <div className="text-2xl font-black text-amber-600">
                        {student.memorizationPlan.reviewSurah || "—"}
                      </div>
                      <div className="text-sm font-bold text-amber-600/60">
                        {(student.memorizationPlan.reviewAyahFrom ?? student.memorizationPlan.reviewAyahTo)
                          ? `من آية ${student.memorizationPlan.reviewAyahFrom ?? "1"} إلى ${student.memorizationPlan.reviewAyahTo ?? "الأخيرة"}`
                          : "لم يتم تحديد الآيات"}
                      </div>
                    </div>
                    {student.memorizationPlan.notes && (
                      <div className="sm:col-span-2 p-6 rounded-3xl bg-muted/30 border border-border/40 space-y-2">
                        <div className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5" /> ملاحظات المعلمة
                        </div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                          {student.memorizationPlan.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-30"><BookOpen className="h-8 w-8" /></div>
                    <p className="text-muted-foreground font-medium italic">لم يتم وضع خطة حفظ لهذه الطالبة بعد.</p>
                    <Button asChild className="rounded-2xl px-8 font-black shadow-lg">
                      <Link href={`/teacher/students/${studentId}/plan`}>وضع خطة الآن</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar: Stats & Recent Activity */}
        <div className="space-y-8">
          {/* Stats Card */}
          <Card className="rounded-[2.5rem] border-none bg-primary text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="h-20 w-20" /></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black opacity-70 flex items-center gap-2">
                <Award className="h-4 w-4" /> ملخص الإنجاز
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black opacity-60 uppercase">نسبة الحضور</div>
                  <div className="text-2xl font-black">{attendancePct !== null ? `${attendancePct}%` : "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black opacity-60 uppercase">تقدم الحفظ</div>
                  <div className="text-2xl font-black">{student.memorizationPlan?.progressPct ? `${student.memorizationPlan.progressPct}%` : "—"}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-primary-foreground/10">
                <div className="text-[10px] font-black opacity-60 uppercase mb-2">الحصص المسجلة</div>
                <div className="text-lg font-black">{total} حصة إجمالاً</div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Lessons */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-primary flex items-center gap-2 px-2">
              <History className="h-5 w-5 text-primary/60" /> آخر التقييمات
            </h2>
            <div className="space-y-3">
              {yearLessons.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic bg-muted/10 rounded-3xl border border-dashed border-border/60">
                  لا توجد حصص مسجلة
                </div>
              ) : (
                yearLessons.map((l) => (
                  <Card key={l.id} className="rounded-3xl border-border/40 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black text-muted-foreground" dir="ltr">
                          {new Date(l.scheduledAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <Badge variant={l.status === "completed" ? "default" : "secondary"} className="rounded-lg text-[8px] h-4 px-2 font-black">
                          {LESSON_STATUS_LABELS[l.status] ?? l.status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs font-bold text-primary/80">
                        {l.newPortion ? <span>{l.newPortion}</span> : <span className="text-muted-foreground/50">لا يوجد حفظ</span>}
                      </div>

                      {l.evaluation && (
                        <div className="flex flex-wrap gap-1">
                          {(["memorization", "review", "tajweed", "commitment"] as const).map((dim) => {
                            const grade = (l.evaluation?.[dim] as Grade);
                            if (!grade) return null;
                            return (
                              <Badge key={dim} variant="outline" className={cn("text-[8px] px-1.5 py-0 rounded-md font-black border-none", GRADE_COLORS[grade])}>
                                {GRADE_LABELS[grade]}
                              </Badge>
                            );
                          })}
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
    </div>
  );
}
