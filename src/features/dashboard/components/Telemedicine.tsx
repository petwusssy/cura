import { useState, useEffect } from 'react';
import { Video, Search, Check, X, Calendar, Clock, Link as LinkIcon, Trash2, ExternalLink, Copy, ShieldCheck, Sparkles } from 'lucide-react';
import { Patient } from '../types';
import { telemedicineService, TelemedicineRequest } from '@/services/telemedicineService';
import { EmbeddedJitsiCall } from './EmbeddedJitsiCall';
import { normalizeDate } from '@/utils/philippineTime';

interface TelemedicineProps {
  patients: Patient[];
  onNavigate?: (page: string) => void;
}

const PRIMARY = '#1B3A6B';

export function Telemedicine({ patients }: TelemedicineProps) {
  const [requests, setRequests] = useState<TelemedicineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Embedded Video Call State
  const [activeCallReq, setActiveCallReq] = useState<TelemedicineRequest | null>(null);

  // Modal State
  const [selectedReq, setSelectedReq] = useState<TelemedicineRequest | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
  
  // Form State
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      telemedicineService.getRequests().then(data => {
        setRequests(data);
      }).catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await telemedicineService.getRequests();
    setRequests(data);
    setLoading(false);
  };

  const getPatientName = (id: string) => {
    const p = patients.find(p => p.id === id);
    return (p?.name || id).toUpperCase();
  };

  const getPatientObj = (id: string) => {
    return patients.find(p => p.id === id);
  };

  const handleAction = async () => {
    if (!selectedReq || !actionType) return;
    setIsSubmitting(true);
    
    const finalStatus = actionType === 'Approve' ? 'Approved' : 'Rejected';
    const effectiveMeetingLink = `https://cura-bice.vercel.app/call/CURA-Telemed-${selectedReq.id.slice(0, 8)}`;

    const res = await telemedicineService.approveRequest(selectedReq.id, {
      status: finalStatus as any,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      meeting_link: effectiveMeetingLink,
    });
    
    if (res) {
      setRequests(prev => prev.map(r => r.id === res.id ? res : r));
      setSelectedReq(null);
      setActionType(null);
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    const success = await telemedicineService.deleteRequest(id);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const openApproveModal = (req: TelemedicineRequest) => {
    setSelectedReq(req);
    setActionType('Approve');
    setScheduledDate(req.preferred_date);
    setScheduledTime(req.preferred_time);
  };

  const openRejectModal = (req: TelemedicineRequest) => {
    setSelectedReq(req);
    setActionType('Reject');
  };

  const handleCopyLink = (req: TelemedicineRequest) => {
    const link = `https://cura-bice.vercel.app/call/CURA-Telemed-${req.id.slice(0, 8)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRequests = requests.filter(r => 
    getPatientName(r.patient).toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Active Embedded Call Screen */}
      {activeCallReq && (
        <EmbeddedJitsiCall
          request={activeCallReq}
          patient={getPatientObj(activeCallReq.patient)}
          onClose={() => setActiveCallReq(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Telemedicine</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 hidden sm:inline-flex items-center gap-1">
              <ShieldCheck size={12} className="text-blue-600" />
              In-App Jitsi + GMeet Ready
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Manage virtual consultations and launch live encrypted video rooms</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Search by patient or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors shadow-sm"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-150">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="skeleton skeleton-circle w-11 h-11" />
                  <div className="space-y-1.5">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-2.5 w-20 rounded" />
                  </div>
                </div>
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2 py-2 border-y border-gray-50">
                <div className="skeleton h-3 w-40 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
              <div className="flex gap-2 pt-1">
                <div className="skeleton h-9 flex-1 rounded-xl" />
                <div className="skeleton h-9 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600 border border-blue-100/80">
              <Video size={30} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">No Telemedicine Requests Found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Patients can request telemedicine consultations through the mobile app, and they will appear here in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRequests.map(req => {
            const hasGoogleMeet = 
              (req.secondary_link && req.secondary_link.includes('meet.google.com')) ||
              (req.meeting_link && req.meeting_link.includes('meet.google.com'));
            const googleMeetUrl = 
              (req.secondary_link && req.secondary_link.includes('meet.google.com')) ? req.secondary_link :
              (req.meeting_link && req.meeting_link.includes('meet.google.com')) ? req.meeting_link :
              req.secondary_link;

            return (
              <div key={req.id} className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
                <div>
                  <div className="flex justify-between items-start mb-3.5">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg uppercase tracking-tight">
                        {getPatientName(req.patient)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          req.status === 'Pending' ? 'bg-amber-100/80 text-amber-800 border border-amber-200/60' :
                          req.status === 'Approved' ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/60' :
                          req.status === 'Rejected' ? 'bg-rose-100/80 text-rose-800 border border-rose-200/60' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {req.status}
                        </span>
                        {req.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In-App Call Ready
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                        <Video size={18} />
                      </div>
                      <button 
                        onClick={() => handleDelete(req.id)}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete Request"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs font-medium text-gray-600">
                      <Calendar size={13} className="mr-1.5 text-gray-400" />
                      Preferred Date: <span className="ml-1 text-gray-800 font-semibold">{normalizeDate(req.preferred_date)}</span>
                    </div>
                    <div className="flex items-center text-xs font-medium text-gray-600">
                      <Clock size={13} className="mr-1.5 text-gray-400" />
                      Preferred Time: <span className="ml-1 text-gray-800 font-semibold">{req.preferred_time}</span>
                    </div>
                    <div className="mt-2.5 p-3 bg-gray-50/80 rounded-xl text-xs text-gray-700 leading-relaxed border border-gray-100">
                      <span className="font-semibold text-gray-500 block mb-0.5">Reason for Consultation:</span>
                      "{req.reason}"
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {req.status === 'Pending' && (
                  <div className="flex gap-2.5 mt-2 pt-3.5 border-t border-gray-100">
                    <button 
                      onClick={() => openApproveModal(req)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center transition-all shadow-sm text-xs"
                    >
                      <Check size={15} className="mr-1" /> Approve Request
                    </button>
                    <button 
                      onClick={() => openRejectModal(req)}
                      className="px-3 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 font-semibold py-2 rounded-xl flex items-center justify-center transition-all text-xs"
                    >
                      <X size={15} className="mr-1" /> Reject
                    </button>
                  </div>
                )}
                
                {req.status === 'Approved' && (
                  <div className="mt-2 pt-3.5 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <span className="text-gray-500">Scheduled Session:</span>
                      <span className="font-bold text-gray-900">{normalizeDate(req.scheduled_date)} at {req.scheduled_time}</span>
                    </div>

                    {/* Primary Button: Join Embedded In-App Call */}
                    <button
                      onClick={() => setActiveCallReq(req)}
                      className="w-full bg-[#1B3A6B] hover:bg-[#142d54] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 text-xs sm:text-sm group"
                    >
                      <Video size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Start In-App Video Call</span>
                      <span className="ml-auto text-[10px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                        Embedded
                      </span>
                    </button>

                    {/* Secondary Actions: Google Meet & Copy Link */}
                    <div className="flex items-center gap-2">
                      {hasGoogleMeet && googleMeetUrl ? (
                        <a 
                          href={googleMeetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs"
                          title="Open Google Meet in a new tab (Secondary option)"
                        >
                          <ExternalLink size={13} />
                          <span>Google Meet (Backup)</span>
                        </a>
                      ) : (
                        <a 
                          href={`https://cura-bice.vercel.app/call/CURA-Telemed-${req.id.slice(0, 8)}?role=doctor`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs"
                          title="Open in external browser window"
                        >
                          <ExternalLink size={13} />
                          <span>Open in Browser</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleCopyLink(req)}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors flex items-center gap-1 text-xs"
                        title="Copy patient invitation link"
                      >
                        {copiedId === req.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copiedId === req.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Approval / Rejection Modal */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              actionType === 'Approve' ? 'bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${actionType === 'Approve' ? 'text-emerald-900' : 'text-rose-800'}`}>
                  {actionType === 'Approve' ? 'Approve & Schedule Consultation' : 'Reject Request'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Patient: <span className="font-bold text-gray-900 uppercase">{getPatientName(selectedReq.patient)}</span>
                </p>
              </div>
              <button 
                onClick={() => { setSelectedReq(null); setActionType(null); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {actionType === 'Approve' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Confirm Date
                      </label>
                      <input 
                        type="date" 
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Confirm Time
                      </label>
                      <input 
                        type="text" 
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 10:00 AM"
                      />
                    </div>
                  </div>

                  {/* Auto-Generated Video Room Notice */}
                  <div className="p-3.5 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white text-blue-600 shadow-sm border border-blue-100 flex-shrink-0">
                      <Sparkles size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                        Automated In-App Video Room
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        A secure, encrypted video consultation room will be automatically created. Both you and the patient can join directly with one click — zero link setup needed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Are you sure you want to reject this telemedicine request? The patient will be notified with the update.
                </p>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => { setSelectedReq(null); setActionType(null); }}
                className="px-4 py-2 text-gray-600 font-semibold text-xs hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={isSubmitting || (actionType === 'Approve' && (!scheduledDate || !scheduledTime))}
                className={`px-5 py-2 font-bold text-xs rounded-xl text-white transition-all shadow-sm flex items-center gap-1.5 ${
                  actionType === 'Approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300' 
                    : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300'
                }`}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
