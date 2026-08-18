"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Video, Users, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ScheduleRow = { id: string; dayOfWeek: number; startTime: string; durationMins: number };
type TeacherGroup = {
  id: string;
  name: string;
  programName: string | null;
  meetLink: string | null;
  meetingProvider: string | null;
  maxStudents: number | null;
  studentCount: number;
  schedules: ScheduleRow[];
};

const PROVIDERS: Record<string, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  discord: "Discord",
  other: "أخرى",
};

const DAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function TeacherGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState("");
  const [provider, setProvider] = useState("google_meet");

  useEffect(() => {
    fetch("/api/teacher/groups")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "fail");
        setGroups(data.groups ?? []);
        setAcademicYear(data.academicYear ?? "");
      })
      .catch(() => toast({ title: "تعذّر تحميل الحلقات", description: "حاولي مرة أخرى", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  async function saveMeetLink(groupId: string) {
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/meet-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink, meetingProvider: provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "تعذّر الحفظ", description: data.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      setGroups((gs) => gs.map((g) => (g.id === groupId ? { ...g, meetLink: data.group.meetLink, meetingProvider: data.group.meetingProvider } : g)));
      setEditing(null);
      toast({ title: "تم حفظ رابط الحلقة" });
    } catch {
      toast({ title: "تعذّر الحفظ", description: "تحققي من الاتصال", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">حلقاتي</h1>
        <p className="text-sm text-muted-foreground">
          حلقاتك النشطة لهذا العام {academicYear ? <span dir="ltr">{academicYear}</span> : null}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          جارٍ التحميل...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد حلقات نشطة لكِ حاليًا. توجّهي إلى صفحة الحسابات لتعديل ذلك.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <BookOpen className="h-5 w-5 shrink-0" />
                      {g.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {g.programName ?? "—"}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {g.studentCount} طالبة
                        {g.maxStudents ? ` / ${g.maxStudents}` : null}
                      </span>
                      {g.schedules.length > 0 && (
                        <span dir="ltr">
                          {g.schedules.map((s) => `${DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek} ${s.startTime} (${s.durationMins}د)`).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {g.meetLink ? (
                    <Button variant="outline" size="sm" asChild className="shrink-0 rounded-lg">
                      <a href={g.meetLink} target="_blank" rel="noopener noreferrer">
                        <Video className="ms-1 h-4 w-4" />
                        دخول
                      </a>
                    </Button>
                  ) : null}
                </div>

                {editing === g.id ? (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <div>
                      <Label className="mb-1.5 block">رابط الحلقة</Label>
                      <Input
                        dir="ltr"
                        placeholder="https://meet.google.com/..."
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block">نوع الاجتماع</Label>
                      <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PROVIDERS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveMeetLink(g.id)} className="rounded-lg">
                        حفظ
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="rounded-lg">
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-border pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMeetLink(g.meetLink ?? "");
                        setProvider(g.meetingProvider ?? "google_meet");
                        setEditing(g.id);
                      }}
                      className="rounded-lg"
                    >
                      <Video className="ms-1 h-4 w-4" />
                      {g.meetLink ? "تعديل رابط الحلقة" : "إضافة رابط الحلقة"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
