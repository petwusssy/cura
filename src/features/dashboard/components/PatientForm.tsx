import { useState, useEffect } from 'react';
import { ChevronLeft, Save, User } from 'lucide-react';
import { Patient, PatientCategory, StudentCategory, Page } from '../types';

const PRIMARY = '#1B3A6B';

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

const GRADE_LEVELS: Record<'Elementary' | 'Junior High School' | 'Senior High School', string[]> = {
  'Elementary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  'Junior High School': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  'Senior High School': ['Grade 11', 'Grade 12'],
};

const defaultForm = (): Patient => ({
  id: '', name: '', category: 'Student', contact: '', birthday: '', age: 0,
  sex: 'Female', email: '', emergencyContact: '', emergencyPhone: '',
  course: '', yearLevel: '', position: '', department: '', address: '',
  studentCategory: 'College', guardianName: '', gradeLevel: '',
});

export function PatientForm({ patients, editingPatientId, onSave, onNavigate }: PatientFormProps) {
  const [form, setForm] = useState<Patient>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;
    if (!validate()) return;
    const finalId = isEditing ? editingPatientId! : (form.category === 'Outsider' ? generateId('Outsider') : form.id);
    // Calculate age from birthday
    const bday = new Date(form.birthday);
    const age = new Date().getFullYear() - bday.getFullYear();
    setIsSubmitting(true);
    try {
      await onSave({ ...form, name: form.name.trim().toUpperCase(), id: finalId, age });
      onNavigate('patients');
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Save failed', error);
      let errMsg = 'Failed to save patient data.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errMsg = `Server Error (${error.response.status}): ${error.message}`;
        } else if (typeof error.response.data === 'object') {
          const values = Object.values(error.response.data);
          if (values.length > 0) {
            const firstValue = values[0];
            errMsg = Array.isArray(firstValue) ? String(firstValue[0]) : String(firstValue);
            if (errMsg === '[object Object]') errMsg = 'Failed to save patient data. (Invalid server response)';
          }
        }
      } else if (error.message) {
        errMsg = error.message;
      }
      
      if (
        error.response?.status === 404 && 
        window.location.hostname.includes('vercel.app') &&
        error.config?.url?.includes(window.location.hostname)
      ) {
        errMsg = "CRITICAL: The frontend doesn't know where the backend is! Please set VITE_API_URL in your Vercel Environment Variables.";
      } else if (error.response?.status === 404) {
        errMsg = `Backend URL is incorrect or the server is down. Attempted to connect to: ${error.config?.baseURL}${error.config?.url}`;
      }

      alert(errMsg);
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
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ''}
        onChange={e => set(key, key === 'name' ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder || label}
        style={key === 'name' ? { textTransform: 'uppercase' } : undefined}
        className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all ${
          errors[key] ? 'border-red-400 bg-red-50' : ''
        }`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('patients')}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
            <User size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Patient' : 'Add New Patient'}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div
          className="bg-white rounded-xl p-5 sm:p-6 transition-all"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
        >
          <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Patient Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  form.category === cat
                    ? 'text-white border-transparent shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={form.category === cat ? { background: PRIMARY, borderColor: PRIMARY } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div
          className="bg-white rounded-xl p-5 sm:p-6 transition-all"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
        >
          <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Full Name', 'name', 'text', 'Last, First Middle')}
            {field('Contact Number', 'contact', 'tel', '09XX-XXX-XXXX')}
            {field('Birthday', 'birthday', 'date')}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sex</label>
              <select
                value={form.sex ?? ''}
                onChange={e => set('sex', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all"
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
          <div
            className="bg-white rounded-xl p-5 sm:p-6 transition-all"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
          >
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Student ID', 'id', 'text', 'e.g., 202012345')}

              {/* Student Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Student Category</label>
                <select
                  value={form.studentCategory ?? 'College'}
                  onChange={e => {
                    const newCat = e.target.value as StudentCategory;
                    setForm(f => ({
                      ...f,
                      studentCategory: newCat,
                      gradeLevel: '',
                      course: newCat !== 'College' ? '' : f.course,
                      yearLevel: newCat !== 'College' ? '' : f.yearLevel,
                      guardianName: newCat === 'College' ? '' : f.guardianName,
                    }));
                    if (errors.gradeLevel || errors.course || errors.guardianName) {
                      setErrors(prev => {
                        const n = { ...prev };
                        delete n.gradeLevel;
                        delete n.course;
                        delete n.guardianName;
                        return n;
                      });
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all cursor-pointer"
                >
                  {STUDENT_CATEGORIES.map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              {/* Grade Level Dropdown — shown for Elementary, JHS, SHS */}
              {MINOR_CATEGORIES.includes(form.studentCategory as StudentCategory) && (() => {
                const currentCategory = form.studentCategory as keyof typeof GRADE_LEVELS;
                const options = GRADE_LEVELS[currentCategory] || [];
                const currentGrade = form.gradeLevel
                  ? (form.gradeLevel.toLowerCase().startsWith('grade') ? form.gradeLevel : `Grade ${form.gradeLevel}`)
                  : '';
                return (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Grade Level</label>
                    <select
                      value={currentGrade}
                      onChange={e => set('gradeLevel', e.target.value)}
                      className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all cursor-pointer ${
                        errors.gradeLevel ? 'border-red-400 bg-red-50' : ''
                      }`}
                    >
                      <option value="">Select Grade Level</option>
                      {options.map(gl => (
                        <option key={gl} value={gl}>{gl}</option>
                      ))}
                    </select>
                    {errors.gradeLevel && <p className="text-xs text-red-500 mt-1">{errors.gradeLevel}</p>}
                  </div>
                );
              })()}

              {/* Course / Program — shown for College */}
              {form.studentCategory === 'College' && (
                field('Course / Program', 'course', 'text', 'e.g., BS Nursing')
              )}

              {/* Year Level — shown for College */}
              {form.studentCategory === 'College' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year Level</label>
                  <select
                    value={form.yearLevel ?? ''}
                    onChange={e => set('yearLevel', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all"
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
          <div
            className="bg-white rounded-xl p-5 sm:p-6 transition-all"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
          >
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Employee Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Employee ID', 'id', 'text', 'e.g., EMP-1234')}
              {field('Position / Designation', 'position', 'text', 'e.g., Professor')}
              {field('Department', 'department', 'text', 'e.g., College of Nursing')}
            </div>
          </div>
        )}

        {form.category === 'Outsider' && (
          <div
            className="bg-white rounded-xl p-5 sm:p-6 transition-all"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
          >
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Address
            </h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Home Address</label>
              <textarea
                value={form.address ?? ''}
                onChange={e => set('address', e.target.value)}
                rows={2}
                placeholder="Street, Barangay, City, Province"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('patients')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            style={{ background: PRIMARY }}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? 'Save Changes' : 'Add Patient'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
