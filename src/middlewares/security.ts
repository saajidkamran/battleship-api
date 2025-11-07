// Helmet, CORS, XSS middleware
import helmet from "helmet";
import cors from "cors";
import express from "express";

export const securityMiddleware = [
  helmet(),
  cors({
    origin: ["http://localhost:5173"], // update as needed
    methods: ["GET", "POST"],
  }),
  express.json({ limit: "1kb" }), // limit request body
];
