import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const toursTable = pgTable("tours", {
  id:                  serial("id").primaryKey(),
  title:               text("title").notNull(),
  titleAr:             text("title_ar").notNull().default(""),
  description:         text("description").notNull().default(""),
  descriptionAr:       text("description_ar").notNull().default(""),
  // cultural | adventure | historical | food | nature
  category:            text("category").notNull().default("cultural"),
  location:            text("location").notNull().default(""),
  locationAr:          text("location_ar").notNull().default(""),
  lat:                 real("lat").notNull().default(31.9),
  lng:                 real("lng").notNull().default(35.2),
  durationMinutes:     integer("duration_minutes").notNull().default(120),
  maxParticipants:     integer("max_participants").notNull().default(10),
  currentParticipants: integer("current_participants").notNull().default(0),
  pricePoints:         integer("price_points").notNull().default(0),
  pointsReward:        integer("points_reward").notNull().default(50),
  guideId:             integer("guide_id").notNull(),
  guideName:           text("guide_name").notNull().default(""),
  tourDate:            timestamp("tour_date", { withTimezone: true }).notNull(),
  // upcoming | ongoing | completed | cancelled
  status:              text("status").notNull().default("upcoming"),
  createdAt:           timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTourSchema = createInsertSchema(toursTable).omit({ id: true, createdAt: true });
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof toursTable.$inferSelect;

export const tourBookingsTable = pgTable("tour_bookings", {
  id:          serial("id").primaryKey(),
  tourId:      integer("tour_id").notNull(),
  userId:      integer("user_id").notNull(),
  pointsUsed:  integer("points_used").notNull().default(0),
  // confirmed | cancelled | attended
  status:      text("status").notNull().default("confirmed"),
  bookedAt:    timestamp("booked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TourBooking = typeof tourBookingsTable.$inferSelect;
