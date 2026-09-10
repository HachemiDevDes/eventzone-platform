import { NextResponse } from "next/server";
import { fetchCheckinAttendees } from "@/lib/db";
import { verifyCheckinStaffOrOrganizer } from "@/lib/apiAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-checkin-passcode, x-staff-email",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // MANDATORY AUTHENTICATION: Only authorized gate staff, organizer, or API key
    const authResult = await verifyCheckinStaffOrOrganizer(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized: Valid event passcode or staff credentials required." },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const attendees = await fetchCheckinAttendees(eventId);
    const checkedInAttendees = attendees.filter((a) => a.checkedIn || a.checked_in);
    const checkedInCount = checkedInAttendees.length;
    const totalCount = attendees.length;

    const gateBreakdown = {};
    for (const a of checkedInAttendees) {
      const gName = a.checkinGate || a.checkin_gate || (a.checkedInBy === "Badge Print" ? "Badge Print" : "Principal Gate");
      gateBreakdown[gName] = (gateBreakdown[gName] || 0) + 1;
    }

    return NextResponse.json(
      {
        success: true,
        count: totalCount,
        checkedInCount,
        remainingCount: Math.max(0, totalCount - checkedInCount),
        percentage: totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0,
        gateBreakdown,
        attendees,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/checkin/attendees error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch attendees." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
