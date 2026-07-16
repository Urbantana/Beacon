import { useEffect } from "react";
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

export default function WalletPage() {
  const { toast } = useToast();
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: leaderboard } = useGetLeaderboard();
  const redeemPoints = useRedeemPoints();

  const handleRedeem = (rewardId: number, cost: number, name: string) => {
    if (!wallet) return;
    if (wallet.jawwalPoints < cost) {
      toast({ title: "Insufficient points", variant: "destructive" });
      return;
    }

    redeemPoints.mutate({ data: { rewardId } }, {
      onSuccess: () => {
        toast({ 
          title: "Reward Redeemed!", 
          description: `You successfully redeemed ${name}. Check your email for details.`,
          className: "bg-primary text-primary-foreground"
        });
        refetchWallet();
      }
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'traffic': return <Navigation className="size-4" />;
      case 'waste': return <Leaf className="size-4" />;
      case 'accessibility': return <ShieldAlert className="size-4" />;
      case 'tourism': return <MapPin className="size-4" />;
      case 'redemption': return <Gift className="size-4" />;
      default: return <Award className="size-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <WalletIcon className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jawwal Wallet & Rewards</h1>
            <p className="text-muted-foreground mt-1">Spend your earned points on city perks and partner rewards.</p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary to-indigo-800 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Trophy className="size-48" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-primary-foreground/80 font-medium text-sm flex justify-between items-center">
                Jawwal Points
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">Available</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-black tracking-tight">{wallet?.jawwalPoints || 0}</div>
              <p className="text-sm mt-2 text-primary-foreground/80">Can be redeemed for rewards</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-700 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Leaf className="size-48" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-green-100 font-medium text-sm flex justify-between items-center">
                Eco Points
                <Badge className="bg-black/20 text-white hover:bg-black/30 border-none">Lifetime</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-black tracking-tight">{wallet?.ecoPoints || 0}</div>
              <p className="text-sm mt-2 text-green-100">Contributes to Eco Level</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="flex-1 flex flex-col justify-center px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Earned</p>
                  <p className="text-2xl font-bold text-success flex items-center gap-1">
                    <ArrowUpRight className="size-5" /> {wallet?.totalEarned || 0}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-full text-success"><Trophy className="size-5"/></div>
              </div>
            </Card>
            <Card className="flex-1 flex flex-col justify-center px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-destructive flex items-center gap-1">
                    <ArrowDownRight className="size-5" /> {wallet?.totalSpent || 0}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full text-destructive"><Gift className="size-5"/></div>
              </div>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="rewards" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="rewards">Rewards Store</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallet?.redeemableRewards?.map((reward) => (
                <Card key={reward.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-2 border-transparent hover:border-primary/20">
                  <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">{reward.name}</CardTitle>
                      <Badge variant="secondary" className="capitalize shrink-0">{reward.category}</Badge>
                    </div>
                    <CardDescription className="text-xs pt-2 line-clamp-2 min-h-[2rem]">{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-primary">{reward.pointsCost}</span>
                      <span className="text-sm text-muted-foreground mb-1 font-medium">pts</span>
                    </div>
                    <Button 
                      className="w-full font-bold" 
                      disabled={!reward.isAvailable || (wallet?.jawwalPoints || 0) < reward.pointsCost || redeemPoints.isPending}
                      onClick={() => handleRedeem(reward.id, reward.pointsCost, reward.name)}
                    >
                      {reward.isAvailable ? 'Redeem Now' : 'Out of Stock'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(!wallet?.redeemableRewards || wallet.redeemableRewards.length === 0) && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Gift className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No rewards available at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent point earnings and redemptions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {wallet?.transactions?.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${tx.type === 'earn' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {getCategoryIcon(tx.category)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground capitalize">{tx.category} • {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                      <div className={`font-bold ${tx.type === 'earn' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.points}
                      </div>
                    </div>
                  ))}
                  {(!wallet?.transactions || wallet.transactions.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-yellow-500" />
                  City Champions
                </CardTitle>
                <CardDescription>Top contributors making the city smarter and cleaner.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Citizen</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Reports</TableHead>
                      <TableHead className="text-right">Points</TableHead>
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
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className={entry.rank === 1 ? "bg-primary text-white" : ""}>
                                {entry.avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{entry.username}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{entry.driverLevel}</Badge></TableCell>
                        <TableCell className="text-right">{entry.totalReports}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{entry.jawwalPoints}</TableCell>
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
