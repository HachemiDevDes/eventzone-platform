import PDFDocument from "pdfkit";
import { formatCurrency, calculateFiscalStamp, formatInvoicingDate } from "./invoicingConstants.js";
import { numberToAlgerianWords } from "./numberToWords.js";

/**
 * Generates an official, publication-ready A4 PDF Buffer for an Invoice or Quote
 * Compliant with Algerian business formatting and the Eventzone design system.
 */
export async function generateInvoicePdfBuffer(invoice = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `${invoice.document_type?.toUpperCase() || "DOCUMENT"} ${invoice.document_number || ""}`,
          Author: invoice.emitter_company_name || "Eventzone",
          Subject: "Official Invoice / Quote",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      // 1. Header Section (Clean top without decorative bar, matching reference design)
      // Left: Brand Logo / Company Name
      const brandName = (invoice.emitter_company_name || "eventzone").toLowerCase();
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#0b5cdb")
        .text(brandName.includes("eventzone") ? "eventzone" : invoice.emitter_company_name || "eventzone", margin, currentY);

      // Right: Document Title & Number
      const docTypeUpper = invoice.document_type === "devis" 
        ? "DEVIS" 
        : (invoice.document_type === "proforma" ? "FACTURE PROFORMA" : "FACTURE");
      const rightX = pageWidth - margin - 220;

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#0f172a")
        .text(docTypeUpper, rightX, currentY, { width: 220, align: "right" });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#475569")
        .text(invoice.document_number || "EZ-26-0001", rightX, currentY + 24, { width: 220, align: "right" });

      currentY += 52;

      // 2. Metadata Pill Box (Date d'émission, Échéance, Référence)
      const pillBoxHeight = 38;
      doc
        .roundedRect(margin, currentY, contentWidth, pillBoxHeight, 8)
        .fillAndStroke("#f8fafc", "#e2e8f0");

      const col1W = contentWidth / 3;
      const pillTextY = currentY + 8;

      // Date d'émission
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#94a3b8").text("DATE D'ÉMISSION", margin + 16, pillTextY);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(formatInvoicingDate(invoice.issue_date), margin + 16, pillTextY + 12);

      // Échéance
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#94a3b8").text("ÉCHÉANCE", margin + col1W + 16, pillTextY);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(formatInvoicingDate(invoice.due_date), margin + col1W + 16, pillTextY + 12);

      // Référence
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#94a3b8").text("RÉFÉRENCE", margin + col1W * 2 + 16, pillTextY);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(invoice.document_number || "—", margin + col1W * 2 + 16, pillTextY + 12);

      currentY += pillBoxHeight + 22;

      // 3. Two Columns: Émetteur (Left) & Destinataire (Right)
      const colWidth = (contentWidth - 20) / 2;

      // Column 1: Émetteur
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#94a3b8").text("ÉMETTEUR", margin, currentY);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(invoice.emitter_company_name || "SPASU Eventzone", margin, currentY + 14);

      let emitY = currentY + 28;
      if (invoice.emitter_manager_name) {
        doc.font("Helvetica").fontSize(9).fillColor("#475569").text(invoice.emitter_manager_name, margin, emitY);
        emitY += 12;
      }
      if (invoice.emitter_address) {
        doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(invoice.emitter_address, margin, emitY, { width: colWidth });
        emitY += 22;
      }
      if (invoice.emitter_phone) {
        doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`Tél: ${invoice.emitter_phone}`, margin, emitY);
        emitY += 12;
      }
      if (invoice.emitter_email) {
        doc.font("Helvetica").fontSize(8).fillColor("#475569").text(invoice.emitter_email, margin, emitY);
        emitY += 12;
      }

      // Column 2: Destinataire (Client)
      const clientX = margin + colWidth + 20;
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#94a3b8").text("DESTINATAIRE", clientX, currentY);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(invoice.client_name || "—", clientX, currentY + 14);

      let clientY = currentY + 28;
      if (invoice.client_name) {
        if (invoice.client_contact_name) {
          doc.font("Helvetica").fontSize(9).fillColor("#475569").text(invoice.client_contact_name, clientX, clientY);
          clientY += 12;
        }
        if (invoice.client_address) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(invoice.client_address, clientX, clientY, { width: colWidth });
          clientY += 22;
        }
        if (invoice.client_phone) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`Tél: ${invoice.client_phone}`, clientX, clientY);
          clientY += 12;
        }
        if (invoice.client_email) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(invoice.client_email, clientX, clientY);
          clientY += 12;
        }
        if (invoice.client_nif) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`NIF: ${invoice.client_nif}`, clientX, clientY);
          clientY += 12;
        }
        if (invoice.client_rc) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`RC: ${invoice.client_rc}`, clientX, clientY);
          clientY += 12;
        }
      } else {
        clientY += 14;
      }

      currentY = Math.max(emitY, clientY) + 20;

      // 5. Line Items Table
      // Table Header (Dark slate background like reference screenshot)
      const tableHeaderHeight = 22;
      doc.rect(margin, currentY, contentWidth, tableHeaderHeight).fill("#0f172a");

      const colDescX = margin + 10;
      const colQtyX = margin + contentWidth - 230;
      const colPriceX = margin + contentWidth - 160;
      const colTotalX = margin + contentWidth - 85;

      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
      doc.text("DÉSIGNATION", colDescX, currentY + 6);
      doc.text("QTÉ", colQtyX, currentY + 6, { width: 50, align: "center" });
      doc.text("PRIX UNITAIRE HT", colPriceX, currentY + 6, { width: 70, align: "right" });
      doc.text("MONTANT HT", colTotalX, currentY + 6, { width: 75, align: "right" });

      currentY += tableHeaderHeight;

      // Table Rows
      const lineItems = Array.isArray(invoice.line_items) && invoice.line_items.length > 0
        ? invoice.line_items
        : [{ description: "Prestation de service", quantity: 1, unit_price: 0, total_ht: 0 }];

      lineItems.forEach((item, index) => {
        const rowHeight = 26;
        const isEven = index % 2 === 1;

        if (isEven) {
          doc.rect(margin, currentY, contentWidth, rowHeight).fill("#f8fafc");
        }

        // Bottom border
        doc.moveTo(margin, currentY + rowHeight).lineTo(pageWidth - margin, currentY + rowHeight).strokeColor("#f1f5f9").lineWidth(0.5).stroke();

        const itemQty = Number(item.quantity) || 1;
        const itemPrice = Number(item.unit_price) || 0;
        const itemTotal = Number(item.total_ht) !== undefined ? Number(item.total_ht) : itemQty * itemPrice;

        doc.font("Helvetica").fontSize(8.5).fillColor("#1e293b");
        doc.text(item.description || "—", colDescX, currentY + 7, { width: colQtyX - colDescX - 10 });

        doc.font("Helvetica").fontSize(8.5).fillColor("#475569");
        doc.text(String(itemQty), colQtyX, currentY + 7, { width: 50, align: "center" });

        doc.text(formatCurrency(itemPrice, invoice.currency), colPriceX, currentY + 7, { width: 70, align: "right" });

        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0f172a");
        doc.text(formatCurrency(itemTotal, invoice.currency), colTotalX, currentY + 7, { width: 75, align: "right" });

        currentY += rowHeight;
      });

      currentY += 15;

      // 6. Totals Summary Block (Right Aligned)
      const summaryWidth = 220;
      const summaryX = pageWidth - margin - summaryWidth;

      const subtotalHt = Number(invoice.subtotal_ht) || 0;
      const discountAmount = Number(invoice.discount_amount) || 0;
      const tvaRate = Number(invoice.tva_rate) || 19;
      const tvaAmount = Number(invoice.tva_amount) || 0;
      const fiscalStampAmount = invoice.has_fiscal_stamp ? (Number(invoice.fiscal_stamp_amount) || calculateFiscalStamp(subtotalHt)) : 0;
      const totalTtc = Number(invoice.total_ttc) || (subtotalHt - discountAmount + tvaAmount + fiscalStampAmount);

      const renderTotalRow = (label, valStr, isBold = false, isHighlight = false) => {
        if (isHighlight) {
          doc.rect(summaryX - 5, currentY - 2, summaryWidth + 5, 20).fill("#f1f5f9");
        }
        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 9.5 : 8.5).fillColor(isBold ? "#0f172a" : "#475569").text(label, summaryX, currentY);
        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 10 : 8.5).fillColor(isBold ? "#0f172a" : "#1e293b").text(valStr, summaryX, currentY, { width: summaryWidth, align: "right" });
        currentY += 16;
      };

      renderTotalRow("Montant HT", formatCurrency(subtotalHt, invoice.currency));
      if (discountAmount > 0) {
        renderTotalRow("Remise", `-${formatCurrency(discountAmount, invoice.currency)}`);
      }
      renderTotalRow(`TVA (${tvaRate}%)`, formatCurrency(tvaAmount, invoice.currency));
      if (fiscalStampAmount > 0) {
        renderTotalRow("Droit de timbre", formatCurrency(fiscalStampAmount, invoice.currency));
      }

      currentY += 4;
      renderTotalRow("Total TTC", formatCurrency(totalTtc, invoice.currency), true, true);

      currentY += 20;

      // 7. Highlight Container: Arrêté à la somme de (Amount in words)
      const wordsBoxHeight = 32;
      doc
        .roundedRect(margin, currentY, contentWidth, wordsBoxHeight, 6)
        .fillAndStroke("#f0f7ff", "#bfdbfe");

      const spelledOut = invoice.amount_words || numberToAlgerianWords(totalTtc, invoice.currency);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#1e40af").text("ARRÊTÉ À LA SOMME DE", margin + 12, currentY + 6);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0f172a").text(spelledOut, margin + 12, currentY + 16, { width: contentWidth - 24 });

      currentY += wordsBoxHeight + 15;

      // 8. Bank Details Box (If provided in profile/invoice)
      const bankDetails = invoice.emitter_bank_details || {};
      if (bankDetails.rib || bankDetails.account_number || bankDetails.bank_name) {
        const bankBoxHeight = 36;
        doc
          .roundedRect(margin, currentY, contentWidth, bankBoxHeight, 6)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#64748b").text("COORDONNÉES BANCAIRES POUR VIREMENT", margin + 12, currentY + 6);
        const bankStr = [
          bankDetails.bank_name ? `Banque: ${bankDetails.bank_name}` : "",
          bankDetails.rib ? `RIB: ${bankDetails.rib}` : "",
          bankDetails.account_number ? `Compte: ${bankDetails.account_number}` : "",
          bankDetails.account_holder ? `Titulaire: ${bankDetails.account_holder}` : "",
        ].filter(Boolean).join("  |  ");

        doc.font("Helvetica").fontSize(8).fillColor("#1e293b").text(bankStr, margin + 12, currentY + 18);
        currentY += bankBoxHeight + 15;
      }

      // 9. Notes / Payment Conditions
      if (invoice.notes) {
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#94a3b8").text("CONDITIONS ET NOTES DE PAIEMENT", margin, currentY);
        doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(invoice.notes, margin, currentY + 10, { width: contentWidth });
        currentY += 28;
      }

      // 10. Legal Fiscal Footer at bottom of A4 page
      const footerY = 841.89 - margin - 22; // A4 height = 841.89 pt
      doc.moveTo(margin, footerY - 8).lineTo(pageWidth - margin, footerY - 8).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

      const emitterName = invoice.emitter_company_name || "SPASU Eventzone";
      const fiscalParts = [
        emitterName,
        invoice.emitter_nif ? `NIF: ${invoice.emitter_nif}` : "",
        invoice.emitter_nis ? `NIS: ${invoice.emitter_nis}` : "",
        invoice.emitter_rc ? `RC: ${invoice.emitter_rc}` : "",
        invoice.emitter_article_imposition ? `Art. Imp.: ${invoice.emitter_article_imposition}` : "",
      ].filter(Boolean).join("  •  ");

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#94a3b8")
        .text(fiscalParts, margin, footerY, { width: contentWidth, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
