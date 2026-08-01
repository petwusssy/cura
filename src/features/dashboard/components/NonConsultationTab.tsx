import { useState } from 'react';
import { Search, ArrowRight, Calendar, Eye } from 'lucide-react';
import { Patient, Consultation, Page } from '../types';

const PRIMARY = '#1E5AA8';
const YELLOW = '#F4C542';

interface NonConsultationTabProps {
  patients: Patient[];
  consultations: Consultation[];
  onConvertToConsultation: (id: string) => void;
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
}

export function NonConsultationTab({ patients, consultations, onConvertToConsultation, onNavigate, onSelectPatient }: NonConsultationTabProps) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [converting, setConverting] = useState<string | null>(null);

  const nonConsultations = consultations.filter(c => c.status === 'Non-Consultation');

  const filtered = nonConsultations.filter(c => {
    const patient = patients.find(p => p.id === c.patientId);
    const q = search.toLowerCase();
    const matchSearch = !q || patient?.name.toLowerCase().includes(q) || c.complaint.toLowerCase().includes(q);
    const matchDate = !dateFilter || c.date === dateFilter;
    return matchSearch && matchDate;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.timeIn.localeCompare(a.timeIn));

  const handleConvert = (id: string) => {
    setConverting(id);
    setTimeout(() => {
      onConvertToConsultation(id);
      setConverting(null);
    }, 600);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Non-Consultation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Patients not seen by doctor</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">{filtered.length} records</span>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: `${YELLOW}15`, border: `1px solid ${YELLOW}50` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: YELLOW, color: '#000' }}>
          <ArrowRight size={16} />
        </div>
        <div className="text-sm text-gray-700">
          Use <strong>Convert to Consultation</strong> to move a record to the Consultations tab when the patient sees a doctor. This action cannot be undone.
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex gap-4 items-center flex-wrap"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search patient or complaint..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E5AA8]" />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5AA8] bg-gray-50" />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
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
                          onClick={() => { onSelectPatient(c.patientId); onNavigate('patient-profile'); }}
                          title="View Patient"
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <Eye size={15} />
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
    </div>
  );
}
