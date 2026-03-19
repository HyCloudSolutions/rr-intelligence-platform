'use client';

interface RiskCardProps {
    id: string;
    name: string;
    license_id: string;
    address: string;
    facility_type: string;
    risk_score: number;
    risk_band: 'High' | 'Medium' | 'Low';
    factors: { name: string; weight: number }[];
    assigned_inspector?: string | null;
}

const riskConfig = {
    High: {
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-500',
        glow: 'shadow-red-500/20',
        ring: 'text-red-500',
        track: 'text-red-100',
        barBg: 'bg-red-500',
        barTrack: 'bg-red-100',
    },
    Medium: {
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-500',
        glow: 'shadow-amber-500/20',
        ring: 'text-amber-500',
        track: 'text-amber-100',
        barBg: 'bg-amber-500',
        barTrack: 'bg-amber-100',
    },
    Low: {
        gradient: 'from-emerald-500 to-green-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-500',
        glow: 'shadow-emerald-500/20',
        ring: 'text-emerald-500',
        track: 'text-emerald-100',
        barBg: 'bg-emerald-500',
        barTrack: 'bg-emerald-100',
    },
};

function ScoreGauge({ score, band }: { score: number; band: 'High' | 'Medium' | 'Low' }) {
    const config = riskConfig[band];
    const circumference = 2 * Math.PI * 40;
    const progress = (score / 100) * circumference;

    return (
        <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    strokeWidth="8"
                    className={config.track}
                    stroke="currentColor"
                />
                <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    strokeWidth="8"
                    className={config.ring}
                    stroke="currentColor"
                    strokeDasharray={`${progress} ${circumference}`}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dasharray 1s ease-out',
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{score.toFixed(1)}</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">risk</span>
            </div>
        </div>
    );
}

function FactorBar({ name, weight, band }: { name: string; weight: number; band: 'High' | 'Medium' | 'Low' }) {
    const config = riskConfig[band];
    const percentage = Math.round(weight * 100);

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">{name}</span>
                <span className="text-slate-400 font-semibold">{percentage}%</span>
            </div>
            <div className={`h-1.5 rounded-full ${config.barTrack} overflow-hidden`}>
                <div
                    className={`h-full rounded-full ${config.barBg} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export function RiskCard({ id, name, license_id, address, facility_type, risk_score, risk_band, factors, assigned_inspector }: RiskCardProps) {
    const config = riskConfig[risk_band];
    const initials = assigned_inspector ? assigned_inspector.split(' ').map(n => n[0]).join('') : '';

    return (
        <div className={`bg-white rounded-xl border ${config.border} shadow-sm hover:shadow-lg ${config.glow} transition-all duration-300 overflow-hidden group`}>
            {/* Gradient top accent */}
            <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

            <div className="p-5">
                {/* Header: Name + Score Gauge */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-1 w-full min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-full">{name}</h3>
                            <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white ${config.badge}`}>
                                {risk_band}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">{address}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                            <span className="inline-flex items-center text-[10px] sm:text-xs text-slate-400">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                </svg>
                                <span className="truncate">{license_id}</span>
                            </span>
                            <span className="inline-flex items-center text-[10px] sm:text-xs text-slate-400">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                                </svg>
                                <span className="truncate">{facility_type}</span>
                            </span>
                        </div>
                        {assigned_inspector && (
                            <div className="flex items-center gap-2 mt-2.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                    {initials}
                                </div>
                                <span className="text-xs font-medium text-blue-700">{assigned_inspector}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-auto flex justify-end sm:block mt-4 sm:mt-0">
                        <ScoreGauge score={risk_score} band={risk_band} />
                    </div>
                </div>

                {/* Explainable AI Factors */}
                <div className={`mt-4 pt-4 border-t border-slate-100`}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                        AI Risk Drivers
                    </p>
                    <div className="space-y-2.5">
                        {factors.map((f, i) => (
                            <FactorBar key={i} name={f.name} weight={f.weight} band={risk_band} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
