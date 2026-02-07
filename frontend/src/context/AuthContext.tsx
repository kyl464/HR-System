'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    is_admin: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie utilities
const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for existing token - first cookies, then localStorage
        const cookieToken = getCookie('kkhris_token');
        const cookieUser = getCookie('kkhris_user');
        const storedToken = localStorage.getItem('kkhris_token');
        const storedUser = localStorage.getItem('kkhris_user');

        const activeToken = cookieToken || storedToken;
        const activeUser = cookieUser || storedUser;

        if (activeToken && activeUser) {
            setToken(activeToken);
            try {
                setUser(JSON.parse(activeUser));
            } catch {
                // Invalid user data
            }
            validateToken(activeToken);
        } else {
            setLoading(false);
            if (pathname !== '/login') {
                router.push('/login');
            }
        }
    }, []);

    const validateToken = async (tokenToValidate: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${tokenToValidate}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.valid) {
                    setUser(data.user);
                    setLoading(false);
                    return;
                }
            }

            // Token invalid, clear and redirect
            logout();
        } catch (error) {
            logout();
        }
    };

    const login = async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Login gagal' };
            }

            setToken(data.token);
            setUser(data.user);

            const userStr = JSON.stringify(data.user);

            if (rememberMe) {
                // Use cookies that expire in 30 days
                setCookie('kkhris_token', data.token, 30);
                setCookie('kkhris_user', userStr, 30);
                // Also store in localStorage as backup
                localStorage.setItem('kkhris_token', data.token);
                localStorage.setItem('kkhris_user', userStr);
            } else {
                // Use localStorage only (session-based)
                localStorage.setItem('kkhris_token', data.token);
                localStorage.setItem('kkhris_user', userStr);
            }

            router.push('/');
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Tidak dapat terhubung ke server' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        // Clear both cookies and localStorage
        deleteCookie('kkhris_token');
        deleteCookie('kkhris_user');
        localStorage.removeItem('kkhris_token');
        localStorage.removeItem('kkhris_user');
        setLoading(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.is_admin || false
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
