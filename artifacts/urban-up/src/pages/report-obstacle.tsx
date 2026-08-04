import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MapPin, CheckCircle, Clock, Wrench, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Obstacle {
  id: number; lat: number; lng: number;
  obstacleType: string; severity: string;
  description: string; isActive: boolean;
  reporterUsername: string; createdAt: string;
}

const OBSTACLE_TYPES = [
  { value: "broken_ramp",      emoji: "♿", en: "Broken/Missing Ramp",    ar: "منحدر مكسور / مفقود"        },
  { value: "damaged_sidewalk", emoji: "🚧", en: "Damaged Sidewalk",        ar: "رصيف متضرر"                 },
  { value: "missing_curb_cut", emoji: "🛑", en: "Missing Curb Cut",        ar: "حافة رصيف بدون تخفيض"       },
  { value: "parked_vehicle",   emoji: "🚗", en: "Vehicle Blocking Path",   ar: "مركبة تعيق الممر"           },
  { value: "construction",     emoji: "🏗️",  en: "Construction Blocking",  ar: "أعمال إنشاء تعيق الطريق"    },
  { value: "barrier",          emoji: "⛔", en: "Physical Barrier",        ar: "حاجز مادي"                  },
  { value: "pothole",          emoji: "🕳️",  en: "Pothole / Uneven Ground", ar: "حفرة / أرض غير مستوية"     },
  { value: "no_audio_signal",  emoji: "🔇", en: "Missing Audio Signal",    ar: "إشارة صوتية مفقودة"          },
  { value: "poor_lighting",    emoji: "🌑", en: "Poor Lighting",           ar: "إضاءة ضعيفة"                },
  { value: "other",            emoji: "❓", en: "Other Obstacle",          ar: "عقبة أخرى"                  },
];

const SEVERITY_OPTS = [
  { value: "low",    en: "Low — Minor inconvenience",      ar: "منخفض — إزعاج طفيف",    color: "bg-yellow-100 text-yellow-800" },
  { value: "medium", en: "Medium — Difficult to pass",     ar: "متوسط — يصعب العبور",     color: "bg-orange-100 text-orange-800" },
  { value: "high",   en: "High — Dangerous / Impassable",  ar: "عالٍ — خطير / لا يمكن العبور", color: "bg-red-100 text-red-800"  },
];

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; labelAr: string; color: string }> = {
  active:   { icon: Clock,        label: "Reported",    labelAr: "تم الإبلاغ",     color: "bg-blue-100 text-blue-700"   },
  resolved: { icon: CheckCircle,  label: "Resolved",    labelAr: "تم الحل",        color: "bg-green-100 text-green-700" },
};

export default function ReportObstaclePage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lat: "31.9038", lng: "35.2034", obstacleType: "", severity: "medium", description: "" });

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  const { data: obstacles = [], isLoading } = useQuery<Obstacle[]>({
    queryKey: ["obstacles"],
    queryFn: () => fetch(`${BASE}/api/accessibility/obstacles`).then(r => r.json()),
  });

  const reportMutation = useMutation({
    mutationFn: () => fetch(`${BASE}/api/accessibility/obstacles`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: parseFloat(form.lat), lng: parseFloat(form.lng), obstacleType: form.obstacleType, severity: form.severity, description: form.description }),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obstacles"] });
      setShowForm(false);
      setForm({ lat: "31.9038", lng: "35.2034", obstacleType: "", severity: "medium", description: "" });
      toast({ title: t("✅ Report Submitted!", "✅ تم تقديم البلاغ!"), description: t("You earned 15 Jawwal Points 🌟", "لقد ربحت 15 نقطة جوال 🌟") });
    },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const selectedType = OBSTACLE_TYPES.find(o => o.value === form.obstacleType);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <span className="text-3xl">♿</span>
              {t("Report an Obstacle", "أبلغ عن عقبة")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Help improve Ramallah's accessibility for persons with disabilities. Earn 15 Jawwal Points per report.",
                 "ساعد في تحسين إمكانية الوصول في رام الله لذوي الإعاقة. اكسب 15 نقطة جوال لكل تقرير.")}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
            {showForm ? <ChevronUp className="size-4" /> : <Plus className="size-4" />}
            {t("New Report", "تقرير جديد")}
          </Button>
        </div>

        {/* Points incentive banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            🌟 {t("Every obstacle you report earns 15 Jawwal Points and helps a fellow citizen navigate the city safely.",
                   "كل عقبة تبلغ عنها تمنحك 15 نقطة جوال وتساعد مواطنًا آخر على التنقل بأمان.")}
          </p>
        </div>

        {/* Report form */}
        {showForm && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("Submit New Obstacle Report", "تقديم تقرير عقبة جديد")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Obstacle type grid */}
              <div>
                <label className={cn("text-sm font-medium block mb-2", isRtl && "text-right")}>
                  {t("Type of Obstacle", "نوع العقبة")} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {OBSTACLE_TYPES.map(o => (
                    <button key={o.value} onClick={() => setForm(f => ({ ...f, obstacleType: o.value }))}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all hover:border-primary",
                        form.obstacleType === o.value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border"
                      )}>
                      <span className="text-2xl">{o.emoji}</span>
                      <span className="text-xs font-medium leading-tight">{lang === "ar" ? o.ar : o.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className={cn("text-sm font-medium block mb-2", isRtl && "text-right")}>{t("Severity", "الخطورة")} *</label>
                <div className="flex gap-2 flex-wrap">
                  {SEVERITY_OPTS.map(s => (
                    <Button key={s.value} size="sm"
                      variant={form.severity === s.value ? "default" : "outline"}
                      onClick={() => setForm(f => ({ ...f, severity: s.value }))}>
                      {lang === "ar" ? s.ar : s.en}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn("text-sm font-medium block mb-1", isRtl && "text-right")}>{t("Latitude", "خط العرض")} *</label>
                  <Input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="31.9038" />
                </div>
                <div>
                  <label className={cn("text-sm font-medium block mb-1", isRtl && "text-right")}>{t("Longitude", "خط الطول")} *</label>
                  <Input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="35.2034" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {t("Tip: Use Google Maps to find precise coordinates of the obstacle location.",
                   "نصيحة: استخدم خرائط جوجل للعثور على إحداثيات دقيقة لموقع العقبة.")}
              </p>

              {/* Description */}
              <div>
                <label className={cn("text-sm font-medium block mb-1", isRtl && "text-right")}>{t("Description", "الوصف")}</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t("Describe the obstacle and its impact on accessibility…", "صف العقبة وتأثيرها على إمكانية الوصول…")}
                  rows={3} />
              </div>

              <div className={cn("flex gap-3 pt-2", isRtl && "flex-row-reverse")}>
                <Button onClick={() => reportMutation.mutate()}
                  disabled={reportMutation.isPending || !form.obstacleType}
                  className="gap-2">
                  <AlertTriangle className="size-4" />
                  {reportMutation.isPending ? t("Submitting…", "جارٍ…") : t("Submit Report (+15 pts)", "إرسال التقرير (+15 نقطة)")}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("Cancel", "إلغاء")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing obstacles */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {t("Reported Obstacles", "العقبات المُبلَّغ عنها")}
            <Badge variant="secondary" className="ms-2">{obstacles.length}</Badge>
          </h2>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : obstacles.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">{t("No obstacles reported yet. Be the first!", "لا توجد عقبات مُبلَّغ عنها بعد. كن الأول!")}</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {obstacles.map(obs => {
                const typeInfo = OBSTACLE_TYPES.find(o => o.value === obs.obstacleType) ?? OBSTACLE_TYPES.find(o => o.value === "other")!;
                const sevInfo = SEVERITY_OPTS.find(s => s.value === obs.severity) ?? SEVERITY_OPTS[1];
                const statusInfo = STATUS_CONFIG[obs.isActive ? "active" : "resolved"] ?? STATUS_CONFIG.active;
                const StatusIcon = statusInfo.icon;
                return (
                  <Card key={obs.id}>
                    <CardContent className="p-4">
                      <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
                        <span className="text-2xl mt-0.5">{typeInfo.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                            <p className="text-sm font-medium">{lang === "ar" ? typeInfo.ar : typeInfo.en}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge className={cn("text-xs", sevInfo.color)}>{lang === "ar" ? sevInfo.ar.split("—")[0].trim() : sevInfo.en.split("—")[0].trim()}</Badge>
                              <Badge className={cn("text-xs", statusInfo.color)}>
                                <StatusIcon className="size-2.5 me-0.5" />
                                {lang === "ar" ? statusInfo.labelAr : statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                          {obs.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{obs.description}</p>}
                          <div className={cn("flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap", isRtl && "flex-row-reverse")}>
                            <span className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}><MapPin className="size-3" />{obs.lat.toFixed(4)}, {obs.lng.toFixed(4)}</span>
                            <span>by {obs.reporterUsername}</span>
                            <span>{format(new Date(obs.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
