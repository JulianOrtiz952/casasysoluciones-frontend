'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// ─── JWT helper ──────────────────────────────────────────────────────────────
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

// ─── Nav item type ───────────────────────────────────────────────────────────
interface NavItem {
    href: string;
    label: string;
    iconColor: string;
    icon: React.ReactNode;
}

// ─── Icon components (memoized paths) ────────────────────────────────────────
const icons = {
    home: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    building: (<>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 21V12h6v9" />
    </>),
    user: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    users: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
    calculator: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
    clipboard: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
    ticket: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    ),
    chart: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    cog: (<>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </>),
    logout: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    ),
    upload: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    ),
};

// ─── SVG icon wrapper ─────────────────────────────────────────────────────────
function Icon({ children }: { children: React.ReactNode }) {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {children}
        </svg>
    );
}

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({
    href, label, icon, active, onClick,
}: Omit<NavItem, 'iconColor'> & { active: boolean; onClick?: () => void }) {
    const linkCls = active
        ? 'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 bg-slate-900 text-white dark:bg-rose-600 shadow-md shadow-slate-900/10 dark:shadow-rose-600/20'
        : 'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60';
    return (
        <Link href={href} className={linkCls} onClick={onClick}>
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            <span className="text-sm">{label}</span>
        </Link>
    );
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [rolActual, setRolActual] = useState('SUPER');
    const [userName, setUserName] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Close mobile sidebar on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const checkActive = useCallback((path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        if (path === '/dashboard/inmuebles')
            return pathname === '/dashboard/inmuebles'
                || pathname?.startsWith('/dashboard/inmuebles/editar')
                || pathname?.startsWith('/dashboard/inmuebles/ver');
        return pathname?.startsWith(path);
    }, [pathname]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const decoded = parseJwt(token);
        if (decoded) {
            const role = decoded.role || decoded.rol;
            if (role) {
                setRolActual(role);
                if (role === 'TENANT' && pathname === '/dashboard') router.push('/dashboard/inmuebles');
                if (role === 'TECHNICIAN' && pathname === '/dashboard') router.push('/dashboard/tickets');
            }
        }
        const fetchMe = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/v1/auth/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setRolActual(data.role);
                    setUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email);
                }
            } catch (e) { console.error('Error fetching profile:', e); }
        };
        fetchMe();
    }, [pathname, router]);

    // Active section label for mobile header
    const activeSectionLabel = (() => {
        if (pathname === '/dashboard') return 'Resumen';
        if (pathname?.startsWith('/dashboard/inmuebles')) return rolActual === 'TENANT' ? 'Mi Propiedad' : 'Inmuebles';
        if (pathname?.startsWith('/dashboard/inquilinos')) return 'Inquilinos';
        if (pathname?.startsWith('/dashboard/usuarios')) return 'Usuarios';
        if (pathname?.startsWith('/dashboard/carga-masiva')) return 'Carga Masiva';
        if (pathname?.startsWith('/dashboard/calculadora')) return 'Calculadora';
        if (pathname?.startsWith('/dashboard/inventarios')) return rolActual === 'TENANT' ? 'Inventario' : 'Inventarios';
        if (pathname?.startsWith('/dashboard/tickets')) return rolActual === 'TECHNICIAN' ? 'Mis Tickets' : 'Tickets';
        if (pathname?.startsWith('/dashboard/reportes')) return 'Reportes';
        if (pathname?.startsWith('/dashboard/configuracion')) return 'Configuración';
        if (pathname?.startsWith('/dashboard/perfil')) return 'Mi Perfil';
        return 'Dashboard';
    })();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    };

    // ── Nav items builder ──────────────────────────────────────────────────
    const renderNav = (onClickItem?: () => void) => (
        <nav className="flex-1 px-4 py-5 space-y-0.5 overflow-y-auto">
            {rolActual !== 'TENANT' && rolActual !== 'TECHNICIAN' && (
                <NavLink href="/dashboard" label="Resumen" active={checkActive('/dashboard')} onClick={onClickItem}
                    icon={<Icon>{icons.home}</Icon>} />
            )}
            {rolActual !== 'TECHNICIAN' && (
                <NavLink href="/dashboard/inmuebles" label={rolActual === 'TENANT' ? 'Mi Propiedad' : 'Inmuebles'}
                    active={checkActive('/dashboard/inmuebles')} onClick={onClickItem}
                    icon={<Icon>{icons.building}</Icon>} />
            )}
            {rolActual !== 'TENANT' && rolActual !== 'TECHNICIAN' && (
                <NavLink href="/dashboard/inquilinos" label="Inquilinos"
                    active={checkActive('/dashboard/inquilinos')} onClick={onClickItem}
                    icon={<Icon>{icons.user}</Icon>} />
            )}
            {rolActual === 'ADMIN' && (
                <NavLink href="/dashboard/usuarios" label="Usuarios"
                    active={checkActive('/dashboard/usuarios')} onClick={onClickItem}
                    icon={<Icon>{icons.users}</Icon>} />
            )}
            {rolActual === 'ADMIN' && (
                <NavLink href="/dashboard/carga-masiva" label="Carga Masiva"
                    active={checkActive('/dashboard/carga-masiva')} onClick={onClickItem}
                    icon={<Icon>{icons.upload}</Icon>} />
            )}
            {rolActual !== 'TENANT' && rolActual !== 'TECHNICIAN' && (
                <NavLink href="/dashboard/calculadora" label="Calculadora"
                    active={checkActive('/dashboard/calculadora')} onClick={onClickItem}
                    icon={<Icon>{icons.calculator}</Icon>} />
            )}
            {rolActual !== 'TECHNICIAN' && (
                <NavLink href="/dashboard/inventarios" label={rolActual === 'TENANT' ? 'Inventario' : 'Inventarios'}
                    active={checkActive('/dashboard/inventarios')} onClick={onClickItem}
                    icon={<Icon>{icons.clipboard}</Icon>} />
            )}
            <NavLink href="/dashboard/tickets" label={rolActual === 'TECHNICIAN' ? 'Mis Tickets' : 'Tickets'}
                active={checkActive('/dashboard/tickets')} onClick={onClickItem}
                icon={<Icon>{icons.ticket}</Icon>} />
            {rolActual !== 'TENANT' && rolActual !== 'TECHNICIAN' && (
                <NavLink href="/dashboard/reportes" label="Reportes"
                    active={checkActive('/dashboard/reportes')} onClick={onClickItem}
                    icon={<Icon>{icons.chart}</Icon>} />
            )}
        </nav>
    );

    const renderBottomNav = (onClickItem?: () => void) => (
        <div className="px-4 py-4 space-y-0.5 border-t border-slate-200/80 dark:border-slate-800">
            <NavLink href="/dashboard/configuracion" label="Configuración"
                active={checkActive('/dashboard/configuracion')} onClick={onClickItem}
                icon={<Icon>{icons.cog}</Icon>} />
            <button
                onClick={handleLogout}
                className="flex items-center w-full space-x-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-200"
            >
                <span className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <Icon>{icons.logout}</Icon>
                </span>
                <span className="text-sm">Cerrar Sesión</span>
            </button>
        </div>
    );

    const SidebarLogo = () => (
        <div className="h-16 flex items-center px-6 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded shrink-0 mr-3 border border-slate-100/50" />
            <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">
                Casas<span className="text-rose-600">y</span>Soluciones
            </span>
        </div>
    );

    return (
        <div className="flex font-sans h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">

            {/* ── Mobile overlay ─────────────────────────────────────────── */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* ── Mobile drawer sidebar ──────────────────────────────────── */}
            <aside
                className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                aria-label="Menú de navegación"
            >
                <div className="flex items-center justify-between pr-4">
                    <SidebarLogo />
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {renderNav(() => setMobileOpen(false))}
                {renderBottomNav(() => setMobileOpen(false))}
            </aside>

            {/* ── Desktop sidebar ────────────────────────────────────────── */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 hidden md:flex flex-col shrink-0 transition-colors shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
                <SidebarLogo />
                {renderNav()}
                {renderBottomNav()}
            </aside>

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">

                {/* Header */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between px-4 md:px-6 z-10 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Hamburger — mobile only */}
                        <button
                            id="mobile-menu-btn"
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Abrir menú"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {/* Active section name — mobile */}
                        <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight md:hidden">
                            {activeSectionLabel}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {userName && (
                            <span className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                                {userName}
                            </span>
                        )}
                        <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0">
                            {userName ? userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </header>

                {/* Page content with transition */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 relative bg-slate-50 dark:bg-slate-950">
                    <div
                        key={pathname}
                        className="animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both"
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
