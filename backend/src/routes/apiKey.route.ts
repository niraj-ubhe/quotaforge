import { Router } from "express";

import {
  create,
  getAll,
  revoke,
  activate,
} from "../controllers/apiKey.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createApiKeySchema } from "../validators/apiKey.validator";

const router = Router();

router.post("/", authMiddleware, validate(createApiKeySchema), create);

router.get("/", authMiddleware, getAll);

router.patch("/:id/revoke", authMiddleware, revoke);

router.patch("/:id/activate", authMiddleware, activate);

export default router;
