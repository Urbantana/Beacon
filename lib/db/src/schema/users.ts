import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  avatarInitials: text("avatar_initials"),
  jawwalPoints: integer("jawwal_points").notNull().default(0),
  ecoPoints: integer("eco_points").notNull().default(0),
  driverLevel: text("driver_level").notNull().default("Bronze"),
  totalReports: integer("total_reports").notNull().default(0),
  achievements: text("achievements").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
