import helmet from "helmet";
import cors from "cors";
import express from "express";
import { env } from "../config/env";

const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }),
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Idempotency-Key"],
    credentials: false, // Set to true if using cookies/auth
  }),
  express.json({ limit: "1kb" }),
];
