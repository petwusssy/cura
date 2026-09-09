import { useEffect, useRef, useState } from 'react';
import { Video, ShieldCheck, Maximize2, Minimize2, PhoneOff, ExternalLink, Copy, Check, FileText, ChevronRight, ChevronLeft, User, Calendar, Clock } from 'lucide-react';
import { Patient } from '@/types';
import { TelemedicineRequest } from '@/services/telemedicineService';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

interface EmbeddedJitsiCallProps {
  request: TelemedicineRequest;
  patient?: Patient;
  onClose: () => void;
}

export function EmbeddedJitsiCall({ request, patient, onClose }: EmbeddedJitsiCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  // Extract clean room name from meeting link or generate standard room
  const extractRoomName = (url?: string) => {
    if (!url) return `CURA-Telemed-${request.id.slice(0, 8)}`;
    try {
      if (url.includes('meet.jit.si/')) {
        const parts = url.split('meet.jit.si/');
        return parts[1] || `CURA-Telemed-${request.id.slice(0, 8)}`;
      }
    } catch {
      // fallback
    }
    return `CURA-Telemed-${request.id.slice(0, 8)}`;
  };

  const roomName = extractRoomName(request.meeting_link);
  const patientDisplayName = (patient?.name || request.patient_name || request.patient).toUpperCase();
  const directJoinLink = `https://meet.jit.si/${roomName}`;

  // Check if there is an alternative / secondary Google Meet link
  const googleMeetLink = 
    (request.secondary_link && request.secondary_link.includes('meet.google.com')) ? request.secondary_link :
    (request.meeting_link && request.meeting_link.includes('meet.google.com')) ? request.meeting_link :
    request.secondary_link;

  useEffect(() => {
    let isMounted = true;

    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const existingScript = document.getElementById('jitsi-external-api-script');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          return;
        }
        const script = document.createElement('script');
        script.id = 'jitsi-external-api-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi API'));
        document.body.appendChild(script);
      });
    };

    loadJitsiScript()
      .then(() => {
        if (!isMounted || !containerRef.current) return;
        
        // Dispose existing if any
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
        }

        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: 'Clinic Doctor / Staff (CURA)',
            email: 'clinic@ua.edu.ph'
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            toolbarButtons: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting',
              'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat',
              'recording', 'livestreaming', 'etherpad', 'sharedvideo', 'settings',
              'raisehand', 'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'select-background', 'download', 'help', 'mute-everyone',
              'security'
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            DEFAULT_REMOTE_DISPLAY_NAME: patientDisplayName,
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          if (isMounted) setLoading(false);
        });

        api.addEventListener('videoConferenceLeft', () => {
          onClose();
        });

        api.addEventListener('readyToClose', () => {
          onClose();
        });

        // Set loading false after safety timeout if event didn't fire
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 2500);
      })
      .catch((err) => {
        console.error('Jitsi error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomName]);

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
      <header className="h-16 px-4 sm:px-6 bg-[#1B3A6B] border-b border-blue-900/50 flex items-center justify-between flex-shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/10 shadow-inner">
            <Video size={22} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded">
                CURA Virtual Clinic
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Secondary Google Meet option button */}
          {googleMeetLink && (
            <a
              href={googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 hover:text-white text-xs font-semibold transition-all shadow-sm"
              title="Open secondary Google Meet session in a new tab"
            >
              <ExternalLink size={14} />
              Open Google Meet
            </a>
          )}

          {/* Copy Patient Invite */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-blue-100 hover:text-white transition-all"
            title="Copy patient invite link"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {/* Toggle Patient Notes Panel */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showNotes 
                ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' 
                : 'bg-white/10 border-white/15 text-white/70 hover:text-white'
            }`}
            title={showNotes ? "Hide patient chart" : "Show patient chart"}
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
        {/* Jitsi Video Frame Container */}
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
          {loading && (
            <div className="absolute inset-0 bg-[#0B1120] flex flex-col items-center justify-center z-10 p-6 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border-2 border-blue-400/40 flex items-center justify-center text-blue-400 animate-pulse">
                  <Video size={36} />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B1120] animate-ping" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Connecting to Secure Video Room...</h2>
              <p className="text-sm text-gray-400 max-w-md mb-6">
                Setting up high-definition WebRTC connection for <span className="text-blue-300 font-semibold uppercase">{patientDisplayName}</span>.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={14} className="text-emerald-400" />
                No plug-in required • End-to-end encrypted
              </div>
            </div>
          )}

          {/* Video Container where Jitsi iframe will mount */}
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Side Patient Chart & Medical Notes Drawer */}
        {showNotes && (
          <aside className="w-80 md:w-96 bg-[#0B132B] border-l border-white/10 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200 z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-400" />
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
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
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
                {patient?.age && (
                  <div className="text-xs text-gray-400">
                    Age / Gender: <span className="text-gray-200">{patient.age} yrs • {patient.gender || 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Consultation Details */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">Appointment Info</h4>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Calendar size={14} className="text-blue-400" />
                  <span>Scheduled Date: {request.scheduled_date || request.preferred_date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Clock size={14} className="text-blue-400" />
                  <span>Scheduled Time: {request.scheduled_time || request.preferred_time}</span>
                </div>
              </div>

              {/* Chief Complaint / Reason */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Chief Complaint / Reason</h4>
                <div className="p-3 bg-black/40 rounded-lg text-xs leading-relaxed text-gray-200 border border-white/5 italic">
                  "{request.reason || 'No description provided.'}"
                </div>
              </div>

              {/* Fallback Google Meet notice */}
              {googleMeetLink && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                    <span>Alternative Video Link</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">Secondary</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    If patient has issues connecting through in-app video, share or open this Google Meet link:
                  </p>
                  <a
                    href={googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <ExternalLink size={14} />
                    Launch Google Meet
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Quick Help */}
            <div className="p-3 border-t border-white/10 bg-black/20 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Room: {roomName.slice(0, 16)}...</span>
              <button 
                onClick={handleCopyLink} 
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                {copied ? 'Copied' : 'Copy Room Link'}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
