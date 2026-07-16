import { pgTable, text, serial, integer, boolean, real, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const touristSpotsTable = pgTable("tourist_spots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // heritage, culture, market, event, park
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  description: text("description").notNull(),
  crowdLevel: text("crowd_level").notNull().default("low"), // low, medium, high
  hasTrafficWarning: boolean("has_traffic_warning").notNull().default(false),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTouristSpotSchema = createInsertSchema(touristSpotsTable).omit({ id: true, createdAt: true });
export type InsertTouristSpot = z.infer<typeof insertTouristSpotSchema>;
export type TouristSpot = typeof touristSpotsTable.$inferSelect;

export const touristEventsTable = pgTable("tourist_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  venueId: integer("venue_id").notNull(),
  venueName: text("venue_name").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  pointsReward: integer("points_reward").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTouristEventSchema = createInsertSchema(touristEventsTable).omit({ id: true, createdAt: true });
export type InsertTouristEvent = z.infer<typeof insertTouristEventSchema>;
export type TouristEvent = typeof touristEventsTable.$inferSelect;
