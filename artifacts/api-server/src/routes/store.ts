import { Router, type IRouter } from "express";
import { db, rewardsTable, usersTable, pointsTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, sql, like } from "drizzle-orm";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

// Heritage items seeded once on first request
const HERITAGE_ITEMS = [
  {
    name: "Palestine Monopoly",
    pointsCost: 1200,
    category: "heritage",
    description: "The iconic board game reimagined with Palestinian cities, landmarks, and culture. Includes Ramallah, Jerusalem, Nablus & more. Limited collector's edition.",
    isAvailable: 1,
  },
  {
    name: "Traditional Keffiyeh Set",
    pointsCost: 800,
    category: "heritage",
    description: "Authentic hand-woven Palestinian keffiyeh in classic black & white. Comes with a decorative display stand and certificate of authenticity.",
    isAvailable: 1,
  },
  {
    name: "Palestinian Embroidery Kit",
    pointsCost: 500,
    category: "heritage",
    description: "Traditional tatreez embroidery kit with hand-dyed threads, linen fabric, and illustrated patterns from Ramallah and Bethlehem regions.",
    isAvailable: 1,
  },
  {
    name: "Hebron Blown Glass Vase",
    pointsCost: 650,
    category: "heritage",
    description: "Handcrafted Hebron glass vase in deep blue and amber. Each piece is unique, made by fourth-generation glassblowers in the West Bank.",
    isAvailable: 1,
  },
  {
    name: "Za'atar & Olive Oil Gift Box",
    pointsCost: 350,
    category: "heritage",
    description: "Premium Palestinian za'atar blend + cold-pressed extra virgin olive oil from Nablus groves. Beautifully boxed with traditional wrapping.",
    isAvailable: 1,
  },
  {
    name: "Ramallah City Art Print",
    pointsCost: 400,
    category: "heritage",
    description: "Limited-edition illustrated map of Ramallah by local artist. Fine-art print on archival paper, signed and numbered. Perfect for framing.",
    isAvailable: 1,
  },
  {
    name: "Ceramic Mosaic Coaster Set",
    pointsCost: 300,
    category: "heritage",
    description: "Set of 4 hand-painted ceramic coasters featuring geometric Palestinian mosaic patterns. Dishwasher safe, cork-backed.",
    isAvailable: 1,
  },
  {
    name: "Muftool Backgammon Board",
    pointsCost: 900,
    category: "heritage",
    description: "Hand-inlaid olive wood backgammon board with mother-of-pearl details. A centuries-old craft from Bethlehem artisans. Comes with travel case.",
    isAvailable: 1,
  },
];

async function seedHeritageItems() {
  const existing = await db.select().from(rewardsTable).where(eq(rewardsTable.category, "heritage"));
  if (existing.length >= HERITAGE_ITEMS.length) return;
  const existingNames = new Set(existing.map(r => r.name));
  const toInsert = HERITAGE_ITEMS.filter(item => !existingNames.has(item.name));
  if (toInsert.length > 0) {
    await db.insert(rewardsTable).values(toInsert);
  }
}

router.get("/store/heritage", async (_req, res): Promise<void> => {
  await seedHeritageItems();
  const items = await db.select().from(rewardsTable).where(eq(rewardsTable.category, "heritage"));
  const [user] = await db.select({ jawwalPoints: usersTable.jawwalPoints }).from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));

  res.json({
    userPoints: user?.jawwalPoints ?? 0,
    items: items.map(r => ({
      id: r.id,
      name: r.name,
      pointsCost: r.pointsCost,
      category: r.category,
      description: r.description,
      isAvailable: r.isAvailable === 1,
    })),
  });
});

router.post("/store/redeem", async (req, res): Promise<void> => {
  const { itemId } = req.body;
  if (!itemId) { res.status(400).json({ error: "Missing itemId" }); return; }

  const id = parseInt(String(Array.isArray(itemId) ? itemId[0] : itemId), 10);
  const [item] = await db.select().from(rewardsTable).where(eq(rewardsTable.id, id));
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  if (!user || user.jawwalPoints < item.pointsCost) {
    res.status(400).json({ error: "Insufficient Jawwal Points" });
    return;
  }

  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} - ${item.pointsCost}` })
    .where(eq(usersTable.id, DEFAULT_USER_ID));

  const [tx] = await db.insert(pointsTransactionsTable).values({
    userId: DEFAULT_USER_ID,
    type: "spend",
    points: item.pointsCost,
    category: "redemption",
    description: `Redeemed heritage item: ${item.name}`,
  }).returning();

  await db.insert(activityFeedTable).values({
    module: "points",
    action: "heritage_redeemed",
    description: `Redeemed "${item.name}" for ${item.pointsCost} Jawwal Points`,
    points: item.pointsCost,
    username: user.username,
    userId: DEFAULT_USER_ID,
  });

  res.json({
    id: tx.id, type: tx.type, points: tx.points,
    category: tx.category, description: tx.description, createdAt: tx.createdAt,
    newBalance: user.jawwalPoints - item.pointsCost,
  });
});

export default router;
