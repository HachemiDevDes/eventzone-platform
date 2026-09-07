import PDFDocument from "pdfkit";

/**
 * Generates an official, executive-ready Landscape A4 PDF attendee roster
 * Layout: Strict Horizontal / Landscape (841.89 x 595.28 pt)
 * Features:
 * - Brand header with Eventzone styling, event title, date, generation timestamp
 * - Alternating zebra rows (#f8fafc / #ffffff)
 * - Auto-wrapped and truncated cells
 * - Multi-page pagination with repeating table headers and page numbers
 */
export async function generateAttendeesPdfBuffer({
  eventDetails = null,
  attendees = [],
  filterLabel = "All Attendees",
}) {
  return new Promise((resolve, reject) => {
    try {
      const pageWidth = 841.89;
      const pageHeight = 595.28;
      const marginX = 36;
      const marginTop = 36;
      const marginBottom = 36;
      const contentWidth = pageWidth - marginX * 2; // 769.89 pt

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Attendee Roster - ${eventDetails?.title || "Event"}`,
          Author: "Eventzone Platform",
          Subject: `Attendee Roster for ${eventDetails?.title || "Event"}`,
          Keywords: "Eventzone, Attendees, Roster, Guest List, Badges",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Column widths definition (sum = 769 pt)
      const columns = [
        { key: "index", label: "#", width: 28, align: "center" },
        { key: "name", label: "Full Name", width: 135, align: "left" },
        { key: "email", label: "Email Address", width: 155, align: "left" },
        { key: "phone", label: "Phone", width: 85, align: "left" },
        { key: "company", label: "Company / Org", width: 120, align: "left" },
        { key: "jobTitle", label: "Job Title", width: 103, align: "left" },
        { key: "ticket", label: "Ticket / Role", width: 93, align: "left" },
        { key: "status", label: "Status", width: 50, align: "center" },
      ];

      const headerHeight = 22;
      const rowHeight = 18;
      const startTableY = 104;
      const maxY = pageHeight - marginBottom - 24;

      let currentY = startTableY;

      const drawPageHeader = (isFirstPage = false) => {
        // Top accent bar
        doc.rect(0, 0, pageWidth, 4).fill("#2563eb");

        if (isFirstPage) {
          // Event Title & Brand Header
          doc.fontSize(16).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(eventDetails?.title || "Event Attendee Roster", marginX, marginTop);

          // Subtitle / Scope
          doc.fontSize(8.5).font("Helvetica").fillColor("#64748b");
          const dateStr = eventDetails?.startDate || new Date().toISOString().slice(0, 10);
          const locStr = eventDetails?.location ? ` • ${eventDetails.location}` : "";
          const subtitle = `Filter: ${filterLabel} • Total: ${attendees.length} participant${attendees.length === 1 ? "" : "s"} • Event Date: ${dateStr}${locStr}`;
          doc.text(subtitle, marginX, marginTop + 20);

          // Right side metadata: Eventzone watermark & generated timestamp
          const genDate = new Date().toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#2563eb");
          doc.text("Eventzone", marginX, marginTop, { width: contentWidth, align: "right" });
          doc.fontSize(7.5).font("Helvetica").fillColor("#94a3b8");
          doc.text(`Generated: ${genDate}`, marginX, marginTop + 14, { width: contentWidth, align: "right" });
        } else {
          // Compact header for subsequent pages
          doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(`${eventDetails?.title || "Event Roster"} — ${filterLabel}`, marginX, marginTop);

          doc.fontSize(8).font("Helvetica").fillColor("#2563eb");
          doc.text("Eventzone", marginX, marginTop, { width: contentWidth, align: "right" });
        }

        // Draw Table Header Bar
        const tableHeaderY = isFirstPage ? startTableY : marginTop + 18;
        doc.rect(marginX, tableHeaderY, contentWidth, headerHeight).fill("#0f172a");

        let curX = marginX;
        columns.forEach((col) => {
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#ffffff");
          const textX = curX + (col.align === "center" ? 0 : 4);
          doc.text(col.label, textX, tableHeaderY + 6, {
            width: col.width - 8,
            align: col.align,
            ellipsis: true,
          });
          curX += col.width;
        });

        currentY = tableHeaderY + headerHeight;
      };

      // Draw first page header
      drawPageHeader(true);

      // Render attendee rows
      attendees.forEach((a, idx) => {
        // Page break if needed
        if (currentY + rowHeight > maxY) {
          doc.addPage({ size: "A4", layout: "landscape", margin: 0 });
          drawPageHeader(false);
        }

        // Alternating row background
        const isZebra = idx % 2 === 1;
        doc.rect(marginX, currentY, contentWidth, rowHeight).fill(isZebra ? "#f8fafc" : "#ffffff");

        // Row bottom border
        doc.rect(marginX, currentY + rowHeight - 0.5, contentWidth, 0.5).fill("#e2e8f0");

        const nameParts = (a.name || "").trim().split(" ");
        const firstName = a.firstName || a.first_name || nameParts[0] || "";
        const lastName = a.lastName || a.last_name || nameParts.slice(1).join(" ") || "";
        const fullName = a.name || `${firstName} ${lastName}`.trim() || "Attendee";
        const email = a.email || "—";
        const ans = a.answers || a.customAnswers || a.formAnswers || {};
        const phone = a.phone || ans.phone || ans.f_core_phone || "—";
        const company = a.company || ans.company || ans.f_company || "—";
        const jobTitle = a.jobTitle || a.job_title || ans.jobTitle || ans.f_job_title || "—";
        const ticket = a.ticketType || a.ticket_type || (a.isSpeaker ? "Speaker" : "Standard");
        const isChecked = Boolean(a.checkedIn || a.status === "checked_in" || a.checked_in);
        const status = a.isArchived ? "Archived" : (isChecked ? "Checked In" : "Registered");

        const rowValues = {
          index: String(idx + 1),
          name: fullName,
          email: email,
          phone: phone,
          company: company,
          jobTitle: jobTitle,
          ticket: ticket,
          status: status,
        };

        let curX = marginX;
        columns.forEach((col) => {
          const val = rowValues[col.key] || "—";
          const isStatus = col.key === "status";
          const isIndex = col.key === "index";

          // Text styling per column
          if (isStatus) {
            doc.fontSize(6.5).font("Helvetica-Bold");
            if (status === "Checked In") {
              doc.fillColor("#15803d"); // green
            } else if (status === "Archived") {
              doc.fillColor("#94a3b8"); // slate
            } else {
              doc.fillColor("#0369a1"); // blue
            }
          } else if (isIndex) {
            doc.fontSize(7).font("Helvetica").fillColor("#94a3b8");
          } else if (col.key === "name") {
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#0f172a");
          } else {
            doc.fontSize(7).font("Helvetica").fillColor("#475569");
          }

          const textX = curX + (col.align === "center" ? 0 : 4);
          doc.text(val, textX, currentY + 5, {
            width: col.width - 8,
            align: col.align,
            ellipsis: true,
          });

          curX += col.width;
        });

        currentY += rowHeight;
      });

      // Global page numbering in footer
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7.5).font("Helvetica").fillColor("#94a3b8");
        const footerY = pageHeight - marginBottom + 8;
        doc.text("Eventzone Platform • Confidential Event Roster", marginX, footerY, {
          width: contentWidth / 2,
          align: "left",
        });
        doc.text(`Page ${i + 1} of ${range.count}`, marginX + contentWidth / 2, footerY, {
          width: contentWidth / 2,
          align: "right",
        });
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
