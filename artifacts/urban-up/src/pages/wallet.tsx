import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetWallet,
  useGetLeaderboard,
  useRedeemPoints
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Wallet as WalletIcon, ArrowDownRight, ArrowUpRight,
  Gift, Leaf, Navigation, MapPin, ShieldAlert, Award,
  Zap, Route, Trash2, ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Driver level thresholds
const LEVELS = [
  { name: "Bronze",   min: 0,    max: 499  },
  { name: "Silver",   min: 500,  max: 1499 },
  { name: "Gold",     min: 1500, max: 3999 },
  { name: "Platinum", min: 4000, max: 9999 },
  { name: "Legend",   min: 10000, max: Infinity },
];

function getLevelInfo(pts: number) {
  const idx = LEVELS.findIndex((l) => pts >= l.min && pts <= l.max);
  const safe = idx === -1 ? LEVELS.length - 1 : idx;
  const current = LEVELS[safe];
  const next = LEVELS[safe + 1];
  const progress = next
    ? Math.round(((pts - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { current, next, progress, idx: safe };
}

const LEVEL_COLORS = ["#cd7f32", "#94a3b8", "#f59e0b", "#06b6d4", "#8b5cf6"];

const HOW_TO_EARN = [
  { icon: <Route className="size-4" />, labelKey: "altRouteEarn",        pts: 50,  color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
  { icon: <Trash2 className="size-4" />, labelKey: "reportGarbageEarn",  pts: 30,  color: "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" },
  { icon: <ShieldAlert className="size-4" />, labelKey: "clearObstacleEarn", pts: 15, color: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400" },
  { icon: <Leaf className="size-4" />,  labelKey: "cleanupEarn",         pts: 50,  color: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" },
] as const;

export default function WalletPage() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: leaderboard }                    = useGetLeaderboard();
  const redeemPoints                             = useRedeemPoints();

  const jawwal = wallet?.jawwalPoints ?? 0;
  const levelInfo = getLevelInfo(jawwal);

  const handleRedeem = (rewardId: number, cost: number, name: string) => {
    if (!wallet) return;
    if (wallet.jawwalPoints < cost) {
      toast({ title: t('insufficientPoints'), variant: "destructive" });
      return;
    }
    redeemPoints.mutate({ data: { rewardId } }, {
      onSuccess: () => {
        toast({
          title: t('rewardRedeemed'),
          description: `${t('checkEmail')} ${name}${t('checkEmailSuffix')}`,
          className: "bg-foreground text-background"
        });
        refetchWallet();
      }
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'traffic':       return <Navigation className="size-4" />;
      case 'waste':         return <Leaf className="size-4" />;
      case 'accessibility': return <ShieldAlert className="size-4" />;
      case 'tourism':       return <MapPin className="size-4" />;
      case 'redemption':    return <Gift className="size-4" />;
      default:              return <Award className="size-4" />;
    }
  };

  // Earning breakdown from transactions
  const earnByCategory: Record<string, number> = {};
  wallet?.transactions?.filter(tx => tx.type === "earn").forEach(tx => {
    earnByCategory[tx.category] = (earnByCategory[tx.category] ?? 0) + tx.points;
  });
  const totalEarnedLocal = wallet?.totalEarned ?? 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="p-3 bg-muted rounded-xl shrink-0">
            <WalletIcon className="size-8 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('walletTitle')}</h1>
            <p className="text-muted-foreground mt-1">{t('walletSub')}</p>
          </div>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jawwal Points — dark card */}
          <Card className="bg-foreground text-background border-none shadow-lg overflow-hidden relative md:col-span-1">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Trophy className="size-48" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className={cn("text-background/70 font-medium text-sm flex justify-between items-center", isRtl && "flex-row-reverse")}>
                {t('jawwalPointsLabel')}
                <Badge className="bg-background/20 text-background hover:bg-background/30 border-none">{t('available')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-black tracking-tight">{jawwal.toLocaleString()}</div>
              <p className="text-sm mt-2 text-background/70">{t('canRedeem')}</p>

              {/* Level progress bar */}
              <div className="mt-4 space-y-1">
                <div className={cn("flex justify-between text-xs", isRtl && "flex-row-reverse")}>
                  <span className="text-background/60">{t('levelProgress')}</span>
                  <span className="font-bold" style={{ color: LEVEL_COLORS[levelInfo.idx] }}>
                    {levelInfo.current.name}
                  </span>
                </div>
                <div className="h-2 bg-background/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${levelInfo.progress}%`,
                      backgroundColor: LEVEL_COLORS[levelInfo.idx],
                    }}
                  />
                </div>
                {levelInfo.next && (
                  <p className="text-background/50 text-[10px]">
                    {(levelInfo.next.min - jawwal).toLocaleString()} pts → {levelInfo.next.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Eco Points */}
          <Card className="bg-gradient-to-br from-emerald-500 to-green-700 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Leaf className="size-48" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className={cn("text-green-100 font-medium text-sm flex justify-between items-center", isRtl && "flex-row-reverse")}>
                {t('ecoPointsLabel2')}
                <Badge className="bg-black/20 text-white hover:bg-black/30 border-none">{t('lifetime')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-black tracking-tight">{(wallet?.ecoPoints ?? 0).toLocaleString()}</div>
              <p className="text-sm mt-2 text-green-100">{t('contribEcoLevel')}</p>
            </CardContent>
          </Card>

          {/* Earned / Spent + shortcut */}
          <div className="flex flex-col gap-3">
            <Card className="flex-1 flex flex-col justify-center px-6 py-4">
              <div className={cn("flex justify-between items-center", isRtl && "flex-row-reverse")}>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{t('totalEarned')}</p>
                  <p className={cn("text-2xl font-bold flex items-center gap-1 text-green-600 dark:text-green-400", isRtl && "flex-row-reverse")}>
                    <ArrowUpRight className="size-5" /> {(wallet?.totalEarned ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                  <Trophy className="size-5"/>
                </div>
              </div>
            </Card>
            <Card className="flex-1 flex flex-col justify-center px-6 py-4">
              <div className={cn("flex justify-between items-center", isRtl && "flex-row-reverse")}>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{t('totalSpent')}</p>
                  <p className={cn("text-2xl font-bold flex items-center gap-1 text-destructive", isRtl && "flex-row-reverse")}>
                    <ArrowDownRight className="size-5" /> {(wallet?.totalSpent ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                  <Gift className="size-5"/>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* How to earn + Earning breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How to earn */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <Zap className="size-4 text-yellow-500" />
                {t('howToEarn')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {HOW_TO_EARN.map((item) => (
                <div key={item.labelKey} className={cn("flex items-center justify-between gap-3", isRtl && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                    <div className={cn("p-2 rounded-lg shrink-0", item.color)}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </div>
                  <Badge variant="secondary" className="font-bold shrink-0">
                    +{item.pts} {t('ptsUnit')}
                  </Badge>
                </div>
              ))}
              <div className="pt-3 border-t">
                <Link href="/store">
                  <Button variant="outline" size="sm" className={cn("w-full gap-2", isRtl && "flex-row-reverse")}>
                    <ShoppingBag className="size-4" />
                    {t('navStore')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Earning breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-base", isRtl && "flex-row-reverse")}>
                <Award className="size-4 text-muted-foreground" />
                {t('earnBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(earnByCategory).length > 0 ? (
                Object.entries(earnByCategory).map(([cat, pts]) => (
                  <div key={cat}>
                    <div className={cn("flex justify-between text-sm mb-1.5", isRtl && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                        <div className="text-muted-foreground">{getCategoryIcon(cat)}</div>
                        <span className="capitalize font-medium">{cat}</span>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">+{pts}</span>
                    </div>
                    <Progress
                      value={totalEarnedLocal > 0 ? Math.round((pts / totalEarnedLocal) * 100) : 0}
                      className="h-1.5"
                    />
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <Award className="size-8 mx-auto mb-2 opacity-20" />
                  <p>{t('noTransactions')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rewards" className="mt-2" dir={isRtl ? "rtl" : "ltr"}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="rewards">{t('rewardsStore')}</TabsTrigger>
            <TabsTrigger value="history">{t('history')}</TabsTrigger>
            <TabsTrigger value="leaderboard">{t('leaderboard')}</TabsTrigger>
          </TabsList>

          {/* Rewards */}
          <TabsContent value="rewards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallet?.redeemableRewards?.filter(r => r.category !== "heritage").map((reward) => (
                <Card key={reward.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-2 border-transparent hover:border-border">
                  <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className={cn("flex justify-between items-start gap-2", isRtl && "flex-row-reverse")}>
                      <CardTitle className="text-lg leading-tight">{reward.name}</CardTitle>
                      <Badge variant="secondary" className="capitalize shrink-0">{reward.category}</Badge>
                    </div>
                    <CardDescription className="text-xs pt-2 line-clamp-2 min-h-[2rem]">{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4">
                    <div className={cn("flex items-end gap-1", isRtl && "flex-row-reverse")}>
                      <span className="text-3xl font-bold text-foreground">{reward.pointsCost}</span>
                      <span className="text-sm text-muted-foreground mb-1 font-medium">{t('ptsUnit')}</span>
                    </div>
                    <Button
                      className="w-full font-bold"
                      disabled={!reward.isAvailable || (wallet?.jawwalPoints || 0) < reward.pointsCost || redeemPoints.isPending}
                      onClick={() => handleRedeem(reward.id, reward.pointsCost, reward.name)}
                    >
                      {reward.isAvailable ? t('redeemNow') : t('outOfStock')}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Heritage store shortcut */}
              <Link href="/store">
                <Card className="flex flex-col items-center justify-center text-center h-full min-h-[200px] border-2 border-dashed hover:border-foreground/30 hover:shadow-md transition-all cursor-pointer bg-muted/20">
                  <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3">
                    <div className="text-5xl">🎲</div>
                    <div>
                      <p className="font-bold text-sm">{t('storeTitle')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('storeSub').slice(0, 60)}…</p>
                    </div>
                    <Badge variant="outline">{t('navStore')}</Badge>
                  </CardContent>
                </Card>
              </Link>

              {(!wallet?.redeemableRewards || wallet.redeemableRewards.filter(r => r.category !== "heritage").length === 0) && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Gift className="size-12 mx-auto mb-4 opacity-20" />
                  <p>{t('noRewardsAvailable')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('txHistory')}</CardTitle>
                <CardDescription>{t('txHistorySub')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {wallet?.transactions?.map((tx) => (
                    <div key={tx.id} className={cn("flex items-center justify-between py-4", isRtl && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                        <div className={`p-2 rounded-full ${tx.type === 'earn' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                          {getCategoryIcon(tx.category)}
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground capitalize">{tx.category} • {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                      <div className={`font-bold ${tx.type === 'earn' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.points}
                      </div>
                    </div>
                  ))}
                  {(!wallet?.transactions || wallet.transactions.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground text-sm">{t('noTransactions')}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <Trophy className="size-5 text-yellow-500" />
                  {t('cityChampions')}
                </CardTitle>
                <CardDescription>{t('topContributors')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn("w-[80px]", isRtl && "text-right")}>{t('rank')}</TableHead>
                      <TableHead className={isRtl ? "text-right" : ""}>{t('citizen')}</TableHead>
                      <TableHead className={isRtl ? "text-right" : ""}>{t('level')}</TableHead>
                      <TableHead className={cn("text-right")}>{t('reports')}</TableHead>
                      <TableHead className={cn("text-right")}>{t('points')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard?.map((entry) => (
                      <TableRow key={entry.username} className={entry.rank <= 3 ? "bg-muted/30" : ""}>
                        <TableCell className="font-bold">
                          {entry.rank === 1 ? <Trophy className="size-5 text-yellow-500" /> :
                           entry.rank === 2 ? <Trophy className="size-5 text-gray-400" /> :
                           entry.rank === 3 ? <Trophy className="size-5 text-orange-700" /> :
                           `#${entry.rank}`}
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                            <Avatar className="size-8">
                              <AvatarFallback className={entry.rank === 1 ? "bg-foreground text-background" : ""}>
                                {entry.avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{entry.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: LEVEL_COLORS[getLevelInfo(entry.jawwalPoints).idx], color: LEVEL_COLORS[getLevelInfo(entry.jawwalPoints).idx] }}>
                            {getLevelInfo(entry.jawwalPoints).current.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{entry.totalReports}</TableCell>
                        <TableCell className="text-right font-bold">{entry.jawwalPoints.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
