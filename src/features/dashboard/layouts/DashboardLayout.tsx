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

type NavSection = {
  title?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { kind: 'leaf',  id: 'dashboard',  label: 'Dashboard',       icon: <LayoutDashboard size={20} /> },
      { kind: 'leaf',  id: 'patients',   label: 'Patients',        icon: <Users size={20} /> },
      { kind: 'leaf',  id: 'beds',       label: 'Beds Management', icon: <BedDouble size={20} /> },
    ],
  },
  {
    title: 'Clinical Services',
    items: [
      {
        kind: 'group', id: 'appointments-group', label: 'Appointments', icon: <Calendar size={20} />,
        children: [
          { kind: 'leaf', id: 'appointments',         label: 'Appointments',         icon: <Calendar size={16} /> },
          { kind: 'leaf', id: 'medical-certificates', label: 'Medical Certificates', icon: <FileText size={16} /> },
        ],
      },
      {
        kind: 'group', id: 'consultations-group', label: 'Consultations', icon: <Stethoscope size={20} />,
        children: [
          { kind: 'leaf', id: 'consultations',     label: 'Consultations',    icon: <Stethoscope size={16} /> },
          { kind: 'leaf', id: 'non-consultations', label: 'Non-Consultation', icon: <ClipboardList size={16} /> },
          { kind: 'leaf', id: 'telemedicine',      label: 'Telemedicine',     icon: <Video size={16} /> },
        ],
      },
      {
        kind: 'group', id: 'inventory-group', label: 'Inventory', icon: <Package size={20} />,
        children: [
          { kind: 'leaf', id: 'inventory',         label: 'Inventory',         icon: <Package size={16} /> },
          { kind: 'leaf', id: 'purchase-receipts', label: 'Purchase Receipts', icon: <ShoppingCart size={16} /> },
        ],
      },
    ],
  },
  {
    title: 'System & Reports',
    items: [
      { kind: 'leaf',  id: 'reports',    label: 'Reports',         icon: <BarChart2 size={20} /> },
      { kind: 'leaf',  id: 'settings',   label: 'Settings',        icon: <Settings size={20} /> },
    ],
  },
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
        className={`w-full flex items-center text-left relative transition-all duration-200 rounded-xl group ${
          collapsed
            ? 'justify-center w-11 h-11 mx-auto my-1 p-0'
            : indent
              ? 'gap-3 pl-8 pr-3.5 py-2.5 my-0.5 text-xs'
              : 'gap-3.5 px-3.5 py-3 my-0.5 text-sm font-medium'
        } ${active ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/8'}`}
      >
        {active && (
          <>
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
              }}
            />
            <span
              className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full"
              style={{ backgroundColor: '#F4C542', boxShadow: '0 0 8px rgba(244,197,66,0.6)' }}
            />
          </>
        )}
        <span className="relative flex-shrink-0 flex items-center justify-center">{item.icon}</span>
        {!collapsed && <span className="relative truncate flex-1 tracking-tight">{item.label}</span>}
      </button>
    );
  };

  const renderGroup = (item: NavGroup) => {
    const gActive = isGroupActive(item.id);
    const isOpen  = openGroup === item.id;
    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => {
            if (collapsed) { setCollapsed(false); setOpenGroup(item.id); }
            else toggleGroup(item.id);
          }}
          title={collapsed ? item.label : undefined}
          className={`w-full flex items-center text-left relative transition-all duration-200 rounded-xl group ${
            collapsed
              ? 'justify-center w-11 h-11 mx-auto my-1 p-0'
              : 'gap-3.5 px-3.5 py-3 my-0.5 text-sm font-medium'
          } ${gActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/8'}`}
        >
          {gActive && !isOpen && (
            <>
              <span
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
                }}
              />
              <span
                className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full"
                style={{ backgroundColor: '#F4C542', boxShadow: '0 0 8px rgba(244,197,66,0.6)' }}
              />
            </>
          )}
          <span className="relative flex-shrink-0 flex items-center justify-center">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="relative truncate flex-1 tracking-tight">{item.label}</span>
              <ChevronDown
                size={15}
                className="relative flex-shrink-0 transition-transform duration-200 text-white/60 group-hover:text-white"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
              <div className="border-l-2 border-white/15 ml-5 pl-2 my-1 space-y-1">
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
        className={`flex flex-col flex-shrink-0 transition-all duration-300 fixed md:relative inset-y-0 left-0 z-50 md:z-auto border-r border-blue-200/25 dark:border-sidebar-border shadow-[4px_0_24px_rgba(0,0,0,0.18)] dark:shadow-none bg-[linear-gradient(180deg,#0d213f_0%,#122e56_25%,#183e6f_55%,#1e518d_80%,#2465ad_100%)] dark:bg-none dark:bg-sidebar ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        style={{ width: collapsed ? 64 : 248 }}
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            if (currentPage === 'dashboard') {
              window.location.reload();
            } else {
              window.location.href = '/dashboard';
            }
          }}
          title="Refresh Dashboard"
          className={`relative z-10 flex items-center flex-shrink-0 border-b border-blue-200/20 dark:border-sidebar-border cursor-pointer group text-left w-full transition-colors hover:bg-white/5 active:opacity-80 focus:outline-none ${
            collapsed ? 'justify-center' : 'px-5 gap-3.5'
          }`}
          style={{ height: '72px' }}
        >
          <div className="relative flex items-center justify-center flex-shrink-0">
            <img
              src={curaLogoMain}
              alt="CURA"
              className={`object-contain transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
                collapsed ? 'w-11 h-11' : 'w-12 h-12'
              }`}
              style={{
                filter: 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.4))',
              }}
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0 flex flex-col justify-center">
              <span
                className="text-[34px] font-black tracking-tighter leading-none select-none transition-opacity group-hover:opacity-90"
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
        </button>

        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 dark:hidden">
          <div className="absolute top-[10%] left-[-20%] w-[140px] h-[140px] rounded-full bg-white/[0.04] blur-2xl animate-[blob1_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[160px] h-[160px] rounded-full bg-sky-300/[0.05] blur-2xl animate-[blob2_10s_ease-in-out_infinite]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-4 flex flex-col">
          {navSections.map((section, idx) => (
            <div key={section.title || idx} className="space-y-1">
              {!collapsed && section.title && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-blue-200/50 select-none">
                  {section.title}
                </div>
              )}
              {collapsed && idx > 0 && (
                <div className="border-t border-white/10 my-2 mx-1.5" />
              )}
              <div className="space-y-1">
                {section.items.map(item =>
                  item.kind === 'leaf' ? renderLeaf(item) : renderGroup(item)
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* UA Seal + Sign Out */}
        <div className="relative z-10 flex-shrink-0 p-3 space-y-3 border-t border-blue-200/20 dark:border-sidebar-border">
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
          className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 h-[72px] flex-shrink-0 relative overflow-hidden transition-colors duration-300 text-card-foreground border-b border-gray-200/80 dark:border-border/40"
          style={{
            background: 'var(--header-bg)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          }}
        >
          <style>{`
            @keyframes liquidText { 0%,100%{background-position: 0% 0%} 50%{background-position: 0% 100%} }
          `}</style>



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
