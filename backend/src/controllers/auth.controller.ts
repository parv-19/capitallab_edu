import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";

import { User } from "../models/User.model";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens";
import { sendEmail } from "../utils/sendEmail";
import type { AuthedRequest } from "../types";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword, phone } = req.body;

  if (!name || !email || !password || password.length < 8 || password !== confirmPassword) {
    return res.status(400).json({ message: "Please provide valid signup details" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "student",
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res.status(201).json({
    user: { _id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Your account has been blocked" });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res.json({
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrollments: user.enrollments,
      avatar: user.avatar,
    },
    accessToken,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", cookieOptions);
  return res.json({ message: "Logged out" });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  const payload = JSON.parse(
    Buffer.from(token.split(".")[1] ?? "", "base64").toString("utf8"),
  ) as { userId?: string };

  const user = payload.userId ? await User.findById(payload.userId) : null;
  if (!user) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  return res.json({ accessToken });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user?.userId).select(
    "_id name email role enrollments avatar phone",
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "If the email exists, a reset link has been sent" });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetExpiry = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/reset-password?token=${rawToken}`;
  await sendEmail(
    user.email,
    "Reset your password",
    `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  );

  return res.json({ message: "If the email exists, a reset link has been sent" });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = String(req.query.token ?? "");
  const { password, confirmPassword } = req.body;

  if (!token || !password || password.length < 8 || password !== confirmPassword) {
    return res.status(400).json({ message: "Invalid reset request" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetToken: hashedToken,
    resetExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: "Reset link is invalid or expired" });
  }

  user.password = await bcrypt.hash(password, 12);
  user.resetToken = undefined;
  user.resetExpiry = undefined;
  await user.save();

  return res.json({ message: "Password updated" });
});
