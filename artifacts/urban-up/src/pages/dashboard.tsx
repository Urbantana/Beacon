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
  Users 
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  useEffect(() => {
    setupLeaflet();
  }, []);

  const { data: summary } = useGetDashboardSummary();
  const { data: spots } = useGetTouristSpots();
  const { data: events } = useGetTouristEvents();
  const { data: feed } = useGetActivityFeed();

  const getSpotColor = (category: string) => {
    switch (category) {
      case 'heritage': return 'purple';
      case 'culture': return 'blue';
      case 'market': return 'orange';
      case 'event': return 'red';
      case 'park': return 'green';
      default: return 'gray';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'traffic': return <Navigation className="size-4 text-blue-500" />;
      case 'waste': return <Trash2 className="size-4 text-green-500" />;
      case 'accessibility': return <ShieldAlert className="size-4 text-orange-500" />;
      case 'tourism': return <MapPin className="size-4 text-purple-500" />;
      case 'points': return <Trophy className="size-4 text-yellow-500" />;
      default: return <MapPin className="size-4 text-gray-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">City Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time pulse of Ramallah & surrounding areas.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Traffic</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                  <Navigation className="size-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.activeTrafficReports || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Reports this hour</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Waste</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-md">
                  <Trash2 className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.pendingWasteReports || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting pickup</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Path Obstacles</CardTitle>
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-md">
                  <ShieldAlert className="size-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.activeObstacles || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Affecting accessibility</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Events This Week</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-md">
                  <Calendar className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.eventsThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Cultural & community</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col h-[500px]">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                Live City Map
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
                            <span className="text-muted-foreground">Crowd Level</span>
                            <Badge variant={
                              spot.crowdLevel === 'high' ? 'destructive' : 
                              spot.crowdLevel === 'medium' ? 'warning' : 'success'
                            } className="text-[10px]">
                              {spot.crowdLevel}
                            </Badge>
                          </div>
                          
                          {spot.crowdLevel === 'high' && (
                            <div className="flex items-start gap-2 bg-orange-50 text-orange-800 p-2 rounded-md mt-1">
                              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                              <span className="text-[10px] leading-tight">High traffic warning in this area. Consider alternative routes.</span>
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

          {/* Right Column: Events & Activity */}
          <div className="flex flex-col gap-6 h-[500px]">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-4 border-b shrink-0">
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {events?.slice(0, 4).map((event) => (
                    <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{event.name}</h4>
                        {event.pointsReward && (
                          <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 text-[10px]">
                            +{event.pointsReward} pts
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <MapPin className="size-3" />
                        <span className="line-clamp-1">{event.venueName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        <span>{format(new Date(event.startDate), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  ))}
                  {(!events || events.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No upcoming events
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-4 border-b shrink-0">
                <CardTitle className="text-lg">Live City Feed</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {feed?.map((item) => (
                    <div key={item.id} className="p-4 flex gap-3 hover:bg-muted/50 transition-colors">
                      <div className="mt-0.5 shrink-0 bg-muted rounded-full p-1.5">
                        {getModuleIcon(item.module)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm">
                            <span className="font-medium text-foreground">{item.username || 'Anonymous'}</span>{' '}
                            <span className="text-muted-foreground">{item.action}</span>
                          </p>
                          {item.points && (
                            <Badge variant="success" className="text-[10px] shrink-0 ml-2">
                              +{item.points}
                            </Badge>
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
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No recent activity
                    </div>
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
