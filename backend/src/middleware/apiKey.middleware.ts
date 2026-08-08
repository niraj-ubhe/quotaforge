import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";

export const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key is required",
    });
  }

  const [prefix, secret] = apiKey.split(".");

  if (!prefix || !secret) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key format",
    });
  }

  const storedKey = await prisma.apiKey.findUnique({
    where: {
      prefix,
    },
    include: {
      api: true,
    },
  });

  if (!storedKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key",
    });
  }

  if (!storedKey.isActive) {
    return res.status(401).json({
      success: false,
      message: "API key has been revoked",
    });
  }

  const isValid = await bcrypt.compare(secret, storedKey.keyHash);

  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key",
    });
  }

  req.api = {
    apiKeyId: storedKey.id,
    apiId: storedKey.apiId,
    baseUrl: storedKey.api.baseUrl,
    requestsPerMinute: storedKey.api.requestsPerMinute,
  };

  next();
};
