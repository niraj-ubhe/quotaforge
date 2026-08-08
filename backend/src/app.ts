import express from "express";
import cors from "cors";

import requestLogger from "./middleware/requestLogger";
import {errorMiddleware} from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import apiRoutes from "./routes/api.route";
import apiKeyRoutes from "./routes/apiKey.route";
import gatewayRoutes from "./routes/gateway.route";
import analyticsRoutes from "./routes/analytics.route";

import AppError from "./errors/AppError";

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuotaForge API is running",
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/apis", apiRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/gateway", gatewayRoutes);
app.use("/analytics", analyticsRoutes);

// Test Route
app.get("/error", (req, res, next) => {
  next(new AppError("Testing error handler", 400));
});

// Global Error Handler (must be last)
app.use(errorMiddleware);

export default app;