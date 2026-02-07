'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users,
    FileText,
    Calendar,
    Plus,
    Edit,
    Trash2,
    X,
    CheckCircle,
    Shield,
    AlertTriangle,
    Loader2,
    UserPlus,
    Clock,
    Eye,
    Phone,
    Mail,
    Building,
    MapPin,
    Image,
    MessageSquare,
    Upload,
    Terminal
} from 'lucide-react';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    is_admin: boolean;
    // Profile fields
    sex?: string;
    pob?: string;
    dob?: string;
    age?: number;
    religion?: string;
    phone?: string;
    address1?: string;
    nik?: string;
    npwp?: string;
    education_level?: string;
    institution?: string;
    major?: string;
    graduation_year?: number;
    bank_account?: string;
    status_ptkp?: string;
    photo_url?: string;
    branch_id?: string | number;
    jabatan?: string;
    show_in_directory?: boolean;
}

interface School {
    id: string;
    name: string;
    level: string;
    address: string;
}

interface Employee {
    id: number;
    name: string;
    center: string;
    roles: string;
    email?: string;
    phone?: string;
    photo_url?: string;
    branch_id?: number;
}

interface Branch {
    id: string;
    name: string;
    region: string;
}

interface PendingRequest {
    id: number;
    type: 'work_permit' | 'delete_attendance';
    user_name: string;
    date: string;
    reason: string;
    status: string;
}

interface Stats {
    total_users: number;
    total_employees: number;
    total_attendance: number;
    total_work_permits: number;
    pending_permits: number;
}

interface AdminLog {
    id: string;
    timestamp: string;
    type: string;
    message: string;
    user_name?: string;
    details?: string;
}

type TabType = 'overview' | 'users' | 'employees' | 'branches' | 'schools' | 'reviews' | 'logs';

const REGIONS = ['Jabodetabek', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Bali', 'Sumatera', 'Online'];

export default function AdminPage() {
    const { token, isAdmin, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [requestToReject, setRequestToReject] = useState<PendingRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [logSearch, setLogSearch] = useState('');
    const [logTypeFilter, setLogTypeFilter] = useState<string>('all');

    const [userFormData, setUserFormData] = useState({
        email: '', password: '', name: '', role: 'staff', is_admin: false,
        // Employee profile fields
        sex: '', pob: '', dob: '', age: 0, religion: '', phone: '', address1: '',
        nik: '', npwp: '', education_level: '', institution: '', major: '', graduation_year: 0,
        bank_account: '', status_ptkp: '', photo_url: '', branch_id: '' as string | number, jabatan: '',
        show_in_directory: true
    });

    const [employeeFormData, setEmployeeFormData] = useState({
        name: '', center: '', roles: '', email: '', phone: '', photo_url: '', branch_id: '' as string | number
    });

    const [branchFormData, setBranchFormData] = useState({
        name: '', region: 'Jabodetabek'
    });

    const [schoolFormData, setSchoolFormData] = useState({
        name: '', address: ''
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
            return;
        }
        if (token && isAdmin) fetchData();
    }, [token, isAdmin, authLoading]);

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch users
            const usersRes = await fetch(`${API_BASE_URL}/admin/users`, { headers });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(Array.isArray(usersData) ? usersData : []);
            }

            // Fetch stats
            const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch employees
            const employeesRes = await fetch(`${API_BASE_URL}/employees`, { headers });
            if (employeesRes.ok) {
                const employeesData = await employeesRes.json();
                setEmployees(Array.isArray(employeesData) ? employeesData : []);
            }

            // Fetch pending requests
            const requestsRes = await fetch(`${API_BASE_URL}/admin/requests`, { headers });
            if (requestsRes.ok) {
                const requestsData = await requestsRes.json();
                setPendingRequests(Array.isArray(requestsData) ? requestsData : []);
            }

            // Fetch branches
            const branchesRes = await fetch(`${API_BASE_URL}/admin/branches`, { headers });
            if (branchesRes.ok) {
                const branchesData = await branchesRes.json();
                setBranches(Array.isArray(branchesData) ? branchesData : []);
            }

            // Fetch schools
            const schoolsRes = await fetch(`${API_BASE_URL}/admin/schools`, { headers });
            if (schoolsRes.ok) {
                const schoolsData = await schoolsRes.json();
                setSchools(Array.isArray(schoolsData) ? schoolsData : []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setToast({ message: 'Format foto tidak didukung. Gunakan PNG, JPG, atau JPEG', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        // Validate file size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            setToast({ message: 'Ukuran foto maksimal 3MB', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setPhotoFile(file);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Convert photo to base64 if uploaded
            let photoBase64 = userFormData.photo_url;
            if (photoFile) {
                const reader = new FileReader();
                photoBase64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(photoFile);
                });
            }

            const formDataToSend = { ...userFormData, photo_url: photoBase64 };
            const url = editingUser ? `${API_BASE_URL}/admin/users/${editingUser.id}` : `${API_BASE_URL}/admin/users`;
            const res = await fetch(url, {
                method: editingUser ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editingUser && !userFormData.password ? { ...formDataToSend, password: undefined } : formDataToSend)
            });
            if (res.ok) {
                setToast({ message: editingUser ? 'User berhasil diupdate!' : 'User berhasil dibuat!', type: 'success' });
                setShowUserModal(false);
                setEditingUser(null);
                setPhotoFile(null);
                fetchData();
            } else {
                setToast({ message: 'Gagal menyimpan user', type: 'error' });
            }
        } catch { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
        finally { setSubmitting(false); setTimeout(() => setToast(null), 3000); }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Yakin ingin menghapus user ini?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setToast({ message: 'User berhasil dihapus!', type: 'success' });
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                setToast({ message: data.error || 'Gagal menghapus user', type: 'error' });
            }
        } catch { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
        setTimeout(() => setToast(null), 3000);
    };

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            if (editingBranch) {
                // Call API to update branch
                const res = await fetch(`${API_BASE_URL}/admin/branches/${editingBranch.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(branchFormData)
                });
                if (res.ok) {
                    setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...branchFormData } : b));
                    setToast({ message: 'Branch berhasil diupdate!', type: 'success' });
                } else {
                    setToast({ message: 'Gagal mengupdate branch', type: 'error' });
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/admin/branches`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(branchFormData)
                });
                if (res.ok) {
                    setToast({ message: 'Branch berhasil ditambahkan!', type: 'success' });
                    fetchData();
                } else {
                    setToast({ message: 'Gagal menambahkan branch', type: 'error' });
                }
            }
        } catch {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        }
        setShowBranchModal(false);
        setEditingBranch(null);
        setBranchFormData({ name: '', region: 'Jabodetabek' });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSchoolSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            if (editingSchool) {
                const res = await fetch(`${API_BASE_URL}/admin/schools/${editingSchool.id}`, {
                    method: 'PUT', headers, body: JSON.stringify(schoolFormData)
                });
                if (res.ok) {
                    setSchools(prev => prev.map(s => s.id === editingSchool.id ? { ...s, ...schoolFormData } : s));
                    setToast({ message: 'School berhasil diupdate!', type: 'success' });
                } else {
                    setToast({ message: 'Gagal mengupdate school', type: 'error' });
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/admin/schools`, {
                    method: 'POST', headers, body: JSON.stringify(schoolFormData)
                });
                if (res.ok) {
                    setToast({ message: 'School berhasil ditambahkan!', type: 'success' });
                    fetchData();
                } else {
                    setToast({ message: 'Gagal menambahkan school', type: 'error' });
                }
            }
        } catch { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
        setShowSchoolModal(false);
        setEditingSchool(null);
        setSchoolFormData({ name: '', address: '' });
        setTimeout(() => setToast(null), 3000);
    };

    const toggleDirectoryVisibility = async (user: User) => {
        try {
            const newStatus = !user.show_in_directory;
            const res = await fetch(`${API_BASE_URL}/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...user, show_in_directory: newStatus })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, show_in_directory: newStatus } : u));
                setToast({ message: `User ${newStatus ? 'ditampilkan di' : 'disembunyikan dari'} direktori`, type: 'success' });
            } else {
                setToast({ message: 'Gagal mengupdate status direktori', type: 'error' });
            }
        } catch {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        }
        setTimeout(() => setToast(null), 3000);
    };

    const handleEmployeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/admin/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(employeeFormData)
            });
            if (res.ok) {
                setToast({ message: 'Employee berhasil ditambahkan!', type: 'success' });
                fetchData();
            } else {
                setToast({ message: 'Gagal menambahkan employee', type: 'error' });
            }
        } catch {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        }
        setShowEmployeeModal(false);
        setTimeout(() => setToast(null), 3000);
    };

    const handleApproveRequest = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/requests/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPendingRequests(prev => prev.filter(r => r.id !== id));
                setToast({ message: 'Request disetujui!', type: 'success' });
            } else {
                setToast({ message: 'Gagal menyetujui request', type: 'error' });
            }
        } catch {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        }
        setTimeout(() => setToast(null), 3000);
    };

    const openRejectModal = (req: PendingRequest) => {
        setRequestToReject(req);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) {
            setToast({ message: 'Alasan penolakan harus diisi', type: 'error' });
            return;
        }
        if (requestToReject) {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/requests/${requestToReject.id}/reject`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ reason: rejectReason })
                });
                if (res.ok) {
                    setPendingRequests(prev => prev.filter(r => r.id !== requestToReject.id));
                    setToast({ message: 'Request ditolak. Notifikasi terkirim.', type: 'success' });
                } else {
                    setToast({ message: 'Gagal menolak request', type: 'error' });
                }
            } catch {
                setToast({ message: 'Terjadi kesalahan', type: 'error' });
            }
        }
        setShowRejectModal(false);
        setRejectReason('');
        setTimeout(() => setToast(null), 3000);
    };

    const groupedBranches = REGIONS.map(region => ({
        region,
        branches: branches.filter(b => b.region === region)
    })).filter(g => g.branches.length > 0);

    if (authLoading || loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 spinner" /></div>;
    }
    if (!isAdmin) return null;

    const statCards = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'from-violet-500 to-purple-600', href: '#users' },
        { label: 'Branches', value: branches.length, icon: Building, color: 'from-emerald-500 to-teal-600', href: '#branches' },
        { label: 'Attendance', value: stats?.total_attendance || 0, icon: Calendar, color: 'from-amber-500 to-orange-600', href: '/attendance' },
        { label: 'Schools', value: schools.length, icon: Building, color: 'from-blue-500 to-indigo-600', href: '#schools' },
        { label: 'Pending', value: pendingRequests.length, icon: Clock, color: 'from-rose-500 to-pink-600', href: '#reviews' },
    ];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'branches', label: 'Branches', icon: MapPin },
        { id: 'schools', label: 'Schools', icon: Building },
        { id: 'reviews', label: 'Reviews', icon: Clock, badge: pendingRequests.length > 0 ? pendingRequests.length : undefined },
        { id: 'logs', label: 'Logs', icon: Terminal },
    ];

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 toast p-4 flex items-center gap-3 animate-fade-in-up ${toast.type === 'success' ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                    <span className="text-white">{toast.message}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-8 h-8 text-amber-400" /> Admin Panel
                    </h1>
                    <p className="text-slate-400 mt-1">Kelola users, employees, branches, dan review requests</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <button key={stat.label} onClick={() => stat.href.startsWith('#') ? setActiveTab(stat.href.slice(1) as TabType) : router.push(stat.href)}
                            className="glass-card p-4 text-left hover:scale-105 transition-transform animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-slate-400">{stat.label}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge && tab.badge > 0 && <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-500 text-white">{tab.badge}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-violet-400" /> Recent Users
                        </h3>
                        <div className="space-y-3">
                            {users.slice(0, 5).map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">{u.name.charAt(0)}</div>
                                        <div><p className="text-white text-sm font-medium">{u.name}</p><p className="text-slate-400 text-xs">{u.role}</p></div>
                                    </div>
                                    {u.is_admin && <span className="badge badge-warning text-xs">Admin</span>}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setActiveTab('users')} className="w-full mt-4 text-violet-400 hover:text-violet-300 text-sm">View All →</button>
                    </div>
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400" /> Pending Reviews
                        </h3>
                        {pendingRequests.length === 0 ? (
                            <p className="text-slate-400 text-center py-4">Tidak ada request pending</p>
                        ) : pendingRequests.slice(0, 3).map(req => (
                            <div key={req.id} className="p-3 rounded-lg bg-white/5 border border-amber-500/20 mb-2">
                                <span className={`badge ${req.type === 'work_permit' ? 'badge-warning' : 'badge-error'} text-xs`}>{req.type === 'work_permit' ? 'Izin' : 'Hapus'}</span>
                                <p className="text-white text-sm mt-1">{req.user_name}</p>
                            </div>
                        ))}
                        {pendingRequests.length > 0 && <button onClick={() => setActiveTab('reviews')} className="w-full mt-4 text-amber-400 hover:text-amber-300 text-sm">View All →</button>}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-violet-400" /> User Management</h2>
                        <button onClick={() => { setEditingUser(null); setUserFormData({ email: '', password: '', name: '', role: 'staff', is_admin: false, sex: '', pob: '', dob: '', age: 0, religion: '', phone: '', address1: '', nik: '', npwp: '', education_level: '', institution: '', major: '', graduation_year: 0, bank_account: '', status_ptkp: '', photo_url: '', branch_id: '', jabatan: '', show_in_directory: true }); setShowUserModal(true); }} className="btn-gradient flex items-center gap-2 text-sm py-2">
                            <Plus className="w-4 h-4" /> Tambah User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-modern">
                            <thead><tr className="text-left"><th className="px-6 py-4">ID</th><th className="px-6 py-4">Nama</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Admin</th><th className="px-6 py-4">Aksi</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-4 text-slate-400">{u.id}</td>
                                        <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                                        <td className="px-6 py-4 text-slate-300">{u.email}</td>
                                        <td className="px-6 py-4"><span className="badge badge-info capitalize">{u.role}</span></td>
                                        <td className="px-6 py-4">{u.is_admin ? <span className="badge badge-warning">Admin</span> : '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleDirectoryVisibility(u)} className={`p-2 rounded-lg ${u.show_in_directory !== false ? 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30' : 'bg-slate-600/20 text-slate-400 hover:bg-slate-600/30'}`} title={u.show_in_directory !== false ? "Sembunyikan dari Direktori" : "Tampilkan di Direktori"}>
                                                    {u.show_in_directory !== false ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-50" />}
                                                </button>
                                                <button onClick={() => {
                                                    setEditingUser(u);
                                                    setUserFormData({
                                                        email: u.email || '',
                                                        password: '',
                                                        name: u.name || '',
                                                        role: u.role || 'staff',
                                                        is_admin: u.is_admin || false,
                                                        sex: u.sex || '',
                                                        pob: u.pob || '',
                                                        dob: u.dob || '',
                                                        age: u.age || 0,
                                                        religion: u.religion || '',
                                                        phone: u.phone || '',
                                                        address1: u.address1 || '',
                                                        nik: u.nik || '',
                                                        npwp: u.npwp || '',
                                                        education_level: u.education_level || '',
                                                        institution: u.institution || '',
                                                        major: u.major || '',
                                                        graduation_year: u.graduation_year || 0,
                                                        bank_account: u.bank_account || '',
                                                        status_ptkp: u.status_ptkp || '',
                                                        photo_url: u.photo_url || '',
                                                        branch_id: String(u.branch_id || ''),
                                                        jabatan: u.jabatan || '',
                                                        show_in_directory: u.show_in_directory !== undefined ? u.show_in_directory : true
                                                    });
                                                    setPhotoFile(null);
                                                    setShowUserModal(true);
                                                }} className="p-2 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Building className="w-5 h-5 text-cyan-400" /> Employee Directory</h2>
                        <button onClick={() => { setEditingEmployee(null); setEmployeeFormData({ name: '', center: '', roles: '', email: '', phone: '', photo_url: '', branch_id: '' }); setShowEmployeeModal(true); }} className="btn-gradient flex items-center gap-2 text-sm py-2">
                            <UserPlus className="w-4 h-4" /> Tambah Employee
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-modern">
                            <thead><tr className="text-left"><th className="px-6 py-4">Photo</th><th className="px-6 py-4">Nama</th><th className="px-6 py-4">Branch</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Aksi</th></tr></thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-4">
                                            {emp.photo_url ? (
                                                <img src={emp.photo_url} alt={emp.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">{emp.name.charAt(0)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{emp.name}</td>
                                        <td className="px-6 py-4 text-slate-300">{emp.center}</td>
                                        <td className="px-6 py-4 text-violet-400 text-sm">{emp.roles}</td>
                                        <td className="px-6 py-4"><div className="flex gap-2">{emp.email && <Mail className="w-4 h-4 text-violet-400" />}{emp.phone && <Phone className="w-4 h-4 text-cyan-400" />}</div></td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="p-2 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"><Edit className="w-4 h-4" /></button>
                                                <button className="p-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Branches Tab */}
            {activeTab === 'branches' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400" /> Branch Management</h2>
                        <button onClick={() => { setEditingBranch(null); setBranchFormData({ name: '', region: 'Jabodetabek' }); setShowBranchModal(true); }} className="btn-gradient flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tambah Branch
                        </button>
                    </div>
                    {groupedBranches.map(group => (
                        <div key={group.region} className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-cyan-400" /> {group.region}
                                <span className="text-sm font-normal text-slate-400">({group.branches.length} branch)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.branches.map(branch => (
                                    <div key={branch.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{branch.name}</p>
                                                <p className="text-xs text-slate-400">{branch.region}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditingBranch(branch); setBranchFormData({ name: branch.name, region: branch.region }); setShowBranchModal(true); }} className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"><Edit className="w-3 h-3" /></button>
                                                <button onClick={async () => {
                                                    if (!confirm('Yakin ingin menghapus branch ini?')) return;
                                                    try {
                                                        const res = await fetch(`${API_BASE_URL}/admin/branches/${branch.id}`, {
                                                            method: 'DELETE',
                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                        });
                                                        if (res.ok) {
                                                            setBranches(prev => prev.filter(b => b.id !== branch.id));
                                                            setToast({ message: 'Branch berhasil dihapus!', type: 'success' });
                                                        } else {
                                                            const data = await res.json().catch(() => ({}));
                                                            setToast({ message: data.error || 'Gagal menghapus branch', type: 'error' });
                                                        }
                                                    } catch { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
                                                    setTimeout(() => setToast(null), 3000);
                                                }} className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Schools Tab */}
            {activeTab === 'schools' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Building className="w-5 h-5 text-blue-400" /> School Management</h2>
                        <button onClick={() => { setEditingSchool(null); setSchoolFormData({ name: '', address: '' }); setShowSchoolModal(true); }} className="btn-gradient flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tambah School
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schools.map(school => (
                            <div key={school.id} className="glass-card p-5 relative group">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingSchool(school); setSchoolFormData({ name: school.name, address: school.address }); setShowSchoolModal(true); }} className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"><Edit className="w-3 h-3" /></button>
                                    <button onClick={async () => {
                                        if (!confirm('Yakin ingin menghapus school ini?')) return;
                                        try {
                                            const headers = { 'Authorization': `Bearer ${token}` };
                                            const res = await fetch(`${API_BASE_URL}/admin/schools/${school.id}`, { method: 'DELETE', headers });
                                            if (res.ok) {
                                                setSchools(prev => prev.filter(s => s.id !== school.id));
                                                setToast({ message: 'School berhasil dihapus!', type: 'success' });
                                            } else {
                                                setToast({ message: 'Gagal menghapus school', type: 'error' });
                                            }
                                        } catch { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
                                    }} className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">{school.level}</div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{school.name}</h3>
                                        <p className="text-slate-400 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {school.address || 'No address'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-400" /> Pending Requests</h2>
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-12"><CheckCircle className="w-16 h-16 mx-auto text-emerald-400/50 mb-4" /><p className="text-slate-400">Semua request sudah diproses!</p></div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-4 rounded-xl bg-white/5 border border-amber-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`badge ${req.type === 'work_permit' ? 'badge-warning' : 'badge-error'}`}>{req.type === 'work_permit' ? 'Izin Kerja' : 'Hapus Absen'}</span>
                                            <span className="text-white font-medium">{req.user_name}</span>
                                        </div>
                                        <span className="text-sm text-slate-500">{req.date}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm mb-4">{req.reason}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApproveRequest(req.id)} className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Approve</button>
                                        <button onClick={() => openRejectModal(req)} className="flex-1 py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2"><X className="w-4 h-4" /> Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-cyan-400" /> System Logs
                        </h2>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${API_BASE_URL}/admin/logs`, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setLogs(Array.isArray(data) ? data : []);
                                    }
                                } catch (error) {
                                    console.error('Error fetching logs:', error);
                                }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 flex items-center gap-2 text-sm"
                        >
                            <Clock className="w-4 h-4" /> Refresh
                        </button>
                    </div>

                    {/* Filter and Search Controls */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Cari log (user, pesan...)"
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="input-modern w-full px-3 py-2 text-sm"
                            />
                        </div>
                        <select
                            value={logTypeFilter}
                            onChange={(e) => setLogTypeFilter(e.target.value)}
                            className="input-modern px-3 py-2 text-sm min-w-[140px]"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="success">✅ Success</option>
                            <option value="warning">⚠️ Warning</option>
                            <option value="error">❌ Error</option>
                            <option value="info">ℹ️ Info</option>
                        </select>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto font-mono text-sm">
                            {(() => {
                                const filteredLogs = logs.filter(log => {
                                    const matchesSearch = logSearch === '' ||
                                        (log.message?.toLowerCase().includes(logSearch.toLowerCase()) ||
                                            log.user_name?.toLowerCase().includes(logSearch.toLowerCase()) ||
                                            log.timestamp?.toLowerCase().includes(logSearch.toLowerCase()) ||
                                            log.details?.toLowerCase().includes(logSearch.toLowerCase()));
                                    const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
                                    return matchesSearch && matchesType;
                                });

                                if (logs.length === 0) {
                                    return (
                                        <div className="text-center py-12">
                                            <Terminal className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                            <p className="text-slate-400">Belum ada log. Klik Refresh untuk memuat log terbaru.</p>
                                            <p className="text-slate-500 text-xs mt-2">Logs akan menampilkan aktivitas sistem seperti login, attendance, dan approval requests.</p>
                                        </div>
                                    );
                                }

                                if (filteredLogs.length === 0) {
                                    return (
                                        <div className="text-center py-12">
                                            <Terminal className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                            <p className="text-slate-400">Tidak ada log yang cocok dengan filter.</p>
                                            <p className="text-slate-500 text-xs mt-2">Coba ubah kata kunci atau filter tipe log.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="px-4 py-2 bg-slate-800/50 border-b border-white/10 text-xs text-slate-400">
                                            Menampilkan {filteredLogs.length} dari {logs.length} log
                                        </div>
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-slate-800">
                                                <tr className="text-left border-b border-white/10">
                                                    <th className="px-4 py-3 text-xs text-slate-400 font-medium">Waktu</th>
                                                    <th className="px-4 py-3 text-xs text-slate-400 font-medium">Tipe</th>
                                                    <th className="px-4 py-3 text-xs text-slate-400 font-medium">User</th>
                                                    <th className="px-4 py-3 text-xs text-slate-400 font-medium">Pesan</th>
                                                    <th className="px-4 py-3 text-xs text-slate-400 font-medium">Detail</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLogs.map((log, index) => (
                                                    <tr key={log.id || index} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-0.5 text-xs rounded ${log.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
                                                                log.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                                                    log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        'bg-cyan-500/20 text-cyan-400'
                                                                }`}>
                                                                {log.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-violet-400">{log.user_name || '-'}</td>
                                                        <td className="px-4 py-2 text-slate-300">{log.message}</td>
                                                        <td className="px-4 py-2">
                                                            {log.details ? (
                                                                <span className="text-xs text-slate-500 max-w-[200px] truncate block" title={log.details}>
                                                                    {log.details}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-600">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <p className="text-cyan-400 text-sm">💡 <strong>Tip:</strong> Gunakan search untuk mencari log berdasarkan user atau pesan. Filter berdasarkan tipe untuk melihat success, warning, error, atau info saja.</p>
                    </div>
                </div>
            )}

            {/* User Modal - Now includes all employee profile fields since User = Employee */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{editingUser ? 'Edit User/Employee' : 'Tambah User/Employee'}</h2>
                            <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            {/* Account Info */}
                            <h3 className="text-sm font-semibold text-violet-400 border-b border-violet-500/30 pb-2">Informasi Akun</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">Email *</label><input type="email" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} className="input-modern w-full" required /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Password {editingUser && '(kosongkan jika tidak diubah)'}</label><input type="password" value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} className="input-modern w-full" required={!editingUser} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">Nama Lengkap *</label><input type="text" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} className="input-modern w-full" required /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Role</label><select value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })} className="input-modern w-full"><option value="staff">Staff</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
                            </div>
                            <div><label className="block text-sm text-slate-400 mb-2">Branch *</label>
                                <select value={userFormData.branch_id} onChange={e => setUserFormData({ ...userFormData, branch_id: e.target.value })} className="input-modern w-full" required>
                                    <option value="">-- Pilih Branch --</option>
                                    {groupedBranches.map(g => (
                                        <optgroup key={g.region} label={g.region}>
                                            {g.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={userFormData.is_admin} onChange={e => setUserFormData({ ...userFormData, is_admin: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-slate-300">Admin Access</span></label>
                            <div><label className="block text-sm text-slate-400 mb-2 mt-2">Jabatan</label><input type="text" value={userFormData.jabatan || ''} onChange={e => setUserFormData({ ...userFormData, jabatan: e.target.value })} className="input-modern w-full" placeholder="Contoh: Assistant Coach, Teacher, dll" /></div>

                            {/* Personal Info */}
                            <h3 className="text-sm font-semibold text-cyan-400 border-b border-cyan-500/30 pb-2 pt-4">Data Pribadi</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">Jenis Kelamin</label><select value={userFormData.sex || ''} onChange={e => setUserFormData({ ...userFormData, sex: e.target.value })} className="input-modern w-full"><option value="">--</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Tempat Lahir</label><input type="text" value={userFormData.pob || ''} onChange={e => setUserFormData({ ...userFormData, pob: e.target.value })} className="input-modern w-full" /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Tanggal Lahir</label><input type="date" value={userFormData.dob || ''} onChange={e => setUserFormData({ ...userFormData, dob: e.target.value })} className="input-modern w-full" /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">Umur</label><input type="number" value={userFormData.age || ''} onChange={e => setUserFormData({ ...userFormData, age: Number(e.target.value) })} className="input-modern w-full" /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Agama</label><select value={userFormData.religion || ''} onChange={e => setUserFormData({ ...userFormData, religion: e.target.value })} className="input-modern w-full"><option value="">--</option><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option></select></div>
                                <div><label className="block text-sm text-slate-400 mb-2">No. HP/WA</label><input type="tel" value={userFormData.phone || ''} onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })} className="input-modern w-full" placeholder="6281xxx" /></div>
                            </div>
                            <div><label className="block text-sm text-slate-400 mb-2">Alamat</label><input type="text" value={userFormData.address1 || ''} onChange={e => setUserFormData({ ...userFormData, address1: e.target.value })} className="input-modern w-full" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">NIK</label><input type="text" value={userFormData.nik || ''} onChange={e => setUserFormData({ ...userFormData, nik: e.target.value })} className="input-modern w-full" /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">NPWP</label><input type="text" value={userFormData.npwp || ''} onChange={e => setUserFormData({ ...userFormData, npwp: e.target.value })} className="input-modern w-full" /></div>
                            </div>

                            {/* Education */}
                            <h3 className="text-sm font-semibold text-emerald-400 border-b border-emerald-500/30 pb-2 pt-4">Pendidikan Terakhir</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">Jenjang</label><select value={userFormData.education_level || ''} onChange={e => setUserFormData({ ...userFormData, education_level: e.target.value })} className="input-modern w-full"><option value="">--</option><option value="SMA/SMK">SMA/SMK</option><option value="D3">D3</option><option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option></select></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Institusi</label><input type="text" value={userFormData.institution || ''} onChange={e => setUserFormData({ ...userFormData, institution: e.target.value })} className="input-modern w-full" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">Jurusan</label><input type="text" value={userFormData.major || ''} onChange={e => setUserFormData({ ...userFormData, major: e.target.value })} className="input-modern w-full" /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Tahun Lulus</label><input type="number" value={userFormData.graduation_year || ''} onChange={e => setUserFormData({ ...userFormData, graduation_year: Number(e.target.value) })} className="input-modern w-full" /></div>
                            </div>

                            {/* Financial */}
                            <h3 className="text-sm font-semibold text-amber-400 border-b border-amber-500/30 pb-2 pt-4">Data Keuangan</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-400 mb-2">No. Rekening</label><input type="text" value={userFormData.bank_account || ''} onChange={e => setUserFormData({ ...userFormData, bank_account: e.target.value })} className="input-modern w-full" /></div>
                                <div><label className="block text-sm text-slate-400 mb-2">Status PTKP</label><select value={userFormData.status_ptkp || ''} onChange={e => setUserFormData({ ...userFormData, status_ptkp: e.target.value })} className="input-modern w-full"><option value="">--</option><option value="TK/0">TK/0</option><option value="K/0">K/0</option><option value="K/1">K/1</option><option value="K/2">K/2</option><option value="K/3">K/3</option></select></div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Foto Profil</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handlePhotoChange}
                                        accept=".png,.jpg,.jpeg"
                                        className="hidden"
                                        id="user-photo-input"
                                    />
                                    <label
                                        htmlFor="user-photo-input"
                                        className="input-modern w-full flex items-center gap-2 cursor-pointer hover:border-violet-500/50"
                                    >
                                        <Upload className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-400 truncate">
                                            {photoFile ? photoFile.name : (userFormData.photo_url ? 'Foto sudah ada (klik untuk ganti)' : 'Pilih foto...')}
                                        </span>
                                    </label>
                                    {(photoFile || userFormData.photo_url) && (
                                        <button
                                            type="button"
                                            onClick={() => { setPhotoFile(null); setUserFormData({ ...userFormData, photo_url: '' }); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Format: PNG, JPG, JPEG | Max: 3MB</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300">Batal</button>
                                <button type="submit" disabled={submitting} className="flex-1 btn-gradient flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Simpan</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Employee Modal */}
            {showEmployeeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Tambah Employee</h2>
                            <button onClick={() => setShowEmployeeModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                            <div><label className="block text-sm text-slate-400 mb-2">Nama *</label><input type="text" value={employeeFormData.name} onChange={e => setEmployeeFormData({ ...employeeFormData, name: e.target.value })} className="input-modern w-full" required /></div>
                            <div><label className="block text-sm text-slate-400 mb-2">Branch *</label>
                                <select value={employeeFormData.branch_id} onChange={e => setEmployeeFormData({ ...employeeFormData, branch_id: e.target.value })} className="input-modern w-full" required>
                                    <option value="">-- Pilih Branch --</option>
                                    {groupedBranches.map(g => (
                                        <optgroup key={g.region} label={g.region}>
                                            {g.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div><label className="block text-sm text-slate-400 mb-2">Role *</label><input type="text" value={employeeFormData.roles} onChange={e => setEmployeeFormData({ ...employeeFormData, roles: e.target.value })} className="input-modern w-full" placeholder="Coding Instructor" required /></div>
                            <div><label className="block text-sm text-slate-400 mb-2">Email</label><input type="email" value={employeeFormData.email} onChange={e => setEmployeeFormData({ ...employeeFormData, email: e.target.value })} className="input-modern w-full" /></div>
                            <div><label className="block text-sm text-slate-400 mb-2">No. WA</label><input type="tel" value={employeeFormData.phone} onChange={e => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })} className="input-modern w-full" placeholder="6281234567890" /></div>
                            <div><label className="block text-sm text-slate-400 mb-2 flex items-center gap-2"><Image className="w-4 h-4" /> Photo URL</label><input type="url" value={employeeFormData.photo_url} onChange={e => setEmployeeFormData({ ...employeeFormData, photo_url: e.target.value })} className="input-modern w-full" placeholder="https://..." /></div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300">Batal</button>
                                <button type="submit" className="flex-1 btn-gradient flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Branch Modal */}
            {showBranchModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{editingBranch ? 'Edit Branch' : 'Tambah Branch'}</h2>
                            <button onClick={() => setShowBranchModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleBranchSubmit} className="space-y-4">
                            <div><label className="block text-sm text-slate-400 mb-2">Nama Branch *</label><input type="text" value={branchFormData.name} onChange={e => setBranchFormData({ ...branchFormData, name: e.target.value })} className="input-modern w-full" placeholder="KK Nama Cabang" required /></div>
                            <div><label className="block text-sm text-slate-400 mb-2">Region *</label>
                                <select value={branchFormData.region} onChange={e => setBranchFormData({ ...branchFormData, region: e.target.value })} className="input-modern w-full" required>
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300">Batal</button>
                                <button type="submit" className="flex-1 btn-gradient flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* School Modal */}
            {showSchoolModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{editingSchool ? 'Edit School' : 'Tambah School'}</h2>
                            <button onClick={() => setShowSchoolModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSchoolSubmit} className="space-y-4">
                            <div><label className="block text-sm text-slate-400 mb-2">Nama Sekolah *</label><input type="text" value={schoolFormData.name} onChange={e => setSchoolFormData({ ...schoolFormData, name: e.target.value })} className="input-modern w-full" placeholder="KK School Name" required /></div>
                            <div><label className="block text-sm text-slate-400 mb-2">Alamat</label><textarea value={schoolFormData.address} onChange={e => setSchoolFormData({ ...schoolFormData, address: e.target.value })} className="input-modern w-full resize-none" rows={3} placeholder="Alamat lengkap..." /></div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowSchoolModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300">Batal</button>
                                <button type="submit" className="flex-1 btn-gradient flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && requestToReject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-rose-400" /> Alasan Penolakan</h2>
                            <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                            <p className="text-rose-400 text-sm">Request dari <strong>{requestToReject.user_name}</strong> - {requestToReject.reason}</p>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm text-slate-400 mb-2">Alasan <span className="text-rose-400">*</span></label>
                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="input-modern w-full resize-none" placeholder="Jelaskan alasan penolakan..." required />
                            <p className="text-xs text-slate-500 mt-1">Akan dikirim ke staff yang bersangkutan.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300">Batal</button>
                            <button onClick={submitReject} className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2"><X className="w-4 h-4" /> Tolak</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
