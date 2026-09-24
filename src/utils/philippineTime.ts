/**
 * Philippine Time (Asia/Manila - UTC+8) Utilities
 * Ensures all dates and times across CURA are consistently evaluated
 * in Philippine Time regardless of client/browser or server location.
 */

export const PH_TIMEZONE = 'Asia/Manila';

/**
 * Returns YYYY-MM-DD in Asia/Manila
 */
export const getManilaDate = (d: Date | string | number = new Date()): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Returns HH:mm (24-hour) in Asia/Manila
 */
export const getManilaTime = (d: Date | string | number = new Date()): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: PH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
};

/**
 * Returns the hour (0-23) in Asia/Manila
 */
export const getManilaHour = (d: Date | string | number = new Date()): number => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return 0;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIMEZONE,
    hour: 'numeric',
    hour12: false
  }).format(dateObj);
  const hourNum = parseInt(parts, 10);
  return hourNum === 24 ? 0 : hourNum;
};

/**
 * Returns YYYY-MM-DD of yesterday in Asia/Manila
 */
export const getManilaYesterday = (fromDate: Date | string | number = new Date()): string => {
  return getManilaDaysAgo(1, fromDate);
};

/**
 * Returns YYYY-MM-DD of N days ago relative to Asia/Manila
 */
export const getManilaDaysAgo = (days: number, fromDate: Date | string | number = new Date()): string => {
  const baseStr = getManilaDate(fromDate);
  if (!baseStr) return '';
  const [year, month, day] = baseStr.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
};

/**
 * Format a date string or Date object for human display in Philippine Time
 * e.g., "September 24, 2026" or "Sep 24, 2026"
 */
export const formatManilaDisplayDate = (
  d: Date | string | number,
  format: 'short' | 'long' | 'medium' = 'medium'
): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);

  if (format === 'short') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PH_TIMEZONE,
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  }

  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PH_TIMEZONE,
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Formats time for display with AM/PM in Philippine Time (e.g., "10:50 AM")
 */
export const formatManilaDisplayTime = (d: Date | string | number): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};

/**
 * Normalizes any date input (YYYY-MM-DD, ISO string, datetime string, or Date)
 * into a clean 'YYYY-MM-DD' string in Asia/Manila.
 */
export const normalizeDate = (raw?: string | Date | number | null): string => {
  if (!raw) return '';
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return getManilaDate(parsed);
    }
    return trimmed;
  }
  return getManilaDate(raw);
};

/**
 * Formats any raw date/timestamp string (e.g. ISO string "2026-09-24T11:57:53.711194+08:00")
 * into a clean, human-readable date and time in Philippine Time:
 * e.g. "2026-09-24 • 11:57 AM" or "2026-09-24" if pure date.
 */
export const formatManilaDateTime = (raw?: string | Date | number | null): string => {
  if (!raw) return '';
  const str = String(raw).trim();
  // Pure date YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Already formatted e.g. "2026-09-24 11:57 AM" or "2026-09-24 • 11:57 AM"
  if (/^\d{4}-\d{2}-\d{2}(\s+|(\s*•\s*))\d{1,2}:\d{2}\s+(AM|PM)$/i.test(str)) {
    return str;
  }
  const dateObj = typeof raw === 'string' || typeof raw === 'number' ? new Date(raw) : raw;
  if (isNaN(dateObj.getTime())) {
    if (str.includes('T')) {
      const parts = str.split('T');
      const dPart = parts[0];
      const tPart = parts[1].slice(0, 5);
      return `${dPart} • ${tPart}`;
    }
    return str;
  }
  const datePart = getManilaDate(dateObj);
  const timePart = formatManilaDisplayTime(dateObj);
  return `${datePart} • ${timePart}`;
};


