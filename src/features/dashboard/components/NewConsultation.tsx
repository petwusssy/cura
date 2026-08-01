import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Save, Clock } from 'lucide-react';
import { Patient, Consultation, Treatment, Page } from '../types';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';

const CASE_CATEGORIES = [
  'Fever', 'Headache/Dizziness', 'Cough/Colds', 'Sore Throat', 'Nausea/Vomiting',
  'Abdominal Pain', 'Diarrhea', 'Hypertension', 'Hypoglycemia', 'Wounds (abrasion/laceration/puncture)',
  'Pain (upper and lower body)', 'Allergy/Rashes', 'Asthma', 'UTI (urinary tract infection)',
  'Eye Complaint', 'Ear Complaint', 'Toothache', 'Seizure', 'Fainting/Syncope',
  'Sprain', 'Stiff Neck', 'Back Pain', 'Chest Pain', 'Palpitation', 'Others',
];

const MEDICINES = [
  'Biogesic 500mg', 'Paracetamol 500mg', 'Ibuprofen 400mg', 'Mefenamic 500mg',
  'Buscopan', 'Dimetapp', 'Cetirizine 10mg', 'Benadryl 25mg', 'Omeprazole 20mg',
  'Metronidazole 500mg', 'Strepsils', 'Gaviscon', 'Hydrite', 'Kremil-S',
];

const UNITS = ['tablet', 'capsule', 'sachet', 'lozenge', 'piece', 'bottle', 'mL', 'application'];

interface NewConsultationProps {
  patient: Patient;
  onSave: (consultation: Consultation) => void | Promise<void>;
  onNavigate: (page: Page) => void;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function NewConsultation({ patient, onSave, onNavigate }: NewConsultationProps) {
  const [date] = useState('2026-06-27');
  const [timeIn] = useState(now());
  const [complaint, setComplaint] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [doctorConsulted, setDoctorConsulted] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Rosario Mendez');
  const [whoConsulted, setWhoConsulted] = useState('');
  const [vitals, setVitals] = useState({ height: '', weight: '', temp: '', bp: '', hr: '', rr: '', o2: '', notes: '' });
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [earlyDismissal, setEarlyDismissal] = useState(false);
  const [earlyReason, setEarlyReason] = useState('');
  const [fetcherName, setFetcherName] = useState('');
  const [nurseNotes, setNurseNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [status, setStatus] = useState<'Consultation' | 'Non-Consultation'>('Non-Consultation');

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const addTreatment = () => {
    const t: Treatment = {
      id: `t${Date.now()}`, medicineName: '', quantity: 1, unit: 'tablet',
      timeGiven: now(), nextDose: '', remarks: '',
    };
    setTreatments(prev => [...prev, t]);
  };

  const updateTreatment = (id: string, field: keyof Treatment, value: string | number) => {
    setTreatments(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTreatment = (id: string) => {
    setTreatments(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const consultation: Consultation = {
      id: `CON-${Date.now()}`,
      patientId: patient.id,
      date, timeIn,
      timeOut: doctorConsulted ? now() : undefined,
      complaint, categories,
      doctorConsulted, doctorName: doctorConsulted ? doctorName : undefined,
      whoConsulted: doctorConsulted ? whoConsulted : undefined,
      vitals, treatments,
      earlyDismissal,
      earlyDismissalReason: earlyDismissal ? earlyReason : undefined,
      fetcherName: earlyDismissal ? fetcherName : undefined,
      nurseNotes, recommendations, followUp,
      status: doctorConsulted ? 'Consultation' : status,
    };
    try {
      await onSave(consultation);
      onNavigate('patients');
    } catch (err) {
      console.error('Failed to save consultation', err);
      alert('Failed to save consultation. Please check console for details.');
    }
  };

  const sectionCard = (title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
      <h3 className="text-gray-800 mb-4 pb-3 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] bg-white transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => onNavigate('patients')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-gray-900">New Consultation</h1>
          <p className="text-sm text-gray-400">Patient: <strong>{patient.name}</strong> ({patient.id})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Visit Info */}
        {sectionCard('Visit Information', (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date</label>
              <input type="text" readOnly value={date} className={inputCls + ' bg-gray-50'} />
            </div>
            <div>
              <label className={labelCls}>Time In</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" readOnly value={timeIn} className={inputCls + ' pl-8 bg-gray-50'} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className={inputCls}>
                <option value="Non-Consultation">Non-Consultation</option>
                <option value="Consultation">Consultation</option>
              </select>
            </div>
          </div>
        ))}

        {/* Chief Complaint */}
        {sectionCard('Chief Complaint', (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Complaint / Presenting Problem</label>
              <textarea
                value={complaint}
                onChange={e => setComplaint(e.target.value)}
                rows={2}
                placeholder="Describe the patient's chief complaint..."
                className={inputCls + ' resize-none'}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Case Categories</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CASE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium"
                    style={{
                      background: categories.includes(cat) ? PRIMARY : 'white',
                      color: categories.includes(cat) ? 'white' : '#6b7280',
                      borderColor: categories.includes(cat) ? PRIMARY : '#e5e7eb',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Doctor Consultation */}
        {sectionCard('Doctor Consultation', (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Doctor Consulted?</label>
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setDoctorConsulted(v)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={{
                      background: doctorConsulted === v ? PRIMARY : 'white',
                      color: doctorConsulted === v ? 'white' : '#6b7280',
                      borderColor: doctorConsulted === v ? PRIMARY : '#e5e7eb',
                    }}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            {doctorConsulted && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Doctor's Name</label>
                  <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Who Consulted</label>
                  <input type="text" value={whoConsulted} onChange={e => setWhoConsulted(e.target.value)} placeholder="e.g., Patient, Parent" className={inputCls} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Assessment / Vitals */}
        {sectionCard('Assessment / Vital Signs', (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'height', label: 'Height (cm)' }, { key: 'weight', label: 'Weight (kg)' },
                { key: 'temp', label: 'Temp (°C)' }, { key: 'bp', label: 'BP (mmHg)' },
                { key: 'hr', label: 'HR (bpm)' }, { key: 'rr', label: 'RR (rpm)' },
                { key: 'o2', label: 'O2 Sat (%)' },
              ].map(v => (
                <div key={v.key}>
                  <label className={labelCls}>{v.label}</label>
                  <input
                    type="text"
                    value={(vitals as any)[v.key]}
                    onChange={e => setVitals(prev => ({ ...prev, [v.key]: e.target.value }))}
                    placeholder="—"
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className={labelCls}>Assessment Notes</label>
              <textarea
                value={vitals.notes}
                onChange={e => setVitals(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Clinical observations..."
                className={inputCls + ' resize-none'}
              />
            </div>
          </div>
        ))}

        {/* Treatment */}
        {sectionCard('Treatment / Medicines Given', (
          <div className="space-y-3">
            {treatments.map((t, i) => (
              <div key={t.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine #{i + 1}</span>
                  <button type="button" onClick={() => removeTreatment(t.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Medicine Name</label>
                    <input
                      type="text"
                      list={`med-list-${t.id}`}
                      value={t.medicineName}
                      onChange={e => updateTreatment(t.id, 'medicineName', e.target.value)}
                      placeholder="Select or type medicine..."
                      className={inputCls}
                    />
                    <datalist id={`med-list-${t.id}`}>
                      {MEDICINES.map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className={labelCls}>Quantity</label>
                    <input type="number" min={1} value={t.quantity} onChange={e => updateTreatment(t.id, 'quantity', Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <select value={t.unit} onChange={e => updateTreatment(t.id, 'unit', e.target.value)} className={inputCls}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Time Given</label>
                    <input type="time" value={t.timeGiven} onChange={e => updateTreatment(t.id, 'timeGiven', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Next Dose</label>
                    <input type="time" value={t.nextDose ?? ''} onChange={e => updateTreatment(t.id, 'nextDose', e.target.value)} className={inputCls} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className={labelCls}>Remarks</label>
                    <input type="text" value={t.remarks ?? ''} onChange={e => updateTreatment(t.id, 'remarks', e.target.value)} placeholder="e.g., Take after meals" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTreatment}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-all w-full justify-center"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              <Plus size={16} /> Add Medicine
            </button>
          </div>
        ))}

        {/* Early Dismissal */}
        {sectionCard('Early Dismissal', (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Early Dismissal?</label>
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setEarlyDismissal(v)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={{
                      background: earlyDismissal === v ? (v ? RED : PRIMARY) : 'white',
                      color: earlyDismissal === v ? 'white' : '#6b7280',
                      borderColor: earlyDismissal === v ? (v ? RED : PRIMARY) : '#e5e7eb',
                    }}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            {earlyDismissal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Reason</label>
                  <input type="text" value={earlyReason} onChange={e => setEarlyReason(e.target.value)} placeholder="Reason for early dismissal" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fetcher Name</label>
                  <input type="text" value={fetcherName} onChange={e => setFetcherName(e.target.value)} placeholder="Name of person picking up" className={inputCls} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Nurse Notes */}
        {sectionCard('Nurse Notes & Recommendations', (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Assisting Nurse</label>
              <input type="text" defaultValue="Grace Aquino, RN" readOnly className={inputCls + ' bg-gray-50'} />
            </div>
            <div>
              <label className={labelCls}>Nurse Notes</label>
              <textarea value={nurseNotes} onChange={e => setNurseNotes(e.target.value)} rows={2} placeholder="Nursing observations and interventions..." className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className={labelCls}>Recommendations</label>
              <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={2} placeholder="Discharge recommendations..." className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className={labelCls}>Follow-up</label>
              <input type="text" value={followUp} onChange={e => setFollowUp(e.target.value)} placeholder="e.g., Return if fever persists after 3 days" className={inputCls} />
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-4">
          <button type="button" onClick={() => onNavigate('patients')} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90" style={{ background: PRIMARY }}>
            <Save size={16} /> Save Consultation
          </button>
        </div>
      </form>
    </div>
  );
}
