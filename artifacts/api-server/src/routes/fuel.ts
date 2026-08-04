import { Router, type IRouter } from "express";
import { db, fuelStationsTable, fuelReportsTable, fuelBookingsTable, pointsTransactionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getAppUserId } from "../lib/getAppUserId";
import crypto from "crypto";

const router: IRouter = Router();

const SEED_STATIONS = [
  { name: "Al-Bira Central Station", nameAr: "محطة البيرة المركزية", location: "Al-Bireh, West Bank", locationAr: "البيرة، الضفة الغربية", lat: 31.9152, lng: 35.2253, fuelTypes: "both", status: "available", petrolAvailable: true, dieselAvailable: true, queueLength: 8, estimatedWaitMinutes: 25, confidenceLevel: 85, operatingHours: "6:00 - 22:00" },
  { name: "Ramallah Main Station", nameAr: "محطة رام الله الرئيسية", location: "Ramallah City Center", locationAr: "وسط مدينة رام الله", lat: 31.9040, lng: 35.2016, fuelTypes: "petrol", status: "available", petrolAvailable: true, dieselAvailable: false, queueLength: 12, estimatedWaitMinutes: 35, confidenceLevel: 92, operatingHours: "24/7" },
  { name: "Jifna Road Station", nameAr: "محطة طريق جفنا", location: "North Ramallah, Road 60", locationAr: "شمال رام الله، طريق 60", lat: 31.9231, lng: 35.2104, fuelTypes: "both", status: "unavailable", petrolAvailable: false, dieselAvailable: false, queueLength: 0, estimatedWaitMinutes: 0, confidenceLevel: 70, operatingHours: "7:00 - 20:00" },
  { name: "Industrial Zone Station", nameAr: "محطة المنطقة الصناعية", location: "Industrial Zone, Ramallah", locationAr: "المنطقة الصناعية، رام الله", lat: 31.8970, lng: 35.2200, fuelTypes: "diesel", status: "available", petrolAvailable: false, dieselAvailable: true, queueLength: 3, estimatedWaitMinutes: 10, confidenceLevel: 60, operatingHours: "6:00 - 18:00" },
];

async function seedStations() {
  const existing = await db.select().from(fuelStationsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(fuelStationsTable).values(SEED_STATIONS);
  }
}

// GET /api/fuel/stations
router.get("/fuel/stations", async (_req, res): Promise<void> => {
  await seedStations();
  const stations = await db.select().from(fuelStationsTable).orderBy(fuelStationsTable.name);
  res.json(stations);
});

// GET /api/fuel/stations/:id
router.get("/fuel/stations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [station] = await db.select().from(fuelStationsTable).where(eq(fuelStationsTable.id, id));
  if (!station) { res.status(404).json({ error: "Station not found" }); return; }
  res.json(station);
});

// POST /api/fuel/report — citizen fuel report
router.post("/fuel/report", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const { stationId, fuelType, isAvailable, queueLength, notes } = req.body;
  if (!stationId) { res.status(400).json({ error: "Station ID is required" }); return; }

  const [report] = await db.insert(fuelReportsTable).values({
    stationId: parseInt(stationId), userId, fuelType: fuelType || "both",
    isAvailable: Boolean(isAvailable), queueLength: parseInt(queueLength) || 0,
    notes: notes || "",
  }).returning();

  // Update station status based on recent reports
  const recentReports = await db.select().from(fuelReportsTable)
    .where(eq(fuelReportsTable.stationId, parseInt(stationId)))
    .orderBy(desc(fuelReportsTable.reportedAt)).limit(5);
  const availableCount = recentReports.filter(r => r.isAvailable).length;
  const newStatus = availableCount >= Math.ceil(recentReports.length / 2) ? "available" : "unavailable";
  const avgQueue = Math.round(recentReports.reduce((s, r) => s + r.queueLength, 0) / recentReports.length);
  const confidence = Math.min(100, recentReports.length * 20);

  await db.update(fuelStationsTable).set({
    status: newStatus, queueLength: avgQueue,
    estimatedWaitMinutes: avgQueue * 3,
    confidenceLevel: confidence,
    petrolAvailable: fuelType === "both" || fuelType === "petrol" ? Boolean(isAvailable) : undefined,
    dieselAvailable: fuelType === "both" || fuelType === "diesel" ? Boolean(isAvailable) : undefined,
    lastReportAt: new Date(),
  }).where(eq(fuelStationsTable.id, parseInt(stationId)));

  // Reward points for reporting
  await db.insert(pointsTransactionsTable).values({
    userId, points: 20, category: "eco", type: "earn",
    description: `Reported fuel status at station #${stationId}`,
  });

  res.json({ success: true, report, pointsEarned: 20 });
});

// GET /api/fuel/bookings — user's bookings
router.get("/fuel/bookings", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const bookings = await db.select().from(fuelBookingsTable)
    .where(eq(fuelBookingsTable.userId, userId))
    .orderBy(desc(fuelBookingsTable.scheduledAt)).limit(20);
  res.json(bookings);
});

// POST /api/fuel/book — book a time slot
router.post("/fuel/book", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const { stationId, scheduledAt, fuelType } = req.body;
  if (!stationId || !scheduledAt) {
    res.status(400).json({ error: "Station ID and scheduled time are required" });
    return;
  }
  const bookingCode = `FUEL-${crypto.randomInt(100000, 999999)}`;
  const [booking] = await db.insert(fuelBookingsTable).values({
    stationId: parseInt(stationId), userId,
    bookingCode, scheduledAt: new Date(scheduledAt),
    fuelType: fuelType || "petrol", status: "confirmed",
  }).returning();

  // Increment queue length
  const [station] = await db.select().from(fuelStationsTable).where(eq(fuelStationsTable.id, parseInt(stationId)));
  if (station) {
    await db.update(fuelStationsTable).set({
      queueLength: station.queueLength + 1,
      estimatedWaitMinutes: (station.queueLength + 1) * 3,
    }).where(eq(fuelStationsTable.id, parseInt(stationId)));
  }

  res.json({ success: true, booking });
});

// DELETE /api/fuel/bookings/:id — cancel booking
router.delete("/fuel/bookings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [booking] = await db.select().from(fuelBookingsTable).where(eq(fuelBookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(fuelBookingsTable).set({ status: "cancelled" }).where(eq(fuelBookingsTable.id, id));

  // Decrement queue
  const [station] = await db.select().from(fuelStationsTable).where(eq(fuelStationsTable.id, booking.stationId));
  if (station && station.queueLength > 0) {
    await db.update(fuelStationsTable).set({
      queueLength: station.queueLength - 1,
      estimatedWaitMinutes: Math.max(0, (station.queueLength - 1) * 3),
    }).where(eq(fuelStationsTable.id, booking.stationId));
  }

  res.json({ success: true });
});

export default router;
