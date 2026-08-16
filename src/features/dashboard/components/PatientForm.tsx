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
    } catch (error: any) {
      console.error('Save failed', error);
      let errMsg = 'Failed to save patient data.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          // If it's a 404 HTML page or plain text
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
      
      // If it tries to fetch from itself (Vercel) and gets 404, the API URL is missing.
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
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ''}
        onChange={e => set(key, key === 'name' ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder || label}
        className={`w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] bg-white dark:bg-[#13141f] text-gray-900 dark:text-gray-100 transition-all shadow-sm
          ${errors[key] ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}`}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">{isEditing ? 'Edit Patient' : 'Add New Patient'}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selection */}
          <div className="bg-white dark:bg-[#1a1b26] rounded-2xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-5 pb-3 border-b border-gray-100 dark:border-gray-800/50">Patient Category</h3>
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

          {/* Basic Information */}
          <div className="bg-white dark:bg-[#1a1b26] rounded-2xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-5 pb-3 border-b border-gray-100 dark:border-gray-800/50">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Full Name', 'name', 'text', 'Last, First Middle')}
            {field('Contact Number', 'contact', 'tel', '09XX-XXX-XXXX')}
            {field('Birthday', 'birthday', 'date')}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sex</label>
              <select
                value={form.sex ?? ''}
                onChange={e => set('sex', e.target.value)}
                className="w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] bg-white dark:bg-[#13141f] text-gray-900 dark:text-gray-100 transition-all shadow-sm"
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
            <div className="bg-white dark:bg-[#1a1b26] rounded-2xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-5 pb-3 border-b border-gray-100 dark:border-gray-800/50">Student Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Student ID', 'id', 'text', 'e.g., 202012345')}

              {/* Student Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Student Category</label>
                <select
                  value={form.studentCategory ?? 'College'}
                  onChange={e => set('studentCategory', e.target.value)}
                  className="w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] bg-white dark:bg-[#13141f] text-gray-900 dark:text-gray-100 transition-all shadow-sm"
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
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Year Level</label>
                  <select
                    value={form.yearLevel ?? ''}
                    onChange={e => set('yearLevel', e.target.value)}
                    className="w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] bg-white dark:bg-[#13141f] text-gray-900 dark:text-gray-100 transition-all shadow-sm"
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
            <div className="bg-white dark:bg-[#1a1b26] rounded-2xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-5 pb-3 border-b border-gray-100 dark:border-gray-800/50">Employee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Employee ID', 'id', 'text', 'e.g., EMP-1234')}
              {field('Position / Designation', 'position', 'text', 'e.g., Professor')}
              {field('Department', 'department', 'text', 'e.g., College of Nursing')}
            </div>
          </div>
        )}

          {form.category === 'Outsider' && (
            <div className="bg-white dark:bg-[#1a1b26] rounded-2xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-5 pb-3 border-b border-gray-100 dark:border-gray-800/50">Address</h3>
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
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
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
