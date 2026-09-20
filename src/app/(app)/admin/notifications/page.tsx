"use client";

import { useState, useEffect } from "react";
import { Send, Users, User, Bell, Info, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Group = {
  id: string;
  name: string;
  teacher: { user: { fullName: string } } | null;
};

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    target: "all_students",
    groupId: "",
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "error",
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch (e) {
      toast({ title: "خطأ", description: "تعذر تحميل الحلقات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.target !== "all_students" && !formData.groupId) {
      toast({ title: "تنبيه", description: "يرجى اختيار الحلقة", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "تم الإرسال", description: `تم إرسال الإشعار لـ ${data.count} مستخدم بنجاح` });
        setFormData({ ...formData, title: "", message: "" });
      } else {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإرسال", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const types = [
    { id: "info", label: "معلومات", icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "success", label: "نجاح", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { id: "warning", label: "تنبيه", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
    { id: "error", label: "خطأ", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">إرسال إشعارات جماعية</h1>
          <p className="text-sm text-muted-foreground">تواصل مع الطالبات والمعلمات مباشرة عبر إشعارات المنصة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الإشعار</Label>
              <Input
                id="title"
                placeholder="مثال: تنبيه بخصوص موعد الحلقة"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">نص الرسالة</Label>
              <Textarea
                id="message"
                placeholder="اكتب نص الإشعار هنا بالتفصيل..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="min-h-[150px] rounded-xl resize-none"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-bold gap-2"
            disabled={sending}
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            إرسال الإشعار الآن
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Users className="h-4 w-4" /> الفئة المستهدفة
            </h3>
            
            <div className="space-y-2">
              {[
                { id: "all_students", label: "جميع الطالبات", icon: Users },
                { id: "group_students", label: "طالبات حلقة معينة", icon: Users },
                { id: "group_teacher", label: "معلمة حلقة معينة", icon: User },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, target: t.id })}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right",
                    formData.target === t.id 
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-sm" 
                      : "border-transparent hover:bg-muted text-muted-foreground"
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="text-sm">{t.label}</span>
                </button>
              ))}
            </div>

            {formData.target !== "all_students" && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                <Label>اختر الحلقة</Label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">-- اختر الحلقة --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.teacher?.user.fullName || "بدون معلمة"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Bell className="h-4 w-4" /> نوع التنبيه
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.id as any })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                    formData.type === t.id 
                      ? cn("border-current shadow-sm", t.bg, t.color) 
                      : "border-transparent hover:bg-muted text-muted-foreground"
                  )}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
