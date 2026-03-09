import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

interface ScorePoint { date: string; score: number; band: string; }
interface InspectionRecord { id: string; date: string; result: string; critical_violations: number; non_critical_violations: number; }
interface RiskFactor { name: string; weight: number; }
interface EstInfo { id: string; name: string; license_id: string; address: string; facility_type: string; is_active: boolean; }
interface DetailData {
    establishment: EstInfo;
    current_score: number | null;
    current_band: string | null;
    score_history: ScorePoint[];
    inspections: InspectionRecord[];
    risk_factors: RiskFactor[];
}

async function getEstablishmentDetail(token: string, id: string): Promise<DetailData | null> {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    try {
        const res = await fetch(`${apiUrl}/api/v1/establishments/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

function bandColor(band: string) {
    if (band === 'High') return { border: 'border-red-500', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
    if (band === 'Medium') return { border: 'border-amber-500', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' };
    return { border: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' };
}

function resultStyle(result: string) {
    if (result === 'Pass') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (result === 'Fail') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default async function EstablishmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const data = await getEstablishmentDetail(session.accessToken as string, id);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm">
                    <h3 className="text-slate-800 font-semibold text-lg">Not Found</h3>
                    <p className="text-sm text-slate-400 mt-1">This establishment could not be found.</p>
                    <Link href="/inspector/queue" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">← Back to Queue</Link>
                </div>
            </div>
        );
    }

    const { establishment: est, current_score, current_band, score_history, inspections, risk_factors } = data;
    const bc = bandColor(current_band || 'Low');

    // Score trajectory SVG
    const chartW = 700, chartH = 200;
    const pad = { top: 15, right: 15, bottom: 30, left: 45 };
    const iW = chartW - pad.left - pad.right;
    const iH = chartH - pad.top - pad.bottom;
    const maxScore = 100;
    const linePath = score_history.map((p, i) => {
        const x = pad.left + (i / Math.max(score_history.length - 1, 1)) * iW;
        const y = pad.top + iH - (p.score / maxScore) * iH;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    const areaPath = `${linePath} L ${pad.left + iW} ${pad.top + iH} L ${pad.left} ${pad.top + iH} Z`;

    const yTicks = [0, 25, 50, 75, 100];
    const xLabelCount = Math.min(score_history.length, 7);
    const xStep = Math.floor(score_history.length / xLabelCount) || 1;

    return (
        <div className="min-h-screen pb-16 md:pb-0">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-[56px] md:top-0 z-10">
                <div className="px-4 md:px-8 py-4 md:py-5">
                    <Link href="/inspector/queue" className="text-xs text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block">← Back to Queue</Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{est.name}</h1>
                            <p className="text-sm text-slate-400 mt-0.5">{est.address}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {current_band && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bc.light} ${bc.text}`}>
                                    {current_band} Risk
                                </span>
                            )}
                            {current_score !== null && (
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${bc.light} flex flex-col items-center justify-center flex-shrink-0`}>
                                    <span className={`text-base md:text-lg font-bold ${bc.text}`}>{typeof current_score === 'number' ? current_score.toFixed(1) : current_score}</span>
                                    <span className="text-[8px] text-slate-400 uppercase font-semibold">Score</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 md:px-8 py-6 space-y-6">
                {/* Info bar */}
                <div className="flex gap-4 flex-wrap">
                    <div className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
                        <span className="text-slate-400">License:</span> <span className="font-semibold text-slate-700">{est.license_id}</span>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
                        <span className="text-slate-400">Type:</span> <span className="font-semibold text-slate-700">{est.facility_type}</span>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
                        <span className="text-slate-400">Status:</span> <span className={`font-semibold ${est.is_active ? 'text-emerald-600' : 'text-red-500'}`}>{est.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>

                {/* Score Trajectory + Risk Factors */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Score Trajectory (2/3 width) */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Score Trajectory</h3>
                        <p className="text-xs text-slate-400 mb-4">30-day risk score evolution</p>

                        <div className="w-full overflow-hidden">
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>

                                {/* Risk zone bands */}
                                <rect x={pad.left} y={pad.top} width={iW} height={iH * 0.3} fill="#fef2f2" opacity="0.5" rx="2" />
                                <rect x={pad.left} y={pad.top + iH * 0.3} width={iW} height={iH * 0.3} fill="#fffbeb" opacity="0.4" rx="2" />
                                <rect x={pad.left} y={pad.top + iH * 0.6} width={iW} height={iH * 0.4} fill="#f0fdf4" opacity="0.4" rx="2" />

                                {/* Zone labels */}
                                <text x={pad.left + 4} y={pad.top + 12} className="text-[8px]" fill="#ef4444" opacity="0.6">HIGH</text>
                                <text x={pad.left + 4} y={pad.top + iH * 0.3 + 12} className="text-[8px]" fill="#f59e0b" opacity="0.6">MED</text>
                                <text x={pad.left + 4} y={pad.top + iH * 0.6 + 12} className="text-[8px]" fill="#10b981" opacity="0.6">LOW</text>

                                {/* Grid */}
                                {yTicks.map(t => {
                                    const y = pad.top + iH - (t / 100) * iH;
                                    return (
                                        <g key={t}>
                                            <line x1={pad.left} x2={pad.left + iW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                                            <text x={pad.left - 6} y={y + 3} textAnchor="end" className="text-[9px]" fill="#94a3b8">{t}</text>
                                        </g>
                                    );
                                })}

                                {/* X labels */}
                                {score_history.filter((_, i) => i % xStep === 0).map((p, i) => {
                                    const idx = i * xStep;
                                    const x = pad.left + (idx / Math.max(score_history.length - 1, 1)) * iW;
                                    return <text key={i} x={x} y={chartH - 5} textAnchor="middle" className="text-[9px]" fill="#94a3b8">{p.date.substring(5)}</text>;
                                })}

                                {/* Area + Line */}
                                <path d={areaPath} fill="url(#scoreGrad)" />
                                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Dots */}
                                {score_history.map((p, i) => {
                                    const x = pad.left + (i / Math.max(score_history.length - 1, 1)) * iW;
                                    const y = pad.top + iH - (p.score / maxScore) * iH;
                                    const dotColor = p.band === 'High' ? '#ef4444' : p.band === 'Medium' ? '#f59e0b' : '#10b981';
                                    return i % 3 === 0 || i === score_history.length - 1 ? (
                                        <circle key={i} cx={x} cy={y} r="3" fill={dotColor} />
                                    ) : null;
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Risk Factors (1/3 width) */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Risk Factors</h3>
                        <p className="text-xs text-slate-400 mb-5">Captum explainability breakdown</p>
                        <div className="space-y-4">
                            {risk_factors.map((f, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-700 font-medium">{f.name}</span>
                                        <span className="text-slate-400 font-semibold">{(f.weight * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                            style={{ width: `${f.weight * 100}%`, transition: 'width 1s ease-out' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inspection History */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 pb-4">
                        <h3 className="text-base font-bold text-slate-900">Inspection History</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Past inspection outcomes and violations</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-t border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-6 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Date</th>
                                    <th className="text-center px-6 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Result</th>
                                    <th className="text-center px-6 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Critical</th>
                                    <th className="text-center px-6 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Non-Critical</th>
                                    <th className="text-center px-6 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspections.map((insp) => (
                                    <tr key={insp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700">{insp.date}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${resultStyle(insp.result)}`}>
                                                {insp.result}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`font-bold ${insp.critical_violations > 0 ? 'text-red-600' : 'text-slate-300'}`}>{insp.critical_violations}</span>
                                        </td>
                                        <td className="px-6 py-3 text-center text-slate-500">{insp.non_critical_violations}</td>
                                        <td className="px-6 py-3 text-center font-semibold text-slate-700">{insp.critical_violations + insp.non_critical_violations}</td>
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
