import { NextResponse, after } from "next/server";
import { sendBroadcastEmail } from "@/lib/mailer";
import { getServiceSupabase, verifyOrganizerSession } from "@/lib/apiAuth";
import QRCode from "qrcode";

function isValidUuid(id) {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const {
      eventId,
      recipients = [],
      subject,
      body: rawBodyProp,
      message,
      preheader = "",
      recipientGroup = "all",
      recipientFilter = null,
      templateId = "custom",
      includeQr = false,
      buttonConfig = {},
      eventTitle = "Eventzone Summit",
      organizerName = "Eventzone Organizer",
      eventLogo = "",
      eventDate = "",
      eventLocation = "",
      headerTag = "Official Event Announcement",
      link,
      portalUrl,
      buttonText
    } = payload;

    const rawBody = (rawBodyProp || message || "").trim();
    const cleanSubject = (subject || "").trim();

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required." }, { status: 400 });
    }

    // MANDATORY AUTHENTICATION: Only the event organizer or authorized team admin can broadcast emails
    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized: Organizer session required to broadcast emails." },
        { status: authResult.status || 401 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Recipients array must not be empty." }, { status: 400 });
    }
    if (!cleanSubject || !rawBody) {
      return NextResponse.json({ error: "Missing subject or message body." }, { status: 400 });
    }

    // Auto-configure portal access CTA button if direct link provided
    const directPortalLink = (link || portalUrl || "").trim();
    let effectiveButtonConfig = { ...(buttonConfig || {}) };
    if (directPortalLink && !effectiveButtonConfig.customButtonUrl && !effectiveButtonConfig.formUrl && !effectiveButtonConfig.ticketUrl) {
      effectiveButtonConfig = {
        ...effectiveButtonConfig,
        includeCustomButton: true,
        customButtonText: buttonText || effectiveButtonConfig.customButtonText || "Access Attendee Portal",
        customButtonUrl: directPortalLink,
      };
    }

    // Normalize recipient list
    const normalizedRecipients = recipients
      .map((r) => {
        if (typeof r === "string") {
          return {
            email: r.trim(),
            name: "Attendee",
            role: "attendee",
            ticketTier: "Standard Admission",
            badgeCode: "EZ-PASS",
            company: "",
            jobTitle: "",
          };
        }
        if (r && typeof r === "object") {
          const email = (r.email || r.answers?.email || r.customAnswers?.email || "").trim();
          const name = r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || "Attendee";
          return {
            id: r.id,
            email,
            name,
            role: r.role || "attendee",
            ticketTier: r.ticketTier || r.ticket_type || r.ticketType || "Standard Admission",
            badgeCode: r.badgeCode || r.badge_code || (r.id ? `EZ-${String(r.id).slice(-4).toUpperCase()}` : "EZ-PASS"),
            company: r.company || r.organization || "",
            jobTitle: r.jobTitle || r.job_title || "",
          };
        }
        return null;
      })
      .filter((r) => r && r.email && r.email.includes("@"));

    if (normalizedRecipients.length === 0) {
      return NextResponse.json({ error: "No valid email addresses provided." }, { status: 400 });
    }

    const clientOrigin = (payload.appUrl || payload.trackingBaseUrl || "").trim();
    const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const protoHeader = request.headers.get("x-forwarded-proto");
    const isLocalhost = hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1") || clientOrigin.includes("localhost");
    const proto = protoHeader || (isLocalhost ? "http" : "https");
    
    let origin = process.env.NEXT_PUBLIC_APP_URL || clientOrigin;
    if (!origin) {
      if (hostHeader) {
        origin = `${proto}://${hostHeader}`;
      } else if (request.nextUrl?.origin) {
        origin = request.nextUrl.origin;
      } else {
        origin = "https://eventzone.pro";
      }
    }
    // Remove trailing slash if present
    origin = origin.replace(/\/+$/, "");

    const supabase = getServiceSupabase();
    const validEventId = isValidUuid(eventId) ? eventId : null;

    const formatEventLevelVars = (str) => {
      if (!str) return "";
      return str
        .replace(/\{\{eventTitle\}\}/gi, eventTitle)
        .replace(/\{\{eventDate\}\}/gi, eventDate || "")
        .replace(/\{\{eventLocation\}\}/gi, eventLocation || "")
        .replace(/\{\{venue\}\}/gi, eventLocation || "")
        .replace(/\{\{date\}\}/gi, eventDate || "")
        .replace(/\{\{organizerName\}\}/gi, organizerName);
    };

    // 1. De-duplicate recipients by email address
    const seenEmails = new Set();
    const uniqueRecipients = [];
    for (const rec of normalizedRecipients) {
      const emailKey = rec.email.toLowerCase().trim();
      if (!seenEmails.has(emailKey)) {
        seenEmails.add(emailKey);
        uniqueRecipients.push(rec);
      }
    }

    if (uniqueRecipients.length === 0) {
      return NextResponse.json({ error: "No valid recipient email addresses." }, { status: 400 });
    }

    // 2. Create parent communication entry in Supabase with 'Sending' status
    let commRecord = null;
    try {
      const { data: createdComm, error: commError } = await supabase
        .from("communications")
        .insert({
          event_id: validEventId,
          subject: formatEventLevelVars(cleanSubject),
          body: formatEventLevelVars(rawBody),
          recipient_count: uniqueRecipients.length,
          status: "Sending",
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!commError && createdComm) {
        commRecord = createdComm;
      }
    } catch (dbErr) {
      console.warn("Could not write communication row to DB:", dbErr);
    }

    // 3. Create initial queued recipient rows in communication_recipients table
    const recipientLogMap = new Map();
    if (commRecord && commRecord.id) {
      try {
        const rowsToInsert = uniqueRecipients.map((rec) => ({
          communication_id: commRecord.id,
          event_id: validEventId,
          recipient_email: rec.email,
          recipient_name: rec.name || "",
          recipient_role: rec.role || "attendee",
          status: "queued",
          open_count: 0,
        }));

        const { data: insertedRows, error: insertErr } = await supabase
          .from("communication_recipients")
          .insert(rowsToInsert)
          .select("id, recipient_email");

        if (!insertErr && insertedRows) {
          insertedRows.forEach((row) => {
            recipientLogMap.set(row.recipient_email.toLowerCase(), row.id);
          });
        }
      } catch (recErr) {
        console.warn("Could not insert communication_recipients:", recErr);
      }
    }

    const SUPABASE_EDGE_TRACK_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/track-email` : "";
    const isPublicHttps = origin.startsWith("https://") && !origin.includes("localhost") && !origin.includes("127.0.0.1");
    const trackEndpoint = isPublicHttps ? `${origin}/api/email/track` : (SUPABASE_EDGE_TRACK_URL || `${origin}/api/email/track`);

    // 4. Define async delivery loop that runs in the background
    const runDeliveryLoop = async () => {
      const results = {
        total: uniqueRecipients.length,
        sent: 0,
        failed: 0,
        errors: [],
      };

      const BATCH_SIZE = 3;
      for (let i = 0; i < uniqueRecipients.length; i += BATCH_SIZE) {
        const batch = uniqueRecipients.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (recipient) => {
            const recipientLogId = recipientLogMap.get(recipient.email.toLowerCase()) || "";
            const trackingPixelUrl = commRecord?.id
              ? `${trackEndpoint}?cid=${commRecord.id}${recipientLogId ? `&rid=${recipientLogId}` : ""}&em=${encodeURIComponent(recipient.email)}`
              : "";

            // Trackify Action Buttons for click-redirect open tracking
            const trackify = (url) => {
              if (!url || !commRecord?.id) return url;
              return `${trackEndpoint}?cid=${commRecord.id}${recipientLogId ? `&rid=${recipientLogId}` : ""}&em=${encodeURIComponent(recipient.email)}&url=${encodeURIComponent(url)}`;
            };

            const trackedButtonConfig = {
              ...effectiveButtonConfig,
              formUrl: effectiveButtonConfig?.formUrl ? trackify(effectiveButtonConfig.formUrl) : undefined,
              ticketUrl: effectiveButtonConfig?.ticketUrl ? trackify(effectiveButtonConfig.ticketUrl) : undefined,
              customButtonUrl: effectiveButtonConfig?.customButtonUrl ? trackify(effectiveButtonConfig.customButtonUrl) : undefined,
            };

            // Dynamic variable interpolation
            const firstName = (recipient.name || "Attendee").split(" ")[0] || "Attendee";
            const replaceVars = (str) => {
              if (!str) return "";
              return str
                .replace(/\{\{name\}\}/gi, recipient.name || "Attendee")
                .replace(/\{\{first_name\}\}/gi, firstName)
                .replace(/\{\{firstName\}\}/gi, firstName)
                .replace(/\{\{company\}\}/gi, recipient.company || "")
                .replace(/\{\{jobTitle\}\}/gi, recipient.jobTitle || "")
                .replace(/\{\{ticketTier\}\}/gi, recipient.ticketTier || "Standard Admission")
                .replace(/\{\{badgeCode\}\}/gi, recipient.badgeCode || "EZ-PASS")
                .replace(/\{\{eventTitle\}\}/gi, eventTitle)
                .replace(/\{\{eventDate\}\}/gi, eventDate || "")
                .replace(/\{\{eventLocation\}\}/gi, eventLocation || "")
                .replace(/\{\{venue\}\}/gi, eventLocation || "")
                .replace(/\{\{date\}\}/gi, eventDate || "")
                .replace(/\{\{organizerName\}\}/gi, organizerName)
                .replace(/\{\{formLink\}\}/gi, effectiveButtonConfig?.formUrl || "")
                .replace(/\{\{ticketLink\}\}/gi, effectiveButtonConfig?.ticketUrl || "")
                .replace(/\{\{portalLink\}\}/gi, effectiveButtonConfig?.customButtonUrl || directPortalLink || "");
            };

            const personalizedSubject = replaceVars(subject);
            const personalizedBody = replaceVars(rawBody);
            const personalizedPreheader = replaceVars(preheader);

            // Generate individual QR code buffer if enabled
            let qrBuffer = null;
            let qrDataUrl = "";
            if (includeQr) {
              try {
                const checkinPayload = JSON.stringify({
                  action: "checkin",
                  badgeCode: recipient.badgeCode,
                  name: recipient.name,
                  email: recipient.email,
                  tier: recipient.ticketTier,
                  eventId: validEventId || "",
                  event: eventTitle,
                });
                qrBuffer = await QRCode.toBuffer(checkinPayload, {
                  type: "png",
                  width: 340,
                  margin: 1,
                  color: { dark: "#0f172a", light: "#ffffff" },
                });
              } catch (qrErr) {
                console.warn("QR code generation error for", recipient.email, qrErr);
              }
            }

            // Dispatch with single retry on transient error
            let attempt = 0;
            let sentSuccessfully = false;
            let lastError = null;

            while (attempt < 2 && !sentSuccessfully) {
              attempt++;
              try {
                await sendBroadcastEmail({
                  to: recipient.email,
                  recipientName: recipient.name,
                  subject: personalizedSubject,
                  body: personalizedBody,
                  preheader: personalizedPreheader,
                  eventTitle,
                  organizerName,
                  eventLogo,
                  eventDate,
                  eventLocation,
                  headerTag,
                  buttonConfig: trackedButtonConfig,
                  includeQr: Boolean(includeQr),
                  qrBuffer,
                  qrDataUrl,
                  includeEventCard: true,
                  trackingPixelUrl,
                });
                sentSuccessfully = true;
                results.sent++;
                if (recipientLogMap.has(recipient.email.toLowerCase())) {
                  try {
                    const rid = recipientLogMap.get(recipient.email.toLowerCase());
                    await supabase
                      .from("communication_recipients")
                      .update({ status: "sent" })
                      .eq("id", rid);
                  } catch (e) {}
                }
              } catch (err) {
                lastError = err;
                if (attempt < 2) {
                  // Short 300ms pause before single retry
                  await new Promise((r) => setTimeout(r, 300));
                }
              }
            }

            if (!sentSuccessfully) {
              results.failed++;
              results.errors.push({ email: recipient.email, error: lastError?.message || "Send failed" });
              if (recipientLogMap.has(recipient.email.toLowerCase())) {
                try {
                  const rid = recipientLogMap.get(recipient.email.toLowerCase());
                  await supabase
                    .from("communication_recipients")
                    .update({ status: "failed" })
                    .eq("id", rid);
                } catch (e) {}
              }
            }
          })
        );

        // Anti-Spam Pacing: Small jittered pause between batches to prevent spam heuristic triggers
        if (i + BATCH_SIZE < uniqueRecipients.length) {
          const jitterDelay = 200 + Math.floor(Math.random() * 150); // 200ms - 350ms
          await new Promise((resolve) => setTimeout(resolve, jitterDelay));
        }
      }

      // Mark the parent communications row as Sent or Failed
      if (commRecord && commRecord.id) {
        try {
          const finalStatus = (results.sent > 0 || results.failed === 0) ? "Sent" : "Failed";
          await supabase
            .from("communications")
            .update({ status: finalStatus })
            .eq("id", commRecord.id);
        } catch (e) {
          console.warn("Could not update final communication status:", e);
        }
      }
    };

    // 5. Schedule background delivery: use after() if available, else fire detached promise
    if (typeof after === "function") {
      after(runDeliveryLoop);
    } else {
      runDeliveryLoop().catch((bgErr) => console.error("Detached background broadcast error:", bgErr));
    }

    // 6. Return immediate response to the client
    return NextResponse.json({
      success: true,
      queued: true,
      message: "Emails are being sent in the background.",
      total: uniqueRecipients.length,
      communicationId: commRecord?.id || null,
    }, { status: 200 });
  } catch (error) {
    console.error("Broadcast email API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to broadcast emails." },
      { status: 500 }
    );
  }
}
