/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Mail,
  Send,
  Sparkles,
  QrCode as QrIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Loader2,
  FileText,
  User,
  Ticket,
  Building2,
  MapPin,
  Calendar,
  RotateCcw,
  Sun,
  Moon,
  Link2,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';
import QRCode from 'qrcode';
import SearchableSelect from './SearchableSelect';
import { logCommunication } from '../lib/db';

const EMAIL_TEMPLATES = [
  {
    id: "badge_pass",
    label: "Official Digital Badge & Fast-Track QR Pass",
    description: "Sends the delegate their event entry pass with fast-track QR code.",
    type: "ticket_confirmation",
    includeQr: true,
    getSubject: (data) => `Your Official Badge Pass for ${data.eventTitle}`,
    getBody: (data) => 
`Hello ${data.name},

Your registration for ${data.eventTitle} has been confirmed. Please find your official attendee pass and access details below.

You can present the attached fast-track QR code directly on your mobile device at the registration desks for immediate badge printing and venue check-in.

We look forward to welcoming you!

Best regards,
${data.organizerName || "The Organizing Committee"}`
  },
  {
    id: "event_reminder",
    label: "Event Reminder & Venue Access Details",
    description: "Remind attendee of dates, venue address, and arrival recommendations.",
    type: "custom",
    includeQr: true,
    getSubject: (data) => `Important Arrival & Check-In Details: ${data.eventTitle}`,
    getBody: (data) =>
`Hello ${data.name},

This is a friendly reminder that ${data.eventTitle} is approaching!

📅 Event Dates: ${data.eventDate || "Upcoming Summit"}
📍 Venue Location: ${data.eventLocation || "Summit Exhibition Center"}
🎟️ Your Access Tier: ${data.ticketTier || "Delegate Pass"}

Please plan to arrive 15 minutes before the opening session. Have your digital pass QR code ready for swift badge collection.

If you have any questions or accessibility requests, please let us know.

See you soon,
${data.organizerName || "Eventzone Team"}`
  },
  {
    id: "registration_welcome",
    label: "Registration Confirmation & Welcome Greeting",
    description: "Welcome new attendee with an overview of their confirmed access tier.",
    type: "custom",
    includeQr: false,
    getSubject: (data) => `Welcome to ${data.eventTitle}! Your registration is confirmed`,
    getBody: (data) =>
`Dear ${data.name},

Thank you for registering for ${data.eventTitle}. We are thrilled to have you join us.

Your ${data.ticketTier || "Delegate"} pass grants you full access to scheduled keynotes, networking lounges, and conference tracks.

Stay tuned for upcoming speaker announcements and track schedules.

Warm regards,
${data.organizerName || "Eventzone Platform"}`
  },
  {
    id: "schedule_update",
    label: "Schedule / Program Track Announcement",
    description: "Notify attendee of agenda updates or keynote room allocations.",
    type: "custom",
    includeQr: false,
    getSubject: (data) => `Schedule Update & Keynote Alert: ${data.eventTitle}`,
    getBody: (data) =>
`Hello ${data.name},

We have updated the summit program and agenda for ${data.eventTitle}. 

Key updates:
• Keynote tracks and panel discussions have been scheduled.
• Networking breakout rooms are now assigned.

We recommend reviewing the latest timeline on the event portal.

Best regards,
${data.organizerName || "Summit Organizing Team"}`
  },
  {
    id: "thank_you",
    label: "Post-Event Thank You & Feedback Survey",
    description: "Thank the attendee for participating and request feedback.",
    type: "custom",
    includeQr: false,
    getSubject: (data) => `Thank you for attending ${data.eventTitle}!`,
    getBody: (data) =>
`Dear ${data.name},

Thank you for taking part in ${data.eventTitle}. Your participation contributed greatly to making this summit a success.

We would appreciate it if you could share a few moments of your feedback to help us shape future editions.

Thank you again, and we look forward to seeing you at upcoming events!

Sincerely,
${data.organizerName || "Eventzone Leadership"}`
  },
  {
    id: "custom",
    label: "Custom Direct Email (Blank Template)",
    description: "Write a personalized subject and message directly from your host account.",
    type: "custom",
    includeQr: false,
    getSubject: () => "",
    getBody: () => ""
  }
];

export default function AttendeeEmailDrawer({
  isOpen,
  onClose,
  attendee = null,
  attendees = null,
  eventDetails = {},
  tickets = [],
  forms = [],
  activeEventId,
  onEmailSent
}) {
  const attendeesList = useMemo(() => {
    if (Array.isArray(attendees) && attendees.length > 0) return attendees;
    if (attendee) return [attendee];
    return [];
  }, [attendees, attendee]);

  const isBulk = attendeesList.length > 1;
  const primaryAttendee = attendeesList[0] || null;

  const [selectedTemplateId, setSelectedTemplateId] = useState("badge_pass");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeQr, setIncludeQr] = useState(true);
  const [includeFormLink, setIncludeFormLink] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState("none");
  const [customFormUrl, setCustomFormUrl] = useState("");
  const [formButtonText, setFormButtonText] = useState("Complete Form / Survey");
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "preview"
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [previewTheme, setPreviewTheme] = useState("light");

  const activeForms = useMemo(() => {
    return (forms || []).filter(f => f.status !== 'archived' && !f.isArchived);
  }, [forms]);

  const resolvedFormUrl = useMemo(() => {
    if (!includeFormLink) return "";
    if (selectedFormId === "custom_url") return customFormUrl.trim();
    if (selectedFormId && selectedFormId !== "none") {
      const matched = activeForms.find(f => f.id === selectedFormId);
      if (matched) {
        if (typeof window !== "undefined") {
          return `${window.location.origin}/?formId=${matched.id}`;
        }
        return `/?formId=${matched.id}`;
      }
    }
    if (customFormUrl.trim()) return customFormUrl.trim();
    return "";
  }, [includeFormLink, selectedFormId, customFormUrl, activeForms]);

  const getAttendeeData = (att) => {
    if (!att) return null;
    const name = att.name || `${att.first_name || ''} ${att.last_name || ''}`.trim() || "Attendee";
    const email = att.email || att.answers?.email || att.customAnswers?.email || "";
    const badgeCode = att.badgeCode || att.badge_code || `EZ-${String(att.id || '').slice(-4).toUpperCase() || 'PASS'}`;
    const ticketTier = att.ticketType || att.ticket_type || "Standard Admission";
    const company = att.company || att.organization || "";
    const jobTitle = att.jobTitle || att.job_title || "";
    const eventTitle = eventDetails.title || "Eventzone Summit";
    const eventLocation = eventDetails.location || "Event Venue";
    const eventDate = eventDetails.startDate || "March 2026";
    const organizerName = eventDetails.organizerName || "Eventzone Platform";

    const extractImageFromAnswers = (ans) => {
      if (!ans || typeof ans !== 'object') return '';
      for (const [k, v] of Object.entries(ans)) {
        if (typeof v === 'string' && v.trim()) {
          const val = v.trim();
          if (val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('blob:') || val.includes('/storage/v1/object/')) {
            return val;
          }
          const kLower = k.toLowerCase();
          if (kLower.includes('picture') || kLower.includes('photo') || kLower.includes('avatar') || kLower.includes('image')) {
            return val;
          }
        }
      }
      return '';
    };

    const photo = (
      (att.avatar && !att.avatar.includes('ui-avatars.com') ? att.avatar : '') ||
      (att.image && !att.image.includes('ui-avatars.com') ? att.image : '') ||
      (att.photo ? att.photo : '') ||
      (att.badgePicture ? att.badgePicture : '') ||
      (att.avatar_url ? att.avatar_url : '') ||
      extractImageFromAnswers(att.answers || att.customAnswers || att.formAnswers || {}) ||
      ''
    );

    return {
      name,
      email,
      photo,
      badgeCode,
      ticketTier,
      company,
      jobTitle,
      eventTitle,
      eventLocation,
      eventDate,
      eventLogo: eventDetails.eventLogo || eventDetails.logo || eventDetails.logo_url || eventDetails.organizerLogo || "",
      organizerName
    };
  };

  const attendeeData = useMemo(() => {
    return getAttendeeData(primaryAttendee);
  }, [primaryAttendee, eventDetails]);

  // Generate QR code data URL for preview
  useEffect(() => {
    if (!attendeeData || !primaryAttendee) return;
    const payload = JSON.stringify({
      passId: primaryAttendee.id,
      badgeCode: attendeeData.badgeCode,
      name: attendeeData.name,
      ticketType: attendeeData.ticketTier,
      eventTitle: attendeeData.eventTitle
    });
    QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(url => setQrCodeDataUrl(url))
      .catch(console.error);
  }, [attendeeData, primaryAttendee]);

  // Populate template defaults when template changes or attendee changes
  useEffect(() => {
    if (!attendeeData) return;
    const tmpl = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId) || EMAIL_TEMPLATES[0];
    setSubject(tmpl.getSubject(attendeeData));
    setBody(tmpl.getBody(attendeeData));
    setIncludeQr(tmpl.includeQr);

    if (tmpl.id === "thank_you") {
      if (activeForms.length > 0) {
        setIncludeFormLink(true);
        setSelectedFormId(activeForms[0].id);
        setFormButtonText("Provide Event Feedback");
      }
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [selectedTemplateId, attendeeData, activeForms]);

  if (!isOpen || attendeesList.length === 0 || !attendeeData) return null;

  const insertVariable = (tag) => {
    if (tag === "{{formLink}}") {
      if (!includeFormLink) setIncludeFormLink(true);
      if (selectedFormId === "none" && activeForms.length > 0) {
        setSelectedFormId(activeForms[0].id);
      }
    }
    const map = {
      "{{name}}": attendeeData.name,
      "{{eventTitle}}": attendeeData.eventTitle,
      "{{ticketTier}}": attendeeData.ticketTier,
      "{{badgeCode}}": attendeeData.badgeCode,
      "{{venue}}": attendeeData.eventLocation,
      "{{date}}": attendeeData.eventDate,
      "{{formLink}}": resolvedFormUrl || "{{formLink}}",
      "{{company}}": attendeeData.company || "Company"
    };
    const val = map[tag] || tag;
    setBody(prev => prev + " " + val);
  };

  const generateCustomEmailHtml = (data, messageBody, qrUrl) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Product+Sans:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Product+Sans:wght@400;700&display=swap');
          :root { color-scheme: light dark; supported-color-schemes: light dark; }
          body, table, td, p, a, h1, h2, h3, h4, span, div { font-family: 'Google Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
          body { background-color: #f8fafc; color: #334155; margin: 0; padding: 24px 0; -webkit-font-smoothing: antialiased; }
          .email-card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .email-header { background-color: #ffffff; padding: 26px 26px 20px 26px; text-align: left; border-bottom: 1px solid #f1f5f9; }
          .header-logo { max-height: 44px; max-width: 180px; object-fit: contain; margin: 0 0 10px 0; display: block; }
          .header-title { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; margin: 0; color: #0f172a; text-align: left; }
          .header-tag { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; font-weight: 800; margin: 4px 0 0 0; text-align: left; }
          .email-body { padding: 28px 24px; color: #334155; line-height: 1.65; font-size: 14px; }
          .email-body p { margin: 0 0 16px 0; color: #475569; }
          .email-body strong { color: #0f172a; }
          .email-footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          .qr-box { text-align: center; margin: 24px 0; padding: 18px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; }
          .qr-pad { background: #ffffff; padding: 8px; border-radius: 10px; display: inline-block; }
          .form-box { text-align: center; margin: 26px 0; padding: 22px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; }
          @media (prefers-color-scheme: dark) {
            body { background-color: #090d16 !important; }
            .email-card { background-color: #111827 !important; border-color: #1f293d !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important; }
            .email-header { background-color: #0f172a !important; border-bottom-color: #1e293b !important; }
            .header-title { color: #f8fafc !important; }
            .header-tag { color: #60a5fa !important; }
            .email-body { color: #cbd5e1 !important; }
            .email-body p { color: #94a3b8 !important; }
            .email-body strong { color: #f8fafc !important; }
            .qr-box { background-color: #0b0f19 !important; border-color: #334155 !important; }
            .form-box { background-color: #0b0f19 !important; border-color: #1f293d !important; }
            .email-footer { background-color: #0b0f19 !important; border-top-color: #1f293d !important; color: #64748b !important; }
          }
        </style>
      </head>
      <body>
        <!-- Hidden Preheader Snippet for Mobile Lock-Screen & Push Notifications -->
        <div style="display: none !important; font-size: 1px !important; color: #ffffff !important; line-height: 1px !important; max-height: 0px !important; max-width: 0px !important; opacity: 0 !important; overflow: hidden !important; mso-hide: all; visibility: hidden;">
          ${(messageBody || "").slice(0, 150).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
          &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279;
        </div>

        <div class="email-card">
          <div class="email-header">
            ${data.eventLogo ? `<img src="${data.eventLogo}" alt="Logo" class="header-logo" />` : ""}
            <h2 class="header-title">${data.eventTitle}</h2>
            <p class="header-tag">Official Attendee Notification</p>
          </div>
          <div class="email-body">
            <p style="white-space: pre-line;">${messageBody.trim()}</p>
            ${includeQr && qrUrl ? `
              <div class="qr-box">
                <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Your Fast-Track Entry QR Code</p>
                <div class="qr-pad">
                  <img src="${qrUrl}" alt="Badge QR" width="160" height="160" style="display: block; margin: 0 auto; background-color: #ffffff;" />
                </div>
              </div>
            ` : ""}
            ${includeFormLink && resolvedFormUrl ? `
              <div class="form-box">
                <div style="font-size: 13.5px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Action Required: Event Questionnaire</div>
                <a href="${resolvedFormUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                  ${formButtonText.trim() || "Open Form"} →
                </a>
                <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
                  Direct link: <a href="${resolvedFormUrl}" style="color: #2563eb; text-decoration: underline;">${resolvedFormUrl}</a>
                </div>
              </div>
            ` : ""}
          </div>
          <div class="email-footer">
            <p style="margin: 0;">Dispatched by <strong>${data.organizerName}</strong> via Eventzone Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setErrorMsg("Please enter both a subject line and email body.");
      return;
    }

    const validRecipients = attendeesList.filter(a => {
      const em = a.email || a.answers?.email || a.customAnswers?.email || "";
      return em && em.includes("@");
    });

    if (validRecipients.length === 0) {
      setErrorMsg("None of the selected attendees have a valid email address.");
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSendingProgress(0);

    try {
      const tmpl = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validRecipients.length; i++) {
        const curAtt = validRecipients[i];
        const curData = getAttendeeData(curAtt);
        setSendingProgress(i + 1);

        try {
          // Generate individual QR code for each attendee
          let curQrDataUrl = "";
          if (includeQr) {
            try {
              const checkinPayload = JSON.stringify({
                action: "checkin",
                attendeeId: curAtt.id || curData.badgeCode || "",
                badgeCode: curData.badgeCode || "EZ-PASS",
                name: curData.name || "",
                email: curData.email || "",
                tier: curData.ticketTier || "",
                eventId: activeEventId || eventDetails.id || "",
                event: curData.eventTitle || ""
              });
              curQrDataUrl = await QRCode.toDataURL(checkinPayload, {
                width: 360,
                margin: 0,
                color: { dark: "#0f172a", light: "#00000000" },
                errorCorrectionLevel: 'M'
              });
            } catch (err) {
              console.warn("QR code generation failed:", err);
            }
          }

          // Personalize subject and body variables for this specific attendee
          const personalizedSubject = subject
            .replace(/\{\{name\}\}/g, curData.name)
            .replace(/\{\{eventTitle\}\}/g, curData.eventTitle)
            .replace(/\{\{ticketTier\}\}/g, curData.ticketTier)
            .replace(/\{\{badgeCode\}\}/g, curData.badgeCode)
            .replace(/\{\{venue\}\}/g, curData.eventLocation)
            .replace(/\{\{date\}\}/g, curData.eventDate)
            .replace(/\{\{company\}\}/g, curData.company || "")
            .replace(/\{\{formLink\}\}/g, resolvedFormUrl || "");

          const personalizedBody = body
            .replace(/\{\{name\}\}/g, curData.name)
            .replace(/\{\{eventTitle\}\}/g, curData.eventTitle)
            .replace(/\{\{ticketTier\}\}/g, curData.ticketTier)
            .replace(/\{\{badgeCode\}\}/g, curData.badgeCode)
            .replace(/\{\{venue\}\}/g, curData.eventLocation)
            .replace(/\{\{date\}\}/g, curData.eventDate)
            .replace(/\{\{company\}\}/g, curData.company || "")
            .replace(/\{\{formLink\}\}/g, resolvedFormUrl || "");

          let payload;
          if (tmpl && tmpl.id === "badge_pass") {
            payload = {
              type: "ticket_confirmation",
              to: curData.email,
              subject: personalizedSubject.trim(),
              attendeeName: curData.name,
              ticketTier: curData.ticketTier,
              eventTitle: curData.eventTitle,
              eventDate: curData.eventDate,
              eventLocation: curData.eventLocation,
              badgeCode: curData.badgeCode,
              qrDataUrl: includeQr ? curQrDataUrl : undefined,
              passId: curAtt.id,
              formUrl: includeFormLink && resolvedFormUrl ? resolvedFormUrl : undefined,
              formButtonText: includeFormLink && resolvedFormUrl ? (formButtonText.trim() || "Open Form") : undefined,
              eventLogo: curData.eventLogo,
              organizerName: curData.organizerName
            };
          } else {
            payload = {
              type: "custom",
              to: curData.email,
              subject: personalizedSubject.trim(),
              text: personalizedBody.trim(),
              html: generateCustomEmailHtml(curData, personalizedBody, curQrDataUrl)
            };
          }

          const res = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (res.ok && data.success) {
            successCount++;
            try {
              await logCommunication({
                eventId: activeEventId || eventDetails.id || "default",
                recipientEmail: curData.email,
                recipientName: curData.name,
                subject: personalizedSubject.trim(),
                type: "email",
                channel: tmpl?.id || "custom_message",
                status: "delivered",
                preview: personalizedBody.slice(0, 120),
                sentBy: "Organizer"
              });
            } catch (e) {}
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Failed to send email to ${curData.email}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMsg(
          isBulk 
            ? `Successfully delivered emails to ${successCount} attendee(s)${failCount > 0 ? ` (${failCount} failed)` : ''}!`
            : `Email successfully delivered to ${attendeeData.email}!`
        );
        if (onEmailSent) onEmailSent(successCount);
      } else {
        throw new Error("Failed to deliver emails through the SMTP server. Please verify your connection.");
      }
    } catch (err) {
      console.error("Failed to send email to attendee:", err);
      setErrorMsg(err.message || "An unexpected error occurred while dispatching email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={!isSending ? onClose : null} />

      {/* Main Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 z-10">
        
        {/* Drawer Header */}
        <header className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">
              {isBulk ? `Send Email to ${attendeesList.length} Attendees` : "Send Email to Attendee"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isBulk 
                ? `Compose a personalized message or choose a template to dispatch to all ${attendeesList.length} recipients.`
                : "Compose a direct message or select a pre-made template"
              }
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Recipients Bar (Bulk Mode: Count + Names List | Single Mode: Attendee Snapshot) */}
        {isBulk ? (
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  {attendeesList.length}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Sending to {attendeesList.length} Selected Attendees
                </span>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Personalized per recipient
              </span>
            </div>

            {/* Scrollable list of attendee names & badges */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {attendeesList.map((att, idx) => {
                const attData = getAttendeeData(att);
                return (
                  <div
                    key={att.id || `recip-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-800 max-w-full"
                  >
                    {attData.photo ? (
                      <img
                        src={attData.photo}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-200"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {attData.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="truncate max-w-[140px]">{attData.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium shrink-0">
                      {attData.ticketTier}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {attendeeData.photo ? (
                <img
                  src={attendeeData.photo}
                  alt={attendeeData.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {attendeeData.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 truncate">{attendeeData.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100/70 border border-blue-200 text-blue-800 text-[10px] font-bold shrink-0">
                    {attendeeData.ticketTier}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{attendeeData.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher: Compose vs Preview */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("compose")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "compose"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Edit3 size={13} />
              <span>Compose Message</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "preview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye size={13} />
              <span>Live Email Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const tmpl = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);
              if (tmpl) {
                setSubject(tmpl.getSubject(attendeeData));
                setBody(tmpl.getBody(attendeeData));
              }
            }}
            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-semibold pb-2"
            title="Reset template text to default"
          >
            <RotateCcw size={11} />
            <span>Reset Template</span>
          </button>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === "compose" ? (
            <div className="space-y-4">
              
              {/* Template Selector Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Choose Pre-Made Email Template
                </label>
                <SearchableSelect
                  value={selectedTemplateId}
                  onChange={(val) => setSelectedTemplateId(val)}
                  options={EMAIL_TEMPLATES.map(t => ({
                    value: t.id,
                    label: t.label,
                    description: t.description
                  }))}
                  placeholder="Select template..."
                />
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subject Line</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Dynamic Tag Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Click Tag to Insert Variable:
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: "{{name}}", label: "Attendee Name" },
                    { tag: "{{eventTitle}}", label: "Event Title" },
                    { tag: "{{ticketTier}}", label: "Ticket Tier" },
                    { tag: "{{venue}}", label: "Venue" },
                    { tag: "{{date}}", label: "Date" },
                    { tag: "{{formLink}}", label: "Form Link" }
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      +{v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Message Content</label>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Include QR Code Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <QrIcon size={16} className="text-slate-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Include Fast-Track QR Code & Pass Card</div>
                    <div className="text-[11px] text-slate-500">Embeds attendee door scan pass code directly into the email body.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeQr}
                  onChange={(e) => setIncludeQr(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                />
              </div>

              {/* Include Form Link Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Link2 size={16} className="text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Attach Form or Survey Link</div>
                      <div className="text-[11px] text-slate-500">Embed a call-to-action button linking to an event form or survey.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeFormLink}
                    onChange={(e) => setIncludeFormLink(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                  />
                </div>

                {includeFormLink && (
                  <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Choose Event Form or Survey</label>
                      <SearchableSelect
                        value={selectedFormId}
                        onChange={(val) => {
                          setSelectedFormId(val);
                          if (val !== "custom_url" && val !== "none") {
                            const matched = activeForms.find(f => f.id === val);
                            if (matched && matched.title) {
                              setFormButtonText(`Complete ${matched.title}`);
                            }
                          }
                        }}
                        options={[
                          ...activeForms.map(f => ({
                            value: f.id,
                            label: `${f.title || "Untitled Form"} (${f.category || "Form"})`,
                            description: f.description || `Form ID: ${f.id}`
                          })),
                          { value: "custom_url", label: "Custom External Link (e.g. Google Forms / Typeform)" }
                        ]}
                        placeholder="Select a form..."
                      />
                    </div>

                    {selectedFormId === "custom_url" && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600">External Form / Survey URL</label>
                        <input
                          type="url"
                          value={customFormUrl}
                          onChange={(e) => setCustomFormUrl(e.target.value)}
                          placeholder="https://forms.google.com/... or https://typeform.com/..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Button Call-to-Action Label</label>
                      <input
                        type="text"
                        value={formButtonText}
                        onChange={(e) => setFormButtonText(e.target.value)}
                        placeholder="e.g. Complete Feedback Survey"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {resolvedFormUrl && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 truncate">
                          Target URL: <strong className="text-blue-700 font-mono">{resolvedFormUrl}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => insertVariable("{{formLink}}")}
                          className="text-blue-600 font-bold hover:underline shrink-0 cursor-pointer"
                        >
                          Insert in Body
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Live Email Preview Tab */
            <div className="space-y-3">
              {/* Light / Dark Mode Toggle */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-600">Theme Preview Mode:</span>
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("light")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewTheme === "light"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Sun size={12} className="text-amber-500" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("dark")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewTheme === "dark"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Moon size={12} className="text-indigo-400" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Email Canvas Preview */}
              <div className={`border rounded-2xl overflow-hidden shadow-xs p-4 transition-colors duration-200 ${
                previewTheme === "dark"
                  ? "bg-slate-950 border-slate-800"
                  : "bg-slate-100 border-slate-200"
              }`}>
                <div className={`max-w-md mx-auto rounded-xl border overflow-hidden shadow-sm transition-colors duration-200 ${
                  previewTheme === "dark"
                    ? "bg-slate-900 border-slate-800 text-slate-200"
                    : "bg-white border-slate-200 text-slate-700"
                }`}>
                  
                  {/* Email Header */}
                  <div className={`p-5 text-left border-b transition-colors duration-200 ${
                    previewTheme === "dark" 
                      ? "bg-slate-900 border-slate-800 text-white" 
                      : "bg-white border-slate-100 text-slate-900"
                  }`}>
                    {attendeeData.eventLogo && (
                      <img 
                        src={attendeeData.eventLogo} 
                        alt="Event Logo" 
                        className="max-h-10 max-w-[180px] object-contain mb-2.5 block text-left" 
                      />
                    )}
                    <h3 className={`text-base font-extrabold tracking-tight m-0 text-left ${
                      previewTheme === "dark" ? "text-white" : "text-slate-900"
                    }`}>{attendeeData.eventTitle}</h3>
                    <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 text-left ${
                      previewTheme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}>Official Event Notification</p>
                  </div>

                  {/* Email Content */}
                  <div className="p-5 text-xs leading-relaxed space-y-3.5">
                    <div className={`font-bold text-sm border-b pb-2 ${
                      previewTheme === "dark" ? "text-white border-slate-800" : "text-slate-900 border-slate-100"
                    }`}>
                      {subject || "Event Notification"}
                    </div>
                    <p className={`whitespace-pre-line leading-relaxed ${
                      previewTheme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}>
                      {body.replace(/\{\{formLink\}\}/g, resolvedFormUrl || "https://...") || "No message content entered."}
                    </p>

                    {includeQr && qrCodeDataUrl && (
                      <div className={`my-4 p-4 border-2 border-dashed rounded-xl text-center ${
                        previewTheme === "dark"
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-50 border-slate-300"
                      }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                          previewTheme === "dark" ? "text-blue-400" : "text-slate-500"
                        }`}>Fast-Track Entry Pass</p>
                        <div className="p-2.5 bg-white rounded-xl inline-block shadow-md">
                          <img src={qrCodeDataUrl} alt="QR" className="w-32 h-32 mx-auto rounded-lg block" />
                        </div>
                      </div>
                    )}

                    {includeFormLink && resolvedFormUrl && (
                      <div className={`my-4 p-4 border rounded-xl text-center transition-colors ${
                        previewTheme === "dark"
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className={`text-xs font-bold mb-2.5 ${
                          previewTheme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}>Action Required: Event Form</div>
                        <a
                          href={resolvedFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
                        >
                          {formButtonText.trim() || "Open Form"} →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Email Footer */}
                  <div className={`p-3.5 border-t text-center text-[10px] ${
                    previewTheme === "dark"
                      ? "bg-slate-950 text-slate-500 border-slate-800"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}>
                    Eventzone Platform • Official Notification
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between select-none shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || attendeesList.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>
                  {isBulk 
                    ? `Sending (${sendingProgress}/${attendeesList.length})...`
                    : "Sending Email..."
                  }
                </span>
              </>
            ) : (
              <span>
                {isBulk 
                  ? `Send Email to ${attendeesList.length} Attendees`
                  : `Send Email to ${attendeeData.name.split(" ")[0]}`
                }
              </span>
            )}
          </button>
        </footer>

      </div>
    </div>
  );
}
