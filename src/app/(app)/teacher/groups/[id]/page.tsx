"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, User, Book, Calendar, Video, Link as LinkIcon, 
  Edit2, Save, X, Plus, Trash2, Clock, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { dayNameAr } from "@/lib/utils";

export default function TeacherGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  
  // Student Management State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (studentSearch.length >= 2) {
        searchStudents(studentSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [studentSearch]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/groups/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر تحميل الحلقة");
      setGroup(data.group);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
      router.push("/teacher/groups");
    } finally {
      setLoading(false);
    }
  }

  async function searchStudents(q: string) {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/teacher/students/search?q=${encodeURIComponent(q)}&groupId=${id}`);
      const data = await res.json();
      setSearchResults(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddStudent(studentId: string) {
    setIsAddingStudent(true);
    try {
      const res = await fetch(`/api/teacher/groups/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر إضافة الطالبة");
      
      toast({ title: "تمت إضافة الطالبة بنجاح" });
      setAddDialogOpen(false);
      setStudentSearch("");
      fetchData();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setIsAddingStudent(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">جاري التحميل...</div>;

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
          <p className="text-sm text-muted-foreground">{group.program?.name || "بدون برنامج"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/teacher/groups")}>
          العودة للحلقات
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info & Schedules */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-primary flex items-center gap-2">
              <Book className="h-4 w-4" />
              إعدادات الحلقة
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">العدد الحالي</span>
                <span className="font-medium">{group.enrollments.length} / {group.maxStudents || "∞"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">نوع اللقاء</span>
                <span className="font-medium">{group.meetingProvider}</span>
              </div>
              {group.meetLink && (
                <div className="pt-2">
                  <Button variant="secondary" className="w-full rounded-xl h-9" asChild>
                    <a href={group.meetLink} target="_blank" rel="noreferrer">
                      <Video className="ml-2 h-4 w-4" />
                      دخول اللقاء
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              جدول المواعيد
            </h2>
            <div className="space-y-2">
              {group.schedules.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm">
                  <Clock className="h-4 w-4 text-primary/70" />
                  <span className="font-medium">{dayNameAr(s.dayOfWeek)}</span>
                  <span className="mx-1 text-muted-foreground">—</span>
                  <span>{s.startTime}</span>
                </div>
              ))}
              {group.schedules.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواعيد.</p>}
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                طالبات الحلقة ({group.enrollments.length})
              </h2>
              
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl px-4">
                    <Plus className="ml-1.5 h-4 w-4" />
                    إضافة طالبة
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة طالبة للحلقة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="ابحثي باسم الطالبة أو اسم المستخدم..." 
                        className="pl-10 rounded-xl"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                      />
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                      {isSearching ? (
                        <p className="text-center py-8 text-sm text-muted-foreground">جاري البحث...</p>
                      ) : studentSearch.length < 2 ? (
                        <p className="text-center py-8 text-sm text-muted-foreground italic">اكتبي حرفين على الأقل للبحث</p>
                      ) : searchResults.length === 0 ? (
                        <p className="text-center py-8 text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
                      ) : searchResults.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                              {s.avatarUrl ? <img src={s.avatarUrl} className="h-full w-full object-cover" /> : s.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{s.fullName}</div>
                              <div className="text-[10px] text-muted-foreground" dir="ltr">@{s.username}</div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 rounded-lg"
                            onClick={() => handleAddStudent(s.id)}
                            disabled={isAddingStudent}
                          >
                            إضافة
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {group.enrollments.map((en: any) => (
                <div key={en.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/10 p-4 hover:bg-muted/20 transition-all group">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold overflow-hidden shrink-0 border-2 border-background">
                    {en.student.user.avatarUrl ? (
                      <img src={en.student.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      en.student.user.fullName.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{en.student.user.fullName}</div>
                    <div className="text-[10px] text-muted-foreground truncate" dir="ltr">@{en.student.user.username}</div>
                  </div>
                </div>
              ))}
              {group.enrollments.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground italic border-2 border-dashed border-border rounded-2xl">
                  لا توجد طالبات في هذه الحلقة حالياً.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
