import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  ShieldCheck, RefreshCw, Volume2, User, Clock, Check, Copy, ExternalLink 
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

  // Normalize room ID
  const cleanId = roomId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'default-room';
  const myPeerId = role === 'doctor' ? `cura-doc-${cleanId}` : `cura-pat-${cleanId}`;
  const targetPeerId = role === 'doctor' ? `cura-pat-${cleanId}` : `cura-doc-${cleanId}`;

  // Direct shareable link
  const directLink = `https://cura-bice.vercel.app/call/${cleanId}`;

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
    let retryInterval: any = null;
    let isCancelled = false;

    async function setupMediaAndPeer() {
      try {
        setConnectionStatus('initializing');

        // Request media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        currentStream = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize PeerJS with public STUN configuration
        const newPeer = new Peer(myPeerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ]
          }
        });

        currentPeer = newPeer;
        setPeer(newPeer);

        newPeer.on('open', (id) => {
          console.log('[CURA WebRTC] Peer open with ID:', id);
          if (!isCancelled) {
            setConnectionStatus('waiting');
          }
        });

        // Answer incoming calls
        newPeer.on('call', (call) => {
          console.log('[CURA WebRTC] Incoming call from:', call.peer);
          call.answer(stream);
          setActiveCall(call);

          call.on('stream', (incomingRemoteStream) => {
            console.log('[CURA WebRTC] Received remote stream from answer');
            if (isCancelled) return;
            setRemoteStream(incomingRemoteStream);
            setConnectionStatus('connected');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = incomingRemoteStream;
            }
          });

          call.on('close', () => {
            console.log('[CURA WebRTC] Call closed by remote peer');
            setRemoteStream(null);
            setConnectionStatus('waiting');
          });

          call.on('error', (err) => {
            console.warn('[CURA WebRTC] Call error:', err);
          });
        });

        newPeer.on('error', (err: any) => {
          console.warn('[CURA WebRTC] Peer error:', err);
          if (err.type === 'unavailable-id') {
            // Already connected or temporary conflict, try joining as client
            console.log('[CURA WebRTC] Peer ID busy, trying fallback peer connection');
          } else if (err.type === 'peer-unavailable') {
            // Target not online yet, keep waiting
          } else {
            setErrorMessage(err.message || 'Connection error');
          }
        });

        // If Patient, poll/try calling the Doctor every 2.5s until connected
        // If Doctor, also poll/try calling Patient in case Patient arrived first
        retryInterval = setInterval(() => {
          if (isCancelled || !currentPeer || currentPeer.destroyed) return;
          if (connectionStatus === 'connected') return;

          try {
            console.log(`[CURA WebRTC] Probing connection to ${targetPeerId}...`);
            const outgoingCall = currentPeer.call(targetPeerId, stream);
            if (outgoingCall) {
              outgoingCall.on('stream', (incomingRemoteStream) => {
                console.log('[CURA WebRTC] Received remote stream from probe call');
                if (isCancelled) return;
                setRemoteStream(incomingRemoteStream);
                setConnectionStatus('connected');
                setActiveCall(outgoingCall);
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = incomingRemoteStream;
                }
              });

              outgoingCall.on('close', () => {
                setRemoteStream(null);
                setConnectionStatus('waiting');
              });
            }
          } catch {
            // ignore retry errors
          }
        }, 2500);

      } catch (err: any) {
        console.error('[CURA WebRTC] Setup failed:', err);
        setConnectionStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Camera or Microphone access was denied. Please allow camera and mic permissions in your browser settings.');
        } else {
          setErrorMessage(err.message || 'Could not access camera/microphone.');
        }
      }
    }

    setupMediaAndPeer();

    return () => {
      isCancelled = true;
      if (retryInterval) clearInterval(retryInterval);
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
      if (currentPeer) {
        currentPeer.destroy();
      }
    };
  }, [cleanId, myPeerId, targetPeerId]);

  // Sync video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
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

      {/* Main Video Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950">
        {/* Remote Video Stream (Main Fullscreen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
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
                ? 'Your secure video room is active. Once the patient taps Join Call in their app, their video will appear here automatically.' 
                : 'Please stay on this screen. No login required. Your doctor will connect with you momentarily.'}
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
                Close Window
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
