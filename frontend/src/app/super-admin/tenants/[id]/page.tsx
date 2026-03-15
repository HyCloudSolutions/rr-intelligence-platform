"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

interface TenantStats {
    establishment_count: number;
    inspection_count: number;
    user_count: number;
    created_at: string;
}

interface Tenant {
    id: string;
    name: string;
    contact_email: string;
    tier: string;
}

export default function TenantManagementPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        
        if (session?.user && (session.user as any).role !== "superadmin") {
            router.push("/director/dashboard");
        }

        if (session?.accessToken && id) {
            fetchData();
        }
    }, [status, session, id]);

    const fetchData = async () => {
        try {
            const apiUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '/api/backend') : (process.env.INTERNAL_API_URL || 'http://localhost:8000');
            
            // Fetch Tenant Basic Info (could get this from list but safer to fetch or filter)
            // For now, we'll fetch from a list and find it
            const tenantsRes = await fetch(`${apiUrl}/api/v1/tenants`, {
                headers: { Authorization: `Bearer ${(session as any).accessToken}` }
            });
            const list = await tenantsRes.json();
            const found = list.find((t: any) => t.id === id);
            setTenant(found);

            // Fetch Stats
            const statsRes = await fetch(`${apiUrl}/api/v1/tenants/${id}/stats`, {
                headers: { Authorization: `Bearer ${(session as any).accessToken}` }
            });
            if (!statsRes.ok) throw new Error("Failed to fetch statistics");
            const statsData = await statsRes.json();
            setStats(statsData);
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

    if (error || !tenant) return (
        <AppShell>
            <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
                <p className="text-red-500 font-bold mb-4">Error: {error || "Jurisdiction not found"}</p>
                <Link href="/super-admin" className="text-blue-600 hover:underline">Back to Fleet Overview</Link>
            </div>
        </AppShell>
    );

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Link href="/super-admin" className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                </svg>
                                Fleet Overview
                             </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
                        <p className="text-slate-500">Jurisdiction Configuration & Health</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all">
                            Suspend Access
                        </button>
                        <button className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-all shadow-md active:scale-95">
                            Edit Branding
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Establishments</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats?.establishment_count}</h3>
                        <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Live Sync Active
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Inspections</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats?.inspection_count}</h3>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">All-time record count</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Users</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats?.user_count}</h3>
                        <p className="text-[10px] text-blue-500 font-bold mt-2">Cognito Managed</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Service Tier</p>
                        <h3 className="text-xl font-bold text-indigo-600 mt-1">{tenant.tier}</h3>
                        <p className="text-[10px] text-slate-400 mt-3 font-medium">Next billing: Oct 2026</p>
                    </div>
                </div>

                {/* Detailed Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Platform Metadata</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-500 uppercase">Tenant ID</span>
                                <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{tenant.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-500 uppercase">Admin Contact</span>
                                <span className="text-sm font-semibold text-slate-800">{tenant.contact_email}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-500 uppercase">Onboarded On</span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {new Date(stats?.created_at || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Operational
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Director Quick Access</h3>
                            <p className="text-blue-100/70 text-sm mb-6 max-w-xs text-balance">
                                Impersonate or view the platform exactly as the municipal director for troubleshooting.
                            </p>
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl font-extrabold text-sm hover:bg-blue-50 transition-all shadow-lg active:scale-95 group-hover:scale-[1.02]">
                                Launch Jurisdiction View
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
