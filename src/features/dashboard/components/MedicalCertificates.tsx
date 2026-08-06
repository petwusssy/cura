import { useState } from 'react';
import { Plus, Printer, Copy, FileText, X, Edit2, Download, Calendar, BookmarkCheck, RefreshCw, UserCheck, Search, AlertCircle, Eye, Edit } from 'lucide-react';
import { MedicalCertificate, Patient } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';

const PRIMARY = '#1E5AA8';

interface MedicalCertificatesProps {
  medicalCerts: MedicalCertificate[];
  patients: Patient[];
  selectedPatientId: string | null;
  onAddCert: (cert: MedicalCertificate) => void | Promise<void>;
  onUpdateCert: (cert: MedicalCertificate) => void | Promise<void>;
}

// High-fidelity Bagong Pilipinas Emblem rendering matching official graphic
function BagongPilipinasLogo() {
  return (
    <div className="flex flex-col items-center justify-center select-none w-24">
      <div className="relative w-16 h-16 mb-1">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
          {/* Outer Sun & Rays Effect */}
          <circle cx="50" cy="50" r="46" fill="#0038A8" stroke="#FCE300" strokeWidth="4.5"/>
          <path d="M50 4 C24.6 4 4 24.6 4 50 L96 50 C96 24.6 75.4 4 50 4 Z" fill="#CE1126"/>
          
          {/* Rising Yellow Sun with stylized rays */}
          <circle cx="50" cy="52" r="23" fill="#FCE300"/>
          <path d="M50 12 L56 36 L78 36 L60 48 L68 72 L50 56 L32 72 L40 48 L22 36 L44 36 Z" fill="#FCE300"/>
          <circle cx="50" cy="52" r="16" fill="#0038A8"/>
          
          {/* Three Stars */}
          <circle cx="34" cy="36" r="3.5" fill="#FFFFFF"/>
          <circle cx="66" cy="36" r="3.5" fill="#FFFFFF"/>
          <circle cx="50" cy="66" r="3.5" fill="#FFFFFF"/>
          
          {/* White stylized ribbons in bottom hemisphere */}
          <path d="M12 70 C28 84 72 84 88 70 L82 62 C68 74 32 74 18 62 Z" fill="#FFFFFF"/>
          <path d="M22 80 C38 90 62 90 78 80 L74 73 C60 82 40 82 26 73 Z" fill="#FCE300"/>
        </svg>
      </div>
      <span className="text-[9px] font-extrabold text-[#002060] uppercase tracking-tighter leading-none font-sans mt-0.5 select-all">
        BAGONG PILIPINAS
      </span>
    </div>
  );
}

// PhilHealth YAKAP official badge banner
function PhilHealthYakapBanner() {
  return (
    <div className="flex flex-col items-center justify-center my-0.5 select-none">
      <div className="flex items-baseline justify-center gap-1.5 leading-none">
        <span className="text-[#008CD0] font-extrabold italic text-[24px] tracking-tight font-sans">
          PhilHealth
        </span>
        <span className="text-[#F7941E] font-extrabold text-[24px] tracking-wider font-sans">
          YAKAP
        </span>
      </div>
      <div className="bg-gradient-to-r from-[#F7941E] via-[#F9A033] to-[#F7941E] text-white text-[11px] font-black px-6 py-0.5 rounded-full uppercase tracking-widest mt-0.5 shadow-2xs font-sans border border-amber-500/30">
        PARA MALAYO SA SAKIT
      </div>
    </div>
  );
}

export function MedicalCertificates({ medicalCerts, patients, selectedPatientId, onAddCert, onUpdateCert }: MedicalCertificatesProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'archives'>('template');
  const [editMode, setEditMode] = useState(true);
  const [selectedCertId, setSelectedCertId] = useState<string>('MC-001');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(selectedPatientId || '');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Active document fields (exactly mirroring the provided PDF sample)
  const [date, setDate] = useState('June 17, 2026');
  const [patientName, setPatientName] = useState('Aaliyah Ysabella G. Cosino');
  const [age, setAge] = useState<number | string>(23);
  const [sex, setSex] = useState('FEMALE');
  const [yearLevel, setYearLevel] = useState('4');
  const [yearSuffix, setYearSuffix] = useState('th');
  const [courseAndSchool, setCourseAndSchool] = useState('year level of BS Arc student of University of the Assumption');
  const [examinedDueTo, setExaminedDueTo] = useState('skin allergies and difficulty on breathing.');
  const [diagnosis, setDiagnosis] = useState('Allergic reaction secondary to food intake with allergens.');
  const [treatment, setTreatment] = useState('Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
  const [recommendations, setRecommendations] = useState('Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.');
  const [doctor, setDoctor] = useState('JOHNNY MICHAEL P. MANGULABNAN, MD');
  const [doctorTitle, setDoctorTitle] = useState('UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
  const [licenseNo, setLicenseNo] = useState('0095055');
  const [ptrNo, setPtrNo] = useState('22483890');
  const [purpose, setPurpose] = useState('Medical clearance and clinic verification for school attendance.');
  const [currentPatientId, setCurrentPatientId] = useState<string>('STU-2024-001');

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleSelectCert = (cert: MedicalCertificate) => {
    setSelectedCertId(cert.id);
    setDate(cert.date || 'June 17, 2026');
    setPatientName(cert.patientName || patients.find(p => p.id === cert.patientId)?.name || 'Patient Name');
    setAge(cert.age || patients.find(p => p.id === cert.patientId)?.age || 23);
    setSex(cert.sex || patients.find(p => p.id === cert.patientId)?.sex || 'FEMALE');
    setExaminedDueTo(cert.examinedDueTo || 'skin allergies and difficulty on breathing.');
    setDiagnosis(cert.diagnosis || 'Allergic reaction secondary to food intake with allergens.');
    setTreatment(cert.treatment || 'Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
    setRecommendations(cert.recommendation || 'Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.');
    setDoctor(cert.doctor || 'JOHNNY MICHAEL P. MANGULABNAN, MD');
    setDoctorTitle(cert.doctorTitle || 'UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
    setLicenseNo(cert.licenseNo || '0095055');
    setPtrNo(cert.ptrNo || '22483890');
    setPurpose(cert.purpose || 'Medical clearance');
    setCurrentPatientId(cert.patientId || 'STU-2024-001');
    setActiveTab('template');
    triggerToast(`Loaded certificate ${cert.id} into official template.`);
  };

  const handleQuickLoadPatient = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return;
    setCurrentPatientId(p.id);
    setPatientName(p.name);
    setAge(p.age);
    setSex((p.sex || 'FEMALE').toUpperCase());
    if (p.category === 'Student') {
      const yr = p.yearLevel?.replace(/\D/g, '') || '4';
      setYearLevel(yr);
      setYearSuffix(yr === '1' ? 'st' : yr === '2' ? 'nd' : yr === '3' ? 'rd' : 'th');
      setCourseAndSchool(`year level of ${p.course || 'BS Arc'} student of University of the Assumption`);
    } else if (p.category === 'Employee') {
      setYearLevel('');
      setYearSuffix('');
      setCourseAndSchool(`${p.position || 'Faculty Member'} of University of the Assumption`);
    } else {
      setYearLevel('');
      setYearSuffix('');
      setCourseAndSchool(`Patient of University of the Assumption Clinic`);
    }
    triggerToast(`Populated template for ${p.name}.`);
  };

  const handleSaveCertificate = async () => {
    const existing = medicalCerts.find(c => c.id === selectedCertId);
    const updatedCert: MedicalCertificate = {
      id: existing ? existing.id : `MC-${Date.now()}`,
      patientId: currentPatientId || 'STU-2024-001',
      date: date,
      purpose: purpose || 'Medical Certificate issuance',
      diagnosis: diagnosis,
      recommendation: recommendations,
      doctor: doctor,
      issuedBy: 'Grace Aquino, RN',
      patientName: patientName,
      age: age,
      sex: sex,
      statusDesignation: `${yearLevel ? `${yearLevel}${yearSuffix} ` : ''}${courseAndSchool}`,
      examinedDueTo: examinedDueTo,
      treatment: treatment,
      doctorTitle: doctorTitle,
      licenseNo: licenseNo,
      ptrNo: ptrNo,
    };

    try {
      if (existing) {
        await onUpdateCert(updatedCert);
      } else {
        await onAddCert(updatedCert);
        setSelectedCertId(updatedCert.id);
      }
      triggerToast('Saved certificate record to clinic archives!');
    } catch (e) {
      console.error(e);
      triggerToast('Failed to save certificate.');
    }
  };

  const handleCreateNew = () => {
    const newId = `MC-${Date.now()}`;
    setSelectedCertId(newId);
    setDate(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setPatientName('Patient Name');
    setAge(21);
    setSex('FEMALE');
    setYearLevel('4');
    setYearSuffix('th');
    setCourseAndSchool('year level of BS Arc student of University of the Assumption');
    setExaminedDueTo('symptoms experienced.');
    setDiagnosis('General clinic consultation and evaluation.');
    setTreatment('Prescribed medications and proper hydration.');
    setRecommendations('Have a rest for 1-2 days. May resume school duties upon recovery.');
    setActiveTab('template');
    triggerToast('New blank certificate created.');
  };

  const handleDownloadPDF = () => {
    setEditMode(false);
    triggerToast("To download as PDF, select 'Save as PDF' as your Destination in the print window.");
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const filteredCerts = medicalCerts.filter(c => {
    const matchDate = !dateFilter || c.date.includes(dateFilter);
    const matchPatient = !selectedPatientFilter || c.patientId === selectedPatientFilter;
    const matchSearch = searchQuery.trim() === '' ||
      (c.patientName && c.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.diagnosis && c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDate && matchPatient && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC]">
      {/* Custom Print CSS ensuring 100% fidelity to Letter PDF template */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        @media print {
          body * {
            visibility: hidden !important;
          }
          .certificate-printable-page, .certificate-printable-page * {
            visibility: visible !important;
          }
          .certificate-printable-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            min-height: 11in !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0.7in 0.9in !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            resize: none !important;
            color: #000 !important;
            box-shadow: none !important;
            font-family: inherit !important;
          }
          .watermark-seal {
            opacity: 0.18 !important;
          }
          @page {
            size: letter portrait;
            margin: 0;
          }
        }

        .font-official {
          font-family: 'Times New Roman', Times, 'Tinos', serif;
        }
      `}</style>

      {/* Toast Notifier */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-5 duration-300">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <span>{showToast}</span>
          <button onClick={() => setShowToast(null)} className="text-gray-400 hover:text-white ml-2"><X size={16} /></button>
        </div>
      )}

      {/* Header Bar */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY }}>
            Medical Certificates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Official University of the Assumption clinic medical certification system with identical PDF rendering, in-place typing, and direct printing.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-200/60 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'template' ? 'bg-white text-[#1E5AA8] shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <FileText size={16} /> Official PDF Template
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'archives' ? 'bg-[#1E5AA8] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <BookmarkCheck size={16} /> Certificate Records
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white text-[#1E5AA8] font-black">
              {medicalCerts.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* VIEW 1: OFFICIAL INTERACTIVE MEDICAL CERTIFICATE (EXACT PDF REPLICA) */}
      {/* ========================================================================================= */}
      {activeTab === 'template' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action & Configuration Toolbar */}
          <div className="no-print flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2.5 w-full xl:w-auto flex-wrap">
              <div className="flex items-center gap-2 bg-blue-50/80 text-[#1E5AA8] px-3.5 py-2 rounded-xl text-xs font-black border border-blue-100">
                <UserCheck size={16} />
                <span>Quick Load Patient:</span>
                <select
                  value={currentPatientId}
                  onChange={e => handleQuickLoadPatient(e.target.value)}
                  className="bg-white text-gray-900 font-black px-2.5 py-1 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] text-xs cursor-pointer ml-1"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                </select>
              </div>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-colors ${editMode ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                title="Toggle visual highlights on editable words"
              >
                {editMode ? <Edit size={14} className="text-amber-600" /> : <Eye size={14} className="text-gray-500" />}
                <span>{editMode ? 'Editing Mode On' : 'Preview Static Page'}</span>
              </button>

              <button
                onClick={() => {
                  setDate('June 17, 2026');
                  setPatientName('Aaliyah Ysabella G. Cosino');
                  setAge(23);
                  setSex('FEMALE');
                  setYearLevel('4');
                  setYearSuffix('th');
                  setCourseAndSchool('year level of BS Arc student of University of the Assumption');
                  setExaminedDueTo('skin allergies and difficulty on breathing.');
                  setDiagnosis('Allergic reaction secondary to food intake with allergens.');
                  setTreatment('Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
                  setRecommendations('Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.');
                  setDoctor('JOHNNY MICHAEL P. MANGULABNAN, MD');
                  setDoctorTitle('UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
                  setLicenseNo('0095055');
                  setPtrNo('22483890');
                  triggerToast('Reset document to exact attached PDF sample.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black transition-colors"
                title="Restore exact sample from attached PDF"
              >
                <RefreshCw size={14} /> Reset PDF Sample
              </button>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <button
                onClick={handleSaveCertificate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:opacity-95 text-white font-black text-xs shadow-sm transition-all active:scale-95"
              >
                <BookmarkCheck size={15} /> Save to Archives
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                <Download size={15} /> Download as PDF
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setTimeout(() => window.print(), 200);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-95"
                style={{ background: PRIMARY }}
              >
                <Printer size={15} /> Print Certificate
              </button>
            </div>
          </div>

          {/* ===================================================================================== */}
          {/* THE OFFICIAL DOCUMENT SHEET (Exact Letter Paper Dimensions, Fonts, & Watermark) */}
          {/* ===================================================================================== */}
          <div className="certificate-printable-page font-official relative bg-white border-2 border-gray-300 shadow-2xl max-w-[850px] mx-auto px-16 py-16 text-black text-[16px] font-bold leading-relaxed overflow-hidden">
            
            {/* Center Background Watermark (Exact placement and opacity matching PDF) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none mt-16">
              <img
                src={uaSeal}
                alt="University Seal Watermark"
                className="watermark-seal w-[640px] h-[640px] object-contain opacity-[0.18]"
              />
            </div>

            {/* Document Content Layer */}
            <div className="relative z-10 space-y-10 font-official font-bold text-black">
              
              {/* TOP HEADER SECTION */}
              <div className="flex items-center justify-between gap-4 pb-2">
                {/* Far Left: University of the Assumption Seal */}
                <div className="w-24 flex-shrink-0 flex items-center justify-start">
                  <img src={uaSeal} alt="UA Seal" className="w-[88px] h-[88px] object-contain drop-shadow-2xs" />
                </div>

                {/* Center: University typography and PhilHealth YAKAP Logo banner */}
                <div className="flex-1 text-center space-y-0.5">
                  <div className="text-[25px] font-bold text-[#002060] font-official tracking-tight leading-none">
                    UNIVERSITY of the ASSUMPTION
                  </div>
                  
                  <PhilHealthYakapBanner />
                  
                  <div className="text-[13px] font-bold text-[#184898] font-sans pt-1 tracking-tight">
                    Unisite Subdivision, Del Pilar, City of San Fernando, 2000 Pampanga, Philippines
                  </div>
                </div>

                {/* Far Right: Bagong Pilipinas Emblem & Legend */}
                <div className="w-24 flex-shrink-0 flex items-center justify-end">
                  <BagongPilipinasLogo />
                </div>
              </div>

              {/* DATE LINE (Right Aligned, exactly like PDF) */}
              <div className="flex justify-end pt-8 pr-2 font-official font-bold text-[16px] text-black">
                <div className="flex items-center">
                  <span>DATE:&nbsp;&nbsp;</span>
                  <input
                    type="text"
                    value={date}
                    readOnly={!editMode}
                    onChange={e => setDate(e.target.value)}
                    className={`font-official font-bold text-[16px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 w-44 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                </div>
              </div>

              {/* DOCUMENT TITLE (Centered, bold, uppercase, no underline) */}
              <div className="text-center pt-2 pb-4">
                <h2 className="text-[23px] font-bold uppercase tracking-wide font-official text-black">
                  MEDICAL CERTIFICATE
                </h2>
              </div>

              {/* BODY PARAGRAPHS (All text is uniformly font-bold text-[16px] leading-[1.8] justified) */}
              <div className="space-y-7 text-black text-[16.5px] leading-[1.9] text-justify font-official font-bold px-2">
                
                {/* Paragraph 1: Certification statement */}
                <div className="text-justify indent-10">
                  <span>This is to certify that </span>
                  <input
                    type="text"
                    value={patientName}
                    readOnly={!editMode}
                    onChange={e => setPatientName(e.target.value)}
                    style={{ width: `${Math.max(220, patientName.length * 9.5)}px` }}
                    className={`font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 px-0.5 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                  <span>, </span>
                  <input
                    type="number"
                    value={age}
                    readOnly={!editMode}
                    onChange={e => setAge(e.target.value)}
                    className={`font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 text-center w-8 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                  <span> years old, </span>
                  <input
                    type="text"
                    value={sex}
                    readOnly={!editMode}
                    onChange={e => setSex(e.target.value.toUpperCase())}
                    style={{ width: `${Math.max(70, sex.length * 10)}px` }}
                    className={`font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 text-center ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                  <span>, a </span>
                  
                  {/* Superscript formatting for year level (e.g. 4th) */}
                  <span className="inline-flex items-baseline">
                    <input
                      type="text"
                      value={yearLevel}
                      readOnly={!editMode}
                      onChange={e => setYearLevel(e.target.value)}
                      className={`font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 text-center w-4 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                    />
                    <sup className="text-[12px] font-bold">
                      <input
                        type="text"
                        value={yearSuffix}
                        readOnly={!editMode}
                        onChange={e => setYearSuffix(e.target.value)}
                        className={`font-official font-bold text-[12px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 text-center w-4 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                      />
                    </sup>
                  </span>
                  <span> </span>
                  
                  <input
                    type="text"
                    value={courseAndSchool}
                    readOnly={!editMode}
                    onChange={e => setCourseAndSchool(e.target.value)}
                    style={{ width: `${Math.max(380, courseAndSchool.length * 8.5)}px` }}
                    className={`font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                  <span> has been seen and examined due to </span>
                  <input
                    type="text"
                    value={examinedDueTo}
                    readOnly={!editMode}
                    onChange={e => setExaminedDueTo(e.target.value)}
                    style={{ width: `${Math.max(320, examinedDueTo.length * 8.5)}px` }}
                    className={`font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                </div>

                {/* Paragraph 2: Diagnosis */}
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="font-official font-bold text-[16.5px] whitespace-nowrap">Diagnosis:</span>
                  <input
                    type="text"
                    value={diagnosis}
                    readOnly={!editMode}
                    onChange={e => setDiagnosis(e.target.value)}
                    className={`flex-1 font-official font-bold text-[16.5px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 px-1 ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                  />
                </div>

                {/* Paragraph 3: Treatment (Indented block layout exactly as seen in PDF) */}
                <div className="flex items-start gap-4 pt-1">
                  <span className="font-official font-bold text-[16.5px] whitespace-nowrap w-28 flex-shrink-0 mt-1">Treatment:</span>
                  <div className="flex-1">
                    <textarea
                      value={treatment}
                      readOnly={!editMode}
                      onChange={e => setTreatment(e.target.value)}
                      rows={treatment.split('\n').length || 2}
                      className={`w-full font-official font-bold text-[16.5px] leading-[1.8] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 resize-none p-1 overflow-hidden ${editMode ? 'border border-dashed border-gray-300 rounded hover:border-gray-400' : 'border-none'}`}
                      placeholder="Enter prescribed dosage and treatment course..."
                    />
                  </div>
                </div>

                {/* Paragraph 4: Recommendations */}
                <div className="pt-2 text-justify">
                  <span className="font-official font-bold text-[16.5px]">Recommendations:&nbsp;</span>
                  <span className="inline-block w-full">
                    <textarea
                      value={recommendations}
                      readOnly={!editMode}
                      onChange={e => setRecommendations(e.target.value)}
                      rows={2}
                      className={`w-full font-official font-bold text-[16.5px] leading-[1.8] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 resize-none p-1 text-justify ${editMode ? 'border border-dashed border-gray-300 rounded hover:border-gray-400' : 'border-none'}`}
                    />
                  </span>
                </div>

                {/* Paragraph 5: Standard Disclaimer */}
                <div className="pt-8 text-black text-[16px] leading-[1.8] font-official font-bold text-justify">
                  This certificate is being issued upon the request of the above patient for whatever purpose it may serve. This certificate is not intended for use in legal matters or proceedings or for issuance claim.
                </div>
              </div>

              {/* SIGNATURE & PHYSICIAN CREDENTIALS BLOCK (Bottom Right Alignment) */}
              <div className="flex justify-end pt-16 pr-4">
                <div className="w-[360px] font-official font-bold text-black">
                  
                  {/* Solid signature dividing line */}
                  <div className="border-b-[2px] border-black pb-1 mb-1 w-full">
                    <input
                      type="text"
                      value={doctor}
                      readOnly={!editMode}
                      onChange={e => setDoctor(e.target.value)}
                      className={`w-full text-center bg-transparent focus:outline-none font-official font-bold text-[16px] uppercase ${editMode ? 'hover:bg-amber-50/50' : 'border-none'}`}
                    />
                  </div>

                  {/* Physician Title */}
                  <div className="font-official font-bold text-[15px] tracking-tight uppercase text-center text-black">
                    <input
                      type="text"
                      value={doctorTitle}
                      readOnly={!editMode}
                      onChange={e => setDoctorTitle(e.target.value)}
                      className={`w-full text-center bg-transparent focus:outline-none font-official font-bold uppercase ${editMode ? 'hover:bg-amber-50/50' : 'border-none'}`}
                    />
                  </div>

                  {/* License and PTR numbers (Right-aligned with exact styling) */}
                  <div className="space-y-1.5 pt-3.5 text-right pr-4 font-official font-bold text-[15.5px] text-black">
                    <div className="flex items-center justify-end">
                      <span className="mr-1">LIC:</span>
                      <input
                        type="text"
                        value={licenseNo}
                        readOnly={!editMode}
                        onChange={e => setLicenseNo(e.target.value)}
                        className={`w-28 text-right bg-transparent focus:outline-none font-official font-bold ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <span>PTR:</span>
                      <input
                        type="text"
                        value={ptrNo}
                        readOnly={!editMode}
                        onChange={e => setPtrNo(e.target.value)}
                        className={`w-28 text-right bg-transparent focus:outline-none font-official font-bold ${editMode ? 'border-b border-gray-300 hover:border-gray-500' : 'border-none'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* VIEW 2: CERTIFICATE ARCHIVES & CLINIC RECORDS */}
      {/* ========================================================================================= */}
      {activeTab === 'archives' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patient name, diagnosis, or ID..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Patient:</label>
                <select
                  value={selectedPatientFilter}
                  onChange={e => setSelectedPatientFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                >
                  <option value="">All Patients</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter date..."
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 font-bold focus:outline-none w-28"
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-1.5 py-0.5 rounded">Clear</button>
                )}
              </div>

              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-extrabold shadow-md hover:opacity-90 transition-all"
                style={{ background: PRIMARY }}
              >
                <Plus size={15} strokeWidth={2.5} /> Issue New Certificate
              </button>
            </div>
          </div>

          {/* Certificates Grid/List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCerts.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400 font-medium">
                <FileText size={42} className="mx-auto mb-3 text-gray-300" />
                <p className="text-base font-bold text-gray-600">No medical certificates found</p>
                <p className="text-xs text-gray-400 mt-1">Try resetting your search filter or issue a new clinic certificate.</p>
              </div>
            ) : (
              filteredCerts.map(cert => {
                const pt = patients.find(p => p.id === cert.patientId);
                return (
                  <div
                    key={cert.id}
                    onClick={() => handleSelectCert(cert)}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-lg hover:border-[#1E5AA8]/40 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E5AA8] group-hover:text-white transition-colors" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="text-base font-black text-gray-900 leading-tight">
                              {cert.patientName || pt?.name || 'Clinic Patient'}
                            </div>
                            <div className="text-xs font-semibold text-gray-400 mt-0.5">
                              ID: {cert.id} • Issued: {cert.date}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 py-3 border-t border-b border-gray-100 my-2 text-xs">
                        {cert.diagnosis && (
                          <div className="text-gray-700">
                            <span className="font-black text-gray-500 uppercase tracking-wider text-[10px]">Diagnosis:</span>{' '}
                            <strong className="text-gray-900">{cert.diagnosis}</strong>
                          </div>
                        )}
                        {cert.purpose && (
                          <div className="text-gray-600 truncate">
                            <span className="font-black text-gray-500 uppercase tracking-wider text-[10px]">Purpose:</span>{' '}
                            <span>{cert.purpose}</span>
                          </div>
                        )}
                        {cert.doctor && (
                          <div className="text-gray-500 text-[11px]">
                            Signed by: <strong className="text-gray-800">{cert.doctor}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-1">
                      <span className="text-[11px] font-extrabold text-[#1E5AA8] group-hover:underline flex items-center gap-1">
                        Open in Official Template &rarr;
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectCert(cert);
                            setTimeout(() => handleDownloadPDF(), 200);
                          }}
                          className="p-2 rounded-xl hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Download as PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectCert(cert);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="p-2 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-[#1E5AA8] transition-colors"
                          title="Print Certificate"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
