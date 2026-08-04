import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle, Clock, CheckCircle, Loader } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Complaint {
  id: number; trackingId: string; title: string; description: string;
  category: string; location: string; status: string; notes: string;
  createdAt: string; updatedAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; en: string; ar: string }> = {
  pending:      { color: "bg-gray-100 text-gray-700 dark:bg-gray-800",     icon: Clock,        en: "Pending",      ar: "معلق"           },
  under_review: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30",  icon: AlertCircle,  en: "Under Review", ar: "قيد المراجعة"   },
  in_progress:  { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30", icon: Loader,     en: "In Progress",  ar: "جارٍ التنفيذ"   },
  resolved:     { color: "bg-green-100 text-green-800 dark:bg-green-900/30", icon: CheckCircle, en: "Resolved",    ar: "تم الحل"        },
};

const CAT_EMOJIS: Record<string, string> = {
  pothole: "🕳️", waste: "🗑️", obstacle: "🚧", lighting: "💡", vandalism: "🔨", other: "📋",
};

export default function ComplaintsPage() {
  const { isRtl, lang } = useI18n();

  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: () => fetch(`${BASE}/api/complaints`).then(r => r.json()),
  });

  const summary = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    inProgress: complaints.filter(c => c.status === "in_progress").length,
    pending: complaints.filter(c => c.status === "pending" || c.status === "under_review").length,
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4 flex-wrap", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertCircle className="size-8 text-primary" />
              {lang === "ar" ? "الشكاوى والبلاغات" : "Complaints & Reports"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "تتبع شكاواك ومتابعة حالتها" : "Track your complaints and follow their progress"}
            </p>
          </div>
          <Link href="/complaints/create">
            <Button className="gap-2"><Plus className="size-4" />{lang === "ar" ? "شكوى جديدة" : "New Complaint"}</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { val: summary.total,      label: lang === "ar" ? "إجمالي" : "Total",       color: "text-foreground" },
            { val: summary.pending,    label: lang === "ar" ? "معلق" : "Pending",        color: "text-blue-600" },
            { val: summary.inProgress, label: lang === "ar" ? "جارٍ" : "In Progress",   color: "text-amber-600" },
            { val: summary.resolved,   label: lang === "ar" ? "تم الحل" : "Resolved",   color: "text-green-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={cn("text-2xl font-bold", s.color)}>{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Complaints list */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{lang === "ar" ? "لا توجد شكاوى مسجلة" : "No complaints yet"}</p>
              <Link href="/complaints/create">
                <Button className="mt-4 gap-2"><Plus className="size-4" />{lang === "ar" ? "أضف أول شكوى" : "Add First Complaint"}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => {
              const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const Icon = st.icon;
              return (
                <Card key={c.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse")}>
                      <div className="text-2xl shrink-0">{CAT_EMOJIS[c.category] || "📋"}</div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("flex items-start gap-2 justify-between", isRtl && "flex-row-reverse")}>
                          <div>
                            <h3 className="font-semibold">{c.title}</h3>
                            <code className="text-xs text-muted-foreground font-mono">{c.trackingId}</code>
                          </div>
                          <Badge className={cn("text-xs shrink-0 flex items-center gap-1", st.color)}>
                            <Icon className="size-3" />
                            {lang === "ar" ? st.ar : st.en}
                          </Badge>
                        </div>
                        {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>}
                        {c.notes && (
                          <div className="mt-2 text-xs bg-muted rounded-lg p-2">
                            <span className="font-medium">{lang === "ar" ? "ملاحظة: " : "Note: "}</span>{c.notes}
                          </div>
                        )}
                        <div className={cn("flex items-center gap-3 mt-2 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
                          {c.location && <span>📍 {c.location}</span>}
                          <span>{format(new Date(c.createdAt), "MMM d, yyyy")}</span>
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
    </AppLayout>
  );
}
