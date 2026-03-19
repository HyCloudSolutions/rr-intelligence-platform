'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OutcomeFormProps {
    establishmentId: string;
    establishmentName: string;
    token: string;
}

export function OutcomeForm({ establishmentId, establishmentName, token }: OutcomeFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [result, setResult] = useState('');
    const [violations, setViolations] = useState(0);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Using Next.js rewrites to absolute path to bypass mixed content blocks on live triggers
            const res = await fetch(`/api/backend/api/v1/inspections/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    establishment_id: establishmentId,
                    result,
                    critical_violations: violations,
                    notes,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                router.refresh(); // Refresh to update the queue list
            } else {
                const errorText = await res.text();
                alert(`Failed to submit outcome (${res.status}): ${errorText || 'Unknown Error'}`);
            }
        } catch (err) {
            console.error('Failed to submit outcome', err);
            alert(`Unexpected Connection Error: ${err instanceof Error ? err.message : 'Unknown Error'}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Outcome Logged
                </div>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="mt-3 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Log Inspection Outcome
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Log Inspection Outcome</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{establishmentName}</p>
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Result</label>
                    <select
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        <option value="">Select result…</option>
                        <option value="Pass">Pass</option>
                        <option value="Pass w/ Conditions">Pass w/ Conditions</option>
                        <option value="Fail">Fail</option>
                        <option value="Out of Business">Out of Business</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Critical Violations</label>
                    <input
                        type="number"
                        min={0}
                        value={violations}
                        onChange={(e) => setViolations(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Inspector Notes</label>
                    <textarea
                        placeholder="Add observation details…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting || !result}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-[0.98]"
                >
                    {submitting ? 'Submitting…' : 'Submit Outcome'}
                </button>
            </form>
        </div>
    );
}
