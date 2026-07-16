import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetDashboardSummary,
  useGetTouristSpots,
  useGetTouristEvents,
  useGetActivityFeed
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { setupLeaflet } from "@/components/map/map-setup";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Calendar,
  Leaf,
  MapPin,
  Navigation,
  ShieldAlert,
  Trash2,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { t, isRtl } = useI18n();

  useEffect(() => {
    setupLeaflet();
  }, []);

  const { data: summary } = useGetDashboardSummary();
  const { data: spots }   = useGetTouristSpots();
  const { data: events }  = useGetTouristEvents();
  const { data: feed }    = useGetActivityFeed();

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'traffic':       return <Navigation className="size-4 text-blue-500" />;
      case 'waste':         return <Trash2 className="size-4 text-green-500" />;
      case 'accessibility': return <ShieldAlert className="size-4 text-orange-500" />;
      case 'tourism':       return <MapPin className="size-4 text-foreground/60" />;
      case 'points':        return <Trophy className="size-4 text-yellow-500" />;
      default:              return <MapPin className="size-4 text-muted-foreground" />;
    }
  };

  const stats = [
    {
      label: t('activeTraffic'),
      sub: t('reportsThisHour'),
      value: summary?.activeTrafficReports ?? 0,
      icon: <Navigation className="size-4 text-orange-600 dark:text-orange-400" />,
      bg: "bg-orange-100 dark:bg-orange-900/20",
      delay: 0.1,
    },
    {
      label: t('pendingWaste'),
      sub: t('awaitingPickup'),
      value: summary?.pendingWasteReports ?? 0,
      icon: <Trash2 className="size-4 text-green-600 dark:text-green-400" />,
      bg: "bg-green-100 dark:bg-green-900/20",
      delay: 0.2,
    },
    {
      label: t('pathObstacles'),
      sub: t('affectingAccess'),
      value: summary?.activeObstacles ?? 0,
      icon: <ShieldAlert className="size-4 text-red-600 dark:text-red-400" />,
      bg: "bg-red-100 dark:bg-red-900/20",
      delay: 0.3,
    },
    {
      label: t('eventsThisWeek'),
      sub: t('culturalCommunity'),
      value: summary?.eventsThisWeek ?? 0,
      icon: <Calendar className="size-4 text-foreground dark:text-foreground/80" />,
      bg: "bg-muted",
      delay: 0.4,
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('cityOverview')}</h1>
          <p className="text-muted-foreground mt-1">{t('cityOverviewSub')}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: s.delay }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className={cn("p-2 rounded-md", s.bg)}>{s.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main map */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col h-[500px]">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                {t('liveCityMap')}
              </CardTitle>
            </CardHeader>
            <div className="flex-1 bg-muted relative">
              <MapContainer
                center={[31.9, 35.2]}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {spots?.map((spot) => (
                  <Marker key={spot.id} position={[spot.lat, spot.lng]}>
                    <Popup className="rounded-xl overflow-hidden">
                      <div className="p-1 -m-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-sm">{spot.name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase">{spot.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{spot.description}</p>
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{t('crowdLevel')}</span>
                            <Badge
                              variant={spot.crowdLevel === 'high' ? 'destructive' : spot.crowdLevel === 'medium' ? 'warning' : 'success'}
                              className="text-[10px]"
                            >
                              {spot.crowdLevel}
                            </Badge>
                          </div>
                          {spot.crowdLevel === 'high' && (
                            <div className="flex items-start gap-2 bg-orange-50 text-orange-800 p-2 rounded-md mt-1">
                              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                              <span className="text-[10px] leading-tight">{t('highTrafficWarning')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-6 h-[500px]">
            {/* Upcoming events */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-4 border-b shrink-0">
                <CardTitle className="text-lg">{t('upcomingEvents')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {events?.slice(0, 4).map((event) => (
                    <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className={cn("flex items-start justify-between gap-2 mb-1", isRtl && "flex-row-reverse")}>
                        <h4 className="font-semibold text-sm line-clamp-1">{event.name}</h4>
                        {event.pointsReward && (
                          <Badge variant="secondary" className="shrink-0 bg-foreground/10 text-foreground hover:bg-foreground/20 text-[10px]">
                            +{event.pointsReward} {t('ptsUnit')}
                          </Badge>
                        )}
                      </div>
                      <div className={cn("text-xs text-muted-foreground flex items-center gap-1.5 mb-1", isRtl && "flex-row-reverse")}>
                        <MapPin className="size-3 shrink-0" />
                        <span className="line-clamp-1">{event.venueName}</span>
                      </div>
                      <div className={cn("text-xs text-muted-foreground flex items-center gap-1.5", isRtl && "flex-row-reverse")}>
                        <Calendar className="size-3 shrink-0" />
                        <span>{format(new Date(event.startDate), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  ))}
                  {(!events || events.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">{t('noUpcomingEvents')}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live feed */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-4 border-b shrink-0">
                <CardTitle className="text-lg">{t('liveCityFeed')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {feed?.map((item) => (
                    <div key={item.id} className={cn("p-4 flex gap-3 hover:bg-muted/50 transition-colors", isRtl && "flex-row-reverse")}>
                      <div className="mt-0.5 shrink-0 bg-muted rounded-full p-1.5">
                        {getModuleIcon(item.module)}
                      </div>
                      <div className="flex-1">
                        <div className={cn("flex justify-between items-start", isRtl && "flex-row-reverse")}>
                          <p className="text-sm">
                            <span className="font-medium text-foreground">{item.username || t('anonymous')}</span>{' '}
                            <span className="text-muted-foreground">{item.action}</span>
                          </p>
                          {item.points && (
                            <Badge variant="success" className="text-[10px] shrink-0 ml-2">+{item.points}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!feed || feed.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">{t('noRecentActivity')}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
