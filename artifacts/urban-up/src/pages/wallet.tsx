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
import { Trophy, Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, Gift, Leaf, Navigation, MapPin, ShieldAlert, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: leaderboard }                    = useGetLeaderboard();
  const redeemPoints                             = useRedeemPoints();

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
          <Card className="bg-foreground text-background border-none shadow-lg overflow-hidden relative">
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
              <div className="text-5xl font-black tracking-tight">{wallet?.jawwalPoints || 0}</div>
              <p className="text-sm mt-2 text-background/70">{t('canRedeem')}</p>
            </CardContent>
          </Card>

          {/* Eco Points — green card */}
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
              <div className="text-5xl font-black tracking-tight">{wallet?.ecoPoints || 0}</div>
              <p className="text-sm mt-2 text-green-100">{t('contribEcoLevel')}</p>
            </CardContent>
          </Card>

          {/* Earned / Spent */}
          <div className="flex flex-col gap-4">
            <Card className="flex-1 flex flex-col justify-center px-6 py-4">
              <div className={cn("flex justify-between items-center", isRtl && "flex-row-reverse")}>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{t('totalEarned')}</p>
                  <p className={cn("text-2xl font-bold flex items-center gap-1 text-green-600 dark:text-green-400", isRtl && "flex-row-reverse")}>
                    <ArrowUpRight className="size-5" /> {wallet?.totalEarned || 0}
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
                    <ArrowDownRight className="size-5" /> {wallet?.totalSpent || 0}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                  <Gift className="size-5"/>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rewards" className="mt-4" dir={isRtl ? "rtl" : "ltr"}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="rewards">{t('rewardsStore')}</TabsTrigger>
            <TabsTrigger value="history">{t('history')}</TabsTrigger>
            <TabsTrigger value="leaderboard">{t('leaderboard')}</TabsTrigger>
          </TabsList>

          {/* Rewards */}
          <TabsContent value="rewards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallet?.redeemableRewards?.map((reward) => (
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
              {(!wallet?.redeemableRewards || wallet.redeemableRewards.length === 0) && (
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
                        <TableCell><Badge variant="outline">{entry.driverLevel}</Badge></TableCell>
                        <TableCell className="text-right">{entry.totalReports}</TableCell>
                        <TableCell className="text-right font-bold">{entry.jawwalPoints}</TableCell>
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
