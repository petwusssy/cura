import { useState } from 'react';
import { Search, Plus, AlertTriangle, RefreshCw, ArrowUpRight, CheckCircle2, X, Eye, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { MedicineItem, StockHistory } from '../types';

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

  const [statusFilter, setStatusFilter] = useState<'All' | 'Low Stock' | 'Out of Stock' | 'Healthy'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Medicine' | 'Supply'>('All');
  const [adjustModal, setAdjustModal] = useState<MedicineItem | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'dispense'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [historyModal, setHistoryModal] = useState<MedicineItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState<{
    name: string;
    stock: string;
    dateAdded: string;
    unit: string;
    threshold: string;
    category: 'Medicine' | 'Supply';
  }>({
    name: '',
    stock: '',
    dateAdded: new Date().toISOString().split('T')[0],
    unit: 'Tablet',
    threshold: '15',
    category: 'Medicine'
  });

  const getMedicineDetails = (m: MedicineItem) => {
    const adds = (m.stockHistory || []).filter(h => h.type === 'add').reduce((sum, h) => sum + h.qty, 0);
    const dispenses = (m.stockHistory || []).filter(h => h.type === 'dispense').reduce((sum, h) => sum + h.qty, 0);
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

    return { beginningQty, dispensed, status, displayUnit };
  };

  const filtered = displayMedicines.filter(m => {
    const details = getMedicineDetails(m);
    const matchSearch = !searchQuery || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase());
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
      onUpdateMedicine(updated);
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
      beginningQty: qty,
      dispensed: 0,
      threshold: thresh,
      stockHistory: [{ date: newMed.dateAdded || new Date().toISOString().split('T')[0], qty, type: 'add', note: 'Initial inventory' }],
    };

    try {
      onAddMedicine(med);
      setShowAddForm(false);
      setNewMed({ name: '', stock: '', dateAdded: new Date().toISOString().split('T')[0], unit: 'Tablet', threshold: '15', category: 'Medicine' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-2xl font-bold">Pharmacy Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track medicine batches, low stock alerts, and refill schedules</p>
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
          { label: 'Healthy Stock', value: healthyCount, color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle2 size={20} /> },
          { label: 'Low Stock', value: lowStockCount, color: YELLOW, bg: `${YELLOW}15`, icon: <AlertTriangle size={20} /> },
          { label: 'Out of Stock', value: outOfStockCount, color: RED, bg: `${RED}15`, icon: <X size={20} /> },
          { label: 'Total Items', value: displayMedicines.length, color: PRIMARY, bg: `${PRIMARY}15`, icon: <CheckCircle2 size={20} /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2 w-full sm:w-auto" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Status</span>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {(['All', 'Healthy', 'Low Stock', 'Out of Stock'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: statusFilter === s ? PRIMARY : 'transparent',
                  color: statusFilter === s ? 'white' : '#6b7280',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2 w-full sm:w-auto" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Type</span>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {(['All', 'Medicine', 'Supply'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: typeFilter === t ? PRIMARY : 'transparent',
                  color: typeFilter === t ? 'white' : '#6b7280',
                }}>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No records</td></tr>
              ) : filtered.map(m => {
                const details = getMedicineDetails(m);
                const isOut = details.status === 'Out of Stock';
                const isLow = details.status === 'Low Stock';
                return (
                  <tr key={m.id} className={isOut ? "hover:bg-red-50/30 transition-colors" : "hover:bg-gray-50 transition-colors"}>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-700">{m.name}</div>
                      <div className="text-xs text-gray-400">Added: {m.dateAdded || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{details.beginningQty} <span className="text-xs text-gray-400">{details.displayUnit}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-700">{details.dispensed}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: isOut ? RED : isLow ? '#b45309' : '#374151' }}>
                        {m.stock} <span className="text-xs text-gray-500 font-normal">{details.displayUnit}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: isOut ? `${RED}15` : isLow ? `${YELLOW}20` : '#E8F5E9', color: isOut ? RED : isLow ? '#b45309' : '#2E7D32' }}>
                        {details.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setAdjustModal(m); setAdjustType('add'); setAdjustQty(''); setAdjustNote(''); }}
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

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            No records
          </div>
        ) : filtered.map(m => {
          const details = getMedicineDetails(m);
          const isOut = details.status === 'Out of Stock';
          const isLow = details.status === 'Low Stock';
          return (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900 leading-tight">{m.name}</div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide flex-shrink-0"
                  style={{ background: isOut ? `${RED}15` : isLow ? `${YELLOW}20` : '#E8F5E9', color: isOut ? RED : isLow ? '#b45309' : '#2E7D32' }}>
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
                <div className="flex flex-col col-span-2 mt-1 border-t border-gray-200 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Current Stock</span>
                  <span className="text-base font-bold" style={{ color: isOut ? RED : isLow ? '#b45309' : '#374151' }}>
                    {m.stock} <span className="text-xs font-normal text-gray-500">{details.displayUnit}</span>
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
                  onClick={() => { setAdjustModal(m); setAdjustType('add'); setAdjustQty(''); setAdjustNote(''); }}
                  className="flex-1 py-2 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-bold text-lg">Register New Medicine</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Medicine Name</label>
                <input type="text" value={newMed.name} onChange={e => setNewMed(n => ({ ...n, name: e.target.value }))}
                  placeholder="e.g. Biogesic 500mg tab"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
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
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Low Stock Threshold</label>
                <input type="number" min={1} value={newMed.threshold} onChange={e => setNewMed(n => ({ ...n, threshold: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
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
                    <div className="text-xs text-gray-500 mt-0.5">{h.date} — <span className="italic">{h.note || 'No remarks'}</span></div>
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

