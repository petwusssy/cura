import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Lock, Delete, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { staffService, ClinicStaffMember } from '@/services/staffService';

interface StaffPinModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDetails?: string;
  onSuccess: (staff: ClinicStaffMember) => void;
  onCancel: () => void;
}

export function StaffPinModal({
  isOpen,
  actionTitle,
  actionDetails,
  onSuccess,
  onCancel,
}: StaffPinModalProps) {
  const [pin, setPin] = useState('');
  const [keepShift, setKeepShift] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedStaff, setVerifiedStaff] = useState<ClinicStaffMember | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsVerifying(false);
      setVerifiedStaff(null);
    }
  }, [isOpen]);

  const verifyEnteredPin = useCallback(
    async (enteredPin: string) => {
      if (enteredPin.length !== 4 || isVerifying) return;
      setIsVerifying(true);
      setError(null);
      try {
        const staff = await staffService.verifyPin(enteredPin);
        setVerifiedStaff(staff);
        if (keepShift) {
          staffService.setActiveShift(staff, 15);
        }
        setTimeout(() => {
          onSuccess(staff);
        }, 220);
      } catch (err: any) {
        setError(err?.message || 'Invalid 4-digit PIN.');
        setPin('');
        setIsVerifying(false);
      }
    },
    [isVerifying, keepShift, onSuccess]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isVerifying || verifiedStaff) return;
      setError(null);
      setPin(prev => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => verifyEnteredPin(next), 40);
        }
        return next;
      });
    },
    [isVerifying, verifiedStaff, verifyEnteredPin]
  );

  const handleBackspace = useCallback(() => {
    if (isVerifying || verifiedStaff) return;
    setError(null);
    setPin(prev => prev.slice(0, -1));
  }, [isVerifying, verifiedStaff]);

  const handleClear = useCallback(() => {
    if (isVerifying || verifiedStaff) return;
    setError(null);
    setPin('');
  }, [isVerifying, verifiedStaff]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDigit, handleBackspace, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #0d213f 0%, #1B3A6B 60%, #2465ad 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <ShieldCheck size={19} className="text-[#F4C542]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Clinic Staff PIN Sign-Off</h3>
              <p className="text-[11px] text-blue-100/80">Enter your 4-digit staff PIN to confirm</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Action summary badge */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-3.5 py-2.5">
            <div className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
              {actionTitle}
            </div>
            {actionDetails && (
              <div className="text-xs text-gray-600 mt-0.5 truncate">{actionDetails}</div>
            )}
          </div>

          {/* 4-Digit PIN Dots Display */}
          <div className="flex justify-center gap-3 py-1">
            {[0, 1, 2, 3].map(idx => {
              const filled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-13 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                    verifiedStaff
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 scale-105'
                      : error
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : filled
                      ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B] shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}
                >
                  {filled ? '●' : ''}
                </div>
              );
            })}
          </div>

          {/* Status / Error / Verified Feedback */}
          {verifiedStaff ? (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
              <span>
                Verified: {verifiedStaff.name} ({verifiedStaff.role})
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <Lock size={12} />
              <span>Type on keyboard or tap keypad below</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
              <button
                key={digit}
                type="button"
                disabled={isVerifying || Boolean(verifiedStaff)}
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-200 active:scale-95 text-base font-bold text-gray-800 transition-all cursor-pointer shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={isVerifying || Boolean(verifiedStaff)}
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 text-xs font-bold text-gray-600 transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={isVerifying || Boolean(verifiedStaff)}
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-200 active:scale-95 text-base font-bold text-gray-800 transition-all cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isVerifying || Boolean(verifiedStaff)}
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 flex items-center justify-center text-gray-600 transition-all cursor-pointer"
            >
              <Delete size={17} />
            </button>
          </div>

          {/* 15-Minute Shift Toggle */}
          <label className="flex items-center gap-2.5 pt-1 px-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepShift}
              onChange={e => setKeepShift(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
            />
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Clock size={13} className="text-[#1B3A6B]" />
              Keep my PIN active for 15 minutes (Shift Mode)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
