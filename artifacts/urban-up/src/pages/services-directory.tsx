import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Globe, Search, ExternalLink, Heart, Users, Shield, Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Organization {
  id: number; name: string; nameAr: string;
  description: string; descriptionAr: string;
  phone: string; email: string; website: string; facebook: string;
  location: string; locationAr: string; lat: number; lng: number;
  services: string[]; servicesAr: string[];
  category: string; featured: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Heart; color: string; en: string; ar: string }> = {
  disability:    { icon: Heart,   color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",     en: "Disability Services", ar: "خدمات الإعاقة"       },
  human_rights:  { icon: Shield,  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",     en: "Human Rights",        ar: "حقوق الإنسان"       },
  coalition:     { icon: Users,   color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", en: "Coalition",          ar: "ائتلاف"             },
  vision:        { icon: Eye,     color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", en: "Vision Services",     ar: "خدمات بصرية"        },
};

export default function ServicesDirectoryPage() {
  const { isRtl, lang } = useI18n();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: orgs = [], isLoading } = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: () => fetch(`${BASE}/api/organizations`).then(r => r.json()),
  });

  const filtered = orgs.filter(o => {
    const matchSearch = !search ||
      (lang === "ar" ? o.nameAr : o.name).toLowerCase().includes(search.toLowerCase()) ||
      (lang === "ar" ? o.descriptionAr : o.description).toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || o.category === activeCategory;
    return matchSearch && matchCat;
  });

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div>
          <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
            <span className="text-3xl">🤝</span>
            <h1 className="text-3xl font-bold tracking-tight">{t("Services Directory", "دليل الخدمات")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("Organizations and services supporting persons with disabilities in Palestine",
               "منظمات وخدمات تدعم ذوي الإعاقة في فلسطين")}
          </p>
        </div>

        {/* Hero partnership banner */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5">
          <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse")}>
            <div className="text-4xl shrink-0">🌟</div>
            <div>
              <h2 className="font-bold text-lg">{t("In Partnership with Bhimitkom Association", "بالشراكة مع جمعية بهمتكم")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("PalTur is proud to partner with Bhimitkom Association to make Ramallah more inclusive and accessible for all citizens.",
                   "يفخر بالتور بالشراكة مع جمعية بهمتكم لجعل رام الله أكثر شمولًا وإتاحةً لجميع المواطنين.")}
              </p>
              <div className={cn("flex gap-2 mt-3 flex-wrap", isRtl && "justify-end")}>
                <a href="https://bhimitkom.ps" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Globe className="size-3" />{t("Visit bhimitkom.ps", "زيارة bhimitkom.ps")}
                  </Button>
                </a>
                <a href="https://www.facebook.com/bhimitkom" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <ExternalLink className="size-3" />{t("Facebook", "فيسبوك")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className={cn("flex items-center gap-3 flex-wrap", isRtl && "flex-row-reverse")}>
          <div className="relative flex-1 min-w-[200px]">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("Search organizations…", "ابحث عن منظمات…")}
              className={cn("text-sm", isRtl ? "pr-9" : "pl-9")}
            />
          </div>
          {["all", "disability", "human_rights", "coalition"].map(cat => (
            <Button key={cat} size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className="text-xs">
              {cat === "all" ? t("All", "الكل") : cat === "disability" ? t("Disability", "إعاقة") : cat === "human_rights" ? t("Human Rights", "حقوق الإنسان") : t("Coalition", "ائتلاف")}
            </Button>
          ))}
        </div>

        {/* Org count */}
        <p className="text-sm text-muted-foreground">
          {filtered.length} {t("organizations found", "منظمة موجودة")}
        </p>

        {/* Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(org => {
              const cat = CATEGORY_CONFIG[org.category] || CATEGORY_CONFIG.disability;
              const CatIcon = cat.icon;
              return (
                <Card key={org.id} className={cn("hover:shadow-md transition-shadow", org.featured && "border-primary/40 ring-1 ring-primary/20")}>
                  <CardContent className="p-5 space-y-4">
                    <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <CatIcon className="size-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                          <h3 className="font-bold text-sm leading-snug">{lang === "ar" ? org.nameAr : org.name}</h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {org.featured && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{t("Featured", "مميز")}</Badge>}
                            <Badge variant="secondary" className={cn("text-xs", cat.color)}>{lang === "ar" ? (cat.ar ?? "") : cat.en}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lang === "ar" ? org.descriptionAr : org.description}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className={cn("space-y-1.5", isRtl && "text-right")}>
                      {org.phone && (
                        <a href={`tel:${org.phone}`} className={cn("flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground", isRtl && "flex-row-reverse")}>
                          <Phone className="size-3 shrink-0" />{org.phone}
                        </a>
                      )}
                      {org.email && (
                        <a href={`mailto:${org.email}`} className={cn("flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground", isRtl && "flex-row-reverse")}>
                          <Mail className="size-3 shrink-0" />{org.email}
                        </a>
                      )}
                      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
                        <MapPin className="size-3 shrink-0" />{lang === "ar" ? org.locationAr : org.location}
                      </div>
                    </div>

                    {/* Services */}
                    <div>
                      <p className={cn("text-xs font-medium mb-1.5", isRtl && "text-right")}>{t("Services", "الخدمات")}</p>
                      <div className={cn("flex flex-wrap gap-1", isRtl && "flex-row-reverse")}>
                        {(lang === "ar" ? org.servicesAr : org.services).slice(0, 4).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {org.services.length > 4 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">+{org.services.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className={cn("flex gap-2 pt-1 flex-wrap", isRtl && "flex-row-reverse")}>
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                            <Globe className="size-3" />{t("Website", "الموقع")}
                          </Button>
                        </a>
                      )}
                      {org.facebook && (
                        <a href={org.facebook} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                            <ExternalLink className="size-3" />{t("Facebook", "فيسبوك")}
                          </Button>
                        </a>
                      )}
                      {org.email && (
                        <a href={`mailto:${org.email}`}>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                            <Mail className="size-3" />{t("Contact", "تواصل")}
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
