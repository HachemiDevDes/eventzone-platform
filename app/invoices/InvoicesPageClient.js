"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InvoicesPageClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?view=invoicing");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">Ouverture de Facturation & Devis...</span>
      </div>
    </div>
  );
}
