import api from './api';
import { authService } from './authService';

export interface ClinicStaffMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  staff?: string | null;
  staff_name_snapshot: string;
  staff_role_snapshot?: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  timestamp: string;
}

export interface ShiftSession {
  staff: ClinicStaffMember;
  expiresAt: number;
}

const STAFF_CACHE_KEY = 'cura_clinic_staff_cache';
const STAFF_PINS_CACHE_KEY = 'cura_clinic_staff_pins';
const AUDIT_LOGS_CACHE_KEY = 'cura_audit_logs_cache';
const ACTIVE_SHIFT_KEY = 'cura_active_staff_shift';

export const STAFF_UPDATED_EVENT = 'cura-staff-updated';
export const AUDIT_UPDATED_EVENT = 'cura-audit-updated';
export const SHIFT_UPDATED_EVENT = 'cura-shift-updated';

// Lightweight deterministic hash for offline/fallback PIN verification
function hashPinLocal(pin: string): string {
  let h = 2166136261;
  const salted = `cura-pin-v1:${pin.trim()}`;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function loadLocalStaff(): ClinicStaffMember[] {
  try {
    const raw = localStorage.getItem(STAFF_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalStaff(list: ClinicStaffMember[]): void {
  try {
    localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(STAFF_UPDATED_EVENT));
  } catch {}
}

function loadLocalPinMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STAFF_PINS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPin(staffId: string, pin: string): void {
  try {
    const map = loadLocalPinMap();
    map[staffId] = hashPinLocal(pin);
    localStorage.setItem(STAFF_PINS_CACHE_KEY, JSON.stringify(map));
  } catch {}
}

function loadLocalAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAuditLogs(logs: AuditLogEntry[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(AUDIT_LOGS_CACHE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(AUDIT_UPDATED_EVENT));
  } catch {}
}

export const staffService = {
  getStaffCached(): ClinicStaffMember[] {
    return loadLocalStaff();
  },

  hasActiveStaff(): boolean {
    return loadLocalStaff().some(s => s.is_active);
  },

  async getStaff(): Promise<ClinicStaffMember[]> {
    const localList = loadLocalStaff();
    try {
      const res = await api.get<ClinicStaffMember[]>('/staff/');
      if (Array.isArray(res.data)) {
        // Merge server list with any local-only items if server was empty before migration
        if (res.data.length > 0 || localList.length === 0) {
          saveLocalStaff(res.data);
          return res.data;
        }
      }
    } catch {
      // Fallback to local cache if endpoint is not yet migrated on remote host
    }
    return localList;
  },

  async createStaff(payload: { name: string; role: string; pin: string }): Promise<ClinicStaffMember> {
    const cleanName = payload.name.trim().toUpperCase();
    const cleanPin = payload.pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('PIN must be exactly 4 digits.');
    }

    // Check local uniqueness first
    const localList = loadLocalStaff();
    const pinMap = loadLocalPinMap();
    const pinHash = hashPinLocal(cleanPin);
    const duplicatePinStaff = localList.find(
      s => s.is_active && pinMap[s.id] && pinMap[s.id] === pinHash
    );
    if (duplicatePinStaff) {
      throw new Error(`This 4-digit PIN is already used by ${duplicatePinStaff.name}. Each active staff member must have a unique PIN.`);
    }

    try {
      const res = await api.post<ClinicStaffMember>('/staff/', {
        name: cleanName,
        role: payload.role,
        pin: cleanPin,
        is_active: true,
      });
      const created = res.data;
      saveLocalPin(created.id, cleanPin);
      const next = [...localList.filter(s => s.id !== created.id), created].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      saveLocalStaff(next);
      return created;
    } catch (err: any) {
      // If backend returned a specific validation error (400), surface it
      if (err?.response?.status === 400 && err?.response?.data) {
        const data = err.response.data;
        const msg =
          data.pin?.[0] ||
          data.name?.[0] ||
          data.detail ||
          (typeof data === 'string' ? data : 'Invalid staff details.');
        throw new Error(String(msg));
      }

      // Otherwise fallback to local storage so UI works seamlessly
      const fallbackStaff: ClinicStaffMember = {
        id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        role: payload.role,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      saveLocalPin(fallbackStaff.id, cleanPin);
      const next = [...localList, fallbackStaff].sort((a, b) => a.name.localeCompare(b.name));
      saveLocalStaff(next);
      return fallbackStaff;
    }
  },

  async updateStaff(
    id: string,
    payload: Partial<{ name: string; role: string; pin: string; is_active: boolean }>
  ): Promise<ClinicStaffMember> {
    const localList = loadLocalStaff();
    const pinMap = loadLocalPinMap();

    if (payload.pin !== undefined) {
      const cleanPin = payload.pin.trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        throw new Error('PIN must be exactly 4 digits.');
      }
      const pinHash = hashPinLocal(cleanPin);
      const duplicatePinStaff = localList.find(
        s => s.id !== id && s.is_active && pinMap[s.id] && pinMap[s.id] === pinHash
      );
      if (duplicatePinStaff) {
        throw new Error(`This 4-digit PIN is already used by ${duplicatePinStaff.name}.`);
      }
    }

    const updatedLocalList = localList.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        ...(payload.name !== undefined ? { name: payload.name.trim().toUpperCase() } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
      };
    });

    if (payload.pin) {
      saveLocalPin(id, payload.pin.trim());
    }
    saveLocalStaff(updatedLocalList);

    // If staff member was deactivated and is currently on shift, end their shift
    if (payload.is_active === false) {
      const activeShift = this.getActiveShift();
      if (activeShift?.staff.id === id) {
        this.clearActiveShift();
      }
    }

    try {
      const res = await api.patch<ClinicStaffMember>(`/staff/${id}/`, payload);
      const finalList = updatedLocalList.map(s => (s.id === id ? res.data : s));
      saveLocalStaff(finalList);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 400 && err?.response?.data) {
        const data = err.response.data;
        const msg = data.pin?.[0] || data.detail || 'Invalid update.';
        throw new Error(String(msg));
      }
      const found = updatedLocalList.find(s => s.id === id);
      if (!found) throw new Error('Staff member not found.');
      return found;
    }
  },

  async deleteStaff(id: string): Promise<void> {
    const localList = loadLocalStaff().filter(s => s.id !== id);
    saveLocalStaff(localList);
    const activeShift = this.getActiveShift();
    if (activeShift?.staff.id === id) {
      this.clearActiveShift();
    }
    try {
      await api.delete(`/staff/${id}/`);
    } catch {
      // already removed locally
    }
  },

  async verifyAdminPassword(password: string): Promise<boolean> {
    const cleanPassword = password.trim();
    if (!cleanPassword) return false;
    const username = authService.getUsername() || 'admin';

    try {
      const res = await api.post<{ valid: boolean }>('/staff/verify-admin/', {
        username,
        password: cleanPassword,
      });
      return Boolean(res.data?.valid);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 400) {
        return false;
      }
      // Fallback: verify directly against Django /auth/login/ with the active CURA workstation username
      try {
        const loginRes = await api.post('/auth/login/', {
          username,
          password: cleanPassword,
        });
        return Boolean(loginRes.data?.access);
      } catch {
        return false;
      }
    }
  },

  async verifyPin(pin: string): Promise<ClinicStaffMember> {
    const cleanPin = pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('Please enter a 4-digit PIN.');
    }

    // 1. Check local PIN cache first for 0ms instant response if available
    const localList = loadLocalStaff().filter(s => s.is_active);
    const pinMap = loadLocalPinMap();
    const targetHash = hashPinLocal(cleanPin);
    const localMatch = localList.find(s => pinMap[s.id] === targetHash);
    if (localMatch) {
      return localMatch;
    }

    // 2. Verify against backend /staff/verify-pin/
    try {
      const res = await api.post<{ valid: boolean; staff: ClinicStaffMember }>('/staff/verify-pin/', {
        pin: cleanPin,
      });
      if (res.data?.valid && res.data?.staff) {
        saveLocalPin(res.data.staff.id, cleanPin);
        return res.data.staff;
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        throw new Error('Invalid or inactive 4-digit PIN.');
      }
    }

    throw new Error('Invalid or inactive 4-digit PIN.');
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const localLogs = loadLocalAuditLogs();
    try {
      const res = await api.get<AuditLogEntry[]>('/audit-logs/');
      if (Array.isArray(res.data)) {
        const map = new Map<string, AuditLogEntry>();
        [...res.data, ...localLogs].forEach(item => {
          const key = item.id || `${item.staff_name_snapshot}|${item.action}|${item.timestamp}`;
          if (!map.has(key)) map.set(key, item);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        saveLocalAuditLogs(merged);
        return merged;
      }
    } catch {
      // Fallback to local logs
    }
    return localLogs;
  },

  async recordAuditLog(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<AuditLogEntry> {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    const current = loadLocalAuditLogs();
    saveLocalAuditLogs([newEntry, ...current]);

    try {
      const payload: Record<string, any> = {
        staff_name_snapshot: entry.staff_name_snapshot,
        staff_role_snapshot: entry.staff_role_snapshot || 'Staff Nurse',
        action: entry.action,
        target_type: entry.target_type,
        target_id: entry.target_id,
        details: entry.details,
      };
      // Only attach UUID staff FK if it's a valid UUID
      if (entry.staff && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.staff)) {
        payload.staff = entry.staff;
      }
      const res = await api.post<AuditLogEntry>('/audit-logs/', payload);
      if (res.data?.id) {
        const updated = loadLocalAuditLogs().map(l => (l.id === newEntry.id ? res.data : l));
        saveLocalAuditLogs(updated);
        return res.data;
      }
    } catch {
      // Retained in local audit log cache
    }
    return newEntry;
  },

  getActiveShift(): ShiftSession | null {
    try {
      const raw = sessionStorage.getItem(ACTIVE_SHIFT_KEY);
      if (!raw) return null;
      const parsed: ShiftSession = JSON.parse(raw);
      if (!parsed?.staff || !parsed?.expiresAt || Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(ACTIVE_SHIFT_KEY);
        return null;
      }
      // Verify staff is still active in local list
      const localList = loadLocalStaff();
      if (localList.length > 0) {
        const found = localList.find(s => s.id === parsed.staff.id);
        if (found && !found.is_active) {
          sessionStorage.removeItem(ACTIVE_SHIFT_KEY);
          return null;
        }
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setActiveShift(staff: ClinicStaffMember, durationMinutes = 15): ShiftSession {
    const session: ShiftSession = {
      staff,
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
    };
    try {
      sessionStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent(SHIFT_UPDATED_EVENT));
    } catch {}
    return session;
  },

  clearActiveShift(): void {
    try {
      sessionStorage.removeItem(ACTIVE_SHIFT_KEY);
      window.dispatchEvent(new CustomEvent(SHIFT_UPDATED_EVENT));
    } catch {}
  },
};
