import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  ShieldCheck, RefreshCw, User, Clock, Check, Copy, ExternalLink 
} from 'lucide-react';

interface CuraWebRtcRoomProps {
  roomId: string;
  role?: 'doctor' | 'patient';
  userName?: string;
  onEndCall?: () => void;
  isEmbedded?: boolean;
  secondaryLink?: string;
}

export const CuraWebRtcRoom: React.FC<CuraWebRtcRoomProps> = ({
  roomId,
  role = 'patient',
  userName,
  onEndCall,
  isEmbedded = false,
  secondaryLink
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'waiting' | 'connected' | 'ended' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Normalize room ID: lowercase and alphanumeric
  const cleanId = roomId.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'default-room';
  const doctorPeerId = `cura-doc-${cleanId}`;
  const patientPeerId = `cura-pat-${cleanId}`;

  const myPeerId = role === 'doctor' ? doctorPeerId : patientPeerId;
  const targetPeerId = role === 'doctor' ? patientPeerId : doctorPeerId;

  const directLink = `https://cura-bice.vercel.app/call/${cleanId}`;

  const [cameraError, setCameraError] = useState<string>('');

  // Call timer
  useEffect(() => {
    let interval: any = null;
    if (connectionStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Initialize Camera & Microphone, then PeerJS
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let currentPeer: Peer | null = null;
    let checkTimer: any = null;
    let isCancelled = false;
    let isInitiatingCall = false;
    let activeMediaCall: MediaConnection | null = null;

    let resolveMediaPromise: (stream: MediaStream | null) => void;
    const mediaReadyPromise = new Promise<MediaStream | null>((resolve) => {
      resolveMediaPromise = resolve;
    });

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];

    const attachRemoteStream = (incomingStream: MediaStream) => {
      console.log('[CURA WebRTC] Attaching remote stream with tracks:', incomingStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      setRemoteStream(incomingStream);
      setConnectionStatus('connected');
      isInitiatingCall = false;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = incomingStream;
        remoteVideoRef.current.play().catch(async (err) => {
          console.warn('[CURA WebRTC] Autoplay blocked, attempting muted fallback:', err);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = true;
            try {
              await remoteVideoRef.current.play();
            } catch (e2) {
              console.error('[CURA WebRTC] Could not play remote video:', e2);
            }
          }
        });
      }
    };

    // Helper to bind call events with immediate track listening
    const bindCallEvents = (call: MediaConnection) => {
      if (activeMediaCall && activeMediaCall !== call) {
        try { activeMediaCall.close(); } catch {}
      }
      activeMediaCall = call;
      setActiveCall(call);

      if (call.peerConnection) {
        call.peerConnection.ontrack = (event) => {
          if (isCancelled) return;
          console.log('[CURA WebRTC] Direct track received:', event.track.kind);
          const incomingStream = event.streams[0] || new MediaStream([event.track]);
          attachRemoteStream(incomingStream);
        };

        call.peerConnection.onconnectionstatechange = () => {
          const state = call.peerConnection?.connectionState;
          console.log('[CURA WebRTC] ConnectionState:', state);
          if (state === 'connected') {
            setConnectionStatus('connected');
            isInitiatingCall = false;
          } else if (state === 'failed' || state === 'disconnected') {
            if (!isCancelled) {
              setConnectionStatus('waiting');
              isInitiatingCall = false;
            }
          }
        };
      }

      call.on('stream', (incomingRemoteStream) => {
        if (isCancelled) return;
        console.log('[CURA WebRTC] Stream received via PeerJS:', incomingRemoteStream);
        attachRemoteStream(incomingRemoteStream);
      });

      call.on('close', () => {
        console.log('[CURA WebRTC] Call closed');
        if (isCancelled) return;
        setRemoteStream(null);
        setConnectionStatus('waiting');
        isInitiatingCall = false;
        activeMediaCall = null;
      });

      call.on('error', (err) => {
        console.warn('[CURA WebRTC] Call error:', err);
        isInitiatingCall = false;
      });
    };

    const attemptDirectCall = async () => {
      if (isCancelled || !currentPeer || currentPeer.destroyed) return;
      if (isInitiatingCall) return;

      // Check if we already have an active call with valid remote tracks
      if (activeMediaCall?.open && remoteVideoRef.current?.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream;
        if (stream && stream.getVideoTracks().length > 0) return;
      }

      isInitiatingCall = true;
      // Wait for media to be ready before calling so we don't send an empty 0-track SDP!
      const stream = await mediaReadyPromise;
      if (isCancelled || !currentPeer || currentPeer.destroyed) {
        isInitiatingCall = false;
        return;
      }

      console.log(`[CURA WebRTC] ${role} calling ${targetPeerId} with tracks:`, stream?.getTracks().map(t => t.kind));
      try {
        const outgoingStream = stream || new MediaStream();
        const call = currentPeer.call(targetPeerId, outgoingStream, {
          metadata: { role, userName }
        });
        if (call) {
          bindCallEvents(call);
        }
      } catch (err) {
        console.warn('[CURA WebRTC] Call attempt error:', err);
      } finally {
        setTimeout(() => {
          isInitiatingCall = false;
        }, 2000);
      }
    };

    const createPeerInstance = () => {
      if (isCancelled) return;
      if (currentPeer && !currentPeer.destroyed) {
        try { currentPeer.destroy(); } catch {}
      }

      const newPeer = new Peer(myPeerId, {
        config: { iceServers }
      });

      currentPeer = newPeer;
      setPeer(newPeer);

      newPeer.on('open', (id) => {
        console.log('[CURA WebRTC] Peer opened with ID:', id);
        if (isCancelled) return;
        setConnectionStatus('waiting');
        attemptDirectCall();
      });

      // Answer incoming calls only after mediaReadyPromise resolves with tracks
      newPeer.on('call', async (incomingCall) => {
        console.log('[CURA WebRTC] Incoming call from:', incomingCall.peer);
        const stream = await mediaReadyPromise;
        if (isCancelled) return;
        console.log('[CURA WebRTC] Answering incoming call with tracks:', stream?.getTracks().map(t => t.kind));
        const outgoingStream = stream || new MediaStream();
        incomingCall.answer(outgoingStream);
        bindCallEvents(incomingCall);
      });

      newPeer.on('error', (err: any) => {
        console.warn('[CURA WebRTC] Peer error:', err?.type, err);
        if (err?.type === 'unavailable-id') {
          console.log('[CURA WebRTC] Peer ID busy, retrying in 1.5s...');
          setTimeout(() => {
            if (!isCancelled) {
              createPeerInstance();
            }
          }, 1500);
        } else if (err?.type === 'peer-unavailable') {
          isInitiatingCall = false;
        }
      });
    };

    async function requestMediaStream() {
      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true
          });
        } catch (e) {
          console.warn('[CURA WebRTC] Primary constraints failed, trying fallback:', e);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (e2) {
            console.warn('[CURA WebRTC] Audio-only fallback:', e2);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e3) {
              console.warn('[CURA WebRTC] No media access:', e3);
            }
          }
        }

        if (isCancelled) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          currentStream = stream;
          setLocalStream(stream);

          if (localVideoRef.current) {
            localVideoRef.current.muted = true;
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }

          // If active call had 0 tracks, restart call with real stream
          if (activeMediaCall && activeMediaCall.localStream?.getTracks().length === 0) {
            try { activeMediaCall.close(); } catch {}
            activeMediaCall = null;
          }
        } else {
          setCameraError('Camera/Microphone access not available in this browser.');
        }
      } catch (err: any) {
        console.error('[CURA WebRTC] Camera access failed:', err);
        setCameraError(err?.message || 'Camera permission denied');
      } finally {
        resolveMediaPromise(currentStream);
        if (currentStream) {
          attemptDirectCall();
        }
      }
    }

    setConnectionStatus('initializing');
    createPeerInstance();
    requestMediaStream();

    // Reconnection retry loop every 2.5s if not receiving video
    checkTimer = setInterval(() => {
      if (isCancelled || !currentPeer || currentPeer.destroyed) return;
      if (activeMediaCall?.open && remoteVideoRef.current?.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream;
        if (stream && stream.getVideoTracks().length > 0) return;
      }
      attemptDirectCall();
    }, 2500);

    const cleanupWindow = () => {
      try { currentPeer?.destroy(); } catch {}
      try { currentStream?.getTracks().forEach((t) => t.stop()); } catch {}
    };
    window.addEventListener('beforeunload', cleanupWindow);
    window.addEventListener('pagehide', cleanupWindow);

    return () => {
      isCancelled = true;
      window.removeEventListener('beforeunload', cleanupWindow);
      window.removeEventListener('pagehide', cleanupWindow);
      if (checkTimer) clearInterval(checkTimer);
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
      if (currentPeer) {
        currentPeer.destroy();
      }
    };
  }, [cleanId, myPeerId, targetPeerId, role]);

  // Sync video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.muted = true;
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(async (err) => {
        console.warn('[CURA WebRTC] Remote autoplay fallback:', err);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = true;
          try {
            await remoteVideoRef.current.play();
          } catch {}
        }
      });
    }
  }, [remoteStream]);

  // Toggle Mute
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!audioTracks[0]?.enabled);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!videoTracks[0]?.enabled);
    }
  };

  // Switch Camera (Mobile)
  const flipCamera = async () => {
    if (!localStream) return;
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: !isMicMuted
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack && activeCall?.peerConnection) {
        const sender = activeCall.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old video track
      localStream.getVideoTracks().forEach((t) => t.stop());
      localStream.removeTrack(localStream.getVideoTracks()[0]);
      localStream.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setFacingMode(newFacing);
    } catch (err) {
      console.warn('Could not switch camera:', err);
    }
  };

  // End Call
  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (activeCall) {
      activeCall.close();
    }
    if (peer) {
      peer.destroy();
    }
    setConnectionStatus('ended');
    if (onEndCall) {
      onEndCall();
    }
  };

  const copyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className={`relative flex flex-col w-full h-full bg-slate-950 text-white overflow-hidden select-none ${isEmbedded ? 'rounded-2xl' : 'min-h-screen'}`}>
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs font-semibold tracking-wide text-emerald-200 uppercase">
              {connectionStatus === 'connected' ? 'Connected (Encrypted P2P)' : 'Connecting Room...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono font-medium">{formatDuration(callDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Link Copier */}
          <button
            onClick={copyDirectLink}
            className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-all"
            title="Copy patient join link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedLink ? 'Link Copied!' : 'Copy Room Link'}</span>
          </button>

          {/* Secondary Google Meet fallback */}
          {secondaryLink && (
            <a
              href={secondaryLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/40 text-blue-200 px-3 py-1.5 rounded-lg transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Google Meet Backup</span>
            </a>
          )}
        </div>
      </div>

      {/* Camera / Mic Warning Banner (if blocked in WebView/browser) */}
      {cameraError && (
        <div className="absolute top-14 left-4 right-4 z-40 bg-amber-500/95 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg backdrop-blur-sm border border-amber-400">
          <span className="truncate pr-2">⚠️ Camera blocked. If testing in Expo Go, switch to Chrome.</span>
          <a
            href={directLink}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-950 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0"
          >
            Open Chrome
          </a>
        </div>
      )}

      {/* Main Video Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950">
        {/* Remote Video Stream (Main Fullscreen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className={`w-full h-full object-cover transition-opacity duration-500 ${connectionStatus === 'connected' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Placeholder / Waiting State if Remote Not Yet Connected */}
        {connectionStatus !== 'connected' && connectionStatus !== 'error' && connectionStatus !== 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 rounded-full p-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              {role === 'doctor' ? 'Waiting for Patient to Join...' : 'Connecting to Clinic Doctor...'}
            </h3>
            
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              {role === 'doctor' 
                ? 'Your consultation room is ready. Once the patient opens Join Call, their video will appear here automatically.' 
                : 'Connecting to the clinic doctor. Please stay on this screen. No login required.'}
            </p>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 max-w-sm">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Consultation Room ID</span>
              <code className="text-xs font-mono text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                {cleanId}
              </code>
            </div>
          </div>
        )}

        {/* Error State */}
        {connectionStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
              <VideoOff className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera / Mic Access Needed</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-lg transition-all"
            >
              Retry Access
            </button>
          </div>
        )}

        {/* Ended State */}
        {connectionStatus === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-300">
              <PhoneOff className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Consultation Ended</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6">Call duration: {formatDuration(callDuration)}</p>
            {onEndCall && (
              <button
                onClick={onEndCall}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl border border-slate-700 transition-all"
              >
                Return to CURA
              </button>
            )}
          </div>
        )}

        {/* Local Video Stream (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 z-20 w-32 h-44 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-2xl transition-all">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
              <User className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-[10px] font-medium text-white truncate">You ({role})</span>
            {isMicMuted && <MicOff className="w-3 h-3 text-rose-400" />}
          </div>
        </div>
      </div>

      {/* Floating Control Bar (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-3 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-lg ${
            isMicMuted 
              ? 'bg-rose-600 hover:bg-rose-500 text-white' 
              : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
          }`}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Video */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-lg ${
            isVideoOff 
              ? 'bg-rose-600 hover:bg-rose-500 text-white' 
              : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </button>

        {/* Flip Camera (Mobile) */}
        <button
          onClick={flipCamera}
          className="p-3.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 transition-all duration-200 shadow-lg md:hidden"
          title="Switch Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-xl transition-all active:scale-95"
          title="End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};

export default CuraWebRtcRoom;
