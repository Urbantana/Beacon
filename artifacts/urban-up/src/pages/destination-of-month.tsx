import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Gift, Percent, CalendarDays, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Destination {
  id: number; name: string; nameAr: string; description: string; descriptionAr: string;
  imageUrl: string; location: string; locationAr: string; lat: number; lng: number;
  discountPercent: number; bonusPoints: number; monthLabel: string; monthLabelAr: string; isActive: boolean;
}

export default function DestinationOfMonthPage() {
  const { isRtl, lang } = useI18n();

  const { data: dest, isLoading } = useQuery<Destination | null>({
    queryKey: ["destination"],
    queryFn: () => fetch(`${BASE}/api/destination`).then(r => r.json()),
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["events-dotm"],
    queryFn: () => fetch(`${BASE}/api/tourist/events`).then(r => r.json()),
  });

  const { data: tours = [] } = useQuery<any[]>({
    queryKey: ["tours-dotm"],
    queryFn: () => fetch(`${BASE}/api/tours`).then(r => r.json()),
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {isLoading ? (
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        ) : !dest ? (
          <div className="text-center py-16 text-muted-foreground">
            {lang === "ar" ? "لم يتم تحديد وجهة الشهر بعد" : "No destination of the month set yet"}
          </div>
        ) : (
          <>
            {/* Hero banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/90 to-primary/60 text-white min-h-[280px] flex flex-col justify-end p-8">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div className={cn("relative flex items-start justify-between gap-4", isRtl && "flex-row-reverse")}>
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 mb-3 text-xs">
                    <CalendarDays className="size-3 mr-1" />
                    {lang === "ar" ? dest.monthLabelAr || dest.monthLabel : dest.monthLabel} · {lang === "ar" ? "وجهة الشهر" : "Destination of the Month"}
                  </Badge>
                  <h1 className="text-4xl font-bold">{lang === "ar" && dest.nameAr ? dest.nameAr : dest.name}</h1>
                  <div className={cn("flex items-center gap-2 mt-2 text-white/80", isRtl && "flex-row-reverse")}>
                    <MapPin className="size-4" />
                    <span>{lang === "ar" && dest.locationAr ? dest.locationAr : dest.location}</span>
                  </div>
                  <p className="mt-3 text-white/90 max-w-xl text-sm leading-relaxed">
                    {lang === "ar" && dest.descriptionAr ? dest.descriptionAr : dest.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  {[
                    { icon: Percent, label: lang === "ar" ? "خصم" : "Discount", val: `${dest.discountPercent}%` },
                    { icon: Gift, label: lang === "ar" ? "نقاط إضافية" : "Bonus Points", val: `+${dest.bonusPoints}` },
                  ].map(s => (
                    <div key={s.label} className="text-center bg-white/15 backdrop-blur-sm rounded-xl p-4">
                      <s.icon className="size-6 mx-auto mb-1 text-white/80" />
                      <div className="text-2xl font-bold">{s.val}</div>
                      <div className="text-xs text-white/70">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related events */}
            <div>
              <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                <h2 className="text-xl font-bold">{lang === "ar" ? "الفعاليات القريبة" : "Nearby Events"}</h2>
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="gap-1">
                    {lang === "ar" ? "عرض الكل" : "View All"} <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {events.slice(0, 3).map((ev: any) => (
                  <Link key={ev.id} href={`/events/${ev.id}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">🎭</div>
                          <div>
                            <h3 className="font-medium text-sm line-clamp-2">{lang === "ar" && ev.titleAr ? ev.titleAr : ev.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{lang === "ar" && ev.locationAr ? ev.locationAr : ev.location}</p>
                          </div>
                        </div>
                        {dest.discountPercent > 0 && (
                          <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                            {dest.discountPercent}% {lang === "ar" ? "خصم" : "off"}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Related tours */}
            <div>
              <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                <h2 className="text-xl font-bold">{lang === "ar" ? "الجولات المتاحة" : "Available Tours"}</h2>
                <Link href="/tours">
                  <Button variant="ghost" size="sm" className="gap-1">
                    {lang === "ar" ? "عرض الكل" : "View All"} <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tours.slice(0, 3).map((tour: any) => (
                  <Card key={tour.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm">{lang === "ar" && tour.titleAr ? tour.titleAr : tour.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{tour.guideName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30">{tour.category}</Badge>
                        {dest.bonusPoints > 0 && (
                          <span className="text-xs text-green-600 font-medium">+{dest.bonusPoints} bonus pts</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
