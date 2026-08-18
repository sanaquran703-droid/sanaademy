"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type PlanData = {
  currentSurah: string | null;
  currentAyahFrom: number | null;
  currentAyahTo: number | null;
  reviewSurah: string | null;
  reviewAyahFrom: number | null;
  reviewAyahTo: number | null;
  progressPct: number | null;
  notes: string | null;
  updatedAt: string;
};

function ayahRange(from: number | null, to: number | null): string | null {
  if (from == null) return null;
  return to != null && to !== from ? `من الآية ${from} إلى الآية ${to}` : `من الآية ${from}`;
}

export default function StudentPlanPage() {
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/plan")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "تعذّر التحميل");
        setPlan(d.plan);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل الخطة", description: "حاولي مرة أخرى", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">خطة الحفظ</h1>
          <p className="text-sm text-muted-foreground">خطة الحفظ المحدّدة من معلمتكِ — للقراءة فقط</p>
        </div>
        <Badge variant="outline">للقراءة فقط</Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>
      ) : !plan ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          لم تُحدَّد خطة حفظ بعد. ستخبركِ معلمتكِ بخطة الحفظ قريباً إن شاء الله.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الحفظ الجديد</div>
                  <div className="font-semibold">{plan.currentSurah ?? "لم يُحدَّد"}</div>
                </div>
              </div>
              {ayahRange(plan.currentAyahFrom, plan.currentAyahTo) && (
                <span className="text-sm text-muted-foreground" dir="ltr">
                  {ayahRange(plan.currentAyahFrom, plan.currentAyahTo)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-secondary">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">المراجعة</div>
                  <div className="font-semibold">{plan.reviewSurah ?? "لا مراجعة محدّدة"}</div>
                </div>
              </div>
              {ayahRange(plan.reviewAyahFrom, plan.reviewAyahTo) && (
                <span className="text-sm text-muted-foreground" dir="ltr">
                  {ayahRange(plan.reviewAyahFrom, plan.reviewAyahTo)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدّم في الخطة</span>
              <span className="font-semibold" dir="ltr">
                {plan.progressPct ?? 0}%
              </span>
            </div>
            <Progress value={plan.progressPct ?? 0} />
            {plan.notes ? (
              <p className="mt-4 text-sm text-muted-foreground">{plan.notes}</p>
            ) : null}
            {plan.updatedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                آخر تحديث:{" "}
                <span dir="ltr">
                  {new Date(plan.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
