'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    id: {
        // Sidebar
        'sidebar.dashboard': 'Dashboard',
        'sidebar.attendance': 'Absensi',
        'sidebar.workPermit': 'Izin Kerja',
        'sidebar.directory': 'Direktori',
        'sidebar.managerPanel': 'Manager Panel',
        'sidebar.attendanceRecap': 'Rekap Absensi',
        'sidebar.adminPanel': 'Admin Panel',
        'sidebar.notifications': 'Notifikasi',
        'sidebar.settings': 'Pengaturan',
        'sidebar.logout': 'Keluar',

        // Settings
        'settings.title': 'Pengaturan',
        'settings.displayMode': 'Mode Tampilan',
        'settings.darkMode': 'Dark Mode',
        'settings.lightMode': 'Light Mode',
        'settings.language': 'Bahasa',
        'settings.indonesian': 'Indonesia',
        'settings.english': 'English',

        // Home
        'home.welcome': 'Selamat Datang',
        'home.dashboard': 'Dashboard HR Information System',
        'home.attendNow': 'Absen Sekarang',
        'home.monthlyAttendance': 'Absensi Bulan Ini',
        'home.leaveRemaining': 'Sisa Cuti',
        'home.used': 'Terpakai',
        'home.days': 'hari',
        'home.manageLeave': 'Kelola Jatah Cuti',
        'home.adminPanel': 'Admin Panel',
        'home.requestLeave': 'Ajukan Izin/Cuti',
        'home.requestPermit': 'Request Izin',
        'home.pendingRequests': 'Pending Requests',
        'home.reviewAll': 'Review All',
        'home.recentAttendance': 'Absensi Terakhir',
        'home.viewAll': 'Lihat Semua',
        'home.calendar': 'Kalender',
        'home.addEvent': 'Tambah Event',
        'home.holiday': 'Holiday',
        'home.meeting': 'Meeting',
        'home.event': 'Event',
        'home.eventList': 'Daftar Event',
        'home.announcements': 'Pengumuman',
        'home.add': 'Tambah',
        'home.active': 'aktif',
        'home.noAnnouncements': 'Tidak ada pengumuman',
        'home.clickForDetails': 'Klik untuk detail',
        'home.onLeave': 'Sedang Izin/Cuti',
        'home.people': 'orang',
        'home.noOneOnLeave': 'Tidak ada yang sedang cuti',
        'home.awards': 'Penghargaan',
        'home.noAwards': 'Belum ada penghargaan',
        'home.attend': 'Absen',
        'home.applyLeave': 'Ajukan Izin',
        'home.directoryNav': 'Direktori',

        // Common
        'common.save': 'Simpan',
        'common.cancel': 'Batal',
        'common.close': 'Tutup',
        'common.delete': 'Hapus',
        'common.edit': 'Edit',
        'common.date': 'Tanggal',
        'common.status': 'Status',
        'common.action': 'Aksi',
        'common.name': 'Nama',
        'common.award': 'Award',

        // Directory
        'directory.title': 'Direktori Karyawan',
        'directory.registered': 'karyawan terdaftar',
        'directory.searchPlaceholder': 'Cari nama atau jabatan...',
        'directory.allBranches': 'Semua Branch',
        'directory.showing': 'Menampilkan',
        'directory.of': 'dari',
        'directory.employees': 'karyawan',
        'directory.noEmployees': 'Tidak ada karyawan ditemukan',
        'directory.tryDifferent': 'Coba ubah kata kunci pencarian atau filter',
    },
    en: {
        // Sidebar
        'sidebar.dashboard': 'Dashboard',
        'sidebar.attendance': 'Attendance',
        'sidebar.workPermit': 'Work Permit',
        'sidebar.directory': 'Directory',
        'sidebar.managerPanel': 'Manager Panel',
        'sidebar.attendanceRecap': 'Attendance Recap',
        'sidebar.adminPanel': 'Admin Panel',
        'sidebar.notifications': 'Notifications',
        'sidebar.settings': 'Settings',
        'sidebar.logout': 'Logout',

        // Settings
        'settings.title': 'Settings',
        'settings.displayMode': 'Display Mode',
        'settings.darkMode': 'Dark Mode',
        'settings.lightMode': 'Light Mode',
        'settings.language': 'Language',
        'settings.indonesian': 'Indonesian',
        'settings.english': 'English',

        // Home
        'home.welcome': 'Welcome',
        'home.dashboard': 'HR Information System Dashboard',
        'home.attendNow': 'Attend Now',
        'home.monthlyAttendance': 'Monthly Attendance',
        'home.leaveRemaining': 'Leave Remaining',
        'home.used': 'Used',
        'home.days': 'days',
        'home.manageLeave': 'Manage Leave Quota',
        'home.adminPanel': 'Admin Panel',
        'home.requestLeave': 'Request Leave',
        'home.requestPermit': 'Request Permit',
        'home.pendingRequests': 'Pending Requests',
        'home.reviewAll': 'Review All',
        'home.recentAttendance': 'Recent Attendance',
        'home.viewAll': 'View All',
        'home.calendar': 'Calendar',
        'home.addEvent': 'Add Event',
        'home.holiday': 'Holiday',
        'home.meeting': 'Meeting',
        'home.event': 'Event',
        'home.eventList': 'Event List',
        'home.announcements': 'Announcements',
        'home.add': 'Add',
        'home.active': 'active',
        'home.noAnnouncements': 'No announcements',
        'home.clickForDetails': 'Click for details',
        'home.onLeave': 'On Leave',
        'home.people': 'people',
        'home.noOneOnLeave': 'No one is on leave',
        'home.awards': 'Awards',
        'home.noAwards': 'No awards yet',
        'home.attend': 'Attend',
        'home.applyLeave': 'Apply Leave',
        'home.directoryNav': 'Directory',

        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.close': 'Close',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.date': 'Date',
        'common.status': 'Status',
        'common.action': 'Action',
        'common.name': 'Name',
        'common.award': 'Award',

        // Directory
        'directory.title': 'Employee Directory',
        'directory.registered': 'employees registered',
        'directory.searchPlaceholder': 'Search by name or position...',
        'directory.allBranches': 'All Branches',
        'directory.showing': 'Showing',
        'directory.of': 'of',
        'directory.employees': 'employees',
        'directory.noEmployees': 'No employees found',
        'directory.tryDifferent': 'Try changing search keywords or filter',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('id');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language');
            if (saved === 'en' || saved === 'id') {
                setLanguageState(saved);
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
