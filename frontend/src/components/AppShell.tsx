'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

const superAdminLinks = [
    {
        href: '/super-admin',
        label: 'Control Plane',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83m0 0l2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
        ),
    }
];

const directorLinks = [
    {
        href: '/director/dashboard',
        label: 'Dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        href: '/director/queue',
        label: 'Queue Management',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        ),
    },
    {
        href: '/director/inspectors',
        label: 'Inspectors',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
    },
    {
        href: '/director/calendar',
        label: 'Calendar',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
        ),
    },
    {
        href: '/director/establishments',
        label: 'Establishments',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
        ),
    },
    {
        href: '/inspector/directory',
        label: 'Directory',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
        ),
    },
    {
        href: '/director/ingestion',
        label: 'Data Ingestion',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
        ),
    },
];

const inspectorLinks = [
    {
        href: '/inspector/dashboard',
        label: 'Dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        href: '/inspector/queue',
        label: 'My Queue',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        ),
    },
    {
        href: '/inspector/directory',
        label: 'Directory',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
        ),
    },
];

export function AppShell({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [tenantName, setTenantName] = useState<string>('');

    // Fetch tenant name
    useEffect(() => {
        if (status === 'authenticated' && session?.accessToken) {
            // Use relative path for NextJS proxy rewrite so browser handles origin automatically
            fetch(`/api/v1/tenants/me`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            })
            .then(r => r.json())
            .then(data => {
                if (data.name) setTenantName(data.name);
            })
            .catch(err => console.error("Failed to fetch tenant name", err));
        }
    }, [status, session]);

    // Don't show sidebar on login page or while loading
    if (status === 'loading' || !session || pathname === '/login') {
        return <>{children}</>;
    }

    const role = session.user?.role as string;
    let links = inspectorLinks;
    let displayName = 'Inspector';

    if (role === 'superadmin') {
        links = superAdminLinks;
        displayName = 'Platform Admin';
    } else if (role === 'director') {
        links = directorLinks;
        displayName = 'Director';
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-16 md:pb-0">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-60'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 flex-shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-sm font-bold text-slate-900 truncate">RestaurantRisk</h1>
                            <p className="text-[10px] text-slate-400 truncate">Intelligence Platform</p>
                        </div>
                    )}
                </div>

                {/* Tenant Identity Section */}
                {!collapsed && (
                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {role === 'superadmin' ? 'Global Context' : 'Active Tenant'}
                             </span>
                        </div>
                        <h2 className="text-sm font-extrabold text-blue-900 mt-1 truncate group-hover:text-blue-600 transition-colors">
                            {role === 'superadmin' ? 'System Orchestrator' : (tenantName || 'Standard Context')}
                        </h2>
                    </div>
                )}

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {links.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                title={collapsed ? link.label : undefined}
                            >
                                <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                    {link.icon}
                                </span>
                                {!collapsed && <span className="truncate">{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="border-t border-slate-100 p-3 space-y-2 mt-auto">
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center justify-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                        </svg>
                        {!collapsed && <span>Collapse</span>}
                    </button>

                    {/* User Profile & Sign Out */}
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {displayName.charAt(0)}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 truncate">{displayName}</p>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-bottom">
                <nav className="flex items-center justify-around px-2 h-16">
                    {links.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <span className={isActive ? 'text-blue-600' : ''}>
                                    {link.icon}
                                </span>
                                <span className="text-[10px] font-medium truncate w-full text-center px-1">
                                    {link.label.split(' ')[0]} {/* Shorten label for mobile */}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 w-full max-w-full overflow-x-hidden md:w-auto ${collapsed ? 'md:ml-[68px]' : 'md:ml-60'}`}>
                {/* Mobile Header (Only visible on small screens) */}
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">RestaurantRisk</h1>
                            {tenantName && (
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
                                    <h2 className="text-sm font-extrabold text-blue-900 truncate tracking-tight">{tenantName}</h2>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="text-xs font-medium text-white bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center w-8 h-8 rounded-full shadow-sm ring-2 ring-white"
                    >
                        {displayName.charAt(0)}
                    </button>
                </div>

                <div className="p-4 md:p-8 overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
