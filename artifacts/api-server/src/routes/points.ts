import { Router, type IRouter } from "express";
import { db, usersTable, pointsTransactionsTable, rewardsTable, activityFeedTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

router.get("/points/wallet", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const transactions = await db.select().from(pointsTransactionsTable)
    .where(eq(pointsTransactionsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(pointsTransactionsTable.createdAt))
    .limit(20);

  const rewards = await db.select().from(rewardsTable);

  const totalEarned = transactions.filter(t => t.type === "earn").reduce((sum, t) => sum + t.points, 0);
  const totalSpent = transactions.filter(t => t.type === "spend").reduce((sum, t) => sum + t.points, 0);

  res.json({
    jawwalPoints: user.jawwalPoints,
    ecoPoints: user.ecoPoints,
    totalEarned,
    totalSpent,
    transactions: transactions.map(t => ({
      id: t.id, type: t.type, points: t.points,
      category: t.category, description: t.description, createdAt: t.createdAt,
    })),
    redeemableRewards: rewards.map(r => ({
      id: r.id, name: r.name, pointsCost: r.pointsCost,
      category: r.category, description: r.description, isAvailable: r.isAvailable === 1,
    })),
  });
});

router.post("/points/redeem", async (req, res): Promise<void> => {
  const { rewardId } = req.body;
  if (!rewardId) {
    res.status(400).json({ error: "Missing rewardId" });
    return;
  }
  const rawId = Array.isArray(rewardId) ? rewardId[0] : rewardId;
  const id = parseInt(String(rawId), 10);

  const [reward] = await db.select().from(rewardsTable).where(eq(rewardsTable.id, id));
  if (!reward) {
    res.status(404).json({ error: "Reward not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  if (!user || user.jawwalPoints < reward.pointsCost) {
    res.status(400).json({ error: "Insufficient Jawwal Points" });
    return;
  }

  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} - ${reward.pointsCost}` })
    .where(eq(usersTable.id, DEFAULT_USER_ID));

  const [tx] = await db.insert(pointsTransactionsTable).values({
    userId: DEFAULT_USER_ID,
    type: "spend",
    points: reward.pointsCost,
    category: "redemption",
    description: `Redeemed: ${reward.name}`,
  }).returning();

  await db.insert(activityFeedTable).values({
    module: "points",
    action: "points_redeemed",
    description: `Redeemed ${reward.name} for ${reward.pointsCost} Jawwal Points`,
    points: reward.pointsCost,
    username: user.username,
    userId: DEFAULT_USER_ID,
  });

  res.json({
    id: tx.id, type: tx.type, points: tx.points,
    category: tx.category, description: tx.description, createdAt: tx.createdAt,
  });
});

export default router;
