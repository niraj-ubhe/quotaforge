import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: req.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
};

export default requestLogger;
