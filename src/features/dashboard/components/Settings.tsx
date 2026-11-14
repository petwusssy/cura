import { useState, useEffect, useCallback } from 'react';
import {
  Save, User, Bell, Shield, Palette, Database, HelpCircle, Sun, Moon, Laptop,
  Droplets, Megaphone, Users, Lock, Unlock, KeyRound, Plus, CheckCircle2,
  XCircle, RefreshCw, Search, ClipboardList, Trash2, AlertCircle, AlertTriangle, Cloud, Download, ExternalLink,
  Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import { useTheme } from 'next-themes';
import api from '../../../services/api';
import { authService } from '../../../services/authService';
import { loginLimiter, MAX_LOGIN_ATTEMPTS } from '../../../utils/loginLimiter';
import {
  staffService,
  ClinicStaffMember,
  AuditLogEntry,
  AuditDriveArchiveItem,
  STAFF_UPDATED_EVENT,
  AUDIT_UPDATED_EVENT,
} from '../../../services/staffService';
import { toast } from 'sonner';
import { PrivacyPolicyModal, DPO_CONTACT, PRIVACY_POLICY_VERSION } from '../../../components/shared/PrivacyPolicy';

const PRIMARY = '#1E5AA8';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'staff', label: 'Clinic Staff & Audit', icon: <Users size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'system', label: 'System', icon: <Database size={16} /> },
  { id: 'advisory', label: 'Clinic Advisory', icon: <Megaphone size={16} /> },
  { id: 'help', label: 'Help & About', icon: <HelpCircle size={16} /> },
];

const STAFF_ROLES = ['Head Nurse', 'Staff Nurse', 'Clinic Physician', 'Clinic Assistant'];

function formatManilaTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

interface SettingsProps {
  onRequireStaffSignOff?: (actionTitle: string, actionDetails: string, targetType: string, targetId: string) => Promise<any>;
}

export function Settings({ onRequireStaffSignOff }: SettingsProps = {}) {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState({
    name: 'UA CLINIC ADMIN', designation: 'Administrator', email: 'admin@ua.edu.ph',
    phone: '09121234567', department: 'Medical-Dental Clinic',
  });

  const [notifSettings, setNotifSettings] = useState({
    medicationReminders: true, bedAlerts: true, lowStockAlerts: true,
    emailNotifs: false, soundAlerts: true, reminderBefore: '10',
  });

  const handleSave = async () => {
    if (onRequireStaffSignOff) {
      try {
        await onRequireStaffSignOff(
          'Updated Clinic Profile Settings',
          `${profile.name} (${profile.designation} • ${profile.department})`,
          'Settings',
          'profile'
        );
      } catch {
        return;
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [broadcastStatus, setBroadcastStatus] = useState<'Open' | 'Closed' | 'Half Day'>('Closed');
  const [broadcastMessage, setBroadcastMessage] = useState('Welcome to the University Clinic! Standard operating hours are 8:00 AM to 5:00 PM.');

  // ── Admin-Gated Clinic Staff & Audit State ──────────────────────────────────
  const USER_MGMT_LIMITER_ID = 'user_mgmt_master_key';
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminVerifying, setAdminVerifying] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLimitState, setAdminLimitState] = useState(() => loginLimiter.getLimitState(USER_MGMT_LIMITER_ID));

  const [staffSubTab, setStaffSubTab] = useState<'roster' | 'audit' | 'password'>('roster');
  const [staffList, setStaffList] = useState<ClinicStaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Change Passwords form (Access & Passwords sub-tab)
  const [newMgmtPw, setNewMgmtPw] = useState('');
  const [confirmMgmtPw, setConfirmMgmtPw] = useState('');
  const [isUpdatingMgmtPw, setIsUpdatingMgmtPw] = useState(false);

  const [currentLoginPw, setCurrentLoginPw] = useState('');
  const [newLoginPw, setNewLoginPw] = useState('');
  const [confirmLoginPw, setConfirmLoginPw] = useState('');
  const [isUpdatingLoginPw, setIsUpdatingLoginPw] = useState(false);
  const [pwVisibility, setPwVisibility] = useState({
    curLogin: false,
    newLogin: false,
    confLogin: false,
    newMgmt: false,
    confMgmt: false,
  });

  // Add Staff form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Staff Nurse');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Reset PIN inline state
  const [resettingPinId, setResettingPinId] = useState<string | null>(null);
  const [resetPinValue, setResetPinValue] = useState('');

  // Audit filter & Google Drive backup state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTargetFilter, setAuditTargetFilter] = useState<string>('All');
  const [auditDriveFiles, setAuditDriveFiles] = useState<AuditDriveArchiveItem[]>([]);
  const [auditDriveFolderUrl, setAuditDriveFolderUrl] = useState(
    'https://drive.google.com/drive/folders/1qRJu1lh8pOmwJ8W_ugpc_OEt8ML7cnie'
  );

  const loadStaffAndLogs = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const [loadedStaff, loadedLogs, driveData] = await Promise.all([
        staffService.getStaff(),
        staffService.getAuditLogs(),
        staffService.getAuditDriveArchives().catch(() => null),
      ]);
      setStaffList(loadedStaff);
      setAuditLogs(loadedLogs);
      if (driveData) {
        if (driveData.folder_url) setAuditDriveFolderUrl(driveData.folder_url);
        setAuditDriveFiles(Array.isArray(driveData.archives) ? driveData.archives : []);
      }
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    api.get('/advisory/')
      .then(res => {
        if (res.data) {
          if (res.data.status) setBroadcastStatus(res.data.status);
          if (res.data.message) setBroadcastMessage(res.data.message);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!isAdminUnlocked) return;
    loadStaffAndLogs();
    const handleRefresh = () => loadStaffAndLogs();
    window.addEventListener(STAFF_UPDATED_EVENT, handleRefresh);
    window.addEventListener(AUDIT_UPDATED_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(STAFF_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(AUDIT_UPDATED_EVENT, handleRefresh);
    };
  }, [isAdminUnlocked, loadStaffAndLogs]);

  useEffect(() => {
    if (!adminLimitState.isLocked || adminLimitState.lockoutRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setAdminLimitState(prev => {
        if (prev.lockoutRemainingSeconds <= 1) {
          clearInterval(interval);
          setAdminError(null);
          return loginLimiter.getLimitState(USER_MGMT_LIMITER_ID);
        }
        return { ...prev, lockoutRemainingSeconds: prev.lockoutRemainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [adminLimitState.isLocked, adminLimitState.lockoutRemainingSeconds]);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLimitState.isLocked || !adminPassword.trim() || adminVerifying) return;
    setAdminVerifying(true);
    setAdminError(null);
    try {
      const ok = await staffService.verifyAdminPassword(adminPassword);
      if (ok) {
        loginLimiter.recordSuccess(USER_MGMT_LIMITER_ID);
        setAdminLimitState(loginLimiter.getLimitState(USER_MGMT_LIMITER_ID));
        setIsAdminUnlocked(true);
        setAdminPassword('');
        setShowAdminPassword(false);
        toast.success('Clinic Staff & Audit settings unlocked');
      } else {
        const nextLimit = loginLimiter.recordFailure(null, USER_MGMT_LIMITER_ID);
        setAdminLimitState(nextLimit);
        setAdminError(nextLimit.isLocked ? null : 'attempts');
      }
    } catch (err: any) {
      const nextLimit = loginLimiter.recordFailure(err, USER_MGMT_LIMITER_ID);
      setAdminLimitState(nextLimit);
      setAdminError(nextLimit.isLocked ? null : 'attempts');
    } finally {
      setAdminVerifying(false);
    }
  };

  const handleChangeMgmtPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMgmtPw.trim()) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newMgmtPw.trim().length < 6) {
      toast.error('New User Management password must be at least 6 characters.');
      return;
    }
    if (newMgmtPw.trim() !== confirmMgmtPw.trim()) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setIsUpdatingMgmtPw(true);
    try {
      await staffService.changeAdminPassword(newMgmtPw);
      await staffService.recordAuditLog({
        staff_name_snapshot: authService.getUsername().toUpperCase() || 'HEAD NURSE / ADMIN',
        staff_role_snapshot: 'Administrator',
        action: 'Changed User Management Password',
        target_type: 'Staff',
        target_id: 'user-management-password',
        details: 'Updated User Management password',
      });
      setNewMgmtPw('');
      setConfirmMgmtPw('');
      setStaffSubTab('roster');
      toast.success('User Management password updated successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update User Management password.');
    } finally {
      setIsUpdatingMgmtPw(false);
    }
  };

  const handleChangeLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoginPw) {
      toast.error('Please enter the current CURA login password.');
      return;
    }
    if (newLoginPw.trim().length < 8) {
      toast.error('New CURA login password must be at least 8 characters.');
      return;
    }
    if (newLoginPw !== confirmLoginPw) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setIsUpdatingLoginPw(true);
    try {
      await staffService.changeClinicLoginPassword(
        authService.getUsername() || 'ANTHROPEAK2026',
        currentLoginPw,
        newLoginPw,
      );
      await staffService.recordAuditLog({
        staff_name_snapshot: authService.getUsername().toUpperCase() || 'HEAD NURSE / ADMIN',
        staff_role_snapshot: 'Administrator',
        action: 'Changed CURA Login Password',
        target_type: 'Staff',
        target_id: 'cura-login-password',
        details: 'Updated shared CURA clinic login password',
      });
      setCurrentLoginPw('');
      setNewLoginPw('');
      setConfirmLoginPw('');
      toast.success('CURA clinic login password updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to update CURA login password.');
    } finally {
      setIsUpdatingLoginPw(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      toast.error('Please enter the staff member name.');
      return;
    }
    if (!/^\d{4}$/.test(newStaffPin.trim())) {
      toast.error('PIN must be exactly 4 digits (0-9).');
      return;
    }
    setIsAddingStaff(true);
    try {
      const created = await staffService.createStaff({
        name: newStaffName,
        role: newStaffRole,
        pin: newStaffPin,
      });
      await staffService.recordAuditLog({
        staff: created.id,
        staff_name_snapshot: authService.getUsername().toUpperCase() || 'ADMIN',
        staff_role_snapshot: 'Administrator',
        action: 'Added Clinic Staff',
        target_type: 'Staff',
        target_id: created.id,
        details: `Added ${created.name} (${created.role}) with 4-digit PIN`,
      });
      setNewStaffName('');
      setNewStaffPin('');
      setNewStaffRole('Staff Nurse');
      await loadStaffAndLogs();
      toast.success(`Added ${created.name} (${created.role})`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add staff member.');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleToggleStaffActive = async (member: ClinicStaffMember) => {
    try {
      const updated = await staffService.updateStaff(member.id, {
        is_active: !member.is_active,
      });
      await staffService.recordAuditLog({
        staff: member.id,
        staff_name_snapshot: authService.getUsername().toUpperCase() || 'ADMIN',
        staff_role_snapshot: 'Administrator',
        action: updated.is_active ? 'Activated Staff' : 'Deactivated Staff',
        target_type: 'Staff',
        target_id: member.id,
        details: `${updated.is_active ? 'Activated' : 'Deactivated'} ${member.name} (${member.role})`,
      });
      await loadStaffAndLogs();
      toast.success(`${member.name} is now ${updated.is_active ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update staff status.');
    }
  };

  const handleSaveResetPin = async (member: ClinicStaffMember) => {
    if (!/^\d{4}$/.test(resetPinValue.trim())) {
      toast.error('New PIN must be exactly 4 digits.');
      return;
    }
    try {
      await staffService.updateStaff(member.id, { pin: resetPinValue.trim() });
      await staffService.recordAuditLog({
        staff: member.id,
        staff_name_snapshot: authService.getUsername().toUpperCase() || 'ADMIN',
        staff_role_snapshot: 'Administrator',
        action: 'Reset Staff PIN',
        target_type: 'Staff',
        target_id: member.id,
        details: `Updated 4-digit PIN for ${member.name}`,
      });
      setResettingPinId(null);
      setResetPinValue('');
      toast.success(`Updated 4-digit PIN for ${member.name}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update PIN.');
    }
  };

  const handleDeleteStaff = async (member: ClinicStaffMember) => {
    if (!window.confirm(`Remove ${member.name} from Clinic Staff? (Tip: Deactivating is recommended if you want to keep them on the roster.)`)) {
      return;
    }
    try {
      await staffService.deleteStaff(member.id);
      await staffService.recordAuditLog({
        staff_name_snapshot: authService.getUsername().toUpperCase() || 'ADMIN',
        staff_role_snapshot: 'Administrator',
        action: 'Removed Clinic Staff',
        target_type: 'Staff',
        target_id: member.id,
        details: `Removed ${member.name} (${member.role})`,
      });
      await loadStaffAndLogs();
      toast.success(`Removed ${member.name}`);
    } catch {
      toast.error('Failed to remove staff member.');
    }
  };

  const handlePushAdvisory = async () => {
    if (onRequireStaffSignOff) {
      try {
        await onRequireStaffSignOff(
          'Updated Clinic Advisory Broadcast',
          `Status: ${broadcastStatus} • ${broadcastMessage.slice(0, 60)}`,
          'Advisory',
          'clinic-advisory'
        );
      } catch {
        return;
      }
    }
    setSaved(true);
    try {
      await api.post('/advisory/', {
        status: broadcastStatus,
        message: broadcastMessage,
      });
    } catch (e) { }
    setTimeout(() => setSaved(false), 2000);
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditTargetFilter !== 'All' && log.target_type !== auditTargetFilter) {
      return false;
    }
    if (!auditSearch.trim()) return true;
    const q = auditSearch.trim().toLowerCase();
    return (
      log.staff_name_snapshot?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.target_type?.toLowerCase().includes(q) ||
      log.target_id?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] transition-all bg-background text-foreground';
  const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5';

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="bg-card text-card-foreground rounded-xl p-3 space-y-1 h-fit" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer"
              style={{ background: activeSection === s.id ? `${PRIMARY}10` : 'transparent', color: activeSection === s.id ? PRIMARY : '#6b7280' }}>
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">Profile Information</h3>
              <div className="flex items-center gap-5 pb-4 border-b border-border">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: PRIMARY }}>GA</div>
                <div>
                  <div className="font-semibold text-foreground">{profile.name}</div>
                  <div className="text-sm text-muted-foreground">{profile.designation} • {profile.department}</div>
                  <button className="text-xs mt-1.5 px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Change Photo</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Full Name' },
                  { key: 'designation', label: 'Designation' },
                  { key: 'email', label: 'Email Address' },
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'department', label: 'Department' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <input type="text" value={(profile as any)[f.key]}
                      onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: saved ? '#4CAF50' : PRIMARY }}>
                  <Save size={15} /> {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'staff' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              {!isAdminUnlocked ? (
                /* ── Admin Password Gate (Sudo Mode) ── */
                <div className="max-w-md mx-auto py-8 text-center space-y-5">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2465ad 100%)' }}
                  >
                    <Lock size={26} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground">
                      User Management Master Key Required
                    </h3>
                  </div>

                  <form onSubmit={handleUnlockAdmin} className="space-y-3 text-left">
                    <div>
                      <label className={labelCls}>User Management Password</label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          autoFocus
                          disabled={adminLimitState.isLocked}
                          value={adminPassword}
                          onChange={e => {
                            setAdminPassword(e.target.value);
                            if (adminError) setAdminError(null);
                          }}
                          placeholder="Enter User Management password..."
                          className={`${inputCls} pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                        <button
                          type="button"
                          disabled={adminLimitState.isLocked}
                          onClick={() => setShowAdminPassword(v => !v)}
                          aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {adminLimitState.isLocked ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="text-amber-600 shrink-0" size={16} />
                          <span className="font-bold text-amber-800">Master Key Temporarily Locked</span>
                        </div>
                        <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          {loginLimiter.formatTime(adminLimitState.lockoutRemainingSeconds)}
                        </span>
                      </div>
                    ) : (adminError || adminLimitState.attemptsRemaining < MAX_LOGIN_ATTEMPTS) && (
                      <div
                        className={`px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 ${adminLimitState.attemptsRemaining <= 1
                          ? 'bg-red-50 border border-red-200 text-red-800'
                          : 'bg-amber-50 border border-amber-200 text-amber-800'
                          }`}
                      >
                        <AlertTriangle
                          className={adminLimitState.attemptsRemaining <= 1 ? 'text-red-600 shrink-0' : 'text-amber-600 shrink-0'}
                          size={16}
                        />
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-black/60">
                            Attempts remaining:
                          </span>
                          <div className="flex gap-1.5 items-center">
                            {Array.from({ length: MAX_LOGIN_ATTEMPTS }).map((_, idx) => (
                              <span
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all ${idx < adminLimitState.attemptsRemaining
                                  ? adminLimitState.attemptsRemaining <= 1
                                    ? 'bg-red-500'
                                    : 'bg-amber-500'
                                  : 'bg-black/15'
                                  }`}
                              />
                            ))}
                            <span className="text-[10.5px] font-bold text-black/65 ml-1">
                              ({adminLimitState.attemptsRemaining} of {MAX_LOGIN_ATTEMPTS})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={adminVerifying || adminLimitState.isLocked || !adminPassword.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      style={{ background: PRIMARY }}
                    >
                      <Unlock size={16} />
                      {adminLimitState.isLocked
                        ? `Locked (${loginLimiter.formatTime(adminLimitState.lockoutRemainingSeconds)})`
                        : adminVerifying
                          ? 'Verifying...'
                          : 'Unlock Staff & Audit Management'}
                    </button>
                  </form>
                </div>
              ) : (
                /* ── Unlocked Clinic Staff & Audit View ── */
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">
                          Clinic Staff & Audit Trail
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Admin Unlocked
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadStaffAndLogs}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                      >
                        <RefreshCw size={13} className={isLoadingStaff ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAdminUnlocked(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Lock size={13} />
                        Lock Section
                      </button>
                    </div>
                  </div>

                  {/* Sub-tabs: Staff Roster vs Audit Trail vs Change Admin Key */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                    <button
                      type="button"
                      onClick={() => setStaffSubTab('roster')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${staffSubTab === 'roster'
                        ? 'text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-accent'
                        }`}
                      style={staffSubTab === 'roster' ? { background: PRIMARY } : {}}
                    >
                      <Users size={14} />
                      Clinic Staff & PINs ({staffList.filter(s => s.is_active).length} Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffSubTab('audit')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${staffSubTab === 'audit'
                        ? 'text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-accent'
                        }`}
                      style={staffSubTab === 'audit' ? { background: PRIMARY } : {}}
                    >
                      <ClipboardList size={14} />
                      Audit Logs ({auditLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffSubTab('password')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${staffSubTab === 'password'
                        ? 'text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-accent'
                        }`}
                      style={staffSubTab === 'password' ? { background: PRIMARY } : {}}
                    >
                      <KeyRound size={14} />
                      Access &amp; Passwords
                    </button>
                  </div>

                  {staffSubTab === 'roster' ? (
                    <div className="space-y-6">
                      {/* Add New Staff Member Card */}
                      <form
                        onSubmit={handleCreateStaff}
                        className="p-4 rounded-xl bg-blue-50/40 dark:bg-slate-900/40 border border-blue-100 dark:border-border space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8]">
                            Add Clinic Staff Member
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-5">
                            <label className={labelCls}>Full Name & Credentials</label>
                            <input
                              type="text"
                              value={newStaffName}
                              onChange={e => setNewStaffName(e.target.value.toUpperCase())}
                              placeholder="e.g., MARIA SANTOS, RN"
                              className={inputCls}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className={labelCls}>Role</label>
                            <select
                              value={newStaffRole}
                              onChange={e => setNewStaffRole(e.target.value)}
                              className={inputCls}
                            >
                              {STAFF_ROLES.map(r => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>4-Digit PIN</label>
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={4}
                              value={newStaffPin}
                              onChange={e => setNewStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="••••"
                              className={inputCls + ' text-center font-mono tracking-widest font-bold'}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="submit"
                              disabled={isAddingStaff}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                              style={{ background: PRIMARY }}
                            >
                              <Plus size={15} />
                              Add Staff
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Staff Roster List */}
                      {staffList.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-border rounded-xl space-y-2">
                          <Users size={28} className="mx-auto text-muted-foreground/60" />
                          <div className="text-sm font-semibold text-foreground">
                            No Clinic Staff Configured Yet
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-border rounded-xl">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <th className="py-3 px-4">Staff Name</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                              {staffList.map(member => (
                                <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                                  <td className="py-3 px-4 font-bold text-foreground">
                                    {member.name}
                                  </td>
                                  <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                                    {member.role}
                                  </td>
                                  <td className="py-3 px-4">
                                    {member.is_active ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 size={12} /> Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                        <XCircle size={12} /> Inactive
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {resettingPinId === member.id ? (
                                      <div className="inline-flex items-center gap-2">
                                        <input
                                          type="password"
                                          inputMode="numeric"
                                          maxLength={4}
                                          autoFocus
                                          value={resetPinValue}
                                          onChange={e =>
                                            setResetPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))
                                          }
                                          placeholder="New 4-digit PIN"
                                          className="w-28 border border-border rounded-lg px-2.5 py-1 text-xs font-mono text-center"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveResetPin(member)}
                                          className="px-2.5 py-1 rounded-lg text-white text-xs font-semibold cursor-pointer"
                                          style={{ background: PRIMARY }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResettingPinId(null);
                                            setResetPinValue('');
                                          }}
                                          className="px-2 py-1 rounded-lg border border-border text-xs text-muted-foreground cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResettingPinId(member.id);
                                            setResetPinValue('');
                                          }}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                                        >
                                          <KeyRound size={12} /> Reset PIN
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleStaffActive(member)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${member.is_active
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                        >
                                          {member.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteStaff(member)}
                                          title="Delete Staff"
                                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : staffSubTab === 'audit' ? (
                    /* ── Audit Logs Tab ── */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <Cloud size={18} className="text-[#1E5AA8] shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-bold text-foreground">
                                Google Drive Backup (<span className="font-mono">04 - Settings (Audit Logs)</span>)
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Audit trails are backed up automatically to daily CSV files.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={auditDriveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                            >
                              <ExternalLink size={13} /> Open Drive Folder
                            </a>
                          </div>
                        </div>
                        {auditDriveFiles.length > 0 && (
                          <div className="max-h-36 overflow-y-auto border border-border rounded-lg divide-y divide-border bg-card">
                            {auditDriveFiles.map(file => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-muted/20"
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <span className="font-mono font-semibold text-foreground truncate">{file.name}</span>
                                  {file.sha256 && (
                                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                                      {file.sha256}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  {file.created_at && (
                                    <span className="hidden md:inline text-[11px] font-mono text-muted-foreground">
                                      {formatManilaTimestamp(file.created_at)}
                                    </span>
                                  )}
                                  <a
                                    href={
                                      api.defaults.baseURL
                                        ? `${api.defaults.baseURL.replace(/\/$/, '')}/reports/archives/${file.id}/download/`
                                        : file.download_url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#1E5AA8] hover:underline font-semibold"
                                  >
                                    <Download size={12} /> CSV
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            value={auditSearch}
                            onChange={e => setAuditSearch(e.target.value)}
                            placeholder="Search by nurse name, patient, medicine, or action..."
                            className={inputCls + ' pl-9'}
                          />
                        </div>
                        <select
                          value={auditTargetFilter}
                          onChange={e => setAuditTargetFilter(e.target.value)}
                          className={inputCls + ' sm:w-48'}
                        >
                          <option value="All">All Categories</option>
                          <option value="Consultation">Consultations</option>
                          <option value="Patient">Patients</option>
                          <option value="Inventory">Inventory / Medicine</option>
                          <option value="PurchaseRequest">Purchase Requisitions (PRF)</option>
                          <option value="MedicalCertificate">Medical Certificates</option>
                          <option value="Bed">Clinic Beds</option>
                          <option value="HospitalTransfer">Hospital Transfers</option>
                          <option value="Appointment">Appointments</option>
                          <option value="Telemedicine">Telemedicine</option>
                          <option value="Advisory">Clinic Advisory</option>
                          <option value="Settings">Settings</option>
                          <option value="Staff">Staff Management</option>
                        </select>
                      </div>

                      {filteredAuditLogs.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                          No audit log entries match your filter yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-border rounded-xl max-h-[460px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-card border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              <tr>
                                <th className="py-3 px-4">Timestamp (PHT)</th>
                                <th className="py-3 px-4">Staff Member</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs">
                              {filteredAuditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-muted/20">
                                  <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground font-mono">
                                    {formatManilaTimestamp(log.timestamp)}
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <div className="font-bold text-foreground">{log.staff_name_snapshot}</div>
                                    {log.staff_role_snapshot && (
                                      <div className="text-[10px] text-muted-foreground">{log.staff_role_snapshot}</div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-[#1E5AA8] border border-blue-200">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-foreground">
                                    {log.details}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Access & Passwords Sub-tab (Master-Key Protected) ── */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <form
                        onSubmit={handleChangeLoginPassword}
                        className="space-y-4 p-5 rounded-xl border border-border bg-muted/10"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            CURA Clinic Login Password
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Updates the shared clinic dashboard login password (Head Nurse / Admin only).
                          </p>
                        </div>
                        {[
                          { key: 'curLogin' as const, label: 'Current CURA Password', val: currentLoginPw, set: setCurrentLoginPw, ph: 'Enter current login password' },
                          { key: 'newLogin' as const, label: 'New CURA Password', val: newLoginPw, set: setNewLoginPw, ph: 'Minimum 8 characters' },
                          { key: 'confLogin' as const, label: 'Confirm New Password', val: confirmLoginPw, set: setConfirmLoginPw, ph: 'Re-enter new login password' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className={labelCls}>{f.label}</label>
                            <div className="relative">
                              <input
                                type={pwVisibility[f.key] ? 'text' : 'password'}
                                value={f.val}
                                onChange={e => f.set(e.target.value)}
                                placeholder={f.ph}
                                className={`${inputCls} pr-10`}
                              />
                              <button
                                type="button"
                                onClick={() => setPwVisibility(p => ({ ...p, [f.key]: !p[f.key] }))}
                                aria-label={pwVisibility[f.key] ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {pwVisibility[f.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="submit"
                          disabled={isUpdatingLoginPw}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                          style={{ background: PRIMARY }}
                        >
                          <Save size={15} />
                          {isUpdatingLoginPw ? 'Updating...' : 'Update CURA Login Password'}
                        </button>
                      </form>

                      <form
                        onSubmit={handleChangeMgmtPassword}
                        className="space-y-4 p-5 rounded-xl border border-border bg-muted/10 h-fit"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            User Management Master Key
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Separate password required to unlock Clinic Staff, PINs, Audit Logs, and Passwords.
                          </p>
                        </div>
                        {[
                          { key: 'newMgmt' as const, label: 'New User Management Password', val: newMgmtPw, set: setNewMgmtPw, ph: 'Minimum 6 characters' },
                          { key: 'confMgmt' as const, label: 'Confirm New Password', val: confirmMgmtPw, set: setConfirmMgmtPw, ph: 'Re-enter new password' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className={labelCls}>{f.label}</label>
                            <div className="relative">
                              <input
                                type={pwVisibility[f.key] ? 'text' : 'password'}
                                value={f.val}
                                onChange={e => f.set(e.target.value)}
                                placeholder={f.ph}
                                className={`${inputCls} pr-10`}
                              />
                              <button
                                type="button"
                                onClick={() => setPwVisibility(p => ({ ...p, [f.key]: !p[f.key] }))}
                                aria-label={pwVisibility[f.key] ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {pwVisibility[f.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="submit"
                          disabled={isUpdatingMgmtPw}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                          style={{ background: PRIMARY }}
                        >
                          <Save size={15} />
                          {isUpdatingMgmtPw ? 'Updating...' : 'Update User Management Password'}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'medicationReminders', label: 'Medication Reminders', desc: 'Alert when a patient\'s next dose is approaching' },
                  { key: 'bedAlerts', label: 'Bed Occupancy Alerts', desc: 'Alert when a bed has been occupied for too long' },
                  { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Alert when medicine stock falls below threshold' },
                  { key: 'emailNotifs', label: 'Email Notifications', desc: 'Send notification summary via email' },
                  { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play sound for urgent notifications' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifSettings(n => ({ ...n, [s.key]: !(n as any)[s.key] }))}
                      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                      style={{ background: (notifSettings as any)[s.key] ? PRIMARY : '#d1d5db' }}
                    >
                      <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-card text-card-foreground shadow"
                        style={{ left: (notifSettings as any)[s.key] ? '22px' : '2px' }} />
                    </button>
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Remind me before dose (minutes)</label>
                  <select value={notifSettings.reminderBefore}
                    onChange={e => setNotifSettings(n => ({ ...n, reminderBefore: e.target.value }))}
                    className={inputCls + ' max-w-xs'}>
                    {['5', '10', '15', '20', '30'].map(v => <option key={v} value={v}>{v} minutes</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: saved ? '#4CAF50' : PRIMARY }}>
                  <Save size={15} /> {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">Security &amp; Privacy</h3>
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-amber-700 dark:text-amber-400" />
                    <h4 className="text-sm font-bold text-foreground">Clinic Password Controls Restricted</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Because staff nurses share the clinic login, changing the CURA Login Password and User Management Master Key is restricted to the Head Nurse inside <span className="font-semibold text-foreground">Clinic Staff &amp; Audit → Access &amp; Passwords</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('staff');
                    setStaffSubTab('password');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
                  style={{ background: PRIMARY }}
                >
                  <KeyRound size={13} /> Open Access &amp; Passwords
                </button>
              </div>

              {/* Data Privacy & Retention Compliance (RA 10173) */}
              <div className="pt-5 border-t border-border">
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-slate-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield size={16} style={{ color: PRIMARY }} />
                      <h4 className="text-sm font-bold text-foreground">Data Privacy &amp; Retention Compliance (RA 10173)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Retention policy: 3–5 yrs routine logs · 10 yrs adult clinical &amp; medcert · Age 18+10 yrs minors. DPO Contact:{' '}
                      <span className="font-semibold text-foreground">{DPO_CONTACT.email}</span> · Version {PRIVACY_POLICY_VERSION}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      <span>Public URL</span>
                      <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer"
                      style={{ background: PRIMARY }}
                    >
                      View Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">Appearance</h3>
              <div>
                <label className={labelCls}>Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'light', label: 'Default (Light)', icon: <Sun size={18} /> },
                    { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                    { id: 'ocean', label: 'Ocean', icon: <Droplets size={18} /> },
                    { id: 'system', label: 'OS Sync', icon: <Laptop size={18} /> },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className="p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all"
                      style={{
                        borderColor: theme === t.id ? PRIMARY : '#e5e7eb',
                        background: theme === t.id ? `${PRIMARY}08` : 'transparent',
                        color: theme === t.id ? PRIMARY : '#6b7280'
                      }}
                    >
                      {t.icon}
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Font Size</label>
                <select className={inputCls + ' max-w-xs'}>
                  <option>Small (14px)</option>
                  <option selected>Default (16px)</option>
                  <option>Large (18px)</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">System Information</h3>
              <div className="space-y-3">
                {[
                  ['System Name', 'CURA — University of the Assumption Clinic'],
                  ['Version', 'v1.0.0 (June 2026)'],
                  ['Environment', 'Production'],
                  ['Institution', 'University of the Assumption, San Fernando, Pampanga'],
                  ['Department', 'Medical-Dental Clinic'],
                  ['Data Storage', 'Local (Session)'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'advisory' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">Clinic Status Broadcast</h3>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Status</label>
                  <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                    {['Open', 'Closed', 'Half Day'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setBroadcastStatus(status as any)}
                        className={`px-4 py-1.5 rounded-full text-sm transition-all cursor-pointer whitespace-nowrap ${broadcastStatus === status
                          ? 'bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-sm shadow-sky-500/25 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Message</label>
                  <input
                    type="text"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className={inputCls}
                    placeholder="Enter message..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handlePushAdvisory} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: saved ? '#4CAF50' : PRIMARY }}>
                  <Megaphone size={15} /> {saved ? 'Pushed!' : 'Push Update'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-border">Help & About</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: `${PRIMARY}08` }}>
                  <div className="font-bold text-lg" style={{ color: PRIMARY }}>CURA</div>
                  <div className="text-sm text-muted-foreground mt-1">University of the Assumption Clinic Information System</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Version 1.0.0 • June 2026</div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-xs font-bold hover:underline cursor-pointer"
                      style={{ color: PRIMARY }}
                    >
                      Read Data Privacy Policy (RA 10173)
                    </button>
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <span>Public Notice (/privacy)</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="font-medium text-muted-foreground text-sm">Quick Reference</div>
                  {[
                    ['Dashboard', 'Overview of daily clinic activity and statistics'],
                    ['Patients', 'Search, add, and manage patient records'],
                    ['Consultations', 'View and manage patients seen by doctor'],
                    ['Non-Consultation', 'Manage nurse-only visits; convert to consultation if needed'],
                    ['Inventory', 'Track medicine stock levels and replenishment'],
                    ['Purchase Receipts', 'Manage medicine purchase requests and PRF generation'],
                    ['Medical Certificates', 'Issue and print medical certificates for patients'],
                    ['Beds Management', 'Monitor bed occupancy with auto-duration tracking'],
                    ['Reports', 'Generate daily, monthly, and custom reports'],
                    ['Clinic Staff & Audit', 'Admin-protected 4-digit PIN management and clinical audit trail'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-3 py-2 border-b border-border">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{title}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
}
