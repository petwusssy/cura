import api, { API_URL } from './api';
import { authService } from './authService';

export const STAFF_ACCESS_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Patients' },
  { id: 'beds', label: 'Beds Management' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'medical-certificates', label: 'Medical Certificates' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'non-consultations', label: 'Non-Consultation' },
  { id: 'telemedicine', label: 'Telemedicine' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'purchase-receipts', label: 'Purchase Receipts' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
] as const;

export const ALL_STAFF_PAGE_IDS: string[] = STAFF_ACCESS_PAGES.map(p => p.id);

export interface ClinicStaffMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  allowed_pages?: string[] | null;
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

export interface AuditDriveArchiveItem {
  id: string;
  name: string;
  category?: string;
  folder_key?: string;
  sha256?: string;
  created_at: string;
  download_url: string;
  drive_url: string;
}

export interface AuditDriveArchivesResponse {
  folder_id: string;
  folder_url: string;
  archives: AuditDriveArchiveItem[];
}

const STAFF_CACHE_KEY = 'cura_clinic_staff_cache';
const STAFF_PAGES_CACHE_KEY = 'cura_clinic_staff_pages';
const AUDIT_LOGS_CACHE_KEY = 'cura_audit_logs_cache';
const ACTIVE_SHIFT_KEY = 'cura_active_staff_shift';
const USER_MGMT_PW_HASH_KEY = 'cura_user_mgmt_pw_hash';
const ENV_BACKEND_URL = (import.meta.env.VITE_ENV_BACKEND_URL || '').trim().replace(/\/+$/, '');
let lastVerifiedAdminPassword = '';

export const STAFF_UPDATED_EVENT = 'cura-staff-updated';
export const AUDIT_UPDATED_EVENT = 'cura-audit-updated';
export const SHIFT_UPDATED_EVENT = 'cura-shift-updated';

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

function saveLocalStaff(list: ClinicStaffMember[], notify = true): void {
  try {
    localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(list));
    if (notify) {
      window.dispatchEvent(new CustomEvent(STAFF_UPDATED_EVENT));
    }
  } catch { }
}

function loadLocalPagesMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STAFF_PAGES_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPages(staffId: string, pages: string[] | null | undefined): void {
  if (!Array.isArray(pages)) return;
  try {
    const map = loadLocalPagesMap();
    map[staffId] = pages;
    localStorage.setItem(STAFF_PAGES_CACHE_KEY, JSON.stringify(map));
  } catch { }
}

function hydrateStaffPages(member: ClinicStaffMember): ClinicStaffMember {
  if (Array.isArray(member.allowed_pages)) {
    saveLocalPages(member.id, member.allowed_pages);
    return member;
  }
  const map = loadLocalPagesMap();
  if (Array.isArray(map[member.id])) {
    return { ...member, allowed_pages: map[member.id] };
  }
  return member;
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

function saveLocalAuditLogs(logs: AuditLogEntry[], notify = true): void {
  try {
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(AUDIT_LOGS_CACHE_KEY, JSON.stringify(trimmed));
    if (notify) {
      window.dispatchEvent(new CustomEvent(AUDIT_UPDATED_EVENT));
    }
  } catch { }
}

export const staffService = {
  getStaffCached(): ClinicStaffMember[] {
    return loadLocalStaff();
  },

  hasActiveStaff(): boolean {
    return loadLocalStaff().some(s => s.is_active);
  },

  async getStaff(): Promise<ClinicStaffMember[]> {
    const localList = loadLocalStaff().map(hydrateStaffPages);
    try {
      const res = await api.get<ClinicStaffMember[]>('/staff/');
      if (Array.isArray(res.data)) {
        const hydrated = res.data.map(hydrateStaffPages);
        // Merge server list with any local-only items if server was empty before migration
        if (hydrated.length > 0 || localList.length === 0) {
          saveLocalStaff(hydrated, false);
          return hydrated;
        }
      }
    } catch {
      // Fallback to local cache if endpoint is not yet migrated on remote host
    }
    return localList;
  },

  async createStaff(payload: { name: string; role: string; pin: string; allowed_pages?: string[] }): Promise<ClinicStaffMember> {
    const cleanName = payload.name.trim().toUpperCase();
    const cleanPin = payload.pin.trim();
    const allowedPages = Array.isArray(payload.allowed_pages) ? payload.allowed_pages : [...ALL_STAFF_PAGE_IDS];
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('PIN must be exactly 4 digits.');
    }

    const localList = loadLocalStaff();

    try {
      const res = await api.post<ClinicStaffMember>('/staff/', {
        name: cleanName,
        role: payload.role,
        pin: cleanPin,
        is_active: true,
        allowed_pages: allowedPages,
      });
      const created: ClinicStaffMember = {
        ...res.data,
        allowed_pages: Array.isArray(res.data.allowed_pages) ? res.data.allowed_pages : allowedPages,
      };
      saveLocalPages(created.id, created.allowed_pages);
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
      throw new Error(err?.response?.data?.error || 'Could not reach server to create staff PIN.');
    }
  },

  async updateStaff(
    id: string,
    payload: Partial<{ name: string; role: string; pin: string; is_active: boolean; allowed_pages: string[] }>
  ): Promise<ClinicStaffMember> {
    const localList = loadLocalStaff();

    if (payload.pin !== undefined) {
      const cleanPin = payload.pin.trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        throw new Error('PIN must be exactly 4 digits.');
      }
    }

    if (Array.isArray(payload.allowed_pages)) {
      saveLocalPages(id, payload.allowed_pages);
    }

    const updatedLocalList = localList.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        ...(payload.name !== undefined ? { name: payload.name.trim().toUpperCase() } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        ...(payload.allowed_pages !== undefined ? { allowed_pages: payload.allowed_pages } : {}),
      };
    });

    saveLocalStaff(updatedLocalList);

    // Sync active shift if the updated staff member is currently on shift
    const activeShift = this.getActiveShift();
    if (activeShift?.staff.id === id) {
      if (payload.is_active === false) {
        this.clearActiveShift();
      } else {
        const updatedSelf = updatedLocalList.find(s => s.id === id);
        if (updatedSelf) {
          try {
            sessionStorage.setItem(
              ACTIVE_SHIFT_KEY,
              JSON.stringify({ ...activeShift, staff: hydrateStaffPages(updatedSelf) })
            );
            window.dispatchEvent(new CustomEvent(SHIFT_UPDATED_EVENT));
          } catch { }
        }
      }
    }

    try {
      const res = await api.patch<ClinicStaffMember>(`/staff/${id}/`, payload);
      const mergedRes = hydrateStaffPages({
        ...res.data,
        ...(payload.allowed_pages !== undefined ? { allowed_pages: payload.allowed_pages } : {}),
      });
      const finalList = updatedLocalList.map(s => (s.id === id ? mergedRes : s));
      saveLocalStaff(finalList);
      return mergedRes;
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

    try {
      localStorage.removeItem(USER_MGMT_PW_HASH_KEY);
    } catch { }

    // 1. Optional separate admin-verify host (only when VITE_ENV_BACKEND_URL is explicitly set)
    if (ENV_BACKEND_URL && ENV_BACKEND_URL !== API_URL) {
      try {
        const envRes = await fetch(`${ENV_BACKEND_URL}/staff/verify-admin/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: cleanPassword }),
        });
        const envData = await envRes.json().catch(() => null);
        if (envData?.valid) {
          lastVerifiedAdminPassword = cleanPassword;
          return true;
        }
        if (envData?.env_configured === true) {
          return false;
        }
      } catch { }
    }

    // 2. Verify against primary API_URL (follows VITE_API_URL in all environments)
    const res = await api.post<{ valid: boolean }>('/staff/verify-admin/', {
      password: cleanPassword,
    });
    if (res.data?.valid) {
      lastVerifiedAdminPassword = cleanPassword;
      return true;
    }
    return false;
  },

  async changeAdminPassword(newPassword: string, currentPassword?: string): Promise<void> {
    const cleanNew = newPassword.trim();
    const cleanCurrent = (currentPassword || lastVerifiedAdminPassword).trim();
    if (!cleanNew) {
      throw new Error('New password is required.');
    }
    if (cleanNew.length < 6) {
      throw new Error('New User Management password must be at least 6 characters.');
    }
    if (!cleanCurrent) {
      throw new Error('Please unlock User Management again before changing the password.');
    }

    try {
      localStorage.removeItem(USER_MGMT_PW_HASH_KEY);
    } catch { }

    // Update custom password on primary backend (and optional ENV backend only if separately set)
    const calls: Promise<any>[] = [
      api.post('/staff/change-admin-password/', { current_password: cleanCurrent, new_password: cleanNew }),
    ];
    if (ENV_BACKEND_URL && API_URL !== ENV_BACKEND_URL) {
      calls.push(
        fetch(`${ENV_BACKEND_URL}/staff/change-admin-password/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: cleanCurrent, new_password: cleanNew }),
        }).then(async r => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            throw new Error(data?.error || 'Failed to update User Management password.');
          }
          return data;
        })
      );
    }

    const results = await Promise.allSettled(calls);
    const primaryRes = results[0];
    const secondaryRes = results[1];
    if (secondaryRes?.status === 'rejected' && secondaryRes.reason instanceof Error) {
      throw secondaryRes.reason;
    }
    if (primaryRes.status === 'rejected' && (!secondaryRes || secondaryRes.status === 'rejected')) {
      const err: any = primaryRes.reason;
      throw new Error(err?.response?.data?.error || 'Failed to update User Management password.');
    }
    lastVerifiedAdminPassword = cleanNew;
  },

  async changeClinicLoginPassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const cleanAdmin = lastVerifiedAdminPassword.trim();
    if (!cleanAdmin) {
      throw new Error('Please unlock User Management again before changing the CURA login password.');
    }

    const res = await api.post<{ success?: boolean; access?: string }>('/auth/change-password/', {
      email,
      current_password: currentPassword,
      new_password: newPassword,
      admin_password: cleanAdmin,
    });

    if (res.data?.access) {
      localStorage.setItem('accessToken', res.data.access);
      localStorage.setItem('cura_access_token', res.data.access);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
    }
  },

  async verifyPin(pin: string): Promise<ClinicStaffMember> {
    const cleanPin = pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('Please enter a 4-digit PIN.');
    }
    try { localStorage.removeItem('cura_clinic_staff_pins'); } catch { }

    // Always verify against backend /staff/verify-pin/ so lockout and revocation cannot be bypassed
    try {
      const res = await api.post<{ valid: boolean; staff: ClinicStaffMember }>('/staff/verify-pin/', {
        pin: cleanPin,
      });
      if (res.data?.valid && res.data?.staff) {
        return hydrateStaffPages(res.data.staff);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error;
      if (err?.response?.status === 429 && serverMsg) {
        throw new Error(String(serverMsg));
      }
      if (err?.response?.status === 401) {
        throw new Error(serverMsg ? String(serverMsg) : 'Invalid or inactive 4-digit PIN.');
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
        saveLocalAuditLogs(merged, false);
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
        if (found) {
          if (!found.is_active) {
            sessionStorage.removeItem(ACTIVE_SHIFT_KEY);
            return null;
          }
          return { ...parsed, staff: hydrateStaffPages(found) };
        }
      }
      return { ...parsed, staff: hydrateStaffPages(parsed.staff) };
    } catch {
      return null;
    }
  },

  setActiveShift(staff: ClinicStaffMember, durationMinutes = 1440): ShiftSession {
    const session: ShiftSession = {
      staff: hydrateStaffPages(staff),
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
    };
    try {
      sessionStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent(SHIFT_UPDATED_EVENT));
    } catch { }
    return session;
  },

  canAccessPage(page: string, staff?: ClinicStaffMember | null): boolean {
    if (!staff) return true;
    const hydrated = hydrateStaffPages(staff);
    if (!Array.isArray(hydrated.allowed_pages)) return true;

    let canonical = page;
    if (page === 'patient-profile' || page === 'patient-form') canonical = 'patients';
    else if (
      page === 'new-consultation' ||
      page === 'new-consultation-tab' ||
      page === 'convert-consultation-tab'
    ) {
      canonical = 'consultations';
    } else if (page === 'new-non-consultation-tab') {
      canonical = 'non-consultations';
    } else if (page === 'notifications' || page === 'search' || page === 'login') {
      return true;
    }

    return hydrated.allowed_pages.includes(canonical);
  },

  clearActiveShift(): void {
    try {
      sessionStorage.removeItem(ACTIVE_SHIFT_KEY);
      window.dispatchEvent(new CustomEvent(SHIFT_UPDATED_EVENT));
    } catch { }
  },

  async getAuditDriveArchives(): Promise<AuditDriveArchivesResponse> {
    const res = await api.get<AuditDriveArchivesResponse>('/audit-logs/drive-archives/');
    return res.data;
  },
};

