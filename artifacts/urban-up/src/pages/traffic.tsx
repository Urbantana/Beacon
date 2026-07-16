import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetTrafficReports,
  useCreateTrafficReport,
  useGetSmartRoute,
  useAcceptAlternativeRoute
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import { setupLeaflet } from "@/components/map/map-setup";
import "leaflet/dist/leaflet.css";
import { Navigation, AlertOctagon, Car, Route as RouteIcon, MapPin, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { RouteRequest, RouteOption } from "@workspace/api-client-react/src/generated/api.schemas";

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Traffic() {
  const { toast } = useToast();
  useEffect(() => {
    setupLeaflet();
  }, []);

  const { data: reports } = useGetTrafficReports();
  const createReport = useCreateTrafficReport();
  const getRoute = useGetSmartRoute();
  const acceptRoute = useAcceptAlternativeRoute();

  const [origin, setOrigin] = useState("Al Manara Square");
  const [destination, setDestination] = useState("");
  const [smartRouteResponse, setSmartRouteResponse] = useState<any>(null);

  // Form states
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [severity, setSeverity] = useState<string>("medium");
  const [description, setDescription] = useState("");

  const handleFindRoute = () => {
    if (!origin || !destination) {
      toast({ title: "Please enter origin and destination", variant: "destructive" });
      return;
    }

    const payload: RouteRequest = {
      originLat: 31.9056,
      originLng: 35.2037, // Al Manara
      destLat: 31.9120,
      destLng: 35.2100, // Dummy destination
      destinationName: destination
    };

    getRoute.mutate({ data: payload }, {
      onSuccess: (data) => {
        setSmartRouteResponse(data);
      },
      onError: () => {
        toast({ title: "Failed to find route", variant: "destructive" });
      }
    });
  };

  const handleAcceptAlternative = () => {
    if (!smartRouteResponse?.alternativeRoute) return;

    acceptRoute.mutate({
      data: {
        routeName: smartRouteResponse.alternativeRoute.name,
        pointsAmount: smartRouteResponse.pointsIfAlternative || 0,
        usedParkingZone: !!smartRouteResponse.alternativeRoute.parkingZone
      }
    }, {
      onSuccess: (data) => {
        toast({ 
          title: "Route Accepted!", 
          description: `You earned ${data.points} Jawwal Points for reducing congestion.`,
          variant: "default"
        });
        setSmartRouteResponse(null);
        setDestination("");
      }
    });
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLat || !selectedLng) {
      toast({ title: "Click on the map to set location", variant: "destructive" });
      return;
    }
    
    createReport.mutate({
      data: {
        lat: selectedLat,
        lng: selectedLng,
        severity: severity as any,
        description
      }
    }, {
      onSuccess: () => {
        toast({ title: "Report submitted successfully" });
        setSelectedLat(null);
        setSelectedLng(null);
        setDescription("");
      }
    });
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="warning">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge variant="success">Low</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const mapCenter: [number, number] = [31.9056, 35.2037];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Traffic & Routes</h1>
          <p className="text-muted-foreground mt-1">AI-powered routing and community incident reporting.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Sidebar Tools */}
          <div className="flex flex-col gap-6 h-full lg:overflow-auto pr-2 pb-6">
            
            {/* Smart Routing Panel */}
            <Card className="border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <RouteIcon className="size-24" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="size-5 text-primary" />
                  Smart Route
                </CardTitle>
                <CardDescription>Get AI-optimized routes that avoid congestion and earn points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input className="pl-9" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-4 text-primary" />
                    <Input className="pl-9 border-primary/30 focus-visible:ring-primary" placeholder="Where to?" value={destination} onChange={(e) => setDestination(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleFindRoute} disabled={getRoute.isPending}>
                  {getRoute.isPending ? "Calculating..." : "Find Smart Route"}
                </Button>

                {smartRouteResponse && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 space-y-4">
                    {smartRouteResponse.isCongested && (
                      <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm border border-red-100 flex items-start gap-2">
                        <AlertOctagon className="size-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>High Congestion Detected</strong>
                          <p className="mt-1 opacity-90">{smartRouteResponse.congestionMessage}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg bg-card">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">Main Route</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3"/> {smartRouteResponse.mainRoute.estimatedMinutes} min</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{smartRouteResponse.mainRoute.distanceKm} km via {smartRouteResponse.mainRoute.name}</div>
                        {smartRouteResponse.mainRoute.trafficLevel === 'congested' && (
                          <Badge variant="destructive" className="text-[10px]">Heavy Traffic</Badge>
                        )}
                      </div>

                      {smartRouteResponse.alternativeRoute && (
                        <div className="p-3 border-2 border-primary/40 bg-primary/5 rounded-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                            RECOMMENDED
                          </div>
                          <div className="flex justify-between items-center mb-1 mt-2">
                            <span className="font-semibold text-sm text-primary">Eco-Alternative Route</span>
                            <span className="text-xs text-primary font-medium flex items-center gap-1"><Clock className="size-3"/> {smartRouteResponse.alternativeRoute.estimatedMinutes} min</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-3">{smartRouteResponse.alternativeRoute.distanceKm} km via {smartRouteResponse.alternativeRoute.name}</div>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2 rounded border border-primary/20">
                              <Trophy className="size-4 text-yellow-500" />
                              <span className="text-xs font-medium">Earn {smartRouteResponse.pointsIfAlternative} Jawwal Points</span>
                            </div>
                            <Button size="sm" onClick={handleAcceptAlternative} disabled={acceptRoute.isPending}>
                              <CheckCircle2 className="size-4 mr-2" />
                              Accept & Earn
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Report Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Incident</CardTitle>
                <CardDescription>Help keep the city moving.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="p-3 bg-muted rounded-md text-sm text-center border border-dashed mb-2">
                    {selectedLat ? (
                      <span className="text-success font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="size-4" /> Location Selected
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Click on the map to set location</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Slight Delay)</SelectItem>
                        <SelectItem value="medium">Medium (Moderate Congestion)</SelectItem>
                        <SelectItem value="high">High (Heavy Traffic)</SelectItem>
                        <SelectItem value="critical">Critical (Standstill/Accident)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="E.g., Accident blocking right lane..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={!selectedLat || createReport.isPending} variant={selectedLat ? "default" : "secondary"}>
                    Submit Report
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>

          {/* Main Map */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[600px] border-2">
            <div className="flex-1 bg-muted relative">
              <MapContainer 
                center={mapCenter} 
                zoom={14} 
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                <MapClickHandler onLocationSelect={(lat, lng) => {
                  setSelectedLat(lat);
                  setSelectedLng(lng);
                }} />

                {/* Selected Location Marker */}
                {selectedLat && selectedLng && (
                  <Marker position={[selectedLat, selectedLng]}>
                    <Popup>Selected incident location</Popup>
                  </Marker>
                )}

                {/* Traffic Reports */}
                {reports?.map((report) => (
                  <Marker key={report.id} position={[report.lat, report.lng]}>
                    <Popup className="rounded-xl">
                      <div className="p-1 -m-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm">Traffic Incident</h4>
                          {getSeverityBadge(report.severity)}
                        </div>
                        <p className="text-xs mb-2">{report.description}</p>
                        <div className="text-[10px] text-muted-foreground flex justify-between border-t pt-2">
                          <span>Reported by {report.reporterUsername || 'Anonymous'}</span>
                          <span>{new Date(report.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Render Smart Routes if available */}
                {smartRouteResponse?.mainRoute && (
                  <Polyline 
                    positions={smartRouteResponse.mainRoute.waypoints as [number, number][]} 
                    pathOptions={{ color: 'red', weight: 4, opacity: 0.6 }} 
                  />
                )}
                {smartRouteResponse?.alternativeRoute && (
                  <Polyline 
                    positions={smartRouteResponse.alternativeRoute.waypoints as [number, number][]} 
                    pathOptions={{ color: '#4F46E5', weight: 6, opacity: 0.9, dashArray: '10, 10' }} 
                  />
                )}
              </MapContainer>

              {/* Map Legend Overlay */}
              <div className="absolute bottom-6 left-6 z-[1000] bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg text-xs">
                <h4 className="font-semibold mb-2">Traffic Legend</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Critical</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> High</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Medium</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Low</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function Trophy(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
}
