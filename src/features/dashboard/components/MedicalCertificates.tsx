import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Printer, Copy, FileText, X, Edit2, Download, Calendar, BookmarkCheck, RefreshCw, UserCheck, Search, AlertCircle, Eye, Edit, CheckCircle2, Trash2 } from 'lucide-react';
import { MedicalCertificate, Patient } from '../types';
import { uaSealBase64, uaLogoBase64 } from '@/assets/images/medCertAssets';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { normalizeDate } from '@/utils/philippineTime';

const PRIMARY = '#1E5AA8';

interface MedicalCertificatesProps {
  medicalCerts: MedicalCertificate[];
  patients: Patient[];
  selectedPatientId: string | null;
  onAddCert: (cert: MedicalCertificate) => void | Promise<void>;
  onUpdateCert: (cert: MedicalCertificate) => void | Promise<void>;
  onDeleteCert?: (id: string) => void | Promise<void>;
  searchQuery: string;
}

// Standard professional filename format: LAST NAME - NAME - DATE - MEDCERT.pdf
export function formatMedCertFilename(rawName?: string, rawDate?: string): string {
  const name = (rawName || 'PATIENT').trim();
  let lastName = '';
  let firstName = '';

  if (name.includes(',')) {
    const parts = name.split(',');
    lastName = parts[0].trim();
    firstName = parts.slice(1).join(' ').trim();
  } else {
    const tokens = name.split(/\s+/);
    if (tokens.length <= 1) {
      lastName = tokens[0] || 'PATIENT';
      firstName = '';
    } else {
      const compoundPrefixes = ['DE LA', 'DE LOS', 'DELA', 'DELOS', 'SAN', 'DE', 'DEL', 'STA', 'SANTA'];
      let foundCompound = false;
      for (let i = tokens.length - 2; i >= 1; i--) {
        const prefixTwo = tokens.slice(i, -1).join(' ').toUpperCase();
        if (compoundPrefixes.includes(prefixTwo)) {
          lastName = tokens.slice(i).join(' ');
          firstName = tokens.slice(0, i).join(' ');
          foundCompound = true;
          break;
        }
      }
      if (!foundCompound) {
        lastName = tokens[tokens.length - 1];
        firstName = tokens.slice(0, -1).join(' ');
      }
    }
  }

  // Format date YYYY-MM-DD
  let dateStr = (rawDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      dateStr = parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    } else {
      dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    }
  }

  // Clean characters illegal in filenames
  const cleanLast = lastName.toUpperCase().replace(/[\\/:*?"<>|]/g, '').trim() || 'PATIENT';
  const cleanFirst = firstName.toUpperCase().replace(/[\\/:*?"<>|]/g, '').trim();

  const namePart = cleanFirst ? `${cleanLast} - ${cleanFirst}` : cleanLast;
  return `${namePart} - ${dateStr} - MEDCERT.pdf`;
}

// High-fidelity Bagong Pilipinas Emblem rendering with pure solid hex colors (100% html2canvas compatible)
function BagongPilipinasLogo() {
  return (
    <div className="flex flex-col items-center justify-center select-none w-32 flex-shrink-0">
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative w-[76px] h-[76px] mb-0.5">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M50 6 L52.5 11.5 L58 11.5 L53.5 15 L55 20 L50 17 L45 20 L46.5 15 L42 11.5 L47.5 11.5 Z" fill="#F5B300"/>
            <path d="M30 14 L32 18 L37 18 L33 21 L35 25 L30 22 L25 25 L27 21 L23 18 L28 18 Z" fill="#F5B300"/>
            <path d="M70 14 L72 18 L77 18 L73 21 L75 25 L70 22 L65 25 L67 21 L63 18 L68 18 Z" fill="#F5B300"/>
            <path d="M50 22 L55 33 L66 28 L60 39 L72 41 L63 49 L72 59 L50 59 L28 59 L37 49 L28 41 L40 39 L34 28 L45 33 Z" fill="#F5B300"/>
            <circle cx="50" cy="51" r="16" fill="#F5B300"/>
            <path d="M12 44 C12 68 28 88 50 92 C36 84 26 68 26 50 C26 48 26 45 12 44 Z" fill="#0038A8"/>
            <path d="M88 44 C88 68 72 88 50 92 C64 84 74 68 74 50 C74 48 74 45 88 44 Z" fill="#D21034"/>
            <path d="M16 56 C24 78 54 94 84 62 C68 84 38 82 18 64 C16 62 16 58 16 56 Z" fill="#D21034"/>
            <path d="M84 56 C76 78 46 94 16 62 C32 84 62 82 82 64 C84 62 84 58 84 56 Z" fill="#0038A8"/>
          </svg>
        </div>
        <span className="text-[11px] font-black text-[#002060] uppercase tracking-tight leading-none font-sans italic mt-1 text-center select-all">
          BAGONG PILIPINAS
        </span>
      </div>
    </div>
  );
}

// Auto-resizing input that perfectly hugs text without any fixed gaps or wrapping breakage
const AutoResizeInput = ({ value, onChange, readOnly, placeholder = '', className = '' }: any) => {
  if (readOnly) {
    return <span className={`font-official font-bold text-black ${className}`}>{value || ''}</span>;
  }
  const isFilled = value && value.length > 0;
  return (
    <span className="inline-grid items-baseline" style={{ minWidth: isFilled ? '0' : '2ch' }}>
      <span className="invisible col-start-1 row-start-1 whitespace-pre font-official font-bold text-[15.5px] px-0.5">{value || placeholder || ' '}</span>
      <input
        type="text"
        size={1}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`col-start-1 row-start-1 w-full min-w-0 bg-amber-50/40 border-b border-dashed border-amber-400 focus:border-amber-600 outline-none p-0 m-0 font-official font-bold text-[15.5px] text-black focus:bg-amber-100/60 transition-colors ${className}`}
      />
    </span>
  );
};

// PhilHealth YAKAP official orange badge banner
function PhilHealthYakapBanner() {
  return (
    <div className="flex flex-col items-center justify-center my-0.5 select-none">
      <div className="flex items-baseline justify-center gap-1.5 leading-none mb-0.5">
        <span
          className="font-black italic text-[25px] tracking-tight font-sans"
          style={{
            color: '#2B72BA',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          PhilHealth
        </span>
        <span
          className="font-black text-[25px] tracking-wider font-sans"
          style={{
            color: '#FFB81C',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          YAKAP
        </span>
      </div>
      <div
        className="rounded-full px-6 py-0.5 text-center flex items-center justify-center mt-0.5"
        style={{
          backgroundColor: '#FFB81C',
          color: '#FFFFFF',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          boxShadow: 'inset 0 0 0 1000px #FFB81C',
          border: '1px solid #FFB81C',
        }}
      >
        <span
          className="text-white text-[11px] font-black uppercase tracking-widest font-sans"
          style={{
            color: '#FFFFFF',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          PARA MALAYO SA SAKIT
        </span>
      </div>
    </div>
  );
}

export function MedicalCertificates({ medicalCerts, patients, selectedPatientId, onAddCert, onUpdateCert, onDeleteCert, searchQuery }: MedicalCertificatesProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'archives'>('template');
  const [editMode, setEditMode] = useState(true);
  const [selectedCertId, setSelectedCertId] = useState<string>('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(selectedPatientId || '');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showIssueSuccessModal, setShowIssueSuccessModal] = useState(false);
  const [issuedSummary, setIssuedSummary] = useState<{
    id: string;
    patientName: string;
    date: string;
    diagnosis: string;
    doctor: string;
  } | null>(null);
  const [autoDownloadOnFormIssue, setAutoDownloadOnFormIssue] = useState(true);
  const isInitialRender = useRef(true);

  // Issue Certificate modal state
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);
  const [issueCertForm, setIssueCertForm] = useState({
    patientId: '',
    date: '',
    name: '',
    age: '',
    gender: 'FEMALE',
    yearLevel: '',
    courseOrDepartment: '',
    complaint: '',
    diagnosis: '',
    treatment: '',
    recommendations: '',
  });

  // Active document fields initialized with reference document data matching user image
  const [date, setDate] = useState('June 17, 2026');
  const [patientName, setPatientName] = useState('Aaliyah Ysabella G. Cosino');
  const [age, setAge] = useState<number | string>(23);
  const [sex, setSex] = useState('FEMALE');
  const [yearLevel, setYearLevel] = useState('4');
  const [yearSuffix, setYearSuffix] = useState('th');
  const [courseAndSchool, setCourseAndSchool] = useState('BS Arc student of University of the Assumption');
  const [examinedDueTo, setExaminedDueTo] = useState('skin allergies and difficulty on breathing.');
  const [diagnosis, setDiagnosis] = useState('Allergic reaction secondary to food intake with allergens.');
  const [treatment, setTreatment] = useState('Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.');
  const [recommendations, setRecommendations] = useState('Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.');
  const [doctor, setDoctor] = useState('JOHNNY MICHAEL P. MANGULABNAN, MD');
  const [doctorTitle, setDoctorTitle] = useState('UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
  const [licenseNo, setLicenseNo] = useState('0095055');
  const [ptrNo, setPtrNo] = useState('22483890');
  const [purpose, setPurpose] = useState('Medical Certificate issuance');
  const [currentPatientId, setCurrentPatientId] = useState<string>('');

  const isCertIssued = Boolean(selectedCertId && medicalCerts.some(c => c.id === selectedCertId));

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleDeleteCert = async (certId: string, name?: string) => {
    const displayName = name || 'this record';
    if (!window.confirm(`Are you sure you want to delete medical certificate #${certId} for ${displayName}? This action cannot be undone.`)) {
      return;
    }
    try {
      if (onDeleteCert) {
        await onDeleteCert(certId);
      }
      triggerToast(`🗑️ Medical Certificate #${certId} deleted from archives.`);
      if (selectedCertId === certId) {
        handleCreateNew();
      }
    } catch (err) {
      console.error('Failed to delete certificate:', err);
      triggerToast('⚠️ Error deleting certificate.');
    }
  };

  // Save the certificate record to archives explicitly
  const syncToArchives = useCallback(async () => {
    const certIdToUse = selectedCertId || `MC-${Date.now().toString().slice(-6)}`;
    const existing = medicalCerts.find(c => c.id === certIdToUse);
    const fullDesignation = `${yearLevel ? `${yearLevel}${yearSuffix} ` : ''}${courseAndSchool}`;

    if (!selectedCertId) {
      setSelectedCertId(certIdToUse);
    }

    let pId = currentPatientId;
    if (!pId && patientName) {
      const cleanInput = patientName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const matched = patients.find(p => {
        const cleanPName = (p.name || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return cleanPName === cleanInput || cleanPName.includes(cleanInput) || cleanInput.includes(cleanPName);
      });
      if (matched) pId = matched.id;
    }
    if (!pId && selectedPatientId) {
      pId = selectedPatientId;
    }
    // Guarantee pId is a valid UUID for Django backend if possible
    if (!pId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pId)) {
      const validPatient = patients.find(p => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id));
      if (validPatient) {
        pId = validPatient.id;
      }
    }

    const updatedCert: MedicalCertificate = {
      id: certIdToUse,
      patientId: pId || (patients[0]?.id || 'STU-2024-001'),
      date: date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }),
      purpose: purpose || 'Medical Certificate issuance',
      diagnosis: diagnosis,
      recommendation: recommendations,
      doctor: doctor,
      issuedBy: 'UA CLINIC ADMIN',
      patientName: patientName,
      age: age,
      sex: sex,
      statusDesignation: fullDesignation,
      examinedDueTo: examinedDueTo,
      treatment: treatment,
      doctorTitle: doctorTitle,
      licenseNo: licenseNo,
      ptrNo: ptrNo,
    };

    try {
      if (existing) {
        await onUpdateCert(updatedCert);
        return updatedCert;
      } else {
        const created = await onAddCert(updatedCert);
        if (created && (created as any).id) {
          setSelectedCertId((created as any).id);
        }
        return created || updatedCert;
      }
    } catch (e) {
      console.error('Error saving certificate to archive:', e);
      return updatedCert;
    }
  }, [selectedCertId, currentPatientId, date, purpose, diagnosis, recommendations, doctor, patientName, age, sex, yearLevel, yearSuffix, courseAndSchool, examinedDueTo, treatment, doctorTitle, licenseNo, ptrNo, medicalCerts, onAddCert, onUpdateCert, patients, selectedPatientId]);

  const handleIssueCertificate = async (options: { downloadPdf?: boolean; printAfter?: boolean } = { downloadPdf: true }) => {
    if (!patientName.trim()) {
      triggerToast('⚠️ Please select or enter a patient name before issuing.');
      return;
    }
    if (!diagnosis.trim() && !examinedDueTo.trim()) {
      triggerToast('⚠️ Please provide an examination reason or diagnosis.');
      return;
    }

    setIsIssuing(true);
    triggerToast('Issuing official medical certificate & syncing records...');

    try {
      const savedCert = await syncToArchives();
      const certId = savedCert?.id || selectedCertId || `MC-${Date.now().toString().slice(-6)}`;

      setIssuedSummary({
        id: certId,
        patientName: patientName,
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }),
        diagnosis: diagnosis || examinedDueTo || 'Medical Consultation',
        doctor: doctor,
      });

      setShowIssueSuccessModal(true);
      triggerToast(`✅ Medical Certificate #${certId} successfully issued to ${patientName}!`);

      if (options.downloadPdf) {
        await handleDownloadPDF();
      } else if (options.printAfter) {
        handlePrint();
      }
    } catch (err) {
      console.error('Issue failed:', err);
      triggerToast('⚠️ Error issuing certificate. Please try again.');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleSelectCert = (cert: MedicalCertificate) => {
    setSelectedCertId(cert.id);
    setDate(cert.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }));
    setPatientName(cert.patientName || patients.find(p => p.id === cert.patientId)?.name || 'Patient Name');
    setAge(cert.age || patients.find(p => p.id === cert.patientId)?.age || 23);
    setSex(cert.sex || patients.find(p => p.id === cert.patientId)?.sex || 'FEMALE');
    
    // Parse designation if possible
    if (cert.statusDesignation) {
      const parts = cert.statusDesignation.match(/^(\d+)(st|nd|rd|th)\s+(.*)/);
      if (parts) {
        setYearLevel(parts[1]);
        setYearSuffix(parts[2]);
        setCourseAndSchool(parts[3]);
      } else {
        setYearLevel('');
        setYearSuffix('');
        setCourseAndSchool(cert.statusDesignation);
      }
    }
    
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
    setPatientName(p.name ? p.name.toUpperCase() : p.name);
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
    triggerToast(`Loaded patient details for ${p.name}.`);
  };

  useEffect(() => {
    if (selectedPatientId) {
      setSelectedPatientFilter(selectedPatientId);
      handleQuickLoadPatient(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleSaveCertificate = async () => {
    await syncToArchives();
    triggerToast('✅ Successfully saved and locked certificate into Clinic Records Archive!');
  };

  const handleCreateNew = () => {
    const newId = `MC-${Date.now().toString().slice(-6)}`;
    setSelectedCertId(newId);
    setDate(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'Asia/Manila' }));
    setPatientName('');
    setAge('');
    setSex('FEMALE');
    setYearLevel('');
    setYearSuffix('');
    setCourseAndSchool('');
    setExaminedDueTo('');
    setDiagnosis('');
    setTreatment('');
    setRecommendations('');
    setPurpose('');
    setCurrentPatientId('');
    setActiveTab('template');
    triggerToast('New blank certificate created.');
  };

  // Issue Certificate: populate template from form data and save to archives
  const handleIssueCertSubmit = async () => {
    const { patientId, date: fDate, name, age: fAge, gender, yearLevel: fYL, courseOrDepartment, complaint, diagnosis: fDiag, treatment: fTreat, recommendations: fRec } = issueCertForm;
    if (!name || !fDate || !complaint || !fDiag) return;

    const newId = `MC-${Date.now().toString().slice(-6)}`;

    // Build year/suffix from yearLevel input
    const ylNum = fYL.replace(/\D/g, '');
    const suffix = ylNum === '1' ? 'st' : ylNum === '2' ? 'nd' : ylNum === '3' ? 'rd' : ylNum ? 'th' : '';
    const designation = ylNum ? `${ylNum}${suffix} ${courseOrDepartment}` : courseOrDepartment;

    let finalPatientId = patientId;
    if (!finalPatientId && name) {
      const matched = patients.find(p => p.name.trim().toUpperCase() === name.trim().toUpperCase());
      if (matched) finalPatientId = matched.id;
    }
    if (!finalPatientId && selectedPatientId) {
      finalPatientId = selectedPatientId;
    }
    if (!finalPatientId && patients.length > 0) {
      finalPatientId = patients[0].id;
    }

    // Populate the certificate template fields
    setSelectedCertId(newId);
    setCurrentPatientId(finalPatientId);
    setDate(fDate);
    setPatientName(name);
    setAge(fAge || '');
    setSex(gender.toUpperCase());
    setYearLevel(ylNum);
    setYearSuffix(suffix);
    setCourseAndSchool(ylNum ? `year level of ${courseOrDepartment}` : courseOrDepartment);
    setExaminedDueTo(complaint);
    setDiagnosis(fDiag);
    setTreatment(fTreat);
    setRecommendations(fRec);
    setPurpose(`Medical certificate — ${complaint}`);

    // Build and save the cert record
    const newCert: MedicalCertificate = {
      id: newId,
      patientId: finalPatientId || 'unknown',
      date: fDate,
      purpose: `Medical certificate — ${complaint}`,
      diagnosis: fDiag,
      recommendation: fRec,
      doctor,
      issuedBy: 'UA CLINIC ADMIN',
      patientName: name,
      age: fAge || '',
      sex: gender.toUpperCase(),
      statusDesignation: designation,
      examinedDueTo: complaint,
      treatment: fTreat,
      doctorTitle,
      licenseNo,
      ptrNo,
    };

    try {
      const created = await onAddCert(newCert);
      const assignedId = (created as any)?.id || newId;
      if (assignedId) {
        setSelectedCertId(assignedId);
      }

      setIssuedSummary({
        id: assignedId,
        patientName: name,
        date: fDate,
        diagnosis: fDiag,
        doctor,
      });

      setShowIssueCertModal(false);
      setIssueCertForm({ patientId: '', date: '', name: '', age: '', gender: 'FEMALE', yearLevel: '', courseOrDepartment: '', complaint: '', diagnosis: '', treatment: '', recommendations: '' });
      setActiveTab('template');

      if (autoDownloadOnFormIssue) {
        setTimeout(() => {
          handleDownloadPDF();
        }, 300);
      }
      setShowIssueSuccessModal(true);
      triggerToast(`✅ Medical Certificate #${assignedId} successfully issued to ${name}!`);
    } catch (err) {
      console.error('Error adding cert:', err);
      triggerToast('✅ Certificate template populated.');
      setShowIssueCertModal(false);
      setActiveTab('template');
    }
  };

  // AUTOMATIC DIRECT PDF DOWNLOAD
  const handleDownloadPDF = async (override?: { patientName?: string; date?: string }) => {
    if (isDownloading) return;
    setIsDownloading(true);
    triggerToast('Generating official PDF... Please wait!');

    // Auto-save to archives in the background (non-blocking)
    syncToArchives().catch(e => console.error('Background archive sync error:', e));

    try {
      // Ensure we are viewing the template tab
      if (activeTab !== 'template') {
        setActiveTab('template');
        await new Promise(r => setTimeout(r, 200));
      }

      // Temporarily switch to read-only clean presentation (inputs become clean text spans)
      setEditMode(false);
      await new Promise(r => setTimeout(r, 150));

      const element = document.getElementById('official-med-cert-page');
      if (!element) {
        setEditMode(true);
        setIsDownloading(false);
        triggerToast('Error: Certificate document element not found.');
        return;
      }

      const targetPatientName = override?.patientName || issuedSummary?.patientName || patientName || 'PATIENT';
      const targetDate = override?.date || issuedSummary?.date || date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      const filename = formatMedCertFilename(targetPatientName, targetDate);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      // Restore edit mode immediately
      setEditMode(true);

      // Build 1-page Letter PDF from canvas using jsPDF
      const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11);

      // Direct automatic download with fallback
      try {
        pdf.save(filename);
      } catch (saveErr) {
        console.warn('pdf.save fallback to Blob download:', saveErr);
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }

      setIsDownloading(false);
      triggerToast(`✅ Successfully downloaded ${filename}!`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setEditMode(true);
      setIsDownloading(false);
      triggerToast('⚠️ Error generating PDF. Please try again.');
    }
  };

  const handlePrint = async (override?: { patientName?: string; date?: string }) => {
    syncToArchives().catch(e => console.error('Archive sync:', e));
    setEditMode(false);
    triggerToast('Opening print document view. Automatically recorded to archives!');

    const targetPatientName = override?.patientName || issuedSummary?.patientName || patientName || 'PATIENT';
    const targetDate = override?.date || issuedSummary?.date || date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const docTitle = formatMedCertFilename(targetPatientName, targetDate).replace(/\.pdf$/i, '');
    const oldTitle = document.title;
    document.title = docTitle;

    const onAfterPrint = () => {
      setEditMode(true);
      document.title = oldTitle;
      window.removeEventListener('afterprint', onAfterPrint);
    };
    window.addEventListener('afterprint', onAfterPrint);

    setTimeout(() => {
      window.print();
    }, 250);
  };

  const filteredCerts = medicalCerts.filter(c => {
    const cDate = normalizeDate(c.date);
    const filterD = normalizeDate(dateFilter);
    const matchDate = !filterD || cDate === filterD;
    const matchPatient = !selectedPatientFilter || c.patientId === selectedPatientFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      (c.patientName && c.patientName.toLowerCase().includes(q)) ||
      (c.purpose && c.purpose.toLowerCase().includes(q)) ||
      (c.diagnosis && c.diagnosis.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q));
    return matchDate && matchPatient && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-transparent min-h-full">
      {/* Custom Print & Font Styling ensuring 100% fidelity to Letter PDF template */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #official-med-cert-page, #official-med-cert-page * {
            visibility: visible !important;
          }
          #official-med-cert-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            min-height: 11in !important;
            height: 11in !important;
            max-width: 8.5in !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0.65in 0.75in !important;
            margin: 0 auto !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .watermark-seal {
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
            opacity: 0.22 !important;
          }
          input, textarea, select {
            background: transparent !important;
            border: none !important;
            outline: none !important;
            padding: 0 !important;
            margin: 0 !important;
            resize: none !important;
            color: #000000 !important;
            box-shadow: none !important;
            font-family: inherit !important;
          }
          input::placeholder, textarea::placeholder {
            color: transparent !important;
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
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-5 duration-300 border border-gray-800">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{showToast}</span>
          <button onClick={() => setShowToast(null)} className="text-gray-400 hover:text-white ml-2 cursor-pointer"><X size={16} /></button>
        </div>
      )}

      {/* 1. Header Bar & Controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
            Medical Certificates
          </h1>
        </div>

        {/* Tab switcher and actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'template' ? 'bg-white text-[#1E5AA8] shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={15} />
              <span>Official Template</span>
            </button>
            <button
              onClick={() => {
                syncToArchives();
                setActiveTab('archives');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'archives' ? 'bg-white text-[#1E5AA8] shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookmarkCheck size={15} />
              <span>Archives</span>
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${activeTab === 'archives' ? 'bg-blue-100 text-[#1E5AA8]' : 'bg-gray-200 text-gray-600'}`}>
                {medicalCerts.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleCreateNew}
            title="Clear and create a new blank certificate"
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            style={{ background: PRIMARY }}
          >
            <Plus size={16} />
            <span>New Cert</span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* VIEW 1: OFFICIAL INTERACTIVE MEDICAL CERTIFICATE (EXACT PDF REPLICA) */}
      {/* ========================================================================================= */}
      {activeTab === 'template' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Unified Clinical Action Bar (High-Hierarchy Command Bar) */}
          <div className="no-print bg-white p-3 sm:p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            {/* Left: Patient Context & Quick Selector */}
            <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCertIssued ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-[#1E5AA8] border border-blue-200'}`}>
                {isCertIssued ? <CheckCircle2 size={16} /> : <UserCheck size={16} />}
              </div>

              {/* Patient dropdown */}
              <div className="relative min-w-[200px] max-w-xs flex-1 sm:flex-initial">
                <select
                  value={currentPatientId}
                  onChange={e => handleQuickLoadPatient(e.target.value)}
                  className="w-full appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all cursor-pointer truncate"
                  title="Switch patient to load into certificate"
                >
                  <option value="">Choose patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name ? p.name.toUpperCase() : p.name} {p.category ? `(${p.category})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight inline-flex items-center gap-1.5 shrink-0 ${isCertIssued ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-amber-50 text-amber-700 border border-amber-200/80'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCertIssued ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isCertIssued ? `Issued #${selectedCertId}` : 'Draft'}
              </span>

              {/* New Blank Certificate button */}
              <button
                onClick={handleCreateNew}
                title="Start a new blank medical certificate"
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>

            {/* Right: Actions Hierarchy */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 border-gray-100 pt-2 lg:pt-0">

              {/* Form Modal entry shortcut */}
              <button
                onClick={() => setShowIssueCertModal(true)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors text-xs cursor-pointer"
                title="Fill via form popup"
              >
                <Edit2 size={14} />
              </button>

              {/* THE ONE PRIMARY HERO ACTION: ISSUE CERTIFICATE */}
              <button
                onClick={() => handleIssueCertificate({ downloadPdf: true })}
                disabled={isIssuing || isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer ml-1"
                title="Issue certificate, sync to mobile app, and download official PDF"
              >
                <CheckCircle2 size={15} className="text-white shrink-0" />
                <span>{isIssuing ? 'Issuing...' : 'Issue Certificate'}</span>
              </button>
            </div>
          </div>

          {/* ===================================================================================== */}
          {/* THE OFFICIAL DOCUMENT SHEET (Exact Letter Paper Dimensions, Fonts, & Watermark) */}
          {/* ===================================================================================== */}
          <div className="bg-gray-100/70 p-4 sm:p-8 rounded-xl border border-gray-200 overflow-x-auto flex justify-center hide-scrollbar">
            <div
              id="official-med-cert-page"
              className="font-official relative bg-white border border-gray-300 shadow-2xl mx-auto text-black text-[15.5px] font-bold leading-relaxed overflow-hidden box-border"
              style={{
                width: '8.5in',
                height: '11in',
                minWidth: '8.5in',
                minHeight: '11in',
                maxWidth: '8.5in',
                maxHeight: '11in',
                padding: '0.65in 0.75in',
                boxSizing: 'border-box'
              }}
            >
            
            {/* Center Background Watermark (Larger UA seal matching Image 2) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
              <img
                src={uaLogoBase64}
                alt="University Seal Watermark"
                className="watermark-seal w-[680px] h-[680px] object-contain opacity-25 grayscale select-none pointer-events-none"
                style={{
                  opacity: 0.22,
                  filter: 'grayscale(100%)',
                  WebkitFilter: 'grayscale(100%)',
                }}
              />
            </div>

            {/* Document Content Layer */}
            <div className="relative z-10 space-y-6 font-official font-bold text-black">
              
              {/* TOP HEADER SECTION */}
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center justify-between gap-3">
                  {/* Far Left: University of the Assumption Seal */}
                  <div className="w-28 flex-shrink-0 flex items-center justify-start">
                    <img src={uaSealBase64} alt="UA Seal" className="w-[105px] h-[105px] object-contain" />
                  </div>

                  {/* Center: University typography and PhilHealth YAKAP Logo banner */}
                  <div className="flex-1 text-center space-y-0.5 px-1">
                    <div
                      className="text-[26px] font-bold font-official tracking-tight leading-none"
                      style={{
                        color: '#002060',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                      }}
                    >
                      UNIVERSITY of the ASSUMPTION
                    </div>
                    
                    <PhilHealthYakapBanner />
                  </div>

                  {/* Far Right: Bagong Pilipinas Emblem */}
                  <div className="w-28 flex-shrink-0 flex items-center justify-end">
                    <BagongPilipinasLogo />
                  </div>
                </div>

                {/* Address line centered underneath top row */}
                <div
                  className="text-[14px] font-bold font-official text-center pt-1 tracking-tight"
                  style={{
                    color: '#002060',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  Unisite Subdivision, Del Pilar, City of San Fernando, 2000 Pampanga, Philippines
                </div>
              </div>

              {/* DATE LINE (Right Aligned, exactly like PDF image) */}
              <div className="flex justify-end pt-4 pr-1 font-official font-bold text-[15.5px] text-black">
                <div className="flex items-center">
                  <span>DATE:&nbsp;&nbsp;</span>
                  <AutoResizeInput value={date} onChange={(e: any) => setDate(e.target.value)} readOnly={!editMode} className="w-40" />
                </div>
              </div>

              {/* DOCUMENT TITLE (Centered, bold, uppercase) */}
              <div className="text-center pt-2 pb-2">
                <h2 className="text-[22px] font-bold uppercase tracking-wide font-official text-black">
                  MEDICAL CERTIFICATE
                </h2>
              </div>

              {/* BODY PARAGRAPHS */}
              <div className="space-y-6 text-black text-[15.5px] leading-[1.8] text-justify font-official font-bold px-1">
                
                {/* Paragraph 1: Certification statement */}
                <div className="text-justify indent-10">
                  <span>This is to certify that </span>
                  <AutoResizeInput value={patientName} onChange={(e: any) => setPatientName(e.target.value)} readOnly={!editMode} />
                  <span>, </span>
                  <AutoResizeInput value={age} onChange={(e: any) => setAge(e.target.value)} readOnly={!editMode} />
                  <span> years old, </span>
                  <AutoResizeInput value={sex} onChange={(e: any) => setSex(e.target.value.toUpperCase())} readOnly={!editMode} />
                  <span>, a </span>
                  
                  {yearLevel && (
                    <>
                      <span className="inline-flex items-baseline">
                        <AutoResizeInput value={yearLevel} onChange={(e: any) => setYearLevel(e.target.value)} readOnly={!editMode} />
                        <sup className="text-[11px] font-bold">
                          <AutoResizeInput value={yearSuffix} onChange={(e: any) => setYearSuffix(e.target.value)} readOnly={!editMode} />
                        </sup>
                      </span>
                      <span> year level of </span>
                    </>
                  )}
                  
                  <AutoResizeInput value={courseAndSchool} onChange={(e: any) => setCourseAndSchool(e.target.value)} readOnly={!editMode} />
                  <span> has been seen and examined due to </span>
                  <AutoResizeInput value={examinedDueTo} onChange={(e: any) => setExaminedDueTo(e.target.value)} readOnly={!editMode} />
                </div>

                {/* Paragraph 2: Diagnosis */}
                <div className="font-official font-bold text-[15.5px] leading-[1.8] text-black">
                  <span>Diagnosis:&nbsp;&nbsp;</span>
                  <AutoResizeInput value={diagnosis} onChange={(e: any) => setDiagnosis(e.target.value)} readOnly={!editMode} />
                </div>

                {/* Paragraph 3: Treatment (Indented block layout matching image) */}
                <div className="flex items-start gap-2 font-official font-bold text-[15.5px] leading-[1.8] text-black">
                  <span className="whitespace-nowrap flex-shrink-0">Treatment:&nbsp;&nbsp;</span>
                  <div className="flex-1">
                    {!editMode ? (
                      <div className="whitespace-pre-line">{treatment}</div>
                    ) : (
                      <textarea
                        value={treatment}
                        onChange={e => setTreatment(e.target.value)}
                        rows={treatment.split('\n').length || 2}
                        className="w-full font-official font-bold text-[15.5px] leading-[1.8] text-black bg-amber-50/40 border border-dashed border-amber-400 rounded p-1 focus:outline-none focus:bg-amber-100/60 resize-none overflow-hidden"
                        placeholder="Enter prescribed dosage and treatment..."
                      />
                    )}
                  </div>
                </div>

                {/* Paragraph 4: Recommendations */}
                <div className="text-justify font-official font-bold text-[15.5px] leading-[1.8] text-black">
                  <span>Recommendations:&nbsp;&nbsp;</span>
                  {!editMode ? (
                    <span>{recommendations}</span>
                  ) : (
                    <textarea
                      value={recommendations}
                      onChange={e => setRecommendations(e.target.value)}
                      rows={2}
                      className="w-full font-official font-bold text-[15.5px] leading-[1.8] text-black bg-amber-50/40 border border-dashed border-amber-400 rounded p-1 focus:outline-none focus:bg-amber-100/60 resize-none mt-1"
                      placeholder="Enter recommendations..."
                    />
                  )}
                </div>

                {/* Paragraph 5: Standard Disclaimer */}
                <div className="pt-4 text-black text-[15px] leading-[1.8] font-official font-bold text-justify">
                  This certificate is being issued upon the request of the above patient for whatever purpose it may serve. This certificate is not intended for use in legal matters or proceedings or for issuance claim.
                </div>
              </div>

              {/* SIGNATURE & PHYSICIAN CREDENTIALS BLOCK (Bottom Right Alignment) */}
              <div className="flex justify-end pt-8 pr-2">
                <div className="w-[340px] font-official font-bold text-black text-center">
                  
                  {/* Solid signature dividing line */}
                  <div className="border-t-[1.5px] border-black pt-1 mb-0.5 w-full">
                    {!editMode ? (
                      <div className="font-official font-bold text-[15.5px] uppercase">{doctor}</div>
                    ) : (
                      <input
                        type="text"
                        value={doctor}
                        onChange={e => setDoctor(e.target.value)}
                        className="w-full text-center bg-amber-50/40 border-b border-dashed border-amber-400 focus:outline-none font-official font-bold text-[15.5px] uppercase"
                      />
                    )}
                  </div>

                  {/* Physician Title */}
                  <div className="font-official font-bold text-[14.5px] tracking-tight uppercase text-black">
                    {!editMode ? (
                      <div>{doctorTitle}</div>
                    ) : (
                      <input
                        type="text"
                        value={doctorTitle}
                        onChange={e => setDoctorTitle(e.target.value)}
                        className="w-full text-center bg-amber-50/40 border-b border-dashed border-amber-400 focus:outline-none font-official font-bold text-[14.5px] uppercase"
                      />
                    )}
                  </div>

                  {/* License and PTR numbers (Right-aligned with exact styling) */}
                  <div className="space-y-0.5 pt-2 text-right font-official font-bold text-[15px] text-black">
                    <div className="flex items-center justify-end">
                      <span className="mr-1">LIC:</span>
                      {!editMode ? (
                        <span>{licenseNo}</span>
                      ) : (
                        <input
                          type="text"
                          value={licenseNo}
                          onChange={e => setLicenseNo(e.target.value)}
                          className="w-24 text-right bg-amber-50/40 border-b border-dashed border-amber-400 focus:outline-none font-official font-bold"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      <span>PTR:</span>
                      {!editMode ? (
                        <span>{ptrNo}</span>
                      ) : (
                        <input
                          type="text"
                          value={ptrNo}
                          onChange={e => setPtrNo(e.target.value)}
                          className="w-24 text-right bg-amber-50/40 border-b border-dashed border-amber-400 focus:outline-none font-official font-bold"
                        />
                      )}
                    </div>
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
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="no-print bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookmarkCheck size={18} className="text-[#1E5AA8]" />
                Clinic Certificate Records
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search, filter, print, and re-download previously issued certificates
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Patient Filter */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserCheck size={14} />
                </div>
                <select
                  value={selectedPatientFilter}
                  onChange={e => setSelectedPatientFilter(e.target.value)}
                  className="w-full sm:w-48 appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all cursor-pointer"
                >
                  <option value="">All Patients</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name ? p.name.toUpperCase() : p.name} ({p.category})</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Date Filter */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Calendar size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Filter date..."
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="w-full sm:w-36 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                onClick={handleCreateNew}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                style={{ background: PRIMARY }}
              >
                <Plus size={16} />
                <span>Issue New</span>
              </button>
            </div>
          </div>

          {/* Certificates Grid/List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCerts.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl p-16 text-center text-gray-400 font-medium border border-gray-100 shadow-sm">
                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-base font-bold text-gray-700">No medical certificates found</p>
                <p className="text-xs text-gray-400 mt-1">Try resetting your search filter or issue a new clinic certificate.</p>
              </div>
            ) : (
              filteredCerts.map(cert => {
                const pt = patients.find(p => p.id === cert.patientId);
                return (
                  <div
                    key={cert.id}
                    onClick={() => handleSelectCert(cert)}
                    className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between group border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E5AA8] group-hover:text-white transition-colors" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 leading-tight uppercase">
                              {cert.patientName || pt?.name || 'Clinic Patient'}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              ID: {cert.id} • {normalizeDate(cert.date)}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={12} className="text-emerald-600" /> Issued
                        </span>
                      </div>

                      <div className="space-y-1.5 py-2.5 border-t border-b border-gray-100 my-2 text-xs">
                        {cert.diagnosis && (
                          <div className="text-gray-700">
                            <span className="font-medium text-gray-400 uppercase tracking-wider text-[10px]">Diagnosis:</span>{' '}
                            <span className="font-semibold text-gray-900">{cert.diagnosis}</span>
                          </div>
                        )}
                        {cert.purpose && (
                          <div className="text-gray-600 truncate">
                            <span className="font-medium text-gray-400 uppercase tracking-wider text-[10px]">Purpose:</span>{' '}
                            <span>{cert.purpose}</span>
                          </div>
                        )}
                        {cert.doctor && (
                          <div className="text-gray-500 text-[11px]">
                            Signed by: <span className="font-medium text-gray-800">{cert.doctor}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-[#1E5AA8] group-hover:underline flex items-center gap-1">
                        Open in Template &rarr;
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectCert(cert);
                            setTimeout(() => handleDownloadPDF(), 200);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Download as PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectCert(cert);
                            setTimeout(() => handlePrint(), 200);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E5AA8] transition-colors cursor-pointer"
                          title="Print Certificate"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteCert(cert.id, cert.patientName || pt?.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Certificate Record"
                        >
                          <Trash2 size={15} />
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

      {/* Issue Certificate Modal */}
      {showIssueCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Issue Medical Certificate</h3>
                <p className="text-xs text-gray-500 mt-0.5">Fill in the details — the template will reflect them automatically.</p>
              </div>
              <button onClick={() => setShowIssueCertModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Patient</label>
                <select
                  value={issueCertForm.patientId}
                  onChange={e => {
                    const p = patients.find(pt => pt.id === e.target.value);
                    setIssueCertForm(f => ({
                      ...f,
                      patientId: e.target.value,
                      name: p ? (p.name ? p.name.toUpperCase() : p.name) : f.name,
                      age: p ? String(p.age) : f.age,
                      gender: p?.sex ? p.sex.toUpperCase() : f.gender,
                      yearLevel: p?.yearLevel?.replace(/\D/g, '') || f.yearLevel,
                      courseOrDepartment: p?.course || p?.department || p?.position || f.courseOrDepartment,
                    }));
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name ? p.name.toUpperCase() : p.name} ({p.category})</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="text"
                  placeholder="e.g., August 8, 2026"
                  value={issueCertForm.date}
                  onChange={e => setIssueCertForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Full name of patient"
                  value={issueCertForm.name}
                  onChange={e => setIssueCertForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g., 21"
                    value={issueCertForm.age}
                    onChange={e => setIssueCertForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={issueCertForm.gender}
                    onChange={e => setIssueCertForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                </div>
              </div>

              {/* Year Level & Course/Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year Level</label>
                  <input
                    type="text"
                    placeholder="e.g., 3 (leave blank if N/A)"
                    value={issueCertForm.yearLevel}
                    onChange={e => setIssueCertForm(f => ({ ...f, yearLevel: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Course / Department</label>
                  <input
                    type="text"
                    placeholder="e.g., BS Nursing / HR Dept"
                    value={issueCertForm.courseOrDepartment}
                    onChange={e => setIssueCertForm(f => ({ ...f, courseOrDepartment: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                  />
                </div>
              </div>

              {/* Examination Reason / Complaint */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Examination Reason / Complaint <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., fever and body pain"
                  value={issueCertForm.complaint}
                  onChange={e => setIssueCertForm(f => ({ ...f, complaint: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Diagnosis <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Acute Viral Pharyngitis"
                  value={issueCertForm.diagnosis}
                  onChange={e => setIssueCertForm(f => ({ ...f, diagnosis: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all"
                />
              </div>

              {/* Treatment */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Treatment</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Paracetamol 500mg every 6 hours for 3 days."
                  value={issueCertForm.treatment}
                  onChange={e => setIssueCertForm(f => ({ ...f, treatment: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all resize-none"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Recommendations</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Rest for 2-3 days. May return to school upon full recovery."
                  value={issueCertForm.recommendations}
                  onChange={e => setIssueCertForm(f => ({ ...f, recommendations: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={autoDownloadOnFormIssue}
                  onChange={e => setAutoDownloadOnFormIssue(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Auto-download official PDF upon issuing</span>
              </label>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowIssueCertModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleIssueCertSubmit}
                  disabled={!issueCertForm.name || !issueCertForm.date || !issueCertForm.complaint || !issueCertForm.diagnosis}
                  className="px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer hover:opacity-90"
                  style={{ background: PRIMARY }}
                >
                  <CheckCircle2 size={16} /> Issue & Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================================== */}
      {/* MODAL: ISSUE SUCCESS & MULTI-CHANNEL CONFIRMATION */}
      {/* ===================================================================================== */}
      {showIssueSuccessModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setShowIssueSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Medical Certificate Issued!</h3>
                <p className="text-xs text-gray-500">Official Clinic Document recorded and distributed</p>
              </div>
            </div>

            {/* Issued Summary Box */}
            <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-100 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-blue-200/50">
                <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Certificate No.</span>
                <span className="font-mono font-bold text-[#1E5AA8] text-sm">{issuedSummary?.id || selectedCertId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Patient:</span>
                <span className="font-bold text-gray-900 uppercase">{issuedSummary?.patientName || patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Date Issued:</span>
                <span className="font-medium text-gray-800">{issuedSummary?.date || date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Diagnosis:</span>
                <span className="font-medium text-gray-800 truncate max-w-[200px]">{issuedSummary?.diagnosis || diagnosis}</span>
              </div>
            </div>

            {/* Verification checklist badges */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200/70 text-xs">
                <span className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">📊</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">Recorded in Clinic Reports</div>
                  <div className="text-[10px] text-gray-500">Available under Reports &gt; Medical Certificate</div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200/70 text-xs">
                <span className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-xs">📱</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">Synced to Patient Mobile App</div>
                  <div className="text-[10px] text-gray-500">Visible under My Documents &gt; Certificates tab</div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200/70 text-xs">
                <span className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">📥</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">Downloaded Official PDF</div>
                  <div className="text-[10px] text-gray-500">Official letterhead PDF saved to your downloads</div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  handleDownloadPDF({
                    patientName: issuedSummary?.patientName || patientName,
                    date: issuedSummary?.date || date,
                  });
                }}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                title="Download official PDF to your computer"
              >
                <Download size={14} className={isDownloading ? 'animate-bounce text-emerald-600' : ''} />
                <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              <button
                onClick={() => {
                  handlePrint({
                    patientName: issuedSummary?.patientName || patientName,
                    date: issuedSummary?.date || date,
                  });
                }}
                className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                title="Print certificate copy"
              >
                <Printer size={14} /> Print Copy
              </button>
              <button
                onClick={() => {
                  setShowIssueSuccessModal(false);
                  setActiveTab('archives');
                }}
                className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#1E5AA8] text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookmarkCheck size={14} /> Archives
              </button>
              <button
                onClick={() => setShowIssueSuccessModal(false)}
                className="px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer hover:opacity-90"
                style={{ background: PRIMARY }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
