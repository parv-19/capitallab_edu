import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import pool from "./db/pool";
import { logRagConfiguration } from "./config/rag";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import courseRoutes from "./routes/course.routes";
import leadRoutes from "./routes/lead.routes";
import ragRoutes from "./routes/rag.routes";
import studentRoutes from "./routes/student.routes";
import testimonialRoutes from "./routes/testimonial.routes";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const configuredOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const vercelPreviewPattern = /^https:\/\/.*\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (configuredOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/rag", ragRoutes);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    message: error.message || "Internal server error",
  });
});

const bootstrap = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to Supabase PostgreSQL");
    logRagConfiguration();
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

void bootstrap();
