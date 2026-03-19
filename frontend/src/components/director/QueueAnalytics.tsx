'use client';

interface QueueItem {
    id: string;
    name: string;
    facility_type: string;
    assigned_inspector?: string | null;
    risk_data: {
        risk_score: number;
        risk_band: 'High' | 'Medium' | 'Low';
    };
}

interface QueueAnalyticsProps {
    items: QueueItem[];
}

const bandColor: Record<string, { bg: string; text: string; bar: string }> = {
    High: { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-500' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
    Low: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
};

export function QueueAnalytics({ items }: QueueAnalyticsProps) {
    // ── Risk breakdown ──
    const riskCounts = { High: 0, Medium: 0, Low: 0 };
    items.forEach((i) => {
        const b = i.risk_data.risk_band;
        if (b in riskCounts) riskCounts[b as keyof typeof riskCounts]++;
    });
    const total = items.length || 1;

    // ── Inspector workload ──
    const inspectorMap = new Map<string, number>();
    items.forEach((i) => {
        const name = i.assigned_inspector || 'Unassigned';
        inspectorMap.set(name, (inspectorMap.get(name) || 0) + 1);
    });
    const inspectors = Array.from(inspectorMap.entries()).sort((a, b) => b[1] - a[1]);
    const maxWorkload = Math.max(...inspectors.map((i) => i[1]), 1);

    // ── Facility mix ──
    const facilityMap = new Map<string, number>();
    items.forEach((i) => {
        facilityMap.set(i.facility_type, (facilityMap.get(i.facility_type) || 0) + 1);
    });
    const facilities = Array.from(facilityMap.entries()).sort((a, b) => b[1] - a[1]);

    const facilityIcons: Record<string, string> = {
        Restaurant: '🍽️',
        Grocery: '🛒',
        Mobile: '🚚',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Risk Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Risk Breakdown
                </h4>
                <div className="space-y-2.5">
                    {(['High', 'Medium', 'Low'] as const).map((band) => {
                        const count = riskCounts[band];
                        const pct = Math.round((count / total) * 100);
                        const c = bandColor[band];
                        return (
                            <div key={band}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xs font-semibold ${c.text}`}>{band}</span>
                                    <span className="text-xs text-slate-400 font-medium">{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${c.bar} transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Inspector Workload */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Inspector Workload
                </h4>
                <div className="space-y-2">
                    {inspectors.map(([name, count]) => {
                        const initials = name.split(' ').map((n) => n[0]).join('');
                        const pct = Math.round((count / maxWorkload) * 100);
                        return (
                            <div key={name} className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-xs font-medium text-slate-600 truncate">{name}</span>
                                        <span className="text-xs text-slate-400 font-semibold flex-shrink-0 ml-2">{count}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Facility Type Mix */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Facility Type Mix
                </h4>
                <div className="space-y-3">
                    {facilities.map(([type, count]) => {
                        const pct = Math.round((count / total) * 100);
                        return (
                            <div key={type} className="flex items-center gap-3">
                                <span className="text-xl flex-shrink-0 w-8 text-center">{facilityIcons[type] || '🏢'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-slate-700">{type}</span>
                                        <span className="text-xs text-slate-400 font-medium">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
