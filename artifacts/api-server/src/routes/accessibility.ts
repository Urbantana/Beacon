import { Router, type IRouter } from "express";
import { getAppUserId } from "../lib/getAppUserId";
import { db, accessibilityPathsTable, obstaclesTable, usersTable, activityFeedTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

// Convert flat waypoints array to array-of-pairs for API response
function flatToWaypoints(flat: number[]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < flat.length; i += 2) {
    result.push([flat[i], flat[i + 1]]);
  }
  return result;
}

router.get("/accessibility/paths", async (_req, res): Promise<void> => {
  const paths = await db.select().from(accessibilityPathsTable).where(eq(accessibilityPathsTable.isActive, true));
  res.json(paths.map(p => ({
    id: p.id,
    name: p.name,
    pathType: p.pathType,
    waypoints: flatToWaypoints(p.waypoints),
    isActive: p.isActive,
    surfaceType: p.surfaceType,
    hasAudioCues: p.hasAudioCues,
    hasHapticMarkers: p.hasHapticMarkers,
  })));
});

router.get("/accessibility/obstacles", async (_req, res): Promise<void> => {
  const obstacles = await db.select().from(obstaclesTable).where(eq(obstaclesTable.isActive, true));
  res.json(obstacles.map(o => ({
    id: o.id, lat: o.lat, lng: o.lng,
    obstacleType: o.obstacleType, severity: o.severity, isActive: o.isActive,
    description: o.description, affectsPathId: o.affectsPathId,
    createdAt: o.createdAt, reporterUsername: o.reporterUsername,
  })));
});

router.post("/accessibility/obstacles", async (req, res): Promise<void> => {
  const { lat, lng, obstacleType, severity, description, affectsPathId } = req.body;
  if (!lat || !lng || !obstacleType || !severity) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, await getAppUserId(req)));
  const [obstacle] = await db.insert(obstaclesTable).values({
    lat, lng, obstacleType, severity,
    description: description ?? "",
    affectsPathId: affectsPathId ?? null,
    isActive: true,
    userId: await getAppUserId(req),
    reporterUsername: user?.username ?? "Anonymous",
  }).returning();

  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} + 15`, totalReports: sql`${usersTable.totalReports} + 1` })
    .where(eq(usersTable.id, await getAppUserId(req)));

  await db.insert(activityFeedTable).values({
    module: "accessibility",
    action: "obstacle_reported",
    description: `Reported ${obstacleType.replace(/_/g, " ")} obstacle on safe path`,
    points: 15,
    username: user?.username ?? "Anonymous",
    userId: await getAppUserId(req),
  });

  res.status(201).json({
    id: obstacle.id, lat: obstacle.lat, lng: obstacle.lng,
    obstacleType: obstacle.obstacleType, severity: obstacle.severity,
    isActive: obstacle.isActive, description: obstacle.description,
    affectsPathId: obstacle.affectsPathId,
    createdAt: obstacle.createdAt, reporterUsername: obstacle.reporterUsername,
  });
});

export default router;
