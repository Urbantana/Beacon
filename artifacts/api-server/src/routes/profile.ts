import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = 1;

router.get("/profile", async (req, res): Promise<void> => {
  let [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  if (!user) {
    const [created] = await db.insert(usersTable).values({
      username: "CityExplorer",
      avatarInitials: "CE",
      jawwalPoints: 150,
      ecoPoints: 75,
      driverLevel: "Silver",
      totalReports: 3,
      achievements: ["First Report", "Eco Warrior", "Route Master"],
    }).returning();
    user = created;
  }
  res.json({
    id: user.id,
    username: user.username,
    jawwalPoints: user.jawwalPoints,
    ecoPoints: user.ecoPoints,
    driverLevel: user.driverLevel,
    totalReports: user.totalReports,
    achievements: user.achievements,
    avatarInitials: user.avatarInitials,
  });
});

router.put("/profile", async (req, res): Promise<void> => {
  const { username, avatarInitials } = req.body;
  const [user] = await db.update(usersTable)
    .set({ username, avatarInitials })
    .where(eq(usersTable.id, DEFAULT_USER_ID))
    .returning();
  if (!user) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    jawwalPoints: user.jawwalPoints,
    ecoPoints: user.ecoPoints,
    driverLevel: user.driverLevel,
    totalReports: user.totalReports,
    achievements: user.achievements,
    avatarInitials: user.avatarInitials,
  });
});

export default router;
