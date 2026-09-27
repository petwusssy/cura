// Utility to track and enforce the 4-attempt login limit on web clients with professional messaging

export const MAX_LOGIN_ATTEMPTS = 5;
export const DEFAULT_LOCKOUT_SECONDS = 60; // 1 minute

const STORAGE_LOCKOUT_KEY = 'cura_web_login_lockout_until';
const STORAGE_FAILED_COUNT_KEY = 'cura_web_login_failed_count';

export interface LoginLimitState {
  isLocked: boolean;
  lockoutRemainingSeconds: number;
  attemptsRemaining: number;
  maxAttempts: number;
  message?: string | null;
}

// Clean and sanitize any technical/internal errors into professional medical-grade copy
const sanitizeMessage = (rawDetail: string | null | undefined, remaining: number): string => {
  if (remaining <= 0) {
    return `Too many failed login attempts. For security reasons, this account has been temporarily locked for 1 minute.`;
  }

  const text = (rawDetail || '').trim();
  const lower = text.toLowerCase();

  // Strip out robotic Django/SimpleJWT default strings
  if (
    !text ||
    lower.includes('no active account') ||
    lower.includes('given credentials') ||
    lower.includes('access denied') ||
    lower.includes('invalid token')
  ) {
    if (remaining === 1) {
      return `Incorrect username or password. Warning: You have only 1 attempt remaining before your account is temporarily locked.`;
    }
    return `Incorrect username or password. You have ${remaining} attempts remaining.`;
  }

  return text;
};

export const loginLimiter = {
  getLimitState: (): LoginLimitState => {
    try {
      const storedUntil = localStorage.getItem(STORAGE_LOCKOUT_KEY);
      if (storedUntil) {
        const lockoutUntil = parseInt(storedUntil, 10);
        const now = Date.now();
        if (lockoutUntil > now) {
          const remainingSecs = Math.max(1, Math.ceil((lockoutUntil - now) / 1000));
          return {
            isLocked: true,
            lockoutRemainingSeconds: remainingSecs,
            attemptsRemaining: 0,
            maxAttempts: MAX_LOGIN_ATTEMPTS,
            message: `Account is temporarily locked due to ${MAX_LOGIN_ATTEMPTS} consecutive failed attempts.`,
          };
        } else {
          // Lockout has expired
          localStorage.removeItem(STORAGE_LOCKOUT_KEY);
          localStorage.removeItem(STORAGE_FAILED_COUNT_KEY);
        }
      }

      const failedCountStr = localStorage.getItem(STORAGE_FAILED_COUNT_KEY);
      const failedCount = failedCountStr ? parseInt(failedCountStr, 10) : 0;
      const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - failedCount);

      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      };
    } catch {
      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      };
    }
  },

  recordFailure: (error: any): LoginLimitState => {
    try {
      const resData = error?.response?.data;
      const isLockedFromServer = !!resData?.is_locked || error?.response?.status === 429;
      const serverLockoutSeconds = resData?.lockout_seconds || DEFAULT_LOCKOUT_SECONDS;
      const serverAttemptsRemaining = resData?.attempts_remaining;
      const serverDetail =
        resData?.detail ||
        resData?.error ||
        (typeof resData === 'string' ? resData : null);

      if (isLockedFromServer || serverAttemptsRemaining === 0) {
        const lockoutUntil = Date.now() + serverLockoutSeconds * 1000;
        localStorage.setItem(STORAGE_LOCKOUT_KEY, lockoutUntil.toString());
        localStorage.setItem(STORAGE_FAILED_COUNT_KEY, MAX_LOGIN_ATTEMPTS.toString());

        return {
          isLocked: true,
          lockoutRemainingSeconds: serverLockoutSeconds,
          attemptsRemaining: 0,
          maxAttempts: MAX_LOGIN_ATTEMPTS,
          message: sanitizeMessage(serverDetail, 0),
        };
      }

      if (typeof serverAttemptsRemaining === 'number') {
        const failedCount = MAX_LOGIN_ATTEMPTS - serverAttemptsRemaining;
        localStorage.setItem(STORAGE_FAILED_COUNT_KEY, failedCount.toString());

        return {
          isLocked: false,
          lockoutRemainingSeconds: 0,
          attemptsRemaining: serverAttemptsRemaining,
          maxAttempts: MAX_LOGIN_ATTEMPTS,
          message: sanitizeMessage(serverDetail, serverAttemptsRemaining),
        };
      }

      // Fallback if backend returned 401 without custom payload (e.g. during deployment)
      const currentCountStr = localStorage.getItem(STORAGE_FAILED_COUNT_KEY);
      const newCount = (currentCountStr ? parseInt(currentCountStr, 10) : 0) + 1;
      localStorage.setItem(STORAGE_FAILED_COUNT_KEY, newCount.toString());

      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = Date.now() + DEFAULT_LOCKOUT_SECONDS * 1000;
        localStorage.setItem(STORAGE_LOCKOUT_KEY, lockoutUntil.toString());
        return {
          isLocked: true,
          lockoutRemainingSeconds: DEFAULT_LOCKOUT_SECONDS,
          attemptsRemaining: 0,
          maxAttempts: MAX_LOGIN_ATTEMPTS,
          message: sanitizeMessage(serverDetail, 0),
        };
      }

      const remaining = MAX_LOGIN_ATTEMPTS - newCount;
      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining: remaining,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        message: sanitizeMessage(serverDetail, remaining),
      };
    } catch {
      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining: 4,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        message: 'Incorrect username or password. Please verify your credentials and try again.',
      };
    }
  },

  recordSuccess: (): void => {
    try {
      localStorage.removeItem(STORAGE_LOCKOUT_KEY);
      localStorage.removeItem(STORAGE_FAILED_COUNT_KEY);
    } catch {
      // ignore storage errors
    }
  },

  formatTime: (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
};
