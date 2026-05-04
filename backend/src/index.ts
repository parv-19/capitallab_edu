import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import courseRoutes from "./routes/course.routes";
import leadRoutes from "./routes/lead.routes";
import ragRoutes from "./routes/rag.routes";
import studentRoutes from "./routes/student.routes";
import testimonialRoutes from "./routes/testimonial.routes";

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
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
    await mongoose.connect(
      process.env.MONGODB_URI ??
        process.env.MONGO_URI ??
        "mongodb://127.0.0.1:27017/capitallab",
    );
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
};

void bootstrap();
