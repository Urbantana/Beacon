import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetAccessibilityPaths,
  useGetObstacles,
  useReportObstacle
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import { setupLeaflet } from "@/components/map/map-setup";
import "leaflet/dist/leaflet.css";
import { Eye, ShieldAlert, Accessibility, AlertTriangle, AudioLines, GripHorizontal, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function SafePaths() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();

  useEffect(() => { setupLeaflet(); }, []);

  const { data: paths }      = useGetAccessibilityPaths();
  const { data: obstacles }  = useGetObstacles();
  const reportObstacle       = useReportObstacle();

  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    return () => document.documentElement.classList.remove("high-contrast");
  }, [highContrast]);

  const [selectedLat, setSelectedLat]   = useState<number | null>(null);
  const [selectedLng, setSelectedLng]   = useState<number | null>(null);
  const [obstacleType, setObstacleType] = useState("barrier");
  const [severity, setSeverity]         = useState("high");
  const [description, setDescription]   = useState("");

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLat || !selectedLng) {
      toast({ title: t('clickMapLocation'), variant: "destructive" });
      return;
    }
    reportObstacle.mutate({
      data: { lat: selectedLat, lng: selectedLng, obstacleType: obstacleType as any, severity: severity as any, description }
    }, {
      onSuccess: () => {
        toast({ title: t('obstacleReported'), description: t('cityNotified') });
        setSelectedLat(null); setSelectedLng(null); setDescription("");
      }
    });
  };

  const getPathColor = (type: string) => {
    switch (type) {
      case 'wheelchair':   return '#3B82F6';
      case 'blind_friendly': return '#6B7280';
      case 'both':         return '#111111';
      default:             return '#9CA3AF';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':   return <Badge variant="destructive">{t('highSev')}</Badge>;
      case 'medium': return <Badge variant="warning">{t('medSev')}</Badge>;
      case 'low':    return <Badge variant="secondary">{t('lowSev')}</Badge>;
      default:       return <Badge>{t('unknown')}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full">
        <div className={cn("flex justify-between items-end", isRtl && "flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('safePathsTitle')}</h1>
            <p className="text-muted-foreground mt-1">{t('safePathsSub')}</p>
          </div>
          <div className={cn("flex items-center gap-3 bg-card px-4 py-2 border rounded-full shadow-sm", isRtl && "flex-row-reverse")}>
            <Label htmlFor="high-contrast" className="font-semibold cursor-pointer">{t('highContrastMode')}</Label>
            <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1">
          {/* Map */}
          <Card className="xl:col-span-3 overflow-hidden flex flex-col min-h-[600px] border-2">
            <div className="flex-1 bg-muted relative">
              <MapContainer center={[31.9056, 35.2037]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={highContrast
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                />
                <MapClickHandler onLocationSelect={(lat, lng) => { setSelectedLat(lat); setSelectedLng(lng); }} />
                {selectedLat && selectedLng && (
                  <Marker position={[selectedLat, selectedLng]}>
                    <Popup>{t('obstacleLocation')}</Popup>
                  </Marker>
                )}
                {paths?.map((path) => (
                  <Polyline
                    key={path.id}
                    positions={path.waypoints as [number, number][]}
                    pathOptions={{
                      color: getPathColor(path.pathType),
                      weight: 6,
                      opacity: path.isActive ? 0.8 : 0.4,
                      dashArray: path.isActive ? undefined : '10, 10'
                    }}
                  >
                    <Popup>
                      <div className="font-semibold text-sm">{path.name}</div>
                      <div className="text-xs capitalize mb-1">{path.pathType.replace('_', ' ')} {t('pathLabel')}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                        {path.hasAudioCues    && <Badge variant="outline" className="text-[10px]"><AudioLines className="size-3 mr-1"/> {t('audioLabel')}</Badge>}
                        {path.hasHapticMarkers && <Badge variant="outline" className="text-[10px]"><GripHorizontal className="size-3 mr-1"/> {t('hapticLabel')}</Badge>}
                      </div>
                    </Popup>
                  </Polyline>
                ))}
                {obstacles?.filter(o => o.isActive).map((obs) => (
                  <Marker key={obs.id} position={[obs.lat, obs.lng]}>
                    <Popup>
                      <div className="p-1 -m-1">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="size-4" /> {t('obstacle')}
                          </h4>
                          {getSeverityBadge(obs.severity)}
                        </div>
                        <Badge variant="outline" className="mb-2 uppercase text-[10px]">{obs.obstacleType.replace('_', ' ')}</Badge>
                        <p className="text-xs text-muted-foreground">{obs.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="flex flex-col gap-6 h-full xl:overflow-auto pr-2 pb-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className={cn("text-lg flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <ShieldAlert className="size-5 text-destructive" />
                  {t('reportObstacle')}
                </CardTitle>
                <CardDescription>{t('reportObstacleSub')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="p-3 bg-muted rounded-md text-sm text-center border border-dashed mb-2">
                    {selectedLat ? (
                      <span className="font-medium flex items-center justify-center gap-2 text-foreground">
                        <CheckCircle2 className="size-4" /> {t('locationSelected')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t('clickMapLocation')}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('typeLabel')}</Label>
                    <Select value={obstacleType} onValueChange={setObstacleType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pothole">{t('pothole')}</SelectItem>
                        <SelectItem value="barrier">{t('barrier')}</SelectItem>
                        <SelectItem value="parked_vehicle">{t('parkedVehicle')}</SelectItem>
                        <SelectItem value="construction">{t('construction')}</SelectItem>
                        <SelectItem value="other">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('severity')}</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">{t('sevHighImpass')}</SelectItem>
                        <SelectItem value="medium">{t('sevMedDiff')}</SelectItem>
                        <SelectItem value="low">{t('sevLowNuis')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('description')}</Label>
                    <Textarea
                      placeholder={t('reportObstacleSub')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      dir={isRtl ? "rtl" : "ltr"}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={!selectedLat || reportObstacle.isPending} variant={selectedLat ? "destructive" : "secondary"}>
                    {t('submitReport')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="flex-1 min-h-[300px] flex flex-col">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-lg">{t('activePaths')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {paths?.map(path => (
                    <div key={path.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className={cn("flex items-center justify-between mb-2", isRtl && "flex-row-reverse")}>
                        <h4 className="font-semibold text-sm">{path.name}</h4>
                        <div className="flex gap-1">
                          {(path.pathType === 'wheelchair' || path.pathType === 'both') && (
                            <div className="bg-blue-100 text-blue-700 p-1 rounded"><Accessibility className="size-3" /></div>
                          )}
                          {(path.pathType === 'blind_friendly' || path.pathType === 'both') && (
                            <div className="bg-muted text-foreground p-1 rounded"><Eye className="size-3" /></div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {path.surfaceType && <Badge variant="secondary" className="text-[10px]">{path.surfaceType}</Badge>}
                        {!path.isActive && <Badge variant="destructive" className="text-[10px]">{t('underMaintenance')}</Badge>}
                      </div>
                    </div>
                  ))}
                  {(!paths || paths.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">{t('noPathsLoaded')}</div>
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
