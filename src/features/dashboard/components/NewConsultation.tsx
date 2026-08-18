import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Save, Clock, Calendar, Search } from 'lucide-react';
import { Patient, Consultation, Treatment, Page } from '../types';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';

const DEFAULT_CASE_CATEGORIES = [
  'Fever', 'Headache/Dizziness', 'Cough/Colds', 'Sore Throat', 'Nausea/Vomiting',
  'Abdominal Pain', 'Diarrhea', 'Hypertension', 'Hypoglycemia', 'Wounds (abrasion/laceration/puncture)',
  'Pain (upper and lower body)', 'Allergy/Rashes', 'Asthma', 'UTI (urinary tract infection)',
  'Eye Complaint', 'Ear Complaint', 'Toothache', 'Seizure', 'Fainting/Syncope',
  'Sprain', 'Stiff Neck', 'Back Pain', 'Chest Pain', 'Palpitation', 'Others',
  'Abdominal Pain/Stomachache', 'Accidents', 'Acute Gingivitis', 'Acute Resp. Tract Infection',
  'Allergy', 'Allergic Rhinitis', 'Anxiety', 'Blister', 'Body weakness/malaise', 'Body pain',
  'Burns', 'Cat bite/scratch', 'Cellulitis', 'Chicken pox', 'Chest pain/tightness/Palpitation',
  'Colds', 'Contusion/bumps', 'Cough', 'Cyst', 'Dengue Fever', 'Diarrhea/LBM', 'Dislocation/Fracture',
  'Dizziness', 'Dyspepsia', 'Dog bite/scratch', 'Dysmenorrhea', 'Difficulty of breathing',
  'Ear pain', 'Eye irritation/Sore eyes', 'Fainting', 'Furuncle/carbuncle/boils',
  'Gastritis/Hyperacidity/epigastric pain/heartburn', 'Headache', 'Heat stress',
  'Hypotension', 'Hyperventilation', 'Infected toenail', 'Inflammation/swelling',
  'Insect bites', 'Joint pain', 'Lack of sleep', 'Measles', 'Migraine', 'Mouth sore',
  'Mumps', 'Muscle pain', 'Nape pain', 'Nausea', 'Nose bleeding (epistaxis)',
  'Pain Right lower quadrant (T/C Appendicitis)', 'Pruritus/skin irritation/skin condition',
  'Rashes', 'Splinter', 'Tinnitus', 'Vaccine site pain', 'Vertigo', 'Vomiting',
  'Vision blurring', 'Lab works reading', 'Constipation', 'Hair loss', 'Indigestion',
  'Lethargic', 'Fracture', 'Sinusitis'
];



const UNITS = ['tablet', 'capsule', 'sachet', 'lozenge', 'piece', 'bottle', 'mL', 'application'];

interface NewConsultationProps {
  patient?: Patient;
  patients?: Patient[];
  medicines?: MedicineItem[];
  forcedStatus?: 'Consultation' | 'Non-Consultation';
  onSave: (consultation: Consultation) => void | Promise<void>;
  onNavigate: (page: Page) => void;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const today = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export function NewConsultation({ patient, patients = [], medicines = [], forcedStatus, initialData, onSave, onNavigate }: NewConsultationProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(patient?.id || initialData?.patientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Medicine combobox state: keyed by treatment id
  const [medicineSearch, setMedicineSearch] = useState<Record<string, string>>({});
  const [openMedicineDropdown, setOpenMedicineDropdown] = useState<string | null>(null);
  const medicineDropdownRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(e.target as Node)) {
        setOpenMedicineDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const [date, setDate] = useState(initialData?.date || today());
  const [timeIn, setTimeIn] = useState(initialData?.timeIn || now());
  const [complaint, setComplaint] = useState(initialData?.complaint?.replace(' [CONVERTED]', '') || '');
  
  const [caseCategoriesList, setCaseCategoriesList] = useState(DEFAULT_CASE_CATEGORIES);
  const [categories, setCategories] = useState<string[]>(initialData?.categories || []);
  const [newCategory, setNewCategory] = useState('');

  const [doctorName, setDoctorName] = useState(initialData?.doctorName || '');
  const [assistingNurse, setAssistingNurse] = useState(initialData?.assistingNurse || 'UA CLINIC ADMIN');
  
  const [vitals, setVitals] = useState(initialData?.vitals || { height: '', weight: '', temp: '', bp: '', hr: '', rr: '', o2: '', notes: '' });
  const [treatments, setTreatments] = useState<Treatment[]>(initialData?.treatments || []);
  
  const [earlyDismissal, setEarlyDismissal] = useState(initialData?.earlyDismissal || false);
  const [dismissalDestination, setDismissalDestination] = useState(initialData?.dismissalDestination || 'Sent Home');
  const [earlyReason, setEarlyReason] = useState(initialData?.earlyDismissalReason || '');
  const [fetcherName, setFetcherName] = useState(initialData?.fetcherName || '');
  const [fetcherIdImage, setFetcherIdImage] = useState(initialData?.fetcherIdImage || '');
  
  const [nurseNotes, setNurseNotes] = useState(initialData?.nurseNotes || '');
  const [recommendations, setRecommendations] = useState(initialData?.recommendations || '');
  const [followUp, setFollowUp] = useState(initialData?.followUp || '');
  const [status, setStatus] = useState<'Consultation' | 'Non-Consultation'>(forcedStatus || 'Non-Consultation');

  const [purposeOfVisit, setPurposeOfVisit] = useState(initialData?.purposeOfVisit || '');
  const [operationalNotes, setOperationalNotes] = useState(initialData?.operationalNotes || '');
  const [prescriptionImage, setPrescriptionImage] = useState(initialData?.prescriptionImage || '');

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !caseCategoriesList.includes(newCategory.trim())) {
      setCaseCategoriesList(prev => [...prev, newCategory.trim()]);
      setCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient first.');
      return;
    }

    const isConsultation = status === 'Consultation';

    if (isConsultation && !doctorName.trim()) {
      alert("Please specify the Doctor's Name before saving.");
      return;
    }

    const sanitizedTreatments = treatments.map(t => {
      const { id, nextDose, ...rest } = t;
      return {
        ...rest,
        nextDose: nextDose === '' ? undefined : nextDose,
      } as any;
    });

    const consultation: Consultation = {
      id: `CON-${Date.now()}`,
      patientId: selectedPatientId,
      date, timeIn,
      timeOut: isConsultation ? now() : undefined,
      complaint, categories,
      doctorConsulted: isConsultation,
      doctorName: isConsultation ? doctorName : undefined,
      assistingNurse,
      vitals, treatments: sanitizedTreatments,
      earlyDismissal: isConsultation ? earlyDismissal : false,
      dismissalDestination: (isConsultation && earlyDismissal) ? dismissalDestination : undefined,
      earlyDismissalReason: (isConsultation && earlyDismissal) ? earlyReason : undefined,
      fetcherName: (isConsultation && earlyDismissal && dismissalDestination === 'Sent Home') ? fetcherName : undefined,
      fetcherIdImage: (isConsultation && earlyDismissal && dismissalDestination === 'Sent Home') ? fetcherIdImage : undefined,
      nurseNotes: isConsultation ? nurseNotes : undefined,
      recommendations: isConsultation ? recommendations : undefined,
      followUp: isConsultation ? followUp : undefined,
      status,
      purposeOfVisit: !isConsultation ? purposeOfVisit : undefined,
      operationalNotes: !isConsultation ? operationalNotes : undefined,
      prescriptionImage: prescriptionImage || undefined,
    };
    try {
      await onSave(consultation);
      if (status === 'Consultation') {
        onNavigate('consultations');
      } else {
        onNavigate('non-consultations');
      }
    } catch (err) {
      console.error('Failed to save consultation', err);
      alert('Failed to save consultation. Please check console for details.');
    }
  };

  const sectionCard = (title: string, children: React.ReactNode) => (
    <div className="bg-blue-50 dark:bg-[#1a1b26] rounded-2xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md">
      <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-5 pb-3 border-b border-gray-200 dark:border-gray-800/50">{title}</h3>
      {children}
    </div>
  );

  const inputCls = 'w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] bg-white dark:bg-[#13141f] text-gray-900 dark:text-gray-100 transition-all shadow-sm';
  const labelCls = 'block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => onNavigate(patient ? 'patient-profile' : 'consultations')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">New Consultation</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Select Patient */}
        {patient ? sectionCard('Patient Information', (
          <div>
            <label className={labelCls}>Patient</label>
            <div className={inputCls + ' bg-gray-50 dark:bg-[#13141f] cursor-not-allowed opacity-80'}>
              {patient.name}
            </div>
          </div>
        )) : sectionCard('Select Patient', (
          <div className="relative" ref={dropdownRef}>
            <label className={labelCls}>Patient *</label>
            <div 
              className={inputCls + ' flex items-center justify-between cursor-pointer'}
              onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
            >
              <span className={selectedPatientId ? 'text-gray-900' : 'text-gray-400'}>
                {selectedPatientId ? patients.find(p => p.id === selectedPatientId)?.name : '-- Select Patient --'}
              </span>
            </div>
            
            {isPatientDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#1E5AA8]"
                      placeholder="Search name or ID..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">No patient found</div>
                  ) : filteredPatients.map(p => (
                    <div
                      key={p.id}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setIsPatientDropdownOpen(false);
                        setPatientSearch('');
                      }}
                    >
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.id} • {p.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Visit Info */}
        {sectionCard('Visit Information', (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls + ' pl-8'} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Time In</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                {/* Notice step="60" to avoid seconds, using standard time picker which supports 12-hour format depending on browser */}
                <input type="time" value={timeIn} onChange={e => setTimeIn(e.target.value)} className={inputCls + ' pl-8'} required />
              </div>
            </div>
            {!forcedStatus && (
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className={inputCls}>
                  <option value="Non-Consultation">Non-Consultation</option>
                  <option value="Consultation">Consultation</option>
                </select>
              </div>
            )}
          </div>
        ))}

        {/* Minor Visit Purpose (Non-Consultation ONLY) */}
        {status === 'Non-Consultation' && sectionCard('Minor Visit Purpose', (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Purpose of Visit</label>
              <input type="text" value={purposeOfVisit} onChange={e => setPurposeOfVisit(e.target.value)} placeholder="e.g., Medicine refill, blood pressure check..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Assisting Nurse</label>
              <input type="text" value={assistingNurse} onChange={e => setAssistingNurse(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Operational Notes & Readings</label>
              <textarea value={operationalNotes} onChange={e => setOperationalNotes(e.target.value)} rows={3} placeholder="Notes, readings, observations..." className={inputCls + ' resize-none'} />
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
              <div className="flex flex-wrap gap-2 mt-1 mb-3">
                {caseCategoriesList.map(cat => (
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
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)} 
                  placeholder="New category name" 
                  className={inputCls}
                />
                <button 
                  type="button" 
                  onClick={handleAddCategory}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 whitespace-nowrap" 
                  style={{ background: PRIMARY }}
                >
                  Add Case
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Doctor Consultation (Consultation ONLY) */}
        {status === 'Consultation' && sectionCard('Doctor Consultation', (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Doctor's Name <span className="text-red-500">*</span></label>
              <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Assisting Nurse</label>
              <input type="text" value={assistingNurse} onChange={e => setAssistingNurse(e.target.value)} placeholder="e.g., UA CLINIC ADMIN" className={inputCls} />
            </div>
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
                  <div className="sm:col-span-2" ref={openMedicineDropdown === t.id ? medicineDropdownRef : undefined}>
                    <label className={labelCls}>Medicine Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        className={inputCls}
                        placeholder="Search or type medicine..."
                        value={openMedicineDropdown === t.id
                          ? (medicineSearch[t.id] ?? '')
                          : t.medicineName}
                        onFocus={() => {
                          setOpenMedicineDropdown(t.id);
                          setMedicineSearch(prev => ({ ...prev, [t.id]: t.medicineName }));
                        }}
                        onChange={e => {
                          setMedicineSearch(prev => ({ ...prev, [t.id]: e.target.value }));
                          setOpenMedicineDropdown(t.id);
                        }}
                      />
                      {openMedicineDropdown === t.id && (() => {
                        const query = (medicineSearch[t.id] ?? '').toLowerCase().trim();
                        const filtered = medicines.filter(m =>
                          m.name.toLowerCase().includes(query)
                        );
                        return (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#13141f] border border-blue-200 dark:border-blue-900 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                            {filtered.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-400 text-center">No medicine found</div>
                            ) : filtered.map(m => (
                              <div
                                key={m.id}
                                onMouseDown={e => {
                                  e.preventDefault();
                                  updateTreatment(t.id, 'medicineName', m.name);
                                  setOpenMedicineDropdown(null);
                                  setMedicineSearch(prev => ({ ...prev, [t.id]: '' }));
                                }}
                                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                                  t.medicineName === m.name
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-[#1E5AA8] font-semibold'
                                    : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-800 dark:text-gray-200'
                                } ${m.stock <= 0 ? 'opacity-50' : ''}`}
                              >
                                <span>{m.name}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  m.stock <= 0
                                    ? 'bg-red-100 text-red-600'
                                    : m.stock <= (m.threshold ?? 10)
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {m.stock <= 0 ? 'Out of Stock' : `${m.stock} avail.`}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
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

        {/* Early Dismissal (Consultation ONLY) */}
        {status === 'Consultation' && sectionCard('Early Dismissal', (
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
              <div className="space-y-4 pt-2">
                <div>
                  <label className={labelCls}>Destination</label>
                  <select value={dismissalDestination} onChange={e => setDismissalDestination(e.target.value)} className={inputCls}>
                    <option value="Sent Home">Sent Home</option>
                    <option value="Sent to Hospital">Sent to Hospital</option>
                  </select>
                </div>
                
                {dismissalDestination === 'Sent Home' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Reason for sending home</label>
                      <input type="text" value={earlyReason} onChange={e => setEarlyReason(e.target.value)} placeholder="Reason for sending home" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Fetcher Name</label>
                      <input type="text" value={fetcherName} onChange={e => setFetcherName(e.target.value)} placeholder="Name of person picking up" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Fetcher's ID Picture</label>
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setFetcherIdImage)} className={inputCls} />
                      {fetcherIdImage && <img src={fetcherIdImage} alt="Fetcher ID" className="mt-2 h-32 object-contain border rounded-lg" />}
                    </div>
                  </div>
                )}
                
                {dismissalDestination === 'Sent to Hospital' && (
                  <div>
                    <label className={labelCls}>Reason for sending to hospital</label>
                    <input type="text" value={earlyReason} onChange={e => setEarlyReason(e.target.value)} placeholder="Reason for hospital transfer" className={inputCls} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Nurse Notes (Consultation ONLY) */}
        {status === 'Consultation' && sectionCard('Nurse Notes & Recommendations', (
          <div className="space-y-4">
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

        {/* Prescription Attachment (Consultation ONLY) */}
        {status === 'Consultation' && sectionCard('Prescription Attachment', (
          <div>
            <label className={labelCls}>Upload Prescription Image</label>
            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setPrescriptionImage)} className={inputCls} />
            {prescriptionImage && <img src={prescriptionImage} alt="Prescription" className="mt-2 h-48 object-contain border rounded-lg" />}
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

