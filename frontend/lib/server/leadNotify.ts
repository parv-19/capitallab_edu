import nodemailer from "nodemailer";

export interface LeadNotifyData {
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
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const port = Number(process.env.SMTP_PORT ?? 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLeadEmail(data: LeadNotifyData) {
  const to = process.env.LEAD_TO?.trim();

  const missingConfig = [
    !process.env.SMTP_HOST ? "SMTP_HOST" : null,
    !process.env.SMTP_USER ? "SMTP_USER" : null,
    !process.env.SMTP_PASS ? "SMTP_PASS" : null,
    !to ? "LEAD_TO" : null,
  ].filter(Boolean);

  if (missingConfig.length > 0) {
    throw new Error(
      `[lead-notify] Missing SMTP configuration: ${missingConfig.join(", ")}`,
    );
  }

  const fromAddress = process.env.MAIL_FROM_ADDRESS?.trim() || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME?.trim() || "Website Enquiry";
  const subject = process.env.MAIL_SUBJECT?.trim() || "New Enquiry";
  const bcc = process.env.LEAD_BCC?.trim() || undefined;

  const rows: Array<[string, string]> = [
    ["Form", data.formName],
    ["Name", data.name],
    ["Phone", data.phone],
    ["Email", data.email || "-"],
    ["Course Interest", data.courseInterest || "-"],
    ["Preferred Time", data.preferredTime || "-"],
    ["Subject", data.subject || "-"],
    ["Message", data.message || "-"],
    ["Submitted At", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
      <h2 style="margin-bottom: 16px;">New Website Enquiry</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">${escapeHtml(label)}</td>
                <td style="border: 1px solid #ddd;">${escapeHtml(value)}</td>
              </tr>`,
          )
          .join("")}
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    bcc,
    subject,
    html,
  });
}

/** Forwards a lead to the Google Apps Script `doPost(e)` sheet logger, which
 * reads fields off `e.parameter` — so this must POST as form-urlencoded, not JSON. */
export async function forwardLeadToSheet(data: LeadNotifyData) {
  const webhookUrl = process.env.SHEET_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const params = new URLSearchParams({
    form_name: data.formName,
    name: data.name,
    email: data.email ?? "",
    message: data.message ?? "",
    number: data.phone,
    course: data.courseInterest ?? "",
    preferred_time: data.preferredTime ?? "",
    subject: data.subject ?? "",
    gad_source: data.gad_source ?? "",
    gad_campaignid: data.gad_campaignid ?? "",
    gbraid: data.gbraid ?? "",
    gclid: data.gclid ?? "",
    submitted_at:
      new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      }) + " IST",
  });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[lead-notify] Sheet webhook failed", response.status, errorText);
    }
  } catch (error) {
    console.error("[lead-notify] Sheet webhook failed", error);
  }
}
