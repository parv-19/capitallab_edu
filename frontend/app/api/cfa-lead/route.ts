import { NextRequest, NextResponse } from "next/server";
import {
  sendCfaLeadEmail,
  forwardCfaLeadToSheet,
  type CfaLeadData,
} from "@/lib/server/cfaLeadNotify";

/**
 * POST /api/cfa-lead
 *
 * Dedicated endpoint for the lp-cfa landing page forms.
 * Sends a notification email + forwards to the Google Sheet.
 * Nothing is saved to the database.
 *
 * The response is held until the email + sheet forward have both settled,
 * so the caller's loading state accurately reflects whether they're done
 * (rather than resolving as soon as the request is queued).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !body.name || !body.phone) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const data: CfaLeadData = {
    formName: String(body.formName || "cfa-landing"),
    name: String(body.name),
    phone: String(body.phone),
    email: String(body.email || ""),
    courseInterest: String(body.courseInterest || ""),
    preferredTime: String(body.preferredTime || ""),
    gad_source: body.gad_source,
    gad_campaignid: body.gad_campaignid,
    gbraid: body.gbraid,
    gclid: body.gclid,
  };

  const [emailResult, sheetResult] = await Promise.allSettled([
    sendCfaLeadEmail(data),
    forwardCfaLeadToSheet(data),
  ]);

  const emailError =
    emailResult.status === "rejected"
      ? String(emailResult.reason?.message ?? emailResult.reason)
      : null;
  const sheetError =
    sheetResult.status === "rejected"
      ? String(sheetResult.reason?.message ?? sheetResult.reason)
      : null;

  if (emailError) console.error("[cfa-lead] Email failed:", emailError);
  if (sheetError) console.error("[cfa-lead] Sheet failed:", sheetError);

  if (emailResult.status === "rejected") {
    return NextResponse.json(
      {
        message: "Notification email failed",
        emailSent: false,
        sheetSynced: sheetResult.status === "fulfilled",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    emailSent: true,
    sheetSynced: sheetResult.status === "fulfilled",
    ...(process.env.NODE_ENV !== "production" && {
      emailError,
      sheetError,
    }),
  });
}
