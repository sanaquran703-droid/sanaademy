"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, RotateCcw, Info, Calendar, TrendingUp, BookMarked } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between px-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary">خطة الحفظ</h1>
          <p className="text-sm font-medium text-muted-foreground/80">خطة الحفظ المحدّدة من معلمتكِ — للقراءة فقط</p>
        </div>
        <Badge variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary font-black px-3 py-1 text-[10px]">
          للقراءة فقط
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-3xl border border-border/40 bg-muted/20" />
          <div className="h-48 animate-pulse rounded-3xl border border-border/40 bg-muted/20" />
        </div>
      ) : !plan ? (
        <Card className="rounded-3xl border-dashed border-border/60 bg-muted/5 p-12 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/40">
              <BookOpen className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground font-medium italic">
              لم تُحدَّد خطة حفظ بعد. ستخبركِ معلمتكِ بخطة الحفظ قريباً إن شاء الله.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Main Progress Card */}
          <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-indigo-600 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white/60 uppercase tracking-widest">مستوى الإنجاز</div>
                      <div className="text-4xl font-black">{plan.progressPct ?? 0}%</div>
                    </div>
                  </div>
                  <div className="w-full max-w-xs space-y-2">
                    <Progress value={plan.progressPct ?? 0} className="h-3 bg-white/20" />
                    <p className="text-[10px] font-bold text-white/70 italic">استمري في الحفظ، أنتِ تقومين بعمل رائع!</p>
                  </div>
                </div>
                
                {plan.updatedAt && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <Calendar className="h-4 w-4 text-white/60" />
                    <span className="text-xs font-black">
                      آخر تحديث:{" "}
                      <span dir="ltr">
                        {new Date(plan.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* New Memorization */}
            <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <BookMarked className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">الحفظ الجديد</div>
                    <div className="font-black text-xl text-primary">{plan.currentSurah ?? "لم يُحدَّد"}</div>
                  </div>
                </div>
                
                <div className="bg-muted/20 p-5 rounded-2xl border border-border/30 text-center">
                  <div className="text-sm font-black text-foreground" dir="ltr">
                    {ayahRange(plan.currentAyahFrom, plan.currentAyahTo) || "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review */}
            <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">المراجعة</div>
                    <div className="font-black text-xl text-amber-600">{plan.reviewSurah ?? "لا مراجعة محدّدة"}</div>
                  </div>
                </div>
                
                <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/20 text-center">
                  <div className="text-sm font-black text-amber-900" dir="ltr">
                    {ayahRange(plan.reviewAyahFrom, plan.reviewAyahTo) || "—"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Notes */}
          {plan.notes && (
            <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground">
                    <Info className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-black text-foreground">ملاحظات المعلمة</h3>
                </div>
                  <div className="text-sm font-medium text-muted-foreground leading-relaxed bg-muted/10 p-5 rounded-2xl border border-border/30 italic">
                  &quot;{plan.notes}&quot;
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
