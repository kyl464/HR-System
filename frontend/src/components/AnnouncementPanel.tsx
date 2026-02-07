'use client';

import { Announcement } from '@/types';
import { X } from 'lucide-react';

interface AnnouncementPanelProps {
    announcements: Announcement[];
    isManagerOrAdmin?: boolean;
    onDelete?: (id: number | string) => void;
}

export default function AnnouncementPanel({ announcements, isManagerOrAdmin, onDelete }: AnnouncementPanelProps) {
    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-4">
            <h2 className="text-lg font-bold text-white mb-4">Announcement</h2>

            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No announcements</p>
                ) : (
                    announcements.map((announcement) => (
                        <div key={announcement.id} className="space-y-2 relative group">
                            {isManagerOrAdmin && onDelete && (
                                <button
                                    onClick={() => onDelete(announcement.id)}
                                    className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                                    title="Hapus pengumuman"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                            <h3 className="text-purple-400 font-semibold text-sm">
                                {announcement.title}
                            </h3>
                            <p className="text-slate-300 text-sm whitespace-pre-line">
                                {announcement.content.split('\n').map((line, i) => (
                                    <span key={i}>
                                        {line.includes('Changelogs') ? (
                                            <>
                                                Don&apos;t forget to check our{' '}
                                                <a href="#" className="text-blue-400 hover:underline">Changelogs</a>!
                                            </>
                                        ) : line.includes('mobile phone') ? (
                                            <>
                                                You can access KKHRIS by using your{' '}
                                                <span className="text-purple-400 font-semibold underline">mobile phone/tablet</span>!
                                            </>
                                        ) : (
                                            line
                                        )}
                                        {i < announcement.content.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
