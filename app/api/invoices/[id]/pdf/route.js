import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer } from "@/lib/invoicingPdfServer";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("Document ID is required", { status: 400 });
    }

    // Try finding by ID first, then by share_token
    let { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!invoice && !error) {
      const { data: byToken, error: tokenErr } = await supabase
        .from("invoices")
        .select("*")
        .eq("share_token", id)
        .maybeSingle();
      invoice = byToken;
      error = tokenErr;
    }

    if (error || !invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Generate PDF Buffer
    const pdfBuffer = await generateInvoicePdfBuffer(invoice);

    const filename = `${invoice.document_type || "document"}_${invoice.document_number || "EZ"}.pdf`;

    const searchParams = request.nextUrl ? request.nextUrl.searchParams : new URL(request.url).searchParams;
    const isInline = searchParams.get("view") === "inline";
    const disposition = isInline ? "inline" : "attachment";

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Invoice PDF Route Error:", err);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
