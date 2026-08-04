import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, ExternalLink, Heart, Target, Eye, Users, Trophy, BookOpen, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const ACHIEVEMENTS = [
  { year: "2018", icon: "🏆", en: "Founded Bhimitkom — 'By Your Support' in Arabic", ar: "تأسيس بهمتكم — 'بهمتكم' في العربية" },
  { year: "2019", icon: "🎓", en: "Launched first vocational training cohort — 30 graduates", ar: "إطلاق أول دفعة تدريب مهني — 30 خريجًا" },
  { year: "2020", icon: "💻", en: "Digital skills program launched during COVID-19", ar: "إطلاق برنامج المهارات الرقمية خلال كوفيد-19" },
  { year: "2021", icon: "🤝", en: "Partnership with Ramallah Municipality for inclusive city planning", ar: "شراكة مع بلدية رام الله للتخطيط المدني الشامل" },
  { year: "2022", icon: "🛍️", en: "Bhimitkom Store launched — products by 20 creators", ar: "إطلاق متجر بهمتكم — منتجات من 20 منشئًا" },
  { year: "2023", icon: "📱", en: "PalTur Integration — bringing inclusivity to 10K+ users", ar: "تكامل بالتور — إيصال الشمولية لأكثر من 10 آلاف مستخدم" },
];

const TEAM = [
  { name: "Samah Khalil",      nameAr: "سماح خليل",     role: "Executive Director",       roleAr: "المديرة التنفيذية",         avatar: "👩" },
  { name: "Omar Hasan",        nameAr: "عمر حسن",       role: "Programs Manager",          roleAr: "مدير البرامج",              avatar: "👨" },
  { name: "Nour Al-Barakat",   nameAr: "نور البركات",   role: "Sign Language Coordinator", roleAr: "منسقة لغة الإشارة",         avatar: "👩" },
  { name: "Kareem Mansour",    nameAr: "كريم منصور",    role: "Tech & Digital Lead",       roleAr: "مسؤول التقنية والرقميات",   avatar: "👨" },
];

const LATEST_POSTS = [
  {
    date: "Aug 1, 2026",
    dateAr: "1 أغسطس 2026",
    en: "🎓 Congratulations to our latest batch of vocational trainees — 15 new graduates in ceramics and embroidery!",
    ar: "🎓 تهانينا لآخر دفعة من المتدربين المهنيين — 15 خريجًا جديدًا في الخزف والتطريز!",
  },
  {
    date: "Jul 22, 2026",
    dateAr: "22 يوليو 2026",
    en: "🤝 We're thrilled to announce our partnership with PalTur to make Ramallah more accessible for everyone.",
    ar: "🤝 يسعدنا الإعلان عن شراكتنا مع بالتور لجعل رام الله أكثر إمكانية للوصول للجميع.",
  },
  {
    date: "Jul 10, 2026",
    dateAr: "10 يوليو 2026",
    en: "📢 New sign language awareness workshop — open registration for August sessions.",
    ar: "📢 ورشة توعية جديدة بلغة الإشارة — التسجيل مفتوح لجلسات أغسطس.",
  },
];

export default function BhimitkomPage() {
  const { isRtl, lang } = useI18n();
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-8" dir={isRtl ? "rtl" : "ltr"}>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground p-8">
          <div className={cn("flex items-start gap-5", isRtl && "flex-row-reverse")}>
            <div className="text-6xl shrink-0">🤝</div>
            <div>
              <h1 className="text-3xl font-bold">{t("Bhimitkom Association", "جمعية بهمتكم")}</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">{t("بهمتكم", "Bhimitkom")}</p>
              <p className="mt-3 text-base leading-relaxed text-primary-foreground/90">
                {t(
                  "A leading Palestinian organization dedicated to empowering youth with disabilities through vocational training, digital skills, awareness, and community inclusion programs across the West Bank.",
                  "منظمة فلسطينية رائدة مكرّسة لتمكين الشباب ذوي الإعاقة من خلال التدريب المهني والمهارات الرقمية والتوعية وبرامج الإدماج المجتمعي في أرجاء الضفة الغربية."
                )}
              </p>
              <div className={cn("flex flex-wrap gap-2 mt-4", isRtl && "flex-row-reverse")}>
                <a href="https://bhimitkom.ps" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" className="gap-1.5"><Globe className="size-3.5" />{t("Website", "الموقع")}</Button>
                </a>
                <a href="https://www.facebook.com/bhimitkom" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" className="gap-1.5"><ExternalLink className="size-3.5" />{t("Facebook", "فيسبوك")}</Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Vision + Mission */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: Eye, title: t("Our Vision", "رؤيتنا"), color: "text-blue-600",
              body: t(
                "A Palestinian society where all youth — regardless of ability — have equal access to opportunities, dignity, and active participation in community life.",
                "مجتمع فلسطيني تتساوى فيه فرص جميع الشباب — بصرف النظر عن قدراتهم — في الوصول إلى الفرص والكرامة والمشاركة الفاعلة في الحياة المجتمعية."
              ),
            },
            {
              icon: Target, title: t("Our Mission", "مهمتنا"), color: "text-green-600",
              body: t(
                "To provide vocational training, awareness programs, and inclusive platforms that enable youth with disabilities to contribute, create, and lead in Palestinian society.",
                "تقديم التدريب المهني وبرامج التوعية والمنصات الشاملة التي تُمكّن الشباب ذوي الإعاقة من المساهمة والإبداع والقيادة في المجتمع الفلسطيني."
              ),
            },
          ].map(item => (
            <Card key={item.title}>
              <CardContent className="p-5 flex gap-4">
                <div className={cn("p-2.5 rounded-xl bg-muted shrink-0 h-fit", isRtl && "order-last")}>
                  <item.icon className={cn("size-5", item.color)} />
                </div>
                <div className={isRtl ? "text-right" : ""}>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Services */}
        <div>
          <h2 className="text-xl font-bold mb-4">{t("What We Do", "ماذا نفعل")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: "🛠️", en: "Vocational Training",    ar: "التدريب المهني",        desc_en: "Ceramics, embroidery, graphic design, photography, editing, proofreading", desc_ar: "خزف، تطريز، تصميم جرافيك، تصوير، مونتاج، تدقيق لغوي" },
              { icon: "🤟", en: "Sign Language",           ar: "لغة الإشارة",           desc_en: "Palestinian Sign Language courses for all levels", desc_ar: "دورات لغة الإشارة الفلسطينية لجميع المستويات" },
              { icon: "💻", en: "Digital Skills",          ar: "المهارات الرقمية",      desc_en: "Tech training and digital entrepreneurship", desc_ar: "تدريب تقني وريادة أعمال رقمية" },
              { icon: "🧠", en: "Psychosocial Support",   ar: "الدعم النفسي-الاجتماعي", desc_en: "Peer support groups and counseling", desc_ar: "مجموعات دعم الأقران والإرشاد" },
              { icon: "📢", en: "Awareness Campaigns",    ar: "حملات التوعية",          desc_en: "Disability etiquette, inclusion training for businesses", desc_ar: "آداب الإعاقة، تدريب الشركات على الإدماج" },
              { icon: "💼", en: "Employment Services",    ar: "خدمات التوظيف",          desc_en: "Job matching and employer partnerships", desc_ar: "توفيق الوظائف وشراكات أصحاب العمل" },
            ].map(s => (
              <Card key={s.en} className="hover:shadow-sm transition-shadow">
                <CardContent className={cn("p-4", isRtl && "text-right")}>
                  <span className="text-3xl">{s.icon}</span>
                  <h4 className="font-semibold text-sm mt-2">{lang === "ar" ? s.ar : s.en}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{lang === "ar" ? s.desc_ar : s.desc_en}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline of achievements */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            {t("Our Journey", "مسيرتنا")}
          </h2>
          <div className="space-y-3">
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i} className={cn("flex items-start gap-4", isRtl && "flex-row-reverse")}>
                <Badge variant="secondary" className="shrink-0 font-mono text-xs">{a.year}</Badge>
                <div className={cn("flex items-start gap-2", isRtl && "flex-row-reverse")}>
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? a.ar : a.en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            {t("Our Team", "فريقنا")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEAM.map(m => (
              <Card key={m.name}>
                <CardContent className={cn("p-4 text-center", isRtl && "text-right")}>
                  <div className="text-4xl mb-2">{m.avatar}</div>
                  <p className="font-semibold text-sm">{lang === "ar" ? m.nameAr : m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? m.roleAr : m.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Latest Posts */}
        <div>
          <h2 className="text-xl font-bold mb-4">{t("Latest Updates", "آخر التحديثات")}</h2>
          <div className="space-y-3">
            {LATEST_POSTS.map((p, i) => (
              <Card key={i}>
                <CardContent className={cn("p-4", isRtl && "text-right")}>
                  <p className="text-xs text-muted-foreground mb-1">{lang === "ar" ? p.dateAr : p.date}</p>
                  <p className="text-sm">{lang === "ar" ? p.ar : p.en}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact + CTA */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">{t("Contact Bhimitkom", "تواصل مع بهمتكم")}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Phone, label: "+972 59-849-5030", href: "tel:+972598495030" },
                { icon: Mail,  label: "info@bhimitkom.ps",  href: "mailto:info@bhimitkom.ps" },
                { icon: Globe, label: "bhimitkom.ps",        href: "https://bhimitkom.ps" },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:border-primary transition-colors">
                  <c.icon className="size-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{c.label}</span>
                </a>
              ))}
            </div>
            <div className={cn("flex gap-3 mt-5 flex-wrap", isRtl && "flex-row-reverse")}>
              <Link href="/services-directory">
                <Button className="gap-2"><Heart className="size-4" />{t("View All Partner Organizations", "عرض جميع المنظمات الشريكة")}</Button>
              </Link>
              <Link href="/store/bhimitkom">
                <Button variant="outline" className="gap-2"><Wrench className="size-4" />{t("Shop Bhimitkom Products", "تسوق منتجات بهمتكم")}</Button>
              </Link>
              <Link href="/awareness">
                <Button variant="outline" className="gap-2"><BookOpen className="size-4" />{t("Awareness Courses", "دورات التوعية")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
