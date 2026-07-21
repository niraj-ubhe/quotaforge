import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "QuotaForge API is running"
    });
});

export default app;