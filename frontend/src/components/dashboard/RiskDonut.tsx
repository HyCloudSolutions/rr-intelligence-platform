'use client';

interface RiskDistItem {
    band: string;
    count: number;
    percentage: number;
}

const bandColors: Record<string, { fill: string; text: string; bg: string }> = {
    High: { fill: '#ef4444', text: 'text-red-600', bg: 'bg-red-500' },
    Medium: { fill: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-500' },
    Low: { fill: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-500' },
};

export function RiskDonut({ data }: { data: RiskDistItem[] }) {
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    const radius = 70;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const segments = data.map((d) => {
        const pct = d.count / total;
        const dashLength = pct * circumference;
        const seg = { ...d, dashLength, dashOffset: offset, color: bandColors[d.band]?.fill || '#94a3b8' };
        offset += dashLength;
        return seg;
    });

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Risk Distribution</h3>
            <p className="text-xs text-slate-400 mb-6">Current establishment breakdown</p>

            <div className="flex items-center justify-center gap-8">
                {/* Donut */}
                <div className="relative w-44 h-44 flex-shrink-0">
                    <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                        {/* Background ring */}
                        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth={strokeWidth} stroke="#f1f5f9" />
                        {/* Segments */}
                        {segments.map((seg, i) => (
                            <circle
                                key={i}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                stroke={seg.color}
                                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                                strokeDashoffset={-seg.dashOffset}
                                strokeLinecap="butt"
                                style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{total}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                    {data.map((d) => {
                        const config = bandColors[d.band];
                        return (
                            <div key={d.band} className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${config?.bg || 'bg-slate-400'}`} />
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-slate-900">{d.count}</span>
                                        <span className="text-xs text-slate-400">{d.band}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{d.percentage}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
