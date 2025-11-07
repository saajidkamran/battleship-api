import express from "express";
import { securityMiddleware } from "./middlewares/security";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import gameRoutes from "./routes/v1/gameRoutes";

const app = express();

// ---Middlewares ---
app.use(securityMiddleware);
app.use(rateLimiter);

// --- Routes ---
app.use("/api/v1/game", gameRoutes);

// --- Global Error Handler ---
app.use(errorHandler);

export default app;
