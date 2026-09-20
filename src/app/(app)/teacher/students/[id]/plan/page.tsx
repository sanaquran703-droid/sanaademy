"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Save, ArrowRight, RotateCcw, TrendingUp, 
  Target, Info, MessageSquare, Star, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    loadData();
  }, [studentId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر التحميل");
      
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
    } catch (e: any) {
      toast({ title: "تعذّر تحميل البيانات", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

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
      toast({ title: "تم حفظ خطة الحفظ بنجاح" });
      router.push(`/teacher/students/${studentId}`);
    } catch {
      toast({ title: "تعذّر حفظ الخطة", description: "تحققي من الاتصال وحاولي مرة أخرى", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm font-black text-primary/60 animate-pulse tracking-widest uppercase">جاري تجهيز الخطة...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl hover:bg-primary/5">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">خطة الحفظ والمتابعة</h1>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              <span>تحديد المسار التعليمي للطالبة: <span className="font-black text-primary/70">{studentName}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Progress Tracker Card */}
          <Card className="rounded-[2.5rem] border-none bg-primary text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="h-24 w-24" /></div>
            <CardContent className="p-8 space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">نسبة الإنجاز الإجمالية</div>
                  <div className="text-4xl font-black">{form.progressPct}%</div>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <Star className="h-8 w-8 text-amber-300 fill-amber-300" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative h-4 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-white transition-all duration-500 ease-out" 
                    style={{ width: `${form.progressPct}%` }}
                  />
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={form.progressPct} 
                  onChange={(e) => setForm((f) => ({ ...f, progressPct: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded-lg bg-white/20 accent-white cursor-pointer"
                />
                <p className="text-[10px] font-medium opacity-60 text-center italic">اسحبي الشريط لتعديل نسبة تقدم الطالبة في المصحف كاملاً</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Memorization Section */}
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm bg-card/50 overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="pb-2 border-b border-border/40 bg-primary/5">
                <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> الحفظ الجديد
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black mr-1 text-muted-foreground uppercase">السورة</Label>
                  <Input 
                    placeholder="اسم السورة..." 
                    value={form.currentSurah ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, currentSurah: e.target.value }))}
                    className="rounded-2xl h-11 border-border/40 bg-background/50 focus:bg-background transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black mr-1 text-muted-foreground uppercase">من آية</Label>
                    <NumberInput
                      value={form.currentAyahFrom}
                      onChange={(v) => setForm((f) => ({ ...f, currentAyahFrom: v }))}
                      placeholder="من"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black mr-1 text-muted-foreground uppercase">إلى آية</Label>
                    <NumberInput
                      value={form.currentAyahTo}
                      onChange={(v) => setForm((f) => ({ ...f, currentAyahTo: v }))}
                      placeholder="إلى"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Section */}
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm bg-card/50 overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="pb-2 border-b border-border/40 bg-amber-50/50">
                <CardTitle className="text-sm font-black text-amber-600 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" /> المراجعة (الورد اليومي)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black mr-1 text-muted-foreground uppercase">السورة / الجزء</Label>
                  <Input 
                    placeholder="اسم السورة أو الجزء..." 
                    value={form.reviewSurah ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, reviewSurah: e.target.value }))}
                    className="rounded-2xl h-11 border-border/40 bg-background/50 focus:bg-background transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black mr-1 text-muted-foreground uppercase">من آية</Label>
                    <NumberInput
                      value={form.reviewAyahFrom}
                      onChange={(v) => setForm((f) => ({ ...f, reviewAyahFrom: v }))}
                      placeholder="من"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black mr-1 text-muted-foreground uppercase">إلى آية</Label>
                    <NumberInput
                      value={form.reviewAyahTo}
                      onChange={(v) => setForm((f) => ({ ...f, reviewAyahTo: v }))}
                      placeholder="إلى"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Card */}
          <Card className="rounded-[2.5rem] border-border/40 shadow-sm bg-card/50 overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-sm font-black text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> توجيهات وملاحظات للطالبة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea 
                placeholder="اكتبي نصائح أو تشجيع للطالبة هنا..." 
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="rounded-3xl min-h-[120px] border-border/40 bg-background/50 focus:bg-background transition-all resize-none leading-relaxed p-5"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-border/40 shadow-sm bg-card/50 p-6 space-y-4 sticky top-6">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest px-1">إجراءات الحفظ</h3>
              <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
                سيتم إرسال إشعار فوري للطالبة عند حفظ التعديلات لإعلامها بخطة الحفظ الجديدة.
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <Button 
                onClick={save} 
                disabled={saving} 
                className="w-full rounded-2xl h-12 font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? "جارٍ الحفظ..." : "حفظ الخطة الآن"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="w-full rounded-2xl h-12 font-black border-border/60 hover:bg-muted/50"
              >
                إلغاء التغييرات
              </Button>
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-primary/70 leading-normal">
                  تذكري أن تحديد الآيات بدقة يساعد الطالبة على التركيز ويجعل عملية التقييم في الحصة القادمة أسهل وأكثر دقة.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
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
      className="rounded-2xl h-11 border-border/40 bg-background/50 focus:bg-background transition-all text-center font-bold"
    />
  );
}
