import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Search, Check, X, Clock, CalendarDays } from 'lucide-react';
import { Patient } from '../types';
import { appointmentService, AppointmentRequest } from '../../../services/appointmentService';

interface AppointmentsProps {
  patients: Patient[];
  onNavigate?: (page: string) => void;
}

const PRIMARY = '#1B3A6B';

export function Appointments({ patients }: AppointmentsProps) {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [selectedReq, setSelectedReq] = useState<AppointmentRequest | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
  
  // Form State
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      appointmentService.getRequests().then(data => {
        setRequests(data);
      }).catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await appointmentService.getRequests();
    setRequests(data);
    setLoading(false);
  };

  const getPatientName = (id: string) => {
    return patients.find(p => p.id === id)?.name || id;
  };

  const handleAction = async () => {
    if (!selectedReq || !actionType) return;
    setIsSubmitting(true);
    
    const finalStatus = actionType === 'Approve' ? 'Approved' : 'Rejected';
    
    const res = await appointmentService.approveRequest(selectedReq.id, {
      status: finalStatus as any, // backend expects Approved or Rejected
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime
    });
    
    if (res) {
      setRequests(prev => prev.map(r => r.id === res.id ? res : r));
      setSelectedReq(null);
      setActionType(null);
    }
    
    setIsSubmitting(false);
  };

  const openApproveModal = (req: AppointmentRequest) => {
    setSelectedReq(req);
    setActionType('Approve');
    setScheduledDate(req.preferred_date);
    setScheduledTime(req.preferred_time);
  };

  const openRejectModal = (req: AppointmentRequest) => {
    setSelectedReq(req);
    setActionType('Reject');
  };

  const filteredRequests = requests.filter(r => 
    getPatientName(r.patient).toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase()) ||
    r.visit_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">In-Person Appointments</h1>
          <p className="text-sm text-gray-500">Manage clinic visits and bookings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search by patient or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: PRIMARY }}></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gray-50 text-gray-400">
              <CalendarIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              There are currently no in-person appointment requests matching your search.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map(req => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{getPatientName(req.patient)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {req.status}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1B3A6B]/10 text-[#1B3A6B]">
                      {req.visit_type}
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                  <CalendarIcon size={20} />
                </div>
              </div>

              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays size={14} className="mr-2" />
                  Preferred: {req.preferred_date}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-2" />
                  {req.preferred_time}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic border border-gray-100">
                  "{req.reason}"
                </div>
              </div>

              {req.status === 'Pending' && (
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => openApproveModal(req)}
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Check size={16} className="mr-1" /> Approve
                  </button>
                  <button 
                    onClick={() => openRejectModal(req)}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium py-2 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="mr-1" /> Reject
                  </button>
                </div>
              )}
              
              {req.status === 'Approved' && (
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Scheduled for:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {req.scheduled_date} at {req.scheduled_time}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-4 border-b ${actionType === 'Approve' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <h3 className={`text-lg font-bold ${actionType === 'Approve' ? 'text-emerald-800' : 'text-rose-800'}`}>
                {actionType} Request
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                You are about to {actionType.toLowerCase()} the <span className="font-bold">{selectedReq.visit_type}</span> appointment from <span className="font-bold">{getPatientName(selectedReq.patient)}</span>.
              </p>
              
              {actionType === 'Approve' && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Date</label>
                    <input 
                      type="date" 
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Time</label>
                    <input 
                      type="text" 
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. 10:00 AM"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => { setSelectedReq(null); setActionType(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={isSubmitting || (actionType === 'Approve' && (!scheduledDate || !scheduledTime))}
                className={`px-4 py-2 font-medium rounded-lg text-white transition-colors flex items-center ${
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
