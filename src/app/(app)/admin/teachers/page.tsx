"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserMinus, UserCheck, Eye, Plus, Search, BookOpen, Trash2, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function TeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers");
      const data = await res.json();
      if (res.ok) setTeachers(data.teachers || []);
    } catch (err) {
      toast({ title: "تعذر تحميل المعلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleHardDelete() {
    if (!deleteId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/teachers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [deleteId] }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم حذف المعلمة وحسابها نهائياً" });
      setDeleteId(null);
      fetchTeachers();
    } catch (e) {
      toast({ title: "فشل الحذف النهائي", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/teachers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `تم حذف ${selectedIds.length} معلمة نهائياً` });
      setSelectedIds([]);
      setIsBulkDeleting(false);
      fetchTeachers();
    } catch (e) {
      toast({ title: "فشل الحذف الجماعي", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function toggleActive(userId: string, currentStatus: boolean, name: string) {
    const action = currentStatus ? "إيقاف" : "تفعيل";
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast({ title: `تم ${action} حساب ${name} بنجاح` });
      fetchTeachers();
    } catch (err) {
      toast({ title: "حدث خطأ أثناء تغيير الحالة", variant: "destructive" });
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filtered = filteredTeachers.map(t => t.id);
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.user.fullName.toLowerCase().includes(search.toLowerCase()) || 
    t.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">المعلمات</h1>
          <p className="text-sm text-muted-foreground">إدارة شؤون المعلمات والحلقات</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              className="rounded-xl gap-2"
              onClick={() => setIsBulkDeleting(true)}
            >
              <Trash2 className="h-4 w-4" />
              حذف المختار ({selectedIds.length})
            </Button>
          )}
          <Button asChild className="rounded-xl gap-2">
            <Link href="/admin/teachers/new">
              <Plus className="h-4 w-4" />
              إضافة معلمة
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بالاسم أو اسم المستخدم..." 
            className="pl-10 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs gap-1.5 h-10 rounded-xl border border-border"
          onClick={toggleSelectAll}
        >
          {selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
          {selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0 ? "إلغاء تحديد الكل" : "تحديد الكل"}
        </Button>
      </div>

      {loading ? (
        <div className="p-10 text-center">جارٍ التحميل...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-right text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">الاسم</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">التخصص</th>
                <th className="p-4">الحلقات</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    لا توجد معلمات مطابقة للبحث.
                  </td>
                </tr>
              )}
              {filteredTeachers.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <tr key={t.id} className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${!t.user.isActive ? 'bg-muted/20 opacity-70' : ''} ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="p-4">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleSelect(t.id)}
                        className="h-4 w-4 rounded"
                      />
                    </td>
                    <td className="p-4 font-medium">{t.user.fullName}</td>
                    <td className="p-4 text-muted-foreground font-mono text-xs" dir="ltr">@{t.user.username}</td>
                    <td className="p-4">{t.specialty || "—"}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className="rounded-lg font-normal">
                        <BookOpen className="ml-1 h-3 w-3" /> {t._count?.groups || 0}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {t.user.isActive ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 rounded-lg">نشطة</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 rounded-lg">موقوفة</Badge>
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10">
                          <Link href={`/admin/teachers/${t.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleActive(t.userId, t.user.isActive, t.user.fullName)}
                          className={`h-8 w-8 rounded-lg ${t.user.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-100'}`}
                          title={t.user.isActive ? "إيقاف الحساب" : "تفعيل الحساب"}
                        >
                          {t.user.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteId(t.id)}
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          title="حذف نهائي"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف المعلمة نهائياً"
        description="هل أنت متأكد من حذف هذه المعلمة؟ سيتم حذف حساب المستخدم وكافة البيانات المرتبطة بها (الحلقات، الجداول، الدروس، الحضور) نهائياً للأبد."
        onConfirm={handleHardDelete}
        loading={isActionLoading}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog 
        open={isBulkDeleting}
        onOpenChange={setIsBulkDeleting}
        title="حذف المعلمات المختارة"
        description={`هل أنت متأكد من حذف ${selectedIds.length} معلمة مختارة نهائياً؟ سيتم مسح كافة حساباتهم وبياناتهم من قاعدة البيانات للأبد.`}
        onConfirm={handleBulkDelete}
        loading={isActionLoading}
      />
    </div>
  );
}
