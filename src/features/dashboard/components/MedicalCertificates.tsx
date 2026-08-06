import { useState } from 'react';
import { Plus, Printer, Copy, FileText, X, Edit2, Download, Calendar, BookmarkCheck, RefreshCw, UserCheck, Search, AlertCircle } from 'lucide-react';
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

// Inline rendering of Bagong Pilipinas emblem to ensure pixel-perfect printing
function BagongPilipinasLogo() {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg className="w-12 h-12 mb-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#0038A8" stroke="#FCE300" strokeWidth="4"/>
        <path d="M50 4 C24.6 4 4 24.6 4 50 L96 50 C96 24.6 75.4 4 50 4 Z" fill="#CE1126"/>
        <circle cx="50" cy="50" r="22" fill="#FCE300"/>
        <path d="M50 18 L55 38 L75 43 L55 48 L50 68 L45 48 L25 43 L45 38 Z" fill="#FCE300"/>
        <circle cx="50" cy="50" r="14" fill="#0038A8"/>
        <circle cx="36" cy="36" r="3" fill="#FFFFFF"/>
        <circle cx="64" cy="36" r="3" fill="#FFFFFF"/>
        <circle cx="50" cy="62" r="3" fill="#FFFFFF"/>
        <path d="M15 72 C30 85 70 85 85 72 L80 65 C68 75 32 75 20 65 Z" fill="#FFFFFF"/>
      </svg>
      <span className="text-[8px] font-extrabold text-[#002060] uppercase tracking-tighter leading-none font-sans">
        BAGONG PILIPINAS
      </span>
    </div>
  );
}

export function MedicalCertificates({ medicalCerts, patients, selectedPatientId, onAddCert, onUpdateCert }: MedicalCertificatesProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'archives'>('template');
  const [selectedCertId, setSelectedCertId] = useState<string>('MC-001');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(selectedPatientId || '');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Active editable document state (initialized with default PDF values)
  const [date, setDate] = useState('June 17, 2026');
  const [patientName, setPatientName] = useState('Aaliyah Ysabella G. Cosino');
  const [age, setAge] = useState<number | string>(23);
  const [sex, setSex] = useState('FEMALE');
  const [statusDesignation, setStatusDesignation] = useState('4th year level of BS Arc student of University of the Assumption');
  const [examinedDueTo, setExaminedDueTo] = useState('skin allergies and difficulty on breathing.');
  const [diagnosis, setDiagnosis] = useState('Allergic reaction secondary to food intake with allergens.');
  const [treatment, setTreatment] = useState('Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
  const [recommendations, setRecommendations] = useState('Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.');
  const [doctor, setDoctor] = useState('JOHNNY MICHAEL P. MANGULABNAN, MD');
  const [doctorTitle, setDoctorTitle] = useState('UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
  const [licenseNo, setLicenseNo] = useState('0095055');
  const [ptrNo, setPtrNo] = useState('22483890');
  const [purpose, setPurpose] = useState('Medical excuse and clinic clearance for school activities.');
  const [currentPatientId, setCurrentPatientId] = useState<string>('STU-2024-001');

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 4500);
  };

  const handleSelectCert = (cert: MedicalCertificate) => {
    setSelectedCertId(cert.id);
    setDate(cert.date || 'June 17, 2026');
    setPatientName(cert.patientName || patients.find(p => p.id === cert.patientId)?.name || 'Patient Name');
    setAge(cert.age || patients.find(p => p.id === cert.patientId)?.age || 21);
    setSex(cert.sex || patients.find(p => p.id === cert.patientId)?.sex || 'FEMALE');
    setStatusDesignation(
      cert.statusDesignation || 
      (() => {
        const p = patients.find(pt => pt.id === cert.patientId);
        if (!p) return 'student of University of the Assumption';
        if (p.category === 'Student') return `${p.yearLevel || '4th year'} level of ${p.course || 'BS'} student of University of the Assumption`;
        if (p.category === 'Employee') return `${p.position || 'Employee'} of University of the Assumption`;
        return `Patient of University of the Assumption`;
      })()
    );
    setExaminedDueTo(cert.examinedDueTo || 'skin allergies and difficulty on breathing.');
    setDiagnosis(cert.diagnosis || 'Allergic reaction secondary to food intake with allergens.');
    setTreatment(cert.treatment || 'Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
    setRecommendations(cert.recommendation || 'Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies.');
    setDoctor(cert.doctor || 'JOHNNY MICHAEL P. MANGULABNAN, MD');
    setDoctorTitle(cert.doctorTitle || 'UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
    setLicenseNo(cert.licenseNo || '0095055');
    setPtrNo(cert.ptrNo || '22483890');
    setPurpose(cert.purpose || 'Medical clearance');
    setCurrentPatientId(cert.patientId || 'STU-2024-001');
    setActiveTab('template');
    triggerToast(`Loaded certificate ${cert.id} into the interactive editor.`);
  };

  const handleQuickLoadPatient = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return;
    setCurrentPatientId(p.id);
    setPatientName(p.name);
    setAge(p.age);
    setSex((p.sex || 'FEMALE').toUpperCase());
    if (p.category === 'Student') {
      setStatusDesignation(`${p.yearLevel || '4th year'} level of ${p.course || 'BS Arc'} student of University of the Assumption`);
    } else if (p.category === 'Employee') {
      setStatusDesignation(`${p.position || 'Faculty Member'} of University of the Assumption`);
    } else {
      setStatusDesignation(`Patient of University of the Assumption Clinic`);
    }
    triggerToast(`Populated template with patient details for ${p.name}.`);
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
      statusDesignation: statusDesignation,
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
      triggerToast('Certificate record saved successfully to clinic archives!');
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
    setAge('20');
    setSex('FEMALE');
    setStatusDesignation('4th year level of BS Arc student of University of the Assumption');
    setExaminedDueTo('symptoms experienced.');
    setDiagnosis('General medical examination.');
    setTreatment('Rest and prescribed supportive care.');
    setRecommendations('Have a rest for 1-2 days. May resume regular classes/duties upon improvement.');
    setActiveTab('template');
    triggerToast('New blank certificate generated for editing.');
  };

  const handleDownloadPDF = () => {
    triggerToast("To download as PDF, choose 'Save as PDF' as your printer destination in the print dialog.");
    setTimeout(() => {
      window.print();
    }, 400);
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
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#FAFBFD]">
      {/* Print stylesheet for exact Letter page output */}
      <style>{`
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
            height: 11in !important;
            max-width: 100% !important;
            max-height: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0.6in 0.8in !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 15px !important;
          }
          .no-print {
            display: none !important;
          }
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            resize: none !important;
            color: #000 !important;
            font-family: inherit !important;
          }
          .watermark-img {
            opacity: 0.15 !important;
          }
          @page {
            size: letter portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-in slide-in-from-bottom-5 duration-300">
          <AlertCircle size={18} className="text-amber-400" />
          <span>{showToast}</span>
          <button onClick={() => setShowToast(null)} className="text-gray-400 hover:text-white ml-2"><X size={16} /></button>
        </div>
      )}

      {/* Header & Mode Selector */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY }}>
            Medical Certificates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Issue, edit, download as PDF, and print official clinic medical certificates with live watermark template.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'template' ? 'bg-white text-[#1E5AA8] shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <FileText size={16} /> Official Certificate Editor
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'archives' ? 'bg-[#1E5AA8] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <BookmarkCheck size={16} /> Certificate Archives
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white text-[#1E5AA8] font-black">
              {medicalCerts.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* VIEW 1: OFFICIAL INTERACTIVE MEDICAL CERTIFICATE TEMPLATE */}
      {/* ========================================================================================= */}
      {activeTab === 'template' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action Toolbar */}
          <div className="no-print flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap">
              <div className="flex items-center gap-2 bg-blue-50/80 text-[#1E5AA8] px-3.5 py-2 rounded-xl text-xs font-extrabold border border-blue-100">
                <UserCheck size={16} />
                <span>Quick Load Patient Details:</span>
                <select
                  value={currentPatientId}
                  onChange={e => handleQuickLoadPatient(e.target.value)}
                  className="bg-white text-gray-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] text-xs cursor-pointer ml-1"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                </select>
              </div>

              <button
                onClick={() => {
                  setDate('June 17, 2026');
                  setPatientName('Aaliyah Ysabella G. Cosino');
                  setAge(23);
                  setSex('FEMALE');
                  setStatusDesignation('4th year level of BS Arc student of University of the Assumption');
                  setExaminedDueTo('skin allergies and difficulty on breathing.');
                  setDiagnosis('Allergic reaction secondary to food intake with allergens.');
                  setTreatment('Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
                  setRecommendations('Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.');
                  setDoctor('JOHNNY MICHAEL P. MANGULABNAN, MD');
                  setDoctorTitle('UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
                  setLicenseNo('0095055');
                  setPtrNo('22483890');
                  triggerToast('Reset document to sample Aaliyah Ysabella G. Cosino template.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                title="Reset to PDF sample"
              >
                <RefreshCw size={14} /> Reset Sample
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
              >
                <Plus size={14} /> New Certificate
              </button>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <button
                onClick={handleSaveCertificate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:opacity-95 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <BookmarkCheck size={15} /> Save to Archives
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <Download size={15} /> Download as PDF
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95"
                style={{ background: PRIMARY }}
              >
                <Printer size={15} /> Print Certificate
              </button>
            </div>
          </div>

          {/* Interactive Editable Document Area (Letter format with background watermark) */}
          <div className="certificate-printable-page relative bg-white border-2 border-gray-300 shadow-xl max-w-4xl mx-auto px-12 py-14 font-serif text-gray-900 text-base leading-relaxed overflow-hidden">
            {/* Center Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
              <img src={uaSeal} alt="Watermark Seal" className="watermark-img w-[480px] h-[480px] object-contain opacity-[0.15]" />
            </div>

            {/* Document Content Layer */}
            <div className="relative z-10 space-y-8">
              {/* Top Header */}
              <div className="flex items-center justify-between gap-4 pb-4">
                <div className="w-24 flex-shrink-0 flex items-center justify-start">
                  <img src={uaSeal} alt="UA Seal" className="w-20 h-20 object-contain" />
                </div>

                <div className="flex-1 text-center font-sans space-y-1">
                  <div className="text-2xl font-black uppercase tracking-wide text-[#002060] font-serif">
                    UNIVERSITY of the ASSUMPTION
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-black text-[#1E5AA8] text-lg tracking-tight">PhilHealth</span>
                    <span className="font-black text-[#F59E0B] text-lg tracking-wider">YAKAP</span>
                  </div>
                  <div className="inline-block">
                    <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-white font-black text-[10px] px-4 py-0.5 rounded-full uppercase tracking-widest shadow-2xs border border-amber-600/20">
                      PARA MALAYO SA SAKIT
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#1E5AA8] pt-1">
                    Unisite Subdivision, Del Pilar, City of San Fernando, 2000 Pampanga, Philippines
                  </div>
                </div>

                <div className="w-24 flex-shrink-0 flex items-center justify-end">
                  <BagongPilipinasLogo />
                </div>
              </div>

              {/* Date Field (Right Aligned) */}
              <div className="flex justify-end pt-4 font-serif font-bold text-base text-gray-900">
                <div className="flex items-center">
                  <span>DATE:&nbsp;</span>
                  <input
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="border-b border-gray-400 font-bold text-gray-900 bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-44"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="text-center pt-4 pb-2">
                <div className="text-2xl font-extrabold uppercase tracking-widest font-serif text-gray-950">
                  MEDICAL CERTIFICATE
                </div>
              </div>

              {/* Body Paragraphs */}
              <div className="space-y-6 text-gray-900 text-[16px] leading-8 text-justify font-serif">
                {/* Certification statement */}
                <div>
                  This is to certify that{' '}
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="font-extrabold border-b border-gray-400 bg-transparent focus:outline-none focus:bg-yellow-50 px-1 font-serif text-[16px] text-gray-950 min-w-[200px]"
                    placeholder="Patient Name"
                  />
                  ,{' '}
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="font-extrabold border-b border-gray-400 bg-transparent focus:outline-none focus:bg-yellow-50 text-center w-12 font-serif text-[16px] text-gray-950"
                  />
                  {' '}years old,{' '}
                  <input
                    type="text"
                    value={sex}
                    onChange={e => setSex(e.target.value.toUpperCase())}
                    className="font-extrabold border-b border-gray-400 bg-transparent focus:outline-none focus:bg-yellow-50 px-1 text-center w-24 font-serif text-[16px] text-gray-950"
                  />
                  , a{' '}
                  <input
                    type="text"
                    value={statusDesignation}
                    onChange={e => setStatusDesignation(e.target.value)}
                    className="font-extrabold border-b border-gray-400 bg-transparent focus:outline-none focus:bg-yellow-50 px-1 font-serif text-[16px] text-gray-950 w-full sm:w-[480px]"
                    placeholder="student / faculty status"
                  />
                  {' '}has been seen and examined due to{' '}
                  <input
                    type="text"
                    value={examinedDueTo}
                    onChange={e => setExaminedDueTo(e.target.value)}
                    className="font-extrabold border-b border-gray-400 bg-transparent focus:outline-none focus:bg-yellow-50 px-1 font-serif text-[16px] text-gray-950 w-full sm:w-[420px]"
                    placeholder="symptoms / illness"
                  />
                </div>

                {/* Diagnosis Section */}
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="font-extrabold whitespace-nowrap">Diagnosis:</span>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className="flex-1 font-extrabold border-b border-gray-400 bg-transparent focus:outline-none focus:bg-yellow-50 px-1 font-serif text-[16px] text-gray-950"
                    placeholder="Diagnosis description"
                  />
                </div>

                {/* Treatment Section */}
                <div className="flex items-start gap-2 pt-1">
                  <span className="font-extrabold whitespace-nowrap mt-1">Treatment:</span>
                  <textarea
                    value={treatment}
                    onChange={e => setTreatment(e.target.value)}
                    rows={3}
                    className="flex-1 font-extrabold border border-transparent hover:border-gray-200 bg-transparent focus:outline-none focus:bg-yellow-50 px-2 py-1 font-serif text-[16px] text-gray-950 leading-relaxed resize-none"
                    placeholder="List medications, dosage, and duration..."
                  />
                </div>

                {/* Recommendations Section */}
                <div className="flex items-start gap-2 pt-1">
                  <span className="font-extrabold whitespace-nowrap mt-1">Recommendations:</span>
                  <textarea
                    value={recommendations}
                    onChange={e => setRecommendations(e.target.value)}
                    rows={3}
                    className="flex-1 font-extrabold border border-transparent hover:border-gray-200 bg-transparent focus:outline-none focus:bg-yellow-50 px-2 py-1 font-serif text-[16px] text-gray-950 leading-relaxed resize-none"
                    placeholder="Rest instructions, return to school rules, health advice..."
                  />
                </div>

                {/* Standard Disclaimer */}
                <div className="pt-6 text-gray-800 text-[15.5px] leading-7 font-normal">
                  This certificate is being issued upon the request of the above patient for whatever purpose it may serve. This certificate is not intended for use in legal matters or proceedings or for issuance claim.
                </div>
              </div>

              {/* Signature Block (Bottom Right Alignment) */}
              <div className="flex justify-end pt-12">
                <div className="w-80 text-center font-serif">
                  <div className="border-b-2 border-gray-900 pb-1 font-extrabold text-base uppercase text-gray-950">
                    <input
                      type="text"
                      value={doctor}
                      onChange={e => setDoctor(e.target.value)}
                      className="w-full text-center bg-transparent focus:outline-none focus:bg-yellow-50 font-extrabold uppercase"
                    />
                  </div>
                  <div className="font-extrabold text-xs tracking-wider uppercase pt-1 text-gray-900">
                    <input
                      type="text"
                      value={doctorTitle}
                      onChange={e => setDoctorTitle(e.target.value)}
                      className="w-full text-center bg-transparent focus:outline-none focus:bg-yellow-50 font-extrabold uppercase"
                    />
                  </div>

                  <div className="space-y-1 pt-3 text-right pr-6 font-bold text-sm text-gray-900">
                    <div className="flex items-center justify-end">
                      <span>LIC:&nbsp;</span>
                      <input
                        type="text"
                        value={licenseNo}
                        onChange={e => setLicenseNo(e.target.value)}
                        className="w-28 border-b border-gray-400 font-extrabold bg-transparent focus:outline-none focus:bg-yellow-50 px-1 text-right"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <span>PTR:&nbsp;</span>
                      <input
                        type="text"
                        value={ptrNo}
                        onChange={e => setPtrNo(e.target.value)}
                        className="w-28 border-b border-gray-400 font-extrabold bg-transparent focus:outline-none focus:bg-yellow-50 px-1 text-right"
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
      {/* VIEW 2: CERTIFICATE ARCHIVES & RECORDS LIST */}
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
                placeholder="Search patient name, diagnosis, or purpose..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Patient:</label>
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
                  placeholder="Filter year/date..."
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none w-28"
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
                <p className="text-xs text-gray-400 mt-1">Try resetting your search filter or generate a new clinic certificate.</p>
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
                        Open & Edit in Template &rarr;
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
                          title="Print"
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

