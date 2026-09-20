"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function PaymentActions({ paymentId, proofUrl }: { paymentId: string; proofUrl: string | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState(false);
  const [showRejectAction, setShowRejectAction] = useState(false);

  async function handleDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("تعذر الحذف");
        toast({ title: "تم حذف سجل الدفع نهائياً" });
        setShowDeleteConfirm(false);
        router.refresh();
      } catch (err) {
        toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
      }
    });
  }

  function handleUpdate(action: "confirm" | "reject") {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/payments/${paymentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) throw new Error();
        toast({ title: action === "confirm" ? "تم تأكيد الدفعة بنجاح" : "تم رفض الدفعة" });
        setShowConfirmAction(false);
        setShowRejectAction(false);
        router.refresh();
      } catch (e) {
        toast({ title: "فشل تحديث الحالة", variant: "destructive" });
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      {proofUrl && (
        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="عرض الإثبات">
          <Eye className="h-4 w-4" />
        </a>
      )}
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 gap-1 text-secondary hover:bg-secondary/10" 
        onClick={() => setShowConfirmAction(true)} 
        disabled={pending}
      >
        <Check className="h-4 w-4" />
        تأكيد
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 gap-1 text-destructive hover:bg-destructive/10" 
        onClick={() => setShowRejectAction(true)} 
        disabled={pending}
      >
        <X className="h-4 w-4" />
        رفض
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" 
        onClick={() => setShowDeleteConfirm(true)} 
        disabled={pending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="حذف سجل الدفع"
        description="هل أنت متأكد من حذف سجل الدفع هذا نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={handleDelete}
        loading={pending}
      />

      {/* Confirm Action Confirmation */}
      <ConfirmDialog 
        open={showConfirmAction}
        onOpenChange={setShowConfirmAction}
        title="تأكيد الدفعة"
        description="هل تحققت من صحة التحويل البنكي وتريد تأكيد هذه الدفعة؟"
        onConfirm={() => handleUpdate("confirm")}
        variant="default"
        confirmText="تأكيد الدفعة"
        loading={pending}
      />

      {/* Reject Action Confirmation */}
      <ConfirmDialog 
        open={showRejectAction}
        onOpenChange={setShowRejectAction}
        title="رفض الدفعة"
        description="هل تريد رفض هذه الدفعة؟ سيتم إخطار الطالبة بضرورة إعادة إرسال الإثبات."
        onConfirm={() => handleUpdate("reject")}
        confirmText="رفض الدفعة"
        loading={pending}
      />
    </div>
  );
}
