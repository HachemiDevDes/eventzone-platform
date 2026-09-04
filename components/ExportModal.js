"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, FileText, Image as ImageIcon, Check, Loader2,
  Printer
} from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function ExportModal({ isOpen, onClose, onExport, elements = [], exhibitors = [], attendees = [] }) {
  const { t } = useLanguage();
  const [format, setFormat] = useState("pdf"); // 'pdf' | 'png' | 'booth_list_pdf' | 'booth_list_excel'
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    availableOnly: false,
    hideFurniture: false,
    showLabels: true,
    showGrid: false,
    safetyLayerOnly: false,
  });

  // Layout Settings
  const [orientation, setOrientation] = useState("landscape"); // 'landscape' | 'portrait'
  const [paperSize, setPaperSize] = useState("a4"); // 'a4' | 'a3' | 'letter'
  const [currentViewOnly, setCurrentViewOnly] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generateCSV = (elements, exhibitors) => {
    const booths = elements.filter(el => el.type.startsWith("booth"));
    
    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Booth ID,Booth Label,Type,Width (m),Height (m),Area (sqm),Status,Linked Company (Exhibitor)\n";
    
    booths.forEach(booth => {
      const matchedExhibitor = exhibitors.find(ex => ex.id === booth.exhibitorId || String(ex.id) === String(booth.exhibitorId));
      const exhibitorName = matchedExhibitor ? matchedExhibitor.name : "None";
      const surfaceMeters = (booth.width / 20) * (booth.height / 20);
      const row = [
        booth.id,
        `"${(booth.label || "").replace(/"/g, '""')}"`,
        booth.type,
        (booth.width / 20).toFixed(2),
        (booth.height / 20).toFixed(2),
        surfaceMeters.toFixed(2),
        booth.status || "available",
        `"${exhibitorName.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "booths_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFTable = (elements, exhibitors) => {
    const booths = elements.filter(el => el.type.startsWith("booth"));
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let htmlContent = `
      <html>
        <head>
          <title>Booths & Exhibitors Directory</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 5px;
              color: #0f172a;
            }
            p {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 30px;
              font-weight: 500;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border-bottom: 1px solid #e2e8f0;
              padding: 12px 16px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            tr:hover {
              background-color: #f1f5f9;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .status-available { background-color: #dcfce7; color: #15803d; }
            .status-reserved { background-color: #ffedd5; color: #c2410c; }
            .status-sold { background-color: #fee2e2; color: #b91c1c; }
            .status-hold { background-color: #ecfeff; color: #0891b2; }
            .status-negotiation { background-color: #fdf4ff; color: #a21caf; }
            .status-pending-payment { background-color: #ffedd5; color: #ea580c; }
          </style>
        </head>
        <body>
          <h1>Booths & Exhibitors Directory</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Booth Label</th>
                <th>Type</th>
                <th>Dimensions</th>
                <th>Area</th>
                <th>Status</th>
                <th>Linked Exhibitor</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    booths.forEach(booth => {
      const matchedExhibitor = exhibitors.find(ex => ex.id === booth.exhibitorId || String(ex.id) === String(booth.exhibitorId));
      const exhibitorName = matchedExhibitor ? matchedExhibitor.name : "Unassigned";
      const surfaceMeters = (booth.width / 20) * (booth.height / 20);
      const statusClass = `status-${booth.status || "available"}`;
      const statusLabel = (booth.status || "available").replace("-", " ");
      
      htmlContent += `
        <tr>
          <td style="font-weight: 750;">${booth.label || `Booth ${booth.id}`}</td>
          <td style="text-transform: capitalize;">${booth.type.replace("booth-", "")}</td>
          <td>${(booth.width / 20).toFixed(1)}m x ${(booth.height / 20).toFixed(1)}m</td>
          <td>${surfaceMeters.toFixed(2)} m²</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td style="font-weight: 600; color: ${matchedExhibitor ? "#4f46e5" : "#64748b"};">${exhibitorName}</td>
        </tr>
      `;
    });
    
    htmlContent += `
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getElementSeats = (el, attendees) => {
    if (el.children && Array.isArray(el.children)) {
      return el.children.map(seat => {
        const attendeeId = seat.assigned_participant_id || seat.attendeeId;
        const attendee = attendeeId ? attendees.find(a => a.id === attendeeId || String(a.id) === String(attendeeId)) : null;
        return {
          seatId: seat.id,
          seatLabel: seat.label || "Seat",
          attendee: attendee,
          status: seat.seat_status || (attendee ? "assigned" : "unassigned")
        };
      });
    }
    if (el.type === "table-chairs") {
      const chairsCount = el.chairsCount || 6;
      const seats = [];
      for (let idx = 0; idx < chairsCount; idx++) {
        const assignedAttendeeId = el.assignments ? el.assignments[idx] : null;
        const attendee = assignedAttendeeId ? attendees.find(a => a.id === assignedAttendeeId || String(a.id) === String(assignedAttendeeId)) : null;
        seats.push({
          seatId: `${el.id}_seat_${idx}`,
          seatLabel: `Chair ${idx + 1}`,
          attendee: attendee,
          status: attendee ? "assigned" : "unassigned"
        });
      }
      return seats;
    }
    return [];
  };

  const generateSeatingCSV = (elements, attendees) => {
    const seatingTypes = ["table-chairs", "auditorium-block", "theater-in-the-round", "classroom-rows", "reserved-seat-block"];
    const seatingElements = elements.filter(el => seatingTypes.includes(el.type));
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Element ID,Element Label,Type,Seat ID,Seat Label,Seat Status,Attendee Name,Attendee Email,Attendee Company,Ticket Type\n";
    
    seatingElements.forEach(el => {
      const seats = getElementSeats(el, attendees);
      seats.forEach(seat => {
        const row = [
          el.id,
          `"${(el.label || el.type).replace(/"/g, '""')}"`,
          el.type,
          seat.seatId,
          `"${seat.seatLabel.replace(/"/g, '""')}"`,
          seat.status,
          seat.attendee ? `"${seat.attendee.name.replace(/"/g, '""')}"` : "None",
          seat.attendee ? `"${(seat.attendee.email || "").replace(/"/g, '""')}"` : "None",
          seat.attendee ? `"${(seat.attendee.company || "").replace(/"/g, '""')}"` : "None",
          seat.attendee ? `"${(seat.attendee.ticketType || "").replace(/"/g, '""')}"` : "None"
        ].join(",");
        csvContent += row + "\n";
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "seating_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSeatingPDFTable = (elements, attendees) => {
    const seatingTypes = ["table-chairs", "auditorium-block", "theater-in-the-round", "classroom-rows", "reserved-seat-block"];
    const seatingElements = elements.filter(el => seatingTypes.includes(el.type));
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let htmlContent = `
      <html>
        <head>
          <title>Seating Directory</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 5px;
              color: #0f172a;
            }
            p {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 30px;
              font-weight: 500;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border-bottom: 1px solid #e2e8f0;
              padding: 12px 16px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            tr:hover {
              background-color: #f1f5f9;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .status-assigned { background-color: #dcfce7; color: #15803d; }
            .status-checked-in { background-color: #d1fae5; color: #065f46; }
            .status-unassigned { background-color: #f1f5f9; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>Seating Directory</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Section/Table Label</th>
                <th>Type</th>
                <th>Seat Label</th>
                <th>Seating Status</th>
                <th>Attendee Name</th>
                <th>Company</th>
                <th>Ticket Type</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    seatingElements.forEach(el => {
      const seats = getElementSeats(el, attendees);
      seats.forEach(seat => {
        const statusClass = `status-${seat.status}`;
        const statusLabel = seat.status.replace("_", " ");
        
        htmlContent += `
          <tr>
            <td style="font-weight: 750;">${el.label || el.type}</td>
            <td style="text-transform: capitalize;">${el.type.replace("-block", "").replace("-rows", "").replace("table-", "")}</td>
            <td style="font-weight: 600;">${seat.seatLabel}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td style="font-weight: 600; color: ${seat.attendee ? "#4f46e5" : "#64748b"};">${seat.attendee ? seat.attendee.name : "Unassigned"}</td>
            <td>${seat.attendee && seat.attendee.company ? seat.attendee.company : "-"}</td>
            <td>${seat.attendee && seat.attendee.ticketType ? seat.attendee.ticketType : "-"}</td>
          </tr>
        `;
      });
    });
    
    htmlContent += `
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    if (format === "booth_list_excel") {
      generateCSV(elements, exhibitors);
    } else if (format === "booth_list_pdf") {
      generatePDFTable(elements, exhibitors);
    } else if (format === "seating_list_excel") {
      generateSeatingCSV(elements, attendees);
    } else if (format === "seating_list_pdf") {
      generateSeatingPDFTable(elements, attendees);
    } else {
      onExport({
        format,
        filters,
        settings: {
          orientation,
          paperSize: format === "pdf" ? paperSize : null,
          exportCurrentViewOnly: currentViewOnly,
        }
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with fade-in */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Card with scale up */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 mx-4 max-h-[90vh]"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t("export.title", "Export Floor Plan")}</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t("export.subtitle", "Configure settings for download")}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* A. Format Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t("export.formatSelection", "A. Format Selection")}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PDF Card */}
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-start gap-4 p-4 border rounded-2xl text-start rtl:text-right text-left transition-all cursor-pointer relative ${
                  format === "pdf"
                    ? "border-indigo-650 bg-indigo-50/20 shadow-sm shadow-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "pdf" ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{t("export.pdfDoc", "PDF Document (Layout)")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                    {t("export.pdfDocDesc", "High-resolution vector, best for printing.")}
                  </span>
                </div>
                {format === "pdf" && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* PNG Card */}
              <button
                type="button"
                onClick={() => setFormat("png")}
                className={`flex items-start gap-4 p-4 border rounded-2xl text-start rtl:text-right text-left transition-all cursor-pointer relative ${
                  format === "png"
                    ? "border-indigo-650 bg-indigo-50/20 shadow-sm shadow-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "png" ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"}`}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{t("export.pngImage", "PNG Image (Layout)")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                    {t("export.pngImageDesc", "Image format, best for web and sharing.")}
                  </span>
                </div>
                {format === "png" && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Booth List PDF Card */}
              <button
                type="button"
                onClick={() => setFormat("booth_list_pdf")}
                className={`flex items-start gap-4 p-4 border rounded-2xl text-start rtl:text-right text-left transition-all cursor-pointer relative ${
                  format === "booth_list_pdf"
                    ? "border-indigo-650 bg-indigo-50/20 shadow-sm shadow-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "booth_list_pdf" ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{t("export.boothsPdf", "Booths Directory (PDF)")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                    {t("export.boothsPdfDesc", "Structured text table of booths and companies.")}
                  </span>
                </div>
                {format === "booth_list_pdf" && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Booth List Excel/CSV Card */}
              <button
                type="button"
                onClick={() => setFormat("booth_list_excel")}
                className={`flex items-start gap-4 p-4 border rounded-2xl text-start rtl:text-right text-left transition-all cursor-pointer relative ${
                  format === "booth_list_excel"
                    ? "border-indigo-650 bg-indigo-50/20 shadow-sm shadow-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "booth_list_excel" ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{t("export.boothsCsv", "Booths Directory (Excel/CSV)")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                    {t("export.boothsCsvDesc", "CSV spreadsheet, perfect for Excel database import.")}
                  </span>
                </div>
                {format === "booth_list_excel" && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Seating List PDF Card */}
              <button
                type="button"
                onClick={() => setFormat("seating_list_pdf")}
                className={`flex items-start gap-4 p-4 border rounded-2xl text-start rtl:text-right text-left transition-all cursor-pointer relative ${
                  format === "seating_list_pdf"
                    ? "border-indigo-650 bg-indigo-50/20 shadow-sm shadow-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "seating_list_pdf" ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{t("export.seatingPdf", "Seating Directory (PDF)")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                    {t("export.seatingPdfDesc", "Structured print table of tables and assigned attendees.")}
                  </span>
                </div>
                {format === "seating_list_pdf" && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Seating List Excel/CSV Card */}
              <button
                type="button"
                onClick={() => setFormat("seating_list_excel")}
                className={`flex items-start gap-4 p-4 border rounded-2xl text-start rtl:text-right text-left transition-all cursor-pointer relative ${
                  format === "seating_list_excel"
                    ? "border-indigo-650 bg-indigo-50/20 shadow-sm shadow-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "seating_list_excel" ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{t("export.seatingCsv", "Seating Directory (Excel/CSV)")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                    {t("export.seatingCsvDesc", "CSV spreadsheet, perfect for Excel attendee tracking.")}
                  </span>
                </div>
                {format === "seating_list_excel" && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* {t("export.contentFilters", "B. Content & Visibility Filters")} */}
          <div className={`space-y-3 transition-opacity duration-200 ${format.includes("_list_") ? "opacity-35 pointer-events-none" : ""}`}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              B. Content & Visibility Filters
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-150">
              {/* Filter 1 */}
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{t("export.availableBoothsOnly", "Available Booths Only")}</span>
                  <span className="text-[9px] text-slate-450 font-semibold">{t("export.availableBoothsOnlyDesc", "Hide reserved or sold booths")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("availableOnly")}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    filters.availableOnly ? "bg-indigo-650" : "bg-slate-250"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    filters.availableOnly ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Filter 2 */}
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{t("export.hideFurniture", "Hide Seating & Furniture")}</span>
                  <span className="text-[9px] text-slate-450 font-semibold">{t("export.hideFurnitureDesc", "Show structural blueprint only")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("hideFurniture")}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    filters.hideFurniture ? "bg-indigo-650" : "bg-slate-250"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    filters.hideFurniture ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Filter 3 */}
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{t("export.showDimensionsLabels", "Show Dimensions & Labels")}</span>
                  <span className="text-[9px] text-slate-450 font-semibold">{t("export.showDimensionsLabelsDesc", "Include labels and surfaces text")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("showLabels")}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    filters.showLabels ? "bg-indigo-650" : "bg-slate-250"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    filters.showLabels ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Filter 4 */}
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{t("export.showBackgroundGrid", "Show Background Grid")}</span>
                  <span className="text-[9px] text-slate-450 font-semibold">{t("export.showBackgroundGridDesc", "Include venue layout guidelines grid")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("showGrid")}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    filters.showGrid ? "bg-indigo-650" : "bg-slate-250"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    filters.showGrid ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Filter 5: Safety and Compliance Layer Only */}
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{t("export.safetyComplianceOnly", "Safety & Compliance Only")}</span>
                  <span className="text-[9px] text-slate-450 font-semibold">{t("export.safetyComplianceOnlyDesc", "Only export structural and safety elements")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("safetyLayerOnly")}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    filters.safetyLayerOnly ? "bg-indigo-650" : "bg-slate-250"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    filters.safetyLayerOnly ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Filter 6: Export visible viewport only */}
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{t("export.exportViewportOnly", "Export Visible Viewport Only")}</span>
                  <span className="text-[9px] text-slate-450 font-semibold">{t("export.exportViewportOnlyDesc", "Only export the currently zoomed in/panned area")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentViewOnly(prev => !prev)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    currentViewOnly ? "bg-indigo-650" : "bg-slate-250"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    currentViewOnly ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>


        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-xl font-bold text-xs transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            {t("export.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-55"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t("export.generating", "Preparing Export...")}</span>
              </>
            ) : (
              <>
                <FileText size={14} />
                <span>{t("export.exportNow", "Generate Export")}</span>
              </>
            )}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
