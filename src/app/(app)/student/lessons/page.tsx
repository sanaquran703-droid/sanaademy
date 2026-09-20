"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Calendar, CheckCircle2, XCircle, Clock, Info, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const attendanceLabel: Record<string, string> = {
  present: "حاضرة",
  absent: "غائبة",
  late: "متأخرة",
  excused: "عذر مقبول",
};

const lessonStatusLabel: Record<string, string> = {
  scheduled: "مجدولة",
  completed: "مكتملة",
  absent: "لم تحضر",
  postponed: "مؤجلة",
  cancelled: "ملغية",
};

const gradeLabel: Record<string, string> = {
  excellent: "ممتازة",
  very_good: "جيدة جداً",
  good: "جيدة",
  needs_review: "تحتاج مراجعة",
};

type Lesson = {
  id: string;
  scheduledAt: string;
  status: string;
  attendance: string | null;
  newPortion: string | null;
  reviewPortion: string | null;
  hasNewMemorization: boolean | null;
  homework: string | null;
  evaluation: {
    memorization: string | null;
    review: string | null;
    tajweed: string | null;
    commitment: string | null;
    overallNote: string | null;
  } | null;
};

export default function StudentLessonsPage() {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/lessons?limit=20")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "تعذّر التحميل");
        setLessons(d.lessons);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل السجل", description: "حاولي مرة أخرى", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="space-y-6 pb-10">
      <div className="px-1">
        <h1 className="text-2xl font-black tracking-tight text-primary">سجل الحصص</h1>
        <p className="text-sm font-medium text-muted-foreground/80">مراجعة شاملة لآخر 20 حصة مع تقييمات المعلمة</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl border border-border/40 bg-muted/20" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-border/60 bg-muted/5 p-12 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/40">
              <ClipboardList className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground font-medium italic">
              لا توجد حصص مسجّلة حتى الآن. سيظهر سجل حصصكِ هنا بعد أول حصة.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((l) => (
            <Card key={l.id} className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
                      l.attendance === "present" ? "bg-emerald-50 text-emerald-600" : 
                      l.attendance === "absent" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {l.attendance === "present" ? <CheckCircle2 className="h-6 w-6" /> : 
                       l.attendance === "absent" ? <XCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest" dir="ltr">
                        {new Date(l.scheduledAt).toLocaleDateString("en-US", { weekday: "long" })}
                      </div>
                      <div className="font-black text-foreground" dir="ltr">
                        {new Date(l.scheduledAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn(
                      "rounded-xl px-3 py-1 text-[10px] font-black border-none shadow-sm",
                      l.attendance === "present" && "bg-emerald-100 text-emerald-700",
                      l.attendance === "absent" && "bg-red-100 text-red-700",
                      l.attendance === "late" && "bg-amber-100 text-amber-700",
                      l.attendance === "excused" && "bg-blue-100 text-blue-700",
                      !l.attendance && "bg-muted text-muted-foreground"
                    )}>
                      {attendanceLabel[l.attendance ?? ""] ?? "لم يُسجَّل حضور"}
                    </Badge>
                    {l.status !== "completed" && (
                      <Badge variant="secondary" className="rounded-xl px-3 py-1 text-[10px] font-black bg-muted/50 text-muted-foreground border-none">
                        {lessonStatusLabel[l.status] ?? l.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 bg-muted/10 p-4 rounded-2xl border border-border/30 mb-4">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mb-1">المحتوى الدراسي</div>
                    <div className="text-xs space-y-1">
                      {l.newPortion ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">الجديد:</span>
                          <span className="font-medium text-foreground">{l.newPortion}</span>
                        </div>
                      ) : null}
                      {l.reviewPortion ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600">المراجعة:</span>
                          <span className="font-medium text-foreground">{l.reviewPortion}</span>
                        </div>
                      ) : null}
                      {!l.newPortion && !l.reviewPortion ? (
                        <span className="text-muted-foreground italic">لا يوجد محتوى مسجّل</span>
                      ) : null}
                    </div>
                  </div>
                  
                  {l.homework && (
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mb-1">الواجب المنزلي</div>
                      <div className="text-xs font-medium text-foreground flex items-start gap-2">
                        <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{l.homework}</span>
                      </div>
                    </div>
                  )}
                </div>

                {l.evaluation && (
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 mr-1">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase">التقييمات:</span>
                      </div>
                      {(Object.entries(l.evaluation) as [string, string | null][]).map(([k, v]) =>
                        v && k !== 'overallNote' ? (
                          <Badge key={k} variant="outline" className={cn(
                            "rounded-lg px-2 py-0.5 text-[9px] font-black border-none shadow-sm",
                            v === "excellent" && "bg-green-50 text-green-700",
                            v === "very_good" && "bg-blue-50 text-blue-700",
                            v === "good" && "bg-amber-50 text-amber-700",
                            v === "needs_review" && "bg-red-50 text-red-700"
                          )}>
                            {gradeLabel[v] ?? v}
                          </Badge>
                        ) : null,
                      )}
                    </div>
                    {l.evaluation.overallNote && (
                      <div className="flex items-start gap-2 bg-amber-50/20 p-3 rounded-xl border border-amber-100/10 italic text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>"{l.evaluation.overallNote}"</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
