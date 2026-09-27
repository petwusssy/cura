import React from 'react';
import { Page } from '../types';
import { DashboardSkeleton } from './DashboardSkeleton';

/**
 * TablePageSkeleton
 * Matches data table views (Patients, Consultations, Inventory, Receipts, Certs, Beds, Notifications)
 */
export function TablePageSkeleton({ titleWidth = 180 }: { titleWidth?: number }) {
  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="skeleton h-7 rounded-lg" style={{ width: titleWidth }} />
          <div className="skeleton h-3.5 w-48 rounded" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-28 rounded-xl" />
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table Container */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
      >
        {/* Table Header */}
        <div className="grid grid-cols-5 p-4 border-b border-gray-100 gap-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-16 rounded ml-auto" />
        </div>

        {/* Table Rows (8 rows) */}
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 p-4 items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="skeleton skeleton-circle w-9 h-9 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-3.5 w-28 rounded" />
                  <div className="skeleton h-2.5 w-16 rounded" />
                </div>
              </div>
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="flex gap-2 justify-end">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AppointmentCardSkeleton
 * 1:1 match to Appointment card structure (Header, badges, action buttons, preferred date/time, quote, footer)
 */
export function AppointmentCardSkeleton({ isPending = false }: { isPending?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            {/* Patient Name */}
            <div className="skeleton h-5 w-36 rounded-md mb-2" />
            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="skeleton h-5 w-16 rounded" />
              <div className="skeleton h-5 w-20 rounded" />
            </div>
          </div>
          {/* Action icon boxes: Calendar & Trash */}
          <div className="flex gap-2">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="skeleton w-8 h-8 rounded-lg" />
          </div>
        </div>

        {/* Date / Time Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="skeleton w-3.5 h-3.5 rounded" />
            <div className="skeleton h-4 w-44 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton w-3.5 h-3.5 rounded" />
            <div className="skeleton h-4 w-36 rounded" />
          </div>
          {/* Reason Quote Box */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="skeleton h-4 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Footer */}
      {isPending ? (
        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
          <div className="skeleton h-9 flex-1 rounded-lg" />
          <div className="skeleton h-9 flex-1 rounded-lg" />
        </div>
      ) : (
        <div className="mt-auto pt-4 border-t border-gray-100 space-y-1.5">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-4.5 w-56 rounded" />
        </div>
      )}
    </div>
  );
}

/**
 * AppointmentsPageSkeleton
 * Full page skeleton for Appointments view matching search, filters, and cards
 */
export function AppointmentsPageSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="skeleton h-7 w-60 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-64 rounded-full" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <AppointmentCardSkeleton key={i} isPending={i % 3 === 1} />
        ))}
      </div>
    </div>
  );
}

/**
 * TelemedicineCardSkeleton
 * 1:1 match to Telemedicine card structure (Header, badges, camera & trash buttons,
 * preferred date/time, reason box, scheduled session box, status box, action button, secondary buttons)
 */
export function TelemedicineCardSkeleton({ isPending = false }: { isPending?: boolean }) {
  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex justify-between items-start mb-3.5">
          <div>
            {/* Patient Name */}
            <div className="skeleton h-5 w-36 rounded-md mb-2" />
            {/* Badges */}
            <div className="flex items-center gap-1.5">
              <div className="skeleton h-5 w-16 rounded-md" />
              <div className="skeleton h-5 w-16 rounded-md" />
            </div>
          </div>
          {/* Action icon boxes: Video & Trash */}
          <div className="flex items-center gap-1.5">
            <div className="skeleton w-8 h-8 rounded-xl" />
            <div className="skeleton w-8 h-8 rounded-xl" />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="skeleton w-3.5 h-3.5 rounded" />
            <div className="skeleton h-3.5 w-44 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton w-3.5 h-3.5 rounded" />
            <div className="skeleton h-3.5 w-52 rounded" />
          </div>
          {/* Reason for Consultation Box */}
          <div className="mt-2.5 p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5">
            <div className="skeleton h-3 w-32 rounded" />
            <div className="skeleton h-3.5 w-20 rounded" />
          </div>
        </div>
      </div>

      {/* Footer */}
      {isPending ? (
        <div className="flex gap-2.5 mt-2 pt-3.5 border-t border-gray-100">
          <div className="skeleton h-9 flex-1 rounded-xl" />
          <div className="skeleton h-9 w-20 rounded-xl" />
        </div>
      ) : (
        <div className="mt-2 pt-3.5 border-t border-gray-100 space-y-2.5">
          {/* Scheduled Session Box */}
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-3.5 w-44 rounded" />
          </div>

          {/* Time slot status alert */}
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-2.5 flex items-start gap-2">
            <div className="skeleton w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="skeleton h-3.5 w-4/5 rounded" />
              <div className="skeleton h-2.5 w-3/5 rounded" />
            </div>
          </div>

          {/* Video Call Locked / Start Call Button */}
          <div className="skeleton h-10 w-full rounded-xl" />

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <div className="skeleton h-8 flex-1 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TelemedicinePageSkeleton
 * Full page skeleton for Telemedicine view matching header, badges, and card grid
 */
export function TelemedicinePageSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="skeleton h-7 w-48 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-64 rounded-full" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <TelemedicineCardSkeleton key={i} isPending={i % 3 === 1} />
        ))}
      </div>
    </div>
  );
}

/**
 * CardGridSkeleton (Legacy fallback)
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return <AppointmentsPageSkeleton count={count} />;
}

/**
 * FormPageSkeleton
 * Matches forms and details (Patient Form, New Consultation, Settings)
 */
export function FormPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <div className="skeleton h-6 w-48 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        </div>
        <div className="skeleton h-10 w-28 rounded-lg" />
      </div>

      {/* Form Card */}
      <div
        className="bg-white rounded-xl p-6 space-y-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
      >
        <div className="skeleton h-4 w-36 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-24 w-full rounded-lg" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <div className="skeleton h-10 w-24 rounded-lg" />
          <div className="skeleton h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProfilePageSkeleton
 * Matches Patient Profile view
 */
export function ProfilePageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-full animate-in fade-in duration-200">
      {/* Patient Header Banner */}
      <div
        className="bg-white rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
      >
        <div className="flex items-center gap-4">
          <div className="skeleton skeleton-circle w-16 h-16 flex-shrink-0" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-44 rounded" />
            <div className="flex gap-2">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 flex-1 md:w-28 space-y-1">
              <div className="skeleton h-2.5 w-14 rounded" />
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs strip */}
      <div className="flex gap-2 border-b border-gray-100 pb-2">
        {[90, 110, 100, 80].map((w, i) => (
          <div key={i} className="skeleton h-8 rounded-lg" style={{ width: w }} />
        ))}
      </div>

      {/* Content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-xl p-5 space-y-4"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
        >
          <div className="skeleton h-4 w-32 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-gray-50">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          ))}
        </div>

        <div
          className="lg:col-span-2 bg-white rounded-xl p-5 space-y-4"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
        >
          <div className="flex justify-between items-center">
            <div className="skeleton h-4 w-36 rounded" />
            <div className="skeleton h-7 w-24 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 space-y-2">
                <div className="flex justify-between">
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ReportsPageSkeleton
 * Matches Reports & Analytics view
 */
export function ReportsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-full animate-in fade-in duration-200">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-44 rounded-lg" />
          <div className="skeleton h-3.5 w-56 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-10 w-36 rounded-xl" />
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 space-y-3"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div className="skeleton skeleton-circle w-9 h-9" />
            <div className="skeleton h-7 w-16 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 space-y-4"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div className="flex justify-between items-center">
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="h-[220px] flex items-end gap-3 pt-6">
              {[45, 80, 60, 95, 70, 50, 85, 65].map((h, idx) => (
                <div key={idx} className="skeleton flex-1 rounded-t-md" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * BedsPageSkeleton
 * Matches Beds Management view (3 stats KPI cards + 4x2 bed cards grid)
 */
export function BedsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="skeleton h-7 w-48 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-56 rounded-xl" />
      </div>

      {/* 3 Stats KPI cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-100"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="skeleton w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="skeleton h-6 sm:h-7 w-8 rounded" />
              <div className="skeleton h-2.5 sm:h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Bed Grid (8 beds: 4 cols x 2 rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 flex flex-col justify-between border border-gray-100 min-h-[200px]"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="skeleton w-5 h-5 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-3 w-28 rounded-full mb-3" />
            </div>

            {/* Middle patient placeholder */}
            <div className="flex flex-col items-center py-2 space-y-1.5 my-auto">
              <div className="skeleton h-2.5 w-16 rounded" />
              <div className="skeleton h-4 w-28 rounded-full" />
            </div>

            {/* Bottom action buttons */}
            <div className="flex gap-2 w-full mt-auto pt-2">
              <div className="skeleton h-9 flex-1 rounded-lg" />
              <div className="skeleton h-9 w-9 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * InventoryPageSkeleton
 * Matches Pharmacy Inventory view (4 stats KPI cards + search & filters + 6-col table)
 */
export function InventoryPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="skeleton h-7 w-52 rounded-lg" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>

      {/* 4 Stats KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-100"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="skeleton h-7 w-12 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="skeleton h-10 flex-1 max-w-lg rounded-xl" />
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="skeleton h-10 w-56 rounded-xl" />
          <div className="skeleton h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* Table Container */}
      <div
        className="bg-white rounded-xl overflow-hidden border border-gray-100"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
      >
        {/* Table Header (6 cols) */}
        <div className="grid grid-cols-6 p-4 border-b border-gray-100 gap-4">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded ml-auto" />
        </div>

        {/* Table Rows (8 rows) */}
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 p-4 items-center gap-4">
              <div className="space-y-1">
                <div className="skeleton h-3.5 w-32 rounded" />
                <div className="skeleton h-2.5 w-20 rounded" />
              </div>
              <div className="skeleton h-5 w-20 rounded-md" />
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-3.5 w-14 rounded" />
              <div className="skeleton h-5 w-24 rounded-full" />
              <div className="flex gap-2 justify-end">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * NotificationsPageSkeleton
 * Matches Notifications view (Header + 5 filter tabs + list of notification cards)
 */
export function NotificationsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-3xl mx-auto min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-36 rounded-lg" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      {/* Filter Tabs Container */}
      <div className="skeleton h-10 w-full rounded-xl" />

      {/* List of Notification Cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 shadow-xs"
          >
            <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PageSkeleton
 * Smart dispatcher that renders the corresponding skeleton for any active page
 */
export function PageSkeleton({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'appointments':
      return <AppointmentsPageSkeleton />;
    case 'telemedicine':
      return <TelemedicinePageSkeleton />;
    case 'beds':
      return <BedsPageSkeleton />;
    case 'inventory':
      return <InventoryPageSkeleton />;
    case 'notifications':
      return <NotificationsPageSkeleton />;
    case 'patient-form':
    case 'new-consultation':
    case 'new-consultation-tab':
    case 'new-non-consultation-tab':
    case 'convert-consultation-tab':
    case 'settings':
      return <FormPageSkeleton />;
    case 'patient-profile':
      return <ProfilePageSkeleton />;
    case 'reports':
      return <ReportsPageSkeleton />;
    case 'patients':
    case 'consultations':
    case 'non-consultations':
    case 'purchase-receipts':
    case 'medical-certificates':
    case 'search':
    default:
      return <TablePageSkeleton />;
  }
}
