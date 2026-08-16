import { useState, useEffect, useRef } from 'react';
import { Search, User, Stethoscope, Package } from 'lucide-react';
import { Patient, Consultation, MedicineItem, Page } from '../../types';

interface GlobalSearchProps {
  patients: Patient[];
  consultations: Consultation[];
  medicines: MedicineItem[];
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
}

export function GlobalSearch({ patients, consultations, medicines, onNavigate, onSelectPatient }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getResults = () => {
    if (!query) return [];
    
    const q = query.toLowerCase();
    const results = [];

    // Search Patients
    const matchedPatients = patients.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)).slice(0, 5);
    matchedPatients.forEach(p => {
      results.push({
        id: p.id,
        type: 'Patient',
        title: p.name,
        subtitle: `ID: ${p.id} - ${p.category}`,
        icon: <User size={16} className="text-[#1B3A6B]" />,
        action: () => {
          onSelectPatient(p.id);
          onNavigate('patient-profile');
          setIsOpen(false);
          setQuery('');
        }
      });
    });

    // Search Consultations
    const matchedConsultations = consultations.filter(c => c.complaint.toLowerCase().includes(q) || c.diagnosis?.toLowerCase().includes(q)).slice(0, 3);
    matchedConsultations.forEach(c => {
      const patient = patients.find(p => p.id === c.patientId);
      results.push({
        id: c.id,
        type: 'Consultation',
        title: c.complaint,
        subtitle: `Patient: ${patient?.name || c.patientId} - Date: ${c.date}`,
        icon: <Stethoscope size={16} className="text-green-600" />,
        action: () => {
          onSelectPatient(c.patientId);
          onNavigate(c.status === 'Consultation' ? 'consultations' : 'non-consultations');
          setIsOpen(false);
          setQuery('');
        }
      });
    });

    // Search Medicines
    const matchedMedicines = medicines.filter(m => m.name.toLowerCase().includes(q) || m.batchNumber?.toLowerCase().includes(q)).slice(0, 3);
    matchedMedicines.forEach(m => {
      results.push({
        id: m.id,
        type: 'Medicine',
        title: m.name,
        subtitle: `Stock: ${m.stock} ${m.unit}`,
        icon: <Package size={16} className="text-yellow-600" />,
        action: () => {
          onNavigate('inventory');
          setIsOpen(false);
          setQuery('');
        }
      });
    });

    return results;
  };

  const results = getResults();

  return (
    <div className="flex-1 max-w-md relative" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/70" size={18} />
      <input
        type="text"
        placeholder="Search patients, records, medicines..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query) setIsOpen(true);
        }}
        className="w-full pl-9 pr-4 py-2 bg-[#1E5AA8]/5 border border-[#1E5AA8]/20 rounded-xl text-sm text-[#1B3A6B] placeholder-[#1B3A6B]/60 focus:outline-none focus:border-[#1B3A6B] focus:bg-[#1E5AA8]/10 transition-all shadow-inner"
      />

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={r.action}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg">
                    {r.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{r.title}</div>
                    <div className="text-xs text-gray-500">{r.subtitle}</div>
                  </div>
                  <div className="ml-auto text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tracking-wider mt-1">
                    {r.type}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
