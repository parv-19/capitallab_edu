import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "../models/User.model";
import type { AuthedRequest } from "../types";

interface JwtPayload {
  userId: string;
  role: "student" | "admin";
}

export const authMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) return res.status(401).json({ message: "Authentication required" });

    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-access-secret") as JwtPayload;
    const user = await User.findById(payload.userId);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = {
      userId: payload.userId,
      role: payload.role,
      enrollments: user.enrollments,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const adminOnly = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
};

export const studentOnly = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "student") return res.status(403).json({ message: "Student access required" });
  next();
};
