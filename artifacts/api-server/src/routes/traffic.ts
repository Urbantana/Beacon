import { Router, type IRouter } from "express";
import { getAppUserId } from "../lib/getAppUserId";
import { db, trafficReportsTable, usersTable, pointsTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/traffic/reports", async (_req, res): Promise<void> => {
  const reports = await db.select().from(trafficReportsTable).orderBy(trafficReportsTable.createdAt);
  res.json(reports.map(r => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    severity: r.severity,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    reporterUsername: r.reporterUsername,
  })));
});

router.post("/traffic/reports", async (req, res): Promise<void> => {
  const { lat, lng, severity, description } = req.body;
  if (!lat || !lng || !severity || !description) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, await getAppUserId(req)));
  const [report] = await db.insert(trafficReportsTable).values({
    lat, lng, severity, description,
    status: "active",
    userId: await getAppUserId(req),
    reporterUsername: user?.username ?? "Anonymous",
  }).returning();

  // Award 10 points for reporting
  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} + 10`, totalReports: sql`${usersTable.totalReports} + 1` })
    .where(eq(usersTable.id, await getAppUserId(req)));

  await db.insert(activityFeedTable).values({
    module: "traffic",
    action: "report_submitted",
    description: `Reported ${severity} traffic incident`,
    points: 10,
    username: user?.username ?? "Anonymous",
    userId: await getAppUserId(req),
  });

  res.status(201).json({
    id: report.id, lat: report.lat, lng: report.lng,
    severity: report.severity, description: report.description,
    status: report.status, createdAt: report.createdAt,
    reporterUsername: report.reporterUsername,
  });
});

router.post("/traffic/route", async (req, res): Promise<void> => {
  const { originLat, originLng, destLat, destLng, destinationName } = req.body;
  if (originLat == null || originLng == null || destLat == null || destLng == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Check for active high/critical traffic near destination
  const activeReports = await db.select().from(trafficReportsTable)
    .where(eq(trafficReportsTable.status, "active"));

  const nearDest = activeReports.filter(r => {
    const dist = Math.sqrt(Math.pow(r.lat - destLat, 2) + Math.pow(r.lng - destLng, 2));
    return dist < 0.05 && (r.severity === "high" || r.severity === "critical");
  });

  const isCongested = nearDest.length > 0;
  const dest = destinationName ?? "Destination";

  const mainRoute = {
    name: `Main Route to ${dest}`,
    estimatedMinutes: isCongested ? 28 : 18,
    distanceKm: 4.2,
    waypoints: [[originLat, originLng], [destLat - 0.005, destLng + 0.003], [destLat, destLng]],
    trafficLevel: isCongested ? "congested" : "free",
    parkingZone: null,
  };

  const alternativeRoute = isCongested ? {
    name: `Smart Alternative to ${dest}`,
    estimatedMinutes: 22,
    distanceKm: 5.1,
    waypoints: [[originLat, originLng], [originLat + 0.01, originLng - 0.008], [destLat + 0.007, destLng - 0.005], [destLat, destLng]],
    trafficLevel: "free",
    parkingZone: "Al-Masyoun Outer Parking",
  } : null;

  res.json({
    isCongested,
    mainRoute,
    alternativeRoute,
    pointsIfAlternative: isCongested ? 75 : null,
    congestionMessage: isCongested
      ? `Heavy traffic near ${dest}. Smart alternative saves ~6 minutes and earns 75 Jawwal Points!`
      : null,
  });
});

router.post("/traffic/accept-alternative", async (req, res): Promise<void> => {
  const { routeName, pointsAmount, usedParkingZone } = req.body;
  if (!routeName || !pointsAmount) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const bonus = usedParkingZone ? 25 : 0;
  const total = pointsAmount + bonus;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, await getAppUserId(req)));
  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} + ${total}` })
    .where(eq(usersTable.id, await getAppUserId(req)));

  const [tx] = await db.insert(pointsTransactionsTable).values({
    userId: await getAppUserId(req),
    type: "earn",
    points: total,
    category: "traffic",
    description: `Accepted alternative route: ${routeName}${usedParkingZone ? " + parking bonus" : ""}`,
  }).returning();

  await db.insert(activityFeedTable).values({
    module: "traffic",
    action: "alternative_route_accepted",
    description: `Chose smart alternative route and earned ${total} points`,
    points: total,
    username: user?.username ?? "Anonymous",
    userId: await getAppUserId(req),
  });

  res.json({
    id: tx.id, type: tx.type, points: tx.points,
    category: tx.category, description: tx.description, createdAt: tx.createdAt,
  });
});

export default router;
