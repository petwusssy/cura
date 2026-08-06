import { useState } from 'react';
import { Search, Plus, AlertTriangle, RefreshCw, ArrowUpRight, CheckCircle2, X, Eye, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { MedicineItem, StockHistory } from '../types';
import { mockMedicines } from '../services/mockData';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';
const YELLOW = '#F4C542';
const GREEN = '#1E8E3E';

interface InventoryProps {
  medicines: MedicineItem[];
  onUpdateMedicine: (medicine: MedicineItem) => void | Promise<void>;
  onAddMedicine: (medicine: MedicineItem) => void | Promise<void>;
}

export function Inventory({ medicines, onUpdateMedicine, onAddMedicine }: InventoryProps) {
  // Use provided medicines or fallback to mockMedicines if empty or missing clinic catalog
  const displayMedicines = (medicines && medicines.length >= 40) ? medicines : mockMedicines;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Low Stock' | 'Out of Stock' | 'Healthy'>('All');
  const [adjustModal, setAdjustModal] = useState<MedicineItem | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'dispense'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [historyModal, setHistoryModal] = useState<MedicineItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    batchNumber: '',
    stock: '',
    dateAdded: new Date().toISOString().split('T')[0],
    unit: 'Tablet',
    threshold: '15'
  });

  const getMedicineDetails = (m: MedicineItem) => {
    let batchNumber = m.batchNumber;
    if (!batchNumber) {
      const clean = m.name.replace(/[^a-zA-Z]/g, '').toUpperCase();
      const prefix = (clean + 'MED').slice(0, 3);
      const hash = m.name.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0) % 900 + 100;
      batchNumber = `B-${prefix}${hash}`;
    }

    const adds = m.stockHistory.filter(h => h.type === 'add').reduce((sum, h) => sum + h.qty, 0);
    const dispenses = m.stockHistory.filter(h => h.type === 'dispense').reduce((sum, h) => sum + h.qty, 0);
    const dispensed = m.dispensed ?? dispenses;
    const beginningQty = m.beginningQty !== undefined ? m.beginningQty : (adds > 0 ? adds : m.stock + dispensed);

    const thresh = m.threshold ?? 5;
    let status: 'Healthy' | 'Low Stock' | 'Out of Stock' = 'Healthy';
    if (m.stock === 0 || m.status === 'Out of Stock') {
      status = 'Out of Stock';
    } else if (m.stock <= thresh || m.status === 'Low Stock') {
      status = 'Low Stock';
    } else {
      status = 'Healthy';
    }

    let displayUnit = m.unit.charAt(0).toUpperCase() + m.unit.slice(1);
    if (!displayUnit.endsWith('s') && displayUnit !== 'Ointment' && displayUnit !== 'Syrup') {
      displayUnit += 's';
    }

    return { batchNumber, beginningQty, dispensed, status, displayUnit };
  };

  const filtered = displayMedicines.filter(m => {
    const details = getMedicineDetails(m);
    const matchSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      details.batchNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || details.status === statusFilter;
    return matchSearch && matchStatus;
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
    const thresh = adjustModal.threshold ?? 5;
    
    let newStatus: 'Normal' | 'Low Stock' | 'Out of Stock' = 'Normal';
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock <= thresh) newStatus = 'Low Stock';

    const updated: MedicineItem = {
      ...adjustModal,
      stock: newStock,
      dispensed: newDispensed,
      status: newStatus as any,
      stockHistory: [...(adjustModal.stockHistory || []), {
        date: new Date().toISOString().split('T')[0],
        qty,
        type: adjustType,
        note: adjustNote || (adjustType === 'add' ? 'Manual stock intake' : 'Stock adjustment decrement'),
      }],
    };

    try {
      await onUpdateMedicine(updated);
      setAdjustModal(null);
      setAdjustQty('');
      setAdjustNote('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNewMedicine = async () => {
    if (!newMed.name || !newMed.stock) return;
    const qty = parseInt(newMed.stock) || 0;
    const thresh = parseInt(newMed.threshold) || 15;
    const med: MedicineItem = {
      id: `m${Date.now()}`,
      name: newMed.name,
      stock: qty,
      unit: newMed.unit,
      dateAdded: newMed.dateAdded || new Date().toISOString().split('T')[0],
      status: qty === 0 ? 'Out of Stock' : qty <= thresh ? 'Low Stock' : 'Normal',
      batchNumber: newMed.batchNumber || undefined,
      beginningQty: qty,
      dispensed: 0,
      threshold: thresh,
      stockHistory: [{ date: newMed.dateAdded || new Date().toISOString().split('T')[0], qty, type: 'add', note: 'Initial inventory' }],
    };

    try {
      await onAddMedicine(med);
      setShowAddForm(false);
      setNewMed({ name: '', batchNumber: '', stock: '', dateAdded: new Date().toISOString().split('T')[0], unit: 'Tablet', threshold: '15' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 bg-[#FAFBFD] min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY }}>
            Pharmacy Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track medicine batches, low stock alerts, and refill schedules.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ background: PRIMARY }}
          >
            <Plus size={18} strokeWidth={2.5} /> Add Medicine
          </button>
        )}
      </div>

      {/* Register New Medicine Batch Inline Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
          <h2 className="text-[13px] font-extrabold uppercase tracking-wider mb-5" style={{ color: '#1E5AA8' }}>
            Register New Medicine Batch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Medicine Name
              </label>
              <input
                type="text"
                value={newMed.name}
                onChange={e => setNewMed(n => ({ ...n, name: e.target.value }))}
                placeholder="Biogesic 500mg tab"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Batch Number
              </label>
              <input
                type="text"
                value={newMed.batchNumber}
                onChange={e => setNewMed(n => ({ ...n, batchNumber: e.target.value.toUpperCase() }))}
                placeholder="B-BGS101"
                className="w-full font-mono bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Beginning Inventory Qty
              </label>
              <input
                type="number"
                min={0}
                value={newMed.stock}
                onChange={e => setNewMed(n => ({ ...n, stock: e.target.value }))}
                placeholder="100"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Date Added
              </label>
              <input
                type="date"
                value={newMed.dateAdded}
                onChange={e => setNewMed(n => ({ ...n, dateAdded: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Stock Unit Type
              </label>
              <select
                value={newMed.unit}
                onChange={e => setNewMed(n => ({ ...n, unit: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              >
                {['Tablet', 'Bottle', 'Capsule', 'Sachet', 'Ointment', 'Tube', 'Respules', 'Nebules', 'Vials', 'Packs', 'Granules', 'Drops', 'Piece'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min={1}
                value={newMed.threshold}
                onChange={e => setNewMed(n => ({ ...n, threshold: e.target.value }))}
                placeholder="15"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
              />
            </div>

            <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewMedicine}
                className="px-8 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:opacity-95 active:scale-95"
                style={{ background: '#0A369D' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, batch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-gray-200/60 p-1 rounded-xl self-end sm:self-auto">
          {(['All', 'Low Stock', 'Out of Stock', 'Healthy'] as const).map(s => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? PRIMARY : 'transparent',
                  color: active ? '#ffffff' : '#64748B',
                  boxShadow: active ? '0 2px 6px rgba(30, 90, 168, 0.25)' : 'none'
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Layout: Table vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Table Column (3spans) with Vertical Scroll Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[680px]">
            <table className="w-full border-collapse text-left relative">
              <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-2xs">
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Medicine Name</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Batch Number</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Beg. Qty</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dispensed</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stock Count</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                      No medicines match the current search or filter.
                    </td>
                  </tr>
                ) : filtered.map(m => {
                  const details = getMedicineDetails(m);
                  const isLow = details.status === 'Low Stock';
                  const isOut = details.status === 'Out of Stock';

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-blue-50/20 group ${
                        isOut ? 'bg-rose-50/30 border-b-2 border-rose-300' : 
                        isLow ? 'bg-amber-50/20 border-b-2 border-amber-300' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-800 text-sm">{m.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">Date Added: {m.dateAdded || '2026-05-12'}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-gray-600">
                        {details.batchNumber}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                        {details.beginningQty} <span className="text-xs text-gray-400 font-normal">{details.displayUnit}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 font-semibold">
                        {details.dispensed}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-sm font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-gray-900'}`}>
                          {m.stock} <span className="text-xs font-normal text-gray-500">{details.displayUnit}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isOut ? (
                          <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase rounded-full bg-rose-100/90 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase rounded-full bg-amber-100/90 text-amber-800 border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setAdjustModal(m); setAdjustType('add'); setAdjustQty(''); setAdjustNote(''); }}
                            className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-all border border-blue-200/60 active:scale-95 shadow-2xs"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => setHistoryModal(m)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                            title="View Stock History"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50/80 px-6 py-3.5 border-t border-gray-200 text-right">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              Total Medicines Matching Current Classification: <strong className="text-gray-700">{filtered.length} Items</strong>
            </span>
          </div>
        </div>

        {/* Sidebar Controls (1 span) */}
        <div className="space-y-6">
          {/* Adjustment Controls Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-[12px] font-bold text-blue-900 uppercase tracking-wider mb-4">
              Adjustment Controls
            </h3>
            <div className="bg-gray-50/70 border border-dashed border-gray-200 rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <RefreshCw size={18} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium max-w-[200px]">
                Click <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Adjust</span> on any medicine item row to record inventory intake, stock decrement, or manual audit adjustment.
              </p>
            </div>

            {/* Divider */}
            <hr className="my-6 border-gray-100" />

            {/* Pharmacy Stock Summary */}
            <h3 className="text-[12px] font-bold text-blue-900 uppercase tracking-wider mb-4">
              Pharmacy Stock Summary
            </h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-sans font-medium">Healthy stock lines:</span>
                <span className="font-bold text-emerald-600">{healthyCount} items</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-sans font-medium">Low stock warnings:</span>
                <span className="font-bold text-amber-500">{lowStockCount} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-sans font-medium">Out of stock criticals:</span>
                <span className="font-bold text-rose-600">{outOfStockCount} lines</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Adjust Medicine Stock</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{adjustModal.name} ({getMedicineDetails(adjustModal).batchNumber})</p>
              </div>
              <button onClick={() => setAdjustModal(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    adjustType === 'add' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TrendingUp size={14} /> Intake / Restock (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('dispense')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    adjustType === 'dispense' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TrendingDown size={14} /> Dispense / Deduct (−)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Quantity ({adjustModal.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder="Enter quantity amount..."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder={adjustType === 'add' ? 'e.g., Supplier replenishment shipment' : 'e.g., Discarded expired batch / Clinic dispense'}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAdjustModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm ${
                  adjustType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {adjustType === 'add' ? 'Intake' : 'Decrement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 border border-gray-100 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{historyModal.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Batch: {getMedicineDetails(historyModal).batchNumber}</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {(!historyModal.stockHistory || historyModal.stockHistory.length === 0) ? (
                <p className="text-center py-8 text-gray-400 text-sm">No transaction history recorded yet.</p>
              ) : historyModal.stockHistory.map((h, i) => (
                <div key={i} className={`flex items-center gap-3.5 p-3.5 rounded-xl border ${
                  h.type === 'add' ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    h.type === 'add' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {h.type === 'add' ? '+' : '−'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">
                      {h.type === 'add' ? 'Restocked' : 'Dispensed'} {h.qty} {historyModal.unit}s
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{h.date} — <span className="italic">{h.note || 'No remarks'}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-right">
              <button
                onClick={() => setHistoryModal(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
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

