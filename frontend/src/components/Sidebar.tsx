'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { playBellSound, showNotificationToast } from '@/utils/notification';
import { API_BASE_URL } from '@/lib/api';
import {
    Home,
    Calendar,
    FileText,
    Users,
    Bell,
    Settings,
    LogOut,
    Shield,
    Briefcase,
    X,
    Clock,
    Sun,
    Moon,
    Languages
} from 'lucide-react';

const menuItems = [
    { href: '/', labelKey: 'sidebar.dashboard', icon: Home, color: 'from-violet-500 to-purple-600' },
    { href: '/attendance', labelKey: 'sidebar.attendance', icon: Calendar, color: 'from-cyan-500 to-blue-600' },
    { href: '/work-permit', labelKey: 'sidebar.workPermit', icon: FileText, color: 'from-amber-500 to-orange-600' },
    { href: '/directory', labelKey: 'sidebar.directory', icon: Users, color: 'from-emerald-500 to-teal-600' },
];

function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="p-3 rounded-lg bg-white/5 border border-violet-500/20 mt-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-emerald-400" />
                    <div>
                        <p className="text-sm font-medium text-white">Bahasa</p>
                        <p className="text-xs text-slate-400">{language === 'id' ? 'Indonesia' : 'English'}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setLanguage('id')}
                        className={`px-2 py-1 text-xs rounded ${language === 'id' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                    >
                        ID
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-1 text-xs rounded ${language === 'en' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                    >
                        EN
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout, isAdmin, token } = useAuth();
    const { t } = useLanguage();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [pendingCount, setPendingCount] = useState(0);
    const [notifications, setNotifications] = useState<{ id: number; type: string; user_name: string; date: string; reason: string }[]>([]);
    const [staffNotifications, setStaffNotifications] = useState<{ id: string; status: string; type: string; date: string }[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(() => {
        // Initialize from localStorage immediately on first render (client-side only)
        if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('currentUserId');
            if (userId) {
                const saved = localStorage.getItem(`dismissed_notifications_${userId}`);
                if (saved) {
                    try {
                        return new Set(JSON.parse(saved));
                    } catch { /* ignore parse errors */ }
                }
            }
        }
        return new Set();
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const prevPendingCountRef = useRef(-1); // Start at -1 so first fetch doesn't trigger

    // Load theme from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                setIsDarkMode(false);
                document.documentElement.classList.add('light-mode');
            }
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            if (newMode) {
                document.documentElement.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            }
            return newMode;
        });
    };

    const isManager = user?.role === 'manager';
    const isManagerOrAdmin = isManager || isAdmin;

    // Count unread staff notifications
    const unreadStaffCount = staffNotifications.filter(n => !dismissedNotifications.has(n.id)).length;

    // Load dismissed notifications from localStorage when user changes
    useEffect(() => {
        if (user?.id && typeof window !== 'undefined') {
            // Store current user id for next reload
            localStorage.setItem('currentUserId', String(user.id));
            const saved = localStorage.getItem(`dismissed_notifications_${user.id}`);
            if (saved) {
                try {
                    setDismissedNotifications(new Set(JSON.parse(saved)));
                } catch { /* ignore */ }
            } else {
                // Reset if no saved data for this user
                setDismissedNotifications(new Set());
            }
        }
    }, [user?.id]);

    // Save dismissed notifications to localStorage
    useEffect(() => {
        if (user?.id && typeof window !== 'undefined') {
            // Always save, even if empty (to persist clearing all notifications)
            localStorage.setItem(`dismissed_notifications_${user.id}`, JSON.stringify([...dismissedNotifications]));
        }
    }, [dismissedNotifications, user?.id]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Desktop notification reminder for attendance at 18:30
    useEffect(() => {
        if (!token || isManagerOrAdmin) return; // Only for regular staff

        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        const checkAttendanceReminder = async () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // Check if it's 18:30
            if (hours === 18 && minutes === 30) {
                // Check if we already sent reminder today
                const today = now.toISOString().split('T')[0];
                const lastReminderDate = localStorage.getItem('lastAttendanceReminder');

                if (lastReminderDate === today) return; // Already sent today

                try {
                    // Fetch today's attendance
                    const res = await fetch(`${API_BASE_URL}/attendance`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const todayAttendance = Array.isArray(data)
                            ? data.find((att: { date: string; status: string }) => att.date === today)
                            : null;

                        // Skip if user has attendance (present, ijin, or sakit)
                        if (todayAttendance) {
                            const status = todayAttendance.status;
                            if (status === 'present' || status === 'ijin' || status === 'sakit') {
                                return; // User already has valid attendance
                            }
                        }

                        // No attendance found - send reminder
                        localStorage.setItem('lastAttendanceReminder', today);

                        // Show desktop notification
                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                            new Notification('⏰ Reminder Absensi', {
                                body: 'Anda belum melakukan absensi hari ini. Silakan absen sekarang!',
                                icon: '/favicon.ico',
                                tag: 'attendance-reminder'
                            });
                        }

                        // Also show toast notification
                        showNotificationToast('Anda belum absen hari ini! Silakan lakukan absensi.', 'warning');
                    }
                } catch (error) {
                    console.error('Error checking attendance for reminder:', error);
                }
            }
        };

        // Check every minute
        const reminderInterval = setInterval(checkAttendanceReminder, 60000);

        // Also check immediately on mount
        checkAttendanceReminder();

        return () => clearInterval(reminderInterval);
    }, [token, isManagerOrAdmin]);

    // Fetch pending count and notifications for managers/admins
    useEffect(() => {
        const fetchPendingData = () => {
            if (isManagerOrAdmin && token) {
                fetch(`${API_BASE_URL}/admin/requests`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            const newCount = data.length;
                            // Play bell sound when new request arrives (skip first fetch)
                            if (newCount > prevPendingCountRef.current && prevPendingCountRef.current >= 0) {
                                showNotificationToast('Permintaan baru masuk!', 'warning');
                            }
                            prevPendingCountRef.current = newCount;
                            setPendingCount(newCount);
                            setNotifications(data);
                        } else {
                            setPendingCount(0);
                            setNotifications([]);
                        }
                    })
                    .catch(() => {
                        setPendingCount(0);
                        setNotifications([]);
                    });
            }
        };

        fetchPendingData();
        // Refresh every 5 seconds for faster update of notification dot
        const interval = setInterval(fetchPendingData, 5000);
        return () => clearInterval(interval);
    }, [isManagerOrAdmin, token, pathname]);

    // Fetch notifications for staff (approved/rejected requests)
    const prevStaffNotifCountRef = useRef(0);
    useEffect(() => {
        if (!token || isManagerOrAdmin) return;

        const fetchStaffNotifications = () => {
            fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then((data: { id: string; status: string; type: string; date: string }[]) => {
                    if (Array.isArray(data)) {
                        const newCount = data.length;
                        // Show notification when new approval/rejection arrives
                        if (newCount > prevStaffNotifCountRef.current && prevStaffNotifCountRef.current >= 0) {
                            const latest = data[data.length - 1];
                            if (latest) {
                                if (latest.status === 'approved') {
                                    showNotificationToast(`Permintaan ${latest.type === 'work_permit' ? 'izin' : 'hapus absen'} tanggal ${latest.date} telah DISETUJUI!`, 'success');
                                } else if (latest.status === 'rejected') {
                                    showNotificationToast(`Permintaan ${latest.type === 'work_permit' ? 'izin' : 'hapus absen'} tanggal ${latest.date} DITOLAK`, 'warning');
                                }
                            }
                        }
                        prevStaffNotifCountRef.current = newCount;
                        setStaffNotifications(data);
                    }
                })
                .catch(() => { });
        };

        fetchStaffNotifications();
        const interval = setInterval(fetchStaffNotifications, 15000);
        return () => clearInterval(interval);
    }, [token, isManagerOrAdmin]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    };

    return (
        <aside className="fixed left-0 top-0 h-screen glass-card rounded-none border-l-0 border-t-0 border-b-0 flex flex-col transition-all duration-300 z-50 w-72">

            {/* Logo & Brand */}
            <div className="p-6 border-b border-violet-500/20">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-xl font-black text-white">D</span>
                    </div>
                    <div className="animate-fade-in-up">
                        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            DEMO
                        </h1>
                        <p className="text-xs text-slate-400">HR System</p>
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-b border-violet-500/20">
                <div className="flex items-center gap-3">
                    <div className="avatar-ring flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{getInitials(user?.name || '')}</span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full status-online" />
                            <span className="text-xs text-emerald-400 capitalize">{user?.role}</span>
                            {isAdmin && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400">Admin</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Time Display */}
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-900/50 to-cyan-900/50 border border-violet-500/20">
                    <p className="text-2xl font-mono font-bold text-center bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        {formatTime(currentTime)}
                    </p>
                    <p className="text-xs text-center text-slate-400 mt-1">
                        {formatDate(currentTime)}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto">
                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? `bg-gradient-to-r ${item.color} shadow-lg`
                                    : 'hover:bg-white/5'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                )}
                                <Icon className={`w-5 h-5 relative z-10 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                <span className={`text-sm font-medium relative z-10 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                    {t(item.labelKey)}
                                </span>
                                {isActive && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-lg" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Manager Link (for managers and admins) */}
                    {isManagerOrAdmin && (
                        <Link
                            href="/manager"
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${pathname === '/manager'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg'
                                : 'hover:bg-white/5'
                                }`}
                        >
                            <Briefcase className={`w-5 h-5 flex-shrink-0 ${pathname === '/manager' ? 'text-white' : 'text-cyan-400 group-hover:text-cyan-300'}`} />
                            <span className={`text-sm font-medium ${pathname === '/manager' ? 'text-white' : 'text-cyan-400 group-hover:text-cyan-300'}`}>
                                {t('sidebar.managerPanel')}
                            </span>
                            {pendingCount > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 text-xs rounded-full bg-rose-500 text-white">{pendingCount}</span>
                            )}
                        </Link>
                    )}
                    {isManagerOrAdmin && (
                        <Link
                            href="/attendance-recap"
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${pathname === '/attendance-recap'
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 shadow-lg'
                                : 'hover:bg-white/5'
                                }`}
                        >
                            <Calendar className={`w-5 h-5 flex-shrink-0 ${pathname === '/attendance-recap' ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'}`} />
                            <span className={`text-sm font-medium ${pathname === '/attendance-recap' ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'}`}>
                                {t('sidebar.attendanceRecap')}
                            </span>
                        </Link>
                    )}

                    {/* Admin Link */}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${pathname === '/admin'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg'
                                : 'hover:bg-white/5'
                                }`}
                        >
                            <Shield className={`w-5 h-5 flex-shrink-0 ${pathname === '/admin' ? 'text-white' : 'text-amber-400 group-hover:text-amber-300'}`} />
                            <span className={`text-sm font-medium ${pathname === '/admin' ? 'text-white' : 'text-amber-400 group-hover:text-amber-300'}`}>
                                {t('sidebar.adminPanel')}
                            </span>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-violet-500/20 space-y-1 relative">
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <div className="relative">
                        <Bell className="w-5 h-5 flex-shrink-0" />
                        {(isManagerOrAdmin ? pendingCount > 0 : unreadStaffCount > 0) && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                        )}
                    </div>
                    <span className="text-sm">Notifikasi</span>
                    {(isManagerOrAdmin ? pendingCount > 0 : unreadStaffCount > 0) && (
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white">{isManagerOrAdmin ? pendingCount : unreadStaffCount}</span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute bottom-full left-3 right-3 mb-2 glass-card p-4 max-h-80 overflow-y-auto animate-fade-in-up z-50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-violet-400" />
                                Notifikasi
                            </h3>
                            <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/10 rounded">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        {isManagerOrAdmin ? (
                            // Admin/Manager: Show pending requests
                            notifications.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-4">Tidak ada notifikasi</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.map(notif => (
                                        <div key={notif.id} className="p-3 rounded-lg bg-white/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${notif.type === 'work_permit' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {notif.type === 'work_permit' ? 'Izin' : 'Hapus Absen'}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {notif.date}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm font-medium">{notif.user_name}</p>
                                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{notif.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            // Staff: Show approved/rejected requests (sorted newest first, filtered by dismissed)
                            staffNotifications.filter(n => !dismissedNotifications.has(n.id)).length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-4">Tidak ada notifikasi</p>
                            ) : (
                                <div className="space-y-2">
                                    {[...staffNotifications]
                                        .filter(n => !dismissedNotifications.has(n.id))
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(notif => (
                                            <div key={notif.id} className={`p-3 rounded-lg border transition-colors relative ${notif.status === 'approved'
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-rose-500/10 border-rose-500/30'
                                                }`}>
                                                <button
                                                    onClick={() => setDismissedNotifications(prev => new Set([...prev, notif.id]))}
                                                    className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded"
                                                    title="Hapus notifikasi"
                                                >
                                                    <X className="w-3 h-3 text-slate-400" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-1 pr-6">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${notif.status === 'approved'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-rose-500/20 text-rose-400'
                                                        }`}>
                                                        {notif.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {notif.date}
                                                    </span>
                                                </div>
                                                <p className="text-white text-sm">
                                                    {notif.type === 'work_permit' ? 'Permintaan Izin' : 'Hapus Absensi'}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )
                        )}
                        {isManagerOrAdmin && notifications.length > 0 && (
                            <a href="/manager" className="block mt-3 text-center text-sm text-violet-400 hover:text-violet-300">
                                Lihat Semua & Review →
                            </a>
                        )}
                    </div>
                )}
                <button
                    onClick={() => {
                        setShowSettings(!showSettings);
                        setShowNotifications(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{t('sidebar.settings')}</span>
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                    <div className="absolute bottom-full left-3 right-3 mb-2 glass-card p-4 animate-fade-in-up z-50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Settings className="w-4 h-4 text-violet-400" />
                                {t('settings.title')}
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <div className="p-3 rounded-lg bg-white/5 border border-violet-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isDarkMode ? (
                                        <Moon className="w-5 h-5 text-violet-400" />
                                    ) : (
                                        <Sun className="w-5 h-5 text-amber-400" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-white">Mode Tampilan</p>
                                        <p className="text-xs text-slate-400">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-violet-600' : 'bg-amber-500'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center ${isDarkMode ? 'left-1' : 'left-8'
                                        }`}>
                                        {isDarkMode ? (
                                            <Moon className="w-3 h-3 text-violet-600" />
                                        ) : (
                                            <Sun className="w-3 h-3 text-amber-500" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Language Toggle */}
                        <LanguageToggle />
                    </div>
                )}
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{t('sidebar.logout')}</span>
                </button>
            </div>
        </aside>
    );
}
