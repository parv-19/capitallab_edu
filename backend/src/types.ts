import type { Request } from "express";

export type UserRole = "student" | "admin";

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  enrollments?: string[];
}

export interface AuthedRequest extends Request {
  user?: AuthenticatedUser;
}
