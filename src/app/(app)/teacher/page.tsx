"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, Mic, CalendarDays, BookOpenCheck, Clock, 
  Users, BookOpen, ChevronLeft, Award, TrendingUp, 
  Target, User, Star, AlertCircle, Sparkles, MessageSquareQuote
} from "lucide-react";
import { QuickLessonForm } from "./quick-lesson-form";
import { cn } from "@/lib/utils";

type TodayLesson = {
  id: string | null;
  studentName: string | null;
  groupName: string;
  programName: string | null;
  scheduledAt: string;
  startTime: string;
  status: "recorded" | "scheduled";
  meetLink: string | null;
  durationMins: number;
  groupId: string;
  studentId: string | null;
};

type StudentSummary = {
  id: string;
  fullName: string;
  groupName: string;
  groupId: string;
  plan: { surah: string; progress: number } | null;
  lastEvaluation: { grade: string; date: string } | null;
};

export default function TeacherDashboard() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TodayLesson[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLesson, setFormLesson] = useState<TodayLesson | null>(null);
  const [version, setVersion] = useState(0);

  const fetchToday = useCallback(async () => {
    try {
      const [resToday, resStudents] = await Promise.all([
        fetch(`/api/teacher/lessons/today?v=${version}`),
        fetch(`/api/teacher/students?v=${version}`)
      ]);
      
      const dataToday = await resToday.json();
      const dataStudents = await resStudents.json();

      if (resToday.ok) setRows(dataToday.rows ?? []);
      if (resStudents.ok) {
        const allStudents: StudentSummary[] = [];
        dataStudents.groups?.forEach((g: any) => {
          g.students.forEach((s: any) => {
            allStudents.push({
              ...s,
              groupId: g.groupId,
              groupName: g.groupName
            });
          });
        });
        setStudents(allStudents);
      }
    } catch {
      toast({ title: "تعذّر تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [version, toast]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const recordedCount = rows.filter((r) => r.status === "recorded").length;
  const remainingCount = rows.filter((r) => r.status === "scheduled").length;

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "excellent": return "text-green-600 bg-green-50 border-green-100";
      case "very_good": return "text-blue-600 bg-blue-50 border-blue-100";
      case "good": return "text-yellow-600 bg-yellow-50 border-yellow-100";
      case "needs_review": return "text-red-600 bg-red-50 border-red-100";
      default: return "text-muted-foreground bg-muted/50 border-transparent";
    }
  };

  const getGradeLabel = (grade?: string) => {
    switch (grade) {
      case "excellent": return "ممتاز";
      case "very_good": return "جيد جداً";
      case "good": return "جيد";
      case "needs_review": return "مراجعة";
      default: return "بدون";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">لوحة إنجازاتي</h1>
          <p className="text-sm font-medium text-muted-foreground/80">مرحباً بكِ يا معلمة الخير، إليكِ ملخص الأداء والخطط.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 shadow-sm h-10 px-4 text-xs font-bold">
            <Link href="/teacher/students">
              <Users className="ml-2 h-4 w-4" /> طالباتي
            </Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-2xl h-10 w-10 p-0 overflow-hidden border border-border/50 bg-card/50 shadow-sm">
            <Link href="/teacher/profile">
              <User className="h-5 w-5 text-primary" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="حصص اليوم" value={rows.length} icon={<CalendarDays className="h-5 w-5" />} />
        <Stat label="تم إنجازها" value={recordedCount} icon={<BookOpenCheck className="h-5 w-5" />} color="bg-green-50 text-green-600 border-green-100" />
        <Stat label="متبقية" value={remainingCount} icon={<Clock className="h-5 w-5" />} color="bg-blue-50 text-blue-600 border-blue-100" />
        <Stat label="إنجاز اليوم" value={rows.length > 0 ? Math.round((recordedCount / rows.length) * 100) : 0} suffix="%" icon={<Award className="h-5 w-5" />} color="bg-yellow-50 text-yellow-600 border-yellow-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Feed: Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black text-primary flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-primary" />
                جدول الحصص اليومي
              </h2>
              <div className="text-[10px] font-black text-muted-foreground/60 bg-muted/30 px-3 py-1 rounded-xl">
                {new Date().toLocaleDateString("ar-SA", { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl border border-border/40 bg-muted/20" />)}
              </div>
            ) : rows.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 bg-muted/5 border-border/60">
                <CardContent className="p-10 text-center space-y-3">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-sm text-muted-foreground font-medium italic">لا توجد حصص مجدولة لهذا اليوم.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {rows.map((row, idx) => (
                  <Card key={`lesson-${row.groupId}-${row.studentId}-${idx}`} className={cn(
                    "rounded-2xl transition-all border-border/40 shadow-sm overflow-hidden",
                    row.status === "recorded" ? "bg-muted/10 opacity-70" : "bg-card/50 hover:shadow-md hover:border-primary/20"
                  )}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                          row.status === "recorded" ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                        )}>
                          {row.status === "recorded" ? <BookOpenCheck className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{row.studentName ?? "حصة جماعية"}</span>
                            {row.status === "recorded" && (
                              <Badge className="bg-green-600 hover:bg-green-700 rounded-lg text-[8px] h-4 px-1.5 font-black border-none">تم التسميع</Badge>
                            )}
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap font-medium">
                            <span className="text-primary/70">{row.groupName}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span dir="ltr">{row.startTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {row.status === "scheduled" ? (
                          <Button
                            size="sm"
                            onClick={() => setFormLesson(row)}
                            className="rounded-xl shadow-sm h-8 px-4 text-[10px] font-black"
                          >
                            <Mic className="ml-1.5 h-3.5 w-3.5" /> تسجيل التقييم
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" asChild className="rounded-xl text-[10px] h-8 px-3 font-bold text-muted-foreground hover:text-primary">
                            <Link href={`/teacher/students/${row.studentId}`}>الملف <ChevronLeft className="mr-1 h-3 w-3" /></Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Simplified Progress Table */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black text-primary flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-secondary" />
                متابعة الخطط الدراسية
              </h2>
              <Link href="/teacher/students" className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                عرض الكل <ChevronLeft className="h-3 w-3" />
              </Link>
            </div>

            <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">الطالبة</th>
                      <th className="px-4 py-3">السورة</th>
                      <th className="px-4 py-3">التقدم</th>
                      <th className="px-4 py-3 text-center">التقييم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={`skeleton-${i}`} className="animate-pulse">
                          <td colSpan={4} className="px-4 py-4"><div className="h-3 bg-muted rounded-full w-full" /></td>
                        </tr>
                      ))
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground italic font-medium">لا يوجد طالبات مسجلات حالياً</td>
                      </tr>
                    ) : (
                      students.slice(0, 5).map((s, idx) => (
                        <tr key={`student-row-${s.id}-${s.groupId}-${idx}`} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-4 py-3">
                            <Link href={`/teacher/students/${s.id}`} className="font-black text-primary hover:underline">
                              {s.fullName}
                            </Link>
                            <div className="text-[9px] text-muted-foreground font-medium">{s.groupName}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-muted-foreground">{s.plan?.surah || "لم تحدد"}</td>
                          <td className="px-4 py-3 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all duration-500" 
                                  style={{ width: `${s.plan?.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-black text-primary/60">{s.plan?.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[9px] font-black border border-none shadow-sm",
                              getGradeColor(s.lastEvaluation?.grade)
                            )}>
                              {getGradeLabel(s.lastEvaluation?.grade)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>

        {/* Sidebar: Alerts & Motivation */}
        <div className="space-y-6">
          {/* Action Alerts */}
          <Card className="rounded-3xl border-border/40 shadow-sm bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Target className="h-4 w-4 text-secondary" /> تنبيهات هامة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {students.filter(s => !s.plan).length > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-yellow-50/50 border border-yellow-100/50 text-yellow-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="text-[11px] leading-relaxed font-medium">
                    يوجد <strong>{students.filter(s => !s.plan).length}</strong> طالبات بحاجة لتحديد خطة حفظ.
                    <Link href="/teacher/students" className="block mt-1 font-black underline decoration-yellow-300">تحديد الخطط الآن</Link>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50 text-blue-800">
                <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-[11px] leading-relaxed font-medium">
                  متوسط إنجاز الحلقات هذا الأسبوع وصل إلى <strong>78%</strong>. استمري في العطاء!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivational Quote */}
          <Card className="rounded-3xl border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="h-16 w-16" />
            </div>
            <CardContent className="p-6 space-y-4 relative z-10">
              <MessageSquareQuote className="h-6 w-6 text-primary-foreground/40" />
              <div className="space-y-2">
                <p className="text-sm font-black leading-relaxed">
                  &quot;إن الله يحب إذا عمل أحدكم عملاً أن يتقنه&quot; - إتقانكِ في تقييم طالباتكِ هو أمانة تؤجرين عليها.
                </p>
                <div className="h-1 w-8 bg-primary-foreground/30 rounded-full" />
                <p className="text-[10px] font-medium text-primary-foreground/60 italic">رسالة اليوم للمعلمة</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {formLesson && (
        <QuickLessonForm
          open={!!formLesson}
          onOpenChange={(open) => !open && setFormLesson(null)}
          groupId={formLesson.groupId}
          studentId={formLesson.studentId!}
          studentName={formLesson.studentName!}
          startTime={formLesson.startTime}
          onCloseSuccess={() => {
            setVersion(v => v + 1);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, icon, suffix = "", color = "bg-card text-primary border-border/50" }: any) {
  return (
    <Card className={cn("rounded-3xl border shadow-sm transition-transform hover:scale-[1.02]", color)}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0 opacity-80">{icon}</div>
        <div>
          <div className="text-[10px] font-black opacity-70 uppercase tracking-tighter">{label}</div>
          <div className="text-xl font-black">{value}{suffix}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({ children, className = "" }: any) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground", className)}>
      {children}
    </span>
  );
}
