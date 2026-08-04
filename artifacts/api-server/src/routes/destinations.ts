import { Router, type IRouter } from "express";
import { db, featuredDestinationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SEED_DESTINATION = {
  name: "Al-Manara Square",
  nameAr: "ميدان المنارة",
  description: "The heart of Ramallah — Al-Manara Square is the historic center of the city, surrounded by its famous five lions statue. This iconic gathering place hosts cultural events, festivals, and is the starting point for exploring the old city.",
  descriptionAr: "قلب رام الله — ميدان المنارة هو المركز التاريخي للمدينة، محاط بتمثال الأسود الخمسة الشهير. هذا المكان الأيقوني يستضيف الفعاليات الثقافية والمهرجانات.",
  imageUrl: "",
  location: "City Center, Ramallah",
  locationAr: "وسط المدينة، رام الله",
  lat: 31.9038, lng: 35.2034,
  discountPercent: 20,
  bonusPoints: 150,
  isActive: true,
  monthLabel: "August 2026",
  monthLabelAr: "أغسطس 2026",
};

async function seedDestination() {
  const existing = await db.select().from(featuredDestinationsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(featuredDestinationsTable).values(SEED_DESTINATION);
  }
}

// GET /api/destination — active destination of the month
router.get("/destination", async (_req, res): Promise<void> => {
  await seedDestination();
  const [dest] = await db.select().from(featuredDestinationsTable).where(eq(featuredDestinationsTable.isActive, true));
  res.json(dest || null);
});

// GET /api/destination/all — all destinations (admin)
router.get("/destination/all", async (_req, res): Promise<void> => {
  const dests = await db.select().from(featuredDestinationsTable);
  res.json(dests);
});

// POST /api/destination — create or update destination of the month
router.post("/destination", async (req, res): Promise<void> => {
  const { name, nameAr, description, descriptionAr, imageUrl, location, locationAr,
    lat, lng, discountPercent, bonusPoints, monthLabel, monthLabelAr } = req.body;
  // Deactivate all existing
  await db.update(featuredDestinationsTable).set({ isActive: false });
  const [dest] = await db.insert(featuredDestinationsTable).values({
    name, nameAr: nameAr || "", description: description || "", descriptionAr: descriptionAr || "",
    imageUrl: imageUrl || "", location: location || "", locationAr: locationAr || "",
    lat: parseFloat(lat) || 31.9, lng: parseFloat(lng) || 35.2,
    discountPercent: parseInt(discountPercent) || 0,
    bonusPoints: parseInt(bonusPoints) || 100,
    isActive: true,
    monthLabel: monthLabel || "Month 2026",
    monthLabelAr: monthLabelAr || "",
  }).returning();
  res.json(dest);
});

export default router;
