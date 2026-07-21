import express from "express";
import cors from "cors";
import requestLogger from "./middleware/requestLogger";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(requestLogger);

// Routes
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "QuotaForge API is running"
    });
});

export default app;