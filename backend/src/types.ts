import type { Request } from "express";
import type { Types } from "mongoose";

export type UserRole = "student" | "admin";

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  enrollments?: Types.ObjectId[];
}

export interface AuthedRequest extends Request {
  user?: AuthenticatedUser;
}
