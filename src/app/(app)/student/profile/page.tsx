"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Camera, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    // Client session has no avatarUrl; fetch it once from a server helper.
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
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">حسابي</h1>
        <p className="text-sm text-muted-foreground">الصورة الشخصية وتغيير كلمة السر فقط.</p>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {avatarUrl ? (
              <img src={avatarUrl} alt="الصورة الشخصية" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold">{name.charAt(0) || "س"}</span>
            )}
          </div>
          <div>
            <div className="font-semibold">{name}</div>
            <p className="mb-2 text-xs text-muted-foreground">صورة أو JPG/PNG/WEBP بحد أقصى 5 ميجابايت</p>
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
              size="sm"
              disabled={savingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera className="ml-1 h-4 w-4" />
              {savingAvatar ? "جاري الحفظ..." : "تغيير الصورة"}
            </Button>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" /> تغيير كلمة السر
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pw">كلمة السر الحالية</Label>
            <Input
              id="cur-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">كلمة السر الجديدة (8 أحرف على الأقل)</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-pw">تأكيد كلمة السر الجديدة</Label>
            <Input
              id="cf-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button onClick={changePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
            {savingPassword ? "جاري التغيير..." : "حفظ كلمة السر"}
          </Button>
        </div>
      </div>
    </div>
  );
}
