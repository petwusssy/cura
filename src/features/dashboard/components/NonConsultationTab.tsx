import { useState } from 'react';
import { Search, ArrowRight, Calendar, Eye, Plus, User, X, Pill } from 'lucide-react';
import { Patient, Consultation, Page } from '../types';

const PRIMARY = '#1E5AA8';
const YELLOW = '#F4C542';

interface NonConsultationTabProps {
  patients: Patient[];
  consultations: Consultation[];
  onConvertToConsultation: (id: string) => void | Promise<void>;
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
  searchQuery: string;
}

export function NonConsultationTab({ patients, consultations, onConvertToConsultation, onNavigate, onSelectPatient, searchQuery }: NonConsultationTabProps) {
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');
  const [converting, setConverting] = useState<string | null>(null);
  const [viewDetail, setViewDetail] = useState<Consultation | null>(null);

  const nonConsultations = Object.values(
    consultations
      .filter(c => c.status === 'Non-Consultation' && !c.complaint.includes('[CONVERTED]'))
      .reduce((acc, c) => {
        if (!acc[c.patientId]) {
          acc[c.patientId] = c;
        } else {
          const cTime = new Date(`${c.date}T${c.timeIn || '00:00'}`).getTime();
          const currTime = new Date(`${acc[c.patientId].date}T${acc[c.patientId].timeIn || '00:00'}`).getTime();
          if (cTime > currTime) {
            acc[c.patientId] = c;
          }
        }
        return acc;
      }, {} as Record<string, Consultation>)
  );

  const isDateMatch = (dateStr: string) => {
    if (datePreset === 'all') return true;
    
    const today = new Date();
    const getLocal = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocal(today);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocal(yesterday);

    if (datePreset === 'today') return dateStr === todayStr;
    if (datePreset === 'yesterday') return dateStr === yesterdayStr;
    if (datePreset === 'week') {
      const target = new Date(dateStr);
      const diffTime = today.getTime() - target.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    if (datePreset === 'custom') {
      return !customDate || dateStr === customDate;
    }
    return true;
  };

  const filtered = nonConsultations.filter(c => {
    const patient = patients.find(p => p.id === c.patientId);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || patient?.name.toLowerCase().includes(q) || c.complaint.toLowerCase().includes(q);
    const matchDate = isDateMatch(c.date);
    return matchSearch && matchDate;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.timeIn.localeCompare(a.timeIn));

  const handleConvert = async (id: string) => {
    setConverting(id);
    try {
      await onConvertToConsultation(id);
    } catch (e) {
      console.error('Failed to convert', e);
      alert('Error converting record.');
    } finally {
      setConverting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Non-Consultation</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 flex items-center rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">{filtered.length} records</span>
          <button
            onClick={() => { onSelectPatient(''); onNavigate('new-non-consultation-tab'); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium flex-1 justify-center sm:flex-none sm:justify-start"
          >
            <Plus size={16} />
            Add Non-Consultation
          </button>
        </div>
      </div>



      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>

        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar shadow-sm">
          {(['all', 'today', 'yesterday', 'week', 'custom'] as const).map(p => {
            const labels = { all: 'All', today: 'Today', yesterday: 'Yesterday', week: 'This Week', custom: 'Custom' };
            return (
              <button
                key={p}
                onClick={() => { setDatePreset(p); if(p !== 'custom') setCustomDate(''); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${datePreset === p ? 'bg-[#1E5AA8] text-white shadow-sm' : 'text-[#1E5AA8] hover:bg-blue-50'}`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in zoom-in-95 duration-200">
            <Calendar size={15} className="text-gray-400 hidden sm:block" />
            <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1E5AA8] bg-white w-full sm:w-auto shadow-sm" />
            {customDate && (
              <button onClick={() => setCustomDate('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 flex-shrink-0">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr style={{ background: '#f8fafd' }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Complaint</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Treatment</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nurse Notes</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Search size={32} className="mx-auto mb-2 opacity-30" />
                    No non-consultation records found
                  </td>
                </tr>
              ) : filtered.map(c => {
                const patient = patients.find(p => p.id === c.patientId);
                const isConverting = converting === c.id;
                return (
                  <tr key={c.id} className={`transition-colors ${isConverting ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: '#9ca3af' }}>
                          {patient?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{patient?.name}</div>
                          <div className="text-xs text-gray-400">{patient?.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-gray-700">{c.date}</div>
                      <div className="text-xs text-gray-400">{c.timeIn}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[160px]">
                      <div className="truncate">{c.complaint}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.treatments.length === 0 ? (
                        <span className="text-gray-400 text-sm">None</span>
                      ) : (
                        <div className="space-y-0.5">
                          {c.treatments.slice(0, 2).map(t => (
                            <div key={t.id} className="text-xs text-gray-600">{t.medicineName} ×{t.quantity}</div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[160px]">
                      <div className="truncate text-xs">{c.nurseNotes || <span className="text-gray-400">—</span>}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewDetail(c)}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => { onSelectPatient(c.patientId); onNavigate('patient-profile'); }}
                          title="View Patient"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <User size={15} />
                        </button>
                        <button
                          onClick={() => handleConvert(c.id)}
                          disabled={isConverting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                          style={{ background: isConverting ? '#9ca3af' : PRIMARY }}
                        >
                          <ArrowRight size={12} />
                          {isConverting ? 'Converting...' : 'Convert'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            <Search size={32} className="mx-auto mb-2 opacity-30" />
            No non-consultation records found
          </div>
        ) : filtered.map(c => {
          const patient = patients.find(p => p.id === c.patientId);
          const isConverting = converting === c.id;
          return (
            <div key={c.id} className={`bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-3 shadow-sm ${isConverting ? 'bg-blue-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: '#9ca3af' }}>
                    {patient?.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 leading-tight">{patient?.name}</span>
                    <span className="text-xs text-gray-500">{patient?.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100 mt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date & Time</span>
                  <span className="text-sm text-gray-700">{c.date} <br/> <span className="text-xs text-gray-500">{c.timeIn}</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Complaint</span>
                  <span className="text-sm text-gray-700">{c.complaint}</span>
                </div>
                <div className="flex flex-col col-span-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Treatment</span>
                  {c.treatments.length === 0 ? (
                    <span className="text-gray-400 text-sm">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {c.treatments.map(t => (
                        <span key={t.id} className="text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">{t.medicineName} ×{t.quantity}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => setViewDetail(c)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5">
                  <Eye size={14} /> Details
                </button>
                <button 
                  onClick={() => handleConvert(c.id)}
                  disabled={isConverting}
                  className="flex-1 py-2 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-60">
                  <ArrowRight size={14} /> {isConverting ? 'Converting...' : 'Convert'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Non-Consultation Detail Modal ── */}
      {viewDetail && (() => {
        const patient = patients.find(p => p.id === viewDetail.patientId);
        return (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md rounded-t-2xl z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Non-Consultation Record: {patient?.name}
                  </h3>
                  <p className="text-sm text-gray-500">{viewDetail.date} • {viewDetail.timeIn}</p>
                </div>
                <button
                  onClick={() => setViewDetail(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/30">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Main Details */}
                   <div className="space-y-4">
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visit Details</h4>
                       <div className="space-y-3">
                         {viewDetail.purposeOfVisit && (
                           <div>
                             <span className="text-xs text-gray-500 block mb-1">Purpose of Visit</span>
                             <div className="text-sm font-medium text-gray-800">{viewDetail.purposeOfVisit}</div>
                           </div>
                         )}
                         <div>
                           <span className="text-xs text-gray-500 block mb-1">Complaint / Issue</span>
                           <div className="text-sm font-medium text-gray-800">{viewDetail.complaint}</div>
                         </div>
                         <div>
                           <span className="text-xs text-gray-500 block mb-1">Categories</span>
                           <div className="flex flex-wrap gap-1.5">
                             {viewDetail.categories?.length ? viewDetail.categories.map((cat, idx) => (
                               <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{cat}</span>
                             )) : <span className="text-sm text-gray-500">—</span>}
                           </div>
                         </div>
                         {viewDetail.assistingNurse && (
                           <div>
                             <span className="text-xs text-gray-500 block mb-1">Assisting Nurse</span>
                             <div className="text-sm font-medium text-gray-800">{viewDetail.assistingNurse}</div>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
  
                   {/* Right Column */}
                   <div className="space-y-4">
                     {/* Notes */}
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                       <div>
                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Operational Notes & Readings</h4>
                         <div className="text-sm text-gray-700 whitespace-pre-line">{viewDetail.operationalNotes || '—'}</div>
                       </div>
                       {viewDetail.nurseNotes && (
                         <div className="border-t border-gray-100 pt-3">
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nurse's Notes</h4>
                           <div className="text-sm text-gray-700 whitespace-pre-line">{viewDetail.nurseNotes}</div>
                         </div>
                       )}
                     </div>

                     {/* Treatments */}
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Medicines & Treatments</h4>
                       {viewDetail.treatments && viewDetail.treatments.length > 0 ? (
                         <div className="space-y-2.5">
                           {viewDetail.treatments.map((t, idx) => (
                             <div key={idx} className="flex items-center justify-between p-2.5 bg-green-50/50 rounded-lg border border-green-100/50">
                               <div className="flex items-center gap-2.5">
                                 <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                   <Pill size={14} />
                                 </div>
                                 <div>
                                   <div className="text-sm font-bold text-gray-800">{t.medicineName}</div>
                                   <div className="text-xs text-gray-500">{t.quantity} {t.unit} • Given {t.timeGiven}</div>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-sm text-gray-500 italic">No medicines dispensed</div>
                       )}
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
