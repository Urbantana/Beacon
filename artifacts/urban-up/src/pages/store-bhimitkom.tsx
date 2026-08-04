import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Heart, Award, ExternalLink, User, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface StoreItem {
  id: number; name: string; nameAr?: string;
  description: string; descriptionAr?: string;
  category: string; pointsCost: number;
  imageEmoji?: string; imageUrl?: string; isAvailable: boolean;
  creatorStory?: string; creatorStoryAr?: string;
  creatorName?: string; creatorNameAr?: string;
}

const BHIMITKOM_CREATORS = [
  { emoji: "🪡", skill: "Embroidery (Tatreez)",       skillAr: "التطريز (تاتريز)"      },
  { emoji: "🏺", skill: "Ceramics & Pottery",         skillAr: "الخزف والفخار"           },
  { emoji: "🎨", skill: "Graphic Design",             skillAr: "التصميم الجرافيكي"      },
  { emoji: "📷", skill: "Photography & Editing",      skillAr: "التصوير والمونتاج"       },
  { emoji: "✍️", skill: "Proofreading & Translation", skillAr: "التدقيق اللغوي والترجمة" },
];

export default function BhimitkomStorePage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  const { data: bhimitkomItems = [], isLoading } = useQuery<StoreItem[]>({
    queryKey: ["store-bhimitkom"],
    queryFn: () => fetch(`${BASE}/api/store/bhimitkom`).then(r => r.json()),
  });

  const { data: wallet } = useQuery<{ jawwalPoints: number }>({
    queryKey: ["wallet-balance"],
    queryFn: () => fetch(`${BASE}/api/points/wallet`).then(r => r.json()),
  });

  const redeemMutation = useMutation({
    mutationFn: (itemId: number) => fetch(`${BASE}/api/store/redeem`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setSelectedItem(null);
      toast({ title: t("🛍️ Order Placed!", "🛍️ تم تقديم الطلب!"), description: t("Your item will be prepared by the creator.", "سيتم تحضير منتجك من قبل المنشئ.") });
    },
    onError: (err: any) => toast({ title: t("Not enough points", "نقاط غير كافية"), description: err?.error ?? "", variant: "destructive" }),
  });

  const canAfford = (item: StoreItem) => (wallet?.jawwalPoints ?? 0) >= item.pointsCost;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-3xl">🛍️</span>
            {t("Bhimitkom Store", "متجر بهمتكم")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Handmade products by talented youth with disabilities — each purchase supports their livelihood.",
               "منتجات يدوية من الشباب الموهوب ذوي الإعاقة — كل عملية شراء تدعم رزقهم.")}
          </p>
        </div>

        {/* Mission banner */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-900/20 dark:to-amber-900/10 border border-rose-200 dark:border-rose-800/50 p-5">
          <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse")}>
            <Heart className="size-8 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-base">{t("Every Product Has a Story", "كل منتج له قصة")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("These products are crafted by Bhimitkom graduates — youth with disabilities who completed vocational training in ceramics, embroidery, graphic design, photography, and more.",
                   "صُنعت هذه المنتجات من قِبَل خريجي بهمتكم — شباب من ذوي الإعاقة أتمّوا التدريب المهني في الخزف والتطريز والتصميم الجرافيكي والتصوير وغيرها.")}
              </p>
              <div className={cn("flex gap-2 mt-3 flex-wrap", isRtl && "justify-end")}>
                <a href="https://bhimitkom.ps" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs"><ExternalLink className="size-3" />{t("About Bhimitkom", "عن بهمتكم")}</Button>
                </a>
                <Link href="/bhimitkom">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Star className="size-3" />{t("Our Story", "قصتنا")}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Skills represented */}
        <div>
          <h3 className={cn("text-sm font-medium text-muted-foreground mb-3", isRtl && "text-right")}>{t("Skills represented in this store:", "المهارات الممثلة في هذا المتجر:")}</h3>
          <div className={cn("flex gap-2 flex-wrap", isRtl && "flex-row-reverse")}>
            {BHIMITKOM_CREATORS.map(c => (
              <Badge key={c.skill} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                {c.emoji} {lang === "ar" ? c.skillAr : c.skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Points balance */}
        {wallet && (
          <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
            <Award className="size-4 text-amber-500" />
            <span className="text-muted-foreground">{t("Your balance:", "رصيدك:")}</span>
            <span className="font-bold text-amber-600">{(wallet?.jawwalPoints ?? 0).toLocaleString()} {t("pts", "نقطة")}</span>
          </div>
        )}

        {/* Items grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : bhimitkomItems.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">{t("No products available yet — check back soon!", "لا توجد منتجات متاحة بعد — تحقق مرة أخرى قريبًا!")}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bhimitkomItems.map(item => (
              <Card key={item.id} className={cn(
                "flex flex-col hover:shadow-md transition-shadow cursor-pointer",
                !item.isAvailable && "opacity-60"
              )} onClick={() => item.isAvailable && setSelectedItem(item)}>
                <CardContent className="p-5 flex flex-col gap-3 flex-1">
                  {/* Emoji / image */}
                  <div className="w-full h-28 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-6xl">
                    {(item as any).imageEmoji ?? "🎁"}
                  </div>

                  {/* Title + badge */}
                  <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                    <h3 className="font-bold text-sm">{lang === "ar" && item.nameAr ? item.nameAr : item.name}</h3>
                    {!item.isAvailable && <Badge variant="outline" className="text-xs shrink-0">{t("Out of Stock", "نفذت الكمية")}</Badge>}
                  </div>

                  {/* Description */}
                  <p className={cn("text-xs text-muted-foreground line-clamp-2 flex-1", isRtl && "text-right")}>
                    {lang === "ar" && item.descriptionAr ? item.descriptionAr : item.description}
                  </p>

                  {/* Creator story snippet */}
                  {(item as any).creatorName && (
                    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-2", isRtl && "flex-row-reverse")}>
                      <User className="size-3 shrink-0 text-primary" />
                      <span className="italic">
                        {t("By", "بواسطة")} {lang === "ar" && (item as any).creatorNameAr ? (item as any).creatorNameAr : (item as any).creatorName}
                      </span>
                    </div>
                  )}

                  {/* Price + action */}
                  <div className={cn("flex items-center justify-between gap-2 pt-1", isRtl && "flex-row-reverse")}>
                    <span className={cn("font-bold text-lg", canAfford(item) ? "text-primary" : "text-muted-foreground")}>
                      {item.pointsCost.toLocaleString()} <span className="text-xs font-normal">{t("pts", "نقطة")}</span>
                    </span>
                    <Button size="sm" disabled={!item.isAvailable || !canAfford(item)} className="gap-1.5 text-xs">
                      <ShoppingBag className="size-3.5" />
                      {!canAfford(item) ? t("Need more pts", "تحتاج نقاطًا") : t("Redeem", "استبدل")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA to regular store */}
        <div className={cn("text-center py-4", isRtl && "text-right")}>
          <p className="text-sm text-muted-foreground mb-2">{t("Looking for more heritage products?", "تبحث عن المزيد من المنتجات التراثية؟")}</p>
          <Link href="/store">
            <Button variant="outline" size="sm" className="gap-2">
              <ShoppingBag className="size-4" />{t("View Heritage Store", "عرض متجر التراث")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Redeem dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Confirm Redemption", "تأكيد الاستبدال")}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
              <div className="text-center py-3">
                <div className="text-5xl mb-3">{(selectedItem as any).imageEmoji ?? "🎁"}</div>
                <h3 className="font-bold text-lg">{lang === "ar" && selectedItem.nameAr ? selectedItem.nameAr : selectedItem.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {lang === "ar" && selectedItem.descriptionAr ? selectedItem.descriptionAr : selectedItem.description}
              </p>
              {(selectedItem as any).creatorStory && (
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs font-medium mb-1">💬 {t("Creator Story", "قصة المنشئ")}</p>
                  <p className="text-xs text-muted-foreground italic">
                    {lang === "ar" && (selectedItem as any).creatorStoryAr ? (selectedItem as any).creatorStoryAr : (selectedItem as any).creatorStory}
                  </p>
                </div>
              )}
              <div className={cn("flex items-center justify-between border rounded-xl p-3", isRtl && "flex-row-reverse")}>
                <span className="text-sm text-muted-foreground">{t("Cost", "التكلفة")}</span>
                <span className="font-bold text-primary">{selectedItem.pointsCost.toLocaleString()} {t("pts", "نقطة")}</span>
              </div>
              <div className={cn("flex items-center justify-between border rounded-xl p-3", isRtl && "flex-row-reverse")}>
                <span className="text-sm text-muted-foreground">{t("Balance after", "الرصيد بعد")}</span>
                <span className="font-semibold">{((wallet?.jawwalPoints ?? 0) - selectedItem.pointsCost).toLocaleString()} {t("pts", "نقطة")}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t("Your order supports a youth entrepreneur with disabilities. Item will be prepared and delivered within 7 business days.",
                   "طلبك يدعم رائد أعمال شاب من ذوي الإعاقة. سيتم تحضير المنتج وتسليمه خلال 7 أيام عمل.")}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>{t("Cancel", "إلغاء")}</Button>
            <Button onClick={() => selectedItem && redeemMutation.mutate(selectedItem.id)} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? t("Processing…", "جارٍ…") : t("Confirm & Redeem", "تأكيد الاستبدال")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
