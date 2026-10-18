import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, FileText, Printer, X, CheckCircle, PackageCheck, AlertCircle, RefreshCw, BookmarkCheck, Search, Trash2, Calendar, Copy } from 'lucide-react';
import { PurchaseRequest, MedicineItem } from '../types';
import { getManilaDate, formatManilaDateTime, normalizeDate } from '@/utils/philippineTime';
import uaSeal from '@/assets/images/ua-seal.png';

const PRIMARY = '#1E5AA8';
const YELLOW = '#F4C542';

interface PurchaseReceiptsProps {
  purchaseRequests: PurchaseRequest[];
  medicines: MedicineItem[];
  onUpdateRequest: (req: PurchaseRequest) => void | Promise<void>;
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

function getNextPrfNo(currentPrf: string): string {
  const match = currentPrf.match(/PRF-(\d{4})-(\d+)/i) || currentPrf.match(/PRF-(\d+)/i);
  if (match) {
    const year = match.length === 3 ? match[1] : String(new Date().getFullYear());
    const seq = parseInt(match[match.length - 1], 10) + 1;
    return `PRF-${year}-${String(seq).padStart(3, '0')}`;
  }
  return `PRF-${new Date().getFullYear()}-002`;
}

function getLatestContinuousPrfNo(requests: PurchaseRequest[]): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  let targetYear = currentYear;

  for (const req of requests) {
    if (!req.prfNo) continue;
    const match = req.prfNo.match(/PRF-(\d{4})-(\d+)/i) || req.prfNo.match(/PRF-(\d+)/i);
    if (match) {
      const year = match.length === 3 ? parseInt(match[1], 10) : currentYear;
      const seq = parseInt(match[match.length - 1], 10);
      if (year === currentYear) {
        if (seq > maxSeq) {
          maxSeq = seq;
          targetYear = year;
        }
      } else if (maxSeq === 0 && year > targetYear) {
        targetYear = year;
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `PRF-${targetYear}-${String(nextSeq).padStart(3, '0')}`;
}

function getPrfDisplayTitle(prf: string): string {
  const match = prf.match(/PRF-(\d{4})-(\d+)/i);
  if (match) {
    return `Purchase Requisition Form (PRF) - ${match[1]} - ${match[2]}`;
  }
  return `Purchase Requisition Form (PRF) - ${prf}`;
}

export function PurchaseReceipts({ purchaseRequests, medicines, onUpdateRequest, onAddRequest, onDeleteRequest, searchQuery }: PurchaseReceiptsProps) {
  const [viewMode, setViewMode] = useState<'template' | 'tracker'>('template');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Partial' | 'Complete'>('All');
  const [openPrfs, setOpenPrfs] = useState<Record<string, boolean>>({});
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [printingPrfGroup, setPrintingPrfGroup] = useState<{ prfNo: string; date: string; items: PurchaseRequest[] } | null>(null);

  const handlePrintPrf = (group: { prfNo: string; date: string; items: PurchaseRequest[] }) => {
    setPrintingPrfGroup(group);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Delivery Receive Modal state
  const [receiveModal, setReceiveModal] = useState<PurchaseRequest | null>(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveNote, setReceiveNote] = useState('');

  // New Tracker Request state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newReq, setNewReq] = useState({ medicine: '', description: '', unit: 'Tablet', requestedQty: '', unitPrice: '', prfNo: 'PRF-2026-001' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable PRF Document state (so users can type immediately and print)
  const [prfNo, setPrfNo] = useState<string>(() => {
    const stored = localStorage.getItem('cura_current_prf_no');
    if (stored) return stored;
    return getLatestContinuousPrfNo(purchaseRequests);
  });
  const [department, setDepartment] = useState('Medical-Dental Clinic');

  // prfItems is derived from purchaseRequests that match the current prfNo
  const [prfItems, setPrfItems] = useState<PrfItemRow[]>(() => {
    const initialPrf = localStorage.getItem('cura_current_prf_no') || getLatestContinuousPrfNo(purchaseRequests);
    const matched = purchaseRequests.filter(r => r.prfNo === initialPrf).map(reqToPrfRow);
    return matched.length > 0
      ? matched
      : [{ id: String(Date.now()), qty: 1, unit: 'Tablet', item: '', description: '', unitPrice: 0 }];
  });

  // Automatically advance to latest continuous PRF if current prfNo was already submitted
  useEffect(() => {
    if (purchaseRequests.length === 0) return;
    const submittedPrfs = new Set(purchaseRequests.map(r => r.prfNo?.trim().toUpperCase()).filter(Boolean));
    if (submittedPrfs.has(prfNo.trim().toUpperCase()) || !prfNo) {
      const nextContinuous = getLatestContinuousPrfNo(purchaseRequests);
      setPrfNo(nextContinuous);
      localStorage.setItem('cura_current_prf_no', nextContinuous);
      setNewReq(n => ({ ...n, prfNo: nextContinuous }));
    }
  }, [purchaseRequests, prfNo]);

  // Keep prfItems in sync whenever prfNo changes
  useEffect(() => {
    const matched = purchaseRequests.filter(r => r.prfNo === prfNo).map(reqToPrfRow);
    if (matched.length > 0) {
      setPrfItems(matched);
    } else {
      setPrfItems([
        { id: String(Date.now()), qty: 1, unit: 'Tablet', item: '', description: '', unitPrice: 0 }
      ]);
    }
  }, [prfNo]);
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
      history: [...receiveModal.history, { date: getManilaDate(), qty, note: receiveNote || `Received delivery (+${qty} units)` }],
    };
    try {
      await onUpdateRequest(updated);
      setReceiveModal(null);
      setReceiveQty('');
      setReceiveNote('');
    } catch (e) { console.error(e); }
  };

  const resetPrfForm = (nextNumber: string) => {
    setPrfNo(nextNumber);
    localStorage.setItem('cura_current_prf_no', nextNumber);
    setNewReq(n => ({ ...n, prfNo: nextNumber }));
    setPrfItems([
      { id: String(Date.now()), qty: 1, unit: 'Tablet', item: '', description: '', unitPrice: 0 }
    ]);
    setDepartment('Medical-Dental Clinic');
    setPurpose('Medical-Dental Clinic Routine Requisition & Replenishment');
    setDateNeeded('To follow lead time in Purchasing');
    setPreparedBy('Abigael C. Landingin');
    setEvalRemarks('');
    setRecommendedBy('');
    setSupplier1('');
    setSupplier2('');
    setSupplier3('');
    setForCashAdvance(false);
    setForPurchaseOrder(true);
    setRevSupplier('');
    setRevTerms('30 Days');
    setBudgetAmount('');
    setCapexNo('');
    setVerifiedBy('');
    setSourceOfFunds('');
    setEndorsedBy('');
    setRecFinance('');
    setApprovedBy('');
  };

  const handleNewRequest = async () => {
    if (isSubmitting) return;
    if (!newReq.medicine || !newReq.requestedQty) return;
    setIsSubmitting(true);
    const tempId = `PR-${Date.now()}`;
    const targetPrf = newReq.prfNo?.trim() || prfNo;
    const req: PurchaseRequest = {
      id: tempId,
      medicine: newReq.medicine,
      description: newReq.description || undefined,
      unit: newReq.unit || 'Tablet',
      prfNo: targetPrf,
      unitPrice: parseFloat(newReq.unitPrice) || 0,
      requestedQty: parseInt(newReq.requestedQty, 10) || 1,
      receivedQty: 0,
      date: getManilaDate(),
      status: 'Pending',
      history: [{ date: getManilaDate(), qty: 0, note: `Requisition initiated under ${targetPrf}` }],
    };
    try {
      await onAddRequest(req);
      setShowNewForm(false);
      const nextPrf = getNextPrfNo(targetPrf);
      resetPrfForm(nextPrf);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAllToTracker = async () => {
    if (isSubmitting) return;
    const currentPrf = prfNo.trim() || 'PRF-2026-001';
    const validRows = prfItems.filter(row => {
      const qty = typeof row.qty === 'string' ? parseInt(row.qty, 10) : row.qty;
      return row.item.trim() && qty && qty > 0;
    });

    if (validRows.length === 0) {
      alert('Please enter at least one medicine/item with a quantity before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      let addedCount = 0;
      for (const row of validRows) {
        const qty = typeof row.qty === 'string' ? parseInt(row.qty, 10) : row.qty;
        const unitPrice = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice) || 0 : row.unitPrice;
        const isExisting = purchaseRequests.find(r => r.id === row.id);
        
        if (isExisting) {
          // If it exists, update it if changed
          if (isExisting.requestedQty !== qty || isExisting.medicine !== row.item || isExisting.description !== row.description || isExisting.unitPrice !== unitPrice) {
            await onUpdateRequest({
              ...isExisting,
              requestedQty: qty,
              medicine: row.item,
              description: row.description || undefined,
              unitPrice: unitPrice,
            });
            addedCount++;
          }
        } else {
          // New request
          const req: PurchaseRequest = {
            id: row.id.startsWith('PR-') ? row.id : `PR-${Date.now()}-${addedCount}`,
            medicine: row.item,
            description: row.description || undefined,
            unit: row.unit || 'Tablet',
            prfNo: currentPrf,
            unitPrice: unitPrice,
            requestedQty: qty,
            receivedQty: 0,
            date: getManilaDate(),
            status: 'Pending',
            history: [{ date: getManilaDate(), qty: 0, note: `Requisition registered via ${currentPrf}` }],
          };
          await onAddRequest(req);
          addedCount++;
        }
      }
      const nextPrf = getNextPrfNo(currentPrf);
      resetPrfForm(nextPrf);
      setViewMode('tracker');
      setSubmitSuccessMsg(`${currentPrf} successfully submitted to Delivery Tracker! Form auto-reset for ${nextPrf}.`);
      setTimeout(() => setSubmitSuccessMsg(null), 6000);
    } catch (e) {
      console.error(e);
      alert('Failed to submit requisition.');
    } finally {
      setIsSubmitting(false);
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

  const seenPrKeys = new Set<string>();
  const filteredRequests = purchaseRequests.filter(req => {
    const matchesStatus = statusFilter === 'All' ? true : req.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      req.medicine.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (req.description && req.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.prfNo && req.prfNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesStatus || !matchesSearch) return false;

    const key = req.id ? `id:${req.id}` : '';
    const semanticKey = `${(req.medicine || '').toLowerCase()}|${(req.prfNo || '').toLowerCase()}|${req.requestedQty}`;
    if (key && seenPrKeys.has(key)) return false;
    if (seenPrKeys.has(semanticKey)) return false;
    if (key) seenPrKeys.add(key);
    seenPrKeys.add(semanticKey);
    return true;
  });

  // Group filteredRequests by PRF No.
  const prfGroups: Record<string, { prfNo: string; date: string; items: PurchaseRequest[] }> = {};
  for (const req of filteredRequests) {
    const key = req.prfNo?.trim() || 'PRF-2026-001';
    if (!prfGroups[key]) {
      prfGroups[key] = {
        prfNo: key,
        date: req.date || getManilaDate(),
        items: [],
      };
    }
    prfGroups[key].items.push(req);
  }

  const sortedPrfKeys = Object.keys(prfGroups).sort((a, b) => {
    const ma = a.match(/PRF-(\d{4})-(\d+)/i) || a.match(/PRF-(\d+)/i);
    const mb = b.match(/PRF-(\d{4})-(\d+)/i) || b.match(/PRF-(\d+)/i);
    if (ma && mb) {
      const ya = ma.length === 3 ? parseInt(ma[1], 10) : 0;
      const yb = mb.length === 3 ? parseInt(mb[1], 10) : 0;
      if (ya !== yb) return yb - ya;
      const na = parseInt(ma[ma.length - 1], 10);
      const nb = parseInt(mb[mb.length - 1], 10);
      return nb - na;
    }
    return b.localeCompare(a);
  });

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Pending:  { bg: `${YELLOW}25`, text: '#A17A0C', border: '#E2BD3D' },
    Partial:  { bg: '#EBF3FF', text: PRIMARY, border: '#B4D2FF' },
    Complete: { bg: '#E8F6F0', text: '#198057', border: '#A6DFC7' },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-transparent">
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
            min-width: 0 !important;
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
            background: transparent !important;
            padding: 0 !important;
            resize: none !important;
            color: #000 !important;
          }
          table input::placeholder, table textarea::placeholder {
            color: transparent !important;
          }
          .border-print-black {
            border-color: #000 !important;
          }
        }
      `}</style>

      {/* Header Banner & Navigation Tabs */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
            Purchase Receipts & Requisition
          </h1>
        </div>

        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar shadow-sm">
          <button
            onClick={() => setViewMode('template')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              viewMode === 'template'
                ? 'bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-sm shadow-sky-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText size={15} /> Official PRF Template
          </button>
          <button
            onClick={() => setViewMode('tracker')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              viewMode === 'tracker'
                ? 'bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-sm shadow-sky-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PackageCheck size={15} /> Delivery Tracker
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              viewMode === 'tracker' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
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
          {submitSuccessMsg && (
            <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle size={17} className="text-emerald-600 flex-shrink-0" />
                <span>{submitSuccessMsg}</span>
              </div>
              <button
                onClick={() => setSubmitSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <AlertCircle size={16} className="text-[#1E5AA8]" />
              <span>Click any field in the template below to type or edit before submitting.</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleRegisterAllToTracker}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-sm hover:opacity-95 active:scale-95 bg-[#0D9488] w-full sm:w-auto"
              >
                <BookmarkCheck size={15} /> Submit Delivery Tracker
              </button>
            </div>
          </div>

          {/* Printable PRF Document Container */}
          <div className="overflow-x-auto w-full pb-8 hide-scrollbar">
            <div className="prf-printable-area bg-white border-2 border-gray-400 p-8 md:p-12 shadow-lg max-w-5xl mx-auto text-black font-sans" style={{ minWidth: '800px' }}>
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
                    onChange={e => {
                      const val = e.target.value;
                      setPrfNo(val);
                      localStorage.setItem('cura_current_prf_no', val);
                      setNewReq(n => ({ ...n, prfNo: val }));
                    }}
                    className="border-b border-black w-28 text-right font-bold bg-transparent text-black focus:outline-none focus:bg-yellow-50 px-1"
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
                      <td className="border border-black p-1 text-right font-bold pr-2"></td>
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
            <div className="border-2 border-black text-[11px] text-black bg-white grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 divide-y md:divide-y-0 print:divide-y-0 md:divide-x-2 print:divide-x-2 divide-black">
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
                <div className="mt-4 pt-1 flex flex-col gap-1">
                  <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 text-center text-[11px] font-bold" />
                  <div className="text-center font-bold mt-1">
                    CANVASSER
                  </div>
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
                <div className="mt-4 pt-1 flex flex-col gap-1">
                  <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 text-center text-[11px] font-bold" />
                  <div className="text-center font-bold mt-1">
                    HEAD, RMS
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Signatures (4 columns) */}
            <div className="border-x-2 border-b-2 border-black text-[11px] text-black bg-white grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 divide-y md:divide-y-0 print:divide-y-0 md:divide-x-2 print:divide-x-2 divide-black">
              {/* Row 2 Box 1: Budget / AFMS */}
              <div className="p-2 flex flex-col justify-between min-h-[140px]">
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full min-w-[200px] text-sm mb-2">
                    <tbody>
                      <tr>
                        <td className="font-bold whitespace-nowrap">Budget Amount:</td>
                        <td><input type="text" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1" /></td>
                      </tr>
                      <tr>
                        <td className="font-bold whitespace-nowrap">If CAPEX, Authority No.</td>
                        <td><input type="text" value={capexNo} onChange={e => setCapexNo(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1" /></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="pt-1 font-bold">Verified by/Date:</div>
                  <input type="text" value={verifiedBy} onChange={e => setVerifiedBy(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50" />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 text-center text-[11px] font-bold" />
                  <div className="text-center font-bold mt-1">
                    HEAD, AFMS
                  </div>
                </div>
              </div>

              {/* Row 2 Box 2: Source of Funds / Cluster Head */}
              <div className="p-2 flex flex-col justify-between min-h-[140px]">
                <div className="space-y-1">
                  <div className="font-bold">Source of Funds if without budget:</div>
                  <input type="text" value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50" />
                  <div className="font-bold pt-1">Endorsed by/Date:</div>
                  <input type="text" value={endorsedBy} onChange={e => setEndorsedBy(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50" />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 text-center text-[11px] font-bold" />
                  <div className="text-center font-bold mt-1">
                    <div>CLUSTER HEAD</div>
                    <div className="text-[9px] font-normal">(VPAA, VPA,VPF, PRESIDENT)</div>
                  </div>
                </div>
              </div>

              {/* Row 2 Box 3: VP Finance (>500K) */}
              <div className="p-2 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-2">Recommended by/Date:</div>
                  <input type="text" value={recFinance} onChange={e => setRecFinance(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50" />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 text-center text-[11px] font-bold" />
                  <div className="text-center mt-1">
                    <div className="font-bold">VP FOR FINANCE</div>
                    <div className="text-[10px]">(more than 500K)</div>
                  </div>
                </div>
              </div>

              {/* Row 2 Box 4: Approved by */}
              <div className="p-2 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="font-bold mb-2">Approved by/Date:</div>
                  <input type="text" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50" />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 text-center text-[11px] font-bold" />
                  <div className="text-center mt-1">
                    <div className="font-bold">VP FOR FINANCE (up to 500K)</div>
                    <div className="font-bold mt-0.5">PRESIDENT (more than 500K to 1M)</div>
                  </div>
                </div>
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
          {submitSuccessMsg && (
            <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle size={17} className="text-emerald-600 flex-shrink-0" />
                <span>{submitSuccessMsg}</span>
              </div>
              <button
                onClick={() => setSubmitSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

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
            <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto hide-scrollbar shadow-sm">
              {(['All', 'Pending', 'Partial', 'Complete'] as const).map(s => (
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
              <button
                onClick={() => setShowNewForm(true)}
                className="ml-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white font-semibold text-xs transition-all shadow-sm hover:opacity-90 bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]"
              >
                <Plus size={14} strokeWidth={2.5} /> Log Item
              </button>
            </div>
          </div>

          {/* Requests Tracking List Grouped by PRF */}
          <div className="space-y-4">
            {sortedPrfKeys.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 font-medium">
                No requisition orders match the current filter or search criteria.
              </div>
            ) : (
              sortedPrfKeys.map(prfKey => {
                const group = prfGroups[prfKey];
                const isOpen = Boolean(openPrfs[prfKey]);
                const prfTitle = getPrfDisplayTitle(group.prfNo);
                const purchaseDate = group.date ? normalizeDate(group.date) : getManilaDate();

                return (
                  <div key={prfKey} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all">
                    {/* PRF Container Header / Dropdown Toggle */}
                    <div className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors">
                      <button
                        type="button"
                        onClick={() => setOpenPrfs(prev => ({ ...prev, [prfKey]: !isOpen }))}
                        className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 flex-1 min-w-0 pr-3 cursor-pointer text-left select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] flex items-center justify-center flex-shrink-0">
                            <FileText size={16} />
                          </div>
                          <span className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight">
                            {prfTitle}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium sm:border-l sm:border-gray-200 sm:pl-4">
                          Date of Purchase: <strong className="text-gray-700 font-semibold">{purchaseDate}</strong>
                        </span>
                      </button>

                      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintPrf(group);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold text-xs bg-[#1E5AA8] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
                          title={`Print ${group.prfNo} Form`}
                        >
                          <Printer size={13} />
                          <span className="hidden sm:inline">Print PRF Form</span>
                        </button>

                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold hidden xs:inline-block">
                          {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenPrfs(prev => ({ ...prev, [prfKey]: !isOpen }))}
                          className={`w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center transition-transform duration-200 cursor-pointer ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Dropdown Content: Medicines inside this PRF container */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-1 border-t border-gray-100 bg-gray-50/40 space-y-3 animate-in fade-in duration-200">
                        {group.items.map(req => {
                          const sc = statusColors[req.status];
                          const progress = Math.min(100, Math.round((req.receivedQty / req.requestedQty) * 100));
                          const isExpanded = expanded === req.id;
                          return (
                            <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden hover:border-gray-300 transition-all">
                              <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
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
                                  <div className="flex items-center gap-2 text-xs flex-wrap mt-2">
                                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-md shadow-2xs">
                                      <FileText size={11} className="text-blue-600" />
                                      Ref #{req.prfNo || 'PRF-2026-001'}
                                    </span>
                                    <span
                                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                      title={`Click to copy Request ID: ${req.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(req.id);
                                      }}
                                    >
                                      <span className="text-gray-400 font-normal">ID:</span>
                                      <span className="font-semibold">{req.id.length > 10 ? `${req.id.slice(0, 8)}…` : req.id}</span>
                                      <Copy size={10} className="text-gray-400 hover:text-gray-600" />
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md">
                                      <Calendar size={11} className="text-gray-400" />
                                      <span>{normalizeDate(req.date)}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md">
                                      <span className="text-gray-400">Unit:</span>
                                      <span className="font-semibold text-gray-800">{req.unit || 'Tablet'}</span>
                                    </span>
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
                                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto mt-4 lg:mt-0">
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
                                        <div className="flex-1 overflow-hidden">
                                          <span className="font-bold text-gray-800 break-words">{h.note}</span>
                                          <div className="text-gray-400 mt-0.5 font-medium">
                                            {formatManilaDateTime(h.date)} {h.qty > 0 ? ` • Verified arrival of +${h.qty} ${req.unit || 'units'}` : ''}
                                          </div>
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
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Printable Area for Submitted PRF when printing from Delivery Tracker */}
          {printingPrfGroup && (
            <div className="prf-printable-area bg-white border-2 border-gray-400 p-8 md:p-12 shadow-lg max-w-5xl mx-auto text-black font-sans hidden print:block" style={{ minWidth: '800px' }}>
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
                    <span className="border-b border-black w-28 text-right font-bold inline-block px-1">
                      {printingPrfGroup.prfNo}
                    </span>
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
                <span className="border-b border-black w-72 font-bold px-1 inline-block">
                  {department}
                </span>
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
                  </tr>
                </thead>
                <tbody>
                  {printingPrfGroup.items.map((row, idx) => (
                    <tr key={row.id || idx} className="border border-black">
                      <td className="border border-black p-1 text-center font-semibold">{row.requestedQty}</td>
                      <td className="border border-black p-1 text-center font-medium">{row.unit || 'Tablet'}</td>
                      <td className="border border-black p-1.5 text-left font-semibold">{row.medicine}</td>
                      <td className="border border-black p-1.5 text-left text-gray-800">{row.description || ''}</td>
                      <td className="border border-black p-1 text-center font-medium">{row.unitPrice ? row.unitPrice : ''}</td>
                      <td className="border border-black p-1 text-right font-bold pr-2"></td>
                    </tr>
                  ))}
                  <tr className="border border-black bg-white">
                    <td colSpan={6} className="p-3 border border-black text-xs font-medium space-y-2">
                      <div className="flex items-center">
                        <span className="font-bold whitespace-nowrap">Purpose of Purchase:</span>
                        <span className="ml-2 font-medium">{purpose}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-bold whitespace-nowrap">Date/Time Needed: (To follow lead time in Purchasing)</span>
                        <span className="ml-2 font-medium">{printingPrfGroup.date ? normalizeDate(printingPrfGroup.date) : dateNeeded}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures & Verification Grid */}
              <div className="border-2 border-black text-[11px] text-black bg-white grid grid-cols-4 divide-x-2 divide-black">
                <div className="p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="font-bold mb-6">Prepared by/Date:</div>
                    <div className="w-full font-extrabold text-center border-b border-black pb-1">{preparedBy}</div>
                  </div>
                  <div className="text-center font-bold uppercase mt-2">REQUESTING PARTY</div>
                </div>
                <div className="p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="font-bold mb-1">Evaluation Remarks:</div>
                    <div className="w-full text-xs border-b border-black mb-3 min-h-[30px]">{evalRemarks}</div>
                    <div className="font-bold mb-3">Recommended by/Date:</div>
                    <div className="w-full border-b border-black min-h-[20px]">{recommendedBy}</div>
                  </div>
                  <div className="text-center mt-2">
                    <div className="font-bold">DIRECTOR</div>
                    <div className="text-[9px] text-gray-600 leading-tight mt-0.5">OMISS or Dean for Computer, Peripherals & Labs; Physical Plant if Physical Facilities; Library for Books; EAMO for Marketing</div>
                  </div>
                </div>
                <div className="p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="font-bold mb-1">Processed by/Date:</div>
                    <div className="text-[10px] font-bold mb-1">Supplier – Price Quoted</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1"><span>1</span><span className="flex-1 border-b border-black text-[10px] inline-block">{supplier1}</span></div>
                      <div className="flex items-center gap-1"><span>2</span><span className="flex-1 border-b border-black text-[10px] inline-block">{supplier2}</span></div>
                      <div className="flex items-center gap-1"><span>3</span><span className="flex-1 border-b border-black text-[10px] inline-block">{supplier3}</span></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-1 flex flex-col gap-1">
                    <div className="w-full border-b border-black text-center text-[11px] font-bold min-h-[16px]"></div>
                    <div className="text-center font-bold mt-1">CANVASSER</div>
                  </div>
                </div>
                <div className="p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="font-bold mb-2">Reviewed by/Date:</div>
                    <div className="space-y-1 text-xs mb-2">
                      <div className="flex items-center gap-2"><span>[{forCashAdvance ? 'X' : ' '}] For Cash Advance</span></div>
                      <div className="flex items-center gap-2"><span>[{forPurchaseOrder ? 'X' : ' '}] For Purchase Order</span></div>
                    </div>
                    <div className="flex items-center text-[11px] mb-1">
                      <span className="font-bold">Supplier:</span><span className="flex-1 ml-1 border-b border-black px-1 inline-block">{revSupplier}</span>
                    </div>
                    <div className="flex items-center text-[11px]">
                      <span className="font-bold">Terms:</span><span className="flex-1 ml-1 border-b border-black px-1 inline-block">{revTerms}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-1 flex flex-col gap-1">
                    <div className="w-full border-b border-black text-center text-[11px] font-bold min-h-[16px]"></div>
                    <div className="text-center font-bold mt-1">HEAD, RMS</div>
                  </div>
                </div>
              </div>

              {/* Bottom Row Signatures */}
              <div className="border-x-2 border-b-2 border-black text-[11px] text-black bg-white grid grid-cols-4 divide-x-2 divide-black">
                <div className="p-2 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <table className="w-full text-sm mb-2">
                      <tbody>
                        <tr><td className="font-bold whitespace-nowrap">Budget Amount:</td><td><span className="w-full border-b border-black px-1 inline-block">{budgetAmount}</span></td></tr>
                        <tr><td className="font-bold whitespace-nowrap">If CAPEX, Authority No.</td><td><span className="w-full border-b border-black px-1 inline-block">{capexNo}</span></td></tr>
                      </tbody>
                    </table>
                    <div className="pt-1 font-bold">Verified by/Date:</div>
                    <div className="w-full border-b border-black min-h-[18px]">{verifiedBy}</div>
                  </div>
                  <div className="mt-2 text-center font-bold">HEAD, AFMS</div>
                </div>
                <div className="p-2 flex flex-col justify-between min-h-[140px]">
                  <div className="space-y-1">
                    <div className="font-bold">Source of Funds if without budget:</div>
                    <div className="w-full border-b border-black min-h-[18px]">{sourceOfFunds}</div>
                    <div className="font-bold pt-1">Endorsed by/Date:</div>
                    <div className="w-full border-b border-black min-h-[18px]">{endorsedBy}</div>
                  </div>
                  <div className="mt-2 text-center font-bold">
                    <div>CLUSTER HEAD</div>
                    <div className="text-[9px] font-normal">(VPAA, VPA,VPF, PRESIDENT)</div>
                  </div>
                </div>
                <div className="p-2 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="font-bold mb-2">Recommended by/Date:</div>
                    <div className="w-full border-b border-black min-h-[18px]">{recFinance}</div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-bold">VP FOR FINANCE</div>
                    <div className="text-[10px]">(more than 500K)</div>
                  </div>
                </div>
                <div className="p-2 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="font-bold mb-2">Approved by/Date:</div>
                    <div className="w-full border-b border-black min-h-[18px]">{approvedBy}</div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-bold">VP FOR FINANCE (up to 500K)</div>
                    <div className="font-bold mt-0.5">PRESIDENT (more than 500K to 1M)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
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

