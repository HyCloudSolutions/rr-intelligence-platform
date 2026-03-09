import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

async function getDashboardData(token: string) {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    try {
        const res = await fetch(`${apiUrl}/api/v1/dashboard/jurisdiction-summary`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        return null;
    }
}

async function getQueueData(token: string) {
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

const bandStyles: Record<string, string> = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default async function EstablishmentProfilesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "director") redirect("/login");

    const [dashboard, queue] = await Promise.all([
        getDashboardData(session.accessToken as string),
        getQueueData(session.accessToken as string),
    ]);

    const establishments = queue || [];
    const topEstablishments = dashboard?.top_establishments || [];

    // Create a map of risk data by establishment for the sparkline
    const riskMap = new Map<string, any>();
    for (const est of topEstablishments) {
        riskMap.set(est.id, est);
    }

    return (
        <div className="min-h-screen">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-900">Establishment Profiles</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{establishments.length.toLocaleString()} active establishments in jurisdiction</p>
                </div>
            </header>

            <div className="px-8 py-6">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Active</div>
                        <div className="text-3xl font-bold text-slate-900">{establishments.length.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">High Risk</div>
                        <div className="text-3xl font-bold text-red-600">
                            {establishments.filter((e: any) => e.risk_data?.risk_band === 'High').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Facility Types</div>
                        <div className="text-3xl font-bold text-blue-600">
                            {new Set(establishments.map((e: any) => e.facility_type)).size}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Establishment</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">License</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Type</th>
                                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Risk Score</th>
                                    <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Band</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Inspector</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Risk Factors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {establishments.slice(0, 50).map((est: any, i: number) => {
                                    const band = est.risk_data?.risk_band || 'Low';
                                    const score = est.risk_data?.risk_score || 0;
                                    return (
                                        <tr key={est.id || i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">{est.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{est.address}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{est.license_id}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{est.facility_type}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-bold text-slate-900">{score.toFixed(1)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${bandStyles[band] || 'bg-slate-50 text-slate-500'}`}>
                                                    {band}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {est.assigned_inspector ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                                                            {est.assigned_inspector.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <span className="text-xs text-slate-600">{est.assigned_inspector}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {est.risk_data && (
                                                        <>
                                                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={est.risk_data.factor_1_name}>
                                                                {est.risk_data.factor_1_name}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                {(est.risk_data.factor_1_weight * 100).toFixed(0)}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {establishments.length > 50 && (
                        <div className="px-4 py-3 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
                            Showing 50 of {establishments.length.toLocaleString()} establishments
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
