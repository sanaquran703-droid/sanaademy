"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { whatsappLink } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#top", label: "الرئيسية", active: true },
  { href: "#programs", label: "البرامج" },
  { href: "#teachers", label: "المعلمات" },
  { href: "#faq", label: "الأسئلة الشائعة" },
  { href: "#about", label: "من نحن" },
  { href: "#contact", label: "تواصل معنا" },
];

const WHATSAPP_LINK = whatsappLink("السلام عليكم، أرغب في التسجيل بأكاديمية سنا");

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 md:top-4">
      <div className="container">
        <div className="flex items-center justify-between rounded-2xl border border-brand-gold/25 bg-brand-cream/90 px-3 py-2 shadow-soft backdrop-blur-xl md:rounded-full md:px-5 md:py-2.5">
          <Link href="/" aria-label="الصفحة الرئيسية لأكاديمية سنا" className="shrink-0">
            <Logo emblemClassName="h-11 w-11 mix-blend-multiply" />
          </Link>

          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-0.5 xl:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  link.active ? "text-primary" : "text-foreground/70"
                )}
              >
                {link.label}
                {link.active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-gold" />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-brand-gold/60 bg-transparent text-primary hover:bg-brand-gold/10"
            >
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-primary px-5 hover:bg-primary/90">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                ابدأ رحلتك الآن
              </a>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          id="mobile-nav"
          className={cn(
            "overflow-hidden transition-all duration-300 md:hidden",
            open ? "mt-2 max-h-[32rem] opacity-100 visible" : "max-h-0 opacity-0 invisible pointer-events-none"
          )}
        >
          <nav aria-label="التنقل الرئيسي للجوال" className="mt-2 flex flex-col gap-1 rounded-2xl border border-brand-gold/25 bg-brand-cream/95 p-3 shadow-soft backdrop-blur-xl">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full border-brand-gold/60 text-primary">
                <Link href="/login" onClick={() => setOpen(false)}>
                  تسجيل الدخول
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-primary">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  ابدأ الآن
                </a>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
