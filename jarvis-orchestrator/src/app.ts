import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import { orchestrate } from "./controllers/orchestratorController";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        timestamp: new Date().toISOString(),
        service: 'jarvis-orchestrator',
        version: '1.0.0'
    });
    next();
});

// Main web interface - serve static files
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "jarvis-orchestrator",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// API Routes
app.post("/api/v1/orchestrate", orchestrate);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error("Unhandled error", { 
        error: err.message, 
        stack: err.stack,
        path: req.path,
        service: 'jarvis-orchestrator'
    });
    
    res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString()
    });
});

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    logger.info(`JARVIS Orchestrator Service running on port ${PORT}`, {
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

export default app;