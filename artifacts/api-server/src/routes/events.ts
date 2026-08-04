import { Router, type IRouter } from "express";
import { getAppUserId } from "../lib/getAppUserId";
import { db, eventsTable, eventBookingsTable, usersTable, pointsTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, sql, and, like } from "drizzle-orm";

const router: IRouter = Router();

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_EVENTS = [
  {
    title: "Palestine Monopoly Launch Party",
    titleAr: "حفل إطلاق لعبة مونوبولي فلسطين",
    description: "Join us for the official launch of Palestine Monopoly — the iconic board game reimagined with Palestinian cities and culture. Includes live demo, traditional music, and raffles.",
    descriptionAr: "انضم إلينا في الإطلاق الرسمي للعبة مونوبولي فلسطين — اللعبة اللوحية الشهيرة المعاد تصورها بالمدن والثقافة الفلسطينية. تشمل عرضًا حيًا وموسيقى تقليدية وسحوبات.",
    category: "entertainment",
    location: "Ramallah City Park, Al-Irsal St",
    locationAr: "حديقة مدينة رام الله، شارع الإرسال",
    lat: 31.9038, lng: 35.2034,
    startDate: new Date("2026-08-10T17:00:00Z"),
    endDate: new Date("2026-08-10T21:00:00Z"),
    price: 0,
    pointsRequired: 0,
    pointsReward: 150,
    capacity: 300,
    booked: 87,
    status: "upcoming",
    createdBy: "Ramallah Municipality",
  },
  {
    title: "Ramallah Cultural Heritage Festival",
    titleAr: "مهرجان رام الله للتراث الثقافي",
    description: "A three-day celebration of Palestinian heritage featuring traditional crafts, embroidery workshops, folklore performances, and local cuisine from across Palestine.",
    descriptionAr: "احتفالية تمتد ثلاثة أيام للتراث الفلسطيني تضم الحرف التقليدية وورش التطريز والعروض الفلكلورية والمأكولات المحلية من مختلف أنحاء فلسطين.",
    category: "cultural",
    location: "Al-Manara Square, Ramallah",
    locationAr: "دوار المنارة، رام الله",
    lat: 31.9035, lng: 35.2063,
    startDate: new Date("2026-08-15T10:00:00Z"),
    endDate: new Date("2026-08-17T22:00:00Z"),
    price: 10,
    pointsRequired: 0,
    pointsReward: 100,
    capacity: 500,
    booked: 212,
    status: "upcoming",
    createdBy: "Ministry of Culture",
  },
  {
    title: "Bireh Youth Marathon",
    titleAr: "ماراثون شباب البيرة",
    description: "Annual 5km and 10km marathon through the streets of Al-Bireh. Open to all ages. Earn Jawwal Points for completing the race. Finishers receive a commemorative medal.",
    descriptionAr: "ماراثون سنوي بمسافتي 5 كم و10 كم عبر شوارع البيرة. مفتوح لجميع الأعمار. اكسب نقاط جوال عند إتمام السباق. يحصل المنهون على ميدالية تذكارية.",
    category: "sports",
    location: "Al-Bireh Central Stadium",
    locationAr: "الملعب المركزي، البيرة",
    lat: 31.9105, lng: 35.2218,
    startDate: new Date("2026-08-20T07:00:00Z"),
    endDate: new Date("2026-08-20T12:00:00Z"),
    price: 5,
    pointsRequired: 0,
    pointsReward: 200,
    capacity: 400,
    booked: 156,
    status: "upcoming",
    createdBy: "Al-Bireh Sports Association",
  },
  {
    title: "Smart Cities & Tourism Tech Summit",
    titleAr: "قمة المدن الذكية وتكنولوجيا السياحة",
    description: "A full-day educational summit on smart city technologies, tourism innovation, and digital transformation in Palestine. Keynotes from leading tech experts and policymakers.",
    descriptionAr: "قمة تعليمية يوم كامل حول تقنيات المدن الذكية وابتكارات السياحة والتحول الرقمي في فلسطين. كلمات رئيسية من كبار خبراء التكنولوجيا وصانعي السياسات.",
    category: "educational",
    location: "Birzeit University, Conference Hall",
    locationAr: "جامعة بيرزيت، قاعة المؤتمرات",
    lat: 31.9760, lng: 35.1867,
    startDate: new Date("2026-08-25T09:00:00Z"),
    endDate: new Date("2026-08-25T18:00:00Z"),
    price: 25,
    pointsRequired: 500,
    pointsReward: 300,
    capacity: 200,
    booked: 143,
    status: "upcoming",
    createdBy: "Birzeit University",
  },
  {
    title: "Ramallah Open Air Cinema Night",
    titleAr: "ليلة السينما في الهواء الطلق برام الله",
    description: "Watch award-winning Palestinian films under the stars at Al-Tireh neighborhood's rooftop garden. Complimentary popcorn and local juice. Family friendly.",
    descriptionAr: "شاهد أفلامًا فلسطينية حائزة على جوائز تحت النجوم في حديقة سطح حي التيرة. فشار ومشروبات محلية مجانية. مناسب للعائلات.",
    category: "entertainment",
    location: "Al-Tireh Rooftop Garden, Ramallah",
    locationAr: "حديقة سطح التيرة، رام الله",
    lat: 31.9082, lng: 35.1935,
    startDate: new Date("2026-08-08T20:00:00Z"),
    endDate: new Date("2026-08-08T23:30:00Z"),
    price: 0,
    pointsRequired: 200,
    pointsReward: 75,
    capacity: 120,
    booked: 98,
    status: "upcoming",
    createdBy: "Al-Tireh Cultural Initiative",
  },
  {
    title: "Olive Harvest Community Day",
    titleAr: "يوم مجتمع قطف الزيتون",
    description: "Join local farmers in the olive harvest around Ramallah villages. Learn traditional pressing techniques, take home your own olive oil, and earn Eco + Jawwal Points.",
    descriptionAr: "انضم إلى المزارعين المحليين في قطف الزيتون في قرى رام الله. تعلم تقنيات العصر التقليدية، وخذ معك زيتك الخاص، واكسب نقاطًا بيئية ونقاط جوال.",
    category: "cultural",
    location: "Deir Ghassaneh Village, Ramallah",
    locationAr: "قرية دير غسانة، رام الله",
    lat: 32.0011, lng: 35.0572,
    startDate: new Date("2026-10-05T08:00:00Z"),
    endDate: new Date("2026-10-05T16:00:00Z"),
    price: 0,
    pointsRequired: 0,
    pointsReward: 250,
    capacity: 80,
    booked: 34,
    status: "upcoming",
    createdBy: "Palestinian Farmers Union",
  },
];

async function seedEvents() {
  const existing = await db.select({ id: eventsTable.id }).from(eventsTable).limit(1);
  if (existing.length > 0) return;
  await db.insert(eventsTable).values(SEED_EVENTS);
}

// ── GET /api/events ──────────────────────────────────────────────────────────
router.get("/events", async (req, res): Promise<void> => {
  await seedEvents();
  const { category, status, limit = "50" } = req.query as Record<string, string>;

  let query = db.select().from(eventsTable).orderBy(eventsTable.startDate).$dynamic();
  const conditions = [];
  if (category && category !== "all") conditions.push(eq(eventsTable.category, category));
  if (status  && status  !== "all") conditions.push(eq(eventsTable.status, status));
  if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;

  const events = await query.limit(parseInt(limit, 10));
  res.json(events.map(formatEvent));
});

// ── GET /api/events/my-bookings ──────────────────────────────────────────────
router.get("/events/my-bookings", async (req, res): Promise<void> => {
  const bookings = await db.select().from(eventBookingsTable)
    .where(eq(eventBookingsTable.userId, await getAppUserId(req)));
  const bookedIds = new Set(bookings.filter(b => b.status === "confirmed").map(b => b.eventId));
  res.json({ bookedEventIds: [...bookedIds] });
});

// ── GET /api/events/:id ──────────────────────────────────────────────────────
router.get("/events/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(formatEvent(event));
});

// ── POST /api/events ─────────────────────────────────────────────────────────
router.post("/events", async (req, res): Promise<void> => {
  const { title, titleAr, description, descriptionAr, category, location, locationAr,
          lat, lng, startDate, endDate, price, pointsRequired, pointsReward,
          capacity, status, createdBy } = req.body;
  if (!title || !category || !startDate || !endDate) {
    res.status(400).json({ error: "Missing required fields: title, category, startDate, endDate" });
    return;
  }
  const [event] = await db.insert(eventsTable).values({
    title, titleAr: titleAr ?? "", description: description ?? "",
    descriptionAr: descriptionAr ?? "", category,
    location: location ?? "", locationAr: locationAr ?? "",
    lat: parseFloat(lat) || 31.9, lng: parseFloat(lng) || 35.2,
    startDate: new Date(startDate), endDate: new Date(endDate),
    price: parseFloat(price) || 0,
    pointsRequired: parseInt(pointsRequired) || 0,
    pointsReward: parseInt(pointsReward) || 50,
    capacity: parseInt(capacity) || 0,
    booked: 0,
    status: status ?? "upcoming",
    createdBy: createdBy ?? "Municipality",
  }).returning();
  res.status(201).json(formatEvent(event));
});

// ── PUT /api/events/:id ──────────────────────────────────────────────────────
router.put("/events/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, titleAr, description, descriptionAr, category, location, locationAr,
          lat, lng, startDate, endDate, price, pointsRequired, pointsReward,
          capacity, status } = req.body;
  const [updated] = await db.update(eventsTable)
    .set({
      ...(title         !== undefined && { title }),
      ...(titleAr       !== undefined && { titleAr }),
      ...(description   !== undefined && { description }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(category      !== undefined && { category }),
      ...(location      !== undefined && { location }),
      ...(locationAr    !== undefined && { locationAr }),
      ...(lat           !== undefined && { lat: parseFloat(lat) }),
      ...(lng           !== undefined && { lng: parseFloat(lng) }),
      ...(startDate     !== undefined && { startDate: new Date(startDate) }),
      ...(endDate       !== undefined && { endDate: new Date(endDate) }),
      ...(price         !== undefined && { price: parseFloat(price) }),
      ...(pointsRequired !== undefined && { pointsRequired: parseInt(pointsRequired) }),
      ...(pointsReward  !== undefined && { pointsReward: parseInt(pointsReward) }),
      ...(capacity      !== undefined && { capacity: parseInt(capacity) }),
      ...(status        !== undefined && { status }),
      updatedAt: new Date(),
    })
    .where(eq(eventsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(formatEvent(updated));
});

// ── DELETE /api/events/:id ───────────────────────────────────────────────────
router.delete("/events/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.json({ success: true });
});

// ── POST /api/events/book ────────────────────────────────────────────────────
router.post("/events/book", async (req, res): Promise<void> => {
  const { eventId } = req.body;
  if (!eventId) { res.status(400).json({ error: "Missing eventId" }); return; }
  const id = parseInt(String(eventId), 10);

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  if (event.status === "cancelled" || event.status === "completed") {
    res.status(400).json({ error: "Event is no longer bookable" });
    return;
  }
  if (event.capacity > 0 && event.booked >= event.capacity) {
    res.status(400).json({ error: "Event is fully booked" });
    return;
  }

  // Check existing booking
  const existing = await db.select().from(eventBookingsTable)
    .where(and(eq(eventBookingsTable.eventId, id), eq(eventBookingsTable.userId, await getAppUserId(req))));
  if (existing.length > 0 && existing[0].status === "confirmed") {
    res.status(400).json({ error: "Already booked" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, await getAppUserId(req)));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Deduct points if required
  if (event.pointsRequired > 0) {
    if (user.jawwalPoints < event.pointsRequired) {
      res.status(400).json({ error: "Insufficient Jawwal Points" });
      return;
    }
    await db.update(usersTable)
      .set({ jawwalPoints: sql`${usersTable.jawwalPoints} - ${event.pointsRequired}` })
      .where(eq(usersTable.id, await getAppUserId(req)));
    await db.insert(pointsTransactionsTable).values({
      userId: await getAppUserId(req), type: "spend",
      points: event.pointsRequired, category: "tourism",
      description: `Event booking: ${event.title}`,
    });
  }

  // Award points reward
  if (event.pointsReward > 0) {
    await db.update(usersTable)
      .set({ jawwalPoints: sql`${usersTable.jawwalPoints} + ${event.pointsReward}` })
      .where(eq(usersTable.id, await getAppUserId(req)));
    await db.insert(pointsTransactionsTable).values({
      userId: await getAppUserId(req), type: "earn",
      points: event.pointsReward, category: "tourism",
      description: `Event attendance reward: ${event.title}`,
    });
  }

  // Create booking
  const [booking] = await db.insert(eventBookingsTable).values({
    eventId: id, userId: await getAppUserId(req),
    status: "confirmed",
    pointsUsed: event.pointsRequired,
  }).returning();

  // Increment booked count
  await db.update(eventsTable)
    .set({ booked: sql`${eventsTable.booked} + 1` })
    .where(eq(eventsTable.id, id));

  await db.insert(activityFeedTable).values({
    module: "tourism",
    action: "event_booked",
    description: `Booked "${event.title}" — earned ${event.pointsReward} Jawwal Points`,
    points: event.pointsReward,
    username: user.username,
    userId: await getAppUserId(req),
  });

  res.status(201).json({
    bookingId: booking.id,
    eventTitle: event.title,
    pointsUsed: event.pointsRequired,
    pointsEarned: event.pointsReward,
    newBalance: user.jawwalPoints - event.pointsRequired + event.pointsReward,
    status: booking.status,
  });
});

function formatEvent(e: typeof eventsTable.$inferSelect) {
  return {
    id: e.id, title: e.title, titleAr: e.titleAr,
    description: e.description, descriptionAr: e.descriptionAr,
    category: e.category, location: e.location, locationAr: e.locationAr,
    lat: e.lat, lng: e.lng,
    startDate: e.startDate, endDate: e.endDate,
    price: e.price, pointsRequired: e.pointsRequired, pointsReward: e.pointsReward,
    capacity: e.capacity, booked: e.booked, status: e.status,
    createdBy: e.createdBy, createdAt: e.createdAt,
    spotsLeft: e.capacity > 0 ? e.capacity - e.booked : null,
  };
}

export default router;
