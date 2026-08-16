import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList, Package, ShoppingCart,
  FileText, BedDouble, BarChart2, Bell, Settings, Search, LogOut, Menu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Page, AppNotification } from '@/types';
import uaLogo from '@/assets/images/ua-logo.png';
import curaLogo from '@/assets/images/cura-logo-clean.png';
import curaMascot from '@/assets/images/cura-mascot.png';
import curaLogoMain from '@/assets/images/cura-logo.png';
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
  headerSearchComponent?: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, onLogout, notifications, children, headerSearchComponent }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const roles = authService.getRoles();
  const isAdmin = roles.includes('Admin');

  const filteredNavItems = navItems.filter(item => {
    // Add role checks here based on requirements if needed in the future
    // Currently, all items are visible
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
      className="flex h-[100dvh] overflow-hidden bg-background text-foreground transition-colors duration-300"
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
          background: 'var(--color-sidebar)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        }}
      >
        {/* Brand */}
        <div
          className={`flex items-center flex-shrink-0 border-b ${collapsed ? 'justify-center' : 'px-5 gap-3'}`}
          style={{ borderColor: 'rgba(255,255,255,0.08)', height: '88px' }}
        >
          {/* Main icon */}
          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: collapsed ? '40px' : '44px', height: '44px' }}>
            <img
              src={curaLogoMain}
              alt="CURA"
              className="absolute object-contain transition-transform duration-500"
              style={{ 
                height: collapsed ? '80px' : '115px', /* Slightly smaller balanced size */
                width: 'auto',
                maxWidth: 'none',
                transform: 'translateY(4px)' /* Perfect optical center alignment */
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(4px) scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(4px) scale(1)'}
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0 flex flex-col justify-center">
              <span className="text-[34px] font-black tracking-tighter leading-none"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                CURA
              </span>
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
              <img src={uaLogo} alt="UA Logo" className="w-8 h-8 object-contain opacity-70" />
              <span className="text-[9px] leading-tight opacity-60 text-white font-medium uppercase">
                UNIVERSITY OF THE ASSUMPTION<br />CLINIC
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
          className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 flex-shrink-0 relative overflow-hidden transition-colors duration-300 bg-[#1B3A6B] dark:bg-[var(--header-bg)]"
          style={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* Animated blobs */}
          <style>{`
            @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-10px) scale(1.1)} 66%{transform:translate(-10px,15px) scale(0.95)} }
            @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,10px) scale(0.9)} 66%{transform:translate(15px,-15px) scale(1.1)} }
          `}</style>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-30px] left-[15%] w-[160px] h-[160px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-[#dbeafe]/20 dark:bg-white/10 animate-[blob1_7s_ease-in-out_infinite]" />
            <div className="absolute top-[-20px] right-[20%] w-[130px] h-[130px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[#bfdbfe]/20 dark:bg-white/5 animate-[blob2_9s_ease-in-out_infinite]" />
            <div className="absolute top-[-10px] left-[60%] w-[100px] h-[100px] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-[#dbeafe]/20 dark:bg-white/10 animate-[blob1_11s_ease-in-out_infinite_reverse]" />
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="relative p-2 rounded-lg text-white/70 hover:text-white dark:text-muted-foreground dark:hover:text-foreground hover:bg-white/10 dark:hover:bg-accent transition-colors z-10"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          {headerSearchComponent}

          <div className="hidden sm:block sm:flex-1" />

          {/* Notification bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-xl text-white/70 hover:text-white dark:text-muted-foreground dark:hover:text-foreground hover:bg-white/10 dark:hover:bg-accent transition-colors z-10"
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
          <div className="flex items-center gap-3 pl-3 border-l border-white/10 dark:border-border z-10">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              UA
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-white dark:text-foreground">UA CLINIC ADMIN</div>
              <div className="text-xs text-blue-200 dark:text-primary font-medium">Administrator</div>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <motion.main 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </motion.main>
      </div>
    </motion.div>
  );
}
