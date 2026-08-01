import { useState } from 'react';
import { Search, Plus, Edit2, Eye, AlertTriangle, Package, TrendingDown, X } from 'lucide-react';
import { MedicineItem, StockHistory, Page } from '../types';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';
const YELLOW = '#F4C542';

interface InventoryProps {
  medicines: MedicineItem[];
  onUpdateMedicine: (medicine: MedicineItem) => void;
  onAddMedicine: (medicine: MedicineItem) => void;
}

export function Inventory({ medicines, onUpdateMedicine, onAddMedicine }: InventoryProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Normal' | 'Low Stock'>('All');
  const [addStockModal, setAddStockModal] = useState<MedicineItem | null>(null);
  const [historyModal, setHistoryModal] = useState<MedicineItem | null>(null);
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockNote, setAddStockNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', stock: '', unit: 'tablet' });

  const filtered = medicines.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const lowStockCount = medicines.filter(m => m.status === 'Low Stock').length;

  const handleAddStock = () => {
    if (!addStockModal || !addStockQty) return;
    const qty = parseInt(addStockQty);
    const updated: MedicineItem = {
      ...addStockModal,
      stock: addStockModal.stock + qty,
      status: addStockModal.stock + qty > 10 ? 'Normal' : 'Low Stock',
      stockHistory: [...addStockModal.stockHistory, {
        date: '2026-06-27', qty, type: 'add', note: addStockNote || 'Stock added',
      }],
    };
    onUpdateMedicine(updated);
    setAddStockModal(null);
    setAddStockQty('');
    setAddStockNote('');
  };

  const handleAddNewMedicine = () => {
    if (!newMed.name || !newMed.stock) return;
    const med: MedicineItem = {
      id: `m${Date.now()}`,
      name: newMed.name,
      stock: parseInt(newMed.stock),
      unit: newMed.unit,
      dateAdded: '2026-06-27',
      status: parseInt(newMed.stock) > 10 ? 'Normal' : 'Low Stock',
      stockHistory: [{ date: '2026-06-27', qty: parseInt(newMed.stock), type: 'add', note: 'Initial stock' }],
    };
    onAddMedicine(med);
    setShowAddForm(false);
    setNewMed({ name: '', stock: '', unit: 'tablet' });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{medicines.length} medicines tracked</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: PRIMARY }}
        >
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
              <Package size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{medicines.length}</div>
              <div className="text-xs text-gray-400">Total Items</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#4CAF5015', color: '#4CAF50' }}>
              <Package size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{medicines.filter(m => m.status === 'Normal').length}</div>
              <div className="text-xs text-gray-400">Normal Stock</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${RED}20` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${RED}15`, color: RED }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: RED }}>{lowStockCount}</div>
              <div className="text-xs text-gray-400">Low Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex gap-4 items-center flex-wrap"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search medicine..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E5AA8]" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['All', 'Normal', 'Low Stock'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{ background: statusFilter === s ? 'white' : 'transparent', color: statusFilter === s ? PRIMARY : '#6b7280', boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#f8fafd' }}>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Medicine Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Added</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No medicines found</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} className={`transition-colors hover:bg-gray-50 ${m.status === 'Low Stock' ? 'bg-red-50/40' : ''}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {m.status === 'Low Stock' && <AlertTriangle size={14} style={{ color: RED, flexShrink: 0 }} />}
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${m.status === 'Low Stock' ? '' : 'text-gray-800'}`}
                      style={{ color: m.status === 'Low Stock' ? RED : undefined }}>
                      {m.stock}
                    </span>
                    {/* Stock bar */}
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (m.stock / 200) * 100)}%`,
                        background: m.status === 'Low Stock' ? RED : '#4CAF50',
                      }} />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{m.unit}</td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{m.dateAdded}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${m.status === 'Normal' ? 'bg-green-50 text-green-700' : 'text-white'}`}
                    style={{ background: m.status === 'Low Stock' ? RED : undefined }}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setAddStockModal(m); setAddStockQty(''); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                      style={{ background: PRIMARY }}>
                      + Stock
                    </button>
                    <button onClick={() => setHistoryModal(m)}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Stock Modal */}
      {addStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Add Stock</h3>
              <button onClick={() => setAddStockModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{addStockModal.name} — Current stock: <strong>{addStockModal.stock} {addStockModal.unit}s</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantity to Add</label>
                <input type="number" min={1} value={addStockQty} onChange={e => setAddStockQty(e.target.value)}
                  placeholder="e.g., 100"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
                <input type="text" value={addStockNote} onChange={e => setAddStockNote(e.target.value)}
                  placeholder="e.g., Purchase receipt #123"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAddStockModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddStock} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: PRIMARY }}>Add Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900">{historyModal.name}</h3>
                <p className="text-sm text-gray-400">Stock movement history</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {historyModal.stockHistory.map((h, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${h.type === 'add' ? 'bg-green-50' : 'bg-orange-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${h.type === 'add' ? 'bg-green-500' : 'bg-orange-400'}`}>
                    {h.type === 'add' ? '+' : '−'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{h.type === 'add' ? '+' : '−'}{h.qty} {historyModal.unit}s</div>
                    <div className="text-xs text-gray-500">{h.date} — {h.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Add New Medicine</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Medicine Name</label>
                <input type="text" value={newMed.name} onChange={e => setNewMed(n => ({ ...n, name: e.target.value }))}
                  placeholder="e.g., Amoxicillin 500mg"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Initial Stock</label>
                <input type="number" min={0} value={newMed.stock} onChange={e => setNewMed(n => ({ ...n, stock: e.target.value }))}
                  placeholder="Quantity"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
                <select value={newMed.unit} onChange={e => setNewMed(n => ({ ...n, unit: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]">
                  {['tablet', 'capsule', 'sachet', 'bottle', 'piece', 'lozenge', 'vial', 'mL'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddNewMedicine} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: PRIMARY }}>Add Medicine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
