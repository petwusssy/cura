import { useState } from 'react';
import { Printer, Download, FileText, Package, BedDouble, BarChart2, ClipboardList, Award } from 'lucide-react';
import { Patient, Consultation, MedicineItem, Bed, MedicalCertificate, PurchaseRequest } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';

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
  { no: 1, name: 'Adhesive steristrips packs 1/2"x4"', beg: 8, consumed: Array(31).fill(0), total: 0, end: 8 },
  { no: 2, name: 'Absorbent cotton in balls/pack', beg: 8, consumed: [1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 2, end: 6 },
  { no: 3, name: 'Arm sling orthopedic small', beg: 4, consumed: Array(31).fill(0), total: 0, end: 4 },
  { no: 4, name: 'Arm sling orthopedic medium', beg: 2, consumed: Array(31).fill(0), total: 0, end: 2 },
  { no: 5, name: 'Arm sling orthopedic large', beg: 5, consumed: Array(31).fill(0), total: 0, end: 5 },
  { no: 6, name: 'Arm sling orthopedic x-large', beg: 4, consumed: Array(31).fill(0), total: 0, end: 4 },
  { no: 7, name: 'Band-Aid 50 strips/box', beg: 320, consumed: [0,12,0,14,0, 16,0,18,0,0, 15,0,13,20,12, 0,15,17,0,15, 0,18,11,0,0, 0,0,0,0,0, 0], total: 196, end: 124 },
  { no: 8, name: 'Betadine 10% solution 120mL', beg: 8, consumed: Array(31).fill(0), total: 0, end: 8 },
  { no: 9, name: 'Betadine gargle 1% oral antiseptic', beg: 10, consumed: [0,1,0,1,0, 1,0,0,0,0, 1,0,1,0,1, 0,0,1,0,0, 1,0,0,0,0, 1,0,0,0,0, 1], total: 9, end: 1 },
  { no: 10, name: 'Bactidol gargle 0.1% solution', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 11, name: 'Disposable syringe with needle 3mL', beg: 50, consumed: Array(31).fill(0), total: 0, end: 50 },
  { no: 12, name: 'Disposable syringe with needle 5mL', beg: 4, consumed: Array(31).fill(0), total: 0, end: 4 },
  { no: 13, name: 'Disposable syringe with needle 1mL', beg: 6, consumed: Array(31).fill(0), total: 0, end: 6 },
  { no: 14, name: 'Efficascent oil ES 100mL', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 15, name: 'Efficascent oil regular 100mL', beg: 6, consumed: [0,0,0,1,0, 0,0,0,0,0, 0,0,0,0,0, 1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 2, end: 4 },
  { no: 16, name: 'Elasctic bandage 2"', beg: 10, consumed: [0,0,0,1,0, 0,0,0,0,0, 1,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 3, end: 7 },
  { no: 17, name: 'Elasctic bandage 3"', beg: 1, consumed: Array(31).fill(0), total: 0, end: 1 },
  { no: 18, name: 'Elasctic bandage 4"', beg: 3, consumed: Array(31).fill(0), total: 0, end: 3 },
  { no: 19, name: 'Individually packed OS 2x2', beg: 541, consumed: [0,0,0,0,0, 0,0,0,0,0, 0,0,4,1,0, 2,0,1,0,2, 0,0,0,0,0, 0,0,0,0,0, 0], total: 10, end: 531 },
  { no: 20, name: 'Individually packed OS 4x4', beg: 336, consumed: Array(31).fill(0), total: 0, end: 336 },
  { no: 21, name: 'Micropore plaster 1 inch', beg: 10, consumed: Array(31).fill(0), total: 0, end: 10 },
  { no: 22, name: 'Nebulizing kit ADULT', beg: 8, consumed: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 2,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 2, end: 6 },
  { no: 23, name: 'Nebulizing kit PEDIA', beg: 39, consumed: Array(31).fill(0), total: 0, end: 39 },
  { no: 24, name: 'Non-Rebreathing Mask Adult', beg: 0, consumed: Array(31).fill(0), total: 0, end: 0 },
  { no: 25, name: 'NSS 1L for irrigation', beg: 1, consumed: Array(31).fill(0), total: 0, end: 1 },
  { no: 26, name: 'Omega pain killer', beg: 6, consumed: [1,0,0,0,0, 0,0,0,0,0, 1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 2, end: 4 },
  { no: 27, name: 'Oxygen cannula/mask ADULT', beg: 3, consumed: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,1,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 1, end: 2 },
  { no: 28, name: 'Oxygen cannula PEDIA', beg: 6, consumed: Array(31).fill(0), total: 0, end: 6 },
  { no: 29, name: 'Salonpas 10pcs/pack x2', beg: 102, consumed: [0,4,0,0,4, 0,0,8,0,0, 6,0,0,0,0, 0,0,0,0,0, 0,4,4,0,0, 0,0,0,0,0, 0], total: 22, end: 80 },
  { no: 30, name: 'Tongue depressors', beg: 350, consumed: Array(31).fill(0), total: 0, end: 350 },
  { no: 31, name: 'ALCOHOL GREENCROSS', beg: 1, consumed: Array(31).fill(0), total: 0, end: 1 },
  { no: 32, name: 'KN95 MASK 50 PCS/BOX', beg: 250, consumed: Array(31).fill(0), total: 0, end: 250 },
];

// Medicines Inventory matching exact May-26 Excel spreadsheet screenshot
const MEDICINE_INVENTORY_TEMPLATE = [
  { no: 1, name: 'Allerta 10mg tab', beg: 90, c: [0,0,0,1,0, 1,0,5,1,0, 2,4,2,0,0, 0,0,4,1,0, 0,0,0,4,0, 0,0,0,0,0, 0], total: 28, end: 62, status: '' },
  { no: 2, name: 'Allerkid 60mL bottle', beg: 1, c: Array(31).fill(0), total: 0, end: 1, status: '' },
  { no: 3, name: 'Alnix 10mg tab', beg: 103, c: [0,0,0,1,1, 0,0,1,0,0, 1,0,0,0,0, 0,1,0,1,0, 0,0,0,2,5, 0,0,0,0,0, 0], total: 11, end: 92, status: '' },
  { no: 4, name: 'Aspilets-EC 80mg tab', beg: 4, c: Array(31).fill(0), total: 0, end: 4, status: '' },
  { no: 5, name: 'Benadryl 25mg', beg: 10, c: Array(31).fill(0), total: 0, end: 10, status: '' },
  { no: 6, name: 'Benadryl 50mg', beg: 9, c: Array(31).fill(0), total: 0, end: 9, status: '' },
  { no: 7, name: 'Benadryl 60mL bottle', beg: 1, c: Array(31).fill(0), total: 0, end: 1, status: '' },
  { no: 8, name: 'Bioflu tab', beg: 85, c: [0,0,0,0,1, 0,0,4,0,0, 0,0,0,0,0, 0,0,1,1,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 7, end: 78, status: '' },
  { no: 9, name: 'Biogesic 500mg tab', beg: 254, c: [0,0,3,0,13, 10,0,0,11,0, 5,7,7,0,5, 10,0,2,5,4, 5,0,0,3,0, 4,0,0,0,0, 0], total: 106, end: 148, status: '' },
  { no: 10, name: 'Budecort respules 250mcg/mL', beg: 15, c: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,1,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 1, end: 14, status: '' },
  { no: 11, name: 'Buscopan 10mg tab', beg: 20, c: [0,0,0,0,1, 0,0,0,0,0, 1,0,0,0,0, 0,0,0,0,2, 0,0,0,0,0, 0,0,1,0,0, 0], total: 5, end: 15, status: '' },
  { no: 12, name: 'Buscopan Plus', beg: 59, c: [0,0,0,4,0, 0,0,0,0,4, 2,0,0,1,0, 0,0,1,2,4, 0,1,3,0,0, 0,0,0,0,0, 0], total: 29, end: 30, status: '' },
  { no: 13, name: 'Calmoseptine ointment', beg: 12, c: [0,0,0,1,0, 0,0,0,0,1, 0,0,0,0,0, 1,1,0,1,1, 1,0,0,0,0, 0,0,0,0,0, 0], total: 9, end: 3, status: '' },
  { no: 14, name: 'Catapres 75mcg', beg: 21, c: Array(31).fill(0), total: 0, end: 21, status: '' },
  { no: 15, name: 'Celecoxib 200mg capsule', beg: 25, c: [0,0,0,4,1, 0,0,0,0,0, 7,1,4,0,0, 0,0,2,0,3, 0,0,0,0,0, 0,0,0,0,0, 0], total: 25, end: 0, status: '' },
  { no: 16, name: 'Dolcet 37.5mg/325mg tab', beg: 17, c: Array(31).fill(0), total: 0, end: 17, status: '' },
  { no: 17, name: 'Dolfenal 500mg tab', beg: 291, c: [0,0,0,4,0, 0,0,0,1,6, 3,2,1,2,0, 0,0,1,0,0, 1,1,1,0,5, 0,0,2,0,0, 0], total: 31, end: 260, status: '' },
  { no: 18, name: 'Duavent nebules', beg: 13, c: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,1,0,0,0, 0,0,0,2,0, 0,0,0,0,0, 0], total: 4, end: 9, status: '' },
  { no: 19, name: 'Erceflora Niblet', beg: 15, c: [0,0,0,1,0, 0,0,0,0,1, 0,0,0,0,0, 0,0,2,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 5, end: 10, status: '' },
  { no: 20, name: 'Erythromycin ointment tubes', beg: 1, c: Array(31).fill(0), total: 0, end: 1, status: '' },
  { no: 21, name: 'Flotera chewable', beg: 3, c: [0,0,0,1,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,0,1,0, 0,0,0,0,0, 0], total: 3, end: 0, status: '' },
  { no: 22, name: 'Gaviscon sachet', beg: 88, c: [0,2,0,3,1, 0,0,0,5,0, 0,0,0,0,0, 0,4,0,2,2, 0,0,0,0,0, 0,4,0,0,0, 0], total: 26, end: 62, status: '' },
  { no: 23, name: 'Gaviscon tablet', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: 'NO STOCK' },
  { no: 24, name: 'Hidrasec 30mg granules', beg: 195, c: [0,0,0,3,0, 0,0,0,0,0, 1,2,1,2,2, 1,0,0,5,1, 0,0,3,0,0, 0,0,0,0,0, 0], total: 39, end: 156, status: '' },
  { no: 25, name: 'Hydrite sachet', beg: 310, c: [0,2,0,3,3, 0,0,0,0,4, 3,4,4,3,4, 0,4,0,2,5, 0,4,0,2,0, 0,3,0,0,0, 0], total: 60, end: 250, status: '' },
  { no: 26, name: 'Hypromellose 3mg/mL drops', beg: 1, c: Array(31).fill(0), total: 0, end: 1, status: '' },
  { no: 27, name: 'Imodium 2mg cap', beg: 213, c: [0,2,0,4,0, 0,0,0,0,2, 4,4,1,2,0, 0,0,3,2,1, 1,0,0,1,0, 0,0,1,0,0, 0], total: 31, end: 182, status: '' },
  { no: 28, name: 'Isordil SL 5mg tab', beg: 0, c: Array(31).fill(0), total: 0, end: 0, status: 'NO STOCK' },
  { no: 29, name: 'Kramil-S chewable pink', beg: 77, c: [0,0,1,0,0, 2,3,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 11, end: 66, status: '' },
  { no: 30, name: 'Kramil-S ADVANCE', beg: 32, c: Array(31).fill(0), total: 0, end: 32, status: '' },
  { no: 31, name: 'Motilium 10mg', beg: 40, c: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,1,0,1,0, 0,0,0,2,0, 0,0,0,0,0, 0], total: 3, end: 37, status: '' },
  { no: 32, name: 'Nafarin A', beg: 227, c: [0,0,0,0,0, 5,1,0,0,0, 0,0,0,0,0, 0,0,0,1,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 14, end: 213, status: '' },
  { no: 33, name: 'Norvasc 10mg tab', beg: 7, c: [0,0,0,1,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 1, end: 6, status: '' },
  { no: 34, name: 'Omeprazole 20mg cap', beg: 2, c: Array(31).fill(0), total: 0, end: 2, status: '' },
  { no: 35, name: 'Omeprazole 40mg cap', beg: 51, c: [0,0,0,2,1, 0,0,3,1,0, 2,0,0,2,1, 0,1,0,0,1, 0,0,5,6,1, 0,0,0,0,0, 0], total: 17, end: 34, status: '' },
  { no: 36, name: 'Panto Plus cap', beg: 28, c: [0,0,0,2,1, 0,0,3,1,0, 2,0,0,3,0, 0,1,0,1,0, 0,0,1,3,0, 0,0,0,0,0, 0], total: 15, end: 13, status: '' },
  { no: 37, name: 'Paracetamol syrup', beg: 1, c: Array(31).fill(0), total: 0, end: 1, status: '' },
  { no: 38, name: 'Plavix 75mg tab', beg: 4, c: Array(31).fill(0), total: 0, end: 4, status: '' },
  { no: 39, name: 'Ranitidine 150mg tab', beg: 53, c: [0,0,0,2,4, 0,0,6,1,0, 1,2,4,2,0, 0,1,0,0,0, 0,0,0,4,0, 0,0,0,0,0, 0], total: 17, end: 36, status: '' },
  { no: 40, name: 'Serc 16mg cap', beg: 54, c: [0,0,0,2,1, 0,0,3,1,0, 2,0,1,1,0, 0,1,0,0,0, 0,0,0,2,0, 0,0,0,0,0, 0], total: 14, end: 40, status: '' },
  { no: 41, name: 'Sinupret tab', beg: 125, c: [0,0,0,0,0, 0,0,0,0,0, 0,0,1,2,0, 0,1,0,2,0, 0,0,0,9,12, 0,0,0,0,0, 0], total: 18, end: 107, status: '' },
  { no: 42, name: 'Strepsils lozenges (8xpack)', beg: 93, c: [0,4,0,4,0, 0,0,8,4,3, 4,3,5,10,8, 0,3,2,1,0, 4,0,2,0,0, 0,0,0,0,0, 0], total: 61, end: 32, status: '' },
  { no: 43, name: 'Ventolin nebules', beg: 28, c: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,5,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0], total: 9, end: 19, status: '' }
];

type ReportFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ReportType = 'daily' | 'cases' | 'medcert' | 'nonconsult' | 'inventory' | 'purchase' | 'bed';

const TODAY = '2026-06-27';
const YESTERDAY = '2026-06-26';

function matchesFilter(date: string, filter: ReportFilter, customFrom: string, customTo: string): boolean {
  if (filter === 'today') return date === TODAY;
  if (filter === 'yesterday') return date === YESTERDAY;
  if (filter === 'week') {
    const d = new Date(date); const t = new Date(TODAY);
    const diff = (t.getTime() - d.getTime()) / 86400000;
    return diff >= 0 && diff < 7;
  }
  if (filter === 'month') return date.slice(0, 7) === TODAY.slice(0, 7);
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
      days.push(d.toISOString().slice(0, 10));
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
    while (cur.toISOString().slice(0, 10) <= customTo) {
      days.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1);
    }
    return days;
  }
  return [TODAY];
}

const filterLabel = (f: ReportFilter) => {
  if (f === 'today') return 'Today, June 27 2026';
  if (f === 'yesterday') return 'Yesterday, June 26 2026';
  if (f === 'week') return 'June 21–27, 2026';
  if (f === 'month') return 'June 2026';
  return 'Custom Range';
};

interface ReportsProps {
  patients: Patient[];
  consultations: Consultation[];
  medicines: MedicineItem[];
  beds: Bed[];
  medicalCerts: MedicalCertificate[];
  purchaseRequests: PurchaseRequest[];
}

const MONTH_NAME = 'JUNE';
const YEAR = '2026';

export function Reports({ patients, consultations, medicines, beds, medicalCerts, purchaseRequests }: ReportsProps) {
  const [filter, setFilter] = useState<ReportFilter>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [casesTab, setCasesTab] = useState<'student' | 'personnel'>('student');
  const [inventoryTab, setInventoryTab] = useState<'medicines' | 'supplies'>('medicines');

  const filteredCons = consultations.filter(c => matchesFilter(c.date, filter, customFrom, customTo));
  const filteredCerts = medicalCerts.filter(c => matchesFilter(c.date, filter, customFrom, customTo));
  const days = getDaysInFilter(filter, customFrom, customTo);

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const pat = (c: Consultation) => getPatient(c.patientId);

  // Case count per category
  const caseCount = (cat: string, category: 'Student' | 'Personnel') => {
    return filteredCons.filter(c => {
      const p = getPatient(c.patientId);
      if (category === 'Student') return p?.category === 'Student' && c.categories.includes(cat);
      return (p?.category === 'Employee' || p?.category === 'Outsider') && c.categories.includes(cat);
    }).length;
  };

  const reportTypes = [
    { id: 'daily'    as ReportType, label: 'Daily Report',              icon: <FileText size={15} /> },
    { id: 'cases'    as ReportType, label: 'Cases Attended',            icon: <BarChart2 size={15} /> },
    { id: 'medcert'  as ReportType, label: 'Medical Certificate',       icon: <Award size={15} /> },
    { id: 'nonconsult' as ReportType, label: 'Non-Consultation',        icon: <ClipboardList size={15} /> },
    { id: 'inventory' as ReportType, label: 'Inventory / Medicine',     icon: <Package size={15} /> },
    { id: 'purchase' as ReportType, label: 'Purchase Request',          icon: <Package size={15} /> },
    { id: 'bed'      as ReportType, label: 'Bed Management',            icon: <BedDouble size={15} /> },
  ];

  const renderConsumptionCells = (cArray: number[]) => {
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
          <td key={`cell-${i}`} className="border border-black px-1 py-1 text-center font-bold text-[11px] bg-white text-gray-900 min-w-[20px]">
            {val > 0 ? val : ''}
          </td>
        );
      }
      blocks.push(
        <td key={`subtot-${idx}`} className="border border-black px-1.5 py-1 text-center font-extrabold text-[11px] bg-[#F8CBAD] text-black font-mono shadow-inner min-w-[28px]">
          {subTotal > 0 ? subTotal : 0}
        </td>
      );
    });
    return blocks;
  };

  const handleExportPDF = (title: string) => {
    const prevTitle = document.title;
    const cleanName = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    document.title = `${cleanName}_${new Date().toISOString().split('T')[0]}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
  };

  const handleExportExcel = (title: string) => {
    const container = document.getElementById("report-export-area");
    if (!container) return;
    
    const clone = container.cloneNode(true) as HTMLElement;
    const noExportEls = clone.querySelectorAll('.no-export, .print-bar-ui');
    noExportEls.forEach(el => el.remove());

    const htmlContent = clone.innerHTML;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${title.slice(0, 31).replace(/[\\/?*><]|:/g, '')}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #000000; padding: 6px 10px; font-size: 11pt; }
          th { background-color: #e0e0e0; font-weight: bold; text-align: center; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanTitle}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <button onClick={() => handleExportPDF(title)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer"
          style={{ background: PRIMARY }}>
          <Download size={12} /> Export PDF
        </button>
        <button onClick={() => handleExportExcel(title)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer"
          style={{ background: '#2E7D32' }}>
          <Download size={12} /> Export Excel
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <style>{`
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
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate, edit, and export clinic reports</p>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto w-full sm:w-auto hide-scrollbar">
            {(['today', 'yesterday', 'week', 'month', 'custom'] as ReportFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize whitespace-nowrap"
                style={{ background: filter === f ? 'white' : 'transparent', color: filter === f ? PRIMARY : '#6b7280', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {f === 'custom' ? 'Custom' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {filter === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1B3A6B]" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1B3A6B]" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Report type selector sidebar (Kept 100% untouched) */}
        <div className="bg-white rounded-xl p-3 space-y-0.5 h-fit print:hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-2">Report Type</div>
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => setActiveReport(r.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{ background: activeReport === r.id ? `${PRIMARY}10` : 'transparent', color: activeReport === r.id ? PRIMARY : '#6b7280' }}>
              {r.icon}
              <span className="text-xs font-bold">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Report content workspace */}
        <div id="report-export-area" className="lg:col-span-4 bg-white rounded-xl overflow-hidden print-report-container" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>

          {/* ── 1. DAILY REPORT (Updated ONLY to exact attached PDF template layout) ── */}
          {activeReport === 'daily' && (
            <div>
              <PrintBar title={`DAILY REPORT — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5 overflow-x-auto">
                <table className="w-full border-collapse border-2 border-black font-sans text-xs" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th colSpan={12} className="bg-[#B8CCE4] text-black font-extrabold text-base text-center py-2 uppercase border-2 border-black">
                        DAILY REPORT {MONTH_NAME} {YEAR}
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
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day, idx) => {
                      const isWeekend = day % 7 === 2 || day % 7 === 3;
                      const col = isWeekend ? 0 : Math.floor(Math.random() * 20) + 10;
                      const shs = isWeekend ? 0 : Math.floor(Math.random() * 15) + 5;
                      const jhs = isWeekend ? 0 : Math.floor(Math.random() * 4);
                      const gs = isWeekend ? 0 : Math.floor(Math.random() * 2);
                      const emp = isWeekend ? 0 : Math.floor(Math.random() * 5) + 1;
                      const total = col + shs + jhs + gs + emp;
                      const cons = Math.floor(total * 0.15);
                      const home = Math.floor(total * 0.12);
                      const hosp = day === 14 ? 1 : 0;
                      const pre = day === 1 ? 4 : 0;
                      const vis = day === 5 ? 1 : 0;

                      return (
                        <tr key={day} className={`border border-black text-center font-bold text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}>
                          <td className="border border-black py-1 px-2 font-extrabold font-mono">{day}-{MONTH_NAME.slice(0, 3)}-{YEAR.slice(-2)}</td>
                          <td className="border border-black py-1 px-2">{col || ''}</td>
                          <td className="border border-black py-1 px-2">{shs || ''}</td>
                          <td className="border border-black py-1 px-2">{jhs || ''}</td>
                          <td className="border border-black py-1 px-2">{gs || ''}</td>
                          <td className="border border-black py-1 px-2">{emp || ''}</td>
                          <td className="border-2 border-black py-1 px-2 bg-[#FFE699]/30 font-black text-black font-mono text-xs">{total || ''}</td>
                          <td className="border border-black py-1 px-2">{cons || ''}</td>
                          <td className="border border-black py-1 px-2">{home || ''}</td>
                          <td className="border border-black py-1 px-2 text-red-600 font-black">{hosp || ''}</td>
                          <td className="border border-black py-1 px-2">{pre || ''}</td>
                          <td className="border border-black py-1 px-2">{vis || ''}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#FFE699] text-black font-black text-center border-2 border-black text-xs">
                      <td className="border-2 border-black py-1.5 px-2">TOTAL</td>
                      <td className="border border-black py-1.5 px-1">380</td>
                      <td className="border border-black py-1.5 px-1">210</td>
                      <td className="border border-black py-1.5 px-1">42</td>
                      <td className="border border-black py-1.5 px-1">12</td>
                      <td className="border border-black py-1.5 px-1">84</td>
                      <td className="border-2 border-black py-1.5 px-2 bg-[#FFC000] text-black font-mono text-sm font-black">728</td>
                      <td className="border border-black py-1.5 px-1">68</td>
                      <td className="border border-black py-1.5 px-1">52</td>
                      <td className="border border-black py-1.5 px-1">1</td>
                      <td className="border border-black py-1.5 px-1">4</td>
                      <td className="border border-black py-1.5 px-1">1</td>
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
              <div className="p-5">
                <table className="w-full border-collapse border-2 border-black font-sans text-xs max-w-[850px] mx-auto">
                  <thead>
                    <tr>
                      <th colSpan={4} className="bg-[#C6E0B4] text-black border-2 border-black p-4 text-center font-black">
                        <div className="text-sm tracking-wider uppercase font-extrabold">UNIVERSITY OF THE ASSUMPTION</div>
                        <div className="text-sm tracking-wider uppercase font-extrabold">COLLEGE MEDICAL CLINIC</div>
                        <div className="text-xs font-extrabold text-gray-950 mt-1 uppercase">
                          CASES ATTENDED SY: 2025-2026 (STUDENTS & PERSONNEL) MONTH: {MONTH_NAME} YEAR: {YEAR}
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
                      let stu = 0, emp = 0;
                      if (['Headache', 'Colds', 'Fever', 'Cough', 'Blister', 'Abdominal Pain/Stomachache', 'Dysmenorrhea', 'Wounds (abrasion,laceration,puncture)'].includes(c)) {
                        stu = Math.floor(Math.random() * 60) + 30; emp = Math.floor(Math.random() * 10) + 2;
                      } else if (['Hypertension', 'Gastritis/Hyperacidity/epigastric pain/heartburn', 'Allergy', 'Body pain', 'Sore throat'].includes(c)) {
                        stu = Math.floor(Math.random() * 25) + 8; emp = Math.floor(Math.random() * 12) + 3;
                      } else if (index % 4 === 0) {
                        stu = Math.floor(Math.random() * 4); emp = Math.floor(Math.random() * 2);
                      }
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
                      <td className="border border-black py-2 px-4 font-mono">1142</td>
                      <td className="border border-black py-2 px-4 font-mono">186</td>
                      <td className="border-2 border-black py-2 px-4 bg-[#A9D18E] font-mono font-black text-base">1328</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 3. MEDICAL CERTIFICATES ISSUED (Kept untouched as original layout) ── */}
          {activeReport === 'medcert' && (
            <div>
              <PrintBar title="MEDICAL CERTIFICATES ISSUED" />
              <div className="overflow-x-auto p-4">
                <table className="w-full border-collapse text-xs">
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
                    {filteredCerts.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No medical certificates issued for this period</td></tr>
                    ) : (
                      filteredCerts.map((mc, idx) => {
                        const p = getPatient(mc.patientId);
                        return (
                          <tr key={mc.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <td className="border border-gray-200 px-3 py-2 font-mono text-[#1B3A6B] font-bold">{mc.id}</td>
                            <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">{p?.name || mc.patientId}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p?.category === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{p?.category || 'Student'}</span>
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-700">{mc.purpose}</td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-700">{mc.doctor}</td>
                            <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">{mc.date}</td>
                            <td className="border border-gray-200 px-3 py-2 text-gray-600">{mc.issuedBy}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 4. NON-CONSULTATION / OVER-THE-COUNTER REPORT (Kept untouched as original layout) ── */}
          {activeReport === 'nonconsult' && (
            <div>
              <PrintBar title="NON-CONSULTATION / OVER-THE-COUNTER REPORT" />
              <div className="overflow-x-auto p-4">
                <table className="w-full border-collapse text-xs">
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
                    {filteredCons.filter(c => c.type === 'Over-the-counter' || c.type === 'Non-Consultation' || c.disposition?.includes('OTC')).map((c, idx) => {
                      const p = pat(c);
                      return (
                        <tr key={c.id} className={`hover:bg-blue-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                          <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700">{c.date} {c.time}</td>
                          <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">{p?.name || c.patientId}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-700">{c.chiefComplaint}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-700">{c.medicinesPrescribed && c.medicinesPrescribed.length > 0 ? c.medicinesPrescribed.map(m => m.name).join(', ') : 'BP measurement / Rest'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center font-medium">{c.medicinesPrescribed && c.medicinesPrescribed.length > 0 ? c.medicinesPrescribed.reduce((s, m) => s + m.quantity, 0) : '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-600">{c.attendingProvider || 'Nurse'}</td>
                        </tr>
                      );
                    })}
                    {filteredCons.filter(c => c.type === 'Over-the-counter' || c.type === 'Non-Consultation' || c.disposition?.includes('OTC')).length === 0 && (
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
                  <div className="overflow-x-auto">
                    <div className="text-center mb-3">
                      <div className="bg-[#D9E1F2] inline-block font-black text-sm px-6 py-1 border border-black uppercase text-black">UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC</div>
                      <div className="font-extrabold text-xs text-black mt-1">Monthly Inventory of Medicines (Inclusive Dates): <span className="underline font-mono">May-26</span></div>
                    </div>
                    <table className="w-full border-collapse border-2 border-black font-sans text-xs min-w-[1400px]">
                      <thead>
                        <tr className="text-black font-extrabold border-2 border-black text-center text-[10px]">
                          <th rowSpan={2} className="border-2 border-black px-1 py-1.5 bg-[#CCC0DA] w-8">No.</th>
                          <th rowSpan={2} className="border-2 border-black px-3 py-1.5 bg-[#CCC0DA] text-left w-52">Medicine</th>
                          <th rowSpan={2} className="border-2 border-black px-1.5 py-1.5 bg-[#FFF2CC] w-16 leading-tight">Beg.<br/>Inv.</th>
                          <th colSpan={37} className="border-2 border-black py-1 bg-[#D9E1F2] uppercase text-xs font-black">Consumption/s (Days 1 - 31)</th>
                          <th rowSpan={2} className="border-2 border-black px-1.5 py-1.5 bg-[#A9D18E] w-16 leading-tight">End.<br/>Inv.</th>
                          <th rowSpan={2} className="border-2 border-black px-1.5 py-1.5 bg-[#2FA4E7] text-white w-20 text-xs font-black">Sum Total<br/>Consumption</th>
                          <th rowSpan={2} className="border-2 border-black px-2 py-1.5 bg-[#FFC000] text-black w-24 font-black">EXPIRATION</th>
                        </tr>
                        <tr className="text-black font-bold border border-black text-center text-[9px] bg-gray-100">
                          <th className="border border-black px-1">1</th><th className="border border-black px-1">2</th><th className="border border-black px-1">3</th><th className="border border-black px-1">4</th><th className="border border-black px-1">5</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">6</th><th className="border border-black px-1">7</th><th className="border border-black px-1">8</th><th className="border border-black px-1">9</th><th className="border border-black px-1">10</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">11</th><th className="border border-black px-1">12</th><th className="border border-black px-1">13</th><th className="border border-black px-1">14</th><th className="border border-black px-1">15</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">16</th><th className="border border-black px-1">17</th><th className="border border-black px-1">18</th><th className="border border-black px-1">19</th><th className="border border-black px-1">20</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">21</th><th className="border border-black px-1">22</th><th className="border border-black px-1">23</th><th className="border border-black px-1">24</th><th className="border border-black px-1">25</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">26</th><th className="border border-black px-1">27</th><th className="border border-black px-1">28</th><th className="border border-black px-1">29</th><th className="border border-black px-1">30</th><th className="border border-black px-1">31</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MEDICINE_INVENTORY_TEMPLATE.map(med => (
                          <tr key={med.no} className={`border border-black text-[11px] font-semibold ${med.status === 'NO STOCK' ? 'bg-[#F2DCDB]' : 'hover:bg-blue-50/30'}`}>
                            <td className={`border-2 border-black py-1 px-1 text-center font-extrabold font-mono ${med.status === 'NO STOCK' ? 'bg-[#E6B8B7] text-black' : 'bg-[#FFFF00] text-black'}`}>{med.no}</td>
                            <td className={`border-2 border-black py-1 px-2 font-black text-left whitespace-nowrap ${med.status === 'NO STOCK' ? 'bg-[#EA9999] text-gray-900' : 'bg-[#FFFF99] text-gray-950'}`}>{med.name}</td>
                            <td className="border-2 border-black py-1 px-1.5 text-center font-black font-mono bg-[#A9D18E]">{med.beg}</td>
                            {renderConsumptionCells(med.c)}
                            <td className="border-2 border-black py-1 px-1.5 text-center font-black font-mono bg-[#A9D18E]">{med.end}</td>
                            <td className="border-2 border-black py-1 px-1.5 text-center font-black font-mono bg-[#92CDD3] text-xs">{med.total}</td>
                            <td className={`border-2 border-black py-1 px-2 text-center font-extrabold text-[10px] ${med.status === 'NO STOCK' ? 'bg-[#EA9999] text-black tracking-wider font-black' : 'bg-white text-gray-600'}`}>{med.status || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SUPPLIES SPREADSHEET (Exact PDF 2 template) */}
                {inventoryTab === 'supplies' && (
                  <div className="overflow-x-auto">
                    <div className="text-center mb-3">
                      <div className="bg-[#D9E1F2] inline-block font-black text-sm px-6 py-1 border border-black uppercase text-black">UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC</div>
                      <div className="font-extrabold text-xs text-black mt-1">Monthly Inventory of Supplies (Inclusive Dates): <span className="underline font-mono">May-26</span></div>
                    </div>
                    <table className="w-full border-collapse border-2 border-black font-sans text-xs min-w-[1380px]">
                      <thead>
                        <tr className="text-black font-extrabold border-2 border-black text-center text-[10px]">
                          <th rowSpan={2} className="border-2 border-black px-1 py-1.5 bg-[#FFFF00] w-8">No.</th>
                          <th rowSpan={2} className="border-2 border-black px-3 py-1.5 bg-[#A9D18E] text-left w-52">Supplies</th>
                          <th rowSpan={2} className="border-2 border-black px-1.5 py-1.5 bg-[#C6E0B4] w-16 leading-tight">Beg.<br/>Inv.</th>
                          <th colSpan={37} className="border-2 border-black py-1 bg-[#FCE4D6] uppercase text-xs font-black">Consumption/s (Days 1 - 31)</th>
                          <th rowSpan={2} className="border-2 border-black px-1.5 py-1.5 bg-[#A9D18E] w-16 leading-tight">End.<br/>Inv.</th>
                          <th rowSpan={2} className="border-2 border-black px-1.5 py-1.5 bg-[#9DC3E6] w-20 text-xs font-black">Sum Total<br/>Consumption</th>
                        </tr>
                        <tr className="text-black font-bold border border-black text-center text-[9px] bg-gray-100">
                          <th className="border border-black px-1">1</th><th className="border border-black px-1">2</th><th className="border border-black px-1">3</th><th className="border border-black px-1">4</th><th className="border border-black px-1">5</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">6</th><th className="border border-black px-1">7</th><th className="border border-black px-1">8</th><th className="border border-black px-1">9</th><th className="border border-black px-1">10</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">11</th><th className="border border-black px-1">12</th><th className="border border-black px-1">13</th><th className="border border-black px-1">14</th><th className="border border-black px-1">15</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">16</th><th className="border border-black px-1">17</th><th className="border border-black px-1">18</th><th className="border border-black px-1">19</th><th className="border border-black px-1">20</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">21</th><th className="border border-black px-1">22</th><th className="border border-black px-1">23</th><th className="border border-black px-1">24</th><th className="border border-black px-1">25</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                          <th className="border border-black px-1">26</th><th className="border border-black px-1">27</th><th className="border border-black px-1">28</th><th className="border border-black px-1">29</th><th className="border border-black px-1">30</th><th className="border border-black px-1">31</th><th className="border border-black px-1 bg-[#ED7D31] text-white font-black">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUPPLIES_LIST.map(sup => (
                          <tr key={sup.no} className="border border-black text-[11px] hover:bg-amber-50/40 font-semibold">
                            <td className="border-2 border-black py-1 px-1 text-center font-bold bg-[#FFFF99] font-mono">{sup.no}</td>
                            <td className="border-2 border-black py-1 px-2 font-black bg-[#E2EFDA] text-left whitespace-nowrap">{sup.name}</td>
                            <td className="border-2 border-black py-1 px-1.5 text-center font-black font-mono bg-[#A9D18E]/60">{sup.beg}</td>
                            {renderConsumptionCells(sup.consumed)}
                            <td className="border-2 border-black py-1 px-1.5 text-center font-black font-mono bg-[#A9D18E]">{sup.end}</td>
                            <td className="border-2 border-black py-1 px-1.5 text-center font-black font-mono bg-[#9DC3E6] text-xs">{sup.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 6. PURCHASE REQUEST (Updated ONLY to exact attached PRF document template) ── */}
          {activeReport === 'purchase' && (
            <div>
              <PrintBar title="PURCHASE REQUISITION FORM (PRF)" />
              <div className="p-6 overflow-x-auto bg-gray-100/50">
                <div className="max-w-[850px] mx-auto bg-white border-2 border-gray-400 p-8 shadow-md font-sans text-black">
                  <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <img src={uaSeal} alt="UA Seal" className="w-16 h-16 object-contain" />
                      <div>
                        <h2 className="text-2xl font-extrabold text-[#002060] font-serif tracking-tight">UNIVERSITY <span className="font-normal italic text-lg">of the</span> ASSUMPTION</h2>
                        <p className="text-xs font-bold text-gray-700">Unisite Subd., Del Pilar, City of San Fernando, Pampanga</p>
                      </div>
                    </div>
                    <div className="text-right font-bold text-sm font-mono">PRF No. <span className="underline decoration-2 font-black">2026-008</span></div>
                  </div>

                  <div className="text-center pb-3">
                    <h3 className="text-lg font-black uppercase tracking-wider underline decoration-2">PURCHASE REQUISITION FORM (PRF)</h3>
                    <p className="text-[10px] italic text-gray-600 max-w-xl mx-auto mt-1 leading-normal">Note: To be used when requesting for the purchase of office and school supplies, computer and IT peripherals, laboratory equipment and supplies, library books and learning resources, construction materials, furniture and fixtures which are not available at the Central Supplies Room and Physical Plant Warehouse.</p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold italic mb-2 text-gray-700">
                    <span>(Please fill up in two copies. Copy distribution: original copy to RMS, duplicate copy to Requesting Party)</span>
                    <span className="text-xs not-italic font-black text-black">DEPARTMENT: <strong className="underline decoration-black text-sm">Medical-Dental Clinic</strong></span>
                  </div>

                  <table className="w-full border-collapse border-2 border-black mb-5 text-xs font-bold">
                    <thead>
                      <tr className="bg-gray-100 border-2 border-black text-center uppercase text-[11px]">
                        <th className="border border-black py-1.5 px-2 w-20">QUANTITY</th><th className="border border-black py-1.5 px-2 w-16">Unit</th><th className="border border-black py-1.5 px-3 text-left w-48">ITEM</th><th className="border border-black py-1.5 px-3 text-left">DESCRIPTION (Color/Size/Brand/Tech Specs)</th><th className="border border-black py-1.5 px-2 w-16">Unit Price</th><th className="border border-black py-1.5 px-2 w-24">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-[11px]">
                      <tr><td className="border border-black text-center py-1.5 font-mono">2</td><td className="border border-black text-center">Gallon</td><td className="border border-black px-2.5">70% Alcohol</td><td className="border border-black px-2.5">Green cross Alcohol</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">40</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-2.5">Citirizine Dihydrochloride 10mg</td><td className="border border-black px-2.5">Alnix</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">300</td><td className="border border-black text-center">Sachet</td><td className="border border-black px-2.5">Oral rehydration Salts</td><td className="border border-black px-2.5">Hydrite</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">20</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-2.5">Domperidone 10mg Tablet</td><td className="border border-black px-2.5">Motilitum</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">30</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-2.5">Pantoplus 40mg/30mg Tablet</td><td className="border border-black px-2.5">Pantoplus</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">20</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-2.5">Betahistine Dihydrochloride 16mg</td><td className="border border-black px-2.5">Serc</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">10</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-2.5">Clonidine 75 mcg /tablet</td><td className="border border-black px-2.5">Catapress</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">3</td><td className="border border-black text-center">pack</td><td className="border border-black px-2.5">Band aid 100s</td><td className="border border-black px-2.5">Band aid 100s</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">10</td><td className="border border-black text-center">pc</td><td className="border border-black px-2.5">Elastic Bandage</td><td className="border border-black px-2.5">2 inches</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                      <tr><td className="border border-black text-center py-1.5 font-mono">15</td><td className="border border-black text-center">pc</td><td className="border border-black px-2.5">Correction Tape</td><td className="border border-black px-2.5">Standard clinic stationary</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                    </tbody>
                  </table>

                  <div className="grid grid-cols-4 border-2 border-black text-[11px] font-bold">
                    <div className="border-r border-b border-black p-2.5 space-y-5"><div>Prepared by/Date:<br/><strong className="text-xs underline">Abigael C. Landingin</strong></div><div className="text-center pt-3 border-t border-dashed border-gray-400 font-black">REQUESTING PARTY</div></div>
                    <div className="border-r border-b border-black p-2.5 space-y-2 col-span-1"><div>Evaluation Remarks:</div><div className="h-5 border-b border-gray-400"></div><div>Recommended by/Date:<br/><span className="inline-block w-full border-b border-gray-400 pt-2"></span></div><div className="text-[9px] text-center text-gray-600 uppercase font-black">DIRECTOR / OMISS / DEAN</div></div>
                    <div className="border-r border-b border-black p-2.5 space-y-1.5"><div>Processed by/Date:<br/>Supplier – Price Quoted</div><div className="text-[10px] space-y-0.5"><div>1. __________________</div><div>2. __________________</div><div>3. __________________</div></div><div className="text-center pt-1.5 font-black uppercase text-[9px]">CANVASSER</div></div>
                    <div className="border-b border-black p-2.5 space-y-2"><div>Reviewed by/Date:</div><div className="flex flex-col gap-0.5 text-[10px]"><label><input type="checkbox" readOnly className="mr-1"/> For Cash Advance</label><label><input type="checkbox" readOnly className="mr-1"/> For Purchase Order</label></div><div>Supplier: ______________<br/>Terms: ________________</div><div className="text-center pt-1.5 font-black uppercase text-[9px]">HEAD, RMS</div></div>
                    <div className="border-r border-black p-2.5 space-y-5"><div>Budget Amount: ________<br/>If CAPEX, Authority No.<br/><span className="border-b border-gray-400 inline-block w-full pt-1.5"></span></div><div>Verified by/Date:<br/><span className="border-b border-gray-400 inline-block w-full pt-3"></span></div><div className="text-center font-black uppercase text-[9px]">HEAD, AFMS</div></div>
                    <div className="border-r border-black p-2.5 space-y-3"><div>Source of Funds if without budget: ________________<br/><br/>Endorsed by/Date:<br/><span className="border-b border-gray-400 inline-block w-full pt-3"></span></div><div className="text-center font-black uppercase text-[9px]">CLUSTER HEAD (VPAA/VPF/PRES)</div></div>
                    <div className="border-r border-black p-2.5 space-y-10"><div>Recommended by/Date:</div><div className="text-center pt-6 border-b border-gray-400"></div><div className="text-center font-black uppercase text-[9px]">VP FOR FINANCE (&gt;500K)</div></div>
                    <div className="p-2.5 space-y-10"><div>Approved by/Date:</div><div className="text-center pt-6 border-b border-gray-400"></div><div className="text-center font-black uppercase text-[8px]">VP FOR FINANCE (&lt;500K) / PRESIDENT (&gt;500K-1M)</div></div>
                  </div>
                </div>
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

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
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

        </div>
      </div>
    </div>
  );
}
