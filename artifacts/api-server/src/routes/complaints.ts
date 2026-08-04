import { Router, type IRouter } from "express";
import { db, complaintsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAppUserId } from "../lib/getAppUserId";
import crypto from "crypto";

const router: IRouter = Router();

function generateTrackingId(): string {
  const num = crypto.randomInt(100000, 999999);
  return `PLT-${num}`;
}

// GET /api/complaints — user's complaints
router.get("/complaints", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const complaints = await db.select().from(complaintsTable)
    .where(eq(complaintsTable.userId, userId))
    .orderBy(desc(complaintsTable.createdAt))
    .limit(50);
  res.json(complaints);
});

// GET /api/complaints/all — all complaints (municipality view)
router.get("/complaints/all", async (_req, res): Promise<void> => {
  const complaints = await db.select().from(complaintsTable)
    .orderBy(desc(complaintsTable.createdAt))
    .limit(100);
  res.json(complaints);
});

// GET /api/complaints/:id
router.get("/complaints/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [c] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(c);
});

// POST /api/complaints — submit new complaint
router.post("/complaints", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const { title, description, category, location, lat, lng, photoUrl } = req.body;
  if (!title) { res.status(400).json({ error: "Title is required" }); return; }

  const { usersTable } = await import("@workspace/db");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const trackingId = generateTrackingId();
  const [complaint] = await db.insert(complaintsTable).values({
    trackingId,
    title,
    description: description || "",
    category: category || "other",
    location: location || "",
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
    photoUrl: photoUrl || null,
    userId,
    username: user?.username || "Citizen",
    status: "pending",
  }).returning();
  res.json(complaint);
});

// PATCH /api/complaints/:id/status — update status (municipality)
router.patch("/complaints/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status, notes } = req.body;
  const valid = ["pending", "under_review", "in_progress", "resolved"];
  if (!valid.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const [updated] = await db.update(complaintsTable)
    .set({ status, notes: notes || "", updatedAt: new Date() })
    .where(eq(complaintsTable.id, id)).returning();
  res.json(updated);
});

export default router;
