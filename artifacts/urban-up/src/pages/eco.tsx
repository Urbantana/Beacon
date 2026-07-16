import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetWasteReports,
  useCreateWasteReport,
  useReportCleanup
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { setupLeaflet } from "@/components/map/map-setup";
import "leaflet/dist/leaflet.css";
import { Leaf, Trash2, CheckCircle2, Sprout, HandHeart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function EcoRewards() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();

  useEffect(() => { setupLeaflet(); }, []);

  const { data: reports, refetch } = useGetWasteReports();
  const createReport               = useCreateWasteReport();
  const reportCleanup              = useReportCleanup();

  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [type, setType]               = useState("overflowing_bin");
  const [description, setDescription] = useState("");

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLat || !selectedLng) {
      toast({ title: t('clickMapLocation'), variant: "destructive" });
      return;
    }
    createReport.mutate({ data: { lat: selectedLat, lng: selectedLng, type: type as any, description } }, {
      onSuccess: (data) => {
        toast({
          title: t('reportSubmittedEco'),
          description: `${t('earnedEcoPoints')} ${data.ecoPointsAwarded || 10} ${t('forHelping')}`,
          className: "bg-green-50 border-green-200 text-green-900"
        });
        setSelectedLat(null); setSelectedLng(null); setDescription("");
        refetch();
      }
    });
  };

  const handleCleanup = (reportId: number) => {
    const report = reports?.find(r => r.id === reportId);
    if (!report) return;
    reportCleanup.mutate({
      data: { lat: report.lat, lng: report.lng, description: "Cleaned up the area", wasteReportId: reportId }
    }, {
      onSuccess: (data) => {
        toast({
          title: t('cleanupVerified'),
          description: `${t('amazingWork')} ${data.points} ${t('ecoPointsLabel')}`,
          className: "bg-green-50 border-green-200 text-green-900"
        });
        refetch();
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':     return <Badge variant="destructive">{t('pending')}</Badge>;
      case 'in_progress': return <Badge variant="warning">{t('inProgress')}</Badge>;
      case 'resolved':    return <Badge variant="success">{t('resolved')}</Badge>;
      default:            return <Badge>{t('unknown')}</Badge>;
    }
  };

  const getTypeLabel = (tp: string) => tp.replace(/_/g, ' ').toUpperCase();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <Leaf className="size-8 text-green-600 dark:text-green-400" />
            {t('ecoTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('ecoSub')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Map */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[600px] border-2 border-green-200 dark:border-green-900/40">
            <div className="flex-1 bg-muted relative">
              <MapContainer center={[31.9056, 35.2037]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapClickHandler onLocationSelect={(lat, lng) => { setSelectedLat(lat); setSelectedLng(lng); }} />
                {selectedLat && selectedLng && (
                  <Marker position={[selectedLat, selectedLng]}>
                    <Popup>{t('selectedReportLoc')}</Popup>
                  </Marker>
                )}
                {reports?.map((report) => (
                  <Marker key={report.id} position={[report.lat, report.lng]}>
                    <Popup className="rounded-xl overflow-hidden">
                      <div className="p-1 -m-1">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-sm flex items-center gap-1">
                            <Trash2 className="size-4 text-green-600" /> {t('wasteReport')}
                          </h4>
                          {getStatusBadge(report.status)}
                        </div>
                        <Badge variant="outline" className="mb-2 text-[10px]">{getTypeLabel(report.type)}</Badge>
                        <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                        {report.status !== 'resolved' && (
                          <div className="pt-3 border-t">
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleCleanup(report.id)}
                              disabled={reportCleanup.isPending}
                            >
                              <HandHeart className="size-4 mr-2" /> {t('iCleanedThis')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="flex flex-col gap-6 h-full lg:overflow-auto pr-2 pb-6">
            <Card className="border-green-200 dark:border-green-900/40 shadow-sm bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-4">
                <CardTitle className={cn("text-lg flex items-center gap-2 text-green-800 dark:text-green-400", isRtl && "flex-row-reverse")}>
                  <Sprout className="size-5" />
                  {t('reportIssue')}
                </CardTitle>
                <CardDescription>{t('reportIssueSub')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="p-3 bg-background rounded-md text-sm text-center border border-dashed mb-2">
                    {selectedLat ? (
                      <span className="text-green-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="size-4" /> {t('locationSelected')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t('clickMapLocation')}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('issueType')}</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overflowing_bin">{t('overflowingBin')}</SelectItem>
                        <SelectItem value="mixed_waste">{t('mixedWaste')}</SelectItem>
                        <SelectItem value="litter">{t('litter')}</SelectItem>
                        <SelectItem value="other">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('description')}</Label>
                    <Textarea
                      className="bg-background"
                      placeholder={t('ecoDescPlaceholder')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      dir={isRtl ? "rtl" : "ltr"}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={!selectedLat || createReport.isPending}
                  >
                    {t('submitEarnPoints')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col min-h-[300px]">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-lg">{t('recentReports')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {reports?.map(report => (
                    <div key={report.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className={cn("flex items-center justify-between mb-2", isRtl && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                          <Trash2 className="size-4 text-muted-foreground" />
                          <h4 className="font-semibold text-sm">{getTypeLabel(report.type)}</h4>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{report.description}</p>
                      <div className={cn("flex justify-between items-center mt-2", isRtl && "flex-row-reverse")}>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(report.createdAt), 'MMM d, h:mm a')}</span>
                        {report.ecoPointsAwarded && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                            +{report.ecoPointsAwarded} {t('ptsUnit')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!reports || reports.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">{t('noWasteReports')}</div>
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
