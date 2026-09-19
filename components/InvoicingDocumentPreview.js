/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCurrency, calculateFiscalStamp, formatInvoicingDate } from "../lib/invoicingConstants";
import { numberToAlgerianWords } from "../lib/numberToWords";

/**
 * InvoicingDocumentSheet
 * Core presentation of the A4 invoice document.
 * Used for both live on-screen preview and clean multi-page print output.
 */
function InvoicingDocumentSheet({
  document = {},
  isPrintMode = false,
  className = "",
  id,
}) {
  const {
    document_type = "facture",
    document_number = "EZ-26-0001",
    issue_date = new Date().toISOString().split("T")[0],
    due_date = "",
    currency = "DZD",
    logo_url = "",
    
    // Issuer
    emitter_company_name = "SPASU Eventzone",
    emitter_manager_name = "Hachemi Mohamed",
    emitter_address = "Lotissement Pons N° 80, 2ème étage, Bureau N° 16, Commune de Kouba, Wilaya d'Alger",
    emitter_phone = "0781457511",
    emitter_email = "contact@eventzone.pro",
    emitter_nif = "002616124370413",
    emitter_nis = "002616124370413",
    emitter_rc = "26B1243704-00/16",
    emitter_article_imposition = "1618480001",
    emitter_bank_details = {},

    // Client
    client_name = "",
    client_contact_name = "",
    client_address = "",
    client_phone = "",
    client_email = "",
    client_nif = "",
    client_rc = "",
    client_nis = "",
    client_article_imposition = "",

    // Line items
    line_items = [],

    // Taxes & Totals
    subtotal_ht = 0,
    discount_amount = 0,
    tva_rate = 19,
    tva_amount = 0,
    has_fiscal_stamp = false,
    fiscal_stamp_amount = 0,
    total_ttc = 0,
    amount_words = "",

    // Options
    show_signature_stamp = false,
    signature_stamp_url = "",
    notes = "Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu.",
  } = document;

  // Format document title
  const docTitle = document_type === "devis"
    ? "DEVIS"
    : document_type === "proforma"
    ? "FACTURE PROFORMA"
    : "FACTURE";

  // Calculate totals if needed
  const effectiveSubtotal = Number(subtotal_ht) || 0;
  const effectiveDiscount = Number(discount_amount) || 0;
  const effectiveTva = Number(tva_amount) || 0;
  const effectiveStamp = has_fiscal_stamp ? (Number(fiscal_stamp_amount) || calculateFiscalStamp(effectiveSubtotal)) : 0;
  const effectiveTotalTtc = Number(total_ttc) || (effectiveSubtotal - effectiveDiscount + effectiveTva + effectiveStamp);
  const effectiveWords = amount_words || numberToAlgerianWords(effectiveTotalTtc, currency);

  const bank = emitter_bank_details || {};

  return (
    <div 
      className={
        isPrintMode
          ? `bg-white text-slate-900 mx-auto font-sans w-full max-w-none min-h-0 h-auto block p-0 m-0 border-none shadow-none select-text ${className}`
          : `bg-white text-slate-900 mx-auto transition-all shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] rounded-xs sm:rounded-sm border border-slate-200/90 p-8 sm:p-12 md:p-14 font-sans w-full max-w-[794px] min-h-[1123px] flex flex-col justify-between select-text ${className}`
      }
      id={id}
      style={{
        boxSizing: 'border-box',
      }}
    >
      <div className={`space-y-6 ${isPrintMode ? 'block' : ''}`}>
        {/* 1. Header: Logo (Left) & Document Title / Ref (Right) */}
        <div className="flex items-start justify-between gap-4 pb-1 invoice-header-block print-avoid-break">
          <div>
            {logo_url ? (
              <img 
                src={logo_url} 
                alt="Logo" 
                className="h-9 sm:h-10 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <img 
                src="https://i.imgur.com/jFDrQbM.png" 
                alt="eventzone" 
                style={{ height: '32px', width: 'auto', maxWidth: '170px' }} 
                className="h-8 sm:h-9 w-auto object-contain"
              />
            )}
          </div>

          <div className="text-right">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
              {docTitle}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600 font-mono mt-1">
              {document_number || "EZ-26-0001"}
            </p>
          </div>
        </div>

        {/* 2. Metadata Pill Container (Date d'émission, Échéance, Référence) */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50/50 border border-slate-200/90 rounded-2xl px-6 py-3.5 invoice-meta-block print-avoid-break">
          <div>
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              DATE D&apos;ÉMISSION
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-1 block">
              {formatInvoicingDate(issue_date)}
            </span>
          </div>
          <div>
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              ÉCHÉANCE
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-1 block">
              {formatInvoicingDate(due_date)}
            </span>
          </div>
          <div>
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              RÉFÉRENCE
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-1 block truncate">
              {document_number || "—"}
            </span>
          </div>
        </div>

        {/* 3. Two Columns: Émetteur vs Destinataire */}
        <div className="grid grid-cols-2 gap-8 pt-2 invoice-parties-block print-avoid-break">
          {/* Émetteur */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              ÉMETTEUR
            </span>
            <p className="font-black text-sm text-slate-900 leading-tight">
              {emitter_company_name || "SPASU Eventzone"}
            </p>
            {emitter_manager_name && (
              <p className="text-slate-600 text-xs font-medium">{emitter_manager_name}</p>
            )}
            {emitter_address && (
              <p className="text-slate-500 whitespace-pre-line text-[11px] leading-relaxed">
                {emitter_address}
              </p>
            )}
            <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
              {emitter_phone && <p>Tél: <span className="font-mono text-slate-700">{emitter_phone}</span></p>}
              {emitter_email && <p className="text-slate-600 font-medium">{emitter_email}</p>}
            </div>
          </div>

          {/* Destinataire */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              DESTINATAIRE
            </span>
            {client_name ? (
              <>
                <p className="font-black text-sm text-slate-900 leading-tight">
                  {client_name}
                </p>
                {client_contact_name && (
                  <p className="text-slate-600 text-xs font-medium">{client_contact_name}</p>
                )}
                {client_address && (
                  <p className="text-slate-500 whitespace-pre-line text-[11px] leading-relaxed">
                    {client_address}
                  </p>
                )}
                <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
                  {client_phone && <p>Tél: <span className="font-mono text-slate-700">{client_phone}</span></p>}
                  {client_email && <p className="text-slate-600">{client_email}</p>}
                  {client_nif && <p>NIF: <span className="font-mono text-slate-700">{client_nif}</span></p>}
                  {client_rc && <p>RC: <span className="font-mono text-slate-700">{client_rc}</span></p>}
                  {client_nis && <p>NIS: <span className="font-mono text-slate-700">{client_nis}</span></p>}
                  {client_article_imposition && <p>Art. d&apos;Imp: <span className="font-mono text-slate-700">{client_article_imposition}</span></p>}
                </div>
              </>
            ) : (
              <p className="text-slate-900 font-black text-sm">—</p>
            )}
          </div>
        </div>

        {/* 4. Table: Désignation, Qté, Prix Unitaire HT, Montant HT */}
        <div className="pt-2 invoice-table-block">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-wider">
                <tr className="print-avoid-break">
                  <th scope="col" className="px-4 py-2.5 font-black">DÉSIGNATION</th>
                  <th scope="col" className="px-3 py-2.5 text-center font-black w-16">QTÉ</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-black w-28">PRIX UNITAIRE HT</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-black w-28">MONTANT HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.isArray(line_items) && line_items.length > 0 ? (
                  line_items.map((item, idx) => {
                    const q = Number(item.quantity) || 1;
                    const p = Number(item.unit_price) || 0;
                    const tot = Number(item.total_ht) !== undefined ? Number(item.total_ht) : q * p;
                    return (
                      <tr 
                        key={item.id || idx} 
                        className={`${idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"} invoice-table-row print-avoid-break`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-pre-line">
                          {item.description || "—"}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 font-mono">
                          {q}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600 font-mono">
                          {formatCurrency(p, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(tot, currency)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="print-avoid-break">
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                      Aucune ligne d&apos;article ajoutée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Totals Block */}
        <div className="flex justify-end pt-2 invoice-totals-block print-avoid-break">
          <div className="w-full sm:w-72 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Montant HT</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(effectiveSubtotal, currency)}
              </span>
            </div>

            {effectiveDiscount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                <span>Remise</span>
                <span className="font-mono font-bold">
                  -{formatCurrency(effectiveDiscount, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>TVA ({tva_rate}%)</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(effectiveTva, currency)}
              </span>
            </div>

            {effectiveStamp > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Droit de timbre</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(effectiveStamp, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900 pt-2">
              <span>Total TTC</span>
              <span className="font-mono text-base text-blue-600">
                {formatCurrency(effectiveTotalTtc, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Legal Highlight Box: Arrêté à la somme de */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 sm:p-4 text-xs invoice-words-block print-avoid-break">
          <span className="block text-[9px] font-extrabold uppercase tracking-wider text-blue-700">
            ARRÊTÉ À LA SOMME DE
          </span>
          <p className="font-bold text-slate-900 mt-0.5 italic">
            {effectiveWords}
          </p>
        </div>

        {/* 7. Bank Coordinates & Payment Details */}
        {(bank.rib || bank.account_number || bank.bank_name) && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] space-y-1 invoice-bank-block print-avoid-break">
            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              COORDONNÉES BANCAIRES
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-slate-800">
              {bank.bank_name && <span>Banque: <strong className="font-sans text-slate-900">{bank.bank_name}</strong></span>}
              {bank.rib && <span>RIB: <strong>{bank.rib}</strong></span>}
              {bank.account_number && <span>Compte: <strong>{bank.account_number}</strong></span>}
              {bank.account_holder && <span>Titulaire: <strong>{bank.account_holder}</strong></span>}
            </div>
          </div>
        )}

        {/* 8. Notes / Conditions & Cachet */}
        <div className="flex flex-row items-start justify-between gap-6 pt-3 invoice-notes-block print-avoid-break">
          {notes ? (
            <div className="flex-1 text-[11px] text-slate-500">
              <span className="block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                CONDITIONS & NOTES
              </span>
              <p className="whitespace-pre-line leading-relaxed">{notes}</p>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {show_signature_stamp && (
            <div className="shrink-0 flex flex-col items-center ml-auto">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                CACHET & SIGNATURE
              </span>
              <div className="w-52 h-36 sm:w-64 sm:h-44 print:w-64 print:h-44 border-2 border-dashed border-slate-300/90 rounded-2xl p-2.5 flex items-center justify-center bg-white relative overflow-hidden shadow-2xs">
                {signature_stamp_url ? (
                  <img 
                    src={signature_stamp_url} 
                    alt="Cachet & Signature" 
                    className="max-h-full max-w-full object-contain pointer-events-none select-none" 
                  />
                ) : (
                  <div className="text-center px-4 py-3 text-slate-300 select-none">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400/80 block">
                      Cachet & Signature
                    </span>
                    <span className="text-[9px] text-slate-300 block mt-1 italic">
                      Zone réservée pour validation légale
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 9. Legal Fiscal Footer */}
      <div className={`pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1 invoice-footer-block print-avoid-break ${isPrintMode ? 'mt-6 pb-2' : 'mt-6'}`}>
        <p className="font-semibold text-slate-500">
          {[
            emitter_company_name || "SPASU Eventzone",
            emitter_nif ? `NIF: ${emitter_nif}` : "",
            emitter_nis ? `NIS: ${emitter_nis}` : "",
            emitter_rc ? `RC: ${emitter_rc}` : "",
            emitter_article_imposition ? `Art. Imp.: ${emitter_article_imposition}` : "",
          ].filter(Boolean).join("  •  ")}
        </p>
        <p className="text-[9px] text-slate-400">
          Document généré via Eventzone Platform · Plateforme de gestion d&apos;événements et de billetterie en Algérie
        </p>
      </div>
    </div>
  );
}

/**
 * InvoicingDocumentPreview
 * Pixel-perfect A4 Document Preview matching Algerian fiscal standards and Eventzone design.
 * Automatically manages on-screen responsive preview and dedicated print portal for 100% clean browser printing.
 */
export default function InvoicingDocumentPreview({
  document = {},
  isPrintMode = false,
  className = "",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.document?.body) {
      window.document.body.classList.add("has-invoice-print");
    }

    const handleBeforePrint = () => {
      window.__prevDocTitle = document.title;
      document.title = " ";
    };

    const handleAfterPrint = () => {
      if (typeof window.__prevDocTitle === "string") {
        document.title = window.__prevDocTitle;
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      if (typeof window !== "undefined" && window.document?.body) {
        window.document.body.classList.remove("has-invoice-print");
      }
    };
  }, []);

  // Direct print mode invocation (e.g. within pdf rendering or manual isolation)
  if (isPrintMode) {
    return (
      <InvoicingDocumentSheet
        document={document}
        isPrintMode={true}
        className={className}
        id="a4-invoice-render"
      />
    );
  }

  return (
    <>
      {/* 1. On-Screen Interactive Preview (Hidden during browser window.print()) */}
      <div className="a4-preview-screen print:hidden w-full flex justify-center">
        <InvoicingDocumentSheet
          document={document}
          isPrintMode={false}
          className={className}
          id="a4-invoice-render"
        />
      </div>

      {/* 2. Dedicated Body-Level Print Portal (Hidden on screen, Sole document in window.print()) */}
      {mounted && typeof window !== "undefined" && createPortal(
        <div id="invoice-print-container" className="hidden print:block w-full bg-white text-slate-900">
          <InvoicingDocumentSheet
            document={document}
            isPrintMode={true}
          />
        </div>,
        window.document.body
      )}
    </>
  );
}
