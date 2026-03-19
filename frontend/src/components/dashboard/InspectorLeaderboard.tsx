'use client';

interface InspectorStat {
    name: string;
    inspections_completed: number;
    catch_rate: number;
    avg_score_found: number;
}

const avatarColors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
];

export function InspectorLeaderboard({ data }: { data: InspectorStat[] }) {
    const sorted = [...data].sort((a, b) => b.inspections_completed - a.inspections_completed);
    const maxInspections = Math.max(...sorted.map(d => d.inspections_completed), 1);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Inspector Leaderboard</h3>
            <p className="text-xs text-slate-400 mb-5">Last 30 days performance</p>

            <div className="space-y-3">
                {sorted.map((inspector, i) => {
                    const initials = inspector.name.split(' ').map(n => n[0]).join('');
                    const barWidth = (inspector.inspections_completed / maxInspections) * 100;
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

                    return (
                        <div key={inspector.name} className="group">
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="flex items-center gap-2 w-8 flex-shrink-0">
                                    {medal ? (
                                        <span className="text-lg">{medal}</span>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400 w-full text-center">{i + 1}</span>
                                    )}
                                </div>
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm`}>
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-800 truncate">{inspector.name}</span>
                                        <span className="text-sm font-bold text-slate-900 ml-2">{inspector.inspections_completed}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-[72px]">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${avatarColors[i % avatarColors.length]} transition-all duration-700`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-[10px] text-slate-400">
                                        Catch <span className="font-bold text-slate-600">{(inspector.catch_rate * 100).toFixed(0)}%</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
