'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await signIn('credentials', {
            username,
            password,
            callbackUrl: '/',
            redirect: true,
        });

        if (res?.error) {
            setError('Invalid credentials');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
            <style jsx>{`
                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes shine {
                    from { transform: translateX(-100%) rotate(45deg); }
                    to { transform: translateX(200%) rotate(45deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float { animation: float 15s infinite ease-in-out; }
                .animate-float-delayed { animation: float 18s infinite ease-in-out reverse; }
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
            `}</style>

            {/* Ambient glow effects */}
            <div className="absolute top-[-40%] right-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl animate-float" />
            <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-3xl animate-float-delayed" />

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo / Brand */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4 overflow-hidden group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 animate-[shine_3s_infinite]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">RestaurantRisk</h1>
                    <p className="text-sm text-blue-200/60 mt-1">Intelligence Platform</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in delay-100">
                    <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300 animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="animate-fade-in delay-200">
                                <label htmlFor="username" className="block text-sm font-medium text-blue-100/70 mb-1.5">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="inspector or director"
                                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                />
                            </div>

                            <div className="animate-fade-in delay-300">
                                <label htmlFor="password" className="block text-sm font-medium text-blue-100/70 mb-1.5">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Any password"
                                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] animate-fade-in delay-300"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Signing in…</span>
                                    </div>
                                ) : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-white/[0.06] animate-fade-in delay-300">
                        <p className="text-xs text-white/30 text-center">
                            Municipal Health Department Access Only
                        </p>
                    </div>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-white/20 mt-6 animate-fade-in delay-300">
                    Powered by Predictive ML · Captum Explainability
                </p>
            </div>
        </div>
    );
}
