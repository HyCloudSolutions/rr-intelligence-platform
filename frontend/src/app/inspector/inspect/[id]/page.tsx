'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';

interface EstablishmentInfo {
    id: string;
    name: string;
    address: string;
    facility_type: string;
}

interface DetailData {
    establishment: EstablishmentInfo;
    current_score: number | null;
    current_band: string | null;
}

export default function InspectPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();

    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [result, setResult] = useState<'PASS' | 'PASS_CONDITIONS' | 'FAIL' | ''>('');
    const [criticalViolations, setCriticalViolations] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [inspectionType, setInspectionType] = useState<string>('CANVAS');

    useEffect(() => {
        if (!session?.accessToken || !params.id) return;

        fetch(`/api/v1/establishments/${params.id}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        })
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [session?.accessToken, params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!result || submitting) return;

        setSubmitting(true);
        try {
            const payload = {
                establishment_id: params.id,
                inspection_date: new Date().toISOString().split('T')[0],
                inspection_type: inspectionType,
                result: result,
                critical_violations: criticalViolations,
                notes: notes,
            };

            const res = await fetch('/api/v1/inspections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/inspector/dashboard');
            } else {
                alert('Failed to submit inspection. Please try again.');
            }
        } catch (error) {
             console.error('Inspection submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading establishment...</div>;
    if (!data) return <div className="p-4 text-center">Establishment not found</div>;

    const { establishment: est, current_score, current_band } = data;

    return (
        <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
            {/* Header */}
            <div>
                <button onClick={() => router.back()} className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Back to Queue
                </button>
                <h1 className="text-xl font-bold text-slate-900">{est.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{est.address}</p>
            </div>

            {/* Context Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
                <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Current Risk</span>
                    <div className="text-lg font-bold text-slate-800">{current_score ? current_score.toFixed(1) : '—'}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${current_band === 'High' ? 'bg-red-50 text-red-600 border-red-100' : current_band === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {current_band} Risk
                </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inspection Type */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Inspection Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['CANVAS', 'COMPLAINT', 'RE_INSPECTION'].map(t => (
                            <button
                                type="button"
                                key={t}
                                onClick={() => setInspectionType(t)}
                                className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${inspectionType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'}`}
                            >
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Outcome/Result */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Result Outcome</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'PASS', label: 'Pass', bg: 'hover:bg-emerald-50', active: 'bg-emerald-600 text-white border-emerald-600' },
                            { value: 'PASS_CONDITIONS', label: 'Pass w/ Cond', bg: 'hover:bg-amber-50', active: 'bg-amber-500 text-white border-amber-500' },
                            { value: 'FAIL', label: 'Fail', bg: 'hover:bg-red-50', active: 'bg-red-600 text-white border-red-600' },
                        ].map(opt => (
                            <button
                                type="button"
                                key={opt.value}
                                onClick={() => setResult(opt.value as any)}
                                className={`py-3 rounded-xl border font-bold text-sm transition-all shadow-sm ${result === opt.value ? opt.active : 'bg-white text-slate-700 border-slate-200 active:bg-slate-50'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Critical Violations */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Critical Violations Count</label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setCriticalViolations(Math.max(0, criticalViolations - 1))}
                            className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-bold text-xl text-slate-600 active:bg-slate-100 transition-colors"
                        >
                            -
                        </button>
                        <div className="flex-1 text-center bg-white border border-slate-200 rounded-xl py-3 font-bold text-lg text-slate-900">
                             {criticalViolations}
                        </div>
                        <button
                            type="button"
                            onClick={() => setCriticalViolations(criticalViolations + 1)}
                            className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-bold text-xl text-slate-600 active:bg-slate-100 transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Inspection Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Add observation details, required corrections..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={!result || submitting}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mt-2 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                    {submitting ? 'Submitting...' : 'Submit Inspection'}
                </button>
            </form>
        </div>
    );
}
