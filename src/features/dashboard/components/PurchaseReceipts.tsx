import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, FileText, Printer, X, CheckCircle } from 'lucide-react';
import { PurchaseRequest, MedicineItem } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';

const PRIMARY = '#1E5AA8';
const YELLOW = '#F4C542';
const RED = '#D64545';

interface PurchaseReceiptsProps {
  purchaseRequests: PurchaseRequest[];
  medicines: MedicineItem[];
  onUpdateRequest: (req: PurchaseRequest) => void | Promise<void>;
  onAddRequest: (req: PurchaseRequest) => void | Promise<void>;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending:  { bg: `${YELLOW}20`, text: '#92700f' },
  Partial:  { bg: '#E3F2FD', text: '#1565C0' },
  Complete: { bg: '#E8F5E9', text: '#2E7D32' },
};

export function PurchaseReceipts({ purchaseRequests, medicines, onUpdateRequest, onAddRequest }: PurchaseReceiptsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [receiveModal, setReceiveModal] = useState<PurchaseRequest | null>(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveNote, setReceiveNote] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newReq, setNewReq] = useState({ medicine: '', requestedQty: '' });
  const [prfModal, setPrfModal] = useState<PurchaseRequest | null>(null);

  const handleReceive = async () => {
    if (!receiveModal || !receiveQty) return;
    const qty = parseInt(receiveQty);
    const newReceived = receiveModal.receivedQty + qty;
    const updated: PurchaseRequest = {
      ...receiveModal,
      receivedQty: newReceived,
      status: newReceived >= receiveModal.requestedQty ? 'Complete' : 'Partial',
      history: [...receiveModal.history, { date: new Date().toISOString().split('T')[0], qty, note: receiveNote || `Received ${qty} units` }],
    };
    try {
      await onUpdateRequest(updated);
      setReceiveModal(null);
      setReceiveQty('');
      setReceiveNote('');
    } catch (e) { console.error(e); }
  };

  const handleNewRequest = async () => {
    if (!newReq.medicine || !newReq.requestedQty) return;
    const req: PurchaseRequest = {
      id: `PR-${String(purchaseRequests.length + 1).padStart(3, '0')}`,
      medicine: newReq.medicine,
      requestedQty: parseInt(newReq.requestedQty),
      receivedQty: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      history: [{ date: new Date().toISOString().split('T')[0], qty: 0, note: 'Purchase request created' }],
    };
    try {
      await onAddRequest(req);
      setShowNewForm(false);
      setNewReq({ medicine: '', requestedQty: '' });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Purchase Receipts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage medicine purchase requests</p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: PRIMARY }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['Pending', 'Partial', 'Complete'] as const).map(s => {
          const count = purchaseRequests.filter(r => r.status === s).length;
          const sc = statusColors[s];
          return (
            <div key={s} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: sc.bg, color: sc.text }}>
                {count}
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: sc.text }}>{s}</div>
                <div className="text-xs text-gray-400">requests</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Requests */}
      <div className="space-y-3">
        {purchaseRequests.map(req => {
          const sc = statusColors[req.status];
          const progress = Math.min(100, (req.receivedQty / req.requestedQty) * 100);
          const isExpanded = expanded === req.id;
          return (
            <div key={req.id} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              {/* Main row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{req.medicine}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: sc.bg, color: sc.text }}>{req.status}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Request #{req.id} • {req.date}</div>
                  {/* Progress */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${progress}%`,
                        background: req.status === 'Complete' ? '#4CAF50' : req.status === 'Partial' ? PRIMARY : '#e5e7eb',
                      }} />
                    </div>
                    <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                      {req.receivedQty} / {req.requestedQty} units
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.status !== 'Complete' && (
                    <button onClick={() => { setReceiveModal(req); setReceiveQty(''); }}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                      style={{ background: PRIMARY }}>
                      Receive
                    </button>
                  )}
                  <button onClick={() => setPrfModal(req)}
                    title="Generate PRF"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <FileText size={15} />
                  </button>
                  <button onClick={() => setExpanded(isExpanded ? null : req.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Timeline */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Delivery History</div>
                  <div className="space-y-2">
                    {req.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${h.qty > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="text-sm text-gray-700">{h.note}</div>
                          <div className="text-xs text-gray-400">{h.date}{h.qty > 0 ? ` • +${h.qty} units` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Receive Modal */}
      {receiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Log Delivery</h3>
              <button onClick={() => setReceiveModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{receiveModal.medicine}</strong><br />
              Requested: {receiveModal.requestedQty} • Received so far: {receiveModal.receivedQty}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantity Received</label>
                <input type="number" min={1} max={receiveModal.requestedQty - receiveModal.receivedQty}
                  value={receiveQty} onChange={e => setReceiveQty(e.target.value)}
                  placeholder={`Max: ${receiveModal.requestedQty - receiveModal.receivedQty}`}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note</label>
                <input type="text" value={receiveNote} onChange={e => setReceiveNote(e.target.value)}
                  placeholder="e.g., Delivered by supplier"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setReceiveModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleReceive} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2" style={{ background: PRIMARY }}>
                <CheckCircle size={14} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Form */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">New Purchase Request</h3>
              <button onClick={() => setShowNewForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Medicine</label>
                <input type="text" list="med-list-pr" value={newReq.medicine} onChange={e => setNewReq(n => ({ ...n, medicine: e.target.value }))}
                  placeholder="Select or type medicine name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
                <datalist id="med-list-pr">
                  {medicines.map(m => <option key={m.id} value={m.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Requested Quantity</label>
                <input type="number" min={1} value={newReq.requestedQty} onChange={e => setNewReq(n => ({ ...n, requestedQty: e.target.value }))}
                  placeholder="Units to request"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNewForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleNewRequest} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: PRIMARY }}>Create Request</button>
            </div>
          </div>
        </div>
      )}

      {/* PRF Print Modal */}
      {prfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-gray-900">Purchase Requisition Form (PRF)</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: PRIMARY }}>
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setPrfModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
              </div>
            </div>
            {/* PRF Content */}
            <div className="p-8 space-y-4">
              <div className="flex items-start gap-4 border-b border-gray-200 pb-4">
                <img src={uaSeal} alt="UA Seal" className="w-16 h-16 object-contain" />
                <div className="text-center flex-1">
                  <div className="font-bold text-lg">UNIVERSITY OF THE ASSUMPTION</div>
                  <div className="text-sm">Unisite Subd., Del Pilar, City of San Fernando, Pampanga</div>
                  <div className="font-bold text-base mt-2">PURCHASE REQUISITION FORM (PRF)</div>
                  <div className="text-xs text-gray-500 mt-1">Note: To be used when requesting for the purchase of medicines and medical supplies.</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">PRF No.</div>
                  <div className="border-b border-black w-24 text-right text-sm">{prfModal.id}</div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>DEPARTMENT: <strong>Medical-Dental Clinic</strong></div>
                <div>Date: <strong>2026-06-27</strong></div>
              </div>

              <table className="w-full border-collapse border border-gray-300 text-sm mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left">QUANTITY</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Unit</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">ITEM</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">DESCRIPTION</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Unit Price</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">{prfModal.requestedQty}</td>
                    <td className="border border-gray-300 px-3 py-2">{medicines.find(m => m.name === prfModal.medicine)?.unit || 'tablet'}</td>
                    <td className="border border-gray-300 px-3 py-2">{prfModal.medicine}</td>
                    <td className="border border-gray-300 px-3 py-2">Medical Clinic Supply</td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                  </tr>
                  {[...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td className="border border-gray-300 px-3 py-4"></td>
                      <td className="border border-gray-300 px-3 py-4"></td>
                      <td className="border border-gray-300 px-3 py-4"></td>
                      <td className="border border-gray-300 px-3 py-4"></td>
                      <td className="border border-gray-300 px-3 py-4"></td>
                      <td className="border border-gray-300 px-3 py-4"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm mt-4 space-y-1">
                <div>Purpose of Purchase: <span className="border-b border-black inline-block w-64">Medical Clinic Inventory Replenishment</span></div>
                <div>Date/Time Needed: <span className="border-b border-black inline-block w-64">To follow lead time in Purchasing</span></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6 text-xs">
                <div className="border border-gray-200 p-3 rounded">
                  <div className="font-semibold mb-2">Prepared by/Date:</div>
                  <div className="border-b border-black mb-1">Grace Aquino, RN</div>
                  <div className="text-gray-500">REQUESTING PARTY</div>
                </div>
                <div className="border border-gray-200 p-3 rounded">
                  <div className="font-semibold mb-2">Recommended by/Date:</div>
                  <div className="border-b border-black mb-4 h-5"></div>
                  <div className="text-center">DIRECTOR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
