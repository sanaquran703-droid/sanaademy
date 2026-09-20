"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  User, UserMinus, Search, BookOpen, Star, TrendingUp, 
  Calendar, ChevronLeft, ChevronRight, Filter, GraduationCap,
  MoreVertical, ExternalLink
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type StudentRow = { 
  id: string; 
  fullName: string; 
  avatarUrl: string | null;
  groupName: string;
  groupId: string;
  plan: { surah: string | null; progress: number } | null;
  lastEvaluation: { grade: string; date: string } | null;
};

type GroupedStudents = {
  groupId: string;
  groupName: string;
  programName: string | null;
  students: StudentRow[];
};

const GRADE_COLORS: Record<string, string> = {
  excellent: "text-green-600 bg-green-50 border-green-200",
  very_good: "text-blue-600 bg-blue-50 border-blue-200",
  good: "text-yellow-600 bg-yellow-50 border-yellow-200",
  needs_review: "text-destructive bg-destructive/5 border-destructive/20",
};

const GRADE_LABELS: Record<string, string> = {
  excellent: "ممتاز",
  very_good: "جيد جداً",
  good: "جيد",
  needs_review: "مراجعة",
};

export default function TeacherStudentsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupedStudents[]>([]);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog state
  const [removeStudent, setRemoveStudent] = useState<{id: string, name: string} | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/students");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setGroups(data.groups ?? []);
      setAcademicYear(data.academicYear ?? "");
    } catch (e) {
      toast({ title: "تعذّر تحميل الطالبات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Flatten students for table view
  const allStudents = useMemo(() => {
    const list: StudentRow[] = [];
    groups.forEach(g => {
      g.students.forEach(s => {
        list.push({
          ...s,
          groupId: g.groupId,
          groupName: g.groupName
        });
      });
    });
    return list;
  }, [groups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter((s) => s.fullName.toLowerCase().includes(q));
  }, [allStudents, query]);

  // Paginated data
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [query]);

  async function handleRemove() {
    if (!removeStudent) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/teacher/students/${removeStudent.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: `تمت إزالة الطالبة ${removeStudent.name} من الحلقة بنجاح` });
      setRemoveStudent(null);
      loadData();
    } catch (e) {
      toast({ title: "فشل إزالة الطالبة", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">إدارة طالباتي</h1>
          <p className="text-sm font-medium text-muted-foreground/80">
            المتابعة الأكاديمية للعام {academicYear ? <span dir="ltr" className="font-black text-primary/70">{academicYear}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-2xl bg-primary/5 text-primary border-primary/10 font-black px-4 py-1.5 h-10">
            {filtered.length} طالبة إجمالاً
          </Badge>
        </div>
      </div>

      <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-center gap-4 bg-muted/10">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحثي عن طالبة بالاسم..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 rounded-2xl bg-background border-border/40 focus-visible:ring-primary/20 h-10 text-sm font-medium shadow-none"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-border/40 text-muted-foreground">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">الطالبة</th>
                  <th className="px-6 py-4">الحلقة</th>
                  <th className="px-6 py-4">خطة الحفظ</th>
                  <th className="px-6 py-4">التقدم</th>
                  <th className="px-6 py-4 text-center">آخر تقييم</th>
                  <th className="px-6 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-5"><div className="h-3 bg-muted rounded-full w-full" /></td>
                    </tr>
                  ))
                ) : paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <User className="h-12 w-12" />
                        <p className="text-sm font-black italic">
                          {query ? "لا توجد طالبات مطابقة للبحث." : "لا توجد طالبات مسجلات حالياً."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s, idx) => (
                    <tr key={`student-row-${s.id}-${s.groupId}-${idx}`} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner shrink-0">
                            {s.avatarUrl ? (
                              <img src={s.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              s.fullName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-sm text-primary truncate">{s.fullName}</div>
                            <div className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" /> طالبة نشطة
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground/80">{s.groupName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-muted-foreground">{s.plan?.surah || "لم تحدد"}</div>
                      </td>
                      <td className="px-6 py-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500" 
                              style={{ width: `${s.plan?.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-primary/60">{s.plan?.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.lastEvaluation ? (
                          <Badge 
                            variant="outline" 
                            className={cn("text-[9px] px-2 py-0.5 rounded-lg font-black border-none shadow-sm", GRADE_COLORS[s.lastEvaluation.grade])}
                          >
                            {GRADE_LABELS[s.lastEvaluation.grade]}
                          </Badge>
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic">لا يوجد</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-border/40 shadow-xl p-1.5">
                            <DropdownMenuItem asChild className="rounded-xl text-xs font-bold cursor-pointer">
                              <Link href={`/teacher/students/${s.id}`}>
                                <User className="ml-2 h-3.5 w-3.5" /> الملف الشخصي
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl text-xs font-bold cursor-pointer">
                              <Link href={`/teacher/students/${s.id}/plan`}>
                                <TrendingUp className="ml-2 h-3.5 w-3.5" /> خطة الحفظ
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="rounded-xl text-xs font-bold text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setRemoveStudent({id: s.id, name: s.fullName})}
                            >
                              <UserMinus className="ml-2 h-3.5 w-3.5" /> إزالة من الحلقة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/40 flex items-center justify-between bg-muted/5">
              <div className="text-[10px] font-bold text-muted-foreground">
                عرض {Math.min(filtered.length, itemsPerPage)} من أصل {filtered.length} طالبة
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-xl border-border/40 disabled:opacity-30"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="text-[10px] font-black px-3 py-1 rounded-xl bg-primary/5 text-primary border border-primary/10">
                  صفحة {currentPage} من {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-xl border-border/40 disabled:opacity-30"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation */}
      <ConfirmDialog 
        open={!!removeStudent}
        onOpenChange={(open) => !open && setRemoveStudent(null)}
        title="إزالة طالبة من الحلقة"
        description={`هل أنتِ متأكدة من إزالة الطالبة "${removeStudent?.name}" من حلقتك؟ سيبقى سجلها محفوظاً في المنصة ولكنها لن تظهر في قائمتك النشطة.`}
        onConfirm={handleRemove}
        loading={isActionLoading}
        confirmText="إزالة الطالبة"
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
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shadow-sm", variants[variant], className)}>
      {children}
    </span>
  );
}
