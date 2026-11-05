import { useState, useMemo, useEffect } from 'react';
import {
  X, ScanLine, CheckCircle2, Stethoscope, ClipboardList,
  Building2, Users, Search, ArrowLeft, UserCheck, Sparkles, IdCard
} from 'lucide-react';
import { Patient } from '../types';
import { DEPARTMENT_SECTION_GROUPS, inferYearLevelFromSection } from '../constants/sectionsData';

const PRIMARY = '#1B3A6B';

interface QuickStudentCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSavePatient: (patient: Patient) => void | Promise<void>;
  onProceed: (mode: 'Consultation' | 'Non-Consultation', patient: Patient) => void;
}

export function QuickStudentCheckInModal({
  isOpen,
  onClose,
  patients,
  onSavePatient,
  onProceed,
}: QuickStudentCheckInModalProps) {
  const [step, setStep] = useState<'form' | 'confirmed'>('form');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(DEPARTMENT_SECTION_GROUPS[0].id);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sectionSearch, setSectionSearch] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [sex, setSex] = useState<string>('Female');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmedPatient, setConfirmedPatient] = useState<Patient | null>(null);

  const selectedDept = useMemo(
    () => DEPARTMENT_SECTION_GROUPS.find(d => d.id === selectedDeptId) || DEPARTMENT_SECTION_GROUPS[0],
    [selectedDeptId]
  );

  const filteredSections = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    if (!q) return selectedDept.sections;
    return selectedDept.sections.filter(sec => sec.toLowerCase().includes(q));
  }, [selectedDept, sectionSearch]);

  // If searching for a section not in the current dept, find matches across all departments
  const crossDeptMatches = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    if (!q || filteredSections.length > 0) return [];
    const results: { deptId: string; deptShortName: string; section: string }[] = [];
    DEPARTMENT_SECTION_GROUPS.forEach(dept => {
      if (dept.id === selectedDeptId) return;
      dept.sections.forEach(sec => {
        if (sec.toLowerCase().includes(q)) {
          results.push({ deptId: dept.id, deptShortName: dept.shortName, section: sec });
        }
      });
    });
    return results.slice(0, 12);
  }, [sectionSearch, filteredSections, selectedDeptId]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setSelectedDeptId(DEPARTMENT_SECTION_GROUPS[0].id);
      setSelectedSection(DEPARTMENT_SECTION_GROUPS[0].sections[0] || '');
      setSectionSearch('');
      setStudentId('');
      setStudentName('');
      setSex('Female');
      setErrors({});
      setIsSaving(false);
      setConfirmedPatient(null);
    }
  }, [isOpen]);

  // Auto-select first section when department changes
  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSectionSearch('');
    const dept = DEPARTMENT_SECTION_GROUPS.find(d => d.id === deptId);
    setSelectedSection(dept?.sections[0] || '');
    if (errors.section) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.section;
        return next;
      });
    }
  };

  // Match existing student records while typing ID or Name to prevent duplicates/typos
  const matchingExistingStudents = useMemo(() => {
    const idQuery = studentId.trim().toLowerCase();
    const nameQuery = studentName.trim().toLowerCase();
    if (!idQuery && !nameQuery) return [];
    return patients
      .filter(p => p.category === 'Student')
      .filter(p => {
        const matchId = idQuery && p.id.toLowerCase().includes(idQuery);
        const matchName = nameQuery && p.name.toLowerCase().includes(nameQuery);
        return matchId || matchName;
      })
      .slice(0, 4);
  }, [patients, studentId, studentName]);

  const handleSelectExistingStudent = (p: Patient) => {
    setStudentId(p.id);
    setStudentName(p.name.toUpperCase());
    if (p.sex) setSex(p.sex);
    // If student already has a known section in our list, select its department & section automatically
    if (p.course) {
      const foundDept = DEPARTMENT_SECTION_GROUPS.find(d =>
        d.sections.some(s => s.toLowerCase() === p.course?.toLowerCase())
      );
      if (foundDept) {
        setSelectedDeptId(foundDept.id);
        const exactSec = foundDept.sections.find(s => s.toLowerCase() === p.course?.toLowerCase());
        if (exactSec) setSelectedSection(exactSec);
      }
    }
    setErrors({});
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const newErrors: Record<string, string> = {};
    if (!selectedDeptId) newErrors.dept = 'Please select a department';
    if (!selectedSection.trim()) newErrors.section = 'Please select a section';
    if (!studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!studentName.trim()) newErrors.studentName = 'Student Full Name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cleanId = studentId.trim();
    const cleanName = studentName.trim().toUpperCase();
    const existing = patients.find(p => p.id.toLowerCase() === cleanId.toLowerCase());

    const yearLevel = inferYearLevelFromSection(selectedSection, selectedDept.studentCategory);
    const gradeLevel = selectedDept.defaultGradeLevel || '';

    const payload: Patient = {
      id: existing ? existing.id : cleanId,
      name: cleanName,
      category: 'Student',
      contact: existing?.contact || 'Not Provided',
      birthday: existing?.birthday || '2000-01-01',
      age: existing?.age || 0,
      sex: existing?.sex || sex || 'Female',
      email: existing?.email || '',
      emergencyContact: existing?.emergencyContact || '',
      emergencyPhone: existing?.emergencyPhone || '',
      studentCategory: selectedDept.studentCategory,
      department: selectedDept.name,
      course: selectedSection,
      gradeLevel: selectedDept.studentCategory === 'Senior High School' ? gradeLevel : '',
      yearLevel: selectedDept.studentCategory === 'College' ? yearLevel : '',
      guardianName: existing?.guardianName || '',
      address: existing?.address || '',
    };

    setIsSaving(true);
    try {
      await onSavePatient(payload);
      setConfirmedPatient(payload);
      setStep('confirmed');
    } catch (err) {
      console.error('Failed to save student check-in:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div
          className="px-5 py-4 flex items-center justify-between text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0d213f 0%, #1B3A6B 60%, #2465ad 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <UserCheck size={20} className="text-[#F4C542]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Quick Student Walk-In
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4C542]/20 text-[#F4C542] border border-[#F4C542]/40">
                  Fast Triage
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                {step === 'form'
                  ? 'Step 1 of 2: Select Department & Section, then input Student ID & Name'
                  : 'Step 2 of 2: Student confirmed — choose Consultation or Non-Consultation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {step === 'form' ? (
            <form id="quick-student-form" onSubmit={handleConfirm} className="space-y-5">
              {/* 1. Department Selection */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  <Building2 size={14} className="text-[#1B3A6B]" />
                  1. Select Department
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEPARTMENT_SECTION_GROUPS.map(dept => {
                    const active = dept.id === selectedDeptId;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDept(dept.id)}
                        className={`text-left px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-sm'
                            : 'bg-gray-50/70 hover:bg-blue-50/50 text-gray-800 border-gray-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold truncate">{dept.shortName}</div>
                          <div className={`text-[11px] truncate ${active ? 'text-blue-100' : 'text-gray-500'}`}>
                            {dept.name}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            active ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                          }`}
                        >
                          {dept.sections.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Section Selection */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <Users size={14} className="text-[#1B3A6B]" />
                    2. Select Year & Section ({selectedDept.shortName})
                  </label>
                  <div className="relative w-full sm:w-56">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={sectionSearch}
                      onChange={e => setSectionSearch(e.target.value)}
                      placeholder="Filter sections..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B3A6B] text-gray-900"
                    />
                    {sectionSearch && (
                      <button
                        type="button"
                        onClick={() => setSectionSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Chips / Scrollable Grid */}
                <div className="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                  {filteredSections.length === 0 ? (
                    crossDeptMatches.length > 0 ? (
                      <div className="w-full space-y-1.5">
                        <div className="text-[11px] font-semibold text-blue-700">
                          Found in other departments (click to switch & select):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {crossDeptMatches.map(m => (
                            <button
                              key={`${m.deptId}-${m.section}`}
                              type="button"
                              onClick={() => {
                                setSelectedDeptId(m.deptId);
                                setSelectedSection(m.section);
                                setSectionSearch('');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-800 border-blue-200 hover:bg-blue-50 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{m.section}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-[#1B3A6B] font-bold">
                                {m.deptShortName}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 py-3 text-center w-full">
                        No section matching "{sectionSearch}"
                      </div>
                    )
                  ) : (
                    filteredSections.map(sec => {
                      const isSelected = selectedSection === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setSelectedSection(sec);
                            if (errors.section) {
                              setErrors(prev => {
                                const n = { ...prev };
                                delete n.section;
                                return n;
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          {sec}
                        </button>
                      );
                    })
                  )}
                </div>
                {errors.section && <p className="text-xs text-red-500">{errors.section}</p>}
              </div>

              {/* 3. Student ID, Name & Optional Scan ID Button */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <IdCard size={14} className="text-[#1B3A6B]" />
                    3. Student Identification
                  </label>

                  {/* Optional Scan ID Button (UI attached, non-functional as requested) */}
                  <button
                    type="button"
                    onClick={() => {
                      // Non-functional placeholder per user instruction
                    }}
                    title="ID Scanner will be enabled soon"
                    className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 text-[#1B3A6B] text-xs font-bold transition-all hover:bg-blue-100/60 cursor-default select-none"
                  >
                    <ScanLine size={15} className="text-blue-600" />
                    <span>Scan Student ID (Optional)</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-900 font-extrabold">
                      Soon
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Student ID *
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => {
                        setStudentId(e.target.value);
                        if (errors.studentId) {
                          setErrors(prev => {
                            const n = { ...prev };
                            delete n.studentId;
                            return n;
                          });
                        }
                      }}
                      placeholder="e.g., 202412345"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all ${
                        errors.studentId ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => {
                        setStudentName(e.target.value.toUpperCase());
                        if (errors.studentName) {
                          setErrors(prev => {
                            const n = { ...prev };
                            delete n.studentName;
                            return n;
                          });
                        }
                      }}
                      placeholder="LAST NAME, FIRST NAME M.I."
                      style={{ textTransform: 'uppercase' }}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all ${
                        errors.studentName ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.studentName && <p className="text-xs text-red-500 mt-1">{errors.studentName}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Sex
                    </label>
                    <select
                      value={sex}
                      onChange={e => setSex(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-2.5 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-gray-900 transition-all"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                </div>

                {/* Smart Auto-Match Suggestions if Student already exists in records */}
                {matchingExistingStudents.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                      <Sparkles size={13} className="text-amber-600" />
                      <span>Existing student record found (click to auto-fill):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingExistingStudents.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectExistingStudent(p)}
                          className="text-left px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 transition-colors text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="font-bold text-gray-900 uppercase">{p.name}</span>
                          <span className="text-[11px] font-mono text-gray-500">({p.id})</span>
                          {p.course && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                              {p.course}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* STEP 2: CONFIRMED -> CHOOSE CONSULTATION OR NON-CONSULTATION */
            <div className="py-3 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Student Confirmed
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-600">
                        ID: {confirmedPatient?.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 uppercase mt-1">
                      {confirmedPatient?.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#1B3A6B] mt-0.5">
                      {confirmedPatient?.department} • <span className="underline">{confirmedPatient?.course}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Edit Info
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="text-center">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Select Visit Type to Proceed
                  </h4>
                  <p className="text-xs text-gray-500">
                    The student's profile is now linked and ready for recording
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Consultation Button */}
                  <button
                    type="button"
                    onClick={() => confirmedPatient && onProceed('Consultation', confirmedPatient)}
                    className="group text-left p-5 rounded-2xl border-2 border-[#1B3A6B] bg-gradient-to-br from-[#1B3A6B] to-[#2465ad] text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
                        <Stethoscope size={22} className="text-[#F4C542]" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 text-white">
                        Doctor Visit
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-extrabold tracking-tight">
                        Consultation
                      </div>
                      <p className="text-xs text-blue-100/85 mt-1 leading-relaxed">
                        Full clinical assessment with doctor, vital signs, treatments, or early dismissal.
                      </p>
                    </div>
                  </button>

                  {/* Non-Consultation Button */}
                  <button
                    type="button"
                    onClick={() => confirmedPatient && onProceed('Non-Consultation', confirmedPatient)}
                    className="group text-left p-5 rounded-2xl border-2 border-sky-500 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
                        <ClipboardList size={22} className="text-white" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 text-white">
                        Nurse / Minor Visit
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-extrabold tracking-tight">
                        Non-Consultation
                      </div>
                      <p className="text-xs text-sky-100/90 mt-1 leading-relaxed">
                        Over-the-counter medicine request, blood pressure/vitals check, or minor first-aid.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
          {step === 'form' ? (
            <>
              <div className="text-xs text-gray-500 truncate">
                Selected: <strong className="text-gray-800">{selectedSection || 'None'}</strong>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="quick-student-form"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  style={{ background: PRIMARY }}
                >
                  <CheckCircle2 size={16} />
                  {isSaving ? 'Confirming...' : 'Confirm Student'}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close (Keep in Records Only)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
