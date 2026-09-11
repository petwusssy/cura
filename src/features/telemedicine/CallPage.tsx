import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { CuraWebRtcRoom } from './CuraWebRtcRoom';
import { ShieldCheck, Heart } from 'lucide-react';

export const CallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = (searchParams.get('role') === 'doctor' ? 'doctor' : 'patient') as 'doctor' | 'patient';
  const userName = searchParams.get('name') || (role === 'doctor' ? 'Clinic Doctor' : 'Patient');
  const remoteUserName = searchParams.get('patient') || (role === 'doctor' ? 'Patient' : 'Clinic Doctor');
  const secondaryLink = searchParams.get('secondary') || undefined;

  const isEmbedded = searchParams.get('embedded') === 'true';

  const handleEndCall = () => {
    // 1. If embedded in React Native WebView (Messenger-style in-app)
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

    // For mobile patient: NEVER navigate to web app '/'!
    if (role === 'patient') {
      try {
        window.close();
      } catch (e) {}
      return;
    }

    // 3. Desktop doctor fallback only
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
