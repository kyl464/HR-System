'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import {
    Plus,
    FileText,
    Filter,
    CheckCircle,
    Clock,
    X,
    AlertTriangle,
    Upload,
    Calendar,
    Trash2
} from 'lucide-react';

interface WorkPermit {
    id: number;
    date: string;
    session: string;
    leave_type: string;
    reason: string;
    supporting_file: string;
    status: string;
    reject_reason?: string;
}

export default function WorkPermitPage() {
    const { token } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState<WorkPermit | null>(null);
    const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterLeaveType, setFilterLeaveType] = useState('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        session: 'Full Day',
        leave_type: 'Sick',
        reason: '',
        supporting_file: ''
    });
    const [leaveQuota, setLeaveQuota] = useState({ total: 12, used: 0, remaining: 12 });
    const [supportingFile, setSupportingFile] = useState<File | null>(null);

    useEffect(() => {
        if (token) {
            fetchWorkPermits();
            fetchLeaveQuota();
        }
    }, [token]);

    const fetchWorkPermits = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/work-permits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setWorkPermits(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
            setWorkPermits([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveQuota = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/leave-quota`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLeaveQuota(data);
            }
        } catch (error) {
            console.error('Error fetching leave quota:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.reason.trim()) {
            setToast({ message: 'Alasan harus diisi', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        // Block Annual/Personal leave when quota is exhausted
        if ((formData.leave_type === 'Annual' || formData.leave_type === 'Personal') && leaveQuota.remaining <= 0) {
            setShowModal(false); // Close modal first so user can see the warning
            setToast({ message: 'Jatah cuti tahunan Anda sudah habis! Tidak dapat mengajukan cuti/izin.', type: 'error' });
            setTimeout(() => setToast(null), 4000);
            return;
        }

        // Require supporting file for sick leave
        if (formData.leave_type === 'Sick' && !supportingFile) {
            setToast({ message: 'File pendukung (surat dokter) wajib diisi untuk izin Sakit', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setSubmitting(true);

        try {
            // Convert file to base64 if exists
            let fileBase64 = '';
            if (supportingFile) {
                const reader = new FileReader();
                fileBase64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(supportingFile);
                });
            }

            const res = await fetch(`${API_BASE_URL}/work-permits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, supporting_file: fileBase64 })
            });

            if (res.ok) {
                setToast({ message: 'Pengajuan izin berhasil!', type: 'success' });
                setShowModal(false);
                fetchWorkPermits();
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    session: 'Full Day',
                    leave_type: 'Sick',
                    reason: '',
                    supporting_file: ''
                });
                setSupportingFile(null);
            } else {
                const data = await res.json();
                setToast({ message: data.error || 'Gagal mengajukan izin', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setToast({ message: 'Format file tidak didukung. Gunakan PNG, JPG, atau PDF', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1 * 1024 * 1024) {
            setToast({ message: 'Ukuran file maksimal 1MB', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setSupportingFile(file);
    };

    const handleDeletePendingPermit = async (id: number) => {
        if (!confirm('Batalkan pengajuan izin ini?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/work-permits/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setWorkPermits(workPermits.filter(p => p.id !== id));
                setToast({ message: 'Pengajuan izin dibatalkan', type: 'success' });
            } else {
                setToast({ message: 'Gagal membatalkan izin', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        }
        setTimeout(() => setToast(null), 3000);
    };

    const filteredPermits = Array.isArray(workPermits)
        ? workPermits.filter(p => {
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesLeaveType = filterLeaveType === 'all' || p.leave_type === filterLeaveType;
            return matchesStatus && matchesLeaveType;
        })
        : [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Disetujui</span>;
            case 'pending':
                return <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Menunggu</span>;
            case 'rejected':
                return <span className="badge badge-error flex items-center gap-1"><X className="w-3 h-3" /> Ditolak</span>;
            default:
                return <span className="badge badge-info">{status}</span>;
        }
    };

    const getLeaveTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'Sick': 'Sakit',
            'Annual': 'Cuti Tahunan',
            'Personal': 'Keperluan Pribadi',
            'Other': 'Lainnya'
        };
        return types[type] || type;
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
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="text-white">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Izin Kerja</h1>
                    <p className="text-slate-400 mt-1">Kelola pengajuan izin dan cuti</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-gradient flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Ajukan Izin
                </button>
            </div>

            {/* Leave Quota Banner */}
            <div className={`glass-card p-4 flex items-center justify-between ${leaveQuota.remaining <= 0 ? 'border-rose-500/50' : 'border-cyan-500/30'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${leaveQuota.remaining <= 0 ? 'from-rose-500 to-red-600' : 'from-cyan-500 to-teal-600'} flex items-center justify-center`}>
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-medium">Jatah Cuti Anda</p>
                        <p className="text-sm text-slate-400">Sisa: <span className={`${leaveQuota.remaining <= 0 ? 'text-rose-400' : 'text-cyan-400'} font-bold`}>{leaveQuota.remaining}</span> dari {leaveQuota.total} hari (terpakai: {leaveQuota.used} hari)</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${leaveQuota.remaining <= 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'} rounded-full`} style={{ width: `${(leaveQuota.remaining / leaveQuota.total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{Math.round((leaveQuota.remaining / leaveQuota.total) * 100)}% tersisa</p>
                </div>
            </div>

            {/* Quota Exhausted Warning */}
            {leaveQuota.remaining <= 0 && (
                <div className="glass-card p-4 border-rose-500/50 bg-rose-500/10">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                        <div>
                            <p className="text-rose-400 font-medium">Jatah Cuti Habis!</p>
                            <p className="text-sm text-slate-400">Anda tidak dapat mengajukan cuti tahunan karena jatah cuti sudah habis. Izin sakit masih diperbolehkan.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Status:</span>
                </div>
                {['all', 'pending', 'approved', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        {status === 'all' ? 'Semua' :
                            status === 'pending' ? 'Menunggu' :
                                status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </button>
                ))}

                <div className="flex items-center gap-2 text-slate-400 ml-4">
                    <span className="text-sm">Jenis Izin:</span>
                </div>
                <select
                    value={filterLeaveType}
                    onChange={(e) => setFilterLeaveType(e.target.value)}
                    className="input-modern px-3 py-2 text-sm min-w-[140px]"
                >
                    <option value="all">Semua Jenis</option>
                    <option value="Sick">Sakit</option>
                    <option value="Annual">Cuti Tahunan</option>
                    <option value="Personal">Keperluan Pribadi</option>
                    <option value="Other">Lainnya</option>
                </select>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-modern">
                        <thead>
                            <tr className="text-left">
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Sesi</th>
                                <th className="px-6 py-4">Jenis Izin</th>
                                <th className="px-6 py-4">Alasan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermits.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                        <p className="text-slate-400">Tidak ada data izin</p>
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="mt-4 text-violet-400 hover:text-violet-300 text-sm"
                                        >
                                            + Ajukan Izin Baru
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredPermits.map((permit) => (
                                    <tr
                                        key={permit.id}
                                        className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                        onClick={() => { setSelectedPermit(permit); setShowDetailModal(true); }}
                                    >
                                        <td className="px-6 py-4 text-slate-300">{permit.date}</td>
                                        <td className="px-6 py-4">
                                            <span className="badge badge-info">{permit.session}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{getLeaveTypeLabel(permit.leave_type)}</td>
                                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{permit.reason}</td>
                                        <td className="px-6 py-4">{getStatusBadge(permit.status)}</td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            {permit.status === 'pending' && (
                                                <button
                                                    onClick={() => handleDeletePendingPermit(permit.id)}
                                                    className="p-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition-colors"
                                                    title="Batalkan pengajuan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Ajukan Izin</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="input-modern w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Sesi</label>
                                    <select
                                        value={formData.session}
                                        onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                                        className="input-modern w-full"
                                    >
                                        <option value="Full Day">Full Day</option>
                                        <option value="Half Day">Half Day</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Jenis Izin</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    className="input-modern w-full"
                                >
                                    <option value="Sick">Sakit</option>
                                    <option value="Annual">Cuti Tahunan</option>
                                    <option value="Personal">Keperluan Pribadi</option>
                                    <option value="Other">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Alasan</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    rows={4}
                                    className="input-modern w-full resize-none"
                                    placeholder="Jelaskan alasan izin Anda..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    File Pendukung {formData.leave_type === 'Sick' ? <span className="text-rose-400">* (Wajib untuk Sakit)</span> : '(Opsional)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".png,.jpg,.jpeg,.pdf"
                                        className="hidden"
                                        id="supporting-file-input"
                                    />
                                    <label
                                        htmlFor="supporting-file-input"
                                        className="input-modern w-full flex items-center gap-2 cursor-pointer hover:border-violet-500/50"
                                    >
                                        <Upload className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-400">
                                            {supportingFile ? supportingFile.name : 'Pilih file...'}
                                        </span>
                                    </label>
                                    {supportingFile && (
                                        <button
                                            type="button"
                                            onClick={() => setSupportingFile(null)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Format: PNG, JPG, JPEG, PDF | Max: 1MB</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    Batal
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
                                            Ajukan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedPermit && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-violet-400" />
                                Detail Izin Kerja
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Status</span>
                                {getStatusBadge(selectedPermit.status)}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tanggal</span>
                                <span className="text-white">{selectedPermit.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Sesi</span>
                                <span className="badge badge-info">{selectedPermit.session}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Jenis Izin</span>
                                <span className="text-white">{getLeaveTypeLabel(selectedPermit.leave_type)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-2">Alasan</span>
                                <p className="text-white bg-white/5 p-3 rounded-lg">{selectedPermit.reason}</p>
                            </div>
                            {selectedPermit.supporting_file && (
                                <div>
                                    <span className="text-slate-400 block mb-2">File Pendukung</span>
                                    <a href={selectedPermit.supporting_file} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                                        {selectedPermit.supporting_file}
                                    </a>
                                </div>
                            )}
                            {selectedPermit.status === 'rejected' && selectedPermit.reject_reason && (
                                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                                    <span className="text-rose-400 font-medium block mb-2">Alasan Penolakan</span>
                                    <p className="text-white">{selectedPermit.reject_reason}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="w-full mt-6 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
