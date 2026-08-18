"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

type StudentRow = { id: string; fullName: string; groupName: string };
type GroupedStudents = {
  groupId: string;
  groupName: string;
  programName: string | null;
  students: StudentRow[];
};

export default function TeacherStudentsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupedStudents[]>([]);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/teacher/students")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "تعذّر تحميل الطالبات", description: "حاولي مرة أخرى", variant: "destructive" });
          return;
        }
        setGroups(data.groups ?? []);
        setAcademicYear(data.academicYear ?? "");
        setLoading(false);
      })
      .catch(() => {
        toast({ title: "تعذّر تحميل الطالبات", description: "تحققي من الاتصال", variant: "destructive" });
        setLoading(false);
      });
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.map((g) => ({
      ...g,
      students: g.students.filter((s) => s.fullName.toLowerCase().includes(q)),
    }));
  }, [groups, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">طالباتي</h1>
          <p className="text-sm text-muted-foreground">
            الطالبات النشطات لهذا العام {academicYear ? <span dir="ltr">{academicYear}</span> : null}
          </p>
        </div>
      </div>

      <Input
        placeholder="ابحثي بالاسم..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm rounded-xl bg-card"
      />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          جارٍ التحميل...
        </div>
      ) : filtered.every((g) => g.students.length === 0) ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد طالبات نشطات في حلقاتك حاليًا.
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((g) => (
            <section key={g.groupId}>
              <h2 className="mb-3 text-lg font-bold text-primary">
                {g.groupName}
                {g.programName ? <span className="text-sm font-normal text-muted-foreground"> — {g.programName}</span> : null}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.students.map((s) => (
                  <Card key={s.id} className="rounded-2xl">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">{s.groupName}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="shrink-0 rounded-lg">
                        <Link href={`/teacher/students/${s.id}`}>الملف</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
