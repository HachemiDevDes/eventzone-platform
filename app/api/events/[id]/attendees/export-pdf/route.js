import { NextResponse } from "next/server";
import { generateAttendeesPdfBuffer } from "@/lib/attendeesPdfServer";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { attendees = [], eventDetails = null, filterLabel = "All Attendees" } = body;

    const pdfBuffer = await generateAttendeesPdfBuffer({
      eventDetails,
      attendees,
      filterLabel,
    });

    const eventTitleClean = (eventDetails?.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Eventzone_${eventTitleClean}_Roster_${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Failed to generate attendee roster PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
