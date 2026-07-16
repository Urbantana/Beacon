import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import touristRouter from "./tourist";
import trafficRouter from "./traffic";
import wasteRouter from "./waste";
import accessibilityRouter from "./accessibility";
import pointsRouter from "./points";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(touristRouter);
router.use(trafficRouter);
router.use(wasteRouter);
router.use(accessibilityRouter);
router.use(pointsRouter);
router.use(dashboardRouter);

export default router;
