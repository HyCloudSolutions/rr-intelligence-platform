'use client';

interface CoverageData {
    high_risk_total: number;
    high_risk_inspected: number;
    total_inspections_today: number;
    target_daily: number;
}

export function CoverageGauge({ data }: { data: CoverageData }) {
    const pct = data.high_risk_total > 0
        ? Math.round((data.high_risk_inspected / data.high_risk_total) * 100)
        : 0;
    const dailyPct = data.target_daily > 0
        ? Math.round((data.total_inspections_today / data.target_daily) * 100)
        : 0;

    const radius = 65;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    const progress = (Math.min(pct, 100) / 100) * circumference;

    const getColor = (p: number) => {
        if (p >= 80) return { stroke: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'On Track' };
        if (p >= 50) return { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Behind' };
        return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-red-600', label: 'Critical' };
    };

    const colorConfig = getColor(pct);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Inspection Coverage</h3>
            <p className="text-xs text-slate-400 mb-6">High-risk establishments inspected this month</p>

            <div className="flex items-center gap-8">
                {/* Gauge */}
                <div className="relative w-40 h-40 flex-shrink-0">
                    <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth={strokeWidth} stroke="#f1f5f9" />
                        <circle
                            cx="100" cy="100" r={radius}
                            fill="none" strokeWidth={strokeWidth}
                            stroke={colorConfig.stroke}
                            strokeDasharray={`${progress} ${circumference - progress}`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{pct}%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${colorConfig.text}`}>{colorConfig.label}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-4 flex-1">
                    <div className={`${colorConfig.bg} rounded-lg p-3`}>
                        <div className="text-xs text-slate-500 mb-1">High-Risk Covered</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">{data.high_risk_inspected}</span>
                            <span className="text-sm text-slate-400">/ {data.high_risk_total}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Daily Progress</div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(dailyPct, 100)}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{data.total_inspections_today}/{data.target_daily}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
