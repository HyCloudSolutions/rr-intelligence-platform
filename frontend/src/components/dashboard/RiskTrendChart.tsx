'use client';

interface TrendPoint {
    month: string;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
}

export function RiskTrendChart({ data }: { data: TrendPoint[] }) {
    // Calculate max for Y-axis scaling
    const allValues = data.flatMap(d => [d.high_risk, d.medium_risk, d.low_risk]);
    const maxVal = Math.max(...allValues, 1);
    const yMax = Math.ceil(maxVal / 50) * 50 || 100;

    const chartWidth = 800;
    const chartHeight = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerW = chartWidth - padding.left - padding.right;
    const innerH = chartHeight - padding.top - padding.bottom;

    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

    function buildPath(key: 'high_risk' | 'medium_risk' | 'low_risk') {
        return data.map((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + innerH - (d[key] / yMax) * innerH;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }

    function buildArea(key: 'high_risk' | 'medium_risk' | 'low_risk') {
        const linePath = buildPath(key);
        const lastX = padding.left + (data.length - 1) * xStep;
        const firstX = padding.left;
        const baseY = padding.top + innerH;
        return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
    }

    const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Risk Distribution Trends</h3>
                    <p className="text-xs text-slate-400 mt-0.5">12-month jurisdiction overview</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-slate-500">High Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-slate-500">Medium Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Low Risk</span>
                    </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[600px]">
                    <defs>
                        <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {yTicks.map((tick) => {
                        const y = padding.top + innerH - (tick / yMax) * innerH;
                        return (
                            <g key={tick}>
                                <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#94a3b8">{Math.round(tick)}</text>
                            </g>
                        );
                    })}

                    {/* X-axis labels */}
                    {data.map((d, i) => (
                        <text key={i} x={padding.left + i * xStep} y={chartHeight - 8} textAnchor="middle" className="text-[10px]" fill="#94a3b8">
                            {d.month.substring(0, 3)}
                        </text>
                    ))}

                    {/* Area fills */}
                    <path d={buildArea('high_risk')} fill="url(#highGrad)" />
                    <path d={buildArea('medium_risk')} fill="url(#medGrad)" />
                    <path d={buildArea('low_risk')} fill="url(#lowGrad)" />

                    {/* Lines */}
                    <path d={buildPath('high_risk')} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={buildPath('medium_risk')} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={buildPath('low_risk')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data points */}
                    {data.map((d, i) => {
                        const x = padding.left + i * xStep;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={padding.top + innerH - (d.high_risk / yMax) * innerH} r="3" fill="#ef4444" />
                                <circle cx={x} cy={padding.top + innerH - (d.medium_risk / yMax) * innerH} r="3" fill="#f59e0b" />
                                <circle cx={x} cy={padding.top + innerH - (d.low_risk / yMax) * innerH} r="3" fill="#10b981" />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
