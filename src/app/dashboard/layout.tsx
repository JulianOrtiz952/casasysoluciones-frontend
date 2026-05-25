'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Decodificador manual de JWT idéntico al que usamos
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [rolActual, setRolActual] = useState('SUPER'); // Prevenimos salto visual brusco
    const pathname = usePathname();

    const checkActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        if (path === '/dashboard/inmuebles') return pathname === '/dashboard/inmuebles' || pathname?.startsWith('/dashboard/inmuebles/editar') || pathname?.startsWith('/dashboard/inmuebles/ver');
        return pathname?.startsWith(path);
    };

    const classLink = (path: string) => {
        const base = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200";
        return checkActive(path)
            ? `${base} bg-slate-900 text-white dark:bg-rose-600 dark:text-white shadow-md shadow-slate-900/10 dark:shadow-rose-600/20`
            : `${base} text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60`;
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            if (decoded && decoded.rol) {
                setRolActual(decoded.rol);
            }
        }
    }, []);

    return (
        <div className="flex font-sans h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 hidden md:flex flex-col shrink-0 transition-colors shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-200/80 dark:border-slate-800">
                    <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded shrink-0 mr-3 border border-slate-100/50" />
                    <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">Casas<span className="text-rose-600">y</span>Soluciones</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <Link href="/dashboard" className={classLink('/dashboard')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Resumen</span>
                    </Link>
                    <Link href="/dashboard/inmuebles" className={classLink('/dashboard/inmuebles')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Inmuebles</span>
                    </Link>
                    <Link href="/dashboard/inquilinos" className={classLink('/dashboard/inquilinos')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Inquilinos</span>
                    </Link>

                    {rolActual === 'ADMIN' && (
                        <Link href="/dashboard/usuarios" className={classLink('/dashboard/usuarios')}>
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Usuarios (admin)</span>
                        </Link>
                    )}

                    <Link href="/dashboard/calculadora" className={classLink('/dashboard/calculadora')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Calculadora</span>
                    </Link>
                    
                    <Link href="/dashboard/inventarios" className={classLink('/dashboard/inventarios')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>Inventarios</span>
                    </Link>

                    <Link href="/dashboard/tickets" className={classLink('/dashboard/tickets')}>
                        <div className="relative flex items-center w-full justify-between">
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                <span>Tickets</span>
                            </div>
                            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
                        </div>
                    </Link>

                    <Link href="/dashboard/reportes" className={classLink('/dashboard/reportes')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Reportes</span>
                    </Link>
                </nav>

                <div className="px-4 py-4 space-y-1 border-t border-slate-200/80 dark:border-slate-800">
                    <Link href="/dashboard/configuracion" className={classLink('/dashboard/configuracion')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Configuraci&oacute;n</span>
                    </Link>
                    <button onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                    }} className="flex items-center w-full space-x-3 px-3.5 py-2.5 text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>Cerrar Sesi&oacute;n</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                <header className="h-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between px-6 z-10 transition-colors shadow-sm">
                    <div className="flex items-center">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight md:hidden">Casas<span className="text-rose-600">y</span>Soluciones</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white dark:text-rose-400 font-bold shadow-sm ring-2 ring-slate-100 dark:ring-slate-700">
                            A
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 md:p-8 relative bg-slate-50 dark:bg-slate-950">
                    {children}
                </main>
            </div>
        </div>
    );
}
