import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";

export const fuelStationsTable = pgTable("fuel_stations", {
  id:                    serial("id").primaryKey(),
  name:                  text("name").notNull(),
  nameAr:                text("name_ar").notNull().default(""),
  location:              text("location").notNull().default(""),
  locationAr:            text("location_ar").notNull().default(""),
  lat:                   real("lat").notNull(),
  lng:                   real("lng").notNull(),
  // petrol | diesel | both
  fuelTypes:             text("fuel_types").notNull().default("both"),
  // available | unavailable | unknown
  status:                text("status").notNull().default("unknown"),
  petrolAvailable:       boolean("petrol_available").notNull().default(false),
  dieselAvailable:       boolean("diesel_available").notNull().default(false),
  queueLength:           integer("queue_length").notNull().default(0),
  estimatedWaitMinutes:  integer("estimated_wait_minutes").notNull().default(0),
  confidenceLevel:       integer("confidence_level").notNull().default(0), // 0-100
  lastReportAt:          timestamp("last_report_at", { withTimezone: true }),
  operatingHours:        text("operating_hours").notNull().default("24/7"),
  createdAt:             timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FuelStation = typeof fuelStationsTable.$inferSelect;

export const fuelReportsTable = pgTable("fuel_reports", {
  id:          serial("id").primaryKey(),
  stationId:   integer("station_id").notNull(),
  userId:      integer("user_id").notNull(),
  // petrol | diesel | both
  fuelType:    text("fuel_type").notNull().default("both"),
  isAvailable: boolean("is_available").notNull(),
  queueLength: integer("queue_length").notNull().default(0),
  notes:       text("notes").notNull().default(""),
  reportedAt:  timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FuelReport = typeof fuelReportsTable.$inferSelect;

export const fuelBookingsTable = pgTable("fuel_bookings", {
  id:           serial("id").primaryKey(),
  stationId:    integer("station_id").notNull(),
  userId:       integer("user_id").notNull(),
  bookingCode:  text("booking_code").notNull().unique(),
  scheduledAt:  timestamp("scheduled_at", { withTimezone: true }).notNull(),
  fuelType:     text("fuel_type").notNull().default("petrol"),
  // pending | confirmed | cancelled | completed
  status:       text("status").notNull().default("confirmed"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FuelBooking = typeof fuelBookingsTable.$inferSelect;
