import { useState } from 'react';
import { Plus, Printer, Copy, FileText, X, Edit2, Download, Calendar } from 'lucide-react';
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

const emptyForm = (): Omit<MedicalCertificate, 'id' | 'patientId'> => ({
  date: '2026-06-27', purpose: '', diagnosis: '', recommendation: '',
  doctor: 'Dr. Rosario Mendez', issuedBy: 'Grace Aquino, RN', notes: '',
});

export function MedicalCertificates({ medicalCerts, patients, selectedPatientId, onAddCert, onUpdateCert }: MedicalCertificatesProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>(selectedPatientId || '');
  const [showForm, setShowForm] = useState(false);
  const [editingCert, setEditingCert] = useState<MedicalCertificate | null>(null);
  const [previewCert, setPreviewCert] = useState<MedicalCertificate | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = medicalCerts.filter(c => {
    const matchDate = !dateFilter || c.date === dateFilter;
    const matchPatient = !selectedPatient || c.patientId === selectedPatient;
    return matchDate && matchPatient;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const openCreate = () => {
    setEditingCert(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (cert: MedicalCertificate) => {
    setEditingCert(cert);
    const { id, patientId, ...rest } = cert;
    setForm(rest);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedPatient && !editingCert) return;
    try {
      if (editingCert) {
        await onUpdateCert({ ...editingCert, ...form });
      } else {
        await onAddCert({ id: `MC-${Date.now()}`, patientId: selectedPatient, ...form });
      }
      setShowForm(false);
      setEditingCert(null);
    } catch (e) { console.error(e); }
  };

  const handleDuplicate = async (cert: MedicalCertificate) => {
    try {
      await onAddCert({ ...cert, id: `MC-${Date.now()}`, date: new Date().toISOString().split('T')[0] });
    } catch (e) { console.error(e); }
  };

  const patient = (id: string) => patients.find(p => p.id === id);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Medical Certificates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Issue and manage medical certificates</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: PRIMARY }}>
          <Plus size={16} /> Issue Certificate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex gap-4 items-center flex-wrap"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div>
          <label className="text-xs font-medium text-gray-500 mr-2">Patient:</label>
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5AA8] bg-gray-50">
            <option value="">All Patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5AA8] bg-gray-50" />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">Clear</button>
          )}
        </div>
      </div>

      {/* Certificates List + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p>No certificates found</p>
            </div>
          ) : filtered.map(cert => {
            const p = patient(cert.patientId);
            const isSelected = previewCert?.id === cert.id;
            return (
              <div
                key={cert.id}
                onClick={() => setPreviewCert(cert)}
                className="bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                style={{
                  boxShadow: isSelected ? `0 0 0 2px ${PRIMARY}` : '0 2px 12px rgba(0,0,0,0.06)',
                  border: isSelected ? `2px solid ${PRIMARY}` : '1px solid #f0f0f0',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                      <FileText size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{p?.name || 'Unknown Patient'}</div>
                      <div className="text-xs text-gray-400">{cert.date} • {cert.purpose?.slice(0, 30)}{(cert.purpose?.length || 0) > 30 ? '...' : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEdit(cert); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDuplicate(cert); }}
                      title="Duplicate"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                {cert.diagnosis && (
                  <div className="mt-2 text-xs text-gray-500 truncate">Dx: {cert.diagnosis}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-3">
          {previewCert ? (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              {/* Actions */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-600 flex-1">Certificate Preview</span>
                <button onClick={() => openEdit(previewCert)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white transition-colors">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDuplicate(previewCert)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white transition-colors">
                  <Copy size={12} /> Duplicate
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: PRIMARY }}>
                  <Printer size={12} /> Print
                </button>
              </div>

              {/* Certificate Document */}
              <div className="p-8">
                <CertificateTemplate cert={previewCert} patient={patient(previewCert.patientId)} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl flex flex-col items-center justify-center py-20 text-gray-300"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <FileText size={48} className="mb-3" />
              <p className="text-sm">Select a certificate to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900">{editingCert ? 'Edit Certificate' : 'Issue Medical Certificate'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {!editingCert && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Patient</label>
                  <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]">
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                  </select>
                </div>
              )}
              {[
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'purpose', label: 'Purpose', type: 'text' },
                { key: 'diagnosis', label: 'Diagnosis', type: 'text' },
                { key: 'recommendation', label: 'Recommendation', type: 'text' },
                { key: 'doctor', label: "Doctor's Name", type: 'text' },
                { key: 'issuedBy', label: 'Issued By', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] ?? ''}
                    onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Additional Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(fm => ({ ...fm, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: PRIMARY }}>
                {editingCert ? 'Save Changes' : 'Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificateTemplate({ cert, patient }: { cert: MedicalCertificate; patient: Patient | undefined }) {
  return (
    <div className="font-serif text-sm space-y-4" style={{ fontFamily: 'serif' }}>
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-800">
        <img src={uaSeal} alt="UA Seal" className="w-16 h-16 object-contain" />
        <div className="text-center flex-1">
          <div className="font-bold text-base uppercase tracking-wide">University of the Assumption</div>
          <div className="text-xs text-gray-500">Unisite Subd., Del Pilar, City of San Fernando, Pampanga</div>
          <div className="font-bold text-sm mt-1">MEDICAL-DENTAL CLINIC</div>
        </div>
        <img src={uaSeal} alt="UA Seal" className="w-16 h-16 object-contain opacity-0" />
      </div>

      <div className="text-center">
        <div className="font-bold text-base uppercase tracking-widest underline">Medical Certificate</div>
      </div>

      <div className="space-y-3 pt-2">
        <p>
          This is to certify that <strong>{patient?.name || '___________________'}</strong>, {' '}
          {patient?.category === 'Student' ? `${patient?.yearLevel} student of ${patient?.course}` : patient?.category === 'Employee' ? `${patient?.position}` : patient?.category} {' '}
          of this university, was seen and treated at this clinic on <strong>{cert.date}</strong>.
        </p>

        {cert.diagnosis && (
          <p>
            <span className="font-semibold">Diagnosis: </span>{cert.diagnosis}
          </p>
        )}

        {cert.recommendation && (
          <p>
            <span className="font-semibold">Recommendation: </span>{cert.recommendation}
          </p>
        )}

        {cert.notes && <p className="text-gray-600">{cert.notes}</p>}

        <p>This certificate is issued for the purpose of <strong>{cert.purpose || '___________________'}</strong>.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 pt-8">
        <div className="text-center">
          <div className="border-t border-black pt-2">
            <div className="font-semibold">{cert.issuedBy || 'Nurse Name'}</div>
            <div className="text-xs text-gray-500">Registered Nurse</div>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2">
            <div className="font-semibold">{cert.doctor || 'Dr. Name'}</div>
            <div className="text-xs text-gray-500">Clinic Physician</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center pt-2">
        CURA — University of the Assumption Clinic • {cert.date}
      </div>
    </div>
  );
}
