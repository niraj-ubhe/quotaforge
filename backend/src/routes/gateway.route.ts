import { Router } from "express";
import { proxy } from "../controllers/gateway.controller";
import { apiKeyMiddleware } from "../middleware/apiKey.middleware";
import { rateLimitMiddleware } from "../middleware/rateLimit.middleware";


const router = Router();

router.all("/:apiId/*path", apiKeyMiddleware, proxy);

router.all("/:apiId/*path", apiKeyMiddleware, rateLimitMiddleware, proxy);

export default router;
