import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { Patient, PatientCategory, StudentCategory, Page } from '../types';

const PRIMARY = '#1E5AA8';
const CATEGORIES: PatientCategory[] = ['Student', 'Employee', 'Outsider'];
const STUDENT_CATEGORIES: StudentCategory[] = ['Elementary', 'Junior High School', 'Senior High School', 'College'];

const studentCategoryColors: Record<StudentCategory, { bg: string; text: string }> = {
  'Elementary':         { bg: '#FFF3E0', text: '#E65100' },
  'Junior High School': { bg: '#E8F5E9', text: '#2E7D32' },
  'Senior High School': { bg: '#E3F2FD', text: '#1565C0' },
  'College':            { bg: '#F3E5F5', text: '#6A1B9A' },
};

const categoryColors: Record<PatientCategory, { bg: string; text: string }> = {
  Student:  { bg: '#E3F2FD', text: '#1B3A6B' },
  Employee: { bg: '#E8F5E9', text: '#2E7D32' },
  Outsider: { bg: '#F3E5F5', text: '#6A1B9A' },
};

interface PatientManagementProps {
  patients: Patient[];
  searchQuery: string;
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
  onEditPatient: (id: string | null) => void;
}

export function PatientManagement({ patients, searchQuery, onNavigate, onSelectPatient, onEditPatient }: PatientManagementProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  useEffect(() => {
    setLocalSearch(searchQuery);
    setPage(1);
  }, [searchQuery]);
  const [categoryFilter, setCategoryFilter] = useState<PatientCategory | 'All'>('All');
  const [studentCategoryFilter, setStudentCategoryFilter] = useState<StudentCategory | 'All'>('All');
  const [page, setPage] = useState(1);
  const ROWS = 10;

  const filtered = patients.filter(p => {
    const q = localSearch.toLowerCase();
    const matchSearch = !q || p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.contact.includes(q);
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchStudentCat = categoryFilter !== 'Student' || studentCategoryFilter === 'All' || p.studentCategory === studentCategoryFilter;
    return matchSearch && matchCat && matchStudentCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS));
  const paged = filtered.slice((page - 1) * ROWS, page * ROWS);

  const handleNewPatient = () => {
    onEditPatient(null);
    onNavigate('patient-form');
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Patient Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{patients.length} registered patients</p>
        </div>
        <button
          onClick={handleNewPatient}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 w-full sm:w-auto"
          style={{ background: PRIMARY }}
        >
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        {/* Search */}
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, name, or contact..."
            value={localSearch}
            onChange={e => { setLocalSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E5AA8] transition-all"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar">
          {(['All', ...CATEGORIES] as (PatientCategory | 'All')[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setStudentCategoryFilter('All'); setPage(1); }}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                background: categoryFilter === cat ? 'white' : 'transparent',
                color: categoryFilter === cat ? PRIMARY : '#6b7280',
                boxShadow: categoryFilter === cat ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Student sub-category filter */}
      {categoryFilter === 'Student' && (
        <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Level:</span>
          <div className="flex gap-1 flex-wrap">
            {(['All', ...STUDENT_CATEGORIES] as (StudentCategory | 'All')[]).map(sc => (
              <button
                key={sc}
                onClick={() => { setStudentCategoryFilter(sc); setPage(1); }}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all border"
                style={{
                  background: studentCategoryFilter === sc ? PRIMARY : 'transparent',
                  color: studentCategoryFilter === sc ? 'white' : '#6b7280',
                  borderColor: studentCategoryFilter === sc ? PRIMARY : '#e5e7eb',
                }}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table & Mobile Cards */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="hidden md:block overflow-x-auto hide-scrollbar">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafd' }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">ID</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Birthday</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Details</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-30" />
                      <span>No patients found</span>
                    </div>
                  </td>
                </tr>
              ) : paged.map(p => {
                const catColor = categoryColors[p.category];
                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-gray-600 hidden md:table-cell">{p.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: PRIMARY }}>
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: catColor.bg, color: catColor.text }}>
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">{p.contact}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 hidden lg:table-cell">{p.birthday}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                      {p.category === 'Student' && (
                        <span className="flex flex-col gap-0.5">
                          {p.studentCategory && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold w-fit"
                              style={{
                                background: studentCategoryColors[p.studentCategory]?.bg ?? '#f3f4f6',
                                color: studentCategoryColors[p.studentCategory]?.text ?? '#374151',
                              }}>
                              {p.studentCategory}
                            </span>
                          )}
                          <span>{p.course}{p.gradeLevel ? `Grade ${p.gradeLevel}` : ''}{p.yearLevel ? `, ${p.yearLevel}` : ''}</span>
                        </span>
                      )}
                      {p.category === 'Employee' && <span>{p.position}</span>}
                      {p.category === 'Outsider' && <span className="truncate max-w-[120px] inline-block">{p.address}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { onSelectPatient(p.id); onNavigate('patient-profile'); }}
                          title="View Profile"
                          className="p-1.5 rounded-lg transition-colors hover:bg-blue-100 text-blue-600"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => { onSelectPatient(p.id); onNavigate('new-consultation'); }}
                          title="New Consultation"
                          className="p-1.5 rounded-lg transition-colors hover:bg-green-100 text-green-600"
                        >
                          <Stethoscope size={15} />
                        </button>
                        <button
                          onClick={() => { onEditPatient(p.id); onNavigate('patient-form'); }}
                          title="Edit Patient"
                          className="p-1.5 rounded-lg transition-colors hover:bg-yellow-100 text-yellow-700"
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Patient Cards */}
        <div className="flex flex-col gap-3 p-4 md:hidden bg-gray-50/50">
          {paged.map(p => {
            return (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm"
                      style={{ background: PRIMARY }}>
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 leading-tight">{p.name}</span>
                      <span className="text-xs text-gray-500 font-mono mt-0.5">{p.id}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide flex-shrink-0"
                    style={{
                      background: p.category === 'Student' ? '#E3F2FD' : p.category === 'Employee' ? '#E8F5E9' : '#F3E5F5',
                      color: p.category === 'Student' ? '#1B3A6B' : p.category === 'Employee' ? '#2E7D32' : '#6A1B9A',
                    }}>
                    {p.category}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</span>
                    <span className="text-sm text-gray-700">{p.contact}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Birthday</span>
                    <span className="text-sm text-gray-700">{p.birthday}</span>
                  </div>
                  {p.studentCategory && (
                    <div className="flex flex-col col-span-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Course/Year</span>
                      <span className="text-sm text-gray-700 font-medium">{p.studentCategory}</span>
                    </div>
                  )}
                  {p.employeeDepartment && (
                    <div className="flex flex-col col-span-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Department</span>
                      <span className="text-sm text-gray-700 font-medium">{p.employeeDepartment}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => { onSelectPatient(p.id); onNavigate('patient-profile'); }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    View Profile
                  </button>
                  <button 
                    onClick={() => { onSelectPatient(p.id); onNavigate('new-consultation'); }}
                    className="flex-1 py-2.5 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                    <Stethoscope size={14} /> Add Consult
                  </button>
                </div>
              </div>
            );
          })}
          {paged.length === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">
              No patients found matching the criteria.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * ROWS + 1}–{Math.min(page * ROWS, filtered.length)} of {filtered.length} patients
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 font-medium">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
