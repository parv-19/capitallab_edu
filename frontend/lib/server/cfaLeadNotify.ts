import nodemailer from "nodemailer";

export interface CfaLeadData {
  formName: string;
  name: string;
  phone: string;
  email: string;
  courseInterest: string;
  preferredTime: string;
  gad_source?: string;
  gad_campaignid?: string;
  gbraid?: string;
  gclid?: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(data: CfaLeadData): string {
  const submittedAt =
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "medium",
    }) + " IST";

  const rows: Array<[string, string]> = [
    ["Form Name", data.formName],
    ["Full Name", data.name],
    ["Phone", data.phone],
    ["Email", data.email || "-"],
    ["Course Interest", data.courseInterest || "-"],
    ["Preferred Time", data.preferredTime || "-"],
    ["Submitted At", submittedAt],
  ];

  const rowsHtml = rows
    .map(
      ([label, value], i) => `
      <tr style="background:${i === 0 ? "#1a2744" : i % 2 === 0 ? "#f5f7fa" : "#ffffff"};">
        <td style="
          padding: 10px 14px;
          border: 1px solid #dde2ec;
          font-weight: 700;
          white-space: nowrap;
          color: ${i === 0 ? "#c9a84c" : "#374151"};
          font-size: 13px;
          width: 160px;
        ">${esc(label)}</td>
        <td style="
          padding: 10px 14px;
          border: 1px solid #dde2ec;
          color: ${i === 0 ? "#ffffff" : "#111827"};
          font-size: 13px;
          word-break: break-word;
        ">${esc(value)}</td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">
          <tr>
            <td style="background:#1a2744;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:700;">
                Capital Lab Education
              </p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:700;">
                New CFA Enquiry
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">
                A new enquiry was submitted via the Capital Lab CFA landing page. All details are below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
                ${rowsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f7fa;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                This email was sent automatically by the Capital Lab website. Do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const smtpPort = Number(process.env.SMTP_PORT ?? 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 6_000,
  greetingTimeout: 6_000,
  socketTimeout: 8_000,
});

export async function sendCfaLeadEmail(data: CfaLeadData): Promise<void> {
  const to = process.env.LEAD_TO?.trim();
  const missingConfig = [
    !process.env.SMTP_HOST ? "SMTP_HOST" : null,
    !process.env.SMTP_USER ? "SMTP_USER" : null,
    !process.env.SMTP_PASS ? "SMTP_PASS" : null,
    !to ? "LEAD_TO" : null,
  ].filter(Boolean);

  if (missingConfig.length > 0) {
    throw new Error(
      `[cfa-lead] Missing SMTP configuration: ${missingConfig.join(", ")}`,
    );
  }

  const fromAddress =
    process.env.MAIL_FROM_ADDRESS?.trim() || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME?.trim() || "Capital Lab CFA";
  const subject = process.env.MAIL_SUBJECT?.trim() || "New CFA Enquiry";
  const bcc = process.env.LEAD_BCC?.trim() || undefined;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    bcc,
    subject,
    html: buildHtml(data),
  });
}

export async function forwardCfaLeadToSheet(data: CfaLeadData): Promise<void> {
  const webhookUrl = process.env.SHEET_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const submittedAt =
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "medium",
    }) + " IST";

  const params = new URLSearchParams({
    form_name: data.formName,
    name: data.name,
    number: data.phone,
    email: data.email ?? "",
    course: data.courseInterest ?? "",
    preferred_time: data.preferredTime ?? "",
    gad_source: data.gad_source ?? "",
    gad_campaignid: data.gad_campaignid ?? "",
    gbraid: data.gbraid ?? "",
    gclid: data.gclid ?? "",
    submitted_at: submittedAt,
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Sheet webhook responded ${response.status}: ${text}`);
  }
}
