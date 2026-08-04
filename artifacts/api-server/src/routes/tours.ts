import { Router, type IRouter } from "express";
import { db, toursTable, tourBookingsTable, pointsTransactionsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { getAppUserId } from "../lib/getAppUserId";

const router: IRouter = Router();

const SEED_TOURS = [
  {
    title: "Old City Walking Tour",
    titleAr: "جولة مشي في البلد القديم",
    description: "Explore the historic streets of Ramallah's old city with a knowledgeable local guide. See ancient architecture, hear stories of Palestinian heritage, and discover hidden gems.",
    descriptionAr: "استكشف الشوارع التاريخية لبلدة رام الله القديمة مع مرشد محلي متمرس. شاهد الهندسة المعمارية العتيقة واسمع قصص التراث الفلسطيني.",
    category: "historical",
    location: "Al-Manara Square, Ramallah",
    locationAr: "ميدان المنارة، رام الله",
    lat: 31.9038, lng: 35.2034,
    durationMinutes: 180,
    maxParticipants: 15,
    currentParticipants: 7,
    pricePoints: 100,
    pointsReward: 75,
    guideId: 1,
    guideName: "Ahmad Khalil",
    tourDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "upcoming",
  },
  {
    title: "Palestinian Food & Culture Tour",
    titleAr: "جولة الطعام والثقافة الفلسطينية",
    description: "Taste authentic Palestinian cuisine — musakhan, maqlouba, knafeh — while learning about the cultural significance of each dish. Includes visits to local bakeries and markets.",
    descriptionAr: "تذوق المطبخ الفلسطيني الأصيل — مسخن، مقلوبة، كنافة — مع التعلم عن الأهمية الثقافية لكل طبق.",
    category: "food",
    location: "City Center, Ramallah",
    locationAr: "وسط المدينة، رام الله",
    lat: 31.9010, lng: 35.2060,
    durationMinutes: 240,
    maxParticipants: 12,
    currentParticipants: 4,
    pricePoints: 150,
    pointsReward: 100,
    guideId: 1,
    guideName: "Layla Mansour",
    tourDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "upcoming",
  },
  {
    title: "Bireh Nature & Olive Grove Trek",
    titleAr: "رحلة الطبيعة وبساتين الزيتون في البيرة",
    description: "Trek through ancient olive groves in Bireh. Learn about Palestine's olive oil heritage, the harvest season, and the significance of the olive tree in Palestinian identity.",
    descriptionAr: "مشي عبر بساتين الزيتون العتيقة في البيرة. تعلم عن تراث زيت الزيتون الفلسطيني وموسم الحصاد.",
    category: "nature",
    location: "Bireh, West Bank",
    locationAr: "البيرة، الضفة الغربية",
    lat: 31.9141, lng: 35.2256,
    durationMinutes: 300,
    maxParticipants: 20,
    currentParticipants: 11,
    pricePoints: 200,
    pointsReward: 150,
    guideId: 1,
    guideName: "Omar Hassan",
    tourDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "upcoming",
  },
  {
    title: "Almeena Cottage Getaway",
    titleAr: "إقامة كوخ المينا",
    description: "Escape to Almeena Cottage (كوخ المينا), a charming rural retreat nestled in the Palestinian countryside. Enjoy fresh air, local hospitality, and the quiet beauty of nature. Perfect for families and groups seeking an authentic village experience.",
    descriptionAr: "استمتع بتجربة ريفية أصيلة في كوخ المينا، ملاذ ريفي ساحر وسط الطبيعة الفلسطينية. هواء نقي، ضيافة محلية، وجمال الطبيعة الهادئة — تجربة مثالية للعائلات والمجموعات.",
    category: "nature",
    location: "Palestinian Countryside",
    locationAr: "الريف الفلسطيني",
    lat: 31.8950, lng: 35.1850,
    durationMinutes: 480,
    maxParticipants: 16,
    currentParticipants: 0,
    pricePoints: 120,
    pointsReward: 90,
    guideId: 1,
    guideName: "Almeena Cottage Host",
    tourDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: "upcoming",
  },
];

async function seedTours() {
  const existing = await db.select().from(toursTable).limit(1);
  if (existing.length === 0) {
    await db.insert(toursTable).values(SEED_TOURS);
  }
}

// GET /api/tours — list all tours
router.get("/tours", async (req, res): Promise<void> => {
  await seedTours();
  const { category, status } = req.query as Record<string, string>;
  let query = db.select().from(toursTable).orderBy(desc(toursTable.tourDate)) as any;
  const conditions = [];
  if (category && category !== "all") conditions.push(eq(toursTable.category, category));
  if (status && status !== "all") conditions.push(eq(toursTable.status, status));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const tours = await query.limit(50);
  res.json(tours);
});

// GET /api/tours/my-bookings
router.get("/tours/my-bookings", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const bookings = await db.select().from(tourBookingsTable)
    .where(eq(tourBookingsTable.userId, userId));
  res.json(bookings);
});

// GET /api/tours/:id
router.get("/tours/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, id));
  if (!tour) { res.status(404).json({ error: "Tour not found" }); return; }
  res.json(tour);
});

// POST /api/tours — create a new tour
router.post("/tours", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const { title, titleAr, description, descriptionAr, category, location, locationAr,
    lat, lng, durationMinutes, maxParticipants, pricePoints, pointsReward, tourDate, guideName } = req.body;
  if (!title || !tourDate) {
    res.status(400).json({ error: "Title and tour date are required" });
    return;
  }
  const [tour] = await db.insert(toursTable).values({
    title, titleAr: titleAr || "", description: description || "", descriptionAr: descriptionAr || "",
    category: category || "cultural", location: location || "", locationAr: locationAr || "",
    lat: parseFloat(lat) || 31.9, lng: parseFloat(lng) || 35.2,
    durationMinutes: parseInt(durationMinutes) || 120,
    maxParticipants: parseInt(maxParticipants) || 10,
    pricePoints: parseInt(pricePoints) || 0,
    pointsReward: parseInt(pointsReward) || 50,
    guideId: userId, guideName: guideName || "Guide",
    tourDate: new Date(tourDate),
    status: "upcoming",
  }).returning();
  res.json(tour);
});

// POST /api/tours/:id/book
router.post("/tours/:id/book", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const tourId = parseInt(req.params.id, 10);
  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, tourId));
  if (!tour) { res.status(404).json({ error: "Tour not found" }); return; }
  if (tour.currentParticipants >= tour.maxParticipants) {
    res.status(400).json({ error: "Tour is fully booked" });
    return;
  }
  // Check existing booking
  const [existing] = await db.select().from(tourBookingsTable)
    .where(and(eq(tourBookingsTable.tourId, tourId), eq(tourBookingsTable.userId, userId)));
  if (existing) { res.status(400).json({ error: "Already booked" }); return; }

  if (tour.pricePoints > 0) {
    const [ptRow] = await db
      .select({ balance: sql<number>`COALESCE(SUM(${pointsTransactionsTable.points}), 0)` })
      .from(pointsTransactionsTable)
      .where(eq(pointsTransactionsTable.userId, userId));
    if ((ptRow?.balance ?? 0) < tour.pricePoints) {
      res.status(400).json({ error: "Insufficient Jawwal Points" });
      return;
    }
    await db.insert(pointsTransactionsTable).values({
      userId, points: -tour.pricePoints, category: "event", type: "spend",
      description: `Booked tour: ${tour.title}`,
    });
  }
  // Award points
  if (tour.pointsReward > 0) {
    await db.insert(pointsTransactionsTable).values({
      userId, points: tour.pointsReward, category: "event", type: "earn",
      description: `Joined tour: ${tour.title}`,
    });
  }

  await db.insert(tourBookingsTable).values({ tourId, userId, pointsUsed: tour.pricePoints });
  await db.update(toursTable).set({ currentParticipants: tour.currentParticipants + 1 }).where(eq(toursTable.id, tourId));
  res.json({ success: true });
});

export default router;
