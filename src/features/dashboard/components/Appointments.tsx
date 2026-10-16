import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, X, Clock, CalendarDays, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Patient } from '../types';
import { appointmentService, AppointmentRequest } from '../../../services/appointmentService';
import { normalizeDate, formatTime12, getManilaDate } from '@/utils/philippineTime';
import { AppointmentCardSkeleton } from './PageSkeleton';

interface AppointmentsProps {
  patients: Patient[];
  searchQuery?: string;
  onNavigate?: (page: string) => void;
}

const PRIMARY = '#1B3A6B';

const APPOINTMENT_TIME_SLOTS = [
  '8:00 AM - 9:00 AM',
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
  '8:00 PM - 9:00 PM',
  '9:00 PM - 10:00 PM',
];

export function Appointments({ patients, searchQuery = '' }: AppointmentsProps) {
  const [requests, setRequests] = useState<AppointmentRequest[]>(() => {
    try {
      const cached = localStorage.getItem('cura_appointment_requests_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('cura_appointment_requests_cache');
      return !cached || JSON.parse(cached).length === 0;
    } catch {
      return true;
    }
  });
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  
  // Modal State
  const [selectedReq, setSelectedReq] = useState<AppointmentRequest | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
  
  // Form State
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date & Time Availability State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availTab, setAvailTab] = useState<'dates' | 'times'>('dates');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);
  const [availSaving, setAvailSaving] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = getManilaDate();

  const openAvailabilityModal = async () => {
    setAvailTab('dates');
    setShowAvailabilityModal(true);
    const data = await appointmentService.getAvailability();
    setUnavailableDates(data.unavailable_dates || []);
    setUnavailableTimes(data.unavailable_times || []);
  };

  const toggleDate = (dateStr: string) => {
    setUnavailableDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const toggleTime = (timeKey: string) => {
    setUnavailableTimes(prev =>
      prev.includes(timeKey) ? prev.filter(t => t !== timeKey) : [...prev, timeKey]
    );
  };

  const blockAllTimes = () => {
    setUnavailableTimes([...APPOINTMENT_TIME_SLOTS]);
  };

  const clearAllTimes = () => {
    setUnavailableTimes([]);
  };

  const blockVisibleWeekends = () => {
    const weekendDates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(currentYear, currentMonth, d);
      const day = dt.getDay();
      if (day === 0 || day === 6) {
        const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        weekendDates.push(iso);
      }
    }
    setUnavailableDates(prev => Array.from(new Set([...prev, ...weekendDates])));
  };

  const clearVisibleBlocked = () => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`;
    setUnavailableDates(prev => prev.filter(d => !d.startsWith(prefix)));
  };

  const handleSaveAvailability = async () => {
    setAvailSaving(true);
    const success = await appointmentService.saveAvailability(unavailableDates, unavailableTimes);
    setAvailSaving(false);
    if (success) {
      setShowAvailabilityModal(false);
    } else {
      alert("Failed to save appointment availability. Please try again.");
    }
  };



  useEffect(() => {
    fetchRequests();
    let isFetching = false;
    const interval = setInterval(() => {
      if (isFetching) return;
      isFetching = true;
      appointmentService.getRequests().then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRequests(data);
        }
      }).catch(() => {}).finally(() => {
        isFetching = false;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await appointmentService.getRequests();
      if (data && Array.isArray(data) && data.length > 0) {
        setRequests(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (id: string) => {
    const p = patients.find(p => p.id === id);
    return (p?.name || id).toUpperCase();
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    const success = await appointmentService.deleteRequest(id);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
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

  const filteredRequests = requests.filter(r => {
    const matchesStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
    const term = searchQuery.trim().toLowerCase();
    const matchesSearch = !term ||
      getPatientName(r.patient).toLowerCase().includes(term) ||
      (r.status || '').toLowerCase().includes(term) ||
      (r.visit_type || '').toLowerCase().includes(term) ||
      (r.reason || '').toLowerCase().includes(term) ||
      (r.preferred_date || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">In-Person Appointments</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={openAvailabilityModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-200 text-slate-700 hover:text-sky-600 hover:border-sky-300 shadow-sm transition-all cursor-pointer"
          >
            <CalendarIcon size={14} className="text-sky-500" />
            <span>Manage Availability</span>
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 overflow-x-auto hide-scrollbar shadow-sm">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-sm shadow-sky-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in duration-150">
          {Array.from({ length: 6 }).map((_, i) => (
            <AppointmentCardSkeleton key={i} isPending={i % 3 === 1} />
          ))}
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
                  <h3 className="font-bold text-gray-900 text-lg uppercase">{getPatientName(req.patient)}</h3>
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
                <div className="flex gap-2">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                    <CalendarIcon size={20} />
                  </div>
                  <button 
                    onClick={() => handleDelete(req.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    title="Delete Request"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays size={14} className="mr-2" />
                  Preferred: {normalizeDate(req.preferred_date)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-2" />
                  {formatTime12(req.preferred_time)}
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
                    {normalizeDate(req.scheduled_date)} at {formatTime12(req.scheduled_time)}
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
                You are about to {actionType.toLowerCase()} the <span className="font-bold">{selectedReq.visit_type}</span> appointment from <span className="font-bold uppercase">{getPatientName(selectedReq.patient)}</span>.
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

      {/* Date Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Manage Appointment Availability</h3>
                  <p className="text-xs text-gray-500">Pick which dates and time slots patients can request for appointments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAvailabilityModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Availability Mode Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 pt-2">
              <button
                type="button"
                onClick={() => setAvailTab('dates')}
                className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  availTab === 'dates'
                    ? 'border-sky-500 text-sky-600 bg-white rounded-t-lg shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarIcon size={14} />
                <span>Dates ({unavailableDates.length} Closed)</span>
              </button>
              <button
                type="button"
                onClick={() => setAvailTab('times')}
                className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  availTab === 'times'
                    ? 'border-sky-500 text-sky-600 bg-white rounded-t-lg shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Clock size={14} />
                <span>Time Slots ({unavailableTimes.length} Closed)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* DATES TAB */}
              {availTab === 'dates' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  {/* Instructions and Quick Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <span className="w-3 h-3 rounded border border-gray-300 bg-white inline-block"></span>
                        Available
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                        <span className="w-3 h-3 rounded border border-rose-300 bg-rose-50 inline-block"></span>
                        Unavailable (Red)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={blockVisibleWeekends}
                        className="text-xs font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Block Weekends
                      </button>
                      <button
                        type="button"
                        onClick={clearVisibleBlocked}
                        className="text-xs font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Clear Month
                      </button>
                    </div>
                  </div>

                  {/* Month Selector */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="p-1 text-gray-500 hover:text-gray-900 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-gray-800">
                      {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="p-1 text-gray-500 hover:text-gray-900 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="space-y-1">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells before 1st of month */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10" />
                      ))}

                      {/* Month days */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isPast = dateStr < todayStr;
                        const isUnavailable = unavailableDates.includes(dateStr);

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            disabled={isPast}
                            onClick={() => toggleDate(dateStr)}
                            className={`h-10 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center cursor-pointer ${
                              isPast
                                ? 'opacity-30 cursor-not-allowed text-gray-400 bg-gray-50 border border-transparent'
                                : isUnavailable
                                ? 'bg-rose-50 border border-rose-300 text-rose-700 shadow-sm hover:bg-rose-100'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-sky-50/50'
                            }`}
                          >
                            <span>{dayNum}</span>
                            {isUnavailable && !isPast && (
                              <span className="text-[9px] font-bold text-rose-500 leading-none">Closed</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    Click any date to toggle: red dates are closed/unavailable for booking; uncolored dates are open.
                  </p>
                </div>
              )}

              {/* TIME SLOTS TAB */}
              {availTab === 'times' && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  {/* Instructions and Quick Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <span className="w-3 h-3 rounded border border-gray-300 bg-white inline-block"></span>
                        Available
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                        <span className="w-3 h-3 rounded border border-rose-300 bg-rose-50 inline-block"></span>
                        Closed (Red)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={blockAllTimes}
                        className="text-xs font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Close All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllTimes}
                        className="text-xs font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Open All
                      </button>
                    </div>
                  </div>

                  {/* Time Slots Grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1">
                    {APPOINTMENT_TIME_SLOTS.map((slot) => {
                      const isUnavailable = unavailableTimes.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleTime(slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                            isUnavailable
                              ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-sky-50/50'
                          }`}
                        >
                          <span className="font-bold">{slot}</span>
                          {isUnavailable ? (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white leading-none">
                              Closed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-sky-600 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-100 leading-none">
                              Open
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    Click any time slot to toggle: slots marked in Red (Closed) will be locked and cannot be selected by patients on mobile.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {unavailableDates.length} date{unavailableDates.length === 1 ? '' : 's'} · {unavailableTimes.length} slot{unavailableTimes.length === 1 ? '' : 's'} unavailable
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvailabilityModal(false)}
                  className="px-4 py-2 text-gray-600 font-semibold text-xs hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                  disabled={availSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  disabled={availSaving}
                  className="px-5 py-2 font-bold text-xs rounded-xl text-white bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] hover:opacity-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {availSaving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

