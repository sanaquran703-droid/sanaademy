"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Phone, Shield, Lock, Calendar, Book, CreditCard, 
  History, CheckCircle, XCircle, AlertCircle, Copy, Edit2, Save, X, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { formatDateAr as formatDate, dayNameAr } from "@/lib/utils";

export default function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  
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
    fetchStudent();
  }, [id]);

  async function fetchStudent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${id}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "تعذر التحميل");
      setStudent(d.student);
      setEditForm({
        fullName: d.student.user.fullName,
        phone: d.student.user.phone || "",
        guardianName: d.student.guardianName || "",
        guardianPhone: d.student.guardianPhone || "",
        notes: d.student.notes || "",
        birthDate: d.student.birthDate ? d.student.birthDate.split("T")[0] : "",
      });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
      router.push("/admin/students");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("تعذر الحفظ");
      toast({ title: "تم تحديث البيانات بنجاح" });
      setIsEditing(false);
      fetchStudent();
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
      const res = await fetch(`/api/admin/users/${student.userId}/toggle-active`, { method: "PATCH" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "تعذر التغيير");
      setStudent({ ...student, user: { ...student.user, isActive: d.isActive } });
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
      const res = await fetch(`/api/admin/users/${student.userId}/reset-password`, {
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
            {student.user.avatarUrl ? (
              <img src={student.user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{student.user.fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span dir="ltr">@{student.user.username}</span>
              <span>•</span>
              {student.user.isActive ? (
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
            {student.user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetting}>
            <Lock className="ml-1 h-4 w-4" /> إعادة تعيين كلمة السر
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Info */}
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
                  <Label>تاريخ الميلاد</Label>
                  <Input type="date" value={editForm.birthDate} onChange={e => setEditForm({...editForm, birthDate: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>ولي الأمر</Label>
                  <Input value={editForm.guardianName} onChange={e => setEditForm({...editForm, guardianName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>هاتف ولي الأمر</Label>
                  <Input value={editForm.guardianPhone} onChange={e => setEditForm({...editForm, guardianPhone: e.target.value})} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : <><Save className="ml-2 h-4 w-4" /> حفظ التعديلات</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <InfoItem icon={<Phone className="h-4 w-4" />} label="الهاتف" value={student.user.phone} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="تاريخ الميلاد" value={formatDate(student.birthDate)} />
                <InfoItem icon={<Shield className="h-4 w-4" />} label="ولي الأمر" value={student.guardianName} />
                <InfoItem icon={<Phone className="h-4 w-4" />} label="هاتف الولي" value={student.guardianPhone} />
                <div className="pt-2">
                  <Label className="text-muted-foreground">ملاحظات إدارية</Label>
                  <p className="mt-1 text-sm">{student.notes || "لا توجد ملاحظات"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Memorization Plan */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">خطة الحفظ</h2>
            {student.memorizationPlan ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">الهدف الحالي: </span>
                  <span className="font-medium">{student.memorizationPlan.target}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">تم إنجاز: </span>
                  <span className="font-medium">{student.memorizationPlan.completedParts} جزء</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لم يتم تحديد خطة بعد.</p>
            )}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="enrollments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="enrollments">التسجيلات</TabsTrigger>
              <TabsTrigger value="lessons">آخر الحصص</TabsTrigger>
              <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enrollments" className="mt-4 space-y-4">
              {student.enrollments.map((en: any) => (
                <div key={en.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{en.program?.name || "برنامج غير محدد"}</div>
                      <div className="text-xs text-muted-foreground">العام الدراسي: {en.academicYear}</div>
                    </div>
                    <Badge variant={en.status === "active" ? "default" : "secondary"}>
                      {en.status === "active" ? "نشط" : "منتهي"}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">الحلقة: </span>
                    <span className="font-medium">{en.group?.name || "لم تُسكن بعد"}</span>
                  </div>
                </div>
              ))}
              {student.enrollments.length === 0 && <p className="p-8 text-center text-muted-foreground">لا توجد سجلات تسجيل.</p>}
            </TabsContent>

            <TabsContent value="lessons" className="mt-4 space-y-2">
              {student.lessons.map((l: any) => {
                const att = l.attendance[0];
                return (
                  <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                    <div>
                      <div className="font-medium">{formatDate(l.scheduledAt)} — {l.group?.name}</div>
                      <div className="text-xs text-muted-foreground">المعلمة: {l.group?.teacher?.user?.fullName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {att ? (
                        <AttendanceBadge status={att.status} />
                      ) : (
                        <Badge variant="outline" className="text-xs">لم يُسجل</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {student.lessons.length === 0 && <p className="p-8 text-center text-muted-foreground">لا توجد حصص مسجلة.</p>}
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-2">
              {student.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                  <div>
                    <div className="font-medium">{p.monthCovered} — {p.amount} ريال</div>
                    <div className="text-xs text-muted-foreground">تاريخ الرفع: {formatDate(p.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={p.status} />
                    {p.proofUrl && (
                      <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">الإثبات</a>
                    )}
                  </div>
                </div>
              ))}
              {student.payments.length === 0 && <p className="p-8 text-center text-muted-foreground">لا توجد سجلات دفع.</p>}
            </TabsContent>
          </Tabs>
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
            سيُطلب من الطالبة تغيير كلمة السر عند أول تسجيل دخول لها.
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

function AttendanceBadge({ status }: { status: string }) {
  const map: any = {
    present: { label: "حضور", icon: <CheckCircle className="h-3 w-3" />, class: "bg-emerald-100 text-emerald-700" },
    absent: { label: "غياب", icon: <XCircle className="h-3 w-3" />, class: "bg-rose-100 text-rose-700" },
    late: { label: "تأخير", icon: <Clock className="h-3 w-3" />, class: "bg-amber-100 text-amber-700" },
    excused: { label: "بعذر", icon: <CheckCircle className="h-3 w-3" />, class: "bg-blue-100 text-blue-700" },
  };
  const config = map[status] || { label: status, class: "bg-muted" };
  return (
    <Badge className={`gap-1 border-0 ${config.class} hover:${config.class}`}>
      {config.icon} {config.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: { label: "معلق", class: "bg-amber-100 text-amber-700" },
    confirmed: { label: "مؤكد", class: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "مرفوض", class: "bg-rose-100 text-rose-700" },
  };
  const config = map[status] || { label: status, class: "bg-muted" };
  return (
    <Badge className={`border-0 ${config.class} hover:${config.class}`}>
      {config.label}
    </Badge>
  );
}
