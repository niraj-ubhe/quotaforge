import { Router } from "express";

import {
  overview,
  apiAnalytics,
  topEndpoints,
  statusCodes,
  timeline,
} from "../controllers/analytics.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/overview", authMiddleware, overview);
router.get("/apis/:apiId", authMiddleware, apiAnalytics);
router.get("/apis/:apiId/top-endpoints", authMiddleware, topEndpoints);
router.get("/apis/:apiId/status-codes", authMiddleware, statusCodes);
router.get("/apis/:apiId/timeline", authMiddleware, timeline);

export default router;
