import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Users,
  Home,
  Star,
  ArrowLeft,
  MessageCircle,
  Phone,
  ChevronDown,
  Sparkles,
  PlayCircle,
  HeartHandshake,
  CalendarCheck,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/brand/logo";
import { whatsappLink } from "@/lib/constants";

const WHATSAPP_LINK = whatsappLink("السلام عليكم، أرغب في التسجيل بأكاديمية سنا");

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <HeroCanvas />
        <About />
        <Programs />
        <Teachers />
        <FAQ />
        <ContactCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

const HERO_FEATURES = [
  { icon: BookOpen, title: "برامج متدرجة", sub: "لجميع الأعمار" },
  { icon: Users, title: "معلمات مؤهلات", sub: "ومتخصصات" },
  { icon: Home, title: "بيئة تعليمية آمنة", sub: "ومحفزة" },
  { icon: Star, title: "تعليم عن بُعد", sub: "بجودة عالية" },
];

function HeroCanvas() {
  return (
    <section id="top" className="container pt-4 md:pt-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-brand-gold/25 bg-brand-cream shadow-soft md:rounded-[2.75rem]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-geometry opacity-40" />
        <HeroOrnaments />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2.5 z-20 rounded-[1.6rem] border border-brand-gold/25 md:inset-4 md:rounded-[2.1rem]"
        />

        <div className="relative grid lg:min-h-[560px] lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
          {/* HERO — headline, actions & features (left) over a full-bleed photo */}
          <div className="relative order-1 lg:order-2">
            {/* Photographic scene — full-height panel on desktop, banner on mobile */}
            <div className="relative h-52 w-full overflow-hidden sm:h-72 lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-[48%]">
              <Image
                src="/brand/hero-quran.jpg"
                alt="مصحف مفتوح على حامل خشبي في ضوء ذهبي دافئ"
                fill
                priority
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/10 via-transparent to-brand-cream lg:bg-gradient-to-r lg:from-brand-cream/10 lg:via-transparent lg:to-brand-cream" />
            </div>

            {/* Hero copy */}
            <div className="relative px-6 py-10 text-center md:px-10 lg:flex lg:min-h-[560px] lg:flex-col lg:justify-center lg:py-16 lg:pe-[50%] lg:ps-10">
              <div className="mx-auto max-w-lg">
                <h1 className="text-balance text-4xl font-black leading-[1.22] text-primary md:text-5xl">
                  معًا نحو جيل
                  <span className="mt-1 block text-brand-gold">أقرب إلى القرآن</span>
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-base leading-9 text-muted-foreground md:text-lg">
                  أكاديمية سنا للقرآن الكريم تقدم تعليمًا قرآنيًا متميزًا عبر معلمات مؤهلات
                  وبرامج تناسب جميع الأعمار.
                </p>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className="rounded-full bg-primary px-6 hover:bg-primary/90">
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                      <Sparkles className="h-5 w-5" />
                      ابدأ رحلتك الآن
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-brand-gold/60 bg-transparent px-6 text-primary hover:bg-brand-gold/10 hover:text-primary"
                  >
                    <a href="#programs">
                      <PlayCircle className="h-5 w-5" />
                      تعرّف على البرامج
                    </a>
                  </Button>
                </div>

                <div className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                  {HERO_FEATURES.map((f) => (
                    <div key={f.title} className="flex flex-col items-center gap-2 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/5 text-primary ring-1 ring-brand-gold/30">
                        <f.icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-bold leading-tight text-primary">{f.title}</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">{f.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BRAND PANEL — identity + Quranic verse (visually on the right) */}
          <div className="relative order-2 flex flex-col items-center gap-9 border-border/60 p-8 text-center lg:order-1 lg:border-s lg:p-9">
            <div className="flex flex-col items-center">
              <Image
                src="/brand/sana-emblem.png"
                alt="شعار أكاديمية سنا للقرآن الكريم"
                width={220}
                height={220}
                className="h-28 w-28 object-contain mix-blend-multiply md:h-32 md:w-32"
              />
              <div className="mt-4 text-lg font-black leading-relaxed text-primary md:text-xl">
                أكاديمية سنا للقرآن الكريم
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-gold">
                <span className="h-px w-8 bg-brand-gold/50" />
                نورٌ يُرافق رحلتك
                <span className="h-px w-8 bg-brand-gold/50" />
              </div>
            </div>

            <div className="w-full lg:mt-auto">
              <VersePanel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VersePanel() {
  return (
    <div className="arch-top ring-gold relative overflow-hidden border border-brand-gold/45 bg-background/80 px-6 pb-9 pt-14 shadow-card">
      <span aria-hidden className="absolute inset-x-10 top-8 h-px bg-gradient-to-l from-transparent via-brand-gold/60 to-transparent" />
      <span aria-hidden className="absolute left-1/2 top-3 grid h-6 w-6 -translate-x-1/2 place-items-center">
        <span className="h-3 w-3 rotate-45 border border-brand-gold/70" />
        <span className="absolute h-1 w-1 rotate-45 bg-brand-gold" />
      </span>
      <p className="text-balance text-xl font-bold leading-[2.15] text-primary md:text-2xl">
        ﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَكِّرٍ ﴾
      </p>
      <div className="mt-5 text-xs font-semibold tracking-wide text-brand-gold md:text-sm">[القمر - ١٧]</div>
      <span aria-hidden className="mx-auto mt-5 flex items-center justify-center gap-2">
        <span className="h-px w-6 bg-brand-gold/40" />
        <span className="h-1.5 w-1.5 rotate-45 bg-brand-gold" />
        <span className="h-px w-6 bg-brand-gold/40" />
      </span>
    </div>
  );
}

/** Purely decorative Islamic geometry + twinkling gold, layered behind the hero content. */
function HeroOrnaments() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <ArabesqueRosette className="animate-spin-slow absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 text-brand-gold opacity-[0.05]" />
      <ArabesqueRosette className="animate-spin-slow-rev absolute right-[-90px] top-[12%] h-[420px] w-[420px] text-brand-gold opacity-[0.08]" />
      <ArabesqueRosette className="animate-spin-slow absolute -bottom-28 -left-24 hidden h-[360px] w-[360px] text-brand-gold opacity-[0.06] lg:block" />

      <GoldSpark className="absolute left-[9%] top-[16%] h-3.5 w-3.5 text-brand-gold/70" delay={0} />
      <GoldSpark className="absolute left-[30%] top-[74%] h-2.5 w-2.5 text-brand-gold/60" delay={1.2} />
      <GoldSpark className="absolute right-[7%] top-[9%] h-3 w-3 text-brand-gold/70" delay={2.1} />
      <GoldSpark className="absolute right-[16%] top-[82%] h-4 w-4 text-brand-gold/60" delay={0.6} />
      <GoldSpark className="absolute left-[48%] top-[10%] h-2.5 w-2.5 text-brand-gold/50" delay={3} />
      <GoldSpark className="absolute right-[34%] top-[38%] h-2.5 w-2.5 text-brand-gold/50" delay={1.8} />
    </div>
  );
}

function ArabesqueRosette({ className }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return { x: 100 + 96 * Math.cos(a), y: 100 + 96 * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="1.1">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="66" />
        <circle cx="100" cy="100" r="30" />
        <rect x="44" y="44" width="112" height="112" />
        <rect x="44" y="44" width="112" height="112" transform="rotate(45 100 100)" />
        <rect x="60" y="60" width="80" height="80" transform="rotate(22.5 100 100)" />
        {spokes.map((p, i) => (
          <line key={i} x1="100" y1="100" x2={p.x} y2={p.y} />
        ))}
      </g>
    </svg>
  );
}

function GoldSpark({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`animate-twinkle ${className ?? ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <path d="M12 0c.5 6.3 5.2 11 11.5 11.5v1C17.2 13 12.5 17.7 12 24c-.5-6.3-5.2-11-11.5-11.5v-1C6.8 11 11.5 6.3 12 0z" />
    </svg>
  );
}

function About() {
  const items = [
    { icon: HeartHandshake, title: "بيئة راقية وهادئة", text: "نهتم بأدب الطلب قبل حفظ المتن؛ حلقاتنا محضن للطمأنينة والالتزام." },
    { icon: Users, title: "حلقات مركّزة", text: "أعداد صغيرة داخل الحلقة لتمنح كل طالبة نصيبها من التسميع والتوجيه." },
    { icon: CalendarCheck, title: "متابعة مستمرة", text: "خطة حفظ ومراجعة واضحة، وتقييم بعد كل حصة تصلكِ فور انتهائها." },
  ];
  return (
    <section id="about" className="scroll-mt-28 bg-muted/40 py-20">
      <div className="container">
        <SectionHeading eyebrow="من نحن" title="أكاديمية بُنيت على الإتقان والرحمة" />
        <p className="mx-auto mt-5 max-w-2xl text-center leading-9 text-muted-foreground">
          في سنا نجمع بين الإتقان في التعليم والرحمة في التوجيه، لنصنع معًا رحلة قرآنية
          هادئة ومنظمة تواكب مستواكِ خطوة بخطوة.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-[2rem] border border-border/70 bg-card p-7 shadow-card transition hover:border-brand-gold/50 hover:shadow-soft"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold/15 text-brand-gold">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-primary">{it.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Programs() {
  const programs = [
    { name: "برنامج الحفظ", desc: "خطة حفظ متدرجة من الجزء الثلاثين وحتى ختم القرآن، بأسلوب مرن يناسب مستواكِ." },
    { name: "برنامج المراجعة والتثبيت", desc: "لمن حفظ القرآن أو أجزاءً منه ويرغب في تثبيت الحفظ ومراجعته بطريقة منهجية." },
    { name: "برنامج الإجازة في القرآن الكريم", desc: "للطالبات المتقدمات الراغبات في الحصول على إجازة برواية حفص عن عاصم بشروطها." },
  ];
  return (
    <section id="programs" className="scroll-mt-28 container py-20">
      <SectionHeading eyebrow="البرامج المتاحة" title="اختاري ما يناسب مستواكِ" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {programs.map((p, i) => (
          <div
            key={p.name}
            className="group relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-8 shadow-card transition hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold/15 font-bold text-brand-gold">
              {(i + 1).toString().padStart(2, "0")}
            </div>
            <h3 className="mb-3 text-xl font-bold text-primary">{p.name}</h3>
            <p className="mb-6 text-sm leading-7 text-muted-foreground">{p.desc}</p>
            <Button asChild variant="ghost" size="sm" className="p-0 text-primary hover:bg-transparent">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                التسجيل في البرنامج
                <ArrowLeft className="ms-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Teachers() {
  const items = [
    { icon: GraduationCap, title: "إجازات قرآنية", text: "معلمات حاصلات على إجازات برواية حفص عن عاصم." },
    { icon: HeartHandshake, title: "أسلوب رحيم", text: "توجيه لطيف يراعي نفسية الطالبة وسرعة تقدّمها." },
    { icon: BookOpen, title: "منهج منظم", text: "خطة حفظ ومراجعة واضحة لكل مستوى." },
    { icon: Users, title: "متابعة فردية", text: "اهتمام بكل طالبة داخل الحلقة وخارجها." },
  ];
  return (
    <section id="teachers" className="scroll-mt-28 bg-muted/40 py-20">
      <div className="container">
        <SectionHeading eyebrow="المعلمات" title="معلمات مؤهلات وذوات إجازة" />
        <p className="mx-auto mt-5 max-w-2xl text-center leading-9 text-muted-foreground">
          جميع معلمات سنا حاصلات على إجازات في القرآن الكريم أو دارسات في كليات متخصصة،
          مع خبرة عملية في تعليم الطالبات والأطفال، ومتابعة دقيقة لتقدّم كل طالبة.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <div key={t.title} className="rounded-[2rem] border border-border/70 bg-card p-6 text-center shadow-card">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <t.icon className="h-6 w-6" />
              </div>
              <div className="mb-2 font-bold text-primary">{t.title}</div>
              <div className="text-sm leading-7 text-muted-foreground">{t.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "هل الأكاديمية للنساء والأطفال فقط؟", a: "نعم، سنا مخصصة حاليًا للطالبات والأطفال، بإشراف معلمات متخصصات." },
    { q: "كم عدد الحصص في الأسبوع؟", a: "يختلف حسب البرنامج، وعادةً ما تكون حصتين إلى ثلاث حصص أسبوعيًا." },
    { q: "ما هي رسوم الاشتراك؟", a: "الاشتراك الشهري 500 جنيه مصري، ويتم التحويل عبر Instapay." },
    { q: "كيف تُعقد الحصة؟", a: "الحصة أونلاين عبر Google Meet أو Zoom، والمعلمة تشارك الرابط قبل موعدها." },
    { q: "هل يمكنني تأجيل حصة؟", a: "نعم، بالتنسيق المسبق مع المعلمة، ويتم توثيق التأجيل على المنصة." },
  ];
  return (
    <section id="faq" className="scroll-mt-28 container py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="الأسئلة الشائعة" title="أهم ما يدور في ذهنكِ" />
        <div className="mt-12 space-y-3">
          {items.map((it, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-border/70 bg-card p-5 shadow-card [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-primary">
                {it.q}
                <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-8 text-muted-foreground">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section id="contact" className="scroll-mt-28 container py-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-14 text-center text-primary-foreground md:px-16 md:py-20">
        <div aria-hidden className="absolute inset-0 bg-geometry opacity-30" />
        <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-gold/25 blur-3xl" />
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold text-brand-gold">
            <ScrollText className="h-3.5 w-3.5" />
            تواصل معنا
          </div>
          <h2 className="mb-4 text-3xl font-black md:text-4xl">ابدئي رحلتكِ اليوم</h2>
          <p className="mx-auto mb-9 max-w-xl leading-9 text-primary-foreground/80">
            تواصلي معنا الآن وابدئي أولى خطواتكِ نحو حفظ كتاب الله في بيئة تليق بكِ.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-brand-gold px-7 text-white hover:bg-brand-gold/90">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                التسجيل عبر واتساب
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/30 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/login">
                <Phone className="h-5 w-5" />
                بوابة المنصة
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
            نورٌ يُرافق رحلتك. حلقات أونلاين بإشراف معلمات مؤهلات ومتابعة مستمرة.
          </p>
        </div>
        <div>
          <div className="mb-4 font-semibold text-primary">روابط سريعة</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#programs" className="hover:text-primary">البرامج</a></li>
            <li><a href="#teachers" className="hover:text-primary">المعلمات</a></li>
            <li><a href="#faq" className="hover:text-primary">الأسئلة الشائعة</a></li>
            <li><Link href="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-4 font-semibold text-primary">تواصلي معنا</div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            التواصل عبر واتساب
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} أكاديمية سنا للقرآن الكريم. جميع الحقوق محفوظة.</div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rotate-45 bg-brand-gold" />
            نورٌ يُرافق رحلتك
          </div>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-gold">
        <span className="h-px w-6 bg-brand-gold/60" />
        {eyebrow}
        <span className="h-px w-6 bg-brand-gold/60" />
      </div>
      <h2 className="text-3xl font-black text-primary md:text-4xl">{title}</h2>
    </div>
  );
}
