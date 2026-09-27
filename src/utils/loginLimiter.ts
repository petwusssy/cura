// Utility to track and enforce the 4-attempt login limit on web clients

export const MAX_LOGIN_ATTEMPTS = 4;
export const DEFAULT_LOCKOUT_SECONDS = 15 * 60; // 15 minutes

const STORAGE_LOCKOUT_KEY = 'cura_web_login_lockout_until';
const STORAGE_FAILED_COUNT_KEY = 'cura_web_login_failed_count';

export interface LoginLimitState {
  isLocked: boolean;
  lockoutRemainingSeconds: number;
  attemptsRemaining: number;
  maxAttempts: number;
  message?: string | null;
}

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
            message: `Account is temporarily locked due to ${MAX_LOGIN_ATTEMPTS} failed attempts.`,
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
          message:
            serverDetail ||
            `Too many failed login attempts (${MAX_LOGIN_ATTEMPTS}/${MAX_LOGIN_ATTEMPTS}). Your account has been temporarily locked for 15 minutes.`,
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
          message:
            serverDetail ||
            `Invalid username or password. You have ${serverAttemptsRemaining} attempt${
              serverAttemptsRemaining > 1 ? 's' : ''
            } remaining.`,
        };
      }

      // Fallback if backend returned standard 401 without custom payload
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
          message: `Too many failed login attempts (${MAX_LOGIN_ATTEMPTS}/${MAX_LOGIN_ATTEMPTS}). Your account has been temporarily locked for 15 minutes.`,
        };
      }

      const remaining = MAX_LOGIN_ATTEMPTS - newCount;
      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining: remaining,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        message:
          serverDetail ||
          `Invalid username or password. You have ${remaining} attempt${
            remaining > 1 ? 's' : ''
          } remaining.`,
      };
    } catch {
      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining: 3,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        message: 'Invalid username or password. Access denied.',
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
