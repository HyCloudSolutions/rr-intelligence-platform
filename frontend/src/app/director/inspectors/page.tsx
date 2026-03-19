'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Inspector {
    id: string;
    email: string;
    status: string;
    created_at: string;
}

export default function InspectorManagementPage() {
    const { data: session } = useSession();
    const [inspectors, setInspectors] = useState<Inspector[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInspectors = async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/users/inspectors`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInspectors(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspectors();
    }, [session?.accessToken]);

    const handleCreateInspector = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/v1/users/inspectors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to create inspector');
            }

            // Success
            setEmail('');
            setPassword('');
            setIsModalOpen(false);
            fetchInspectors();
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pb-12">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Inspector Management</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage field agents and devices</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        disabled={inspectors.length >= 50}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Inspector
                    </button>
                </div>
            </header>

            <div className="px-8 py-8 max-w-5xl">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-600">Total Inspectors</h3>
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{loading ? '-' : inspectors.length}</span>
                            <span className="text-sm text-slate-500">/ 50 limit</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${inspectors.length >= 45 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${(inspectors.length / 50) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Inspector Profile</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">Loading...</td>
                                    </tr>
                                )}
                                {!loading && inspectors.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                            No inspectors found. Click &quot;Add Inspector&quot; to provision a new user.
                                        </td>
                                    </tr>
                                )}
                                {!loading && inspectors.map((inspector) => (
                                    <tr key={inspector.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-slate-200">
                                                    {inspector.email.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{inspector.email}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]" title={inspector.id}>{inspector.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                                                ${inspector.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                                            `}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${inspector.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                {inspector.status === 'CONFIRMED' ? 'Active' : inspector.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 font-medium text-xs transition-colors p-2 hover:bg-slate-100 rounded-lg">
                                                Reset Password
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 pt-6 pb-5">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Inspector</h3>
                            <p className="text-sm text-slate-500 mb-6">Provision an AWS Cognito identity for field access.</p>

                            <form onSubmit={handleCreateInspector} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium text-sm"
                                        placeholder="inspector@agency.gov"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Initial Password</label>
                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium text-sm"
                                        placeholder="Password (Min 8 chars)"
                                        minLength={8}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={submitting}
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {submitting ? 'Creating...' : 'Provision User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
