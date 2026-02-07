'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Award } from '@/types';

interface AwardCarouselProps {
    awards: Award[];
}

export default function AwardCarousel({ awards }: AwardCarouselProps) {
    const [currentQuarterIndex, setCurrentQuarterIndex] = useState(0);

    // Group awards by quarter/year
    const quarters = awards.reduce((acc, award) => {
        const key = `${award.quarter} ${award.year}`;
        if (!acc.find(q => q.key === key)) {
            acc.push({
                key,
                quarter: award.quarter,
                year: award.year,
                awards: awards.filter(a => a.quarter === award.quarter && a.year === award.year)
            });
        }
        return acc;
    }, [] as { key: string; quarter: string; year: number; awards: Award[] }[]);

    const currentQuarter = quarters[currentQuarterIndex];

    const handlePrev = () => {
        setCurrentQuarterIndex((prev) => (prev > 0 ? prev - 1 : quarters.length - 1));
    };

    const handleNext = () => {
        setCurrentQuarterIndex((prev) => (prev < quarters.length - 1 ? prev + 1 : 0));
    };

    if (!currentQuarter) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-4">
                <h2 className="text-lg font-bold text-white mb-4">Awards</h2>
                <p className="text-slate-400 text-sm text-center py-4">No awards available</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handlePrev}
                    className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <h2 className="text-lg font-bold text-white">
                    ({currentQuarter.quarter}) {currentQuarter.year} Award
                </h2>
                <button
                    onClick={handleNext}
                    className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Awards Table */}
            <div className="overflow-hidden rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-800/50">
                            <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Name</th>
                            <th className="text-right text-xs font-medium text-slate-400 px-3 py-2">Award</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentQuarter.awards.map((award, index) => (
                            <tr
                                key={index}
                                className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors"
                            >
                                <td className="text-sm text-slate-300 px-3 py-2">{award.employee_name}</td>
                                <td className="text-sm text-amber-400 text-right px-3 py-2">{award.award_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
