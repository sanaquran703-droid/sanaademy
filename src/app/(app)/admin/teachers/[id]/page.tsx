"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Phone, Shield, Lock, Calendar, Book, 
  AlertCircle, Copy, Edit2, Save, X, GraduationCap, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { formatDateAr as formatDate } from "@/lib/utils";

export default function AdminTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Password Reset State
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Toggle Active State
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  async function fetchTeacher() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "تعذر التحميل");
      setTeacher(d.teacher);
      setStats(d.stats);
      setEditForm({
        fullName: d.teacher.user.fullName,
        phone: d.teacher.user.phone || "",
        specialty: d.teacher.specialty || "",
        bio: d.teacher.bio || "",
      });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
      router.push("/admin/teachers");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("تعذر الحفظ");
      toast({ title: "تم تحديث البيانات بنجاح" });
      setIsEditing(false);
      fetchTeacher();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/users/${teacher.userId}/toggle-active`, { method: "PATCH" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "تعذر التغيير");
      setTeacher({ ...teacher, user: { ...teacher.user, isActive: d.isActive } });
      toast({ title: d.isActive ? "تم تفعيل الحساب" : "تم تعطيل الحساب" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setToggling(false);
    }
  }

  async function handleResetPassword() {
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${teacher.userId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ generateRandom: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "تعذر إعادة التعيين");
      setNewPassword(d.newPassword);
      setShowPasswordDialog(true);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {teacher.user.avatarUrl ? (
              <img src={teacher.user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{teacher.user.fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span dir="ltr">@{teacher.user.username}</span>
              <span>•</span>
              {teacher.user.isActive ? (
                <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/20">نشطة</Badge>
              ) : (
                <Badge variant="secondary">موقوفة</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <><X className="ml-1 h-4 w-4" /> إلغاء</> : <><Edit2 className="ml-1 h-4 w-4" /> تعديل البيانات</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={toggling}>
            {teacher.user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetting}>
            <Lock className="ml-1 h-4 w-4" /> إعادة تعيين كلمة السر
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info & Stats */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">المعلومات الأساسية</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>الاسم الكامل</Label>
                  <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الهاتف</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>التخصص</Label>
                  <Input value={editForm.specialty} onChange={e => setEditForm({...editForm, specialty: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>نبذة</Label>
                  <Textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows={3} />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : <><Save className="ml-2 h-4 w-4" /> حفظ التعديلات</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <InfoItem icon={<Phone className="h-4 w-4" />} label="الهاتف" value={teacher.user.phone} />
                <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="التخصص" value={teacher.specialty} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="تاريخ الانضمام" value={formatDate(teacher.user.createdAt)} />
                <div className="pt-2">
                  <Label className="text-muted-foreground">النبذة الشخصية</Label>
                  <p className="mt-1 text-sm leading-relaxed">{teacher.bio || "لا توجد نبذة"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">إحصائيات الأداء</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.recentLessonsCount || 0}</div>
                <div className="text-xs text-muted-foreground">حصة (آخر 30 يوم)</div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{teacher.groups.length}</div>
                <div className="text-xs text-muted-foreground">حلقات نشطة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">الحلقات التي تدرسها</h2>
            <div className="space-y-4">
              {teacher.groups.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
                  <div>
                    <div className="font-semibold text-primary">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.program?.name || "بدون برنامج"} • {g.academicYear}</div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{g._count.enrollments} طالبة</span>
                    </div>
                    <a href={`/admin/groups/${g.id}`} className="text-primary hover:underline">عرض التفاصيل</a>
                  </div>
                </div>
              ))}
              {teacher.groups.length === 0 && (
                <p className="p-8 text-center text-muted-foreground">لا توجد حلقات مسندة لهذه المعلمة حالياً.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كلمة السر الجديدة</DialogTitle>
            <DialogDescription>
              تمت إعادة تعيين كلمة السر بنجاح. يرجى نسخها الآن حيث لن تظهر مرة أخرى.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-4 font-mono text-lg">
            <span className="flex-1 text-center">{newPassword}</span>
            <Button size="icon" variant="ghost" onClick={() => {
              navigator.clipboard.writeText(newPassword || "");
              toast({ title: "تم النسخ" });
            }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            سيُطلب من المعلمة تغيير كلمة السر عند أول تسجيل دخول لها.
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(false)}>أغلقت النافذة (نسختها)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}
