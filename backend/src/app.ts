import express from "express";
import cors from "cors";
import helmet from "helmet";

import requestLogger from "./middleware/requestLogger";
import {errorMiddleware} from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import apiRoutes from "./routes/api.route";
import apiKeyRoutes from "./routes/apiKey.route";
import gatewayRoutes from "./routes/gateway.route";
import analyticsRoutes from "./routes/analytics.route";

import AppError from "./errors/AppError";
import swaggerUi from "swagger-ui-express";
import openApiDocument from "./docs/openapi";

const app = express();

// Global Middleware
app.set("trust proxy", 1);
const allowedOrigins = new Set([
  "https://quotaforge.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_ORIGIN,
].filter((origin): origin is string => Boolean(origin)));
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
}));
const defaultHelmet = helmet();
const swaggerHelmet = helmet({ contentSecurityPolicy: false });
app.use((req, res, next) =>
  req.path.startsWith("/api-docs")
    ? swaggerHelmet(req, res, next)
    : defaultHelmet(req, res, next),
);
app.use(express.json());
app.use(requestLogger);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuotaForge API is running",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Routes
app.use("/auth", authRoutes);
app.use("/apis", apiRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/gateway", gatewayRoutes);
app.use("/analytics", analyticsRoutes);

// Test Route
if (process.env.NODE_ENV !== "production") {
  app.get("/error", (req, res, next) => {
    next(new AppError("Testing error handler", 400));
  });
}

// Global Error Handler (must be last)
app.use(errorMiddleware);

export default app;
