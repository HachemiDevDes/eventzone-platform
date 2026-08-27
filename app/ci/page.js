import { Suspense } from "react";
import CheckInMobileAppWrapper from "../checkin/CheckInMobileAppWrapper";

export const metadata = {
  title: "Eventzone Check-In Desk | ci.eventzone.pro",
  description: "Mobile-optimized on-site check-in and QR scanner portal for event organizers and gate staff.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function CiAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full bg-slate-950 flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400">Loading Check-In Desk...</span>
          </div>
        </div>
      }
    >
      <CheckInMobileAppWrapper />
    </Suspense>
  );
}
