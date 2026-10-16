import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "full" shows emblem + wordmark, "mark" shows only the emblem. */
  variant?: "full" | "mark";
  /** Colour treatment for the wordmark. */
  tone?: "dark" | "light";
  /** Secondary line under the wordmark. */
  subtitle?: string;
  className?: string;
  emblemClassName?: string;
};

export function Logo({
  variant = "full",
  tone = "dark",
  subtitle = "أكاديمية سنا للقرآن الكريم",
  className,
  emblemClassName,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/brand/sana-emblem.png"
        alt="شعار أكاديمية سنا للقرآن الكريم"
        width={56}
        height={56}
        priority
        className={cn("h-10 w-10 shrink-0 object-contain", emblemClassName)}
      />
      {variant === "full" && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-lg font-black leading-tight tracking-tight",
              tone === "light" ? "text-brand-cream" : "text-primary"
            )}
          >
            سَنَا
          </span>
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium leading-tight",
              tone === "light" ? "text-brand-cream/75" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </span>
        </span>
      )}
    </span>
  );
}
