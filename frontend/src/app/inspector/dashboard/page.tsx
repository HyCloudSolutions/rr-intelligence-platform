import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getInspectorQueue(token: string) {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    try {
        const res = await fetch(`${apiUrl}/api/v1/queue/daily`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        return [];
    }
}

export default async function InspectorDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "inspector") redirect("/login");

    const queue = await getInspectorQueue(session.accessToken as string);

    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const total = queue.length;
    const highCount = queue.filter((q: any) => q.risk_data?.risk_band === 'High').length;
    const medCount = queue.filter((q: any) => q.risk_data?.risk_band === 'Medium').length;
    const lowCount = queue.filter((q: any) => q.risk_data?.risk_band === 'Low').length;

    // Mock completed (would come from real data)
    const completed = Math.floor(Math.random() * 3);
    const remaining = total - completed;

    // Recent activity (simulate from queue data)
    const recentCompleted = queue.slice(0, Math.min(5, completed)).map((item: any, i: number) => ({
        name: item.name,
        outcome: i % 3 === 0 ? 'Fail' : i % 3 === 1 ? 'Pass' : 'Conditional',
        time: `${9 + i}:${30 + i * 15 < 60 ? (30 + i * 15) : '00'} AM`,
    }));

    // Streak tracker (mock)
    const streak = 12;
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dayOfWeek = today.getDay();

    return (
        <div className="min-h-screen">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-5">
                    <h1 className="text-xl font-bold text-slate-900">{greeting}, Inspector</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{formattedDate}</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                {/* Today's Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-slate-900">{total}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Assigned</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-emerald-600">{completed}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Completed</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-blue-600">{remaining}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Remaining</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-red-600">{highCount}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">High Risk</div>
                    </div>
                </div>

                {/* Quick Action */}
                <Link
                    href="/inspector/queue"
                    className="block bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-lg">Start Next Inspection</h3>
                            <p className="text-blue-100 text-sm mt-0.5">{remaining} inspections remaining today</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Breakdown */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Today&apos;s Queue by Risk</h3>
                        <p className="text-xs text-slate-400 mb-4">Your assigned inspections breakdown</p>

                        <div className="space-y-3">
                            {[
                                { label: 'High Risk', count: highCount, color: 'bg-red-500', total: total },
                                { label: 'Medium Risk', count: medCount, color: 'bg-amber-500', total: total },
                                { label: 'Low Risk', count: lowCount, color: 'bg-emerald-500', total: total },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-600 font-medium">{item.label}</span>
                                        <span className="text-slate-900 font-bold">{item.count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${item.total > 0 ? (item.count / item.total * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Streak Tracker */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Inspection Streak</h3>
                        <p className="text-xs text-slate-400 mb-4">Consecutive days with completed inspections</p>

                        <div className="text-center mb-4">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-3">
                                <span className="text-2xl">🔥</span>
                                <span className="text-3xl font-bold text-amber-700">{streak}</span>
                                <span className="text-sm text-amber-600 font-medium">day streak</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            {weekDays.map((day, i) => {
                                const adjustedIndex = (i + 1) % 7; // Monday = 0
                                const isToday = adjustedIndex === dayOfWeek;
                                const isPast = adjustedIndex < dayOfWeek || (dayOfWeek === 0 && i < 6);
                                return (
                                    <div key={i} className="text-center">
                                        <div className="text-[10px] text-slate-400 font-medium mb-1">{day}</div>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${isToday
                                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                            : isPast
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {isPast ? '✓' : isToday ? '•' : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                {recentCompleted.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Recent Activity</h3>
                        <p className="text-xs text-slate-400 mb-4">Your latest completed inspections</p>
                        <div className="space-y-3">
                            {recentCompleted.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.outcome === 'Pass' ? 'bg-emerald-500' :
                                            item.outcome === 'Fail' ? 'bg-red-500' : 'bg-amber-500'
                                            }`} />
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.outcome === 'Pass' ? 'bg-emerald-50 text-emerald-700' :
                                            item.outcome === 'Fail' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            {item.outcome}
                                        </span>
                                        <span className="text-xs text-slate-400">{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
