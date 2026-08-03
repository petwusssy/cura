import { useState } from 'react';
import { Search, Eye, Edit2, Upload, Calendar, Ambulance, X, Save, CheckCircle } from 'lucide-react';
import { Patient, Consultation, HospitalTransfer, Page } from '../types';

const PRIMARY = '#1B3A6B';
const RED = '#D64545';
const YELLOW = '#F4C542';

const HOSPITALS = [
  'Jose B. Lingad Memorial Regional Hospital',
  'City of San Fernando District Hospital',
  'Pampanga Provincial Hospital',
  'St. Francis Medical Center',
  'Our Lady of the Assumption Hospital',
  'Angeles University Foundation Medical Center',
  'Other (specify)',
];

const TRANSPORT_MODES = ['Ambulance', 'Private vehicle', 'Tricycle/taxi', 'Walking', 'Other'];

const TRANSFER_REASONS = [
  'Requires advanced/specialist care',
  'High fever requiring IV medication',
  'Severe injury requiring surgery',
  'Cardiac emergency',
  'Respiratory distress',
  'Seizure / neurological emergency',
  'Obstetric emergency',
  'Patient/family request',
  'Other',
];

interface ConsultationTabProps {
  patients: Patient[];
  consultations: Consultation[];
  transfers: HospitalTransfer[];
  onUpdateConsultation: (c: Consultation) => void | Promise<void>;
  onAddTransfer: (t: HospitalTransfer) => void;
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
}

export function ConsultationTab({
  patients, consultations, transfers, onUpdateConsultation, onAddTransfer, onNavigate, onSelectPatient,
}: ConsultationTabProps) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewDetail, setViewDetail] = useState<Consultation | null>(null);
  const [transferModal, setTransferModal] = useState<Consultation | null>(null);
  const [activeTab, setActiveTab] = useState<'consultations' | 'transfers'>('consultations');

  // Transfer form state
  const [tfHospital, setTfHospital] = useState('');
  const [tfHospitalOther, setTfHospitalOther] = useState('');
  const [tfReason, setTfReason] = useState('');
  const [tfReasonOther, setTfReasonOther] = useState('');
  const [tfTransport, setTfTransport] = useState('Ambulance');
  const [tfNotes, setTfNotes] = useState('');

  const doctorConsultations = Object.values(
    consultations
      .filter(c => c.status === 'Consultation')
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

  const filtered = doctorConsultations.filter(c => {
    const patient = patients.find(p => p.id === c.patientId);
    const q = search.toLowerCase();
    const matchSearch = !q || patient?.name.toLowerCase().includes(q) || c.complaint.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    const matchDate = !dateFilter || c.date === dateFilter;
    return matchSearch && matchDate;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.timeIn.localeCompare(a.timeIn));

  const filteredTransfers = transfers.filter(t => {
    const patient = patients.find(p => p.id === t.patientId);
    const q = search.toLowerCase();
    const matchSearch = !q || patient?.name.toLowerCase().includes(q) || t.receivingHospital.toLowerCase().includes(q);
    const matchDate = !dateFilter || t.date === dateFilter;
    return matchSearch && matchDate;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const openTransferModal = (c: Consultation) => {
    setTransferModal(c);
    setTfHospital('');
    setTfHospitalOther('');
    setTfReason('');
    setTfReasonOther('');
    setTfTransport('Ambulance');
    setTfNotes('');
  };

  const handleSaveTransfer = async () => {
    if (!transferModal) return;
    const hospital = tfHospital === 'Other (specify)' ? tfHospitalOther : tfHospital;
    const reason = tfReason === 'Other' ? tfReasonOther : tfReason;
    if (!hospital || !reason) return;

    const transfer: HospitalTransfer = {
      id: `TRF-${Date.now()}`,
      consultationId: transferModal.id,
      patientId: transferModal.patientId,
      date: '2026-06-27',
      time: new Date().toTimeString().slice(0, 5),
      receivingHospital: hospital,
      reason,
      transportMode: tfTransport,
      notes: tfNotes,
      transferredBy: 'Dr. Rosario Mendez',
    };
    onAddTransfer(transfer);
    
    try {
      await onUpdateConsultation({ ...transferModal, transferred: true });
      setTransferModal(null);
    } catch (e) {
      console.error('Failed to update consultation transfer status', e);
      alert('Error saving transfer status.');
    }
  };

  const catBadge = (cat?: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      Student:  { bg: '#E3F2FD', text: '#1B3A6B' },
      Employee: { bg: '#E8F5E9', text: '#2E7D32' },
      Outsider: { bg: '#F3E5F5', text: '#6A1B9A' },
    };
    const c = map[cat || ''] ?? { bg: '#f3f4f6', text: '#6b7280' };
    return c;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Consultations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Patients seen by doctor</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-full bg-blue-50 text-sm font-semibold" style={{ color: PRIMARY }}>
            {filtered.length} records
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'consultations', label: 'Consultations' },
          { id: 'transfers', label: `Transfers (${transfers.length})` },
        ] as { id: typeof activeTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === t.id ? 'white' : 'transparent',
              color: activeTab === t.id ? PRIMARY : '#6b7280',
              boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex gap-4 items-center flex-wrap"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={activeTab === 'consultations' ? 'Search patient or complaint...' : 'Search patient or hospital...'} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B]" />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-gray-50" />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">Clear</button>
          )}
        </div>
      </div>

      {/* ── Consultations Table ── */}
      {activeTab === 'consultations' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafd' }}>
                  {['Patient', 'Date & Time', 'Complaint', 'Doctor', 'Medicine', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400"><Search size={32} className="mx-auto mb-2 opacity-30" />No consultations found</td></tr>
                ) : filtered.map(c => {
                  const patient = patients.find(p => p.id === c.patientId);
                  const bc = catBadge(patient?.category);
                  return (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: PRIMARY }}>
                            {patient?.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{patient?.name}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: bc.bg, color: bc.text }}>{patient?.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-700">{c.date}</div>
                        <div className="text-xs text-gray-400">{c.timeIn} – {c.timeOut || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[180px]">
                        <div className="truncate">{c.complaint}</div>
                        {c.categories.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {c.categories.slice(0, 2).map(cat => (
                              <span key={cat} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{cat}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{c.doctorName || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {c.treatments.length === 0 ? <span className="text-gray-400">None</span> :
                          <div className="space-y-0.5">
                            {c.treatments.slice(0, 2).map(t => (
                              <div key={t.id} className="text-xs">{t.medicineName} ×{t.quantity}</div>
                            ))}
                            {c.treatments.length > 2 && <div className="text-xs text-gray-400">+{c.treatments.length - 2}</div>}
                          </div>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 w-fit" style={{ color: PRIMARY }}>
                            Consultation
                          </span>
                          {c.transferred && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-50 text-orange-700 w-fit">Transferred</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { onSelectPatient(c.patientId); onNavigate('patient-profile'); }}
                            title="View Patient" className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: PRIMARY }}>
                            <Eye size={15} />
                          </button>
                          <button onClick={() => setViewDetail(c)} title="View Details"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => openTransferModal(c)}
                            title="Transfer to Hospital"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: c.transferred ? '#9ca3af' : '#EA6C00', background: c.transferred ? 'transparent' : '#FFF3E0' }}
                          >
                            <Ambulance size={15} />
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
      )}

      {/* ── Transfers Table ── */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafd' }}>
                  {['Patient', 'Date & Time', 'Receiving Hospital', 'Reason', 'Transport', 'Transferred By'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransfers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Ambulance size={32} className="mx-auto mb-2 opacity-30" />No transfers recorded</td></tr>
                ) : filteredTransfers.map(t => {
                  const patient = patients.find(p => p.id === t.patientId);
                  return (
                    <tr key={t.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#EA6C00' }}>
                            {patient?.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{patient?.name}</div>
                            <div className="text-xs text-gray-400">{patient?.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-700">{t.date}</div>
                        <div className="text-xs text-gray-400">{t.time}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 max-w-[200px]">
                        <div className="truncate font-medium">{t.receivingHospital}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[180px]">
                        <div className="truncate">{t.reason}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 font-medium">{t.transportMode}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{t.transferredBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Transfer Modal ── */}
      {transferModal && (() => {
        const patient = patients.find(p => p.id === transferModal.patientId);
        const hospitalFinal = tfHospital === 'Other (specify)' ? tfHospitalOther : tfHospital;
        const reasonFinal = tfReason === 'Other' ? tfReasonOther : tfReason;
        const canSave = hospitalFinal.trim() && reasonFinal.trim();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFF3E0', color: '#EA6C00' }}>
                      <Ambulance size={16} />
                    </div>
                    <h3 className="text-gray-900">Transfer to Other Hospital</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-10">Patient: <strong>{patient?.name}</strong> — {transferModal.complaint}</p>
                </div>
                <button onClick={() => setTransferModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                {/* Receiving hospital */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Receiving Hospital *</label>
                  <select value={tfHospital} onChange={e => setTfHospital(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                    <option value="">Select hospital...</option>
                    {HOSPITALS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {tfHospital === 'Other (specify)' && (
                    <input type="text" value={tfHospitalOther} onChange={e => setTfHospitalOther(e.target.value)}
                      placeholder="Enter hospital name"
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Transfer *</label>
                  <select value={tfReason} onChange={e => setTfReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                    <option value="">Select reason...</option>
                    {TRANSFER_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {tfReason === 'Other' && (
                    <input type="text" value={tfReasonOther} onChange={e => setTfReasonOther(e.target.value)}
                      placeholder="Specify reason"
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  )}
                </div>

                {/* Transport */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mode of Transport</label>
                  <div className="flex flex-wrap gap-2">
                    {TRANSPORT_MODES.map(m => (
                      <button key={m} type="button" onClick={() => setTfTransport(m)}
                        className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
                        style={{
                          background: tfTransport === m ? '#EA6C00' : 'white',
                          color: tfTransport === m ? 'white' : '#6b7280',
                          borderColor: tfTransport === m ? '#EA6C00' : '#e5e7eb',
                        }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes / Additional Info</label>
                  <textarea value={tfNotes} onChange={e => setTfNotes(e.target.value)} rows={3}
                    placeholder="e.g., patient's current vitals, accompanying personnel, referral details..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none" />
                </div>

                {/* Transferred by */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transferred By</label>
                  <input type="text" defaultValue="Grace Aquino, RN" readOnly
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setTransferModal(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveTransfer} disabled={!canSave}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{ background: '#EA6C00' }}>
                  <CheckCircle size={15} /> Log Transfer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Consultation Detail Modal ── */}
      {viewDetail && (() => {
        const patient = patients.find(p => p.id === viewDetail.patientId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="text-gray-900">{patient?.name}</h3>
                  <p className="text-sm text-gray-400">{viewDetail.date} • {viewDetail.timeIn}</p>
                </div>
                <button onClick={() => setViewDetail(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Complaint</div>
                  <div className="text-sm text-gray-700">{viewDetail.complaint}</div>
                </div>
                {Object.values(viewDetail.vitals).some(v => v) && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vital Signs</div>
                    <div className="grid grid-cols-4 gap-2">
                      {[['Height', viewDetail.vitals.height, 'cm'], ['Weight', viewDetail.vitals.weight, 'kg'], ['Temp', viewDetail.vitals.temp, '°C'], ['BP', viewDetail.vitals.bp, 'mmHg'], ['HR', viewDetail.vitals.hr, 'bpm'], ['RR', viewDetail.vitals.rr, 'rpm'], ['O2 Sat', viewDetail.vitals.o2, '%']].map(([label, val, unit]) => val ? (
                        <div key={label as string} className="bg-gray-50 rounded-xl p-2 text-center">
                          <div className="text-xs text-gray-400">{label}</div>
                          <div className="text-sm font-semibold text-gray-800">{val} <span className="text-xs font-normal text-gray-400">{unit}</span></div>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}
                {viewDetail.treatments.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Treatments</div>
                    <div className="space-y-2">
                      {viewDetail.treatments.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-2.5 bg-green-50 rounded-xl">
                          <span className="text-sm font-medium text-green-800">{t.medicineName}</span>
                          <span className="text-xs text-green-600">×{t.quantity} {t.unit}</span>
                          <span className="text-xs text-green-600">Given: {t.timeGiven}</span>
                          {t.nextDose && <span className="text-xs text-green-600">Next: {t.nextDose}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {viewDetail.nurseNotes && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nurse Notes</div>
                    <div className="text-sm text-gray-700 bg-yellow-50 rounded-xl p-3">{viewDetail.nurseNotes}</div>
                  </div>
                )}
                {/* Prescription upload */}
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Doctor's Prescription</div>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-sm text-gray-500">
                    <Upload size={16} />
                    <span>{viewDetail.prescriptionImage ? 'Change prescription image' : 'Upload prescription image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files?.[0]) {
                        const reader = new FileReader();
                        reader.onload = ev => onUpdateConsultation({ ...viewDetail, prescriptionImage: ev.target?.result as string });
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }} />
                  </label>
                  {viewDetail.prescriptionImage && (
                    <img src={viewDetail.prescriptionImage} alt="Prescription" className="mt-2 rounded-xl max-h-48 object-contain" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
