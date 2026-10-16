import { NextResponse } from "next/server";
import { generateAgendaPdfBuffer } from "@/lib/agendaPdfServer";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { sessions = [], eventDetails = null, filterLabel = "All Sessions" } = body;

    const pdfBuffer = await generateAgendaPdfBuffer({
      eventDetails,
      sessions,
      filterLabel,
    });

    const eventTitleClean = (eventDetails?.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Eventzone_${eventTitleClean}_Agenda_${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Failed to generate agenda PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate agenda PDF" },
      { status: 500 }
    );
  }
}
