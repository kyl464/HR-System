'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Clock,
    CheckCircle,
    X,
    Briefcase,
    Trash2,
    MessageSquare,
    Eye,
    Paperclip
} from 'lucide-react';

interface PendingRequest {
    id: number;
    type: 'work_permit' | 'delete_attendance';
    user_name: string;
    user_id: number;
    date: string;
    reason: string;
    details?: string;
    status: string;
    created_at: string;
    supporting_file?: string;
    session?: string;
}

export default function ManagerPage() {
    const { token, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [requestToReject, setRequestToReject] = useState<PendingRequest | null>(null);

    const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!isManagerOrAdmin) {
                router.push('/');
                return;
            }
            fetchPendingRequests();
        }
    }, [authLoading, isManagerOrAdmin]);

    const fetchPendingRequests = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingRequests(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/requests/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPendingRequests(prev => prev.filter(r => r.id !== id));
                setToast({ message: 'Request berhasil disetujui! Notifikasi telah dikirim.', type: 'success' });
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
            setTimeout(() => setToast(null), 3000);
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
                    setToast({ message: 'Request ditolak. Notifikasi telah dikirim ke staff.', type: 'success' });
                } else {
                    setToast({ message: 'Gagal menolak request', type: 'error' });
                }
            } catch {
                setToast({ message: 'Terjadi kesalahan', type: 'error' });
            }
            setTimeout(() => setToast(null), 3000);
        }

        setShowRejectModal(false);
        setRejectReason('');
        setRequestToReject(null);
    };


    const workPermitRequests = pendingRequests.filter(r => r.type === 'work_permit');
    const deleteRequests = pendingRequests.filter(r => r.type === 'delete_attendance');

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 spinner" />
            </div>
        );
    }

    if (!isManagerOrAdmin) return null;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 toast p-4 flex items-center gap-3 animate-fade-in-up ${toast.type === 'success' ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-rose-400" />}
                    <span className="text-white">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-cyan-400" />
                    Manager Panel
                </h1>
                <p className="text-slate-400 mt-1">Review izin kerja dan request penghapusan absensi</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{workPermitRequests.length}</p>
                            <p className="text-sm text-slate-400">Izin Kerja Pending</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{deleteRequests.length}</p>
                            <p className="text-sm text-slate-400">Hapus Absen Pending</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{pendingRequests.length}</p>
                            <p className="text-sm text-slate-400">Total Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Permit Requests */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    Izin Kerja
                    {workPermitRequests.length > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white ml-2">{workPermitRequests.length}</span>
                    )}
                </h2>

                {workPermitRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-emerald-400/50 mb-2" />
                        <p className="text-slate-400">Tidak ada izin kerja pending</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workPermitRequests.map(req => (
                            <div key={req.id} className="p-4 rounded-xl bg-white/5 border border-amber-500/20">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white">
                                                {req.user_name.charAt(0)}
                                            </div>
                                            <span className="text-white font-medium">{req.user_name}</span>
                                        </div>
                                        <p className="text-amber-400 font-medium">{req.reason}</p>
                                        <p className="text-slate-400 text-sm mt-1">{req.details}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-300 text-sm">Tanggal Izin:</p>
                                        <p className="text-white font-medium">{req.date}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-3 border-t border-white/10">
                                    <button
                                        onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}
                                        className="py-2 px-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 transition-colors flex items-center justify-center gap-2"
                                        title="Lihat Detail"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleApprove(req.id)} className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button onClick={() => openRejectModal(req)} className="flex-1 py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-2">
                                        <X className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Attendance Requests */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                    Request Hapus Absensi
                    {deleteRequests.length > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white ml-2">{deleteRequests.length}</span>
                    )}
                </h2>

                {deleteRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-emerald-400/50 mb-2" />
                        <p className="text-slate-400">Tidak ada request hapus absensi</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deleteRequests.map(req => (
                            <div key={req.id} className="p-4 rounded-xl bg-white/5 border border-rose-500/20">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
                                                {req.user_name.charAt(0)}
                                            </div>
                                            <span className="text-white font-medium">{req.user_name}</span>
                                        </div>
                                        <p className="text-rose-400 font-medium">{req.reason}</p>
                                        <p className="text-slate-400 text-sm mt-1">{req.details}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-300 text-sm">Tanggal Absen:</p>
                                        <p className="text-white font-medium">{req.date}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-3 border-t border-white/10">
                                    <button
                                        onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}
                                        className="py-2 px-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 transition-colors flex items-center justify-center gap-2"
                                        title="Lihat Detail"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleApprove(req.id)} className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button onClick={() => openRejectModal(req)} className="flex-1 py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-2">
                                        <X className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Reason Modal */}
            {showRejectModal && requestToReject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-rose-400" />
                                Alasan Penolakan
                            </h2>
                            <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                            <p className="text-rose-400 text-sm">
                                Request dari <strong>{requestToReject.user_name}</strong> - {requestToReject.reason}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-slate-400 mb-2">
                                Alasan Penolakan <span className="text-rose-400">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                className="input-modern w-full resize-none"
                                placeholder="Jelaskan alasan mengapa request ini ditolak..."
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">Alasan ini akan dikirim ke staff yang bersangkutan.</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors">
                                Batal
                            </button>
                            <button onClick={submitReject} className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-2">
                                <X className="w-4 h-4" /> Tolak Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-violet-400" />
                                Detail Request
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Request Type */}
                            <div className={`p-3 rounded-lg ${selectedRequest.type === 'work_permit' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}>
                                <p className={`text-sm font-medium ${selectedRequest.type === 'work_permit' ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {selectedRequest.type === 'work_permit' ? '📋 Izin Kerja' : '🗑️ Hapus Absensi'}
                                </p>
                            </div>

                            {/* User Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Pemohon</p>
                                    <p className="text-white font-medium">{selectedRequest.user_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Tanggal</p>
                                    <p className="text-white font-medium">{selectedRequest.date}</p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Alasan</p>
                                <p className="text-white">{selectedRequest.reason}</p>
                            </div>

                            {/* Details */}
                            {selectedRequest.details && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Detail</p>
                                    <p className="text-slate-300 text-sm">{selectedRequest.details}</p>
                                </div>
                            )}

                            {/* Session */}
                            {selectedRequest.session && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Sesi</p>
                                    <p className="text-white">{selectedRequest.session}</p>
                                </div>
                            )}

                            {/* Created At */}
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Dibuat pada</p>
                                <p className="text-slate-400 text-sm">{selectedRequest.created_at}</p>
                            </div>

                            {/* Supporting File */}
                            {selectedRequest.supporting_file && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-2">File Pendukung</p>
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        {selectedRequest.supporting_file.startsWith('data:image') ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={selectedRequest.supporting_file}
                                                    alt="Supporting file"
                                                    className="max-w-full max-h-48 rounded-lg mx-auto"
                                                />
                                                <a
                                                    href={selectedRequest.supporting_file}
                                                    download="supporting_file"
                                                    className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm justify-center"
                                                >
                                                    <Paperclip className="w-4 h-4" /> Download File
                                                </a>
                                            </div>
                                        ) : selectedRequest.supporting_file.startsWith('data:application/pdf') ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-12 h-12 text-rose-400" />
                                                <p className="text-slate-300 text-sm">PDF Document</p>
                                                <a
                                                    href={selectedRequest.supporting_file}
                                                    download="supporting_file.pdf"
                                                    className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm"
                                                >
                                                    <Paperclip className="w-4 h-4" /> Download PDF
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Paperclip className="w-4 h-4" />
                                                <span className="text-sm">File tersedia</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowDetailModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors">
                                Tutup
                            </button>
                            <button
                                onClick={() => { setShowDetailModal(false); handleApprove(selectedRequest.id); }}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
