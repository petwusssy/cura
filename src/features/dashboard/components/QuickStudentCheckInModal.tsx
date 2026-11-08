import { useState, useMemo, useEffect } from 'react';
import {
  X, ScanLine, CheckCircle2, Stethoscope, ClipboardList,
  Building2, Users, Search, ArrowLeft, UserCheck, Sparkles, IdCard, Plus, Trash2
} from 'lucide-react';
import { Patient } from '../types';
import {
  DepartmentSectionGroup,
  loadDepartmentSectionGroups,
  saveDepartmentSectionGroups,
  inferYearLevelFromSection
} from '../constants/sectionsData';
import { StudentIdScannerModal } from './StudentIdScannerModal';
import { toast } from 'sonner';

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
  const [deptGroups, setDeptGroups] = useState<DepartmentSectionGroup[]>(() => loadDepartmentSectionGroups());
  const [step, setStep] = useState<'form' | 'confirmed'>('form');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(deptGroups[0].id);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sectionSearch, setSectionSearch] = useState<string>('');
  const [isAddingSection, setIsAddingSection] = useState<boolean>(false);
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [sex, setSex] = useState<string>('Female');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmedPatient, setConfirmedPatient] = useState<Patient | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const selectedDept = useMemo(
    () => deptGroups.find(d => d.id === selectedDeptId) || deptGroups[0],
    [deptGroups, selectedDeptId]
  );

  const filteredSections = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    if (!q) return selectedDept.sections;
    return selectedDept.sections.filter(sec => sec.toLowerCase().includes(q));
  }, [selectedDept, sectionSearch]);

  const crossDeptMatches = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    if (!q || filteredSections.length > 0) return [];
    const results: { deptId: string; deptShortName: string; section: string }[] = [];
    deptGroups.forEach(dept => {
      if (dept.id === selectedDeptId) return;
      dept.sections.forEach(sec => {
        if (sec.toLowerCase().includes(q)) {
          results.push({ deptId: dept.id, deptShortName: dept.shortName, section: sec });
        }
      });
    });
    return results.slice(0, 12);
  }, [deptGroups, sectionSearch, filteredSections, selectedDeptId]);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadDepartmentSectionGroups();
      setDeptGroups(loaded);
      setStep('form');
      setSelectedDeptId(loaded[0].id);
      setSelectedSection(loaded[0].sections[0] || '');
      setSectionSearch('');
      setIsAddingSection(false);
      setNewSectionName('');
      setIsDeleteMode(false);
      setStudentId('');
      setStudentName('');
      setSex('Female');
      setErrors({});
      setIsSaving(false);
      setConfirmedPatient(null);
    }
  }, [isOpen]);

  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSectionSearch('');
    setIsAddingSection(false);
    setNewSectionName('');
    const dept = deptGroups.find(d => d.id === deptId);
    setSelectedSection(dept?.sections[0] || '');
    if (errors.section) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.section;
        return next;
      });
    }
  };

  const handleAddSection = (rawName?: string) => {
    const clean = (rawName ?? newSectionName).trim().toUpperCase();
    if (!clean) return;
    if (selectedDept.sections.some(s => s.toUpperCase() === clean)) {
      setSelectedSection(clean);
      setNewSectionName('');
      setIsAddingSection(false);
      setSectionSearch('');
      toast.info(`Section "${clean}" already exists in ${selectedDept.shortName}`);
      return;
    }

    const updated = deptGroups.map(d =>
      d.id === selectedDept.id ? { ...d, sections: [...d.sections, clean] } : d
    );
    setDeptGroups(updated);
    saveDepartmentSectionGroups(updated);
    setSelectedSection(clean);
    setNewSectionName('');
    setIsAddingSection(false);
    setSectionSearch('');
    toast.success(`Added "${clean}" to ${selectedDept.shortName}`);
  };

  const handleDeleteSection = (secToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deptGroups.map(d => {
      if (d.id !== selectedDept.id) return d;
      return { ...d, sections: d.sections.filter(s => s !== secToDelete) };
    });
    setDeptGroups(updated);
    saveDepartmentSectionGroups(updated);

    if (selectedSection === secToDelete) {
      const remaining = updated.find(d => d.id === selectedDept.id)?.sections || [];
      setSelectedSection(remaining[0] || '');
    }
    toast.success(`Removed "${secToDelete}" from ${selectedDept.shortName}`);
  };

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
    if (p.course) {
      const foundDept = deptGroups.find(d =>
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
    } catch (err: any) {
      if (err?.message === 'PIN_CANCELLED') {
        setIsSaving(false);
        return;
      }
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
        {/* Top Modal Header (Cleaned up without subtitle clutter) */}
        <div
          className="px-5 py-3.5 flex items-center justify-between text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0d213f 0%, #1B3A6B 60%, #2465ad 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <UserCheck size={18} className="text-[#F4C542]" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Quick Student Walk-In
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4C542]/20 text-[#F4C542] border border-[#F4C542]/40">
                Fast Triage
              </span>
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
                  {deptGroups.map(dept => {
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

              {/* 2. Section Selection + Add / Delete Controls */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <Users size={14} className="text-[#1B3A6B]" />
                    2. Select Year & Section ({selectedDept.shortName})
                  </label>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {/* Search Filter */}
                    <div className="relative flex-1 sm:w-44">
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

                    {/* + Add Section Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSection(prev => !prev);
                        setIsDeleteMode(false);
                      }}
                      title="Add new section to this department"
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex-shrink-0 ${
                        isAddingSection
                          ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                          : 'bg-white text-[#1B3A6B] border-gray-200 hover:bg-blue-50'
                      }`}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>

                    {/* Delete Mode Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteMode(prev => !prev);
                        setIsAddingSection(false);
                      }}
                      title={isDeleteMode ? 'Done removing sections' : 'Remove sections'}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex-shrink-0 ${
                        isDeleteMode
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50'
                      }`}
                    >
                      <Trash2 size={13} />
                      <span>{isDeleteMode ? 'Done' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Section Bar */}
                {isAddingSection && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-blue-200 shadow-2xs animate-in fade-in duration-150">
                    <input
                      type="text"
                      autoFocus
                      value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSection();
                        }
                      }}
                      placeholder={`New section for ${selectedDept.shortName} (e.g., BSN 1I)`}
                      style={{ textTransform: 'uppercase' }}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B3A6B] text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSection()}
                      disabled={!newSectionName.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-bold hover:opacity-95 disabled:opacity-40 cursor-pointer"
                    >
                      Save Section
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionName('');
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {isDeleteMode && (
                  <div className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200/70 rounded-lg px-3 py-1.5 flex items-center justify-between">
                    <span>Click any section below to delete it from {selectedDept.shortName}.</span>
                  </div>
                )}

                {/* Section Chips / Scrollable Grid */}
                <div className="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                  {filteredSections.length === 0 ? (
                    <div className="w-full space-y-2 py-2">
                      {crossDeptMatches.length > 0 && (
                        <div className="space-y-1.5">
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
                      )}
                      {sectionSearch.trim() && (
                        <div className="flex items-center justify-between gap-2 bg-white border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600">
                          <span>No section "<strong>{sectionSearch.toUpperCase()}</strong>" in {selectedDept.shortName}</span>
                          <button
                            type="button"
                            onClick={() => handleAddSection(sectionSearch)}
                            className="px-3 py-1 rounded-lg bg-[#1B3A6B] text-white font-bold text-xs hover:opacity-90 cursor-pointer"
                          >
                            + Add "{sectionSearch.trim().toUpperCase()}"
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredSections.map(sec => {
                      const isSelected = selectedSection === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={e => {
                            if (isDeleteMode) {
                              handleDeleteSection(sec, e);
                              return;
                            }
                            setSelectedSection(sec);
                            if (errors.section) {
                              setErrors(prev => {
                                const n = { ...prev };
                                delete n.section;
                                return n;
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            isDeleteMode
                              ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-600 hover:text-white'
                              : isSelected
                                ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <span>{sec}</span>
                          {isDeleteMode && <X size={12} className="flex-shrink-0" />}
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

                  {/* Scan ID Button */}
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    title="Scan Student ID card with camera or photo"
                    className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50/80 text-[#1B3A6B] hover:bg-blue-100 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <ScanLine size={15} className="text-blue-600" />
                    <span>Scan Student ID</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-200/90 text-blue-900 font-extrabold flex items-center gap-1">
                      <Sparkles size={10} className="text-blue-700" /> OCR
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

      {/* ID Scanner Modal */}
      <StudentIdScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        initialId={studentId}
        initialName={studentName}
        onApply={({ studentId: newId, studentName: newName }) => {
          if (newId) setStudentId(newId);
          if (newName) setStudentName(newName);
          setErrors(prev => {
            const next = { ...prev };
            if (newId) delete next.studentId;
            if (newName) delete next.studentName;
            return next;
          });
        }}
      />
    </div>
  );
}
