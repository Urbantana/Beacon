import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Plus, Filter, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Suggestion {
  id: number; title: string; titleAr: string; description: string; descriptionAr: string;
  category: string; location: string; username: string;
  upvotes: number; downvotes: number; status: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  approved:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected:     "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  implemented:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending:      { en: "Pending",      ar: "معلق" },
  under_review: { en: "Under Review", ar: "قيد المراجعة" },
  approved:     { en: "Approved",     ar: "موافق عليه" },
  rejected:     { en: "Rejected",     ar: "مرفوض" },
  implemented:  { en: "Implemented",  ar: "مُنفَّذ" },
};

const CAT_LABELS: Record<string, { en: string; ar: string }> = {
  infrastructure:   { en: "Infrastructure",   ar: "البنية التحتية" },
  environment:      { en: "Environment",      ar: "البيئة" },
  transport:        { en: "Transport",        ar: "النقل" },
  tourism:          { en: "Tourism",          ar: "السياحة" },
  public_services:  { en: "Public Services",  ar: "الخدمات العامة" },
  other:            { en: "Other",            ar: "أخرى" },
};

export default function SuggestionsPage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState("all");

  const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ["suggestions", catFilter],
    queryFn: () => fetch(`${BASE}/api/suggestions?category=${catFilter}`).then(r => r.json()),
  });

  const { data: myVotes = [] } = useQuery<{ suggestionId: number; vote: string }[]>({
    queryKey: ["my-votes"],
    queryFn: () => fetch(`${BASE}/api/suggestions/my-votes`).then(r => r.json()),
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, vote }: { id: number; vote: string }) =>
      fetch(`${BASE}/api/suggestions/${id}/vote`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggestions"] });
      qc.invalidateQueries({ queryKey: ["my-votes"] });
    },
    onError: () => toast({ title: lang === "ar" ? "خطأ في التصويت" : "Vote error", variant: "destructive" }),
  });

  const voteMap = new Map(myVotes.map(v => [v.suggestionId, v.vote]));

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4 flex-wrap", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="size-8 text-primary" />
              {lang === "ar" ? "مقترحات المواطنين" : "Citizen Suggestions"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "اقترح تحسينات وصوّت على أفضل الأفكار" : "Suggest improvements and vote on the best ideas"}
            </p>
          </div>
          <Link href="/suggestions/create">
            <Button className="gap-2"><Plus className="size-4" />{lang === "ar" ? "اقتراح جديد" : "New Suggestion"}</Button>
          </Link>
        </div>

        {/* Category filter */}
        <div className={cn("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
          {["all", ...Object.keys(CAT_LABELS)].map(c => (
            <Button key={c} variant={catFilter === c ? "default" : "outline"} size="sm"
              onClick={() => setCatFilter(c)}>
              {c === "all" ? (lang === "ar" ? "الكل" : "All") : CAT_LABELS[c]?.[lang] || c}
            </Button>
          ))}
        </div>

        {/* Suggestions list */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {lang === "ar" ? "لا توجد مقترحات بعد" : "No suggestions yet"}
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map(s => {
              const myVote = voteMap.get(s.id);
              return (
                <Card key={s.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className={cn("flex gap-4", isRtl && "flex-row-reverse")}>
                      {/* Vote buttons */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          onClick={() => voteMutation.mutate({ id: s.id, vote: "up" })}
                          className={cn("p-2 rounded-lg transition-colors", myVote === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "hover:bg-muted text-muted-foreground")}>
                          <ThumbsUp className="size-4" />
                        </button>
                        <span className="text-sm font-bold">{s.upvotes - s.downvotes}</span>
                        <button
                          onClick={() => voteMutation.mutate({ id: s.id, vote: "down" })}
                          className={cn("p-2 rounded-lg transition-colors", myVote === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/30" : "hover:bg-muted text-muted-foreground")}>
                          <ThumbsDown className="size-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className={cn("flex items-start gap-2 flex-wrap", isRtl && "flex-row-reverse")}>
                          <h3 className="font-semibold flex-1 min-w-0">
                            {lang === "ar" && s.titleAr ? s.titleAr : s.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={cn("text-xs", STATUS_COLORS[s.status])}>
                              {STATUS_LABELS[s.status]?.[lang] || s.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {CAT_LABELS[s.category]?.[lang] || s.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {lang === "ar" && s.descriptionAr ? s.descriptionAr : s.description}
                        </p>
                        <div className={cn("flex items-center gap-3 mt-2 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
                          <span>👤 {s.username}</span>
                          {s.location && <span>📍 {s.location}</span>}
                          <span>{format(new Date(s.createdAt), "MMM d, yyyy")}</span>
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
