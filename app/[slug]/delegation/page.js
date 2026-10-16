import React from "react";
import { fetchEventDetails, fetchEventBundle } from "../../../lib/db";
import CompanyDelegationPortal from "../../../components/CompanyDelegationPortal";

export async function generateMetadata(props) {
  const resolvedParams = await props?.params;
  const rawSlug = resolvedParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || "");

  if (!slug) {
    return {
      title: "Corporate Delegation Portal | Eventzone",
    };
  }

  const event = await fetchEventDetails(slug);
  return {
    title: `Corporate Delegation Portal — ${event?.title || "Event"} | Eventzone`,
    description: "Manage and assign your representative and exhibitor passes on Eventzone.",
  };
}

export default async function DelegationPage(props) {
  const resolvedParams = await props?.params;
  const resolvedSearchParams = (await props?.searchParams) || {};
  const rawSlug = resolvedParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || "");
  const token = resolvedSearchParams?.token || "";

  if (!slug) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-sm">
          <h2 className="text-lg font-black text-slate-800">Invalid Event URL</h2>
          <p className="text-xs text-slate-500 mt-2">The specified event could not be found.</p>
        </div>
      </div>
    );
  }

  let event = null;
  let forms = [];
  let tickets = [];

  try {
    const bundle = await fetchEventBundle(slug);
    if (bundle) {
      event = bundle.event;
      forms = bundle.forms || [];
      tickets = bundle.tickets || [];
    }
  } catch (err) {
    console.warn("fetchEventBundle notice in delegation page:", err);
  }

  if (!event || !event.id) {
    event = await fetchEventDetails(slug);
  }

  if (!event || !event.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-sm">
          <h2 className="text-lg font-black text-slate-800">Event Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">The event does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <CompanyDelegationPortal 
      event={event} 
      token={token} 
      forms={forms}
      tickets={tickets}
    />
  );
}
