'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const tabs = [
        { label: 'Queue', icon: '📋', path: '/inspector/dashboard' },
        { label: 'Profile', icon: '👤', path: '/inspector/profile' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top bar */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between safe-area-top">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">RestaurantRisk</h1>
                        <p className="text-[10px] text-slate-400">Field Inspector</p>
                    </div>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                    Sign Out
                </button>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom tab bar — mobile-first */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
                <div className="flex">
                    {tabs.map(tab => {
                        const isActive = pathname === tab.path || pathname?.startsWith(tab.path + '/');
                        return (
                            <button
                                key={tab.path}
                                onClick={() => router.push(tab.path)}
                                className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors min-h-[56px] ${isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'}`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                <span className="text-[10px] font-semibold">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
