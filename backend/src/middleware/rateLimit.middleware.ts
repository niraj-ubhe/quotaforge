import { Request, Response, NextFunction } from "express";
import redis from "../lib/redis";
import { slidingWindow } from "../services/rateLimit/slidingWindow.service";
import { tokenBucket } from "../services/rateLimit/tokenBucket.service";

import { logRequest } from "../services/analytics.service";

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

  // Get rate-limit settings from the API
  const limit = req.api.requestsPerMinute;
  const algorithm = req.api.rateLimitAlgorithm;

  // Unique Redis key for this API key
  const redisKey = `rate_limit:${req.api.apiKeyId}`;

  // -------------------------------
  // FIXED WINDOW
  // -------------------------------
  if (algorithm === "FIXED_WINDOW") {
    const currentRequests = await redis.incr(redisKey);

    // Start a new 60-second window
    if (currentRequests === 1) {
      await redis.expire(redisKey, 60);
    }

    // Limit exceeded
    if (currentRequests > limit) {
      await logRequest({
        apiId: req.api.apiId,
        apiKeyId: req.api.apiKeyId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 429,
        responseTime: 0,
      });

      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
      });
    }
  }

  // -------------------------------
  // SLIDING WINDOW
  // -------------------------------
  else if (algorithm === "SLIDING_WINDOW") {
    const allowed = await slidingWindow(redisKey, limit, 60);

    if (!allowed) {
      await logRequest({
        apiId: req.api.apiId,
        apiKeyId: req.api.apiKeyId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 429,
        responseTime: 0,
      });

      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
      });
    }
  }

  // -------------------------------
  //TOKEN BUCKET
  // -------------------------------
  else if (algorithm === "TOKEN_BUCKET") {
    const refillRate = limit / 60;

    const allowed = await tokenBucket(redisKey, limit, refillRate);

    if (!allowed) {
      await logRequest({
        apiId: req.api.apiId,
        apiKeyId: req.api.apiKeyId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 429,
        responseTime: 0,
      });

      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
      });
    }
  }

  next();
};
