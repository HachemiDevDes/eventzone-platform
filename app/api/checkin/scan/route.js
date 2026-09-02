import { NextResponse } from "next/server";
import { performQrCheckin } from "@/lib/db";
import { verifyCheckinStaffOrOrganizer } from "@/lib/apiAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-checkin-passcode, x-staff-email",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventId, payload, checkedInBy } = body || {};

    if (!payload || !eventId) {
      return NextResponse.json(
        { status: "invalid", message: "Event ID and QR code data are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // MANDATORY AUTHENTICATION: Only authorized gate staff, organizer, or API key
    const authResult = await verifyCheckinStaffOrOrganizer(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { status: "invalid", message: authResult.error || "Unauthorized: Valid event passcode or staff credentials required." },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const result = await performQrCheckin({
      eventId,
      rawPayload: payload,
      checkedInBy: checkedInBy || "Gate Staff",
    });

    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("POST /api/checkin/scan error:", err);
    return NextResponse.json(
      { status: "invalid", message: err.message || "Failed to process QR scan." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
