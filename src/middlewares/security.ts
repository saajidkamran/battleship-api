// Helmet, CORS, XSS middleware
import helmet from "helmet";
import cors from "cors";
import express from "express";
import { env } from "../config/env";

const corsOrigins = env.CORS_ORIGIN 
  ? env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : ["http://localhost:5173"];

export const securityMiddleware = [
  helmet(),
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST"],
  }),
  express.json({ limit: "1kb" }), // limit request body
];
