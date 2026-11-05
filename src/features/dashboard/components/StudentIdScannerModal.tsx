import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Camera, Upload, RefreshCw, User, IdCard,
  ScanLine, AlertCircle, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { recognize } from 'tesseract.js';
import { toast } from 'sonner';

const PRIMARY = '#1B3A6B';

// Blacklist of university headers, administrative words, degrees, and noise
const BLACKLIST_KEYWORDS = [
  'UNIVERSITY OF THE ASSUMPTION',
  'UNIVERSITY',
  'ASSUMPTION',
  'UNISITE',
  'SUBDIVISION',
  'DEL PILAR',
  'SAN FERNANDO',
  'PAMPANGA',
  'PHILIPPINES',
  'REPUBLIC',
  'COMMISSION ON HIGHER EDUCATION',
  'CHED',
  'DEPED',
  'STUDENT IDENTIFICATION',
  'IDENTIFICATION CARD',
  'STUDENT ID',
  'STUDENT NO',
  'STUDENT NUMBER',
  'ID NO',
  'ID NUMBER',
  'SN',
  'VALID UNTIL',
  'VALIDITY',
  'SCHOOL YEAR',
  'ACADEMIC YEAR',
  'A.Y.',
  'S.Y.',
  'SEMESTER',
  'FIRST SEM',
  'SECOND SEM',
  '1ST SEM',
  '2ND SEM',
  'SIGNATURE',
  'EMERGENCY',
  'CONTACT',
  'IN CASE OF EMERGENCY',
  'NOTIFY',
  'PARENT',
  'GUARDIAN',
  'TELEPHONE',
  'TEL',
  'PHONE',
  'CELL',
  'MOBILE',
  'ADDRESS',
  'BLOOD TYPE',
  'PHILHEALTH',
  'SSS',
  'TIN',
  'DATE OF BIRTH',
  'DOB',
  'BIRTHDAY',
  'OFFICE OF THE REGISTRAR',
  'REGISTRAR',
  'PRESIDENT',
  'DEAN',
  'PRINCIPAL',
  'DIRECTOR',
  'NON-TRANSFERABLE',
  'IF FOUND',
  'PLEASE RETURN',
  'PROPERTY OF',
  'LOSS',
  'SURRENDER',
  'BARCODE',
  'QR',
  'COLLEGE OF',
  'SCHOOL OF',
  'DEPARTMENT',
  'BACHELOR',
  'ASSOCIATE',
  'MASTER',
  'DOCTOR',
  'SCIENCE IN',
  'ARTS IN',
  'EDUCATION',
  'NURSING',
  'PHARMACY',
  'ENGINEERING',
  'ARCHITECTURE',
  'ACCOUNTANCY',
  'BUSINESS ADMINISTRATION',
  'HOSPITALITY',
  'TOURISM',
  'CRIMINOLOGY',
  'PSYCHOLOGY',
  'INFORMATION TECHNOLOGY',
  'COMPUTER SCIENCE',
  'COMMUNICATION',
  'HUMSS',
  'STEM',
  'ABM',
  'GAS',
  'TVL',
  'SENIOR HIGH',
  'JUNIOR HIGH',
  'ELEMENTARY',
  'GRADE',
  'YEAR LEVEL',
  'SECTION',
  'STUDENT',
  'COLLEGE',
  'CAMPUS',
];

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

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start portrait camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSourceMode('upload');
        setCameraError('Camera is not supported in this browser. Please upload an image.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or not available.');
      setSourceMode('upload');
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setStudentId(initialId);
      setStudentName(initialName);
      setCapturedImage(null);
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

  // Clean raw line
  const cleanLine = (raw: string): string => {
    return raw
      .replace(/^[^a-zA-Z0-9]+/, '')
      .replace(/[^a-zA-Z0-9]+$/, '')
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // High-accuracy Name & ID extraction engine
  const extractStudentDetails = (rawText: string): { name: string; id: string } => {
    const rawLines = rawText.split('\n');
    const lines: string[] = [];

    for (const r of rawLines) {
      // Strip leading noise characters like ". NATIVIDAD" or "~BALTAZAR" or "- CRUZ"
      const stripped = r.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9.]+$/, '').trim();
      // Common OCR typo: replace semicolon with comma when between letters (e.g. CRUZ; JUAN -> CRUZ, JUAN)
      const normalized = stripped.replace(/([A-Za-z]);\s*([A-Za-z])/g, '$1, $2');
      const c = cleanLine(normalized);
      if (c.length >= 2 && !/^[^a-zA-Z0-9]+$/.test(c)) {
        lines.push(c);
      }
    }

    // 1. EXTRACT STUDENT ID
    let detectedId = '';

    // Check for labeled ID (e.g., "ID NO: 2024-00123" or "SN: 2023-10492")
    for (const line of lines) {
      const labeled = line.match(/(?:ID\s*(?:NO|NUMBER|\.?)|STUDENT\s*(?:ID|NO|NUMBER|\.?)|SN\.?)[:.\s#-]*([A-Z0-9-]{4,16})/i);
      if (labeled && labeled[1]) {
        let val = labeled[1].trim().replace(/O/g, '0').replace(/[Il]/g, '1');
        if (/\d{4,}/.test(val)) {
          detectedId = val;
          break;
        }
      }
    }

    // Check for standard year-prefixed university ID format: 202X-XXXXX
    if (!detectedId) {
      for (const line of lines) {
        const yearMatch = line.match(/\b(20[12]\d[- ]?\d{4,6})\b/);
        if (yearMatch && yearMatch[1]) {
          detectedId = yearMatch[1].replace(/\s+/g, '-');
          break;
        }
      }
    }

    // Fallback: standalone numeric ID (6-10 digits)
    if (!detectedId) {
      for (const line of lines) {
        const numMatch = line.match(/\b(\d{7,10})\b/);
        if (numMatch && numMatch[1]) {
          detectedId = numMatch[1];
          break;
        }
      }
    }

    // 2. EXTRACT STUDENT FULL NAME (Top Priority)
    interface NameCandidate {
      name: string;
      score: number;
    }
    const candidates: NameCandidate[] = [];

    // Strategy A: Multi-line Name Detection (Standard Philippine & UA ID format: Line 1 = Surname, Line 2 = Given Name + M.I.)
    // Example from UA ID:
    // Line 1: ". NATIVIDAD JR."
    // Line 2: "BALTAZAR O."
    // Result: "NATIVIDAD JR., BALTAZAR O."
    for (let i = 0; i < lines.length - 1; i++) {
      const lineA = lines[i];
      const lineB = lines[i + 1];

      const upperA = lineA.toUpperCase();
      const upperB = lineB.toUpperCase();

      // Skip if either line matches blacklist or contains numbers
      if (BLACKLIST_KEYWORDS.some(k => upperA.includes(k) || upperB.includes(k))) continue;
      if (/\d/.test(lineA) || /\d/.test(lineB)) continue;

      const cleanA = lineA
        .replace(/[^a-zA-Z,.\s-]/g, '')
        .replace(/^[,.\s-]+/, '')
        .replace(/[,.\s-]+$/, '')
        .trim();

      const cleanB = lineB
        .replace(/[^a-zA-Z,.\s-]/g, '')
        .replace(/^[,.\s-]+/, '')
        .replace(/[,.\s-]+$/, '')
        .trim();

      if (cleanA.length < 2 || cleanB.length < 2) continue;

      const wordsA = cleanA.split(/\s+/).filter(Boolean);
      const wordsB = cleanB.split(/\s+/).filter(Boolean);

      // Surname line is usually 1 to 3 words; given name line is usually 1 to 4 words
      if (wordsA.length >= 1 && wordsA.length <= 3 && wordsB.length >= 1 && wordsB.length <= 4) {
        let pairScore = 80;

        // Line A has suffix (JR, SR, II, III, IV)
        const hasSuffixA = /\b(?:JR|SR|II|III|IV)\.?$/i.test(cleanA);
        if (hasSuffixA) pairScore += 45;

        // Line B has middle initial ending with period or single letter (e.g. "O." or "O" or "P.")
        const hasMiddleInitialB = /\b[A-Z]\.?$/i.test(cleanB);
        if (hasMiddleInitialB) pairScore += 50;

        // Line A has comma already (e.g. "NATIVIDAD,")
        if (cleanA.includes(',')) pairScore += 20;

        // Proximity to top / ID center
        if (i <= 4) pairScore += 30;

        // All uppercase boost
        if (cleanA === cleanA.toUpperCase() && cleanB === cleanB.toUpperCase()) {
          pairScore += 20;
        }

        const combined = cleanA.includes(',')
          ? `${cleanA.toUpperCase()} ${cleanB.toUpperCase()}`
          : `${cleanA.toUpperCase()}, ${cleanB.toUpperCase()}`;

        candidates.push({
          name: combined.replace(/\s{2,}/g, ' ').trim(),
          score: pairScore,
        });
      }
    }

    // Strategy B: Single-line Name Detection (e.g. "DELA CRUZ, JUAN P." or "SANTOS, MARIA CLARA D.")
    lines.forEach((line, index) => {
      const upper = line.toUpperCase();

      // Check blacklist
      const isBlacklisted = BLACKLIST_KEYWORDS.some(k => upper.includes(k));
      if (isBlacklisted) return;

      // Clean line for candidate name: allow only letters, comma, period, space, hyphen
      let clean = line
        .replace(/[^a-zA-Z,.\s-]/g, '')
        .replace(/^[,.\s-]+/, '')
        .replace(/[,.\s-]+$/, '')
        .trim();

      if (clean.length < 5 || clean.length > 42) return;

      // Disqualify if it has digits
      if (/\d/.test(line)) return;

      const words = clean.split(/\s+/).filter(w => w.length > 0);
      if (words.length < 2 || words.length > 5) return;

      let score = 20;

      // Format 1: LASTNAME, FIRSTNAME (Dominant single-line format)
      if (clean.includes(',')) {
        const [last, first] = clean.split(',').map(s => s.trim());
        if (last && first && last.length >= 2 && first.length >= 2) {
          score += 100; // Strongest indicator of school ID name format
        }
      }

      // Middle initial indicator (e.g., "P." or "D." or "M.")
      if (/\b[A-Z]\.\b/i.test(clean)) {
        score += 35;
      }

      // Uppercase letters
      if (clean === clean.toUpperCase()) {
        score += 20;
      }

      // Word count: 2, 3, or 4 words
      if (words.length >= 2 && words.length <= 4) {
        score += 20;
      }

      // Proximity to card center / personal section (lines 1 to 5)
      if (index >= 1 && index <= 5) {
        score += 25;
      } else if (index > 7) {
        score -= 20; // lower lines are usually disclaimers or signatures
      }

      const upperClean = clean.toUpperCase();
      candidates.push({ name: upperClean, score });
    });

    candidates.sort((a, b) => b.score - a.score);
    const detectedName = candidates[0]?.name || '';

    return {
      name: detectedName,
      id: detectedId,
    };
  };

  // Image preprocessing: high contrast for text clarity
  const preprocessImage = (canvas: HTMLCanvasElement): void => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    const contrast = 1.4; // High contrast
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const cGray = factor * (gray - 128) + 128;
      const clamped = Math.max(0, Math.min(255, cGray));
      d[i] = clamped;
      d[i + 1] = clamped;
      d[i + 2] = clamped;
    }
    ctx.putImageData(imgData, 0, 0);
  };

  // Process image with OCR
  const processImageForOcr = async (imageDataUrl: string) => {
    setIsScanning(true);
    setScanProgress(15);
    setScanStatus('Reading student ID card...');

    try {
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
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
        preprocessImage(canvas);
      }

      setScanProgress(35);
      setScanStatus('Detecting student name...');

      const result = await recognize(canvas.toDataURL('image/jpeg', 0.95), 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setScanProgress(35 + Math.round(m.progress * 60));
          }
        },
      });

      setScanProgress(98);
      setScanStatus('Identifying name...');

      const extracted = extractStudentDetails(result.data.text || '');

      if (extracted.name) {
        setStudentName(extracted.name);
      }
      if (extracted.id) {
        setStudentId(extracted.id);
      }

      setScanProgress(100);
      if (extracted.name) {
        setScanStatus(`Auto-filled: ${extracted.name}`);
        toast.success(`Auto-filled Student Name: ${extracted.name}`);
        setTimeout(() => {
          onApply({
            studentId: extracted.id || studentId || '',
            studentName: extracted.name,
          });
          stopCamera();
          onClose();
        }, 450);
        return;
      } else {
        toast.info('Could not clearly read the name. Please retake or enter name manually.');
      }
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      toast.error('Failed to process image. Please try again with clear lighting.');
    } finally {
      setIsScanning(false);
    }
  };

  // Capture frame from portrait viewfinder
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    const vWidth = video.videoWidth || 1080;
    const vHeight = video.videoHeight || 1920;

    // Crop to the vertical portrait card in the center (1:1.55 aspect ratio)
    let cropWidth = vWidth * 0.85;
    let cropHeight = cropWidth * 1.55;

    if (cropHeight > vHeight * 0.92) {
      cropHeight = vHeight * 0.92;
      cropWidth = cropHeight / 1.55;
    }

    const startX = (vWidth - cropWidth) / 2;
    const startY = (vHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
    processImageForOcr(dataUrl);
  };

  // File upload
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
    e.target.value = '';
  };

  const handleResetScan = () => {
    setCapturedImage(null);
    setScanProgress(0);
    setScanStatus('');
    if (sourceMode === 'camera') {
      startCamera();
    }
  };

  // Directly apply detected student name & ID
  const handleApply = () => {
    if (!studentName.trim() && !studentId.trim()) {
      toast.error('Please enter at least the Student Name.');
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-md"
          style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #0F2347 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
              <ScanLine size={20} className="text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Scan Student ID</span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  Auto-Detect
                </span>
              </h2>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Hold ID upright to automatically extract student name
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Source Mode Tabs */}
        {!capturedImage && (
          <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-5 pt-2.5 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSourceMode('camera');
                setCameraError(null);
                startCamera();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                sourceMode === 'camera'
                  ? 'bg-white text-[#1B3A6B] border-[#1B3A6B] shadow-sm'
                  : 'text-gray-500 border-transparent hover:text-gray-800'
              }`}
            >
              <Camera size={14} />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode('upload');
                stopCamera();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                sourceMode === 'upload'
                  ? 'bg-white text-[#1B3A6B] border-[#1B3A6B] shadow-sm'
                  : 'text-gray-500 border-transparent hover:text-gray-800'
              }`}
            >
              <Upload size={14} />
              <span>Upload Photo</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!capturedImage ? (
            <div>
              {sourceMode === 'camera' ? (
                /* PORTRAIT CAMERA VIEWFINDER */
                <div className="relative rounded-2xl overflow-hidden bg-black h-[400px] w-full flex items-center justify-center shadow-inner border border-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Vertical Portrait Guide Frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                    <div className="relative w-56 aspect-[1/1.55] rounded-2xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.45)] flex flex-col justify-between p-3 bg-cyan-950/15">
                      {/* Corner Accents */}
                      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-cyan-300 rounded-tl-xl" />
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-cyan-300 rounded-tr-xl" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-cyan-300 rounded-bl-xl" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-cyan-300 rounded-br-xl" />

                      <div className="text-[10px] font-black text-cyan-200 tracking-wider text-center uppercase bg-black/60 py-1 px-2.5 rounded-full mx-auto backdrop-blur-xs border border-cyan-500/30">
                        Portrait ID Frame
                      </div>

                      <div className="text-[10px] text-cyan-200/90 text-center font-bold bg-black/60 py-1 px-3 rounded-full mx-auto">
                        Position Name & Photo here
                      </div>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-10">
                      <AlertCircle size={36} className="text-amber-400 mb-2" />
                      <p className="text-sm font-bold mb-1">Camera Not Available</p>
                      <p className="text-xs text-gray-300 max-w-xs mb-4">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Upload size={14} />
                        <span>Upload Photo Instead</span>
                      </button>
                    </div>
                  )}

                  {!cameraError && (
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center z-10">
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="px-7 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer hover:shadow-cyan-400/60"
                      >
                        <Camera size={16} />
                        <span>Capture ID</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* UPLOAD PHOTO VIEW */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">
                    Upload ID Card Photo
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs mb-4">
                    Take or select a clear vertical photo of the student ID
                  </p>
                  <span className="px-4 py-2 rounded-xl bg-[#1B3A6B] text-white text-xs font-bold shadow-sm group-hover:bg-[#152e55] transition-colors">
                    Choose Photo File
                  </span>
                </div>
              )}

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
            /* DETECTED RESULT VIEW (Clean & Direct — No Clutter) */
            <div className="space-y-4">
              {/* Preview Thumbnail + Scan Status */}
              <div className="bg-slate-900 rounded-2xl p-3 flex items-center gap-3.5 text-white">
                <div className="relative w-16 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-black">
                  <img
                    src={capturedImage}
                    alt="Captured ID"
                    className="w-full h-full object-cover"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <div className="w-full h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isScanning ? (
                        <RefreshCw size={14} className="animate-spin text-cyan-400" />
                      ) : (
                        <Sparkles size={14} className="text-amber-300" />
                      )}
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {isScanning ? scanStatus : 'Student Info Detected'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={11} />
                      <span>Retake</span>
                    </button>
                  </div>

                  {isScanning && (
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  )}

                  {!isScanning && (
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Auto-detected from ID card</span>
                    </p>
                  )}
                </div>
              </div>

              {/* DETECTED VALUES (Directly editable by nurse if desired) */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-4 border border-blue-200/80 space-y-3.5 shadow-sm">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User size={15} className="text-blue-600" />
                    <span>Student Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value.toUpperCase())}
                    placeholder="e.g. DELA CRUZ, JUAN P."
                    className="w-full px-3.5 py-2.5 text-base font-bold rounded-xl border border-gray-300 bg-white text-gray-900 uppercase focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Automatically extracted from ID. You can edit if needed.
                  </p>
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <IdCard size={15} className="text-blue-600" />
                    <span>Student ID Number</span>
                    <span className="text-[10px] text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="e.g. 2024-00123"
                    className="w-full px-3.5 py-2.5 text-sm font-semibold font-mono rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          {capturedImage && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isScanning || !studentName.trim()}
              className="px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-40 hover:opacity-95"
              style={{ background: PRIMARY }}
            >
              <CheckCircle2 size={16} />
              <span>Confirm & Apply</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
