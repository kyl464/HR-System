'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import {
    ClipboardCheck,
    Target,
    CheckCircle,
    Send,
    Clock,
    FileText,
    AlertCircle
} from 'lucide-react';

interface Objective {
    id: number;
    title: string;
    description: string;
    is_active: boolean;
}

interface Assignment {
    id: number;
    objective_id: number;
    submission: string;
    submitted_at: string;
}

export default function AssignmentPage() {
    const { token } = useAuth();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState<number | null>(null);
    const [submission, setSubmission] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const [objRes, assignRes] = await Promise.all([
                fetch(`${API_BASE_URL}/assignments/objectives`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/assignments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const objData = await objRes.json();
            const assignData = await assignRes.json();

            setObjectives(Array.isArray(objData) ? objData : []);
            setAssignments(Array.isArray(assignData) ? assignData : []);
        } catch (error) {
            console.error('Error:', error);
            setObjectives([]);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedObjective) {
            setToast({ message: 'Pilih objective terlebih dahulu', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        if (!submission.trim()) {
            setToast({ message: 'Submission tidak boleh kosong', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    objective_id: selectedObjective,
                    submission: submission
                })
            });

            if (res.ok) {
                setToast({ message: 'Tugas berhasil disubmit!', type: 'success' });
                setSelectedObjective(null);
                setSubmission('');
                fetchData();
            } else {
                setToast({ message: 'Gagal submit tugas', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Terjadi kesalahan', type: 'error' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const safeObjectives = Array.isArray(objectives) ? objectives : [];
    const safeAssignments = Array.isArray(assignments) ? assignments : [];

    const getObjectiveTitle = (id: number) => {
        const obj = safeObjectives.find(o => o.id === id);
        return obj?.title || 'Unknown';
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
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="text-white">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ClipboardCheck className="w-8 h-8 text-violet-400" />
                    Submit Tugas
                </h1>
                <p className="text-slate-400 mt-1">Pilih objective dan submit tugas Anda</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Objectives List */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-amber-400" />
                            Objective Aktif
                        </h2>

                        {safeObjectives.length === 0 ? (
                            <div className="text-center py-8">
                                <Target className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                <p className="text-slate-400">Tidak ada objective aktif</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {safeObjectives.map((obj, index) => (
                                    <button
                                        key={obj.id}
                                        onClick={() => setSelectedObjective(obj.id)}
                                        className={`w-full p-4 rounded-xl text-left transition-all ${selectedObjective === obj.id
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg'
                                            : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedObjective === obj.id ? 'bg-white/20' : 'bg-violet-500/20'
                                                }`}>
                                                <span className={`text-sm font-bold ${selectedObjective === obj.id ? 'text-white' : 'text-violet-400'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-medium ${selectedObjective === obj.id ? 'text-white' : 'text-slate-200'
                                                    }`}>
                                                    {obj.title}
                                                </h3>
                                                <p className={`text-sm mt-1 line-clamp-2 ${selectedObjective === obj.id ? 'text-white/70' : 'text-slate-400'
                                                    }`}>
                                                    {obj.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submission Form */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            Form Submission
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Objective Terpilih</label>
                                <div className={`input-modern flex items-center gap-3 ${!selectedObjective ? 'text-slate-500' : 'text-white'
                                    }`}>
                                    <Target className="w-4 h-4" />
                                    {selectedObjective
                                        ? getObjectiveTitle(selectedObjective)
                                        : 'Pilih objective dari daftar di samping'
                                    }
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Submission</label>
                                <textarea
                                    value={submission}
                                    onChange={(e) => setSubmission(e.target.value)}
                                    rows={8}
                                    className="input-modern w-full resize-none"
                                    placeholder="Tulis submission Anda di sini..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedObjective}
                                className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 spinner" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Tugas
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Previous Submissions */}
            {safeAssignments.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        Riwayat Submission
                    </h2>

                    <div className="space-y-4">
                        {safeAssignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="p-4 rounded-xl bg-white/5 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-success">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Submitted
                                        </span>
                                        <span className="text-violet-400 font-medium">
                                            {getObjectiveTitle(assignment.objective_id)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500">{assignment.submitted_at}</span>
                                </div>
                                <p className="text-slate-300 text-sm line-clamp-2">{assignment.submission}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
