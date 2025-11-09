import express from "express";
import { securityMiddleware } from "./middlewares/security";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { requestIdMiddleware } from "./middlewares/requestId";
import gameRoutes from "./routes/v1/gameRoutes";
import healthRoutes from "./routes/v1/healthRoutes";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// ---Middlewares ---
app.use(requestIdMiddleware);
app.use(securityMiddleware);
app.use(rateLimiter);

// --- Routes ---
app.use("/health", healthRoutes);
app.use("/api/v1/game", gameRoutes);

// --- Global Error Handler ---
app.use(errorHandler);

export default app;
