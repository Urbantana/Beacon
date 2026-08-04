import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ToursCreatePage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: "", titleAr: "", description: "", descriptionAr: "",
    category: "cultural", location: "", locationAr: "",
    lat: "31.9038", lng: "35.2034",
    durationMinutes: "120", maxParticipants: "10",
    pricePoints: "0", pointsReward: "50",
    guideName: "", tourDate: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: () => fetch(`${BASE}/api/tours`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: () => {
      toast({ title: lang === "ar" ? "🎉 تم إنشاء الجولة!" : "🎉 Tour Created!" });
      navigate("/tours");
    },
    onError: (e: any) => toast({ title: lang === "ar" ? "خطأ" : "Error", description: e?.error || "Failed", variant: "destructive" }),
  });

  const labelCls = "text-sm font-medium block mb-1";
  const inputCls = "w-full";

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lang === "ar" ? "إنشاء جولة" : "Create a Tour"}</h1>
          <p className="text-muted-foreground mt-1">{lang === "ar" ? "شارك معرفتك بفلسطين واكسب نقاطًا" : "Share your knowledge of Palestine and earn points"}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>{lang === "ar" ? "معلومات الجولة" : "Tour Information"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>{lang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</label><Input className={inputCls} value={form.title} onChange={set("title")} /></div>
              <div><label className={labelCls}>{lang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</label><Input className={inputCls} value={form.titleAr} onChange={set("titleAr")} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>{lang === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</label><textarea className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.description} onChange={set("description")} /></div>
              <div><label className={labelCls}>{lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</label><textarea className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.descriptionAr} onChange={set("descriptionAr")} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{lang === "ar" ? "الفئة" : "Category"}</label>
                <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.category} onChange={set("category")}>
                  {["cultural","historical","food","adventure","nature"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>{lang === "ar" ? "اسم المرشد" : "Guide Name"}</label><Input className={inputCls} value={form.guideName} onChange={set("guideName")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>{lang === "ar" ? "الموقع (إنجليزي)" : "Location (English)"}</label><Input className={inputCls} value={form.location} onChange={set("location")} /></div>
              <div><label className={labelCls}>{lang === "ar" ? "الموقع (عربي)" : "Location (Arabic)"}</label><Input className={inputCls} value={form.locationAr} onChange={set("locationAr")} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>{lang === "ar" ? "خط العرض" : "Latitude"}</label><Input type="number" className={inputCls} value={form.lat} onChange={set("lat")} /></div>
              <div><label className={labelCls}>{lang === "ar" ? "خط الطول" : "Longitude"}</label><Input type="number" className={inputCls} value={form.lng} onChange={set("lng")} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{lang === "ar" ? "التفاصيل والنقاط" : "Details & Points"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>{lang === "ar" ? "المدة (دقائق)" : "Duration (minutes)"}</label><Input type="number" className={inputCls} value={form.durationMinutes} onChange={set("durationMinutes")} /></div>
              <div><label className={labelCls}>{lang === "ar" ? "الحد الأقصى للمشاركين" : "Max Participants"}</label><Input type="number" className={inputCls} value={form.maxParticipants} onChange={set("maxParticipants")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>{lang === "ar" ? "تكلفة النقاط" : "Points Cost"}</label><Input type="number" className={inputCls} value={form.pricePoints} onChange={set("pricePoints")} /></div>
              <div><label className={labelCls}>{lang === "ar" ? "مكافأة النقاط" : "Points Reward"}</label><Input type="number" className={inputCls} value={form.pointsReward} onChange={set("pointsReward")} /></div>
            </div>
            <div><label className={labelCls}>{lang === "ar" ? "تاريخ ووقت الجولة" : "Tour Date & Time"}</label><Input type="datetime-local" className={inputCls} value={form.tourDate} onChange={set("tourDate")} /></div>
          </CardContent>
        </Card>

        <div className={cn("flex gap-3", isRtl ? "flex-row-reverse" : "")}>
          <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title || !form.tourDate}>
            {createMutation.isPending ? (lang === "ar" ? "جارٍ الإنشاء…" : "Creating…") : (lang === "ar" ? "إنشاء الجولة" : "Create Tour")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/tours")}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </div>
    </AppLayout>
  );
}
