import { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, RefreshCw, ArrowUpRight, CheckCircle2, X, Eye, TrendingDown, TrendingUp, Calendar, PackageSearch } from 'lucide-react';
import { MedicineItem, StockHistory } from '../types';
import { getManilaDate, formatManilaDateTime, normalizeDate } from '@/utils/philippineTime';
import {
  getEffectiveThreshold,
  getMedicineStockStatus,
  getDefaultThresholdByName,
  isFastMovingMedicine,
  getEffectiveExpirationDate,
  getExpirationState,
  formatExpirationDisplay,
  toMonthInputValue,
} from '@/utils/medicineRules';

const PRIMARY = '#1B3A6B';
const RED = '#D64545';
const YELLOW = '#F59E0B';
const GREEN = '#2E7D32';

interface InventoryProps {
  medicines: MedicineItem[];
  onUpdateMedicine: (medicine: MedicineItem) => void | Promise<void>;
  onAddMedicine: (medicine: MedicineItem) => void | Promise<void>;
  searchQuery: string;
}

export function Inventory({ medicines, onUpdateMedicine, onAddMedicine, searchQuery }: InventoryProps) {
  const displayMedicines = medicines ?? [];

  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Low Stock' | 'Out of Stock' | 'Healthy'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Medicine' | 'Supply'>('All');

  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);
  const [adjustModal, setAdjustModal] = useState<MedicineItem | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'dispense'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustExpiration, setAdjustExpiration] = useState('');
  const [historyModal, setHistoryModal] = useState<MedicineItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customThresholdEdited, setCustomThresholdEdited] = useState(false);
  const [newMed, setNewMed] = useState<{
    name: string;
    stock: string;
    dateAdded: string;
    unit: string;
    threshold: string;
    category: 'Medicine' | 'Supply';
    expirationDate: string;
  }>({
    name: '',
    stock: '',
    dateAdded: getManilaDate(),
    unit: 'Tablet',
    threshold: '15',
    category: 'Medicine',
    expirationDate: '',
  });

  const getMedicineDetails = (m: MedicineItem) => {
    const adds = (m.stockHistory || []).filter(h => h.type === 'add').reduce((sum, h) => sum + (Number(h.qty) || 0), 0);
    const historyDispenses = (m.stockHistory || []).filter(h => h.type === 'dispense').reduce((sum, h) => sum + (Number(h.qty) || 0), 0);
    const dispensed = Math.max(Number(m.dispensed) || 0, historyDispenses);
    const beginningQty = m.beginningQty !== undefined && m.beginningQty !== null ? m.beginningQty : (adds > 0 ? adds : m.stock + dispensed);

    const thresh = getEffectiveThreshold(m);
    const fastMoving = isFastMovingMedicine(m.name);
    const status = getMedicineStockStatus(m);
    const rawExp = getEffectiveExpirationDate(m);
    const expState = getExpirationState(rawExp);

    let displayUnit = m.unit.charAt(0).toUpperCase() + m.unit.slice(1);
    if (!displayUnit.endsWith('s') && displayUnit !== 'Ointment' && displayUnit !== 'Syrup') {
      displayUnit += 's';
    }

    return {
      beginningQty,
      dispensed,
      status,
      thresh,
      fastMoving,
      expirationDisplay: expState.display,
      expirationStatus: expState.status,
      displayUnit,
      batchNumber: m.batchNumber || '',
    };
  };

  const query = (localSearch || searchQuery || '').trim().toLowerCase();

  const seenMedKeys = new Set<string>();
  const filtered = displayMedicines.filter(m => {
    const key = m.id ? `id:${m.id}` : '';
    const nameKey = (m.name || '').trim().toLowerCase();
    if (key && seenMedKeys.has(key)) return false;
    if (nameKey && seenMedKeys.has(nameKey)) return false;
    if (key) seenMedKeys.add(key);
    if (nameKey) seenMedKeys.add(nameKey);

    const details = getMedicineDetails(m);

    // Deep search matching across all fields: name, category, unit, status, dateAdded, and stock history notes
    const matchSearch = !query || 
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.category && m.category.toLowerCase().includes(query)) ||
      (m.unit && m.unit.toLowerCase().includes(query)) ||
      (details.displayUnit && details.displayUnit.toLowerCase().includes(query)) ||
      (details.status && details.status.toLowerCase().includes(query)) ||
      (details.expirationDisplay && details.expirationDisplay.toLowerCase().includes(query)) ||
      (m.dateAdded && m.dateAdded.toLowerCase().includes(query)) ||
      (m.stockHistory || []).some(h => (h.note && h.note.toLowerCase().includes(query)));

    const matchStatus = statusFilter === 'All' || details.status === statusFilter;
    const matchType = typeFilter === 'All' || m.category === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Calculate stock summaries across all items
  const healthyCount = displayMedicines.filter(m => getMedicineDetails(m).status === 'Healthy').length;
  const lowStockCount = displayMedicines.filter(m => getMedicineDetails(m).status === 'Low Stock').length;
  const outOfStockCount = displayMedicines.filter(m => getMedicineDetails(m).status === 'Out of Stock').length;

  const handleAdjustStock = async () => {
    if (!adjustModal || !adjustQty) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) return;

    const details = getMedicineDetails(adjustModal);
    const newStock = adjustType === 'add' ? adjustModal.stock + qty : Math.max(0, adjustModal.stock - qty);
    const newDispensed = adjustType === 'dispense' ? (details.dispensed + qty) : details.dispensed;
    const thresh = getEffectiveThreshold(adjustModal);
    const formattedExp = adjustExpiration.trim()
      ? formatExpirationDisplay(adjustExpiration)
      : getEffectiveExpirationDate(adjustModal);
    
    let newStatus: 'Normal' | 'Low Stock' | 'Out of Stock' = 'Normal';
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock <= thresh) newStatus = 'Low Stock';

    const updated: MedicineItem = {
      ...adjustModal,
      stock: newStock,
      dispensed: newDispensed,
      threshold: thresh,
      expirationDate: formattedExp || adjustModal.expirationDate,
      status: newStatus as any,
      stockHistory: [...(adjustModal.stockHistory || []), {
        date: getManilaDate(),
        qty,
        type: adjustType,
        note: adjustNote || (adjustType === 'add' ? 'Manual stock intake' : 'Stock adjustment decrement'),
      }],
    };

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onUpdateMedicine(updated);
      setAdjustModal(null);
      setAdjustQty('');
      setAdjustNote('');
      setAdjustExpiration('');
    } catch (e: any) {
      if (e?.message !== 'PIN_CANCELLED') {
        console.error(e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewMedicine = async () => {
    if (isSubmitting) return;
    if (!newMed.name || !newMed.stock) return;
    setIsSubmitting(true);
    const qty = parseInt(newMed.stock) || 0;
    const defaultThresh = getDefaultThresholdByName(newMed.name);
    const thresh = customThresholdEdited ? (parseInt(newMed.threshold) || defaultThresh) : defaultThresh;
    const formattedExp = formatExpirationDisplay(newMed.expirationDate) || getEffectiveExpirationDate({ name: newMed.name });
    const med: MedicineItem = {
      id: `m${Date.now()}`,
      name: newMed.name,
      stock: qty,
      unit: newMed.unit,
      category: newMed.category,
      dateAdded: newMed.dateAdded || getManilaDate(),
      status: qty === 0 ? 'Out of Stock' : qty <= thresh ? 'Low Stock' : 'Normal',
      beginningQty: qty,
      dispensed: 0,
      threshold: thresh,
      expirationDate: formattedExp || null,
      stockHistory: [{ date: newMed.dateAdded || getManilaDate(), qty, type: 'add', note: 'Initial inventory' }],
    };

    try {
      await onAddMedicine(med);
      setShowAddForm(false);
      setCustomThresholdEdited(false);
      setNewMed({ name: '', stock: '', dateAdded: getManilaDate(), unit: 'Tablet', threshold: '15', category: 'Medicine', expirationDate: '' });
    } catch (e: any) {
      if (e?.message !== 'PIN_CANCELLED') {
        console.error(e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Pharmacy Inventory</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-all w-full sm:w-auto"
          style={{ background: PRIMARY }}
        >
          <Plus size={18} /> Add Stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Healthy Stock', filter: 'Healthy' as const, value: healthyCount, color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle2 size={20} /> },
          { label: 'Low Stock', filter: 'Low Stock' as const, value: lowStockCount, color: RED, bg: `${RED}15`, icon: <AlertTriangle size={20} /> },
          { label: 'Out of Stock', filter: 'Out of Stock' as const, value: outOfStockCount, color: '#991B1B', bg: '#FEE2E2', icon: <X size={20} /> },
          { label: 'Total Items', filter: 'All' as const, value: displayMedicines.length, color: PRIMARY, bg: `${PRIMARY}15`, icon: <CheckCircle2 size={20} /> },
        ].map(s => {
          const isActive = statusFilter === s.filter;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                if (s.filter === 'All') {
                  setStatusFilter('All');
                } else {
                  setStatusFilter(prev => prev === s.filter ? 'All' : s.filter);
                }
              }}
              aria-pressed={isActive}
              title={isActive ? `Clear ${s.label} filter` : `Filter by ${s.label}`}
              className={`bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                isActive ? 'ring-2' : 'hover:border-gray-300'
              }`}
              style={{
                boxShadow: isActive ? `0 4px 14px ${s.color}25` : '0 2px 12px rgba(0,0,0,0.06)',
                border: isActive ? `2px solid ${s.color}` : '1px solid #f0f0f0',
                outline: 'none',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 font-medium truncate">{s.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search medicine, supply, unit, status, remarks..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/20 transition-all shadow-xs"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-3 pr-1.5 whitespace-nowrap">Status:</span>
            {(['All', 'Healthy', 'Low Stock', 'Out of Stock'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-sm shadow-sky-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-3 pr-1.5 whitespace-nowrap">Type:</span>
            {(['All', 'Medicine', 'Supply'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-sm shadow-sky-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-gray-800">Inventory List</h3>
          <span className="text-xs text-gray-400">{filtered.length} items found</span>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr style={{ background: '#f8fafd' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Medicine Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Beg. Qty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dispensed</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock Count</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expiration Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <PackageSearch size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No inventory items found</p>
                    {query ? (
                      <p className="text-xs text-gray-400 mt-1">
                        No matches for "{query}". <button onClick={() => setLocalSearch('')} className="text-[#1E5AA8] underline font-medium hover:opacity-80">Clear search</button>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Try selecting a different filter.</p>
                    )}
                  </td>
                </tr>
              ) : filtered.map(m => {
                const details = getMedicineDetails(m);
                const isOut = details.status === 'Out of Stock';
                const isLow = details.status === 'Low Stock';
                const expBadgeStyle =
                  details.expirationStatus === 'expired'
                    ? { background: `${RED}18`, color: RED }
                    : details.expirationStatus === 'expiring-soon'
                    ? { background: `${YELLOW}20`, color: '#b45309' }
                    : { background: '#F1F5F9', color: '#334155' };

                return (
                  <tr key={m.id} className={isOut || isLow ? "hover:bg-red-50/30 transition-colors" : "hover:bg-gray-50 transition-colors"}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">{m.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            details.fastMoving
                              ? 'bg-blue-50 text-[#1E5AA8] border border-blue-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          title={details.fastMoving ? 'Fast-moving item: Red low stock at ≤100 pcs' : `Standard item: Red low stock at ≤${details.thresh} pcs`}
                        >
                          {details.fastMoving ? `Fast-Moving (Min: ${details.thresh})` : `Min: ${details.thresh}`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Added: {normalizeDate(m.dateAdded) || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{details.beginningQty} <span className="text-xs text-gray-400">{details.displayUnit}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-700">{details.dispensed}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold" style={{ color: isOut ? '#991B1B' : isLow ? RED : '#374151' }}>
                        {m.stock} <span className="text-xs text-gray-500 font-normal">{details.displayUnit}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-bold"
                        style={expBadgeStyle}
                      >
                        <Calendar size={12} />
                        <span>{details.expirationDisplay}</span>
                        {details.expirationStatus === 'expired' && (
                          <span className="text-[10px] uppercase font-extrabold ml-0.5">(EXPIRED)</span>
                        )}
                        {details.expirationStatus === 'expiring-soon' && (
                          <span className="text-[10px] uppercase font-extrabold ml-0.5">(SOON)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1"
                        style={{
                          background: isOut ? '#FEE2E2' : isLow ? `${RED}18` : '#E8F5E9',
                          color: isOut ? '#991B1B' : isLow ? RED : '#2E7D32',
                          border: isLow ? `1px solid ${RED}40` : isOut ? '1px solid #FCA5A5' : 'none',
                        }}>
                        {isLow && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: RED }} />}
                        {details.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setAdjustModal(m);
                            setAdjustType('add');
                            setAdjustQty('');
                            setAdjustNote('');
                            setAdjustExpiration(toMonthInputValue(getEffectiveExpirationDate(m)));
                          }}
                          className="px-3 py-1 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                          style={{ background: PRIMARY }}
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => setHistoryModal(m)}
                          className="rounded-lg border border-gray-200 transition-colors flex items-center justify-center w-8 h-8 flex-shrink-0 text-[#1B3A6B] hover:bg-blue-50"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100 p-4">
            <PackageSearch size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">No inventory items found</p>
            {query && (
              <p className="text-xs text-gray-400 mt-1">
                No matches for "{query}". <button onClick={() => setLocalSearch('')} className="text-[#1E5AA8] underline font-medium">Clear search</button>
              </p>
            )}
          </div>
        ) : filtered.map(m => {
          const details = getMedicineDetails(m);
          const isOut = details.status === 'Out of Stock';
          const isLow = details.status === 'Low Stock';
          return (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-gray-900 leading-tight">{m.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {details.fastMoving ? `Fast-Moving (Low Stock ≤ ${details.thresh})` : `Low Stock ≤ ${details.thresh}`}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide flex-shrink-0"
                  style={{
                    background: isOut ? '#FEE2E2' : isLow ? `${RED}18` : '#E8F5E9',
                    color: isOut ? '#991B1B' : isLow ? RED : '#2E7D32',
                  }}>
                  {details.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100 mt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Beg. Qty</span>
                  <span className="text-sm text-gray-700">{details.beginningQty} {details.displayUnit}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Dispensed</span>
                  <span className="text-sm text-gray-700">{details.dispensed}</span>
                </div>
                <div className="flex flex-col mt-1 border-t border-gray-200 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Current Stock</span>
                  <span className="text-base font-bold" style={{ color: isOut ? '#991B1B' : isLow ? RED : '#374151' }}>
                    {m.stock} <span className="text-xs font-normal text-gray-500">{details.displayUnit}</span>
                  </span>
                </div>
                <div className="flex flex-col mt-1 border-t border-gray-200 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Expiration</span>
                  <span className="text-sm font-bold" style={{ color: details.expirationStatus === 'expired' ? RED : details.expirationStatus === 'expiring-soon' ? '#b45309' : '#374151' }}>
                    {details.expirationDisplay}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => setHistoryModal(m)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5">
                  <Eye size={14} /> History
                </button>
                <button 
                  onClick={() => {
                    setAdjustModal(m);
                    setAdjustType('add');
                    setAdjustQty('');
                    setAdjustNote('');
                    setAdjustExpiration(toMonthInputValue(getEffectiveExpirationDate(m)));
                  }}
                  className="flex-1 py-2 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900 font-bold">Adjust Medicine Stock</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{adjustModal.name} ({getMedicineDetails(adjustModal).batchNumber})</p>
              </div>
              <button onClick={() => setAdjustModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  adjustType === 'add' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp size={14} /> Intake
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('dispense')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  adjustType === 'dispense' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingDown size={14} /> Dispense
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity ({adjustModal.unit})</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} min={1}
                placeholder="Enter amount..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason (Optional)</label>
              <input type="text" value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                placeholder="e.g. Delivery or Clinic dispense"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
            </div>
            {adjustType === 'add' && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Expiration Date (Month &amp; Year)
                </label>
                <input
                  type="month"
                  value={adjustExpiration}
                  onChange={e => setAdjustExpiration(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                />
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAdjustModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdjustStock}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{ background: adjustType === 'add' ? '#2E7D32' : RED }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-bold text-lg">Register New Medicine</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Medicine Name</label>
                <input
                  type="text"
                  value={newMed.name}
                  onChange={e => {
                    const nextName = e.target.value;
                    const autoThresh = String(getDefaultThresholdByName(nextName));
                    const defaultExp = toMonthInputValue(getEffectiveExpirationDate({ name: nextName }));
                    setNewMed(n => ({
                      ...n,
                      name: nextName,
                      threshold: customThresholdEdited ? n.threshold : autoThresh,
                      expirationDate: n.expirationDate || defaultExp,
                    }));
                  }}
                  placeholder="e.g. Biogesic 500mg tab"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Beginning Inventory Qty</label>
                <input type="number" min={0} value={newMed.stock} onChange={e => setNewMed(n => ({ ...n, stock: e.target.value }))}
                  placeholder="e.g. 100"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date Added</label>
                <input type="date" value={newMed.dateAdded} onChange={e => setNewMed(n => ({ ...n, dateAdded: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expiration Date (Month &amp; Year)</label>
                <input
                  type="month"
                  value={newMed.expirationDate}
                  onChange={e => setNewMed(n => ({ ...n, expirationDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select value={newMed.category} onChange={e => setNewMed(n => ({ ...n, category: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
                  <option value="Medicine">Medicine</option>
                  <option value="Supply">Supply</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock Unit Type</label>
                <select value={newMed.unit} onChange={e => setNewMed(n => ({ ...n, unit: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
                  {['Tablet', 'Bottle', 'Capsule', 'Sachet', 'Ointment', 'Tube', 'Respules', 'Nebules', 'Vials', 'Packs', 'Granules', 'Drops', 'Piece'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Low Stock Threshold ({isFastMovingMedicine(newMed.name) ? 'Fast-Moving Default: 100 pcs' : 'Standard Default: 15 pcs'})
                </label>
                <input
                  type="number"
                  min={1}
                  value={newMed.threshold}
                  onChange={e => {
                    setCustomThresholdEdited(true);
                    setNewMed(n => ({ ...n, threshold: e.target.value }));
                  }}
                  placeholder="100 for fast-moving, 15 for standard"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddNewMedicine} disabled={!newMed.name || !newMed.stock}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ background: PRIMARY }}>
                Create Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900 font-bold">{historyModal.name}</h3>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1">
              {(!historyModal.stockHistory || historyModal.stockHistory.length === 0) ? (
                <p className="text-center py-8 text-gray-400 text-sm">No transaction history recorded yet.</p>
              ) : historyModal.stockHistory.map((h, i) => (
                <div key={i} className={`flex items-center gap-3.5 p-3.5 rounded-xl border ${
                  h.type === 'add' ? 'bg-green-50/40 border-green-100' : 'bg-red-50/40 border-red-100'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    h.type === 'add' ? 'bg-[#2E7D32]' : 'bg-[#D64545]'
                  }`}>
                    {h.type === 'add' ? '+' : '−'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">
                      {h.type === 'add' ? 'Restocked' : 'Dispensed'} {h.qty} {historyModal.unit}s
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatManilaDateTime(h.date)} — <span className="italic">{h.note || 'No remarks'}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-right">
              <button
                onClick={() => setHistoryModal(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

