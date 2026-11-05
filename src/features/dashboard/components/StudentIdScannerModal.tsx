import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Camera, Upload, RefreshCw, Check, User, IdCard,
  ScanLine, AlertCircle, Sparkles, Copy, ArrowRight, CheckCircle2
} from 'lucide-react';
import { recognize } from 'tesseract.js';
import { toast } from 'sonner';

const PRIMARY = '#1B3A6B';

// Blacklist of university headers, administrative phrases, degrees, and noise
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

interface ScoredCandidate {
  value: string;
  score: number;
  raw: string;
}

interface ExtractedInfo {
  detectedId: string;
  detectedName: string;
  idCandidates: ScoredCandidate[];
  nameCandidates: ScoredCandidate[];
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
  const [nameCandidates, setNameCandidates] = useState<ScoredCandidate[]>([]);
  const [idCandidates, setIdCandidates] = useState<ScoredCandidate[]>([]);

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

  // Start camera stream (prioritizing portrait environment camera)
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSourceMode('upload');
        setCameraError('Camera API is not supported in this browser. Please upload a photo.');
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
      setNameCandidates([]);
      setIdCandidates([]);
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

  // Clean OCR noise from line
  const cleanLine = (raw: string): string => {
    return raw
      .replace(/^[^a-zA-Z0-9]+/, '')
      .replace(/[^a-zA-Z0-9]+$/, '')
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // Intelligent text analysis & scoring engine
  const analyzeExtractedText = (rawText: string): ExtractedInfo => {
    const rawLines = rawText.split('\n');
    const lines: string[] = [];

    for (const r of rawLines) {
      const c = cleanLine(r);
      if (c.length >= 2 && !/^[^a-zA-Z0-9]+$/.test(c)) {
        lines.push(c);
      }
    }

    // 1. EXTRACT AND SCORE STUDENT ID CANDIDATES
    const idList: ScoredCandidate[] = [];

    lines.forEach((line, index) => {
      let score = 0;
      let candidateId = '';

      // Pattern A: Labeled with ID NO, SN, STUDENT NO
      const labelMatch = line.match(/(?:ID\s*(?:NO|NUMBER|\.?)|STUDENT\s*(?:ID|NO|NUMBER|\.?)|SN\.?)[:.\s#-]*([A-Z0-9-]{4,16})/i);
      if (labelMatch && labelMatch[1]) {
        let val = labelMatch[1].trim();
        // Auto-correct common OCR digit confusions
        val = val.replace(/O/g, '0').replace(/[Il]/g, '1');
        if (/\d{4,}/.test(val)) {
          candidateId = val;
          score = 100;
        }
      }

      // Pattern B: University Year-Prefixed Format e.g. 2024-00123 or 2023-12345 or 20240182
      if (!candidateId) {
        const yearPrefixedMatch = line.match(/\b(20[12]\d[- ]?\d{4,6})\b/);
        if (yearPrefixedMatch && yearPrefixedMatch[1]) {
          candidateId = yearPrefixedMatch[1].replace(/\s+/g, '-');
          score = 90;
        }
      }

      // Pattern C: 2-digit year format e.g. 22-01824 or 23-10492
      if (!candidateId) {
        const shortYearMatch = line.match(/\b([12]\d[- ]\d{4,6})\b/);
        if (shortYearMatch && shortYearMatch[1]) {
          candidateId = shortYearMatch[1].replace(/\s+/g, '-');
          score = 80;
        }
      }

      // Pattern D: Standalone 6-10 digit numbers
      if (!candidateId) {
        const standaloneDigits = line.match(/\b(\d{6,10})\b/);
        if (standaloneDigits && standaloneDigits[1]) {
          candidateId = standaloneDigits[1];
          score = 70;
        }
      }

      if (candidateId) {
        // Boost if near top/middle
        if (index <= 5) score += 5;
        // Avoid duplicate values
        if (!idList.some(item => item.value === candidateId)) {
          idList.push({ value: candidateId, score, raw: line });
        }
      }
    });

    idList.sort((a, b) => b.score - a.score);

    // 2. EXTRACT AND SCORE STUDENT NAME CANDIDATES
    const nameList: ScoredCandidate[] = [];

    lines.forEach((line, index) => {
      const upper = line.toUpperCase();

      // Check if line contains any blacklist phrase
      const hasBlacklist = BLACKLIST_KEYWORDS.some(k => upper.includes(k));
      if (hasBlacklist) return;

      // Clean line for name evaluation (allow letters, comma, period, space, hyphen)
      const cleanName = line
        .replace(/[^a-zA-Z,.\s-]/g, '')
        .replace(/^[,.\s-]+/, '')
        .replace(/[,.\s-]+$/, '')
        .trim();

      if (cleanName.length < 5 || cleanName.length > 45) return;

      // Student name must not be mostly digits
      const digitsCount = (line.match(/\d/g) || []).length;
      if (digitsCount > 1) return;

      const words = cleanName.split(/\s+/).filter(w => w.length > 0);
      if (words.length < 2 || words.length > 6) return;

      let score = 30; // base score

      // High indicator: "LASTNAME, FIRSTNAME" format with comma
      if (cleanName.includes(',')) {
        const [last, first] = cleanName.split(',').map(s => s.trim());
        if (last && first && last.length >= 2 && first.length >= 2) {
          score += 55; // Strongly indicates Philippine ID name format
        }
      }

      // Middle initial indicator (e.g. "P." or "D." or "M.")
      if (/\b[A-Z]\.\b/i.test(cleanName)) {
        score += 20;
      }

      // All uppercase letters boost
      if (cleanName === cleanName.toUpperCase() && /^[A-Z,.\s-]+$/.test(cleanName)) {
        score += 15;
      }

      // Word count sweet spot (2, 3, or 4 words)
      if (words.length >= 2 && words.length <= 4) {
        score += 15;
      }

      // Position boost: student names are usually prominently placed in lines 1 to 6
      if (index >= 1 && index <= 5) {
        score += 15;
      } else if (index > 8) {
        score -= 20; // Footer lines are often disclaimers or blood types
      }

      // Penalize single-character words (except middle initial)
      const straySingleChars = words.filter(w => w.length === 1 && !w.endsWith('.'));
      if (straySingleChars.length > 1) {
        score -= 25;
      }

      const formattedName = cleanName.toUpperCase();
      if (!nameList.some(item => item.value === formattedName) && score > 40) {
        nameList.push({ value: formattedName, score, raw: line });
      }
    });

    nameList.sort((a, b) => b.score - a.score);

    return {
      detectedId: idList[0]?.value || '',
      detectedName: nameList[0]?.value || '',
      idCandidates: idList,
      nameCandidates: nameList,
      allLines: lines,
    };
  };

  // Image preprocessing: Grayscale + Contrast normalization for crisp OCR
  const preprocessImage = (canvas: HTMLCanvasElement): void => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    const contrast = 1.35; // Contrast boost
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < d.length; i += 4) {
      // Luminance grayscale
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast stretch
      const cGray = factor * (gray - 128) + 128;
      const clamped = Math.max(0, Math.min(255, cGray));
      d[i] = clamped;
      d[i + 1] = clamped;
      d[i + 2] = clamped;
    }
    ctx.putImageData(imgData, 0, 0);
  };

  // Process image with Tesseract
  const processImageForOcr = async (imageDataUrl: string) => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStatus('Enhancing image contrast for vertical ID...');

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

      setScanProgress(30);
      setScanStatus('Scanning text with OCR...');

      const result = await recognize(canvas.toDataURL('image/jpeg', 0.95), 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setScanProgress(30 + Math.round(m.progress * 65));
            setScanStatus(`Analyzing text (${Math.round(m.progress * 100)}%)...`);
          }
        },
      });

      setScanProgress(98);
      setScanStatus('Analyzing Student Name & ID Number...');

      const analyzed = analyzeExtractedText(result.data.text || '');
      setExtractedLines(analyzed.allLines);
      setNameCandidates(analyzed.nameCandidates);
      setIdCandidates(analyzed.idCandidates);

      if (analyzed.detectedId) {
        setStudentId(analyzed.detectedId);
      }
      if (analyzed.detectedName) {
        setStudentName(analyzed.detectedName);
      }

      setScanProgress(100);
      if (analyzed.detectedId && analyzed.detectedName) {
        toast.success(`Detected: ${analyzed.detectedName} (${analyzed.detectedId})`);
      } else if (analyzed.detectedName || analyzed.detectedId) {
        toast.info('Partial details detected. Review or click suggestions below.');
      } else {
        toast.info('ID scanned. Click any detected line below to assign Name or ID.');
      }
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      toast.error('Failed to read ID image. Please ensure good lighting and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Capture photo from live portrait viewfinder
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    const vWidth = video.videoWidth || 1080;
    const vHeight = video.videoHeight || 1920;

    // Crop to the vertical/portrait card area centered in the feed
    // Standard portrait card is ~1:1.58 ratio
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
    setExtractedLines([]);
    setNameCandidates([]);
    setIdCandidates([]);
    setScanProgress(0);
    setScanStatus('');
    if (sourceMode === 'camera') {
      startCamera();
    }
  };

  const handleSelectName = (name: string) => {
    setStudentName(name);
    toast.success(`Selected Name: "${name}"`);
  };

  const handleSelectId = (id: string) => {
    setStudentId(id);
    toast.success(`Selected ID: "${id}"`);
  };

  const handleSetAsNameFromLine = (line: string) => {
    const cleaned = line
      .replace(/[^a-zA-Z,.\s-]/g, '')
      .replace(/^[,.\s-]+/, '')
      .replace(/[,.\s-]+$/, '')
      .trim()
      .toUpperCase();
    setStudentName(cleaned);
    toast.success(`Set as Name: "${cleaned}"`);
  };

  const handleSetAsIdFromLine = (line: string) => {
    const match = line.match(/\b([A-Z0-9-]{4,16})\b/i);
    const idVal = match ? match[1].replace(/O/g, '0') : line.replace(/[^0-9A-Za-z-]/g, '').trim();
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden border border-gray-100"
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
                  Portrait Mode
                </span>
              </h2>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Hold your ID vertically inside the portrait frame
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

        {/* Source Mode Selector (Camera vs Upload) */}
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
              <span>Portrait Camera</span>
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* CAMERA / CAPTURE VIEW */}
          {!capturedImage ? (
            <div>
              {sourceMode === 'camera' ? (
                /* PORTRAIT CAMERA VIEWFINDER */
                <div className="relative rounded-2xl overflow-hidden bg-black h-[420px] sm:h-[460px] w-full flex items-center justify-center shadow-inner border border-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Vertical Portrait ID Card Framing Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                    <div className="relative w-56 sm:w-64 aspect-[1/1.55] rounded-2xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.45)] flex flex-col justify-between p-3 bg-cyan-950/15">
                      {/* Corner Accents */}
                      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-cyan-300 rounded-tl-xl" />
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-cyan-300 rounded-tr-xl" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-cyan-300 rounded-bl-xl" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-cyan-300 rounded-br-xl" />

                      {/* Header guide banner */}
                      <div className="text-[10px] font-black text-cyan-200 tracking-wider text-center uppercase bg-black/60 py-1 px-2.5 rounded-full mx-auto backdrop-blur-xs border border-cyan-500/30">
                        Portrait ID Card Frame
                      </div>

                      {/* Center photo/details target indicator */}
                      <div className="flex flex-col items-center justify-center gap-1 text-center my-auto">
                        <div className="w-16 h-20 rounded-xl border border-dashed border-cyan-300/40 bg-cyan-400/5 flex items-center justify-center text-cyan-300/60 text-[10px]">
                          Photo Area
                        </div>
                        <span className="text-[9px] text-cyan-200/90 font-semibold bg-black/50 px-2 py-0.5 rounded">
                          Hold ID upright & glare-free
                        </span>
                      </div>

                      <div className="text-[9px] text-cyan-300 text-center font-bold uppercase tracking-wider bg-black/60 py-0.5 px-2 rounded-full mx-auto">
                        Student ID & Name Area
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

                  {/* Shutter Button */}
                  {!cameraError && (
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center z-10">
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="px-7 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer hover:shadow-cyan-400/60"
                      >
                        <Camera size={16} />
                        <span>Capture Vertical ID</span>
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
                    Upload Portrait ID Photo
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs mb-4">
                    Supports JPG, PNG, WEBP. On mobile devices, this will open your camera.
                  </p>
                  <span className="px-4 py-2 rounded-xl bg-[#1B3A6B] text-white text-xs font-bold shadow-sm group-hover:bg-[#152e55] transition-colors">
                    Choose Photo File
                  </span>
                </div>
              )}

              {/* Hidden File Input */}
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
            /* SCANNED & DETECTED VIEW */
            <div className="space-y-3.5">
              {/* Captured Preview Banner */}
              <div className="bg-slate-900 rounded-2xl p-3 flex items-center gap-3.5 text-white">
                <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-black shadow-inner">
                  <img
                    src={capturedImage}
                    alt="Captured Vertical ID"
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
                        {isScanning ? scanStatus : 'Smart ID Analysis Complete'}
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
                    <p className="text-[10.5px] text-slate-300 leading-snug">
                      Details automatically parsed below. Click any suggestion pill or text line to adjust.
                    </p>
                  )}
                </div>
              </div>

              {/* TARGET INPUT FORM (Auto-filled by smart engine) */}
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-2xl p-3.5 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600" />
                    <span>Values to Apply</span>
                  </span>
                  {(studentId || studentName) && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check size={11} /> Ready to apply
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {/* Student ID field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                        <IdCard size={13} className="text-blue-600" />
                        <span>Student ID Number</span>
                      </label>
                      {idCandidates.length > 1 && (
                        <span className="text-[10px] text-gray-500">
                          {idCandidates.length} potential matches
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="e.g., 2024-00123"
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-blue-100"
                    />

                    {/* Alternative ID suggestions as quick clickable pills */}
                    {idCandidates.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold">Other IDs:</span>
                        {idCandidates.map(cand => (
                          <button
                            key={cand.value}
                            type="button"
                            onClick={() => handleSelectId(cand.value)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              studentId === cand.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                          >
                            {cand.value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Student Name field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                        <User size={13} className="text-blue-600" />
                        <span>Student Full Name</span>
                      </label>
                      {nameCandidates.length > 1 && (
                        <span className="text-[10px] text-gray-500">
                          {nameCandidates.length} name candidates
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value.toUpperCase())}
                      placeholder="LAST NAME, FIRST NAME M.I."
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-gray-300 bg-white text-gray-900 uppercase focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-blue-100"
                    />

                    {/* Alternative Name suggestions as quick clickable pills */}
                    {nameCandidates.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold">Other names:</span>
                        {nameCandidates.map(cand => (
                          <button
                            key={cand.value}
                            type="button"
                            onClick={() => handleSelectName(cand.value)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate max-w-[220px] ${
                              studentName === cand.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                            }`}
                          >
                            {cand.value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ALL DETECTED TEXT LINES (For manual selection) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ScanLine size={13} className="text-blue-600" />
                    <span>All Detected Card Lines ({extractedLines.length})</span>
                  </h4>
                  <span className="text-[10px] text-gray-500">
                    Click button to set as Name or ID
                  </span>
                </div>

                {extractedLines.length === 0 && !isScanning ? (
                  <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                    No text lines found. Try capturing in a well-lit area without camera glare.
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {extractedLines.map((line, index) => {
                      const isName = studentName && line.toUpperCase().includes(studentName.trim().toUpperCase());
                      const isId = studentId && line.includes(studentId.trim());

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs transition-colors ${
                            isName || isId
                              ? 'bg-blue-50/90 border-blue-200'
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
                              onClick={() => handleSetAsNameFromLine(line)}
                              title="Set as Student Name"
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isName
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-blue-100/80 text-[#1B3A6B] hover:bg-blue-200'
                              }`}
                            >
                              <User size={10} />
                              <span>Set Name</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetAsIdFromLine(line)}
                              title="Set as Student ID"
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isId
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-indigo-100/80 text-indigo-900 hover:bg-indigo-200'
                              }`}
                            >
                              <IdCard size={10} />
                              <span>Set ID</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyText(line)}
                              title="Copy line"
                              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              <Copy size={11} />
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
              disabled={isScanning || (!studentName && !studentId)}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-40"
              style={{ background: PRIMARY }}
            >
              <CheckCircle2 size={15} />
              <span>Apply to Form</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
