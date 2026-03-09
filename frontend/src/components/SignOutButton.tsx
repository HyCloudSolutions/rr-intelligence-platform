'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-400"
        >
            Sign Out
        </button>
    );
}
