import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/api.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createApiSchema, updateApiSchema } from "../validators/api.validator";

const router = Router();

router.post("/", authMiddleware, validate(createApiSchema), create);

router.get("/", authMiddleware, getAll);

router.get("/:id", authMiddleware, getOne);

router.patch("/:id", authMiddleware, validate(updateApiSchema), update);

router.delete("/:id", authMiddleware, remove);

export default router;
