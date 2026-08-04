import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Star, Coins, CheckCircle2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface HeritageItem {
  id: number;
  name: string;
  pointsCost: number;
  category: string;
  description: string;
  isAvailable: boolean;
}
interface StoreData {
  userPoints: number;
  items: HeritageItem[];
}

// Visual config per item name / category
const ITEM_VISUALS: Record<string, { emoji: string; accent: string; tag?: string }> = {
  "Palestine Monopoly":         { emoji: "🎲", accent: "from-emerald-600 to-teal-700",   tag: "featured" },
  "Traditional Keffiyeh Set":   { emoji: "🧣", accent: "from-slate-700 to-gray-800",     tag: "heritage" },
  "Palestinian Embroidery Kit": { emoji: "🧵", accent: "from-rose-600 to-pink-700" },
  "Hebron Blown Glass Vase":    { emoji: "🏺", accent: "from-blue-600 to-indigo-700" },
  "Za'atar & Olive Oil Gift Box":{ emoji: "🫒", accent: "from-lime-600 to-green-700" },
  "Ramallah City Art Print":    { emoji: "🗺️", accent: "from-amber-600 to-orange-700" },
  "Ceramic Mosaic Coaster Set": { emoji: "🔷", accent: "from-cyan-600 to-sky-700" },
  "Muftool Backgammon Board":   { emoji: "♟️", accent: "from-yellow-700 to-amber-800",   tag: "artisan" },
};

const CATEGORY_LABELS: Record<string, string> = {
  boardGames: "Board Games",
  textiles: "Textiles",
  artPrints: "Art & Prints",
  foodGifts: "Food & Gifts",
  all: "All Items",
};

const CATEGORY_MAP: Record<string, string[]> = {
  all: [],
  boardGames: ["Palestine Monopoly", "Muftool Backgammon Board"],
  textiles: ["Traditional Keffiyeh Set", "Palestinian Embroidery Kit"],
  artPrints: ["Ramallah City Art Print", "Ceramic Mosaic Coaster Set", "Hebron Blown Glass Vase"],
  foodGifts: ["Za'atar & Olive Oil Gift Box"],
};

export default function StorePage() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<HeritageItem | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery<StoreData>({
    queryKey: ["heritage-store"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/store/heritage`);
      return r.json();
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const r = await fetch(`${BASE}/api/store/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Failed to redeem");
      }
      return r.json();
    },
    onSuccess: (_data, itemId) => {
      setRedeemedIds((prev) => new Set([...prev, itemId]));
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["heritage-store"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast({
        title: t("itemRedeemed"),
        description: t("itemRedeemedDesc"),
        className: "bg-foreground text-background",
      });
    },
    onError: (err: Error) => {
      setSelectedItem(null);
      toast({
        title: err.message === "Insufficient Jawwal Points" ? t("insufficientPoints") : err.message,
        variant: "destructive",
      });
    },
  });

  const filteredItems = (data?.items ?? []).filter((item) => {
    if (activeCategory === "all") return true;
    return CATEGORY_MAP[activeCategory]?.includes(item.name);
  });

  // Palestine Monopoly is always featured first
  const featured = filteredItems.find((i) => i.name === "Palestine Monopoly");
  const rest = filteredItems.filter((i) => i.name !== "Palestine Monopoly");

  const userPoints = data?.userPoints ?? 0;

  const canAfford = (cost: number) => userPoints >= cost;

  const getVisual = (name: string) =>
    ITEM_VISUALS[name] ?? { emoji: "🎁", accent: "from-gray-600 to-gray-700" };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
        {/* Page header */}
        <div className={cn("flex items-start justify-between gap-4 flex-wrap", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
            <div className="p-3 bg-muted rounded-xl shrink-0">
              <ShoppingBag className="size-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("storeTitle")}</h1>
              <p className="text-muted-foreground mt-1">{t("storeSub")}</p>
            </div>
          </div>

          {/* Points balance */}
          <Card className="bg-foreground text-background border-none shadow-lg shrink-0">
            <CardContent className="flex items-center gap-3 px-5 py-3">
              <Coins className="size-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs text-background/60 font-medium">{t("yourPoints")}</p>
                <p className="text-2xl font-black leading-none">{userPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category tabs */}
        <div className={cn("flex gap-2 flex-wrap", isRtl && "flex-row-reverse")}>
          {Object.keys(CATEGORY_MAP).map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? t("allCategories") : cat === "boardGames" ? t("boardGames") : cat === "textiles" ? t("textiles") : cat === "artPrints" ? t("artPrints") : cat === "foodGifts" ? t("foodGifts") : cat}
            </Button>
          ))}
        </div>

        {/* Featured item — Palestine Monopoly */}
        {featured && activeCategory === "all" && (
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <div className={`bg-gradient-to-r ${getVisual(featured.name).accent} p-8 md:p-10`}>
              <div className={cn("flex flex-col md:flex-row items-center gap-8", isRtl && "md:flex-row-reverse")}>
                {/* Emoji / art */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="text-9xl drop-shadow-2xl select-none">🎲</div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 font-bold text-xs">
                      ⭐ {t("featuredItem")}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20 text-xs">
                      {t("limitedEd")}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className={cn("flex-1 text-white", isRtl && "text-right")}>
                  <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">
                    Palestinian Heritage
                  </p>
                  <h2 className="text-4xl font-black leading-tight mb-3">Palestine Monopoly</h2>
                  <p className="text-white/80 text-base leading-relaxed mb-6 max-w-lg">
                    {featured.description}
                  </p>

                  <div className={cn("flex items-end gap-6 flex-wrap", isRtl && "flex-row-reverse")}>
                    <div>
                      <p className="text-white/60 text-xs font-medium mb-1">{t("redeemItem")}</p>
                      <div className={cn("flex items-baseline gap-1", isRtl && "flex-row-reverse")}>
                        <span className="text-5xl font-black">{featured.pointsCost.toLocaleString()}</span>
                        <span className="text-white/70 font-semibold">{t("ptsUnit")}</span>
                      </div>
                      {!canAfford(featured.pointsCost) && (
                        <p className="text-yellow-300 text-xs mt-1">
                          {(featured.pointsCost - userPoints).toLocaleString()} {t("ptsNeeded")}
                        </p>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className={cn(
                        "font-bold px-8 shadow-lg",
                        canAfford(featured.pointsCost)
                          ? "bg-white text-gray-900 hover:bg-white/90"
                          : "bg-white/20 text-white/60 cursor-not-allowed"
                      )}
                      disabled={!canAfford(featured.pointsCost) || redeemedIds.has(featured.id)}
                      onClick={() => setSelectedItem(featured)}
                    >
                      {redeemedIds.has(featured.id) ? (
                        <><CheckCircle2 className="size-4 me-2" /> Redeemed</>
                      ) : canAfford(featured.pointsCost) ? (
                        t("redeemNow")
                      ) : (
                        t("notEnoughPts")
                      )}
                    </Button>
                  </div>

                  {canAfford(featured.pointsCost) && (
                    <p className="text-white/50 text-xs mt-3">
                      {t("balanceAfter")} {(userPoints - featured.pointsCost).toLocaleString()} {t("ptsUnit")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All other items grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-32 bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-8 bg-muted rounded mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            {(activeCategory !== "all" && filteredItems.length > 0) || rest.length > 0 ? (
              <>
                {activeCategory === "all" && (
                  <h2 className={cn("text-lg font-bold mb-4 flex items-center gap-2", isRtl && "flex-row-reverse")}>
                    <Package className="size-5 text-muted-foreground" />
                    {t("heritageItems")}
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(activeCategory === "all" ? rest : filteredItems).map((item) => {
                    const vis = getVisual(item.name);
                    const affordable = canAfford(item.pointsCost);
                    const redeemed = redeemedIds.has(item.id);

                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "overflow-hidden flex flex-col transition-all duration-200 border-2",
                          affordable && !redeemed
                            ? "hover:shadow-lg hover:border-foreground/20 cursor-pointer"
                            : "opacity-80"
                        )}
                      >
                        {/* Card header gradient */}
                        <div className={`bg-gradient-to-br ${vis.accent} p-6 relative`}>
                          <div className="text-6xl text-center drop-shadow-lg select-none">{vis.emoji}</div>
                          {vis.tag && (
                            <Badge className="absolute top-3 end-3 bg-white/20 text-white border-white/30 text-[10px] capitalize hover:bg-white/20">
                              {vis.tag}
                            </Badge>
                          )}
                        </div>

                        <CardHeader className="pb-2 pt-4">
                          <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                            <CardTitle className="text-base leading-tight">{item.name}</CardTitle>
                            <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                              {item.isAvailable ? t("inStock") : t("outOfStock")}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs mt-1 line-clamp-2">{item.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0 pb-4 px-6 flex-1 flex flex-col justify-end gap-3">
                          <div className={cn("flex items-baseline gap-1", isRtl && "flex-row-reverse")}>
                            <span className={cn("text-3xl font-black", affordable ? "text-foreground" : "text-muted-foreground")}>
                              {item.pointsCost.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">{t("ptsUnit")}</span>
                          </div>

                          {!affordable && (
                            <p className="text-xs text-muted-foreground">
                              {(item.pointsCost - userPoints).toLocaleString()} {t("ptsNeeded")}
                            </p>
                          )}

                          <Button
                            className="w-full font-bold"
                            disabled={!item.isAvailable || !affordable || redeemed || redeemMutation.isPending}
                            variant={affordable && !redeemed ? "default" : "secondary"}
                            onClick={() => setSelectedItem(item)}
                          >
                            {redeemed ? (
                              <><CheckCircle2 className="size-4 me-2" /> Redeemed</>
                            ) : item.isAvailable ? (
                              affordable ? t("redeemNow") : t("notEnoughPts")
                            ) : (
                              t("outOfStock")
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <ShoppingBag className="size-12 mx-auto mb-4 opacity-20" />
                <p>{t("noRewardsAvailable")}</p>
              </div>
            )}
          </div>
        )}

        {/* Confirm dialog */}
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("confirmRedeem")}</DialogTitle>
              <DialogDescription>
                {t("confirmRedeemDesc")}{" "}
                <span className="font-bold text-foreground">"{selectedItem?.name}"</span>{" "}
                {t("confirmRedeemFor")}{" "}
                <span className="font-bold text-foreground">
                  {selectedItem?.pointsCost.toLocaleString()}
                </span>{" "}
                {t("confirmRedeemPts")}
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="my-2 p-3 bg-muted rounded-lg text-sm">
                <div className={cn("flex justify-between", isRtl && "flex-row-reverse")}>
                  <span className="text-muted-foreground">{t("yourPoints")}</span>
                  <span className="font-bold">{userPoints.toLocaleString()}</span>
                </div>
                <div className={cn("flex justify-between text-destructive mt-1", isRtl && "flex-row-reverse")}>
                  <span>{t("redeemItem")}</span>
                  <span className="font-bold">−{selectedItem.pointsCost.toLocaleString()}</span>
                </div>
                <div className={cn("flex justify-between border-t mt-2 pt-2 font-bold", isRtl && "flex-row-reverse")}>
                  <span>{t("balanceAfter")}</span>
                  <span>{(userPoints - selectedItem.pointsCost).toLocaleString()}</span>
                </div>
              </div>
            )}
            <DialogFooter className={cn("gap-2", isRtl && "flex-row-reverse")}>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                {t("cancelBtn")}
              </Button>
              <Button
                onClick={() => selectedItem && redeemMutation.mutate(selectedItem.id)}
                disabled={redeemMutation.isPending}
              >
                {redeemMutation.isPending ? "…" : t("confirmBtn")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
