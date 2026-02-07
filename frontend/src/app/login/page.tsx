'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { Mail, Lock, AlertCircle, Loader2, KeyRound, CheckCircle } from 'lucide-react';

export default function LoginPage() {
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'change-password'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/');
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password, rememberMe);

        if (!result.success) {
            setError(result.error || 'Login gagal');
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Password baru tidak cocok');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Password berhasil diubah! Silakan login.');
                setMode('login');
                setPassword('');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || 'Gagal mengubah password');
            }
        } catch (err) {
            setError('Tidak dapat terhubung ke server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="glass-card p-8 w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse-glow mb-4">
                        <span className="text-3xl font-black text-white">K</span>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        HRS
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Human Resource System</p>
                </div>

                {/* Demo Credentials Box */}
                <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <p className="text-cyan-400 text-sm font-semibold mb-2">🎮 Demo Mode</p>
                    <div className="text-slate-300 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-violet-400 font-medium">Admin:</span>
                            <span><code className="bg-slate-700/50 px-1.5 py-0.5 rounded">admin@demo.com</code> / <code className="bg-slate-700/50 px-1.5 py-0.5 rounded">admin123</code></span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-400 font-medium">Manager:</span>
                            <span><code className="bg-slate-700/50 px-1.5 py-0.5 rounded">manager@demo.com</code> / <code className="bg-slate-700/50 px-1.5 py-0.5 rounded">manager123</code></span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cyan-400 font-medium">User:</span>
                            <span><code className="bg-slate-700/50 px-1.5 py-0.5 rounded">demo@demo.com</code> / <code className="bg-slate-700/50 px-1.5 py-0.5 rounded">demo123</code></span>
                        </div>
                    </div>
                </div>

                {/* Success message */}
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-400 text-sm">{success}</p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        <p className="text-rose-400 text-sm">{error}</p>
                    </div>
                )}

                {mode === 'login' ? (
                    /* Login form */
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail className="w-5 h-5 text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-modern input-with-icon w-full"
                                    placeholder="email@kodekiddo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-modern input-with-icon w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                                />
                                <span className="text-sm text-slate-400">Ingat saya (30 hari)</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setMode('change-password')}
                                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                            >
                                Ubah Password
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-gradient w-full flex items-center justify-center gap-2 py-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                ) : (
                    /* Change Password form */
                    <form onSubmit={handleChangePassword} className="space-y-5">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail className="w-5 h-5 text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-modern input-with-icon w-full"
                                    placeholder="email@kodekiddo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Password Lama</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="input-modern input-with-icon w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Password Baru</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <KeyRound className="w-5 h-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-modern input-with-icon w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <KeyRound className="w-5 h-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-modern input-with-icon w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className="flex-1 py-4 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
                            >
                                Kembali
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-gradient flex items-center justify-center gap-2 py-4"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Ubah Password'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
