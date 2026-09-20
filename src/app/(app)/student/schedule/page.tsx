"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, CheckCircle2, Info, ExternalLink, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAY_AR = {
  6: "السبت",
  0: "الأحد",
  1: "الإثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
} as const;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

type ScheduleRow = { 
  id: string; 
  groupId: string;
  groupName: string;
  teacherName: string;
  meetLink: string | null;
  meetingProvider: string | null;
  dayOfWeek: number; 
  startTime: string; 
  durationMins: number | null 
};

export default function StudentSchedulePage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/schedule")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "تعذّر التحميل");
        setRows(d.schedules);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل الجدول", description: "حاولي مرة أخرى", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="space-y-6 pb-10">
      <div className="px-1">
        <h1 className="text-2xl font-black tracking-tight text-primary">جدولي الأسبوعي</h1>
        <p className="text-sm font-medium text-muted-foreground/80">
          مواعيد كافة الحلقات المسجّلة فيها
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-3xl border border-border/40 bg-muted/20" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-border/60 bg-muted/5 p-12 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/40">
              <Calendar className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground font-medium italic">
              لم يتم تسكينكِ في أي حلقة بعد، أو لم يتم إنشاء جدول مواعيد.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-primary/5 border-primary/20 mb-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Info className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-primary/80">
                يرجى الالتزام بمواعيد الحلقات، واستخدام زر "دخول" للانضمام للحصة في موعدها.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {rows.map((row) => {
              const todayIdx = new Date().getDay();
              const isToday = row.dayOfWeek === todayIdx;
              return (
                <Card
                  key={row.id}
                  className={cn(
                    "rounded-2xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-300",
                    isToday && "ring-2 ring-primary/20 bg-primary/5 border-primary/30 scale-[1.01] shadow-md"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-black text-sm shadow-inner",
                          isToday ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}>
                          {(DAY_AR as Record<number, string>)[row.dayOfWeek] ?? "—"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-black text-foreground">
                              {row.groupName}
                            </div>
                            <Badge variant="outline" className="rounded-lg px-2 py-0 text-[9px] font-black border-primary/20 text-primary/70">
                              مع {row.teacherName}
                            </Badge>
                            {isToday && (
                              <Badge className="rounded-lg px-2 py-0 text-[9px] font-black bg-primary text-white border-none">
                                اليوم
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary/60" />
                              <span dir="ltr">
                                {formatTime(row.startTime)}
                                {row.durationMins ? ` (${row.durationMins} د)` : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 border-r border-border/50 pr-3">
                              <GraduationCap className="h-3.5 w-3.5 text-emerald-600/60" />
                              <span>{(DAY_AR as Record<number, string>)[row.dayOfWeek] ?? "—"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {row.meetLink && (
                          <Button asChild size="sm" className="rounded-xl h-9 px-4 shadow-md shadow-primary/10 font-black text-xs">
                            <a href={row.meetLink} target="_blank" rel="noreferrer">
                              <ExternalLink className="ml-2 h-4 w-4" /> دخول الحصة
                            </a>
                          </Button>
                        )}
                        {isToday && !row.meetLink && (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
