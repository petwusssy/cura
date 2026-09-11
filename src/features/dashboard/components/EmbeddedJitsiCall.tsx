import { useState } from 'react';
import { 
  Video, ShieldCheck, Maximize2, Minimize2, PhoneOff, 
  ExternalLink, Copy, Check, FileText, ChevronRight, ChevronLeft, 
  User, Calendar, Clock, Heart, AlertTriangle 
} from 'lucide-react';
import { Patient } from '@/types';
import { TelemedicineRequest } from '@/services/telemedicineService';
import { CuraWebRtcRoom } from '@/features/telemedicine/CuraWebRtcRoom';

interface EmbeddedJitsiCallProps {
  request: TelemedicineRequest;
  patient?: Patient;
  onClose: () => void;
}

export function EmbeddedJitsiCall({ request, patient, onClose }: EmbeddedJitsiCallProps) {
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  // Extract clean room name from meeting link or generate standard room
  const extractRoomName = (url?: string) => {
    if (!url) return `CURA-Telemed-${request.id.slice(0, 8)}`;
    try {
      const match = url.match(/CURA-Telemed-[a-zA-Z0-9_-]+/i);
      if (match) return match[0];
      if (url.includes('/call/')) {
        const parts = url.split('/call/');
        return parts[1]?.split('?')[0]?.replace('/', '') || `CURA-Telemed-${request.id.slice(0, 8)}`;
      }
      if (url.includes('meet.jit.si/')) {
        const parts = url.split('meet.jit.si/');
        return parts[1]?.split('?')[0]?.replace('/', '') || `CURA-Telemed-${request.id.slice(0, 8)}`;
      }
    } catch {
      // fallback
    }
    return `CURA-Telemed-${request.id.slice(0, 8)}`;
  };

  const roomName = extractRoomName(request.meeting_link);
  const patientDisplayName = (patient?.name || request.patient_name || request.patient).toUpperCase();
  const directJoinLink = `https://cura-bice.vercel.app/call/${roomName}`;

  // Check if there is an alternative / secondary Google Meet link
  const googleMeetLink = 
    (request.secondary_link && request.secondary_link.includes('meet.google.com')) ? request.secondary_link :
    (request.meeting_link && request.meeting_link.includes('meet.google.com')) ? request.meeting_link :
    request.secondary_link;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directJoinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullScreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col text-white animate-in fade-in duration-200">
      {/* Top Professional Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-[#0B2136] border-b border-slate-800 flex items-center justify-between flex-shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Video size={22} className="text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                CURA Virtual Consultation
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <ShieldCheck size={12} />
                Encrypted Session
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase truncate max-w-[200px] sm:max-w-md">
              {patientDisplayName}
            </h1>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Link Copier */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 active:bg-white/20 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white transition-all border border-white/10"
            title="Copy patient join link"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden md:inline">{copied ? "Link Copied!" : "Copy Patient Link"}</span>
          </button>

          {/* Secondary Google Meet link if present */}
          {googleMeetLink && (
            <a
              href={googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-blue-600/80 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-white transition-all shadow-sm border border-blue-400/30"
              title="Open Google Meet backup"
            >
              <ExternalLink size={14} />
              <span className="hidden lg:inline">Google Meet Backup</span>
            </a>
          )}

          {/* Toggle Patient Notes */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border ${
              showNotes 
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/15'
            }`}
            title="Toggle patient chart"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Patient Chart</span>
            {showNotes ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Toggle fullscreen"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* End Call */}
          <button
            onClick={() => {
              if (window.confirm("End virtual consultation call and return to dashboard?")) {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <PhoneOff size={15} />
            <span>End Call</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* WebRTC Video Room Frame */}
        <div className="flex-1 relative bg-slate-950 flex flex-col">
          <CuraWebRtcRoom
            roomId={roomName}
            role="doctor"
            userName="Clinic Doctor"
            remoteUserName={patientDisplayName}
            onEndCall={onClose}
            isEmbedded={true}
            secondaryLink={googleMeetLink}
          />
        </div>

        {/* Side Patient Chart & Medical Notes Drawer */}
        {showNotes && (
          <aside className="w-80 md:w-96 bg-[#0B132B] border-l border-white/10 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200 z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Patient Summary</h3>
              </div>
              <button 
                onClick={() => setShowNotes(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm text-gray-300">
              {/* Patient Card */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Patient Name</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    {patient?.category || 'Student'}
                  </span>
                </div>
                <div className="font-bold text-base text-white uppercase">
                  {patientDisplayName}
                </div>
                {patient?.id && (
                  <div className="text-xs text-gray-400">
                    ID / Student No: <span className="text-gray-200 font-mono">{patient.id}</span>
                  </div>
                )}
                {patient?.contact && (
                  <div className="text-xs text-gray-400">
                    Contact: <span className="text-gray-200">{patient.contact}</span>
                  </div>
                )}
              </div>

              {/* Consultation Details */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Appointment Info</span>
                <div className="flex items-center gap-2 text-xs text-gray-200">
                  <Calendar size={14} className="text-emerald-400" />
                  <span>{request.scheduled_date || request.preferred_date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-200">
                  <Clock size={14} className="text-emerald-400" />
                  <span>{request.scheduled_time || request.preferred_time}</span>
                </div>
                <div className="pt-1 border-t border-white/5">
                  <span className="text-xs text-gray-400">Chief Complaint / Reason:</span>
                  <p className="mt-1 text-xs text-slate-200 bg-black/30 p-2 rounded-lg italic">
                    "{request.reason || 'No description provided'}"
                  </p>
                </div>
              </div>

              {/* Allergies & Alerts */}
              {patient?.allergies && patient.allergies.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                    <AlertTriangle size={14} />
                    <span>Known Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, idx) => (
                      <span key={idx} className="text-[11px] bg-rose-950/60 text-rose-200 px-2 py-0.5 rounded border border-rose-800/40">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vitals Summary */}
              {patient?.vitals && (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={14} className="text-rose-400" />
                    Latest Vitals
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Blood Pressure</span>
                      <span className="font-bold text-white">{patient.vitals.bloodPressure || '120/80'}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Pulse Rate</span>
                      <span className="font-bold text-white">{patient.vitals.heartRate ? `${patient.vitals.heartRate} bpm` : '72 bpm'}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Temp</span>
                      <span className="font-bold text-white">{patient.vitals.temperature ? `${patient.vitals.temperature}°C` : '36.5°C'}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">SpO2</span>
                      <span className="font-bold text-white">{patient.vitals.oxygenSaturation ? `${patient.vitals.oxygenSaturation}%` : '99%'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default EmbeddedJitsiCall;
