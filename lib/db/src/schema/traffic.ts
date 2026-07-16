import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trafficReportsTable = pgTable("traffic_reports", {
  id: serial("id").primaryKey(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  description: text("description").notNull(),
  status: text("status").notNull().default("active"), // active, resolved
  userId: integer("user_id"),
  reporterUsername: text("reporter_username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrafficReportSchema = createInsertSchema(trafficReportsTable).omit({ id: true, createdAt: true });
export type InsertTrafficReport = z.infer<typeof insertTrafficReportSchema>;
export type TrafficReport = typeof trafficReportsTable.$inferSelect;
