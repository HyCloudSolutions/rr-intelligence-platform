import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

async function getInspectorPerformance(token: string) {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    try {
        const res = await fetch(`${apiUrl}/api/v1/dashboard/jurisdiction-summary`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error("Inspector performance fetch error", err);
        return null;
    }
}

const avatarColors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
];

const zones = ['North District', 'South District', 'East District', 'West District', 'Central District'];

export default async function InspectorPerformancePage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "director") redirect("/login");

    const data = await getInspectorPerformance(session.accessToken as string);

    const inspectors = data?.inspector_stats || [];

    return (
        <div className="min-h-screen">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-900">Inspector Performance</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Team efficiency and workload analysis</p>
                </div>
            </header>

            <div className="px-8 py-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Active Inspectors</div>
                        <div className="text-3xl font-bold text-slate-900">{inspectors.length}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Inspections (30d)</div>
                        <div className="text-3xl font-bold text-slate-900">
                            {inspectors.reduce((s: number, i: any) => s + i.inspections_completed, 0)}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Avg Catch Rate</div>
                        <div className="text-3xl font-bold text-amber-600">
                            {inspectors.length > 0
                                ? (inspectors.reduce((s: number, i: any) => s + i.catch_rate, 0) / inspectors.length * 100).toFixed(1)
                                : 0}%
                        </div>
                    </div>
                </div>

                {/* Inspector Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {inspectors.map((inspector: any, i: number) => {
                        const initials = inspector.name.split(' ').map((n: string) => n[0]).join('');
                        const catchPct = (inspector.catch_rate * 100).toFixed(1);
                        return (
                            <div key={inspector.name} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                {/* Inspector Header */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                                        {initials}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">{inspector.name}</h3>
                                        <p className="text-xs text-slate-400">{zones[i % zones.length]}</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <div className="text-lg font-bold text-blue-700">{inspector.inspections_completed}</div>
                                        <div className="text-[10px] text-blue-500 font-medium uppercase">Completed</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                                        <div className="text-lg font-bold text-amber-700">{catchPct}%</div>
                                        <div className="text-[10px] text-amber-500 font-medium uppercase">Catch Rate</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <div className="text-lg font-bold text-slate-700">{inspector.avg_score_found}</div>
                                        <div className="text-[10px] text-slate-500 font-medium uppercase">Avg Score</div>
                                    </div>
                                </div>

                                {/* Performance Bar */}
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-400">Daily Target</span>
                                        <span className="text-slate-600 font-medium">{Math.round(inspector.inspections_completed / 30)}/day</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${avatarColors[i % avatarColors.length]} transition-all duration-700`}
                                            style={{ width: `${Math.min(100, (inspector.inspections_completed / 30 / 5) * 100)}%` }}
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
