"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

type ScheduleRow = { id: string; dayOfWeek: number; startTime: string; durationMins: number | null };

export default function StudentSchedulePage() {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState<string | null>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/schedule")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "تعذّر التحميل");
        setGroupName(d.groupName);
        setRows(d.schedules);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل الجدول", description: "حاولي مرة أخرى", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">جدولي الأسبوعي</h1>
        <p className="text-sm text-muted-foreground">
          {groupName ? `حلقة: ${groupName}` : "جدول الحلقة المسجّلة فيها"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          لم يُنشأ جدول بعد لهذه الحلقة. سيريْنكِ المعلمة بالتفاصيل قريباً إن شاء الله.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const todayIdx = new Date().getDay();
            const isToday = row.dayOfWeek === todayIdx;
            return (
              <div
                key={row.id}
                className={`flex items-center justify-between rounded-xl border bg-card p-4 ${isToday ? "border-primary/40 bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 font-semibold text-primary">
                    {(DAY_AR as Record<number, string>)[row.dayOfWeek] ?? "—"}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {(DAY_AR as Record<number, string>)[row.dayOfWeek] ?? "—"}
                      {isToday && <Badge className="mr-2">اليوم</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span dir="ltr">
                        {formatTime(row.startTime)}
                        {row.durationMins ? ` — ${row.durationMins} دقيقة` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
