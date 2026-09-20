"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, Users, BookOpen, Plus, Trash2, Calendar, 
  Settings2, ExternalLink, ChevronLeft, Info, Link as LinkIcon,
  Clock, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

type ScheduleRow = { id?: string; dayOfWeek: number; startTime: string; durationMins: number };
type TeacherGroup = {
  id: string;
  name: string;
  programName: string | null;
  meetLink: string | null;
  meetingProvider: string | null;
  maxStudents: number | null;
  studentCount: number;
  schedules: ScheduleRow[];
};

type Program = { id: string; name: string };

const PROVIDERS: Record<string, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  discord: "Discord",
  other: "أخرى",
};

const DAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function TeacherGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProgramId, setNewProgramId] = useState("");
  const [newMax, setNewMax] = useState(10);
  const [newProvider, setNewProvider] = useState("google_meet");
  const [newMeetLink, setNewMeetLink] = useState("");
  const [newSchedules, setNewSchedules] = useState<ScheduleRow[]>([{ dayOfWeek: 0, startTime: "16:00", durationMins: 60 }]);

  // Action state
  const [deleteGroup, setDeleteGroup] = useState<{id: string, name: string} | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/groups");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setGroups(data.groups ?? []);
      setAcademicYear(data.academicYear ?? "");
      
      const pres = await fetch("/api/teacher/programs");
      const pdata = await pres.json();
      setPrograms(pdata.programs || []);
    } catch (e) {
      toast({ title: "تعذّر تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    if (!newName || !newProgramId) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال اسم الحلقة واختيار البرنامج", variant: "destructive" });
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/teacher/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          programId: newProgramId,
          maxStudents: newMax,
          meetingProvider: newProvider,
          meetLink: newMeetLink,
          schedules: newSchedules,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم إنشاء الحلقة بنجاح" });
      setOpen(false);
      resetForm();
      loadData();
    } catch (e: any) {
      toast({ title: "فشل الإنشاء", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleHardDelete() {
    if (!deleteGroup) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/teacher/groups/${deleteGroup.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "تم حذف الحلقة نهائياً" });
      setDeleteGroup(null);
      loadData();
    } catch (e) {
      toast({ title: "فشل حذف الحلقة", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  function resetForm() {
    setNewName("");
    setNewProgramId("");
    setNewProvider("google_meet");
    setNewMeetLink("");
    setNewSchedules([{ dayOfWeek: 0, startTime: "16:00", durationMins: 60 }]);
  }

  function addSchedule() {
    setNewSchedules([...newSchedules, { dayOfWeek: 0, startTime: "16:00", durationMins: 60 }]);
  }

  function removeSchedule(idx: number) {
    setNewSchedules(newSchedules.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">إدارة حلقاتي</h1>
          <p className="text-sm font-medium text-muted-foreground/80">
            الحلقات النشطة للعام الدراسي {academicYear ? <span dir="ltr" className="font-black text-primary/70">{academicYear}</span> : null}
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shadow-lg h-10 px-6 font-black bg-primary hover:bg-primary/90">
              <Plus className="ml-2 h-4 w-4" />
              إنشاء حلقة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl border-border/40 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-primary">إنشاء حلقة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-black mr-1">اسم الحلقة</Label>
                <Input placeholder="مثال: حلقة الفردوس" value={newName} onChange={e => setNewName(e.target.value)} className="rounded-2xl h-11 border-border/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black mr-1">البرنامج التعليمي</Label>
                <Select value={newProgramId} onValueChange={setNewProgramId}>
                  <SelectTrigger className="rounded-2xl h-11 border-border/40">
                    <SelectValue placeholder="اختر البرنامج" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/40">
                    {programs.map(p => <SelectItem key={p.id} value={p.id} className="rounded-xl">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black mr-1">نوع الاجتماع</Label>
                  <Select value={newProvider} onValueChange={setNewProvider}>
                    <SelectTrigger className="rounded-2xl h-11 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                      {Object.entries(PROVIDERS).map(([k, label]) => (
                        <SelectItem key={k} value={k} className="rounded-xl">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black mr-1">السعة القصوى</Label>
                  <Input type="number" value={newMax} onChange={e => setNewMax(parseInt(e.target.value))} className="rounded-2xl h-11 border-border/40" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black mr-1">رابط اللقاء (اختياري)</Label>
                <Input dir="ltr" placeholder="https://..." value={newMeetLink} onChange={e => setNewMeetLink(e.target.value)} className="rounded-2xl h-11 border-border/40" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-xs font-black">المواعيد الأسبوعية</Label>
                  <Button variant="ghost" size="sm" onClick={addSchedule} className="h-7 px-3 text-[10px] font-black rounded-xl border border-border/40 hover:bg-primary/5">أضف موعد</Button>
                </div>
                {newSchedules.map((s, idx) => (
                  <div key={idx} className="flex items-end gap-2 rounded-2xl border border-border/40 bg-muted/10 p-4 relative group">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">اليوم</Label>
                      <Select value={s.dayOfWeek.toString()} onValueChange={v => {
                        const next = [...newSchedules];
                        next[idx].dayOfWeek = parseInt(v);
                        setNewSchedules(next);
                      }}>
                        <SelectTrigger className="h-9 rounded-xl text-xs border-border/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40">
                          {DAY_LABELS.map((l, i) => <SelectItem key={i} value={i.toString()} className="rounded-xl">{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">الوقت</Label>
                      <Input type="time" value={s.startTime} onChange={e => {
                        const next = [...newSchedules];
                        next[idx].startTime = e.target.value;
                        setNewSchedules(next);
                      }} className="h-9 rounded-xl text-xs border-border/40" />
                    </div>
                    {newSchedules.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeSchedule(idx)} className="h-9 w-9 text-destructive rounded-xl hover:bg-destructive/10 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button onClick={createGroup} className="w-full rounded-2xl h-12 font-black shadow-lg mt-2" disabled={isActionLoading}>
                {isActionLoading ? "جارٍ الإنشاء..." : "إنشاء الحلقة الآن"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map(i => <div key={i} className="h-64 animate-pulse rounded-3xl border border-border/40 bg-muted/20" />)}
        </div>
      ) : groups.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-border/60 bg-muted/5 p-20 text-center shadow-sm">
          <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground/20" />
          <h3 className="text-xl font-black text-primary/40">لا توجد حلقات نشطة</h3>
          <p className="text-sm text-muted-foreground/60 mt-2 font-medium">ابدئي بإنشاء حلقتك الأولى لإضافة الطالبات والبدء في التسميع.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className="rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-border/40 group bg-card/50 backdrop-blur-sm">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="bg-primary/5 p-6 border-b border-border/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/teacher/groups/${g.id}`} className="flex items-center gap-2 text-xl font-black text-primary hover:text-primary/80 transition-colors">
                        <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shrink-0">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="truncate">{g.name}</span>
                        <ChevronLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </Link>
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-black text-muted-foreground/70 bg-background/50 w-fit px-3 py-1 rounded-full border border-border/30">
                        <ShieldCheck className="h-3 w-3" />
                        {g.programName ?? "برنامج عام"}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-2xl text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => setDeleteGroup({id: g.id, name: g.name})}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> الطالبات
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-primary">{g.studentCount}</span>
                        <span className="text-xs font-bold text-muted-foreground">/ {g.maxStudents || "∞"} طالبة</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${g.maxStudents ? (g.studentCount / g.maxStudents) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> المواعيد
                      </div>
                      <div className="text-sm font-black text-foreground/80">
                        {g.schedules.length} أيام في الأسبوع
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {g.schedules.slice(0, 2).map((s, i) => (
                          <span key={i} className="text-[9px] font-black bg-muted px-2 py-0.5 rounded-lg border border-border/30">
                            {DAY_LABELS[s.dayOfWeek]} {s.startTime}
                          </span>
                        ))}
                        {g.schedules.length > 2 && <span className="text-[9px] font-black text-muted-foreground px-1">+{g.schedules.length - 2}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Meeting Info */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    {g.meetLink ? (
                      <Button asChild className="w-full sm:flex-1 rounded-2xl h-11 font-black shadow-lg shadow-primary/20">
                        <a href={g.meetLink} target="_blank" rel="noopener noreferrer">
                          <Video className="ml-2 h-4 w-4" />
                          دخول الحلقة الآن
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" asChild className="w-full sm:flex-1 rounded-2xl h-11 font-black border-dashed border-2">
                        <Link href={`/teacher/groups/${g.id}`}>
                          <LinkIcon className="ml-2 h-4 w-4" />
                          إضافة رابط اللقاء
                        </Link>
                      </Button>
                    )}
                    <Button variant="secondary" asChild className="w-full sm:w-auto rounded-2xl h-11 px-6 font-black border border-border/40">
                      <Link href={`/teacher/groups/${g.id}`}>
                        <Settings2 className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        title="حذف الحلقة نهائياً"
        description={`هل أنتِ متأكدة من حذف حلقة "${deleteGroup?.name}"؟ سيتم حذف كافة البيانات المرتبطة بها نهائياً من النظام ولا يمكن التراجع.`}
        onConfirm={handleHardDelete}
        loading={isActionLoading}
        confirmText="نعم، احذف الحلقة"
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
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
