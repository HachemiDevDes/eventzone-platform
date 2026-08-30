import { NextResponse } from "next/server";
import { toggleAttendeeCheckin } from "@/lib/db";
import { verifyApiKeyOrOrganizer } from "@/lib/apiAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventId, attendeeId, checkedIn, checkedInBy } = body || {};

    if (!attendeeId) {
      return NextResponse.json(
        { success: false, error: "Attendee ID is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (eventId) {
      const authResult = await verifyApiKeyOrOrganizer(request, eventId);
      if (!authResult.authorized) {
        return NextResponse.json(
          { success: false, error: authResult.error || "Unauthorized gate session." },
          { status: authResult.status || 401, headers: CORS_HEADERS }
        );
      }
    }

    const result = await toggleAttendeeCheckin({
      eventId,
      attendeeId,
      checkedIn: checkedIn !== false,
      checkedInBy: checkedInBy || "Gate Staff",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update check-in status." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("POST /api/checkin/toggle error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update check-in status." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
