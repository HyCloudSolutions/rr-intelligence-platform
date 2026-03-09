'use client';

interface ModelAccuracyData {
    precision: number;
    recall: number;
    f1_score: number;
    total_predictions: number;
    correct_predictions: number;
    accuracy_pct: number;
}

function MetricGauge({ value, label, color }: { value: number; label: string; color: string }) {
    const pct = value * 100;
    const circumference = 2 * Math.PI * 32;
    const progress = (pct / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" stroke="#f1f5f9" />
                    <circle
                        cx="40" cy="40" r="32"
                        fill="none" strokeWidth="6"
                        stroke={color}
                        strokeDasharray={`${progress} ${circumference - progress}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-900">{pct.toFixed(0)}%</span>
                </div>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-2">{label}</span>
        </div>
    );
}

export function ModelAccuracyPanel({ data }: { data: ModelAccuracyData }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Model Performance</h3>
            <p className="text-xs text-slate-400 mb-6">Predictive ML accuracy metrics</p>

            <div className="flex items-center justify-around mb-6">
                <MetricGauge value={data.precision} label="Precision" color="#3b82f6" />
                <MetricGauge value={data.recall} label="Recall" color="#8b5cf6" />
                <MetricGauge value={data.f1_score} label="F1 Score" color="#06b6d4" />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                    <div>
                        <span className="text-slate-400 text-xs">Total Predictions</span>
                        <p className="font-bold text-slate-900 text-lg">{data.total_predictions.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 text-xs">Correct</span>
                        <p className="font-bold text-emerald-600 text-lg">{data.correct_predictions.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 text-xs">Accuracy</span>
                        <p className="font-bold text-blue-600 text-lg">{data.accuracy_pct}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
