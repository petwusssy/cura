import { useState, useEffect } from 'react';
import { Bell, Clock, BedDouble, AlertTriangle, CheckCheck, X } from 'lucide-react';
import { AppNotification } from '../types';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';
const YELLOW = '#F4C542';

interface NotificationsProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export function Notifications({ notifications, onMarkRead, onMarkAllRead, onDismiss }: NotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'medication' | 'bed'>('all');
  const [localCountdowns, setLocalCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const init: Record<string, number> = {};
    notifications.forEach(n => {
      if (n.type === 'medication' && n.minutesLeft) init[n.id] = n.minutesLeft;
    });
    setLocalCountdowns(init);

    const interval = setInterval(() => {
      setLocalCountdowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] > 0) next[id] = next[id] - 1;
        });
        return next;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [notifications]);

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'medication') return n.type === 'medication';
    if (filter === 'bed') return n.type === 'bed';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    if (type === 'medication') return <Clock size={18} />;
    if (type === 'bed') return <BedDouble size={18} />;
    return <Bell size={18} />;
  };

  const getColor = (n: AppNotification) => {
    if (n.type === 'medication') {
      const mins = localCountdowns[n.id] ?? n.minutesLeft ?? 99;
      return mins <= 10 ? RED : YELLOW;
    }
    if (n.type === 'bed') return '#FF9800';
    return PRIMARY;
  };

  const getTimeAgo = (timeStr: string) => {
    try {
      const diff = new Date().getTime() - new Date(timeStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'medication', label: 'Medication' },
          { id: 'bed', label: 'Beds' },
        ] as { id: typeof filter; label: string }[]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: filter === f.id ? 'white' : 'transparent', color: filter === f.id ? PRIMARY : '#6b7280', boxShadow: filter === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <Bell size={40} className="mx-auto mb-3 text-gray-200" />
            <div className="text-gray-400 font-medium">No notifications</div>
            <div className="text-gray-300 text-sm mt-1">You're all caught up!</div>
          </div>
        ) : filtered.map(n => {
          const color = getColor(n);
          const mins = localCountdowns[n.id] ?? n.minutesLeft;
          const isUrgent = n.type === 'medication' && mins !== undefined && mins <= 10;

          return (
            <div
              key={n.id}
              className={`bg-white rounded-xl p-4 transition-all ${!n.read ? 'border-l-4' : 'border border-gray-100'}`}
              style={{
                boxShadow: !n.read ? '0 4px 16px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                borderLeftColor: !n.read ? color : undefined,
                borderLeft: n.read ? undefined : `4px solid ${color}`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                  {getIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.message}
                      </p>
                      {n.patientName && n.type === 'medication' && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-gray-500">Patient: {n.patientName}</span>
                          {n.nextDose && <span className="text-xs text-gray-400 ml-2">• Next dose: {n.nextDose}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.read && (
                        <button onClick={() => onMarkRead(n.id)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Mark as read">
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button onClick={() => onDismiss(n.id)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Dismiss">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Countdown for medication */}
                  {n.type === 'medication' && mins !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color }}>
                          {mins > 0 ? `${mins} minute${mins !== 1 ? 's' : ''} until next dose` : '⚠ DOSE DUE NOW'}
                        </span>
                        {isUrgent && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white animate-pulse" style={{ background: RED }}>
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${Math.max(0, Math.min(100, ((30 - (mins || 0)) / 30) * 100))}%`,
                          background: isUrgent ? RED : YELLOW,
                        }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">{getTimeAgo(n.time)}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                      style={{ background: `${color}15`, color }}>
                      {n.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
