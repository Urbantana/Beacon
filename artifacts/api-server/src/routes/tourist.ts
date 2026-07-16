import { Router, type IRouter } from "express";
import { db, touristSpotsTable, touristEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/tourist/spots", async (_req, res): Promise<void> => {
  const spots = await db.select().from(touristSpotsTable);
  res.json(spots.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    lat: s.lat,
    lng: s.lng,
    description: s.description,
    crowdLevel: s.crowdLevel,
    hasTrafficWarning: s.hasTrafficWarning,
    imageUrl: s.imageUrl,
  })));
});

router.get("/tourist/events", async (_req, res): Promise<void> => {
  const events = await db.select().from(touristEventsTable);
  res.json(events.map(e => ({
    id: e.id,
    name: e.name,
    venueId: e.venueId,
    venueName: e.venueName,
    startDate: e.startDate,
    endDate: e.endDate,
    category: e.category,
    description: e.description,
    pointsReward: e.pointsReward,
  })));
});

export default router;
