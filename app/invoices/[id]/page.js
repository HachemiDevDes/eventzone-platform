import React from "react";
import { supabase } from "@/lib/supabase";
import InvoicingDocumentPreview from "@/components/InvoicingDocumentPreview";
import { Download, Printer, ShieldCheck, Copy } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const { id } = await params;
  let { data: invoice } = await supabase
    .from("invoices")
    .select("document_type, document_number, client_name, emitter_company_name")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    const { data: byToken } = await supabase
      .from("invoices")
      .select("document_type, document_number, client_name, emitter_company_name")
      .eq("share_token", id)
      .maybeSingle();
    invoice = byToken;
  }

  const docTitle = invoice?.document_type === "devis"
    ? "Devis"
    : invoice?.document_type === "proforma"
    ? "Facture Proforma"
    : "Facture";

  return {
    title: invoice ? `${docTitle} ${invoice.document_number} — Eventzone` : "Document de facturation — Eventzone",
    description: `Consultez votre ${docTitle.toLowerCase()} officielle émise sur la plateforme Eventzone.`,
  };
}

export default async function PublicInvoicePage({ params }) {
  const { id } = await params;

  let { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    const { data: byToken } = await supabase
      .from("invoices")
      .select("*")
      .eq("share_token", id)
      .maybeSingle();
    invoice = byToken;
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-md">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-3">
            !
          </div>
          <h1 className="text-lg font-black text-slate-900">Document introuvable</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ce document n&apos;existe pas ou le lien de partage a expiré.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Retourner à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const pdfUrl = `/api/invoices/${invoice.id}/pdf`;

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Floating Action Bar */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 font-black text-lg tracking-tight lowercase">
              eventzone
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">
              Document officiel pour <strong className="text-slate-900">{invoice.client_name || "Client"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={pdfUrl}
              download={`${invoice.document_type || "document"}_${invoice.document_number || "EZ"}.pdf`}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 active:scale-95"
            >
              <Download size={14} />
              <span>Télécharger PDF</span>
            </a>
          </div>
        </div>

        {/* The Printable A4 Preview */}
        <div className="overflow-hidden">
          <InvoicingDocumentPreview document={invoice} />
        </div>
      </div>
    </div>
  );
}
