import PDFDocument from "pdfkit";

/**
 * Formats time from ISO or HH:MM string to clean 12h or 24h format
 */
function cleanTimeStr(str) {
  if (!str) return "";
  if (str.includes("T")) {
    const parts = str.split("T")[1];
    return parts ? parts.substring(0, 5) : "";
  }
  return str.substring(0, 5);
}

function calculateDuration(start, end) {
  try {
    const s = cleanTimeStr(start);
    const e = cleanTimeStr(end);
    if (!s || !e) return "";
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return "";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  } catch {
    return "";
  }
}

/**
 * Generates an executive-ready, beautifully designed Portrait A4 PDF for an event agenda
 */
export async function generateAgendaPdfBuffer({
  eventDetails = null,
  sessions = [],
  filterLabel = "All Sessions",
}) {
  return new Promise((resolve, reject) => {
    try {
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const marginX = 36;
      const marginTop = 36;
      const marginBottom = 40;
      const contentWidth = pageWidth - marginX * 2; // 523.28 pt

      const doc = new PDFDocument({
        size: "A4",
        layout: "portrait",
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Agenda & Schedule — ${eventDetails?.title || "Event"}`,
          Author: "Eventzone Platform",
          Subject: `Executive Event Agenda for ${eventDetails?.title || "Event"}`,
          Keywords: "Eventzone, Agenda, Schedule, Sessions, Speakers, Keynotes",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const timeColWidth = 82;
      const mainColX = marginX + timeColWidth + 14;
      const mainColWidth = contentWidth - timeColWidth - 14;
      const maxY = pageHeight - marginBottom - 30;

      let currentY = marginTop;

      const drawHeader = (isFirstPage = false) => {
        // Top 4pt Accent Bar (Eventzone Blue)
        doc.rect(0, 0, pageWidth, 4).fill("#2563eb");

        if (isFirstPage) {
          // Event Title & Brand Header
          doc.fontSize(18).font("Helvetica-Bold").fillColor("#0f172a");
          const evTitle = eventDetails?.title || "Event Agenda & Schedule";
          doc.text(evTitle, marginX, marginTop, { width: contentWidth - 90 });

          // Brand Watermark in upper-right
          doc.fontSize(10).font("Helvetica-Bold").fillColor("#2563eb");
          doc.text("Eventzone", marginX, marginTop + 2, { width: contentWidth, align: "right" });
          doc.fontSize(7).font("Helvetica").fillColor("#94a3b8");
          doc.text("eventzone.pro", marginX, marginTop + 16, { width: contentWidth, align: "right" });

          // Subtitle / Scope & Event Details
          const dateStr = eventDetails?.startDate || eventDetails?.date || new Date().toISOString().slice(0, 10);
          const locStr = eventDetails?.location ? ` • ${eventDetails.location}` : "";
          const orgStr = eventDetails?.organizerName || eventDetails?.organization;
          const hostPart = orgStr ? ` • Host: ${orgStr}` : "";
          
          doc.fontSize(8.5).font("Helvetica").fillColor("#64748b");
          const subtitle = `${filterLabel} • ${sessions.length} scheduled session${sessions.length === 1 ? "" : "s"} • Date: ${dateStr}${locStr}${hostPart}`;
          doc.text(subtitle, marginX, marginTop + 26, { width: contentWidth - 90 });

          // Decorative divider under banner
          doc.rect(marginX, marginTop + 44, contentWidth, 0.75).fill("#e2e8f0");
          currentY = marginTop + 56;
        } else {
          // Running compact header on subsequent pages
          doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(`${eventDetails?.title || "Event Agenda"} — ${filterLabel}`, marginX, marginTop);

          doc.fontSize(8).font("Helvetica-Bold").fillColor("#2563eb");
          doc.text("Eventzone", marginX, marginTop, { width: contentWidth, align: "right" });

          doc.rect(marginX, marginTop + 16, contentWidth, 0.5).fill("#e2e8f0");
          currentY = marginTop + 26;
        }
      };

      // Draw first page header
      drawHeader(true);

      // Sort sessions chronologically
      const sorted = [...sessions].sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = cleanTimeStr(a.startTime || a.time);
        const timeB = cleanTimeStr(b.startTime || b.time);
        return timeA.localeCompare(timeB);
      });

      // Group sessions by Date
      const dateGroups = new Map();
      sorted.forEach(s => {
        const d = s.date || "Scheduled";
        if (!dateGroups.has(d)) dateGroups.set(d, []);
        dateGroups.get(d).push(s);
      });

      let dayIndex = 1;
      for (const [dateStr, dateSessions] of dateGroups.entries()) {
        // Date Section Header
        if (currentY + 36 > maxY) {
          doc.addPage();
          drawHeader(false);
        }

        // Format Date Heading
        let dateFormatted = dateStr;
        try {
          if (dateStr && dateStr.includes("-")) {
            const dObj = new Date(dateStr);
            if (!isNaN(dObj.getTime())) {
              dateFormatted = dObj.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric"
              });
            }
          }
        } catch {}

        // Date Group Badge Banner
        doc.roundedRect(marginX, currentY, contentWidth, 22, 5).fill("#f1f5f9");
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#1e293b");
        const dayLabel = dateGroups.size > 1 ? `DAY ${dayIndex}  •  ${dateFormatted.toUpperCase()}` : dateFormatted.toUpperCase();
        doc.text(dayLabel, marginX + 10, currentY + 6);

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#2563eb");
        doc.text(`${dateSessions.length} session${dateSessions.length === 1 ? "" : "s"}`, marginX, currentY + 6, {
          width: contentWidth - 10,
          align: "right"
        });

        currentY += 30;
        dayIndex++;

        // Render Sessions for this date
        for (const session of dateSessions) {
          const sTime = cleanTimeStr(session.startTime || session.time) || "09:00";
          const eTime = cleanTimeStr(session.endTime) || "";
          const duration = calculateDuration(sTime, eTime);

          // Prepare Speakers text lines
          const speakersList = (session.speakers || []).map(sp => {
            const name = typeof sp === "string" ? sp : sp?.name || "";
            if (!name) return null;
            const title = typeof sp === "object" ? (sp.title || sp.jobTitle || "") : "";
            const comp = typeof sp === "object" ? (sp.company || "") : "";
            const meta = [title, comp].filter(Boolean).join(" • ");
            return { name, meta };
          }).filter(Boolean);

          // Prepare Moderators text lines
          const moderatorsList = (session.moderators || []).map(mod => {
            const name = typeof mod === "string" ? mod : mod?.name || "";
            if (!name) return null;
            const title = typeof mod === "object" ? (mod.title || mod.jobTitle || "") : "";
            const comp = typeof mod === "object" ? (mod.company || "") : "";
            const meta = [title, comp].filter(Boolean).join(" • ");
            return { name, meta };
          }).filter(Boolean);

          // Estimate required height for page-break calculation
          let estimatedHeight = 24; // Base: title + padding
          if (session.track) estimatedHeight += 12;
          if (session.room || session.location) estimatedHeight += 10;
          if (session.description) {
            // Rough estimation of description wrap
            const descLines = Math.ceil(session.description.length / 90);
            estimatedHeight += Math.min(descLines * 11, 44);
          }
          if (moderatorsList.length > 0) estimatedHeight += moderatorsList.length * 13;
          if (speakersList.length > 0) estimatedHeight += speakersList.length * 13;

          // Check for page break
          if (currentY + estimatedHeight > maxY) {
            doc.addPage();
            drawHeader(false);
          }

          const sessionStartY = currentY;

          // ─── LEFT TIME PILL ───
          doc.roundedRect(marginX, currentY, timeColWidth, 38, 5).fill("#f8fafc").stroke("#e2e8f0");
          doc.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(sTime, marginX + 6, currentY + 6, { width: timeColWidth - 12, align: "center" });
          if (eTime) {
            doc.fontSize(7.5).font("Helvetica").fillColor("#64748b");
            doc.text(`to ${eTime}`, marginX + 6, currentY + 18, { width: timeColWidth - 12, align: "center" });
          }
          if (duration) {
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#2563eb");
            doc.text(duration, marginX + 6, currentY + 28, { width: timeColWidth - 12, align: "center" });
          }

          // ─── RIGHT MAIN SESSION BLOCK ───
          let rightY = currentY;

          // Optional Track Pill
          if (session.track) {
            const trackText = session.track.toUpperCase();
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#4f46e5");
            const trackWidth = doc.widthOfString(trackText) + 8;
            doc.roundedRect(mainColX, rightY, trackWidth, 11, 3).fill("#eef2ff");
            doc.text(trackText, mainColX + 4, rightY + 2);
            rightY += 15;
          }

          // Session Title
          doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(session.title || "Untitled Session", mainColX, rightY, { width: mainColWidth });
          rightY = doc.y + 3;

          // Room / Location
          const loc = session.room || session.location || session.stage;
          if (loc) {
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b");
            doc.text(`Location: ${loc}`, mainColX, rightY, { width: mainColWidth });
            rightY = doc.y + 3;
          }

          // Description (compact quote style)
          if (session.description) {
            doc.fontSize(8).font("Helvetica").fillColor("#475569");
            doc.text(session.description, mainColX, rightY, {
              width: mainColWidth,
              lineGap: 1.5,
              maxHeight: 48,
              ellipsis: true
            });
            rightY = doc.y + 4;
          }

          // Moderators
          if (moderatorsList.length > 0) {
            moderatorsList.forEach(m => {
              doc.fontSize(8).font("Helvetica-Bold").fillColor("#4f46e5");
              doc.text("Moderator: ", mainColX, rightY, { continued: true });
              doc.font("Helvetica-Bold").fillColor("#0f172a");
              doc.text(m.name, { continued: Boolean(m.meta) });
              if (m.meta) {
                doc.font("Helvetica").fillColor("#64748b");
                doc.text(`  •  ${m.meta}`);
              }
              rightY = doc.y + 2;
            });
          }

          // Speakers
          if (speakersList.length > 0) {
            speakersList.forEach(s => {
              doc.fontSize(8).font("Helvetica-Bold").fillColor("#2563eb");
              doc.text("Speaker: ", mainColX, rightY, { continued: true });
              doc.font("Helvetica-Bold").fillColor("#0f172a");
              doc.text(s.name, { continued: Boolean(s.meta) });
              if (s.meta) {
                doc.font("Helvetica").fillColor("#64748b");
                doc.text(`  •  ${s.meta}`);
              }
              rightY = doc.y + 2;
            });
          }

          // Compute max consumed Y between left time box and right column
          const itemHeight = Math.max(rightY - sessionStartY, 44);
          currentY = sessionStartY + itemHeight + 10;

          // Subtle hairline separator between sessions
          doc.rect(marginX, currentY - 5, contentWidth, 0.5).fill("#f1f5f9");
        }
      }

      // ─── SECOND PASS: NUMBER OF PAGES & FOOTERS ───
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        const footerY = pageHeight - marginBottom + 10;

        // Thin top footer border
        doc.rect(marginX, footerY, contentWidth, 0.5).fill("#e2e8f0");

        // Footer Brand & Metadata
        doc.fontSize(7).font("Helvetica").fillColor("#94a3b8");
        const printDate = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
        doc.text(`Generated via Eventzone • ${printDate}`, marginX, footerY + 8);

        // Page Number
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b");
        doc.text(`Page ${i + 1} of ${totalPages}`, marginX, footerY + 8, {
          width: contentWidth,
          align: "right"
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
