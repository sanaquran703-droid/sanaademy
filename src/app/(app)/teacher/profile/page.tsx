"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Camera, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeacherProfilePage() {
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
    fetch("/api/teacher/profile/me")
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
      const res = await fetch("/api/teacher/profile", { method: "PATCH", body: form });
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
      const res = await fetch("/api/teacher/profile", {
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
    <div className="max-w-xl mx-auto space-y-8 py-6">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">إعدادات الحساب</h1>
          <p className="text-sm text-muted-foreground">تحديث الصورة الشخصية وكلمة السر</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary border-4 border-background shadow-xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="الصورة الشخصية" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold">{name.charAt(0) || "م"}</span>
                )}
              </div>
              <button 
                onClick={() => avatarInputRef.current?.click()}
                disabled={savingAvatar}
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white border-4 border-background shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center sm:text-right space-y-2">
              <h2 className="text-xl font-bold text-primary">{name}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                يفضل استخدام صورة مربعة واضحة.<br />
                الأنواع المسموحة: JPG, PNG, WEBP (بحد أقصى 5 ميجابايت).
              </p>
              <Input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)}
                disabled={savingAvatar}
              />
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2 font-bold text-primary">
            <Lock className="h-5 w-5" /> تغيير كلمة السر
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cur-pw">كلمة السر الحالية</Label>
              <Input
                id="cur-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">كلمة السر الجديدة</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-xl h-12"
                placeholder="8 أحرف على الأقل"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-pw">تأكيد كلمة السر الجديدة</Label>
              <Input
                id="cf-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-xl h-12"
              />
            </div>
            <Button 
              onClick={changePassword} 
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
            >
              {savingPassword ? "جاري التغيير..." : "تحديث كلمة السر"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
