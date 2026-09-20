"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { dayNameAr } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

const DAYS_ORDER = [6, 0, 1, 2, 3, 4, 5]; // Sat first (Egypt week)

export default function SchedulesPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schedules");
      const data = await res.json();
      if (res.ok) setSchedules(data.schedules || []);
    } catch (e) {
      toast({ title: "تعذر تحميل الجداول", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/schedules/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "تم حذف الحصة من الجدول بنجاح" });
      setDeleteId(null);
      loadData();
    } catch (e) {
      toast({ title: "فشل حذف الحصة", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  const byDay = new Map<number, any[]>();
  for (const s of schedules) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
    byDay.get(s.dayOfWeek)!.push(s);
  }
  for (const arr of byDay.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <PageHeader
        title="الجداول الدراسية"
        description="عرض إجمالي لكافة الحلقات مقسّمة حسب أيام الأسبوع."
      />

      {loading ? (
        <div className="p-10 text-center">جارٍ التحميل...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DAYS_ORDER.map((d) => {
            const items = byDay.get(d) ?? [];
            return (
              <div key={d} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-2 font-bold text-primary">
                  <Calendar className="h-4 w-4" />
                  {dayNameAr(d)}
                  <Badge variant="secondary" className="mr-auto rounded-lg text-[10px] font-normal">
                    {items.length} حصص
                  </Badge>
                </div>
                <div className="p-4 space-y-3">
                  {items.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground italic">
                      لا توجد حصص مجدولة
                    </div>
                  )}
                  {items.map((s) => (
                    <div key={s.id} className="group rounded-xl border border-border/60 bg-muted/20 p-3 text-sm relative hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-primary">{s.group.name}</span>
                        <span dir="ltr" className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                          {s.startTime}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.group.teacher?.user.fullName ?? "بدون معلمة"} • {s.group._count?.enrollments ?? 0} طالبة
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 left-2 h-7 w-7 rounded-lg text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                        onClick={() => setDeleteId(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف حصة من الجدول"
        description="هل أنت متأكد من حذف هذه الحصة؟ سيتم إزالتها من جدول الحلقة نهائياً."
        onConfirm={handleDelete}
        loading={isActionLoading}
      />
    </div>
  );
}

function Badge({ children, variant = "default", className = "" }: any) {
  const variants: any = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
