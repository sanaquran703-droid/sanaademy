"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarDays, BookOpen, Star, CreditCard, ExternalLink, 
  Clock, User, ChevronLeft, AlertCircle, CheckCircle2,
  TrendingUp, Award, BookMarked, XCircle, Info, GraduationCap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const gradeLabel: Record<string, string> = {
  excellent: "ممتازة",
  very_good: "جيدة جداً",
  good: "جيدة",
  needs_review: "تحتاج مراجعة",
};

type Lesson = {
  groupId: string;
  groupName: string;
  teacherName: string;
  meetLink: string | null;
  meetingProvider: string | null;
  startTime: string;
  durationMins: number | null;
  status: "upcoming" | "ongoing" | "finished";
};

type DashboardData = {
  ok: boolean;
  enrollments: Array<{
    groupId: string;
    groupName: string;
    programName: string | null;
    teacher: { name: string; avatarUrl: string | null } | null;
  }>;
  plan: { 
    currentSurah: string | null; 
    currentAyahFrom: number | null;
    currentAyahTo: number | null;
    reviewSurah: string | null;
    progressPct: number; 
  } | null;
  lastEvaluation: {
    createdAt: string;
    newPortion: string | null;
    reviewPortion: string | null;
    grades: Record<string, string>;
    overallNote: string | null;
  } | null;
  todayLessons: Lesson[];
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
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-full bg-muted rounded-2xl" />
        <div className="flex justify-between items-center"><div className="h-8 w-48 bg-muted rounded-xl" /><div className="h-10 w-32 bg-muted rounded-full" /></div>
        <div className="grid gap-6 md:grid-cols-2"><div className="h-48 bg-muted rounded-3xl" /><div className="h-48 bg-muted rounded-3xl" /></div>
      </div>
    );
  }

  const d = data;
  const paymentStatus = d?.payment?.status;
  const showStatusBar = paymentStatus !== "confirmed";
  const lessons = d?.todayLessons || [];

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Dynamic Status Bar */}
      {showStatusBar && (
        <div className={cn(
          "relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500",
          paymentStatus === "rejected" ? "border-red-200 bg-red-50/80" : "border-yellow-200 bg-yellow-50/80"
        )}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner",
                paymentStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
              )}>
                {paymentStatus === "rejected" ? <XCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className={cn("text-sm font-black", paymentStatus === "rejected" ? "text-red-900" : "text-yellow-900")}>
                  {paymentStatus === "rejected" ? "تم رفض إثبات السداد" : `تنبيه السداد: شهر ${d?.payment?.month}`}
                </h3>
                <p className={cn("text-[11px] font-medium", paymentStatus === "rejected" ? "text-red-700/80" : "text-yellow-700/80")}>
                  {paymentStatus === "rejected" ? "يرجى مراجعة الملاحظات وإعادة الرفع." : "يرجى رفع إثبات السداد لتجنب انقطاع الخدمة."}
                </p>
              </div>
            </div>
            <Link href="/student/payments">
              <Button size="sm" variant="outline" className={cn(
                "h-9 rounded-xl shadow-none text-[10px] font-black px-4 border-none",
                paymentStatus === "rejected" ? "bg-red-600 text-white hover:bg-red-700" : "bg-yellow-600 text-white hover:bg-yellow-700"
              )}>
                إدارة المدفوعات
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Header & Teachers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary">حاصلاتي اليوم</h1>
          <p className="text-sm font-medium text-muted-foreground/80">مرحباً بكِ مجدداً في رحلتكِ مع القرآن الكريم.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">معلماتي</div>
          <div className="flex -space-x-2 space-x-reverse">
            {d?.enrollments?.map((e, i) => e.teacher && (
              <div key={i} className="group relative">
                <div className="h-10 w-10 rounded-full border-2 border-background bg-primary/5 overflow-hidden shadow-sm transition-transform hover:scale-110 hover:z-10 ring-1 ring-primary/5">
                  {e.teacher.avatarUrl ? (
                    <img src={e.teacher.avatarUrl} alt={e.teacher.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary text-xs font-black bg-primary/10">
                      {e.teacher.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                  <div className="bg-popover text-popover-foreground text-[10px] p-2 rounded-xl shadow-xl border border-border/50 backdrop-blur-md">
                    <div className="font-black">{e.teacher.name}</div>
                    <div className="text-muted-foreground font-medium">{e.groupName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's lessons list */}
        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">جدول اليوم</div>
                <div className="font-black text-lg">{lessons.length > 0 ? `لديكِ ${lessons.length} حصص` : "لا توجد حصص اليوم"}</div>
              </div>
            </div>
            
            {lessons.length > 0 ? (
              <div className="space-y-4">
                {lessons.map((lesson, idx) => (
                  <div key={idx} className="bg-muted/20 p-4 rounded-2xl border border-border/30 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-black text-sm text-primary">{lesson.groupName}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">مع {lesson.teacherName}</div>
                      </div>
                      <Badge
                        variant={lesson.status === "ongoing" ? "default" : lesson.status === "upcoming" ? "secondary" : "outline"}
                        className={cn(
                          "rounded-xl px-2 py-0.5 text-[9px] font-black border-none shadow-sm",
                          lesson.status === "ongoing" && "bg-primary animate-pulse shadow-primary/20",
                          lesson.status === "upcoming" && "bg-secondary/50 text-secondary-foreground",
                          lesson.status === "finished" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {lesson.status === "ongoing" ? "جارية" : lesson.status === "upcoming" ? "قادمة" : "انتهت"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span dir="ltr" className="font-black text-foreground">
                            {new Date(lesson.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {lesson.durationMins && (
                          <div className="flex items-center gap-1.5 border-r border-border/50 pr-3">
                            <span className="font-bold text-foreground">{lesson.durationMins} د</span>
                          </div>
                        )}
                      </div>
                      
                      {lesson.meetLink && lesson.status !== "finished" && (
                        <Button asChild size="sm" className="rounded-xl h-8 px-3 shadow-md shadow-primary/10 font-black text-[10px]">
                          <a href={lesson.meetLink} target="_blank" rel="noreferrer">
                            <ExternalLink className="ml-1.5 h-3 w-3" /> دخول
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/10 p-6 rounded-2xl text-center border border-dashed border-border/60">
                <p className="text-sm text-muted-foreground font-medium italic">لا يوجد جدول مسجّل لكِ اليوم. استغلي الوقت في المراجعة.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memorization plan */}
        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                  <BookMarked className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">خطة الحفظ</div>
                  <div className="font-black text-lg truncate max-w-[150px]">{d?.plan?.currentSurah ?? "لم تُحدَّد خطة"}</div>
                </div>
              </div>
              {d?.plan && (
                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                  <TrendingUp className="h-3 w-3 text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-700">{d.plan.progressPct}%</span>
                </div>
              )}
            </div>
            
            {d?.plan ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50/30 p-4 rounded-2xl text-center border border-indigo-100/20">
                    <div className="text-[10px] font-bold text-indigo-600/70 mb-1 uppercase tracking-tighter">الحفظ الحالي</div>
                    <div className="text-sm font-black text-indigo-900 truncate">
                      {d.plan.currentSurah} {d.plan.currentAyahFrom}-{d.plan.currentAyahTo}
                    </div>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-2xl text-center border border-border/30">
                    <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">المراجعة</div>
                    <div className="text-sm font-black text-foreground truncate">{d.plan.reviewSurah || "—"}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-muted-foreground">نسبة الإنجاز</span>
                    <span className="text-[10px] font-black text-indigo-600">{d.plan.progressPct}%</span>
                  </div>
                  <Progress value={d.plan.progressPct} className="h-2 bg-indigo-100/50" />
                  <div className="pt-1">
                    <Link href="/student/plan" className="text-xs font-black text-indigo-600 flex items-center hover:translate-x-[-4px] transition-transform">
                      عرض الخطة الكاملة <ChevronLeft className="h-4 w-4 mr-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/10 p-6 rounded-2xl text-center border border-dashed border-border/60">
                <p className="text-sm text-muted-foreground font-medium italic">المعلمة ستحدّد لكِ خطة الحفظ قريباً إن شاء الله.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Groups List - New Section */}
        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">حلقاتي النشطة</div>
                <div className="font-black text-lg">أنتِ مشتركة في {d?.enrollments?.length || 0} حلقات</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {d?.enrollments?.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/20 border border-emerald-100/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-black">
                      {e.groupName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-900">{e.groupName}</div>
                      <div className="text-[9px] text-emerald-700/70 font-medium">{e.programName || "برنامج عام"}</div>
                    </div>
                  </div>
                  <Link href="/student/schedule">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-emerald-600 hover:bg-emerald-100/50">
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              {(!d?.enrollments || d.enrollments.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-4 italic">لم يتم تسكينكِ في أي حلقة بعد.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last evaluation */}
        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">آخر تقييم</div>
                <div className="font-black text-lg">{d?.lastEvaluation ? "نتائج الحصة الأخيرة" : "لم يُسجَّل تقييم"}</div>
              </div>
            </div>
            
            {d?.lastEvaluation ? (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(d.lastEvaluation.grades).map(([key, grade]) => (
                    <Badge 
                      key={key} 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-3 py-1 rounded-xl border-none shadow-sm font-black",
                        grade === "excellent" && "bg-green-100 text-green-700",
                        grade === "very_good" && "bg-blue-100 text-blue-700",
                        grade === "good" && "bg-amber-100 text-amber-700",
                        grade === "needs_review" && "bg-red-100 text-red-700"
                      )}
                    >
                      {gradeLabel[grade] ?? grade}
                    </Badge>
                  ))}
                </div>
                
                {d.lastEvaluation.overallNote && (
                  <div className="flex items-start gap-2 bg-amber-50/20 p-3 rounded-xl border border-amber-100/10 italic text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>&quot;{d.lastEvaluation.overallNote}&quot;</span>
                  </div>
                )}
                
                <div className="pt-1">
                  <Link href="/student/lessons" className="text-xs font-black text-amber-600 flex items-center hover:translate-x-[-4px] transition-transform">
                    سجل الدروس <ChevronLeft className="h-4 w-4 mr-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-muted/10 p-6 rounded-2xl text-center border border-dashed border-border/60">
                <p className="text-sm text-muted-foreground font-medium italic">ستجدين تقييماتكِ هنا بعد أول حصة تسميع.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
