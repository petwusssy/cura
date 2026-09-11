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
  const secondaryLink = searchParams.get('secondary') || undefined;

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

    // 2. If opened in external mobile browser / Chrome Custom Tab, redirect back to mobile app
    try {
      window.location.href = 'curamobile://telemedicine';
    } catch (e) {}

    // 3. Fallback for desktop / standard browser
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Invalid Consultation Link</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          No active consultation room specified. Please open the link provided in your CURA appointments.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 overflow-hidden flex flex-col">
      <CuraWebRtcRoom
        roomId={roomId}
        role={role}
        userName={userName}
        onEndCall={handleEndCall}
        secondaryLink={secondaryLink}
      />
    </div>
  );
};

export default CallPage;
