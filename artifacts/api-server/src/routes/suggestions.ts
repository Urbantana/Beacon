import { Router, type IRouter } from "express";
import { db, suggestionsTable, suggestionVotesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getAppUserId } from "../lib/getAppUserId";

const router: IRouter = Router();

const SEED_SUGGESTIONS = [
  {
    title: "Add more public benches on Al-Irsal Street",
    titleAr: "إضافة المزيد من المقاعد العامة في شارع الإرسال",
    description: "There are very few places to sit along Al-Irsal Street. Adding benches would help elderly people and tourists enjoy the area.",
    descriptionAr: "هناك أماكن قليلة جدًا للجلوس على طول شارع الإرسال. إضافة مقاعد ستساعد كبار السن والسياح.",
    category: "infrastructure",
    location: "Al-Irsal Street, Ramallah",
    userId: 1, username: "RamallahCitizen",
    upvotes: 24, downvotes: 2, status: "under_review",
  },
  {
    title: "Install bike-sharing stations near the city center",
    titleAr: "تركيب محطات مشاركة الدراجات قرب وسط المدينة",
    description: "A bike-sharing program would reduce traffic and help tourists explore the city sustainably.",
    descriptionAr: "برنامج مشاركة الدراجات سيقلل من حركة المرور ويساعد السياح على استكشاف المدينة بشكل مستدام.",
    category: "transport",
    location: "City Center, Ramallah",
    userId: 1, username: "GreenRamallah",
    upvotes: 38, downvotes: 5, status: "approved",
  },
  {
    title: "Create a night market in the old city",
    titleAr: "إنشاء سوق ليلي في البلد القديم",
    description: "A weekly night market showcasing local crafts, food, and music would boost tourism and support local businesses.",
    descriptionAr: "سوق ليلي أسبوعي يعرض الحرف المحلية والطعام والموسيقى سيعزز السياحة ويدعم الأعمال المحلية.",
    category: "tourism",
    location: "Old City, Ramallah",
    userId: 1, username: "TourismBooster",
    upvotes: 52, downvotes: 3, status: "pending",
  },
];

async function seedSuggestions() {
  const existing = await db.select().from(suggestionsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(suggestionsTable).values(SEED_SUGGESTIONS);
  }
}

// GET /api/suggestions
router.get("/suggestions", async (req, res): Promise<void> => {
  await seedSuggestions();
  const { category, status } = req.query as Record<string, string>;
  let query = db.select().from(suggestionsTable).orderBy(desc(suggestionsTable.upvotes)) as any;
  const conditions = [];
  if (category && category !== "all") conditions.push(eq(suggestionsTable.category, category));
  if (status && status !== "all") conditions.push(eq(suggestionsTable.status, status));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const suggestions = await query.limit(50);
  res.json(suggestions);
});

// GET /api/suggestions/my-votes — user's vote record
router.get("/suggestions/my-votes", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const votes = await db.select().from(suggestionVotesTable).where(eq(suggestionVotesTable.userId, userId));
  res.json(votes);
});

// GET /api/suggestions/:id
router.get("/suggestions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [s] = await db.select().from(suggestionsTable).where(eq(suggestionsTable.id, id));
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  res.json(s);
});

// POST /api/suggestions — create
router.post("/suggestions", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const { title, titleAr, description, descriptionAr, category, location } = req.body;
  if (!title) { res.status(400).json({ error: "Title is required" }); return; }

  // Fetch username
  const { usersTable } = await import("@workspace/db");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const [suggestion] = await db.insert(suggestionsTable).values({
    title, titleAr: titleAr || "", description: description || "",
    descriptionAr: descriptionAr || "", category: category || "other",
    location: location || "", userId, username: user?.username || "Citizen",
  }).returning();
  res.json(suggestion);
});

// POST /api/suggestions/:id/vote
router.post("/suggestions/:id/vote", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const id = parseInt(req.params.id, 10);
  const { vote } = req.body; // "up" | "down"
  if (!["up", "down"].includes(vote)) { res.status(400).json({ error: "Invalid vote" }); return; }

  const [s] = await db.select().from(suggestionsTable).where(eq(suggestionsTable.id, id));
  if (!s) { res.status(404).json({ error: "Not found" }); return; }

  // Check existing vote
  const [existing] = await db.select().from(suggestionVotesTable)
    .where(and(eq(suggestionVotesTable.suggestionId, id), eq(suggestionVotesTable.userId, userId)));

  if (existing) {
    if (existing.vote === vote) {
      // Remove vote (toggle)
      await db.delete(suggestionVotesTable).where(eq(suggestionVotesTable.id, existing.id));
      const delta = vote === "up" ? -1 : 0;
      const downDelta = vote === "down" ? -1 : 0;
      await db.update(suggestionsTable).set({
        upvotes: Math.max(0, s.upvotes + delta),
        downvotes: Math.max(0, s.downvotes + downDelta),
      }).where(eq(suggestionsTable.id, id));
    } else {
      // Switch vote
      await db.update(suggestionVotesTable).set({ vote }).where(eq(suggestionVotesTable.id, existing.id));
      if (vote === "up") {
        await db.update(suggestionsTable).set({ upvotes: s.upvotes + 1, downvotes: Math.max(0, s.downvotes - 1) }).where(eq(suggestionsTable.id, id));
      } else {
        await db.update(suggestionsTable).set({ upvotes: Math.max(0, s.upvotes - 1), downvotes: s.downvotes + 1 }).where(eq(suggestionsTable.id, id));
      }
    }
  } else {
    await db.insert(suggestionVotesTable).values({ suggestionId: id, userId, vote });
    if (vote === "up") {
      await db.update(suggestionsTable).set({ upvotes: s.upvotes + 1 }).where(eq(suggestionsTable.id, id));
    } else {
      await db.update(suggestionsTable).set({ downvotes: s.downvotes + 1 }).where(eq(suggestionsTable.id, id));
    }
  }

  const [updated] = await db.select().from(suggestionsTable).where(eq(suggestionsTable.id, id));
  res.json(updated);
});

// PATCH /api/suggestions/:id/status (municipality)
router.patch("/suggestions/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  const [updated] = await db.update(suggestionsTable).set({ status, updatedAt: new Date() })
    .where(eq(suggestionsTable.id, id)).returning();
  res.json(updated);
});

export default router;
