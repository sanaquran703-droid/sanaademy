"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, Calendar, CreditCard, Clock, TrendingUp } from "lucide-react";
import { currentAcademicYear } from "@/lib/academic-year";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const year = currentAcademicYear();

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(res => res.json())
      .then(d => {
        if (d.ok) setStats(d.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center">جاري تحميل الإحصائيات...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">لوحة الإدارة</h1>
        <p className="text-muted-foreground">نظرة عامة على الأكاديمية — العام الدراسي {year}.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={<Users />} label="الطالبات النشطات" value={stats?.activeStudents ?? 0} />
        <Stat icon={<GraduationCap />} label="المعلمات" value={stats?.teachers ?? 0} />
        <Stat icon={<BookOpen />} label="الحلقات النشطة" value={stats?.activeGroups ?? 0} />
        <Stat icon={<Calendar />} label="حصص الأسبوع" value={stats?.weekLessons ?? 0} />
        <Stat icon={<TrendingUp />} label="نسبة الحضور" value={`${stats?.attendanceRate ?? 0}%`} />
        <Stat 
          icon={<CreditCard />} 
          label="مدفوعات معلقة" 
          value={stats?.pendingPayments?.count ?? 0} 
          highlight={(stats?.pendingPayments?.count ?? 0) > 0} 
          subValue={stats?.pendingPayments?.totalAmount ? `${stats.pendingPayments.totalAmount} ريال` : null}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-accent" />
          روابط سريعة
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <QuickLink href="/admin/students/new" label="إضافة طالبة جديدة" />
          <QuickLink href="/admin/groups/new" label="إنشاء حلقة" />
          <QuickLink href="/admin/payments" label="مراجعة المدفوعات" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, highlight, subValue }: { icon: React.ReactNode; label: string; value: any; highlight?: boolean; subValue?: string | null }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-accent/40 bg-accent/5" : "border-border bg-card"}`}>
      <div className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ${highlight ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
      {subValue && <div className="mt-1 text-xs font-medium text-accent">{subValue}</div>}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-accent/50 hover:bg-accent/5">
      {label} ←
    </a>
  );
}
