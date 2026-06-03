import type { Request, Response } from "express";

import { Lead } from "../models/Lead.model";
import { asyncHandler } from "../utils/asyncHandler";

function normaliseAppsScriptPayload(data: {
  id: string;
  name: string;
  phone: string;
  email?: string;
  courseInterest: string;
  preferredTime: string;
  message?: string;
}) {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email ?? "",
    courseInterest: data.courseInterest,
    preferredTime: data.preferredTime,
    message: data.message ?? "",
    source: "capital-lab-website",
    createdAt: new Date().toISOString(),
  };
}

async function forwardLeadToAppsScript(payload: ReturnType<typeof normaliseAppsScriptPayload>) {
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_LEADS_URL?.trim();
  if (!appsScriptUrl) return;

  try {
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[Leads] Apps Script sync failed", response.status, errorText);
    }
  } catch (error) {
    console.error("[Leads] Apps Script sync failed", error);
  }
}

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

  void forwardLeadToAppsScript(
    normaliseAppsScriptPayload({
      id: String(lead.id ?? lead._id ?? ""),
      name,
      phone,
      email,
      courseInterest,
      preferredTime,
      message,
    }),
  );

  res.status(201).json(lead);
});
