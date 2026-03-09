'use client';

interface QueueFiltersProps {
    inspectors: string[];
    selectedInspector: string;
    selectedRiskBand: string;
    selectedFacilityType: string;
    onInspectorChange: (value: string) => void;
    onRiskBandChange: (value: string) => void;
    onFacilityTypeChange: (value: string) => void;
    onClear: () => void;
    filteredCount: number;
    totalCount: number;
}

export function QueueFilters({
    inspectors,
    selectedInspector,
    selectedRiskBand,
    selectedFacilityType,
    onInspectorChange,
    onRiskBandChange,
    onFacilityTypeChange,
    onClear,
    filteredCount,
    totalCount,
}: QueueFiltersProps) {
    const hasFilters = selectedInspector || selectedRiskBand || selectedFacilityType;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                {/* Inspector Filter */}
                <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                        Inspector
                    </label>
                    <select
                        id="filter-inspector"
                        value={selectedInspector}
                        onChange={(e) => onInspectorChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Inspectors</option>
                        {inspectors.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Risk Band Filter */}
                <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                        Risk Level
                    </label>
                    <select
                        id="filter-risk-band"
                        value={selectedRiskBand}
                        onChange={(e) => onRiskBandChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Risk Levels</option>
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                    </select>
                </div>

                {/* Facility Type Filter */}
                <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                        Facility Type
                    </label>
                    <select
                        id="filter-facility-type"
                        value={selectedFacilityType}
                        onChange={(e) => onFacilityTypeChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Facility Types</option>
                        <option value="Restaurant">🍽️ Restaurant</option>
                        <option value="Grocery Store">🛒 Grocery Store</option>
                        <option value="Mobile Food">🚚 Mobile Food</option>
                    </select>
                </div>

                {/* Clear + Count */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {hasFilters && (
                        <button
                            onClick={onClear}
                            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                    <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                        <span className="text-sm font-bold text-blue-700">{filteredCount}</span>
                        <span className="text-xs text-blue-400 ml-1">of {totalCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
