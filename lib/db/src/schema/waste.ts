import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wasteReportsTable = pgTable("waste_reports", {
  id: serial("id").primaryKey(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  type: text("type").notNull(), // overflowing_bin, mixed_waste, litter, other
  status: text("status").notNull().default("pending"), // pending, in_progress, resolved
  description: text("description").notNull().default(""),
  ecoPointsAwarded: integer("eco_points_awarded").notNull().default(25),
  userId: integer("user_id"),
  reporterUsername: text("reporter_username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWasteReportSchema = createInsertSchema(wasteReportsTable).omit({ id: true, createdAt: true });
export type InsertWasteReport = z.infer<typeof insertWasteReportSchema>;
export type WasteReport = typeof wasteReportsTable.$inferSelect;
