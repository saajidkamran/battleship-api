import express from "express";
import { securityMiddleware } from "./middlewares/security";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import gameRoutes from "./routes/gameRoutes";

const app = express();

// --- Global Middlewares ---
app.use(securityMiddleware);
app.use(rateLimiter);

// --- Routes ---
app.use("/game", gameRoutes);

// --- Global Error Handler ---
app.use(errorHandler);

export default app;
