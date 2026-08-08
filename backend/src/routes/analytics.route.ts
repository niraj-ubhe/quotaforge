import { Router } from "express";

import {
  overview,
  apiAnalytics,
  topEndpoints,
  statusCodes,
} from "../controllers/analytics.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/overview", authMiddleware, overview);
router.get("/apis/:apiId", authMiddleware, apiAnalytics);
router.get("/apis/:apiId/top-endpoints", authMiddleware, topEndpoints);
router.get("/apis/:apiId/status-codes", authMiddleware, statusCodes);

export default router;
