import { NextResponse } from "next/server";
import { 
  sendTicketConfirmationEmail, 
  sendRSVPConfirmationEmail, 
  sendBroadcastEmail, 
  sendExhibitorPacketEmail 
} from "@/lib/mailer";
import { getServiceSupabase, verifyOrganizerSession } from "@/lib/apiAuth";

function isValidUuid(id) {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// Query for event-specific customized trigger template
async function getTriggerTemplate(eventId, triggerId) {
  if (!isValidUuid(eventId) || !triggerId) return null;
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("event_id", eventId)
      .eq("trigger_id", triggerId)
      .eq("is_trigger", true)
      .maybeSingle();
    return data;
  } catch (err) {
    console.warn("Could not query trigger template:", err);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, to, subject, html, text, eventId, ...rest } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' recipient email." }, { status: 400 });
    }

    // If sending custom broadcast or exhibitor packet, require organizer session
    if (type === "broadcast" || type === "exhibitor_packet") {
      if (!eventId || !isValidUuid(eventId)) {
        return NextResponse.json({ error: "Valid eventId is required." }, { status: 400 });
      }
      const authResult = await verifyOrganizerSession(request, eventId);
      if (!authResult.authorized) {
        return NextResponse.json(
          { error: authResult.error || "Unauthorized" },
          { status: authResult.status || 401 }
        );
      }
    }

    let result;
    const triggerIdMap = {
      ticket_confirmation: "trigger_ticket_pass",
      approval_confirmation: "trigger_ticket_pass",
      rsvp_confirmation: "trigger_rsvp_confirmation",
      exhibitor_packet: "trigger_exhibitor_briefing",
      team_invite: "trigger_team_invite"
    };

    const triggerId = triggerIdMap[type];
    const customTrigger = triggerId && eventId ? await getTriggerTemplate(eventId, triggerId) : null;

    let finalSubject = subject;
    if (!finalSubject && customTrigger?.subject) {
      finalSubject = customTrigger.subject;
    }

    switch (type) {
      case "ticket_confirmation":
      case "approval_confirmation":
        result = await sendTicketConfirmationEmail({ 
          to, 
          subject: finalSubject,
          isApproval: type === "approval_confirmation" || rest.isApproval,
          eventId,
          ...rest 
        });
        break;

      case "rsvp_confirmation":
        result = await sendRSVPConfirmationEmail({ 
          to, 
          subject: finalSubject,
          eventId,
          ...rest 
        });
        break;

      case "broadcast":
        result = await sendBroadcastEmail({ 
          to, 
          subject: finalSubject, 
          body: rest.body || text || "", 
          eventId,
          ...rest 
        });
        break;

      case "exhibitor_packet":
        result = await sendExhibitorPacketEmail({ 
          to, 
          subject: finalSubject, 
          eventId,
          ...rest 
        });
        break;

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("POST /api/email/send error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email." }, { status: 500 });
  }
}
