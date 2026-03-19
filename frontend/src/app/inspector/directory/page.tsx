'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface EstablishmentInfo {
    id: string;
    name: string;
    license_id: string;
    address: string;
    facility_type: string;
    is_active: true;
}

interface HistoryRecord {
    id: string;
    establishment: { id: string; name: string };
    date: string;
    result: string;
    critical_violations: number;
}

export default function DirectoryPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<EstablishmentInfo[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // History State
    const [historyResults, setHistoryResults] = useState<HistoryRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Fetch History Data
    useEffect(() => {
        if (activeTab === 'history' && historyResults.length === 0) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const res = await fetch('/api/v1/inspections/history', {
                        credentials: 'include'
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const inspections = data?.inspections;
                        setHistoryResults(Array.isArray(inspections) ? inspections : []);
                    }
                } catch (error) {
                    console.error("Failed to fetch history:", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            if (session) fetchHistory();
        }
    }, [activeTab, session, historyResults.length]);

    // Handle Search Submit
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`/api/v1/establishments/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setSearchResults(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to search:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Establishments Directory</h1>
                    <p className="mt-1 text-sm text-slate-500">Search for locations or review your past inspections.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'search'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Global Search
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        My Recent Inspections
                    </button>
                </nav>
            </div>

            {/* Tab: Search */}
            {activeTab === 'search' && (
                <div className="space-y-6">
                    <form onSubmit={handleSearch} className="max-w-2xl">
                        <label htmlFor="search" className="sr-only">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-lg border-0 py-3 pl-10 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="Search by Establishment Name or License ID..."
                            />
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="absolute inset-y-1.5 right-1.5 px-4 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                            >
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </form>

                    {searchResults.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <ul role="list" className="divide-y divide-slate-100">
                                {searchResults.map((est) => (
                                    <li key={est.id} className="hover:bg-slate-50 transition-colors">
                                        <Link href={`/establishment/${est.id}`} className="block px-6 py-5">
                                            <div className="flex items-center justify-between gap-x-6">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-x-3">
                                                        <p className="text-sm font-semibold leading-6 text-slate-900">{est.name}</p>
                                                        {!est.is_active && (
                                                            <span className="rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset text-red-700 bg-red-50 ring-red-600/10">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500">
                                                        <p className="whitespace-nowrap">ID: {est.license_id}</p>
                                                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                                                        <p className="truncate">{est.address}</p>
                                                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                                                        <p className="whitespace-nowrap">{est.facility_type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-none items-center gap-x-4">
                                                    <span className="hidden sm:block text-xs text-blue-600 font-medium">View Profile &rarr;</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        searchQuery && !isSearching && (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-semibold text-slate-900">No establishments found</h3>
                                <p className="mt-1 text-sm text-slate-500">Try adjusting your search terms.</p>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
                <div>
                    {isLoadingHistory ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
                            ))}
                        </div>
                    ) : historyResults.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <ul role="list" className="divide-y divide-slate-100">
                                {historyResults.map((record) => (
                                    <li key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <Link href={`/establishment/${record.establishment.id}`} className="block px-6 py-5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-x-3">
                                                        <p className="text-sm font-semibold leading-6 text-slate-900">
                                                            {record.establishment.name}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500">
                                                        <p className="whitespace-nowrap">Logged on: {record.date}</p>
                                                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                                                        <p className="whitespace-nowrap">Violations: {record.critical_violations}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-none items-center gap-x-4">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.result === 'Pass' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                        record.result === 'Fail' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                            'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                        }`}>
                                                        {record.result}
                                                    </span>
                                                    <span className="hidden sm:block text-xs text-blue-600 font-medium">View Profile &rarr;</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-semibold text-slate-900">No inspection history</h3>
                            <p className="mt-1 text-sm text-slate-500">You haven't logged any inspection outcomes recently.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
