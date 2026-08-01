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
  'Migraine', 'Mouth sore', 'Mumps', 'Muscle pain', 'Nausea/Vomiting',
  'Nosebleed (Epistaxis)', 'Pre-employment', 'Rashes', 'Seizure', 'Skin condition',
  'Sprain', 'Stiff neck', 'Toothache', 'UTI', 'Vaccine site pain', 'Vertigo',
  'Vomiting', 'Wounds (abrasion/laceration/puncture)', 'Others',
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

  const filteredCons = consultations.filter(c => matchesFilter(c.date, filter, customFrom, customTo));
  const filteredCerts = medicalCerts.filter(c => matchesFilter(c.date, filter, customFrom, customTo));
  const days = getDaysInFilter(filter, customFrom, customTo);

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const getConsultationsForDay = (day: string) => consultations.filter(c => c.date === day);
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

  const thCls = "border border-gray-300 px-3 py-2 text-xs font-bold text-left whitespace-nowrap";
  const tdCls = "border border-gray-200 px-3 py-2 text-xs text-gray-700";
  const tdNum = "border border-gray-200 px-3 py-2 text-xs text-center text-gray-700";

  const PrintBar = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ background: '#f8fafd' }}>
      <div className="flex items-center gap-2">
        <img src={uaSeal} alt="UA" className="w-7 h-7 object-contain opacity-70" />
        <div>
          <div className="text-xs font-bold text-gray-700">{title}</div>
          <div className="text-[10px] text-gray-400">University of the Assumption — Medical Clinic • {filterLabel(filter)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Printer size={12} /> Print
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all"
          style={{ background: PRIMARY }}>
          <Download size={12} /> Export PDF
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all"
          style={{ background: '#2E7D32' }}>
          <Download size={12} /> Export Excel
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate, edit, and export clinic reports</p>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['today', 'yesterday', 'week', 'month', 'custom'] as ReportFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={{ background: filter === f ? 'white' : 'transparent', color: filter === f ? PRIMARY : '#6b7280', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {f === 'custom' ? 'Custom' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {filter === 'custom' && (
            <div className="flex items-center gap-2">
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
        {/* Report type selector */}
        <div className="bg-white rounded-xl p-3 space-y-0.5 h-fit" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-2">Report Type</div>
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => setActiveReport(r.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{ background: activeReport === r.id ? `${PRIMARY}10` : 'transparent', color: activeReport === r.id ? PRIMARY : '#6b7280' }}>
              {r.icon}
              <span className="text-xs">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Report content */}
        <div className="lg:col-span-4">

          {/* ── DAILY REPORT ── */}
          {activeReport === 'daily' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`DAILY REPORT — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5">
                {/* UA Header */}
                <div className="text-center mb-4">
                  <div className="font-bold text-sm text-gray-800 uppercase tracking-wide">University of the Assumption College Clinic</div>
                  <div className="text-xs font-bold text-gray-700 mt-1">DAILY REPORT MONTH {MONTH_NAME} {YEAR}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs" style={{ minWidth: 700 }}>
                    <thead>
                      <tr style={{ background: YELLOW }}>
                        <th className={thCls}>DATE</th>
                        <th className={thCls + ' text-center'}>STUDENT</th>
                        <th className={thCls + ' text-center'}>EMPLOYEE</th>
                        <th className={thCls + ' text-center'}>OUTSIDER</th>
                        <th className={thCls + ' text-center'} style={{ background: '#92D050' }}>TOTAL</th>
                        <th className={thCls + ' text-center'}>CONSULTATION</th>
                        <th className={thCls + ' text-center'}>NON-CONSULT</th>
                        <th className={thCls + ' text-center'}>SENT HOME</th>
                        <th className={thCls + ' text-center'}>SENT TO HOSP.</th>
                        <th className={thCls + ' text-center'}>PRE-EMPL.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day, idx) => {
                        const dc = getConsultationsForDay(day);
                        const stu = dc.filter(c => pat(c)?.category === 'Student').length;
                        const emp = dc.filter(c => pat(c)?.category === 'Employee').length;
                        const out = dc.filter(c => pat(c)?.category === 'Outsider').length;
                        const total = dc.length;
                        const consult = dc.filter(c => c.status === 'Consultation').length;
                        const nonConsult = dc.filter(c => c.status === 'Non-Consultation').length;
                        const sentHome = dc.filter(c => c.earlyDismissal).length;
                        const transferred = dc.filter(c => c.transferred).length;
                        return (
                          <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className={tdCls + ' font-medium'}>{day}</td>
                            <td className={tdNum + (stu > 0 ? ' font-semibold' : ' text-gray-300')}>{stu || 0}</td>
                            <td className={tdNum + (emp > 0 ? ' font-semibold' : ' text-gray-300')}>{emp || 0}</td>
                            <td className={tdNum + (out > 0 ? ' font-semibold' : ' text-gray-300')}>{out || 0}</td>
                            <td className={tdNum + ' font-bold'} style={{ background: total > 0 ? '#92D05020' : undefined }}>{total || 0}</td>
                            <td className={tdNum}>{consult || 0}</td>
                            <td className={tdNum}>{nonConsult || 0}</td>
                            <td className={tdNum}>{sentHome || 0}</td>
                            <td className={tdNum}>{transferred || 0}</td>
                            <td className={tdNum}>0</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: YELLOW }}>
                        <td className={tdCls + ' font-bold uppercase'}>TOTAL</td>
                        {(() => {
                          const allDay = days.flatMap(d => getConsultationsForDay(d));
                          const stu = allDay.filter(c => pat(c)?.category === 'Student').length;
                          const emp = allDay.filter(c => pat(c)?.category === 'Employee').length;
                          const out = allDay.filter(c => pat(c)?.category === 'Outsider').length;
                          return (
                            <>
                              <td className={tdNum + ' font-bold border-gray-300'}>{stu}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>{emp}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>{out}</td>
                              <td className={tdNum + ' font-bold border-gray-300'} style={{ background: '#92D05040' }}>{allDay.length}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>{allDay.filter(c => c.status === 'Consultation').length}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>{allDay.filter(c => c.status === 'Non-Consultation').length}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>{allDay.filter(c => c.earlyDismissal).length}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>{allDay.filter(c => c.transferred).length}</td>
                              <td className={tdNum + ' font-bold border-gray-300'}>0</td>
                            </>
                          );
                        })()}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CASES ATTENDED ── */}
          {activeReport === 'cases' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`CASES ATTENDED — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5">
                {/* UA Header matching template */}
                <div className="text-center mb-4 p-3 rounded-lg" style={{ background: '#E8F5E9' }}>
                  <div className="font-bold text-sm text-gray-800 uppercase">University of the Assumption</div>
                  <div className="font-semibold text-xs text-gray-700">COLLEGE MEDICAL CLINIC</div>
                  <div className="text-xs text-gray-600 mt-1">CASES ATTENDED SY: 2025–2026 &nbsp;(STUDENTS &amp; PERSONNEL)&nbsp; MONTH: {MONTH_NAME}&nbsp; YEAR: {YEAR}</div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
                  {([{ id: 'student', label: 'Student' }, { id: 'personnel', label: 'Personnel' }] as { id: typeof casesTab; label: string }[]).map(t => (
                    <button key={t.id} onClick={() => setCasesTab(t.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: casesTab === t.id ? 'white' : 'transparent', color: casesTab === t.id ? PRIMARY : '#6b7280', boxShadow: casesTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: '#E8F5E9' }}>
                        <th className={thCls} style={{ background: '#E8F5E9', minWidth: 260 }}>CASES / COMPLAINTS</th>
                        <th className={thCls + ' text-center'} style={{ background: '#E8F5E9' }}>STUDENT</th>
                        <th className={thCls + ' text-center'} style={{ background: '#E8F5E9' }}>PERSONNEL</th>
                        <th className={thCls + ' text-center'} style={{ background: '#E8F5E9' }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_CASES.map((caseName, i) => {
                        const stu = caseCount(caseName, 'Student');
                        const per = caseCount(caseName, 'Personnel');
                        const tot = stu + per;
                        // Grey out when no data but still show row (matching template)
                        const hasData = tot > 0;
                        const highlight = casesTab === 'student' ? stu > 0 : per > 0;
                        return (
                          <tr key={caseName} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                            style={{ opacity: !hasData ? 0.5 : 1 }}>
                            <td className={tdCls}
                              style={{ color: highlight ? '#1B3A6B' : undefined, fontWeight: highlight ? 600 : undefined }}>
                              {caseName}
                            </td>
                            <td className={tdNum}
                              style={{ color: casesTab === 'student' && stu > 0 ? PRIMARY : undefined, fontWeight: casesTab === 'student' && stu > 0 ? 700 : undefined }}>
                              {stu > 0 ? stu : ''}
                            </td>
                            <td className={tdNum}
                              style={{ color: casesTab === 'personnel' && per > 0 ? '#2E7D32' : undefined, fontWeight: casesTab === 'personnel' && per > 0 ? 700 : undefined }}>
                              {per > 0 ? per : ''}
                            </td>
                            <td className={tdNum + ' font-bold'}>{tot > 0 ? tot : 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: YELLOW }}>
                        <td className={tdCls + ' font-bold uppercase'}>TOTAL</td>
                        <td className={tdNum + ' font-bold border-gray-300'}>
                          {filteredCons.filter(c => pat(c)?.category === 'Student').length}
                        </td>
                        <td className={tdNum + ' font-bold border-gray-300'}>
                          {filteredCons.filter(c => pat(c)?.category === 'Employee' || pat(c)?.category === 'Outsider').length}
                        </td>
                        <td className={tdNum + ' font-bold border-gray-300'}>{filteredCons.length}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── MEDICAL CERTIFICATE REPORT ── */}
          {activeReport === 'medcert' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`MEDICAL CERTIFICATE ISSUANCE — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: YELLOW }}>
                        {['#', 'Date', 'Patient Name', 'Category', 'Purpose', 'Diagnosis', 'Doctor', 'Issued By'].map(h => (
                          <th key={h} className={thCls + ' text-center'}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCerts.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-8 text-gray-400 border border-gray-200">No medical certificates for this period</td></tr>
                      ) : filteredCerts.map((cert, i) => {
                        const p = getPatient(cert.patientId);
                        return (
                          <tr key={cert.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className={tdNum}>{i + 1}</td>
                            <td className={tdCls}>{cert.date}</td>
                            <td className={tdCls + ' font-medium'}>{p?.name}</td>
                            <td className={tdNum}>{p?.category}</td>
                            <td className={tdCls}>{cert.purpose}</td>
                            <td className={tdCls}>{cert.diagnosis || '—'}</td>
                            <td className={tdCls}>{cert.doctor}</td>
                            <td className={tdCls}>{cert.issuedBy}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: YELLOW }}>
                        <td className={thCls + ' text-center'} colSpan={3}>TOTAL CERTIFICATES: {filteredCerts.length}</td>
                        <td className={tdNum + ' font-bold border-gray-300'}>
                          {filteredCerts.filter(c => getPatient(c.patientId)?.category === 'Student').length} students
                        </td>
                        <td className={tdNum + ' font-bold border-gray-300'} colSpan={4}>
                          {filteredCerts.filter(c => getPatient(c.patientId)?.category !== 'Student').length} personnel
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── NON-CONSULTATION REPORT ── */}
          {activeReport === 'nonconsult' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`NON-CONSULTATION REPORT — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: YELLOW }}>
                        {['#', 'Date', 'Time In', 'Patient Name', 'Category', 'Complaint', 'Treatment Given', 'Nurse Notes'].map(h => (
                          <th key={h} className={thCls}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const nc = filteredCons.filter(c => c.status === 'Non-Consultation');
                        return nc.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-8 text-gray-400 border border-gray-200">No non-consultation records for this period</td></tr>
                        ) : nc.map((c, i) => {
                          const p = getPatient(c.patientId);
                          return (
                            <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className={tdNum}>{i + 1}</td>
                              <td className={tdCls}>{c.date}</td>
                              <td className={tdCls}>{c.timeIn}</td>
                              <td className={tdCls + ' font-medium'}>{p?.name}</td>
                              <td className={tdCls}>{p?.category}</td>
                              <td className={tdCls}>{c.complaint}</td>
                              <td className={tdCls}>{c.treatments.map(t => `${t.medicineName} ×${t.quantity}`).join(', ') || '—'}</td>
                              <td className={tdCls}>{c.nurseNotes || '—'}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: YELLOW }}>
                        <td className={thCls} colSpan={8}>TOTAL: {filteredCons.filter(c => c.status === 'Non-Consultation').length} records</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── INVENTORY REPORT ── */}
          {activeReport === 'inventory' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`INVENTORY / MEDICINE USAGE — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5">
                <div className="text-center mb-4">
                  <div className="font-bold text-sm text-gray-800 uppercase">University of the Assumption College Clinic</div>
                  <div className="text-xs font-bold text-gray-600 mt-0.5">Monthly Inventory of Medicines (Inclusive Dates): {MONTH_NAME} {YEAR}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: YELLOW }}>
                        <th className={thCls + ' text-center'}>No.</th>
                        <th className={thCls} style={{ minWidth: 200 }}>Medicine</th>
                        <th className={thCls + ' text-center'}>Beginning Inventory</th>
                        <th className={thCls + ' text-center'}>Total Consumption</th>
                        <th className={thCls + ' text-center'} style={{ background: '#92D050' }}>Ending Inventory</th>
                        <th className={thCls + ' text-center'}>Status</th>
                        <th className={thCls + ' text-center'}>EXPIRATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((m, i) => {
                        const beginning = m.stockHistory.find(h => h.type === 'add')?.qty || 0;
                        const consumed = m.stockHistory.filter(h => h.type === 'dispense').reduce((s, h) => s + h.qty, 0);
                        const noStock = m.stock === 0;
                        return (
                          <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                            style={{ background: noStock ? '#FFE0E0' : undefined }}>
                            <td className={tdNum}>{i + 1}</td>
                            <td className={tdCls + ' font-medium'} style={{ color: m.status === 'Low Stock' ? RED : undefined }}>{m.name}</td>
                            <td className={tdNum}>{beginning}</td>
                            <td className={tdNum}>{consumed}</td>
                            <td className={tdNum + ' font-bold'} style={{ background: noStock ? '#FFE0E060' : '#92D05015' }}>{m.stock}</td>
                            <td className={tdNum}>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: m.status === 'Normal' ? '#E8F5E9' : `${RED}15`, color: m.status === 'Normal' ? '#2E7D32' : RED }}>
                                {m.status}
                              </span>
                            </td>
                            <td className={tdNum}>{noStock ? <span className="font-bold" style={{ color: RED }}>NO STOCK</span> : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PURCHASE REQUEST REPORT ── */}
          {activeReport === 'purchase' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`PURCHASE REQUEST REPORT — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: YELLOW }}>
                        {['PR #', 'Date', 'Medicine', 'Requested Qty', 'Received Qty', 'Balance', 'Status', 'History'].map(h => (
                          <th key={h} className={thCls + ' text-center'}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseRequests.filter(pr => matchesFilter(pr.date, filter, customFrom, customTo)).map((pr, i) => (
                        <tr key={pr.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className={tdCls + ' font-mono text-[10px]'}>{pr.id}</td>
                          <td className={tdCls}>{pr.date}</td>
                          <td className={tdCls + ' font-medium'}>{pr.medicine}</td>
                          <td className={tdNum}>{pr.requestedQty}</td>
                          <td className={tdNum}>{pr.receivedQty}</td>
                          <td className={tdNum + ' font-semibold'}>{pr.requestedQty - pr.receivedQty}</td>
                          <td className={tdNum}>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                background: pr.status === 'Complete' ? '#E8F5E9' : pr.status === 'Partial' ? '#E3F2FD' : `${YELLOW}30`,
                                color: pr.status === 'Complete' ? '#2E7D32' : pr.status === 'Partial' ? PRIMARY : '#92700f',
                              }}>
                              {pr.status}
                            </span>
                          </td>
                          <td className={tdCls + ' text-[10px]'}>
                            {pr.history.map(h => `${h.date}: ${h.note}`).join(' | ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BED MANAGEMENT REPORT ── */}
          {activeReport === 'bed' && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <PrintBar title={`BED MANAGEMENT REPORT — ${MONTH_NAME} ${YEAR}`} />
              <div className="p-5 space-y-6">
                {/* Summary per bed */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Usage Summary per Bed</div>
                  <div className="grid grid-cols-4 gap-3">
                    {beds.map(bed => {
                      const allHistory = [
                        ...bed.history,
                        ...(bed.status === 'Occupied' ? [{ patientName: bed.patientName || '', date: TODAY, timeIn: '', timeOut: '(current)', duration: '' }] : []),
                      ];
                      const filtered = allHistory.filter(h => matchesFilter(h.date, filter, customFrom, customTo));
                      return (
                        <div key={bed.id} className="border border-gray-100 rounded-xl p-3 text-center" style={{ background: filtered.length > 0 ? `${PRIMARY}04` : 'white' }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <BedDouble size={14} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">Bed {bed.bedNumber}</span>
                          </div>
                          <div className="text-xl font-black" style={{ color: PRIMARY }}>{filtered.length}</div>
                          <div className="text-[10px] text-gray-400">patient{filtered.length !== 1 ? 's' : ''}</div>
                          <div className="text-[10px] mt-1 font-medium"
                            style={{ color: bed.status === 'Occupied' ? RED : '#2E7D32' }}>
                            {bed.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed per-bed history */}
                {beds.map(bed => {
                  const allHistory = [
                    ...bed.history,
                    ...(bed.status === 'Occupied' ? [{
                      patientName: bed.patientName || '',
                      patientId: bed.patientId || '',
                      date: TODAY,
                      timeIn: bed.timeOccupied ? new Date(bed.timeOccupied).toTimeString().slice(0, 5) : '—',
                      timeOut: '(current)',
                      duration: '—',
                    }] : []),
                  ].filter(h => matchesFilter(h.date, filter, customFrom, customTo));
                  if (allHistory.length === 0) return null;
                  return (
                    <div key={bed.id}>
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                        style={{ color: PRIMARY }}>
                        ▸ Bed {bed.bedNumber}
                      </div>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr style={{ background: '#E3F2FD' }}>
                            {['#', 'Patient Name', 'Date', 'Time In', 'Time Out', 'Duration'].map(h => (
                              <th key={h} className={thCls}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allHistory.map((h, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className={tdNum}>{i + 1}</td>
                              <td className={tdCls + ' font-medium'}>{h.patientName}</td>
                              <td className={tdCls}>{h.date}</td>
                              <td className={tdCls}>{h.timeIn}</td>
                              <td className={tdCls}>
                                {h.timeOut === '(current)'
                                  ? <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: `${RED}15`, color: RED }}>Current</span>
                                  : h.timeOut}
                              </td>
                              <td className={tdCls}>{h.duration === '—' || h.timeOut === '(current)' ? '—' : h.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
