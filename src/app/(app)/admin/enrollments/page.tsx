"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, Trash2, CheckSquare, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type GroupOption = {
  id: string;
  name: string;
  teacherName?: string;
  studentCount: number;
  maxStudents: number;
};

type StudentOption = {
  id: string;
  name: string;
  currentGroupId: string | null;
  currentGroupName: string | null;
};

export default function EnrollmentsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("");
  
  // Bulk Assignment State
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  
  // Dialog state
  const [deleteGroupId, setDeleteGroupId] = useState<{id: string, name: string} | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setGroups(data.groups || []);
      setStudents(data.students || []);
      setAcademicYear(data.academicYear || "");
    } catch (e) {
      toast({ title: "تعذّر تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkEnroll() {
    if (!selectedGroupId || selectedStudentIds.length === 0) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId, studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({ title: "تم تسجيل الطالبات بنجاح" });
      setSelectedStudentIds([]);
      loadData();
    } catch (e: any) {
      toast({ title: "فشل التسجيل", description: e.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleHardDeleteGroup() {
    if (!deleteGroupId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${deleteGroupId.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "تم حذف الحلقة نهائياً من قاعدة البيانات" });
      setDeleteGroupId(null);
      loadData();
    } catch (e) {
      toast({ title: "فشل الحذف النهائي", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAllStudents = () => {
    const filtered = filteredStudents.map(s => s.id);
    if (selectedStudentIds.length === filtered.length && filtered.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">إدارة التسجيلات</h1>
          <p className="text-sm text-muted-foreground">
            ربط الطالبات بالحلقات للعام الدراسي {academicYear ? <span dir="ltr">{academicYear}</span> : null}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bulk Assignment Panel */}
        <Card className="rounded-2xl lg:col-span-1 h-fit shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-primary">
              <UserPlus className="h-5 w-5" />
              تسجيل جماعي
            </div>
            
            <div className="space-y-1.5">
              <Label>اختيار الحلقة المستهدفة</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر الحلقة" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.teacherName || "بدون معلمة"}) - {g.studentCount}/{g.maxStudents}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>اختيار الطالبات ({selectedStudentIds.length})</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] rounded-lg px-2"
                  onClick={toggleSelectAllStudents}
                >
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? "إلغاء الكل" : "تحديد الكل"}
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="h-9 pl-8 text-xs rounded-xl" 
                  placeholder="بحث عن طالبة..." 
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
              
              <div className="max-h-[350px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-2 space-y-1 custom-scrollbar">
                {loading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">جارٍ التحميل...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">لا يوجد طالبات</div>
                ) : filteredStudents.map(s => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <div 
                      key={s.id} 
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer border ${
                        isSelected ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted/50 border-transparent'
                      }`}
                      onClick={() => toggleStudent(s.id)}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleStudent(s.id)}
                        className="h-4 w-4 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground italic truncate">
                          {s.currentGroupName 
                            ? (s.currentGroupId === selectedGroupId ? "مسجلة حالياً هنا" : `حالياً في: ${s.currentGroupName}`)
                            : "غير موزعة"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              className="w-full rounded-xl" 
              disabled={!selectedGroupId || selectedStudentIds.length === 0 || isActionLoading}
              onClick={handleBulkEnroll}
            >
              {isActionLoading ? "جارٍ الحفظ..." : `تسجيل ${selectedStudentIds.length} طالبة`}
            </Button>
          </CardContent>
        </Card>

        {/* Groups Overview */}
        <Card className="rounded-2xl lg:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 font-bold text-primary flex items-center justify-between">
              <span>نظرة عامة على الحلقات</span>
              <Badge variant="outline" className="font-normal">{groups.length} حلقة</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map(g => (
                <div key={g.id} className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-primary">{g.name}</div>
                      <div className="text-[10px] text-muted-foreground">{g.teacherName || "بدون معلمة"}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                      onClick={() => setDeleteGroupId({id: g.id, name: g.name})}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      السعة: {g.studentCount} / {g.maxStudents}
                    </span>
                    <span className={g.studentCount >= g.maxStudents ? "text-destructive font-bold" : "text-green-600"}>
                      {g.studentCount >= g.maxStudents ? "مكتملة" : "متاحة"}
                    </span>
                  </div>
                  <div className="mt-1.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${g.studentCount >= g.maxStudents ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (g.studentCount / g.maxStudents) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Group Confirmation */}
      <ConfirmDialog 
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        title="حذف الحلقة نهائياً"
        description={`هل أنت متأكد من حذف حلقة "${deleteGroupId?.name}"؟ سيتم حذف كافة البيانات المرتبطة بها نهائياً ولا يمكن استرجاعها.`}
        onConfirm={handleHardDeleteGroup}
        loading={isActionLoading}
      />
    </div>
  );
}
