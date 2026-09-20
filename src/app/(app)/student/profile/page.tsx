"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Camera, Lock, User, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StudentProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/student/profile/me")
      .then(async (res) => {
        const d = await res.json();
        if (res.ok) {
          setName(d.fullName ?? "");
          setAvatarUrl(d.avatarUrl ?? null);
          return;
        }
      })
      .catch(() => {});
  }, []);

  function validatePassword(): string | null {
    if (newPassword.length < 8) return "كلمة السر الجديدة 8 أحرف على الأقل";
    if (newPassword !== confirmPassword) return "كلمتا السر غير متطابقتين";
    if (newPassword === currentPassword) return "كلمة السر الجديدة يجب أن تختلف عن الحالية";
    return null;
  }

  async function uploadAvatar(f: File | null) {
    if (!f || savingAvatar) return;
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(f.type)) {
      toast({ title: "نوع الصورة غير مسموح", description: "مسموح فقط: صور JPG/PNG/WEBP", variant: "destructive" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الصورة كبير", description: "الحد الأقصى 5 ميجابايت", variant: "destructive" });
      return;
    }
    setSavingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", f);
      const res = await fetch("/api/student/profile", { method: "PATCH", body: form });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "لم يتم حفظ الصورة", description: d.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      toast({ title: "تم تحديث الصورة الشخصية" });
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(f);
    } catch {
      toast({ title: "تعذّر رفع الصورة", variant: "destructive" });
    } finally {
      setSavingAvatar(false);
    }
  }

  async function changePassword() {
    const err = validatePassword();
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    if (savingPassword) return;
    setSavingPassword(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "لم يتم تغيير كلمة السر", description: d.error ?? "حاولي مرة أخرى", variant: "destructive" });
        return;
      }
      toast({ title: "تم تغيير كلمة السر بنجاح" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      toast({ title: "تعذّر تغيير كلمة السر", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <div className="px-1">
        <h1 className="text-2xl font-black tracking-tight text-primary">إعدادات الحساب</h1>
        <p className="text-sm font-medium text-muted-foreground/80">إدارة معلوماتكِ الشخصية وتأمين حسابكِ</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Avatar Section */}
        <Card className="md:col-span-2 rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm h-fit">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="h-32 w-32 rounded-3xl bg-primary/5 overflow-hidden border-4 border-white shadow-xl ring-1 ring-primary/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary text-4xl font-black bg-primary/10">
                    {name.charAt(0) || "س"}
                  </div>
                )}
              </div>
              <button 
                onClick={() => avatarInputRef.current?.click()}
                disabled={savingAvatar}
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            
            <h2 className="font-black text-lg text-primary">{name}</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">طالبة سنا</p>
            
            <div className="mt-6 w-full pt-6 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/70 mb-4 justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>حساب مؤمن ونشط</span>
              </div>
              <Input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)}
                disabled={savingAvatar}
              />
              <Button
                variant="outline"
                className="w-full rounded-2xl h-11 border-border/60 font-black text-xs hover:bg-primary/5 transition-all"
                onClick={() => avatarInputRef.current?.click()}
                disabled={savingAvatar}
              >
                {savingAvatar ? "جاري الحفظ..." : "تحديث الصورة"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="md:col-span-3 rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-lg">تغيير كلمة السر</h3>
                <p className="text-xs font-medium text-muted-foreground">تأمين إضافي لحسابكِ الخاص</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cur-pw" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">كلمة السر الحالية</Label>
                <Input
                  id="cur-pw"
                  type="password"
                  className="rounded-2xl h-12 border-border/60 bg-white/50 focus:ring-primary/20"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-pw" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">كلمة السر الجديدة</Label>
                <Input
                  id="new-pw"
                  type="password"
                  className="rounded-2xl h-12 border-border/60 bg-white/50 focus:ring-primary/20"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  autoComplete="new-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cf-pw" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">تأكيد كلمة السر</Label>
                <Input
                  id="cf-pw"
                  type="password"
                  className="rounded-2xl h-12 border-border/60 bg-white/50 focus:ring-primary/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={changePassword} 
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full rounded-2xl h-12 font-black text-sm shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {savingPassword ? "جاري التغيير..." : "حفظ التغييرات"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
