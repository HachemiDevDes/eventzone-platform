import nodemailer from "nodemailer";

// Lazy-loaded or cached transporter
let transporter = null;

export function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE !== "false"; // true for port 465, false for 587
    const user = process.env.SMTP_USER || "contact@eventzone.pro";
    const pass = process.env.SMTP_PASS;

    if (!pass) {
      console.warn("Notice: SMTP_PASS environment variable is not configured.");
    }

    transporter = nodemailer.createTransport({
      pool: true, // Connection pooling to prevent socket exhaustion and rate bans
      maxConnections: 3, // Controlled concurrency for shared SMTP servers
      maxMessages: 100, // Gracefully recycle connections
      rateDelta: 1000, // 1 second window
      rateLimit: 5, // Maximum 5 messages/second per connection to avoid spam heuristic triggers
      host,
      port,
      secure,
      auth: {
        user,
        pass: pass || "",
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_ALLOW_SELFSIGNED === "true" ? false : true,
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
 * Generic email dispatcher with automatic base64-to-CID conversion & Anti-Spam Headers
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
  headers = {},
  listUnsubscribe = true,
  eventTitle = "",
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
          filename: `asset_${imgCount}.${ext}`,
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

  // Clean Subject line (removes newlines/tabs that trigger spam filters)
  const sanitizedSubject = (subject || "Eventzone Notification")
    .replace(/[\r\n\t]+/g, " ")
    .trim();

  // Generate unique RFC 5322 compliant Message-ID with verified domain
  const senderDomain = SENDER_EMAIL.split("@")[1] || "eventzone.pro";
  const uniqueMessageId = `<ez.${Date.now()}.${Math.random().toString(36).substring(2, 11)}@${senderDomain}>`;

  // Standard Anti-Spam & Deliverability Headers
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  const antiSpamHeaders = {
    "X-Mailer": "Eventzone Platform Mailer 2.0",
    "X-Priority": "3", // Normal priority (avoid high priority 1 spam flags)
    "X-MSMail-Priority": "Normal",
    "Importance": "Normal",
    "Auto-Submitted": "auto-generated",
    "Precedence": "bulk",
    "X-Auto-Response-Suppress": "OOF, AutoReply",
    ...headers,
  };

  // RFC 8058 & RFC 2369 compliant List-Unsubscribe headers for Gmail, Yahoo & Outlook
  if (listUnsubscribe && recipientEmail) {
    antiSpamHeaders["List-Unsubscribe"] = `<mailto:${SENDER_EMAIL}?subject=Unsubscribe%20${encodeURIComponent(recipientEmail)}>, <https://eventzone.pro/unsubscribe?email=${encodeURIComponent(recipientEmail)}>`;
    antiSpamHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const plainText = text && typeof text === "string" && text.trim().length > 0 
    ? text.trim() 
    : htmlToPlainText(finalHtml);

  const info = await mailer.sendMail({
    from,
    to,
    replyTo,
    subject: sanitizedSubject,
    text: plainText,
    html: finalHtml,
    attachments: finalAttachments,
    headers: antiSpamHeaders,
    messageId: uniqueMessageId,
  });
  return info;
}

import { generateBadgePdfBuffer } from "./badgePdfServer.js";
import { generateCertificatePdfBuffer } from "./certificatePdfServer.js";
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
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
        .header { background-color: #ffffff; padding: 28px 28px 22px 28px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .logo-img { max-height: 44px; max-width: 180px; object-fit: contain; margin: 0 0 12px 0; display: block; }
        .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin: 0; color: #0f172a; text-align: left; }
        .logo-tag { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; font-weight: 800; margin-top: 4px; text-align: left; }
        .body { padding: 32px 28px; color: #334155; line-height: 1.65; }
        .body h1, .body h2, .body h3 { color: #0f172a; margin-top: 0; margin-bottom: 14px; letter-spacing: -0.4px; }
        .body p { color: #475569; margin: 0 0 16px 0; }
        .body strong { color: #0f172a; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0; }
        .card-header { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 9px 0; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .info-table tr:last-child td { border-bottom: none; }
        .info-label { font-size: 12.5px; color: #64748b; font-weight: 600; text-align: left; }
        .info-val { font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; }
        .tier-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 11.5px; font-weight: 700; }
        .pdf-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 18px; margin: 24px 0; }
        .footer { background-color: #f8fafc; padding: 24px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .qr-box { text-align: center; margin: 24px 0; padding: 20px; background-color: #ffffff; border: 2px dashed #cbd5e1; border-radius: 16px; display: inline-block; }
        .qr-pad { background-color: #ffffff; padding: 10px; border-radius: 12px; display: inline-block; }

        /* ── Dark Mode Automatic Overrides (Email Client Compliant) ── */
        @media (prefers-color-scheme: dark) {
          body, .wrapper, .email-bg {
            background-color: #0b0f19 !important;
            color: #e2e8f0 !important;
          }
          .container, .email-container {
            background-color: #111827 !important;
            border-color: #1e293b !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7) !important;
          }
          .header, .email-header {
            background-color: #0f172a !important;
            border-bottom-color: #1e293b !important;
          }
          .logo-text, .email-title, h1, h2, h3, h4 {
            color: #f8fafc !important;
          }
          .logo-tag {
            color: #60a5fa !important;
          }
          .body, .email-body {
            color: #e2e8f0 !important;
          }
          p, li, td, .email-paragraph, .email-list-item {
            color: #cbd5e1 !important;
          }
          .email-subtext, .email-footer-notice {
            color: #94a3b8 !important;
          }
          .email-msg-box {
            background-color: #1a2234 !important;
            border-color: #27354f !important;
            border-left-color: #3b82f6 !important;
            color: #f1f5f9 !important;
          }
          .email-msg-box p, .email-msg-box li, .email-msg-box span, .email-msg-box div {
            color: #f1f5f9 !important;
          }
          strong, b, .email-strong {
            color: #ffffff !important;
          }
          .card, .email-card {
            background-color: #0f172a !important;
            border-color: #1e293b !important;
          }
          .card-header, .email-card-header {
            color: #94a3b8 !important;
            border-bottom-color: #1e293b !important;
          }
          .info-table td {
            border-bottom-color: #1e293b !important;
          }
          .info-label {
            color: #94a3b8 !important;
          }
          .info-val {
            color: #f8fafc !important;
          }
          .tier-badge {
            background-color: #064e3b !important;
            color: #34d399 !important;
            border-color: #065f46 !important;
          }
          .pdf-notice {
            background-color: #0f172a !important;
            border-color: #1e3a8a !important;
          }
          .pdf-notice-title {
            color: #93c5fd !important;
          }
          .pdf-notice-desc {
            color: #bfdbfe !important;
          }
          .action-box, .email-action-box {
            background-color: #1a2234 !important;
            border-color: #27354f !important;
            color: #f8fafc !important;
          }
          .action-box-title {
            color: #f8fafc !important;
          }
          .action-box-link {
            color: #60a5fa !important;
          }
          .footer, .email-footer {
            background-color: #0b0f19 !important;
            border-top-color: #1e293b !important;
            color: #64748b !important;
          }
          .footer p, .footer span {
            color: #94a3b8 !important;
          }
          .footer strong {
            color: #cbd5e1 !important;
          }
          .footer a {
            color: #60a5fa !important;
          }
          .qr-box {
            background-color: #0f172a !important;
            border-color: #334155 !important;
          }
          .qr-pad {
            background-color: #ffffff !important;
          }
        }

        /* ── Outlook App & Office 365 Dark Mode Hooks ── */
        [data-ogsc] .wrapper, [data-ogsb] .wrapper { background-color: #0b0f19 !important; }
        [data-ogsc] .container, [data-ogsb] .container { background-color: #111827 !important; border-color: #1e293b !important; }
        [data-ogsc] .header, [data-ogsb] .header { background-color: #0f172a !important; border-bottom-color: #1e293b !important; }
        [data-ogsc] .logo-text, [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3, [data-ogsc] .email-title { color: #f8fafc !important; }
        [data-ogsc] .email-msg-box, [data-ogsb] .email-msg-box { background-color: #1a2234 !important; border-color: #27354f !important; color: #f8fafc !important; }
        [data-ogsc] p, [data-ogsc] li, [data-ogsc] td { color: #cbd5e1 !important; }
        [data-ogsc] strong, [data-ogsc] b { color: #ffffff !important; }
        [data-ogsc] .card, [data-ogsb] .card { background-color: #0f172a !important; border-color: #1e293b !important; }
        [data-ogsc] .footer, [data-ogsb] .footer { background-color: #0b0f19 !important; border-top-color: #1e293b !important; color: #94a3b8 !important; }
      </style>
    </head>
    <body class="email-bg">
      <!-- Hidden Preheader Snippet for Mobile Lock-Screen & Push Notifications -->
      <div style="display: none !important; font-size: 1px !important; color: #ffffff !important; line-height: 1px !important; max-height: 0px !important; max-width: 0px !important; opacity: 0 !important; overflow: hidden !important; mso-hide: all; visibility: hidden;">
        ${previewSnippet}
        &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279;
      </div>

      <div class="wrapper email-bg">
        <div class="container email-container">
          <div class="header email-header">
            ${eventLogo ? `<img src="${eventLogo}" alt="Logo" class="logo-img" />` : ""}
            <h1 class="logo-text">${displayTitle}</h1>
            <div class="logo-tag">${headerTag}</div>
          </div>
          <div class="body email-body">
            ${content}
          </div>
          <div class="footer email-footer">
            <p style="margin: 0 0 8px 0; color: #64748b;">Dispatched securely via <strong class="email-strong">Eventzone Platform</strong>.</p>
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
  templateUrl = "",
  badgeSettings = {},
  attendeePhoto = "",
  eventId = "",
  cardTheme = "",
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
        eventId: eventId || "",
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
        templateUrl: templateUrl || "",
        attendeeName: attendeeName || "Attendee",
        attendeeEmail: to,
        attendeeCompany: company || "",
        attendeeJobTitle: jobTitle || "",
        attendeePhoto: attendeePhoto || "",
        ticketTier: ticketTier || "Standard Admission",
        badgeCode: cleanBadgeCode,
        eventId: eventId || "",
        eventTitle: eventTitle || "Eventzone Conference",
        eventDate: eventDate || "",
        eventLocation: eventLocation || "",
        qrDataUrl: resolvedQrUrl,
        showFoldGuide: badgeSettings.showFoldGuide !== false,
        showPhoto: badgeSettings.showPhoto !== false,
        showQr: badgeSettings.showQr !== false,
        cardTheme: cardTheme || badgeSettings.cardTheme || "transparent",
        badgeSettings: badgeSettings || {},
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
 * Format markdown/bullets and paragraphs into clean HTML
 */
export function formatEmailBodyToHtml(bodyText) {
  if (!bodyText || typeof bodyText !== "string") return "";
  let text = bodyText.trim();
  
  // Format bold **text** across single and multi lines
  text = text.replace(/\*\*([\s\S]*?)\*\*/g, '<strong class="email-strong" style="font-weight: 800; color: inherit;">$1</strong>');
  // Format italic *text* or _text_
  text = text.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<em style="color: inherit;">$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em style="color: inherit;">$1</em>');

  const lines = text.split('\n');
  let inList = false;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        processedLines.push('<ul class="email-list" style="margin: 14px 0; padding-left: 22px; color: inherit; line-height: 1.7;">');
        inList = true;
      }
      const itemContent = trimmed.replace(/^[•\-\*]\s*/, '');
      processedLines.push(`<li class="email-list-item" style="margin-bottom: 6px; color: inherit;">${itemContent}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        processedLines.push('<div style="height: 12px;"></div>');
      } else {
        processedLines.push(`<p class="email-paragraph" style="margin: 0 0 14px 0; line-height: 1.7; color: inherit; font-size: 14.5px;">${line}</p>`);
      }
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('');
}

/**
 * Generate responsive HTML email layout for broadcast announcements
 */
export function generateBroadcastHtml({
  subject,
  body,
  preheader = "",
  eventTitle = "Eventzone Summit",
  organizerName = "Eventzone Organizer",
  eventLogo = "",
  eventDate = "",
  eventLocation = "",
  headerTag = "Official Event Announcement",
  buttonConfig = {},
  includeQr = false,
  qrCid = "",
  qrDataUrl = "",
  includeEventCard = true,
  trackingPixelUrl = "",
  recipientName = "",
}) {
  const formattedBody = formatEmailBodyToHtml(body);
  const displayPreheader = preheader || (body ? body.slice(0, 140).replace(/\s+/g, ' ').trim() : subject);

  let buttonsHtml = '';
  
  // 1. Form / Survey CTA Button
  if (buttonConfig?.includeFormButton && buttonConfig?.formUrl) {
    buttonsHtml += `
      <div class="action-box email-action-box" style="text-align: center; margin: 22px 0 14px 0; padding: 20px 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div class="action-box-title" style="font-size: 13.5px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Action Required: Questionnaire / Survey</div>
        <a href="${buttonConfig.formUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 30px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
          ${buttonConfig.formButtonText || "Complete Form / Survey"} →
        </a>
        <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
          Direct link: <a href="${buttonConfig.formUrl}" class="action-box-link" style="color: #2563eb; text-decoration: underline;">${buttonConfig.formUrl}</a>
        </div>
      </div>
    `;
  }

  // 2. Ticket / Badge Pass Button
  if (buttonConfig?.includeTicketButton && buttonConfig?.ticketUrl) {
    buttonsHtml += `
      <div style="text-align: center; margin: 16px 0;">
        <a href="${buttonConfig.ticketUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">
          🎟️ ${buttonConfig.ticketButtonText || "View My Event Badge"} →
        </a>
      </div>
    `;
  }

  // 3. Custom Secondary CTA Button
  if (buttonConfig?.includeCustomButton && buttonConfig?.customButtonUrl) {
    buttonsHtml += `
      <div style="text-align: center; margin: 16px 0;">
        <a href="${buttonConfig.customButtonUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #f1f5f9; color: #1e293b !important; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; text-decoration: none; padding: 11px 24px; border-radius: 12px;">
          🔗 ${buttonConfig.customButtonText || "Access Resource"} →
        </a>
      </div>
    `;
  }

  // 4. QR Pass Container
  let qrHtml = '';
  if (includeQr && (qrCid || qrDataUrl)) {
    const imgSrc = qrCid ? `cid:${qrCid}` : qrDataUrl;
    qrHtml = `
      <div style="text-align: center; margin: 26px 0;">
        <div class="qr-box" style="text-align: center; padding: 20px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; display: inline-block;">
          <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Fast-Track Check-In QR Pass</div>
          <div class="qr-pad" style="background-color: #ffffff; padding: 10px; border-radius: 12px; display: inline-block;">
            <img src="${imgSrc}" alt="Entry QR Pass" width="180" height="180" style="display: block; margin: 0 auto; border-radius: 8px;" />
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">Present this scannable QR code on your mobile device at check-in</div>
        </div>
      </div>
    `;
  }

  // 5. Event Info Card
  let eventCardHtml = '';
  if (includeEventCard && (eventDate || eventLocation)) {
    eventCardHtml = `
      <div class="card email-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 22px; margin: 22px 0;">
        <div class="card-header email-card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Event Highlights</div>
        <table role="presentation" class="info-table" style="width: 100%; border-collapse: collapse;">
          ${eventDate ? `
          <tr>
            <td class="info-label" style="padding: 6px 0; font-size: 12.5px; color: #64748b; font-weight: 600;" width="35%">📅 Date & Time</td>
            <td class="info-val" style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;" width="65%">${eventDate}</td>
          </tr>` : ''}
          ${eventLocation ? `
          <tr>
            <td class="info-label" style="padding: 6px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">📍 Venue</td>
            <td class="info-val" style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventLocation}</td>
          </tr>` : ''}
          <tr>
            <td class="info-label" style="padding: 6px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">🏛️ Host</td>
            <td class="info-val" style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${organizerName}</td>
          </tr>
        </table>
      </div>
    `;
  }

  // 6. Tracking Pixel (Transparent 1x1 pixel formatted for all major mail clients)
  const pixelHtml = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" alt="" width="1" height="1" border="0" style="display:block !important; width:1px !important; min-width:1px !important; height:1px !important; min-height:1px !important; border:0 !important; outline:none !important; margin:0 !important; padding:0 !important; -ms-interpolation-mode:bicubic;" />`
    : '';

  const content = `
    <h1 class="email-title" style="color: #0f172a; margin-top: 0; margin-bottom: 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.4px;">${subject}</h1>
    <p class="email-subtext" style="font-size: 12.5px; color: #64748b; margin-top: 0; margin-bottom: 22px;">
      Broadcast announcement from <strong class="email-strong">${organizerName}</strong> for <strong class="email-strong">${eventTitle}</strong>
    </p>

    <div class="email-msg-box" style="font-size: 14.5px; color: #1e293b; line-height: 1.7; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 20px 0; border-radius: 6px 14px 14px 6px;">
      ${formattedBody}
    </div>

    ${buttonsHtml}
    ${qrHtml}
    ${eventCardHtml}

    <p class="email-footer-notice" style="font-size: 12px; color: #94a3b8; margin-top: 28px; line-height: 1.5;">
      You received this official broadcast as a registered participant, partner, or exhibitor of <strong class="email-strong">${eventTitle}</strong>.
    </p>
    ${pixelHtml}
  `;

  return getEmailLayout({
    title: subject,
    eventTitle,
    eventLogo,
    headerTag,
    preheader: displayPreheader,
    content,
    footerText: `Sent to registered participants of ${eventTitle} • Organized by ${organizerName}`
  });
}

/**
 * 3. Broadcast Announcement Email to Group of Recipients
 */
export async function sendBroadcastEmail({
  to,
  subject,
  body,
  preheader = "",
  eventTitle = "Eventzone Summit",
  organizerName = "Event Organizer",
  eventLogo = "",
  eventDate = "",
  eventLocation = "",
  headerTag = "Official Event Announcement",
  buttonConfig = {},
  includeQr = false,
  qrDataUrl = "",
  qrBuffer = null,
  includeEventCard = true,
  trackingPixelUrl = "",
  recipientName = "",
}) {
  let attachments = [];
  let qrCid = "";

  if (includeQr && qrBuffer) {
    qrCid = `ez_qr_pass_${Date.now()}`;
    attachments.push({
      filename: "fast_track_qr_pass.png",
      content: qrBuffer,
      cid: qrCid,
      contentType: "image/png"
    });
  }

  const html = generateBroadcastHtml({
    subject,
    body,
    preheader,
    eventTitle,
    organizerName,
    eventLogo,
    eventDate,
    eventLocation,
    headerTag,
    buttonConfig,
    includeQr,
    qrCid,
    qrDataUrl,
    includeEventCard,
    trackingPixelUrl,
    recipientName,
  });

  const cleanBody = body.replace(/\*\*/g, "").replace(/(?<!\*)\*(?!\*)/g, "").trim();
  const plainText = [
    `${subject}`,
    `========================================`,
    `Event: ${eventTitle}`,
    eventDate ? `Date: ${eventDate}` : "",
    eventLocation ? `Venue: ${eventLocation}` : "",
    `----------------------------------------`,
    cleanBody,
    buttonConfig?.formUrl ? `\nForm / Questionnaire: ${buttonConfig.formUrl}` : "",
    buttonConfig?.ticketUrl ? `Event Badge: ${buttonConfig.ticketUrl}` : "",
    buttonConfig?.customButtonUrl ? `Resource Link: ${buttonConfig.customButtonUrl}` : "",
    `\n----------------------------------------`,
    `Dispatched by ${organizerName} via Eventzone Platform.`,
    `For support or inquiries, reply directly to ${SENDER_EMAIL}`,
  ].filter(Boolean).join("\n");

  return await sendEmail({
    to,
    subject: subject,
    text: plainText,
    html,
    attachments,
    eventTitle,
    listUnsubscribe: true,
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

/**
 * 5. Certificate of Attendance / Achievement Delivery Email
 */
export async function sendCertificateEmail({
  to,
  recipientName = "Valued Participant",
  recipientRole = "attendee",
  company = "",
  jobTitle = "",
  certificateTitle = "Certificate of Attendance",
  certificateId = "",
  eventTitle = "Eventzone Summit",
  eventDate = "",
  eventLocation = "",
  organizerName = "Eventzone Organizing Committee",
  subject,
  message,
  eventId,
  attachments = [],
  template = {},
  subtitleText,
  recipientSubtext,
  bodyText,
  certificateImage,
}) {
  const finalSubject = subject || `Official Certificate: ${certificateTitle} - ${eventTitle}`;
  const preheader = `Congratulations ${recipientName}! Your official ${certificateTitle} for ${eventTitle} is attached as a PDF.`;

  // Auto-generate high-resolution official Landscape A4 Certificate PDF attachment
  const finalAttachments = [...(attachments || [])];
  try {
    const pdfBuffer = await generateCertificatePdfBuffer({
      recipientName,
      recipientRole,
      company,
      jobTitle,
      certificateTitle,
      subtitleText: subtitleText || template?.subtitleText,
      recipientSubtext: recipientSubtext || template?.recipientSubtext,
      bodyText: bodyText || template?.bodyText,
      certificateId,
      eventTitle,
      eventDate,
      eventLocation,
      organizerName,
      template: template || {},
      certificateImage,
    });

    if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
      const cleanName = (recipientName || "Official").replace(/[^a-zA-Z0-9_-]/g, "_");
      finalAttachments.push({
        filename: `Certificate_${cleanName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }
  } catch (pdfErr) {
    console.warn("Could not generate certificate PDF attachment in mailer:", pdfErr);
  }

  const content = message ? `
    <div style="font-size: 15px; color: #1e293b; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${message.replace(/\n/g, "<br/>")}
    </div>
  ` : `
    <div style="font-size: 15px; color: #1e293b; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 16px 0;">Dear <strong>${recipientName}</strong>,</p>
      <p style="margin: 0 0 16px 0;">We are delighted to present your official certificate for distinguished participation in <strong>${eventTitle}</strong>.</p>
      <p style="margin: 0 0 24px 0;">Your official certificate is attached to this email as a printable PDF.</p>
      <p style="margin: 0;">Warm regards,<br/><strong>${organizerName || "Event Organizing Committee"}</strong></p>
    </div>
  `;

  const plainText = `Dear ${recipientName},\n\nCongratulations! Your official ${certificateTitle} for ${eventTitle} is attached as a PDF file.\n\nCredential Details:\n- Recipient: ${recipientName}\n- Certificate ID: ${certificateId || "N/A"}\n- Role: ${recipientRole}\n${company ? `- Organization: ${company}\n` : ""}${eventDate ? `- Date: ${eventDate}\n` : ""}${eventLocation ? `- Venue: ${eventLocation}\n` : ""}\n${message ? `\nNote from Organizer:\n${message}\n` : ""}\nIssued by: ${organizerName || "Eventzone Organizing Committee"}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: finalSubject,
    text: plainText,
    attachments: finalAttachments,
    html: getEmailLayout({
      title: `${certificateTitle} - ${recipientName}`,
      preheader,
      content,
      eventTitle,
    }),
  });
}
