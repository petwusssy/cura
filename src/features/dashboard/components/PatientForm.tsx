import { useState, useEffect } from 'react';
import { ChevronLeft, Save, User } from 'lucide-react';
import { Patient, PatientCategory, StudentCategory, Page } from '../types';

const PRIMARY = '#1E5AA8';

interface PatientFormProps {
  patients: Patient[];
  editingPatientId: string | null;
  onSave: (patient: Patient) => void | Promise<void>;
  onNavigate: (page: Page) => void;
}

const CATEGORIES: PatientCategory[] = ['Student', 'Employee', 'Outsider'];

const STUDENT_CATEGORIES: StudentCategory[] = [
  'Elementary',
  'Junior High School',
  'Senior High School',
  'College',
];

const MINOR_CATEGORIES: StudentCategory[] = ['Elementary', 'Junior High School', 'Senior High School'];

const defaultForm = (): Patient => ({
  id: '', name: '', category: 'Student', contact: '', birthday: '', age: 0,
  sex: 'Female', email: '', emergencyContact: '', emergencyPhone: '',
  course: '', yearLevel: '', position: '', department: '', address: '',
  studentCategory: 'College', guardianName: '', gradeLevel: '',
});

export function PatientForm({ patients, editingPatientId, onSave, onNavigate }: PatientFormProps) {
  const [form, setForm] = useState<Patient>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = editingPatientId !== null;

  useEffect(() => {
    if (isEditing) {
      const p = patients.find(p => p.id === editingPatientId);
      if (p) {
        // Merge with defaultForm so new fields (e.g. studentCategory) always have a value
        setForm({ ...defaultForm(), ...p, studentCategory: p.studentCategory ?? 'College' });
      }
    } else {
      setForm(defaultForm());
    }
  }, [editingPatientId]);

  const set = (field: keyof Patient, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.category !== 'Outsider' && !form.id?.trim()) e.id = 'ID is required';
    if (!form.contact.trim()) e.contact = 'Contact is required';
    if (!form.birthday) e.birthday = 'Birthday is required';
    if (form.category === 'Student' && form.studentCategory === 'College' && !form.course?.trim()) e.course = 'Course is required';
    if (form.category === 'Student' && MINOR_CATEGORIES.includes(form.studentCategory as StudentCategory) && !form.gradeLevel?.trim()) e.gradeLevel = 'Grade level is required';
    if (form.category === 'Employee' && !form.position?.trim()) e.position = 'Position is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const finalId = isEditing ? editingPatientId! : (form.category === 'Outsider' ? generateId('Outsider') : form.id);
    // Calculate age from birthday
    const bday = new Date(form.birthday);
    const age = new Date().getFullYear() - bday.getFullYear();
    try {
      await onSave({ ...form, id: finalId, age });
      onNavigate('patients');
    } catch (error) {
      console.error('Save failed', error);
      alert('Failed to save patient data.');
    }
  };

  const generateId = (category: PatientCategory): string => {
    const prefixes = { Student: 'STU', Employee: 'EMP', Outsider: 'OUT' };
    const prefix = prefixes[category];
    const num = patients.filter(p => p.category === category).length + 1;
    return `${prefix}-2026-${String(num).padStart(3, '0')}`;
  };

  const field = (label: string, key: keyof Patient, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ''}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder || label}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] transition-all bg-white
          ${errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onNavigate('patients')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
            <User size={20} />
          </div>
          <div>
            <h1 className="text-gray-900">{isEditing ? 'Edit Patient' : 'Add New Patient'}</h1>
            <p className="text-sm text-gray-400">{isEditing ? `Editing record: ${editingPatientId}` : 'Fill in patient information'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Selection */}
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 className="text-gray-800 mb-4">Patient Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.category === cat ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                style={form.category === cat ? { background: PRIMARY, borderColor: PRIMARY } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Common Fields */}
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 className="text-gray-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Full Name', 'name', 'text', 'Last, First Middle')}
            {field('Contact Number', 'contact', 'tel', '09XX-XXX-XXXX')}
            {field('Birthday', 'birthday', 'date')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sex</label>
              <select
                value={form.sex ?? ''}
                onChange={e => set('sex', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] transition-all bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {field('Email Address', 'email', 'email', 'email@ua.edu.ph')}
            {field('Emergency Contact Name', 'emergencyContact', 'text', 'Name')}
            {field('Emergency Contact No.', 'emergencyPhone', 'tel', '09XX-XXX-XXXX')}
          </div>
        </div>

        {/* Category-specific fields */}
        {form.category === 'Student' && (
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 className="text-gray-800 mb-4">Student Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Student ID', 'id', 'text', 'e.g., 202012345')}

              {/* Student Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Category</label>
                <select
                  value={form.studentCategory ?? 'College'}
                  onChange={e => set('studentCategory', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] bg-white"
                >
                  {STUDENT_CATEGORIES.map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              {/* Grade Level — shown for Elementary, JHS, SHS */}
              {MINOR_CATEGORIES.includes(form.studentCategory as StudentCategory) && (
                field('Grade Level', 'gradeLevel', 'text', 'e.g., Grade 7')
              )}

              {/* Course / Program — shown for College */}
              {form.studentCategory === 'College' && (
                field('Course / Program', 'course', 'text', 'e.g., BS Nursing')
              )}

              {/* Year Level — shown for College */}
              {form.studentCategory === 'College' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year Level</label>
                  <select
                    value={form.yearLevel ?? ''}
                    onChange={e => set('yearLevel', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] bg-white"
                  >
                    <option value="">Select Year</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Guardian Name — shown for Elementary, JHS, SHS */}
              {MINOR_CATEGORIES.includes(form.studentCategory as StudentCategory) && (
                field('Guardian Name', 'guardianName', 'text', 'e.g., Maria Dela Cruz (Mother)')
              )}
            </div>
          </div>
        )}

        {form.category === 'Employee' && (
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 className="text-gray-800 mb-4">Employee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Employee ID', 'id', 'text', 'e.g., EMP-1234')}
              {field('Position / Designation', 'position', 'text', 'e.g., Professor')}
              {field('Department', 'department', 'text', 'e.g., College of Nursing')}
            </div>
          </div>
        )}

        {form.category === 'Outsider' && (
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 className="text-gray-800 mb-4">Address</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Home Address</label>
              <textarea
                value={form.address ?? ''}
                onChange={e => set('address', e.target.value)}
                rows={2}
                placeholder="Street, Barangay, City, Province"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] bg-white resize-none"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('patients')}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            <Save size={16} />
            {isEditing ? 'Save Changes' : 'Add Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
