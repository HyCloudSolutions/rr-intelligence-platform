'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RiskCard } from '@/components/RiskCard';
import { QueueFilters } from '@/components/director/QueueFilters';
import { QueueAnalytics } from '@/components/director/QueueAnalytics';

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
        risk_band: 'High' | 'Medium' | 'Low';
        factor_1_name: string;
        factor_1_weight: number;
        factor_2_name: string;
        factor_2_weight: number;
        factor_3_name: string;
        factor_3_weight: number;
    };
}

const PAGE_SIZE = 25;

export function DirectorQueueClient({ queue }: { queue: QueueItem[] }) {
    const [selectedInspector, setSelectedInspector] = useState('');
    const [selectedRiskBand, setSelectedRiskBand] = useState('');
    const [selectedFacilityType, setSelectedFacilityType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAnalytics, setShowAnalytics] = useState(true);

    // Extract unique inspector names
    const inspectors = useMemo(() => {
        const names = new Set<string>();
        queue.forEach((item) => {
            if (item.assigned_inspector) names.add(item.assigned_inspector);
        });
        return Array.from(names).sort();
    }, [queue]);

    // Apply filters
    const filtered = useMemo(() => {
        return queue.filter((item) => {
            if (selectedInspector && item.assigned_inspector !== selectedInspector) return false;
            if (selectedRiskBand && item.risk_data.risk_band !== selectedRiskBand) return false;
            if (selectedFacilityType && item.facility_type !== selectedFacilityType) return false;
            return true;
        });
    }, [queue, selectedInspector, selectedRiskBand, selectedFacilityType]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

    // Reset page when filters change
    const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedInspector('');
        setSelectedRiskBand('');
        setSelectedFacilityType('');
        setCurrentPage(1);
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const highCount = filtered.filter((q) => q.risk_data.risk_band === 'High').length;
    const medCount = filtered.filter((q) => q.risk_data.risk_band === 'Medium').length;
    const lowCount = filtered.filter((q) => q.risk_data.risk_band === 'Low').length;

    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Queue Management</h1>
                            <p className="text-sm text-slate-400 mt-0.5">{today} · Director View</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Analytics Toggle */}
                            <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${showAnalytics
                                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                </svg>
                                Analytics
                            </button>

                            {/* Risk badges */}
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
                            {lowCount > 0 && (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">
                                    {lowCount} Low
                                </span>
                            )}
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">
                                {filtered.length} Total
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-8 py-6 space-y-4">
                {/* Filters */}
                <QueueFilters
                    inspectors={inspectors}
                    selectedInspector={selectedInspector}
                    selectedRiskBand={selectedRiskBand}
                    selectedFacilityType={selectedFacilityType}
                    onInspectorChange={handleFilterChange(setSelectedInspector)}
                    onRiskBandChange={handleFilterChange(setSelectedRiskBand)}
                    onFacilityTypeChange={handleFilterChange(setSelectedFacilityType)}
                    onClear={clearFilters}
                    filteredCount={filtered.length}
                    totalCount={queue.length}
                />

                {/* Analytics Panel */}
                {showAnalytics && <QueueAnalytics items={filtered} />}

                {/* Queue Cards */}
                {pageItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <h3 className="text-slate-600 font-semibold text-lg">No Results</h3>
                        <p className="text-sm text-slate-400 mt-1">No establishments match the current filters.</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {pageItems.map((item) => (
                            <Link key={item.id} href={`/establishment/${item.id}`} className="block hover:scale-[1.01] transition-transform duration-200">
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
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4 pb-8">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safeCurrentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 7) {
                                    pageNum = i + 1;
                                } else if (safeCurrentPage <= 4) {
                                    pageNum = i + 1;
                                } else if (safeCurrentPage >= totalPages - 3) {
                                    pageNum = totalPages - 6 + i;
                                } else {
                                    pageNum = safeCurrentPage - 3 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${pageNum === safeCurrentPage
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
