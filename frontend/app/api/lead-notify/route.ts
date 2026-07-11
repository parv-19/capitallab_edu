import { NextRequest, NextResponse } from "next/server";
import { forwardLeadToSheet, sendLeadEmail } from "@/lib/server/leadNotify";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !body.name || !body.phone) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const data = {
    formName: body.formName || "contact-form",
    name: body.name,
    phone: body.phone,
    email: body.email,
    subject: body.subject,
    message: body.message,
    courseInterest: body.courseInterest,
    preferredTime: body.preferredTime,
    gad_source: body.gad_source,
    gad_campaignid: body.gad_campaignid,
    gbraid: body.gbraid,
    gclid: body.gclid,
  };
  const skipSheet = body.skipSheet === true;

  const [emailResult, sheetResult] = await Promise.allSettled([
    sendLeadEmail(data),
    skipSheet ? Promise.resolve() : forwardLeadToSheet(data),
  ]);

  if (emailResult.status === "rejected") {
    console.error("[lead-notify] Email failed", emailResult.reason);
  }
  if (!skipSheet && sheetResult.status === "rejected") {
    console.error("[lead-notify] Sheet forward failed", sheetResult.reason);
  }

  if (emailResult.status === "rejected") {
    return NextResponse.json(
      {
        message: "Notification email failed",
        emailSent: false,
        sheetSynced: !skipSheet && sheetResult.status === "fulfilled",
        sheetSkipped: skipSheet,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    emailSent: true,
    sheetSynced: !skipSheet && sheetResult.status === "fulfilled",
    sheetSkipped: skipSheet,
  });
}
