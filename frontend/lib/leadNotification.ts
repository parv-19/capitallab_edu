export interface LeadNotificationPayload {
  formName: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message?: string;
  courseInterest?: string;
  preferredTime?: string;
  gad_source?: string;
  gad_campaignid?: string;
  gbraid?: string;
  gclid?: string;
  skipSheet?: boolean;
}

export async function notifyLeadSubmission(payload: LeadNotificationPayload) {
  const response = await fetch("/api/lead-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.emailSent !== true) {
    throw new Error(body?.message ?? "Lead notification failed");
  }

  return body;
}
