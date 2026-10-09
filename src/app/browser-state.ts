'use client';

import { useSyncExternalStore } from 'react';

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Portals and browser-only values must keep the server's first render stable.
export function useClientReady() {
    return useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
}

export interface SessionClaims {
    role?: string;
    rol?: string;
    email?: string;
    user_id?: number;
}

function subscribeStorage(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener('session-change', onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener('session-change', onChange);
    };
}

const getToken = () => localStorage.getItem('token');
const getServerToken = () => null;

export function useSessionClaims(): SessionClaims | null {
    const token = useSyncExternalStore(subscribeStorage, getToken, getServerToken);
    if (!token) return null;
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded: unknown = JSON.parse(decodeURIComponent(
            atob(payload).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
        ));
        if (!decoded || typeof decoded !== 'object') return null;
        const claims = decoded as Record<string, unknown>;
        return {
            role: typeof claims.role === 'string' ? claims.role : undefined,
            rol: typeof claims.rol === 'string' ? claims.rol : undefined,
            email: typeof claims.email === 'string' ? claims.email : undefined,
            user_id: typeof claims.user_id === 'number' ? claims.user_id : undefined,
        };
    } catch {
        return null;
    }
}

export function notifySessionChange() {
    window.dispatchEvent(new Event('session-change'));
}
