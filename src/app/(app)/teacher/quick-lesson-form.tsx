"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AttendanceStatus = "present" | "late" | "absent" | "excused";
type EvaluationGrade = "excellent" | "very_good" | "good" | "needs_review";

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "حضور" },
  { value: "late", label: "متأخرة" },
  { value: "absent", label: "غياب" },
  { value: "excused", label: "مأذون" },
];

const ERROR_TYPE_OPTIONS = [
  { value: "tajweed", label: "تجويد" },
  { value: "hifz", label: "حفظ" },
  { value: "tartil", label: "ترتيل" },
  { value: "pronunciation", label: "نطق" },
];

const GRADE_LABELS: Record<EvaluationGrade, string> = {
  excellent: "ممتاز",
  very_good: "جيد جداً",
  good: "جيد",
  needs_review: "يحتاج مراجعة",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  studentId: string;
  studentName: string;
  startTime: string;
  onCloseSuccess: () => void;
};

export function QuickLessonForm({
  open,
  onOpenChange,
  groupId,
  studentId,
  studentName,
  startTime,
  onCloseSuccess,
}: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceStatus>("present");
  const [hasNewMemorization, setHasNewMemorization] = useState(true);
  const [newPortion, setNewPortion] = useState("");
  const [reviewPortion, setReviewPortion] = useState("");
  const [errorsCount, setErrorsCount] = useState<number | null>(null);
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<Record<string, EvaluationGrade>>({
    memorization: "good",
    review: "good",
    tajweed: "good",
    commitment: "good",
  });
  const [homework, setHomework] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");

  const showDetails = attendance === "present" || attendance === "late";

  function resetForm() {
    setAttendance("present");
    setHasNewMemorization(true);
    setNewPortion("");
    setReviewPortion("");
    setErrorsCount(null);
    setErrorTypes([]);
    setEvaluation({ memorization: "good", review: "good", tajweed: "good", commitment: "good" });
    setHomework("");
    setTeacherNotes("");
  }

  async function handleSubmit() {
    if (saving) return;
    setSaving(true);
    try {
      const scheduledAt = new Date();
      scheduledAt.setHours(Number(startTime.split(":")[0]), Number(startTime.split(":")[1]), 0, 0);

      const body: Record<string, unknown> = {
        groupId,
        studentId,
        scheduledAt: scheduledAt.toISOString(),
        attendanceStatus: attendance,
        hasNewMemorization,
      };
      if (showDetails) {
        body.newPortion = hasNewMemorization ? newPortion : undefined;
        body.reviewPortion = reviewPortion || undefined;
        body.errorsCount = errorsCount ?? undefined;
        body.errorsType = errorTypes.length > 0 ? errorTypes.join("، ") : undefined;
        body.homework = homework || undefined;
        body.teacherNotes = teacherNotes || undefined;
        body.evaluation = evaluation;
      }

      const res = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "تعذّر حفظ الحصة", description: data.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      toast({ title: "تم حفظ الحصة بنجاح" });
      onOpenChange(false);
      resetForm();
      onCloseSuccess();
    } catch (_e) {
      toast({ title: "تعذّر حفظ الحصة", description: "تحققي من الاتصال وحاولي مرة أخرى", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل حصة: {studentName}</DialogTitle>
          <DialogDescription dir="ltr" className="text-right">
            {startTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Attendance chips */}
          <div>
            <Label className="mb-2 block">الحضور</Label>
            <div className="grid grid-cols-4 gap-2">
              {ATTENDANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAttendance(opt.value)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-sm transition",
                    attendance === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {showDetails && (
            <>
              {/* New memorization switch */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                <div>
                  <Label className="text-sm">حفظ جديد</Label>
                  <p className="text-xs text-muted-foreground">هل في الحصة حفظ جديد؟</p>
                </div>
                <Switch checked={hasNewMemorization} onCheckedChange={setHasNewMemorization} />
              </div>

              {hasNewMemorization && (
                <div>
                  <Label htmlFor="new-portion" className="mb-1 block">المحفوظ الجديد</Label>
                  <Input
                    id="new-portion"
                    placeholder="مثلاً: البقرة ١-١٠"
                    value={newPortion}
                    onChange={(e) => setNewPortion(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="review-portion" className="mb-1 block">المراجعة</Label>
                <Input
                  id="review-portion"
                  placeholder="مثلاً: الفاتحة"
                  value={reviewPortion}
                  onChange={(e) => setReviewPortion(e.target.value)}
                />
              </div>

              {/* Errors */}
              <div className="space-y-2">
                <Label>عدد الأخطاء</Label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setErrorsCount(n)}
                      className={cn(
                        "h-9 w-9 rounded-lg border text-sm transition",
                        errorsCount === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ERROR_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setErrorTypes((prev) =>
                          prev.includes(opt.value)
                            ? prev.filter((t) => t !== opt.value)
                            : [...prev, opt.value],
                        )
                      }
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition",
                        errorTypes.includes(opt.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evaluation: 4 dimensions x 4 grades */}
              <div className="space-y-2">
                <Label>التقييم</Label>
                <div className="space-y-2">
                  {[
                    { key: "memorization", label: "الحفظ" },
                    { key: "review", label: "المراجعة" },
                    { key: "tajweed", label: "التجويد" },
                    { key: "commitment", label: "الالتزام" },
                  ].map((dim) => (
                    <div key={dim.key} className="flex flex-wrap items-center gap-1.5">
                      <span className="w-20 shrink-0 text-sm text-muted-foreground">{dim.label}</span>
                      {(Object.keys(GRADE_LABELS) as EvaluationGrade[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setEvaluation((prev) => ({ ...prev, [dim.key]: g }))}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-xs transition",
                            evaluation[dim.key] === g
                              ? g === "needs_review"
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : g === "excellent"
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {GRADE_LABELS[g]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="hw" className="mb-1 block">الواجب</Label>
                <Textarea
                  id="hw"
                  placeholder="الواجب للحصة القادمة..."
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes" className="mb-1 block">ملاحظات</Label>
                <Textarea
                  id="notes"
                  placeholder="ملاحظات خاصة..."
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 -mb-2 border-t border-border bg-background pt-3">
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "جارٍ الحفظ..." : "حفظ الحصة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
