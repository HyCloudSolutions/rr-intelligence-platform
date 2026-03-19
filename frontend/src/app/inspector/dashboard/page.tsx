'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface QueueItem {
    id: string;
    establishment_id: string;
    establishment_name: string;
    address: string;
    risk_score: number;
    risk_band: string;
    priority: number;
    status: string;
}

const bandStyles: Record<string, string> = {
    High: 'bg-red-500',
    Medium: 'bg-amber-500',
    Low: 'bg-emerald-500',
};

export default function InspectorDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.accessToken) return;
        fetch('/api/v1/queue', {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setQueue(data);
                else if (data?.items) setQueue(data.items);
                else setQueue([]);
            })
            .catch(() => setQueue([]))
            .finally(() => setLoading(false));
    }, [session?.accessToken]);

    const pendingItems = queue.filter(q => q.status === 'pending' || q.status === 'assigned');
    const completedItems = queue.filter(q => q.status === 'completed');

    return (
        <div className="px-4 py-5">
            {/* Welcome */}
            <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">My Inspection Queue</h2>
                <p className="text-xs text-slate-400 mt-0.5">{pendingItems.length} inspections pending today</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <span className="text-2xl font-bold text-blue-600">{pendingItems.length}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pending</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <span className="text-2xl font-bold text-emerald-600">{completedItems.length}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Done Today</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <span className="text-2xl font-bold text-slate-900">{queue.length}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total</p>
                </div>
            </div>

            {/* Queue Cards */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : pendingItems.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="font-semibold text-slate-900">All caught up!</h3>
                    <p className="text-sm text-slate-400 mt-1">No pending inspections in your queue.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pendingItems.map((item, i) => (
                        <button
                            key={item.id}
                            onClick={() => router.push(`/inspector/inspect/${item.establishment_id}`)}
                            className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left active:bg-slate-50 transition-colors shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-slate-400">#{i + 1}</span>
                                        <h3 className="font-semibold text-slate-900 truncate text-sm">{item.establishment_name}</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">{item.address}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${bandStyles[item.risk_band] || 'bg-slate-400'}`}>
                                        {Math.round(item.risk_score)}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{item.risk_band} Risk</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600">Tap to inspect →</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
