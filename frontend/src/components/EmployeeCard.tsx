'use client';

import { Employee } from '@/types';
import { Mail } from 'lucide-react';

interface EmployeeCardProps {
    employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
    return (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
            {/* Photo Section */}
            <div className="relative h-48 bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-2 left-2 text-xs font-bold text-white bg-white/20 px-2 py-1 rounded">
                        KODE KIDDO
                    </div>
                    <div className="absolute top-2 right-2 text-[8px] text-white/60">
                        FUN CODING SCHOOL FOR KIDS
                    </div>
                </div>

                {/* Photo */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
                    <div className="w-28 h-28 rounded-full border-4 border-purple-500 overflow-hidden bg-slate-700 shadow-xl">
                        <img
                            src={employee.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=6366f1&color=fff&size=200`}
                            alt={employee.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="pt-8 pb-4 px-4">
                <h3 className="text-white font-bold text-center text-lg mb-2 group-hover:text-purple-400 transition-colors">
                    {employee.name}
                </h3>

                <div className="space-y-1 mb-4">
                    <p className="text-slate-400 text-sm">
                        <span className="text-slate-500">Center:</span>{' '}
                        <span className="text-slate-300">{employee.center}</span>
                    </p>
                    <p className="text-slate-400 text-sm">
                        <span className="text-slate-500">Role:</span>{' '}
                        <span className="text-purple-400">{employee.roles}</span>
                    </p>
                </div>

                {/* Contact Button */}
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Contact</span>
                </button>
            </div>
        </div>
    );
}
