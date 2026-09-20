import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Printer, Copy, FileText, X, Edit2, Download, Calendar, BookmarkCheck, RefreshCw, UserCheck, Search, AlertCircle, Eye, Edit, CheckCircle2, Users, Award } from 'lucide-react';
import { MedicalCertificate, Patient } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';
import uaLogo from '@/assets/images/ua-logo.png';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PRIMARY = '#1E5AA8';

interface MedicalCertificatesProps {
  medicalCerts: MedicalCertificate[];
  patients: Patient[];
  selectedPatientId: string | null;
  onAddCert: (cert: MedicalCertificate) => void | Promise<void>;
  onUpdateCert: (cert: MedicalCertificate) => void | Promise<void>;
  searchQuery: string;
}

// High-fidelity Bagong Pilipinas Emblem rendering exact official graphic logo
function BagongPilipinasLogo() {
  return (
    <div className="flex flex-col items-center justify-center select-none w-32 flex-shrink-0">
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative w-[76px] h-[76px] mb-0.5">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="redRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A0000" />
                <stop offset="50%" stopColor="#D21034" />
                <stop offset="100%" stopColor="#FF2341" />
              </linearGradient>
              <linearGradient id="blueRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00186B" />
                <stop offset="50%" stopColor="#0038A8" />
                <stop offset="100%" stopColor="#1C65DB" />
              </linearGradient>
              <linearGradient id="sunGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF200" />
                <stop offset="100%" stopColor="#F5B300" />
              </linearGradient>
            </defs>
            <path d="M50 6 L52.5 11.5 L58 11.5 L53.5 15 L55 20 L50 17 L45 20 L46.5 15 L42 11.5 L47.5 11.5 Z" fill="url(#sunGold)"/>
            <path d="M30 14 L32 18 L37 18 L33 21 L35 25 L30 22 L25 25 L27 21 L23 18 L28 18 Z" fill="url(#sunGold)"/>
            <path d="M70 14 L72 18 L77 18 L73 21 L75 25 L70 22 L65 25 L67 21 L63 18 L68 18 Z" fill="url(#sunGold)"/>
            <path d="M50 22 L55 33 L66 28 L60 39 L72 41 L63 49 L72 59 L50 59 L28 59 L37 49 L28 41 L40 39 L34 28 L45 33 Z" fill="url(#sunGold)"/>
            <circle cx="50" cy="51" r="16" fill="url(#sunGold)"/>
            <path d="M12 44 C12 68 28 88 50 92 C36 84 26 68 26 50 C26 48 26 45 12 44 Z" fill="url(#blueRibbon)"/>
            <path d="M88 44 C88 68 72 88 50 92 C64 84 74 68 74 50 C74 48 74 45 88 44 Z" fill="url(#redRibbon)"/>
            <path d="M16 56 C24 78 54 94 84 62 C68 84 38 82 18 64 C16 62 16 58 16 56 Z" fill="url(#redRibbon)"/>
            <path d="M84 56 C76 78 46 94 16 62 C32 84 62 82 82 64 C84 62 84 58 84 56 Z" fill="url(#blueRibbon)"/>
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
      <div className="flex items-baseline justify-center gap-1.5 leading-none">
        <span className="text-[#367BB8] font-black italic text-[24px] tracking-tight font-sans">
          PhilHealth
        </span>
        <span className="text-[#FFB81C] font-black text-[24px] tracking-wider font-sans">
          YAKAP
        </span>
      </div>
      <div className="bg-[#FFB81C] text-white text-[11px] font-black px-6 py-0.5 rounded-full uppercase tracking-widest mt-0.5 font-sans">
        PARA MALAYO SA SAKIT
      </div>
    </div>
  );
}

export function MedicalCertificates({ medicalCerts, patients, selectedPatientId, onAddCert, onUpdateCert, searchQuery }: MedicalCertificatesProps) {
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
      const matched = patients.find(p => p.name.trim().toUpperCase() === patientName.trim().toUpperCase());
      if (matched) pId = matched.id;
    }
    if (!pId && selectedPatientId) {
      pId = selectedPatientId;
    }
    if (!pId && patients.length > 0) {
      pId = patients[0].id;
    }

    const updatedCert: MedicalCertificate = {
      id: certIdToUse,
      patientId: pId || 'STU-2024-001',
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
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        diagnosis: diagnosis || examinedDueTo || 'Medical Consultation',
        doctor: doctor,
      });

      if (options.downloadPdf) {
        await handleDownloadPDF();
      } else if (options.printAfter) {
        handlePrint();
      }

      setShowIssueSuccessModal(true);
      triggerToast(`✅ Medical Certificate #${certId} successfully issued to ${patientName}!`);
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
    triggerToast(`Populated template for ${p.name}. Click 'Save to Archives' to record it.`);
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
      triggerToast('✅ Certificate populated in template! Click "Save to Archives" to record it.');
      setShowIssueCertModal(false);
      setActiveTab('template');
    }
  };

  // AUTOMATIC DIRECT PDF DOWNLOAD
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    triggerToast('Generating PDF file... Please wait!');

    // Auto-save to archives in the background (non-blocking)
    syncToArchives().catch(e => console.error('Background archive sync error:', e));

    let clone: HTMLElement | null = null;

    try {
      const element = document.getElementById('official-med-cert-page');
      if (!element) {
        triggerToast('Error: Document element not found.');
        setIsDownloading(false);
        return;
      }

      const filename = `Medical_Certificate_${patientName.trim().replace(/\s+/g, '_') || 'Patient'}_${Date.now().toString().slice(-4)}.pdf`;

      // Helper: convert any URL to base64 via fetch (avoids canvas CORS taint)
      const urlToBase64 = async (url: string): Promise<string> => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
          });
        } catch {
          return url;
        }
      };

      // Helper: convert SVG element to a base64 PNG data URI
      const svgToBase64 = (svgEl: SVGSVGElement, w: number, h: number): Promise<string> =>
        new Promise(resolve => {
          try {
            const serialized = new XMLSerializer().serializeToString(svgEl);
            const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);
            const img = new Image(w, h);
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = w; c.height = h;
              c.getContext('2d')!.drawImage(img, 0, 0, w, h);
              resolve(c.toDataURL('image/png'));
            };
            img.onerror = () => resolve('');
            img.src = dataUri;
          } catch { resolve(''); }
        });

      // Helper: convert oklch() color value to a safe hex/rgb fallback.
      // html2canvas (even standalone) can crash on oklch() computed colors.
      const oklchToSafe = (val: string): string => {
        if (!val || !val.includes('oklch')) return val;
        const m = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+[\d.]+/);
        if (!m) return '#000000';
        const L = parseFloat(m[1]);
        const C = parseFloat(m[2]);
        if (C < 0.02) {
          // Achromatic — just use lightness as gray
          const g = Math.round(Math.min(1, Math.max(0, L)) * 255);
          return `rgb(${g},${g},${g})`;
        }
        return '#1e293b'; // Safe chromatic fallback
      };

      // COLOR_PROPS that html2canvas reads — we must sanitise these in the onclone doc.
      const COLOR_PROPS = [
        'color', 'backgroundColor', 'borderColor', 'borderTopColor',
        'borderRightColor', 'borderBottomColor', 'borderLeftColor',
        'outlineColor', 'textDecorationColor', 'caretColor',
      ] as const;

      // 1. Pre-render all SVGs from the LIVE element to base64 PNGs (needs live layout)
      const liveSvgs = Array.from(element.querySelectorAll('svg')) as SVGSVGElement[];
      const svgDataUrls: string[] = await Promise.all(
        liveSvgs.map(svg => {
          const rect = svg.getBoundingClientRect();
          const w = Math.round(rect.width) || 100;
          const h = Math.round(rect.height) || 100;
          return svgToBase64(svg, w, h);
        })
      );

      // 2. Clone element (never mutate the live DOM)
      clone = element.cloneNode(true) as HTMLElement;

      // 3. Replace SVGs in clone with pre-rendered <img> tags
      const cloneSvgs = Array.from(clone.querySelectorAll('svg')) as SVGSVGElement[];
      cloneSvgs.forEach((svgEl, i) => {
        const dataUrl = svgDataUrls[i];
        if (!dataUrl) return;
        const rect = liveSvgs[i].getBoundingClientRect();
        const img = document.createElement('img');
        img.src = dataUrl;
        img.width = Math.round(rect.width) || 100;
        img.height = Math.round(rect.height) || 100;
        img.style.display = 'block';
        svgEl.parentNode?.replaceChild(img, svgEl);
      });

      // 4. Convert all <img> src to base64 (prevent canvas CORS taint)
      const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(cloneImgs.map(async img => {
        if (img.src && !img.src.startsWith('data:')) {
          img.src = await urlToBase64(img.src);
        }
      }));

      // 5. Strip input/textarea styling for clean PDF render
      clone.querySelectorAll('input, textarea').forEach(el => {
        const e = el as HTMLElement;
        e.style.background = 'transparent';
        e.style.border = 'none';
        e.style.outline = 'none';
        e.style.boxShadow = 'none';
        e.style.color = '#000000';
      });

      // 6. Mount the clone off-screen with position:fixed + visibility:hidden.
      //    - position:fixed → does NOT affect document layout (no page tilt/shift)
      //    - visibility:hidden → invisible to user but still measurable by html2canvas
      //    - pointer-events:none → UI remains fully interactive (no freeze)
      clone.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: 8.5in',
        'height: 11in',
        'min-width: 8.5in',
        'min-height: 11in',
        'max-width: 8.5in',
        'max-height: 11in',
        'box-sizing: border-box',
        'padding: 0.65in 0.75in',
        'visibility: hidden',
        'pointer-events: none',
        'z-index: -99999',
        'color: #000000',
        'background-color: #ffffff',
        'overflow: hidden',
      ].join('; ');

      document.body.appendChild(clone);

      // 7. Render to canvas using standalone html2canvas.
      //    The onclone callback fires on the cloned document that html2canvas creates
      //    internally — this is where we strip any remaining oklch() computed values
      //    BEFORE html2canvas's color parser reads them.
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
          // Inject safe CSS variable overrides so var(--xxx) resolves to hex, not oklch
          const safeStyle = _clonedDoc.createElement('style');
          safeStyle.textContent = `
            :root, *, *::before, *::after {
              --background: #ffffff !important; --foreground: #000000 !important;
              --card: #ffffff !important; --card-foreground: #000000 !important;
              --popover: #ffffff !important; --popover-foreground: #000000 !important;
              --primary: #1e5aa8 !important; --primary-foreground: #ffffff !important;
              --secondary: #f1f5f9 !important; --secondary-foreground: #1e293b !important;
              --muted: #f1f5f9 !important; --muted-foreground: #64748b !important;
              --accent: #f1f5f9 !important; --accent-foreground: #1e293b !important;
              --destructive: #dc2626 !important; --destructive-foreground: #ffffff !important;
              --border: #e2e8f0 !important; --input: #e2e8f0 !important; --ring: #94a3b8 !important;
              --chart-1: #e67e22 !important; --chart-2: #2ecc71 !important;
              --chart-3: #2c3e50 !important; --chart-4: #f1c40f !important;
              --chart-5: #e74c3c !important;
              --sidebar: #1e293b !important; --sidebar-foreground: #f8fafc !important;
              --sidebar-primary: #3b82f6 !important;
              --sidebar-primary-foreground: #ffffff !important;
              --sidebar-accent: #334155 !important;
              --sidebar-accent-foreground: #f8fafc !important;
              --sidebar-border: #334155 !important; --sidebar-ring: #64748b !important;
              --header-bg: #1e293b !important; --header-border: #334155 !important;
            }
          `;
          if (_clonedDoc.head) _clonedDoc.head.appendChild(safeStyle);

          // Walk every element and inline-override any remaining oklch computed colors
          const allEls = _clonedDoc.querySelectorAll('*');
          allEls.forEach(el => {
            const htmlEl = el as HTMLElement;
            try {
              // Use the ORIGINAL (live) window's getComputedStyle since the cloned doc
              // may not have a complete style cascade. We read from the htmlEl's style.
              COLOR_PROPS.forEach(prop => {
                const inlineVal = htmlEl.style[prop as any];
                if (inlineVal && inlineVal.includes('oklch')) {
                  htmlEl.style[prop as any] = oklchToSafe(inlineVal);
                }
              });
            } catch { /* skip */ }
          });

          // Guarantee the root cert element is white on black
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.color = '#000000';
        },
      });

      // 8. Remove the hidden clone immediately after capture
      document.body.removeChild(clone);
      clone = null;

      // 9. Build PDF from canvas using jsPDF
      const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();   // 8.5 in
      const pageH = pdf.internal.pageSize.getHeight();  // 11 in
      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      const canvasAspect = canvas.height / canvas.width;
      const imgH = pageW * canvasAspect;

      if (imgH <= pageH) {
        // Fits on one page
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
      } else {
        // Multi-page: slice the canvas into letter-height strips
        const pxPerPage = Math.floor(canvas.width * (pageH / pageW));
        let yOffset = 0;
        while (yOffset < canvas.height) {
          const sliceH = Math.min(pxPerPage, canvas.height - yOffset);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceH;
          pageCanvas.getContext('2d')!.drawImage(canvas, 0, -yOffset, canvas.width, canvas.height);
          const sliceData = pageCanvas.toDataURL('image/jpeg', 0.97);
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(sliceData, 'JPEG', 0, 0, pageW, pageH * (sliceH / pxPerPage));
          yOffset += pxPerPage;
        }
      }

      pdf.save(filename);

      setIsDownloading(false);
      triggerToast(`✅ Successfully downloaded ${filename}!`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      // Always clean up the clone even if something went wrong
      if (clone && document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      setIsDownloading(false);
      triggerToast('Failed to generate PDF. Please try again.');
    }
  };



  const handlePrint = async () => {
    await syncToArchives();
    setEditMode(false);
    triggerToast('Opening print document view. Automatically recorded to archives!');
    setTimeout(() => {
      window.print();
      setEditMode(true);
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

  // Top metric stats calculated to match Dashboard stat row
  const todayIso = new Date().toISOString().split('T')[0];
  const issuedTodayCount = medicalCerts.filter(c => {
    if (!c.date) return false;
    const d = c.date.trim();
    if (d === todayIso) return true;
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0] === todayIso;
      }
    } catch {}
    return false;
  }).length;

  const studentCount = medicalCerts.filter(c => {
    const des = (c.statusDesignation || '').toLowerCase();
    return des.includes('student') || des.includes('bs ') || des.includes('yr') || des.includes('year') || des.includes('1st') || des.includes('2nd') || des.includes('3rd') || des.includes('4th') || !c.statusDesignation;
  }).length;

  const personnelCount = Math.max(0, medicalCerts.length - studentCount);

  const medCertStats = [
    {
      label: 'Total Certificates',
      value: medicalCerts.length,
      sub: 'All-time clinic issuances',
      icon: <FileText size={20} />,
      color: PRIMARY,
    },
    {
      label: 'Issued Today',
      value: issuedTodayCount,
      sub: 'Issued today',
      icon: <Award size={20} />,
      color: '#10B981',
    },
    {
      label: 'Students',
      value: studentCount,
      sub: 'Undergraduate & Basic Ed',
      icon: <Users size={20} />,
      color: '#F59E0B',
    },
    {
      label: 'Faculty & Personnel',
      value: personnelCount,
      sub: 'University staff & admin',
      icon: <UserCheck size={20} />,
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-transparent min-h-full">
      {/* Custom Print & Font Styling ensuring 100% fidelity to Letter PDF template */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        @media print {
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
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            resize: none !important;
            color: #000 !important;
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
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{showToast}</span>
          <button onClick={() => setShowToast(null)} className="text-gray-400 hover:text-white ml-2"><X size={16} /></button>
        </div>
      )}

      {/* 1. Header Bar & Controls (Matching Dashboard) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
            Medical Certificates
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Official university medical certificate issuance with automatic clinic reports & mobile app synchronization
          </p>
        </div>

        {/* Tab switcher matching Dashboard pill buttons */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-xl border border-gray-200 p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer
                ${activeTab === 'template' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              style={{ background: activeTab === 'template' ? PRIMARY : 'transparent' }}
            >
              <FileText size={15} />
              <span>Official Template</span>
            </button>
            <button
              onClick={() => {
                syncToArchives();
                setActiveTab('archives');
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer
                ${activeTab === 'archives' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              style={{ background: activeTab === 'archives' ? PRIMARY : 'transparent' }}
            >
              <BookmarkCheck size={15} />
              <span>Archives</span>
              <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${activeTab === 'archives' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {medicalCerts.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleCreateNew}
            title="Clear and create a new blank certificate"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-all cursor-pointer"
            style={{ background: PRIMARY }}
          >
            <Plus size={16} />
            <span>New Cert</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Row (Exact Dashboard Tokens) */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {medCertStats.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 flex flex-col gap-2 transition-all hover:shadow-lg hover:-translate-y-1"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1" style={{ color: card.color }}>{card.value}</div>
            <div className="mt-auto">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">{card.label}</div>
              <div className="text-[11px] text-gray-400 font-medium mt-0.5">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================================= */}
      {/* VIEW 1: OFFICIAL INTERACTIVE MEDICAL CERTIFICATE (EXACT PDF REPLICA) */}
      {/* ========================================================================================= */}
      {activeTab === 'template' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Patient Context & Issuance Status Bar */}
          <div
            className="no-print bg-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${isCertIssued ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-[#1E5AA8] border border-blue-200'}`}>
                {isCertIssued ? <CheckCircle2 size={22} className="text-emerald-600" /> : <UserCheck size={22} className="text-[#1E5AA8]" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patient:</span>
                  <span className="text-sm font-extrabold text-gray-900 uppercase">
                    {patientName || 'No patient selected'}
                  </span>
                  {age && <span className="text-xs text-gray-500 font-semibold">({age} y/o, {sex})</span>}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">
                  {courseAndSchool || 'University of the Assumption Clinic'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isCertIssued ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                <span className={`w-2 h-2 rounded-full ${isCertIssued ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isCertIssued ? `Issued & Recorded (${selectedCertId})` : 'Draft · Ready to Issue'}
              </span>
              <span className="hidden lg:inline text-[11px] text-gray-400 font-medium">
                ⚡ Auto-updates Reports & Patient Mobile App
              </span>
            </div>
          </div>

          {/* Action & Configuration Toolbar */}
          <div
            className="no-print flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            {/* Left side actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Quick Load Patient Dropdown */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserCheck size={14} />
                </div>
                <select
                  value={currentPatientId}
                  onChange={e => handleQuickLoadPatient(e.target.value)}
                  className="w-full sm:w-56 appearance-none bg-gray-50/80 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] transition-all cursor-pointer"
                >
                  <option value="">Quick load patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name ? p.name.toUpperCase() : p.name} ({p.category})</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <button
                onClick={() => setShowIssueCertModal(true)}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                <Edit2 size={14} /> Fill via Form
              </button>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editMode ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                title="Toggle visual highlights on editable words"
              >
                {editMode ? <Edit size={14} /> : <Eye size={14} />}
                <span>{editMode ? 'Editing Mode' : 'Preview Mode'}</span>
              </button>
            </div>

            {/* Right side actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0">
              <button
                onClick={handleSaveCertificate}
                title="Save draft to archives without issuing or downloading"
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 font-bold text-xs transition-all cursor-pointer"
              >
                <BookmarkCheck size={15} className="text-gray-500" /> Save Draft
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all cursor-pointer"
              >
                <Printer size={15} /> Print
              </button>

              {isCertIssued && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-70 font-bold text-xs transition-all cursor-pointer"
                >
                  <Download size={15} className={isDownloading ? 'animate-bounce' : ''} />
                  <span>{isDownloading ? 'Downloading...' : 'Re-download PDF'}</span>
                </button>
              )}

              {/* PRIMARY HERO BUTTON: ISSUE CERTIFICATE */}
              <button
                onClick={() => handleIssueCertificate({ downloadPdf: true })}
                disabled={isIssuing || isDownloading}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={16} className="text-white" />
                <span>{isIssuing ? 'Issuing...' : isDownloading ? 'Downloading PDF...' : 'ISSUE CERTIFICATE'}</span>
              </button>
            </div>
          </div>

          {/* ===================================================================================== */}
          {/* THE OFFICIAL DOCUMENT SHEET (Exact Letter Paper Dimensions, Fonts, & Watermark) */}
          {/* ===================================================================================== */}
          <div className="bg-slate-100/70 p-4 sm:p-8 rounded-2xl border border-slate-200/80 overflow-x-auto flex justify-center shadow-inner hide-scrollbar">
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
                src={uaLogo}
                alt="University Seal Watermark"
                className="watermark-seal w-[680px] h-[680px] object-contain opacity-25 grayscale"
              />
            </div>

            {/* Document Content Layer */}
            <div className="relative z-10 space-y-6 font-official font-bold text-black">
              
              {/* TOP HEADER SECTION */}
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center justify-between gap-3">
                  {/* Far Left: University of the Assumption Seal */}
                  <div className="w-28 flex-shrink-0 flex items-center justify-start">
                    <img src={uaSeal} alt="UA Seal" className="w-[105px] h-[105px] object-contain" />
                  </div>

                  {/* Center: University typography and PhilHealth YAKAP Logo banner */}
                  <div className="flex-1 text-center space-y-0.5 px-1">
                    <div className="text-[26px] font-bold text-[#002060] font-official tracking-tight leading-none">
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
                <div className="text-[14px] font-bold text-[#002060] font-official text-center pt-1 tracking-tight">
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
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div
            className="no-print bg-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookmarkCheck size={20} className="text-[#1E5AA8]" />
                Clinic Certificate Records
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
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
                  className="w-full sm:w-48 appearance-none bg-gray-50/80 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] transition-all cursor-pointer"
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
                  className="w-full sm:w-36 bg-gray-50/80 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] transition-all"
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                onClick={handleCreateNew}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-all cursor-pointer"
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
              <div
                className="col-span-full bg-white rounded-xl p-16 text-center text-gray-400 font-medium"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
              >
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
                    className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between group transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E5AA8] group-hover:text-white transition-colors" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight uppercase">
                              {cert.patientName || pt?.name || 'Clinic Patient'}
                            </div>
                            <div className="text-xs font-semibold text-gray-400 mt-0.5">
                              ID: {cert.id} • Issued: {cert.date}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={10} className="text-emerald-600" /> Issued
                        </span>
                      </div>

                      <div className="space-y-2 py-3 border-t border-b border-gray-100 my-2 text-xs">
                        {cert.diagnosis && (
                          <div className="text-gray-700">
                            <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Diagnosis:</span>{' '}
                            <strong className="text-gray-900">{cert.diagnosis}</strong>
                          </div>
                        )}
                        {cert.purpose && (
                          <div className="text-gray-600 truncate">
                            <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Purpose:</span>{' '}
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
                          className="p-2 rounded-xl hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
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
                          className="p-2 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-[#1E5AA8] transition-colors cursor-pointer"
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

      {/* Issue Certificate Modal */}
      {showIssueCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-gray-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Issue Medical Certificate</h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details — the template will reflect them automatically.</p>
              </div>
              <button onClick={() => setShowIssueCertModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Patient */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Select Patient</label>
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
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name ? p.name.toUpperCase() : p.name} ({p.category})</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="text"
                  placeholder="e.g., August 8, 2026"
                  value={issueCertForm.date}
                  onChange={e => setIssueCertForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Full name of patient"
                  value={issueCertForm.name}
                  onChange={e => setIssueCertForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g., 21"
                    value={issueCertForm.age}
                    onChange={e => setIssueCertForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={issueCertForm.gender}
                    onChange={e => setIssueCertForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                </div>
              </div>

              {/* Year Level & Course/Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Year Level</label>
                  <input
                    type="text"
                    placeholder="e.g., 3 (leave blank if N/A)"
                    value={issueCertForm.yearLevel}
                    onChange={e => setIssueCertForm(f => ({ ...f, yearLevel: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Course / Department</label>
                  <input
                    type="text"
                    placeholder="e.g., BS Nursing / HR Dept"
                    value={issueCertForm.courseOrDepartment}
                    onChange={e => setIssueCertForm(f => ({ ...f, courseOrDepartment: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              {/* Examination Reason / Complaint */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Examination Reason / Complaint <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., fever and body pain"
                  value={issueCertForm.complaint}
                  onChange={e => setIssueCertForm(f => ({ ...f, complaint: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Diagnosis <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Acute Viral Pharyngitis"
                  value={issueCertForm.diagnosis}
                  onChange={e => setIssueCertForm(f => ({ ...f, diagnosis: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>

              {/* Treatment */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Treatment</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Paracetamol 500mg every 6 hours for 3 days."
                  value={issueCertForm.treatment}
                  onChange={e => setIssueCertForm(f => ({ ...f, treatment: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] resize-none"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Recommendations</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Rest for 2-3 days. May return to school upon full recovery."
                  value={issueCertForm.recommendations}
                  onChange={e => setIssueCertForm(f => ({ ...f, recommendations: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-bold select-none">
                <input
                  type="checkbox"
                  checked={autoDownloadOnFormIssue}
                  onChange={e => setAutoDownloadOnFormIssue(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Auto-download official PDF upon issuing</span>
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueCertModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleIssueCertSubmit}
                  disabled={!issueCertForm.name || !issueCertForm.date || !issueCertForm.complaint || !issueCertForm.diagnosis}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} /> ISSUE & GENERATE
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setShowIssueSuccessModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Medical Certificate Issued!</h3>
                <p className="text-xs text-gray-500 font-semibold">Official Clinic Document recorded and distributed</p>
              </div>
            </div>

            {/* Issued Summary Box */}
            <div className="bg-gradient-to-br from-blue-50/70 to-sky-50/70 rounded-2xl p-4 border border-blue-100 mb-5 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-blue-200/50">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Certificate No.</span>
                <span className="font-mono font-black text-[#1E5AA8] text-sm">{issuedSummary?.id || selectedCertId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Patient:</span>
                <span className="font-extrabold text-gray-900 uppercase">{issuedSummary?.patientName || patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Date Issued:</span>
                <span className="font-bold text-gray-800">{issuedSummary?.date || date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Diagnosis:</span>
                <span className="font-bold text-gray-800 truncate max-w-[200px]">{issuedSummary?.diagnosis || diagnosis}</span>
              </div>
            </div>

            {/* Verification checklist badges */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0">📊</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">Recorded in Clinic Reports</div>
                  <div className="text-[10px] text-gray-500">Available under Reports &gt; Medical Certificate</div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0">📱</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">Synced to Patient Mobile App</div>
                  <div className="text-[10px] text-gray-500">Visible under My Documents &gt; Certificates tab</div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0">📥</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">Downloaded Official PDF</div>
                  <div className="text-[10px] text-gray-500">Official letterhead PDF saved to your downloads</div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowIssueSuccessModal(false);
                  handlePrint();
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Copy
              </button>
              <button
                onClick={() => {
                  setShowIssueSuccessModal(false);
                  setActiveTab('archives');
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#1E5AA8] text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <BookmarkCheck size={14} /> Archives
              </button>
              <button
                onClick={() => setShowIssueSuccessModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1E5AA8] hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm"
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
