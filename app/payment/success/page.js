"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  QrCode,
  User,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

async function generateAttendeeBadge({ eventName, tier, date, location, attendeeName, qrCodeUrl }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 800;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  // Crisp white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Top gradient banner
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#059669");
  gradient.addColorStop(1, "#0284c7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 22);

  // Lanyard clip hole indicator
  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(width / 2 - 55, 48, 110, 18, 9);
  } else {
    ctx.rect(width / 2 - 55, 48, 110, 18);
  }
  ctx.fill();

  // Tier Badge Tag
  const tierText = (tier || "Official Admission").toUpperCase();
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const tierWidth = ctx.measureText(tierText).width + 38;
  const tierX = (width - tierWidth) / 2;
  const tierY = 96;
  ctx.fillStyle = "#ECFDF5";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(tierX, tierY, tierWidth, 42, 21);
  } else {
    ctx.rect(tierX, tierY, tierWidth, 42);
  }
  ctx.fill();
  ctx.strokeStyle = "#A7F3D0";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tierText, width / 2, tierY + 21);

  // Event Name
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "alphabetic";

  const words = (eventName || "Eventzone Summit").split(" ");
  let line = "";
  let currentY = 195;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 680 && n > 0) {
      ctx.fillText(line.trim(), width / 2, currentY);
      line = words[n] + " ";
      currentY += 50;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), width / 2, currentY);

  // Date and Location
  let metaY = currentY + 45;
  ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#64748B";
  if (date) {
    ctx.fillText(date, width / 2, metaY);
    metaY += 34;
  }
  if (location) {
    ctx.fillText(location, width / 2, metaY);
    metaY += 38;
  }

  // Divider
  metaY += 15;
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, metaY);
  ctx.lineTo(width - 80, metaY);
  ctx.stroke();

  // Attendee Name (Big & Bold)
  metaY += 68;
  ctx.fillStyle = "#0F172A";
  ctx.font = "800 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(attendeeName || "Attendee", width / 2, metaY);

  // QR Code Box
  metaY += 40;
  const qrBoxSize = 390;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = metaY;

  ctx.fillStyle = "#F8FAFC";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
  } else {
    ctx.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  }
  ctx.fill();
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw QR Image inside
  if (qrCodeUrl) {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const qrSize = 330;
        ctx.drawImage(img, (width - qrSize) / 2, qrBoxY + (qrBoxSize - qrSize) / 2, qrSize, qrSize);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = qrCodeUrl;
    });
  }

  // Bottom Scan Text
  metaY = qrBoxY + qrBoxSize + 48;
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("FAST-TRACK ENTRY PASS", width / 2, metaY);

  // Brand Footer
  metaY += 34;
  ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#059669";
  ctx.fillText("Eventzone Verified Pass", width / 2, metaY);

  // Outer Border
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(2, 2, width - 4, height - 4, 32);
  } else {
    ctx.rect(2, 2, width - 4, height - 4);
  }
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get("payment_id") || searchParams.get("id");
  const checkoutId = searchParams.get("checkout_id");
  const eventId = searchParams.get("event_id");

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    let timer;
    async function checkStatus() {
      try {
        const queryParam = paymentId
          ? `payment_id=${paymentId}`
          : checkoutId
          ? `checkout_id=${checkoutId}`
          : "";

        if (!queryParam) {
          setError("No payment reference found in URL.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/payments/chargily/status?${queryParam}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setPaymentData(data.payment);
          setParticipantData(data.participant);

          if (data.payment?.status === "pending" && pollCount < 5) {
            timer = setTimeout(() => {
              setPollCount((prev) => prev + 1);
            }, 2000);
          } else {
            setLoading(false);
          }
        } else {
          setError(data.error || "Could not retrieve payment information.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Payment status check error:", err);
        setError("Network error while verifying payment status.");
        setLoading(false);
      }
    }

    checkStatus();
    return () => clearTimeout(timer);
  }, [paymentId, checkoutId, pollCount]);

  const handleDownloadBadge = async () => {
    if (!participantData?.qrCode || downloading) return;
    setDownloading(true);
    try {
      const formattedDate = eventInfo.start_date
        ? new Date(eventInfo.start_date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";

      const badgeDataUrl = await generateAttendeeBadge({
        eventName: eventInfo.name || "Eventzone Event",
        tier: paymentData.ticketTier || "Official Admission",
        date: formattedDate,
        location: eventInfo.location || "",
        attendeeName: paymentData.customerName || participantData?.name || "Attendee",
        qrCodeUrl: participantData.qrCode,
      });

      const link = document.createElement("a");
      link.href = badgeDataUrl;
      const cleanName = (paymentData.customerName || participantData?.name || "attendee")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      link.download = `${cleanName}_eventzone_badge.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Badge generation error:", err);
      // Fallback: download QR code directly if canvas fails
      const fallbackLink = document.createElement("a");
      fallbackLink.href = participantData.qrCode;
      fallbackLink.download = "eventzone_pass.png";
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setDownloading(false);
    }
  };

  const handleReturnToEvent = () => {
    const slug = paymentData?.event?.slug || eventId;
    if (slug) {
      router.push(`/${slug}`);
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Verifying Payment...
        </h2>
        <p className="text-xs text-slate-500 max-w-xs">
          Confirming your transaction with Chargily Pay.
        </p>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Notice</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {error || "Could not retrieve payment information."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  const eventInfo = paymentData.event || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 py-12 px-4 sm:px-6 flex flex-col items-center justify-center font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-7 sm:p-9 text-center">
        {/* Success Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <CheckCircle2 size={32} className="stroke-[2.5]" />
        </div>

        {/* Clean Bold Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Payment Confirmed
        </h1>

        {/* Event Details Single Column */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
              {paymentData.ticketTier || "Official Admission"}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {eventInfo.name || "Eventzone Summit"}
            </h2>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            {eventInfo.start_date && (
              <div className="flex items-center gap-2.5">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>
                  {new Date(eventInfo.start_date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {eventInfo.location && (
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{eventInfo.location}</span>
              </div>
            )}
            {paymentData.customerName && (
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">
                  {paymentData.customerName}
                </span>
              </div>
            )}
          </div>

          {/* QR Code Pass (Badge code pill removed) */}
          <div className="pt-2 flex flex-col items-center justify-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center">
              {participantData?.qrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={participantData.qrCode}
                  alt="Entry QR Code"
                  className="w-44 h-44 object-contain rounded-xl"
                />
              ) : (
                <div className="w-44 h-44 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <QrCode size={40} className="stroke-1" />
                  <span className="text-xs">Preparing badge...</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Paid */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Amount Paid</span>
            <span className="font-bold text-slate-900 text-sm">
              {Number(paymentData.amount).toLocaleString()} {paymentData.currency}
            </span>
          </div>
        </div>

        {/* Single Action Button: Download Badge */}
        <div className="mt-6">
          <button
            onClick={handleDownloadBadge}
            disabled={!participantData?.qrCode || downloading}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Badge...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Badge</span>
              </>
            )}
          </button>

          <button
            onClick={handleReturnToEvent}
            className="mt-3.5 text-xs text-slate-400 hover:text-slate-600 transition-colors inline-block cursor-pointer"
          >
            Return to event
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
