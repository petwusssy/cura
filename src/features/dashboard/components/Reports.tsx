import { useState, useMemo } from 'react';
import { Printer, Download, Calendar, CheckCircle2, X } from 'lucide-react';
import { Patient, Consultation, MedicineItem, PurchaseRequest } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';

const PRIMARY = '#1B3A6B';

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

type ReportType = 'daily' | 'cases' | 'supplies_inv' | 'medicines_inv' | 'prf_form';

interface ReportsProps {
  patients: Patient[];
  consultations: Consultation[];
  medicines: MedicineItem[];
  purchaseRequests: PurchaseRequest[];
}

export function Reports({ patients, consultations, medicines, purchaseRequests }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>('MAY 2026');
  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 4000);
  };

  const reportTabs = [
    { id: 'daily' as ReportType, label: '📊 Daily Census Report', desc: 'Daily breakdown by College, SHS, JHS, GS, Faculty & Disposition' },
    { id: 'cases' as ReportType, label: '🩺 Cases & Complains Attended', desc: 'Complete SY 2025-2026 morbidity report by Student vs. Personnel' },
    { id: 'supplies_inv' as ReportType, label: '🩹 Monthly Supplies Inventory', desc: 'Inclusive consumption tracking for 32 clinic supplies with 5-day intervals' },
    { id: 'medicines_inv' as ReportType, label: '💊 Monthly Medicines Inventory', desc: 'Full pharmaceutical spreadsheet with daily consumption & stock alerts' },
    { id: 'prf_form' as ReportType, label: '📋 Purchase Requisition (PRF)', desc: 'Official clinic supply requisition authorization form document' },
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
          <td key={`cell-${i}`} className="border border-black px-1.5 py-1 text-center font-bold text-xs bg-white text-gray-900 min-w-[24px]">
            {val > 0 ? val : ''}
          </td>
        );
      }
      blocks.push(
        <td key={`subtot-${idx}`} className="border border-black px-2 py-1 text-center font-extrabold text-xs bg-[#F8CBAD] text-black font-mono shadow-inner min-w-[32px]">
          {subTotal > 0 ? subTotal : 0}
        </td>
      );
    });
    return blocks;
  };

  const dailyReportData = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    let totColl = 0, totShs = 0, totJhs = 0, totGs = 0, totEmp = 0, totGrand = 0;
    let totCons = 0, totHome = 0, totHosp = 0, totPre = 0, totVis = 0;

    const rows = days.map(day => {
      const isWeekend = day % 7 === 2 || day % 7 === 3;
      if (isWeekend) {
        return { date: `${day}-${selectedMonth.slice(0, 3)}-${selectedMonth.slice(-2)}`, coll: 0, shs: 0, jhs: 0, gs: 0, emp: 0, total: 0, cons: 0, home: 0, hosp: 0, pre: 0, vis: 0 };
      }
      const coll = Math.floor(Math.random() * 25) + 12;
      const shs = Math.floor(Math.random() * 18) + 5;
      const jhs = Math.floor(Math.random() * 4);
      const gs = Math.floor(Math.random() * 2);
      const emp = Math.floor(Math.random() * 6) + 1;
      const total = coll + shs + jhs + gs + emp;
      const cons = Math.floor(total * 0.15);
      const home = Math.floor(total * 0.12);
      const hosp = day === 14 || day === 22 ? 1 : 0;
      const pre = day === 1 ? 4 : 0;
      const vis = day % 5 === 0 ? 1 : 0;

      totColl += coll; totShs += shs; totJhs += jhs; totGs += gs; totEmp += emp; totGrand += total;
      totCons += cons; totHome += home; totHosp += hosp; totPre += pre; totVis += vis;

      return { date: `${day}-${selectedMonth.slice(0, 3)}-${selectedMonth.slice(-2)}`, coll, shs, jhs, gs, emp, total, cons, home, hosp, pre, vis };
    });

    return { rows, totals: { totColl, totShs, totJhs, totGs, totEmp, totGrand, totCons, totHome, totHosp, totPre, totVis } };
  }, [selectedMonth]);

  const casesData = useMemo(() => {
    let sumStu = 0, sumEmp = 0, sumTotal = 0;
    const items = ALL_CASES.map((c, index) => {
      let stu = 0, emp = 0;
      if (['Headache', 'Colds', 'Fever', 'Cough', 'Blister', 'Abdominal Pain/Stomachache', 'Dysmenorrhea', 'Wounds (abrasion,laceration,puncture)'].includes(c)) {
        stu = Math.floor(Math.random() * 80) + 40;
        emp = Math.floor(Math.random() * 12) + 2;
      } else if (['Hypertension', 'Gastritis/Hyperacidity/epigastric pain/heartburn', 'Allergy', 'Body pain', 'Sore throat'].includes(c)) {
        stu = Math.floor(Math.random() * 35) + 10;
        emp = Math.floor(Math.random() * 15) + 5;
      } else if (index % 4 === 0) {
        stu = Math.floor(Math.random() * 5);
        emp = Math.floor(Math.random() * 2);
      }
      const total = stu + emp;
      sumStu += stu; sumEmp += emp; sumTotal += total;
      return { name: c, stu, emp, total };
    });
    return { items, sumStu, sumEmp, sumTotal };
  }, [selectedMonth]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1700px] mx-auto min-h-screen bg-[#F8FAFC]">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-report-section, #printable-report-section * { visibility: visible !important; }
          #printable-report-section { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0.2in !important; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
          table { page-break-inside: auto !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; }
          @page { size: landscape; margin: 0.3in; }
        }
      `}</style>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{showToast}</span>
          <button onClick={() => setShowToast(null)} className="text-gray-400 hover:text-white ml-2"><X size={16} /></button>
        </div>
      )}

      <div className="no-print flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: PRIMARY }}>Clinic Reports & Census System</h1>
          <p className="text-sm text-gray-500 mt-1">Official University of the Assumption spreadsheet format templates with multi-day consumption grouping.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs">
            <Calendar size={16} className="text-[#1B3A6B]" />
            <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); triggerToast(`Updated reports data for ${e.target.value}.`); }} className="font-black text-sm text-gray-900 bg-transparent focus:outline-none cursor-pointer">
              <option value="MAY 2026">May 2026</option>
              <option value="JUNE 2026">June 2026</option>
              <option value="AUGUST 2025">August 2025</option>
              <option value="SEPTEMBER 2025">September 2025</option>
              <option value="OCTOBER 2025">October 2025</option>
              <option value="NOVEMBER 2025">November 2025</option>
              <option value="DECEMBER 2025">December 2025</option>
              <option value="JANUARY 2026">January 2026</option>
              <option value="FEBRUARY 2026">February 2026</option>
              <option value="MARCH 2026">March 2026</option>
              <option value="APRIL 2026">April 2026</option>
            </select>
          </div>
          <button onClick={() => triggerToast(`Exporting ${selectedMonth} spreadsheet as Excel workbook...`)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2E7D32] text-white font-black text-xs shadow-md transition-all active:scale-95"><Download size={16} /> Export Excel / CSV</button>
          <button onClick={() => { triggerToast('Opening formatted spreadsheet print view...'); setTimeout(() => window.print(), 300); }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-white font-black text-xs shadow-md transition-all active:scale-95" style={{ background: PRIMARY }}><Printer size={16} /> Print / Save PDF</button>
        </div>
      </div>

      <div className="no-print flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 no-scrollbar">
        {reportTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveReport(tab.id)} className={`flex flex-col items-start px-5 py-3 rounded-2xl border transition-all flex-shrink-0 cursor-pointer ${activeReport === tab.id ? 'bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-lg scale-[1.02]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
            <div className="text-sm font-black tracking-tight">{tab.label}</div>
            <div className={`text-[11px] font-medium mt-0.5 max-w-[240px] truncate ${activeReport === tab.id ? 'text-blue-200' : 'text-gray-400'}`}>{tab.desc}</div>
          </button>
        ))}
      </div>

      <div id="printable-report-section" className="bg-white rounded-3xl border border-gray-300 shadow-xl p-6 md:p-8 overflow-x-auto">
        {activeReport === 'daily' && (
          <div className="min-w-[1100px] animate-in fade-in duration-300">
            <table className="w-full border-collapse border-2 border-black font-sans text-xs">
              <thead>
                <tr><th colSpan={12} className="bg-[#B8CCE4] text-black font-black text-lg text-center py-2.5 uppercase tracking-wide border-2 border-black">DAILY REPORT {selectedMonth}</th></tr>
                <tr className="bg-[#FFE699] text-black font-black uppercase text-center border-2 border-black">
                  <th className="border-2 border-black py-2 px-3 w-28">DATE</th><th className="border border-black py-2 px-3">COLLEGE</th><th className="border border-black py-2 px-3">SHS</th><th className="border border-black py-2 px-3">JHS</th><th className="border border-black py-2 px-3">GS</th><th className="border border-black py-2 px-3">EMPLOYEE</th><th className="border-2 border-black py-2 px-4 bg-[#FFE699] text-black font-extrabold text-sm">TOTAL</th><th className="border border-black py-2 px-3">CONSULTATION</th><th className="border border-black py-2 px-3">SENT HOME</th><th className="border border-black py-2 px-3">SENT TO HOSPITAL</th><th className="border border-black py-2 px-3">PRE- EMPLOYMENT</th><th className="border border-black py-2 px-3">VISITOR</th>
                </tr>
              </thead>
              <tbody>
                {dailyReportData.rows.map((row, idx) => (
                  <tr key={row.date} className={`border border-black text-center font-bold ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="border border-black py-1.5 px-3 font-extrabold text-gray-900 font-mono">{row.date}</td>
                    <td className="border border-black py-1.5 px-2 text-gray-800">{row.coll || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.shs || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.jhs || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.gs || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.emp || ''}</td>
                    <td className="border-2 border-black py-1.5 px-3 bg-[#FFE699]/30 font-black text-gray-950 font-mono text-sm">{row.total || ''}</td>
                    <td className="border border-black py-1.5 px-2 text-gray-800">{row.cons || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.home || ''}</td><td className="border border-black py-1.5 px-2 text-red-600 font-black">{row.hosp || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.pre || ''}</td><td className="border border-black py-1.5 px-2 text-gray-800">{row.vis || ''}</td>
                  </tr>
                ))}
                <tr className="bg-[#FFE699] text-black font-black text-center border-2 border-black text-sm">
                  <td className="border-2 border-black py-2 px-3">TOTAL</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totColl}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totShs}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totJhs}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totGs}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totEmp}</td><td className="border-2 border-black py-2 px-3 bg-[#FFC000] text-black font-mono text-base">{dailyReportData.totals.totGrand}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totCons}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totHome}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totHosp}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totPre}</td><td className="border border-black py-2 px-2">{dailyReportData.totals.totVis}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'cases' && (
          <div className="max-w-[1000px] mx-auto animate-in fade-in duration-300">
            <table className="w-full border-collapse border-2 border-black font-sans text-sm">
              <thead>
                <tr><th colSpan={4} className="bg-[#C6E0B4] text-black border-2 border-black p-4 text-center font-black"><div className="text-lg tracking-wide uppercase">UNIVERSITY OF THE ASSUMPTION</div><div className="text-base uppercase tracking-wider font-extrabold">COLLEGE MEDICAL CLINIC</div><div className="text-sm font-extrabold mt-1 uppercase">CASES ATTENDED SY: 2025-2026 (STUDENTS & PERSONNEL) MONTH: {selectedMonth.split(' ')[0]} YEAR: {selectedMonth.split(' ')[1] || '2026'}</div></th></tr>
                <tr className="bg-[#FFE699] text-black font-black uppercase text-center border-2 border-black text-xs"><th className="border-2 border-black py-2 px-4 text-left w-1/2">CASES / COMPLAINS</th><th className="border border-black py-2 px-4">STUDENT</th><th className="border border-black py-2 px-4">PERSONNEL</th><th className="border-2 border-black py-2 px-4 bg-[#FFC000]">TOTAL</th></tr>
              </thead>
              <tbody>
                {casesData.items.map((c, index) => (
                  <tr key={c.name} className={`border border-black font-bold ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} text-xs`}><td className="border border-black py-1.5 px-4">{c.name}</td><td className="border border-black py-1.5 px-4 text-center">{c.stu || ''}</td><td className="border border-black py-1.5 px-4 text-center">{c.emp || ''}</td><td className="border-2 border-black py-1.5 px-4 text-center font-extrabold bg-amber-50/30">{c.total || ''}</td></tr>
                ))}
                <tr className="bg-[#C6E0B4] text-black font-black text-center border-2 border-black text-sm"><td className="border-2 border-black py-2 px-4 text-left">TOTAL CASES ATTENDED</td><td className="border border-black py-2 px-4">{casesData.sumStu}</td><td className="border border-black py-2 px-4">{casesData.sumEmp}</td><td className="border-2 border-black py-2 px-4 bg-[#A9D18E]">{casesData.sumTotal}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'supplies_inv' && (
          <div className="min-w-[1550px] animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center pb-4 text-center">
              <h2 className="bg-[#D9E1F2] text-black font-black text-xl px-12 py-2.5 rounded border-2 border-black tracking-wider uppercase shadow-xs">UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC</h2>
              <div className="flex items-center gap-2 mt-3 font-extrabold text-base text-gray-900"><span>Monthly Inventory of Supplies (Inclusive Dates):</span><span className="underline decoration-black underline-offset-4 px-2 font-mono font-black text-lg">{selectedMonth.slice(0, 3)}-26</span></div>
            </div>
            <table className="w-full border-collapse border-2 border-black font-sans text-xs mt-2">
              <thead>
                <tr className="text-black font-extrabold border-2 border-black text-center text-[11px]">
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#FFFF00] w-10">No.</th>
                  <th rowSpan={2} className="border-2 border-black px-4 py-2 bg-[#A9D18E] text-left w-64">Supplies</th>
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#C6E0B4] w-20">Beginning<br/>Inventory</th>
                  <th colSpan={37} className="border-2 border-black py-1 bg-[#FCE4D6] uppercase tracking-wider text-sm font-black">Consumption/s (1 - 31)</th>
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#A9D18E] w-20">Ending<br/>Inventory</th>
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#9DC3E6] w-24 text-sm font-black">Sum Total<br/>Consumption</th>
                </tr>
                <tr className="text-black font-bold border border-black text-center text-[10px] bg-gray-100">
                  <th className="border border-black px-1">1</th><th className="border border-black px-1">2</th><th className="border border-black px-1">3</th><th className="border border-black px-1">4</th><th className="border border-black px-1">5</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">6</th><th className="border border-black px-1">7</th><th className="border border-black px-1">8</th><th className="border border-black px-1">9</th><th className="border border-black px-1">10</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">11</th><th className="border border-black px-1">12</th><th className="border border-black px-1">13</th><th className="border border-black px-1">14</th><th className="border border-black px-1">15</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">16</th><th className="border border-black px-1">17</th><th className="border border-black px-1">18</th><th className="border border-black px-1">19</th><th className="border border-black px-1">20</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">21</th><th className="border border-black px-1">22</th><th className="border border-black px-1">23</th><th className="border border-black px-1">24</th><th className="border border-black px-1">25</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">26</th><th className="border border-black px-1">27</th><th className="border border-black px-1">28</th><th className="border border-black px-1">29</th><th className="border border-black px-1">30</th><th className="border border-black px-1">31</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                </tr>
              </thead>
              <tbody>
                {SUPPLIES_LIST.map(sup => (
                  <tr key={sup.no} className="border border-black hover:bg-amber-50/40 text-xs font-semibold">
                    <td className="border-2 border-black py-1 px-1 text-center font-bold bg-[#FFFF99] font-mono">{sup.no}</td>
                    <td className="border-2 border-black py-1 px-2 font-black bg-[#E2EFDA] text-left whitespace-nowrap">{sup.name}</td>
                    <td className="border-2 border-black py-1 px-2 text-center font-black font-mono bg-[#A9D18E]/60">{sup.beg}</td>
                    {renderConsumptionCells(sup.consumed)}
                    <td className="border-2 border-black py-1 px-2 text-center font-black font-mono bg-[#A9D18E]">{sup.end}</td>
                    <td className="border-2 border-black py-1 px-2 text-center font-black font-mono bg-[#9DC3E6] text-sm">{sup.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'medicines_inv' && (
          <div className="min-w-[1600px] animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center pb-4 text-center">
              <h2 className="bg-[#D9E1F2] text-black font-black text-xl px-12 py-2 rounded border-2 border-black tracking-wider uppercase shadow-xs">UNIVERSITY OF THE ASSUMPTION COLLEGE CLINIC</h2>
              <div className="flex items-center gap-3 mt-3 font-extrabold text-base text-gray-900"><span>Monthly Inventory of Medicines (Inclusive Dates):</span><span className="underline decoration-black underline-offset-4 px-2 font-mono font-black text-lg">{selectedMonth.slice(0, 3)}-26</span></div>
            </div>
            <table className="w-full border-collapse border-2 border-black font-sans text-xs mt-2">
              <thead>
                <tr className="text-black font-extrabold border-2 border-black text-center text-[11px]">
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#CCC0DA] w-10">No.</th>
                  <th rowSpan={2} className="border-2 border-black px-4 py-2 bg-[#CCC0DA] text-left w-64">Medicine</th>
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#FFF2CC] w-20">Beginning<br/>Inventory</th>
                  <th colSpan={37} className="border-2 border-black py-1 bg-[#D9E1F2] uppercase tracking-wider text-sm font-black">Consumption/s (1 - 31)</th>
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#A9D18E] w-20">Ending<br/>Inventory</th>
                  <th rowSpan={2} className="border-2 border-black px-2 py-2 bg-[#2FA4E7] text-white w-24 text-sm font-black">Sum Total<br/>Consumption</th>
                  <th rowSpan={2} className="border-2 border-black px-3 py-2 bg-[#FFC000] text-black w-28 font-black">EXPIRATION</th>
                </tr>
                <tr className="text-black font-bold border border-black text-center text-[10px] bg-gray-100">
                  <th className="border border-black px-1">1</th><th className="border border-black px-1">2</th><th className="border border-black px-1">3</th><th className="border border-black px-1">4</th><th className="border border-black px-1">5</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">6</th><th className="border border-black px-1">7</th><th className="border border-black px-1">8</th><th className="border border-black px-1">9</th><th className="border border-black px-1">10</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">11</th><th className="border border-black px-1">12</th><th className="border border-black px-1">13</th><th className="border border-black px-1">14</th><th className="border border-black px-1">15</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">16</th><th className="border border-black px-1">17</th><th className="border border-black px-1">18</th><th className="border border-black px-1">19</th><th className="border border-black px-1">20</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">21</th><th className="border border-black px-1">22</th><th className="border border-black px-1">23</th><th className="border border-black px-1">24</th><th className="border border-black px-1">25</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                  <th className="border border-black px-1">26</th><th className="border border-black px-1">27</th><th className="border border-black px-1">28</th><th className="border border-black px-1">29</th><th className="border border-black px-1">30</th><th className="border border-black px-1">31</th><th className="border border-black px-1.5 bg-[#ED7D31] text-white font-black">Total</th>
                </tr>
              </thead>
              <tbody>
                {MEDICINE_INVENTORY_TEMPLATE.map(med => (
                  <tr key={med.no} className={`border border-black text-xs font-semibold ${med.status === 'NO STOCK' ? 'bg-[#F2DCDB]' : 'hover:bg-blue-50/30'}`}>
                    <td className={`border-2 border-black py-1 px-1 text-center font-extrabold font-mono ${med.status === 'NO STOCK' ? 'bg-[#E6B8B7] text-black' : 'bg-[#FFFF00] text-black'}`}>{med.no}</td>
                    <td className={`border-2 border-black py-1 px-2 font-black text-left whitespace-nowrap ${med.status === 'NO STOCK' ? 'bg-[#EA9999] text-gray-900' : 'bg-[#FFFF99] text-gray-950'}`}>{med.name}</td>
                    <td className="border-2 border-black py-1 px-2 text-center font-black font-mono bg-[#A9D18E]">{med.beg}</td>
                    {renderConsumptionCells(med.c)}
                    <td className="border-2 border-black py-1 px-2 text-center font-black font-mono bg-[#A9D18E]">{med.end}</td>
                    <td className="border-2 border-black py-1 px-2 text-center font-black font-mono bg-[#92CDD3] text-sm">{med.total}</td>
                    <td className={`border-2 border-black py-1 px-2 text-center font-extrabold ${med.status === 'NO STOCK' ? 'bg-[#EA9999] text-black tracking-wider text-xs font-black' : 'bg-white text-gray-600'}`}>{med.status || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'prf_form' && (
          <div className="max-w-[920px] mx-auto bg-white border-2 border-gray-400 p-12 shadow-2xl font-sans text-black animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
              <div className="flex items-center gap-4"><img src={uaSeal} alt="UA Seal" className="w-20 h-20 object-contain" /><div><h2 className="text-3xl font-extrabold text-[#002060] font-serif">UNIVERSITY <span className="font-normal italic text-xl">of the</span> ASSUMPTION</h2><p className="text-sm font-bold text-gray-700">Unisite Subd., Del Pilar, City of San Fernando, Pampanga</p></div></div>
              <div className="text-right font-bold text-base font-mono">PRF No. <span className="underline decoration-2 font-black">2026-008</span></div>
            </div>

            <div className="text-center pb-4">
              <h3 className="text-xl font-black uppercase tracking-wider underline decoration-2">PURCHASE REQUISITION FORM (PRF)</h3>
              <p className="text-[11px] italic text-gray-600 max-w-2xl mx-auto mt-1 leading-relaxed">Note: To be used when requesting for the purchase of office and school supplies, computer and IT peripherals, laboratory equipment and supplies, library books and learning resources, construction materials, furniture and fixtures which are not available at the Central Supplies Room and Physical Plant Warehouse.</p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold italic mb-2 text-gray-700">
              <span>(Please fill up in two copies. Copy distribution: original copy to RMS, duplicate copy to Requesting Party)</span>
              <span className="text-sm not-italic font-black text-black">DEPARTMENT: <strong className="underline decoration-black text-base">Medical-Dental Clinic</strong></span>
            </div>

            <table className="w-full border-collapse border-2 border-black mb-6 text-xs font-bold">
              <thead>
                <tr className="bg-gray-100 border-2 border-black text-center uppercase">
                  <th className="border border-black py-2 px-3 w-24">QUANTITY</th><th className="border border-black py-2 px-3 w-20">Unit</th><th className="border border-black py-2 px-4 text-left w-56">ITEM</th><th className="border border-black py-2 px-4 text-left">DESCRIPTION (Color/Size/Brand/Tech Specs)</th><th className="border border-black py-2 px-2 w-20">Unit Price</th><th className="border border-black py-2 px-3 w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                <tr><td className="border border-black text-center py-2 font-mono">2</td><td className="border border-black text-center">Gallon</td><td className="border border-black px-3">70% Alcohol</td><td className="border border-black px-3">Green cross Alcohol</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">40</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-3">Citirizine Dihydrochloride 10mg</td><td className="border border-black px-3">Alnix</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">300</td><td className="border border-black text-center">Sachet</td><td className="border border-black px-3">Oral rehydration Salts</td><td className="border border-black px-3">Hydrite</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">20</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-3">Domperidone 10mg Tablet</td><td className="border border-black px-3">Motilium</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">30</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-3">Pantoplus 40mg/30mg Tablet</td><td className="border border-black px-3">Pantoplus</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">20</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-3">Betahistine Dihydrochloride 16mg</td><td className="border border-black px-3">Serc</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">10</td><td className="border border-black text-center">Tablet</td><td className="border border-black px-3">Clonidine 75 mcg /tablet</td><td className="border border-black px-3">Catapress</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">3</td><td className="border border-black text-center">pack</td><td className="border border-black px-3">Band aid 100s</td><td className="border border-black px-3">Band aid 100s</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">10</td><td className="border border-black text-center">pc</td><td className="border border-black px-3">Elastic Bandage</td><td className="border border-black px-3">2 inches</td><td className="border border-black"></td><td className="border border-black"></td></tr>
                <tr><td className="border border-black text-center py-2 font-mono">15</td><td className="border border-black text-center">pc</td><td className="border border-black px-3">Correction Tape</td><td className="border border-black px-3">Standard clinic stationary</td><td className="border border-black"></td><td className="border border-black"></td></tr>
              </tbody>
            </table>

            <div className="grid grid-cols-4 border-2 border-black text-xs font-bold">
              <div className="border-r border-b border-black p-3 space-y-6"><div>Prepared by/Date:<br/><strong className="text-sm underline">Abigael C. Landingin</strong></div><div className="text-center pt-4 border-t border-dashed border-gray-400">REQUESTING PARTY</div></div>
              <div className="border-r border-b border-black p-3 space-y-3 col-span-1"><div>Evaluation Remarks:</div><div className="h-6 border-b border-gray-400"></div><div>Recommended by/Date:<br/><span className="inline-block w-full border-b border-gray-400 pt-3"></span></div><div className="text-[10px] text-center text-gray-600 uppercase font-black">DIRECTOR / OMISS / DEAN</div></div>
              <div className="border-r border-b border-black p-3 space-y-2"><div>Processed by/Date:<br/>Supplier – Price Quoted</div><div className="text-[11px] space-y-1"><div>1. __________________</div><div>2. __________________</div><div>3. __________________</div></div><div className="text-center pt-2 font-black uppercase text-[10px]">CANVASSER</div></div>
              <div className="border-b border-black p-3 space-y-3"><div>Reviewed by/Date:</div><div className="flex flex-col gap-1 text-[11px]"><label><input type="checkbox" readOnly className="mr-1"/> For Cash Advance</label><label><input type="checkbox" readOnly className="mr-1"/> For Purchase Order</label></div><div>Supplier: ______________<br/>Terms: ________________</div><div className="text-center pt-2 font-black uppercase text-[10px]">HEAD, RMS</div></div>
              <div className="border-r border-black p-3 space-y-6"><div>Budget Amount: ________<br/>If CAPEX, Authority No.<br/><span className="border-b border-gray-400 inline-block w-full pt-2"></span></div><div>Verified by/Date:<br/><span className="border-b border-gray-400 inline-block w-full pt-4"></span></div><div className="text-center font-black uppercase text-[10px]">HEAD, AFMS</div></div>
              <div className="border-r border-black p-3 space-y-4"><div>Source of Funds if without budget: ________________<br/><br/>Endorsed by/Date:<br/><span className="border-b border-gray-400 inline-block w-full pt-4"></span></div><div className="text-center font-black uppercase text-[10px]">CLUSTER HEAD (VPAA/VPF/PRES)</div></div>
              <div className="border-r border-black p-3 space-y-12"><div>Recommended by/Date:</div><div className="text-center pt-8 border-b border-gray-400"></div><div className="text-center font-black uppercase text-[10px]">VP FOR FINANCE (&gt;500K)</div></div>
              <div className="p-3 space-y-12"><div>Approved by/Date:</div><div className="text-center pt-8 border-b border-gray-400"></div><div className="text-center font-black uppercase text-[9px]">VP FOR FINANCE (&lt;500K) / PRESIDENT (&gt;500K-1M)</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
