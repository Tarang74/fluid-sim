import express, { Express } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

export function registerMiddlewares(app: Express) {
  // Logging
  app.use(morgan("dev"));

  // CORS
  // Set COOP and COEP headers
  app.use((_, res, next) => {
    res.set("Cross-Origin-Opener-Policy", "same-origin");
    res.set("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

  app.use(
    cors({
      origin: process.env.NODE_ENV
        ? ""
        : "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cross-Origin-Opener-Policy",
        "Cross-Origin-Embedder-Policy",
      ],
      credentials: true,
    }),
  );

  // HTTP security headers
  app.use(helmet());

  // JSON body parser
  app.use(express.json());

  // Cookies
  app.use(cookieParser());
}
