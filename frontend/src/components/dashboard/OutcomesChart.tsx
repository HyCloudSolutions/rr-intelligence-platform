'use client';

interface OutcomeDataPoint {
    month: string;
    pass_count: number;
    fail_count: number;
    conditional_count: number;
}

export function OutcomesChart({ data }: { data: OutcomeDataPoint[] }) {
    const allValues = data.flatMap(d => [d.pass_count + d.fail_count + d.conditional_count]);
    const maxTotal = Math.max(...allValues, 1);
    const yMax = Math.ceil(maxTotal / 50) * 50 || 200;

    const chartWidth = 600;
    const chartHeight = 280;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerW = chartWidth - padding.left - padding.right;
    const innerH = chartHeight - padding.top - padding.bottom;

    const barGroupWidth = innerW / data.length;
    const barWidth = barGroupWidth * 0.2;
    const barGap = 3;

    const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Inspection Outcomes</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                        <span className="text-slate-500">Pass</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-slate-500">Fail</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-amber-500" />
                        <span className="text-slate-500">Conditional</span>
                    </div>
                </div>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
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

                {/* Bars */}
                {data.map((d, i) => {
                    const groupX = padding.left + i * barGroupWidth + barGroupWidth / 2;

                    const passH = (d.pass_count / yMax) * innerH;
                    const failH = (d.fail_count / yMax) * innerH;
                    const condH = (d.conditional_count / yMax) * innerH;

                    const baseY = padding.top + innerH;

                    return (
                        <g key={i}>
                            {/* Pass bar */}
                            <rect
                                x={groupX - barWidth * 1.5 - barGap}
                                y={baseY - passH}
                                width={barWidth}
                                height={passH}
                                rx={3}
                                fill="#10b981"
                                opacity={0.85}
                            />
                            {/* Fail bar */}
                            <rect
                                x={groupX - barWidth * 0.5}
                                y={baseY - failH}
                                width={barWidth}
                                height={failH}
                                rx={3}
                                fill="#ef4444"
                                opacity={0.85}
                            />
                            {/* Conditional bar */}
                            <rect
                                x={groupX + barWidth * 0.5 + barGap}
                                y={baseY - condH}
                                width={barWidth}
                                height={condH}
                                rx={3}
                                fill="#f59e0b"
                                opacity={0.85}
                            />
                            {/* Month label */}
                            <text x={groupX} y={chartHeight - 8} textAnchor="middle" className="text-[10px]" fill="#94a3b8">{d.month}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
