// Helmet, CORS, XSS middleware
import helmet from "helmet";
import cors from "cors";
import express from "express";
import { env } from "../config/env";

const corsOrigins = env.CORS_ORIGIN 
  ? env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : ["http://localhost:5173"];

export const securityMiddleware = [
  helmet({
    // Production-ready security headers
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
  }),
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "DELETE"], // Include DELETE for delete endpoints
    allowedHeaders: ["Content-Type", "Idempotency-Key"],
    credentials: false, // Set to true if using cookies/auth
  }),
  express.json({ limit: "1kb" }), // limit request body
];
