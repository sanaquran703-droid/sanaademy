"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">سجل الحصص</h1>
        <p className="text-sm text-muted-foreground">آخر 20 حصة مع تقييماتها — للقراءة فقط</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          لا توجد حصص مسجّلة حتى الآن. سيظهر سجل حصصكِ هنا بعد أول حصة.
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold" dir="ltr">
                  {new Date(l.scheduledAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <Badge variant="outline">{attendanceLabel[l.attendance ?? ""] ?? "لم يُسجَّل حضور"}</Badge>
                {l.status !== "completed" && (
                  <Badge variant="secondary">{lessonStatusLabel[l.status] ?? l.status}</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {l.newPortion ? (
                  <span>
                    الجديد: <strong className="text-foreground">{l.newPortion}</strong>
                  </span>
                ) : null}
                {l.reviewPortion ? (
                  <span className="mr-3">
                    المراجعة: <strong className="text-foreground">{l.reviewPortion}</strong>
                  </span>
                ) : null}
                {!l.newPortion && !l.reviewPortion ? "لا يوجد محتوى مسجّل لهذه الحصة" : null}
              </div>
              {l.evaluation && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">
                  {(Object.entries(l.evaluation) as [string, string | null][]).map(([k, v]) =>
                    v ? <Badge key={k} variant="secondary">{gradeLabel[v] ?? v}</Badge> : null,
                  )}
                  {l.evaluation.overallNote ? (
                    <span className="text-sm text-muted-foreground">{l.evaluation.overallNote}</span>
                  ) : null}
                </div>
              )}
              {l.homework ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  <ClipboardList className="mr-1 inline h-3.5 w-3.5" />
                  الواجب: {l.homework}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
