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

const CATEGORIES = [
  { value: "pothole",   emoji: "🕳️", en: "Pothole",           ar: "حفرة" },
  { value: "waste",     emoji: "🗑️", en: "Waste / Garbage",   ar: "نفايات" },
  { value: "obstacle",  emoji: "🚧", en: "Road Obstacle",      ar: "عائق على الطريق" },
  { value: "lighting",  emoji: "💡", en: "Broken Lighting",    ar: "إضاءة معطوبة" },
  { value: "vandalism", emoji: "🔨", en: "Vandalism",          ar: "تخريب" },
  { value: "other",     emoji: "📋", en: "Other",              ar: "أخرى" },
];

export default function ComplaintsCreatePage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ title: "", description: "", category: "pothole", location: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: () => fetch(`${BASE}/api/complaints`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: (data) => {
      toast({
        title: lang === "ar" ? "✅ تم تسجيل الشكوى!" : "✅ Complaint Submitted!",
        description: lang === "ar" ? `رقم التتبع: ${data.trackingId}` : `Tracking ID: ${data.trackingId}`,
      });
      navigate("/complaints");
    },
    onError: (e: any) => toast({ title: lang === "ar" ? "خطأ" : "Error", description: e?.error || "Failed", variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lang === "ar" ? "تقديم شكوى" : "Submit a Complaint"}</h1>
          <p className="text-muted-foreground mt-1">{lang === "ar" ? "أبلغ عن مشكلة وتابع حالتها برقم تتبع" : "Report an issue and track it with a tracking number"}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>{lang === "ar" ? "تفاصيل الشكوى" : "Complaint Details"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "ar" ? "العنوان" : "Title"} *</label>
              <Input value={form.title} onChange={set("title")} placeholder={lang === "ar" ? "وصف مختصر للمشكلة" : "Brief description of the issue"} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">{lang === "ar" ? "نوع المشكلة" : "Issue Type"}</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    className={cn("flex items-center gap-2 rounded-xl p-3 border-2 text-sm font-medium transition-all", isRtl && "flex-row-reverse",
                      form.category === c.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50")}>
                    <span className="text-lg">{c.emoji}</span>
                    <span>{lang === "ar" ? c.ar : c.en}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "ar" ? "الموقع" : "Location"}</label>
              <Input value={form.location} onChange={set("location")} placeholder={lang === "ar" ? "الشارع، الحي..." : "Street, neighborhood..."} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "ar" ? "تفاصيل إضافية" : "Additional Details"}</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.description} onChange={set("description")}
                placeholder={lang === "ar" ? "اوصف المشكلة بالتفصيل..." : "Describe the issue in detail..."}
              />
            </div>
          </CardContent>
        </Card>

        <div className={cn("flex gap-3", isRtl ? "flex-row-reverse" : "")}>
          <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title}>
            {createMutation.isPending ? (lang === "ar" ? "جارٍ الإرسال…" : "Submitting…") : (lang === "ar" ? "إرسال الشكوى" : "Submit Complaint")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/complaints")}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </div>
    </AppLayout>
  );
}
