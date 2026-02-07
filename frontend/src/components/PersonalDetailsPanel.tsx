'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Employee } from '@/types';

interface PersonalDetailsPanelProps {
    employee: Employee | null;
}

export default function PersonalDetailsPanel({ employee }: PersonalDetailsPanelProps) {
    if (!employee) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-4">
                <h2 className="text-lg font-bold text-white mb-4">Personal Details</h2>
                <p className="text-slate-400 text-sm text-center py-4">No data available</p>
            </div>
        );
    }

    const details = [
        { label: 'Sex', value: employee.sex },
        { label: 'PoB', value: employee.pob },
        { label: 'DoB', value: employee.dob },
        { label: 'Age', value: employee.age ? `${employee.age} tahun` : '-' },
        { label: 'Religion', value: employee.religion },
        { label: 'Email', value: employee.name?.toLowerCase().replace(' ', '') + '@gmail.com' },
        { label: 'Phone', value: employee.phone },
        { label: 'Address 1', value: employee.address1 || '-' },
        { label: 'Address 2', value: employee.address2 || '-' },
        { label: 'NIK', value: employee.nik },
        { label: 'NPWP', value: employee.npwp || '-' },
        { label: 'Latest Education Level', value: employee.education_level },
        { label: 'Latest Institution', value: employee.institution || '-' },
        { label: 'Latest Major', value: employee.major || '-' },
        { label: 'Latest Graduation Year', value: employee.graduation_year || '-' },
        { label: 'Bank Account', value: employee.bank_account, highlight: true },
        { label: 'Status PTKP', value: employee.status_ptkp },
    ];

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <h2 className="text-lg font-bold text-white">Personal Details</h2>
                <button className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Details Table */}
            <div className="space-y-2">
                {details.map((detail, index) => (
                    <div key={index} className="flex items-start py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-400 text-sm w-40 flex-shrink-0">{detail.label}</span>
                        <span className="text-slate-300 mx-2">:</span>
                        <span className={`text-sm ${detail.highlight ? 'text-purple-400' : 'text-slate-300'}`}>
                            {detail.value || '-'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
