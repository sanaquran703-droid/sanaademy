"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, BookOpen, Star, CreditCard, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const gradeLabel: Record<string, string> = {
  excellent: "ممتازة",
  very_good: "جيدة جداً",
  good: "جيدة",
  needs_review: "تحتاج مراجعة",
};

type DashboardData = {
  ok: boolean;
  plan: { currentSurah: string | null; progressPct: number } | null;
  lastEvaluation: {
    createdAt: string;
    newPortion: string | null;
    reviewPortion: string | null;
    grades: Record<string, string>;
    overallNote: string | null;
  } | null;
  todayLesson: {
    groupName: string | null;
    meetLink: string | null;
    meetingProvider: string | null;
    startTime: string;
    durationMins: number | null;
    status: "upcoming" | "ongoing" | "finished";
  } | null;
  payment: { month: string; status: string };
};

export default function StudentDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "تعذّر التحميل");
        setData(d);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل البيانات", description: "حاولي مرة أخرى", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  const d = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">حاصلاتي اليوم</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's lesson */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">حصة اليوم</div>
              <div className="font-semibold">{d?.todayLesson?.groupName ?? "لا توجد حصة اليوم"}</div>
            </div>
          </div>
          {d?.todayLesson ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span dir="ltr">
                  {new Date(d.todayLesson.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  {d.todayLesson.durationMins ? ` — ${d.todayLesson.durationMins} دقيقة` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={d.todayLesson.status === "ongoing" ? "default" : d.todayLesson.status === "upcoming" ? "secondary" : "outline"}
                >
                  {d.todayLesson.status === "ongoing" ? "الحصة جارية الآن" : d.todayLesson.status === "upcoming" ? "قادمة" : "انتهت"}
                </Badge>
              </div>
              {d.todayLesson.meetLink && d.todayLesson.status !== "finished" && (
                <a
                  href={d.todayLesson.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> دخول الحلقة
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد جدول مسجّل لكِ اليوم. استريحي وراجعي ما حفظتيه.</p>
          )}
        </div>

        {/* Memorization plan */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">خطة الحفظ</div>
              <div className="font-semibold">{d?.plan?.currentSurah ?? "لم تُحدَّد خطة بعد"}</div>
            </div>
          </div>
          {d?.plan ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>التقدّم</span>
                <span dir="ltr">{d.plan.progressPct}%</span>
              </div>
              <Progress value={d.plan.progressPct} />
              <Link href="/student/plan" className="text-sm font-medium text-primary hover:underline">
                عرض الخطة بالتفصيل ←
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">المعلمة ستحدّد لكِ خطة الحفظ قريباً إن شاء الله.</p>
          )}
        </div>

        {/* Last evaluation */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">آخر تقييم</div>
              <div className="font-semibold">{d?.lastEvaluation ? "من المعلمة" : "لم يُسجَّل تقييم بعد"}</div>
            </div>
          </div>
          {d?.lastEvaluation ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {Object.entries(d.lastEvaluation.grades).map(([key, grade]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {gradeLabel[grade] ?? grade}
                  </Badge>
                ))}
              </div>
              {d.lastEvaluation.overallNote ? (
                <p className="text-sm text-muted-foreground">{d.lastEvaluation.overallNote}</p>
              ) : null}
              <div className="text-xs text-muted-foreground">
                <span dir="ltr">
                  {new Date(d.lastEvaluation.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                {d.lastEvaluation.newPortion ? ` — جديد: ${d.lastEvaluation.newPortion}` : ""}
              </div>
              <Link href="/student/lessons" className="text-sm font-medium text-primary hover:underline">
                عرض كل التقييمات ←
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">ستجدين تقييماتك هنا بعد أول حصة تسميع.</p>
          )}
        </div>

        {/* Payment status */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">حالة الاشتراك</div>
              <div className="font-semibold">
                {d?.payment?.status === "confirmed"
                  ? "مسدد هذا الشهر"
                  : d?.payment?.status === "pending"
                    ? "قيد المراجعة"
                    : d?.payment?.status === "rejected"
                      ? "مرفوض — ارفعي إثباتاً جديداً"
                      : "لم يُسدد هذا الشهر بعد"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                d?.payment?.status === "confirmed"
                  ? "default"
                  : d?.payment?.status === "pending"
                    ? "secondary"
                    : d?.payment?.status === "rejected"
                      ? "destructive"
                      : "outline"
              }
            >
              {d?.payment?.status === "confirmed"
                ? "مسدد"
                : d?.payment?.status === "pending"
                  ? "قيد المراجعة"
                  : d?.payment?.status === "rejected"
                    ? "مرفوض"
                    : `متأخر — ${d?.payment?.month ?? ""}`}
            </Badge>
          </div>
          <Link href="/student/payments" className="mt-3 block text-sm font-medium text-primary hover:underline">
            تفاصيل المدفوعات ورفع الإثبات ←
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40" />;
}
