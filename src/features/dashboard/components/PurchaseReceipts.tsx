import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, FileText, Printer, X, CheckCircle, PackageCheck, AlertCircle, RefreshCw, BookmarkCheck, Search, Trash2 } from 'lucide-react';
import { PurchaseRequest, MedicineItem } from '../types';
import uaSeal from '@/assets/images/ua-seal.png';

const PRIMARY = '#1E5AA8';
const YELLOW = '#F4C542';

interface PurchaseReceiptsProps {
  purchaseRequests: PurchaseRequest[];
  medicines: MedicineItem[];
  onUpdateRequest: (req: PurchaseRequest) => void | Promise<void>;
  onAddRequest: (req: PurchaseRequest) => void | Promise<void>;
  onAddRequest: (req: PurchaseRequest) => void | Promise<void>;
  onDeleteRequest: (id: string) => void | Promise<void>;
  searchQuery: string;
}

interface PrfItemRow {
  id: string;
  qty: number | string;
  unit: string;
  item: string;
  description: string;
  unitPrice: number | string;
}

// Helper: convert a PurchaseRequest to a PrfItemRow
function reqToPrfRow(req: PurchaseRequest): PrfItemRow {
  return {
    id: req.id,
    qty: req.requestedQty,
    unit: req.unit || 'pc',
    item: req.medicine,
    description: req.description || '',
    unitPrice: req.unitPrice ?? 0,
  };
}

export function PurchaseReceipts({ purchaseRequests, medicines, onUpdateRequest, onAddRequest, onDeleteRequest, searchQuery }: PurchaseReceiptsProps) {
  const [viewMode, setViewMode] = useState<'template' | 'tracker'>('template');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Partial' | 'Complete'>('All');

  // Delivery Receive Modal state
  const [receiveModal, setReceiveModal] = useState<PurchaseRequest | null>(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveNote, setReceiveNote] = useState('');

  // New Tracker Request state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newReq, setNewReq] = useState({ medicine: '', description: '', unit: 'Tablet', requestedQty: '', unitPrice: '', prfNo: 'PRF-2026-001' });

  // Editable PRF Document state (so users can type immediately and print)
  const [prfNo, setPrfNo] = useState('PRF-2026-001');
  const [department, setDepartment] = useState('Medical-Dental Clinic');

  // prfItems is derived from purchaseRequests that match the current prfNo
  const [prfItems, setPrfItems] = useState<PrfItemRow[]>(() =>
    purchaseRequests
      .filter(r => r.prfNo === 'PRF-2026-001')
      .map(reqToPrfRow)
  );

  // Keep prfItems in sync whenever purchaseRequests changes (e.g. after a new Log Item is saved)
  useEffect(() => {
    setPrfItems(
      purchaseRequests
        .filter(r => r.prfNo === prfNo)
        .map(reqToPrfRow)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseRequests, prfNo]);
  const [purpose, setPurpose] = useState('Medical-Dental Clinic Routine Requisition & Replenishment');
  const [dateNeeded, setDateNeeded] = useState('To follow lead time in Purchasing');

  // PRF Signature Boxes Editable State
  const [preparedBy, setPreparedBy] = useState('Abigael C. Landingin');
  const [evalRemarks, setEvalRemarks] = useState('');
  const [recommendedBy, setRecommendedBy] = useState('');
  const [supplier1, setSupplier1] = useState('');
  const [supplier2, setSupplier2] = useState('');
  const [supplier3, setSupplier3] = useState('');
  const [forCashAdvance, setForCashAdvance] = useState(false);
  const [forPurchaseOrder, setForPurchaseOrder] = useState(true);
  const [revSupplier, setRevSupplier] = useState('');
  const [revTerms, setRevTerms] = useState('30 Days');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [capexNo, setCapexNo] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [endorsedBy, setEndorsedBy] = useState('');
  const [recFinance, setRecFinance] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const handleReceive = async () => {
    if (!receiveModal || !receiveQty) return;
    const qty = parseInt(receiveQty) || 0;
    const newReceived = receiveModal.receivedQty + qty;
    const updated: PurchaseRequest = {
      ...receiveModal,
      receivedQty: newReceived,
      status: newReceived >= receiveModal.requestedQty ? 'Complete' : 'Partial',
      history: [...receiveModal.history, { date: new Date().toISOString().split('T')[0], qty, note: receiveNote || `Received delivery (+${qty} units)` }],
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
    const tempId = `PR-${Date.now()}`;
    const req: PurchaseRequest = {
      id: tempId,
      medicine: newReq.medicine,
      description: newReq.description || undefined,
      unit: newReq.unit || 'Tablet',
      prfNo: newReq.prfNo || prfNo,
      unitPrice: parseFloat(newReq.unitPrice) || 0,
      requestedQty: parseInt(newReq.requestedQty) || 1,
      receivedQty: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      history: [{ date: new Date().toISOString().split('T')[0], qty: 0, note: `Requisition initiated under ${newReq.prfNo || prfNo}` }],
    };
    try {
      await onAddRequest(req);
      // Also add to PRF template immediately if it belongs to the current PRF
      if ((newReq.prfNo || prfNo) === prfNo) {
        setPrfItems(prev => [...prev, reqToPrfRow(req)]);
      }
      setShowNewForm(false);
      setNewReq({ medicine: '', description: '', unit: 'Tablet', requestedQty: '', unitPrice: '', prfNo: prfNo });
    } catch (e) { console.error(e); }
  };

  const handleRegisterAllToTracker = async () => {
    let addedCount = 0;
    for (const row of prfItems) {
      const qty = typeof row.qty === 'string' ? parseInt(row.qty) : row.qty;
      if (qty && qty > 0 && row.item.trim()) {
        const req: PurchaseRequest = {
          id: `PR-${Date.now()}-${addedCount}`,
          medicine: row.item,
          description: row.description || undefined,
          unit: row.unit || 'pc',
          prfNo: prfNo,
          unitPrice: typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice) || 0 : row.unitPrice,
          requestedQty: qty,
          receivedQty: 0,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          history: [{ date: new Date().toISOString().split('T')[0], qty: 0, note: `Requisition registered via ${prfNo}` }],
        };
        await onAddRequest(req);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      setViewMode('tracker');
    }
  };

  const handleAddPrfRow = () => {
    setPrfItems(prev => [
      ...prev,
      { id: String(Date.now()), qty: 1, unit: 'Tablet', item: '', description: '', unitPrice: 0 }
    ]);
  };

  const handleRemovePrfRow = (id: string) => {
    setPrfItems(prev => prev.filter(r => r.id !== id));
  };

  const updatePrfRow = (id: string, field: keyof PrfItemRow, val: string | number) => {
    setPrfItems(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const filteredRequests = purchaseRequests.filter(req => {
    const matchesStatus = statusFilter === 'All' ? true : req.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      req.medicine.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (req.description && req.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.prfNo && req.prfNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Pending:  { bg: `${YELLOW}25`, text: '#A17A0C', border: '#E2BD3D' },
    Partial:  { bg: '#EBF3FF', text: PRIMARY, border: '#B4D2FF' },
    Complete: { bg: '#E8F6F0', text: '#198057', border: '#A6DFC7' },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#FAFBFD]">
      {/* Print CSS specific to PRF Template */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .prf-printable-area, .prf-printable-area * {
            visibility: visible !important;
          }
          .prf-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            resize: none !important;
            color: #000 !important;
          }
          .border-print-black {
            border-color: #000 !important;
          }
        }
      `}</style>

      {/* Header Banner & Navigation Tabs */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY }}>
            Purchase Receipts & Requisition
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, fill up, and print official clinic PRF supply requisitions and track delivery shipments.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-200/60 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('template')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'template' ? 'bg-white text-[#1E5AA8] shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <FileText size={16} /> Official PRF Template
          </button>
          <button
            onClick={() => setViewMode('tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'tracker' ? 'bg-[#1E5AA8] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <PackageCheck size={16} /> Delivery Tracker
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white text-[#1E5AA8] font-black">
              {purchaseRequests.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* VIEW 1: OFFICIAL UNIVERSITY PRF TEMPLATE (EDITABLE & PRINTABLE) */}
      {/* ========================================================================================= */}
      {viewMode === 'template' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action Toolbar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <AlertCircle size={16} className="text-[#1E5AA8]" />
              <span>Click any field in the template below to type or edit before printing.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRegisterAllToTracker}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-sm hover:opacity-95 active:scale-95 bg-[#0D9488]"
              >
                <BookmarkCheck size={15} /> Save to Delivery Tracker
              </button>
              <button
                onClick={() => {
                  // Reset: re-derive from purchaseRequests for current prfNo
                  setPrfItems(
                    purchaseRequests
                      .filter(r => r.prfNo === prfNo)
                      .map(reqToPrfRow)
                  );
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors"
                title="Reset to saved tracker data"
              >
                <RefreshCw size={14} /> Reset
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
                style={{ background: PRIMARY }}
              >
                <Printer size={15} /> Print PRF Form
              </button>
            </div>
          </div>

          {/* Printable PRF Document Container */}
          <div className="prf-printable-area bg-white border-2 border-gray-400 p-8 md:p-12 shadow-lg max-w-5xl mx-auto text-black font-sans">
            {/* Header section with Logo & Titles */}
            <div className="flex items-start justify-between pb-3">
              <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                <img src={uaSeal} alt="University Seal" className="w-20 h-20 object-contain" />
              </div>
              <div className="text-center flex-1 px-4">
                <div className="text-2xl font-extrabold tracking-wide font-serif text-[#002060]">
                  UNIVERSITY of the ASSUMPTION
                </div>
                <div className="text-xs font-normal text-gray-800">
                  Unisite Subd., Del Pilar, City of San Fernando, Pampanga
                </div>
                <div className="text-lg font-bold mt-5 uppercase text-black tracking-wider">
                  PURCHASE REQUISITION FORM (PRF)
                </div>
              </div>
              <div className="text-right w-40 mt-4 text-xs font-bold text-black">
                <div className="flex items-center justify-end">
                  <span>PRF No.&nbsp;</span>
                  <input
                    type="text"
                    value={prfNo}
                    onChange={e => setPrfNo(e.target.value)}
                    className="border-b border-black w-24 text-right font-bold bg-transparent text-black focus:outline-none focus:bg-yellow-50 px-1"
                  />
                </div>
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="text-[10.5px] italic text-gray-800 text-justify mb-2 leading-snug">
              <strong>Note:</strong> <em>To be used when requesting for the purchase of office and school supplies, computer and IT peripherals, laboratory equipment and supplies, library books and learning resources, construction materials, furniture and fixtures which are not available at the Central Supplies Room and Physical Plant Warehouse.</em>
            </div>
            <div className="text-[10.5px] italic text-black mb-4">
              <strong>(Please fill up in two copies. Copy distribution: original copy to RMS, duplicate copy to Requesting Party)</strong>
            </div>

            {/* Department Input */}
            <div className="flex items-center font-bold text-sm text-black mb-3">
              <span>DEPARTMENT:&nbsp;&nbsp;</span>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="border-b border-black w-72 font-bold bg-transparent focus:outline-none focus:bg-yellow-50 px-1 text-black"
              />
            </div>

            {/* Requisition Table */}
            <table className="w-full border-collapse border-2 border-black text-xs text-black mb-4">
              <thead>
                <tr className="bg-gray-100 font-bold border-b-2 border-black">
                  <th className="border border-black p-2 text-center w-20">QUANTITY</th>
                  <th className="border border-black p-2 text-center w-20">Unit</th>
                  <th className="border border-black p-2 text-left w-56">ITEM</th>
                  <th className="border border-black p-2 text-left">DESCRIPTION (Color/Size/Brand/Technical Specifications, etc…)</th>
                  <th className="border border-black p-2 text-center w-20">Unit Price</th>
                  <th className="border border-black p-2 text-right w-24">AMOUNT</th>
                  <th className="no-print border border-black p-1 text-center w-10">Act</th>
                </tr>
              </thead>
              <tbody>
                {prfItems.map(row => {
                  const numQty = typeof row.qty === 'string' ? parseFloat(row.qty) || 0 : row.qty;
                  const numPrice = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice) || 0 : row.unitPrice;
                  const amt = (numQty * numPrice).toFixed(2);
                  return (
                    <tr key={row.id} className="border border-black hover:bg-gray-50/50 transition-colors">
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          value={row.qty}
                          onChange={e => updatePrfRow(row.id, 'qty', e.target.value)}
                          className="w-full text-center bg-transparent font-semibold focus:outline-none focus:bg-yellow-50 px-1"
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="text"
                          value={row.unit}
                          onChange={e => updatePrfRow(row.id, 'unit', e.target.value)}
                          className="w-full text-center bg-transparent font-medium focus:outline-none focus:bg-yellow-50 px-1"
                        />
                      </td>
                      <td className="border border-black p-1 text-left">
                        <input
                          type="text"
                          list="clinic-meds-datalist"
                          value={row.item}
                          onChange={e => updatePrfRow(row.id, 'item', e.target.value)}
                          className="w-full bg-transparent font-semibold focus:outline-none focus:bg-yellow-50 px-1.5"
                          placeholder="Type item name..."
                        />
                      </td>
                      <td className="border border-black p-1 text-left">
                        <input
                          type="text"
                          value={row.description}
                          onChange={e => updatePrfRow(row.id, 'description', e.target.value)}
                          className="w-full bg-transparent text-gray-800 focus:outline-none focus:bg-yellow-50 px-1.5"
                          placeholder="Brand / Spec..."
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={row.unitPrice}
                          onChange={e => updatePrfRow(row.id, 'unitPrice', e.target.value)}
                          className="w-full text-center bg-transparent font-medium focus:outline-none focus:bg-yellow-50 px-1"
                        />
                      </td>
                      <td className="border border-black p-1 text-right font-bold pr-2">
                        {numPrice > 0 ? amt : ''}
                      </td>
                      <td className="no-print border border-black p-1 text-center">
                        <button
                          onClick={() => handleRemovePrfRow(row.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Purpose & Date Needed Summary Row inside table footer */}
                <tr className="border border-black bg-white">
                  <td colSpan={7} className="p-3 border border-black text-xs font-medium space-y-2">
                    <div className="flex items-center">
                      <span className="font-bold whitespace-nowrap">Purpose of Purchase:</span>
                      <input
                        type="text"
                        value={purpose}
                        onChange={e => setPurpose(e.target.value)}
                        className="flex-1 ml-2 border-b border-black font-medium bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold whitespace-nowrap">Date/Time Needed: (To follow lead time in Purchasing)</span>
                      <input
                        type="text"
                        value={dateNeeded}
                        onChange={e => setDateNeeded(e.target.value)}
                        className="ml-2 w-64 border-b border-black font-medium bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Datalist for fast autocompletion from clinic inventory */}
            <datalist id="clinic-meds-datalist">
              {medicines.map(m => <option key={m.id} value={m.name} />)}
            </datalist>

            {/* Add Row Button (Hidden during print) */}
            <div className="no-print mb-6">
              <button
                type="button"
                onClick={handleAddPrfRow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all w-full justify-center"
              >
                <Plus size={15} /> + Add Another Requisition Row
              </button>
            </div>

            {/* Signatures & Verification Grid (Exactly matching the 2-row x 4-col layout of PDF) */}
            <div className="border-2 border-black text-[11px] text-black bg-white grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-black">
              {/* Row 1 Box 1: Prepared by */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-6">Prepared by/Date:</div>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={e => setPreparedBy(e.target.value)}
                    className="w-full font-extrabold text-center border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 pb-1"
                  />
                </div>
                <div className="text-center font-bold uppercase mt-2">
                  REQUESTING PARTY
                </div>
              </div>

              {/* Row 1 Box 2: Evaluation / Director */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-1">Evaluation Remarks:</div>
                  <textarea
                    value={evalRemarks}
                    onChange={e => setEvalRemarks(e.target.value)}
                    rows={2}
                    placeholder="________________________&#10;________________________"
                    className="w-full text-xs bg-transparent focus:outline-none focus:bg-yellow-50 resize-none border-b border-black mb-3"
                  />
                  <div className="font-bold mb-3">Recommended by/Date:</div>
                  <input
                    type="text"
                    value={recommendedBy}
                    onChange={e => setRecommendedBy(e.target.value)}
                    className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50"
                  />
                </div>
                <div className="text-center mt-2">
                  <div className="font-bold">DIRECTOR</div>
                  <div className="text-[9px] text-gray-600 leading-tight mt-0.5">
                    OMISS or Dean for Computer, Peripherals & Labs; Physical Plant if Physical Facilities; Library for Books; EAMO for Marketing
                  </div>
                </div>
              </div>

              {/* Row 1 Box 3: Processed by / Canvasser */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-1">Processed by/Date:</div>
                  <div className="text-[10px] font-bold mb-1">Supplier – Price Quoted</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span>1</span>
                      <input
                        type="text"
                        value={supplier1}
                        onChange={e => setSupplier1(e.target.value)}
                        className="flex-1 border-b border-black text-[10px] bg-transparent focus:outline-none focus:bg-yellow-50"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>2</span>
                      <input
                        type="text"
                        value={supplier2}
                        onChange={e => setSupplier2(e.target.value)}
                        className="flex-1 border-b border-black text-[10px] bg-transparent focus:outline-none focus:bg-yellow-50"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>3</span>
                      <input
                        type="text"
                        value={supplier3}
                        onChange={e => setSupplier3(e.target.value)}
                        className="flex-1 border-b border-black text-[10px] bg-transparent focus:outline-none focus:bg-yellow-50"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black text-center font-bold">
                  CANVASSER
                </div>
              </div>

              {/* Row 1 Box 4: Reviewed by / RMS */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-2">Reviewed by/Date:</div>
                  <div className="space-y-1 text-xs mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forCashAdvance}
                        onChange={e => setForCashAdvance(e.target.checked)}
                        className="w-4 h-4 rounded border-black text-[#1E5AA8] focus:ring-0"
                      />
                      <span>For Cash Advance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forPurchaseOrder}
                        onChange={e => setForPurchaseOrder(e.target.checked)}
                        className="w-4 h-4 rounded border-black text-[#1E5AA8] focus:ring-0"
                      />
                      <span>For Purchase Order</span>
                    </label>
                  </div>
                  <div className="flex items-center text-[11px] mb-1">
                    <span className="font-bold">Supplier:</span>
                    <input
                      type="text"
                      value={revSupplier}
                      onChange={e => setRevSupplier(e.target.value)}
                      className="flex-1 ml-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                    />
                  </div>
                  <div className="flex items-center text-[11px]">
                    <span className="font-bold">Terms:</span>
                    <input
                      type="text"
                      value={revTerms}
                      onChange={e => setRevTerms(e.target.value)}
                      className="flex-1 ml-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black text-center font-bold">
                  HEAD, RMS
                </div>
              </div>
            </div>

            {/* Bottom Row Signatures (4 columns) */}
            <div className="border-x-2 border-b-2 border-black text-[11px] text-black bg-white grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-black">
              {/* Row 2 Box 1: Budget / AFMS */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-bold">Budget Amount:&nbsp;</span>
                    <input
                      type="text"
                      value={budgetAmount}
                      onChange={e => setBudgetAmount(e.target.value)}
                      className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold">If CAPEX, Authority No.</span>
                    <input
                      type="text"
                      value={capexNo}
                      onChange={e => setCapexNo(e.target.value)}
                      className="flex-1 ml-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </div>
                  <div className="pt-2 font-bold">Verified by/Date:</div>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={e => setVerifiedBy(e.target.value)}
                    className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50"
                  />
                </div>
                <div className="text-center font-bold mt-2 pt-3 border-t border-black">
                  HEAD, AFMS
                </div>
              </div>

              {/* Row 2 Box 2: Source of Funds / Cluster Head */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="font-bold">Source of Funds if without budget:</div>
                  <input
                    type="text"
                    value={sourceOfFunds}
                    onChange={e => setSourceOfFunds(e.target.value)}
                    className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50"
                  />
                  <div className="font-bold pt-2">Endorsed by/Date:</div>
                  <input
                    type="text"
                    value={endorsedBy}
                    onChange={e => setEndorsedBy(e.target.value)}
                    className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50"
                  />
                </div>
                <div className="text-center font-bold mt-2 pt-3 border-t border-black">
                  <div>CLUSTER HEAD</div>
                  <div className="text-[9px] font-normal">(VPAA, VPA,VPF, PRESIDENT)</div>
                </div>
              </div>

              {/* Row 2 Box 3: VP Finance (>500K) */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-4">Recommended by/Date:</div>
                  <input
                    type="text"
                    value={recFinance}
                    onChange={e => setRecFinance(e.target.value)}
                    className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 mb-2"
                  />
                </div>
                <div className="text-center mt-2 pt-3 border-t border-black">
                  <div className="font-bold">VP FOR FINANCE</div>
                  <div className="text-[10px]">(more than 500K)</div>
                </div>
              </div>

              {/* Row 2 Box 4: Approved by */}
              <div className="p-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-4">Approved by/Date:</div>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 mb-2"
                  />
                </div>
                <div className="text-center mt-2 pt-3 border-t border-black">
                  <div className="font-bold">VP FOR FINANCE (up to 500K)</div>
                  <div className="font-bold mt-1">PRESIDENT (more than 500K to 1M)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* VIEW 2: REQUISITION & DELIVERY TRACKER (MONITORING ARRIVAL & STATUS) */}
      {/* ========================================================================================= */}
      {viewMode === 'tracker' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(['Pending', 'Partial', 'Complete'] as const).map(s => {
              const count = purchaseRequests.filter(r => r.status === s).length;
              const sc = statusColors[s];
              return (
                <div
                  key={s}
                  onClick={() => setStatusFilter(s === statusFilter ? 'All' : s)}
                  className="bg-white rounded-2xl p-5 border cursor-pointer transition-all shadow-2xs hover:shadow-md flex items-center justify-between"
                  style={{ borderColor: sc.border }}
                >
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500">{s} Deliveries</div>
                    <div className="text-2xl font-black mt-1 text-gray-800">{count}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {s === 'Pending' && 'Awaiting supplier processing'}
                      {s === 'Partial' && 'Shipment partially arrived'}
                      {s === 'Complete' && 'Fully fulfilled and stocked'}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm" style={{ background: sc.bg, color: sc.text }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">


            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-end overflow-x-auto">
              {(['All', 'Pending', 'Partial', 'Complete'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? 'bg-white text-[#1E5AA8] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => setShowNewForm(true)}
                className="ml-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white font-bold text-xs transition-all shadow-sm hover:opacity-90"
                style={{ background: PRIMARY }}
              >
                <Plus size={15} strokeWidth={2.5} /> Log Item
              </button>
            </div>
          </div>

          {/* Requests Tracking List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 font-medium">
                No requisition orders match the current filter or search criteria.
              </div>
            ) : (
              filteredRequests.map(req => {
                const sc = statusColors[req.status];
                const progress = Math.min(100, Math.round((req.receivedQty / req.requestedQty) * 100));
                const isExpanded = expanded === req.id;
                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden hover:border-gray-300 transition-all">
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-base font-extrabold text-gray-900">{req.medicine}</span>
                          {req.description && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                              {req.description}
                            </span>
                          )}
                          <span className="text-xs px-3 py-1 rounded-full font-bold border" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                            {req.status} ({progress}%)
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">
                          Ref #{req.prfNo || 'PRF-2026-001'} • Request ID: {req.id} • Date Initiated: {req.date} • Unit: <strong>{req.unit || 'Tablet'}</strong>
                        </div>

                        {/* Delivery Stock Progress Bar */}
                        <div className="mt-3.5 max-w-xl flex items-center gap-4">
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                background: req.status === 'Complete' ? '#10B981' : req.status === 'Partial' ? PRIMARY : '#D1D5DB',
                              }}
                            />
                          </div>
                          <div className="text-xs font-bold text-gray-700 whitespace-nowrap">
                            <span className="text-gray-900 font-black">{req.receivedQty}</span> / {req.requestedQty} {req.unit || 'units'} arrived
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2.5 self-end lg:self-center flex-shrink-0">
                        {req.status !== 'Complete' && (
                          <button
                            onClick={() => { setReceiveModal(req); setReceiveQty(''); setReceiveNote(''); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 bg-[#1E5AA8]"
                          >
                            <CheckCircle size={15} /> Receive Shipment
                          </button>
                        )}
                        <button
                          onClick={() => setExpanded(isExpanded ? null : req.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors"
                        >
                          <span>Delivery Log ({req.history.length})</span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <button
                          onClick={() => onDeleteRequest(req.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
                          title="Remove this item"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Expandable Delivery Log Timeline */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 animate-in fade-in duration-200">
                        <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-3">
                          Timestamped Delivery & Requisition History
                        </div>
                        <div className="space-y-3">
                          {req.history.map((h, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${h.qty > 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                              <div className="flex-1">
                                <span className="font-bold text-gray-800">{h.note}</span>
                                <div className="text-gray-400 mt-0.5 font-medium">
                                  {h.date} {h.qty > 0 ? ` • Verified arrival of +${h.qty} ${req.unit || 'units'}` : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODALS & OVERLAYS */}
      {/* ========================================================================================= */}

      {/* Receive Shipment / Log Delivery Modal */}
      {receiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Receive Medicine Shipment</h3>
                <p className="text-xs text-gray-400 mt-0.5">Record newly delivered inventory stock</p>
              </div>
              <button onClick={() => setReceiveModal(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 mb-5 text-xs text-gray-700 space-y-1">
              <div><strong className="text-[#1E5AA8] font-black text-sm">{receiveModal.medicine}</strong> {receiveModal.description ? `(${receiveModal.description})` : ''}</div>
              <div className="font-semibold text-gray-500">
                PRF Ref: <span className="text-gray-800 font-bold">{receiveModal.prfNo || 'PRF-2026-001'}</span> • Requested: <strong>{receiveModal.requestedQty} {receiveModal.unit}</strong>
              </div>
              <div className="text-gray-600">
                Received so far: <strong className="text-emerald-700 font-bold">{receiveModal.receivedQty}</strong> • Pending: <strong className="text-amber-700 font-bold">{receiveModal.requestedQty - receiveModal.receivedQty} {receiveModal.unit}</strong>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                  Quantity Arrived Today ({receiveModal.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  max={receiveModal.requestedQty - receiveModal.receivedQty}
                  value={receiveQty}
                  onChange={e => setReceiveQty(e.target.value)}
                  placeholder={`Max remaining: ${receiveModal.requestedQty - receiveModal.receivedQty}`}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                  Delivery Note / Invoice No. (Optional)
                </label>
                <input
                  type="text"
                  value={receiveNote}
                  onChange={e => setReceiveNote(e.target.value)}
                  placeholder="e.g., Invoice #1092 delivered by Central Supply"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-2">
              <button
                type="button"
                onClick={() => setReceiveModal(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleReceive}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:opacity-95 active:scale-95 flex items-center gap-2"
                style={{ background: PRIMARY }}
              >
                <CheckCircle size={15} /> CONFIRM ARRIVAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Custom Request Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-extrabold text-gray-900">Log Standalone Requisition Item</h3>
              <button onClick={() => setShowNewForm(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1">Medicine / Item Name</label>
                <input
                  type="text"
                  list="med-list-pr"
                  value={newReq.medicine}
                  onChange={e => setNewReq(n => ({ ...n, medicine: e.target.value }))}
                  placeholder="Select or type medicine..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
                <datalist id="med-list-pr">
                  {medicines.map(m => <option key={m.id} value={m.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1">Description / Brand Specification</label>
                <input
                  type="text"
                  value={newReq.description}
                  onChange={e => setNewReq(n => ({ ...n, description: e.target.value }))}
                  placeholder="e.g., Alnix / Green cross Alcohol..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1">Requested Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={newReq.requestedQty}
                    onChange={e => setNewReq(n => ({ ...n, requestedQty: e.target.value }))}
                    placeholder="100"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1">Unit</label>
                  <input
                    type="text"
                    value={newReq.unit}
                    onChange={e => setNewReq(n => ({ ...n, unit: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1">Unit Price (₱)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newReq.unitPrice}
                  onChange={e => setNewReq(n => ({ ...n, unitPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>
              <div>
                <label className="block font-extrabold text-gray-500 uppercase tracking-wider mb-1">PRF Reference No.</label>
                <input
                  type="text"
                  value={newReq.prfNo}
                  onChange={e => setNewReq(n => ({ ...n, prfNo: e.target.value }))}
                  className="w-full font-mono bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]/20 focus:border-[#1E5AA8]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-2">
              <button onClick={() => setShowNewForm(false)} type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors">CANCEL</button>
              <button onClick={handleNewRequest} type="button" className="px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:opacity-95 active:scale-95" style={{ background: PRIMARY }}>CREATE ITEM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

