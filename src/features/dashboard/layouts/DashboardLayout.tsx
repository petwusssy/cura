import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList, Package, ShoppingCart,
  FileText, BedDouble, BarChart2, Bell, Settings, Search, LogOut, Menu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Page, AppNotification } from '@/types';
import uaSeal from '@/assets/images/ua-seal.png';
import curaLogo from '@/assets/images/cura-logo-clean.png';
import curaMascot from '@/assets/images/cura-mascot.png';
import { authService } from '@/services/authService';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard',           label: 'Dashboard',            icon: <LayoutDashboard size={18} /> },
  { id: 'patients',            label: 'Patients',             icon: <Users size={18} /> },
  { id: 'consultations',       label: 'Consultations',        icon: <Stethoscope size={18} /> },
  { id: 'non-consultations',   label: 'Non-Consultation',     icon: <ClipboardList size={18} /> },
  { id: 'inventory',           label: 'Inventory',            icon: <Package size={18} /> },
  { id: 'purchase-receipts',   label: 'Purchase Receipts',    icon: <ShoppingCart size={18} /> },
  { id: 'medical-certificates',label: 'Medical Certificates', icon: <FileText size={18} /> },
  { id: 'beds',                label: 'Beds Management',      icon: <BedDouble size={18} /> },
  { id: 'reports',             label: 'Reports',              icon: <BarChart2 size={18} /> },
  { id: 'notifications',       label: 'Notifications',        icon: <Bell size={18} /> },
  { id: 'settings',            label: 'Settings',             icon: <Settings size={18} /> },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  notifications: AppNotification[];
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Layout({ currentPage, onNavigate, onLogout, notifications, children, searchQuery, onSearchChange }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const roles = authService.getRoles();
  const isAdmin = roles.includes('Admin');

  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'settings' && !isAdmin) return false;
    // Add more role checks here based on requirements
    return true;
  });

  const isActive = (id: Page) =>
    currentPage === id ||
    (id === 'patients' && ['patient-profile', 'patient-form', 'new-consultation'].includes(currentPage));

  useEffect(() => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  }, []);

  return (
    <motion.div 
      className="flex h-screen overflow-hidden bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
        className={`flex flex-col flex-shrink-0 transition-all duration-300 fixed md:relative inset-y-0 left-0 z-50 md:z-auto ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        style={{
          width: collapsed ? 64 : 248,
          background: '#1B3A6B',
          boxShadow: '4px 0 24px rgba(27,58,107,0.18)',
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-4 py-4 flex-shrink-0 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Mascot icon */}
          <img
            src={curaMascot}
            alt="CURA"
            className="w-9 h-9 object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              {/* CURA wordmark */}
              <img
                src={curaLogo}
                alt="CURA"
                className="h-5 object-contain brightness-0 invert"
                style={{ maxWidth: 72 }}
              />
              <div className="text-[9px] font-medium mt-0.5 truncate" style={{ color: '#7BA4D4', letterSpacing: '0.02em' }}>
                University of the Assumption
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {filteredNavItems.map(item => {
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => { 
                  onNavigate(item.id);
                  if (window.innerWidth < 768) setCollapsed(true);
                }}
                title={collapsed ? item.label : undefined}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left relative transition-all group"
                style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
              >
                {active && (
                  <span
                    className="absolute inset-0"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      borderRight: '3px solid #F4C542',
                    }}
                  />
                )}
                <span className="relative flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="relative text-sm font-medium truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.id === 'notifications' && unread > 0 && (
                  <span
                    className="relative ml-auto flex-shrink-0 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    style={{ background: '#D64545' }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* UA Seal + Sign Out */}
        <div className="border-t flex-shrink-0 p-3 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 pb-1">
              <img src={uaSeal} alt="UA Seal" className="w-7 h-7 object-contain opacity-60" />
              <span className="text-[9px] leading-tight opacity-50 text-white">
                University of the Assumption<br />Medical Clinic
              </span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.15, ease: "easeOut" }}
          className="bg-white border-b border-gray-100 flex items-center gap-4 px-6 py-3 flex-shrink-0"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, records..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] focus:bg-white transition-all"
            />
          </div>

          <div className="flex-1" />

          {/* Notification bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-[#1B3A6B] transition-colors"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                style={{ background: '#D64545' }}
              >
                {unread}
              </span>
            )}
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#1B3A6B' }}
            >
              GA
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-gray-800">Grace Aquino, RN</div>
              <div className="text-xs text-gray-400">Head Nurse</div>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <motion.main 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </motion.div>
  );
}
