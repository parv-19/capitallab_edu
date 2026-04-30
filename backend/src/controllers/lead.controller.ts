import type { Request, Response } from "express";

import { Lead } from "../models/Lead.model";
import { asyncHandler } from "../utils/asyncHandler";

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, courseInterest, preferredTime, email, message } = req.body;

  if (!name || !phone || !courseInterest || !preferredTime) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  const lead = await Lead.create({
    name,
    phone,
    email,
    courseInterest,
    preferredTime,
    message,
  });

  res.status(201).json(lead);
});
