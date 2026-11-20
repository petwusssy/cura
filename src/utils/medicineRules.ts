import { getManilaDate } from '@/utils/philippineTime';

export interface CanonicalMedicineMeta {
  no: number;
  name: string;
  fastMoving: boolean;
  defaultExpiration: string;
}

// Canonical 44 medicines from UA Clinic Oct-26 & Nov-26 Monthly Inventory sheets
export const CANONICAL_MEDICINES_META: CanonicalMedicineMeta[] = [
  { no: 1,  name: 'Allerta 10mg tab',                 fastMoving: true,  defaultExpiration: 'Feb-28' },
  { no: 2,  name: 'Allerkid 60mL bottle',             fastMoving: false, defaultExpiration: 'Jul-27' },
  { no: 3,  name: 'Alnix 10mg tab',                   fastMoving: false, defaultExpiration: 'Jun-28' },
  { no: 4,  name: 'Aspilets-EC 80mg tab',             fastMoving: false, defaultExpiration: 'Feb-28' },
  { no: 5,  name: 'Benadryl 25mg',                    fastMoving: false, defaultExpiration: 'Jul-28' },
  { no: 6,  name: 'Benadryl 50mg',                    fastMoving: false, defaultExpiration: 'Jun-28' },
  { no: 7,  name: 'Benadryl 60mL bottle',             fastMoving: false, defaultExpiration: 'Jun-29' },
  { no: 8,  name: 'Bioflu tab',                       fastMoving: false, defaultExpiration: 'Jul-27' },
  { no: 9,  name: 'Biogesic 500mg tab',               fastMoving: true,  defaultExpiration: 'May-29' },
  { no: 10, name: 'Budecort respules 250mcg/mL',      fastMoving: false, defaultExpiration: 'Dec-26' },
  { no: 11, name: 'Buscopan 10mg tab',                fastMoving: true,  defaultExpiration: 'Dec-28' },
  { no: 12, name: 'Buscopan Plus',                    fastMoving: true,  defaultExpiration: 'Jun-28' },
  { no: 13, name: 'Calmoseptine ointment',            fastMoving: false, defaultExpiration: 'Nov-30' },
  { no: 14, name: 'Catapres 75mcg',                   fastMoving: false, defaultExpiration: 'May-28' },
  { no: 15, name: 'Cetirizine (Zyrtec) 10mg tab',     fastMoving: true,  defaultExpiration: 'Jul-27' },
  { no: 16, name: 'Celecoxib 200mg capsule',          fastMoving: false, defaultExpiration: 'Aug-27' },
  { no: 17, name: 'Dolcet 37.5mg/325mg tab',          fastMoving: false, defaultExpiration: 'Dec-26' },
  { no: 18, name: 'Dolfenal 500mg tab',               fastMoving: true,  defaultExpiration: 'Jul-27' },
  { no: 19, name: 'Duavent nebules',                  fastMoving: false, defaultExpiration: 'Jul-28' },
  { no: 20, name: 'Erceflora Niblet',                 fastMoving: false, defaultExpiration: 'Dec-28' },
  { no: 21, name: 'Erythromycin ointment tubes',      fastMoving: false, defaultExpiration: 'Dec-26' },
  { no: 22, name: 'Flotera chewable',                 fastMoving: false, defaultExpiration: 'Dec-28' },
  { no: 23, name: 'Gaviscon sachet',                  fastMoving: true,  defaultExpiration: 'Jan-28' },
  { no: 24, name: 'Hidrasec 100mg capsule',           fastMoving: true,  defaultExpiration: 'Dec-28' },
  { no: 25, name: 'Hydrite sachet',                   fastMoving: true,  defaultExpiration: 'Sep-28' },
  { no: 26, name: 'Hypromellose 3mg/mL drops',        fastMoving: false, defaultExpiration: 'Aug-28' },
  { no: 27, name: 'Imodium 2mg cap',                  fastMoving: true,  defaultExpiration: 'Jul-30' },
  { no: 28, name: 'Isordil SL 5mg tab',               fastMoving: false, defaultExpiration: 'NO STOCK' },
  { no: 29, name: 'Kramil-S chewable pink',           fastMoving: true,  defaultExpiration: 'Sep-28' },
  { no: 30, name: 'Kramil-S ADVANCE',                 fastMoving: true,  defaultExpiration: 'Sep-27' },
  { no: 31, name: 'Motilium 10mg',                    fastMoving: false, defaultExpiration: 'Jan-29' },
  { no: 32, name: 'Nafarin A',                        fastMoving: true,  defaultExpiration: 'May-28' },
  { no: 33, name: 'Norvasc 10mg tab',                 fastMoving: false, defaultExpiration: 'Jan-27' },
  { no: 34, name: 'Omeprazole 20mg cap',              fastMoving: false, defaultExpiration: 'Jun-28' },
  { no: 35, name: 'Omeprazole 40mg cap',              fastMoving: false, defaultExpiration: 'Jun-28' },
  { no: 36, name: 'Panto Plus cap',                   fastMoving: false, defaultExpiration: 'Sep-28' },
  { no: 37, name: 'Paracetamol syrup',                fastMoving: false, defaultExpiration: 'Apr-27' },
  { no: 38, name: 'Plavix 75mg tab',                  fastMoving: false, defaultExpiration: 'Jan-27' },
  { no: 39, name: 'Ranitidine 150mg tab',             fastMoving: false, defaultExpiration: 'Feb-28' },
  { no: 40, name: 'Serc 16mg cap',                    fastMoving: false, defaultExpiration: 'Aug-27' },
  { no: 41, name: 'Sinupret tab',                     fastMoving: true,  defaultExpiration: 'Aug-27' },
  { no: 42, name: 'Strepsils lozenges (8xpack)',      fastMoving: true,  defaultExpiration: 'Jan-29' },
  { no: 43, name: 'Ventolin nebules',                 fastMoving: false, defaultExpiration: 'Nov-27' },
  { no: 44, name: 'Vispring Opthalmic',               fastMoving: false, defaultExpiration: 'Jan-28' },
];

const FAST_MOVING_KEYWORDS = [
  'biogesic',
  'strepsils',
  'sinupret',
  'allerta',
  'nafarin',
  'buscopan plus',
  'buscopan 10mg',
  'buscopan',
  'hydrite',
  'cetirizine',
  'zyrtec',
  'gaviscon sachet',
  'kremil-s',
  'kramil-s',
  'hidrasec',
  'imodium',
  'dolfenal',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function isFastMovingMedicine(name?: string | null): boolean {
  const clean = (name || '').trim().toLowerCase();
  if (!clean) return false;
  if (clean.includes('gaviscon tablet')) return false;
  return FAST_MOVING_KEYWORDS.some(k => clean.includes(k));
}

export function getDefaultThresholdByName(name?: string | null): number {
  return isFastMovingMedicine(name) ? 100 : 15;
}

export function getEffectiveThreshold(m: { name?: string | null; threshold?: number | null }): number {
  const isFast = isFastMovingMedicine(m.name);
  const raw = typeof m.threshold === 'number' && !isNaN(m.threshold) ? m.threshold : null;
  if (isFast) {
    // Upgrade legacy default thresholds (5, 10, 15) on fast-moving items to 100
    if (raw === null || raw <= 15) return 100;
    return raw;
  }
  if (raw === null || raw <= 5) return 15;
  return raw;
}

export function getMedicineStockStatus(m: {
  name?: string | null;
  stock: number;
  threshold?: number | null;
  status?: string | null;
}): 'Healthy' | 'Low Stock' | 'Out of Stock' {
  const stockNum = Number(m.stock) || 0;
  const thresh = getEffectiveThreshold(m);
  if (stockNum <= 0 || m.status === 'Out of Stock') {
    return 'Out of Stock';
  }
  if (stockNum <= thresh) {
    return 'Low Stock';
  }
  return 'Healthy';
}

export function findCanonicalMedicineMeta(name?: string | null): CanonicalMedicineMeta | undefined {
  const clean = (s: string) => (s || '').toLowerCase().trim();
  const target = clean(name || '');
  if (!target) return undefined;

  let match = CANONICAL_MEDICINES_META.find(m => clean(m.name) === target);
  if (match) return match;

  match = CANONICAL_MEDICINES_META.find(
    m => target.startsWith(clean(m.name)) || clean(m.name).startsWith(target)
  );
  if (match) return match;

  if (target.includes('hidrasec')) return CANONICAL_MEDICINES_META.find(m => m.no === 24);
  if (target.includes('cetirizine') || target.includes('zyrtec')) return CANONICAL_MEDICINES_META.find(m => m.no === 15);
  if (target.includes('duavent')) return CANONICAL_MEDICINES_META.find(m => m.no === 19);
  if (target.includes('ventolin')) return CANONICAL_MEDICINES_META.find(m => m.no === 43);
  if (target.includes('vispring') || target.includes('visine')) return CANONICAL_MEDICINES_META.find(m => m.no === 44);
  if (target.includes('kremil-s advance') || target.includes('kramil-s advance')) return CANONICAL_MEDICINES_META.find(m => m.no === 30);
  if (target.includes('kremil-s') || target.includes('kramil-s')) return CANONICAL_MEDICINES_META.find(m => m.no === 29);

  const firstWord = target.split(/\s+/)[0];
  if (firstWord && firstWord.length > 4) {
    match = CANONICAL_MEDICINES_META.find(m => clean(m.name).startsWith(firstWord));
  }
  return match;
}

export function formatExpirationDisplay(raw?: string | null): string {
  const val = (raw || '').trim();
  if (!val) return '';
  if (val.toUpperCase() === 'NO STOCK' || val.toUpperCase() === 'CONSUMED') {
    return val.toUpperCase();
  }
  // Convert YYYY-MM or YYYY-MM-DD to MMM-YY (e.g., 2029-05 -> May-29)
  const isoMatch = val.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (isoMatch) {
    const yearShort = isoMatch[1].slice(2);
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${SHORT_MONTHS[monthIdx]}-${yearShort}`;
    }
  }
  // Normalize mmm-yy (e.g. may-29 -> May-29)
  const mmmMatch = val.match(/^([a-zA-Z]{3})[-/\s](\d{2,4})$/);
  if (mmmMatch) {
    const mStr = mmmMatch[1].slice(0, 1).toUpperCase() + mmmMatch[1].slice(1, 3).toLowerCase();
    const yStr = mmmMatch[2].length === 4 ? mmmMatch[2].slice(2) : mmmMatch[2];
    return `${mStr}-${yStr}`;
  }
  return val;
}

export function toMonthInputValue(raw?: string | null): string {
  const val = (raw || '').trim();
  if (!val) return '';
  const isoMatch = val.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;

  const mmmMatch = val.match(/^([a-zA-Z]{3})[-/\s](\d{2,4})$/);
  if (mmmMatch) {
    const mIdx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === mmmMatch[1].toLowerCase());
    if (mIdx >= 0) {
      const yFull = mmmMatch[2].length === 2 ? `20${mmmMatch[2]}` : mmmMatch[2];
      return `${yFull}-${String(mIdx + 1).padStart(2, '0')}`;
    }
  }
  return '';
}

export function getEffectiveExpirationDate(m?: { name?: string | null; expirationDate?: string | null }): string {
  const explicit = formatExpirationDisplay(m?.expirationDate);
  if (explicit && explicit !== 'NO STOCK') return explicit;
  const meta = findCanonicalMedicineMeta(m?.name);
  if (meta && meta.defaultExpiration && meta.defaultExpiration !== 'NO STOCK') {
    return meta.defaultExpiration;
  }
  return explicit;
}

export function getExpirationState(raw?: string | null): {
  display: string;
  status: 'valid' | 'expiring-soon' | 'expired' | 'none';
} {
  const display = formatExpirationDisplay(raw);
  if (!display || display === 'NO STOCK' || display === 'CONSUMED') {
    return { display: display || 'N/A', status: 'none' };
  }

  const monthInput = toMonthInputValue(display);
  if (!monthInput) {
    return { display, status: 'valid' };
  }

  const [expY, expM] = monthInput.split('-').map(Number);
  const today = getManilaDate(); // YYYY-MM-DD
  const [curY, curM] = today.split('-').map(Number);

  const diffMonths = (expY - curY) * 12 + (expM - curM);
  if (diffMonths < 0) {
    return { display, status: 'expired' };
  }
  if (diffMonths <= 3) {
    return { display, status: 'expiring-soon' };
  }
  return { display, status: 'valid' };
}
