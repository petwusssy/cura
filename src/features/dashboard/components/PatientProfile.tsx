import { useState } from 'react';
import { ChevronLeft, Stethoscope, FileText, Plus, Eye, Clock, Pill, User, Phone, Mail, AlertCircle, X } from 'lucide-react';
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
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  const allPatientConsultations = consultations
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

  const patientConsultations = allPatientConsultations.filter(c => c.status === 'Consultation');
  const patientNonConsultations = allPatientConsultations.filter(c => c.status === 'Non-Consultation');

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
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="text-left pb-3 pr-3">No.</th>
                      <th className="text-left pb-3 pr-3">Date</th>
                      <th className="text-left pb-3 pr-3">Complaint</th>
                      <th className="text-left pb-3 pr-3">Doctor</th>
                      <th className="text-left pb-3 pr-3">Medicine</th>
                      <th className="text-left pb-3 pr-3">Status</th>
                      <th className="text-right pb-3">Action</th>
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
                        <td className="py-2.5 text-right">
                          <button 
                            onClick={() => setSelectedConsultation(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Consultation History */}
              <div className="flex flex-col gap-3 md:hidden mt-2">
                {patientConsultations.map((c, i) => (
                  <div key={c.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 relative">
                    <div className="absolute top-4 right-4">
                      <button 
                        onClick={() => setSelectedConsultation(c)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 bg-white shadow-sm rounded-lg transition-colors inline-flex"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="text-xs font-bold text-gray-400">Record #{i + 1}</div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{formatComplaint(c.complaint)}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{c.date} • {c.timeIn}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Doctor</span>
                        <div className="text-sm text-gray-700">{c.doctorConsulted ? c.doctorName : <span className="text-gray-400">None</span>}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                        <div className="mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                            ${c.status === 'Consultation' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Medicine</span>
                        <div className="text-sm text-gray-700">
                          {c.treatments.length > 0 ? c.treatments.map(t => t.medicineName).join(', ') : <span className="text-gray-400">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
            )}
          </div>

          {/* Non-Consultation History */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800">Non-Consultation History</h3>
              <span className="text-xs text-gray-400">{patientNonConsultations.length} record{patientNonConsultations.length !== 1 ? 's' : ''}</span>
            </div>

            {patientNonConsultations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />
                <p>No non-consultation records</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="text-left pb-3 pr-3">No.</th>
                      <th className="text-left pb-3 pr-3">Date</th>
                      <th className="text-left pb-3 pr-3">Complaint</th>
                      <th className="text-left pb-3 pr-3">Doctor</th>
                      <th className="text-left pb-3 pr-3">Medicine</th>
                      <th className="text-left pb-3 pr-3">Status</th>
                      <th className="text-right pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {patientNonConsultations.map((c, i) => (
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
                        <td className="py-2.5 text-right">
                          <button 
                            onClick={() => setSelectedConsultation(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Non-Consultation History */}
              <div className="flex flex-col gap-3 md:hidden mt-2">
                {patientNonConsultations.map((c, i) => (
                  <div key={c.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 relative">
                    <div className="absolute top-4 right-4">
                      <button 
                        onClick={() => setSelectedConsultation(c)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 bg-white shadow-sm rounded-lg transition-colors inline-flex"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="text-xs font-bold text-gray-400">Record #{i + 1}</div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{formatComplaint(c.complaint)}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{c.date} • {c.timeIn}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Doctor</span>
                        <div className="text-sm text-gray-700">{c.doctorConsulted ? c.doctorName : <span className="text-gray-400">None</span>}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                        <div className="mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                            ${c.status === 'Consultation' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Medicine</span>
                        <div className="text-sm text-gray-700">
                          {c.treatments.length > 0 ? c.treatments.map(t => t.medicineName).join(', ') : <span className="text-gray-400">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 className="text-gray-800 mb-4">Visit Timeline</h3>
            {allPatientConsultations.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No visits recorded</div>
            ) : (
              <div className="space-y-4">
                {allPatientConsultations.map((c, i) => (
                  <div key={c.id} className="flex gap-4">
                    {/* Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: c.status === 'Consultation' ? `${PRIMARY}15` : '#f3f4f6' }}>
                        <Stethoscope size={14} style={{ color: c.status === 'Consultation' ? PRIMARY : '#9ca3af' }} />
                      </div>
                      {i < allPatientConsultations.length - 1 && (
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

      {/* Consultation Details Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedConsultation.status === 'Consultation' ? 'Consultation Record' : 'Non-Consultation Record'}
                </h3>
                <p className="text-sm text-gray-500">{selectedConsultation.date} • {selectedConsultation.timeIn} - {selectedConsultation.timeOut || 'Present'}</p>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/30">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Main Details */}
                 <div className="space-y-4">
                   <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Main Details</h4>
                     <div className="space-y-3">
                       <div>
                         <span className="text-xs text-gray-500 block mb-1">Complaint</span>
                         <div className="text-sm font-medium text-gray-800">{formatComplaint(selectedConsultation.complaint)}</div>
                       </div>
                       
                       {selectedConsultation.status === 'Consultation' ? (
                         <>
                           <div>
                             <span className="text-xs text-gray-500 block mb-1">Categories</span>
                             <div className="flex flex-wrap gap-1.5">
                               {selectedConsultation.categories?.length ? selectedConsultation.categories.map((cat, idx) => (
                                 <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{cat}</span>
                               )) : <span className="text-sm text-gray-500">—</span>}
                             </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             <div>
                               <span className="text-xs text-gray-500 block mb-1">Doctor Consulted</span>
                               <span className="text-sm text-gray-800">{selectedConsultation.doctorConsulted ? 'Yes' : 'No'}</span>
                             </div>
                             {selectedConsultation.doctorConsulted && (
                               <div>
                                 <span className="text-xs text-gray-500 block mb-1">Doctor's Name</span>
                                 <span className="text-sm text-gray-800">{selectedConsultation.doctorName}</span>
                               </div>
                             )}
                           </div>
                           {selectedConsultation.whoConsulted && (
                             <div className="pt-1">
                               <span className="text-xs text-gray-500 block mb-1">Other Consultant</span>
                               <span className="text-sm text-gray-800">{selectedConsultation.whoConsulted}</span>
                             </div>
                           )}
                         </>
                       ) : (
                         <>
                           <div>
                             <span className="text-xs text-gray-500 block mb-1">Purpose of Visit</span>
                             <div className="text-sm font-medium text-gray-800">{selectedConsultation.purposeOfVisit || '—'}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             <div>
                               <span className="text-xs text-gray-500 block mb-1">Assisting Nurse</span>
                               <span className="text-sm text-gray-800">{selectedConsultation.assistingNurse || '—'}</span>
                             </div>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
                   
                   {/* Vital Signs */}
                   {selectedConsultation.status === 'Consultation' && selectedConsultation.vitals && (
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vital Signs</h4>
                       <div className="grid grid-cols-3 gap-3">
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">BP</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.bp || '—'}</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">HR</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.hr || '—'}</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">Temp</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.temp || '—'}</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">Weight</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.weight || '—'}</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">Height</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.height || '—'}</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">Resp. Rate</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.rr || '—'}</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase">O2 Sat</span>
                           <div className="text-sm font-semibold">{selectedConsultation.vitals.o2 || '—'}</div>
                         </div>
                       </div>
                       {selectedConsultation.vitals.notes && (
                         <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <span className="text-[10px] text-gray-500 uppercase block mb-1">Vital Notes</span>
                           <div className="text-sm font-semibold text-gray-700">{selectedConsultation.vitals.notes}</div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Right Column */}
                 <div className="space-y-4">
                   {/* Treatments */}
                   <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Medicines & Treatments</h4>
                     {selectedConsultation.treatments && selectedConsultation.treatments.length > 0 ? (
                       <div className="space-y-2.5">
                         {selectedConsultation.treatments.map((t, idx) => (
                           <div key={idx} className="flex items-center justify-between p-2.5 bg-green-50/50 rounded-lg border border-green-100/50">
                             <div className="flex items-center gap-2.5">
                               <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                 <Pill size={14} />
                               </div>
                               <div>
                                 <div className="text-sm font-bold text-gray-800">{t.medicineName}</div>
                                 <div className="text-xs text-gray-500">{t.quantity} {t.unit} • Given {t.timeGiven}</div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-sm text-gray-500 italic">No medicines dispensed</div>
                     )}
                   </div>
                   
                   {/* Notes & Actions */}
                   <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                     {selectedConsultation.status === 'Consultation' ? (
                       <>
                         <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nurse's Notes</h4>
                           <div className="text-sm text-gray-700 whitespace-pre-line">{selectedConsultation.nurseNotes || '—'}</div>
                         </div>
                         <div className="border-t border-gray-100 pt-3">
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Recommendations</h4>
                           <div className="text-sm text-gray-700 whitespace-pre-line">{selectedConsultation.recommendations || '—'}</div>
                         </div>
                         {selectedConsultation.followUp && (
                           <div className="border-t border-gray-100 pt-3">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Follow-up Notes</h4>
                             <div className="text-sm text-gray-700 whitespace-pre-line">{selectedConsultation.followUp}</div>
                           </div>
                         )}
                       </>
                     ) : (
                       <div>
                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Operational Notes</h4>
                         <div className="text-sm text-gray-700 whitespace-pre-line">{selectedConsultation.operationalNotes || '—'}</div>
                       </div>
                     )}
                     
                     {selectedConsultation.earlyDismissal && (
                       <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm border border-orange-100 mt-2">
                         <strong>Early Dismissal:</strong> {selectedConsultation.earlyDismissalReason}
                         {selectedConsultation.fetcherName && <div><br/><strong>Fetcher:</strong> {selectedConsultation.fetcherName}</div>}
                       </div>
                     )}

                     {selectedConsultation.transferred && (
                       <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100 mt-2">
                         <strong>Hospital Transfer:</strong> {selectedConsultation.dismissalDestination}
                       </div>
                     )}
                   </div>
                 </div>
               </div>
               
               {/* Attached Images */}
               {(selectedConsultation.prescriptionImage || selectedConsultation.fetcherIdImage) && (
                 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-6">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Attached Documents</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {selectedConsultation.prescriptionImage && (
                       <div>
                         <span className="text-xs font-bold text-gray-500 mb-2 block">Prescription Image</span>
                         <img src={selectedConsultation.prescriptionImage} alt="Prescription" className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                       </div>
                     )}
                     {selectedConsultation.fetcherIdImage && (
                       <div>
                         <span className="text-xs font-bold text-gray-500 mb-2 block">Fetcher ID Image</span>
                         <img src={selectedConsultation.fetcherIdImage} alt="Fetcher ID" className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                       </div>
                     )}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
