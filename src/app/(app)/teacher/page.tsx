"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Video, Mic, CalendarDays, BookOpenCheck, Clock } from "lucide-react";
import { QuickLessonForm } from "./quick-lesson-form";

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

export default function TeacherDashboard() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TodayLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLesson, setFormLesson] = useState<TodayLesson | null>(null);
  const [version, setVersion] = useState(0);

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/lessons/today?v=${version}`);
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "تعذّر تحميل الحصص", description: data.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      setRows(data.rows ?? []);
    } catch {
      toast({ title: "تعذّر تحميل الحصص", description: "تحققي من الاتصال وحاولي مرة أخرى", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [version, toast]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const recordedCount = rows.filter((r) => r.status === "recorded").length;
  const remainingCount = rows.filter((r) => r.status === "scheduled").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">حاصلاتي اليوم</h1>
        <p className="text-sm text-muted-foreground">حصص التسميع المجدولة لهذا اليوم.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="حصص اليوم" value={rows.length} icon={<CalendarDays className="h-4 w-4" />} />
        <Stat label="مسجَّلة" value={recordedCount} icon={<BookOpenCheck className="h-4 w-4" />} ok />
        <Stat label="متبقية" value={remainingCount} icon={<Clock className="h-4 w-4" />} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          جارٍ التحميل...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد حصص مجدولة لهذا اليوم.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row, idx) => (
            <Card key={`${row.groupName}-${idx}-${row.startTime}`} className="rounded-2xl">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{row.studentName ?? "حصة جماعية"}</span>
                    {row.status === "recorded" && (
                      <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary">مسجَّلة</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span>{row.groupName}</span>
                    {row.programName ? <span> — {row.programName}</span> : null}
                    <span dir="ltr" className="ms-1">{row.startTime}</span>
                    <span className="ms-1">({row.durationMins} دقيقة)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {row.meetLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="rounded-lg bg-card"
                    >
                      <a href={row.meetLink} target="_blank" rel="noopener noreferrer">
                        <Video className="ms-1 h-4 w-4" />
                        دخول الحلقة
                      </a>
                    </Button>
                  )}
                  {row.status === "scheduled" && (
                    <Button
                      size="sm"
                      onClick={() => setFormLesson(row)}
                      className="rounded-lg"
                    >
                      <Mic className="ms-1 h-4 w-4" />
                      بدء التسميع
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {formLesson && (
        <QuickLessonForm
          open={!!formLesson}
          onOpenChange={(open) => {
            if (!open) setFormLesson(null);
          }}
          groupId={formLesson.groupId}
          studentId={formLesson.studentId ?? ""}
          studentName={formLesson.studentName ?? "حصة جماعية"}
          startTime={formLesson.startTime}
          onCloseSuccess={() => setVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, icon, ok }: { label: string; value: number; icon: React.ReactNode; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`mb-2 grid h-8 w-8 place-items-center rounded-xl ${ok ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"}`}>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div dir="ltr" className="text-xl font-bold text-primary">{value}</div>
    </div>
  );
}
