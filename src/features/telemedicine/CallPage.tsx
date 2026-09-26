import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { CuraWebRtcRoom } from './CuraWebRtcRoom';
import { ShieldCheck, Heart, Lock, Calendar, Clock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { checkMeetingJoinable, MeetingScheduleStatus } from '@/utils/telemedicineSchedule';
import { getManilaDate, formatManilaDisplayTime } from '@/utils/philippineTime';

export const CallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = (searchParams.get('role') === 'doctor' ? 'doctor' : 'patient') as 'doctor' | 'patient';
  const userName = searchParams.get('name') || (role === 'doctor' ? 'Clinic Doctor' : 'Patient');
  const remoteUserName = searchParams.get('patient') || (role === 'doctor' ? 'Patient' : 'Clinic Doctor');
  const secondaryLink = searchParams.get('secondary') || undefined;

  const isEmbedded = searchParams.get('embedded') === 'true';

  // Schedule Enforcement State
  const [isVerifying, setIsVerifying] = useState(true);
  const [matchedRequest, setMatchedRequest] = useState<any | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<MeetingScheduleStatus | null>(null);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');

  // Clock ticker for live Manila time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeDisplay(formatManilaDisplayTime(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch telemedicine request to verify schedule
  const verifySchedule = async () => {
    if (!roomId) {
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/telemedicine/`);
      if (res.ok) {
        const data = await res.json();
        const cleanId = roomId.replace(/CURA-Telemed-/i, '').toLowerCase();

        // Match by room ID prefix or meeting link
        const found = data.find((r: any) => {
          if (!r.id) return false;
          const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return rIdClean.startsWith(cleanId) ||
                 (r.meeting_link && r.meeting_link.toLowerCase().includes(cleanId));
        });

        if (found) {
          setMatchedRequest(found);
          const schedDate = found.scheduled_date || found.preferred_date;
          const schedTime = found.scheduled_time || found.preferred_time;
          const status = checkMeetingJoinable(schedDate, schedTime);
          setScheduleStatus(status);
        } else {
          // If no matching clinic request is registered, allow entry (ad-hoc room)
          setScheduleStatus({ canJoin: true, status: 'open', message: 'Direct room' });
        }
      } else {
        setScheduleStatus({ canJoin: true, status: 'open', message: 'Direct room' });
      }
    } catch (err) {
      console.warn("Could not verify telemedicine schedule, allowing fallback entry:", err);
      setScheduleStatus({ canJoin: true, status: 'open', message: 'Direct room' });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifySchedule();
  }, [roomId]);

  const handleEndCall = () => {
    // 1. If embedded in React Native WebView
    if ((window as any).ReactNativeWebView) {
      try {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'END_CALL' }));
      } catch (e) {
        (window as any).ReactNativeWebView.postMessage('END_CALL');
      }
      return;
    }

    // 2. If mobile patient: redirect back to mobile app via custom scheme / deep link
    const redirectUrl = searchParams.get('redirect_url') || 'curamobile://telemedicine';
    try {
      window.location.href = redirectUrl;
    } catch (e) {}

    if (role === 'patient') {
      try {
        window.close();
      } catch (e) {}
      return;
    }

    // 3. Desktop doctor fallback
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate('/');
      }
    }, 400);
  };

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B1C33] via-[#071426] to-[#040C18] text-white font-['Plus_Jakarta_Sans',sans-serif] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 shadow-xl">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold mb-2 text-white">Invalid Consultation Link</h2>
        <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
          No active consultation room specified. Please open the link provided in your CURA appointments.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#1B3A6B] hover:bg-[#142D54] text-white text-xs font-bold py-3 px-7 rounded-xl shadow-lg transition-all active:scale-95 border border-white/10"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Verification Loading Screen
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B1C33] via-[#071426] to-[#040C18] text-white font-['Plus_Jakarta_Sans',sans-serif] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1B3A6B]/80 border border-blue-400/30 flex items-center justify-center mb-4 shadow-xl">
          <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
        </div>
        <h3 className="text-lg font-bold mb-1">Verifying Consultation Schedule</h3>
        <p className="text-xs text-slate-400">Connecting to CURA clinic appointment system...</p>
      </div>
    );
  }

  // Room Locked Screen (Outside scheduled hours)
  if (scheduleStatus && !scheduleStatus.canJoin) {
    const isUpcoming = scheduleStatus.status === 'upcoming';
    const schedDate = matchedRequest?.scheduled_date || matchedRequest?.preferred_date;
    const schedTime = matchedRequest?.scheduled_time || matchedRequest?.preferred_time;

    return (
      <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-b from-[#0B1C33] via-[#071426] to-[#040C18] text-white font-['Plus_Jakarta_Sans',sans-serif] flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-[#0D213B]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
          {/* Status Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg border ${
            isUpcoming 
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}>
            <Lock className="w-8 h-8" />
          </div>

          {/* Title */}
          <span className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border mb-3 ${
            isUpcoming 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
              : 'bg-slate-700/40 border-slate-600 text-slate-300'
          }`}>
            {isUpcoming ? 'Meeting Room Locked' : 'Consultation Concluded'}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
            {isUpcoming ? 'Consultation Not Yet Started' : 'Consultation Window Closed'}
          </h2>

          <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-xs">
            {isUpcoming
              ? 'For privacy and compliance, video consultation rooms only unlock 15 minutes before the scheduled appointment.'
              : 'The scheduled time window for this appointment has concluded. Please contact the clinic for a new booking.'}
          </p>

          {/* Schedule Summary Card */}
          <div className="w-full bg-[#081526]/80 rounded-2xl p-4 border border-white/10 mb-6 text-left space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-400" />
                Scheduled Date:
              </span>
              <span className="font-bold text-white">{schedDate || 'Pending'}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" />
                Scheduled Time:
              </span>
              <span className="font-bold text-white">{schedTime || 'Pending'}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lock size={13} className="text-amber-400" />
                Room Unlocks:
              </span>
              <span className="font-bold text-amber-300">
                {scheduleStatus.opensAt ? `${scheduleStatus.opensAt} (15m before)` : (schedTime || 'At scheduled time')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                Philippine Time (Now):
              </span>
              <span className="font-mono text-xs font-bold text-emerald-300">
                {currentTimeDisplay || 'UTC+8'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={verifySchedule}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Refresh Schedule Status</span>
            </button>

            <button
              onClick={handleEndCall}
              className="w-full bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>{role === 'patient' ? 'Leave & Return to App' : 'Return to Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Consultation Room
  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-b from-[#0B1C33] via-[#071426] to-[#040C18] text-white font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden flex flex-col">
      <CuraWebRtcRoom
        roomId={roomId}
        role={role}
        userName={userName}
        remoteUserName={remoteUserName}
        onEndCall={handleEndCall}
        isEmbedded={isEmbedded}
        secondaryLink={secondaryLink}
      />
    </div>
  );
};

export default CallPage;
