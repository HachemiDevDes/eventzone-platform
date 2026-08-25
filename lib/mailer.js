import nodemailer from "nodemailer";

// Lazy-loaded or cached transporter
let transporter = null;

export function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE !== "false"; // true for port 465, false for 587
    const user = process.env.SMTP_USER || "contact@eventzone.pro";
    const pass = process.env.SMTP_PASS || "Th4c&45dZ3s";

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

export const SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || "contact@eventzone.pro";
export const SENDER_NAME = process.env.SMTP_FROM_NAME || "Eventzone Platform";
export const DEFAULT_FROM = `"${SENDER_NAME}" <${SENDER_EMAIL}>`;

/**
 * Verify SMTP credentials and connection health
 */
export async function verifySmtpConnection() {
  const mailer = getTransporter();
  return await mailer.verify();
}

/**
 * Extract clean, human-readable plain text from an HTML email string
 * (Strips <head>, <style>, <script>, tags and decodes entities to prevent CSS leak in notifications)
 */
export function htmlToPlainText(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generic email dispatcher with automatic base64-to-CID conversion
 * (Ensures QR codes and embedded images display reliably in Gmail/Outlook/Apple Mail)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo = SENDER_EMAIL,
  attachments = [],
}) {
  const mailer = getTransporter();
  let finalHtml = html || "";
  const finalAttachments = [...(attachments || [])];

  // Auto-convert inline base64 images into robust CID inline attachments
  // (Email clients like Gmail, Outlook, and Apple Mail strictly block raw base64 data URIs)
  if (finalHtml && typeof finalHtml === "string") {
    let imgCount = 0;
    finalHtml = finalHtml.replace(/src=["']data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=\r\n\s]+)["']/gi, (match, mimeSubtype, base64Data) => {
      try {
        const cleanBase64 = base64Data.replace(/[\r\n\s]/g, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        const isJpg = mimeSubtype.toLowerCase().includes("jpeg") || mimeSubtype.toLowerCase().includes("jpg");
        const ext = isJpg ? "jpg" : mimeSubtype.toLowerCase().includes("png") ? "png" : mimeSubtype.toLowerCase().includes("gif") ? "gif" : "png";
        const cid = `eventzone_auto_img_${Date.now()}_${imgCount++}`;
        
        finalAttachments.push({
          filename: `qr_image_${imgCount}.${ext}`,
          content: buffer,
          cid: cid,
          contentType: `image/${isJpg ? "jpeg" : ext}`,
          contentDisposition: "inline",
        });
        
        return `src="cid:${cid}"`;
      } catch (err) {
        console.warn("Failed to convert base64 image to cid attachment:", err);
        return match;
      }
    });
  }

  const plainText = text && typeof text === "string" && text.trim().length > 0 
    ? text.trim() 
    : htmlToPlainText(finalHtml);

  const info = await mailer.sendMail({
    from,
    to,
    replyTo,
    subject,
    text: plainText,
    html: finalHtml,
    attachments: finalAttachments,
  });
  return info;
}

import { generateBadgePdfBuffer } from "./badgePdfServer.js";
import QRCode from "qrcode";

/**
 * Clean, modern base HTML wrapper for Eventzone emails
 */
function getEmailLayout({ title, content, footerText = "", eventTitle, eventLogo, headerTag = "Official Event Experience", preheader = "" }) {
  const displayTitle = eventTitle || title || "EVENTZONE";
  const previewSnippet = (preheader || title || displayTitle || "Your official event communication from Eventzone Platform.")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${displayTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Product+Sans:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Product+Sans:wght@400;700&display=swap');
        :root {
          color-scheme: light dark;
          supported-color-schemes: light dark;
        }
        body, table, td, p, a, h1, h2, h3, h4, span, div {
          font-family: 'Google Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
        body { background-color: #f8fafc; color: #334155; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 32px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
        .header { background-color: #ffffff; padding: 28px 28px 22px 28px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .logo-img { max-height: 44px; max-width: 180px; object-fit: contain; margin: 0 0 12px 0; display: block; }
        .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin: 0; color: #0f172a; text-align: left; }
        .logo-tag { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; font-weight: 800; margin-top: 4px; text-align: left; }
        .body { padding: 32px 28px; color: #334155; line-height: 1.65; }
        .body h1, .body h2, .body h3 { color: #0f172a; margin-top: 0; margin-bottom: 14px; letter-spacing: -0.4px; }
        .body p { color: #475569; margin: 0 0 16px 0; }
        .body strong { color: #0f172a; }
        .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0; }
        .card-header { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 9px 0; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .info-table tr:last-child td { border-bottom: none; }
        .info-label { font-size: 12.5px; color: #64748b; font-weight: 600; text-align: left; }
        .info-val { font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; }
        .tier-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 11.5px; font-weight: 700; }
        .pdf-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 18px; margin: 24px 0; }
        .footer { background: #f8fafc; padding: 24px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .qr-box { text-align: center; margin: 24px 0; padding: 20px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 16px; display: inline-block; }
        .qr-pad { background: #ffffff; padding: 10px; border-radius: 12px; display: inline-block; }

        /* ── Dark Mode Automatic Overrides ── */
        @media (prefers-color-scheme: dark) {
          body, .wrapper { background-color: #090d16 !important; }
          .container { background-color: #111827 !important; border-color: #1f293d !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important; }
          .header { background-color: #0f172a !important; border-bottom-color: #1e293b !important; }
          .logo-text { color: #f8fafc !important; }
          .logo-tag { color: #60a5fa !important; }
          .body { color: #e2e8f0 !important; }
          .body h1, .body h2, .body h3 { color: #f8fafc !important; }
          .body p { color: #94a3b8 !important; }
          .body strong { color: #f8fafc !important; }
          .card { background-color: #0b0f19 !important; border-color: #1f293d !important; }
          .card-header { color: #94a3b8 !important; border-bottom-color: #1e293b !important; }
          .info-table td { border-bottom-color: #1e293b !important; }
          .info-label { color: #94a3b8 !important; }
          .info-val { color: #f8fafc !important; }
          .tier-badge { background-color: #064e3b !important; color: #34d399 !important; border-color: #065f46 !important; }
          .pdf-notice { background-color: #0f172a !important; border-color: #1e3a8a !important; }
          .pdf-notice-title { color: #93c5fd !important; }
          .pdf-notice-desc { color: #bfdbfe !important; }
          .footer { background-color: #0b0f19 !important; border-top-color: #1f293d !important; color: #64748b !important; }
          .footer a { color: #60a5fa !important; }
          .qr-box { background-color: #0b0f19 !important; border-color: #334155 !important; }
        }
      </style>
    </head>
    <body>
      <!-- Hidden Preheader Snippet for Mobile Lock-Screen & Push Notifications -->
      <div style="display: none !important; font-size: 1px !important; color: #ffffff !important; line-height: 1px !important; max-height: 0px !important; max-width: 0px !important; opacity: 0 !important; overflow: hidden !important; mso-hide: all; visibility: hidden;">
        ${previewSnippet}
        &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279;
      </div>

      <div class="wrapper">
        <div class="container">
          <div class="header">
            ${eventLogo ? `<img src="${eventLogo}" alt="Logo" class="logo-img" />` : ""}
            <h1 class="logo-text">${displayTitle}</h1>
            <div class="logo-tag">${headerTag}</div>
          </div>
          <div class="body">
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; color: #64748b;">Dispatched securely via <strong>Eventzone Platform</strong>.</p>
            <p style="margin: 0; font-size: 11.5px;">For inquiries or support, reply to <a href="mailto:${SENDER_EMAIL}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${SENDER_EMAIL}</a></p>
            ${footerText ? `<p style="margin-top: 14px; font-size: 11px; color: #94a3b8;">${footerText}</p>` : ""}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Ticket Registration / Acceptance Confirmation Email
 */
export async function sendTicketConfirmationEmail({
  to,
  subject,
  attendeeName,
  ticketTier = "Standard Admission",
  eventTitle = "Eventzone Conference & Summit",
  eventDate,
  eventLocation,
  company = "",
  jobTitle = "",
  badgeCode,
  qrDataUrl,
  passId,
  requiresApproval = false,
  isApproval = false,
  formUrl = "",
  formButtonText = "Fill Out Form / Survey",
  eventLogo = "",
  organizerName = "Eventzone Platform",
}) {
  const isPending = Boolean(requiresApproval);
  const cleanBadgeCode = badgeCode || (passId ? `EZ-${String(passId).slice(-4).toUpperCase()}` : "EZ-PASS");
  const safeAttendeeName = (attendeeName || "Attendee").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();

  // Ensure QR code Data URL is available if confirmed
  let resolvedQrUrl = qrDataUrl;
  let qrBuffer = null;
  if (!isPending) {
    try {
      const qrPayload = JSON.stringify({
        action: "checkin",
        badgeCode: cleanBadgeCode,
        name: attendeeName,
        email: to,
        tier: ticketTier,
        event: eventTitle,
      });

      if (!resolvedQrUrl || !resolvedQrUrl.startsWith("data:image/")) {
        resolvedQrUrl = await QRCode.toDataURL(qrPayload, {
          width: 320,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
      }

      qrBuffer = await QRCode.toBuffer(qrPayload, {
        type: "png",
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch (e) {
      console.warn("QR code generation in mailer notice:", e);
    }
  }

  // Generate official PDF Badge buffer
  let attachments = [];
  if (!isPending) {
    try {
      const pdfBuffer = await generateBadgePdfBuffer({
        attendeeName: attendeeName || "Attendee",
        attendeeEmail: to,
        attendeeCompany: company || "",
        attendeeJobTitle: jobTitle || "",
        ticketTier: ticketTier || "Standard Admission",
        badgeCode: cleanBadgeCode,
        eventTitle: eventTitle || "Eventzone Conference",
        eventDate: eventDate || "",
        eventLocation: eventLocation || "",
        qrDataUrl: resolvedQrUrl,
      });

      if (pdfBuffer && pdfBuffer.length > 0) {
        attachments.push({
          filename: `${safeAttendeeName.replace(/\s+/g, "_")}_Official_Event_Badge.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        });
      }
    } catch (pdfErr) {
      console.error("Failed to generate badge PDF attachment:", pdfErr);
    }

    // Attach QR code image with Content-ID for robust inline email rendering
    if (qrBuffer && qrBuffer.length > 0) {
      attachments.push({
        filename: "event_pass_qr.png",
        content: qrBuffer,
        cid: "eventzone_qr_code_pass",
        contentType: "image/png",
      });
    }
  }

  const statusBadge = isPending 
    ? `<div style="margin-bottom: 20px;"><span style="display:inline-block; padding: 4px 12px; border-radius: 20px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Pending Organizer Review</span></div>`
    : "";

  const heroHeadline = isPending
    ? "Registration Received & Under Review"
    : isApproval
    ? "Your Application Has Been Approved! Official Badge Attached"
    : "You're Confirmed! Official Pass & Badge Attached";

  const introText = isPending
    ? `Thank you for applying to attend <strong>${eventTitle}</strong>. Your registration is currently in the organizer review queue. You will receive an immediate confirmation email with your official badge PDF and fast-track QR pass once accepted.`
    : `Congratulations! Your registration for <strong>${eventTitle}</strong> is fully confirmed. Your official conference pass has been activated in the event roster.`;

  const content = `
    ${statusBadge}
    <h1>${heroHeadline}</h1>
    <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${attendeeName || "Attendee"}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">${introText}</p>

    <!-- Credential Details Card -->
    <div class="card">
      <div class="card-header">Pass Details</div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-label" width="38%">Event</td>
          <td class="info-val" width="62%">${eventTitle}</td>
        </tr>
        <tr>
          <td class="info-label">Attendee Name</td>
          <td class="info-val">${attendeeName || "Attendee"}</td>
        </tr>
        ${jobTitle ? `
        <tr>
          <td class="info-label">Job Title / Role</td>
          <td class="info-val" style="color: #2563eb;">${jobTitle}</td>
        </tr>` : ""}
        ${company ? `
        <tr>
          <td class="info-label">Organization</td>
          <td class="info-val">${company}</td>
        </tr>` : ""}
        <tr>
          <td class="info-label">Access Tier</td>
          <td class="info-val">
            <span class="tier-badge">${ticketTier}</span>
          </td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label">Date & Time</td>
          <td class="info-val">${eventDate}</td>
        </tr>` : ""}
        ${eventLocation ? `
        <tr>
          <td class="info-label">Venue Location</td>
          <td class="info-val">${eventLocation}</td>
        </tr>` : ""}
      </table>
    </div>

    ${!isPending ? `
      <!-- Fast-Track Mobile QR Code -->
      <div style="text-align: center; margin: 28px 0;">
        <div class="qr-box">
          <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Fast-Track Check-In QR Pass</div>
          <div class="qr-pad">
            <img src="cid:eventzone_qr_code_pass" alt="Event Check-in Pass QR" width="180" height="180" style="display: block; margin: 0 auto; border-radius: 8px;" />
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">Present this scannable QR code on your phone upon arrival</div>
        </div>
      </div>

      ${formUrl ? `
        <!-- Form / Survey Call-to-Action -->
        <div style="text-align: center; margin: 26px 0; padding: 22px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="font-size: 13.5px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Action Required: Complete Event Form</div>
          <a href="${formUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
            ${formButtonText || "Open Form"} →
          </a>
          <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
            Direct link: <a href="${formUrl}" style="color: #2563eb; text-decoration: underline;">${formUrl}</a>
          </div>
        </div>
      ` : ""}
    ` : ""}

    <!-- Helpful Check-In Instructions -->
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
      <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 8px;">
        Fast-Track Venue Arrival Checklist
      </h4>
      <ul style="font-size: 12.5px; color: #64748b; margin: 0; padding-left: 20px; line-height: 1.7;">
        <li>Have your mobile QR pass or printed PDF badge ready when approaching check-in.</li>
        <li>Present a valid government ID or corporate credential matching your registered name.</li>
        <li>Collect your official physical lanyard pass and welcome packet at reception.</li>
      </ul>
    </div>
  `;

  const preheader = isPending
    ? `Registration received for ${eventTitle}. Your pass application is under review.`
    : `Your pass for ${eventTitle} is confirmed! Pass code: ${cleanBadgeCode}. Check-in QR pass and badge PDF attached.`;

  const plainText = isPending
    ? `Hello ${attendeeName || "Attendee"},\n\nThank you for applying for ${eventTitle}. Your registration is currently in the organizer review queue.\n\nEvent: ${eventTitle}\nAccess Tier: ${ticketTier}\n\nEventzone Platform`
    : `Hello ${attendeeName || "Attendee"},\n\nYour registration for ${eventTitle} is fully confirmed!\n\nPass Details:\n- Event: ${eventTitle}\n- Attendee: ${attendeeName || "Attendee"}\n- Tier: ${ticketTier}\n- Badge Code: ${cleanBadgeCode}\n${eventDate ? `- Date: ${eventDate}\n` : ''}${eventLocation ? `- Venue: ${eventLocation}\n` : ''}\nPlease find your official badge PDF and fast-track QR pass attached.\n\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: subject || (isPending 
      ? `Registration Received: ${eventTitle} (Under Review)`
      : isApproval
      ? `Application Approved: Your Official Pass for ${eventTitle}`
      : `Your Official Pass for ${eventTitle}`),
    text: plainText,
    html: getEmailLayout({
      title: `Event Pass: ${attendeeName || "Attendee"}`,
      eventTitle: eventTitle || "Eventzone Conference",
      eventLogo: eventLogo || "",
      headerTag: isPending ? "Registration Received (Under Review)" : "Official Attendee Pass",
      preheader,
      content,
      footerText: `Organizer: ${organizerName} • Eventzone Platform`,
    }),
    attachments,
  });
}

/**
 * 2. RSVP Confirmation & Status Update Email
 */
export async function sendRSVPConfirmationEmail({
  to,
  attendeeName,
  eventTitle,
  status = "attending",
  eventDate,
  eventLocation,
  dietaryPreference,
  notes,
  qrDataUrl,
}) {
  const statusLabels = {
    attending: { text: "Attending (Confirmed)", color: "#065f46", bg: "#ecfdf5" },
    waitlisted: { text: "Waitlisted", color: "#92400e", bg: "#fef3c7" },
    tentative: { text: "Tentative / Unconfirmed", color: "#1e40af", bg: "#dbeafe" },
    declined: { text: "Declined", color: "#991b1b", bg: "#fee2e2" },
  };

  const currentStatus = statusLabels[status] || statusLabels.attending;

  const content = `
    <h1>RSVP Confirmation: ${eventTitle || "Eventzone Summit"}</h1>
    <p>Hello <strong>${attendeeName || "Guest"}</strong>,</p>
    <p>Thank you for submitting your RSVP for <strong>${eventTitle || "the event"}</strong>. Your response has been recorded in our attendee roster.</p>

    <div class="card">
      <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-header" style="margin-bottom: 0; padding-bottom: 0; border-bottom: none;">RSVP Status</span>
        <span style="display:inline-block; padding: 3px 10px; border-radius: 20px; background: ${currentStatus.bg}; color: ${currentStatus.color}; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          ${currentStatus.text}
        </span>
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-label" width="38%">Event</td>
          <td class="info-val" width="62%">${eventTitle || "Global Summit"}</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label">Date & Time</td>
          <td class="info-val">${eventDate}</td>
        </tr>` : ""}
        ${eventLocation ? `
        <tr>
          <td class="info-label">Venue</td>
          <td class="info-val">${eventLocation}</td>
        </tr>` : ""}
        ${dietaryPreference ? `
        <tr>
          <td class="info-label">Dietary Preference</td>
          <td class="info-val">${dietaryPreference}</td>
        </tr>` : ""}
        ${notes ? `
        <tr>
          <td class="info-label">Special Request / Notes</td>
          <td class="info-val">${notes}</td>
        </tr>` : ""}
      </table>
    </div>

    ${status === "attending" && qrDataUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <div class="qr-box">
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">Door Check-In Code</p>
          <img src="${qrDataUrl}" alt="RSVP Check-in Pass QR" width="180" height="180" style="display: block; margin: 0 auto;" />
        </div>
      </div>
    ` : ""}

    <p style="font-size: 13px; color: #64748b;">If your plans change or you need to update your reservation, simply reply to this email.</p>
  `;

  const preheader = `Your RSVP for ${eventTitle || "the event"} is recorded (${currentStatus.text}).`;
  const plainText = `Hello ${attendeeName || "Guest"},\n\nThank you for submitting your RSVP for ${eventTitle || "the event"}.\n\nRSVP Status: ${currentStatus.text}\nEvent: ${eventTitle || "Global Summit"}\n${eventDate ? `Date: ${eventDate}\n` : ""}${eventLocation ? `Venue: ${eventLocation}\n` : ""}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: `RSVP Confirmed: ${eventTitle || "Event"} (${currentStatus.text})`,
    text: plainText,
    html: getEmailLayout({
      title: `RSVP for ${eventTitle}`,
      preheader,
      content,
    }),
  });
}

/**
 * 3. Broadcast Announcement Email to Group of Recipients
 */
export async function sendBroadcastEmail({
  to,
  subject,
  body,
  eventTitle = "Eventzone Summit",
  organizerName = "Event Organizer",
}) {
  const formattedBody = body
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  const content = `
    <h1>Announcement: ${subject}</h1>
    <p style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
      Broadcast for <strong>${eventTitle}</strong> attendees and partners
    </p>

    <div style="font-size: 14px; color: #1e293b; line-height: 1.7; background: #ffffff; border-left: 4px solid #2563eb; padding: 12px 18px; margin: 20px 0; border-radius: 4px 12px 12px 4px;">
      <p style="margin: 0;">${formattedBody}</p>
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      This official announcement was dispatched by <strong>${organizerName}</strong> via Eventzone.
    </p>
  `;

  const preheader = `[${eventTitle}] ${body.slice(0, 140).replace(/\s+/g, ' ').trim()}`;
  const plainText = `Announcement for ${eventTitle}:\n\n${body.trim()}\n\nDispatched by ${organizerName} via Eventzone Platform`;

  return await sendEmail({
    to,
    subject: `[${eventTitle}] ${subject}`,
    text: plainText,
    html: getEmailLayout({
      title: subject,
      preheader,
      content,
      footerText: `Sent to registered participants of ${eventTitle}`,
    }),
  });
}

/**
 * 4. Exhibitor Floor Plan & Booth Allocation Packet
 */
export async function sendExhibitorPacketEmail({
  to,
  exhibitorName,
  boothNumber,
  eventTitle,
  eventDate,
  venueAddress,
  notes,
  message,
}) {
  const content = `
    <h1>Exhibitor Booth & Floor Plan Packet</h1>
    <p>Dear <strong>${exhibitorName}</strong> team,</p>
    <p>We are pleased to share your confirmed exhibition booth allocation and venue instructions for <strong>${eventTitle || "the summit"}</strong>.</p>

    <div class="card">
      <div class="card-header">Exhibitor Space Allocation</div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-label" width="38%">Exhibiting Partner</td>
          <td class="info-val" width="62%">${exhibitorName}</td>
        </tr>
        <tr>
          <td class="info-label">Assigned Space</td>
          <td class="info-val" style="color: #2563eb;">Booth #${boothNumber || "General Space"}</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label">Event Dates</td>
          <td class="info-val">${eventDate}</td>
        </tr>` : ""}
        ${venueAddress ? `
        <tr>
          <td class="info-label">Venue Location</td>
          <td class="info-val">${venueAddress}</td>
        </tr>` : ""}
      </table>
    </div>

    ${message ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #475569; text-transform: uppercase;">Instructions from Event Director</h4>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${message.replace(/\n/g, "<br/>")}</p>
      </div>
    ` : ""}

    <p style="font-size: 13px; color: #64748b;">
      Please ensure your onsite booth staff have this reference for exhibitor setup access.
    </p>
  `;

  const preheader = `Confirmed exhibition booth details for ${exhibitorName} at ${eventTitle || "the summit"}. Booth #${boothNumber || "General"}`;
  const plainText = `Dear ${exhibitorName} team,\n\nHere are your confirmed exhibition booth details for ${eventTitle || "the summit"}:\n\n- Exhibitor: ${exhibitorName}\n- Booth: #${boothNumber || "General Space"}\n${eventDate ? `- Dates: ${eventDate}\n` : ""}${venueAddress ? `- Location: ${venueAddress}\n` : ""}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: `Exhibitor Booth Information: ${exhibitorName} - ${eventTitle || "Summit"}`,
    text: plainText,
    html: getEmailLayout({
      title: `Exhibitor Packet - ${exhibitorName}`,
      preheader,
      content,
    }),
  });
}
