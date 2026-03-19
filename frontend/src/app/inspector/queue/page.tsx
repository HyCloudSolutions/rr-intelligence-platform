import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RiskCard } from "@/components/RiskCard";
import { OutcomeForm } from "@/components/OutcomeForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBackendUrl } from "@/lib/backend";

interface QueueItem {
    id: string;
    name: string;
    license_id: string;
    address: string;
    facility_type: string;
    assigned_inspector?: string | null;
    risk_data: {
        id: string;
        score_date: string;
        risk_score: number;
        risk_band: "High" | "Medium" | "Low";
        factor_1_name: string;
        factor_1_weight: number;
        factor_2_name: string;
        factor_2_weight: number;
        factor_3_name: string;
        factor_3_weight: number;
    };
}

async function getDailyQueue(token: string): Promise<QueueItem[]> {
    const apiUrl = getBackendUrl();
    try {
        const res = await fetch(`${apiUrl}/api/v1/queue/daily`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        console.error("Failed to fetch queue", err);
        return [];
    }
}

export default async function InspectorQueuePage() {
    const session = await getServerSession(authOptions);

    if (!session || !['inspector', 'director'].includes(session.user.role)) {
        redirect("/login");
    }

    const queue = await getDailyQueue(session.accessToken as string);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const highCount = queue.filter(q => q.risk_data.risk_band === 'High').length;
    const medCount = queue.filter(q => q.risk_data.risk_band === 'Medium').length;

    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Daily Queue</h1>
                            <p className="text-sm text-slate-400 mt-0.5">{today}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {highCount > 0 && (
                                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                                    {highCount} High
                                </span>
                            )}
                            {medCount > 0 && (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100">
                                    {medCount} Med
                                </span>
                            )}
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">
                                {queue.length} Total
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Queue List */}
            <main className="max-w-3xl mx-auto px-6 py-6">
                {queue.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-slate-600 font-semibold text-lg">Queue Clear</h3>
                        <p className="text-sm text-slate-400 mt-1">No inspections scheduled for today.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {queue.map((item) => (
                            <div key={item.id}>
                                <Link href={`/establishment/${item.id}`} className="block hover:scale-[1.01] transition-transform duration-200">
                                    <RiskCard
                                        id={item.id}
                                        name={item.name}
                                        license_id={item.license_id}
                                        address={item.address}
                                        facility_type={item.facility_type}
                                        risk_score={item.risk_data.risk_score}
                                        risk_band={item.risk_data.risk_band}
                                        factors={[
                                            { name: item.risk_data.factor_1_name, weight: item.risk_data.factor_1_weight },
                                            { name: item.risk_data.factor_2_name, weight: item.risk_data.factor_2_weight },
                                            { name: item.risk_data.factor_3_name, weight: item.risk_data.factor_3_weight },
                                        ]}
                                        assigned_inspector={item.assigned_inspector}
                                    />
                                </Link>
                                <OutcomeForm
                                    establishmentId={item.id}
                                    establishmentName={item.name}
                                    token={session.accessToken as string}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
