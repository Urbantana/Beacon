import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2, AlertTriangle, RefreshCw, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface WastePoint {
  id: number; lat: number; lng: number;
  type: string; status: string;
  description: string; createdAt: string;
}
interface ObstaclePoint {
  id: number; lat: number; lng: number;
  severity: string; obstacleType: string;
  description: string; createdAt: string;
}
interface HeatmapData {
  waste: {
    points: WastePoint[];
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    total: number;
  };
  obstacles: {
    points: ObstaclePoint[];
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    total: number;
  };
}

const WASTE_COLORS: Record<string, string> = {
  overflowing_bin: "#ef4444",
  mixed_waste: "#f97316",
  litter: "#eab308",
  other: "#8b5cf6",
};

const OBSTACLE_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#22c55e",
};

const STATUS_OPACITY: Record<string, number> = {
  pending: 0.85,
  in_progress: 0.65,
  resolved: 0.3,
};

function MapFitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  if (points.length > 0) {
    // just keep default center; no auto-fit to avoid re-renders
  }
  return null;
}

export default function MunicipalityPage() {
  const { t, isRtl } = useI18n();
  const [activeLayer, setActiveLayer] = useState<"waste" | "obstacles">("waste");
  const [wasteFilter, setWasteFilter] = useState<string>("all");

  const { data, isLoading, refetch, isFetching } = useQuery<HeatmapData>({
    queryKey: ["municipality-heatmap"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/municipality/heatmap`);
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const filteredWaste = (data?.waste.points ?? []).filter(
    (p) => wasteFilter === "all" || p.status === wasteFilter
  );

  const statCards = [
    {
      label: t("totalWaste"),
      value: data?.waste.total ?? 0,
      icon: <Trash2 className="size-5" />,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      label: t("pendingWasteCount"),
      value: data?.waste.byStatus["pending"] ?? 0,
      icon: <Trash2 className="size-5" />,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
    {
      label: t("resolvedWaste"),
      value: data?.waste.byStatus["resolved"] ?? 0,
      icon: <Trash2 className="size-5" />,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/20",
    },
    {
      label: t("totalObstacles"),
      value: data?.obstacles.total ?? 0,
      icon: <AlertTriangle className="size-5" />,
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      label: t("highSeverityObs"),
      value: data?.obstacles.bySeverity["high"] ?? 0,
      icon: <AlertTriangle className="size-5" />,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className={cn("flex items-center justify-between gap-3 flex-wrap", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
            <div className="p-3 bg-muted rounded-xl shrink-0">
              <Building2 className="size-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("municipalityTitle")}</h1>
              <p className="text-muted-foreground mt-1">{t("municipalitySub")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn("gap-2", isRtl && "flex-row-reverse")}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            {t("muniRefresh")}
          </Button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className={cn(`inline-flex p-2 rounded-lg mb-3 ${s.bg} ${s.color}`)}>
                  {s.icon}
                </div>
                <div className="text-2xl font-black">{isLoading ? "—" : s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Layer toggle */}
        <div className={cn("flex items-center gap-3 flex-wrap", isRtl && "flex-row-reverse")}>
          <Button
            variant={activeLayer === "waste" ? "default" : "outline"}
            onClick={() => setActiveLayer("waste")}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            {t("wasteHeatmap")}
          </Button>
          <Button
            variant={activeLayer === "obstacles" ? "default" : "outline"}
            onClick={() => setActiveLayer("obstacles")}
            className="gap-2"
          >
            <AlertTriangle className="size-4" />
            {t("obstacleHeatmap")}
          </Button>

          {activeLayer === "waste" && (
            <div className={cn("flex gap-2 ms-auto flex-wrap", isRtl && "me-auto ms-0")}>
              {["all", "pending", "in_progress", "resolved"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={wasteFilter === s ? "secondary" : "ghost"}
                  onClick={() => setWasteFilter(s)}
                  className="text-xs capitalize"
                >
                  {s === "all" ? t("allStatus") : s === "pending" ? t("pending") : s === "in_progress" ? t("inProgress") : t("resolved")}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <Card className="lg:col-span-3 overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className={cn("text-base flex items-center gap-2", isRtl && "flex-row-reverse")}>
                {activeLayer === "waste" ? <Trash2 className="size-4 text-orange-500" /> : <AlertTriangle className="size-4 text-yellow-500" />}
                {activeLayer === "waste" ? t("wasteHeatmap") : t("obstacleHeatmap")}
                <Badge variant="secondary" className="ms-auto">
                  {activeLayer === "waste" ? filteredWaste.length : (data?.obstacles.points.length ?? 0)} {t("reports")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: 480 }}>
                <MapContainer
                  center={[31.9, 35.2]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {activeLayer === "waste" &&
                    filteredWaste.map((p) => (
                      <CircleMarker
                        key={p.id}
                        center={[p.lat, p.lng]}
                        radius={22}
                        pathOptions={{
                          color: WASTE_COLORS[p.type] ?? "#6b7280",
                          fillColor: WASTE_COLORS[p.type] ?? "#6b7280",
                          fillOpacity: STATUS_OPACITY[p.status] ?? 0.5,
                          weight: 2,
                          opacity: 0.9,
                        }}
                      >
                        <Popup>
                          <div className="text-sm space-y-1 min-w-[160px]">
                            <p className="font-bold capitalize">{p.type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-gray-500">{p.description || "—"}</p>
                            <Badge className="text-xs capitalize">{p.status}</Badge>
                            <p className="text-xs text-gray-400">{format(new Date(p.createdAt), "MMM d, h:mm a")}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                  {/* Glow inner circle for waste */}
                  {activeLayer === "waste" &&
                    filteredWaste.map((p) => (
                      <CircleMarker
                        key={`inner-${p.id}`}
                        center={[p.lat, p.lng]}
                        radius={10}
                        pathOptions={{
                          color: "transparent",
                          fillColor: WASTE_COLORS[p.type] ?? "#6b7280",
                          fillOpacity: 0.9,
                          weight: 0,
                        }}
                      />
                    ))}

                  {activeLayer === "obstacles" &&
                    (data?.obstacles.points ?? []).map((o) => (
                      <CircleMarker
                        key={o.id}
                        center={[o.lat, o.lng]}
                        radius={o.severity === "high" ? 26 : o.severity === "medium" ? 20 : 14}
                        pathOptions={{
                          color: OBSTACLE_COLORS[o.severity] ?? "#6b7280",
                          fillColor: OBSTACLE_COLORS[o.severity] ?? "#6b7280",
                          fillOpacity: o.severity === "high" ? 0.75 : 0.55,
                          weight: 2,
                          opacity: 0.95,
                        }}
                      >
                        <Popup>
                          <div className="text-sm space-y-1 min-w-[160px]">
                            <p className="font-bold capitalize">{o.obstacleType.replace(/_/g, " ")}</p>
                            <p className="text-xs text-gray-500">{o.description || "—"}</p>
                            <Badge
                              className={cn(
                                "text-xs capitalize",
                                o.severity === "high" ? "bg-red-500 text-white" :
                                o.severity === "medium" ? "bg-orange-500 text-white" :
                                "bg-green-500 text-white"
                              )}
                            >
                              {o.severity}
                            </Badge>
                            <p className="text-xs text-gray-400">{format(new Date(o.createdAt), "MMM d, h:mm a")}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                  {/* Glow inner for obstacles */}
                  {activeLayer === "obstacles" &&
                    (data?.obstacles.points ?? []).map((o) => (
                      <CircleMarker
                        key={`inner-obs-${o.id}`}
                        center={[o.lat, o.lng]}
                        radius={6}
                        pathOptions={{
                          color: "white",
                          fillColor: "white",
                          fillOpacity: 0.9,
                          weight: 0,
                        }}
                      />
                    ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar stats */}
          <div className="flex flex-col gap-4">
            {/* Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("heatmapLegend")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeLayer === "waste" ? (
                  Object.entries(WASTE_COLORS).map(([type, color]) => (
                    <div key={type} className={cn("flex items-center gap-2 text-xs", isRtl && "flex-row-reverse")}>
                      <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="capitalize text-muted-foreground">{type.replace(/_/g, " ")}</span>
                    </div>
                  ))
                ) : (
                  Object.entries(OBSTACLE_COLORS).map(([sev, color]) => (
                    <div key={sev} className={cn("flex items-center gap-2 text-xs", isRtl && "flex-row-reverse")}>
                      <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="capitalize text-muted-foreground">{sev} severity</span>
                    </div>
                  ))
                )}
                {activeLayer === "waste" && (
                  <div className="pt-2 border-t space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Opacity = Status</p>
                    {[{ s: "pending", label: "Pending (full)" }, { s: "in_progress", label: "In Progress" }, { s: "resolved", label: "Resolved (faded)" }].map(({ s, label }) => (
                      <div key={s} className={cn("flex items-center gap-2 text-xs", isRtl && "flex-row-reverse")}>
                        <div className="size-3 rounded-full shrink-0 bg-orange-500" style={{ opacity: STATUS_OPACITY[s] }} />
                        <span className="text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Type breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {activeLayer === "waste" ? t("byWasteType") : t("byObstacleSev")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeLayer === "waste" ? (
                  Object.entries(data?.waste.byType ?? {}).length > 0
                    ? Object.entries(data!.waste.byType).map(([type, count]) => (
                        <div key={type}>
                          <div className={cn("flex justify-between text-xs mb-1", isRtl && "flex-row-reverse")}>
                            <span className="capitalize text-muted-foreground">{type.replace(/_/g, " ")}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.round((count / (data?.waste.total || 1)) * 100)}%`,
                                backgroundColor: WASTE_COLORS[type] ?? "#6b7280",
                              }}
                            />
                          </div>
                        </div>
                      ))
                    : <p className="text-xs text-muted-foreground">{t("noDataYet")}</p>
                ) : (
                  Object.entries(data?.obstacles.bySeverity ?? {}).length > 0
                    ? Object.entries(data!.obstacles.bySeverity).map(([sev, count]) => (
                        <div key={sev}>
                          <div className={cn("flex justify-between text-xs mb-1", isRtl && "flex-row-reverse")}>
                            <span className="capitalize text-muted-foreground">{sev}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.round((count / (data?.obstacles.total || 1)) * 100)}%`,
                                backgroundColor: OBSTACLE_COLORS[sev] ?? "#6b7280",
                              }}
                            />
                          </div>
                        </div>
                      ))
                    : <p className="text-xs text-muted-foreground">{t("noDataYet")}</p>
                )}
              </CardContent>
            </Card>

            {/* Recent list */}
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {activeLayer === "waste" ? t("recentReports") : t("obstacleStats")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeLayer === "waste"
                    ? filteredWaste.slice(0, 6).map((p) => (
                        <div key={p.id} className={cn("flex items-center gap-2 text-xs", isRtl && "flex-row-reverse")}>
                          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: WASTE_COLORS[p.type] ?? "#6b7280" }} />
                          <span className="capitalize text-muted-foreground flex-1 truncate">{p.type.replace(/_/g, " ")}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{p.status}</Badge>
                        </div>
                      ))
                    : (data?.obstacles.points ?? []).slice(0, 6).map((o) => (
                        <div key={o.id} className={cn("flex items-center gap-2 text-xs", isRtl && "flex-row-reverse")}>
                          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: OBSTACLE_COLORS[o.severity] ?? "#6b7280" }} />
                          <span className="capitalize text-muted-foreground flex-1 truncate">{o.obstacleType.replace(/_/g, " ")}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{o.severity}</Badge>
                        </div>
                      ))
                  }
                  {((activeLayer === "waste" ? filteredWaste : data?.obstacles.points ?? []).length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">{t("noDataYet")}</p>
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
