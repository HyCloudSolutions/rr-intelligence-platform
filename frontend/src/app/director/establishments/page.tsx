'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Establishment {
    id: string;
    name: string;
    license_id: string;
    address: string;
    facility_type: string;
    is_active: boolean;
}

const facilityTypes = ['All Types', 'Restaurant', 'Grocery', 'Mobile'];

export default function EstablishmentProfilesPage() {
    const { data: session } = useSession();
    const [establishments, setEstablishments] = useState<Establishment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [facilityFilter, setFacilityFilter] = useState('All Types');

    // Debounce the search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    // Fetch establishments when search changes
    useEffect(() => {
        if (!session?.accessToken) return;
        setLoading(true);

        const params = new URLSearchParams();
        if (debouncedSearch) params.set('query', debouncedSearch);

        fetch(`/api/v1/establishments/search?${params}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        })
            .then(r => r.json())
            .then((data: Establishment[]) => {
                // Client-side filter by facility type
                if (facilityFilter !== 'All Types') {
                    setEstablishments(data.filter(e => e.facility_type === facilityFilter));
                } else {
                    setEstablishments(data);
                }
            })
            .catch(() => setEstablishments([]))
            .finally(() => setLoading(false));
    }, [debouncedSearch, facilityFilter, session?.accessToken]);

    const facilityBadgeColors: Record<string, string> = {
        Restaurant: 'bg-blue-50 text-blue-700',
        Grocery: 'bg-emerald-50 text-emerald-700',
        Mobile: 'bg-purple-50 text-purple-700',
    };

    return (
        <div className="min-h-screen">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Establishment Profiles</h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {loading ? 'Loading...' : `${establishments.length} establishments shown`}
                        </p>
                    </div>
                </div>
            </header>

            <div className="px-8 py-6">
                {/* Search & Filter Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or license ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        {facilityTypes.map(t => (
                            <button
                                key={t}
                                onClick={() => setFacilityFilter(t)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${facilityFilter === t
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Establishment</th>
                                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">License ID</th>
                                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Type</th>
                                    <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                                <span className="text-sm text-slate-400">Loading establishments…</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : establishments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-16 text-center text-sm text-slate-400">
                                            No establishments found{search && ` for "${search}"`}.
                                        </td>
                                    </tr>
                                ) : (
                                    establishments.map((est, i) => (
                                        <tr key={est.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-slate-900">{est.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{est.address}</div>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-slate-500 font-mono">{est.license_id || '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${facilityBadgeColors[est.facility_type] || 'bg-slate-100 text-slate-600'}`}>
                                                    {est.facility_type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${est.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                                    }`}>
                                                    {est.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!loading && establishments.length === 50 && (
                        <div className="px-5 py-3 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
                            Showing top 50 results. Refine your search to find specific establishments.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
