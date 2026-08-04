import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull().default(""),
  description: text("description").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  // cultural | entertainment | educational | sports
  category: text("category").notNull().default("cultural"),
  location: text("location").notNull().default(""),
  locationAr: text("location_ar").notNull().default(""),
  lat: real("lat").notNull().default(31.9),
  lng: real("lng").notNull().default(35.2),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  price: real("price").notNull().default(0),
  pointsRequired: integer("points_required").notNull().default(0),
  pointsReward: integer("points_reward").notNull().default(50),
  imageUrl: text("image_url"),
  capacity: integer("capacity").notNull().default(0),
  booked: integer("booked").notNull().default(0),
  // upcoming | ongoing | completed | cancelled
  status: text("status").notNull().default("upcoming"),
  createdBy: text("created_by").notNull().default("Municipality"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;

export const eventBookingsTable = pgTable("event_bookings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  bookingDate: timestamp("booking_date", { withTimezone: true }).notNull().defaultNow(),
  // confirmed | cancelled | attended
  status: text("status").notNull().default("confirmed"),
  pointsUsed: integer("points_used").notNull().default(0),
});

export const insertEventBookingSchema = createInsertSchema(eventBookingsTable).omit({ id: true, bookingDate: true });
export type InsertEventBooking = z.infer<typeof insertEventBookingSchema>;
export type EventBooking = typeof eventBookingsTable.$inferSelect;
