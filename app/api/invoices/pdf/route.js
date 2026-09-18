import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer } from "@/lib/invoicingPdfServer";

/**
 * POST /api/invoices/pdf
 * Accepts invoice document JSON and streams back an A4 PDF attachment directly.
 * Allows downloading official A4 invoices whether they are saved in database or edited in real-time.
 */
export async function POST(request) {
  try {
    const invoice = await request.json();
    if (!invoice) {
      return new NextResponse("Invoice data is required", { status: 400 });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(invoice);
    const docType = (invoice.document_type || "document").toLowerCase();
    const docNum = (invoice.document_number || "EZ").replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${docType}_${docNum}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    console.error("Generate Invoice PDF Error:", err);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
