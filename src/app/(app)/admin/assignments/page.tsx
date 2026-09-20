"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, User, Search, CheckCircle2, ChevronRight, 
  ArrowLeft, UserPlus, Filter, Info, Plus, CheckSquare, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function AdminAssignmentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teacherGroups, setTeacherGroups] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState("");

  // Selection State
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(true);
  
  // Action State
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/admin/teachers"),
        fetch("/api/admin/enrollments"), 
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      
      setTeachers(tData.teachers || []);
      setStudents(sData.students || []);
      setAcademicYear(sData.academicYear || "");
    } catch (err) {
      toast({ title: "تعذر تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherGroups();
    } else {
      setTeacherGroups([]);
      setSelectedGroupId("");
    }
  }, [selectedTeacherId]);

  async function fetchTeacherGroups() {
    try {
      const res = await fetch("/api/admin/enrollments");
      const data = await res.json();
      const groups = (data.groups || []).filter((g: any) => g.teacherId === selectedTeacherId);
      setTeacherGroups(groups);
    } catch (err) {
      toast({ title: "تعذر تحميل حلقات المعلمة", variant: "destructive" });
    }
  }

  async function handleConfirm() {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId, studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر توزيع الطالبات");
      
      toast({ title: "تم توزيع الطالبات بنجاح" });
      router.push(`/admin/groups/${selectedGroupId}`);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
      setShowConfirmDialog(false);
    }
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesFilter = showOnlyUnassigned ? !s.currentGroupId : true;
    return matchesSearch && matchesFilter;
  });

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filtered = filteredStudents.map(s => s.id);
    if (selectedStudentIds.length === filtered.length && filtered.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filtered);
    }
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  const selectedGroup = teacherGroups.find(g => g.id === selectedGroupId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">توزيع الطالبات</h1>
          <p className="text-sm text-muted-foreground">توزيع الطالبات على الحلقات للعام الدراسي {academicYear}</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-2 w-8 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-muted'}`} 
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Choose Teacher */}
        {step === 1 && (
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                اختيار المعلمة
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {teachers.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedTeacherId === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-bold">{t.user.fullName}</div>
                    <div className="text-xs text-muted-foreground">@{t.user.username} • {t._count.groups} حلقة</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button 
                  disabled={!selectedTeacherId} 
                  onClick={() => setStep(2)}
                  className="rounded-xl px-8"
                >
                  التالي <ChevronRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Group */}
        {step === 2 && (
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                اختيار الحلقة
              </div>
              {teacherGroups.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <p className="text-muted-foreground">هذه المعلمة ليس لديها حلقات نشطة حالياً.</p>
                  <Button variant="outline" className="rounded-xl" onClick={() => router.push('/admin/groups/new')}>
                    <Plus className="ml-1 h-4 w-4" /> إنشاء حلقة جديدة
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {teacherGroups.map(g => (
                    <div 
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGroupId === g.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-bold">{g.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.studentCount} / {g.maxStudents} طالبة
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
                  <ArrowLeft className="ml-2 h-4 w-4" /> السابق
                </Button>
                <Button 
                  disabled={!selectedGroupId} 
                  onClick={() => setStep(3)}
                  className="rounded-xl px-8"
                >
                  التالي <ChevronRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Choose Students */}
        {step === 3 && (
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                  اختيار الطالبات ({selectedStudentIds.length})
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] rounded-lg border border-border"
                    onClick={toggleSelectAll}
                  >
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </Button>
                  <Button 
                    variant={showOnlyUnassigned ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 text-[10px] rounded-lg"
                    onClick={() => setShowOnlyUnassigned(!showOnlyUnassigned)}
                  >
                    <Filter className="ml-1 h-3 w-3" />
                    {showOnlyUnassigned ? "غير الموزعات فقط" : "عرض الكل"}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="بحث عن طالبة بالاسم..." 
                  className="pl-10 rounded-xl"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedStudentIds.includes(s.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        selectedStudentIds.includes(s.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedStudentIds.includes(s.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        {s.currentGroupName && (
                          <div className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            مسجلة حالياً في: {s.currentGroupName}
                          </div>
                        )}
                      </div>
                    </div>
                    {s.currentGroupId && (
                      <Badge variant="outline" className="text-[9px] bg-yellow-50 text-yellow-700 border-yellow-200">
                        سيتم نقلها
                      </Badge>
                    )}
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">لا توجد طالبات مطابقة للبحث.</div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">
                  <ArrowLeft className="ml-2 h-4 w-4" /> السابق
                </Button>
                <Button 
                  disabled={selectedStudentIds.length === 0} 
                  onClick={() => setShowConfirmDialog(true)}
                  className="rounded-xl px-8"
                >
                  تأكيد التوزيع <UserPlus className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog 
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="تأكيد توزيع الطالبات"
        description={`هل أنت متأكد من تسجيل ${selectedStudentIds.length} طالبة في حلقة "${selectedGroup?.name}"؟`}
        onConfirm={handleConfirm}
        loading={isActionLoading}
        confirmText="تأكيد التسجيل"
      />
    </div>
  );
}
