"use client";

import React from "react";

/**
 * Base Skeleton Primitive
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      {...props}
    />
  );
}

/**
 * 1. Overview Skeleton
 */
export function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 border border-slate-150 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
            <Skeleton className="h-8 w-36 rounded-xl" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Grid: Registration Velocity (8 cols) + Ticket Tiers (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Registration Velocity Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-52 rounded-xl" />
              <Skeleton className="h-3.5 w-72 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>

          {/* Chart Canvas Area */}
          <div className="h-[230px] w-full flex items-end justify-between gap-2 px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
            {[40, 65, 30, 80, 55, 90, 70, 45, 85, 60, 95, 75].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton
                  className="w-full rounded-t-lg opacity-60"
                  style={{ height: `${h}%` }}
                />
                <Skeleton className="h-2.5 w-6 rounded-xs" />
              </div>
            ))}
          </div>

          {/* X-Axis Dates */}
          <div className="flex justify-between border-t border-slate-100 pt-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-3 w-12 rounded-md" />
            ))}
          </div>
        </div>

        {/* Ticket Tiers Breakdown Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <Skeleton className="h-6 w-44 rounded-xl" />
            <Skeleton className="h-3.5 w-56 rounded-md" />
          </div>

          {/* Tier Items */}
          <div className="space-y-3.5 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between items-center text-xs">
                  <Skeleton className="h-3 w-20 rounded-xs" />
                  <Skeleton className="h-3 w-14 rounded-xs" />
                </div>
              </div>
            ))}
          </div>

          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      </div>

      {/* Bottom Row: Quick Status Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-80 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

/**
 * 2. Generic Table View Skeleton (Attendees, Speakers, Sponsors, Tickets, etc.)
 */
export function TableViewSkeleton({ rowsCount = 8 }) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl hidden md:block" />
          <Skeleton className="h-10 w-32 rounded-xl hidden md:block" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden">
        {/* Table Header Row */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-150">
          <div className="col-span-4 flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="col-span-2 hidden md:block">
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="col-span-2 hidden sm:block">
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="col-span-1 flex justify-end">
            <Skeleton className="h-4 w-8 rounded-md" />
          </div>
        </div>

        {/* Table Data Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rowsCount }).map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors"
            >
              {/* Column 1: Identity & Avatar */}
              <div className="col-span-4 flex items-center gap-3.5 min-w-0">
                <Skeleton className="h-4 w-4 rounded-md shrink-0" />
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-xs" />
                </div>
              </div>

              {/* Column 2: Organization / Details */}
              <div className="col-span-3 space-y-1">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-xs" />
              </div>

              {/* Column 3: Badge / Role */}
              <div className="col-span-2 hidden md:block">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              {/* Column 4: Status */}
              <div className="col-span-2 hidden sm:block">
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>

              {/* Column 5: Action Menu */}
              <div className="col-span-1 flex justify-end">
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Calendar View Skeleton (Schedule & Tracks)
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-2xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Date Navigation Strip */}
      <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-xs flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex items-center gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-24 rounded-xl shrink-0" />
          ))}
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Tracks & Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((track) => (
          <div
            key={track}
            className="bg-white rounded-3xl p-5 border border-slate-150 shadow-xs space-y-4"
          >
            {/* Track Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {/* Session Cards */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-3 w-4/5 rounded-xs" />
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Analytics Command Center Skeleton
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 5 Executive KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-28 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-xs" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-8 w-36 rounded-xl" />
          </div>
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>

        <div className="lg:col-span-1 bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-xs space-y-4">
          <Skeleton className="h-6 w-40 rounded-xl border-b border-slate-100 pb-3" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-2xl space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-3.5 w-14 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Demographics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 border border-slate-150 shadow-xs space-y-4"
          >
            <Skeleton className="h-5 w-40 rounded-lg pb-1" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-3.5 w-12 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. Logistics View Skeleton
 */
export function LogisticsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-3"
          >
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-xs" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-xl" />
        ))}
      </div>

      {/* Logistics Data Table */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-xs" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Documents View Skeleton
 */
export function DocumentsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 border border-slate-150 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-xs" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Skeleton className="h-3 w-20 rounded-xs" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. Forms View Skeleton
 */
export function FormsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-2xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 border border-slate-150 shadow-xs space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-xs" />
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 8. RSVP View Skeleton
 */
export function RSVPSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-3"
          >
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-xl" />
            <Skeleton className="h-3 w-16 rounded-xs" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-150 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-xs" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 9. Event Details / Page Builder Skeleton
 */
export function EventDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-2xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-xl" />
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 10. Floor Plan Gallery Skeleton
 */
export function FloorPlanSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 border border-slate-150 shadow-xs space-y-4"
          >
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <Skeleton className="h-3.5 w-24 rounded-xs" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 11. Organizer Events Hub Skeleton
 */
export function EventsHubSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 border border-slate-150 shadow-xs space-y-3"
          >
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-xs" />
          </div>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl overflow-hidden border border-slate-150 shadow-xs space-y-4 p-5"
          >
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-xs" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 12. Public Event Landing Page Skeleton (100% accurate to EventPublicLandingPage.js)
 */
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col animate-fade-in text-left">
      {/* 1. Sticky Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center">
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>

        {/* Center: In-Page Navigation Links */}
        <nav className="hidden lg:flex items-center justify-center gap-7">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </nav>

        {/* Right: Language Selector & CTA */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl bg-blue-600/30" />
        </div>
      </header>

      {/* 2. Top Media Frame & Showcase Container */}
      <section className="relative bg-white pt-6 pb-2 sm:pt-8 sm:pb-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Main Media Showcase (16:9 Aspect Ratio) */}
          <div className="relative aspect-video sm:aspect-21/9 lg:aspect-16/9 max-h-[500px] w-full rounded-3xl bg-slate-900 border border-slate-200/90 shadow-xl overflow-hidden flex items-center justify-center">
            <div className="space-y-3 text-center flex flex-col items-center">
              <Skeleton className="w-14 h-14 rounded-full bg-slate-800" />
              <Skeleton className="h-4 w-40 rounded-md bg-slate-800" />
            </div>
          </div>

          {/* Media Thumbnails Strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-24 rounded-2xl shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Hero Event Details & Quick Meta Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 sm:h-12 w-4/5 rounded-2xl" />
            <Skeleton className="h-5 w-3/5 rounded-lg" />
            
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Skeleton className="h-8 w-44 rounded-xl" />
              <Skeleton className="h-8 w-52 rounded-xl" />
              <Skeleton className="h-8 w-32 rounded-xl" />
            </div>
          </div>

          {/* Countdown & Quick Action Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 shrink-0 lg:w-80">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-2.5 rounded-2xl border border-slate-150 text-center space-y-1">
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-2.5 w-full rounded-xs" />
                </div>
              ))}
            </div>
            <Skeleton className="h-11 w-full rounded-xl bg-blue-600/40" />
          </div>
        </div>
      </section>

      {/* 4. About & Event Summary Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full border-t border-slate-100 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
            <Skeleton className="h-6 w-36 rounded-lg" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-200/60 last:border-0">
                <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Speakers Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full border-t border-slate-100 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 flex flex-col items-center">
          <Skeleton className="h-8 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 text-center flex flex-col items-center">
              <Skeleton className="w-24 h-24 rounded-2xl" />
              <div className="space-y-1.5 w-full flex flex-col items-center">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-xs" />
                <Skeleton className="h-3 w-28 rounded-xs" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* 6. Agenda & Program Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full border-t border-slate-100 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-2xl" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-12 rounded-2xl shrink-0" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-64 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Passes & Tickets Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full border-t border-slate-100 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 flex flex-col items-center">
          <Skeleton className="h-8 w-60 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-40 rounded-xl" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>

              <div className="space-y-3 py-4 border-t border-slate-100">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-4/5 rounded-xs" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-11 w-full rounded-2xl bg-blue-600/30" />
            </div>
          ))}
        </div>
      </section>

      {/* 8. Sponsors & Partners Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full border-t border-slate-100 space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Skeleton className="h-7 w-48 rounded-xl" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-3">
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* 9. Clean Footer */}
      <footer className="bg-slate-950 text-white mt-12 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 rounded-lg bg-slate-800" />
            <Skeleton className="h-3.5 w-64 rounded-md bg-slate-800" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl bg-slate-800" />
            <Skeleton className="w-9 h-9 rounded-xl bg-slate-800" />
            <Skeleton className="w-9 h-9 rounded-xl bg-slate-800" />
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * 13. Public Main Home Page Skeleton (100% accurate to MainHomePage.js)
 */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-fade-in text-left">
      {/* Top Universal Nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <Skeleton className="h-7 w-32 rounded-lg" />
        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl bg-blue-600/30" />
        </div>
      </header>

      {/* Hero Rolling Showcase */}
      <section className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div className="relative h-[380px] sm:h-[440px] rounded-3xl bg-slate-900 border border-slate-200 overflow-hidden p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-4 max-w-xl">
            <Skeleton className="h-6 w-28 rounded-full bg-slate-800" />
            <Skeleton className="h-10 sm:h-12 w-full rounded-2xl bg-slate-800" />
            <Skeleton className="h-4 w-3/4 rounded-md bg-slate-800" />
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-36 rounded-2xl bg-blue-600/40" />
              <Skeleton className="h-11 w-32 rounded-2xl bg-slate-800" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full bg-slate-800" />
              <Skeleton className="w-8 h-8 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-11 w-full sm:w-80 rounded-2xl" />
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Skeleton className="h-11 w-36 rounded-2xl" />
              <Skeleton className="h-11 w-36 rounded-2xl" />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* Featured Events Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-150 shadow-xs space-y-4 p-5">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-48 rounded-md" />
                  <Skeleton className="h-3.5 w-full rounded-xs" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 14. Profile Skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6 animate-fade-in text-left">
      <div className="bg-white rounded-3xl p-8 border border-slate-150 shadow-xs space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="space-y-2.5 flex-1">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 15. Developers Skeleton
 */
export function DevelopersSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in text-left w-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 rounded-xl" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-xl" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-150 shadow-xs space-y-4">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

