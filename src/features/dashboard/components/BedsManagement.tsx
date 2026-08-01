import { useState, useEffect } from 'react';
import { BedDouble, Clock, X, UserCheck, History, Users } from 'lucide-react';
import { Bed, Patient, BedHistory } from '../types';

const PRIMARY = '#1B3A6B';
const RED = '#D64545';

type DateFilterType = 'today' | 'week' | 'month';

const TODAY = '2026-06-27';

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
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const d: Record<string, string> = {};
      beds.forEach(b => {
        if (b.status === 'Occupied' && b.timeOccupied) {
          const diff = now.getTime() - new Date(b.timeOccupied).getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          d[b.id] = `${h}h ${m}m`;
        }
      });
      setDurations(d);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [beds]);
  return durations;
}

interface BedsManagementProps {
  beds: Bed[];
  patients: Patient[];
  onUpdateBed: (bed: Bed) => void;
}

export function BedsManagement({ beds, patients, onUpdateBed }: BedsManagementProps) {
  const [assignModal, setAssignModal] = useState<Bed | null>(null);
  const [releaseModal, setReleaseModal] = useState<Bed | null>(null);
  const [selectedBedTracker, setSelectedBedTracker] = useState<Bed | null>(null);
  const [trackerFilter, setTrackerFilter] = useState<DateFilterType>('today');
  const [gridFilter, setGridFilter] = useState<DateFilterType>('today');
  const [selectedPatient, setSelectedPatient] = useState('');
  const durations = useDurationTimers(beds);

  const available = beds.filter(b => b.status === 'Available').length;
  const occupied = beds.filter(b => b.status === 'Occupied').length;

  // Total usage count per bed within the selected date range (for the grid)
  const bedUsageCount = (bed: Bed, filter: DateFilterType): number => {
    const histCount = bed.history.filter(h => isInRange(h.date, filter)).length;
    const currentCount = bed.status === 'Occupied' && isInRange(TODAY, filter) ? 1 : 0;
    return histCount + currentCount;
  };

  const handleAssign = () => {
    if (!assignModal || !selectedPatient) return;
    const p = patients.find(pt => pt.id === selectedPatient);
    onUpdateBed({
      ...assignModal,
      status: 'Occupied',
      patientName: p?.name,
      patientId: p?.id,
      timeOccupied: new Date().toISOString(),
    });
    setAssignModal(null);
    setSelectedPatient('');
  };

  const handleRelease = () => {
    if (!releaseModal) return;
    const now = new Date();
    const start = releaseModal.timeOccupied ? new Date(releaseModal.timeOccupied) : now;
    const diff = now.getTime() - start.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const entry: BedHistory = {
      patientName: releaseModal.patientName || '',
      patientId: releaseModal.patientId || '',
      date: TODAY,
      timeIn: start.toTimeString().slice(0, 5),
      timeOut: now.toTimeString().slice(0, 5),
      duration: `${h}h ${m}m`,
    };
    onUpdateBed({
      ...releaseModal,
      status: 'Available',
      patientName: undefined,
      patientId: undefined,
      timeOccupied: undefined,
      history: [...releaseModal.history, entry],
    });
    setReleaseModal(null);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Beds Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor bed occupancy and patient assignments</p>
        </div>
        {/* Grid date filter */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['today', 'week', 'month'] as DateFilterType[]).map(f => (
            <button key={f} onClick={() => setGridFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
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
        {beds.map(bed => {
          const isOccupied = bed.status === 'Occupied';
          const dur = durations[bed.id];
          const usageCount = bedUsageCount(bed, gridFilter);
          const isSelected = selectedBedTracker?.id === bed.id;

          return (
            <div
              key={bed.id}
              className="bg-white rounded-xl p-4 transition-all"
              style={{
                boxShadow: isSelected ? `0 0 0 2px ${PRIMARY}` : isOccupied ? `0 4px 20px ${RED}15` : '0 2px 12px rgba(0,0,0,0.06)',
                border: isSelected ? `2px solid ${PRIMARY}` : isOccupied ? `1px solid ${RED}30` : '1px solid #f0f0f0',
              }}
            >
              {/* Bed header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: isOccupied ? `${RED}15` : '#E8F5E915', color: isOccupied ? RED : '#2E7D32' }}>
                    <BedDouble size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Bed {bed.bedNumber}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: isOccupied ? RED : '#E8F5E9', color: isOccupied ? 'white' : '#2E7D32' }}>
                  {bed.status}
                </span>
              </div>

              {/* Usage count badge */}
              <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
                <Users size={11} />
                <span>{usageCount} patient{usageCount !== 1 ? 's' : ''} — {filterLabels[gridFilter].toLowerCase()}</span>
              </div>

              {isOccupied ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-400">Patient</div>
                    <div className="text-sm font-semibold text-gray-800 truncate">{bed.patientName}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: RED }}>
                    <Clock size={11} />
                    <span className="font-medium">{dur || 'calculating...'}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => setReleaseModal(bed)}
                      className="flex-1 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                      style={{ background: RED }}>
                      Release
                    </button>
                    <button
                      onClick={() => setSelectedBedTracker(isSelected ? null : bed)}
                      className="p-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: isSelected ? PRIMARY : '#e5e7eb', color: isSelected ? PRIMARY : '#9ca3af', background: isSelected ? `${PRIMARY}10` : 'white' }}>
                      <History size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 py-1 text-center">Unoccupied</div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setAssignModal(bed); setSelectedPatient(''); }}
                      className="flex-1 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                      style={{ background: PRIMARY }}>
                      Assign Patient
                    </button>
                    <button
                      onClick={() => setSelectedBedTracker(isSelected ? null : bed)}
                      className="p-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: isSelected ? PRIMARY : '#e5e7eb', color: isSelected ? PRIMARY : '#9ca3af', background: isSelected ? `${PRIMARY}10` : 'white' }}>
                      <History size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Per-bed Tracker Panel ── */}
      {selectedBedTracker && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `2px solid ${PRIMARY}30` }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: `${PRIMARY}06` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                <BedDouble size={18} />
              </div>
              <div>
                <div className="font-bold text-gray-900">Bed {selectedBedTracker.bedNumber} — Usage History</div>
                <div className="text-xs text-gray-400">
                  {bedUsageCount(selectedBedTracker, trackerFilter)} patient{bedUsageCount(selectedBedTracker, trackerFilter) !== 1 ? 's' : ''} — {filterLabels[trackerFilter].toLowerCase()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Tracker date filter */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['today', 'week', 'month'] as DateFilterType[]).map(f => (
                  <button key={f} onClick={() => setTrackerFilter(f)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{ background: trackerFilter === f ? 'white' : 'transparent', color: trackerFilter === f ? PRIMARY : '#6b7280', boxShadow: trackerFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    {filterLabels[f]}
                  </button>
                ))}
              </div>
              <button onClick={() => setSelectedBedTracker(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* History table */}
          <div className="overflow-x-auto">
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
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      <BedDouble size={28} className="mx-auto mb-2 opacity-25" />
                      No usage records for {filterLabels[trackerFilter].toLowerCase()}
                    </td>
                  </tr>
                ) : trackerHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: PRIMARY }}>
                          {h.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{h.patientName}</div>
                          {h.patientId && <div className="text-xs text-gray-400">{h.patientId}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{h.date}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{h.timeIn}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {h.timeOut === '(current)' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${RED}15`, color: RED }}>
                          Current / Occupied
                        </span>
                      ) : h.timeOut}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: `${PRIMARY}10`, color: PRIMARY }}>
                        {h.duration}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Full History Table ── */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
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
              {beds.flatMap(bed =>
                [...bed.history, ...(bed.status === 'Occupied' ? [{
                  patientName: bed.patientName || '',
                  patientId: bed.patientId || '',
                  date: TODAY,
                  timeIn: bed.timeOccupied ? new Date(bed.timeOccupied).toTimeString().slice(0, 5) : '—',
                  timeOut: '(current)',
                  duration: durations[bed.id] || '—',
                  _bedNumber: bed.bedNumber,
                }] : [])].map((h, i) => ({
                  ...h,
                  _bedNumber: (h as any)._bedNumber ?? bed.bedNumber,
                }))
              ).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records</td></tr>
              ) : beds.flatMap(bed => [
                ...bed.history.map((h, i) => (
                  <tr key={`${bed.id}-hist-${i}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">Bed {bed.bedNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{h.patientName}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{h.date}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{h.timeIn}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{h.timeOut}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 font-medium" style={{ color: PRIMARY }}>{h.duration}</span></td>
                  </tr>
                )),
                ...(bed.status === 'Occupied' ? [(
                  <tr key={`${bed.id}-current`} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">Bed {bed.bedNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{bed.patientName}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{TODAY}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{bed.timeOccupied ? new Date(bed.timeOccupied).toTimeString().slice(0, 5) : '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${RED}15`, color: RED }}>Current</span>
                    </td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 font-medium" style={{ color: PRIMARY }}>{durations[bed.id] || '—'}</span></td>
                  </tr>
                )] : []),
              ])}
            </tbody>
          </table>
        </div>
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
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
              </select>
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
