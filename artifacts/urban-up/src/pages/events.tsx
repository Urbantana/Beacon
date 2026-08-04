import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, MapPin, Users, Coins, Search, Star, Filter,
  Plus, Clock, Tag, ChevronRight, Ticket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PalEvent {
  id: number;
  title: string; titleAr: string;
  description: string; descriptionAr: string;
  category: string;
  location: string; locationAr: string;
  lat: number; lng: number;
  startDate: string; endDate: string;
  price: number;
  pointsRequired: number;
  pointsReward: number;
  capacity: number;
  booked: number;
  spotsLeft: number | null;
  status: string;
  createdBy: string;
}

interface BookingsData { bookedEventIds: number[] }

const CATEGORY_COLORS: Record<string, string> = {
  cultural:      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  educational:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sports:        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  cultural: "🎭", entertainment: "🎪", educational: "🎓", sports: "⚽",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ongoing:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function EventCard({
  event, isBooked, userPoints, onBook, isRtl, lang,
}: {
  event: PalEvent; isBooked: boolean; userPoints: number;
  onBook: (e: PalEvent) => void; isRtl: boolean; lang: "en" | "ar";
}) {
  const title = lang === "ar" && event.titleAr ? event.titleAr : event.title;
  const loc   = lang === "ar" && event.locationAr ? event.locationAr : event.location;
  const start = new Date(event.startDate);
  const full  = event.capacity > 0 && event.booked >= event.capacity;
  const canAffordPoints = event.pointsRequired === 0 || userPoints >= event.pointsRequired;

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden transition-all duration-200 border-2 hover:shadow-lg",
      isBooked ? "border-green-400 dark:border-green-600" : "border-transparent hover:border-border",
    )}>
      {/* Colorful header strip */}
      <div className={cn(
        "px-5 py-5 flex items-start justify-between gap-3",
        "bg-gradient-to-br",
        event.category === "cultural"      ? "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
        : event.category === "entertainment" ? "from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40"
        : event.category === "educational"   ? "from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40"
        : "from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40",
        isRtl && "flex-row-reverse"
      )}>
        <div className={cn("flex-1", isRtl && "text-right")}>
          <div className={cn("flex items-center gap-2 mb-2 flex-wrap", isRtl && "flex-row-reverse justify-end")}>
            <Badge className={cn("text-xs font-semibold capitalize", CATEGORY_COLORS[event.category])}>
              {CATEGORY_EMOJIS[event.category]} {event.category}
            </Badge>
            <Badge className={cn("text-xs capitalize", STATUS_COLORS[event.status])}>
              {event.status}
            </Badge>
            {isBooked && (
              <Badge className="text-xs bg-green-500 text-white hover:bg-green-500">✓ Booked</Badge>
            )}
          </div>
          <h3 className="font-bold text-base leading-snug line-clamp-2">{title}</h3>
        </div>
        <div className="text-4xl shrink-0 select-none">{CATEGORY_EMOJIS[event.category]}</div>
      </div>

      <CardContent className="flex-1 flex flex-col gap-3 px-5 pt-4 pb-5">
        {/* Date + time */}
        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRtl && "flex-row-reverse")}>
          <Calendar className="size-4 shrink-0" />
          <span>{format(start, "MMM d, yyyy")} · {format(start, "h:mm a")}</span>
        </div>

        {/* Location */}
        <div className={cn("flex items-start gap-2 text-sm text-muted-foreground", isRtl && "flex-row-reverse")}>
          <MapPin className="size-4 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{loc}</span>
        </div>

        {/* Capacity */}
        {event.capacity > 0 && (
          <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className={cn("flex justify-between text-xs mb-1", isRtl && "flex-row-reverse")}>
                <span className="text-muted-foreground">{event.booked}/{event.capacity} booked</span>
                {event.spotsLeft !== null && (
                  <span className={cn("font-medium", full ? "text-destructive" : "text-green-600 dark:text-green-400")}>
                    {full ? "Full" : `${event.spotsLeft} left`}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", full ? "bg-destructive" : "bg-green-500")}
                  style={{ width: `${Math.min(100, Math.round((event.booked / event.capacity) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Points */}
        <div className={cn("flex items-center gap-4 flex-wrap pt-1", isRtl && "flex-row-reverse")}>
          {event.pointsRequired > 0 && (
            <div className={cn("flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400", isRtl && "flex-row-reverse")}>
              <Coins className="size-3.5" />
              <span>{event.pointsRequired.toLocaleString()} pts required</span>
            </div>
          )}
          <div className={cn("flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400", isRtl && "flex-row-reverse")}>
            <Star className="size-3.5" />
            <span>+{event.pointsReward} pts reward</span>
          </div>
          {event.price > 0 && (
            <div className="text-xs text-muted-foreground font-medium">
              ₪{event.price}
            </div>
          )}
        </div>

        {/* Book button */}
        <Button
          className="w-full mt-auto font-bold"
          disabled={isBooked || full || event.status === "cancelled" || event.status === "completed" || !canAffordPoints}
          variant={isBooked ? "secondary" : "default"}
          onClick={() => onBook(event)}
          aria-label={`Book event: ${title}`}
        >
          {isBooked ? (
            <><Ticket className="size-4 me-2" /> Booked</>
          ) : full ? "Fully Booked" :
            event.status === "cancelled" ? "Cancelled" :
            event.status === "completed" ? "Completed" :
            !canAffordPoints ? `Need ${event.pointsRequired - userPoints} more pts` :
            "Book Now"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { t, isRtl, lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<PalEvent | null>(null);

  const { data: events = [], isLoading } = useQuery<PalEvent[]>({
    queryKey: ["events", categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter   !== "all") params.set("status", statusFilter);
      const r = await fetch(`${BASE}/api/events?${params}`);
      return r.json();
    },
  });

  const { data: bookingsData } = useQuery<BookingsData>({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/events/my-bookings`);
      return r.json();
    },
  });

  const { data: walletData } = useQuery<{ jawwalPoints: number }>({
    queryKey: ["wallet-pts"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/points/wallet`);
      return r.json();
    },
  });

  const bookedIds = new Set(bookingsData?.bookedEventIds ?? []);
  const userPoints = walletData?.jawwalPoints ?? 0;

  const bookMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const r = await fetch(`${BASE}/api/events/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? "Failed to book"); }
      return r.json();
    },
    onSuccess: (data) => {
      setSelectedEvent(null);
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-pts"] });
      toast({
        title: "🎉 Booking Confirmed!",
        description: `Earned +${data.pointsEarned} Jawwal Points. New balance: ${data.newBalance?.toLocaleString() ?? ""} pts`,
        className: "bg-foreground text-background",
      });
    },
    onError: (e: Error) => {
      setSelectedEvent(null);
      toast({ title: e.message, variant: "destructive" });
    },
  });

  const filtered = events.filter((ev) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return ev.title.toLowerCase().includes(q) ||
      ev.titleAr.includes(search) ||
      ev.location.toLowerCase().includes(q);
  });

  const resetFilters = () => {
    setSearch(""); setCategoryFilter("all"); setStatusFilter("all");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-4 flex-wrap", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
            <div className="p-3 bg-muted rounded-xl shrink-0">
              <Calendar className="size-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("eventsTitle")}</h1>
              <p className="text-muted-foreground mt-1">{t("eventsSub")}</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
            {/* Points balance */}
            <div className={cn("flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-foreground text-background", isRtl && "flex-row-reverse")}>
              <Coins className="size-4 text-yellow-400" />
              {userPoints.toLocaleString()} pts
            </div>
            {/* Municipality create link */}
            <Link href="/events/create">
              <Button size="sm" variant="outline" className={cn("gap-2", isRtl && "flex-row-reverse")}>
                <Plus className="size-4" />
                {t("createEvent")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className={cn("flex flex-wrap items-center gap-3", isRtl && "flex-row-reverse")}>
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className={cn("absolute top-2.5 size-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
              <Input
                placeholder={t("searchEvents")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={isRtl ? "pr-9 pl-3" : "pl-9"}
                dir={isRtl ? "rtl" : "ltr"}
                aria-label="Search events"
              />
            </div>

            {/* Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]" aria-label="Filter by category">
                <Tag className="size-4 text-muted-foreground me-2" />
                <SelectValue placeholder={t("allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                <SelectItem value="cultural">🎭 {t("cultural")}</SelectItem>
                <SelectItem value="entertainment">🎪 {t("entertainment")}</SelectItem>
                <SelectItem value="educational">🎓 {t("educational")}</SelectItem>
                <SelectItem value="sports">⚽ {t("sportsCategory")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" aria-label="Filter by status">
                <Filter className="size-4 text-muted-foreground me-2" />
                <SelectValue placeholder={t("allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                <SelectItem value="upcoming">{t("eventUpcoming")}</SelectItem>
                <SelectItem value="ongoing">{t("eventOngoing")}</SelectItem>
                <SelectItem value="completed">{t("eventCompleted")}</SelectItem>
                <SelectItem value="cancelled">{t("eventCancelled")}</SelectItem>
              </SelectContent>
            </Select>

            {(search || categoryFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                {t("resetFilters")}
              </Button>
            )}

            <span className="ms-auto text-sm text-muted-foreground">
              {filtered.length} {t("eventsFound")}
            </span>
          </div>
        </Card>

        {/* Events grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-28 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-9 bg-muted rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Calendar className="size-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">{t("noEventsFound")}</p>
            <p className="text-sm mt-1">{t("noEventsHint")}</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            role="list"
            aria-label="Events list"
          >
            {filtered.map((event) => (
              <div key={event.id} role="listitem">
                <EventCard
                  event={event}
                  isBooked={bookedIds.has(event.id)}
                  userPoints={userPoints}
                  onBook={setSelectedEvent}
                  isRtl={isRtl}
                  lang={lang}
                />
              </div>
            ))}
          </div>
        )}

        {/* Booking confirmation dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-sm" aria-describedby="booking-dialog-desc">
            <DialogHeader>
              <DialogTitle>{t("confirmBooking")}</DialogTitle>
              <DialogDescription id="booking-dialog-desc">
                {selectedEvent && (
                  lang === "ar" && selectedEvent.titleAr
                    ? selectedEvent.titleAr
                    : selectedEvent.title
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-3 my-2">
                <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{format(new Date(selectedEvent.startDate), "EEEE, MMM d · h:mm a")}</span>
                </div>
                <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{lang === "ar" ? selectedEvent.locationAr || selectedEvent.location : selectedEvent.location}</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1.5">
                  {selectedEvent.pointsRequired > 0 && (
                    <div className={cn("flex justify-between", isRtl && "flex-row-reverse")}>
                      <span className="text-muted-foreground">{t("ptsRequired")}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">−{selectedEvent.pointsRequired.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={cn("flex justify-between", isRtl && "flex-row-reverse")}>
                    <span className="text-muted-foreground">{t("ptsEarned")}</span>
                    <span className="font-bold text-green-600 dark:text-green-400">+{selectedEvent.pointsReward.toLocaleString()}</span>
                  </div>
                  {selectedEvent.price > 0 && (
                    <div className={cn("flex justify-between", isRtl && "flex-row-reverse")}>
                      <span className="text-muted-foreground">{t("ticketPrice")}</span>
                      <span className="font-bold">₪{selectedEvent.price}</span>
                    </div>
                  )}
                  <div className={cn("flex justify-between border-t pt-1.5 mt-1.5 font-semibold", isRtl && "flex-row-reverse")}>
                    <span>{t("balanceAfter")}</span>
                    <span>{(userPoints - selectedEvent.pointsRequired + selectedEvent.pointsReward).toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className={cn("gap-2", isRtl && "flex-row-reverse")}>
              <Button variant="outline" onClick={() => setSelectedEvent(null)} aria-label="Cancel booking">
                {t("cancelBtn")}
              </Button>
              <Button
                onClick={() => selectedEvent && bookMutation.mutate(selectedEvent.id)}
                disabled={bookMutation.isPending}
                aria-label="Confirm booking"
              >
                {bookMutation.isPending ? "…" : t("confirmBook")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
