import { Suspense } from "react";
import InvoicesPageClient from "./InvoicesPageClient";

export const metadata = {
  title: "Facturation & Devis — Eventzone",
  description: "Module de facturation, devis et factures proforma pour les organisateurs sur Eventzone.",
};

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-500">Chargement du module de facturation...</span>
          </div>
        </div>
      }
    >
      <InvoicesPageClient />
    </Suspense>
  );
}
