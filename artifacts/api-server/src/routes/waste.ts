import { Router, type IRouter } from "express";
import { getAppUserId } from "../lib/getAppUserId";
import { db, wasteReportsTable, usersTable, pointsTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const ECO_POINTS_MAP: Record<string, number> = {
  overflowing_bin: 30,
  mixed_waste: 25,
  litter: 20,
  other: 15,
};

router.get("/waste/reports", async (_req, res): Promise<void> => {
  const reports = await db.select().from(wasteReportsTable).orderBy(wasteReportsTable.createdAt);
  res.json(reports.map(r => ({
    id: r.id, lat: r.lat, lng: r.lng, type: r.type, status: r.status,
    description: r.description, createdAt: r.createdAt,
    ecoPointsAwarded: r.ecoPointsAwarded, reporterUsername: r.reporterUsername,
  })));
});

router.post("/waste/reports", async (req, res): Promise<void> => {
  const { lat, lng, type, description } = req.body;
  if (!lat || !lng || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const ecoPoints = ECO_POINTS_MAP[type] ?? 15;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, await getAppUserId(req)));

  const [report] = await db.insert(wasteReportsTable).values({
    lat, lng, type, description: description ?? "",
    status: "pending",
    ecoPointsAwarded: ecoPoints,
    userId: await getAppUserId(req),
    reporterUsername: user?.username ?? "Anonymous",
  }).returning();

  await db.update(usersTable)
    .set({
      ecoPoints: sql`${usersTable.ecoPoints} + ${ecoPoints}`,
      jawwalPoints: sql`${usersTable.jawwalPoints} + ${ecoPoints}`,
      totalReports: sql`${usersTable.totalReports} + 1`,
    })
    .where(eq(usersTable.id, await getAppUserId(req)));

  await db.insert(activityFeedTable).values({
    module: "waste",
    action: "waste_reported",
    description: `Reported ${type.replace(/_/g, " ")} — earned ${ecoPoints} Eco-Points`,
    points: ecoPoints,
    username: user?.username ?? "Anonymous",
    userId: await getAppUserId(req),
  });

  res.status(201).json({
    id: report.id, lat: report.lat, lng: report.lng, type: report.type,
    status: report.status, description: report.description,
    createdAt: report.createdAt, ecoPointsAwarded: report.ecoPointsAwarded,
    reporterUsername: report.reporterUsername,
  });
});

router.post("/waste/cleanup", async (req, res): Promise<void> => {
  const { lat, lng, description, wasteReportId } = req.body;
  if (!lat || !lng || !description) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const cleanupPoints = 50;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, await getAppUserId(req)));

  if (wasteReportId) {
    await db.update(wasteReportsTable)
      .set({ status: "resolved" })
      .where(eq(wasteReportsTable.id, wasteReportId));
  }

  await db.update(usersTable)
    .set({
      ecoPoints: sql`${usersTable.ecoPoints} + ${cleanupPoints}`,
      jawwalPoints: sql`${usersTable.jawwalPoints} + ${cleanupPoints}`,
    })
    .where(eq(usersTable.id, await getAppUserId(req)));

  const [tx] = await db.insert(pointsTransactionsTable).values({
    userId: await getAppUserId(req),
    type: "earn",
    points: cleanupPoints,
    category: "waste",
    description: `Cleanup action reported: ${description}`,
  }).returning();

  await db.insert(activityFeedTable).values({
    module: "waste",
    action: "cleanup_reported",
    description: `Performed a cleanup and earned ${cleanupPoints} Eco-Points`,
    points: cleanupPoints,
    username: user?.username ?? "Anonymous",
    userId: await getAppUserId(req),
  });

  res.json({
    id: tx.id, type: tx.type, points: tx.points,
    category: tx.category, description: tx.description, createdAt: tx.createdAt,
  });
});

export default router;
