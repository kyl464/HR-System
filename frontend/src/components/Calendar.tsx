'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface CalendarProps {
    attendanceData?: Record<string, { session: string; status: string }[]>;
    onMonthChange?: (month: number, year: number) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Calendar({ attendanceData = {}, onMonthChange }: CalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
            onMonthChange?.(11, currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
            onMonthChange?.(currentMonth - 1, currentYear);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
            onMonthChange?.(0, currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
            onMonthChange?.(currentMonth + 1, currentYear);
        }
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getAttendanceForDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return attendanceData[dateStr] || [];
    };

    const isToday = (day: number) => {
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <select
                        value={currentMonth}
                        onChange={(e) => {
                            setCurrentMonth(parseInt(e.target.value));
                            onMonthChange?.(parseInt(e.target.value), currentYear);
                        }}
                        className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-purple-500 focus:outline-none"
                    >
                        {MONTHS.map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                        ))}
                    </select>
                    <select
                        value={currentYear}
                        onChange={(e) => {
                            setCurrentYear(parseInt(e.target.value));
                            onMonthChange?.(currentMonth, parseInt(e.target.value));
                        }}
                        className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-purple-500 focus:outline-none"
                    >
                        {[2024, 2025, 2026, 2027].map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-slate-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const attendance = day ? getAttendanceForDay(day) : [];
                    const hasAttendance = attendance.length > 0;

                    return (
                        <div
                            key={index}
                            className={`
                min-h-[60px] p-1 rounded-lg text-center relative
                ${day === null ? '' : 'hover:bg-slate-800/50 cursor-pointer'}
                ${isToday(day as number) ? 'bg-blue-900/30 border border-blue-500' : ''}
              `}
                        >
                            {day !== null && (
                                <>
                                    <span className={`text-sm ${isToday(day) ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                                        {day}
                                    </span>
                                    {hasAttendance && (
                                        <div className="flex justify-center gap-1 mt-1 flex-wrap">
                                            {attendance.map((att, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${att.session === 'Full Day' ? 'bg-pink-500' :
                                                            att.session === 'Morning' ? 'bg-purple-500' :
                                                                'bg-blue-500'
                                                        }`}
                                                    title={`${att.session} - ${att.status}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                    <span className="text-xs text-slate-400">Full Day</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-xs text-slate-400">Morning</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-400">Afternoon</span>
                </div>
            </div>
        </div>
    );
}
