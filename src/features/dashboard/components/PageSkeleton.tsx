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
 * CardGridSkeleton
 * Matches card grid views (Appointments, Telemedicine)
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="skeleton h-7 w-48 rounded-lg" />
            <div className="skeleton h-5 w-28 rounded-full" />
          </div>
          <div className="skeleton h-3.5 w-56 rounded" />
        </div>
        <div className="skeleton h-10 w-full sm:w-72 rounded-xl" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 flex flex-col justify-between gap-4"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="skeleton skeleton-circle w-11 h-11 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>

            <div className="space-y-2 py-2 border-y border-gray-50">
              <div className="skeleton h-3 w-40 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>

            <div className="flex gap-2 pt-1">
              <div className="skeleton h-9 flex-1 rounded-xl" />
              <div className="skeleton h-9 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
 * PageSkeleton
 * Smart dispatcher that renders the corresponding skeleton for any active page
 */
export function PageSkeleton({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'appointments':
    case 'telemedicine':
      return <CardGridSkeleton />;
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
    case 'inventory':
    case 'purchase-receipts':
    case 'medical-certificates':
    case 'beds':
    case 'notifications':
    case 'search':
    default:
      return <TablePageSkeleton />;
  }
}
