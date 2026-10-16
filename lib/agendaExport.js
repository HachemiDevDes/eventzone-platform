import * as XLSX from "xlsx";

function cleanTimeStr(str) {
  if (!str) return "";
  if (str.includes("T")) {
    const parts = str.split("T")[1];
    return parts ? parts.substring(0, 5) : "";
  }
  return str.substring(0, 5);
}

function calculateDuration(start, end) {
  try {
    const s = cleanTimeStr(start);
    const e = cleanTimeStr(end);
    if (!s || !e) return "";
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return "";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  } catch {
    return "";
  }
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 150);
}

/**
 * Exports agenda sessions to an Excel (.xlsx) file
 */
export function exportAgendaToExcel({
  eventDetails = null,
  sessions = [],
  filterLabel = "All Sessions",
}) {
  const headers = [
    "#",
    "Date",
    "Start Time",
    "End Time",
    "Duration",
    "Session Title",
    "Track / Theme",
    "Location / Room",
    "Speakers",
    "Speaker Details (Title & Company)",
    "Moderators",
    "Moderator Details (Title & Company)",
    "Description"
  ];

  // Sort sessions chronologically
  const sorted = [...sessions].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = cleanTimeStr(a.startTime || a.time);
    const timeB = cleanTimeStr(b.startTime || b.time);
    return timeA.localeCompare(timeB);
  });

  const rows = sorted.map((s, idx) => {
    const sTime = cleanTimeStr(s.startTime || s.time) || "09:00";
    const eTime = cleanTimeStr(s.endTime) || "";
    const duration = calculateDuration(sTime, eTime);

    const speakers = (s.speakers || []).map(sp => typeof sp === "string" ? sp : sp.name).filter(Boolean).join(", ");
    const speakerDetails = (s.speakers || []).map(sp => {
      if (typeof sp !== "object" || !sp.name) return "";
      const meta = [sp.title || sp.jobTitle, sp.company].filter(Boolean).join(" @ ");
      return meta ? `${sp.name} (${meta})` : sp.name;
    }).filter(Boolean).join("; ");

    const moderators = (s.moderators || []).map(m => typeof m === "string" ? m : m.name).filter(Boolean).join(", ");
    const moderatorDetails = (s.moderators || []).map(m => {
      if (typeof m !== "object" || !m.name) return "";
      const meta = [m.title || m.jobTitle, m.company].filter(Boolean).join(" @ ");
      return meta ? `${m.name} (${meta})` : m.name;
    }).filter(Boolean).join("; ");

    return [
      idx + 1,
      s.date || "",
      sTime,
      eTime,
      duration,
      s.title || "Untitled Session",
      s.track || "",
      s.room || s.location || "",
      speakers,
      speakerDetails,
      moderators,
      moderatorDetails,
      s.description || ""
    ];
  });

  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths definition
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 14 },  // Date
    { wch: 11 },  // Start
    { wch: 11 },  // End
    { wch: 10 },  // Duration
    { wch: 38 },  // Title
    { wch: 28 },  // Track
    { wch: 24 },  // Location
    { wch: 26 },  // Speakers
    { wch: 40 },  // Speaker Details
    { wch: 22 },  // Moderators
    { wch: 35 },  // Moderator Details
    { wch: 60 }   // Description
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Agenda");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const eventTitleClean = (eventDetails?.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Eventzone_${eventTitleClean}_Agenda_${dateStr}.xlsx`;

  downloadBlob(blob, fileName);
}

/**
 * Downloads agenda sessions as a high-quality PDF via the API route
 */
export async function downloadAgendaPdf({
  eventId = "",
  eventDetails = null,
  sessions = [],
  filterLabel = "Full Agenda",
}) {
  const targetId = eventId || eventDetails?.id || "default";
  const res = await fetch(`/api/events/${targetId}/agenda/export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessions,
      eventDetails,
      filterLabel,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to generate PDF agenda.");
  }

  const blob = await res.blob();
  const eventTitleClean = (eventDetails?.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Eventzone_${eventTitleClean}_Agenda_${dateStr}.pdf`;

  downloadBlob(blob, fileName);
}
