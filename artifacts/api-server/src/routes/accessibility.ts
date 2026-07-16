import { Router, type IRouter } from "express";
import { db, accessibilityPathsTable, obstaclesTable, usersTable, activityFeedTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

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
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  const [obstacle] = await db.insert(obstaclesTable).values({
    lat, lng, obstacleType, severity,
    description: description ?? "",
    affectsPathId: affectsPathId ?? null,
    isActive: true,
    userId: DEFAULT_USER_ID,
    reporterUsername: user?.username ?? "Anonymous",
  }).returning();

  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} + 15`, totalReports: sql`${usersTable.totalReports} + 1` })
    .where(eq(usersTable.id, DEFAULT_USER_ID));

  await db.insert(activityFeedTable).values({
    module: "accessibility",
    action: "obstacle_reported",
    description: `Reported ${obstacleType.replace(/_/g, " ")} obstacle on safe path`,
    points: 15,
    username: user?.username ?? "Anonymous",
    userId: DEFAULT_USER_ID,
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
