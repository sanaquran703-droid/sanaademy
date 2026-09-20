"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { Trash2, BookOpen, Plus, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProgramsPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/programs");
      const data = await res.json();
      if (res.ok) setPrograms(data.programs || []);
    } catch (e) {
      toast({ title: "تعذر تحميل البرامج", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleHardDelete() {
    if (!deleteId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/programs/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "تم حذف البرنامج نهائياً من قاعدة البيانات" });
      setDeleteId(null);
      loadData();
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
      const res = await fetch("/api/admin/programs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `تم حذف ${selectedIds.length} برنامج نهائياً` });
      setSelectedIds([]);
      setIsBulkDeleting(false);
      loadData();
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
    if (selectedIds.length === programs.length && programs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(programs.map(p => p.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="البرامج التعليمية"
          description="إدارة برامج الحفظ والتجويد في الأكاديمية."
        />
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
          <Button className="rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            برنامج جديد
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs gap-1.5 h-8 rounded-lg border border-border"
          onClick={toggleSelectAll}
        >
          {selectedIds.length === programs.length && programs.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
          {selectedIds.length === programs.length && programs.length > 0 ? "إلغاء تحديد الكل" : "تحديد الكل"}
        </Button>
      </div>

      {loading ? (
        <div className="p-10 text-center">جارٍ التحميل...</div>
      ) : programs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد برامج حالياً.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <Card key={p.id} className={`rounded-2xl overflow-hidden group transition-all duration-200 ${isSelected ? 'border-primary ring-1 ring-primary' : ''} ${!p.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                <CardContent className="p-5 relative">
                  <div className="absolute top-4 left-4 z-10">
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelect(p.id)}
                      className="h-5 w-5 rounded-md"
                    />
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <Badge variant={p.isActive ? "secondary" : "outline"} className="rounded-lg text-[10px]">
                      {p.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {p.description || "لا يوجد وصف للبرنامج."}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      {p._count?.enrollments ?? 0} طالبة مسجلة
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف البرنامج نهائياً"
        description="هل أنت متأكد من حذف هذا البرنامج؟ سيتم حذف كافة البيانات المرتبطة به (الحلقات، الجداول، التسجيلات) نهائياً من قاعدة البيانات ولا يمكن استرجاعها."
        onConfirm={handleHardDelete}
        loading={isActionLoading}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog 
        open={isBulkDeleting}
        onOpenChange={setIsBulkDeleting}
        title="حذف البرامج المختارة"
        description={`هل أنت متأكد من حذف ${selectedIds.length} برنامج مختار نهائياً؟ سيتم مسح كافة البيانات المرتبطة بها من قاعدة البيانات للأبد.`}
        onConfirm={handleBulkDelete}
        loading={isActionLoading}
      />
    </div>
  );
}
