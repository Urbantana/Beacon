import { Router, type IRouter } from "express";
import { db, wasteReportsTable, obstaclesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/municipality/heatmap", async (_req, res): Promise<void> => {
  const [wasteReports, obstacles] = await Promise.all([
    db.select().from(wasteReportsTable).orderBy(wasteReportsTable.createdAt),
    db.select().from(obstaclesTable).where(eq(obstaclesTable.isActive, true)).orderBy(obstaclesTable.createdAt),
  ]);

  // Waste stats
  const wasteByType: Record<string, number> = {};
  const wasteByStatus: Record<string, number> = {};
  for (const r of wasteReports) {
    wasteByType[r.type] = (wasteByType[r.type] ?? 0) + 1;
    wasteByStatus[r.status] = (wasteByStatus[r.status] ?? 0) + 1;
  }

  // Obstacle stats
  const obstaclesBySeverity: Record<string, number> = {};
  const obstaclesByType: Record<string, number> = {};
  for (const o of obstacles) {
    obstaclesBySeverity[o.severity] = (obstaclesBySeverity[o.severity] ?? 0) + 1;
    obstaclesByType[o.obstacleType] = (obstaclesByType[o.obstacleType] ?? 0) + 1;
  }

  res.json({
    waste: {
      points: wasteReports.map(r => ({ lat: r.lat, lng: r.lng, type: r.type, status: r.status, id: r.id, description: r.description, createdAt: r.createdAt })),
      byType: wasteByType,
      byStatus: wasteByStatus,
      total: wasteReports.length,
    },
    obstacles: {
      points: obstacles.map(o => ({ lat: o.lat, lng: o.lng, severity: o.severity, obstacleType: o.obstacleType, id: o.id, description: o.description, createdAt: o.createdAt })),
      bySeverity: obstaclesBySeverity,
      byType: obstaclesByType,
      total: obstacles.length,
    },
  });
});

export default router;
