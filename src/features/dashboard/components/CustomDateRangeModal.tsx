import React, { useState, useEffect } from 'react';
import { Calendar, X, Check, RotateCcw } from 'lucide-react';
import { getManilaDate, getManilaDaysAgo } from '@/utils/philippineTime';

const PRIMARY = '#1B3A6B';

interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (from: string, to: string) => void;
  initialFrom?: string;
  initialTo?: string;
  title?: string;
  description?: string;
}

export function CustomDateRangeModal({
  isOpen,
  onClose,
  onApply,
  initialFrom = '',
  initialTo = '',
  title = 'Select Custom Date Range',
  description = 'Choose the start and end dates to filter records.',
}: CustomDateRangeModalProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setFrom(initialFrom);
      setTo(initialTo);
      setError(null);
    }
  }, [isOpen, initialFrom, initialTo]);

  if (!isOpen) return null;

  const today = getManilaDate();

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (from && to && from > to) {
      setError('Start date cannot be after End date.');
      return;
    }
    setError(null);
    onApply(from, to);
    onClose();
  };

  const handleQuickPreset = (type: 'today' | 'last7' | 'month') => {
    setError(null);
    if (type === 'today') {
      setFrom(today);
      setTo(today);
    } else if (type === 'last7') {
      setFrom(getManilaDaysAgo(7));
      setTo(today);
    } else if (type === 'month') {
      const startOfMonth = `${today.slice(0, 7)}-01`;
      setFrom(startOfMonth);
      setTo(today);
    }
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${PRIMARY}15`, color: PRIMARY }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-snug">{title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleApply} className="p-6 space-y-5">
          {/* Quick presets */}
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Quick Shortcuts
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('today')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('last7')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('month')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                This Month
              </button>
              {(from || to) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 ml-auto"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                From (Start Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1B3A6B] focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                To (End Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1B3A6B] focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
              style={{ background: PRIMARY }}
            >
              <Check size={16} /> Apply Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
