import { Lock, Unlock } from 'lucide-react';

interface MobileFeatureLockButtonProps {
  isLocked: boolean;
  saving?: boolean;
  onToggle: () => void;
}

export function MobileFeatureLockButton({ isLocked, saving = false, onToggle }: MobileFeatureLockButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      title={isLocked ? 'Locked on Mobile App (Coming Soon). Click to unlock.' : 'Unlocked on Mobile App. Click to lock.'}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
        isLocked
          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
      }`}
    >
      {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
      <span>{saving ? 'Updating...' : isLocked ? 'Mobile: Locked (Coming Soon)' : 'Mobile: Unlocked'}</span>
    </button>
  );
}
