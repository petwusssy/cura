import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  ShieldCheck, RefreshCw, User, Clock, Check, Copy, ExternalLink, Volume2, FlipHorizontal 
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
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());

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
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);
  const [isRemoteMirrored, setIsRemoteMirrored] = useState(true);
  const [isLocalMirrored, setIsLocalMirrored] = useState(true);

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

    const playRemoteAudio = (stream: MediaStream) => {
      if (!remoteAudioRef.current) return;
      if (remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
      }
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().then(() => {
        console.log('[CURA WebRTC] Remote audio playback active');
        setAudioNeedsInteraction(false);
      }).catch((err) => {
        console.warn('[CURA WebRTC] Audio autoplay blocked, waiting for user gesture:', err);
        setAudioNeedsInteraction(true);
      });
    };

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
      if (aTracks.length > 0) {
        aTracks.forEach((t) => {
          t.enabled = true;
          t.onmute = () => {
            console.log('[CURA WebRTC] Remote audio track muted');
            setIsRemoteMicMuted(true);
          };
          t.onunmute = () => {
            console.log('[CURA WebRTC] Remote audio track unmuted');
            setIsRemoteMicMuted(false);
          };
        });
        setIsRemoteMicMuted(aTracks.every(t => !t.enabled || t.muted));
      }

      // Video element is muted so browser autoplay policy NEVER blocks video rendering
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== incomingStream) {
          remoteVideoRef.current.srcObject = incomingStream;
        }
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch((err) => {
          console.warn('[CURA WebRTC] Remote video play error:', err);
        });
      }

      // Dedicated audio element plays the remote microphone sound
      playRemoteAudio(incomingStream);
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

    // Helper to bind call events with consolidated track handling
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
          const consolidated = remoteStreamRef.current;
          const existing = consolidated.getTracks().filter(t => t.kind === event.track.kind);
          existing.forEach(t => consolidated.removeTrack(t));
          consolidated.addTrack(event.track);

          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach(t => {
              if (!consolidated.getTracks().some(ct => ct.id === t.id)) {
                consolidated.addTrack(t);
              }
            });
          }

          attachRemoteStream(consolidated);
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
        const consolidated = remoteStreamRef.current;
        incomingRemoteStream.getTracks().forEach(t => {
          if (!consolidated.getTracks().some(ct => ct.id === t.id)) {
            consolidated.addTrack(t);
          }
        });
        attachRemoteStream(consolidated);
      });

      call.on('close', () => {
        console.log('[CURA WebRTC] Call closed');
        if (isCancelled) return;
        remoteStreamRef.current = new MediaStream();
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
      if (activeMediaCall?.open && remoteStreamRef.current.getTracks().length > 0) {
        return;
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
        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: audioConstraints
          });
        } catch (e) {
          console.warn('[CURA WebRTC] Primary constraints failed, trying fallback:', e);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (e2) {
            console.warn('[CURA WebRTC] Video+Audio fallback failed, trying separate capture:', e2);
            try {
              const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
              let videoOnly: MediaStream | null = null;
              try {
                videoOnly = await navigator.mediaDevices.getUserMedia({ video: true });
              } catch {}
              const combined = new MediaStream();
              audioOnly.getAudioTracks().forEach(t => combined.addTrack(t));
              if (videoOnly) {
                videoOnly.getVideoTracks().forEach(t => combined.addTrack(t));
              }
              stream = combined;
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
          // Explicitly ensure captured audio tracks are enabled
          stream.getAudioTracks().forEach((track) => {
            track.enabled = !isMicMutedRef.current;
          });

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

    // Reconnection retry loop every 3s if not yet connected
    checkTimer = setInterval(() => {
      if (isCancelled || !currentPeer || currentPeer.destroyed) return;
      if (activeMediaCall?.open && connectionStatus === 'connected') return;
      if (activeMediaCall?.open && remoteStreamRef.current.getTracks().length > 0) return;
      attemptDirectCall();
    }, 3000);

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
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        if (remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().then(() => {
          setAudioNeedsInteraction(false);
        }).catch((err) => {
          console.warn('[CURA WebRTC] Remote audio autoplay blocked:', err);
          setAudioNeedsInteraction(true);
        });
      }
    }
  }, [remoteStream]);

  // Global gesture listener to unlock audio as soon as user clicks anywhere
  useEffect(() => {
    const unlockAudio = () => {
      if (remoteAudioRef.current && remoteAudioRef.current.paused && remoteStream) {
        remoteAudioRef.current.play().then(() => {
          setAudioNeedsInteraction(false);
        }).catch(() => {});
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
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
        video: { facingMode: newFacing }
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
    <div className={`relative flex flex-col w-full h-full bg-gradient-to-b from-[#0B1C33] via-[#071426] to-[#040C18] text-white font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden select-none ${isEmbedded ? 'rounded-2xl' : ''}`}>
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#1B3A6B]/25 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Top Header Bar / Floating HUD */}
      {isEmbedded ? (
        <>
          {/* Subtle Embedded Floating Top HUD */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 bg-[#0E2442]/90 border border-emerald-400/30 px-3.5 py-1.5 rounded-full shadow-xl backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-emerald-200 uppercase">
                {connectionStatus === 'connected' ? 'Connected (Encrypted P2P)' : 'Connecting Room...'}
              </span>
            </div>
          </div>

          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 text-xs text-slate-100 bg-[#0E2442]/90 border border-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-xl font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>
        </>
      ) : (
        /* Standalone / Mobile Full Header (Consistent with CURA Web App Header) */
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 bg-[#0B2136]/95 border-b border-white/10 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1B3A6B] to-[#25508D] border border-blue-400/30 flex items-center justify-center text-white shadow-md shrink-0">
              <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 animate-pulse" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                  CURA Telemedicine
                </span>
                <div className="flex items-center gap-1.5 bg-[#0E2442]/90 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-200 uppercase">
                    {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
              
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white uppercase truncate max-w-[150px] sm:max-w-xs mt-0.5">
                {effectiveRemoteName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Call Duration Timer */}
            <div className="flex items-center gap-1.5 text-xs text-slate-100 bg-[#0E2442]/90 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDuration(callDuration)}</span>
            </div>

            {/* Direct Link Copier */}
            <button
              onClick={copyDirectLink}
              className="flex items-center gap-1.5 text-xs bg-[#1B3A6B] hover:bg-[#224A84] border border-white/15 text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm font-semibold"
              title="Copy patient join link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            {/* Secondary Google Meet fallback */}
            {secondaryLink && (
              <a
                href={secondaryLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-sm font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5 text-white" />
                <span className="hidden lg:inline">Google Meet Backup</span>
              </a>
            )}

            {/* Quick End Call / Leave Button */}
            {onEndCall && (
              <button
                onClick={handleEndCall}
                className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-3 sm:px-4 py-1.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                title={role === 'patient' ? "Leave Consultation" : "Exit Consultation"}
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{role === 'patient' ? 'Leave' : 'Exit'}</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Camera / Mic Warning Banner (if blocked in WebView/browser) */}
      {cameraError && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-amber-500/95 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xl backdrop-blur-md border border-amber-400">
          <span className="truncate pr-2">⚠️ Camera or Microphone blocked. If testing on mobile, switch to Chrome browser.</span>
          <a
            href={directLink}
            target="_blank"
            rel="noreferrer"
            className="bg-[#0B2136] hover:bg-[#1B3A6B] text-white px-3 py-1 rounded-xl text-[11px] font-bold uppercase shrink-0 transition-colors"
          >
            Open Chrome
          </a>
        </div>
      )}

      {/* Tap to Unmute Audio Banner (if autoplay policy paused audio) */}
      {audioNeedsInteraction && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in duration-200">
          <button
            onClick={() => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.play().then(() => setAudioNeedsInteraction(false)).catch(() => {});
              }
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-full shadow-2xl border-2 border-emerald-300 active:scale-95 transition-all animate-bounce"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Tap to Enable Call Audio</span>
          </button>
        </div>
      )}

      {/* Main Video Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Dedicated Remote Audio Player */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
        />

        {/* Remote Video Stream (Main Fullscreen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={true}
          style={{ transform: isRemoteMirrored ? 'scaleX(-1)' : 'none' }}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            connectionStatus === 'connected' && !isRemoteOffCam ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Remote Camera Off Indicator State */}
        {connectionStatus === 'connected' && isRemoteOffCam && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in duration-300">
            {/* Elevated Frosted Card */}
            <div className="relative max-w-md w-full bg-gradient-to-b from-[#0F284A]/90 to-[#0A1A31]/95 backdrop-blur-2xl border border-blue-400/25 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
              {/* Centered Avatar */}
              <div className="relative mb-5">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#1B3A6B] via-[#224A84] to-[#2B579A] border-4 border-emerald-400/50 flex items-center justify-center shadow-2xl text-white">
                  <span className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider">
                    {getInitials(effectiveRemoteName)}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 bg-[#0B2136] border-2 border-white/20 rounded-full p-2 text-amber-400 shadow-md">
                  <VideoOff className="w-5 h-5" />
                </div>
              </div>

              {/* Participant Name & Category */}
              <h3 className="text-2xl font-extrabold text-white uppercase tracking-tight mb-1.5">
                {effectiveRemoteName}
              </h3>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-500/30 mb-4">
                {role === 'doctor' ? 'Patient' : 'Attending Physician'}
              </span>

              {/* Camera Off Indicator Pill */}
              <div className="flex items-center gap-2 bg-[#081729]/90 border border-white/10 px-4 py-2 rounded-full shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200">
                  Camera is turned off
                </span>
              </div>

              {/* Muted Audio Pill if remote mic is muted */}
              {isRemoteMicMuted && (
                <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-800/50 px-3 py-1 rounded-full text-rose-300 text-xs font-medium mt-3">
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Microphone is muted</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder / Waiting State if Remote Not Yet Connected */}
        {connectionStatus !== 'connected' && connectionStatus !== 'error' && connectionStatus !== 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            {/* Elevated Frosted Card */}
            <div className="relative max-w-lg w-full bg-gradient-to-b from-[#0F284A]/90 to-[#0A1A31]/95 backdrop-blur-2xl border border-blue-400/25 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1B3A6B] to-[#2B579A] border-2 border-emerald-400/40 flex items-center justify-center shadow-2xl text-emerald-300">
                  <ShieldCheck className="w-12 h-12 text-emerald-300 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#0B2136] border-2 border-emerald-500/40 rounded-full p-2 text-emerald-400 shadow-md">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2.5 tracking-tight">
                {role === 'doctor' ? 'Waiting for Patient to Join' : 'Connecting to Clinic Physician'}
              </h3>
              
              <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
                {role === 'doctor' 
                  ? `Your consultation room is ready. Once ${effectiveRemoteName} opens Join Call, their video will appear here automatically.` 
                  : 'Connecting you with the clinic doctor. Please stay on this screen. No login required.'}
              </p>

              <div className="w-full bg-[#081729]/90 border border-blue-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Room Code</span>
                  <code className="text-sm font-mono font-bold text-emerald-400 tracking-wide">
                    {cleanId}
                  </code>
                </div>
                <button
                  onClick={copyDirectLink}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1B3A6B] hover:bg-[#142D54] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-white/15"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Patient Link'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>End-to-End Encrypted WebRTC Session</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {connectionStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="max-w-md w-full bg-gradient-to-b from-[#0F284A]/90 to-[#0A1A31]/95 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 shadow-xl">
                <VideoOff className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Camera / Mic Access Needed</h3>
              <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#1B3A6B] hover:bg-[#142D54] text-white font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 border border-white/10"
              >
                Retry Access
              </button>
            </div>
          </div>
        )}

        {/* Ended State */}
        {connectionStatus === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="max-w-md w-full bg-gradient-to-b from-[#0F284A]/90 to-[#0A1A31]/95 backdrop-blur-2xl border border-blue-400/25 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center mb-5 text-white shadow-xl shadow-emerald-950/50">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                {role === 'patient' ? 'You Have Left the Call' : 'Consultation Concluded'}
              </h3>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#081729]/90 border border-white/10 text-xs font-mono font-bold text-slate-200 mb-5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Session Duration: {formatDuration(callDuration)}</span>
              </div>
              <p className="text-sm text-slate-300 max-w-sm mb-7 leading-relaxed">
                {role === 'patient' 
                  ? 'Your virtual medical consultation has ended. You can now safely return to the CURA mobile application.' 
                  : 'Virtual consultation session has concluded. The appointment record and consultation notes are saved.'}
              </p>
              {onEndCall && (
                <button
                  onClick={onEndCall}
                  className="w-full bg-[#1B3A6B] hover:bg-[#142D54] active:bg-[#0F223F] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-blue-400/30"
                >
                  <span>{role === 'patient' ? 'Return to CURA Mobile App' : 'Return to Dashboard'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Local Video Stream (Picture-in-Picture) */}
        <div 
          onClick={() => setIsLocalMirrored((prev) => !prev)}
          className="absolute right-3 sm:right-5 z-20 w-32 h-44 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/20 bg-[#081729] shadow-2xl transition-all cursor-pointer"
          style={{ bottom: 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom, 20px)))' }}
          title="Click to flip camera mirror"
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ transform: isLocalMirrored ? 'scaleX(-1)' : 'none' }}
            className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B2136] text-slate-300 p-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1B3A6B] border border-white/20 flex items-center justify-center mb-1.5 text-white shadow-md">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-[#081729]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
              You ({role})
            </span>
            {isMicMuted && <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
          </div>
        </div>
      </div>

      {/* Floating Control Dock (Bottom) */}
      <div 
        className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex items-center justify-center pointer-events-none px-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center gap-3 bg-[#0B2136]/95 backdrop-blur-xl border border-white/20 p-2.5 sm:p-3 rounded-full shadow-2xl pointer-events-auto">
          {/* Toggle Mic */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 ${
              isMicMuted 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40' 
                : 'bg-[#1B3A6B] hover:bg-[#224A84] text-white border border-white/15'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 ${
              isVideoOff 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40' 
                : 'bg-[#1B3A6B] hover:bg-[#224A84] text-white border border-white/15'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Flip / Unmirror Video */}
          <button
            onClick={() => {
              setIsRemoteMirrored((prev) => !prev);
              setIsLocalMirrored((prev) => !prev);
            }}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 ${
              isRemoteMirrored 
                ? 'bg-[#1B3A6B] hover:bg-[#224A84] text-white border border-white/15' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
            title="Unmirror / Flip Video"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>

          {/* Flip Camera (Mobile Only) */}
          <button
            onClick={flipCamera}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#1B3A6B] hover:bg-[#224A84] text-white border border-white/15 flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 md:hidden"
            title="Switch Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* End Call / Leave Button */}
          <button
            onClick={handleEndCall}
            className="h-12 px-6 sm:px-7 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-all active:scale-95 flex items-center gap-2"
            title={role === 'patient' ? "Leave Call" : "End Consultation"}
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{role === 'patient' ? 'Leave' : 'End Call'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuraWebRtcRoom;
