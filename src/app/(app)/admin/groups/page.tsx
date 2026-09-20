"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, Plus, Users, Calendar, CheckSquare, Square, Video } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { dayNameAr } from "@/lib/utils";

export default function AdminGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (res.ok) setGroups(data.groups || []);
    } catch (e) {
      toast({ title: "تعذر تحميل الحلقات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleHardDelete() {
    if (!deleteId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "تم حذف الحلقة نهائياً من قاعدة البيانات" });
      setDeleteId(null);
      loadGroups();
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
      const res = await fetch("/api/admin/groups/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `تم حذف ${selectedIds.length} حلقة نهائياً` });
      setSelectedIds([]);
      setIsBulkDeleting(false);
      loadGroups();
    } catch (e) {
      toast({ title: "فشل الحذف الجماعي", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === groups.length && groups.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(groups.map(g => g.id));
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="الحلقات" description="إدارة حلقات التحفيظ والمعلمات والمواعيد." />
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
            <Link href="/admin/groups/new">
              <Plus className="h-4 w-4" />
              حلقة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center">جارٍ التحميل...</div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد حلقات حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs gap-1.5 h-8 rounded-lg"
              onClick={toggleSelectAll}
            >
              {selectedIds.length === groups.length && groups.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
              {selectedIds.length === groups.length && groups.length > 0 ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <div 
                key={g.id} 
                className={`relative group rounded-2xl border transition-all duration-200 bg-card p-5 hover:shadow-md ${
                  selectedIds.includes(g.id) ? "border-primary ring-1 ring-primary" : "border-border"
                } ${!g.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}
              >
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox 
                    checked={selectedIds.includes(g.id)} 
                    onCheckedChange={() => toggleSelect(g.id)}
                    className="h-5 w-5 rounded-md"
                  />
                </div>

                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-primary">{g.name}</h3>
                    <div className="text-xs text-muted-foreground">
                      {g.program?.name ?? "بدون برنامج"} • {g.academicYear}
                    </div>
                  </div>
                  <Badge variant={g.isActive ? "secondary" : "outline"} className="rounded-lg text-[10px]">
                    {g.isActive ? "نشطة" : "غير نشطة"}
                  </Badge>
                </div>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate">المعلمة: {g.teacher?.user.fullName ?? "بدون معلمة"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>الطالبات: {g._count?.enrollments ?? 0} / {g.maxStudents}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4 shrink-0" />
                    <span>اللقاء: {providerLabel(g.meetingProvider)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {g.schedules?.map((s: any) => (
                        <span key={s.id} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                          {dayNameAr(s.dayOfWeek)} {s.startTime}
                        </span>
                      ))}
                      {(!g.schedules || g.schedules.length === 0) && <span className="italic text-[10px]">لا توجد مواعيد</span>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border/50">
                  <Button variant="outline" size="sm" asChild className="flex-1 rounded-xl gap-1.5">
                    <Link href={`/admin/groups/${g.id}`}>
                      <Edit2 className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(g.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف الحلقة نهائياً"
        description="هل أنت متأكد من حذف هذه الحلقة؟ سيتم حذف كافة البيانات المرتبطة بها (الجداول، الدروس، الحضور) نهائياً من قاعدة البيانات ولا يمكن استرجاعها."
        onConfirm={handleHardDelete}
        loading={isActionLoading}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog 
        open={isBulkDeleting}
        onOpenChange={setIsBulkDeleting}
        title="حذف الحلقات المختارة"
        description={`هل أنت متأكد من حذف ${selectedIds.length} حلقة مختارة نهائياً؟ سيتم مسح كافة البيانات المرتبطة بها من قاعدة البيانات للأبد.`}
        onConfirm={handleBulkDelete}
        loading={isActionLoading}
      />
    </div>
  );
}
