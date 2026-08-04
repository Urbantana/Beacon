import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CAT_OPTIONS = [
  { value: "infrastructure",  en: "Infrastructure",  ar: "البنية التحتية" },
  { value: "environment",     en: "Environment",     ar: "البيئة"          },
  { value: "transport",       en: "Transport",       ar: "النقل"           },
  { value: "tourism",         en: "Tourism",         ar: "السياحة"         },
  { value: "public_services", en: "Public Services", ar: "الخدمات العامة"  },
  { value: "other",           en: "Other",           ar: "أخرى"           },
];

export default function SuggestionsCreatePage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: "", titleAr: "", description: "", descriptionAr: "",
    category: "infrastructure", location: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: () => fetch(`${BASE}/api/suggestions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: () => {
      toast({ title: lang === "ar" ? "✅ تم إرسال المقترح!" : "✅ Suggestion Submitted!", description: lang === "ar" ? "شكرًا على مساهمتك في تطوير المدينة" : "Thank you for helping improve the city" });
      navigate("/suggestions");
    },
    onError: (e: any) => toast({ title: lang === "ar" ? "خطأ" : "Error", description: e?.error || "Failed", variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lang === "ar" ? "مقترح جديد" : "New Suggestion"}</h1>
          <p className="text-muted-foreground mt-1">{lang === "ar" ? "اقترح فكرة لتحسين المدينة وصوّت المواطنون عليها" : "Suggest an idea to improve the city and let citizens vote"}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>{lang === "ar" ? "تفاصيل المقترح" : "Suggestion Details"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *</label>
                <Input value={form.title} onChange={set("title")} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</label>
                <Input value={form.titleAr} onChange={set("titleAr")} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</label>
                <textarea className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={form.description} onChange={set("description")} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</label>
                <textarea className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={form.descriptionAr} onChange={set("descriptionAr")} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "الفئة" : "Category"}</label>
                <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.category} onChange={set("category")}>
                  {CAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{lang === "ar" ? o.ar : o.en}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "الموقع (اختياري)" : "Location (optional)"}</label>
                <Input value={form.location} onChange={set("location")} placeholder={lang === "ar" ? "شارع، حي…" : "Street, neighborhood…"} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={cn("flex gap-3", isRtl ? "flex-row-reverse" : "")}>
          <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title}>
            {createMutation.isPending ? (lang === "ar" ? "جارٍ الإرسال…" : "Submitting…") : (lang === "ar" ? "إرسال المقترح" : "Submit Suggestion")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/suggestions")}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </div>
    </AppLayout>
  );
}
