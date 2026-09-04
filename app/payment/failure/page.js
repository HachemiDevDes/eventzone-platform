"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw, Home } from "lucide-react";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = searchParams.get("event_id");
  const paymentId = searchParams.get("payment_id");

  const handleRetry = () => {
    if (eventId) {
      router.push(`/?view=register&eventId=${eventId}`);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-2xl shadow-amber-500/20 mb-2">
          <AlertTriangle size={38} className="stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Payment Incomplete
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your EDAHABIA / CIB transaction was cancelled or could not be completed. Your account has not been charged for this pass.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-start rtl:text-right text-xs text-slate-400 space-y-2.5">
          <div className="font-bold text-slate-300">Common Reasons:</div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
            <li>Session timeout or cancel button clicked in the Chargily gateway.</li>
            <li>Insufficient balance or invalid card expiration date.</li>
            <li>SMS OTP verification was not entered in time.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRetry}
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Try Payment Again</span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <Home size={15} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentFailureContent />
    </Suspense>
  );
}
