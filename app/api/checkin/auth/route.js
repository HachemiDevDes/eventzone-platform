import { NextResponse } from "next/server";
import { verifyCheckinAuth } from "@/lib/db";

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
    const { email, passcode, eventId } = body || {};

    if (!email || !passcode) {
      return NextResponse.json(
        { success: false, error: "Please enter your staff email and the event passcode." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const authResult = await verifyCheckinAuth({ email, passcode, eventId });

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Invalid credentials." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        event: {
          id: authResult.event.id,
          title: authResult.event.title,
          tagline: authResult.event.tagline,
          location: authResult.event.location || authResult.event.venueName,
          banner: authResult.event.banner,
          logo: authResult.event.logo || authResult.event.eventLogo,
          startDate: authResult.event.startDate,
          endDate: authResult.event.endDate,
        },
        staff: authResult.staff,
        session: authResult.session,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("POST /api/checkin/auth error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Authentication error." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
