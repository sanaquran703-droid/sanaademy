import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "سَنَا | أكاديمية القرآن الكريم",
  description:
    "أكاديمية سَنَا للقرآن الكريم — مساحة للتعلّم والتقدّم في رحلة القرآن، بحلقات أونلاين بإشراف معلمات متخصصات ومتابعة مستمرة لخطة الحفظ والمراجعة.",
  icons: {
    icon: [
      { url: "/brand/sana-icon.svg", type: "image/svg+xml" },
      { url: "/brand/sana-emblem.png", type: "image/png" },
    ],
    apple: "/brand/sana-emblem.png",
  },
  openGraph: {
    title: "سَنَا | أكاديمية القرآن الكريم",
    description: "رحلتك مع القرآن تبدأ هنا.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-arabic bg-background text-foreground antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
