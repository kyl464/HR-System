'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import {
    Search,
    Filter,
    Mail,
    Phone,
    Users,
    Building,
    Grid,
    List
} from 'lucide-react';

interface Employee {
    id: number;
    name: string;
    center: string;
    roles: string;
    photo_url: string;
    phone?: string;
    email?: string;
    jabatan?: string;
    branch_id?: string;
}

interface Branch {
    id: string;
    name: string;
    region: string;
}

export default function DirectoryPage() {
    const { token } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (token) {
            fetchEmployees();
            fetchBranches();
        }
    }, [token]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/employees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error('Failed to fetch branches:', res.status);
                return;
            }
            const data = await res.json();
            console.log('Branches loaded:', data?.length || 0);
            setBranches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    };

    const getBranchName = (branchId?: string) => {
        if (!branchId) return '-';
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : '-';
    };

    const safeEmployees = Array.isArray(employees) ? employees : [];

    const filteredEmployees = safeEmployees.filter(emp => {
        const matchesSearch = searchQuery === '' ||
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.roles && emp.roles.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (emp.jabatan && emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesBranch = branchFilter === 'all' || emp.branch_id === branchFilter;
        return matchesSearch && matchesBranch;
    });

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getGradient = (index: number) => {
        const gradients = [
            'from-violet-500 to-purple-600',
            'from-cyan-500 to-blue-600',
            'from-emerald-500 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-pink-500 to-rose-600',
            'from-indigo-500 to-violet-600',
        ];
        return gradients[index % gradients.length];
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
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-violet-400" />
                        Direktori Karyawan
                    </h1>
                    <p className="text-slate-400 mt-1">{safeEmployees.length} karyawan terdaftar</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400'}`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau jabatan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800/60 border border-violet-500/30 rounded-xl py-3 pl-14 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="input-modern"
                    >
                        <option value="all">Semua Branch</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-slate-400">
                Menampilkan {filteredEmployees.length} dari {safeEmployees.length} karyawan
            </p>

            {/* Grid View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map((employee, index) => (
                        <div
                            key={employee.id}
                            className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Header with gradient */}
                            <div className={`h-24 bg-gradient-to-br ${getGradient(index)} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                            </div>

                            {/* Avatar */}
                            <div className="relative -mt-12 px-6">
                                <div className="avatar-ring inline-block">
                                    {employee.photo_url ? (
                                        <img src={employee.photo_url} alt={employee.name} className="w-20 h-20 rounded-full object-cover shadow-lg" />
                                    ) : (
                                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>
                                            {getInitials(employee.name)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 pt-3">
                                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                                    {employee.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                                    <Building className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{getBranchName(employee.branch_id)}</span>
                                </div>
                                <p className="text-sm text-cyan-400 mt-1 truncate">
                                    {employee.jabatan || '-'}
                                </p>

                                {/* Actions - improved layout */}
                                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                                    {employee.email ? (
                                        <a href={`mailto:${employee.email}`} className="flex-1 py-2 px-2 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors flex items-center justify-center gap-1.5 text-xs">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="hidden sm:inline">Email</span>
                                        </a>
                                    ) : (
                                        <button disabled className="flex-1 py-2 px-2 rounded-lg bg-slate-600/20 text-slate-500 cursor-not-allowed flex items-center justify-center gap-1.5 text-xs">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="hidden sm:inline">Email</span>
                                        </button>
                                    )}
                                    {employee.phone ? (
                                        <a href={`https://wa.me/${employee.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 px-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors flex items-center justify-center gap-1.5 text-xs">
                                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="hidden sm:inline">Hubungi</span>
                                        </a>
                                    ) : (
                                        <button disabled className="flex-1 py-2 px-2 rounded-lg bg-slate-600/20 text-slate-500 cursor-not-allowed flex items-center justify-center gap-1.5 text-xs">
                                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="hidden sm:inline">Hubungi</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full table-modern">
                            <thead>
                                <tr className="text-left">
                                    <th className="px-6 py-4">Karyawan</th>
                                    <th className="px-6 py-4">Branch</th>
                                    <th className="px-6 py-4">Jabatan</th>
                                    <th className="px-6 py-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((employee, index) => (
                                    <tr key={employee.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center text-sm font-bold text-white`}>
                                                    {getInitials(employee.name)}
                                                </div>
                                                <span className="text-white font-medium">{employee.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{getBranchName(employee.branch_id)}</td>
                                        <td className="px-6 py-4 text-violet-400 max-w-xs truncate">{employee.jabatan || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {employee.email ? (
                                                    <a href={`mailto:${employee.email}`} className="p-2 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors" title={employee.email}>
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <span className="p-2 rounded-lg bg-slate-600/20 text-slate-500 cursor-not-allowed">
                                                        <Mail className="w-4 h-4" />
                                                    </span>
                                                )}
                                                {employee.phone ? (
                                                    <a href={`https://wa.me/${employee.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors" title={employee.phone}>
                                                        <Phone className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <span className="p-2 rounded-lg bg-slate-600/20 text-slate-500 cursor-not-allowed">
                                                        <Phone className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {
                filteredEmployees.length === 0 && (
                    <div className="glass-card p-12 text-center">
                        <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400 text-lg">Tidak ada karyawan ditemukan</p>
                        <p className="text-slate-500 text-sm mt-1">Coba ubah kata kunci pencarian atau filter</p>
                    </div>
                )
            }
        </div >
    );
}
