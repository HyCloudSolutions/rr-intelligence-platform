"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import OnboardTenantModal from "@/components/OnboardTenantModal";

interface Tenant {
    id: string;
    name: string;
    contact_email: string;
    tier: string;
}

interface TenantStats {
    establishment_count: number;
    inspection_count: number;
    user_count: number;
    created_at: string;
}

export default function SuperAdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        
        if (session?.user && (session.user as any).role !== "superadmin") {
            router.push("/director/dashboard");
        }

        if (session?.accessToken) {
            fetchTenants();
        }
    }, [status, session]);

    const fetchTenants = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/tenants`, {
                headers: {
                    Authorization: `Bearer ${(session as any).accessToken}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch tenants");
            const data = await response.json();
            setTenants(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <AppShell>
            <OnboardTenantModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTenants}
                accessToken={(session as any)?.accessToken}
            />
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Flight Control</h1>
                    <p className="text-slate-500">Global multi-tenant platform orchestration</p>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Active Jurisdictions</p>
                        <h3 className="text-3xl font-bold text-slate-900">{tenants.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Platform Health</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <h3 className="text-xl font-bold text-slate-900 italic">Responsive</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                         <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full h-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-md active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Onboard New City
                         </button>
                    </div>
                </div>

                {/* Tenant Management Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Registered Municipalities</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                    <th className="px-6 py-3">Jurisdiction</th>
                                    <th className="px-6 py-3">Admin Contact</th>
                                    <th className="px-6 py-3">Service Tier</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenants.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {tenant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{tenant.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter truncate w-32">{tenant.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                            {tenant.contact_email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                tenant.tier === 'Enterprise' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'
                                            }`}>
                                                {tenant.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                href={`/super-admin/tenants/${tenant.id}`}
                                                className="text-blue-500 hover:text-blue-800 text-xs font-bold transition-colors"
                                            >
                                                Manage Settings
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
