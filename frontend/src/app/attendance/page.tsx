'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import {
    Plus,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    X,
    User,
    MapPin,
    Phone,
    CreditCard,
    GraduationCap,
    FileText,
    Clock,
    Upload,
    Eye,
    Trash2,
    AlertTriangle
} from 'lucide-react';

interface Attendance {
    id: number;
    date: string;
    activity_type: string;
    activity_categories: string[];
    activity_details: string;
    starting_time: string;
    ending_time: string;
    activity_notes: string;
    session: string;
    status: string;
    delete_requested?: boolean;
}

interface Employee {
    name: string;
    sex: string;
    pob: string;
    dob: string;
    age: number;
    religion: string;
    phone: string;
    address1: string;
    nik: string;
    education_level: string;
    bank_account: string;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const ACTIVITY_TYPES = [
    { value: 'Daily Activity', label: 'Daily Activity' },
    { value: 'Event Activity', label: 'Event Activity' },
];

// Categories for Daily Activity
const DAILY_CATEGORIES = [
    { value: 'Regular Class', label: 'Regular Class' },
    { value: 'School Class', label: 'School Class' },
    { value: 'Private Class', label: 'Private Class' },
];

// Categories for Event Activity
const EVENT_CATEGORIES = [
    { value: 'Offline', label: 'Offline' },
    { value: 'Online', label: 'Online' },
];

const SCHOOLS = [
    'SD Negeri 1',
    'SD Negeri 2',
    'SMP Negeri 1',
    'SMP Negeri 2',
    'SMA Negeri 1',
    'SMA Negeri 2',
    'Other'
];

export default function AttendancePage() {
    const { token, user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [dayAttendances, setDayAttendances] = useState<Attendance[]>([]);
    const [deleteReason, setDeleteReason] = useState('');
    const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Calculate max date (today) and min date (2 days ago) - recalculate each render  
    const getDateLimits = () => {
        const now = new Date();
        const maxDate = now.toISOString().split('T')[0];
        const minDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { maxDate, minDate };
    };
    const { maxDate, minDate } = getDateLimits();

    const [formData, setFormData] = useState({
        date: maxDate,
        activity_type: 'Daily Activity',
        activity_categories: [] as string[],
        activity_details: '',
        starting_time: '',
        ending_time: '',
        activity_docs: '',
        activity_notes: '',
        school: ''
    });

    useEffect(() => {
        if (token) {
            fetchAttendance();
            fetchEmployeeProfile();
        }
    }, [token]);

    const fetchEmployeeProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployee(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/attendance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAttendance(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    const hasSchoolClass = formData.activity_categories.includes('School Class');

    const handleCategoryChange = (category: string) => {
        setFormData(prev => ({
            ...prev,
            activity_categories: prev.activity_categories.includes(category)
                ? prev.activity_categories.filter(c => c !== category)
                : [...prev.activity_categories, category]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.activity_details.trim()) {
            setToast({ message: 'Activity Details harus diisi', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        // Notes only required for School Class
        if (hasSchoolClass && !formData.activity_notes.trim()) {
            setToast({ message: 'Activity Notes harus diisi untuk School Class', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        if (hasSchoolClass && !formData.school) {
            setToast({ message: 'Pilih sekolah untuk School Class', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setSubmitting(true);

        try {
            // Append school to activity notes if school class
            const notesWithSchool = hasSchoolClass
                ? `[${formData.school}] ${formData.activity_notes}`
                : formData.activity_notes;

            const res = await fetch(`${API_BASE_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    activity_notes: notesWithSchool
                })
            });

            if (res.ok) {
                setToast({ message: 'Absensi berhasil ditambahkan!', type: 'success' });
                setShowModal(false);
                fetchAttendance();
                setFormData({
                    date: maxDate,
                    activity_type: 'Daily Activity',
                    activity_categories: [],
                    activity_details: '',
                    starting_time: '',
                    ending_time: '',
                    activity_docs: '',
                    activity_notes: '',
                    school: ''
                });
            } else {
                setToast({ message: 'Gagal menambahkan absensi', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleRequestDelete = (att: Attendance) => {
        setAttendanceToDelete(att);
        setDeleteReason('');
        setShowDeleteModal(true);
        setShowDetailModal(false);
    };

    const submitDeleteRequest = async () => {
        if (!deleteReason.trim()) {
            setToast({ message: 'Alasan penghapusan harus diisi', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'delete_attendance',
                    date: attendanceToDelete?.date,
                    reason: deleteReason,
                    details: attendanceToDelete?.activity_type,
                    ref_id: String(attendanceToDelete?.id)
                })
            });

            if (res.ok) {
                setToast({ message: 'Request penghapusan telah dikirim ke atasan', type: 'success' });
            } else {
                setToast({ message: 'Gagal mengirim request', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        }
        setTimeout(() => setToast(null), 3000);
        setShowDeleteModal(false);
        setDeleteReason('');
        setAttendanceToDelete(null);
    };

    // Calendar logic
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const safeAttendance = Array.isArray(attendance) ? attendance : [];

    const getAttendanceForDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return safeAttendance.filter(a => a.date === dateStr);
    };

    const isToday = (day: number) => {
        const now = new Date();
        return day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-emerald-500';
            case 'ijin': return 'bg-amber-500';
            case 'sakit': return 'bg-cyan-500';
            case 'alpha': return 'bg-rose-500';
            default: return 'bg-violet-500';
        }
    };

    const handleDayClick = (day: number) => {
        const dayAtt = getAttendanceForDay(day);
        if (dayAtt.length === 1) {
            setSelectedAttendance(dayAtt[0]);
            setShowDetailModal(true);
        } else if (dayAtt.length > 1) {
            setDayAttendances(dayAtt);
            setShowSelectModal(true);
        }
    };

    const handleSelectAttendance = (att: Attendance) => {
        setSelectedAttendance(att);
        setShowSelectModal(false);
        setShowDetailModal(true);
    };

    const formatCategories = (categories: string[]) => {
        return Array.isArray(categories) ? categories.join(', ') : '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 toast p-4 flex items-center gap-3 animate-fade-in-up ${toast.type === 'success' ? 'border-emerald-500/50' : 'border-rose-500/50'
                    }`}>
                    {toast.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <X className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="text-white">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Absensi Saya</h1>
                    <p className="text-slate-400 mt-1">Kelola kehadiran dan lihat informasi pribadi</p>
                </div>
                <button onClick={() => {
                    // Reset form date to today when opening modal
                    const todayDate = new Date().toISOString().split('T')[0];
                    setFormData(prev => ({ ...prev, date: todayDate }));
                    setShowModal(true);
                }} className="btn-gradient flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Tambah Absensi
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => {
                            if (currentMonth === 0) {
                                setCurrentMonth(11);
                                setCurrentYear(currentYear - 1);
                            } else {
                                setCurrentMonth(currentMonth - 1);
                            }
                        }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <h2 className="text-xl font-bold text-white">
                            {MONTHS[currentMonth]} {currentYear}
                        </h2>
                        <button onClick={() => {
                            if (currentMonth === 11) {
                                setCurrentMonth(0);
                                setCurrentYear(currentYear + 1);
                            } else {
                                setCurrentMonth(currentMonth + 1);
                            }
                        }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            const dayAttendance = day ? getAttendanceForDay(day) : [];
                            const hasData = dayAttendance.length > 0;
                            return (
                                <div
                                    key={index}
                                    onClick={() => day && hasData && handleDayClick(day)}
                                    className={`min-h-[70px] p-2 rounded-lg text-center relative transition-colors ${day ? 'hover:bg-white/5 cursor-pointer' : ''
                                        } ${isToday(day as number) ? 'bg-violet-600/20 ring-1 ring-violet-500' : ''}`}
                                >
                                    {day && (
                                        <>
                                            <span className={`text-sm ${isToday(day) ? 'text-violet-300 font-bold' : 'text-slate-300'}`}>
                                                {day}
                                            </span>
                                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                                                {dayAttendance.map((att, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-2.5 h-2.5 rounded-full ${getStatusColor(att.status)}`}
                                                        title={`${att.status}: ${att.activity_type}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-xs text-slate-400">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-xs text-slate-400">Ijin</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-cyan-500" />
                            <span className="text-xs text-slate-400">Sakit</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-xs text-slate-400">Alpha</span>
                        </div>
                    </div>
                </div>

                {/* Personal Details */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-violet-400" />
                        Informasi Pribadi
                    </h2>

                    <div className="space-y-4">
                        {[
                            { icon: User, label: 'Nama', value: employee?.name || user?.name || '-' },
                            { icon: User, label: 'Jenis Kelamin', value: employee?.sex || '-' },
                            { icon: MapPin, label: 'Tempat Lahir', value: employee?.pob || '-' },
                            { icon: CalendarIcon, label: 'Tanggal Lahir', value: employee?.dob ? `${employee.dob} (${employee.age || '-'} tahun)` : '-' },
                            { icon: User, label: 'Agama', value: employee?.religion || '-' },
                            { icon: Phone, label: 'Telepon', value: employee?.phone || '-' },
                            { icon: MapPin, label: 'Alamat', value: employee?.address1 || '-' },
                            { icon: CreditCard, label: 'NIK', value: employee?.nik || '-' },
                            { icon: GraduationCap, label: 'Pendidikan', value: employee?.education_level || '-' },
                            { icon: CreditCard, label: 'Rekening Bank', value: employee?.bank_account || '-', highlight: true },
                        ].map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                                    <Icon className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500">{item.label}</p>
                                        <p className={`text-sm ${item.highlight ? 'text-violet-400' : 'text-slate-300'} break-words`}>
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            {
                showDetailModal && selectedAttendance && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-cyan-400" />
                                    Event Details
                                </h2>
                                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="mb-4 px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 text-sm font-medium">
                                VIEW
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-500">Date</label>
                                    <div className="input-modern mt-1">{selectedAttendance.date}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500">Detail</label>
                                    <div className="input-modern mt-1">
                                        {selectedAttendance.activity_type}: [{formatCategories(selectedAttendance.activity_categories)}]
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500">Additional Info</label>
                                    <div className="input-modern mt-1 min-h-[80px]">{selectedAttendance.activity_details}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500">Start-End Time</label>
                                    <div className="input-modern mt-1">
                                        {selectedAttendance.starting_time && selectedAttendance.ending_time
                                            ? `${selectedAttendance.starting_time} - ${selectedAttendance.ending_time}`
                                            : '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => handleRequestDelete(selectedAttendance)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Request Delete
                                </button>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Attendance Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-violet-400" />
                                    Form Attendance
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Important Notice */}
                            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                <p className="text-amber-400 text-sm font-medium mb-2">KKHQ branch team is MANDATORY to fill out this form EVERY DAY.</p>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                    <li>The attendance form has functions for tracking team&apos;s DAILY ACTIVITY</li>
                                    <li>Anda hanya bisa mengisi absensi maksimal 2 hari kebelakang</li>
                                </ul>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Row 1: Activity Type & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Activity Type *</label>
                                        <select
                                            value={formData.activity_type}
                                            onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                                            className="input-modern w-full"
                                        >
                                            {ACTIVITY_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Attendance Date * (max 2 hari lalu)</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            min={minDate}
                                            max={maxDate}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="input-modern w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Activity Categories */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Activity Categories * {formData.activity_type === 'Event Activity' && <span className="text-cyan-400">(Event Mode)</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {(formData.activity_type === 'Event Activity' ? EVENT_CATEGORIES : DAILY_CATEGORIES).map(cat => (
                                            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.activity_categories.includes(cat.value)}
                                                    onChange={() => handleCategoryChange(cat.value)}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                                                />
                                                <span className="text-sm text-slate-300">{cat.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* School Selector (shows when School Class is checked) */}
                                {hasSchoolClass && (
                                    <div className="animate-fade-in-up">
                                        <label className="block text-sm text-slate-400 mb-2">Pilih Sekolah *</label>
                                        <select
                                            value={formData.school}
                                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                            className="input-modern w-full"
                                            required
                                        >
                                            <option value="">-- Pilih Sekolah --</option>
                                            {SCHOOLS.map(school => (
                                                <option key={school} value={school}>{school}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Activity Details */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Activity Details *</label>
                                    <div className="mb-2 space-y-1">
                                        <details className="text-xs">
                                            <summary className="text-violet-400 cursor-pointer">Examples for Daily Activity</summary>
                                            <p className="text-slate-500 mt-1 pl-4">Mengajar kelas coding, Meeting dengan tim, dll.</p>
                                        </details>
                                        <details className="text-xs">
                                            <summary className="text-cyan-400 cursor-pointer">Examples for Event Activity</summary>
                                            <p className="text-slate-500 mt-1 pl-4">Workshop, Seminar, Training, dll.</p>
                                        </details>
                                    </div>
                                    <textarea
                                        value={formData.activity_details}
                                        onChange={(e) => setFormData({ ...formData, activity_details: e.target.value })}
                                        rows={3}
                                        className="input-modern w-full resize-none"
                                        placeholder="fill your activity details by following the examples"
                                        required
                                    />
                                </div>

                                {/* Time Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Starting Time (only for Event & Private)
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.starting_time}
                                            onChange={(e) => setFormData({ ...formData, starting_time: e.target.value })}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Ending Time (only for Event & Private)
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.ending_time}
                                            onChange={(e) => setFormData({ ...formData, ending_time: e.target.value })}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                </div>

                                {/* Activity Docs & Notes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Activity Docs/Transport Bill</label>
                                        <div className="input-modern flex items-center gap-2 cursor-pointer hover:border-violet-400/50">
                                            <Upload className="w-4 h-4 text-slate-500" />
                                            <span className="text-slate-500 text-sm">Choose File</span>
                                            <span className="text-slate-600 text-sm ml-auto">No file chosen</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            Activity Notes {hasSchoolClass && <span className="text-rose-400">* (Wajib untuk School Class)</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.activity_notes}
                                            onChange={(e) => setFormData({ ...formData, activity_notes: e.target.value })}
                                            className="input-modern w-full"
                                            placeholder="motor pribadi/mobil pribadi/Grab/nebeng A/Online"
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 btn-gradient flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 spinner" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Submit
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Reason Modal */}
            {
                showDeleteModal && attendanceToDelete && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Trash2 className="w-5 h-5 text-rose-400" />
                                    Request Hapus Absensi
                                </h2>
                                <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                                <p className="text-rose-400 text-sm">
                                    Anda akan mengajukan penghapusan absensi tanggal <strong>{attendanceToDelete.date}</strong>
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-slate-400 mb-2">
                                    Alasan Penghapusan <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    rows={3}
                                    className="input-modern w-full resize-none"
                                    placeholder="Jelaskan alasan mengapa absensi ini perlu dihapus..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitDeleteRequest}
                                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Kirim Request
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Selection Modal for multiple attendances on same day */}
            {
                showSelectModal && dayAttendances.length > 0 && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-violet-400" />
                                    Pilih Absensi
                                </h2>
                                <button onClick={() => setShowSelectModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <p className="text-slate-400 text-sm mb-4">Ada {dayAttendances.length} absensi pada tanggal ini:</p>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {dayAttendances.map((att, index) => (
                                    <button
                                        key={att.id || index}
                                        onClick={() => handleSelectAttendance(att)}
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-violet-400 font-medium">{att.activity_type}</span>
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(att.status)}`} />
                                        </div>
                                        <p className="text-slate-300 text-sm">{formatCategories(att.activity_categories)}</p>
                                        <p className="text-slate-500 text-xs mt-1">{att.activity_details?.substring(0, 50)}...</p>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowSelectModal(false)}
                                className="w-full mt-4 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
