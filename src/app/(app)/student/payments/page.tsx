"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Hourglass, XCircle, CreditCard, Calendar, Info, ShieldCheck, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Payment = {
  id: string;
  amount: string;
  currency: string;
  monthCovered: string;
  method: string;
  proofUrl: string | null;
  status: "pending" | "confirmed" | "rejected";
  submittedAt: string;
  confirmedAt: string | null;
  note: string | null;
};

const statusMeta: Record<Payment["status"], { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  confirmed: { label: "معتمد", icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  pending: { label: "قيد المراجعة", icon: Hourglass, color: "text-amber-600", bgColor: "bg-amber-50" },
  rejected: { label: "مرفوض", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
};

const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTH_NAMES_AR[Number(m) - 1] ?? m} ${y}`;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function optionMonths(count = 6): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const y = now.getFullYear();
    const m = now.getMonth() + 1 + i;
    const yy = y + Math.floor((m - 1) / 12);
    const mm = ((m - 1) % 12) + 1;
    out.push(`${yy}-${String(mm).padStart(2, "0")}`);
  }
  return out;
}

export default function StudentPaymentsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<string>(currentMonth());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = () =>
    fetch("/api/student/payments")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "تعذّر التحميل");
        setPayments(d.payments);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل المدفوعات", description: "حاولي مرة أخرى", variant: "destructive" });
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [toast]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const okTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!okTypes.includes(f.type)) {
      toast({ title: "نوع الملف غير مسموح", description: "مسموح فقط: صور JPG/PNG/WEBP أو ملف PDF", variant: "destructive" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الملف كبير", description: "الحد الأقصى 5 ميجابايت", variant: "destructive" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
    setConfirmOpen(true);
  }

  async function submit() {
    if (!file || uploading) return;
    setConfirmOpen(false);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("proof", file);
      form.append("monthCovered", month);
      // The amount is determined server-side from trusted pricing.
      const res = await fetch("/api/student/payments", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "لم يتم الرفع", description: d.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      toast({ title: "تم رفع الإثبات بنجاح", description: `سندخله للمراجعة — شهر ${monthLabel(month)}` });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch {
      toast({ title: "تعذّر رفع الملف", description: "تحققي من اتصالك وحاولي مرة أخرى", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="px-1">
        <h1 className="text-2xl font-black tracking-tight text-primary">المدفوعات والاشتراك</h1>
        <p className="text-sm font-medium text-muted-foreground/80">
          إدارة اشتراككِ الشهري ورفع إثباتات السداد
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-primary text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <h2 className="font-black text-lg">رفع إثبات جديد</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-month" className="text-[10px] font-black text-white/70 uppercase tracking-widest mr-1">
                    اختر الشهر
                  </Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger id="payment-month" className="w-full rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:ring-white/30" dir="ltr">
                      <SelectValue placeholder="اختاري الشهر" />
                    </SelectTrigger>
                    <SelectContent>
                      {optionMonths().map((m) => (
                        <SelectItem key={m} value={m}>
                          {monthLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-white/70 uppercase tracking-widest mr-1">
                    ملف الإثبات
                  </Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group cursor-pointer border-2 border-dashed border-white/30 rounded-2xl p-6 text-center hover:bg-white/5 transition-all active:scale-[0.98]"
                  >
                    <Upload className="h-6 w-6 text-white/60 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-black text-white/90">
                      {file ? file.name : "اضغطي هنا لاختيار الملف"}
                    </div>
                    <div className="text-[9px] text-white/50 mt-1">JPG, PNG, PDF (Max 5MB)</div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={onFileChange}
                    disabled={uploading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">معلومات الأمان</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium italic">
                تتم مراجعة كافة التحويلات يدوياً من قبل الإدارة خلال 24-48 ساعة. يرجى التأكد من وضوح صورة التحويل.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Receipt className="h-4 w-4" /> سجل المدفوعات
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl border border-border/40 bg-muted/20" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-border/60 bg-muted/5 p-12 text-center">
              <CardContent className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/40">
                  <CreditCard className="h-8 w-8" />
                </div>
                <p className="text-muted-foreground font-medium italic">
                  لا توجد مدفوعات مسجّلة. ارفعي إثبات الدفع من القائمة الجانبية.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                const meta = statusMeta[p.status];
                const Icon = meta.icon;
                return (
                  <Card key={p.id} className="rounded-2xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn("grid h-10 w-10 place-items-center rounded-xl shadow-inner", meta.bgColor, meta.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-black text-sm">{monthLabel(p.monthCovered)}</div>
                            <div className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-2 mt-0.5">
                              <span dir="ltr">{p.amount} {p.currency}</span>
                              <span>·</span>
                              <span dir="ltr">
                                {new Date(p.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {p.status === "rejected" && p.note && (
                            <div className="group relative">
                              <Info className="h-4 w-4 text-red-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-red-50 text-red-700 text-[10px] p-2 rounded-xl shadow-xl border border-red-100 whitespace-nowrap font-medium">
                                  {p.note}
                                </div>
                              </div>
                            </div>
                          )}
                          <Badge variant="outline" className={cn("rounded-xl px-3 py-1 text-[10px] font-black border-none shadow-sm", meta.bgColor, meta.color)}>
                            {meta.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-sm">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl font-black text-primary">تأكيد الرفع</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              سيتم رفع إثبات الدفع لشهر <span className="font-black text-primary">{monthLabel(month)}</span>. هل البيانات صحيحة؟
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/20 p-4 rounded-2xl border border-border/30 text-center text-xs font-black truncate">
            {file?.name}
          </div>
          <DialogFooter className="flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1 rounded-2xl h-11 font-black shadow-none border-border/60">
              إلغاء
            </Button>
            <Button onClick={submit} disabled={uploading} className="flex-1 rounded-2xl h-11 font-black shadow-lg shadow-primary/20">
              {uploading ? "جاري الرفع..." : "نعم، تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
