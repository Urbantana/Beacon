import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Fuel, MapPin, Clock, Users, Plus, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface FuelStation {
  id: number; name: string; nameAr: string; location: string; locationAr: string;
  lat: number; lng: number; fuelTypes: string; status: string;
  petrolAvailable: boolean; dieselAvailable: boolean;
  queueLength: number; estimatedWaitMinutes: number; confidenceLevel: number;
  operatingHours: string; lastReportAt: string | null;
}
interface FuelBooking { id: number; stationId: number; bookingCode: string; scheduledAt: string; fuelType: string; status: string; }

const STATUS_CONFIG = {
  available:   { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle,  en: "Available",   ar: "متاح"    },
  unavailable: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",         icon: XCircle,      en: "Unavailable", ar: "غير متاح" },
  unknown:     { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",         icon: AlertCircle,  en: "Unknown",     ar: "غير معروف" },
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}

export default function FuelPage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reportStation, setReportStation] = useState<FuelStation | null>(null);
  const [bookStation, setBookStation] = useState<FuelStation | null>(null);
  const [reportForm, setReportForm] = useState({ fuelType: "both", isAvailable: true, queueLength: "0", notes: "" });
  const [bookForm, setBookForm] = useState({ fuelType: "petrol", scheduledAt: "" });

  const { data: stations = [], isLoading } = useQuery<FuelStation[]>({
    queryKey: ["fuel-stations"],
    queryFn: () => fetch(`${BASE}/api/fuel/stations`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: myBookings = [] } = useQuery<FuelBooking[]>({
    queryKey: ["fuel-bookings"],
    queryFn: () => fetch(`${BASE}/api/fuel/bookings`).then(r => r.json()),
  });

  const reportMutation = useMutation({
    mutationFn: () => fetch(`${BASE}/api/fuel/report`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...reportForm, stationId: reportStation?.id, isAvailable: reportForm.isAvailable }),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["fuel-stations"] });
      setReportStation(null);
      toast({ title: lang === "ar" ? "✅ تم الإبلاغ!" : "✅ Reported!", description: lang === "ar" ? `ربحت ${data.pointsEarned} نقطة 🌟` : `You earned ${data.pointsEarned} points 🌟` });
    },
    onError: () => toast({ title: lang === "ar" ? "خطأ" : "Error", variant: "destructive" }),
  });

  const bookMutation = useMutation({
    mutationFn: () => fetch(`${BASE}/api/fuel/book`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bookForm, stationId: bookStation?.id }),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["fuel-stations"] });
      qc.invalidateQueries({ queryKey: ["fuel-bookings"] });
      setBookStation(null);
      toast({ title: lang === "ar" ? "✅ تم الحجز!" : "✅ Booked!", description: lang === "ar" ? `كود الحجز: ${data.booking.bookingCode}` : `Booking code: ${data.booking.bookingCode}` });
    },
    onError: () => toast({ title: lang === "ar" ? "خطأ" : "Error", variant: "destructive" }),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/fuel/bookings/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fuel-bookings"] });
      qc.invalidateQueries({ queryKey: ["fuel-stations"] });
      toast({ title: lang === "ar" ? "تم إلغاء الحجز" : "Booking Cancelled" });
    },
  });

  const availableCount = stations.filter(s => s.status === "available").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Fuel className="size-8 text-primary" />
            {lang === "ar" ? "مراقبة الوقود" : "Fuel Intelligence"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "تحقق من توفر الوقود، احجز موعدًا، وأبلغ عن الحالة" : "Check fuel availability, book a slot, and report status"}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { val: stations.length, label: lang === "ar" ? "المحطات" : "Stations", color: "text-foreground" },
            { val: availableCount, label: lang === "ar" ? "متاحة الآن" : "Available Now", color: "text-green-600" },
            { val: myBookings.filter(b => b.status === "confirmed").length, label: lang === "ar" ? "حجوزاتي" : "My Bookings", color: "text-primary" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={cn("text-3xl font-bold", s.color)}>{s.val}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Stations list */}
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">{lang === "ar" ? "محطات الوقود" : "Fuel Stations"}</h2>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : stations.map(station => {
              const st = STATUS_CONFIG[station.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.unknown;
              const Icon = st.icon;
              return (
                <Card key={station.id} className={cn("transition-shadow hover:shadow-md", station.status === "available" && "border-green-200 dark:border-green-900")}>
                  <CardContent className="p-4">
                    <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
                      <div className={cn("p-2 rounded-xl mt-0.5", station.status === "available" ? "bg-green-100 dark:bg-green-900/30" : station.status === "unavailable" ? "bg-red-100 dark:bg-red-900/30" : "bg-muted")}>
                        <Icon className={cn("size-5", station.status === "available" ? "text-green-600" : station.status === "unavailable" ? "text-red-600" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                          <div>
                            <h3 className="font-semibold">{lang === "ar" && station.nameAr ? station.nameAr : station.name}</h3>
                            <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
                              <MapPin className="size-3" />
                              {lang === "ar" && station.locationAr ? station.locationAr : station.location}
                            </div>
                          </div>
                          <Badge className={cn("text-xs shrink-0", st.color)}>{lang === "ar" ? st.ar : st.en}</Badge>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">{lang === "ar" ? "الطابور" : "Queue"}</div>
                            <div className={cn("flex items-center gap-1 text-sm font-medium", isRtl && "flex-row-reverse")}>
                              <Users className="size-3.5" />
                              {station.queueLength} {lang === "ar" ? "مركبة" : "vehicles"}
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                (~{station.estimatedWaitMinutes} {lang === "ar" ? "دقيقة" : "min"})
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">{lang === "ar" ? "الثقة" : "Confidence"}</div>
                            <ConfidenceBar value={station.confidenceLevel} />
                          </div>
                        </div>

                        <div className={cn("flex items-center gap-2 mt-2", isRtl && "flex-row-reverse")}>
                          {station.petrolAvailable && <Badge variant="outline" className="text-xs">⛽ {lang === "ar" ? "بنزين" : "Petrol"}</Badge>}
                          {station.dieselAvailable && <Badge variant="outline" className="text-xs">🛢️ {lang === "ar" ? "ديزل" : "Diesel"}</Badge>}
                          <Badge variant="outline" className="text-xs">
                            <Clock className="size-2.5 mr-1" />{station.operatingHours}
                          </Badge>
                        </div>

                        <div className={cn("flex gap-2 mt-3", isRtl && "flex-row-reverse")}>
                          <Button size="sm" variant="outline" onClick={() => setReportStation(station)} className="gap-1 text-xs">
                            <AlertCircle className="size-3" />{lang === "ar" ? "أبلغ عن الحالة" : "Report Status"}
                          </Button>
                          {station.status === "available" && (
                            <Button size="sm" onClick={() => setBookStation(station)} className="gap-1 text-xs">
                              <Calendar className="size-3" />{lang === "ar" ? "احجز موعدًا" : "Book Slot"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* My bookings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{lang === "ar" ? "حجوزاتي" : "My Bookings"}</h2>
            {myBookings.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد حجوزات" : "No bookings yet"}</CardContent></Card>
            ) : myBookings.map(b => (
              <Card key={b.id} className={cn(b.status === "confirmed" && "border-primary/30")}>
                <CardContent className="p-4">
                  <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                    <div>
                      <code className="text-xs font-mono font-bold text-primary">{b.bookingCode}</code>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(b.scheduledAt), "MMM d · h:mm a")}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{b.fuelType}</Badge>
                        <Badge className={cn("text-xs",
                          b.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-900/30" :
                          b.status === "cancelled" ? "bg-red-100 text-red-800 dark:bg-red-900/30" : "bg-muted text-muted-foreground"
                        )}>
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                    {b.status === "confirmed" && (
                      <Button size="sm" variant="ghost" className="text-red-500 text-xs px-2"
                        onClick={() => cancelBookingMutation.mutate(b.id)}>
                        {lang === "ar" ? "إلغاء" : "Cancel"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Tips */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">💡 {lang === "ar" ? "نصائح" : "Tips"}</p>
                {[
                  lang === "ar" ? "🕐 احجز قبل ساعة على الأقل" : "🕐 Book at least 1 hour ahead",
                  lang === "ar" ? "📊 تحقق من مستوى الثقة قبل التوجه" : "📊 Check confidence before going",
                  lang === "ar" ? "🌟 أبلغ عن الحالة واكسب 20 نقطة" : "🌟 Report status & earn 20 pts",
                ].map((tip, i) => <p key={i} className="text-xs text-muted-foreground">{tip}</p>)}
              </CardContent>
            </Card>

            {/* External sources */}
            <Card className="border-blue-200 dark:border-blue-900/50">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">
                  🔗 {lang === "ar" ? "مصادر خارجية" : "External Sources"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar"
                    ? "تحقق من هذه المواقع للحصول على معلومات وقود محدّثة من المجتمع."
                    : "Check these community-powered sites for additional live fuel updates."}
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://www.kaziyat.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted group"
                  >
                    <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      <span className="text-base">⛽</span>
                      <span>Kaziyat.com</span>
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {lang === "ar" ? "فتح ←" : "Open ↗"}
                    </span>
                  </a>
                  <a
                    href="https://www.palhub.ps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted group"
                  >
                    <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      <span className="text-base">🌐</span>
                      <span>PalHub</span>
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {lang === "ar" ? "فتح ←" : "Open ↗"}
                    </span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Report dialog */}
      <Dialog open={!!reportStation} onOpenChange={() => setReportStation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "الإبلاغ عن حالة الوقود" : "Report Fuel Status"}</DialogTitle>
          </DialogHeader>
          {reportStation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{lang === "ar" && reportStation.nameAr ? reportStation.nameAr : reportStation.name}</p>
              <div>
                <label className="text-sm font-medium block mb-2">{lang === "ar" ? "الوقود متاح؟" : "Is fuel available?"}</label>
                <div className="flex gap-3">
                  <Button variant={reportForm.isAvailable ? "default" : "outline"} size="sm" onClick={() => setReportForm(f => ({ ...f, isAvailable: true }))}>
                    ✅ {lang === "ar" ? "نعم" : "Yes"}
                  </Button>
                  <Button variant={!reportForm.isAvailable ? "destructive" : "outline"} size="sm" onClick={() => setReportForm(f => ({ ...f, isAvailable: false }))}>
                    ❌ {lang === "ar" ? "لا" : "No"}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "عدد المركبات في الطابور" : "Vehicles in queue"}</label>
                <Input type="number" value={reportForm.queueLength} onChange={e => setReportForm(f => ({ ...f, queueLength: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "ملاحظات" : "Notes (optional)"}</label>
                <Input value={reportForm.notes} onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <p className="text-xs text-green-600">🌟 {lang === "ar" ? "ستكسب 20 نقطة جوال لمساعدتك!" : "You'll earn 20 Jawwal Points for reporting!"}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportStation(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? (lang === "ar" ? "جارٍ…" : "Submitting…") : (lang === "ar" ? "إرسال التقرير" : "Submit Report")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book dialog */}
      <Dialog open={!!bookStation} onOpenChange={() => setBookStation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "حجز موعد" : "Book a Time Slot"}</DialogTitle>
          </DialogHeader>
          {bookStation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{lang === "ar" && bookStation.nameAr ? bookStation.nameAr : bookStation.name}</p>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "وقت الموعد" : "Appointment Time"}</label>
                <Input type="datetime-local" value={bookForm.scheduledAt} onChange={e => setBookForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "ar" ? "نوع الوقود" : "Fuel Type"}</label>
                <div className="flex gap-3">
                  {["petrol", "diesel"].map(ft => (
                    <Button key={ft} variant={bookForm.fuelType === ft ? "default" : "outline"} size="sm"
                      onClick={() => setBookForm(f => ({ ...f, fuelType: ft }))}>
                      {ft === "petrol" ? "⛽" : "🛢️"} {lang === "ar" ? (ft === "petrol" ? "بنزين" : "ديزل") : (ft === "petrol" ? "Petrol" : "Diesel")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookStation(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending || !bookForm.scheduledAt}>
              {bookMutation.isPending ? (lang === "ar" ? "جارٍ…" : "Booking…") : (lang === "ar" ? "تأكيد الحجز" : "Confirm Booking")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
