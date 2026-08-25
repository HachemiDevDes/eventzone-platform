"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * TablePagination Component
 * Clean, modern pagination bar with rows-per-page selector and smart page number buttons
 */
export default function TablePagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  itemName = "attendees",
  pageSizeOptions = [5, 10, 25, 50, 100],
  className = ""
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (safeCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const handlePageClick = (p) => {
    if (typeof p === "number" && p !== safeCurrentPage && p >= 1 && p <= totalPages) {
      onPageChange?.(p);
    }
  };

  return (
    <div className={`px-6 py-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-4 select-none ${className}`}>
      {/* Left: Range Info & Page Size */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span>
          Showing <span className="font-bold text-slate-850">{startItem}</span> to{" "}
          <span className="font-bold text-slate-850">{endItem}</span> of{" "}
          <span className="font-bold text-slate-850">{totalItems}</span> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange?.(newSize);
                onPageChange?.(1);
              }}
              className="py-1 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            disabled={safeCurrentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-xs">
                    ...
                  </span>
                );
              }

              const isActive = p === safeCurrentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => handlePageClick(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => handlePageClick(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
