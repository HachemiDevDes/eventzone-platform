import PDFDocument from "pdfkit";

/**
 * Generates a clean, professional, official A4 payment receipt PDF Buffer
 */
export async function generateReceiptPdfBuffer({
  receiptNumber = "REC-000000",
  paymentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
  customerName = "Valued Attendee",
  customerEmail = "",
  customerPhone = "",
  eventName = "Eventzone Event",
  eventDate = "",
  eventLocation = "",
  organizerName = "Eventzone",
  ticketTier = "Standard Admission",
  quantity = 1,
  unitPrice = 0,
  amount = 0,
  currency = "DZD",
  paymentMethod = "EDAHABIA / CIB (Chargily Pay)",
  transactionId = "",
  badgeCode = "",
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 45,
        info: {
          Title: `Receipt ${receiptNumber} - Eventzone`,
          Author: "Eventzone Platform",
          Subject: "Official Payment Receipt",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 595.28;
      const margin = 45;
      const contentWidth = pageWidth - margin * 2;

      // Top decorative brand bar
      doc.rect(margin, margin, contentWidth, 4).fill("#059669");

      // Header Section
      let currentY = margin + 25;

      // Brand Logo / Title
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor("#0f172a")
        .text("eventzone", margin, currentY, { continued: true });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#64748b")
        .text(".pro", { continued: false });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text("Official Payment Receipt / Reçu de Paiement", margin, currentY + 28);

      // Receipt Badge & Meta (Right Aligned)
      const rightX = pageWidth - margin - 180;
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#0f172a")
        .text("RECEIPT", rightX, currentY, { width: 180, align: "right" });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#059669")
        .text(receiptNumber, rightX, currentY + 24, { width: 180, align: "right" });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text(`Date: ${paymentDate}`, rightX, currentY + 38, { width: 180, align: "right" });

      // Status Pill: PAID
      const pillWidth = 54;
      const pillHeight = 18;
      const pillX = pageWidth - margin - pillWidth;
      const pillY = currentY + 54;
      doc
        .roundedRect(pillX, pillY, pillWidth, pillHeight, 4)
        .fillAndStroke("#ecfdf5", "#a7f3d0");
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#047857")
        .text("PAID", pillX, pillY + 4, { width: pillWidth, align: "center" });

      // Divider
      currentY = margin + 95;
      doc
        .moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke();

      // Two Column Billing & Transaction Details
      currentY += 20;
      const colWidth = (contentWidth - 20) / 2;

      // Col 1: Billed To
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#94a3b8")
        .text("BILLED TO", margin, currentY);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#0f172a")
        .text(customerName || "Valued Attendee", margin, currentY + 16);

      let customerMetaY = currentY + 32;
      if (customerEmail) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(customerEmail, margin, customerMetaY);
        customerMetaY += 14;
      }
      if (customerPhone) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(customerPhone, margin, customerMetaY);
        customerMetaY += 14;
      }

      // Col 2: Payment Details
      const col2X = margin + colWidth + 20;
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#94a3b8")
        .text("PAYMENT DETAILS", col2X, currentY);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text("Payment Method:", col2X, currentY + 16);
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(paymentMethod, col2X + 85, currentY + 16);

      if (transactionId) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#64748b")
          .text("Reference ID:", col2X, currentY + 30);
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#0f172a")
          .text(transactionId, col2X + 85, currentY + 31);
      }

      if (badgeCode) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#64748b")
          .text("Pass Code:", col2X, currentY + 44);
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#059669")
          .text(badgeCode, col2X + 85, currentY + 44);
      }

      // Event Summary Box
      currentY = Math.max(customerMetaY, currentY + 65) + 15;
      const boxHeight = 56;
      doc
        .roundedRect(margin, currentY, contentWidth, boxHeight, 8)
        .fillAndStroke("#f8fafc", "#e2e8f0");

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#64748b")
        .text("EVENT DETAILS", margin + 14, currentY + 10);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0f172a")
        .text(eventName, margin + 14, currentY + 23);

      const eventMetaText = [eventDate, eventLocation].filter(Boolean).join("  •  ");
      if (eventMetaText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(eventMetaText, margin + 14, currentY + 38, { width: contentWidth - 28, ellipsis: true });
      }

      // Items Table
      currentY += boxHeight + 25;

      // Table Header
      const tableHeaderHeight = 24;
      doc
        .rect(margin, currentY, contentWidth, tableHeaderHeight)
        .fill("#0f172a");

      const colDescWidth = 230;
      const colTierWidth = 115;
      const colQtyWidth = 40;
      const colTotalWidth = 120;

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#ffffff")
        .text("DESCRIPTION", margin + 12, currentY + 7);

      doc
        .text("TIER", margin + colDescWidth, currentY + 7);

      doc
        .text("QTY", margin + colDescWidth + colTierWidth, currentY + 7, { width: colQtyWidth, align: "center" });

      doc
        .text("AMOUNT", margin + colDescWidth + colTierWidth + colQtyWidth, currentY + 7, {
          width: colTotalWidth - 12,
          align: "right",
        });

      // Table Row
      currentY += tableHeaderHeight;
      const rowHeight = 36;
      doc
        .rect(margin, currentY, contentWidth, rowHeight)
        .fillAndStroke("#ffffff", "#f1f5f9");

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#0f172a")
        .text(eventName, margin + 12, currentY + 10, { width: colDescWidth - 20, ellipsis: true });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text("Admission Pass", margin + 12, currentY + 22);

      // Tier
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#059669")
        .text(ticketTier, margin + colDescWidth, currentY + 12, { width: colTierWidth - 10, ellipsis: true });

      // Qty
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(String(quantity || 1), margin + colDescWidth + colTierWidth, currentY + 12, {
          width: colQtyWidth,
          align: "center",
        });

      // Amount
      const formattedAmount = `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#0f172a")
        .text(formattedAmount, margin + colDescWidth + colTierWidth + colQtyWidth, currentY + 12, {
          width: colTotalWidth - 12,
          align: "right",
        });

      // Total Breakdown Section
      currentY += rowHeight + 15;
      const totalsWidth = 220;
      const totalsX = pageWidth - margin - totalsWidth;

      // Subtotal
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text("Subtotal:", totalsX, currentY);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(formattedAmount, totalsX, currentY, { width: totalsWidth, align: "right" });

      currentY += 16;
      // Processing Fee
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text("Platform / Processing Fee:", totalsX, currentY);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(`0.00 ${currency}`, totalsX, currentY, { width: totalsWidth, align: "right" });

      currentY += 16;
      // Divider line
      doc
        .moveTo(totalsX, currentY)
        .lineTo(pageWidth - margin, currentY)
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke();

      currentY += 8;
      // Total Paid
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0f172a")
        .text("Total Paid:", totalsX, currentY);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#059669")
        .text(formattedAmount, totalsX, currentY, { width: totalsWidth, align: "right" });

      // Security / Verification Footer
      const footerY = 730;
      doc
        .roundedRect(margin, footerY, contentWidth, 54, 6)
        .fillAndStroke("#f8fafc", "#e2e8f0");

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#0f172a")
        .text("Important Entry & Verification Notice", margin + 14, footerY + 10);

      doc
        .font("Helvetica")
        .fontSize(7.8)
        .fillColor("#64748b")
        .text(
          "This receipt serves as official proof of payment. Please have your badge or entry pass ready upon arrival. All ticket sales are processed securely via Chargily Pay.",
          margin + 14,
          footerY + 24,
          { width: contentWidth - 28 }
        );

      // Copyright & Brand footer
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#94a3b8")
        .text(
          `Eventzone • Event Management & Ticketing Platform • Generated automatically on ${new Date().toISOString()}`,
          margin,
          800,
          { width: contentWidth, align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
