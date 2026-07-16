import { Router, type IRouter } from "express";
import {
  db, usersTable, trafficReportsTable, wasteReportsTable, obstaclesTable,
  touristSpotsTable, touristEventsTable, pointsTransactionsTable, activityFeedTable
} from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [activeTrafficRow] = await db.select({ c: count() }).from(trafficReportsTable)
    .where(eq(trafficReportsTable.status, "active"));
  const [pendingWasteRow] = await db.select({ c: count() }).from(wasteReportsTable)
    .where(eq(wasteReportsTable.status, "pending"));
  const [activeObstaclesRow] = await db.select({ c: count() }).from(obstaclesTable)
    .where(eq(obstaclesTable.isActive, true));
  const [totalUsersRow] = await db.select({ c: count() }).from(usersTable);
  const [touristSpotsRow] = await db.select({ c: count() }).from(touristSpotsTable);

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const [eventsRow] = await db.select({ c: count() }).from(touristEventsTable);

  const allTx = await db.select({ points: pointsTransactionsTable.points, type: pointsTransactionsTable.type })
    .from(pointsTransactionsTable);
  const totalPointsEarned = allTx.filter(t => t.type === "earn").reduce((s, t) => s + t.points, 0);

  const activeTraffic = activeTrafficRow?.c ?? 0;
  const congestionScore = Math.min(10, (Number(activeTraffic) / 5) * 10);
  const pendingWaste = pendingWasteRow?.c ?? 0;
  const ecoScore = Math.max(0, 10 - (Number(pendingWaste) / 3) * 10);

  res.json({
    activeTrafficReports: Number(activeTrafficRow?.c ?? 0),
    pendingWasteReports: Number(pendingWasteRow?.c ?? 0),
    activeObstacles: Number(activeObstaclesRow?.c ?? 0),
    totalUsers: Number(totalUsersRow?.c ?? 0),
    totalPointsEarned,
    touristSpotsNearby: Number(touristSpotsRow?.c ?? 0),
    eventsThisWeek: Number(eventsRow?.c ?? 0),
    congestionScore,
    ecoScore,
  });
});

router.get("/dashboard/activity-feed", async (_req, res): Promise<void> => {
  const activities = await db.select().from(activityFeedTable)
    .orderBy(desc(activityFeedTable.createdAt))
    .limit(20);
  res.json(activities.map(a => ({
    id: a.id,
    module: a.module,
    action: a.action,
    description: a.description,
    points: a.points,
    username: a.username,
    createdAt: a.createdAt,
  })));
});

router.get("/dashboard/leaderboard", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable)
    .orderBy(desc(usersTable.jawwalPoints))
    .limit(10);
  res.json(users.map((u, i) => ({
    rank: i + 1,
    username: u.username,
    jawwalPoints: u.jawwalPoints,
    driverLevel: u.driverLevel,
    totalReports: u.totalReports,
    avatarInitials: u.avatarInitials,
  })));
});

export default router;
