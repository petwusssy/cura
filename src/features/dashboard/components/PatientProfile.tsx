import { ChevronLeft, Stethoscope, FileText, Plus, Eye, Clock, Pill, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { Patient, Consultation, MedicalCertificate, Page } from '../types';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';

const categoryColors: Record<string, { bg: string; text: string }> = {
  Student:  { bg: '#E3F2FD', text: '#1B3A6B' },
  Employee: { bg: '#E8F5E9', text: '#2E7D32' },
  Outsider: { bg: '#F3E5F5', text: '#6A1B9A' },
};

interface PatientProfileProps {
  patient: Patient;
  consultations: Consultation[];
  medicalCerts: MedicalCertificate[];
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
}

export function PatientProfile({ patient, consultations, medicalCerts, onNavigate, onSelectPatient }: PatientProfileProps) {
  const patientConsultations = consultations
    .filter(c => c.patientId === patient.id)
    .sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.timeIn || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.timeIn || '00:00'}`).getTime();
      
      if (timeA === timeB) {
        const aConverted = a.complaint.includes('[CONVERTED]');
        const bConverted = b.complaint.includes('[CONVERTED]');
        if (aConverted && !bConverted) return -1; // old (converted) comes first
        if (!aConverted && bConverted) return 1;
      }
      return timeA - timeB; // Ascending order (oldest first)
    });

  const formatComplaint = (complaint: string) => {
    if (complaint.includes('[CONVERTED]')) {
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <span>{complaint.replace(' [CONVERTED]', '')}</span>
          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Converted</span>
        </span>
      );
    }
    return complaint;
  };
  const patientCerts = medicalCerts.filter(m => m.patientId === patient.id);
  const catColor = categoryColors[patient.category] ?? { bg: '#f3f4f6', text: '#374151' };

  const infoItems = [
    { icon: <User size={14} />, label: 'ID', value: patient.id },
    { icon: <Phone size={14} />, label: 'Contact', value: patient.contact },
    { icon: <Mail size={14} />, label: 'Email', value: patient.email || '—' },
    { icon: <AlertCircle size={14} />, label: 'Emergency', value: `${patient.emergencyContact || '—'} (${patient.emergencyPhone || '—'})` },
    ...(patient.category === 'Student' ? [
      { icon: <User size={14} />, label: 'Course', value: patient.course || '—' },
      { icon: <User size={14} />, label: 'Year Level', value: patient.yearLevel || '—' },
    ] : []),
    ...(patient.category === 'Employee' ? [
      { icon: <User size={14} />, label: 'Position', value: patient.position || '—' },
      { icon: <User size={14} />, label: 'Department', value: patient.department || '—' },
    ] : []),
    ...(patient.category === 'Outsider' ? [
      { icon: <User size={14} />, label: 'Address', value: patient.address || '—' },
    ] : []),
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('patients')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-gray-900">Patient Profile</h1>
          <p className="text-sm text-gray-400">Detailed patient record</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-3"
              style={{ background: PRIMARY }}>
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h2 className="text-gray-900 text-lg">{patient.name}</h2>
            <span className="text-xs px-3 py-1 rounded-full font-semibold mt-1"
              style={{ background: catColor.bg, color: catColor.text }}>
              {patient.category}
            </span>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>Age: {patient.age}</span>
              <span>•</span>
              <span>{patient.sex || '—'}</span>
              <span>•</span>
              <span>DOB: {patient.birthday}</span>
            </div>
          </div>

          {/* Info List */}
          <div className="space-y-3">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="text-gray-400 mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 font-medium">{item.label}</div>
                  <div className="text-sm text-gray-700 break-words">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-5 space-y-2">
            <button
              onClick={() => { onSelectPatient(patient.id); onNavigate('new-consultation'); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              <Stethoscope size={16} /> New Consultation
            </button>
            <button
              onClick={() => onNavigate('medical-certificates')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText size={16} /> Medical Certificate
            </button>
          </div>
        </div>

        {/* Consultation History + Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Consultation History */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800">Consultation History</h3>
              <span className="text-xs text-gray-400">{patientConsultations.length} record{patientConsultations.length !== 1 ? 's' : ''}</span>
            </div>

            {patientConsultations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />
                <p>No consultation records</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="text-left pb-3 pr-3">No.</th>
                      <th className="text-left pb-3 pr-3">Date</th>
                      <th className="text-left pb-3 pr-3">Complaint</th>
                      <th className="text-left pb-3 pr-3">Doctor</th>
                      <th className="text-left pb-3 pr-3">Medicine</th>
                      <th className="text-left pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {patientConsultations.map((c, i) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 pr-3 text-sm text-gray-500">{i + 1}</td>
                        <td className="py-2.5 pr-3 text-sm text-gray-600 whitespace-nowrap">{c.date}<br/><span className="text-xs text-gray-400">{c.timeIn}</span></td>
                        <td className="py-2.5 pr-3 text-sm text-gray-700 max-w-[140px]">
                          <div className="truncate">{formatComplaint(c.complaint)}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-sm text-gray-600">{c.doctorConsulted ? c.doctorName : <span className="text-gray-400">None</span>}</td>
                        <td className="py-2.5 pr-3 text-sm text-gray-600">
                          {c.treatments.length > 0 ? c.treatments.map(t => t.medicineName).join(', ').slice(0, 30) + (c.treatments.map(t => t.medicineName).join(', ').length > 30 ? '...' : '') : <span className="text-gray-400">None</span>}
                        </td>
                        <td className="py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                            ${c.status === 'Consultation' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 className="text-gray-800 mb-4">Visit Timeline</h3>
            {patientConsultations.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No visits recorded</div>
            ) : (
              <div className="space-y-4">
                {patientConsultations.map((c, i) => (
                  <div key={c.id} className="flex gap-4">
                    {/* Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: c.status === 'Consultation' ? `${PRIMARY}15` : '#f3f4f6' }}>
                        <Stethoscope size={14} style={{ color: c.status === 'Consultation' ? PRIMARY : '#9ca3af' }} />
                      </div>
                      {i < patientConsultations.length - 1 && (
                        <div className="w-0.5 flex-1 mt-1" style={{ background: '#e5e7eb', minHeight: 16 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{c.date}</span>
                        <span className="text-xs text-gray-400">{c.timeIn} – {c.timeOut || '—'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Consultation' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{formatComplaint(c.complaint)}</div>
                      {c.treatments.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Pill size={12} className="text-gray-400" />
                          {c.treatments.map(t => (
                            <span key={t.id} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{t.medicineName}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical Certificates */}
          {patientCerts.length > 0 && (
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-gray-800 mb-4">Medical Certificates</h3>
              <div className="space-y-3">
                {patientCerts.map(cert => (
                  <div key={cert.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                      <FileText size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{cert.purpose}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Issued: {cert.date} • {cert.doctor}</div>
                      {cert.diagnosis && <div className="text-xs text-gray-500 mt-0.5">Dx: {cert.diagnosis}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
