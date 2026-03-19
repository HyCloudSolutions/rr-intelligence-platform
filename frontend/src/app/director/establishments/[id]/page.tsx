'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';

interface RiskFactor { name: string; weight: number; }
interface ScorePoint { date: string; score: number; band: string; }
interface InspectionRecord { id: string; date: string; result: string; critical_violations: number; non_critical_violations: number; }
interface EstInfo { id: string; name: string; license_id: string; address: string; facility_type: string; is_active: boolean; }
interface DetailData {
    establishment: EstInfo;
    current_score: number | null;
    current_band: string | null;
    score_history: ScorePoint[];
    inspections: InspectionRecord[];
    risk_factors: RiskFactor[];
}

const bandColors: Record<string, string> = {
    High: 'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    Low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};
const bandGaugeColors: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const resultBadge: Record<string, string> = {
    Pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Fail: 'bg-red-50 text-red-700 border-red-200',
    'Pass w/ Conditions': 'bg-amber-50 text-amber-700 border-amber-200',
    Conditional: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function EstablishmentDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.accessToken || !params.id) return;
        fetch(`/api/v1/establishments/${params.id}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        })
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [session?.accessToken, params.id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );
    if (!data) return (
        <div className="min-h-screen flex items-center justify-center text-slate-400">
            Establishment not found.
        </div>
    );

    const { establishment: est, current_score, current_band, score_history, inspections, risk_factors } = data;
    const gaugePercent = current_score ? current_score / 100 : 0;
    const gaugeColor = bandGaugeColors[current_band || 'Medium'] || '#6b7280';

    // SVG gauge math
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - gaugePercent * 0.75); // 270-degree arc

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-4 sm:px-8 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-slate-900 truncate">{est.name}</h1>
                        <p className="text-xs text-slate-400 truncate">{est.address} · {est.facility_type} · License: {est.license_id}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${est.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {est.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </header>

            <div className="px-4 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto">
                {/* Row 1: Risk Score + Why This Score */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Score Gauge */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
                        <h2 className="text-sm font-semibold text-slate-600 mb-4 self-start">Current Risk Score</h2>
                        <div className="relative">
                            <svg width="180" height="145" viewBox="0 0 180 160">
                                {/* Background arc */}
                                <circle cx="90" cy="90" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12"
                                    strokeDasharray={strokeDasharray} strokeDashoffset={circumference * 0.25}
                                    strokeLinecap="round" transform="rotate(135 90 90)" />
                                {/* Value arc */}
                                <circle cx="90" cy="90" r={radius} fill="none" stroke={gaugeColor} strokeWidth="12"
                                    strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round" transform="rotate(135 90 90)"
                                    className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                                <span className="text-4xl font-bold" style={{ color: gaugeColor }}>
                                    {current_score ? current_score.toFixed(1) : '—'}
                                </span>
                                <span className={`mt-1 px-3 py-0.5 rounded-full text-xs font-semibold border ${bandColors[current_band || 'Medium'] || ''}`}>
                                    {current_band || 'Unknown'} Risk
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Why This Score */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-slate-600 mb-1">Why This Score?</h2>
                        <p className="text-xs text-slate-400 mb-5">Top XGBoost feature importances for this establishment</p>
                        <div className="space-y-4">
                            {risk_factors.map((f, i) => {
                                const pct = Math.round(f.weight * 100);
                                const barColors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-medium text-slate-700">{f.name}</span>
                                            <span className="text-sm font-bold text-slate-900">{pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3">
                                            <div className={`h-3 rounded-full ${barColors[i % barColors.length]} transition-all duration-700 ease-out`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-700">
                                <strong>ML Model:</strong> Risk scores are generated nightly by an XGBoost classifier trained on historical inspection outcomes.
                                Higher weights indicate factors with more influence on this establishment&apos;s predicted failure probability.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Row 2: Score Trend */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-slate-600 mb-1">30-Day Risk Score Trend</h2>
                    <p className="text-xs text-slate-400 mb-4">Daily ML predictions over the last month</p>
                    {score_history.length > 0 ? (
                        <div className="h-40 flex items-end gap-[2px]">
                            {score_history.map((pt, i) => {
                                const barH = Math.max(4, (pt.score / 100) * 140);
                                const color = pt.band === 'High' ? 'bg-red-400' : pt.band === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400';
                                return (
                                    <div key={i} className="flex-1 group relative">
                                        <div className={`w-full ${color} rounded-t transition-all hover:opacity-80`} style={{ height: `${barH}px` }} />
                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                                            {pt.date}: {pt.score.toFixed(1)} ({pt.band})
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">No score history available.</p>
                    )}
                </div>

                {/* Row 3: Inspection History */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-600">Inspection History</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Last {inspections.length} inspections on file</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Date</th>
                                    <th className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Result</th>
                                    <th className="text-center px-5 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Critical Violations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspections.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-8 text-slate-400">No inspections recorded.</td></tr>
                                ) : inspections.map(insp => (
                                    <tr key={insp.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                                        <td className="px-5 py-3 text-slate-700 font-medium">{insp.date}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${resultBadge[insp.result] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {insp.result}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`font-bold ${insp.critical_violations > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {insp.critical_violations}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
