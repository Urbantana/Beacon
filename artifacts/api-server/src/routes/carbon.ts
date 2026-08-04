import { Router, type IRouter } from "express";
import { db, carbonOffsetsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getAppUserId } from "../lib/getAppUserId";

const router: IRouter = Router();

const TREE_COST_POINTS = 50; // points to plant one tree

// GET /api/carbon/summary — user's total trees planted
router.get("/carbon/summary", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const rows = await db
    .select({ totalTrees: sql<number>`sum(${carbonOffsetsTable.treesPlanted})` })
    .from(carbonOffsetsTable)
    .where(eq(carbonOffsetsTable.userId, userId));
  const totalTrees = rows[0]?.totalTrees ?? 0;
  res.json({ totalTrees, treeCostPoints: TREE_COST_POINTS });
});

// GET /api/carbon/calculate — estimate emissions for a route (distance in km)
router.get("/carbon/calculate", (req, res): void => {
  const distance = parseFloat((req.query.distance as string) || "0");
  const mode = (req.query.mode as string) || "car";
  // emission factors (kg CO2 per km)
  const factors: Record<string, number> = {
    car:    0.171,
    bus:    0.089,
    walk:   0,
    bike:   0,
    taxi:   0.202,
  };
  const factor = factors[mode] ?? factors.car;
  const emissionsKg = Math.round(distance * factor * 100) / 100;
  const treesToOffset = Math.ceil(emissionsKg / 21); // one tree absorbs ~21 kg CO2/year
  res.json({ distance, mode, emissionsKg, treesToOffset, treeCostPoints: TREE_COST_POINTS });
});

// POST /api/carbon/offset — plant a tree (costs TREE_COST_POINTS)
router.post("/carbon/offset", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const trees = Math.max(1, parseInt(req.body.trees ?? "1", 10));
  const totalCost = trees * TREE_COST_POINTS;

  // Check user points
  const { pointsTransactionsTable } = await import("@workspace/db");
  const { sum } = await import("drizzle-orm");
  const [ptRow] = await db
    .select({ balance: sql<number>`COALESCE(SUM(${pointsTransactionsTable.points}), 0)` })
    .from(pointsTransactionsTable)
    .where(eq(pointsTransactionsTable.userId, userId));
  const balance = ptRow?.balance ?? 0;
  if (balance < totalCost) {
    res.status(400).json({ error: "Insufficient Jawwal Points" });
    return;
  }

  // Deduct points
  await db.insert(pointsTransactionsTable).values({
    userId,
    points: -totalCost,
    category: "eco",
    type: "spend",
    description: `Planted ${trees} tree${trees > 1 ? "s" : ""} 🌱`,
  });

  // Record offset
  await db.insert(carbonOffsetsTable).values({ userId, treesPlanted: trees, pointsSpent: totalCost });

  res.json({ success: true, treesPlanted: trees, pointsSpent: totalCost });
});

export default router;
