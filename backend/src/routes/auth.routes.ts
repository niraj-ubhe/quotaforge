import { Router } from "express";

import { register, login, loginDemo, getMe } from "../controllers/auth.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { loginRateLimit } from "../middleware/loginRateLimit.middleware";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", loginRateLimit, validate(loginSchema), login);

router.post("/demo", loginDemo);

router.get("/me", authMiddleware, getMe);

export default router;
