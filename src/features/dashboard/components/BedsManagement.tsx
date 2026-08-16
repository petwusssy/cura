import { useState, useEffect, useRef } from 'react';
import { BedDouble, Clock, X, UserCheck, History, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Bed, Patient, BedHistory } from '../types';

const PRIMARY = '#1B3A6B';
const RED = '#D64545';

type DateFilterType = 'today' | 'week' | 'month';

const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // Gets YYYY-MM-DD in local time

function isInRange(date: string, filter: DateFilterType): boolean {
  if (filter === 'today') return date === TODAY;
  if (filter === 'week') {
    // last 7 days
    const d = new Date(date);
    const t = new Date(TODAY);
    const diff = (t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  }
  // month: same month & year
  return date.slice(0, 7) === TODAY.slice(0, 7);
}

function useDurationTimers(beds: Bed[]) {
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const alertedBeds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const d: Record<string, string> = {};
      const c: Record<string, string> = {};
      
      beds.forEach(b => {
        if (b.status === 'Occupied' && b.timeOccupied) {
          const start = new Date(b.timeOccupied).getTime();
          const diff = now.getTime() - start;
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          d[b.id] = `${h}h ${m}m`;

          if (b.allottedTime) {
            const allottedMs = b.allottedTime * 60000;
            const remaining = allottedMs - diff;
            if (remaining <= 0) {
              c[b.id] = "Time's up!";
              const alertKey = `${b.id}-${b.timeOccupied}`;
              if (!alertedBeds.current.has(alertKey)) {
                toast.error(`Time is up for ${b.patientName} in Bed ${b.bedNumber}!`, { duration: 10000 });
                alertedBeds.current.add(alertKey);
              }
            } else {
              const rh = Math.floor(remaining / 3600000);
              const rm = Math.floor((remaining % 3600000) / 60000);
              const rs = Math.floor((remaining % 60000) / 1000);
              c[b.id] = `${rh > 0 ? `${rh}h ` : ''}${rm}m ${rs}s remaining`;
            }
          }
        }
      });
      setDurations(d);
      setCountdowns(c);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [beds]);
  return { durations, countdowns };
}

interface BedsManagementProps {
  beds: Bed[];
  patients: Patient[];
  onUpdateBed: (bed: Bed) => void | Promise<void>;
}

export function BedsManagement({ beds, patients, onUpdateBed }: BedsManagementProps) {
  const [assignModal, setAssignModal] = useState<Bed | null>(null);
  const [releaseModal, setReleaseModal] = useState<Bed | null>(null);
  const [selectedBedTracker, setSelectedBedTracker] = useState<Bed | null>(null);
  const [trackerFilter, setTrackerFilter] = useState<DateFilterType>('today');
  const [gridFilter, setGridFilter] = useState<DateFilterType>('today');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [assignTime, setAssignTime] = useState('');
  const { durations, countdowns } = useDurationTimers(beds);

  const available = beds.filter(b => b.status === 'Available').length;
  const occupied = beds.filter(b => b.status === 'Occupied').length;

  // Total usage count per bed within the selected date range (for the grid)
  const bedUsageCount = (bed: Bed, filter: DateFilterType): number => {
    const histCount = bed.history.filter(h => isInRange(h.date, filter)).length;
    const currentCount = bed.status === 'Occupied' && isInRange(TODAY, filter) ? 1 : 0;
    return histCount + currentCount;
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedPatient) return;
    const p = patients.find(pt => pt.id === selectedPatient);
    if (!p) return;

    // Prevent duplicate assignment if patient is already assigned to another occupied bed
    const existingBed = beds.find(b => b.status === 'Occupied' && (
      (b.patientId && b.patientId === p.id) || 
      (b.patientName && p.name && b.patientName.trim().toLowerCase() === p.name.trim().toLowerCase())
    ));
    if (existingBed) {
      alert(`⚠️ Cannot assign ${p.name} to Bed ${assignModal.bedNumber}: This patient is already currently assigned to Bed ${existingBed.bedNumber}! Please release them from Bed ${existingBed.bedNumber} first.`);
      return;
    }

    const updatedBed: Bed = {
      ...assignModal,
      status: 'Occupied',
      patientName: p.name,
      patientId: p.id,
      timeOccupied: new Date().toISOString(),
      reason: assignReason || null,
      allottedTime: assignTime ? parseInt(assignTime) : null,
    };

    // Immediately close modal and reset form for 0ms instantaneous responsiveness
    setAssignModal(null);
    setSelectedPatient('');
    setAssignReason('');
    setAssignTime('');

    try {
      await onUpdateBed(updatedBed);
    } catch (e) { console.error(e); }
  };

  const handleRelease = async () => {
    if (!releaseModal) return;
    const now = new Date();
    const start = releaseModal.timeOccupied ? new Date(releaseModal.timeOccupied) : now;
    const diff = now.getTime() - start.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const entry: BedHistory = {
      patientName: releaseModal.patientName || 'Unknown Patient',
      patientId: releaseModal.patientId || 'N/A',
      date: now.toISOString().slice(0, 10),
      timeIn: start.toTimeString().slice(0, 5),
      timeOut: now.toTimeString().slice(0, 5),
      duration: `${h}h ${m}m`,
      reason: releaseModal.reason || 'N/A',
    };

    const releasedBed: Bed = {
      ...releaseModal,
      status: 'Available',
      patientName: null,
      patientId: null,
      timeOccupied: null,
      reason: null,
      allottedTime: null,
      history: [...releaseModal.history, entry],
    };

    // Immediately dismiss modal for 0ms instantaneous feel
    setReleaseModal(null);

    try {
      await onUpdateBed(releasedBed);
    } catch (e: any) { 
      console.error('Release bed note:', e);
    }
  };

  // Tracker history filtered
  const trackerHistory = selectedBedTracker
    ? [
        ...selectedBedTracker.history.filter(h => isInRange(h.date, trackerFilter)),
        ...(selectedBedTracker.status === 'Occupied' && isInRange(TODAY, trackerFilter)
          ? [{
              patientName: selectedBedTracker.patientName || '',
              patientId: selectedBedTracker.patientId || '',
              date: TODAY,
              timeIn: selectedBedTracker.timeOccupied ? new Date(selectedBedTracker.timeOccupied).toTimeString().slice(0, 5) : '—',
              timeOut: '(current)',
              duration: durations[selectedBedTracker.id] || '—',
            }]
          : []),
      ]
    : [];

  const filterLabels: Record<DateFilterType, string> = { today: 'Today', week: 'This Week', month: 'This Month' };

  // Get list of patient IDs and names currently assigned to occupied beds
  const occupiedPatientIds = beds
    .filter(b => b.status === 'Occupied' && b.patientId)
    .map(b => b.patientId);
  const occupiedPatientNames = beds
    .filter(b => b.status === 'Occupied' && b.patientName)
    .map(b => b.patientName?.trim().toLowerCase());

  const allUsageHistory = beds.flatMap(bed =>
    [...bed.history, ...(bed.status === 'Occupied' ? [{
      patientName: bed.patientName || '',
      patientId: bed.patientId || '',
      date: TODAY,
      timeIn: bed.timeOccupied ? new Date(bed.timeOccupied).toTimeString().slice(0, 5) : '—',
      timeOut: '(current)',
      duration: durations[bed.id] || '—',
      _bedNumber: bed.bedNumber,
    }] : [])].map((h) => ({
      ...h,
      _bedNumber: (h as any)._bedNumber ?? bed.bedNumber,
    }))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Beds Management</h1>
        </div>
        {/* Grid date filter */}
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
          {(['today', 'week', 'month'] as DateFilterType[]).map(f => (
            <button key={f} onClick={() => setGridFilter(f)}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-center whitespace-nowrap"
              style={{ background: gridFilter === f ? 'white' : 'transparent', color: gridFilter === f ? PRIMARY : '#6b7280', boxShadow: gridFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', value: available, color: '#2E7D32', bg: '#E8F5E9', icon: <BedDouble size={20} /> },
          { label: 'Occupied', value: occupied, color: RED, bg: `${RED}15`, icon: <BedDouble size={20} /> },
          { label: 'Total Beds', value: beds.length, color: PRIMARY, bg: `${PRIMARY}15`, icon: <BedDouble size={20} /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...beds].sort((a, b) => a.bedNumber - b.bedNumber).map(bed => {
          const isOccupied = bed.status === 'Occupied';
          const dur = durations[bed.id];
          const usageCount = bedUsageCount(bed, gridFilter);
          return (
            <div
              key={bed.id}
              className="bg-white rounded-xl p-5 transition-all flex flex-col"
              style={{
                boxShadow: isOccupied ? `0 4px 20px ${RED}15` : '0 2px 12px rgba(0,0,0,0.06)',
                border: isOccupied ? `1px solid ${RED}30` : '1px solid #f0f0f0',
                minHeight: '200px'
              }}
            >
              {/* Bed header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3" style={{ color: PRIMARY }}>
                  <BedDouble size={20} style={{ color: isOccupied ? RED : '#2E7D32' }} />
                  <span className="text-sm font-bold text-gray-900">Bed {bed.bedNumber}</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: isOccupied ? `${RED}15` : '#E8F5E9', color: isOccupied ? RED : '#2E7D32' }}>
                  {bed.status}
                </span>
              </div>

              {/* Usage count badge */}
              <div className="flex items-center gap-1.5 mb-auto text-[11px] text-gray-400">
                <Users size={12} />
                <span>{usageCount} patient{usageCount !== 1 ? 's' : ''} — {filterLabels[gridFilter].toLowerCase()}</span>
              </div>

              {isOccupied ? (
                <div className="mt-4 flex flex-col items-center">
                  <div className="text-[11px] text-gray-400 mb-0.5">Occupied By</div>
                  <div className="text-sm font-bold text-gray-900 truncate w-full text-center">{bed.patientName}</div>
                  {bed.reason && (
                    <div className="text-[11px] text-gray-500 mt-1 w-full text-center truncate px-2" title={bed.reason}>
                      Reason: {bed.reason}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: RED }}>
                    <Clock size={12} />
                    <span>{countdowns[bed.id] || dur || 'calculating...'}</span>
                  </div>
                  <div className="flex gap-2 w-full mt-4">
                    <button onClick={() => setReleaseModal(bed)}
                      className="flex-1 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                      style={{ background: RED }}>
                      Release
                    </button>
                    <button
                      onClick={() => setSelectedBedTracker(bed)}
                      className="rounded-lg border border-gray-200 transition-colors flex items-center justify-center w-9 h-9 flex-shrink-0 text-[#1B3A6B] hover:bg-blue-50">
                      <History size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col justify-end h-full">
                  <div className="text-[11px] text-gray-400 pb-3 text-center">Unoccupied</div>
                  <div className="flex gap-2 w-full mt-auto">
                    <button onClick={() => { 
                        setAssignModal(bed); 
                        setSelectedPatient(''); 
                        setAssignReason(''); 
                        setAssignTime(''); 
                      }}
                      className="flex-1 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                      style={{ background: PRIMARY }}>
                      Assign Patient
                    </button>
                    <button
                      onClick={() => setSelectedBedTracker(bed)}
                      className="rounded-lg border border-gray-200 transition-colors flex items-center justify-center w-9 h-9 flex-shrink-0 text-[#1B3A6B] hover:bg-blue-50">
                      <History size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Per-bed Tracker Modal ── */}
      {selectedBedTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white shrink-0 gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                  <BedDouble size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">Bed {selectedBedTracker.bedNumber} — Usage History</div>
                  <div className="text-sm text-gray-500">
                    {bedUsageCount(selectedBedTracker, trackerFilter)} patient{bedUsageCount(selectedBedTracker, trackerFilter) !== 1 ? 's' : ''} — {filterLabels[trackerFilter].toLowerCase()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                {/* Tracker date filter */}
                <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                  {(['today', 'week', 'month'] as DateFilterType[]).map(f => (
                    <button key={f} onClick={() => setTrackerFilter(f)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center whitespace-nowrap"
                      style={{ background: trackerFilter === f ? 'white' : 'transparent', color: trackerFilter === f ? PRIMARY : '#6b7280', boxShadow: trackerFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                      {filterLabels[f]}
                    </button>
                  ))}
                </div>
                <button onClick={() => setSelectedBedTracker(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* History table */}
            <div className="overflow-y-auto flex-grow p-6">
              <div className="hidden md:block rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#f8fafd' }}>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Patient Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time In</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time Out</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {trackerHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          <BedDouble size={32} className="mx-auto mb-3 opacity-25" />
                          <p className="text-sm">No usage records for {filterLabels[trackerFilter].toLowerCase()}</p>
                        </td>
                      </tr>
                    ) : trackerHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm text-gray-400">{i + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: PRIMARY }}>
                              {h.patientName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{h.patientName}</div>
                              {h.patientId && <div className="text-xs text-gray-400">{h.patientId}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{h.date}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{h.timeIn}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {h.timeOut === '(current)' ? (
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${RED}15`, color: RED }}>
                              Current / Occupied
                            </span>
                          ) : h.timeOut}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ background: `${PRIMARY}10`, color: PRIMARY }}>
                            {h.duration}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Bed Tracker History */}
              <div className="flex flex-col gap-3 md:hidden">
                {trackerHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                    <BedDouble size={32} className="mx-auto mb-3 opacity-25" />
                    <p className="text-sm">No usage records for {filterLabels[trackerFilter].toLowerCase()}</p>
                  </div>
                ) : trackerHistory.map((h, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: PRIMARY }}>
                          {h.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm leading-tight">{h.patientName}</div>
                          {h.patientId && <div className="text-[10px] text-gray-400 font-mono mt-0.5">{h.patientId}</div>}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-gray-400">#{i + 1}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date & Time In</span>
                        <span className="text-xs text-gray-700">{h.date} <br/> <span className="text-gray-500 font-medium">{h.timeIn}</span></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time Out</span>
                        <div className="mt-0.5">
                          {h.timeOut === '(current)' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide" style={{ background: `${RED}15`, color: RED }}>
                              Current / Occupied
                            </span>
                          ) : (
                            <span className="text-xs text-gray-700">{h.timeOut}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col col-span-2 mt-1 border-t border-gray-200 pt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</span>
                        <span className="text-xs font-bold px-2 py-1 rounded-md w-fit" style={{ background: `${PRIMARY}10`, color: PRIMARY }}>
                          {h.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Full History Table ── */}
      <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-gray-800">All Bed Usage History</h3>
          <span className="text-xs text-gray-400">All records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafd' }}>
                {['Bed', 'Patient', 'Date', 'Time In', 'Time Out', 'Duration'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allUsageHistory.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records</td></tr>
              ) : allUsageHistory.map((h, i) => (
                <tr key={`${h._bedNumber}-hist-${i}`} className={h.timeOut === '(current)' ? "hover:bg-red-50/30 transition-colors" : "hover:bg-gray-50 transition-colors"}>
                  <td className="px-5 py-3 text-sm font-medium text-gray-700">Bed {h._bedNumber}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{h.patientName}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{h.date}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{h.timeIn}</td>
                  <td className="px-5 py-3">
                    {h.timeOut === '(current)' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${RED}15`, color: RED }}>Current</span>
                    ) : (
                      <span className="text-sm text-gray-500">{h.timeOut}</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 font-medium" style={{ color: PRIMARY }}>{h.duration}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards for Full History */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="px-1 flex items-center justify-between mb-1">
          <h3 className="text-gray-800 font-bold">All Bed Usage History</h3>
          <span className="text-xs text-gray-400">{allUsageHistory.length} records</span>
        </div>
        {allUsageHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            No records
          </div>
        ) : allUsageHistory.map((h, i) => (
          <div key={`${h._bedNumber}-hist-${i}`} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-1 rounded-md text-white" style={{ background: PRIMARY }}>
                  Bed {h._bedNumber}
                </span>
                <span className="font-bold text-gray-900 text-sm">{h.patientName}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date & Time In</span>
                <span className="text-xs text-gray-700">{h.date} <br/> <span className="text-gray-500 font-medium">{h.timeIn}</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time Out</span>
                <div className="mt-0.5">
                  {h.timeOut === '(current)' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide" style={{ background: `${RED}15`, color: RED }}>
                      Current
                    </span>
                  ) : (
                    <span className="text-xs text-gray-700">{h.timeOut}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col col-span-2 mt-1 border-t border-gray-200 pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</span>
                <span className="text-xs font-bold px-2 py-1 rounded-md w-fit bg-blue-50" style={{ color: PRIMARY }}>
                  {h.duration}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Assign Patient — Bed {assignModal.bedNumber}</h3>
              <button onClick={() => setAssignModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Patient</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
                <option value="">Select a patient...</option>
                {patients.map(p => {
                  const isAlreadyOccupied = occupiedPatientIds.includes(p.id) || (p.name && occupiedPatientNames.includes(p.name.trim().toLowerCase()));
                  const assignedBed = beds.find(b => b.status === 'Occupied' && (b.patientId === p.id || (b.patientName && p.name && b.patientName.trim().toLowerCase() === p.name.trim().toLowerCase())));
                  return (
                    <option 
                      key={p.id} 
                      value={p.id} 
                      disabled={isAlreadyOccupied}
                      style={isAlreadyOccupied ? { color: '#9ca3af', backgroundColor: '#f3f4f6' } : undefined}
                    >
                      {p.name} ({p.category}){isAlreadyOccupied ? ` — Already Occupied in Bed ${assignedBed?.bedNumber}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Assignment</label>
              <input type="text" value={assignReason} onChange={e => setAssignReason(e.target.value)}
                placeholder="e.g. Resting, Observation"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Allotted Time (minutes)</label>
              <input type="number" value={assignTime} onChange={e => setAssignTime(e.target.value)}
                placeholder="e.g. 10 (Optional)" min="1"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAssignModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedPatient}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: PRIMARY }}>
                <UserCheck size={14} /> Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Modal */}
      {releaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Release Bed {releaseModal.bedNumber}</h3>
              <button onClick={() => setReleaseModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Releasing bed occupied by <strong>{releaseModal.patientName}</strong>.
            </p>
            <p className="text-sm text-gray-400">Duration will be auto-calculated and saved to history.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setReleaseModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleRelease} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{ background: RED }}>Release Bed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
