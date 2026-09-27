import { Router } from "express";

import { register, login, loginDemo, getMe } from "../controllers/auth.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/demo", loginDemo);

router.get("/me", authMiddleware, getMe);

export default router;
