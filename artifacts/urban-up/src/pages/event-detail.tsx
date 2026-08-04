import { useState } from "react";
import { Link, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Calendar, MapPin, Users, Coins, Star, Ticket,
  Clock, Building2, ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

const CATEGORY_GRADIENT: Record<string, string> = {
  cultural:      "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
  entertainment: "from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40",
  educational:   "from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40",
  sports:        "from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40",
};

const CATEGORY_BADGE: Record<string, string> = {
  cultural:      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  educational:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sports:        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const CATEGORY_EMOJI: Record<string, string> = {
  cultural: "🎭", entertainment: "🎪", educational: "🎓", sports: "⚽",
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBookDialog, setShowBookDialog] = useState(false);

  const { data: event, isLoading, isError } = useQuery<PalEvent>({
    queryKey: ["event", id],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/events/${id}`);
      if (!r.ok) throw new Error("Event not found");
      return r.json();
    },
  });

  const { data: walletData } = useQuery<{ jawwalPoints: number }>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/points/wallet`);
      return r.json();
    },
  });

  const { data: bookingsData } = useQuery<{ bookedEventIds: number[] }>({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/events/my-bookings`);
      return r.json();
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const r = await fetch(`${BASE}/api/events/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Booking failed");
      }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      setShowBookDialog(false);
      toast({
        title: "Booking Confirmed!",
        description: `You earned ${data.pointsEarned} Jawwal Points.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground">Loading event…</div>
    </AppLayout>
  );

  if (isError || !event) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Event not found.</p>
        <Link href="/events">
          <Button variant="outline"><ChevronLeft className="size-4 me-1" />Back to Events</Button>
        </Link>
      </div>
    </AppLayout>
  );

  const title       = lang === "ar" && event.titleAr       ? event.titleAr       : event.title;
  const description = lang === "ar" && event.descriptionAr ? event.descriptionAr : event.description;
  const loc         = lang === "ar" && event.locationAr    ? event.locationAr    : event.location;
  const start       = new Date(event.startDate);
  const end         = new Date(event.endDate);
  const full        = event.capacity > 0 && event.booked >= event.capacity;
  const userPoints  = walletData?.jawwalPoints ?? 0;
  const isBooked    = bookingsData?.bookedEventIds.includes(event.id) ?? false;
  const canAfford   = event.pointsRequired === 0 || userPoints >= event.pointsRequired;
  const capPct      = event.capacity > 0 ? Math.min(100, Math.round((event.booked / event.capacity) * 100)) : 0;

  return (
    <AppLayout>
      <div className={cn("max-w-4xl mx-auto pb-12", isRtl && "text-right")}>
        {/* Breadcrumb */}
        <div className={cn("flex items-center gap-2 mb-6 text-sm text-muted-foreground", isRtl && "flex-row-reverse")}>
          <Link href="/events" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ChevronLeft className={cn("size-4", isRtl && "rotate-180")} />
            Back to Events
          </Link>
        </div>

        {/* Hero */}
        <div className={cn(
          "rounded-2xl overflow-hidden mb-8 bg-gradient-to-br",
          CATEGORY_GRADIENT[event.category] ?? "from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        )}>
          <div className={cn("p-8 flex items-start justify-between gap-6", isRtl && "flex-row-reverse")}>
            <div className="flex-1">
              <div className={cn("flex items-center gap-2 mb-4 flex-wrap", isRtl && "flex-row-reverse justify-end")}>
                <Badge className={cn("capitalize font-semibold", CATEGORY_BADGE[event.category])}>
                  {event.category}
                </Badge>
                <Badge variant="outline" className="capitalize">{event.status}</Badge>
                {isBooked && (
                  <Badge className="bg-green-500 text-white hover:bg-green-500">
                    <Ticket className="size-3 me-1" /> Booked
                  </Badge>
                )}
              </div>
              <h1 className={cn("text-3xl font-bold leading-tight mb-2", isRtl && "text-right")}>
                {title}
              </h1>
              <div className={cn("flex items-center gap-2 text-muted-foreground mt-3 text-sm", isRtl && "flex-row-reverse")}>
                <Building2 className="size-4 shrink-0" />
                <span>{event.createdBy}</span>
              </div>
            </div>
            <div className="text-7xl select-none shrink-0">{CATEGORY_EMOJI[event.category]}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-3">About this Event</h2>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>

            {/* Map */}
            {event.lat && event.lng && (
              <div>
                <h2 className={cn("text-lg font-semibold mb-3 flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <MapPin className="size-5" /> Location
                </h2>
                <p className="text-sm text-muted-foreground mb-3">{loc}</p>
                <div className="rounded-xl overflow-hidden border h-64">
                  <MapContainer
                    center={[event.lat, event.lng]}
                    zoom={15}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={false}
                    aria-label="Event location map"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={[event.lat, event.lng]}>
                      <Popup>{title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar panel */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground tracking-widest">Date & Time</h3>
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <span>{format(start, "MMM d, yyyy")}</span>
              </div>
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <Clock className="size-4 text-muted-foreground shrink-0" />
                <span>{format(start, "h:mm a")} – {format(end, "h:mm a")}</span>
              </div>
            </div>

            {/* Capacity */}
            {event.capacity > 0 && (
              <div className="rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-xs uppercase text-muted-foreground tracking-widest">Capacity</h3>
                <div className={cn("flex justify-between items-center text-sm", isRtl && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                    <Users className="size-4 text-muted-foreground" />
                    <span>{event.booked} / {event.capacity}</span>
                  </div>
                  <span className={cn("font-semibold text-xs", full ? "text-destructive" : "text-green-600 dark:text-green-400")}>
                    {full ? "Full" : `${event.spotsLeft} left`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", full ? "bg-destructive" : "bg-green-500")}
                    style={{ width: `${capPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Points */}
            <div className="rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground tracking-widest">Jawwal Points</h3>
              {event.pointsRequired > 0 && (
                <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                  <Coins className="size-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {event.pointsRequired.toLocaleString()} pts required
                  </span>
                </div>
              )}
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <Star className="size-4 text-green-500 shrink-0" />
                <span className="font-semibold text-green-600 dark:text-green-400">+{event.pointsReward} pts reward</span>
              </div>
              {event.price > 0 && (
                <p className="text-sm text-muted-foreground">Ticket: ₪{event.price}</p>
              )}
            </div>

            {/* Book button */}
            <Button
              className="w-full" size="lg"
              disabled={isBooked || full || event.status === "cancelled" || event.status === "completed" || !canAfford}
              variant={isBooked ? "secondary" : "default"}
              onClick={() => setShowBookDialog(true)}
              aria-label={`Book event: ${title}`}
            >
              {isBooked ? (
                <><Ticket className="size-4 me-2" />Booked</>
              ) : full ? "Fully Booked"
                : event.status === "cancelled" ? "Cancelled"
                : event.status === "completed" ? "Completed"
                : !canAfford ? `Need ${event.pointsRequired - userPoints} more pts`
                : "Book Now"}
            </Button>
            {event.pointsRequired > 0 && !isBooked && (
              <p className="text-xs text-muted-foreground text-center">
                Your balance: {userPoints.toLocaleString()} pts
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Booking dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              You're about to book <strong>{title}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {event.pointsRequired > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Points required</span>
                <span className="font-semibold text-amber-600">{event.pointsRequired.toLocaleString()} pts</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points earned</span>
              <span className="font-semibold text-green-600">+{event.pointsReward} pts</span>
            </div>
            {event.price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ticket price</span>
                <span className="font-semibold">₪{event.price}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>Cancel</Button>
            <Button onClick={() => bookMutation.mutate(event.id)} disabled={bookMutation.isPending}>
              {bookMutation.isPending ? "Booking…" : "Confirm & Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
