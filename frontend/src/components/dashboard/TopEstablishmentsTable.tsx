'use client';

import { useState, useMemo } from 'react';

interface TopEstablishment {
    id: string;
    name: string;
    address: string;
    facility_type: string;
    risk_score: number;
    risk_band: string;
    last_inspection: string | null;
    trend: string;
    owner?: string | null;
    last_inspector_name?: string | null;
}

const bandStyles: Record<string, string> = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const trendIcons: Record<string, { icon: string; color: string }> = {
    up: { icon: '↑', color: 'text-red-500' },
    down: { icon: '↓', color: 'text-emerald-500' },
    stable: { icon: '→', color: 'text-slate-400' },
};

export function TopEstablishmentsTable({ data }: { data: TopEstablishment[] }) {
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [limit, setLimit] = useState(10);

    const filtered = useMemo(() => {
        let result = data;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(e => e.name.toLowerCase().includes(q) || e.address.toLowerCase().includes(q));
        }
        if (riskFilter) result = result.filter(e => e.risk_band === riskFilter);
        if (typeFilter) result = result.filter(e => e.facility_type === typeFilter);
        return result.slice(0, limit);
    }, [data, search, riskFilter, typeFilter, limit]);

    const facilityTypes = useMemo(() => [...new Set(data.map(e => e.facility_type))], [data]);
    const hasFilters = search || riskFilter || typeFilter;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Top Risky Establishments</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Ranked by current risk score · {filtered.length} of {data.length}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[10, 25, 50].map(n => (
                            <button
                                key={n}
                                onClick={() => setLimit(n)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${limit === n
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                Top {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or address..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <select
                        value={riskFilter}
                        onChange={e => setRiskFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Risk Levels</option>
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        {facilityTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    {hasFilters && (
                        <button
                            onClick={() => { setSearch(''); setRiskFilter(''); setTypeFilter(''); }}
                            className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-t border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">#</th>
                            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Establishment</th>
                            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Owner</th>
                            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Type</th>
                            <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Score</th>
                            <th className="text-center px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Band</th>
                            <th className="text-center px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Trend</th>
                            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Last Inspector</th>
                            <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Last Inspected</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">
                                    No establishments match your filters
                                </td>
                            </tr>
                        ) : (
                            filtered.map((est, i) => {
                                const trend = trendIcons[est.trend] || trendIcons.stable;
                                const ownerInitials = est.owner ? est.owner.split(' ').map(n => n[0]).join('') : '';
                                const inspectorInitials = est.last_inspector_name ? est.last_inspector_name.split(' ').map(n => n[0]).join('') : '';
                                return (
                                    <tr key={est.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{est.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{est.address}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {est.owner ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                                        {ownerInitials}
                                                    </div>
                                                    <span className="text-slate-600 text-xs font-medium">{est.owner}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">{est.facility_type}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-bold text-slate-900">{typeof est.risk_score === 'number' ? est.risk_score.toFixed(1) : est.risk_score}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${bandStyles[est.risk_band] || 'bg-slate-50 text-slate-500'}`}>
                                                {est.risk_band}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-bold ${trend.color}`}>{trend.icon}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {est.last_inspector_name ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                                        {inspectorInitials}
                                                    </div>
                                                    <span className="text-slate-600 text-xs font-medium">{est.last_inspector_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-400 text-xs">
                                            {est.last_inspection || '—'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
