import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Printer, Copy, FileText, X, Edit2, Download, Calendar, BookmarkCheck, RefreshCw, UserCheck, Search, AlertCircle, Eye, Edit, CheckCircle2 } from 'lucide-react';
import { MedicalCertificate, Patient } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';
import uaLogo from '@/assets/images/ua-logo.png';
import html2pdf from 'html2pdf.js';

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

// Auto-resizing input that perfectly hugs text without any fixed gaps
const AutoResizeInput = ({ value, onChange, readOnly, placeholder = ' ' }: any) => {
  const isFilled = value && value.length > 0;
  return (
    <span className="inline-grid items-baseline" style={{ minWidth: isFilled ? '0' : '4ch' }}>
      <span className="invisible col-start-1 row-start-1 whitespace-pre">{value || placeholder}</span>
      <input
        type="text"
        size={1}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className="col-start-1 row-start-1 w-full min-w-0 bg-transparent border-none outline-none p-0 m-0 font-inherit text-center focus:bg-amber-50/50 hover:bg-amber-50/50 transition-colors"
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

  // Active document fields (matching the official PDF template exactly)
  const [date, setDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [sex, setSex] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [yearSuffix, setYearSuffix] = useState('');
  const [courseAndSchool, setCourseAndSchool] = useState('');
  const [examinedDueTo, setExaminedDueTo] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [doctor, setDoctor] = useState('JOHNNY MICHAEL P. MANGULABNAN, MD');
  const [doctorTitle, setDoctorTitle] = useState('UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP');
  const [licenseNo, setLicenseNo] = useState('0095055');
  const [ptrNo, setPtrNo] = useState('22483890');
  const [purpose, setPurpose] = useState('');
  const [currentPatientId, setCurrentPatientId] = useState<string>('');

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

    const updatedCert: MedicalCertificate = {
      id: certIdToUse,
      patientId: currentPatientId || 'STU-2024-001',
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
      } else {
        await onAddCert(updatedCert);
      }
    } catch (e) {
      console.error('Error saving certificate to archive:', e);
    }
  }, [selectedCertId, currentPatientId, date, purpose, diagnosis, recommendations, doctor, patientName, age, sex, yearLevel, yearSuffix, courseAndSchool, examinedDueTo, treatment, doctorTitle, licenseNo, ptrNo, medicalCerts, onAddCert, onUpdateCert]);

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
    triggerToast(`Populated template for ${p.name}. Click 'Save to Archives' to record it.`);
  };

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

    // Populate the certificate template fields
    setSelectedCertId(newId);
    setCurrentPatientId(patientId);
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
      patientId: patientId || 'unknown',
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

    // Close modal, reset form, switch to template tab
    setShowIssueCertModal(false);
    setIssueCertForm({ patientId: '', date: '', name: '', age: '', gender: 'FEMALE', yearLevel: '', courseOrDepartment: '', complaint: '', diagnosis: '', treatment: '', recommendations: '' });
    setActiveTab('template');
    triggerToast('✅ Certificate populated in template! Click "Save to Archives" to record it.');
  };

  // AUTOMATIC DIRECT PDF DOWNLOAD
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    triggerToast('Generating PDF file... Please wait!');

    // Auto-save to archives in the background (non-blocking)
    syncToArchives().catch(e => console.error('Background archive sync error:', e));

    try {
      const element = document.getElementById('official-med-cert-page');
      if (!element) {
        triggerToast('Error: Document element not found.');
        setIsDownloading(false);
        return;
      }

      const filename = `Medical_Certificate_${patientName.trim().replace(/\s+/g, '_') || 'Patient'}_${Date.now().toString().slice(-4)}.pdf`;

      // Helper: convert any URL to base64 via fetch (avoids canvas CORS taint entirely)
      const urlToBase64 = async (url: string): Promise<string> => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
          });
        } catch {
          return url;
        }
      };

      // Helper: serialize an SVG element to a base64 PNG using a data: URI
      // (blob URLs taint the canvas in most browsers; data: URIs are same-origin safe)
      const svgToBase64 = (svgEl: SVGSVGElement, w: number, h: number): Promise<string> =>
        new Promise(resolve => {
          try {
            const serialized = new XMLSerializer().serializeToString(svgEl);
            // Use data URI instead of blob URL — avoids canvas cross-origin taint
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


      // 1. Convert all SVGs in the LIVE element to base64 PNGs BEFORE cloning
      //    (we need getBoundingClientRect which only works on mounted elements)
      const liveSvgs = Array.from(element.querySelectorAll('svg')) as SVGSVGElement[];
      const svgDataUrls: string[] = await Promise.all(
        liveSvgs.map(svg => {
          const rect = svg.getBoundingClientRect();
          const w = Math.round(rect.width) || 100;
          const h = Math.round(rect.height) || 100;
          return svgToBase64(svg, w, h);
        })
      );

      // 2. Clone the element so we never mutate the live DOM
      const clone = element.cloneNode(true) as HTMLElement;

      // 3. Replace SVG elements in the clone with <img> using the pre-rendered base64 PNGs
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

      // 4. Convert all <img> elements in clone to base64 via fetch (no canvas taint)
      const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(cloneImgs.map(async img => {
        if (img.src && !img.src.startsWith('data:')) {
          img.src = await urlToBase64(img.src);
        }
      }));

      // 5. Clean up input/textarea styling in clone for clean PDF output
      clone.querySelectorAll('input, textarea').forEach(el => {
        const e = el as HTMLElement;
        e.style.background = 'transparent';
        e.style.border = 'none';
        e.style.outline = 'none';
        e.style.boxShadow = 'none';
      });

      // 6. Inject CSS custom-property overrides into the clone to replace oklch() values.
      //    html2canvas uses an old color parser that throws on oklch().
      //    The certificate's own colors are all explicit hex/rgb — only the inherited
      //    :root custom properties from index.css use oklch. We neutralize them here.
      const oklchOverride = document.createElement('style');
      oklchOverride.textContent = `
        *, *::before, *::after {
          --background: #ffffff; --foreground: #000000;
          --card: #ffffff; --card-foreground: #000000;
          --popover: #ffffff; --popover-foreground: #000000;
          --primary: #1e5aa8; --primary-foreground: #ffffff;
          --secondary: #f1f5f9; --secondary-foreground: #1e293b;
          --muted: #f1f5f9; --muted-foreground: #64748b;
          --accent: #f1f5f9; --accent-foreground: #1e293b;
          --destructive: #dc2626; --destructive-foreground: #ffffff;
          --border: #e2e8f0; --input: #e2e8f0; --ring: #94a3b8;
          --chart-1: #e67e22; --chart-2: #2ecc71; --chart-3: #2c3e50;
          --chart-4: #f1c40f; --chart-5: #e74c3c;
          --sidebar: #1e293b; --sidebar-foreground: #f8fafc;
          --sidebar-primary: #3b82f6; --sidebar-primary-foreground: #ffffff;
          --sidebar-accent: #334155; --sidebar-accent-foreground: #f8fafc;
          --sidebar-border: #334155; --sidebar-ring: #64748b;
          --header-bg: #1e293b; --header-border: #334155;
        }
      `;
      clone.prepend(oklchOverride);

      // 7. Mount clone off-screen so html2canvas can measure it
      clone.style.position = 'fixed';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.zIndex = '-1';
      clone.style.width = '8.5in';
      document.body.appendChild(clone);


      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          logging: false,
          scrollY: 0,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      await html2pdf().from(clone).set(opt).save();

      document.body.removeChild(clone);
      setIsDownloading(false);
      triggerToast(`✅ Successfully downloaded ${filename}!`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-transparent">
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

      {/* Header Bar */}
      <div className="no-print flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
            Medical Certificates
          </h1>
        </div>

        <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50 w-full md:w-auto self-start md:self-auto">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'template' ? 'bg-white text-[#1E5AA8] shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <FileText size={15} /> Official Template
          </button>
          <button
            onClick={() => {
              syncToArchives();
              setActiveTab('archives');
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'archives' ? 'bg-white text-[#1E5AA8] shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <BookmarkCheck size={15} /> Archives
            <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full font-black ${activeTab === 'archives' ? 'bg-blue-100 text-[#1E5AA8]' : 'bg-gray-200 text-gray-500'}`}>
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
          <div className="no-print flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
            
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
                  className="w-full sm:w-56 appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Quick load patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <button
                onClick={() => setShowIssueCertModal(true)}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all"
              >
                <Edit2 size={14} /> Fill via Form
              </button>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${editMode ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
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
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-all"
              >
                <BookmarkCheck size={15} /> Save to Archives
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-black disabled:opacity-70 font-bold text-xs transition-all"
              >
                <Download size={15} className={isDownloading ? 'animate-bounce' : ''} />
                <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                style={{ background: PRIMARY }}
              >
                <Printer size={15} /> Print
              </button>
            </div>
          </div>

          {/* ===================================================================================== */}
          {/* THE OFFICIAL DOCUMENT SHEET (Exact Letter Paper Dimensions, Fonts, & Watermark) */}
          {/* ===================================================================================== */}
          <div className="overflow-x-auto w-full pb-8 hide-scrollbar">
            <div
              id="official-med-cert-page"
              className="font-official relative bg-white border-2 border-gray-300 shadow-2xl mx-auto px-16 py-16 text-black text-[16px] font-bold leading-relaxed overflow-hidden"
              style={{ width: '8.5in', minWidth: '8.5in', minHeight: '11in' }}
            >
            
            {/* Center Background Watermark (Exact placement and opacity matching PDF) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none mt-16">
              <img
                src={uaLogo}
                alt="University Seal Watermark"
                className="watermark-seal w-[750px] h-[750px] object-contain opacity-40 grayscale"
              />
            </div>

            {/* Document Content Layer */}
            <div className="relative z-10 space-y-10 font-official font-bold text-black">
              
              {/* TOP HEADER SECTION */}
              <div className="flex items-center justify-between gap-4 pb-2">
                {/* Far Left: University of the Assumption Seal */}
                <div className="w-28 flex-shrink-0 flex items-center justify-start">
                  <img src={uaSeal} alt="UA Seal" className="w-[90px] h-[90px] object-contain" />
                </div>

                {/* Center: University typography and PhilHealth YAKAP Logo banner */}
                <div className="flex-1 text-center space-y-0.5">
                  <div className="text-[25px] font-bold text-[#002060] font-official tracking-tight leading-none">
                    UNIVERSITY of the ASSUMPTION
                  </div>
                  
                  <PhilHealthYakapBanner />
                  
                  <div className="text-[14px] font-bold text-[#002060] font-official pt-1 tracking-tight">
                    Unisite Subdivision, Del Pilar, City of San Fernando, 2000 Pampanga, Philippines
                  </div>
                </div>

                {/* Far Right: Bagong Pilipinas Emblem & Legend */}
                <div className="w-28 flex-shrink-0 flex items-center justify-end">
                  <BagongPilipinasLogo />
                </div>
              </div>

              {/* DATE LINE (Right Aligned, exactly like PDF) */}
              <div className="flex justify-end pt-6 pr-2 font-official font-bold text-[16px] text-black">
                <div className="flex items-center">
                  <span>DATE:&nbsp;&nbsp;</span>
                  <input
                    type="text"
                    value={date}
                    readOnly={!editMode}
                    onChange={e => setDate(e.target.value)}
                    className="font-official font-bold text-[16px] text-black bg-transparent focus:outline-none focus:bg-amber-50/50 w-44 border-none"
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
                  <AutoResizeInput value={patientName} onChange={(e: any) => setPatientName(e.target.value)} readOnly={!editMode} />
                  <span>, </span>
                  <AutoResizeInput value={age} onChange={(e: any) => setAge(e.target.value)} readOnly={!editMode} />
                  <span> years old, </span>
                  <AutoResizeInput value={sex} onChange={(e: any) => setSex(e.target.value.toUpperCase())} readOnly={!editMode} />
                  <span>, a </span>
                  
                  {/* Superscript formatting for year level (e.g. 4th) */}
                  <span className="inline-flex items-baseline">
                    <AutoResizeInput value={yearLevel} onChange={(e: any) => setYearLevel(e.target.value)} readOnly={!editMode} />
                    <sup className="text-[12px] font-bold">
                      <AutoResizeInput value={yearSuffix} onChange={(e: any) => setYearSuffix(e.target.value)} readOnly={!editMode} />
                    </sup>
                  </span>
                  <span> </span>
                  
                  <AutoResizeInput value={courseAndSchool} onChange={(e: any) => setCourseAndSchool(e.target.value)} readOnly={!editMode} />
                  <span> has been seen and examined due to </span>
                  <AutoResizeInput value={examinedDueTo} onChange={(e: any) => setExaminedDueTo(e.target.value)} readOnly={!editMode} />
                  <span>.</span>
                </div>

                {/* Paragraph 2: Diagnosis */}
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="font-official font-bold text-[16.5px] whitespace-nowrap">Diagnosis:</span>
                  <div className="flex-1">
                    <AutoResizeInput value={diagnosis} onChange={(e: any) => setDiagnosis(e.target.value)} readOnly={!editMode} />
                  </div>
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
                  <div className="border-t-[1.5px] border-black pt-1 mb-1 w-full">
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
                        className={`w-28 text-right bg-transparent focus:outline-none font-official font-bold border-none ${editMode ? 'hover:bg-amber-50/50 focus:bg-amber-50/50' : ''}`}
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <span>PTR:</span>
                      <input
                        type="text"
                        value={ptrNo}
                        readOnly={!editMode}
                        onChange={e => setPtrNo(e.target.value)}
                        className={`w-28 text-right bg-transparent focus:outline-none font-official font-bold border-none ${editMode ? 'hover:bg-amber-50/50 focus:bg-amber-50/50' : ''}`}
                      />
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
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <BookmarkCheck size={20} className="text-[#1E5AA8]" />
              Clinic Records
            </h2>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Patient Filter */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserCheck size={14} />
                </div>
                <select
                  value={selectedPatientFilter}
                  onChange={e => setSelectedPatientFilter(e.target.value)}
                  className="w-full sm:w-48 appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] transition-all"
                >
                  <option value="">All Patients</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                </select>
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
                  className="w-full sm:w-36 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] transition-all"
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                onClick={handleCreateNew}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                style={{ background: PRIMARY }}
              >
                <Plus size={15} /> Issue New
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
                            setTimeout(() => handlePrint(), 200);
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
                      name: p ? p.name : f.name,
                      age: p ? String(p.age) : f.age,
                      gender: p?.sex ? p.sex.toUpperCase() : f.gender,
                      yearLevel: p?.yearLevel?.replace(/\D/g, '') || f.yearLevel,
                      courseOrDepartment: p?.course || p?.department || p?.position || f.courseOrDepartment,
                    }));
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
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

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
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
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: PRIMARY }}
              >
                <FileText size={14} /> ISSUE CERTIFICATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
