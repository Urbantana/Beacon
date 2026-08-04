import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Building2, Plus, CheckCircle2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function EventsCreatePage() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    category: "cultural",
    location: "",
    locationAr: "",
    lat: "31.9035",
    lng: "35.2063",
    startDate: "",
    endDate: "",
    price: "0",
    pointsRequired: "0",
    pointsReward: "100",
    capacity: "100",
    status: "upcoming",
    createdBy: "Ramallah Municipality",
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const r = await fetch(`${BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          price: parseFloat(body.price) || 0,
          pointsRequired: parseInt(body.pointsRequired) || 0,
          pointsReward: parseInt(body.pointsReward) || 50,
          capacity: parseInt(body.capacity) || 0,
          lat: parseFloat(body.lat),
          lng: parseFloat(body.lng),
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? "Failed to create"); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: t("eventCreated"),
        description: t("eventCreatedDesc"),
        className: "bg-foreground text-background",
      });
      navigate("/events");
    },
    onError: (e: Error) => {
      toast({ title: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title || !form.category || !form.startDate || !form.endDate) {
      toast({ title: t("fillRequired"), variant: "destructive" });
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast({ title: t("endAfterStart"), variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const field = (
    label: string,
    key: keyof typeof form,
    opts?: { type?: string; placeholder?: string; textarea?: boolean; required?: boolean }
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key} className={cn("font-semibold text-sm", isRtl && "block text-right")}>
        {label}{opts?.required && <span className="text-destructive ms-1">*</span>}
      </Label>
      {opts?.textarea ? (
        <Textarea
          id={key}
          value={form[key]}
          onChange={set(key)}
          placeholder={opts?.placeholder}
          dir={isRtl ? "rtl" : "ltr"}
          rows={3}
          className="resize-none"
          aria-label={label}
          aria-required={opts?.required}
        />
      ) : (
        <Input
          id={key}
          type={opts?.type ?? "text"}
          value={form[key]}
          onChange={set(key)}
          placeholder={opts?.placeholder}
          dir={isRtl ? "rtl" : "ltr"}
          aria-label={label}
          aria-required={opts?.required}
        />
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
        {/* Header */}
        <div className={cn("flex items-center justify-between gap-3 flex-wrap", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
            <Link href="/events">
              <Button variant="ghost" size="icon" aria-label="Back to events">
                <ChevronLeft className={cn("size-5", isRtl && "rotate-180")} />
              </Button>
            </Link>
            <div className="p-2.5 bg-muted rounded-xl shrink-0">
              <Plus className="size-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("createEvent")}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{t("createEventSub")}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("gap-1.5", isRtl && "flex-row-reverse")}>
            <Building2 className="size-3.5" />
            {t("municipalityRole")}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("eventBasicInfo")}</CardTitle>
                <CardDescription>{t("eventBasicInfoSub")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field(t("eventTitleEn"), "title", { required: true, placeholder: "e.g. Ramallah Cultural Festival" })}
                  {field(t("eventTitleAr"), "titleAr", { placeholder: "مثال: مهرجان رام الله الثقافي" })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field(t("eventDescEn"), "description", { textarea: true, placeholder: "Event description in English…" })}
                  {field(t("eventDescAr"), "descriptionAr", { textarea: true, placeholder: "وصف الفعالية بالعربية…" })}
                </div>
                <div className="space-y-1.5">
                  <Label className={cn("font-semibold text-sm", isRtl && "block text-right")}>
                    {t("eventCategory")}<span className="text-destructive ms-1">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger aria-label="Event category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultural">🎭 {t("cultural")}</SelectItem>
                      <SelectItem value="entertainment">🎪 {t("entertainment")}</SelectItem>
                      <SelectItem value="educational">🎓 {t("educational")}</SelectItem>
                      <SelectItem value="sports">⚽ {t("sportsCategory")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={cn("font-semibold text-sm", isRtl && "block text-right")}>
                    {t("eventStatus")}
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger aria-label="Event status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">{t("eventUpcoming")}</SelectItem>
                      <SelectItem value="ongoing">{t("eventOngoing")}</SelectItem>
                      <SelectItem value="completed">{t("eventCompleted")}</SelectItem>
                      <SelectItem value="cancelled">{t("eventCancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Location & Time */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-base flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <MapPin className="size-4" /> {t("eventLocationTime")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field(t("eventLocationEn"), "location", { required: true, placeholder: "e.g. Al-Manara Square, Ramallah" })}
                  {field(t("eventLocationAr"), "locationAr", { placeholder: "مثال: دوار المنارة، رام الله" })}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {field("Latitude", "lat", { type: "number", placeholder: "31.9035" })}
                  {field("Longitude", "lng", { type: "number", placeholder: "35.2063" })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className={cn("font-semibold text-sm", isRtl && "block text-right")}>
                      {t("eventStartDate")}<span className="text-destructive ms-1">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={form.startDate}
                      onChange={set("startDate")}
                      aria-label="Event start date and time"
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className={cn("font-semibold text-sm", isRtl && "block text-right")}>
                      {t("eventEndDate")}<span className="text-destructive ms-1">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={form.endDate}
                      onChange={set("endDate")}
                      aria-label="Event end date and time"
                      aria-required="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Points */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("eventCapacityPoints")}</CardTitle>
                <CardDescription>{t("eventCapacityPointsSub")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {field(t("eventCapacity"), "capacity", { type: "number", placeholder: "100" })}
                  {field(t("eventPrice"), "price", { type: "number", placeholder: "0" })}
                  {field(t("eventPointsReward"), "pointsReward", { type: "number", placeholder: "100" })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field(t("eventPointsRequired"), "pointsRequired", { type: "number", placeholder: "0" })}
                  {field(t("eventCreatedBy"), "createdBy", { placeholder: "Ramallah Municipality" })}
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  💡 {t("pointsHint")}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className={cn("flex items-center gap-3 justify-end", isRtl && "flex-row-reverse justify-start")}>
              <Link href="/events">
                <Button type="button" variant="outline" aria-label="Cancel">
                  {t("cancelBtn")}
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2 font-bold"
                aria-label="Create event"
              >
                {createMutation.isPending ? (
                  "Creating…"
                ) : createMutation.isSuccess ? (
                  <><CheckCircle2 className="size-4" /> {t("eventCreated")}</>
                ) : (
                  <><Plus className="size-4" /> {t("createEvent")}</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
