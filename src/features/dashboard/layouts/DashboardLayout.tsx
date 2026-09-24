import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList, Package, ShoppingCart,
  FileText, BedDouble, BarChart2, Bell, Settings, LogOut, Menu, Calendar, Video, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, AppNotification } from '@/types';
import uaLogo from '@/assets/images/ua-logo.png';
import curaLogoMain from '@/assets/images/cura-logo.png';
import { authService } from '@/services/authService';

// ── Nav structure ──────────────────────────────────────────────────────────────
type NavLeaf  = { kind: 'leaf';  id: Page;   label: string; icon: React.ReactNode };
type NavGroup = { kind: 'group'; id: string; label: string; icon: React.ReactNode; children: NavLeaf[] };
type NavItem  = NavLeaf | NavGroup;

const navItems: NavItem[] = [
  { kind: 'leaf',  id: 'dashboard',  label: 'Dashboard',       icon: <LayoutDashboard size={18} /> },
  { kind: 'leaf',  id: 'patients',   label: 'Patients',        icon: <Users size={18} /> },
  { kind: 'leaf',  id: 'beds',       label: 'Beds Management', icon: <BedDouble size={18} /> },
  {
    kind: 'group', id: 'appointments-group', label: 'Appointments', icon: <Calendar size={18} />,
    children: [
      { kind: 'leaf', id: 'appointments',         label: 'Appointments',         icon: <Calendar size={16} /> },
      { kind: 'leaf', id: 'medical-certificates', label: 'Medical Certificates', icon: <FileText size={16} /> },
    ],
  },
  {
    kind: 'group', id: 'consultations-group', label: 'Consultations', icon: <Stethoscope size={18} />,
    children: [
      { kind: 'leaf', id: 'consultations',     label: 'Consultations',    icon: <Stethoscope size={16} /> },
      { kind: 'leaf', id: 'non-consultations', label: 'Non-Consultation', icon: <ClipboardList size={16} /> },
      { kind: 'leaf', id: 'telemedicine',      label: 'Telemedicine',     icon: <Video size={16} /> },
    ],
  },
  {
    kind: 'group', id: 'inventory-group', label: 'Inventory', icon: <Package size={18} />,
    children: [
      { kind: 'leaf', id: 'inventory',         label: 'Inventory',         icon: <Package size={16} /> },
      { kind: 'leaf', id: 'purchase-receipts', label: 'Purchase Receipts', icon: <ShoppingCart size={16} /> },
    ],
  },
  { kind: 'leaf',  id: 'reports',    label: 'Reports',         icon: <BarChart2 size={18} /> },
  { kind: 'leaf',  id: 'settings',   label: 'Settings',        icon: <Settings size={18} /> },
];

// Child pages that belong to each group (for active-parent detection)
const groupChildren: Record<string, Page[]> = {
  'appointments-group':  ['appointments', 'medical-certificates'],
  'consultations-group': [
    'consultations', 'non-consultations', 'telemedicine',
    'new-consultation', 'new-consultation-tab', 'new-non-consultation-tab', 'convert-consultation-tab',
  ],
  'inventory-group': ['inventory', 'purchase-receipts'],
};

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
  const username = authService.getUsername() || 'Staff';
  const displayRole = roles.length > 0 ? roles.join(', ') : 'Staff';

  // Auto-open the group that contains currentPage
  const activeGroup = Object.entries(groupChildren).find(([, pages]) => pages.includes(currentPage))?.[0] ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
  }, [activeGroup]);

  useEffect(() => {
    if (window.innerWidth < 768) setCollapsed(true);
  }, []);

  const isLeafActive = (id: Page) =>
    currentPage === id ||
    (id === 'patients' && ['patient-profile', 'patient-form'].includes(currentPage));

  const isGroupActive = (groupId: string) =>
    (groupChildren[groupId] ?? []).includes(currentPage);

  const toggleGroup = (groupId: string) => {
    setOpenGroup(prev => (prev === groupId ? null : groupId));
  };

  const renderLeaf = (item: NavLeaf, indent = false) => {
    const active = isLeafActive(item.id);
    return (
      <button
        key={item.id}
        onClick={() => {
          onNavigate(item.id);
          if (window.innerWidth < 768) setCollapsed(true);
        }}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3 text-left relative transition-all group ${indent && !collapsed ? 'pl-10 pr-4 py-2' : 'px-4 py-2.5'}`}
        style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
      >
        {active && (
          <span
            className="absolute inset-0"
            style={{ background: 'rgba(255,255,255,0.12)', borderRight: '3px solid #F4C542' }}
          />
        )}
        <span className="relative flex-shrink-0">{item.icon}</span>
        {!collapsed && <span className="relative text-sm font-medium truncate flex-1">{item.label}</span>}
      </button>
    );
  };

  const renderGroup = (item: NavGroup) => {
    const gActive = isGroupActive(item.id);
    const isOpen  = openGroup === item.id;
    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (collapsed) { setCollapsed(false); setOpenGroup(item.id); }
            else toggleGroup(item.id);
          }}
          title={collapsed ? item.label : undefined}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left relative transition-all group"
          style={{ color: gActive ? '#fff' : 'rgba(255,255,255,0.6)' }}
        >
          {gActive && !isOpen && (
            <span
              className="absolute inset-0"
              style={{ background: 'rgba(255,255,255,0.12)', borderRight: '3px solid #F4C542' }}
            />
          )}
          <span className="relative flex-shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="relative text-sm font-medium truncate flex-1">{item.label}</span>
              <ChevronDown
                size={14}
                className="relative flex-shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.7 }}
              />
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {isOpen && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="border-l border-white/10 ml-6 my-0.5">
                {item.children.map(child => renderLeaf(child, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

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
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
        className={`flex flex-col flex-shrink-0 transition-all duration-300 fixed md:relative inset-y-0 left-0 z-50 md:z-auto border-r ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        style={{
          width: collapsed ? 64 : 248,
          background: 'linear-gradient(180deg, #0d213f 0%, #122e56 25%, #183e6f 55%, #1e518d 80%, #2465ad 100%)',
          borderColor: 'rgba(147, 197, 253, 0.25)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        }}
      >
        {/* Brand */}
        <div
          className={`relative z-10 flex items-center flex-shrink-0 ${collapsed ? 'justify-center' : 'px-5 gap-3'}`}
          style={{ borderBottom: '1px solid rgba(147, 197, 253, 0.2)', height: '88px' }}
        >
          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: collapsed ? '40px' : '44px', height: '44px' }}>
            <img
              src={curaLogoMain}
              alt="CURA"
              className="absolute object-contain transition-transform duration-500"
              style={{
                height: collapsed ? '80px' : '115px',
                width: 'auto',
                maxWidth: 'none',
                transform: 'translateY(4px)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(4px) scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(4px) scale(1)')}
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0 flex flex-col justify-center">
              <span
                className="text-[34px] font-black tracking-tighter leading-none"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 45%, #ffffff 55%, #bfdbfe 100%)',
                  backgroundSize: '100% 300%',
                  animation: 'liquidText 5s ease-in-out infinite',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                CURA
              </span>
            </div>
          )}
        </div>

        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] left-[-20%] w-[140px] h-[140px] rounded-full bg-white/[0.04] blur-2xl animate-[blob1_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[160px] h-[160px] rounded-full bg-sky-300/[0.05] blur-2xl animate-[blob2_10s_ease-in-out_infinite]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 py-3 overflow-y-auto hide-scrollbar space-y-0.5">
          {navItems.map(item =>
            item.kind === 'leaf' ? renderLeaf(item) : renderGroup(item)
          )}
        </nav>

        {/* UA Seal + Sign Out */}
        <div className="relative z-10 flex-shrink-0 p-3 space-y-3" style={{ borderTop: '1px solid rgba(147, 197, 253, 0.2)' }}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 pb-1">
              <img src={uaLogo} alt="UA Logo" className="w-10 h-10 object-contain opacity-80" />
              <span className="text-[11px] leading-tight opacity-70 text-white font-semibold uppercase tracking-wide">
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
          className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 flex-shrink-0 relative overflow-hidden transition-colors duration-300 text-card-foreground"
          style={{
            background: 'var(--header-bg)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Animated blobs */}
          <style>{`
            @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-10px) scale(1.1)} 66%{transform:translate(-10px,15px) scale(0.95)} }
            @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,10px) scale(0.9)} 66%{transform:translate(15px,-15px) scale(1.1)} }
            @keyframes liquidText { 0%,100%{background-position: 0% 0%} 50%{background-position: 0% 100%} }
          `}</style>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-30px] left-[15%] w-[160px] h-[160px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-white/50 dark:bg-white/10 animate-[blob1_7s_ease-in-out_infinite]" />
            <div className="absolute top-[-20px] right-[20%] w-[130px] h-[130px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-white/40 dark:bg-white/5 animate-[blob2_9s_ease-in-out_infinite]" />
            <div className="absolute top-[-10px] left-[60%] w-[100px] h-[100px] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-white/60 dark:bg-white/10 animate-[blob1_11s_ease-in-out_infinite_reverse]" />
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          {headerSearchComponent}

          <div className="hidden sm:block sm:flex-1" />

          {/* Notification bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
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
          <div className="flex items-center gap-3 pl-3 border-l z-10" style={{ borderColor: 'rgba(147, 197, 253, 0.4)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-foreground uppercase">{username}</div>
              <div className="text-xs text-primary font-medium">{displayRole}</div>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25, ease: 'easeOut' }}
          className="flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </motion.main>
      </div>
    </motion.div>
  );
}
