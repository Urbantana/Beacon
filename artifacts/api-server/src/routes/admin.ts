import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/admin/stats — single-query aggregate for Admin Status Dashboard
router.get("/admin/stats", async (_req, res): Promise<void> => {
  try {
    // Run all counts in parallel for speed
    const [
      usersResult,
      eventsResult,
      complaintsResult,
      fuelReportsResult,
      toursResult,
      pointsResult,
      trafficResult,
      wasteResult,
      suggestionsResult,
      tourBookingsResult,
    ] = await Promise.all([
      // Total users
      db.execute(sql`SELECT COUNT(*)::int AS count FROM users`),

      // Events by status
      db.execute(sql`
        SELECT status, COUNT(*)::int AS count
        FROM events
        GROUP BY status
      `),

      // Complaints by status
      db.execute(sql`
        SELECT status, COUNT(*)::int AS count
        FROM complaints
        GROUP BY status
      `),

      // Fuel reports total + today
      db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE reported_at >= NOW() - INTERVAL '24 hours')::int AS today
        FROM fuel_reports
      `),

      // Tours by status
      db.execute(sql`
        SELECT status, COUNT(*)::int AS count, SUM(current_participants)::int AS total_participants
        FROM tours
        GROUP BY status
      `),

      // Points: total earned, total spent
      db.execute(sql`
        SELECT
          COALESCE(SUM(points) FILTER (WHERE type = 'earn'), 0)::int AS total_earned,
          COALESCE(ABS(SUM(points) FILTER (WHERE type = 'spend')), 0)::int AS total_spent,
          COUNT(*)::int AS total_transactions
        FROM points_transactions
      `),

      // Traffic reports
      db.execute(sql`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'active')::int AS active
        FROM traffic_reports
      `),

      // Waste reports
      db.execute(sql`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
        FROM waste_reports
      `),

      // Suggestions
      db.execute(sql`
        SELECT status, COUNT(*)::int AS count
        FROM suggestions
        GROUP BY status
      `),

      // Tour bookings
      db.execute(sql`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed
        FROM tour_bookings
      `),
    ]);

    // ── Parse results ──────────────────────────────────────────────────────────
    const totalUsers = (usersResult.rows[0] as any)?.count ?? 0;

    const eventsByStatus: Record<string, number> = {};
    for (const row of eventsResult.rows as any[]) {
      eventsByStatus[row.status] = row.count;
    }
    const totalEvents = Object.values(eventsByStatus).reduce((a, b) => a + b, 0);
    const upcomingEvents = eventsByStatus["upcoming"] ?? 0;
    const ongoingEvents  = eventsByStatus["ongoing"]  ?? 0;

    const complaintsByStatus: Record<string, number> = {};
    for (const row of complaintsResult.rows as any[]) {
      complaintsByStatus[row.status] = row.count;
    }
    const totalComplaints = Object.values(complaintsByStatus).reduce((a, b) => a + b, 0);

    const fuelRow = fuelReportsResult.rows[0] as any;
    const fuelReports = { total: fuelRow?.total ?? 0, today: fuelRow?.today ?? 0 };

    const toursByStatus: Record<string, number> = {};
    let totalParticipants = 0;
    for (const row of toursResult.rows as any[]) {
      toursByStatus[row.status] = row.count;
      totalParticipants += row.total_participants ?? 0;
    }
    const totalTours = Object.values(toursByStatus).reduce((a, b) => a + b, 0);

    const pointsRow = pointsResult.rows[0] as any;
    const points = {
      totalEarned:      pointsRow?.total_earned      ?? 0,
      totalSpent:       pointsRow?.total_spent        ?? 0,
      totalTransactions: pointsRow?.total_transactions ?? 0,
    };

    const trafficRow = trafficResult.rows[0] as any;
    const traffic = { total: trafficRow?.total ?? 0, active: trafficRow?.active ?? 0 };

    const wasteRow = wasteResult.rows[0] as any;
    const waste = { total: wasteRow?.total ?? 0, pending: wasteRow?.pending ?? 0 };

    const suggestionsByStatus: Record<string, number> = {};
    for (const row of suggestionsResult.rows as any[]) {
      suggestionsByStatus[row.status] = row.count;
    }
    const totalSuggestions = Object.values(suggestionsByStatus).reduce((a, b) => a + b, 0);

    const tbRow = tourBookingsResult.rows[0] as any;
    const tourBookings = { total: tbRow?.total ?? 0, confirmed: tbRow?.confirmed ?? 0 };

    res.json({
      updatedAt: new Date().toISOString(),
      users: { total: totalUsers },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        ongoing: ongoingEvents,
        byStatus: eventsByStatus,
      },
      complaints: {
        total: totalComplaints,
        byStatus: {
          pending:     complaintsByStatus["pending"]     ?? 0,
          reviewing:   complaintsByStatus["reviewing"]   ?? 0,
          in_progress: complaintsByStatus["in_progress"] ?? 0,
          resolved:    complaintsByStatus["resolved"]    ?? 0,
        },
      },
      fuelReports,
      tours: {
        total: totalTours,
        upcoming: toursByStatus["upcoming"] ?? 0,
        totalParticipants,
        bookings: tourBookings,
        byStatus: toursByStatus,
      },
      points,
      traffic,
      waste,
      suggestions: {
        total: totalSuggestions,
        byStatus: suggestionsByStatus,
      },
      server: { status: "online" },
    });
  } catch (err) {
    console.error("admin/stats error", err);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

export default router;
