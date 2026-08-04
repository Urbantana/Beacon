import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Users, CalendarDays, AlertCircle, Fuel, Compass,
  Coins, Activity, RefreshCw, Server, TrendingUp,
  Car, Trash2, CheckCircle, Clock, BarChart3,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AdminStats {
  updatedAt: string;
  users: { total: number };
  events: { total: number; upcoming: number; ongoing: number; byStatus: Record<string, number> };
  complaints: { total: number; byStatus: { pending: number; reviewing: number; in_progress: number; resolved: number } };
  fuelReports: { total: number; today: number };
  tours: { total: number; upcoming: number; totalParticipants: number; bookings: { total: number; confirmed: number }; byStatus: Record<string, number> };
  points: { totalEarned: number; totalSpent: number; totalTransactions: number };
  traffic: { total: number; active: number };
  waste: { total: number; pending: number };
  suggestions: { total: number; byStatus: Record<string, number> };
  server: { status: string };
}

function StatCard({ icon: Icon, label, value, sub, accent = "text-foreground", loading }: {
  icon: typeof Users; label: string; value: string | number; sub?: string;
  accent?: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="p-2.5 rounded-xl bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <span className={cn("text-3xl font-bold tabular-nums", accent)}>{value}</span>
          )}
        </div>
        <p className="mt-3 text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminStatusPage() {
  const { isRtl, lang } = useI18n();

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch(`${BASE}/api/admin/stats`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    }),
    staleTime: 30_000,
  });

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  const complaintStatuses = [
    { key: "pending",     label: t("Received", "مستلمة"),        color: "bg-blue-500"   },
    { key: "reviewing",   label: t("Under Review", "قيد المراجعة"), color: "bg-amber-500"  },
    { key: "in_progress", label: t("In Progress", "جارٍ العمل"),  color: "bg-orange-500" },
    { key: "resolved",    label: t("Resolved", "تم الحل"),        color: "bg-green-500"  },
  ];

  const suggestionStatuses = [
    { key: "pending",      label: t("Pending", "معلق"),           color: "bg-blue-500"   },
    { key: "under_review", label: t("Under Review", "قيد المراجعة"), color: "bg-amber-500" },
    { key: "approved",     label: t("Approved", "موافق عليه"),    color: "bg-green-500"  },
    { key: "rejected",     label: t("Rejected", "مرفوض"),         color: "bg-red-500"    },
  ];

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>

        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="size-8 text-primary" />
              {t("Admin Status Dashboard", "لوحة تحكم الإدارة")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Real-time platform metrics and health overview", "مقاييس المنصة والصحة العامة في الوقت الفعلي")}
            </p>
          </div>
          <div className={cn("flex flex-col items-end gap-1", isRtl && "items-start")}>
            <Button onClick={() => refetch()} disabled={isFetching} size="sm" className="gap-2">
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
              {t("Refresh", "تحديث")}
            </Button>
            {dataUpdatedAt > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("Updated", "آخر تحديث")}: {format(new Date(dataUpdatedAt), "h:mm:ss a")}
              </p>
            )}
          </div>
        </div>

        {/* Server status banner */}
        <div className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3",
          data?.server?.status === "online"
            ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10"
            : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10",
          isRtl && "flex-row-reverse"
        )}>
          <Server className={cn("size-5 shrink-0", data?.server?.status === "online" ? "text-green-600" : "text-red-600")} />
          <div>
            <p className="text-sm font-semibold">
              {data?.server?.status === "online" ? "🟢" : "🔴"} {t("API Server", "خادم API")}
              {" — "}
              <span className={data?.server?.status === "online" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                {isLoading ? t("Checking…", "جارٍ الفحص…") : data?.server?.status === "online" ? t("Online", "متصل") : t("Offline", "غير متصل")}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{t("All systems operational", "جميع الأنظمة تعمل بشكل طبيعي")}</p>
          </div>
          {data?.updatedAt && (
            <span className="ms-auto text-xs text-muted-foreground">
              {t("Last data update", "آخر تحديث للبيانات")}: {format(new Date(data.updatedAt), "MMM d, h:mm a")}
            </span>
          )}
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users}      label={t("Total Users", "إجمالي المستخدمين")}  value={data?.users.total ?? "—"}      loading={isLoading} accent="text-primary" />
          <StatCard icon={CalendarDays} label={t("Active Events", "الفعاليات النشطة")} value={(data?.events.upcoming ?? 0) + (data?.events.ongoing ?? 0)} loading={isLoading} accent="text-blue-600"
            sub={t(`${data?.events.total ?? 0} total`, `${data?.events.total ?? 0} إجمالي`)} />
          <StatCard icon={Compass}    label={t("Tours Available", "الجولات المتاحة")} value={data?.tours.upcoming ?? "—"}   loading={isLoading} accent="text-violet-600"
            sub={t(`${data?.tours.total ?? 0} total`, `${data?.tours.total ?? 0} إجمالي`)} />
          <StatCard icon={Coins}      label={t("Points Issued", "النقاط الصادرة")}    value={data?.points.totalEarned?.toLocaleString() ?? "—"} loading={isLoading} accent="text-amber-600"
            sub={t(`${data?.points.totalTransactions ?? 0} transactions`, `${data?.points.totalTransactions ?? 0} معاملة`)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Complaints breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <AlertCircle className="size-4 text-orange-500" />
                {t("Complaints", "الشكاوى")}
                <Badge variant="secondary" className="ms-auto">{data?.complaints.total ?? 0} {t("total", "إجمالي")}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-6 bg-muted animate-pulse rounded" />)}</div>
              ) : complaintStatuses.map(s => (
                <ProgressRow
                  key={s.key}
                  label={s.label}
                  value={(data?.complaints.byStatus as any)?.[s.key] ?? 0}
                  total={data?.complaints.total ?? 1}
                  color={s.color}
                />
              ))}
            </CardContent>
          </Card>

          {/* Suggestions breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <TrendingUp className="size-4 text-blue-500" />
                {t("Suggestions", "المقترحات")}
                <Badge variant="secondary" className="ms-auto">{data?.suggestions.total ?? 0} {t("total", "إجمالي")}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-6 bg-muted animate-pulse rounded" />)}</div>
              ) : suggestionStatuses.map(s => (
                <ProgressRow
                  key={s.key}
                  label={s.label}
                  value={data?.suggestions.byStatus?.[s.key] ?? 0}
                  total={data?.suggestions.total ?? 1}
                  color={s.color}
                />
              ))}
            </CardContent>
          </Card>

          {/* Tours & Bookings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <Compass className="size-4 text-violet-500" />
                {t("Tours & Bookings", "الجولات والحجوزات")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t("Total Tours", "إجمالي الجولات"),                 value: data?.tours.total ?? 0,               color: "bg-violet-500" },
                { label: t("Upcoming Tours", "الجولات القادمة"),               value: data?.tours.upcoming ?? 0,            color: "bg-blue-500"   },
                { label: t("Total Bookings", "إجمالي الحجوزات"),               value: data?.tours.bookings.total ?? 0,     color: "bg-indigo-500" },
                { label: t("Confirmed Bookings", "الحجوزات المؤكدة"),           value: data?.tours.bookings.confirmed ?? 0, color: "bg-green-500"  },
                { label: t("Total Participants", "إجمالي المشاركين"),           value: data?.tours.totalParticipants ?? 0,  color: "bg-amber-500"  },
              ].map(r => isLoading
                ? <div key={r.label} className="h-6 bg-muted animate-pulse rounded" />
                : <ProgressRow key={r.label} label={r.label} value={r.value}
                    total={Math.max(r.value, data?.tours.total ?? 1)} color={r.color} />
              )}
            </CardContent>
          </Card>

          {/* Events breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <CalendarDays className="size-4 text-blue-500" />
                {t("Events", "الفعاليات")}
                <Badge variant="secondary" className="ms-auto">{data?.events.total ?? 0} {t("total", "إجمالي")}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t("Upcoming", "قادمة"),   value: data?.events.byStatus?.upcoming   ?? 0, color: "bg-blue-500"   },
                { label: t("Ongoing", "جارية"),    value: data?.events.byStatus?.ongoing    ?? 0, color: "bg-green-500"  },
                { label: t("Completed", "منتهية"), value: data?.events.byStatus?.completed  ?? 0, color: "bg-gray-400"   },
                { label: t("Cancelled", "ملغاة"),  value: data?.events.byStatus?.cancelled  ?? 0, color: "bg-red-500"    },
              ].map(r => isLoading
                ? <div key={r.label} className="h-6 bg-muted animate-pulse rounded" />
                : <ProgressRow key={r.label} label={r.label} value={r.value} total={data?.events.total ?? 1} color={r.color} />
              )}
            </CardContent>
          </Card>

          {/* Fuel reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <Fuel className="size-4 text-amber-500" />
                {t("Fuel Reports", "تقارير الوقود")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("Total Reports", "إجمالي التقارير"), val: data?.fuelReports.total ?? 0, icon: Activity,     color: "text-amber-600" },
                  { label: t("Last 24h", "آخر 24 ساعة"),          val: data?.fuelReports.today ?? 0, icon: Clock,        color: "text-blue-600"  },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border bg-muted/30 p-3 text-center">
                    <s.icon className={cn("size-4 mx-auto mb-1", s.color)} />
                    {isLoading
                      ? <div className="h-6 w-10 bg-muted animate-pulse rounded mx-auto" />
                      : <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.val}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traffic & Waste */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <Car className="size-4 text-red-500" />
                {t("Traffic & Waste", "المرور والنفايات")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t("Traffic Reports", "تقارير المرور"),        value: data?.traffic.total   ?? 0, color: "bg-red-500"    },
                { label: t("Active Traffic Issues", "مشاكل مرور نشطة"), value: data?.traffic.active  ?? 0, color: "bg-orange-500" },
                { label: t("Waste Reports", "تقارير النفايات"),         value: data?.waste.total     ?? 0, color: "bg-green-600"  },
                { label: t("Pending Cleanup", "تنظيف معلق"),            value: data?.waste.pending   ?? 0, color: "bg-amber-500"  },
              ].map(r => isLoading
                ? <div key={r.label} className="h-6 bg-muted animate-pulse rounded" />
                : <ProgressRow key={r.label} label={r.label} value={r.value}
                    total={Math.max(data?.traffic.total ?? 0, data?.waste.total ?? 0, r.value, 1)} color={r.color} />
              )}
            </CardContent>
          </Card>

        </div>

        {/* Points breakdown footer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
              <Coins className="size-4 text-amber-500" />
              {t("Jawwal Points Overview", "نظرة عامة على نقاط جوال")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t("Total Earned", "إجمالي المكتسبة"),     val: data?.points.totalEarned?.toLocaleString()       ?? "—", color: "text-green-600" },
                { label: t("Total Spent", "إجمالي المنفقة"),       val: data?.points.totalSpent?.toLocaleString()        ?? "—", color: "text-red-500"   },
                { label: t("Net Balance", "الرصيد الصافي"),        val: ((data?.points.totalEarned ?? 0) - (data?.points.totalSpent ?? 0)).toLocaleString(), color: "text-primary" },
              ].map(s => (
                <div key={s.label} className="text-center rounded-xl border bg-muted/30 p-4">
                  {isLoading
                    ? <div className="h-8 w-20 bg-muted animate-pulse rounded mx-auto" />
                    : <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.val}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
