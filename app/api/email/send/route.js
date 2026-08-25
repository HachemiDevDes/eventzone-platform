import { NextResponse } from "next/server";
import { 
  sendEmail, 
  sendTicketConfirmationEmail, 
  sendRSVPConfirmationEmail, 
  sendBroadcastEmail, 
  sendExhibitorPacketEmail 
} from "@/lib/mailer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, to, subject, html, text, ...rest } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' recipient email." }, { status: 400 });
    }

    let result;

    switch (type) {
      case "ticket_confirmation":
      case "approval_confirmation":
        result = await sendTicketConfirmationEmail({ 
          to, 
          subject,
          isApproval: type === "approval_confirmation" || rest.isApproval,
          ...rest 
        });
        break;

      case "rsvp_confirmation":
        result = await sendRSVPConfirmationEmail({ to, ...rest });
        break;

      case "broadcast":
        result = await sendBroadcastEmail({ to, subject, body: rest.body || text || "", ...rest });
        break;

      case "exhibitor_packet":
        result = await sendExhibitorPacketEmail({ to, ...rest });
        break;

      case "custom":
      default:
        if (!subject || (!html && !text)) {
          return NextResponse.json({ error: "Missing subject or content." }, { status: 400 });
        }
        result = await sendEmail({ to, subject, html, text, ...rest });
        break;
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result?.messageId, 
      recipient: to,
      type: type || "custom"
    });
  } catch (error) {
    console.error("Email send API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
