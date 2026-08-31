"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Trash2, CheckCircle2, Image as ImageIcon, Smartphone, Loader2 } from "lucide-react";
import { uploadMedia } from "@/lib/storage";

export default function FormImageUploader({
  value = "",
  onChange,
  required = false,
  disabled = false,
  label = "Upload Picture",
  placeholder = "Upload your photo from phone or computer",
  className = "",
  bucket = "event-images"
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB.");
      return;
    }

    try {
      setIsUploading(true);
      // Scenario B: Upload to Supabase Storage Bucket and return CDN URL
      const cdnUrl = await uploadMedia(file, bucket);
      if (cdnUrl && onChange) {
        onChange(cdnUrl);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300/80 shadow-2xs">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Photo Attached</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">Ready for form submission</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : "Change"}
            </button>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => onChange && onChange("")}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Remove photo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer select-none
            ${isDragging ? "border-blue-500 bg-blue-50/50 scale-[0.99]" : "border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/70"}
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <div className="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
            {isUploading ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <Camera size={20} />}
          </div>
          <div className="text-xs font-bold text-slate-800">
            {isUploading ? "Uploading to Cloud Storage..." : placeholder}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-2">
            <span>PNG, JPG, WebP up to 10MB</span>
          </div>
        </div>
      )}
    </div>
  );
}
