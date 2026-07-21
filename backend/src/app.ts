import express from "express";
import cors from "cors";
import requestLogger from "./middleware/requestLogger";
import errorHandler from "./middleware/errorHandler";
import AppError from "./errors/AppError";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(requestLogger);

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuotaForge API is running",
  });
});

app.get("/error", (req, res, next) => {
  next(new AppError("Testing error handler", 400));
});

app.use(errorHandler);
export default app;
