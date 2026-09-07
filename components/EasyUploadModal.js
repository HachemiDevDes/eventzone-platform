"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileUp,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import {
  generateAttendeeTemplate,
  parseAttendeeSpreadsheet,
} from "../lib/attendeesExport";
import { useLanguage } from "../lib/i18n";

export default function EasyUploadModal({
  isOpen = false,
  onClose,
  tickets = [],
  forms = [],
  attendees = [],
  onImportAttendees,
}) {
  const { t } = useLanguage();

  // Category selection state
  const defaultCategory = useMemo(() => {
    if (tickets && tickets.length > 0) {
      return tickets[0].name || tickets[0].tier || "Visitor";
    }
    return "Visitor";
  }, [tickets]);

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  // File parsing state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null); // { totalCount, validRows, invalidRows }
  const [parseError, setParseError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Build category dropdown options
  const categoryOptions = useMemo(() => {
    const opts = [];

    // Custom ticket tiers
    (tickets || []).forEach((ticket) => {
      const name = ticket.name || ticket.tier || "Ticket";
      const priceText = ticket.price ? `${ticket.price} DZD` : "Free Pass";
      opts.push({
        value: name,
        label: name,
        description: `Ticket tier (${priceText})`,
      });
    });

    // If no tickets configured, add a generic Visitor option
    if (opts.length === 0) {
      opts.push({
        value: "Visitor",
        label: "Visitor",
        description: "General attendee badge",
      });
    }

    // Role-specific badges
    opts.push(
      {
        value: "Speaker",
        label: "Speaker",
        description: "Event speakers and panel presenters",
      },
      {
        value: "Exhibitor",
        label: "Exhibitor",
        description: "Booth exhibitors and commercial partners",
      },
      {
        value: "Sponsor",
        label: "Sponsor",
        description: "Event sponsors and brand partners",
      }
    );

    return opts;
  }, [tickets]);

  // Existing registered attendee emails for duplicate detection
  const existingEmails = useMemo(() => {
    const set = new Set();
    (attendees || []).forEach((a) => {
      if (a.email && !a.isArchived && a.status !== "archived") {
        set.add(String(a.email).toLowerCase().trim());
      }
    });
    return set;
  }, [attendees]);

  // Active ticket & form object for selected category
  const currentTicket = useMemo(() => {
    return (tickets || []).find(
      (t) => (t.name || t.tier) === selectedCategory
    );
  }, [tickets, selectedCategory]);

  const currentForm = useMemo(() => {
    if (!currentTicket?.formId && !currentTicket?.form_id) return null;
    const targetFormId = currentTicket.formId || currentTicket.form_id;
    return (forms || []).find((f) => f.id === targetFormId);
  }, [forms, currentTicket]);

  // Download template handler
  const handleDownloadTemplate = () => {
    generateAttendeeTemplate(selectedCategory, currentTicket, currentForm);
  };

  // File upload & parsing handler
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const processSelectedFile = async (file) => {
    setParseError(null);
    setParseResult(null);
    setIsParsing(true);
    setUploadedFile(file);

    try {
      const result = await parseAttendeeSpreadsheet(file, existingEmails);
      setParseResult(result);
    } catch (err) {
      console.error("Failed to parse spreadsheet:", err);
      setParseError(err.message || "Failed to parse the uploaded file.");
    } finally {
      setIsParsing(false);
    }
  };

  // Drag and drop handlers
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleResetFile = () => {
    setUploadedFile(null);
    setParseResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Confirm & Import handler
  const handleConfirmImport = async () => {
    if (!parseResult || !parseResult.validRows || parseResult.validRows.length === 0) return;
    setIsImporting(true);

    try {
      const isSpeaker = selectedCategory.toLowerCase().includes("speaker");
      const isExhibitor = selectedCategory.toLowerCase().includes("exhibitor");
      const isSponsor = selectedCategory.toLowerCase().includes("sponsor");

      const preparedAttendees = parseResult.validRows.map((row, idx) => {
        const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const badgeCode = `EZ-${uniqueSuffix}`;

        const answers = {
          ...row.customAnswers,
          ...(row.company ? { company: row.company, f_company: row.company } : {}),
          ...(row.jobTitle ? { jobTitle: row.jobTitle, f_job_title: row.jobTitle } : {}),
          ...(row.phone ? { phone: row.phone, f_core_phone: row.phone } : {}),
          ...(row.booth ? { booth: row.booth } : {}),
          ...(row.sponsorTier ? { sponsorTier: row.sponsorTier } : {}),
          ...(row.sessionTitle ? { sessionTitle: row.sessionTitle } : {}),
          ...(row.bio ? { bio: row.bio } : {}),
        };

        return {
          id: `imp-${Date.now()}-${idx}-${uniqueSuffix}`,
          name: row.name,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone || "",
          company: row.company || "",
          jobTitle: row.jobTitle || "",
          ticketType: selectedCategory,
          ticket_type: selectedCategory,
          status: "registered",
          checkedIn: false,
          isSpeaker: isSpeaker,
          is_speaker: isSpeaker,
          badgeCode: badgeCode,
          badge_code: badgeCode,
          registeredDate: new Date().toISOString(),
          registered_at: new Date().toISOString(),
          answers: answers,
          customAnswers: answers,
        };
      });

      if (onImportAttendees) {
        await onImportAttendees(preparedAttendees);
      }

      setImportSuccessMessage(`Successfully imported ${preparedAttendees.length} attendees!`);
      setTimeout(() => {
        handleResetFile();
        setImportSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Import failed:", err);
      setParseError(err.message || "Failed to import attendees. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Upload Attendees
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bulk import participants from standardized spreadsheets
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Banner */}
          {importSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{importSuccessMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold">
                <span className="font-bold text-rose-900 block mb-0.5">Parsing Notice</span>
                <span>{parseError}</span>
              </div>
            </div>
          )}

          {/* Step 1: Select Category & Download Sample */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Step 1 : Select Badge Title and download sample file
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <SearchableSelect
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val);
                    // Re-validate if file is already attached
                    if (uploadedFile) {
                      processSelectedFile(uploadedFile);
                    }
                  }}
                  options={categoryOptions}
                  placeholder="Select Badge Title / Category"
                  searchPlaceholder="Search ticket or role..."
                  isClearable={false}
                  className="w-full"
                />
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 font-bold text-xs rounded-xl border border-blue-200 hover:border-blue-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs shrink-0"
              >
                <Download size={14} />
                <span>Download sample</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload the Sample Downloaded File */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Step 2 : Upload the sample downloaded file with attendees details
            </h4>

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <FileUp size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-700">
                    Click to attach or drag and drop
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Excel (.xlsx, .xls) or CSV files supported
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-1 px-4 py-1.5 bg-white text-blue-600 font-bold text-xs rounded-xl border border-blue-200 hover:bg-blue-50 shadow-2xs"
                >
                  Attach
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-extrabold text-slate-800 truncate">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • {parseResult ? `${parseResult.totalCount} rows detected` : "Processing..."}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetFile}
                  disabled={isImporting}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Validation & Preview Section */}
          {isParsing && (
            <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-xs font-bold text-slate-600">
                Parsing spreadsheet and validating rows...
              </span>
            </div>
          )}

          {parseResult && !isParsing && (
            <div className="space-y-3">
              {/* Metric Counters */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                  <span>Total Rows:</span>
                  <span className="font-extrabold text-slate-900">{parseResult.totalCount}</span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Ready to Import:</span>
                  <span className="font-extrabold text-emerald-900">{parseResult.validRows.length}</span>
                </div>

                {parseResult.invalidRows.length > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <span>Ignored / Errors:</span>
                    <span className="font-extrabold text-amber-900">{parseResult.invalidRows.length}</span>
                  </div>
                )}
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parseResult.validRows.slice(0, 10).map((row, i) => (
                      <tr key={`valid-${i}`} className="hover:bg-slate-50/50 text-slate-700">
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check size={10} /> Valid
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[140px]">
                          {row.name}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[160px]">
                          {row.email}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">
                          {row.company || "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-400 italic text-[11px]">—</td>
                      </tr>
                    ))}

                    {parseResult.invalidRows.map((row, i) => (
                      <tr key={`invalid-${i}`} className="bg-rose-50/30 hover:bg-rose-50/60 text-slate-700">
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertCircle size={10} /> Invalid
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[140px]">
                          {row.name || "(Missing Name)"}
                        </td>
                        <td className="py-2 px-3 text-rose-600 font-medium truncate max-w-[160px]">
                          {row.email || "(Missing Email)"}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">
                          {row.company || "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            {row.errors.join(", ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parseResult.validRows.length > 10 && (
                <p className="text-[11px] text-slate-400 italic text-center">
                  Showing first 10 of {parseResult.validRows.length} valid rows
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={
              !parseResult ||
              parseResult.validRows.length === 0 ||
              isImporting ||
              isParsing
            }
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              !parseResult || parseResult.validRows.length === 0 || isImporting
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>
                  Confirm & Import ({parseResult?.validRows?.length || 0} Attendees)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
