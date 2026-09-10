"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import CheckInMobileApp from "@/components/CheckInMobileApp";

export default function CheckInMobileAppWrapper() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";
  const initialPasscode = searchParams.get("passcode") || "";
  const initialGate = searchParams.get("gate") || "";

  return (
    <CheckInMobileApp
      initialEventId={initialEventId}
      initialPasscode={initialPasscode}
      initialGate={initialGate}
    />
  );
}
