"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Hourglass, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const statusMeta: Record<Payment["status"], { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" }> = {
  confirmed: { label: "معتمد", icon: CheckCircle2, variant: "default" },
  pending: { label: "قيد المراجعة", icon: Hourglass, variant: "secondary" },
  rejected: { label: "مرفوض", icon: XCircle, variant: "destructive" },
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
      form.append("amount", "500");
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">المدفوعات</h1>
        <p className="text-sm text-muted-foreground">
          ارفعي إثبات الدفع الشهري، وتابعي حالة مدفوعاتك.
        </p>
      </div>

      {/* Upload form */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <Label htmlFor="payment-month" className="mb-2 block text-sm text-muted-foreground">
          الشهر المطلوب دفعه
        </Label>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger id="payment-month" className="w-48" dir="ltr">
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

        <div className="mt-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={onFileChange}
            disabled={uploading}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            صورة أو PDF بحد أقصى 5 ميجابايت (لقطة تحويل إنستاباي مثلاً).
            {file ? ` الملف المختار: ${file.name}` : ""}
          </p>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد رفع إثبات الدفع</DialogTitle>
              <DialogDescription>
                سترفعين إثبات الدفع لشهر {monthLabel(month)}، ملف {file?.name}. هل تريدين المتابعة؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={submit} disabled={uploading}>
                {uploading ? "جاري الرفع..." : "نعم، ارفعي الإثبات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          لا توجد مدفوعات مسجّلة. ارفعي إثبات الدفع من أعلى الصفحة.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const meta = statusMeta[p.status];
            const Icon = meta.icon;
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      p.status === "confirmed"
                        ? "bg-primary/10 text-primary"
                        : p.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{monthLabel(p.monthCovered)}</div>
                    <div className="text-xs text-muted-foreground">
                      <span dir="ltr">
                        {p.amount} {p.currency} — {new Date(p.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      {p.status === "confirmed" && p.confirmedAt ? (
                        <span>
                          {" "}· تم التأكيد{" "}
                          <span dir="ltr">
                            {new Date(p.confirmedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    {p.status === "rejected" && p.note ? (
                      <p className="text-xs text-muted-foreground">ملاحظة: {p.note}</p>
                    ) : null}
                  </div>
                </div>
                <Badge variant={meta.variant} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {meta.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
