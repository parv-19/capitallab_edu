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
    gad_source: body.gad_source,
    gad_campaignid: body.gad_campaignid,
    gbraid: body.gbraid,
    gclid: body.gclid,
  };

  const [emailResult, sheetResult] = await Promise.allSettled([
    sendLeadEmail(data),
    forwardLeadToSheet(data),
  ]);

  if (emailResult.status === "rejected") {
    console.error("[lead-notify] Email failed", emailResult.reason);
  }
  if (sheetResult.status === "rejected") {
    console.error("[lead-notify] Sheet forward failed", sheetResult.reason);
  }

  return NextResponse.json({
    emailSent: emailResult.status === "fulfilled",
    sheetSynced: sheetResult.status === "fulfilled",
  });
}
