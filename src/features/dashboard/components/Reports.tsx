import { useState, useEffect } from 'react';
import { Printer, Download, FileText, Package, BedDouble, BarChart2, ClipboardList, Award, Calendar, Video } from 'lucide-react';
import { Patient, Consultation, MedicineItem, Bed, MedicalCertificate, PurchaseRequest } from '../types';
import { appointmentService, AppointmentRequest } from '@/services/appointmentService';
import { telemedicineService, TelemedicineRequest } from '@/services/telemedicineService';
import uaSeal from '@/assets/images/ua-seal.png';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const PRIMARY = '#1B3A6B';
const YELLOW = '#F4C542';
const RED = '#D64545';

// All canonical case categories (matching the uploaded template)
const ALL_CASES = [
  'Abdominal Pain/Stomachache', 'Accidents', 'Acute Gingivitis', 'Acute Resp. Tract Infection',
  'Allergy', 'Allergic Rhinitis', 'Anxiety', 'Asthma', 'Blister', 'Body weakness/malaise',
  'Body pain', 'Burns', 'Cat bite/scratch', 'Cellulitis', 'Chicken pox',
  'Chest pain/tightness/Palpitation', 'Colds', 'Contusion/bumps', 'Cough', 'Cyst',
  'Dengue Fever', 'Diarrhea/LBM', 'Dislocation/Fracture', 'Dizziness', 'Dyspepsia',
  'Dog bite/scratch', 'Dysmenorrhea', 'Difficulty of breathing', 'Ear pain',
  'Eye irritation/Sore eyes', 'Fainting', 'Fever', 'Furuncle/carbuncle/boils',
  'Gastritis/Hyperacidity/epigastric pain/heartburn', 'Headache', 'Heat stress',
  'Hypertension', 'Hypotension', 'Hyperventilation', 'Infected toenail',
  'Inflammation/swelling', 'Insect bites', 'Joint pain', 'Lack of sleep', 'Measles',
  'Migraine', 'Mouth sore', 'Mumps', 'Muscle pain', 'Nape pain', 'Nausea',
  'Nose bleeding (epistaxis)', 'Pain (upper and lower body)', 'Pain Right lower quadrant (T/C Appendicitis)',
  'Pruritus/skin irritation/skin condition', 'Rashes', 'Seizure', 'Sore throat',
  'Splinter', 'Sprain', 'Stiff neck', 'Tinnitus', 'Toothache', 'UTI (urinary tract infection)',
  'Vaccine site pain', 'Vertigo', 'Vomiting', 'Wounds (abrasion,laceration,puncture)',
  'Vision blurring', 'Lab works reading', 'Constipation', 'Hair loss', 'Hypoglycemia', 'Indigestion', 'Lethargic', 'Fracture', 'Sinusitis'
];

// 32 Standard Supplies matching the uploaded May-26 Supplies Inventory template
const SUPPLIES_LIST = [
  { no: 1, name: 'Adhesive steristrips packs 1/2"x4"', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 2, name: 'Absorbent cotton in balls/pack', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 3, name: 'Arm sling orthopedic small', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 4, name: 'Arm sling orthopedic medium', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 5, name: 'Arm sling orthopedic large', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 6, name: 'Arm sling orthopedic x-large', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 7, name: 'Band-Aid 50 strips/box', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 8, name: 'Betadine 10% solution 120mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 9, name: 'Betadine gargle 1% oral antiseptic', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 10, name: 'Bactidol gargle 0.1% solution', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 11, name: 'Disposable syringe with needle 3mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 12, name: 'Disposable syringe with needle 5mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 13, name: 'Disposable syringe with needle 1mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 14, name: 'Efficascent oil ES 100mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 15, name: 'Efficascent oil regular 100mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 16, name: 'Elasctic bandage 2"', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 17, name: 'Elasctic bandage 3"', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 18, name: 'Elasctic bandage 4"', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 19, name: 'Individually packed OS 2x2', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 20, name: 'Individually packed OS 4x4', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 21, name: 'Micropore plaster 1 inch', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 22, name: 'Nebulizing kit ADULT', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 23, name: 'Nebulizing kit PEDIA', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 24, name: 'Non-Rebreathing Mask Adult', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 25, name: 'NSS 1L for irrigation', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 26, name: 'Omega pain killer', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 27, name: 'Oxygen cannula/mask ADULT', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 28, name: 'Oxygen cannula PEDIA', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 29, name: 'Salonpas 10pcs/pack x2', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 30, name: 'Tongue depressors', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 31, name: 'ALCOHOL GREENCROSS', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 32, name: 'KN95 MASK 50 PCS/BOX', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
];

// Medicines Inventory matching exact May-26 Excel spreadsheet screenshot
const MEDICINE_INVENTORY_TEMPLATE = [
  { no: 1, name: 'Allerta 10mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 2, name: 'Allerkid 60mL bottle', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 3, name: 'Alnix 10mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 4, name: 'Aspilets-EC 80mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 5, name: 'Benadryl 25mg', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 6, name: 'Benadryl 50mg', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 7, name: 'Benadryl 60mL bottle', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 8, name: 'Bioflu tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 9, name: 'Biogesic 500mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 10, name: 'Budecort respules 250mcg/mL', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 11, name: 'Buscopan 10mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 12, name: 'Buscopan Plus', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 13, name: 'Calmoseptine ointment', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 14, name: 'Catapres 75mcg', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 15, name: 'Celecoxib 200mg capsule', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 16, name: 'Dolcet 37.5mg/325mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 17, name: 'Dolfenal 500mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 18, name: 'Duavent nebules', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 19, name: 'Erceflora Niblet', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 20, name: 'Erythromycin ointment tubes', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 21, name: 'Flotera chewable', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 22, name: 'Gaviscon sachet', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 23, name: 'Gaviscon tablet', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: 'NO STOCK' },
  { no: 24, name: 'Hidrasec 30mg granules', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 25, name: 'Hydrite sachet', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 26, name: 'Hypromellose 3mg/mL drops', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 27, name: 'Imodium 2mg cap', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 28, name: 'Isordil SL 5mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: 'NO STOCK' },
  { no: 29, name: 'Kramil-S chewable pink', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 30, name: 'Kramil-S ADVANCE', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 31, name: 'Motilium 10mg', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 32, name: 'Nafarin A', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 33, name: 'Norvasc 10mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 34, name: 'Omeprazole 20mg cap', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 35, name: 'Omeprazole 40mg cap', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 36, name: 'Panto Plus cap', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 37, name: 'Paracetamol syrup', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 38, name: 'Plavix 75mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 39, name: 'Ranitidine 150mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 40, name: 'Serc 16mg cap', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 41, name: 'Sinupret tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 42, name: 'Strepsils lozenges (8xpack)', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' },
  { no: 43, name: 'Ventolin nebules', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: '' }
];

type ReportFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ReportType = 'daily' | 'cases' | 'medcert' | 'nonconsult' | 'inventory' | 'bed' | 'appointments' | 'telemedicine';

const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
const yesterdayDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const YESTERDAY = yesterdayDate.toLocaleDateString('en-CA');

function normalizeDateStr(d?: string): string {
  if (!d) return '';
  const trimmed = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  }
  return trimmed;
}

function matchesFilter(rawDate: string, filter: ReportFilter, customFrom: string, customTo: string, selectedMonthYear?: string): boolean {
  if (filter === 'all') return true;
  const date = normalizeDateStr(rawDate);
  if (!date) return true;
  if (filter === 'today') return date === TODAY;
  if (filter === 'yesterday') return date === YESTERDAY;
  if (filter === 'week') {
    const d = new Date(date); const t = new Date(TODAY);
    const diff = (t.getTime() - d.getTime()) / 86400000;
    return diff >= 0 && diff < 7;
  }
  if (filter === 'month') {
    if (selectedMonthYear && date.slice(0, 7) === selectedMonthYear) return true;
    return date.slice(0, 7) === TODAY.slice(0, 7);
  }
  if (filter === 'custom' && customFrom && customTo) return date >= customFrom && date <= customTo;
  return true;
}

function getDaysInFilter(filter: ReportFilter, customFrom: string, customTo: string): string[] {
  const days: string[] = [];
  if (filter === 'today') return [TODAY];
  if (filter === 'yesterday') return [YESTERDAY];
  if (filter === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(TODAY); d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-CA'));
    }
    return days;
  }
  if (filter === 'month') {
    const [y, m] = TODAY.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      days.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }
  if (filter === 'custom' && customFrom && customTo) {
    let cur = new Date(customFrom);
    while (cur.toLocaleDateString('en-CA') <= customTo) {
      days.push(cur.toLocaleDateString('en-CA')); cur.setDate(cur.getDate() + 1);
    }
    return days;
  }
  return [TODAY];
}

const filterLabel = (f: ReportFilter) => {
  const now = new Date();
  
  if (f === 'all') {
    return 'All Records';
  }
  
  if (f === 'today') {
    return `Today, ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}`;
  }
  
  if (f === 'yesterday') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return `Yesterday, ${yest.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}`;
  }
  
  if (f === 'week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 6);
    return `${lastWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}`;
  }
  
  if (f === 'month') {
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' });
  }
  
  return 'Custom Range';
};

interface ReportsProps {
  patients: Patient[];
  consultations: Consultation[];
  medicines: MedicineItem[];
  beds: Bed[];
  medicalCerts: MedicalCertificate[];
  purchaseRequests: PurchaseRequest[];
  appointmentRequests?: AppointmentRequest[];
  telemedicineRequests?: TelemedicineRequest[];
}


export function Reports({ patients, consultations, medicines, beds, medicalCerts, purchaseRequests, appointmentRequests, telemedicineRequests }: ReportsProps) {
  const [filter, setFilter] = useState<ReportFilter>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [casesTab, setCasesTab] = useState<'student' | 'personnel'>('student');
  const [inventoryTab, setInventoryTab] = useState<'medicines' | 'supplies'>('medicines');
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', timeZone: 'Asia/Manila' }).toUpperCase();
  const currentYear = new Date().toLocaleString('en-US', { year: 'numeric', timeZone: 'Asia/Manila' });
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportYear, setReportYear] = useState(currentYear);

  const [appRequests, setAppRequests] = useState<AppointmentRequest[]>(appointmentRequests || []);
  const [teleRequests, setTeleRequests] = useState<TelemedicineRequest[]>(telemedicineRequests || []);

  useEffect(() => {
    appointmentService.getRequests().then(d => { if (d) setAppRequests(d); }).catch(console.error);
    telemedicineService.getRequests().then(d => { if (d) setTeleRequests(d); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (appointmentRequests) setAppRequests(appointmentRequests);
  }, [appointmentRequests]);

  useEffect(() => {
    if (telemedicineRequests) setTeleRequests(telemedicineRequests);
  }, [telemedicineRequests]);

  const monthMap: Record<string, string> = {
    'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04', 'MAY': '05', 'JUNE': '06',
    'JULY': '07', 'AUGUST': '08', 'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
  };
  const monthNum = monthMap[reportMonth] || '06';
  const selectedMonthYear = `${reportYear}-${monthNum}`;

  const filteredCons = consultations.filter(c => matchesFilter(c.date, filter, customFrom, customTo, selectedMonthYear));
  const filteredCerts = medicalCerts.filter(c => matchesFilter(c.date, filter, customFrom, customTo, selectedMonthYear));

  const acceptedAppointments = appRequests.filter(req => {
    const isAccepted = req.status === 'Approved' || req.status === 'Completed';
    if (!isAccepted) return false;
    const dateStr = req.scheduled_date || req.preferred_date || (req.created_at ? req.created_at.slice(0, 10) : '');
    return matchesFilter(dateStr, filter, customFrom, customTo, selectedMonthYear);
  });

  const acceptedTelemedicine = teleRequests.filter(req => {
    const isAccepted = req.status === 'Approved' || req.status === 'Completed';
    if (!isAccepted) return false;
    const dateStr = req.scheduled_date || req.preferred_date || (req.created_at ? req.created_at.slice(0, 10) : '');
    return matchesFilter(dateStr, filter, customFrom, customTo, selectedMonthYear);
  });
  const days = getDaysInFilter(filter, customFrom, customTo);

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const pat = (c: Consultation) => getPatient(c.patientId);

  const casesConsForMonth = consultations.filter(c => c.date.startsWith(`${reportYear}-${monthNum}`));

  // Case count per category
  const caseCount = (cat: string, category: 'Student' | 'Personnel') => {
    return casesConsForMonth.filter(c => {
      const p = getPatient(c.patientId);
      const hasCat = (c.categories || []).some(catName => catName.toLowerCase() === cat.toLowerCase());
      if (category === 'Student') return p?.category === 'Student' && hasCat;
      return (p?.category === 'Employee' || p?.category === 'Outsider') && hasCat;
    }).length;
  };

  const daysInMonth = new Date(parseInt(reportYear), parseInt(monthNum), 0).getDate();
  const dailyReportsData = activeReport === 'daily' ? Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = `${reportYear}-${monthNum}-${String(day).padStart(2, '0')}`;
    const consForDay = consultations.filter(c => c.date === dayStr);

    let col = 0, shs = 0, jhs = 0, gs = 0, emp = 0, vis = 0;
    let cons = 0, home = 0, hosp = 0, pre = 0;

    consForDay.forEach(c => {
      const p = getPatient(c.patientId);
      if (p) {
        if (p.category === 'Student') {
          if (p.studentCategory === 'College') col++;
          else if (p.studentCategory === 'Senior High School') shs++;
          else if (p.studentCategory === 'Junior High School') jhs++;
          else if (p.studentCategory === 'Elementary') gs++;
        } else if (p.category === 'Employee') {
          emp++;
        } else if (p.category === 'Outsider') {
          vis++;
        }
      }

      if (c.status === 'Consultation') cons++;
      if (c.earlyDismissal && c.dismissalDestination === 'Sent Home') home++;
      if ((c.earlyDismissal && c.dismissalDestination === 'Sent to Hospital') || c.transferred) hosp++;
      
      const purpose = (c.purposeOfVisit || c.complaint || '').toLowerCase();
      if (purpose.includes('pre-employment') || purpose.includes('pre employment')) pre++;
    });

    const total = col + shs + jhs + gs + emp + vis;
    return { day, col, shs, jhs, gs, emp, vis, total, cons, home, hosp, pre };
  }) : [];

  const totals = dailyReportsData.reduce((acc, curr) => {
    acc.col += curr.col;
    acc.shs += curr.shs;
    acc.jhs += curr.jhs;
    acc.gs += curr.gs;
    acc.emp += curr.emp;
    acc.vis += curr.vis;
    acc.total += curr.total;
    acc.cons += curr.cons;
    acc.home += curr.home;
    acc.hosp += curr.hosp;
    acc.pre += curr.pre;
    return acc;
  }, { col: 0, shs: 0, jhs: 0, gs: 0, emp: 0, vis: 0, total: 0, cons: 0, home: 0, hosp: 0, pre: 0 });

  const reportTypes = [
    { id: 'daily'        as ReportType, label: 'Daily Report',              icon: <FileText size={15} /> },
    { id: 'cases'        as ReportType, label: 'Cases Attended',            icon: <BarChart2 size={15} /> },
    { id: 'medcert'      as ReportType, label: 'Medical Certificate',       icon: <Award size={15} /> },
    { id: 'nonconsult'   as ReportType, label: 'Non-Consultation',        icon: <ClipboardList size={15} /> },
    { id: 'inventory'   as ReportType, label: 'Inventory / Medicine',     icon: <Package size={15} /> },
    { id: 'bed'         as ReportType, label: 'Bed Management',            icon: <BedDouble size={15} /> },
    { id: 'appointments' as ReportType, label: 'Appointments Report',       icon: <Calendar size={15} /> },
    { id: 'telemedicine'  as ReportType, label: 'Telemedicine Report',       icon: <Video size={15} /> },
  ];

  const renderConsumptionCells = (cArray: number[], isNoStock: boolean = false) => {
    const blocks: JSX.Element[] = [];
    const intervals = [
      { start: 0, end: 5 }, { start: 5, end: 10 }, { start: 10, end: 15 }, 
      { start: 15, end: 20 }, { start: 20, end: 25 }, { start: 25, end: 31 }
    ];

    intervals.forEach((int, idx) => {
      let subTotal = 0;
      for (let i = int.start; i < int.end; i++) {
        const val = cArray[i] || 0;
        subTotal += val;
        blocks.push(
          <td key={`cell-${i}`} style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#FFFFFF' }} className="border border-black px-1 py-1 text-center font-bold text-[11px] text-gray-900 min-w-[20px]">
            {val > 0 ? val : ''}
          </td>
        );
      }
      blocks.push(
        <td key={`subtot-${idx}`} style={{ backgroundColor: isNoStock ? '#EA9999' : '#E36C09' }} className={`border border-black px-1.5 py-1 text-center font-extrabold text-[11px] ${isNoStock ? 'text-black' : 'text-white'} font-mono min-w-[28px]`}>
          {subTotal > 0 ? subTotal : 0}
        </td>
      );
    });
    return blocks;
  };

  const handleExportPDF = () => {
    // Use the browser's built-in print-to-PDF — html2canvas freezes on large tables.
    // The print CSS already hides everything except the report container.
    setIsPdfExporting(true);
    setTimeout(() => {
      window.print();
      setIsPdfExporting(false);
    }, 150);
  };

  const handleExportExcel = async (title: string) => {
    const container = document.getElementById("report-export-area");
    if (!container) return;

    const table = container.querySelector('table');
    if (!table) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Parse table rows and cells
    const rows = Array.from(table.rows);
    rows.forEach((row, rowIndex) => {
      const excelRow = worksheet.getRow(rowIndex + 1);
      let colOffset = 0;

      Array.from(row.cells).forEach((cell) => {
        // Find the first empty column
        while (excelRow.getCell(colOffset + 1).value !== null) {
          colOffset++;
        }

        const excelCell = excelRow.getCell(colOffset + 1);
        
        // Strip HTML and clean text
        excelCell.value = cell.innerText.replace(/\n/g, ' ').trim();
        
        // Alignment
        excelCell.alignment = { 
          vertical: 'middle', 
          horizontal: cell.classList.contains('text-left') ? 'left' : 'center',
          wrapText: true
        };

        // Borders
        excelCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Font
        excelCell.font = {
          name: 'Calibri',
          size: 9,
          bold: cell.tagName === 'TH' || cell.classList.contains('font-bold') || cell.classList.contains('font-black') || cell.classList.contains('font-extrabold')
        };
        if (cell.classList.contains('text-white') || cell.style.color === 'white') {
          excelCell.font.color = { argb: 'FFFFFFFF' };
        }

        // Background Color
        let bgColor = '';
        const bgStyle = cell.style.backgroundColor;
        const classes = cell.className;

        if (bgStyle.includes('rgb(255, 255, 0)') || classes.includes('bg-[#FFFF00]') || bgStyle === '#FFFF00') bgColor = 'FFFFFF00';
        else if (bgStyle.includes('rgb(118, 146, 60)') || classes.includes('bg-[#76923C]') || bgStyle === '#76923C') bgColor = 'FF76923C';
        else if (bgStyle.includes('rgb(227, 108, 9)') || classes.includes('bg-[#E36C09]') || bgStyle === '#E36C09') bgColor = 'FFE36C09';
        else if (bgStyle.includes('rgb(49, 133, 155)') || classes.includes('bg-[#31859B]') || bgStyle === '#31859B') bgColor = 'FF31859B';
        else if (bgStyle.includes('rgb(147, 137, 83)') || classes.includes('bg-[#938953]') || bgStyle === '#938953') bgColor = 'FF938953';
        else if (bgStyle.includes('rgb(234, 153, 153)') || classes.includes('bg-[#EA9999]') || bgStyle === '#EA9999') bgColor = 'FFEA9999';
        else if (bgStyle.includes('rgb(184, 204, 228)') || classes.includes('bg-[#B8CCE4]') || bgStyle === '#B8CCE4') bgColor = 'FFB8CCE4';
        else if (bgStyle.includes('rgb(255, 230, 153)') || classes.includes('bg-[#FFE699]') || bgStyle === '#FFE699') bgColor = 'FFFFE699';
        else if (bgStyle.includes('rgb(198, 224, 180)') || classes.includes('bg-[#C6E0B4]') || bgStyle === '#C6E0B4') bgColor = 'FFC6E0B4';
        else if (bgStyle.includes('rgb(169, 209, 142)') || classes.includes('bg-[#A9D18E]') || bgStyle === '#A9D18E') bgColor = 'FFA9D18E';

        if (bgColor) {
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
        }

        // Handle Merged Cells
        const rowSpan = cell.rowSpan || 1;
        const colSpan = cell.colSpan || 1;
        if (rowSpan > 1 || colSpan > 1) {
          worksheet.mergeCells(rowIndex + 1, colOffset + 1, rowIndex + rowSpan, colOffset + colSpan);
        }

        colOffset += colSpan;
      });
    });

    // Auto-adjust column widths
    worksheet.columns.forEach(column => {
      column.width = 12;
    });
    if (worksheet.columns[1]) worksheet.columns[1].width = 40; 

    const buffer = await workbook.xlsx.writeBuffer();
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    saveAs(new Blob([buffer]), `${cleanTitle}_${new Date().toLocaleDateString('en-CA')}.xlsx`);
  };

  const exportDailyReportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daily Report');

    // Row 1: Title
    const titleRow = worksheet.addRow([`DAILY REPORT ${reportMonth} ${reportYear}`]);
    worksheet.mergeCells('A1:L1');
    const titleCell = titleRow.getCell(1);
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } };
    titleCell.font = { name: 'Calibri', size: 11, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Set borders for all merged cells in row 1
    for (let i = 1; i <= 12; i++) {
        worksheet.getCell(1, i).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    }
    
    // Row 2: Headers
    const headers = ['DATE', 'COLLEGE', 'SHS', 'JHS', 'GS', 'EMPLOYEE', 'TOTAL', 'CONSULTATION', 'SENT HOME', 'SENT TO HOSPITAL', 'PRE- EMPLOYMENT', 'VISITOR'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Bright yellow
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data Rows
    dailyReportsData.forEach(data => {
      const dateStr = `${data.day}-${reportMonth.slice(0, 3)}-${reportYear.slice(-2)}`;
      const row = worksheet.addRow([
        dateStr,
        data.col || '',
        data.shs || '',
        data.jhs || '',
        data.gs || '',
        data.emp || '',
        data.total, // always show 0
        data.cons || '',
        data.home || '',
        data.hosp || '',
        data.pre || '',
        data.vis || ''
      ]);
      row.eachCell((cell, colNumber) => {
        if (colNumber === 7) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // slight yellow
        }
        cell.font = { name: 'Calibri', size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Footer Row
    const footerRow = worksheet.addRow([
      'TOTAL',
      totals.col,
      totals.shs,
      totals.jhs,
      totals.gs,
      totals.emp,
      totals.total,
      totals.cons,
      totals.home,
      totals.hosp,
      totals.pre,
      totals.vis
    ]);
    footerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } }; // Pale orange/yellow
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Column Widths
    worksheet.columns = [
      { width: 13 }, // DATE
      { width: 9 },  // COLLEGE
      { width: 6 },  // SHS
      { width: 6 },  // JHS
      { width: 6 },  // GS
      { width: 11 }, // EMPLOYEE
      { width: 8 },  // TOTAL
      { width: 16 }, // CONSULTATION
      { width: 14 }, // SENT HOME
      { width: 18 }, // SENT TO HOSPITAL
      { width: 18 }, // PRE- EMPLOYMENT
      { width: 10 }  // VISITOR
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `daily_report_${reportMonth.toLowerCase()}_${reportYear}.xlsx`);
  };

  const exportCasesAttendedExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cases Attended');

    // Title Rows
    worksheet.mergeCells('A1:D1');
    worksheet.mergeCells('A2:D2');
    worksheet.mergeCells('A3:D3');
    
    const r1 = worksheet.getCell('A1');
    r1.value = 'UNIVERSITY OF THE ASSUMPTION';
    const r2 = worksheet.getCell('A2');
    r2.value = 'COLLEGE MEDICAL CLINIC';
    const r3 = worksheet.getCell('A3');
    r3.value = `CASES ATTENDED SY: 2025-2026      (STUDENTS & PERSONNEL) MONTH: ${reportMonth.toUpperCase()} YEAR: ${reportYear}`;

    [1, 2, 3].forEach(rowNum => {
      for (let col = 1; col <= 4; col++) {
        const cell = worksheet.getCell(rowNum, col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }; // Light green
        cell.font = { name: 'Calibri', size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        let borders: any = {};
        if (rowNum === 1) borders.top = { style: 'thin' };
        if (rowNum === 3) borders.bottom = { style: 'thin' };
        if (col === 1) borders.left = { style: 'thin' };
        if (col === 4) borders.right = { style: 'thin' };
        cell.border = borders;
      }
    });

    // Header Row
    const headerRow = worksheet.addRow(['CASES/COMPLAINS', 'STUDENT', 'PERSONNEL', 'TOTAL']);
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber === 4 ? 'FFFFC000' : 'FFFFE699' } };
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data Rows
    ALL_CASES.forEach((c) => {
      if (c === 'Vision blurring') {
        const othersRow = worksheet.addRow(['Others:', '', '', '']);
        othersRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 11 };
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      }
      const stu = caseCount(c, 'Student');
      const emp = caseCount(c, 'Personnel');
      const total = stu + emp;
      
      const row = worksheet.addRow([
        c,
        stu || '',
        emp || '',
        total // always show 0 in Excel for total? I'll just show the number if it's 0 or not, actually let's just do total
      ]);
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Footer Row
    const totalStu = ALL_CASES.reduce((sum, c) => sum + caseCount(c, 'Student'), 0);
    const totalEmp = ALL_CASES.reduce((sum, c) => sum + caseCount(c, 'Personnel'), 0);
    const totalSum = totalStu + totalEmp;
    
    const footerRow = worksheet.addRow(['TOTAL CASES ATTENDED', totalStu || '', totalEmp || '', totalSum]);
    footerRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber === 4 ? 'FFA9D18E' : 'FFC6E0B4' } }; 
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Column Widths
    worksheet.getColumn(1).width = 45; // CASES/COMPLAINS
    worksheet.getColumn(2).width = 12; // STUDENT
    worksheet.getColumn(3).width = 14; // PERSONNEL
    worksheet.getColumn(4).width = 12; // TOTAL

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `cases_attended_${reportMonth.toLowerCase()}_${reportYear}.xlsx`);
  };

  const exportInventoryExcel = async (tab: 'medicines' | 'supplies') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tab === 'medicines' ? 'Medicine Inventory' : 'Supplies Inventory');
    const isMed = tab === 'medicines';
    const numCols = isMed ? 43 : 42;

    // Row 1: Title (White background matching web view)
    worksheet.mergeCells(1, 1, 1, numCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC';
    titleCell.font = { name: 'Calibri', size: 14, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).height = 30;

    // Row 2: Inclusive Dates (Matching web view)
    worksheet.mergeCells(2, 1, 2, 8);
    const subtitleCell = worksheet.getCell(2, 1);
    subtitleCell.value = `Monthly Inventory of ${isMed ? 'Medicines' : 'Supplies'} (Inclusive Dates):`;
    subtitleCell.font = { name: 'Calibri', size: 11, bold: true };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    worksheet.mergeCells(2, 9, 2, 16);
    const dateCell = worksheet.getCell(2, 9);
    dateCell.value = `${reportMonth} ${reportYear}`;
    dateCell.font = { name: 'Calibri', size: 11, bold: true, underline: true };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    worksheet.mergeCells(2, 17, 2, numCols);
    const blankHeaderRest = worksheet.getCell(2, 17);
    blankHeaderRest.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    worksheet.getRow(2).height = 24;

    // Row 3: Blank separator row (Matching web view)
    worksheet.mergeCells(3, 1, 3, numCols);
    const row3Cell = worksheet.getCell(3, 1);
    row3Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    worksheet.getRow(3).height = 12;

    // Row 4 & 5: Table Column Headers (Matching web view colors and typography)
    // No. (Yellow #FFFF00)
    worksheet.mergeCells(4, 1, 5, 1);
    const hNo = worksheet.getCell(4, 1);
    hNo.value = 'No.';
    hNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    hNo.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    hNo.alignment = { vertical: 'middle', horizontal: 'center' };

    // Medicine / Supplies (Yellow #FFFF00)
    worksheet.mergeCells(4, 2, 5, 2);
    const hName = worksheet.getCell(4, 2);
    hName.value = isMed ? 'Medicine' : 'Supplies';
    hName.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    hName.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    hName.alignment = { vertical: 'middle', horizontal: 'left' };

    // Beg. Inv. (Olive Green #76923C, White bold text)
    worksheet.mergeCells(4, 3, 5, 3);
    const hBeg = worksheet.getCell(4, 3);
    hBeg.value = 'Beg.\nInv.';
    hBeg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF76923C' } };
    hBeg.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    hBeg.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    // Consumption/s (Days 1 - 31) (White background, Black bold text, span cols 4 to 40)
    worksheet.mergeCells(4, 4, 4, 40);
    const hCons = worksheet.getCell(4, 4);
    hCons.value = 'Consumption/s (Days 1 - 31)';
    hCons.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    hCons.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    hCons.alignment = { vertical: 'middle', horizontal: 'center' };

    // End. Inv. (Olive Green #76923C, White bold text)
    worksheet.mergeCells(4, 41, 5, 41);
    const hEnd = worksheet.getCell(4, 41);
    hEnd.value = 'End.\nInv.';
    hEnd.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF76923C' } };
    hEnd.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    hEnd.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    // Sum Total Consumption (Teal #31859B, White bold text)
    worksheet.mergeCells(4, 42, 5, 42);
    const hSum = worksheet.getCell(4, 42);
    hSum.value = 'Sum Total\nConsumption';
    hSum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF31859B' } };
    hSum.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    hSum.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    if (isMed) {
      // EXPIRATION (Brown #938953, White bold text)
      worksheet.mergeCells(4, 43, 5, 43);
      const hExp = worksheet.getCell(4, 43);
      hExp.value = 'EXPIRATION';
      hExp.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF938953' } };
      hExp.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      hExp.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    worksheet.getRow(4).height = 24;
    worksheet.getRow(5).height = 20;

    // Row 5 for Consumption subheader days & totals (Matching web view)
    const intervals = [
      { start: 1, end: 5 }, { start: 6, end: 10 }, { start: 11, end: 15 }, 
      { start: 16, end: 20 }, { start: 21, end: 25 }, { start: 26, end: 31 }
    ];
    let colOffset = 4;
    intervals.forEach(int => {
      for (let i = int.start; i <= int.end; i++) {
        const c = worksheet.getCell(5, colOffset++);
        c.value = i;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      const t = worksheet.getCell(5, colOffset++);
      t.value = 'Total';
      t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE36C09' } };
      t.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      t.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Apply borders to header cells
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= numCols; c++) {
        const cell = worksheet.getCell(r, c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }

    // Data Rows (Matching web view exact logic and colors)
    const dataList = isMed ? MEDICINE_INVENTORY_TEMPLATE : SUPPLIES_LIST;
    dataList.forEach((item: any) => {
      const row = worksheet.addRow([]);
      row.height = 20;

      const actualItem = medicines.find(m => m.name.toLowerCase().includes(item.name.split(' ')[0].toLowerCase()));
      const isNoStock = isMed
        ? (actualItem ? actualItem.stock <= 0 : item.status === 'NO STOCK')
        : (actualItem ? actualItem.stock <= 0 : false);
      const statusText = isNoStock ? 'NO STOCK' : '';

      // 1. No.
      const cNo = row.getCell(1);
      cNo.value = item.no;
      cNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFEA9999' : 'FFFFFF00' } };
      cNo.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
      cNo.alignment = { vertical: 'middle', horizontal: 'center' };

      // 2. Name
      const cName = row.getCell(2);
      cName.value = item.name;
      cName.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFEA9999' : 'FFFFFF00' } };
      cName.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
      cName.alignment = { vertical: 'middle', horizontal: 'left' };

      // 3. Beg. Inv.
      const cBeg = row.getCell(3);
      cBeg.value = item.beg;
      cBeg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFF2DCDB' : 'FF76923C' } };
      cBeg.font = { name: 'Calibri', size: 10, bold: true, color: { argb: isNoStock ? 'FF000000' : 'FFFFFFFF' } };
      cBeg.alignment = { vertical: 'middle', horizontal: 'center' };

      // 4-40. Consumption Days and Subtotals
      let colIdx = 4;
      const cArray = isMed ? item.c : item.consumed;

      intervals.forEach(int => {
        let subTotal = 0;
        for (let i = int.start - 1; i < int.end; i++) {
          const val = cArray[i] || 0;
          subTotal += val;
          const cData = row.getCell(colIdx++);
          cData.value = val > 0 ? val : '';
          cData.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFF2DCDB' : 'FFFFFFFF' } };
          cData.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          cData.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        const cSub = row.getCell(colIdx++);
        cSub.value = subTotal > 0 ? subTotal : 0;
        cSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFEA9999' : 'FFE36C09' } };
        cSub.font = { name: 'Calibri', size: 10, bold: true, color: { argb: isNoStock ? 'FF000000' : 'FFFFFFFF' } };
        cSub.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // 41. End. Inv.
      const cEnd = row.getCell(colIdx++);
      cEnd.value = item.end;
      cEnd.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFF2DCDB' : 'FF76923C' } };
      cEnd.font = { name: 'Calibri', size: 10, bold: true, color: { argb: isNoStock ? 'FF000000' : 'FFFFFFFF' } };
      cEnd.alignment = { vertical: 'middle', horizontal: 'center' };

      // 42. Sum Total Consumption
      const cSum = row.getCell(colIdx++);
      cSum.value = item.total;
      cSum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFF2DCDB' : 'FF31859B' } };
      cSum.font = { name: 'Calibri', size: 10, bold: true, color: { argb: isNoStock ? 'FF000000' : 'FFFFFFFF' } };
      cSum.alignment = { vertical: 'middle', horizontal: 'center' };

      // 43. EXPIRATION (if med)
      if (isMed) {
        const cExp = row.getCell(colIdx++);
        cExp.value = statusText;
        cExp.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNoStock ? 'FFEA9999' : 'FFFFFFFF' } };
        cExp.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        cExp.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Borders for all cells in row
      for (let c = 1; c <= numCols; c++) {
        row.getCell(c).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Column Widths (matching web proportions)
    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(2).width = 32;
    worksheet.getColumn(3).width = 10;
    for (let c = 4; c <= 40; c++) {
      const isSubtotalCol = [9, 15, 21, 27, 33, 40].includes(c);
      worksheet.getColumn(c).width = isSubtotalCol ? 7 : 4.5;
    }
    worksheet.getColumn(41).width = 10;
    worksheet.getColumn(42).width = 14;
    if (isMed) worksheet.getColumn(43).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `inventory_${tab}_${reportMonth.toLowerCase()}_${reportYear}.xlsx`);
  };

  const PrintBar = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 print-bar-ui" style={{ background: '#f8fafd' }}>
      <div className="flex items-center gap-2">
        <img src={uaSeal} alt="UA" className="w-7 h-7 object-contain opacity-70" />
        <div>
          <div className="text-xs font-bold text-gray-700">{title}</div>
          <div className="text-[10px] text-gray-400">University of the Assumption — Medical Clinic • {filterLabel(filter)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
          <Printer size={12} /> Print
        </button>
        <button onClick={() => handleExportPDF()}
          disabled={isPdfExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
          style={{ background: PRIMARY }}>
          <Download size={12} /> {isPdfExporting ? 'Opening...' : 'Export PDF'}
        </button>
        <button onClick={() => {
            if (activeReport === 'daily') exportDailyReportExcel();
            else if (activeReport === 'cases') exportCasesAttendedExcel();
            else if (activeReport === 'inventory') exportInventoryExcel(inventoryTab);
            else handleExportExcel(title);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer"
          style={{ background: '#2E7D32' }}>
          <Download size={12} /> Export Excel
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <style>{`
        /* Professional Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
          margin: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-report-container, .print-report-container * {
            visibility: visible !important;
          }
          .print-report-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          .print-bar-ui, .no-export {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 10mm;
          }
        }
      `}</style>
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Reports Dashboard</h1>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-4 flex-wrap w-full lg:w-auto mt-4 lg:mt-0">
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Report Type</label>
            <select value={activeReport} onChange={e => setActiveReport(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-[#1B3A6B] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] min-w-[220px] cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm">
              {reportTypes.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <div className="w-px h-10 bg-gray-200 hidden sm:block mx-1"></div>

          {['daily', 'cases', 'inventory'].includes(activeReport) ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Report Month</label>
                <select value={reportMonth} onChange={e => setReportMonth(e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-[#1B3A6B] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] w-36 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm">
                  {Object.keys(monthMap).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Report Year</label>
                <input type="number" value={reportYear} onChange={e => setReportYear(e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-[#1B3A6B] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] w-28 bg-gray-50 hover:bg-gray-100 transition-colors text-center shadow-sm" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date Range Filter</label>
               <div className="flex flex-wrap gap-1.5 bg-gray-100/80 border border-gray-200 rounded-lg p-1.5 w-full sm:w-auto shadow-sm">
                 {(['all', 'today', 'yesterday', 'week', 'month', 'custom'] as ReportFilter[]).map(f => (
                   <button key={f} onClick={() => setFilter(f)}
                     className="flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize whitespace-nowrap min-w-[70px] text-center"
                     style={{ background: filter === f ? 'white' : 'transparent', color: filter === f ? PRIMARY : '#6b7280', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                     {f === 'all' ? 'All' : f === 'custom' ? 'Custom' : f.charAt(0).toUpperCase() + f.slice(1)}
                   </button>
                 ))}
               </div>
            </div>
          )}
          
          {filter === 'custom' && !['daily', 'cases', 'inventory'].includes(activeReport) && (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto self-end mb-1">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#1B3A6B] bg-gray-50 shadow-sm" />
              <span className="text-gray-400 text-xs font-bold px-1">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#1B3A6B] bg-gray-50 shadow-sm" />
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        {/* Report content workspace */}
        <div id="report-export-area" className="w-full bg-white rounded-xl overflow-hidden print-report-container" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>

          {/* ── 1. DAILY REPORT (Updated ONLY to exact attached PDF template layout) ── */}
          {activeReport === 'daily' && (
            <div>
              <PrintBar title={`DAILY REPORT — ${reportMonth} ${reportYear}`} />
              <div className="p-5 overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse border-2 border-black font-sans text-xs" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th colSpan={12} className="bg-[#B8CCE4] text-black font-extrabold text-base text-center py-2 uppercase border-2 border-black">
                        DAILY REPORT {reportMonth} {reportYear}
                      </th>
                    </tr>
                    <tr className="bg-[#FFE699] text-black font-black uppercase text-center border-2 border-black text-[11px]">
                      <th className="border-2 border-black py-1.5 px-2 w-24">DATE</th>
                      <th className="border border-black py-1.5 px-2">COLLEGE</th>
                      <th className="border border-black py-1.5 px-2">SHS</th>
                      <th className="border border-black py-1.5 px-2">JHS</th>
                      <th className="border border-black py-1.5 px-2">GS</th>
                      <th className="border border-black py-1.5 px-2">EMPLOYEE</th>
                      <th className="border-2 border-black py-1.5 px-3 bg-[#FFE699] font-extrabold text-xs">TOTAL</th>
                      <th className="border border-black py-1.5 px-2">CONSULTATION</th>
                      <th className="border border-black py-1.5 px-2">SENT HOME</th>
                      <th className="border border-black py-1.5 px-2">SENT TO HOSPITAL</th>
                      <th className="border border-black py-1.5 px-2">PRE- EMPLOYMENT</th>
                      <th className="border border-black py-1.5 px-2">VISITOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReportsData.map((data, idx) => {
                      return (
                        <tr key={data.day} className={`border border-black text-center font-bold text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}>
                          <td className="border border-black py-1 px-2 font-extrabold font-mono">{data.day}-{reportMonth.slice(0, 3)}-{reportYear.slice(-2)}</td>
                          <td className="border border-black py-1 px-2">{data.col || ''}</td>
                          <td className="border border-black py-1 px-2">{data.shs || ''}</td>
                          <td className="border border-black py-1 px-2">{data.jhs || ''}</td>
                          <td className="border border-black py-1 px-2">{data.gs || ''}</td>
                          <td className="border border-black py-1 px-2">{data.emp || ''}</td>
                          <td className="border-2 border-black py-1 px-2 bg-[#FFE699]/30 font-black text-black font-mono text-xs">{data.total || ''}</td>
                          <td className="border border-black py-1 px-2">{data.cons || ''}</td>
                          <td className="border border-black py-1 px-2">{data.home || ''}</td>
                          <td className="border border-black py-1 px-2 text-red-600 font-black">{data.hosp || ''}</td>
                          <td className="border border-black py-1 px-2">{data.pre || ''}</td>
                          <td className="border border-black py-1 px-2">{data.vis || ''}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#FFE699] text-black font-black text-center border-2 border-black text-xs">
                      <td className="border-2 border-black py-1.5 px-2">TOTAL</td>
                      <td className="border border-black py-1.5 px-1">{totals.col || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.shs || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.jhs || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.gs || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.emp || ''}</td>
                      <td className="border-2 border-black py-1.5 px-2 bg-[#FFC000] text-black font-mono text-sm font-black">{totals.total || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.cons || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.home || ''}</td>
                      <td className="border border-black py-1.5 px-1 text-red-700">{totals.hosp || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.pre || ''}</td>
                      <td className="border border-black py-1.5 px-1">{totals.vis || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 2. CASES ATTENDED (Updated ONLY to exact attached SY 2025-2026 morbidity template) ── */}
          {activeReport === 'cases' && (
            <div>
              <PrintBar title="CASES ATTENDED REPORT" />
              <div className="p-5 overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse border-2 border-black font-sans text-xs max-w-[850px] mx-auto" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th colSpan={4} className="bg-[#C6E0B4] text-black border-2 border-black p-4 text-center font-black">
                        <div className="text-sm tracking-wider uppercase font-extrabold">UNIVERSITY OF THE ASSUMPTION</div>
                        <div className="text-sm tracking-wider uppercase font-extrabold">COLLEGE MEDICAL CLINIC</div>
                        <div className="text-xs font-extrabold text-gray-950 mt-1 uppercase">
                          CASES ATTENDED SY: 2025-2026 (STUDENTS & PERSONNEL) MONTH: {reportMonth} YEAR: {reportYear}
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-[#FFE699] text-black font-black uppercase text-center border-2 border-black text-xs">
                      <th className="border-2 border-black py-2 px-4 text-left w-1/2">CASES/COMPLAINS</th>
                      <th className="border border-black py-2 px-4 w-28">STUDENT</th>
                      <th className="border border-black py-2 px-4 w-28">PERSONNEL</th>
                      <th className="border-2 border-black py-2 px-4 w-28 bg-[#FFC000]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_CASES.map((c, index) => {
                      const stu = caseCount(c, 'Student');
                      const emp = caseCount(c, 'Personnel');
                      const total = stu + emp;
                      return (
                        <tr key={c} className={`border border-black font-bold text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-green-50/30`}>
                          <td className="border border-black py-1 px-4 text-gray-900">{c}</td>
                          <td className="border border-black py-1 px-4 text-center font-mono text-gray-800">{stu || ''}</td>
                          <td className="border border-black py-1 px-4 text-center font-mono text-gray-800">{emp || ''}</td>
                          <td className="border-2 border-black py-1 px-4 text-center font-extrabold text-black font-mono bg-amber-50/40">{total || ''}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#C6E0B4] text-black font-black text-center border-2 border-black text-sm">
                      <td className="border-2 border-black py-2 px-4 text-left font-extrabold">TOTAL CASES ATTENDED</td>
                      <td className="border border-black py-2 px-4 font-mono">{ALL_CASES.reduce((sum, c) => sum + caseCount(c, 'Student'), 0) || ''}</td>
                      <td className="border border-black py-2 px-4 font-mono">{ALL_CASES.reduce((sum, c) => sum + caseCount(c, 'Personnel'), 0) || ''}</td>
                      <td className="border-2 border-black py-2 px-4 bg-[#A9D18E] font-mono font-black text-base">{ALL_CASES.reduce((sum, c) => sum + caseCount(c, 'Student') + caseCount(c, 'Personnel'), 0) || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 3. MEDICAL CERTIFICATES ISSUED (Kept untouched as original layout) ── */}
          {activeReport === 'medcert' && (() => {
            const sortedCerts = [...filteredCerts].sort((a, b) => {
              const dateA = normalizeDateStr((a as any).createdAt || (a as any).created_at || a.date);
              const dateB = normalizeDateStr((b as any).createdAt || (b as any).created_at || b.date);
              if (dateA && dateB && dateA !== dateB) {
                return dateB.localeCompare(dateA); // Latest date first
              }
              const timeA = new Date((a as any).createdAt || (a as any).created_at || a.date).getTime() || 0;
              const timeB = new Date((b as any).createdAt || (b as any).created_at || b.date).getTime() || 0;
              if (timeA !== timeB) return timeB - timeA;
              return (b.id || '').localeCompare(a.id || '');
            });

            return (
              <div>
                <PrintBar title="MEDICAL CERTIFICATES ISSUED" />
                <div className="overflow-x-auto custom-scrollbar p-4">
                  <table className="w-full border-collapse text-xs" style={{ minWidth: 700 }}>
                    <thead>
                      <tr className="bg-[#1B3A6B] text-white font-bold text-[11px]">
                        <th className="border border-blue-900 px-3 py-2 text-left">Cert ID</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Patient Name</th>
                        <th className="border border-blue-900 px-3 py-2 text-center">Category</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Purpose / Remarks</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Doctor</th>
                        <th className="border border-blue-900 px-3 py-2 text-center">Date Issued</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Issued By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCerts.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">No medical certificates issued for this period</td></tr>
                      ) : (
                        sortedCerts.map((mc, idx) => {
                          const p = getPatient(mc.patientId);
                          const rawDate = mc.date || (mc as any).createdAt || (mc as any).created_at;
                          const displayDate = normalizeDateStr(rawDate) || rawDate;
                          return (
                            <tr key={mc.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                              <td className="border border-gray-200 px-3 py-2 font-mono text-[#1B3A6B] font-bold">{mc.id}</td>
                              <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">{p?.name || mc.patientName || mc.patientId}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p?.category === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{p?.category || 'Student'}</span>
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-gray-700">{mc.purpose}</td>
                              <td className="border border-gray-200 px-3 py-2 text-gray-700">{mc.doctor}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">{displayDate}</td>
                              <td className="border border-gray-200 px-3 py-2 text-gray-600">{mc.issuedBy}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ── 4. NON-CONSULTATION / OVER-THE-COUNTER REPORT (Kept untouched as original layout) ── */}
          {activeReport === 'nonconsult' && (
            <div>
              <PrintBar title="NON-CONSULTATION / OVER-THE-COUNTER REPORT" />
              <div className="overflow-x-auto custom-scrollbar p-4">
                <table className="w-full border-collapse text-xs" style={{ minWidth: 800 }}>
                  <thead>
                    <tr className="bg-[#1B3A6B] text-white font-bold text-[11px]">
                      <th className="border border-blue-900 px-3 py-2 text-left">Date & Time</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Patient Name</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Reason / Complaint</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Item / Service Given</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Qty</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Dispensed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCons.filter(c => c.status === 'Non-Consultation' && !c.complaint.includes('[CONVERTED]')).map((c, idx) => {
                      const p = pat(c);
                      return (
                        <tr key={c.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                          <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700">{c.date} {c.timeIn}</td>
                          <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">{p?.name || c.patientId}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-700">{c.complaint}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-700">{c.treatments && c.treatments.length > 0 ? c.treatments.map(m => m.medicineName).join(', ') : 'BP measurement / Rest'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center font-medium">{c.treatments && c.treatments.length > 0 ? c.treatments.reduce((s, m) => s + m.quantity, 0) : '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-600">{c.assistingNurse || c.doctorName || 'Nurse'}</td>
                        </tr>
                      );
                    })}
                    {filteredCons.filter(c => c.status === 'Non-Consultation' && !c.complaint.includes('[CONVERTED]')).length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">No over-the-counter transactions recorded for this date range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 5. INVENTORY / MEDICINE REPORT (Updated ONLY to exact attached May-26 Medicines & Supplies spreadsheet templates) ── */}
          {activeReport === 'inventory' && (
            <div>
              <PrintBar title="MONTHLY INVENTORY OF MEDICINES & SUPPLIES" />
              <div className="p-5 space-y-4">
                {/* Sub-tab switcher between attached Medicines template and Supplies template */}
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 no-export print:hidden">
                  <button onClick={() => setInventoryTab('medicines')} className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${inventoryTab === 'medicines' ? 'bg-[#1B3A6B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <span>💊 Monthly Inventory of Medicines</span>
                  </button>
                  <button onClick={() => setInventoryTab('supplies')} className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${inventoryTab === 'supplies' ? 'bg-[#1B3A6B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <span>🩹 Monthly Inventory of Supplies</span>
                  </button>
                </div>

                {/* MEDICINES SPREADSHEET (Exact Excel screenshot) */}
                {inventoryTab === 'medicines' && (
                  <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full border-collapse border-2 border-black font-sans text-xs min-w-[1450px]">
                      <thead>
                        <tr>
                          <th colSpan={43} className="text-center py-3 bg-white border-x-2 border-t-2 border-black">
                            <div className="font-black text-lg uppercase tracking-tight">UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC</div>
                          </th>
                        </tr>
                        <tr>
                          <th colSpan={8} className="text-left px-3 py-2 bg-white border-l-2 border-black font-bold text-sm">
                            Monthly Inventory of Medicines (Inclusive Dates):
                          </th>
                          <th colSpan={8} className="text-center py-2 bg-white border-b border-black font-black underline text-sm">
                            {reportMonth} {reportYear}
                          </th>
                          <th colSpan={27} className="bg-white border-r-2 border-black"></th>
                        </tr>
                        <tr className="h-4 bg-white border-x-2 border-black"><th colSpan={43}></th></tr>
                        <tr className="text-black font-extrabold border-2 border-black text-center text-[10px]">
                          <th rowSpan={2} style={{ backgroundColor: '#FFFF00' }} className="border-2 border-black px-1 py-1.5 w-8">No.</th>
                          <th rowSpan={2} style={{ backgroundColor: '#FFFF00' }} className="border-2 border-black px-3 py-1.5 text-left w-52">Medicine</th>
                          <th rowSpan={2} style={{ backgroundColor: '#76923C' }} className="border-2 border-black px-1.5 py-1.5 text-white w-16 leading-tight">Beg.<br/>Inv.</th>
                          <th colSpan={37} className="border-2 border-black py-1 bg-white uppercase text-xs font-black">Consumption/s (Days 1 - 31)</th>
                          <th rowSpan={2} style={{ backgroundColor: '#76923C' }} className="border-2 border-black px-1.5 py-1.5 text-white w-16 leading-tight">End.<br/>Inv.</th>
                          <th rowSpan={2} style={{ backgroundColor: '#31859B' }} className="border-2 border-black px-1.5 py-1.5 text-white w-20 text-xs font-black">Sum Total<br/>Consumption</th>
                          <th rowSpan={2} style={{ backgroundColor: '#938953' }} className="border-2 border-black px-2 py-1.5 text-white w-24 font-black uppercase">EXPIRATION</th>
                        </tr>
                        <tr className="text-black font-bold border border-black text-center text-[9px] bg-white">
                          <th className="border border-black px-1">1</th><th className="border border-black px-1">2</th><th className="border border-black px-1">3</th><th className="border border-black px-1">4</th><th className="border border-black px-1">5</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">6</th><th className="border border-black px-1">7</th><th className="border border-black px-1">8</th><th className="border border-black px-1">9</th><th className="border border-black px-1">10</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">11</th><th className="border border-black px-1">12</th><th className="border border-black px-1">13</th><th className="border border-black px-1">14</th><th className="border border-black px-1">15</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">16</th><th className="border border-black px-1">17</th><th className="border border-black px-1">18</th><th className="border border-black px-1">19</th><th className="border border-black px-1">20</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">21</th><th className="border border-black px-1">22</th><th className="border border-black px-1">23</th><th className="border border-black px-1">24</th><th className="border border-black px-1">25</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">26</th><th className="border border-black px-1">27</th><th className="border border-black px-1">28</th><th className="border border-black px-1">29</th><th className="border border-black px-1">30</th><th className="border border-black px-1">31</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MEDICINE_INVENTORY_TEMPLATE.map(med => {
                          const actualMed = medicines.find(m => m.name.toLowerCase().includes(med.name.split(' ')[0].toLowerCase()));
                          const isNoStock = actualMed ? actualMed.stock <= 0 : med.status === 'NO STOCK';
                          const statusText = isNoStock ? 'NO STOCK' : '';
                          return (
                          <tr key={med.no} className={`border border-black text-[11px] font-semibold ${isNoStock ? 'bg-[#F2DCDB]' : 'hover:bg-blue-50/10'}`}>
                            <td style={{ backgroundColor: isNoStock ? '#EA9999' : '#FFFF00' }} className="border-2 border-black py-1 px-1 text-center font-black font-mono text-black">{med.no}</td>
                            <td style={{ backgroundColor: isNoStock ? '#EA9999' : '#FFFF00' }} className="border-2 border-black py-1 px-2 font-black text-left whitespace-nowrap text-gray-950">{med.name}</td>
                            <td style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#76923C' }} className={`border-2 border-black py-1 px-1.5 text-center font-black font-mono ${isNoStock ? 'text-black' : 'text-white'}`}>{med.beg}</td>
                            {renderConsumptionCells(med.c, isNoStock)}
                            <td style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#76923C' }} className={`border-2 border-black py-1 px-1.5 text-center font-black font-mono ${isNoStock ? 'text-black' : 'text-white'}`}>{med.end}</td>
                            <td style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#31859B' }} className={`border-2 border-black py-1 px-1.5 text-center font-black font-mono ${isNoStock ? 'text-black' : 'text-white'} text-xs`}>{med.total}</td>
                            <td className={`border-2 border-black py-1 px-2 text-center font-extrabold text-[10px] ${isNoStock ? 'bg-[#EA9999] text-black tracking-wider font-black' : 'bg-white text-gray-600'}`}>{statusText}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SUPPLIES SPREADSHEET (Exact PDF 2 template) */}
                {inventoryTab === 'supplies' && (
                  <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full border-collapse border-2 border-black font-sans text-xs min-w-[1400px]">
                      <thead>
                        <tr>
                          <th colSpan={42} className="text-center py-3 bg-white border-x-2 border-t-2 border-black">
                            <div className="font-black text-lg uppercase tracking-tight">UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC</div>
                          </th>
                        </tr>
                        <tr>
                          <th colSpan={8} className="text-left px-3 py-2 bg-white border-l-2 border-black font-bold text-sm">
                            Monthly Inventory of Supplies (Inclusive Dates):
                          </th>
                          <th colSpan={8} className="text-center py-2 bg-white border-b border-black font-black underline text-sm">
                            {reportMonth} {reportYear}
                          </th>
                          <th colSpan={26} className="bg-white border-r-2 border-black"></th>
                        </tr>
                        <tr className="h-4 bg-white border-x-2 border-black"><th colSpan={42}></th></tr>
                        <tr className="text-black font-extrabold border-2 border-black text-center text-[10px]">
                          <th rowSpan={2} style={{ backgroundColor: '#FFFF00' }} className="border-2 border-black px-1 py-1.5 w-8">No.</th>
                          <th rowSpan={2} style={{ backgroundColor: '#FFFF00' }} className="border-2 border-black px-3 py-1.5 text-left w-52">Supplies</th>
                          <th rowSpan={2} style={{ backgroundColor: '#76923C' }} className="border-2 border-black px-1.5 py-1.5 text-white w-16 leading-tight">Beg.<br/>Inv.</th>
                          <th colSpan={37} className="border-2 border-black py-1 bg-white uppercase text-xs font-black">Consumption/s (Days 1 - 31)</th>
                          <th rowSpan={2} style={{ backgroundColor: '#76923C' }} className="border-2 border-black px-1.5 py-1.5 text-white w-16 leading-tight">End.<br/>Inv.</th>
                          <th rowSpan={2} style={{ backgroundColor: '#31859B' }} className="border-2 border-black px-1.5 py-1.5 text-white w-20 text-xs font-black">Sum Total<br/>Consumption</th>
                        </tr>
                        <tr className="text-black font-bold border border-black text-center text-[9px] bg-white">
                          <th className="border border-black px-1">1</th><th className="border border-black px-1">2</th><th className="border border-black px-1">3</th><th className="border border-black px-1">4</th><th className="border border-black px-1">5</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">6</th><th className="border border-black px-1">7</th><th className="border border-black px-1">8</th><th className="border border-black px-1">9</th><th className="border border-black px-1">10</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">11</th><th className="border border-black px-1">12</th><th className="border border-black px-1">13</th><th className="border border-black px-1">14</th><th className="border border-black px-1">15</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">16</th><th className="border border-black px-1">17</th><th className="border border-black px-1">18</th><th className="border border-black px-1">19</th><th className="border border-black px-1">20</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">21</th><th className="border border-black px-1">22</th><th className="border border-black px-1">23</th><th className="border border-black px-1">24</th><th className="border border-black px-1">25</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                          <th className="border border-black px-1">26</th><th className="border border-black px-1">27</th><th className="border border-black px-1">28</th><th className="border border-black px-1">29</th><th className="border border-black px-1">30</th><th className="border border-black px-1">31</th><th style={{ backgroundColor: '#E36C09' }} className="border border-black px-1 text-white font-black">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUPPLIES_LIST.map(sup => {
                          const actualSup = medicines.find(m => m.name.toLowerCase().includes(sup.name.split(' ')[0].toLowerCase()));
                          const isNoStock = actualSup ? actualSup.stock <= 0 : false;
                          return (
                          <tr key={sup.no} className={`border border-black text-[11px] font-semibold ${isNoStock ? 'bg-[#F2DCDB]' : 'hover:bg-amber-50/10'}`}>
                            <td style={{ backgroundColor: isNoStock ? '#EA9999' : '#FFFF00' }} className="border-2 border-black py-1 px-1 text-center font-black font-mono text-black">{sup.no}</td>
                            <td style={{ backgroundColor: isNoStock ? '#EA9999' : '#FFFF00' }} className="border-2 border-black py-1 px-2 font-black text-left whitespace-nowrap text-gray-950">{sup.name}</td>
                            <td style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#76923C' }} className={`border-2 border-black py-1 px-1.5 text-center font-black font-mono ${isNoStock ? 'text-black' : 'text-white'}`}>{sup.beg}</td>
                            {renderConsumptionCells(sup.consumed, isNoStock)}
                            <td style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#76923C' }} className={`border-2 border-black py-1 px-1.5 text-center font-black font-mono ${isNoStock ? 'text-black' : 'text-white'}`}>{sup.end}</td>
                            <td style={{ backgroundColor: isNoStock ? '#F2DCDB' : '#31859B' }} className={`border-2 border-black py-1 px-1.5 text-center font-black font-mono ${isNoStock ? 'text-black' : 'text-white'} text-xs`}>{sup.total}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* ── 7. BED MANAGEMENT (Kept untouched as original layout) ── */}
          {activeReport === 'bed' && (
            <div>
              <PrintBar title="BED MANAGEMENT & RECOVERY ROOM CENSUS REPORT" />
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium">Total Beds</div>
                    <div className="text-lg font-extrabold text-gray-900">{beds.length}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-xs text-emerald-600 font-medium">Available Beds</div>
                    <div className="text-lg font-extrabold text-emerald-700">{beds.filter(b => b.status === 'Available').length}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium">Currently Occupied</div>
                    <div className="text-lg font-extrabold text-blue-700">{beds.filter(b => b.status === 'Occupied').length}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-xs text-amber-600 font-medium">Under Maintenance</div>
                    <div className="text-lg font-extrabold text-amber-700">{beds.filter(b => b.status === 'Maintenance' || b.status === 'Cleaning').length}</div>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse text-xs" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="bg-[#1B3A6B] text-white font-bold text-[11px]">
                        <th className="border border-blue-900 px-3 py-2 text-left">Bed ID & Number</th>
                        <th className="border border-blue-900 px-3 py-2 text-center">Status</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Current Patient / Occupant</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Complaint / Diagnosis</th>
                        <th className="border border-blue-900 px-3 py-2 text-center">Time Admitted</th>
                        <th className="border border-blue-900 px-3 py-2 text-left">Assigned Provider</th>
                        <th className="border border-blue-900 px-3 py-2 text-center">History Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beds.map((b, idx) => {
                        const statusCls = b.status === 'Available' ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Occupied' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

                        return (
                          <tr key={b.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <td className="border border-gray-200 px-3 py-2 font-bold text-gray-900">{b.name} ({b.id})</td>
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCls}`}>{b.status}</span>
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{b.patientName || 'None'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-600">{b.diagnosis || '-'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center font-mono text-gray-700">{b.timeAdmitted || '-'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-600">{b.assignedStaff || '-'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center font-bold text-gray-500">{b.history ? b.history.length : 0} logged</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── 8. APPOINTMENTS REPORT ── */}
          {activeReport === 'appointments' && (
            <div>
              <PrintBar title="APPOINTMENTS REPORT" />
              <div className="overflow-x-auto custom-scrollbar p-4">
                <table className="w-full border-collapse text-xs" style={{ minWidth: 800 }}>
                  <thead>
                    <tr className="bg-[#1B3A6B] text-white font-bold text-[11px]">
                      <th className="border border-blue-900 px-3 py-2 text-left">Appointment ID</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Patient Name</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Category</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Visit Type</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Reason / Purpose</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Scheduled Date & Time</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedAppointments.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No accepted appointment records found for this period</td></tr>
                    ) : (
                      acceptedAppointments.map((req, idx) => {
                        const p = getPatient(req.patient);
                        return (
                          <tr key={req.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <td className="border border-gray-200 px-3 py-2 font-mono text-[#1B3A6B] font-bold">{req.id.slice(0, 8)}</td>
                            <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">{p?.name || req.patient_name || req.patient}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p?.category === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{p?.category || 'Student'}</span>
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{req.visit_type}</td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-700">{req.reason}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">{req.scheduled_date || req.preferred_date} {req.scheduled_time || req.preferred_time}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${req.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 9. TELEMEDICINE REPORT ── */}
          {activeReport === 'telemedicine' && (
            <div>
              <PrintBar title="TELEMEDICINE REPORT" />
              <div className="overflow-x-auto custom-scrollbar p-4">
                <table className="w-full border-collapse text-xs" style={{ minWidth: 850 }}>
                  <thead>
                    <tr className="bg-[#1B3A6B] text-white font-bold text-[11px]">
                      <th className="border border-blue-900 px-3 py-2 text-left">Telemed ID</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Patient Name</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Category</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Reason / Chief Complaint</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Scheduled Date & Time</th>
                      <th className="border border-blue-900 px-3 py-2 text-left">Meeting Link</th>
                      <th className="border border-blue-900 px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedTelemedicine.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No accepted telemedicine records found for this period</td></tr>
                    ) : (
                      acceptedTelemedicine.map((req, idx) => {
                        const p = getPatient(req.patient);
                        return (
                          <tr key={req.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <td className="border border-gray-200 px-3 py-2 font-mono text-[#1B3A6B] font-bold">{req.id.slice(0, 8)}</td>
                            <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">{p?.name || req.patient_name || req.patient}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p?.category === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{p?.category || 'Student'}</span>
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-700">{req.reason}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">{req.scheduled_date || req.preferred_date} {req.scheduled_time || req.preferred_time}</td>
                            <td className="border border-gray-200 px-3 py-2 text-blue-600 truncate max-w-[200px]">
                              {req.meeting_link ? (
                                <a href={req.meeting_link} target="_blank" rel="noreferrer" className="underline hover:text-blue-800">
                                  {req.meeting_link}
                                </a>
                              ) : '-'}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${req.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
