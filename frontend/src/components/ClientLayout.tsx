'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { loading, isAuthenticated } = useAuth();

    const isLoginPage = pathname === '/login';
    const showSidebar = !isLoginPage && isAuthenticated;

    // Show loading spinner while checking auth
    if (loading && !isLoginPage) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 spinner" />
            </div>
        );
    }

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            {showSidebar && <Sidebar />}
            <main className={`flex-1 ${showSidebar ? 'ml-72' : ''} p-8 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
