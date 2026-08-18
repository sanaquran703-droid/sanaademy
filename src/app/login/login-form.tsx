"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DASHBOARD_ROUTES } from "@/lib/constants";

export type PortalRole = "student" | "teacher" | "admin";

const PORTAL_TITLES: Record<PortalRole, string> = {
  student: "تسجيل دخول الطالبات",
  teacher: "تسجيل دخول المعلمات",
  admin: "تسجيل دخول الإدارة",
};

const PORTAL_BUTTONS: Record<PortalRole, string> = {
  student: "دخول إلى بوابة الطالبة",
  teacher: "دخول إلى بوابة المعلمة",
  admin: "دخول إلى لوحة الإدارة",
};

export function LoginForm({
  role,
  initialError,
}: {
  role: PortalRole;
  initialError?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "");
    const password = String(fd.get("password") || "");

    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, expectedRole: role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذّر تسجيل الدخول");
        return;
      }
      // The server decides where to go based on the real role in the JWT/DB.
      router.push(data.redirectTo || DASHBOARD_ROUTES[role] || "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input id="username" name="username" type="text" required autoComplete="username" dir="ltr" className="text-right" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">كلمة المرور</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90">
        {pending ? "جارٍ الدخول..." : PORTAL_BUTTONS[role]}
      </Button>

      <p className="pt-2 text-center text-xs text-muted-foreground">{PORTAL_TITLES[role]}</p>
    </form>
  );
}
