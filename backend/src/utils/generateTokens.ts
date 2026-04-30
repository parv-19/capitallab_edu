import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string, role: string) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET ?? "dev-access-secret", {
    expiresIn: "15m",
  });

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret", {
    expiresIn: "7d",
  });
