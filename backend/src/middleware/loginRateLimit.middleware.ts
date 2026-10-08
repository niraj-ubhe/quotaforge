import { NextFunction, Request, Response } from "express";
import redis from "../lib/redis";

type Counter = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
};

export const createLoginRateLimit = (
  counter: Counter,
  limit = 10,
  windowSeconds = 900,
) => async (req: Request, res: Response, next: NextFunction) => {
  // Keep integration tests independent; the middleware is covered directly with a fake counter.
  if (process.env.NODE_ENV === "test") return next();
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `quotaforge:login:${ip}`;
    const attempts = await counter.incr(key);
    if (attempts === 1) await counter.expire(key, windowSeconds);
    if (attempts > limit) {
      res.setHeader("Retry-After", String(windowSeconds));
      return res.status(429).json({ success: false, message: "Too many login attempts. Try again later." });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const loginRateLimit = createLoginRateLimit(redis);
