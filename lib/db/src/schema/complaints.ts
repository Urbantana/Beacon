import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const complaintsTable = pgTable("complaints", {
  id:          serial("id").primaryKey(),
  trackingId:  text("tracking_id").notNull().unique(),
  title:       text("title").notNull(),
  description: text("description").notNull().default(""),
  // pothole | waste | obstacle | lighting | vandalism | other
  category:    text("category").notNull().default("other"),
  location:    text("location").notNull().default(""),
  lat:         real("lat"),
  lng:         real("lng"),
  photoUrl:    text("photo_url"),
  userId:      integer("user_id").notNull(),
  username:    text("username").notNull().default("Citizen"),
  // pending | under_review | in_progress | resolved
  status:      text("status").notNull().default("pending"),
  notes:       text("notes").notNull().default(""),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Complaint = typeof complaintsTable.$inferSelect;
