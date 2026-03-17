import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { KPICards } from "@/components/dashboard/KPICards";
import { RiskTrendChart } from "@/components/dashboard/RiskTrendChart";
import { RiskDonut } from "@/components/dashboard/RiskDonut";
import { OutcomesChart } from "@/components/dashboard/OutcomesChart";
import { TopEstablishmentsTable } from "@/components/dashboard/TopEstablishmentsTable";
import { ModelAccuracyPanel } from "@/components/dashboard/ModelAccuracyPanel";
import { CoverageGauge } from "@/components/dashboard/CoverageGauge";
import { InspectorLeaderboard } from "@/components/dashboard/InspectorLeaderboard";
import { RepeatOffenders } from "@/components/dashboard/RepeatOffenders";
import { getBackendUrl } from "@/lib/backend";
import { redirect } from "next/navigation";

async function getDashboardData(token: string) {
    const apiUrl = getBackendUrl();
    try {
        const res = await fetch(`${apiUrl}/api/v1/dashboard/jurisdiction-summary`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error("Dashboard network error", err);
        return null;
    }
}

export default async function DirectorDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "director") {
        redirect("/login");
    }

    const data = await getDashboardData(session.accessToken as string);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm mx-4">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h3 className="text-slate-800 font-semibold text-lg">Connection Error</h3>
                    <p className="text-sm text-slate-400 mt-1">Unable to reach the ML backend. Ensure all services are running.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-900">Jurisdiction Analytics</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Real-time intelligence dashboard</p>
                </div>
            </header>

            {/* Dashboard Body */}
            <div className="px-8 py-6 space-y-6">
                <KPICards data={data.kpis} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RiskDonut data={data.risk_distribution} />
                    <CoverageGauge data={data.coverage} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ModelAccuracyPanel data={data.model_accuracy} />
                    <InspectorLeaderboard data={data.inspector_stats} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RiskTrendChart data={data.historical_trend} />
                    <OutcomesChart data={data.inspection_outcomes} />
                </div>

                <RepeatOffenders data={data.repeat_offenders} />

                <TopEstablishmentsTable data={data.top_establishments} />
            </div>
        </div>
    );
}
