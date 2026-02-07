'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
    Calendar,
    Users,
    Download,
    Filter,
    Clock,
    CheckCircle,
    X,
    AlertTriangle,
    FileText,
    ChevronLeft,
    ChevronRight,
    Eye,
    Building,
    MapPin
} from 'lucide-react';

interface AttendanceRecord {
    id: string;
    user_id: string;
    user_name: string;
    date: string;
    session: string;
    status: string;
    activity_type: string;
    check_in: string;
    check_out: string;
    activity_categories?: string[];
    activity_details?: string;
    activity_notes?: string;
    starting_time?: string;
    ending_time?: string;
}

interface AttendanceSummary {
    user_id: string;
    user_name: string;
    total_days: number;
    present: number;
    absent: number;
    ijin: number;
    sakit: number;
    branch_id?: string;
}

interface Branch {
    id: string;
    name: string;
    region: string;
}

interface Employee {
    id: string;
    name: string;
    branch_id?: string;
}

export default function AttendanceRecapPage() {
    const { token, isAdmin, user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [users, setUsers] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [exportEndDate, setExportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [exportUser, setExportUser] = useState('all');
    const [exportBranch, setExportBranch] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState<AttendanceSummary | null>(null);
    const [detailCalendarMonth, setDetailCalendarMonth] = useState(new Date().getMonth());
    const [detailCalendarYear, setDetailCalendarYear] = useState(new Date().getFullYear());
    const [selectedDateAttendance, setSelectedDateAttendance] = useState<AttendanceRecord | null>(null);

    const isManager = user?.role === 'manager';
    const isManagerOrAdmin = isManager || isAdmin;

    useEffect(() => {
        if (!isManagerOrAdmin) {
            router.push('/');
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManagerOrAdmin, token]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Fetch all users for filter dropdown
            const usersRes = await fetch(`${API_BASE_URL}/employees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(Array.isArray(usersData) ? usersData.map((u: Employee) => ({ id: u.id, name: u.name, branch_id: u.branch_id })) : []);
            }

            // Fetch branches
            const branchesRes = await fetch(`${API_BASE_URL}/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (branchesRes.ok) {
                const branchesData = await branchesRes.json();
                setBranches(Array.isArray(branchesData) ? branchesData : []);
            }

            // Fetch all attendance records
            const attendanceRes = await fetch(`${API_BASE_URL}/admin/attendance-recap`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (attendanceRes.ok) {
                const data = await attendanceRes.json();
                setRecords(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get branch name by ID
    const getBranchName = (branchId?: string) => {
        if (!branchId) return '-';
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : '-';
    };

    // Filter records based on date range, user, and branch - use useMemo to prevent recalculation
    const filteredRecords = useMemo(() => {
        // Get user IDs that belong to selected branch
        const branchUserIds = selectedBranch === 'all'
            ? null
            : users.filter(u => u.branch_id === selectedBranch).map(u => u.id);

        return records.filter(r => {
            const recordDate = new Date(r.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            const dateMatch = recordDate >= start && recordDate <= end;
            const userMatch = selectedUser === 'all' || r.user_id === selectedUser;
            const branchMatch = branchUserIds === null || branchUserIds.includes(r.user_id);
            return dateMatch && userMatch && branchMatch;
        });
    }, [records, startDate, endDate, selectedUser, selectedBranch, users]);

    // Calculate summary from filtered records - use useMemo
    const summary = useMemo(() => {
        const userMap = new Map<string, AttendanceSummary>();

        filteredRecords.forEach(r => {
            if (!userMap.has(r.user_id)) {
                userMap.set(r.user_id, {
                    user_id: r.user_id,
                    user_name: r.user_name || 'Unknown',
                    total_days: 0,
                    present: 0,
                    absent: 0,
                    ijin: 0,
                    sakit: 0
                });
            }
            const s = userMap.get(r.user_id)!;
            s.total_days++;
            if (r.status === 'present') s.present++;
            else if (r.status === 'absent' || r.status === 'alpha') s.absent++;
            else if (r.status === 'ijin') s.ijin++;
            else if (r.status === 'sakit') s.sakit++;
        });

        return Array.from(userMap.values());
    }, [filteredRecords]);

    const exportToExcel = () => {
        // Get user IDs for the selected branch
        const branchUserIds = exportBranch === 'all'
            ? null
            : users.filter(u => u.branch_id === exportBranch).map(u => u.id);

        // Filter records based on export settings
        const exportRecords = records.filter(r => {
            const recordDate = new Date(r.date);
            const start = new Date(exportStartDate);
            const end = new Date(exportEndDate);
            const dateMatch = recordDate >= start && recordDate <= end;
            const userMatch = exportUser === 'all' || r.user_id === exportUser;
            const branchMatch = exportBranch === 'all' || (branchUserIds && branchUserIds.includes(r.user_id));
            return dateMatch && userMatch && branchMatch;
        });

        if (exportRecords.length === 0) {
            alert('Tidak ada data untuk diekspor pada periode dan filter yang dipilih');
            return;
        }

        // Prepare data for Excel
        const excelData = exportRecords.map(r => ({
            'Tanggal': r.date,
            'Nama': r.user_name || '',
            'Sesi': r.session || '-',
            'Status': r.status === 'present' ? 'Hadir' : r.status === 'ijin' ? 'Izin' : r.status === 'sakit' ? 'Sakit' : r.status === 'absent' || r.status === 'alpha' ? 'Alpha' : r.status,
            'Tipe Aktivitas': r.activity_type || '-',
            'Kategori': (r.activity_categories || []).join(', '),
            'Detail Aktivitas': r.activity_details || '',
            'Catatan': r.activity_notes || '',
            'Waktu Mulai': r.starting_time || r.check_in || '-',
            'Waktu Selesai': r.ending_time || r.check_out || '-'
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');

        // Auto-size columns
        const columnWidths = [
            { wch: 12 }, // Tanggal
            { wch: 25 }, // Nama
            { wch: 10 }, // Sesi
            { wch: 10 }, // Status
            { wch: 15 }, // Tipe Aktivitas
            { wch: 20 }, // Kategori
            { wch: 35 }, // Detail
            { wch: 25 }, // Catatan
            { wch: 12 }, // Waktu Mulai
            { wch: 12 }, // Waktu Selesai
        ];
        worksheet['!cols'] = columnWidths;

        // Generate descriptive filename
        const userLabel = exportUser === 'all' ? 'Semua_Karyawan' : (users.find(u => u.id === exportUser)?.name?.replace(/\s+/g, '_') || 'Karyawan');
        const filename = `Rekap_Absensi_${userLabel}_${exportStartDate}_sampai_${exportEndDate}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, filename);

        setShowExportModal(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Hadir</span>;
            case 'absent':
            case 'alpha':
                return <span className="badge badge-error flex items-center gap-1"><X className="w-3 h-3" /> Alpha</span>;
            case 'ijin':
                return <span className="badge badge-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Izin</span>;
            case 'sakit':
                return <span className="badge badge-info flex items-center gap-1"><Clock className="w-3 h-3" /> Sakit</span>;
            default:
                return <span className="badge badge-info">{status}</span>;
        }
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Rekap Absensi</h1>
                    <p className="text-slate-400 mt-1">Lihat dan ekspor data kehadiran karyawan</p>
                </div>
                <button onClick={() => setShowExportModal(true)} className="btn-gradient flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Excel
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Filter:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">Dari:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const newStart = e.target.value;
                                setStartDate(newStart);
                                // Auto-adjust endDate if startDate > endDate
                                if (newStart > endDate) {
                                    setEndDate(newStart);
                                }
                            }}
                            className="input-modern px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">Sampai:</label>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => {
                                const newEnd = e.target.value;
                                // Prevent endDate < startDate
                                if (newEnd >= startDate) {
                                    setEndDate(newEnd);
                                }
                            }}
                            className="input-modern px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">Karyawan:</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="input-modern px-3 py-2 text-sm min-w-[180px]"
                        >
                            <option value="all">Semua Karyawan</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-cyan-400" />
                        <label className="text-sm text-slate-400">Branch:</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="input-modern px-3 py-2 text-sm min-w-[180px]"
                        >
                            <option value="all">Semua Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* Monthly Quick Select */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 flex-wrap">
                    <span className="text-sm text-slate-400">Bulan:</span>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'].map((month, index) => {
                        const year = new Date().getFullYear();
                        const monthNum = index + 1;
                        const firstDay = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                        const lastDay = new Date(year, monthNum, 0).toISOString().split('T')[0];
                        const isActive = startDate === firstDay && endDate === lastDay;
                        return (
                            <button
                                key={month}
                                onClick={() => {
                                    setStartDate(firstDay);
                                    setEndDate(lastDay);
                                }}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${isActive
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {month}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{summary.length}</p>
                            <p className="text-xs text-slate-400">Karyawan</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{summary.reduce((acc, s) => acc + s.present, 0)}</p>
                            <p className="text-xs text-slate-400">Total Hadir</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{summary.reduce((acc, s) => acc + s.ijin + s.sakit, 0)}</p>
                            <p className="text-xs text-slate-400">Izin/Sakit</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                            <X className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{summary.reduce((acc, s) => acc + s.absent, 0)}</p>
                            <p className="text-xs text-slate-400">Total Alpha</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-violet-400" />
                        Ringkasan per Karyawan
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full table-modern">
                        <thead>
                            <tr className="text-left">
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4 text-center">Total Hari</th>
                                <th className="px-6 py-4 text-center">Hadir</th>
                                <th className="px-6 py-4 text-center">Izin</th>
                                <th className="px-6 py-4 text-center">Sakit</th>
                                <th className="px-6 py-4 text-center">Alpha</th>
                                <th className="px-6 py-4 text-center">% Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                        <p className="text-slate-400">Tidak ada data absensi dalam periode ini</p>
                                    </td>
                                </tr>
                            ) : (
                                summary.map(s => (
                                    <tr
                                        key={s.user_id}
                                        className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                        onClick={() => { setSelectedEmployee(s); setShowDetailModal(true); }}
                                    >
                                        <td className="px-6 py-4 text-white font-medium">{s.user_name}</td>
                                        <td className="px-6 py-4 text-center text-slate-300">{s.total_days}</td>
                                        <td className="px-6 py-4 text-center"><span className="text-emerald-400 font-bold">{s.present}</span></td>
                                        <td className="px-6 py-4 text-center"><span className="text-amber-400">{s.ijin}</span></td>
                                        <td className="px-6 py-4 text-center"><span className="text-cyan-400">{s.sakit}</span></td>
                                        <td className="px-6 py-4 text-center"><span className="text-rose-400">{s.absent}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold ${s.total_days > 0 ? (s.present / s.total_days >= 0.8 ? 'text-emerald-400' : s.present / s.total_days >= 0.6 ? 'text-amber-400' : 'text-rose-400') : 'text-slate-400'}`}>
                                                {s.total_days > 0 ? Math.round((s.present / s.total_days) * 100) : 0}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Records Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        Log Absensi ({filteredRecords.length} record)
                    </h2>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full table-modern">
                        <thead className="sticky top-0 bg-slate-900">
                            <tr className="text-left">
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4">Sesi</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Check In</th>
                                <th className="px-6 py-4">Check Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                        <p className="text-slate-400">Tidak ada data absensi</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.slice(0, 100).map(r => (
                                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-3 text-slate-300">{r.date}</td>
                                        <td className="px-6 py-3 text-white">{r.user_name}</td>
                                        <td className="px-6 py-3"><span className="badge badge-info">{r.session}</span></td>
                                        <td className="px-6 py-3">{getStatusBadge(r.status)}</td>
                                        <td className="px-6 py-3 text-slate-400">{r.check_in || '-'}</td>
                                        <td className="px-6 py-3 text-slate-400">{r.check_out || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Detail Modal with Calendar */}
            {showDetailModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-violet-400" />
                                Detail Kehadiran
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Employee Info */}
                        <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30 mb-4">
                            <p className="text-lg font-bold text-white">{selectedEmployee.user_name}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                                <span className="text-emerald-400">{selectedEmployee.present} Hadir</span>
                                <span className="text-amber-400">{selectedEmployee.ijin} Izin</span>
                                <span className="text-cyan-400">{selectedEmployee.sakit} Sakit</span>
                                <span className="text-rose-400">{selectedEmployee.absent} Alpha</span>
                            </div>
                        </div>

                        {/* Mini Calendar */}
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <button
                                    onClick={() => {
                                        if (detailCalendarMonth === 0) {
                                            setDetailCalendarMonth(11);
                                            setDetailCalendarYear(detailCalendarYear - 1);
                                        } else {
                                            setDetailCalendarMonth(detailCalendarMonth - 1);
                                        }
                                    }}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                                </button>
                                <span className="text-sm text-slate-300 font-medium">
                                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][detailCalendarMonth]} {detailCalendarYear}
                                </span>
                                <button
                                    onClick={() => {
                                        if (detailCalendarMonth === 11) {
                                            setDetailCalendarMonth(0);
                                            setDetailCalendarYear(detailCalendarYear + 1);
                                        } else {
                                            setDetailCalendarMonth(detailCalendarMonth + 1);
                                        }
                                    }}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                    <div key={day} className="text-center text-[10px] font-medium text-slate-500 py-1">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                    const firstDay = new Date(detailCalendarYear, detailCalendarMonth, 1).getDay();
                                    const daysInMonth = new Date(detailCalendarYear, detailCalendarMonth + 1, 0).getDate();
                                    const days: (number | null)[] = Array(firstDay).fill(null);
                                    for (let i = 1; i <= daysInMonth; i++) days.push(i);
                                    while (days.length < 42) days.push(null);

                                    return days.map((day, index) => {
                                        if (!day) return <div key={index} className="min-h-[32px]" />;

                                        // Find attendance for this day
                                        const dateStr = `${detailCalendarYear}-${String(detailCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const attendance = records.find(r =>
                                            r.user_id === selectedEmployee.user_id && r.date === dateStr
                                        );

                                        const getStatusColor = () => {
                                            if (!attendance) return 'bg-white/5 text-slate-600 hover:bg-white/10';
                                            switch (attendance.status) {
                                                case 'present': return 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/50';
                                                case 'ijin': return 'bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:bg-amber-500/50';
                                                case 'sakit': return 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/50';
                                                case 'absent':
                                                case 'alpha': return 'bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:bg-rose-500/50';
                                                default: return 'bg-white/5 text-slate-400 hover:bg-white/10';
                                            }
                                        };

                                        const isSelected = selectedDateAttendance?.date === dateStr;

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedDateAttendance(attendance || null)}
                                                className={`min-h-[32px] p-1 rounded text-center text-xs cursor-pointer transition-all ${getStatusColor()} ${isSelected ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent' : ''}`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/10">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/50" /><span className="text-[10px] text-slate-400">Hadir</span></div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500/50" /><span className="text-[10px] text-slate-400">Izin</span></div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-cyan-500/50" /><span className="text-[10px] text-slate-400">Sakit</span></div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-rose-500/50" /><span className="text-[10px] text-slate-400">Alpha</span></div>
                            </div>
                        </div>

                        {/* Selected Date Detail */}
                        {selectedDateAttendance && (
                            <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/30 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-violet-400" />
                                        Detail Absensi - {new Date(selectedDateAttendance.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button
                                        onClick={() => setSelectedDateAttendance(null)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>

                                {/* Basic Info Row */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Status</p>
                                        {getStatusBadge(selectedDateAttendance.status)}
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Sesi</p>
                                        <span className="text-white font-medium">{selectedDateAttendance.session || '-'}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Check In</p>
                                        <span className="text-emerald-400 font-medium">{selectedDateAttendance.check_in || '-'}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Check Out</p>
                                        <span className="text-rose-400 font-medium">{selectedDateAttendance.check_out || '-'}</span>
                                    </div>
                                </div>

                                {/* Activity Type & Categories */}
                                {selectedDateAttendance.activity_type && (
                                    <div className="mt-3 p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Tipe Aktivitas</p>
                                        <span className="text-cyan-400 font-medium">{selectedDateAttendance.activity_type}</span>
                                        {selectedDateAttendance.activity_categories && selectedDateAttendance.activity_categories.length > 0 && (
                                            <span className="text-slate-400 ml-2">
                                                [{selectedDateAttendance.activity_categories.join(', ')}]
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Start-End Time (for Event/Private) */}
                                {(selectedDateAttendance.starting_time || selectedDateAttendance.ending_time) && (
                                    <div className="mt-3 p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Waktu Aktivitas</p>
                                        <span className="text-violet-400 font-medium">
                                            {selectedDateAttendance.starting_time || '-'} - {selectedDateAttendance.ending_time || '-'}
                                        </span>
                                    </div>
                                )}

                                {/* Activity Details */}
                                {selectedDateAttendance.activity_details && (
                                    <div className="mt-3 p-2 rounded-lg bg-white/5">
                                        <p className="text-slate-400 text-xs mb-1">Detail Aktivitas</p>
                                        <p className="text-white text-sm whitespace-pre-wrap">{selectedDateAttendance.activity_details}</p>
                                    </div>
                                )}

                                {/* Activity Notes */}
                                {selectedDateAttendance.activity_notes && (
                                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <p className="text-amber-400 text-xs mb-1">Catatan Aktivitas</p>
                                        <p className="text-amber-200 text-sm">{selectedDateAttendance.activity_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => { setShowDetailModal(false); setSelectedDateAttendance(null); }}
                            className="w-full mt-4 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Download className="w-5 h-5 text-emerald-400" />
                                Export Rekap Absensi
                            </h2>
                            <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Date Range */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h3 className="text-sm font-medium text-white mb-3">Rentang Tanggal</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Dari</label>
                                        <input
                                            type="date"
                                            value={exportStartDate}
                                            onChange={(e) => {
                                                const newStart = e.target.value;
                                                setExportStartDate(newStart);
                                                // Auto-adjust exportEndDate if newStart > exportEndDate
                                                if (newStart > exportEndDate) {
                                                    setExportEndDate(newStart);
                                                }
                                            }}
                                            className="input-modern w-full px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Sampai</label>
                                        <input
                                            type="date"
                                            value={exportEndDate}
                                            min={exportStartDate}
                                            onChange={(e) => {
                                                const newEnd = e.target.value;
                                                if (newEnd >= exportStartDate) {
                                                    setExportEndDate(newEnd);
                                                }
                                            }}
                                            className="input-modern w-full px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Employee Filter */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h3 className="text-sm font-medium text-white mb-3">Branch</h3>
                                <select
                                    value={exportBranch}
                                    onChange={(e) => {
                                        setExportBranch(e.target.value);
                                        setExportUser('all'); // Reset user filter when branch changes
                                    }}
                                    className="input-modern w-full px-3 py-2 text-sm"
                                >
                                    <option value="all">Semua Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Karyawan Filter */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h3 className="text-sm font-medium text-white mb-3">Karyawan</h3>
                                <select
                                    value={exportUser}
                                    onChange={(e) => setExportUser(e.target.value)}
                                    className="input-modern w-full px-3 py-2 text-sm"
                                >
                                    <option value="all">Semua Karyawan</option>
                                    {users
                                        .filter(u => exportBranch === 'all' || u.branch_id === exportBranch)
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                </select>
                                {exportBranch !== 'all' && (
                                    <p className="text-xs text-slate-500 mt-2">Filter berdasarkan branch: {branches.find(b => b.id === exportBranch)?.name}</p>
                                )}
                            </div>

                            {/* Preview Info */}
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <p className="text-emerald-400 text-sm">
                                    📊 Data yang akan diekspor: Tanggal, Nama, Sesi, Status, Tipe Aktivitas, Kategori, Detail, Catatan, Waktu Mulai/Selesai
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="flex-1 btn-gradient flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
