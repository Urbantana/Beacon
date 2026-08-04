import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Clock, Users, Coins, Search, Plus, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Tour {
  id: number; title: string; titleAr: string; description: string; descriptionAr: string;
  category: string; location: string; locationAr: string; lat: number; lng: number;
  durationMinutes: number; maxParticipants: number; currentParticipants: number;
  pricePoints: number; pointsReward: number; guideName: string;
  tourDate: string; status: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  cultural:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  historical: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  food:       "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  adventure:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  nature:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};
const CAT_EMOJIS: Record<string, string> = {
  cultural: "🎭", historical: "🏛️", food: "🍽️", adventure: "🏕️", nature: "🌿",
};
const CAT_LABELS: Record<string, { en: string; ar: string }> = {
  cultural:   { en: "Cultural",   ar: "ثقافي"   },
  historical: { en: "Historical", ar: "تاريخي"  },
  food:       { en: "Food",       ar: "طعام"    },
  adventure:  { en: "Adventure",  ar: "مغامرة"  },
  nature:     { en: "Nature",     ar: "طبيعة"   },
};

export default function ToursPage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);

  const { data: tours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ["tours", catFilter],
    queryFn: () => fetch(`${BASE}/api/tours?category=${catFilter}`).then(r => r.json()),
  });

  const { data: myBookings = [] } = useQuery<{ tourId: number }[]>({
    queryKey: ["tour-bookings"],
    queryFn: () => fetch(`${BASE}/api/tours/my-bookings`).then(r => r.json()),
  });

  const bookMutation = useMutation({
    mutationFn: (tourId: number) => fetch(`${BASE}/api/tours/${tourId}/book`, { method: "POST" }).then(r => {
      if (!r.ok) return r.json().then(e => Promise.reject(e));
      return r.json();
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      qc.invalidateQueries({ queryKey: ["tour-bookings"] });
      setBookingTour(null);
      toast({ title: lang === "ar" ? "🎉 تم الحجز!" : "🎉 Booked!", description: lang === "ar" ? "تم تأكيد حجزك في الجولة." : "Your tour booking is confirmed." });
    },
    onError: (e: any) => toast({ title: lang === "ar" ? "خطأ" : "Error", description: e?.error || "Booking failed", variant: "destructive" }),
  });

  const bookedIds = new Set(myBookings.map(b => b.tourId));
  const filtered = tours.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.titleAr.includes(search) ||
    t.location.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d: string) => {
    try { return format(new Date(d), "MMM d, yyyy · h:mm a"); } catch { return d; }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4 flex-wrap", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {lang === "ar" ? "🗺️ الجولات المجتمعية" : "🗺️ Community Tours"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "استكشف فلسطين مع مرشدين محليين متمرسين" : "Explore Palestine with experienced local guides"}
            </p>
          </div>
          <Link href="/tours/create">
            <Button className="gap-2">
              <Plus className="size-4" />
              {lang === "ar" ? "إنشاء جولة" : "Create Tour"}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className={cn("flex flex-wrap gap-3 items-center", isRtl && "flex-row-reverse")}>
          <div className="relative flex-1 min-w-[200px]">
            <Search className={cn("absolute top-2.5 size-4 text-muted-foreground", isRtl ? "right-2.5" : "left-2.5")} />
            <Input placeholder={lang === "ar" ? "ابحث عن جولات…" : "Search tours…"}
              className={isRtl ? "pr-9" : "pl-9"} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...Object.keys(CAT_LABELS)].map(c => (
              <Button key={c} variant={catFilter === c ? "default" : "outline"} size="sm"
                onClick={() => setCatFilter(c)}>
                {c === "all" ? (lang === "ar" ? "الكل" : "All") : `${CAT_EMOJIS[c] || ""} ${CAT_LABELS[c]?.[lang] || c}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Tour grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {lang === "ar" ? "لم يتم العثور على جولات" : "No tours found"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(tour => {
              const spotsLeft = tour.maxParticipants - tour.currentParticipants;
              const isBooked = bookedIds.has(tour.id);
              const full = spotsLeft <= 0;
              return (
                <Card key={tour.id} className={cn("overflow-hidden transition-shadow hover:shadow-md", isBooked && "ring-2 ring-primary")}>
                  <div className={cn("h-2", CATEGORY_COLORS[tour.category]?.split(" ")[0] || "bg-primary")} />
                  <CardContent className="p-4 space-y-3">
                    <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                      <div>
                        <Badge className={cn("text-xs mb-1", CATEGORY_COLORS[tour.category])}>
                          {CAT_EMOJIS[tour.category]} {CAT_LABELS[tour.category]?.[lang] || tour.category}
                        </Badge>
                        <h3 className="font-semibold leading-tight">
                          {lang === "ar" && tour.titleAr ? tour.titleAr : tour.title}
                        </h3>
                      </div>
                      {isBooked && <Badge className="text-xs bg-primary text-primary-foreground shrink-0">{lang === "ar" ? "محجوز" : "Booked"}</Badge>}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {lang === "ar" && tour.descriptionAr ? tour.descriptionAr : tour.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{lang === "ar" && tour.locationAr ? tour.locationAr : tour.location}</span>
                      </div>
                      <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                        <Clock className="size-3 shrink-0" />
                        <span>{Math.floor(tour.durationMinutes / 60)}h {tour.durationMinutes % 60}m</span>
                      </div>
                      <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                        <Users className="size-3 shrink-0" />
                        <span>{lang === "ar" ? `${spotsLeft} مقعد متاح` : `${spotsLeft} spots left`}</span>
                      </div>
                      <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                        <Star className="size-3 shrink-0 text-amber-500" />
                        <span>{tour.guideName}</span>
                      </div>
                    </div>

                    <div className={cn("flex items-center justify-between pt-1", isRtl && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-1 text-primary font-medium text-sm", isRtl && "flex-row-reverse")}>
                        <Coins className="size-3.5" />
                        <span>{tour.pricePoints > 0 ? `${tour.pricePoints} pts` : lang === "ar" ? "مجاني" : "Free"}</span>
                        {tour.pointsReward > 0 && <span className="text-xs text-green-600 ml-1">+{tour.pointsReward}</span>}
                      </div>
                      <Button size="sm" disabled={full || isBooked} onClick={() => setBookingTour(tour)}>
                        {isBooked ? (lang === "ar" ? "محجوز ✓" : "Booked ✓") : full ? (lang === "ar" ? "مكتمل" : "Full") : (lang === "ar" ? "احجز" : "Book")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking dialog */}
      <Dialog open={!!bookingTour} onOpenChange={() => setBookingTour(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تأكيد الحجز" : "Confirm Booking"}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? (bookingTour?.titleAr || bookingTour?.title) : bookingTour?.title}
            </DialogDescription>
          </DialogHeader>
          {bookingTour && (
            <div className="space-y-3 py-2">
              <div className={cn("flex justify-between text-sm", isRtl && "flex-row-reverse")}>
                <span className="text-muted-foreground">{lang === "ar" ? "التاريخ" : "Date"}</span>
                <span>{fmt(bookingTour.tourDate)}</span>
              </div>
              <div className={cn("flex justify-between text-sm", isRtl && "flex-row-reverse")}>
                <span className="text-muted-foreground">{lang === "ar" ? "المرشد" : "Guide"}</span>
                <span>{bookingTour.guideName}</span>
              </div>
              <div className={cn("flex justify-between text-sm font-medium", isRtl && "flex-row-reverse")}>
                <span>{lang === "ar" ? "التكلفة" : "Cost"}</span>
                <span className="text-primary">{bookingTour.pricePoints} pts</span>
              </div>
              {bookingTour.pointsReward > 0 && (
                <div className={cn("flex justify-between text-sm", isRtl && "flex-row-reverse")}>
                  <span className="text-muted-foreground">{lang === "ar" ? "ستكسب" : "You'll earn"}</span>
                  <span className="text-green-600">+{bookingTour.pointsReward} pts</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className={isRtl ? "flex-row-reverse" : ""}>
            <Button variant="outline" onClick={() => setBookingTour(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => bookingTour && bookMutation.mutate(bookingTour.id)} disabled={bookMutation.isPending}>
              {bookMutation.isPending ? (lang === "ar" ? "جارٍ…" : "Booking…") : (lang === "ar" ? "تأكيد الحجز" : "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
