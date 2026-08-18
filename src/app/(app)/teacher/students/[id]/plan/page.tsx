"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

type Plan = {
  currentSurah: string | null;
  currentAyahFrom: number | null;
  currentAyahTo: number | null;
  reviewSurah: string | null;
  reviewAyahFrom: number | null;
  reviewAyahTo: number | null;
  progressPct: number;
  notes: string | null;
};

const SURAHS = Array.from({ length: 114 }, (_, i) => i + 1);

export default function PlanPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [form, setForm] = useState<Plan>({
    currentSurah: null,
    currentAyahFrom: null,
    currentAyahTo: null,
    reviewSurah: null,
    reviewAyahFrom: null,
    reviewAyahTo: null,
    progressPct: 0,
    notes: null,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/teacher/students/${studentId}`),
    ]).then(async ([res]) => {
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "تعذّر تحميل بيانات الطالبة", description: data.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      setStudentName(data.student.fullName);
      const p = data.student.plan;
      if (p) {
        setForm({
          currentSurah: p.currentSurah,
          currentAyahFrom: p.currentAyahFrom,
          currentAyahTo: p.currentAyahTo,
          reviewSurah: p.reviewSurah,
          reviewAyahFrom: p.reviewAyahFrom,
          reviewAyahTo: p.reviewAyahTo,
          progressPct: p.progressPct,
          notes: p.notes,
        });
      }
      setLoading(false);
    }).catch(() => {
      toast({ title: "تعذّر تحميل البيانات", description: "تحققي من الاتصال", variant: "destructive" });
      setLoading(false);
    });
  }, [studentId, toast]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/plans/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSurah: form.currentSurah ?? "",
          currentAyahFrom: form.currentAyahFrom,
          currentAyahTo: form.currentAyahTo,
          reviewSurah: form.reviewSurah ?? "",
          reviewAyahFrom: form.reviewAyahFrom,
          reviewAyahTo: form.reviewAyahTo,
          progressPct: form.progressPct,
          notes: form.notes ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "تعذّر حفظ الخطة", description: data.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      toast({ title: "تم حفظ خطة الحفظ" });
      router.push(`/teacher/students/${studentId}`);
    } catch {
      toast({ title: "تعذّر حفظ الخطة", description: "تحققي من الاتصال", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">خطة الحفظ: {studentName}</h1>
          <p className="text-sm text-muted-foreground">حددي موضع الطالبة الحالي وخطة مراجعتها.</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-lg">
          <Link href={`/teacher/students/${studentId}`}>إلغاء</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">السورة المحفوظة حاليًا</Label>
              <Input
                placeholder="مثلاً: البقرة"
                value={form.currentSurah ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, currentSurah: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">الآيات (من — إلى)</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={form.currentAyahFrom}
                  onChange={(v) => setForm((f) => ({ ...f, currentAyahFrom: v }))}
                  placeholder="من"
                />
                <NumberInput
                  value={form.currentAyahTo}
                  onChange={(v) => setForm((f) => ({ ...f, currentAyahTo: v }))}
                  placeholder="إلى"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">سورة المراجعة</Label>
              <Input
                placeholder="مثلاً: الفاتحة"
                value={form.reviewSurah ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, reviewSurah: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">آيات المراجعة (من — إلى)</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={form.reviewAyahFrom}
                  onChange={(v) => setForm((f) => ({ ...f, reviewAyahFrom: v }))}
                  placeholder="من"
                />
                <NumberInput
                  value={form.reviewAyahTo}
                  onChange={(v) => setForm((f) => ({ ...f, reviewAyahTo: v }))}
                  placeholder="إلى"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-3 block">نسبة التقدم: {form.progressPct}%</Label>
            <Slider
              value={[form.progressPct]}
              max={100}
              step={1}
              onValueChange={([v]) => setForm((f) => ({ ...f, progressPct: v }))}
              className="my-4"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">ملاحظات</Label>
            <Textarea
              placeholder="ملاحظات خاصة بخطة الحفظ..."
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <Button onClick={save} disabled={saving} className="rounded-lg px-6">
            {saving ? "جارٍ الحفظ..." : "حفظ الخطة"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }: { value: number | null; onChange: (v: number | null) => void; placeholder: string }) {
  return (
    <Input
      type="number"
      min={1}
      max={300}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className="w-full rounded-xl"
    />
  );
}
