"use client";

import React, { useState, useRef } from "react";
import { 
  FileText, UploadCloud, X, Check, AlertCircle, 
  Download, Eye, Trash2, FileSpreadsheet, Paperclip 
} from "lucide-react";
import { uploadMedia } from "@/lib/storage";

// Configuration for file types, accepted MIME/extensions, and visual styling
export const FILE_TYPE_CONFIGS = {
  pdf: {
    label: "PDF Document",
    extensions: [".pdf"],
    accept: "application/pdf,.pdf",
    color: "rose",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
    iconColor: "text-rose-600",
    badgeLabel: "PDF",
    hint: "PDF documents only"
  },
  word: {
    label: "Word Document",
    extensions: [".docx", ".doc"],
    accept: ".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    color: "blue",
    badgeBg: "bg-blue-50 border-blue-200 text-blue-700",
    iconColor: "text-blue-600",
    badgeLabel: "DOC / DOCX",
    hint: "Microsoft Word documents"
  },
  excel: {
    label: "Excel Spreadsheet",
    extensions: [".xlsx", ".xls"],
    accept: ".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    color: "emerald",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconColor: "text-emerald-600",
    badgeLabel: "XLS / XLSX",
    hint: "Microsoft Excel spreadsheets"
  },
  csv: {
    label: "CSV Data File",
    extensions: [".csv"],
    accept: ".csv,text/csv,application/vnd.ms-excel",
    color: "teal",
    badgeBg: "bg-teal-50 border-teal-200 text-teal-700",
    iconColor: "text-teal-600",
    badgeLabel: "CSV",
    hint: "Comma-separated values data file"
  },
  pptx: {
    label: "PowerPoint Presentation",
    extensions: [".pptx", ".ppt"],
    accept: ".pptx,.ppt,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    color: "amber",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
    iconColor: "text-amber-600",
    badgeLabel: "PPT / PPTX",
    hint: "PowerPoint pitch deck or slides"
  },
  file: {
    label: "Document / File Upload",
    extensions: [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".csv", ".txt", ".zip"],
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.txt,.zip,application/pdf,application/msword,application/vnd.ms-excel,application/zip",
    color: "indigo",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
    iconColor: "text-indigo-600",
    badgeLabel: "DOC / PDF / ZIP",
    hint: "PDF, Word, Excel, PPT, CSV, or ZIP"
  }
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function formatFileSize(bytes = 0) {
  if (!bytes || isNaN(bytes)) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FormFileUploader({
  value,
  onChange,
  fileType = "file",
  placeholder = "",
  required = false,
  disabled = false,
  className = ""
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Normalize target file config
  const normalizedType = (fileType || "file").replace("file_", "").toLowerCase();
  const config = FILE_TYPE_CONFIGS[normalizedType] || FILE_TYPE_CONFIGS.file;

  // Normalized file data (supports string URL/base64, or object { name, size, url, base64 })
  const fileData = typeof value === "object" && value !== null 
    ? value 
    : typeof value === "string" && value 
      ? { name: value.split("/").pop().split("#")[0].split("?")[0] || "Attached Document", url: value, size: null } 
      : null;

  const handleProcessFile = async (file) => {
    if (!file) return;
    setError(null);

    // 1. Validate File Size (Strict 10 MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File is too large (${sizeMB} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    // 2. Validate Extension if specific type
    const fileNameLower = file.name.toLowerCase();
    const isExtensionAllowed = config.extensions.some(ext => fileNameLower.endsWith(ext));
    if (!isExtensionAllowed && config.extensions.length > 0) {
      setError(`Invalid file type. Please upload a ${config.label} (${config.extensions.join(", ")}).`);
      return;
    }

    setIsUploading(true);
    try {
      const cdnUrl = await uploadMedia(file, "documents");
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type || config.extensions[0],
        url: cdnUrl,
        uploadedAt: new Date().toISOString()
      };

      if (onChange) onChange(fileInfo);
    } catch (uploadErr) {
      console.error("File upload error:", uploadErr);
      setError("Failed to upload file to storage. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onChange) onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {fileData ? (
        /* Render Selected File Card */
        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.badgeBg}`}>
              {normalizedType === "excel" || normalizedType === "csv" ? (
                <FileSpreadsheet size={20} className={config.iconColor} />
              ) : (
                <FileText size={20} className={config.iconColor} />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                {fileData.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase ${config.badgeBg}`}>
                  {config.badgeLabel}
                </span>
                {fileData.size && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatFileSize(fileData.size)}
                  </span>
                )}
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={11} /> Ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {fileData.url && (
              <a
                href={fileData.url}
                download={fileData.name}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                title="Download / View document"
              >
                <Download size={15} />
              </a>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Remove document"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none text-center ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
              : "border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-500 mb-2">
            <UploadCloud size={20} className="text-blue-600" />
          </div>

          <div className="text-xs font-bold text-slate-800">
            {placeholder || `Click to upload or drag & drop ${config.label}`}
          </div>

          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap justify-center font-medium">
            <span>{config.hint}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200/60">
              Max 10 MB
            </span>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-1 px-1 animate-fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
