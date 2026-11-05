import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Camera, Upload, RefreshCw, Check, User, IdCard,
  ScanLine, AlertCircle, Sparkles, Copy, ArrowRight
} from 'lucide-react';
import { recognize } from 'tesseract.js';
import { toast } from 'sonner';

const PRIMARY = '#1B3A6B';

const IGNORED_PHRASES = [
  'UNIVERSITY OF THE ASSUMPTION',
  'UNIVERSITY',
  'ASSUMPTION',
  'COLLEGE OF',
  'SCHOOL OF',
  'DEPARTMENT',
  'STUDENT IDENTIFICATION',
  'IDENTIFICATION CARD',
  'STUDENT ID',
  'OFFICE OF THE REGISTRAR',
  'REGISTRAR',
  'CITY OF SAN FERNANDO',
  'PAMPANGA',
  'PHILIPPINES',
  'REPUBLIC OF',
  'BASIC EDUCATION',
  'SENIOR HIGH',
  'JUNIOR HIGH',
  'ELEMENTARY',
  'VALID UNTIL',
  'SCHOOL YEAR',
  'SEMESTER',
  'SIGNATURE',
  'EMERGENCY CONTACT',
  'CONTACT PERSON',
  'BLOOD TYPE',
  'PHILHEALTH',
  'SSS',
  'TIN',
  'TELEPHONE',
  'DATE OF BIRTH',
  'BIRTHDAY',
  'ADDRESS',
  'COURSE',
  'YEAR',
  'SECTION',
  'EXPIRY',
  'NON-TRANSFERABLE',
  'FOUND',
  'PLEASE RETURN',
];

interface ExtractedInfo {
  detectedId: string;
  detectedName: string;
  allLines: string[];
}

interface StudentIdScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { studentId: string; studentName: string }) => void;
  initialId?: string;
  initialName?: string;
}

export function StudentIdScannerModal({
  isOpen,
  onClose,
  onApply,
  initialId = '',
  initialName = '',
}: StudentIdScannerModalProps) {
  const [sourceMode, setSourceMode] = useState<'camera' | 'upload'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<string>('');

  const [studentId, setStudentId] = useState(initialId);
  const [studentName, setStudentName] = useState(initialName);
  const [extractedLines, setExtractedLines] = useState<string[]>([]);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setSourceMode('upload');
        setCameraError('Camera API is not supported in this browser. Please upload an image.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or camera not found.');
      setSourceMode('upload');
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setStudentId(initialId);
      setStudentName(initialName);
      setCapturedImage(null);
      setExtractedLines([]);
      setScanProgress(0);
      setScanStatus('');
      if (sourceMode === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, initialId, initialName]);

  useEffect(() => {
    if (isOpen && sourceMode === 'camera' && !capturedImage) {
      startCamera();
    } else if (sourceMode !== 'camera' || capturedImage) {
      stopCamera();
    }
  }, [sourceMode, capturedImage, isOpen, startCamera, stopCamera]);

  // Clean and parse text heuristics
  const analyzeExtractedText = (rawText: string): ExtractedInfo => {
    const lines = rawText
      .split('\n')
      .map(l => l.trim().replace(/\s+/g, ' '))
      .filter(l => l.length >= 2 && !/^[^a-zA-Z0-9]+$/.test(l));

    // Filter out obvious header noise
    const candidateLines = lines.filter(line => {
      const upper = line.toUpperCase();
      return !IGNORED_PHRASES.some(phrase => upper.includes(phrase));
    });

    // 1. Detect Student ID
    let detectedId = '';
    // Look for explicit label "ID: ...", "SN: ...", "STUDENT NO: ..."
    for (const line of lines) {
      const labeled = line.match(/(?:ID|SN|STUDENT\s*NO|STUDENT\s*ID)[.:\s#-]*([0-9A-Z-]{5,15})/i);
      if (labeled && labeled[1] && /\d{3,}/.test(labeled[1])) {
        detectedId = labeled[1].replace(/[^0-9A-Za-z-]/g, '').trim();
        break;
      }
    }
    // If not found with label, look for typical year-prefixed pattern like "2024-00123" or 7-10 digit numbers
    if (!detectedId) {
      for (const line of lines) {
        const numMatch = line.match(/\b(20\d{2}[-\s]?\d{4,6}|\d{7,10})\b/);
        if (numMatch && numMatch[1]) {
          detectedId = numMatch[1].replace(/\s+/g, '-').trim();
          break;
        }
      }
    }

    // 2. Detect Student Name
    let detectedName = '';
    // Priority A: "LASTNAME, FIRSTNAME MIDDLE" (comma-separated format)
    for (const line of candidateLines) {
      const clean = line.replace(/[^a-zA-Z,.\s-]/g, '').trim();
      if (clean.includes(',') && clean.length >= 5 && clean.length <= 45 && !/\d/.test(line)) {
        const parts = clean.split(',').map(p => p.trim());
        if (parts.length === 2 && parts[0].length >= 2 && parts[1].length >= 2) {
          detectedName = clean.toUpperCase();
          break;
        }
      }
    }

    // Priority B: All-caps 2 to 4 word line without digits or punctuation
    if (!detectedName) {
      for (const line of candidateLines) {
        const clean = line.replace(/[^a-zA-Z\s.]/g, '').trim();
        const words = clean.split(/\s+/).filter(w => w.length > 1);
        if (
          words.length >= 2 &&
          words.length <= 5 &&
          clean.length >= 6 &&
          clean.length <= 40 &&
          !/\d/.test(line) &&
          !detectedId.includes(line)
        ) {
          // Check if uppercase or title case
          const isMostlyLetters = /^[A-Za-z\s.]+$/.test(clean);
          if (isMostlyLetters) {
            detectedName = clean.toUpperCase();
            break;
          }
        }
      }
    }

    return {
      detectedId,
      detectedName,
      allLines: lines,
    };
  };

  // Run OCR on an image dataUrl
  const processImageForOcr = async (imageDataUrl: string) => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStatus('Preparing ID image...');

    try {
      // Step 1: Pre-process image on a 2D canvas for higher contrast & sharpness
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise(resolve => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const maxDim = 1600;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }

      setScanProgress(30);
      setScanStatus('Reading text from ID card...');

      // Step 2: Run Tesseract
      const result = await recognize(canvas.toDataURL('image/jpeg', 0.92), 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setScanProgress(30 + Math.round(m.progress * 65));
            setScanStatus(`Analyzing text (${Math.round(m.progress * 100)}%)...`);
          }
        },
      });

      setScanProgress(98);
      setScanStatus('Parsing Student Name & ID Number...');

      const analyzed = analyzeExtractedText(result.data.text || '');
      setExtractedLines(analyzed.allLines);

      if (analyzed.detectedId) {
        setStudentId(analyzed.detectedId);
      }
      if (analyzed.detectedName) {
        setStudentName(analyzed.detectedName);
      }

      setScanProgress(100);
      if (analyzed.detectedId || analyzed.detectedName) {
        toast.success('ID scanned! Review detected details below.');
      } else {
        toast.info('ID scanned. Click any detected text line below to assign Name or ID.');
      }
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      toast.error('Failed to read ID image. Please ensure good lighting and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Capture frame from live video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
    processImageForOcr(dataUrl);
  };

  // Handle uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        processImageForOcr(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = '';
  };

  // Retake or pick new image
  const handleResetScan = () => {
    setCapturedImage(null);
    setExtractedLines([]);
    setScanProgress(0);
    setScanStatus('');
    if (sourceMode === 'camera') {
      startCamera();
    }
  };

  // User actions on detected lines
  const handleSetAsName = (line: string) => {
    const cleaned = line.replace(/[^a-zA-Z,.\s-]/g, '').trim().toUpperCase();
    setStudentName(cleaned);
    toast.success(`Set as Name: "${cleaned}"`);
  };

  const handleSetAsId = (line: string) => {
    // Extract numeric sequence or use cleaned line
    const match = line.match(/\b([A-Z0-9-]{4,15})\b/i);
    const idVal = match ? match[1] : line.replace(/[^0-9A-Za-z-]/g, '').trim();
    setStudentId(idVal);
    toast.success(`Set as ID: "${idVal}"`);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied to clipboard');
  };

  const handleApply = () => {
    if (!studentName.trim() && !studentId.trim()) {
      toast.error('Please specify at least Student Name or Student ID.');
      return;
    }
    onApply({
      studentId: studentId.trim(),
      studentName: studentName.trim().toUpperCase(),
    });
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4.5 text-white flex items-center justify-between shrink-0"
          style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #0F2347 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
              <ScanLine size={20} className="text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Scan Student ID</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  OCR Smart Reader
                </span>
              </h2>
              <p className="text-xs text-blue-200/90 font-medium">
                Capture or upload an ID card to automatically detect Name and Student ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Source Mode Tabs */}
        {!capturedImage && (
          <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-6 pt-3 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSourceMode('camera');
                setCameraError(null);
                startCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                sourceMode === 'camera'
                  ? 'bg-white text-[#1B3A6B] border-[#1B3A6B] shadow-sm'
                  : 'text-gray-500 border-transparent hover:text-gray-800'
              }`}
            >
              <Camera size={14} />
              <span>Use Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode('upload');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                sourceMode === 'upload'
                  ? 'bg-white text-[#1B3A6B] border-[#1B3A6B] shadow-sm'
                  : 'text-gray-500 border-transparent hover:text-gray-800'
              }`}
            >
              <Upload size={14} />
              <span>Upload Photo / File</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* CAMERA / CAPTURE VIEW */}
          {!capturedImage ? (
            <div>
              {sourceMode === 'camera' ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/10] flex items-center justify-center shadow-inner border border-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* ID Card Framing Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div className="relative w-full max-w-sm aspect-[1.58/1] rounded-2xl border-2 border-cyan-400/90 shadow-[0_0_20px_rgba(6,182,212,0.35)] flex flex-col justify-between p-3 bg-cyan-950/10">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-300 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-300 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-300 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-300 rounded-br-lg" />

                      <div className="text-[11px] font-bold text-cyan-200 tracking-wider text-center uppercase bg-black/50 py-1 px-3 rounded-full mx-auto backdrop-blur-xs">
                        Align ID card within frame
                      </div>
                      <div className="text-[10px] text-cyan-200/80 text-center bg-black/40 py-0.5 px-2 rounded-full mx-auto">
                        Make sure student name & ID are clear & glare-free
                      </div>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
                      <AlertCircle size={36} className="text-amber-400 mb-2" />
                      <p className="text-sm font-semibold mb-1">Camera Not Available</p>
                      <p className="text-xs text-gray-300 max-w-xs mb-4">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Upload size={14} />
                        <span>Upload Photo Instead</span>
                      </button>
                    </div>
                  )}

                  {/* Shutter button */}
                  {!cameraError && (
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer hover:shadow-cyan-500/50"
                      >
                        <Camera size={16} />
                        <span>Capture ID</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* UPLOAD VIEW */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">
                    Click to select or take an ID Photo
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs mb-4">
                    Supports JPG, PNG, WEBP. On mobile devices, this will open your camera.
                  </p>
                  <span className="px-4 py-2 rounded-xl bg-[#1B3A6B] text-white text-xs font-bold shadow-sm group-hover:bg-[#152e55] transition-colors">
                    Browse File or Snap Photo
                  </span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            /* CAPTURED & SCANNED VIEW */
            <div className="space-y-4">
              {/* Preview Thumbnail + Scan Status Banner */}
              <div className="bg-slate-900 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-4 text-white relative overflow-hidden">
                <div className="relative w-36 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-black">
                  <img
                    src={capturedImage}
                    alt="Captured ID"
                    className="w-full h-full object-cover"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-full h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isScanning ? (
                        <RefreshCw size={15} className="animate-spin text-cyan-400" />
                      ) : (
                        <Sparkles size={15} className="text-amber-300" />
                      )}
                      <span className="text-xs font-bold text-slate-100">
                        {isScanning ? scanStatus : 'Scan Analysis Complete'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Retake</span>
                    </button>
                  </div>

                  {/* Progress bar during scan */}
                  {isScanning && (
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  )}

                  {!isScanning && (
                    <p className="text-[11px] text-slate-300">
                      Smart heuristics detected the student info below. Click on any extracted line to quickly replace or refine.
                    </p>
                  )}
                </div>
              </div>

              {/* TARGET INPUT FORM (Auto-filled or selected by user) */}
              <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl p-4 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] flex items-center gap-1.5">
                    <User size={14} className="text-blue-600" />
                    <span>Values to Apply to Form</span>
                  </span>
                  {(studentId || studentName) && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check size={11} /> Ready
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <IdCard size={13} className="text-blue-600" />
                      <span>Student ID Number</span>
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="e.g., 2024-00123"
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User size={13} className="text-blue-600" />
                      <span>Student Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value.toUpperCase())}
                      placeholder="e.g., DELA CRUZ, JUAN P."
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-gray-300 bg-white text-gray-900 uppercase focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* INTERACTIVE EXTRACTED LINES LIST */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ScanLine size={13} className="text-blue-600" />
                    <span>All Recognized Text Lines ({extractedLines.length})</span>
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Tap a button to set as Name or ID
                  </span>
                </div>

                {extractedLines.length === 0 && !isScanning ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                    No text could be extracted clearly. Try taking a photo with better lighting and sharpness.
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {extractedLines.map((line, index) => {
                      const isCurrentName = studentName && line.toUpperCase().includes(studentName.trim().toUpperCase());
                      const isCurrentId = studentId && line.includes(studentId.trim());

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs transition-colors ${
                            isCurrentName || isCurrentId
                              ? 'bg-blue-50/80 border-blue-200'
                              : 'bg-white border-gray-150 hover:bg-gray-50'
                          }`}
                        >
                          <span
                            className="font-medium text-gray-800 truncate select-all flex-1 cursor-text"
                            title={line}
                          >
                            {line}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetAsName(line)}
                              title="Set this line as Student Name"
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isCurrentName
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-blue-100/70 text-[#1B3A6B] hover:bg-blue-200'
                              }`}
                            >
                              <User size={11} />
                              <span>Set Name</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetAsId(line)}
                              title="Set this line as Student ID"
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isCurrentId
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-indigo-100/70 text-indigo-900 hover:bg-indigo-200'
                              }`}
                            >
                              <IdCard size={11} />
                              <span>Set ID</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyText(line)}
                              title="Copy text"
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          {capturedImage && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isScanning}
              className="px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              <Check size={14} />
              <span>Apply to Student Form</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
