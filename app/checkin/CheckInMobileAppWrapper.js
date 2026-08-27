"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import CheckInMobileApp from "@/components/CheckInMobileApp";

export default function CheckInMobileAppWrapper() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";

  return (
    <CheckInMobileApp
      initialEventId={initialEventId}
    />
  );
}
