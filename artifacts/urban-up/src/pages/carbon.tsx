import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Leaf, Car, Bus, Footprints, Bike, Zap, Trees, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TRANSPORT_MODES = [
  { id: "car",  icon: Car,        factor: 0.171, labelKey: "car"  as const },
  { id: "taxi", icon: Zap,        factor: 0.202, labelKey: "taxi" as const },
  { id: "bus",  icon: Bus,        factor: 0.089, labelKey: "bus"  as const },
  { id: "bike", icon: Bike,       factor: 0,     labelKey: "bike" as const },
  { id: "walk", icon: Footprints, factor: 0,     labelKey: "walk" as const },
];

const MODE_LABELS: Record<string, { en: string; ar: string }> = {
  car:  { en: "Car",      ar: "سيارة" },
  taxi: { en: "Taxi",     ar: "تاكسي" },
  bus:  { en: "Bus",      ar: "حافلة" },
  bike: { en: "Bike",     ar: "دراجة" },
  walk: { en: "Walking",  ar: "مشيًا" },
};

export default function CarbonPage() {
  const { t, isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [distance, setDistance] = useState(5);
  const [mode, setMode] = useState("car");

  const { data: summary } = useQuery({
    queryKey: ["carbon-summary"],
    queryFn: () => fetch(`${BASE}/api/carbon/summary`).then(r => r.json()),
  });

  const { data: calc } = useQuery({
    queryKey: ["carbon-calc", distance, mode],
    queryFn: () => fetch(`${BASE}/api/carbon/calculate?distance=${distance}&mode=${mode}`).then(r => r.json()),
    enabled: distance > 0,
  });

  const offsetMutation = useMutation({
    mutationFn: (trees: number) => fetch(`${BASE}/api/carbon/offset`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trees }),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["carbon-summary"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast({ title: lang === "ar" ? "🌱 تمت زراعة الأشجار!" : "🌱 Trees Planted!", description: lang === "ar" ? `زرعت ${data.treesPlanted} شجرة وأنفقت ${data.pointsSpent} نقطة` : `Planted ${data.treesPlanted} tree(s) — ${data.pointsSpent} points spent` });
    },
    onError: (e: any) => toast({ title: lang === "ar" ? "خطأ" : "Error", description: e?.error || "Failed", variant: "destructive" }),
  });

  const emissionsKg = calc?.emissionsKg ?? 0;
  const treesToOffset = calc?.treesToOffset ?? 0;
  const treeCost = summary?.treeCostPoints ?? 50;
  const totalTrees = summary?.totalTrees ?? 0;

  const getColor = () => {
    if (emissionsKg === 0) return "text-green-500";
    if (emissionsKg < 0.5) return "text-yellow-500";
    if (emissionsKg < 2) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className={cn("text-3xl font-bold tracking-tight flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Leaf className="size-8 text-green-500" />
              {lang === "ar" ? "البصمة الكربونية" : "Carbon Footprint"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "احسب انبعاثاتك وأزرع الأشجار لتعويضها" : "Calculate your emissions and plant trees to offset them"}
            </p>
          </div>
          <div className="text-center bg-green-50 dark:bg-green-950/30 rounded-xl p-4 min-w-[120px]">
            <div className="text-3xl font-bold text-green-600">{totalTrees}</div>
            <div className="text-xs text-green-700 dark:text-green-400">{lang === "ar" ? "أشجار مزروعة" : "Trees Planted"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <Calculator className="size-5 text-primary" />
                {lang === "ar" ? "حاسبة الانبعاثات" : "Emissions Calculator"}
              </CardTitle>
              <CardDescription>{lang === "ar" ? "أدخل المسافة واختر وسيلة النقل" : "Enter distance and choose your transport mode"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Distance slider */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  {lang === "ar" ? `المسافة: ${distance} كم` : `Distance: ${distance} km`}
                </label>
                <input
                  type="range" min={1} max={100} value={distance}
                  onChange={e => setDistance(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
                <div className={cn("flex justify-between text-xs text-muted-foreground mt-1", isRtl && "flex-row-reverse")}>
                  <span>1 km</span><span>100 km</span>
                </div>
              </div>

              {/* Transport mode */}
              <div>
                <label className="text-sm font-medium block mb-2">{lang === "ar" ? "وسيلة النقل" : "Transport Mode"}</label>
                <div className="grid grid-cols-5 gap-2">
                  {TRANSPORT_MODES.map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.id} onClick={() => setMode(m.id)}
                        className={cn("flex flex-col items-center gap-1 rounded-xl p-3 border-2 transition-all text-xs font-medium",
                          mode === m.id ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" : "border-border hover:border-green-300"
                        )}>
                        <Icon className="size-5" />
                        <span>{MODE_LABELS[m.id][lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Result */}
              {calc && (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                  <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                    <span className="text-sm text-muted-foreground">{lang === "ar" ? "الانبعاثات المقدرة" : "Estimated Emissions"}</span>
                    <span className={cn("text-2xl font-bold", getColor())}>{emissionsKg} kg CO₂</span>
                  </div>
                  {emissionsKg === 0 ? (
                    <p className="text-sm text-green-600 font-medium">🎉 {lang === "ar" ? "صفر انبعاثات! أداء رائع." : "Zero emissions! Great choice."}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? `تحتاج إلى ${treesToOffset} شجرة للتعويض` : `You need ${treesToOffset} tree(s) to offset this`}
                    </p>
                  )}
                </div>
              )}

              {/* Plant trees */}
              {treesToOffset > 0 && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => offsetMutation.mutate(treesToOffset)}
                  disabled={offsetMutation.isPending}>
                  <Trees className="size-4" />
                  {lang === "ar"
                    ? `🌱 ازرع ${treesToOffset} شجرة (${treesToOffset * treeCost} نقطة)`
                    : `🌱 Plant ${treesToOffset} Tree(s) — ${treesToOffset * treeCost} pts`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <Trees className="size-5 text-green-500" />
                {lang === "ar" ? "برنامج التشجير" : "Tree Planting Program"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
                <p className="text-sm">
                  {lang === "ar"
                    ? "كل شجرة تمتص حوالي 21 كيلوجرامًا من ثاني أكسيد الكربون سنويًا. من خلال برنامج بالتور، تُزرع أشجارك الافتراضية في فلسطين."
                    : "Each tree absorbs ~21 kg of CO₂ per year. Through PalTur's program, your virtual trees are planted in Palestine."}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "50", label: lang === "ar" ? "نقطة / شجرة" : "pts / tree" },
                    { val: "21", label: lang === "ar" ? "كجم CO₂ / سنة" : "kg CO₂ / year" },
                  ].map(s => (
                    <div key={s.val} className="text-center bg-white dark:bg-green-900/20 rounded-lg p-3 shadow-sm">
                      <div className="text-2xl font-bold text-green-600">{s.val}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{lang === "ar" ? "نصائح لتقليل بصمتك" : "Tips to Reduce Your Footprint"}</p>
                {[
                  lang === "ar" ? "🚌 استخدم النقل العام أو شارك سيارتك" : "🚌 Use public transit or carpool",
                  lang === "ar" ? "🚶 امش أو اركب دراجة للمسافات القصيرة" : "🚶 Walk or cycle for short trips",
                  lang === "ar" ? "🗺️ خطط مساراتك لتجنب الازدحام" : "🗺️ Plan routes to avoid congestion",
                  lang === "ar" ? "🌿 اختر المسار البيئي في بالتور" : "🌿 Choose the eco route in PalTur",
                ].map((tip, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{tip}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
