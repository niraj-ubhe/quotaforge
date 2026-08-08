import { Request, Response, NextFunction } from "express";
import redis from "../lib/redis";

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // apiKeyMiddleware should have added req.api
  if (!req.api) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // Get the rate limit that was already fetched by apiKeyMiddleware
  const limit = req.api.requestsPerMinute;

  // Create a unique Redis key for this API key
  const redisKey = `rate_limit:${req.api.apiKeyId}`;

  // Increment the request counter
  const currentRequests = await redis.incr(redisKey);

  // Start a new 60-second window
  if (currentRequests === 1) {
    await redis.expire(redisKey, 60);
  }

  // Check whether the limit has been exceeded
  if (currentRequests > limit) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded",
    });
  }

  next();
};