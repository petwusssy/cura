import { useState } from 'react';
import {
  Users, Stethoscope, Package, AlertTriangle, Activity, ChevronRight,
  Search, UserPlus, ShoppingCart, FileText, BarChart2, BedDouble, Clock, Pill
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Patient, Consultation, MedicineItem, AppNotification, Page } from '../types';

const PRIMARY = '#1E5AA8';
const RED = '#D64545';
const YELLOW = '#F4C542';

interface DashboardProps {
  patients: Patient[];
  consultations: Consultation[];
  medicines: MedicineItem[];
  notifications: AppNotification[];
  onNavigate: (page: Page) => void;
  onSelectPatient: (id: string) => void;
}

const timelineData = [
  { time: '08:00', consultations: 2 }, { time: '09:00', consultations: 5 },
  { time: '10:00', consultations: 4 }, { time: '11:00', consultations: 7 },
  { time: '12:00', consultations: 3 }, { time: '13:00', consultations: 6 },
  { time: '14:00', consultations: 8 }, { time: '15:00', consultations: 5 },
  { time: '16:00', consultations: 2 },
];

const monthlyData = [
  { month: 'Jan', consultations: 145 }, { month: 'Feb', consultations: 132 },
  { month: 'Mar', consultations: 168 }, { month: 'Apr', consultations: 155 },
  { month: 'May', consultations: 189 }, { month: 'Jun', consultations: 142 },
];

type DateFilter = 'today' | 'yesterday' | 'week' | 'custom';

export function Dashboard({ patients, consultations, medicines, notifications, onNavigate, onSelectPatient }: DashboardProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const today = '2026-06-27';
  const yesterday = '2026-06-26';

  const filteredConsultations = consultations.filter(c => {
    if (dateFilter === 'today') return c.date === today;
    if (dateFilter === 'yesterday') return c.date === yesterday;
    return true;
  });

  const todayConsultations = filteredConsultations.filter(c => c.status === 'Consultation');
  const todayStudents = filteredConsultations.filter(c => patients.find(p => p.id === c.patientId)?.category === 'Student');
  const todayEmployees = filteredConsultations.filter(c => patients.find(p => p.id === c.patientId)?.category === 'Employee');
  const todayOutsiders = filteredConsultations.filter(c => patients.find(p => p.id === c.patientId)?.category === 'Outsider');
  const dispensed = filteredConsultations.reduce((sum, c) => sum + (c.treatments?.length || 0), 0);
  const lowStock = medicines.filter(m => m.status === 'Low Stock').length;

  const medicationReminders = notifications.filter(n => n.type === 'medication' && !n.read);

  const statCards = [
    { label: 'Total Consultations', value: filteredConsultations.length, color: PRIMARY, icon: <Stethoscope size={22} />, sub: `${todayConsultations.length} with doctor` },
    { label: 'Students', value: todayStudents.length, color: '#1B3A6B', icon: <Users size={22} />, sub: 'today' },
    { label: 'Employees', value: todayEmployees.length, color: '#4CAF50', icon: <Users size={22} />, sub: 'today' },
    { label: 'Outsiders', value: todayOutsiders.length, color: '#9C27B0', icon: <Users size={22} />, sub: 'today' },
    { label: 'Medicines Dispensed', value: dispensed, color: '#00BCD4', icon: <Pill size={22} />, sub: 'treatments today' },
    { label: 'Low Stock Items', value: lowStock, color: RED, icon: <AlertTriangle size={22} />, sub: 'need reorder', alert: true },
  ];

  const quickActions = [
    { label: 'Search Patient', icon: <Search size={20} />, page: 'patients' as Page, color: PRIMARY },
    { label: 'Add Patient', icon: <UserPlus size={20} />, page: 'patient-form' as Page, color: '#4CAF50' },
    { label: 'Inventory', icon: <Package size={20} />, page: 'inventory' as Page, color: '#FF9800' },
    { label: 'Purchase Receipts', icon: <ShoppingCart size={20} />, page: 'purchase-receipts' as Page, color: '#9C27B0' },
    { label: 'Med Certificate', icon: <FileText size={20} />, page: 'medical-certificates' as Page, color: '#00BCD4' },
    { label: 'Reports', icon: <BarChart2 size={20} />, page: 'reports' as Page, color: '#607D8B' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900" style={{ color: '#1a1a2e' }}>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">University of the Assumption Clinic — CURA</p>
        </div>
        {/* Date filter */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 bg-white rounded-xl border border-gray-200 p-1" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {(['today', 'yesterday', 'week', 'custom'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize
                ${dateFilter === f ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
              style={{ background: dateFilter === f ? PRIMARY : 'transparent' }}
            >
              {f === 'week' ? 'This Week' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 flex flex-col gap-2 transition-transform hover:-translate-y-0.5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: card.alert ? `1px solid ${RED}20` : '1px solid #f0f0f0' }}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
              {card.alert && (
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: RED }} />
              )}
            </div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div>
              <div className="text-xs font-semibold text-gray-700 leading-tight">{card.label}</div>
              <div className="text-xs text-gray-400">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-800">Daily Activity Timeline</h3>
              <p className="text-xs text-gray-400 mt-0.5">Consultations per hour</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Activity size={14} /> Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorCon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="consultations" stroke={PRIMARY} strokeWidth={2} fill="url(#colorCon)" dot={{ fill: PRIMARY, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Medication Reminders */}
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${YELLOW}20`, color: '#c49b00' }}>
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-gray-800 text-sm">Medication Reminders</h3>
              <p className="text-xs text-gray-400">Upcoming doses</p>
            </div>
          </div>
          {medicationReminders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No upcoming medication reminders</div>
          ) : (
            <div className="space-y-3">
              {medicationReminders.map(n => (
                <div key={n.id} className="rounded-lg p-3" style={{ background: n.minutesLeft && n.minutesLeft <= 10 ? `${RED}08` : `${YELLOW}10`, border: `1px solid ${n.minutesLeft && n.minutesLeft <= 10 ? RED : YELLOW}30` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{n.patientName}</span>
                    {n.minutesLeft && n.minutesLeft <= 10 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: RED, color: 'white' }}>
                        {n.minutesLeft}m
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Next dose: {n.nextDose}</div>
                  {/* Countdown bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: n.minutesLeft ? `${Math.min(100, (1 - n.minutesLeft / 30) * 100)}%` : '50%',
                        background: n.minutesLeft && n.minutesLeft <= 10 ? RED : YELLOW,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 className="text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.page)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-transparent transition-all hover:shadow-md group"
                style={{ background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${a.color}08`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: `${a.color}15`, color: a.color }}>
                  {a.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800">Recent Activity</h3>
            <button
              onClick={() => onNavigate('consultations')}
              className="text-sm flex items-center gap-1 font-medium hover:opacity-80"
              style={{ color: PRIMARY }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left pb-3 pr-4">Patient</th>
                  <th className="text-left pb-3 pr-4 hidden md:table-cell">Category</th>
                  <th className="text-left pb-3 pr-4">Complaint</th>
                  <th className="text-left pb-3 pr-4 hidden md:table-cell">Time</th>
                  <th className="text-left pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredConsultations.slice(0, 6).map(c => {
                  const patient = patients.find(p => p.id === c.patientId);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => { onSelectPatient(c.patientId); onNavigate('patient-profile'); }}>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: PRIMARY }}>
                            {patient?.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{patient?.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 hidden md:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: patient?.category === 'Student' ? '#E3F2FD' : patient?.category === 'Employee' ? '#E8F5E9' : '#F3E5F5',
                            color: patient?.category === 'Student' ? '#1B3A6B' : patient?.category === 'Employee' ? '#2E7D32' : '#6A1B9A',
                          }}>
                          {patient?.category}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-sm text-gray-600 truncate max-w-[150px]">{c.complaint}</td>
                      <td className="py-2.5 pr-4 text-sm text-gray-500 hidden md:table-cell">{c.timeIn}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Consultation' ? 'text-blue-700 bg-blue-50' : 'text-gray-600 bg-gray-100'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
