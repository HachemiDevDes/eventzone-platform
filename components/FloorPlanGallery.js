"use client";

import React, { useState } from "react";
import {
  Map, Plus, Edit3, Copy, Archive, RotateCcw, Grid, LayoutGrid,
  Clock, Layers, Trash2
} from "lucide-react";
import { FloorPlanSkeleton } from "./SkeletonLoaders";

// Thumbnail preview: mini SVG representation of element counts
function PlanThumbnail({ plan }) {
  const count = plan.elements?.length ?? 0;
  const hasBlueprint = !!plan.blueprint?.url;

  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 group-hover:border-indigo-200 transition-colors duration-200">
      {hasBlueprint ? (
        // Blueprint image thumbnail
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={plan.blueprint.url}
          alt="Blueprint"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      ) : (
        // Grid pattern background
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]" />
      )}

      {/* Center badge */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-xl bg-white/90 shadow-sm border border-slate-200/80 flex items-center justify-center text-indigo-650">
          <Map size={20} />
        </div>
        <span className="text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/60 backdrop-blur-xs">
          {count} elements
        </span>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "Just now";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Just now";
  }
}

// Single floor plan card
function PlanCard({ plan, onEdit, onDuplicate, onDelete, onPermanentDelete, onArchive, onRestore, onRename }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(plan.name);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isArchived = plan.isArchived || plan.status === "archived";

  const handleNameSubmit = () => {
    setIsEditingName(false);
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== plan.name && onRename) {
      onRename(plan.id, trimmed);
    } else {
      setNameVal(plan.name);
    }
  };

  return (
    <div className={`group relative bg-white rounded-2xl border ${isArchived ? 'border-slate-200 opacity-80' : 'border-slate-200/90'} hover:border-indigo-200 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden`}>
      {/* Thumbnail */}
      <div
        className="p-3 pb-0 cursor-pointer"
        onClick={() => onEdit(plan.id)}
      >
        <PlanThumbnail plan={plan} />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name (editable inline) */}
        <div>
          {isEditingName ? (
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSubmit();
                if (e.key === "Escape") { setNameVal(plan.name); setIsEditingName(false); }
              }}
              autoFocus
              className="w-full text-sm font-bold text-slate-800 border border-indigo-400 rounded-lg px-2 py-1 outline-none bg-indigo-50/40"
            />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <h3
                onDoubleClick={() => !isArchived && setIsEditingName(true)}
                className="text-sm font-bold text-slate-800 group-hover:text-indigo-650 transition-colors truncate cursor-pointer"
                title={isArchived ? plan.name : "Double-click to rename"}
              >
                {plan.name}
              </h3>
              {isArchived && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                  Archived
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDate(plan.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Layers size={10} />
            {plan.elements?.length ?? 0} items
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => onEdit(plan.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>

          {!isArchived && (
            <button
              onClick={() => onDuplicate(plan.id)}
              className="p-2 border border-slate-200 hover:border-indigo-200 hover:text-indigo-650 rounded-xl text-slate-500 transition-all duration-200 cursor-pointer"
              title="Duplicate this floor plan"
            >
              <Copy size={14} />
            </button>
          )}

          {isArchived ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRestore && onRestore(plan.id)}
                className="p-2 border border-emerald-200 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Restore floor plan"
              >
                <RotateCcw size={14} />
              </button>

              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (onPermanentDelete) onPermanentDelete(plan.id);
                      else if (onDelete) onDelete(plan.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
                    title="Confirm permanent deletion"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-2 border border-slate-200 hover:border-slate-300 text-slate-400 rounded-xl transition-colors cursor-pointer text-[10px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-rose-500 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Delete permanently"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ) : showArchiveConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { 
                  if (onArchive) onArchive(plan.id);
                  else if (onDelete) onDelete(plan.id);
                  setShowArchiveConfirm(false); 
                }}
                className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors cursor-pointer"
                title="Confirm archive (data is preserved)"
              >
                <Archive size={14} />
              </button>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="p-2 border border-slate-200 hover:border-slate-300 text-slate-400 rounded-xl transition-colors cursor-pointer text-[10px] font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="p-2 border border-slate-200 hover:border-amber-200 hover:text-amber-600 rounded-xl text-slate-500 transition-all duration-200 cursor-pointer"
              title="Archive this floor plan"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FloorPlanGallery({
  floorPlans = [],
  isLoading = false,
  onEdit,
  onCreateNew,
  onDuplicate,
  onDelete,
  onPermanentDelete,
  onArchive,
  onRestore,
  onRename,
}) {
  const [filter, setFilter] = useState("active"); // "active" | "archived" | "all"

  if (isLoading) {
    return <FloorPlanSkeleton />;
  }

  const activePlans = floorPlans.filter(p => !p.isArchived && p.status !== "archived");
  const archivedPlans = floorPlans.filter(p => p.isArchived || p.status === "archived");

  const displayedPlans = filter === "active" ? activePlans : filter === "archived" ? archivedPlans : floorPlans;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Floor Plans</h1>
            <p className="text-sm text-slate-500">
              {activePlans.length === 0
                ? "No active floor plans — create your first one below"
                : `${activePlans.length} active plan${activePlans.length !== 1 ? "s" : ""} · Double-click a name to rename`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === "active" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Active ({activePlans.length})
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === "archived" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Archived ({archivedPlans.length})
            </button>
          </div>

          <button
            onClick={() => onCreateNew && onCreateNew()}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            New Floor Plan
          </button>
        </div>
      </div>

      {/* Empty state */}
      {displayedPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl gap-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
            <LayoutGrid size={36} className="text-indigo-400" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-bold text-slate-700">
              {filter === "archived" ? "No archived floor plans" : "No floor plans yet"}
            </h2>
            <p className="text-xs font-semibold text-slate-400 max-w-xs">
              {filter === "archived" ? "Archived floor plans will appear here." : "Create your first venue floor plan to start designing your event layout with booths, stages, and more."}
            </p>
          </div>
          {filter !== "archived" && (
            <button
              onClick={() => onCreateNew && onCreateNew()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create First Floor Plan</span>
            </button>
          )}
        </div>
      )}

      {/* Plans grid */}
      {displayedPlans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onPermanentDelete={onPermanentDelete || onDelete}
              onArchive={onArchive || onDelete}
              onRestore={onRestore}
              onRename={onRename}
            />
          ))}

          {/* Quick-add card */}
          {filter !== "archived" && (
            <button
              onClick={() => onCreateNew && onCreateNew()}
              className="min-h-[220px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold">Add Another Plan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
