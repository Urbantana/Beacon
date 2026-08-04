import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import touristRouter from "./tourist";
import trafficRouter from "./traffic";
import wasteRouter from "./waste";
import accessibilityRouter from "./accessibility";
import pointsRouter from "./points";
import dashboardRouter from "./dashboard";
import municipalityRouter from "./municipality";
import storeRouter from "./store";
import eventsRouter from "./events";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(profileRouter);
router.use(touristRouter);
router.use(trafficRouter);
router.use(wasteRouter);
router.use(accessibilityRouter);
router.use(pointsRouter);
router.use(dashboardRouter);
router.use(municipalityRouter);
router.use(storeRouter);
router.use(eventsRouter);

export default router;
