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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { setupLeaflet } from "@/components/map/map-setup";
import "leaflet/dist/leaflet.css";
import { Leaf, Trash2, CheckCircle2, Sprout, HandHeart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function EcoRewards() {
  const { toast } = useToast();
  useEffect(() => {
    setupLeaflet();
  }, []);

  const { data: reports, refetch } = useGetWasteReports();
  const createReport = useCreateWasteReport();
  const reportCleanup = useReportCleanup();

  // Form states
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [type, setType] = useState<string>("overflowing_bin");
  const [description, setDescription] = useState("");

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
        type: type as any,
        description
      }
    }, {
      onSuccess: (data) => {
        toast({ 
          title: "Report submitted!", 
          description: `You earned ${data.ecoPointsAwarded || 10} Eco Points for helping the city!`,
          className: "bg-green-50 border-green-200 text-green-900"
        });
        setSelectedLat(null);
        setSelectedLng(null);
        setDescription("");
        refetch();
      }
    });
  };

  const handleCleanup = (reportId: number) => {
    const report = reports?.find(r => r.id === reportId);
    if (!report) return;

    reportCleanup.mutate({
      data: {
        lat: report.lat,
        lng: report.lng,
        description: "Cleaned up the area",
        wasteReportId: reportId
      }
    }, {
      onSuccess: (data) => {
        toast({ 
          title: "Cleanup Verified!", 
          description: `Amazing work! You earned ${data.points} Eco Points.`,
          className: "bg-green-50 border-green-200 text-green-900"
        });
        refetch();
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="destructive">Pending</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'resolved': return <Badge variant="success">Resolved</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const getTypeLabel = (t: string) => t.replace('_', ' ').toUpperCase();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-400 flex items-center gap-2">
            <Leaf className="size-8" />
            Eco-Waste & Green Rewards
          </h1>
          <p className="text-muted-foreground mt-1">Keep the city clean. Earn Eco Points for reporting and cleaning.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Main Map */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[600px] border-2 border-green-100 dark:border-green-900/50">
            <div className="flex-1 bg-muted relative">
              <MapContainer 
                center={[31.9056, 35.2037]} 
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

                {selectedLat && selectedLng && (
                  <Marker position={[selectedLat, selectedLng]}>
                    <Popup>Selected report location</Popup>
                  </Marker>
                )}

                {/* Render Reports */}
                {reports?.map((report) => (
                  <Marker key={report.id} position={[report.lat, report.lng]}>
                    <Popup className="rounded-xl overflow-hidden">
                      <div className="p-1 -m-1">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-sm flex items-center gap-1">
                            <Trash2 className="size-4 text-green-600" /> Waste Report
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
                              <HandHeart className="size-4 mr-2" /> I Cleaned This Up
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
            
            <Card className="border-green-200 shadow-sm bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-400">
                  <Sprout className="size-5" />
                  Report Issue
                </CardTitle>
                <CardDescription>Spot a full bin or litter? Report it.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="p-3 bg-background rounded-md text-sm text-center border border-dashed mb-2">
                    {selectedLat ? (
                      <span className="text-green-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="size-4" /> Location Selected
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Click on the map to set location</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Issue Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overflowing_bin">Overflowing Bin</SelectItem>
                        <SelectItem value="mixed_waste">Mixed Waste</SelectItem>
                        <SelectItem value="litter">Litter / Street Trash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      className="bg-background"
                      placeholder="Next to the main park entrance..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    disabled={!selectedLat || createReport.isPending}
                  >
                    Submit & Earn Points
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col min-h-[300px]">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-lg">Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <div className="divide-y">
                  {reports?.map(report => (
                    <div key={report.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trash2 className="size-4 text-muted-foreground" />
                          <h4 className="font-semibold text-sm">{getTypeLabel(report.type)}</h4>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{report.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-muted-foreground">{format(new Date(report.createdAt), 'MMM d, h:mm a')}</span>
                        {report.ecoPointsAwarded && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                            +{report.ecoPointsAwarded} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!reports || reports.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No recent waste reports</div>
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
