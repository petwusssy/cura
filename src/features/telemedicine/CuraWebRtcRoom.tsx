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
  remoteUserName?: string;
  onEndCall?: () => void;
  isEmbedded?: boolean;
  secondaryLink?: string;
}

export const CuraWebRtcRoom: React.FC<CuraWebRtcRoomProps> = ({
  roomId,
  role = 'patient',
  userName,
  remoteUserName,
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
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [isRemoteMicMuted, setIsRemoteMicMuted] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const effectiveRemoteName = (remotePeerName || remoteUserName || (role === 'doctor' ? 'Patient' : 'Clinic Doctor')).toUpperCase();

  const dataConnRef = useRef<any>(null);
  const isVideoOffRef = useRef(isVideoOff);
  const isMicMutedRef = useRef(isMicMuted);
  const userNameRef = useRef(userName);

  useEffect(() => {
    isVideoOffRef.current = isVideoOff;
  }, [isVideoOff]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const clean = name.replace(/^(dr\.|doctor|patient)\s*/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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

      const vTracks = incomingStream.getVideoTracks();
      if (vTracks.length === 0) {
        setIsRemoteVideoOff(true);
      } else {
        const isLive = vTracks.some(t => t.enabled && !t.muted && t.readyState === 'live');
        setIsRemoteVideoOff(!isLive);
        vTracks.forEach((t) => {
          t.onmute = () => {
            console.log('[CURA WebRTC] Remote video track muted');
            setIsRemoteVideoOff(true);
          };
          t.onunmute = () => {
            console.log('[CURA WebRTC] Remote video track unmuted');
            setIsRemoteVideoOff(false);
          };
          t.onended = () => {
            setIsRemoteVideoOff(true);
          };
        });
      }

      const aTracks = incomingStream.getAudioTracks();
      aTracks.forEach((t) => {
        t.onmute = () => setIsRemoteMicMuted(true);
        t.onunmute = () => setIsRemoteMicMuted(false);
      });

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

    let activeDataConn: any = null;

    const setupDataConn = (conn: any) => {
      activeDataConn = conn;
      dataConnRef.current = conn;

      conn.on('open', () => {
        console.log('[CURA WebRTC] DataConnection open with:', conn.peer);
        try {
          conn.send({
            type: 'MEDIA_STATE',
            isVideoOff: isVideoOffRef.current,
            isMicMuted: isMicMutedRef.current,
            userName: userNameRef.current || (role === 'doctor' ? 'Clinic Doctor' : 'Patient')
          });
        } catch {}
      });

      conn.on('data', (data: any) => {
        console.log('[CURA WebRTC] DataConnection received:', data);
        if (data?.type === 'MEDIA_STATE') {
          if (typeof data.isVideoOff === 'boolean') {
            setIsRemoteVideoOff(data.isVideoOff);
          }
          if (typeof data.isMicMuted === 'boolean') {
            setIsRemoteMicMuted(data.isMicMuted);
          }
          if (data.userName) {
            setRemotePeerName(data.userName);
          }
        }
      });

      conn.on('close', () => {
        if (activeDataConn === conn) activeDataConn = null;
        if (dataConnRef.current === conn) dataConnRef.current = null;
      });

      conn.on('error', (err: any) => {
        console.warn('[CURA WebRTC] DataConnection error:', err);
      });
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

      // Also ensure DataConnection is active
      if ((!activeDataConn || !activeDataConn.open) && currentPeer && !currentPeer.destroyed) {
        try {
          const conn = currentPeer.connect(targetPeerId);
          setupDataConn(conn);
        } catch (err) {
          console.warn('[CURA WebRTC] DataConnection connect error:', err);
        }
      }

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

      // Handle DataConnection for camera/mic state and name sync
      newPeer.on('connection', (incomingConn) => {
        console.log('[CURA WebRTC] Incoming DataConnection from:', incomingConn.peer);
        setupDataConn(incomingConn);
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

  const broadcastState = (videoOff: boolean, micMuted: boolean) => {
    if (dataConnRef.current?.open) {
      try {
        dataConnRef.current.send({
          type: 'MEDIA_STATE',
          isVideoOff: videoOff,
          isMicMuted: micMuted,
          userName: userName || (role === 'doctor' ? 'Clinic Doctor' : 'Patient')
        });
      } catch (err) {
        console.warn('[CURA WebRTC] Broadcast state error:', err);
      }
    }
  };

  // Toggle Mute
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      const willBeMuted = audioTracks[0]?.enabled ? true : false;
      audioTracks.forEach((track) => {
        track.enabled = !willBeMuted;
      });
      setIsMicMuted(willBeMuted);
      broadcastState(isVideoOff, willBeMuted);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      const willBeOff = videoTracks[0]?.enabled ? true : false;
      videoTracks.forEach((track) => {
        track.enabled = !willBeOff;
      });
      setIsVideoOff(willBeOff);
      broadcastState(willBeOff, isMicMuted);
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
    if (isEmbedded && onEndCall) {
      onEndCall();
    }
  };

  const copyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isRemoteOffCam = 
    isRemoteVideoOff || 
    !remoteStream || 
    remoteStream.getVideoTracks().length === 0 || 
    remoteStream.getVideoTracks().every((t) => t.muted || !t.enabled);

  return (
    <div className={`relative flex flex-col w-full h-full bg-slate-950 text-white overflow-hidden select-none ${isEmbedded ? 'rounded-2xl' : ''}`}>
      {/* Top Header Bar / Floating HUD */}
      {isEmbedded ? (
        <>
          {/* Subtle Embedded Floating Top HUD */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-[#0B2136]/90 border border-emerald-500/30 px-3 py-1 rounded-full shadow-md backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] sm:text-xs font-bold tracking-wide text-emerald-200 uppercase">
                {connectionStatus === 'connected' ? 'Connected (Encrypted P2P)' : 'Connecting...'}
              </span>
            </div>
          </div>

          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-200 bg-[#0B2136]/90 border border-slate-700/80 px-3 py-1 rounded-lg backdrop-blur-md shadow-md font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>
        </>
      ) : (
        /* Standalone / Mobile Full Header (Consistent with CURA Web App Header) */
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-[#0B2136]/95 border-b border-slate-800/90 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner shrink-0">
              <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  CURA Telemed
                </span>
                <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wide text-emerald-200 uppercase">
                    {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
              
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase truncate max-w-[150px] sm:max-w-xs mt-0.5">
                {effectiveRemoteName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Call Duration Timer */}
            <div className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/90 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-sm font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDuration(callDuration)}</span>
            </div>

            {/* Direct Link Copier */}
            <button
              onClick={copyDirectLink}
              className="flex items-center gap-1 text-xs bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all active:scale-95"
              title="Copy patient join link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            {/* Secondary Google Meet fallback */}
            {secondaryLink && (
              <a
                href={secondaryLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/40 text-blue-200 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Google Meet Backup</span>
              </a>
            )}

            {/* Quick End Call Button */}
            {onEndCall && (
              <button
                onClick={handleEndCall}
                className="bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 px-2.5 sm:px-3 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1"
                title="Exit Consultation"
              >
                <PhoneOff className="w-3 h-3" />
                <span className="hidden xs:inline">Exit</span>
              </button>
            )}
          </div>
        </header>
      )}

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
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
        {/* Remote Video Stream (Main Fullscreen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            connectionStatus === 'connected' && !isRemoteOffCam ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Remote Camera Off Indicator State */}
        {connectionStatus === 'connected' && isRemoteOffCam && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#0B132B] animate-in fade-in duration-300">
            {/* Background ambient lighting */}
            <div className="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none -bottom-10" />

            {/* Centered Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#142D54] to-[#1B3A6B] border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl text-emerald-300">
                <span className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white">
                  {getInitials(effectiveRemoteName)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-900 border-2 border-slate-800 rounded-full p-2 text-amber-400 shadow-md">
                <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Participant Name & Category */}
            <h3 className="text-lg sm:text-2xl font-bold text-white uppercase tracking-tight mb-1">
              {effectiveRemoteName}
            </h3>
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-3">
              {role === 'doctor' ? 'Patient' : 'Attending Physician'}
            </span>

            {/* Camera Off Indicator Pill */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-4 py-1.5 rounded-full shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 tracking-wide">
                Camera is turned off
              </span>
            </div>

            {/* Muted Audio Pill if remote mic is muted */}
            {isRemoteMicMuted && (
              <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-800/50 px-3 py-1 rounded-full text-rose-300 text-xs font-medium mt-2">
                <MicOff className="w-3 h-3 text-rose-400" />
                <span>Microphone is muted</span>
              </div>
            )}
          </div>
        )}

        {/* Placeholder / Waiting State if Remote Not Yet Connected */}
        {connectionStatus !== 'connected' && connectionStatus !== 'error' && connectionStatus !== 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#0B132B]">
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
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-emerald-400 shadow-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Consultation Ended</h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 mb-4">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Duration: {formatDuration(callDuration)}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
              {role === 'patient' 
                ? 'Your virtual appointment has concluded. You may now return to the CURA mobile app.' 
                : 'Consultation session concluded. Patient record will be updated in the clinic dashboard.'}
            </p>
            {onEndCall && (
              <button
                onClick={onEndCall}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <span>{role === 'patient' ? 'Return to CURA Mobile App' : 'Return to Dashboard'}</span>
              </button>
            )}
          </div>
        )}

        {/* Local Video Stream (Picture-in-Picture) */}
        <div 
          className="absolute right-3 sm:right-5 z-20 w-28 h-38 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-800/90 bg-[#0B132B] shadow-2xl transition-all"
          style={{ bottom: 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom, 20px)))' }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B132B] text-slate-400 p-2 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700/60 flex items-center justify-center mb-1 text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between bg-black/75 backdrop-blur-sm px-2 py-1 rounded-lg">
            <span className="text-[10px] font-semibold text-white uppercase tracking-wider truncate">
              You ({role})
            </span>
            {isMicMuted && <MicOff className="w-3 h-3 text-rose-400 shrink-0" />}
          </div>
        </div>
      </div>

      {/* Floating Control Dock (Bottom) */}
      <div 
        className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex items-center justify-center pointer-events-none px-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 sm:p-2.5 rounded-full shadow-2xl pointer-events-auto">
          {/* Toggle Mic */}
          <button
            onClick={toggleMic}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 ${
              isMicMuted 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40' 
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/70'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 ${
              isVideoOff 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40' 
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/70'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Flip Camera (Mobile Only) */}
          <button
            onClick={flipCamera}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/70 flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 md:hidden"
            title="Switch Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-all active:scale-95 flex items-center gap-2"
            title="End Consultation"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuraWebRtcRoom;
