'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Users,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
  Eye,
  Palmtree,
  Settings,
  X,
  Plus,
  Award,
  Trash2
} from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
}

interface AttendanceRecord {
  id: number;
  date: string;
  session: string;
  status: string;
  activity_type: string;
  activity_categories: string[];
  activity_details: string;
}

interface CalendarEvent {
  id: string;
  date: string;
  type: 'holiday' | 'meeting' | 'event';
  title: string;
}

interface PendingRequest {
  id: number;
  type: 'work_permit' | 'delete_attendance';
  user_name: string;
  date: string;
  reason: string;
}

interface AwardItem {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  date: string;
}

interface LeaveOnPerson {
  user_name: string;
  date: string;
  leave_type: string;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function HomePage() {
  const { token, user, isAdmin } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({ date: '', type: 'event', title: '' });

  const isManager = user?.role === 'manager';
  const isManagerOrAdmin = isManager || isAdmin;

  // Leave quota from backend
  const [leaveQuota, setLeaveQuota] = useState({ total: 12, used: 0, remaining: 12 });
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  // Awards and leave list
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [leaveList, setLeaveList] = useState<LeaveOnPerson[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; branch_id?: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [showAddAwardModal, setShowAddAwardModal] = useState(false);
  const [newAward, setNewAward] = useState({ user_id: '', user_name: '', title: '' });
  const [awardBranchFilter, setAwardBranchFilter] = useState('');

  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch announcements
        const annRes = await fetch(`${API_BASE_URL}/announcements`, { headers });
        if (annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(Array.isArray(annData) ? annData : []);
        }

        // Fetch attendance
        const attRes = await fetch(`${API_BASE_URL}/attendance`, { headers });
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendance(Array.isArray(attData) ? attData : []);
        }

        // Fetch leave quota
        const quotaRes = await fetch(`${API_BASE_URL}/leave-quota`, { headers });
        if (quotaRes.ok) {
          const quotaData = await quotaRes.json();
          setLeaveQuota(quotaData);
        }

        // Fetch pending requests for managers/admins
        if (isManagerOrAdmin) {
          const reqRes = await fetch(`${API_BASE_URL}/admin/requests`, { headers });
          if (reqRes.ok) {
            const reqData = await reqRes.json();
            setPendingRequests(Array.isArray(reqData) ? reqData : []);
          }
        }

        // Fetch calendar events
        const evtRes = await fetch(`${API_BASE_URL}/calendar-events`, { headers });
        if (evtRes.ok) {
          const evtData = await evtRes.json();
          setCalendarEvents(Array.isArray(evtData) ? evtData : []);
        }

        // Fetch awards
        const awardsRes = await fetch(`${API_BASE_URL}/awards`, { headers });
        if (awardsRes.ok) {
          const awardsData = await awardsRes.json();
          setAwards(Array.isArray(awardsData) ? awardsData : []);
        }

        // Fetch employees for award selection
        const empRes = await fetch(`${API_BASE_URL}/employees`, { headers });
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(Array.isArray(empData) ? empData.map((e: { id: string; name: string; branch_id?: string }) => ({ id: e.id, name: e.name, branch_id: e.branch_id })) : []);
        }

        // Fetch branches for award filter
        const branchRes = await fetch(`${API_BASE_URL}/branches`, { headers });
        if (branchRes.ok) {
          const branchData = await branchRes.json();
          setBranches(Array.isArray(branchData) ? branchData : []);
        }

        // Fetch approved leaves from all work permits (for all users to see who's on leave)
        try {
          const recapRes = await fetch(`${API_BASE_URL}/attendance-recap`, { headers });
          if (recapRes.ok) {
            const recapData = await recapRes.json();
            const today = new Date().toISOString().split('T')[0];
            const leaves = Array.isArray(recapData)
              ? recapData
                .filter((r: { status: string; date: string }) => (r.status === 'ijin' || r.status === 'sakit') && r.date >= today)
                .map((r: { user_name: string; date: string; activity_type: string }) => ({
                  user_name: r.user_name,
                  date: r.date,
                  leave_type: r.activity_type
                }))
              : [];
            setLeaveList(leaves);
          }
        } catch {
          // Ignore error for non-admin users who may not have access
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Realtime polling for pending requests every 20 seconds
    const pollInterval = setInterval(() => {
      if (isManagerOrAdmin && token) {
        fetch(`${API_BASE_URL}/admin/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setPendingRequests(data);
            }
          })
          .catch(() => { });
      }
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [token, isManagerOrAdmin]);

  // Calendar logic
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(e => e.date === dateStr);
  };

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthlyAttendance = attendance.filter(a => a.date.startsWith(currentMonthStr));

  const isToday = (day: number) => day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();

  const getEventColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-rose-500';
      case 'meeting': return 'bg-cyan-500';
      case 'event': return 'bg-amber-500';
      default: return 'bg-violet-500';
    }
  };

  const formatCategories = (categories: string[]) => Array.isArray(categories) ? categories.join(', ') : '-';

  const handleAttendanceRowClick = (att: AttendanceRecord) => {
    setSelectedAttendance(att);
    setShowAttendanceModal(true);
  };

  const goToAttendancePage = () => {
    setShowAttendanceModal(false);
    router.push('/attendance');
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newAnnouncement)
      });
      if (res.ok) {
        const created = await res.json();
        setAnnouncements([...announcements, created]);
        setShowAddAnnouncementModal(false);
        setNewAnnouncement({ title: '', content: '' });
      }
    } catch (error) {
      console.error('Error adding announcement:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: number | string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements(announcements.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.date || !newEvent.title) {
      alert('Judul dan tanggal wajib diisi');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/calendar-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        const created = await res.json();
        setCalendarEvents([...calendarEvents, created]);
        setShowAddEventModal(false);
        setNewEvent({ date: '', type: 'event', title: '' });
      } else {
        const err = await res.text();
        console.error('Error response:', err);
        alert('Gagal menambah event: ' + err);
      }
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Gagal menambah event: ' + error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Yakin ingin menghapus event ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/calendar-events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCalendarEvents(calendarEvents.filter(e => e.id !== eventId));
      } else {
        alert('Gagal menghapus event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleAddAward = async () => {
    if (!newAward.user_id || !newAward.title) {
      alert('Pilih karyawan dan isi jenis award');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/awards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newAward)
      });
      if (res.ok) {
        const created = await res.json();
        setAwards([...awards, created]);
        setShowAddAwardModal(false);
        setNewAward({ user_id: '', user_name: '', title: '' });
      } else {
        alert('Gagal menambah award');
      }
    } catch (error) {
      console.error('Error adding award:', error);
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/awards/${awardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAwards(awards.filter(a => a.id !== awardId));
      } else {
        console.error('Failed to delete award:', res.status);
      }
    } catch (error) {
      console.error('Error deleting award:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-violet-400" />
            Selamat Datang, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-400 mt-1">Dashboard HR Information System</p>
        </div>
        <Link href="/attendance" className="btn-gradient flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" /> Absen Sekarang
        </Link>
      </div>

      {/* Today's Events Notification */}
      {(() => {
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayEvents = calendarEvents.filter(e => e.date === todayStr);
        if (todayEvents.length === 0) return null;
        return (
          <div className="glass-card p-4 border-cyan-500/50 bg-cyan-500/10 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-cyan-400 font-medium flex items-center gap-2">
                  📅 Reminder Hari Ini
                </p>
                <div className="mt-2 space-y-1">
                  {todayEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${event.type === 'meeting' ? 'bg-cyan-400' : event.type === 'holiday' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                      <span className="text-white">{event.title}</span>
                      <span className="text-slate-500 text-xs capitalize">({event.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Absensi Bulan Ini */}
        <div className="glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Absensi Bulan Ini</p>
              <p className="text-3xl font-bold text-white mt-1">{monthlyAttendance.length}</p>
              <p className="text-xs text-slate-500 mt-1">{MONTHS[today.getMonth()]} {today.getFullYear()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Sisa Cuti */}
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Sisa Cuti</p>
              <p className="text-3xl font-bold text-white mt-1">
                {leaveQuota.remaining} <span className="text-lg text-slate-400">/ {leaveQuota.total}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Terpakai: {leaveQuota.used} hari</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Palmtree className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${(leaveQuota.remaining / leaveQuota.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Admin/Manager: Leave Management OR Staff: Request Cuti */}
        {isManagerOrAdmin ? (
          <Link href="/admin" className="glass-card p-5 animate-fade-in-up hover:scale-105 transition-transform" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Kelola Jatah Cuti</p>
                <p className="text-lg font-bold text-amber-400 mt-1">Admin Panel →</p>
                <p className="text-xs text-slate-500 mt-1">Atur cuti karyawan</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Settings className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/work-permit" className="glass-card p-5 animate-fade-in-up hover:scale-105 transition-transform" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ajukan Izin/Cuti</p>
                <p className="text-lg font-bold text-violet-400 mt-1">Request Izin →</p>
                <p className="text-xs text-slate-500 mt-1">Klik untuk mengajukan</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-violet-400" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Pending Requests for Managers/Admins */}
      {isManagerOrAdmin && pendingRequests.length > 0 && (
        <div className="glass-card p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Requests
              <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white">{pendingRequests.length}</span>
            </h2>
            <Link href="/manager" className="text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
              Review All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pendingRequests.slice(0, 3).map(req => (
              <div key={req.id} className="p-3 rounded-lg bg-white/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge text-xs ${req.type === 'work_permit' ? 'badge-warning' : 'badge-error'}`}>
                    {req.type === 'work_permit' ? 'Izin' : 'Hapus'}
                  </span>
                  <span className="text-xs text-slate-500">{req.date}</span>
                </div>
                <p className="text-white text-sm font-medium">{req.user_name}</p>
                <p className="text-slate-400 text-xs">{req.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Absensi Terakhir */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-cyan-400" />
              Absensi Terakhir
            </h2>
            <Link href="/attendance" className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-modern">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada data absensi</td></tr>
                ) : (
                  attendance.slice(0, 5).map((att) => (
                    <tr key={att.id} className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleAttendanceRowClick(att)}>
                      <td className="px-4 py-3 text-slate-300">{att.date}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${att.status === 'present' ? 'badge-success' : att.status === 'ijin' ? 'badge-warning' : att.status === 'sakit' ? 'badge-info' : 'badge-error'} capitalize`}>{att.status}</span>
                      </td>
                      <td className="px-4 py-3 text-violet-400 text-sm">{formatCategories(att.activity_categories)}</td>
                      <td className="px-4 py-3"><Eye className="w-4 h-4 text-slate-500" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Public Calendar */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" /> Kalender
            </h2>
            {isManagerOrAdmin && (
              <button onClick={() => setShowAddEventModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors">
                <Plus className="w-4 h-4" /> Tambah Event
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); } else setCalendarMonth(calendarMonth - 1); }} className="p-1 hover:bg-white/10 rounded transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-sm text-slate-300 font-medium">{MONTHS[calendarMonth]} {calendarYear}</span>
            <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); } else setCalendarMonth(calendarMonth + 1); }} className="p-1 hover:bg-white/10 rounded transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map(day => <div key={day} className="text-center text-[10px] font-medium text-slate-500 py-1">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              const events = day ? getEventsForDay(day) : [];
              return (
                <div key={index} className={`min-h-[32px] p-1 rounded text-center relative ${day ? 'hover:bg-white/5' : ''} ${isToday(day as number) ? 'bg-violet-600/30 ring-1 ring-violet-500' : ''}`} title={events.map(e => e.title).join(', ')}>
                  {day && (
                    <>
                      <span className={`text-xs ${isToday(day) ? 'text-violet-300 font-bold' : 'text-slate-400'}`}>{day}</span>
                      {events.length > 0 && <div className="flex justify-center gap-0.5 mt-0.5">{events.map((e, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e.type)}`} />)}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-white/10 flex-wrap">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-slate-400">Holiday</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-[10px] text-slate-400">Meeting</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] text-slate-400">Event</span></div>
          </div>

          {/* Event List with Delete for Admin/Manager */}
          {calendarEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 space-y-2 max-h-32 overflow-y-auto">
              <p className="text-xs text-slate-500 font-medium">Daftar Event:</p>
              {calendarEvents.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)}`} />
                    <span className="text-xs text-slate-300">{event.title}</span>
                    <span className="text-[10px] text-slate-500">{event.date}</span>
                  </div>
                  {isManagerOrAdmin && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300"
                      title="Hapus Event"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" /> Pengumuman
          </h2>
          <div className="flex items-center gap-2">
            {isManagerOrAdmin && (
              <button onClick={() => setShowAddAnnouncementModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            )}
            <span className="badge badge-info">{announcements.length} aktif</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Tidak ada pengumuman</p>
            </div>
          ) : announcements.map(ann => (
            <div
              key={ann.id}
              className="relative p-4 rounded-xl bg-gradient-to-r from-violet-900/30 to-transparent border border-violet-500/20 hover:border-violet-500/40 transition-all group"
            >
              {isManagerOrAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(ann.id); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 z-10"
                  title="Hapus pengumuman"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div onClick={() => setSelectedAnnouncement(ann)} className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{ann.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-violet-400 mt-2">Klik untuk detail →</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave List & Awards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* People on Leave Today - Visible to all users */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Palmtree className="w-5 h-5 text-cyan-400" />
              Sedang Izin/Cuti
            </h2>
            <span className="badge badge-info">{leaveList.length} orang</span>
          </div>
          {leaveList.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Palmtree className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada yang sedang cuti</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {leaveList.map((leave, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-cyan-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                      {leave.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{leave.user_name}</p>
                      <p className="text-xs text-slate-400">{leave.leave_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-cyan-400">{leave.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Awards */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Penghargaan
            </h2>
            <div className="flex items-center gap-2">
              {isManagerOrAdmin && (
                <button onClick={() => setShowAddAwardModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors">
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              )}
              <span className="badge badge-warning">{awards.length} award</span>
            </div>
          </div>
          {awards.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada penghargaan</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Name</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-3 py-2">Award</th>
                    {isManagerOrAdmin && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {awards.slice(0, 10).map((award) => (
                    <tr key={award.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="text-sm text-slate-300 px-3 py-2">{award.user_name}</td>
                      <td className="text-sm text-amber-400 text-right px-3 py-2">{award.title}</td>
                      {isManagerOrAdmin && (
                        <td className="px-2 py-2">
                          <button onClick={() => handleDeleteAward(award.id)} className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300" title="Hapus">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Removed Izin Kerja */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Absen', href: '/attendance', icon: CalendarIcon, color: 'from-violet-500 to-purple-600' },
          { label: 'Ajukan Izin', href: '/work-permit', icon: FileText, color: 'from-amber-500 to-orange-600' },
          { label: 'Direktori', href: '/directory', icon: Users, color: 'from-emerald-500 to-teal-600' },
        ].map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className="glass-card p-5 flex flex-col items-center gap-3 hover:scale-105 transition-transform group">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Attendance Detail Modal */}
      {showAttendanceModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" /> Detail Absensi
              </h2>
              <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div><label className="text-sm text-slate-500">Tanggal</label><div className="input-modern mt-1">{selectedAttendance.date}</div></div>
              <div><label className="text-sm text-slate-500">Status</label><div className="mt-1"><span className={`badge ${selectedAttendance.status === 'present' ? 'badge-success' : 'badge-warning'} capitalize`}>{selectedAttendance.status}</span></div></div>
              <div><label className="text-sm text-slate-500">Activity</label><div className="input-modern mt-1">{selectedAttendance.activity_type}: {formatCategories(selectedAttendance.activity_categories)}</div></div>
              <div><label className="text-sm text-slate-500">Details</label><div className="input-modern mt-1 min-h-[60px]">{selectedAttendance.activity_details || '-'}</div></div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAttendanceModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors">Tutup</button>
              <button onClick={goToAttendancePage} className="flex-1 btn-gradient flex items-center justify-center gap-2"><CalendarIcon className="w-4 h-4" /> Buka Absensi</button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-violet-400" /> Pengumuman
              </h2>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/40 to-cyan-900/40 border border-violet-500/30">
                <h3 className="text-lg font-bold text-white mb-3">{selectedAnnouncement.title}</h3>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.content}</p>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => setSelectedAnnouncement(null)} className="w-full btn-gradient">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddAnnouncementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> Tambah Pengumuman
              </h2>
              <button onClick={() => setShowAddAnnouncementModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Judul</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="input-modern w-full"
                  placeholder="Masukkan judul pengumuman"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Konten</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="input-modern w-full min-h-[120px]"
                  placeholder="Masukkan isi pengumuman"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddAnnouncementModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors">Batal</button>
              <button onClick={handleAddAnnouncement} className="flex-1 btn-gradient">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" /> Tambah Event
              </h2>
              <button onClick={() => setShowAddEventModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Judul Event</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input-modern w-full"
                  placeholder="Masukkan judul event"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tanggal</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipe</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="input-modern w-full"
                >
                  <option value="event">Event</option>
                  <option value="meeting">Meeting</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddEventModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors">Batal</button>
              <button onClick={handleAddEvent} className="flex-1 btn-gradient">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Award Modal */}
      {showAddAwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Tambah Penghargaan
              </h2>
              <button onClick={() => setShowAddAwardModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Filter by Branch</label>
                <select
                  value={awardBranchFilter}
                  onChange={(e) => {
                    setAwardBranchFilter(e.target.value);
                    setNewAward({ ...newAward, user_id: '', user_name: '' }); // Reset selection
                  }}
                  className="input-modern w-full"
                >
                  <option value="">-- Semua Branch --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Pilih Karyawan</label>
                <select
                  value={newAward.user_id}
                  onChange={(e) => {
                    const emp = employees.find(em => em.id === e.target.value);
                    setNewAward({ ...newAward, user_id: e.target.value, user_name: emp?.name || '' });
                  }}
                  className="input-modern w-full"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees
                    .filter(emp => !awardBranchFilter || emp.branch_id === awardBranchFilter)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Jenis Award</label>
                <select
                  value={newAward.title}
                  onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                  className="input-modern w-full"
                >
                  <option value="">-- Pilih Award --</option>
                  <option value="The High Flyer">The High Flyer</option>
                  <option value="The High Flyers">The High Flyers</option>
                  <option value="Go That Extra Mile">Go That Extra Mile</option>
                  <option value="The Growth Driver">The Growth Driver</option>
                  <option value="Best Performance">Best Performance</option>
                  <option value="Most Improved">Most Improved</option>
                  <option value="Team Player">Team Player</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddAwardModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors">Batal</button>
              <button onClick={handleAddAward} className="flex-1 btn-gradient">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
