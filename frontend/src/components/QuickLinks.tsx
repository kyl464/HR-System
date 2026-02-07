'use client';

import {
    Calendar,
    FileText,
    Star,
    CreditCard,
    CalendarPlus,
    Users,
    Slack,
    Globe,
    Youtube,
    MessageSquare,
    FileStack
} from 'lucide-react';

const quickLinks = [
    { label: 'Attendance', icon: Calendar, color: 'from-blue-600 to-blue-700' },
    { label: 'Work Permit', icon: FileText, color: 'from-purple-600 to-purple-700' },
    { label: 'Milestone Data', icon: Star, color: 'from-amber-500 to-amber-600' },
    { label: 'Account Booking', icon: CreditCard, color: 'from-slate-600 to-slate-700' },
    { label: 'Event Request', icon: CalendarPlus, color: 'from-slate-600 to-slate-700' },
    { label: 'Employee Sites', icon: Users, color: 'from-slate-600 to-slate-700' },
    { label: "KodeKiddo's Slack", icon: Slack, color: 'from-slate-600 to-slate-700' },
    { label: 'Student Schedule', icon: Calendar, color: 'from-green-600 to-green-700' },
    { label: 'Student Record', icon: FileStack, color: 'from-green-600 to-green-700' },
    { label: 'Klaskoo', icon: Globe, color: 'from-green-600 to-green-700' },
    { label: 'Zoom KodeKiddo', icon: Youtube, color: 'from-green-600 to-green-700' },
    { label: 'KK Mabar Discord', icon: MessageSquare, color: 'from-green-600 to-green-700' },
    { label: 'KKHRIS Changelogs', icon: FileStack, color: 'from-pink-600 to-pink-700' },
];

export default function QuickLinks() {
    return (
        <div className="flex flex-wrap gap-2">
            {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                    <button
                        key={index}
                        className={`bg-gradient-to-r ${link.color} hover:opacity-90 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
                    >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
