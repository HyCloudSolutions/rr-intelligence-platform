'use client';

interface RepeatOffender {
    id: string;
    name: string;
    address: string;
    facility_type: string;
    consecutive_high_days: number;
    current_score: number;
    assigned_inspector: string | null;
}

export function RepeatOffenders({ data }: { data: RepeatOffender[] }) {
    const sorted = [...data].sort((a, b) => b.consecutive_high_days - a.consecutive_high_days);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <h3 className="text-base font-bold text-slate-900">Repeat Offenders</h3>
                </div>
                <p className="text-xs text-slate-400">Establishments with persistent HIGH risk (≥20 consecutive days)</p>
            </div>

            {sorted.length === 0 ? (
                <div className="px-6 pb-6">
                    <div className="bg-emerald-50 rounded-lg p-4 text-center">
                        <span className="text-emerald-600 text-sm font-medium">✓ No persistent high-risk establishments detected</span>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-t border-b border-slate-100 bg-red-50/30">
                                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Establishment</th>
                                <th className="text-center px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Consecutive Days</th>
                                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Current Score</th>
                                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Inspector</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((offender) => {
                                const severity = offender.consecutive_high_days >= 28 ? 'bg-red-50' : offender.consecutive_high_days >= 24 ? 'bg-amber-50/50' : '';
                                return (
                                    <tr key={offender.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${severity}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{offender.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{offender.address} · {offender.facility_type}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex items-center gap-1.5">
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: Math.min(Math.floor(offender.consecutive_high_days / 7), 4) }).map((_, i) => (
                                                        <div key={i} className="w-2 h-4 rounded-sm bg-red-500" />
                                                    ))}
                                                    {offender.consecutive_high_days >= 28 && <div className="w-2 h-4 rounded-sm bg-red-700 animate-pulse" />}
                                                </div>
                                                <span className="text-sm font-bold text-red-600">{offender.consecutive_high_days}d</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-lg font-bold text-red-600">{offender.current_score.toFixed(1)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {offender.assigned_inspector ? (
                                                <span className="text-xs font-medium text-slate-600">{offender.assigned_inspector}</span>
                                            ) : (
                                                <span className="text-xs text-red-400 font-medium">⚠ Unassigned</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
