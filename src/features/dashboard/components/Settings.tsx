import { useState } from 'react';
import { Save, User, Bell, Shield, Palette, Database, HelpCircle, Sun, Moon, Laptop, Droplets } from 'lucide-react';
import { useTheme } from 'next-themes';

const PRIMARY = '#1E5AA8';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'system', label: 'System', icon: <Database size={16} /> },
  { id: 'help', label: 'Help & About', icon: <HelpCircle size={16} /> },
];

export function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState({
    name: 'UA CLINIC ADMIN', designation: 'Administrator', email: 'admin@ua.edu.ph',
    phone: '09121234567', department: 'Medical-Dental Clinic',
  });

  const [notifSettings, setNotifSettings] = useState({
    medicationReminders: true, bedAlerts: true, lowStockAlerts: true,
    emailNotifs: false, soundAlerts: true, reminderBefore: '10',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E5AA8] transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system preferences and account settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="bg-card text-card-foreground rounded-xl p-3 space-y-1 h-fit" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
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
              <h3 className="text-foreground pb-4 border-b border-gray-100">Profile Information</h3>
              <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: PRIMARY }}>GA</div>
                <div>
                  <div className="font-semibold text-foreground">{profile.name}</div>
                  <div className="text-sm text-gray-500">{profile.designation} • {profile.department}</div>
                  <button className="text-xs mt-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">Change Photo</button>
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

          {activeSection === 'notifications' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-gray-100">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'medicationReminders', label: 'Medication Reminders', desc: 'Alert when a patient\'s next dose is approaching' },
                  { key: 'bedAlerts', label: 'Bed Occupancy Alerts', desc: 'Alert when a bed has been occupied for too long' },
                  { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Alert when medicine stock falls below threshold' },
                  { key: 'emailNotifs', label: 'Email Notifications', desc: 'Send notification summary via email' },
                  { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play sound for urgent notifications' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.label}</div>
                      <div className="text-xs text-gray-400">{s.desc}</div>
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
              <h3 className="text-foreground pb-4 border-b border-gray-100">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input type="password" placeholder="••••••••" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" placeholder="Minimum 8 characters" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" placeholder="Re-enter new password" className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ background: saved ? '#4CAF50' : PRIMARY }}>
                  <Save size={15} /> Update Password
                </button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-gray-100">Appearance</h3>
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
              <h3 className="text-foreground pb-4 border-b border-gray-100">System Information</h3>
              <div className="space-y-3">
                {[
                  ['System Name', 'CURA — University of the Assumption Clinic'],
                  ['Version', 'v1.0.0 (June 2026)'],
                  ['Environment', 'Production'],
                  ['Institution', 'University of the Assumption, San Fernando, Pampanga'],
                  ['Department', 'Medical-Dental Clinic'],
                  ['Data Storage', 'Local (Session)'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="bg-card text-card-foreground rounded-xl p-6 space-y-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 className="text-foreground pb-4 border-b border-gray-100">Help & About</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: `${PRIMARY}08` }}>
                  <div className="font-bold text-lg" style={{ color: PRIMARY }}>CURA</div>
                  <div className="text-sm text-gray-600 mt-1">University of the Assumption Clinic Information System</div>
                  <div className="text-xs text-gray-400 mt-0.5">Version 1.0.0 • June 2026</div>
                </div>
                <div className="space-y-3">
                  <div className="font-medium text-gray-700 text-sm">Quick Reference</div>
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
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-3 py-2 border-b border-gray-50">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">{title}</div>
                        <div className="text-xs text-gray-400">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
