"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, User, Book, Calendar, Video, Link as LinkIcon, 
  Edit2, Save, X, Plus, Trash2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dayNameAr } from "@/lib/utils";

export default function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [gRes, tRes] = await Promise.all([
        fetch(`/api/admin/groups/${id}`),
        fetch("/api/admin/teachers"),
      ]);
      const gData = await gRes.json();
      const tData = await tRes.json();
      
      if (!gRes.ok) throw new Error(gData.error || "تعذر تحميل الحلقة");
      
      setGroup(gData.group);
      setTeachers(tData.teachers || []);
      // Programs might be fetched separately if needed, for now assume simple selection or static
      
      setEditForm({
        name: gData.group.name,
        teacherId: gData.group.teacherId || "none",
        programId: gData.group.programId || "none",
        maxStudents: gData.group.maxStudents,
        isActive: gData.group.isActive,
        meetingProvider: gData.group.meetingProvider,
        meetLink: gData.group.meetLink || "",
      });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
      router.push("/admin/groups");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (payload.teacherId === "none") payload.teacherId = null;
      if (payload.programId === "none") payload.programId = null;

      const res = await fetch(`/api/admin/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("تعذر الحفظ");
      toast({ title: "تم تحديث الحلقة بنجاح" });
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">{group.name}</h1>
            <Badge variant={group.isActive ? "default" : "secondary"}>
              {group.isActive ? "نشطة" : "معطلة"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{group.program?.name || "بدون برنامج"} • {group.academicYear}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <><X className="ml-1 h-4 w-4" /> إلغاء</> : <><Edit2 className="ml-1 h-4 w-4" /> تعديل الحلقة</>}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info & Settings */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">إعدادات الحلقة</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>اسم الحلقة</Label>
                  <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>المعلمة</Label>
                  <Select value={editForm.teacherId} onValueChange={v => setEditForm({...editForm, teacherId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر معلمة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون معلمة</SelectItem>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.user.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>العدد الأقصى للطالبات</Label>
                  <Input type="number" value={editForm.maxStudents} onChange={e => setEditForm({...editForm, maxStudents: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <Label>مزود اللقاء</Label>
                  <Select value={editForm.meetingProvider} onValueChange={v => setEditForm({...editForm, meetingProvider: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>رابط اللقاء</Label>
                  <Input value={editForm.meetLink} onChange={e => setEditForm({...editForm, meetLink: e.target.value})} dir="ltr" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="is-active" 
                    checked={editForm.isActive} 
                    onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is-active">الحلقة نشطة</Label>
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : <><Save className="ml-2 h-4 w-4" /> حفظ التعديلات</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <InfoItem icon={<User className="h-4 w-4" />} label="المعلمة" value={group.teacher?.user.fullName || "لم تُعين"} />
                <InfoItem icon={<Users className="h-4 w-4" />} label="الطالبات" value={`${group.enrollments.length} / ${group.maxStudents}`} />
                <InfoItem icon={<Video className="h-4 w-4" />} label="اللقاء" value={providerLabel(group.meetingProvider)} />
                {group.meetLink && (
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground"><LinkIcon className="h-4 w-4" /></div>
                    <a href={group.meetLink} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px]" dir="ltr">
                      {group.meetLink}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">جدول المواعيد</h2>
            <div className="space-y-2">
              {group.schedules.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{dayNameAr(s.dayOfWeek)}</span>
                  <span className="mx-1 text-muted-foreground">—</span>
                  <span className="font-medium">{s.startTime}</span>
                  <span className="text-xs text-muted-foreground">({s.durationMins} دقيقة)</span>
                </div>
              ))}
              {group.schedules.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواعيد محددة.</p>}
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">الطالبات المسجلات ({group.enrollments.length})</h2>
            </div>
            <div className="space-y-3">
              {group.enrollments.map((en: any) => (
                <div key={en.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                      {en.student.user.avatarUrl ? (
                        <img src={en.student.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{en.student.user.fullName}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">@{en.student.user.username}</div>
                    </div>
                  </div>
                  <a href={`/admin/students/${en.student.id}`} className="text-sm text-primary hover:underline">الملف الشخصي</a>
                </div>
              ))}
              {group.enrollments.length === 0 && (
                <p className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">لا توجد طالبات في هذه الحلقة حالياً.</p>
              )}
            </div>
          </div>
        </div>
      </div>
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

function providerLabel(p: string) {
  const map: Record<string, string> = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    discord: "Discord",
    teams: "Microsoft Teams",
    other: "أخرى",
  };
  return map[p] ?? p;
}
